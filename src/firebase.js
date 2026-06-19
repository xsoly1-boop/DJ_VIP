import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as realSignIn, 
  signOut as realSignOut, 
  onAuthStateChanged as realAuthChanged 
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
  console.warn("⚠️ Firebase credentials missing. Running in local MOCK mode (Multi-tab synchronization enabled).");
}

let app, auth, database, storage;

if (!isMockMode) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  storage = getStorage(app);
} else {
  // Inicialización vacía para que no tire error el bundler
  app = {};
  auth = { currentUser: null };
  database = {};
  storage = {};
}

export { auth, database, storage, isMockMode };

// -------------------------------------------------------------
// 2. MOCK FIREBASE - IMPLEMENTACIÓN CON LOCALSTORAGE Y BROADCASTCHANNEL
// -------------------------------------------------------------

// Canal para sincronizar pestañas locales en tiempo real
const syncChannel = isMockMode ? new BroadcastChannel('firebase-rtdb-sync') : null;

// Semilla inicial para canciones autocompletadas en México
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

// Helper para leer/escribir del storage local simulado
const getLocalData = () => {
  const data = localStorage.getItem('mock_rtdb');
  if (!data) {
    const now = Date.now();
    const initialDb = {
      autocomplete_songs: INITIAL_AUTOCOMPLETE.reduce((acc, song) => {
        acc[song.id] = song;
        return acc;
      }, {}),
      events_index: {
        'default-event': {
          id: 'default-event',
          title: 'Mi Gran Evento VIP',
          djName: 'DJ MasterMix',
          date: '2026-06-20',
          archived: false,
          createdAt: now
        },
        'boda-2026': {
          id: 'boda-2026',
          title: 'Mi Boda Soñada 2026 (Demo)',
          djName: 'DJ MasterMix',
          date: '2026-06-27',
          archived: false,
          createdAt: now + 1000
        },
        'graduacion-vip': {
          id: 'graduacion-vip',
          title: 'Graduación Universitaria VIP (Demo)',
          djName: 'DJ MasterMix',
          date: '2026-07-04',
          archived: false,
          createdAt: now + 2000
        }
      },
      events: {
        'default-event': {
          settings: {
            title: 'Mi Gran Evento VIP',
            logoUrl: '',
            themeColor: '#7c3aed', // default violet
            themeColorSecondary: '#06b6d4', // default cyan
            djName: 'DJ MasterMix'
          },
          requests: {}
        },
        'boda-2026': {
          settings: {
            title: 'Mi Boda Soñada 2026 (Demo)',
            logoUrl: '',
            themeColor: '#ec4899', // pink
            themeColorSecondary: '#f43f5e',
            djName: 'DJ MasterMix'
          },
          requests: {}
        },
        'graduacion-vip': {
          settings: {
            title: 'Graduación Universitaria VIP (Demo)',
            logoUrl: '',
            themeColor: '#3b82f6', // blue
            themeColorSecondary: '#10b981',
            djName: 'DJ MasterMix'
          },
          requests: {}
        }
      }
    };
    localStorage.setItem('mock_rtdb', JSON.stringify(initialDb));
    return initialDb;
  }
  return JSON.parse(data);
};

const setLocalData = (data) => {
  localStorage.setItem('mock_rtdb', JSON.stringify(data));
  if (syncChannel) {
    syncChannel.postMessage({ type: 'DB_UPDATE' });
  }
};

// Sincronizar sesiones de Auth simuladas
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
  
  // Login simulado
  if (email === 'dj@admin.com' && password === 'admin123') {
    const mockUser = { uid: 'dj-admin-uid', email: 'dj@admin.com', displayName: 'DJ Administrador' };
    auth.currentUser = mockUser;
    localStorage.setItem('mock_auth_user', JSON.stringify(mockUser));
    // Disparar evento de cambio de auth
    window.dispatchEvent(new CustomEvent('mock-auth-change', { detail: mockUser }));
    return { user: mockUser };
  } else {
    throw new Error('Auth/invalid-credential: Las credenciales de prueba son dj@admin.com y admin123');
  }
};

export const signOut = async (authInstance) => {
  if (!isMockMode) {
    return realSignOut(authInstance);
  }
  auth.currentUser = null;
  localStorage.removeItem('mock_auth_user');
  window.dispatchEvent(new CustomEvent('mock-auth-change', { detail: null }));
};

export const onAuthStateChanged = (authInstance, callback) => {
  if (!isMockMode) {
    return realAuthChanged(authInstance, callback);
  }

  // Ejecutar callback inicial con usuario actual
  callback(auth.currentUser);

  // Escuchar cambios simulados
  const handleAuthChange = (e) => {
    callback(e.detail);
  };
  window.addEventListener('mock-auth-change', handleAuthChange);

  // Devolver des-registrador (unsubscribe)
  return () => {
    window.removeEventListener('mock-auth-change', handleAuthChange);
  };
};

// --- REALTIME DATABASE ---
const activeListeners = new Map();

if (isMockMode && syncChannel) {
  syncChannel.onmessage = (e) => {
    if (e.data.type === 'DB_UPDATE') {
      // Notificar a todos los listeners locales activos
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
  val() {
    return this._data;
  }
  exists() {
    return this._data !== null && this._data !== undefined;
  }
  forEach(callback) {
    if (this._data && typeof this._data === 'object') {
      Object.keys(this._data).forEach((key, index) => {
        callback(new MockSnapshot(key, this._data[key]), index);
      });
    }
  }
}

// Resuelve caminos como "events/default-event/settings" en el JSON
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

// Escribe un valor en un camino específico
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
  
  // Guardar listener activo
  activeListeners.set(listenerId, { callback, path });

  // Ejecutar primera lectura síncrona
  const dbData = getLocalData();
  const val = getValueFromPath(dbData, path);
  callback(new MockSnapshot(path, val));

  // Retornar función para des-registrar
  return () => {
    activeListeners.delete(listenerId);
  };
};

export const off = (dbRef) => {
  if (!dbRef.isMockRef) {
    return realOff(dbRef);
  }
  // Elimina todos los listeners de ese path
  activeListeners.forEach((val, key) => {
    if (val.path === dbRef.path) {
      activeListeners.delete(key);
    }
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
  
  // Forzar trigger local
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

  // Trigger local
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
  
  // Combinar valores
  const updated = { ...currentVal, ...values };
  setValueAtPath(dbData, path, updated);
  setLocalData(dbData);

  // Trigger local
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

  // Subida simulada: convertir file a un Data URL base64 y guardarlo en el settings local
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Guardar temporalmente en localStorage como logo de caché
      localStorage.setItem('mock_uploaded_logo', reader.result);
      resolve({
        ref: storageRefInstance,
        metadata: { contentType: file.type }
      });
    };
    reader.readAsDataURL(file);
  });
};

export const getDownloadURL = async (storageRefInstance) => {
  if (!isMockMode) {
    return realGetDownloadURL(storageRefInstance);
  }
  // Retornar el base64 guardado localmente o una imagen por defecto
  return localStorage.getItem('mock_uploaded_logo') || '';
};

// Guardamos ref para storage en mock
export const storageRef = (storageInstance, path) => {
  if (!isMockMode) {
    return realStorageRef(storageInstance, path);
  }
  return { path, isMockStorageRef: true };
};
