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
  MOCK_ACCOUNTS,
  get
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
    djName: 'DJ MasterMix',
    webName: 'DJ a la Carta',
    eventType: 'Otro',
    fontFamily: 'Outfit',
    fontSize: 'medium',
    logoSize: 'medium',
    tipsEnabled: false,
    paypalUsername: '',
    mercadopagoLink: '',
    dedicationsEnabled: false
  });
  const [requests, setRequests] = useState({});
  const [playedRequests, setPlayedRequests] = useState({});
  const [autocompleteSongs, setAutocompleteSongs] = useState([]);
  const [ratingsData, setRatingsData] = useState([]);
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

  // 1b. Asegurar que el evento por defecto del DJ esté registrado en events_registry y settings
  useEffect(() => {
    if (!activeUid || !userBasePath) return;

    const registryRef = ref(database, `events_registry/default-event-${activeUid}`);
    const settingsRef = ref(database, `${userBasePath}/events/default-event/settings`);
    const indexRef = ref(database, `${userBasePath}/events_index/default-event`);

    const unsubscribe = onValue(registryRef, (snapshot) => {
      if (!snapshot.exists() || !snapshot.val()?.ownerUid) {
        const unsubscribeSettings = onValue(settingsRef, (settingsSnap) => {
          const currentSettings = settingsSnap.exists() ? settingsSnap.val() : {
            title: 'Mi Gran Evento VIP',
            logoUrl: '',
            themeColor: '#7c3aed',
            themeColorSecondary: '#06b6d4',
            djName: user?.displayName || 'DJ MasterMix',
            webName: 'DJ a la Carta',
            eventType: 'Otro',
            logoSize: 'medium',
            tipsEnabled: false,
            paypalUsername: '',
            mercadopagoLink: '',
            dedicationsEnabled: false
          };

          if (!settingsSnap.exists()) {
            set(settingsRef, currentSettings);
          }

          set(registryRef, {
            ownerUid: activeUid,
            title: currentSettings.title || 'Mi Gran Evento VIP',
            djName: currentSettings.djName || 'DJ MasterMix',
            eventType: currentSettings.eventType || 'Otro'
          });

          const unsubscribeIndex = onValue(indexRef, (indexSnap) => {
            if (!indexSnap.exists()) {
              set(indexRef, {
                id: 'default-event',
                title: currentSettings.title || 'Mi Gran Evento VIP',
                djName: currentSettings.djName || 'DJ MasterMix',
                date: new Date().toISOString().split('T')[0],
                archived: false,
                createdAt: Date.now(),
                eventType: currentSettings.eventType || 'Otro'
              });
            }
            unsubscribeIndex();
          });

          unsubscribeSettings();
        });
      }
    });

    return () => unsubscribe();
  }, [activeUid, userBasePath, user]);

  // Ruta de lectura efectiva para settings/requests:
  // - DJ en dashboard → Prioriza userBasePath
  // - Público en vista de evento → Prioriza ownerBasePath (independiente de si está logueado)
  const isPublicView = window.location.search.includes('event=');

  // Estado para el owner del evento actual (para la vista pública)
  const [eventOwnerUid, setEventOwnerUid] = useState(null);

  // Resolver el ownerUid del evento actual desde el registro público (para la vista pública anónima)
  useEffect(() => {
    if (activeUid && !isPublicView) {
      // DJ autenticado en el dashboard: el owner es él mismo
      setEventOwnerUid(activeUid);
      return;
    }

    if (!currentEventId) return;

    // Vista pública (o si no está logueado): buscar en el registro
    const registryRef = ref(database, `events_registry/${currentEventId}`);
    const unsubscribe = onValue(registryRef, (snapshot) => {
      if (snapshot.exists() && snapshot.val().ownerUid) {
        setEventOwnerUid(snapshot.val().ownerUid);
      } else {
        // Fallback 1: intentar extraer el uid del ID del evento si es default-event-UID
        if (currentEventId && currentEventId.startsWith('default-event-')) {
          const extractedUid = currentEventId.replace('default-event-', '');
          if (extractedUid) {
            setEventOwnerUid(extractedUid);
            return;
          }
        }
        // Fallback 2: intentar con el evento por defecto del primer DJ conocido (modo mock demo)
        setEventOwnerUid(null);
      }
    });
    return () => unsubscribe();
  }, [currentEventId, activeUid, isPublicView]);

  const ownerBasePath = eventOwnerUid ? `users/${eventOwnerUid}` : null;
  const effectiveReadPath = isPublicView ? (ownerBasePath || userBasePath) : (userBasePath || ownerBasePath);

  // Escuchar configuraciones del evento activo
  useEffect(() => {
    if (!effectiveReadPath) return;
    const targetEventId = (currentEventId && currentEventId.startsWith('default-event'))
      ? 'default-event'
      : currentEventId;
    const settingsRef = ref(database, `${effectiveReadPath}/events/${targetEventId}/settings`);
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
        if (data.fontFamily) {
          document.documentElement.style.setProperty('--font-family', `'${data.fontFamily}', -apple-system, BlinkMacSystemFont, sans-serif`);
        } else {
          document.documentElement.style.setProperty('--font-family', "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif");
        }
        if (data.fontSize) {
          let sizeVal = '1rem';
          if (data.fontSize === 'small') sizeVal = '0.9rem';
          if (data.fontSize === 'large') sizeVal = '1.1rem';
          if (data.fontSize === 'xlarge') sizeVal = '1.25rem';
          document.documentElement.style.setProperty('--base-font-size', sizeVal);
        } else {
          document.documentElement.style.setProperty('--base-font-size', '1rem');
        }
      } else {
        setEventSettings({
          title: 'Mi Gran Evento VIP',
          logoUrl: '',
          themeColor: '#7c3aed',
          themeColorSecondary: '#06b6d4',
          djName: 'DJ MasterMix',
          webName: 'DJ a la Carta',
          eventType: 'Otro',
          fontFamily: 'Outfit',
          fontSize: 'medium',
          logoSize: 'medium',
          tipsEnabled: false,
          paypalUsername: '',
          mercadopagoLink: '',
          dedicationsEnabled: false
        });
      }
    });
    return () => unsubscribe();
  }, [currentEventId, effectiveReadPath, userBasePath]);

  // 3. Escuchar peticiones de canciones en tiempo real
  useEffect(() => {
    if (!effectiveReadPath) return;
    const targetEventId = (currentEventId && currentEventId.startsWith('default-event'))
      ? 'default-event'
      : currentEventId;
    const requestsRef = ref(database, `${effectiveReadPath}/events/${targetEventId}/requests`);
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        setRequests(snapshot.val());
      } else {
        setRequests({});
      }
    });
    return () => unsubscribe();
  }, [currentEventId, effectiveReadPath, userBasePath]);

  // 3b. Escuchar peticiones ya reproducidas en tiempo real
  useEffect(() => {
    if (!effectiveReadPath) return;
    const targetEventId = (currentEventId && currentEventId.startsWith('default-event'))
      ? 'default-event'
      : currentEventId;
    const playedRef = ref(database, `${effectiveReadPath}/events/${targetEventId}/played_requests`);
    const unsubscribe = onValue(playedRef, (snapshot) => {
      if (snapshot.exists()) {
        setPlayedRequests(snapshot.val());
      } else {
        setPlayedRequests({});
      }
    });
    return () => unsubscribe();
  }, [currentEventId, effectiveReadPath, userBasePath]);

  // 4. Cargar catálogo de autocompletado global en tiempo real (todos los eventos y DJs comparten el mismo catálogo)
  useEffect(() => {
    const autocompleteRef = ref(database, 'autocomplete_songs');
    const unsubscribe = onValue(autocompleteRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list = Object.keys(val).map(key => ({ id: key, ...val[key] }));
        setAutocompleteSongs(list);
      } else {
        setAutocompleteSongs([]);
      }
    }, (err) => {
      console.error("Error al escuchar autocompletado global:", err);
    });
    return () => unsubscribe();
  }, [database]);

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
  const addRequest = async (title, artist, genre, dedication, sessionId, eventOwnerUid, isRepeat = false) => {
    // ownerUid puede venir del caller (PublicView lo pasa) o del usuario autenticado (DJ usando su propia vista)
    const targetUid = eventOwnerUid || activeUid;
    if (!targetUid) {
      throw new Error('No se pudo identificar al propietario del evento.');
    }
    const targetEventId = (currentEventId && currentEventId.startsWith('default-event'))
      ? 'default-event'
      : currentEventId;

    const normalizeString = (str) => {
      if (!str) return '';
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/gi, "") // Quitar puntuación, comas, puntos y símbolos
        .toLowerCase()
        .trim();
    };

    const cleanTitle = (title || '').trim();
    const cleanArtist = (artist || '').trim();

    // 1. Buscar si ya existe la canción en la cola activa (requests)
    const existingEntry = Object.entries(requests || {}).find(([id, req]) => {
      if (!req || !req.title) return false;
      const reqTitleNormalized = normalizeString(req.title);
      const userTitleNormalized = normalizeString(cleanTitle);
      
      const matchTitle = reqTitleNormalized === userTitleNormalized;
      if (!matchTitle) return false;
      
      const reqArtistNormalized = normalizeString(req.artist);
      const userArtistNormalized = normalizeString(cleanArtist);
      
      const isReqArtistEmpty = reqArtistNormalized === '' || reqArtistNormalized === 'artista no especificado';
      const isUserArtistEmpty = userArtistNormalized === '' || userArtistNormalized === 'artista no especificado';
      
      // Si el artista no se especifica o coincide, consideramos que es la misma canción
      return isUserArtistEmpty || isReqArtistEmpty || (reqArtistNormalized === userArtistNormalized);
    });

    if (existingEntry) {
      const [existingId, existingReq] = existingEntry;
      const requestRef = ref(database, `users/${targetUid}/events/${targetEventId}/requests/${existingId}`);
      
      const voters = existingReq.voters || {};
      let newVotes = existingReq.votes || 0;
      
      // Sumar voto/corazón
      if (!voters[sessionId]) {
        voters[sessionId] = true;
        newVotes += 1;
      } else {
        // Permitir sumar más corazones de la misma sesión si vuelven a enviar la petición
        newVotes += 1;
      }
      
      const updates = { votes: newVotes, voters };
      
      // Anexar dedicatoria si el nuevo voto/petición incluye una dedicatoria
      if (dedication && dedication.trim() !== '') {
        const originalDedication = existingReq.dedication || '';
        updates.dedication = originalDedication 
          ? `${originalDedication} | ${dedication.trim()}` 
          : dedication.trim();
      }
      
      await update(requestRef, updates);

      // Auto-alimentar la base de datos de autocompletado global en tiempo real
      try {
        await checkAndAddToAutocomplete(cleanTitle, cleanArtist, genre);
      } catch (e) {
        console.warn("No se pudo agregar a autocompletado:", e);
      }

      return { key: existingId, isDuplicateMerge: true };
    }

    // 2. Si no existe, crear la nueva petición
    const requestsRef = ref(database, `users/${targetUid}/events/${targetEventId}/requests`);
    const newRequest = {
      title: cleanTitle || 'Tema no especificado',
      artist: cleanArtist || 'Artista no especificado',
      genre: genre || 'Personalizado',
      dedication: dedication || '',
      timestamp: Date.now(),
      status: 'pending',
      votes: 0,
      voters: { [sessionId]: true },
      isRepeat
    };
    const result = await push(requestsRef, newRequest);

    // Auto-alimentar la base de datos de autocompletado global en tiempo real
    try {
      await checkAndAddToAutocomplete(cleanTitle, cleanArtist, genre);
    } catch (e) {
      console.warn("No se pudo agregar a autocompletado:", e);
    }

    return result;
  };


  // Votar por una petición existente (Público) — igual, soporta usuarios anónimos con ownerUid
  const voteRequest = async (requestId, sessionId, hasVoted, eventOwnerUid) => {
    const targetUid = eventOwnerUid || activeUid;
    if (!targetUid) return;
    const targetEventId = (currentEventId && currentEventId.startsWith('default-event'))
      ? 'default-event'
      : currentEventId;
    const requestRef = ref(database, `users/${targetUid}/events/${targetEventId}/requests/${requestId}`);
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
      try {
        await checkAndAddToAutocomplete(reqData.title, reqData.artist, reqData.genre);
      } catch (e) {
        console.warn("No se pudo incrementar popularidad global en voto:", e);
      }
    }
    return update(requestRef, { votes: newVotes, voters });
  };

  // Actualizar estado de petición (DJ)
  const updateRequestStatus = async (requestId, newStatus) => {
    if (!userBasePath) return;
    
    if (newStatus === 'playing') {
      const playingReq = requests[requestId];
      if (playingReq) {
        const targetEventId = (currentEventId && currentEventId.startsWith('default-event'))
          ? 'default-event'
          : currentEventId;
        const playedRef = ref(database, `${userBasePath}/events/${targetEventId}/played_requests`);
        
        // 1. Agregar a la lista "Ya reproducida"
        await push(playedRef, {
          ...playingReq,
          status: 'playing',
          playedAt: Date.now()
        });

        // 2. Auto-alimentar base de datos de autocompletado
        checkAndAddToAutocomplete(playingReq.title, playingReq.artist, playingReq.genre);

        // 3. Eliminar de la cola de peticiones activas
        const requestRef = ref(database, `${userBasePath}/events/${targetEventId}/requests/${requestId}`);
        await set(requestRef, null);
      }
    } else {
      const requestRef = ref(database, `${userBasePath}/events/${currentEventId}/requests/${requestId}`);
      await update(requestRef, { status: newStatus });
      if (newStatus === 'accepted') {
        const acceptedReq = requests[requestId];
        if (acceptedReq) {
          checkAndAddToAutocomplete(acceptedReq.title, acceptedReq.artist, acceptedReq.genre);
        }
      }
    }
  };

  // Actualizar una petición activa o corregir errores ortográficos (DJ)
  const updateActiveRequest = async (requestId, updatedData) => {
    if (!userBasePath) return;
    const targetEventId = (currentEventId && currentEventId.startsWith('default-event'))
      ? 'default-event'
      : currentEventId;
    const requestRef = ref(database, `${userBasePath}/events/${targetEventId}/requests/${requestId}`);
    await update(requestRef, updatedData);
  };

  // Actualizar una sugerencia en el catálogo de autocompletado global
  const updateAutocompleteSong = async (songId, updatedData) => {
    const songRef = ref(database, `autocomplete_songs/${songId}`);
    await update(songRef, updatedData);
  };

  // Eliminar una sugerencia del catálogo de autocompletado global
  const deleteAutocompleteSong = async (songId) => {
    const songRef = ref(database, `autocomplete_songs/${songId}`);
    await set(songRef, null);
  };

  const checkAndAddToAutocomplete = async (title, artist, genre) => {
    const cleanTitle = (title || '').trim().toLowerCase();
    const cleanArtist = (artist || '').trim().toLowerCase();
    if (!cleanTitle) return;

    const songIndex = (autocompleteSongs || []).findIndex(
      song => song && song.title && song.artist &&
              song.title.toLowerCase() === cleanTitle && 
              song.artist.toLowerCase() === cleanArtist
    );

    const autocompleteRef = ref(database, 'autocomplete_songs');

    if (songIndex === -1) {
      const newSong = {
        title: title.trim(),
        artist: artist.trim() || 'Artista no especificado',
        genre: genre ? genre.trim() : 'Personalizado',
        globalRequests: 1
      };
      await push(autocompleteRef, newSong);
    } else {
      const song = autocompleteSongs[songIndex];
      const songRef = ref(database, `autocomplete_songs/${song.id}`);
      const currentCount = song.globalRequests || 1;
      await update(songRef, { 
        globalRequests: currentCount + 1 
      });
    }
  };

  // Actualizar configuraciones del evento (DJ) — lanza error si no hay sesión activa
  const updateEventSettings = async (newSettings) => {
    if (!userBasePath) {
      throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.');
    }
    const settingsRef = ref(database, `${userBasePath}/events/${currentEventId}/settings`);
    
    const settingsToUpdate = { ...newSettings };
    if (newSettings.djName !== undefined && newSettings.djName !== null && newSettings.djName.trim() !== '') {
      settingsToUpdate.djNameSaved = true;
    }
    
    await update(settingsRef, settingsToUpdate);

    // Si es el evento default, actualizar también el registro público y el índice privado
    if (currentEventId === 'default-event') {
      const registryRef = ref(database, `events_registry/default-event-${activeUid}`);
      const updateDataRegistry = {};
      if (newSettings.title !== undefined) updateDataRegistry.title = newSettings.title;
      if (newSettings.djName !== undefined) updateDataRegistry.djName = newSettings.djName;
      if (newSettings.eventType !== undefined) updateDataRegistry.eventType = newSettings.eventType;
      if (Object.keys(updateDataRegistry).length > 0) {
        await update(registryRef, updateDataRegistry);
      }

      const indexRef = ref(database, `${userBasePath}/events_index/default-event`);
      const updateDataIndex = {};
      if (newSettings.title !== undefined) updateDataIndex.title = newSettings.title;
      if (newSettings.djName !== undefined) updateDataIndex.djName = newSettings.djName;
      if (newSettings.date !== undefined) updateDataIndex.date = newSettings.date;
      if (newSettings.eventType !== undefined) updateDataIndex.eventType = newSettings.eventType;
      if (Object.keys(updateDataIndex).length > 0) {
        await update(indexRef, updateDataIndex);
      }
    }
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

  const createNewEvent = async (eventId, title, djName, date, eventType) => {
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
        archived: false,
        eventType: eventType || 'Otro',
        logoSize: 'medium',
        tipsEnabled: false,
        paypalUsername: '',
        mercadopagoLink: '',
        dedicationsEnabled: false
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
      createdAt: Date.now(),
      eventType: eventType || 'Otro'
    });

    // Registro público: permite que la vista pública encuentre al propietario del evento
    const registryRef = ref(database, `events_registry/${eventId}`);
    await set(registryRef, { ownerUid: activeUid, title, djName: djName || 'DJ MasterMix', eventType: eventType || 'Otro' });

    setCurrentEventId(eventId);
  };

  const deleteEvent = async (eventId) => {
    if (!userBasePath) return;
    
    if (eventId === 'default-event') {
      // Restablecer el evento por defecto a su punto de inicio
      const activeUid = user?.uid || auth.currentUser?.uid;
      
      const settingsRef = ref(database, `${userBasePath}/events/default-event/settings`);
      const snapshot = await get(settingsRef);
      const currentData = snapshot.exists() ? snapshot.val() : {};
      
      // Respetar el DJ guardado anteriormente. Si no se ha guardado, usar DJ_Demo
      const finalDjName = currentData.djNameSaved && currentData.djName && currentData.djName.trim()
        ? currentData.djName.trim()
        : 'DJ_Demo';

      const defaultSettings = {
        title: 'Mi Gran Evento VIP',
        logoUrl: '',
        themeColor: '#7c3aed',
        themeColorSecondary: '#06b6d4',
        djName: finalDjName,
        djNameSaved: currentData.djNameSaved || false,
        date: new Date().toISOString().split('T')[0],
        archived: false,
        webName: 'DJ a la Carta',
        eventType: 'Otro',
        logoSize: 'medium',
        tipsEnabled: false,
        paypalUsername: '',
        mercadopagoLink: '',
        dedicationsEnabled: false
      };
      await set(settingsRef, defaultSettings);

      const requestsRef = ref(database, `${userBasePath}/events/default-event/requests`);
      await set(requestsRef, null);

      const indexRef = ref(database, `${userBasePath}/events_index/default-event`);
      await set(indexRef, {
        id: 'default-event',
        title: 'Mi Gran Evento VIP',
        djName: finalDjName,
        date: new Date().toISOString().split('T')[0],
        archived: false,
        createdAt: Date.now(),
        eventType: 'Otro'
      });

      const registryRef = ref(database, `events_registry/default-event-${activeUid}`);
      await set(registryRef, {
        ownerUid: activeUid,
        title: 'Mi Gran Evento VIP',
        djName: finalDjName,
        eventType: 'Otro'
      });

      if (currentEventId === 'default-event') {
        setRequests({});
      }
      return;
    }

    const eventRef = ref(database, `${userBasePath}/events/${eventId}`);
    await set(eventRef, null);
    const indexRef = ref(database, `${userBasePath}/events_index/${eventId}`);
    await set(indexRef, null);
    // Limpiar del registro público también
    const registryRef = ref(database, `events_registry/${eventId}`);
    await set(registryRef, null);
    if (currentEventId === eventId) setCurrentEventId('default-event');
  };

  const archiveEvent = async (eventId, archivedState) => {
    if (!userBasePath) return;
    const settingsRef = ref(database, `${userBasePath}/events/${eventId}/settings`);
    await update(settingsRef, { archived: archivedState });
    const indexRef = ref(database, `${userBasePath}/events_index/${eventId}`);
    await update(indexRef, { archived: archivedState });
  };

  const updateEventMetadata = async (eventId, title, djName, date, eventType) => {
    if (!userBasePath) return;

    // Actualizar index
    const indexRef = ref(database, `${userBasePath}/events_index/${eventId}`);
    await update(indexRef, {
      title,
      djName: djName || 'DJ MasterMix',
      date,
      eventType: eventType || 'Otro'
    });

    // Actualizar settings
    const settingsRef = ref(database, `${userBasePath}/events/${eventId}/settings`);
    await update(settingsRef, {
      title,
      djName: djName || 'DJ MasterMix',
      date,
      eventType: eventType || 'Otro',
      djNameSaved: true
    });

    // Actualizar registro público si existe
    const registryRef = ref(database, `events_registry/${eventId}`);
    await update(registryRef, {
      title,
      djName: djName || 'DJ MasterMix',
      eventType: eventType || 'Otro'
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
          archived: false,
          logoSize: 'medium',
          dedicationsEnabled: false
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

  // ── SISTEMA DE CALIFICACIONES ─────────────────────────────────────────────
  // Enviar calificación (1-5 estrellas) al evento activo del DJ
  const submitRating = async ({ ownerUid, eventId, stars, comment = '' }) => {
    if (!ownerUid || !eventId) throw new Error('Faltan datos del evento.');
    if (stars < 1 || stars > 5) throw new Error('Calificación inválida.');
    const ratingsRef = ref(database, `users/${ownerUid}/events/${eventId}/ratings`);
    const newRating = { stars, comment: comment.trim(), createdAt: Date.now() };
    await push(ratingsRef, newRating);
  };

  // Escuchar calificaciones del evento activo (para el DJ Panel)
  useEffect(() => {
    if (!userBasePath || !currentEventId) return;
    const targetEventId = (currentEventId && currentEventId.startsWith('default-event'))
      ? 'default-event'
      : currentEventId;
    const ratingsRef = ref(database, `${userBasePath}/events/${targetEventId}/ratings`);
    const unsub = onValue(ratingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setRatingsData(Object.values(data));
      } else {
        setRatingsData([]);
      }
    });
    return () => unsub();
  }, [userBasePath, currentEventId]);

  // Calcular estadísticas de calificaciones
  const ratingsStats = (() => {
    if (!ratingsData.length) return { avg: 0, total: 0, dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingsData.forEach(r => { if (r.stars >= 1 && r.stars <= 5) dist[r.stars]++; });
    const total = ratingsData.length;
    const avg = ratingsData.reduce((s, r) => s + (r.stars || 0), 0) / total;
    return { avg: Math.round(avg * 10) / 10, total, dist };
  })();

  // Limpiar lista completa de peticiones activas e históricas del evento activo
  const clearActiveAndPlayedRequests = async () => {
    if (!userBasePath) throw new Error('No hay sesión activa.');
    const targetEventId = (currentEventId && currentEventId.startsWith('default-event'))
      ? 'default-event'
      : currentEventId;
    
    const requestsRef = ref(database, `${userBasePath}/events/${targetEventId}/requests`);
    const playedRef = ref(database, `${userBasePath}/events/${targetEventId}/played_requests`);
    
    await set(requestsRef, null);
    await set(playedRef, null);
    
    setRequests({});
    setPlayedRequests({});
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
        profile: {
          email,
          displayName: displayName || email.split('@')[0]
        },
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
              djName: displayName || email.split('@')[0],
              tipsEnabled: false,
              paypalUsername: '',
              mercadopagoLink: '',
              dedicationsEnabled: false
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
        profile: {
          email,
          displayName: displayName || email.split('@')[0]
        },
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
              djName: displayName || email.split('@')[0],
              tipsEnabled: false,
              paypalUsername: '',
              mercadopagoLink: '',
              dedicationsEnabled: false
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

  // Editar datos de registro DJ (solo Admin Master)
  const updateDjAccount = async (uid, newEmail, newDisplayName, newPassword) => {
    if (!isAdminMaster) {
      throw new Error('Solo el Administrador Master puede editar cuentas.');
    }
    if (isMockMode) {
      const allAccounts = JSON.parse(localStorage.getItem('mock_accounts') || '[]');
      const accountIdx = allAccounts.findIndex(a => a.uid === uid);
      if (accountIdx !== -1) {
        if (newEmail) allAccounts[accountIdx].email = newEmail;
        if (newDisplayName) allAccounts[accountIdx].displayName = newDisplayName;
        if (newPassword) allAccounts[accountIdx].password = newPassword;
        localStorage.setItem('mock_accounts', JSON.stringify(allAccounts));
      }
      
      // Actualizar también en RTDB mock
      const dbData = JSON.parse(localStorage.getItem('mock_rtdb_v2') || '{}');
      if (dbData.users && dbData.users[uid]) {
        if (!dbData.users[uid].profile) dbData.users[uid].profile = {};
        if (newEmail) dbData.users[uid].profile.email = newEmail;
        if (newDisplayName) dbData.users[uid].profile.displayName = newDisplayName;
        if (newPassword) dbData.users[uid].profile.password = newPassword;

        // También actualizar el djName del evento por defecto si existe
        if (dbData.users[uid].events_index && dbData.users[uid].events_index['default-event']) {
          dbData.users[uid].events_index['default-event'].djName = newDisplayName;
        }
        if (dbData.users[uid].events && dbData.users[uid].events['default-event'] && dbData.users[uid].events['default-event'].settings) {
          dbData.users[uid].events['default-event'].settings.djName = newDisplayName;
        }
        if (dbData.events_registry && dbData.events_registry['default-event-' + uid]) {
          dbData.events_registry['default-event-' + uid].djName = newDisplayName;
        }
      }
      localStorage.setItem('mock_rtdb_v2', JSON.stringify(dbData));

      // Sincronizar
      if (syncChannel) syncChannel.postMessage({ type: 'DB_UPDATE' });
      return;
    }

    // En Firebase real:
    const profileRef = ref(database, `users/${uid}/profile`);
    const updates = {};
    if (newEmail) updates.email = newEmail;
    if (newDisplayName) updates.displayName = newDisplayName;
    if (newPassword) updates.password = newPassword; // guardado para registro administrativo
    await update(profileRef, updates);

    // Actualizar también settings e index del default-event si es necesario
    if (newDisplayName) {
      const defaultSettingsRef = ref(database, `users/${uid}/events/default-event/settings`);
      await update(defaultSettingsRef, { djName: newDisplayName });

      const defaultIndexRef = ref(database, `users/${uid}/events_index/default-event`);
      await update(defaultIndexRef, { djName: newDisplayName });

      const registryRef = ref(database, `events_registry/default-event-${uid}`);
      await update(registryRef, { djName: newDisplayName });
    }
  };

  const getDatabaseBackup = async () => {
    if (!isAdminMaster) {
      throw new Error("No autorizado: solo el administrador master puede realizar respaldos.");
    }
    const rootRef = ref(database, '/');
    const snapshot = await get(rootRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      throw new Error("La base de datos está vacía o no se pudo obtener.");
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
      playedRequests,
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
      clearActiveAndPlayedRequests,
      updateEventSettings,
      uploadLogo,
      changeEvent,
      createNewEvent,
      deleteEvent,
      archiveEvent,
      updateEventMetadata,
      clearHistoryWithOptions,
      createDjAccount,
      updateDjAccount,
      updateActiveRequest,
      updateAutocompleteSong,
      deleteAutocompleteSong,
      getDatabaseBackup,
      submitRating,
      ratingsData,
      ratingsStats
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};
