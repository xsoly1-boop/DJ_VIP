import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as realSignIn, 
  signOut as realSignOut, 
  onAuthStateChanged as realAuthChanged,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  getDatabase, 
  ref as realDbRef, 
  onValue as realOnValue, 
  push as realPush, 
  set as realSet, 
  update as realUpdate, 
  remove as realRemove,
  off as realOff
} from 'firebase/database';
import {
  getStorage,
  ref as realStorageRef,
  uploadBytes as realUploadBytes,
  getDownloadURL as realGetDownloadURL
} from 'firebase/storage';

// -------------------------------------------------------------
// 1. VERIFICACIÓN DE CONFIGURACIÓN Y MODO DUAL
// -------------------------------------------------------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Si falta la API Key, entra en modo MOCK local
const isMockMode = !firebaseConfig.apiKey;

if (isMockMode) {
  console.warn("⚠️ Firebase credentials missing. Running in local MOCK mode (Multi-user, per-account isolation).");
}

let app, auth, database, storage;

if (!isMockMode) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  storage = getStorage(app);
} else {
  app = {};
  auth = { currentUser: null };
  database = {};
  storage = {};
}

export { auth, database, storage, isMockMode };

// -------------------------------------------------------------
// 2. MOCK FIREBASE — IMPLEMENTACIÓN CON LOCALSTORAGE Y BROADCASTCHANNEL
//    Arquitectura: users/{uid}/events/{eventId}/...
// -------------------------------------------------------------

// Canal para sincronizar pestañas locales en tiempo real
const syncChannel = isMockMode ? new BroadcastChannel('firebase-rtdb-sync') : null;

// Cuentas de prueba disponibles en modo mock
// { email, password, uid, displayName, isAdmin }
export const MOCK_ACCOUNTS = [
  { email: 'dj@admin.com', password: 'admin123', uid: 'uid-admin-master', displayName: 'DJ Administrador Master', isAdmin: true },
  { email: 'dj1@dj.com',   password: 'dj123',    uid: 'uid-dj1',          displayName: 'DJ MasterMix', isAdmin: false },
  { email: 'dj2@dj.com',   password: 'dj456',    uid: 'uid-dj2',          displayName: 'DJ Neon Vibes', isAdmin: false },
];

// Email del administrador master (sin importar si es real o mock)
export const MASTER_ADMIN_EMAIL = 'dj@admin.com';

// Semilla inicial de canciones para autocompletado
const INITIAL_AUTOCOMPLETE = [
  { id: '1', title: 'Ella Baila Sola', artist: 'Eslabon Armado x Peso Pluma', genre: 'Regional Mexicano' },
  { id: '2', title: 'La Bebé (Remix)', artist: 'Yng Lvcas x Peso Pluma', genre: 'Reggaetón' },
  { id: '3', title: 'Gatita', artist: 'Bellakath', genre: 'Reggaetón' },
  { id: '4', title: 'Como La Flor', artist: 'Selena', genre: 'Cumbia' },
  { id: '5', title: 'Lamento Boliviano', artist: 'Enanitos Verdes', genre: 'Rock en Español' },
  { id: '6', title: 'Tusa', artist: 'Karol G x Nicki Minaj', genre: 'Reggaetón' },
  { id: '7', title: 'Rayando el Sol', artist: 'Maná', genre: 'Rock en Español' },
  { id: '8', title: 'Adiós Amor', artist: 'Christian Nodal', genre: 'Regional Mexicano' },
  { id: '9', title: 'Música Ligera', artist: 'Soda Stereo', genre: 'Rock en Español' },
  { id: '10', title: 'Quevedo: Bzrp Music Sessions, Vol. 52', artist: 'Bizarrap x Quevedo', genre: 'Urban/Electro' }
];

// Construir datos iniciales para un usuario DJ dado
const buildInitialUserData = (uid) => {
  const now = Date.now();
  return {
    events_index: {
      'default-event': {
        id: 'default-event',
        title: 'Mi Gran Evento VIP',
        djName: 'DJ MasterMix',
        date: '2026-06-20',
        archived: false,
        createdAt: now
      }
    },
    events: {
      'default-event': {
        settings: {
          title: 'Mi Gran Evento VIP',
          logoUrl: '',
          themeColor: '#7c3aed',
          themeColorSecondary: '#06b6d4',
          djName: 'DJ MasterMix'
        },
        requests: {}
      }
    },
    autocomplete_songs: INITIAL_AUTOCOMPLETE.reduce((acc, s) => { acc[s.id] = s; return acc; }, {})
  };
};

