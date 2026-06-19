import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  database, 
  storage, 
  isMockMode,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
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

  // 1. Escuchar estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Escuchar configuraciones del evento activo
  useEffect(() => {
    const settingsRef = ref(database, `events/${currentEventId}/settings`);
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setEventSettings(data);
        
        // Aplicar branding en caliente mediante variables CSS en el :root
        if (data.themeColor) {
          document.documentElement.style.setProperty('--primary-color', data.themeColor);
          // Calcular glow en HSL aproximado
          document.documentElement.style.setProperty('--primary-glow', `${data.themeColor}55`);
        }
        if (data.themeColorSecondary) {
          document.documentElement.style.setProperty('--secondary-color', data.themeColorSecondary);
          document.documentElement.style.setProperty('--secondary-glow', `${data.themeColorSecondary}55`);
        }
      }
    });
    return () => unsubscribe();
  }, [currentEventId]);

  // 3. Escuchar peticiones de canciones en tiempo real
  useEffect(() => {
    const requestsRef = ref(database, `events/${currentEventId}/requests`);
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        setRequests(snapshot.val());
      } else {
        setRequests({});
      }
    });
    return () => unsubscribe();
  }, [currentEventId]);

  // 4. Escuchar catálogo de autocompletado global
  useEffect(() => {
    const autocompleteRef = ref(database, 'autocomplete_songs');
    const unsubscribe = onValue(autocompleteRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        // Convertir objeto NoSQL en array
        const list = Object.keys(val).map(key => ({
          id: key,
          ...val[key]
        }));
        setAutocompleteSongs(list);
      }
    });
    return () => unsubscribe();
  }, []);

  // 5. Escuchar índice de eventos
  useEffect(() => {
    const indexRef = ref(database, 'events_index');
    const unsubscribe = onValue(indexRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list = Object.keys(val).map(key => ({
          id: key,
          ...val[key]
        }));
        setEventsList(list);
      } else {
        setEventsList([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- MÉTODOS DE CONTROL ---

  // Iniciar sesión (DJ)
  const loginDJ = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Cerrar sesión
  const logoutDJ = async () => {
    return signOut(auth);
  };

  // Crear una nueva petición (Público)
  const addRequest = async (title, artist, genre, sessionId) => {
    const requestsRef = ref(database, `events/${currentEventId}/requests`);
    const newRequest = {
      title,
      artist,
      genre: genre || 'Personalizado',
      timestamp: Date.now(),
      status: 'pending', // pending, accepted, playing, rejected
      votes: 0,
      voters: { [sessionId]: true }
    };
    return push(requestsRef, newRequest);
  };

  // Votar por una petición existente (Público)
  const voteRequest = async (requestId, sessionId, hasVoted) => {
    const requestRef = ref(database, `events/${currentEventId}/requests/${requestId}`);
    const reqData = requests[requestId];
    if (!reqData) return;

    const voters = reqData.voters || {};
    let newVotes = reqData.votes || 0;

    if (hasVoted) {
      // Quitar voto
      delete voters[sessionId];
      newVotes = Math.max(0, newVotes - 1);
    } else {
      // Agregar voto
      voters[sessionId] = true;
      newVotes += 1;
    }

    return update(requestRef, {
      votes: newVotes,
      voters
    });
  };

  // Actualizar estado de petición (DJ)
  const updateRequestStatus = async (requestId, newStatus) => {
    const requestRef = ref(database, `events/${currentEventId}/requests/${requestId}`);
    await update(requestRef, { status: newStatus });

    // Si la petición es aceptada y no existe en la lista de autocompletado, agregarla automáticamente para el futuro (Base de Datos Evolutiva)
    if (newStatus === 'accepted') {
      const acceptedReq = requests[requestId];
      if (acceptedReq) {
        checkAndAddToAutocomplete(acceptedReq.title, acceptedReq.artist, acceptedReq.genre);
      }
    }
  };

  // Verificar e insertar tema nuevo en el autocompletado global
  const checkAndAddToAutocomplete = async (title, artist, genre) => {
    const cleanTitle = title.trim().toLowerCase();
    const cleanArtist = artist.trim().toLowerCase();
    
    // Buscar si ya existe
    const exists = autocompleteSongs.some(
      song => song.title.toLowerCase() === cleanTitle && song.artist.toLowerCase() === cleanArtist
    );

    if (!exists) {
      const autocompleteRef = ref(database, 'autocomplete_songs');
      const newSong = {
        title: title.trim(),
        artist: artist.trim(),
        genre: genre ? genre.trim() : 'Personalizado'
      };
      await push(autocompleteRef, newSong);
    }
  };

  // Actualizar configuraciones del evento y marca blanca (DJ)
  const updateEventSettings = async (newSettings) => {
    const settingsRef = ref(database, `events/${currentEventId}/settings`);
    return update(settingsRef, newSettings);
  };

  // Subir logotipo personalizado (DJ)
  const uploadLogo = async (file) => {
    const logoStorageRef = storageRef(storage, `logos/${currentEventId}_logo_${Date.now()}`);
    await uploadBytes(logoStorageRef, file);
    const downloadUrl = await getDownloadURL(logoStorageRef);
    
    // Guardar URL en settings
    await updateEventSettings({ logoUrl: downloadUrl });
    return downloadUrl;
  };

  // Crear o cambiar de evento (DJ)
  const changeEvent = (eventId) => {
    setCurrentEventId(eventId);
  };

  const createNewEvent = async (eventId, title, djName, date) => {
    const eventRef = ref(database, `events/${eventId}`);
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

    // Guardar en el índice global
    const indexRef = ref(database, `events_index/${eventId}`);
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

  // Eliminar evento completo
  const deleteEvent = async (eventId) => {
    // Eliminar datos del evento
    const eventRef = ref(database, `events/${eventId}`);
    await set(eventRef, null);

    // Eliminar del índice
    const indexRef = ref(database, `events_index/${eventId}`);
    await set(indexRef, null);

    // Si se elimina el evento activo, cambiar al default
    if (currentEventId === eventId) {
      setCurrentEventId('default-event');
    }
  };

  // Archivar o desarchivar evento
  const archiveEvent = async (eventId, archivedState) => {
    // Actualizar settings del evento
    const settingsRef = ref(database, `events/${eventId}/settings`);
    await update(settingsRef, { archived: archivedState });

    // Actualizar en el índice
    const indexRef = ref(database, `events_index/${eventId}`);
    await update(indexRef, { archived: archivedState });
  };

  // Borrar TODOS los eventos, peticiones e historial de autocompletado (acción destructiva)
  const clearAllHistory = async () => {
    // 1. Borrar peticiones del evento activo y todos los demás eventos
    const eventsRef = ref(database, 'events');
    await set(eventsRef, null);

    // 2. Borrar el índice de eventos
    const indexRef = ref(database, 'events_index');
    await set(indexRef, null);

    // 3. Borrar catálogo de autocompletado (historial aprendido)
    const autocompleteRef = ref(database, 'autocomplete_songs');
    await set(autocompleteRef, null);

    // 4. Resetear estado local
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
      currentEventId,
      eventSettings,
      requests,
      autocompleteSongs,
      eventsList,
      loginDJ,
      logoutDJ,
      addRequest,
      voteRequest,
      updateRequestStatus,
      updateEventSettings,
      uploadLogo,
      changeEvent,
      createNewEvent,
      deleteEvent,
      archiveEvent,
      clearAllHistory
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};
