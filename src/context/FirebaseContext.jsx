import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword as firebaseCreateUser } from 'firebase/auth';
import { 
  auth, 
  database, 
  storage, 
  isMockMode,
  MASTER_ADMIN_EMAIL,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  reauthenticateUser,
  ref,
  onValue,
  set,
  update,
  push,
  uploadBytes,
  getDownloadURL,
  storageRef,
  firebaseConfig,
  syncChannel,
  MOCK_ACCOUNTS
} from '../firebase';

const FirebaseContext = createContext(null);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase debe usarse dentro de un FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentEventId, setCurrentEventId] = useState('default-event');
  const [eventSettings, setEventSettings] = useState({
    title: 'Mi Gran Evento VIP',
    logoUrl: '',
    themeColor: '#7c3aed',
    themeColorSecondary: '#06b6d4',
    djName: 'DJ MasterMix'
  });
  const [requests, setRequests] = useState({});
  const [autocompleteSongs, setAutocompleteSongs] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [allEventsData, setAllEventsData] = useState({});

  // Admin master: lista de todos los usuarios y sus eventos
  const [allUsersData, setAllUsersData] = useState({});

  // UID efectivo: puede ser el propio usuario o, si el admin está impersonando, el del DJ seleccionado
  const [impersonatingUid, setImpersonatingUid] = useState(null);

  // Determinar si el usuario actual es el administrador master
  const isAdminMaster = user?.email === MASTER_ADMIN_EMAIL;

  // UID que se usa para leer/escribir datos
  const activeUid = impersonatingUid || user?.uid;

  // Ruta base de datos del usuario activo
  const userBasePath = activeUid ? `users/${activeUid}` : null;

  // 1. Escuchar estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      // Al cambiar de usuario, resetear impersonación
      setImpersonatingUid(null);
    });
    return () => unsubscribe();
  }, []);

  // Estado para el owner del evento actual (para la vista pública)
  const [eventOwnerUid, setEventOwnerUid] = useState(null);

  // Resolver el ownerUid del evento actual desde el registro público (para la vista pública anónima)
  useEffect(() => {
    if (activeUid) {
      // DJ autenticado: el owner es él mismo
      setEventOwnerUid(activeUid);
      return;
    }
    // Usuario anónimo (público): buscar en el registro
    const registryRef = ref(database, `events_registry/${currentEventId}`);
    const unsubscribe = onValue(registryRef, (snapshot) => {
      if (snapshot.exists()) {
        setEventOwnerUid(snapshot.val().ownerUid);
      } else {
        // Fallback: intentar con el evento por defecto del primer DJ conocido (modo mock demo)
        setEventOwnerUid(null);
      }
    });
    return () => unsubscribe();
  }, [currentEventId, activeUid]);

  // Ruta de lectura efectiva para settings/requests:
  // - DJ autenticado → userBasePath (su propio nodo, siempre correcto)
  // - Público anónimo → ownerBasePath (resuelto desde events_registry)
  const ownerBasePath = eventOwnerUid ? `users/${eventOwnerUid}` : null;
  const effectiveReadPath = userBasePath || ownerBasePath;

  // Escuchar configuraciones del evento activo
  useEffect(() => {
    if (!effectiveReadPath) return;
    const settingsRef = ref(database, `${effectiveReadPath}/events/${currentEventId}/settings`);
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setEventSettings(data);
        if (data.themeColor) {
          document.documentElement.style.setProperty('--primary-color', data.themeColor);
          document.documentElement.style.setProperty('--primary-glow', `${data.themeColor}55`);
        }
        if (data.themeColorSecondary) {
          document.documentElement.style.setProperty('--secondary-color', data.themeColorSecondary);
          document.documentElement.style.setProperty('--secondary-glow', `${data.themeColorSecondary}55`);
        }
      } else {
        setEventSettings({
          title: 'Mi Gran Evento VIP',
          logoUrl: '',
          themeColor: '#7c3aed',
          themeColorSecondary: '#06b6d4',
          djName: 'DJ MasterMix'
        });
      }
    });
    return () => unsubscribe();
  }, [currentEventId, effectiveReadPath]);

  // 3. Escuchar peticiones de canciones en tiempo real
  useEffect(() => {
    if (!effectiveReadPath) return;
    const requestsRef = ref(database, `${effectiveReadPath}/events/${currentEventId}/requests`);
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        setRequests(snapshot.val());
      } else {
        setRequests({});
      }
    });
    return () => unsubscribe();
  }, [currentEventId, effectiveReadPath]);

  // 4. Escuchar catálogo de autocompletado (solo DJ autenticado)
  useEffect(() => {
    if (!userBasePath) return;
    const autocompleteRef = ref(database, `${userBasePath}/autocomplete_songs`);
    const unsubscribe = onValue(autocompleteRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list = Object.keys(val).map(key => ({ id: key, ...val[key] }));
        setAutocompleteSongs(list);
      } else {
        setAutocompleteSongs([]);
      }
    });
    return () => unsubscribe();
  }, [userBasePath]);

  // 5. Escuchar índice de eventos (scope por usuario)
  useEffect(() => {
    if (!userBasePath) return;
    const indexRef = ref(database, `${userBasePath}/events_index`);
    const unsubscribe = onValue(indexRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list = Object.keys(val).map(key => ({ id: key, ...val[key] }));
        setEventsList(list);
      } else {
        setEventsList([]);
      }
    });
    return () => unsubscribe();
  }, [userBasePath]);

  // 5b. Escuchar todos los eventos en tiempo real con sus configuraciones y peticiones
  useEffect(() => {
    if (!userBasePath) {
      setAllEventsData({});
      return;
    }
    const eventsRef = ref(database, `${userBasePath}/events`);
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        setAllEventsData(snapshot.val());
      } else {
        setAllEventsData({});
      }
    });
    return () => unsubscribe();
  }, [userBasePath]);

  // 6. Admin master: escuchar todos los usuarios (solo si es admin)
  useEffect(() => {
    if (!isAdminMaster || impersonatingUid) return; // No escuchar si está impersonando
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        setAllUsersData(snapshot.val());
      } else {
        setAllUsersData({});
      }
    });
    return () => unsubscribe();
  }, [isAdminMaster, impersonatingUid]);

  // --- MÉTODOS DE CONTROL ---

  const loginDJ = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logoutDJ = async () => {
    setImpersonatingUid(null);
    return signOut(auth);
  };

  // Admin: impersonar un DJ (ver su panel)
  const impersonateUser = (uid) => {
    setImpersonatingUid(uid);
    setCurrentEventId('default-event');
  };

  // Admin: dejar de impersonar
  const stopImpersonating = () => {
    setImpersonatingUid(null);
    setCurrentEventId('default-event');
  };

  // Crear una nueva petición (Público) — funciona TANTO para usuarios autenticados como anónimos.
  // El público no tiene sesión, por eso buscamos el ownerUid del evento en el registro público.
  const addRequest = async (title, artist, genre, sessionId, eventOwnerUid) => {
    // ownerUid puede venir del caller (PublicView lo pasa) o del usuario autenticado (DJ usando su propia vista)
    const targetUid = eventOwnerUid || activeUid;
    if (!targetUid) {
      throw new Error('No se pudo identificar al propietario del evento.');
    }
    const requestsRef = ref(database, `users/${targetUid}/events/${currentEventId}/requests`);
    const newRequest = {
      title,
      artist,
      genre: genre || 'Personalizado',
      timestamp: Date.now(),
      status: 'pending',
      votes: 0,
      voters: { [sessionId]: true }
    };
    return push(requestsRef, newRequest);
  };

  // Votar por una petición existente (Público) — igual, soporta usuarios anónimos con ownerUid
  const voteRequest = async (requestId, sessionId, hasVoted, eventOwnerUid) => {
    const targetUid = eventOwnerUid || activeUid;
    if (!targetUid) return;
    const requestRef = ref(database, `users/${targetUid}/events/${currentEventId}/requests/${requestId}`);
    const reqData = requests[requestId];
    if (!reqData) return;

    const voters = reqData.voters || {};
    let newVotes = reqData.votes || 0;

    if (hasVoted) {
      delete voters[sessionId];
      newVotes = Math.max(0, newVotes - 1);
    } else {
      voters[sessionId] = true;
      newVotes += 1;
    }
    return update(requestRef, { votes: newVotes, voters });
  };

  // Actualizar estado de petición (DJ)
  const updateRequestStatus = async (requestId, newStatus) => {
    if (!userBasePath) return;
    const requestRef = ref(database, `${userBasePath}/events/${currentEventId}/requests/${requestId}`);
    await update(requestRef, { status: newStatus });
    if (newStatus === 'accepted') {
      const acceptedReq = requests[requestId];
      if (acceptedReq) {
        checkAndAddToAutocomplete(acceptedReq.title, acceptedReq.artist, acceptedReq.genre);
      }
    }
  };

  const checkAndAddToAutocomplete = async (title, artist, genre) => {
    if (!userBasePath) return;
    const cleanTitle = title.trim().toLowerCase();
    const cleanArtist = artist.trim().toLowerCase();
    const exists = autocompleteSongs.some(
      song => song.title.toLowerCase() === cleanTitle && song.artist.toLowerCase() === cleanArtist
    );
    if (!exists) {
      const autocompleteRef = ref(database, `${userBasePath}/autocomplete_songs`);
      const newSong = {
        title: title.trim(),
        artist: artist.trim(),
        genre: genre ? genre.trim() : 'Personalizado'
      };
      await push(autocompleteRef, newSong);
    }
  };

  // Actualizar configuraciones del evento (DJ) — lanza error si no hay sesión activa
  const updateEventSettings = async (newSettings) => {
    if (!userBasePath) {
      throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.');
    }
    const settingsRef = ref(database, `${userBasePath}/events/${currentEventId}/settings`);
    return update(settingsRef, newSettings);
  };

  // Subir logotipo personalizado (DJ) — mantiene compatibilidad Firebase Storage real
  const uploadLogo = async (file) => {
    if (!userBasePath) return;
    const logoStorageRef = storageRef(storage, `logos/${activeUid}_${currentEventId}_logo_${Date.now()}`);
    await uploadBytes(logoStorageRef, file);
    const downloadUrl = await getDownloadURL(logoStorageRef);
    await updateEventSettings({ logoUrl: downloadUrl });
    return downloadUrl;
  };

  const changeEvent = (eventId) => { setCurrentEventId(eventId); };

  const createNewEvent = async (eventId, title, djName, date) => {
    if (!userBasePath) return;
    const eventRef = ref(database, `${userBasePath}/events/${eventId}`);
    const initialEvent = {
      settings: {
        title,
        logoUrl: '',
        themeColor: '#7c3aed',
        themeColorSecondary: '#06b6d4',
        djName: djName || 'DJ MasterMix',
        date: date || new Date().toISOString().split('T')[0],
        archived: false
      },
      requests: {}
    };
    await set(eventRef, initialEvent);

    // Índice privado del usuario
    const indexRef = ref(database, `${userBasePath}/events_index/${eventId}`);
    await set(indexRef, {
      id: eventId,
      title,
      djName: djName || 'DJ MasterMix',
      date: date || new Date().toISOString().split('T')[0],
      archived: false,
      createdAt: Date.now()
    });

    // Registro público: permite que la vista pública encuentre al propietario del evento
    const registryRef = ref(database, `events_registry/${eventId}`);
    await set(registryRef, { ownerUid: activeUid, title, djName: djName || 'DJ MasterMix' });

    setCurrentEventId(eventId);
  };

  const deleteEvent = async (eventId) => {
    if (!userBasePath) return;
    const eventRef = ref(database, `${userBasePath}/events/${eventId}`);
    await set(eventRef, null);
    const indexRef = ref(database, `${userBasePath}/events_index/${eventId}`);
    await set(indexRef, null);
    if (currentEventId === eventId) setCurrentEventId('default-event');
  };

  const archiveEvent = async (eventId, archivedState) => {
    if (!userBasePath) return;
    const settingsRef = ref(database, `${userBasePath}/events/${eventId}/settings`);
    await update(settingsRef, { archived: archivedState });
    const indexRef = ref(database, `${userBasePath}/events_index/${eventId}`);
    await update(indexRef, { archived: archivedState });
  };

  const updateEventMetadata = async (eventId, title, djName, date) => {
    if (!userBasePath) return;

    // Actualizar index
    const indexRef = ref(database, `${userBasePath}/events_index/${eventId}`);
    await update(indexRef, {
      title,
      djName: djName || 'DJ MasterMix',
      date
    });

    // Actualizar settings
    const settingsRef = ref(database, `${userBasePath}/events/${eventId}/settings`);
    await update(settingsRef, {
      title,
      djName: djName || 'DJ MasterMix',
      date
    });

    // Actualizar registro público si existe
    const registryRef = ref(database, `events_registry/${eventId}`);
    await update(registryRef, {
      title,
      djName: djName || 'DJ MasterMix'
    });
  };

  // Borrar historial de forma granular y opcional
  const clearHistoryWithOptions = async (options) => {
    if (!userBasePath) throw new Error('No hay sesión activa.');

    // 1. Borrado de canciones (peticiones) del evento activo
    if (options.songs) {
      const requestsRef = ref(database, `${userBasePath}/events/${currentEventId}/requests`);
      await set(requestsRef, null);
      setRequests({});
    }

    // 2. Borrado de géneros (resetea a "Personalizado" en peticiones y autocompletado)
    if (options.genres) {
      if (requests && Object.keys(requests).length > 0) {
        const updatedRequests = {};
        Object.keys(requests).forEach(key => {
          updatedRequests[`${key}/genre`] = 'Personalizado';
        });
        const requestsRef = ref(database, `${userBasePath}/events/${currentEventId}/requests`);
        await update(requestsRef, updatedRequests);
      }
      if (autocompleteSongs && autocompleteSongs.length > 0) {
        const updatedAutocomplete = {};
        autocompleteSongs.forEach(song => {
          updatedAutocomplete[`${song.id}/genre`] = 'Personalizado';
        });
        const autocompleteRef = ref(database, `${userBasePath}/autocomplete_songs`);
        await update(autocompleteRef, updatedAutocomplete);
      }
    }

    // 3. Borrado de artistas (resetea a "Artista no especificado" en peticiones y autocompletado)
    if (options.artists) {
      if (requests && Object.keys(requests).length > 0) {
        const updatedRequests = {};
        Object.keys(requests).forEach(key => {
          updatedRequests[`${key}/artist`] = 'Artista no especificado';
        });
        const requestsRef = ref(database, `${userBasePath}/events/${currentEventId}/requests`);
        await update(requestsRef, updatedRequests);
      }
      if (autocompleteSongs && autocompleteSongs.length > 0) {
        const updatedAutocomplete = {};
        autocompleteSongs.forEach(song => {
          updatedAutocomplete[`${song.id}/artist`] = 'Artista no especificado';
        });
        const autocompleteRef = ref(database, `${userBasePath}/autocomplete_songs`);
        await update(autocompleteRef, updatedAutocomplete);
      }
    }

    // 4. Borrado de calendario (eventos del DJ exceptuando el default)
    if (options.calendar) {
      const indexRef = ref(database, `${userBasePath}/events_index`);
      await set(indexRef, null);
      
      const eventsRef = ref(database, `${userBasePath}/events`);
      await set(eventsRef, null);

      // Re-crear evento default-event de inicio
      const defaultEventRef = ref(database, `${userBasePath}/events/default-event`);
      await set(defaultEventRef, {
        settings: {
          title: 'Mi Gran Evento VIP',
          logoUrl: '',
          themeColor: '#7c3aed',
          themeColorSecondary: '#06b6d4',
          djName: user?.displayName || 'DJ MasterMix',
          date: new Date().toISOString().split('T')[0],
          archived: false
        },
        requests: {}
      });

      const defaultIndexRef = ref(database, `${userBasePath}/events_index/default-event`);
      await set(defaultIndexRef, {
        id: 'default-event',
        title: 'Mi Gran Evento VIP',
        djName: user?.displayName || 'DJ MasterMix',
        date: new Date().toISOString().split('T')[0],
        archived: false,
        createdAt: Date.now()
      });

      setCurrentEventId('default-event');
      setEventsList([{
        id: 'default-event',
        title: 'Mi Gran Evento VIP',
        djName: user?.displayName || 'DJ MasterMix',
        date: new Date().toISOString().split('T')[0],
        archived: false
      }]);
    }

    // 5. Borrado de base de datos de autocompletado
    if (options.autocomplete) {
      const autocompleteRef = ref(database, `${userBasePath}/autocomplete_songs`);
      await set(autocompleteRef, null);
      setAutocompleteSongs([]);
    }
  };

  // Crear nueva cuenta DJ (solo Admin Master)
  // En modo real: usa una app secundaria temporal para no cerrar la sesión del admin.
  // En modo mock: persiste la cuenta nueva en MOCK_ACCOUNTS (localStorage).
  const createDjAccount = async (email, password, displayName) => {
    if (!isAdminMaster) {
      throw new Error('Solo el Administrador Master puede crear cuentas.');
    }

    if (isMockMode) {
      // Verificar que no exista ya
      const allAccounts = JSON.parse(localStorage.getItem('mock_accounts') || '[]');
      if (allAccounts.find(a => a.email === email)) {
        throw new Error('Ya existe una cuenta con ese correo electrónico.');
      }

      const newUid = 'uid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      const newAccount = { email, password, uid: newUid, displayName: displayName || email.split('@')[0], isAdmin: false };
      
      const updatedAccounts = [...allAccounts, newAccount];
      localStorage.setItem('mock_accounts', JSON.stringify(updatedAccounts));

      // Crear datos iniciales del DJ en la base de datos mock
      const dbData = JSON.parse(localStorage.getItem('mock_rtdb_v2') || '{}');
      if (!dbData.users) dbData.users = {};
      const now = Date.now();
      dbData.users[newUid] = {
        events_index: {
          'default-event': {
            id: 'default-event', title: 'Mi Gran Evento VIP',
            djName: displayName || email.split('@')[0],
            date: new Date().toISOString().split('T')[0],
            archived: false, createdAt: now
          }
        },
        events: {
          'default-event': {
            settings: {
              title: 'Mi Gran Evento VIP', logoUrl: '',
              themeColor: '#7c3aed', themeColorSecondary: '#06b6d4',
              djName: displayName || email.split('@')[0]
            },
            requests: {}
          }
        },
        autocomplete_songs: {}
      };
      if (!dbData.events_registry) dbData.events_registry = {};
      dbData.events_registry['default-event-' + newUid] = {
        ownerUid: newUid, title: 'Mi Gran Evento VIP', djName: displayName || email.split('@')[0]
      };
      localStorage.setItem('mock_rtdb_v2', JSON.stringify(dbData));

      // Notificar a todos los listeners que la BD cambió
      if (syncChannel) syncChannel.postMessage({ type: 'DB_UPDATE' });

      return { uid: newUid, email, displayName: newAccount.displayName };
    }

    // --- FIREBASE REAL ---
    // Traductor de códigos de error de Firebase Auth al español
    const translateFirebaseAuthError = (err) => {
      const code = err?.code || '';
      const translations = {
        'auth/email-already-in-use':    'Ya existe una cuenta registrada con ese correo electrónico.',
        'auth/invalid-email':           'El formato del correo electrónico no es válido.',
        'auth/weak-password':           'La contraseña es muy débil. Usa al menos 6 caracteres.',
        'auth/too-many-requests':       'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
        'auth/network-request-failed':  'Error de red. Verifica tu conexión a Internet.',
        'auth/operation-not-allowed':   'La creación de usuarios con email/contraseña no está habilitada en Firebase Console.',
        'auth/invalid-api-key':         'API Key de Firebase inválida. Revisa tu configuración.',
        'auth/app-deleted':             'Error interno de configuración. Recarga la página.',
        'auth/user-disabled':           'Esta cuenta ha sido deshabilitada.',
      };
      return translations[code] || `Error de Firebase (${code || 'desconocido'}): ${err.message || ''}`;
    };

    // Crear app secundaria temporal para no cerrar sesión del admin
    const tempAppName = `TempApp_${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    try {
      const tempAuth = getAuth(tempApp);

      let userCredential;
      try {
        userCredential = await firebaseCreateUser(tempAuth, email, password);
      } catch (authErr) {
        // Traducir el error de Auth antes de propagarlo
        throw new Error(translateFirebaseAuthError(authErr));
      }

      const newUser = userCredential.user;

      // Crear datos iniciales del nuevo DJ en RTDB
      const newUid = newUser.uid;
      const userRef = ref(database, `users/${newUid}`);
      const now = Date.now();
      await set(userRef, {
        events_index: {
          'default-event': {
            id: 'default-event', title: 'Mi Gran Evento VIP',
            djName: displayName || email.split('@')[0],
            date: new Date().toISOString().split('T')[0],
            archived: false, createdAt: now
          }
        },
        events: {
          'default-event': {
            settings: {
              title: 'Mi Gran Evento VIP', logoUrl: '',
              themeColor: '#7c3aed', themeColorSecondary: '#06b6d4',
              djName: displayName || email.split('@')[0]
            },
            requests: {}
          }
        },
        autocomplete_songs: {}
      });

      // Registrar en registry público
      const registryRef = ref(database, `events_registry/default-event-${newUid}`);
      await set(registryRef, {
        ownerUid: newUid, title: 'Mi Gran Evento VIP',
        djName: displayName || email.split('@')[0]
      });

      return { uid: newUid, email, displayName: displayName || email.split('@')[0] };
    } finally {
      // Eliminar app temporal para liberar recursos (siempre se ejecuta)
      await deleteApp(tempApp);
    }
  };

  return (
    <FirebaseContext.Provider value={{
      user,
      authLoading,
      isMock: isMockMode,
      isAdminMaster,
      impersonatingUid,
      eventOwnerUid,
      currentEventId,
      eventSettings,
      requests,
      autocompleteSongs,
      eventsList,
      allEventsData,
      allUsersData,
      loginDJ,
      logoutDJ,
      impersonateUser,
      stopImpersonating,
      addRequest,
      voteRequest,
      updateRequestStatus,
      updateEventSettings,
      uploadLogo,
      changeEvent,
      createNewEvent,
      deleteEvent,
      archiveEvent,
      updateEventMetadata,
      clearHistoryWithOptions,
      createDjAccount
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};