// Helper para leer la base de datos mock global
const getLocalData = () => {
  const raw = localStorage.getItem('mock_rtdb_v2');
  if (!raw) {
    // Primera ejecución: inicializar con datos de demo para los DJs de prueba
    const db = { users: {} };
    MOCK_ACCOUNTS.filter(a => !a.isAdmin).forEach(a => {
      db.users[a.uid] = buildInitialUserData(a.uid);
    });
    // Admin master no tiene eventos propios, solo acceso global
    db.users['uid-admin-master'] = { events_index: {}, events: {}, autocomplete_songs: {} };
    localStorage.setItem('mock_rtdb_v2', JSON.stringify(db));
    return db;
  }
  return JSON.parse(raw);
};

const setLocalData = (data) => {
  localStorage.setItem('mock_rtdb_v2', JSON.stringify(data));
  if (syncChannel) {
    syncChannel.postMessage({ type: 'DB_UPDATE' });
  }
};

// Restaurar sesión de Auth simulada
if (isMockMode) {
  const savedUser = localStorage.getItem('mock_auth_user');
  if (savedUser) {
    auth.currentUser = JSON.parse(savedUser);
  }
}

// -------------------------------------------------------------
// 3. EXPORTACIÓN DE MÉTODOS COMPATIBLES (REAL / MOCK)
// -------------------------------------------------------------

// --- AUTHENTICATION ---

export const signInWithEmailAndPassword = async (authInstance, email, password) => {
  if (!isMockMode) {
    return realSignIn(authInstance, email, password);
  }

  const account = MOCK_ACCOUNTS.find(a => a.email === email && a.password === password);
  if (!account) {
    throw new Error('auth/invalid-credential: Credenciales incorrectas.');
  }

  const mockUser = {
    uid: account.uid,
    email: account.email,
    displayName: account.displayName,
    isAdmin: account.isAdmin || false
  };
  auth.currentUser = mockUser;
  // Guardar también la contraseña cifrada para re-auth
  localStorage.setItem('mock_auth_user', JSON.stringify(mockUser));
  localStorage.setItem('mock_auth_password', password);
  window.dispatchEvent(new CustomEvent('mock-auth-change', { detail: mockUser }));
  return { user: mockUser };
};

export const signOut = async (authInstance) => {
  if (!isMockMode) {
    return realSignOut(authInstance);
  }
  auth.currentUser = null;
  localStorage.removeItem('mock_auth_user');
  localStorage.removeItem('mock_auth_password');
  window.dispatchEvent(new CustomEvent('mock-auth-change', { detail: null }));
};

export const onAuthStateChanged = (authInstance, callback) => {
  if (!isMockMode) {
    return realAuthChanged(authInstance, callback);
  }

  callback(auth.currentUser);

  const handleAuthChange = (e) => { callback(e.detail); };
  window.addEventListener('mock-auth-change', handleAuthChange);
  return () => { window.removeEventListener('mock-auth-change', handleAuthChange); };
};

// Re-autenticación: verifica la contraseña del usuario actual
// En Firebase real usa EmailAuthProvider; en mock compara con la guardada en localStorage
export const reauthenticateUser = async (password) => {
  if (!isMockMode) {
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    return reauthenticateWithCredential(auth.currentUser, credential);
  }

  // Mock: comparar con la contraseña con la que se inició sesión
  const savedPassword = localStorage.getItem('mock_auth_password');
  if (!savedPassword || password !== savedPassword) {
    throw new Error('auth/wrong-password: Contraseña incorrecta.');
  }
  return true;
};

// --- REALTIME DATABASE ---
const activeListeners = new Map();

if (isMockMode && syncChannel) {
  syncChannel.onmessage = (e) => {
    if (e.data.type === 'DB_UPDATE') {
      activeListeners.forEach(({ callback, path }) => {
        const dbData = getLocalData();
        const value = getValueFromPath(dbData, path);
        callback(new MockSnapshot(path, value));
      });
    }
  };
}

class MockSnapshot {
  constructor(path, data) {
    this._data = data;
    this.key = path.split('/').pop();
  }
  val() { return this._data; }
  exists() { return this._data !== null && this._data !== undefined; }
  forEach(callback) {
    if (this._data && typeof this._data === 'object') {
      Object.keys(this._data).forEach((key, index) => {
        callback(new MockSnapshot(key, this._data[key]), index);
      });
    }
  }
}

