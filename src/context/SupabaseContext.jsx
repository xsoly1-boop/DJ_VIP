import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

const SupabaseContext = createContext(null);

export const useFirebase = () => {
  return useContext(SupabaseContext);
};

export const SupabaseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentEventId, setCurrentEventId] = useState('default-event');
  const [eventSettings, setEventSettings] = useState(null);
  const [requests, setRequests] = useState({});
  const [playedRequests, setPlayedRequests] = useState({});
  const [autocompleteSongs, setAutocompleteSongs] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  
  // Soporte de Modo Mock (desconectado)
  const [isMockMode, setIsMockMode] = useState(!import.meta.env.VITE_SUPABASE_URL);

  useEffect(() => {
    if (isMockMode) {
      setAuthLoading(false);
      // Cargar datos simulados iniciales del localStorage
      const mockDb = JSON.parse(localStorage.getItem('mock_rtdb_v2') || '{}');
      setRequests(mockDb.requests || {});
      setPlayedRequests(mockDb.played_requests || {});
      return;
    }

    // Escuchar cambios de sesión de Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        // Cargar perfil del usuario
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isMockMode]);

  // Suscribirse a las peticiones del evento actual en tiempo real
  useEffect(() => {
    if (isMockMode || !currentEventId) return;

    // 1. Cargar peticiones iniciales
    const loadRequests = async () => {
      const { data: activeReqs } = await supabase
        .from('requests')
        .select('*')
        .eq('event_id', currentEventId);
      
      const reqObj = {};
      (activeReqs || []).forEach(r => {
        reqObj[r.id] = r;
      });
      setRequests(reqObj);

      const { data: playedReqs } = await supabase
        .from('played_requests')
        .select('*')
        .eq('event_id', currentEventId);
      
      const playedObj = {};
      (playedReqs || []).forEach(r => {
        playedObj[r.id] = r;
      });
      setPlayedRequests(playedObj);
    };

    loadRequests();

    // 2. Escuchar cambios en tiempo real
    const requestsChannel = supabase
      .channel(`realtime-requests-${currentEventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests', filter: `event_id=eq.${currentEventId}` }, payload => {
        setRequests(prev => {
          const updated = { ...prev };
          if (payload.eventType === 'DELETE') {
            delete updated[payload.old.id];
          } else {
            updated[payload.new.id] = payload.new;
          }
          return updated;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'played_requests', filter: `event_id=eq.${currentEventId}` }, payload => {
        setPlayedRequests(prev => {
          const updated = { ...prev };
          if (payload.eventType === 'DELETE') {
            delete updated[payload.old.id];
          } else {
            updated[payload.new.id] = payload.new;
          }
          return updated;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
    };
  }, [currentEventId, isMockMode]);

  // Acciones de Autenticación
  const loginDJ = async (email, password) => {
    if (isMockMode) {
      setUser({ id: 'mock-dj-uid', email });
      setUserProfile({ display_name: 'DJ Mock Pro', active_plan: 'premium' });
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const registerDJ = async (email, password, displayName, phone) => {
    if (isMockMode) {
      setUser({ id: 'mock-dj-uid', email });
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          phone: phone
        }
      }
    });
    if (error) throw error;
    return data;
  };

  const logoutDJ = async () => {
    if (isMockMode) {
      setUser(null);
      setUserProfile(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const recoverPassword = async (email) => {
    if (isMockMode) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  // Crear petición (Público / DJ)
  const addRequest = async (title, artist, genre, dedication, sessionId, eventOwnerUid, isRepeat = false) => {
    const cleanTitle = (title || '').trim();
    const cleanArtist = (artist || '').trim();
    const reqId = 'req-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

    if (isMockMode) {
      const mockDb = JSON.parse(localStorage.getItem('mock_rtdb_v2') || '{}');
      if (!mockDb.requests) mockDb.requests = {};
      
      const newReq = {
        id: reqId,
        event_id: currentEventId,
        title: cleanTitle || 'Tema no especificado',
        artist: cleanArtist || 'Artista no especificado',
        genre: genre || 'Personalizado',
        dedication: dedication || '',
        status: 'pending',
        votes: 1,
        timestamp: Date.now(),
        is_repeat: isRepeat
      };
      
      mockDb.requests[reqId] = newReq;
      localStorage.setItem('mock_rtdb_v2', JSON.stringify(mockDb));
      setRequests(mockDb.requests);
      return { key: reqId };
    }

    // Insertar petición y registrar el voto
    const { data, error } = await supabase
      .from('requests')
      .insert({
        id: reqId,
        event_id: currentEventId,
        title: cleanTitle || 'Tema no especificado',
        artist: cleanArtist || 'Artista no especificado',
        genre: genre || 'Personalizado',
        dedication: dedication || '',
        status: 'pending',
        votes: 1,
        timestamp: Date.now(),
        is_repeat: isRepeat
      })
      .select()
      .single();

    if (error) throw error;

    // Registrar voto inicial del cliente
    await supabase
      .from('request_voters')
      .insert({
        request_id: reqId,
        session_id: sessionId
      });

    return { key: reqId };
  };

  // Votar por una petición
  const voteRequest = async (requestId, sessionId, hasVoted, eventOwnerUid) => {
    if (isMockMode) {
      setRequests(prev => {
        const updated = { ...prev };
        if (updated[requestId]) {
          updated[requestId].votes = (updated[requestId].votes || 0) + (hasVoted ? -1 : 1);
        }
        return updated;
      });
      return;
    }

    if (hasVoted) {
      // Quitar voto
      await supabase
        .from('request_voters')
        .delete()
        .eq('request_id', requestId)
        .eq('session_id', sessionId);
      
      // Decrementar contador
      await supabase.rpc('decrement_votes', { row_id: requestId });
    } else {
      // Sumar voto
      await supabase
        .from('request_voters')
        .insert({ request_id: requestId, session_id: sessionId });
      
      await supabase.rpc('increment_votes', { row_id: requestId });
    }
  };

  const updateRequestStatus = async (requestId, status, eventOwnerUid) => {
    if (isMockMode) {
      setRequests(prev => {
        const updated = { ...prev };
        if (updated[requestId]) {
          updated[requestId].status = status;
        }
        return updated;
      });
      return;
    }

    if (status === 'played' || status === 'playing') {
      // Si pasa a reproducida, mover a played_requests
      const { data: req } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (req) {
        await supabase
          .from('played_requests')
          .insert({
            id: req.id,
            event_id: req.event_id,
            title: req.title,
            artist: req.artist,
            genre: req.genre,
            dedication: req.dedication,
            status: status,
            votes: req.votes,
            timestamp: req.timestamp,
            played_at: Date.now()
          });

        await supabase
          .from('requests')
          .delete()
          .eq('id', requestId);
      }
    } else {
      // De lo contrario actualizar status directo
      await supabase
        .from('requests')
        .update({ status })
        .eq('id', requestId);
    }
  };

  const clearActiveAndPlayedRequests = async (eventOwnerUid) => {
    if (isMockMode) {
      setRequests({});
      setPlayedRequests({});
      return;
    }
    await supabase.from('requests').delete().eq('event_id', currentEventId);
    await supabase.from('played_requests').delete().eq('event_id', currentEventId);
  };

  const updateEventSettings = async (settings, eventOwnerUid) => {
    if (isMockMode) {
      setEventSettings(prev => ({ ...prev, ...settings }));
      return;
    }
    await supabase
      .from('events')
      .update(settings)
      .eq('id', currentEventId);
  };

  const changeEvent = (eventId) => {
    setCurrentEventId(eventId);
  };

  return (
    <SupabaseContext.Provider value={{
      user,
      userProfile,
      authLoading,
      isMock: isMockMode,
      currentEventId,
      eventSettings,
      requests,
      playedRequests,
      autocompleteSongs,
      eventsList,
      loginDJ,
      registerDJ,
      logoutDJ,
      recoverPassword,
      addRequest,
      voteRequest,
      updateRequestStatus,
      clearActiveAndPlayedRequests,
      updateEventSettings,
      changeEvent
    }}>
      {children}
    </SupabaseContext.Provider>
  );
};
