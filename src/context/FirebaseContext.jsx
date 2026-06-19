import React, { createContext, useContext, useState, useEffect } from 'react';
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
  storageRef
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

  // 2. Escuchar configuraciones del evento activo (scope por usuario)
  useEffect(() => {
    if (!userBasePath) return;
    const settingsRef = ref(database, `${userBasePath}/events/${currentEventId}/settings`);
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
        // Evento no existe aún, resetear a defaults
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
  }, [currentEventId, userBasePath]);

  // 3. Escuchar peticiones de canciones en tiempo real (scope por usuario)
  useEffect(() => {
    if (!userBasePath) return;
    const requestsRef = ref(database, `${userBasePath}/events/${currentEventId}/requests`);
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        setRequests(snapshot.val());
      } else {
        setRequests({});
      }
    });
    return () => unsubscribe();
  }, [currentEventId, userBasePath]);

  // 4. Escuchar catálogo de autocompletado (scope por usuario)
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

  // Crear una nueva petición (Público)
  const addRequest = async (title, artist, genre, sessionId) => {
    if (!userBasePath) return;
    const requestsRef = ref(database, `${userBasePath}/events/${currentEventId}/requests`);
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

  // Votar por una petición existente (Público)
  const voteRequest = async (requestId, sessionId, hasVoted) => {
    if (!userBasePath) return;
    const requestRef = ref(database, `${userBasePath}/events/${currentEventId}/requests/${requestId}`);
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

  // Actualizar configuraciones del evento (DJ)
  const updateEventSettings = async (newSettings) => {
    if (!userBasePath) return;
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

    const indexRef = ref(database, `${userBasePath}/events_index/${eventId}`);
    await set(indexRef, {
      id: eventId,
      title,
      djName: djName || 'DJ MasterMix',
      date: date || new Date().toISOString().split('T')[0],
      archived: false,
      createdAt: Date.now()
    });

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

  // Borrar TODO el historial del usuario actual con verificación de contraseña
  const clearAllHistoryWithPassword = async (password) => {
    // Re-autenticar al usuario: lanza error si la contraseña es incorrecta
    await reauthenticateUser(password);

    if (!userBasePath) return;

    // Borrar eventos
    const eventsRef = ref(database, `${userBasePath}/events`);
    await set(eventsRef, null);

    // Borrar índice
    const indexRef = ref(database, `${userBasePath}/events_index`);
    await set(indexRef, null);

    // Borrar autocompletado
    const autocompleteRef = ref(database, `${userBasePath}/autocomplete_songs`);
    await set(autocompleteRef, null);

    // Reset estado local
    setRequests({});
    setEventsList([]);
    setAutocompleteSongs([]);
    setCurrentEventId('default-event');
  };

  return (
    <FirebaseContext.Provider value={{
      user,
      authLoading,
      isMock: isMockMode,
      isAdminMaster,
      impersonatingUid,
      currentEventId,
      eventSettings,
      requests,
      autocompleteSongs,
      eventsList,
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
      clearAllHistoryWithPassword
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};