const getValueFromPath = (obj, path) => {
  if (!path || path === '/') return obj;
  const parts = path.split('/').filter(Boolean);
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
};

const setValueAtPath = (obj, path, value) => {
  const parts = path.split('/').filter(Boolean);
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  const lastPart = parts[parts.length - 1];
  if (value === null) {
    delete current[lastPart];
  } else {
    current[lastPart] = value;
  }
};

export const ref = (dbInstance, path = '') => {
  if (!isMockMode) {
    return realDbRef(dbInstance, path);
  }
  return { path, isMockRef: true };
};

export const onValue = (dbRef, callback) => {
  if (!dbRef.isMockRef) {
    return realOnValue(dbRef, callback);
  }

  const path = dbRef.path;
  const listenerId = Math.random().toString(36).substr(2, 9);
  activeListeners.set(listenerId, { callback, path });

  const dbData = getLocalData();
  const val = getValueFromPath(dbData, path);
  callback(new MockSnapshot(path, val));

  return () => { activeListeners.delete(listenerId); };
};

export const off = (dbRef) => {
  if (!dbRef.isMockRef) {
    return realOff(dbRef);
  }
  activeListeners.forEach((val, key) => {
    if (val.path === dbRef.path) activeListeners.delete(key);
  });
};

export const push = (dbRef, value) => {
  if (!dbRef.isMockRef) {
    return realPush(dbRef, value);
  }

  const path = dbRef.path;
  const newKey = 'req_' + Date.now() + Math.random().toString(36).substr(2, 5);
  const dbData = getLocalData();

  let targetNode = getValueFromPath(dbData, path) || {};
  targetNode[newKey] = value;
  setValueAtPath(dbData, path, targetNode);
  setLocalData(dbData);

  activeListeners.forEach((listener) => {
    if (listener.path === path || path.startsWith(listener.path)) {
      const currentVal = getValueFromPath(getLocalData(), listener.path);
      listener.callback(new MockSnapshot(listener.path, currentVal));
    }
  });

  return { key: newKey, ref: { path: `${path}/${newKey}`, isMockRef: true } };
};

export const set = async (dbRef, value) => {
  if (!dbRef.isMockRef) {
    return realSet(dbRef, value);
  }

  const path = dbRef.path;
  const dbData = getLocalData();
  setValueAtPath(dbData, path, value);
  setLocalData(dbData);

  activeListeners.forEach((listener) => {
    if (path.startsWith(listener.path) || listener.path.startsWith(path)) {
      const currentVal = getValueFromPath(getLocalData(), listener.path);
      listener.callback(new MockSnapshot(listener.path, currentVal));
    }
  });
};

export const update = async (dbRef, values) => {
  if (!dbRef.isMockRef) {
    return realUpdate(dbRef, values);
  }

  const path = dbRef.path;
  const dbData = getLocalData();
  let currentVal = getValueFromPath(dbData, path) || {};
  const updated = { ...currentVal, ...values };
  setValueAtPath(dbData, path, updated);
  setLocalData(dbData);

  activeListeners.forEach((listener) => {
    if (path.startsWith(listener.path) || listener.path.startsWith(path)) {
      const currentVal = getValueFromPath(getLocalData(), listener.path);
      listener.callback(new MockSnapshot(listener.path, currentVal));
    }
  });
};

export const remove = async (dbRef) => {
  if (!dbRef.isMockRef) {
    return realRemove(dbRef);
  }
  return set(dbRef, null);
};

// --- STORAGE ---
export const uploadBytes = async (storageRefInstance, file) => {
  if (!isMockMode) {
    return realUploadBytes(storageRefInstance, file);
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      localStorage.setItem('mock_uploaded_logo', reader.result);
      resolve({ ref: storageRefInstance, metadata: { contentType: file.type } });
    };
    reader.readAsDataURL(file);
  });
};

export const getDownloadURL = async (storageRefInstance) => {
  if (!isMockMode) {
    return realGetDownloadURL(storageRefInstance);
  }
  return localStorage.getItem('mock_uploaded_logo') || '';
};

export const storageRef = (storageInstance, path) => {
  if (!isMockMode) {
    return realStorageRef(storageInstance, path);
  }
  return { path, isMockStorageRef: true };
};
