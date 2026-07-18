import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

const SupabaseContext = createContext(null);

export const useFirebase = () => {
  return useContext(SupabaseContext);
};

const DEFAULT_PLANS_CONFIG = {
  free: {
    name: "Plan Demo",
    price: "0",
    billing: "6 meses",
    currency: "MXN",
    description: "La puerta de entrada al control de tus eventos. Prueba la potencia de DJVIP y experimenta la interacción en tiempo real con tu público de forma 100% gratuita.",
    maxRequests: 35,
    duration: 6,
    durationUnit: "meses",
    benefits: [
      "Acceso a la plataforma interactiva",
      "Generador de QR estándar para tu cabina",
      "Hasta 35 peticiones de canciones por evento",
      "Cola de peticiones en tiempo real para visualizar solicitudes"
    ],
    restrictions: [
      "Vigencia del plan limitada a 6 meses",
      "Límite estricto de 35 peticiones por evento",
      "Sin personalización visual (Logotipo y marca de DJVIP obligatorios)",
      "Bloqueo de limpieza y reinicio de eventos por 8 horas"
    ]
  },
  premium: {
    name: "Plan Premium",
    price: "100",
    billing: "6 meses",
    currency: "MXN",
    description: "Lleva tus eventos al siguiente nivel con mayores límites y personalización. Ideal para DJs profesionales que quieren destacar su marca personal.",
    maxRequests: 80,
    duration: 6,
    durationUnit: "meses",
    benefits: [
      "Todo lo incluido en el Plan Demo",
      "Hasta 80 peticiones de canciones por evento",
      "Personalización de Marca (Vincula tu logotipo mediante URL externa)",
      "Acceso a QR personalizado con estilos avanzados",
      "Soporte estándar vía correo electrónico"
    ],
    restrictions: [
      "No permite subir imágenes locales para el logotipo (requiere URL externa)",
      "Bloqueo de limpieza y reinicio de eventos por 8 horas"
    ]
  },
  vip: {
    name: "Plan VIP",
    price: "200",
    billing: "6 meses",
    currency: "MXN",
    description: "La experiencia definitiva de personalización e interacción ilimitada. Diseñado para DJs de élite y eventos masivos que exigen el máximo rendimiento sin límites.",
    maxRequests: 0,
    duration: 6,
    durationUnit: "meses",
    benefits: [
      "Todo lo incluido en el Plan Premium",
      "Peticiones de canciones ILIMITADAS (sin tope por evento)",
      "Personalización Completa de Marca (Nombre, tipografías y tamaños en pantalla)",
      "Descarga de respaldos y listas de reproducción del evento en tiempo real",
      "Soporte prioritario y rápido"
    ],
    restrictions: [
      "La subida directa de logotipo local (Opción A) requiere habilitación de seguridad por el Admin Master"
    ]
  },
  pro: {
    name: "Plan PRO",
    price: "450",
    billing: "12 meses",
    currency: "MXN",
    description: "La herramienta definitiva para productoras de eventos, discotecas y agencias que gestionan múltiples cabinas y DJs en paralelo.",
    maxRequests: 0,
    duration: 12,
    durationUnit: "meses",
    benefits: [
      "Se el primero en recibir y probar todas las novedades y actualizaciones.",
      "Multieventos activos y simultáneos en paralelo",
      "Soporte VIP dedicado con asistencia prioritaria 24/7",
      "Reportes estadísticos y analíticas avanzadas del comportamiento del público",
      "Personalización multi-marca para diferentes DJs"
    ],
    restrictions: [
      "Ninguna"
    ]
  },
  pro_1d: {
    name: "Pro x 1 Día",
    price: "0",
    billing: "24 horas",
    currency: "MXN",
    description: "Prueba el poder total del Plan PRO durante 24 horas. Disfruta de multieventos y todas las herramientas exclusivas sin límites por un día entero.",
    maxRequests: 0,
    duration: 24,
    durationUnit: "horas",
    benefits: [
      "Todos los beneficios del Plan PRO por 24 horas",
      "Multieventos activos y simultáneos en paralelo",
      "Soporte VIP dedicado con asistencia prioritaria 24/7",
      "Reportes estadísticos y analíticas avanzadas del comportamiento del público",
      "Personalización de marca al 100% y logotipos ilimitados"
    ],
    restrictions: [
      "Vigencia estricta de 24 horas",
      "Disponible para contratar solo una vez por usuario"
    ]
  },
  bonus: {
    name: "Plan Bonus (Extra)",
    price: "50",
    billing: "30 días",
    currency: "MXN",
    description: "El potenciador ideal para tus eventos especiales. Añade peticiones adicionales de forma inmediata a tus planes activos sin cambiar de suscripción.",
    maxRequests: 0,
    duration: 30,
    durationUnit: "días",
    benefits: [
      "+15 peticiones adicionales por evento para usuarios del Plan Demo",
      "+20 peticiones adicionales por evento para usuarios del Plan Premium",
      "Suma acumulativa e inmediata sobre tus límites actuales",
      "Activación instantánea y vigencia extendida de 30 días naturales"
    ],
    restrictions: [
      "Vigencia del plan limitada a 30 días",
      "Disponible para contratar en cualquier momento"
    ]
  }
};

const mapSupabaseProfileToFirebase = (profile) => {
  if (!profile) return null;
  return {
    ...profile,
    activePlan: profile.active_plan || 'free',
    subscriptionStatus: profile.subscription_status || 'inactive',
    createdAt: profile.created_at ? new Date(profile.created_at).getTime() : null,
    expiresAt: profile.expires_at ? new Date(profile.expires_at).getTime() : null,
    extraRequests: profile.extra_requests || 0,
    extraRequestsExpiresAt: profile.extra_requests_expires_at || null,
    demoLimit: profile.demo_limit || 35,
    premiumLimit: profile.premium_limit || 80,
    strictLimitEnabled: profile.strict_limit_enabled !== undefined ? profile.strict_limit_enabled : true,
    displayName: profile.display_name || '',
    email: profile.email || ''
  };
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
  const [plansConfig, setPlansConfig] = useState(DEFAULT_PLANS_CONFIG);
  
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
        
        setUserProfile(mapSupabaseProfileToFirebase(profile));
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

  // Suscribirse a cambios en tiempo real del perfil del usuario
  useEffect(() => {
    if (isMockMode || !user?.id) return;

    const profileChannel = supabase
      .channel(`realtime-profile-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, payload => {
        if (payload.new) {
          setUserProfile(mapSupabaseProfileToFirebase(payload.new));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user?.id, isMockMode]);

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

  const selectPlan = async (planName) => {
    if (isMockMode) {
      setUserProfile(prev => ({
        ...prev,
        activePlan: planName,
        subscriptionStatus: planName === 'free' ? 'free' : 'pending_payment'
      }));
      return;
    }
    
    if (!user?.id) return;

    const currentActivePlan = userProfile?.activePlan || 'free';

    // Regla del Plan Bonus (Extra): es un add-on independiente
    if (planName === 'bonus') {
      if (currentActivePlan !== 'free' && currentActivePlan !== 'premium') {
        throw new Error('El plan Bonus es un complemento exclusivo para cuentas de Plan Demo o Plan Premium.');
      }
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'pending_payment'
        })
        .eq('id', user.id);
      if (error) throw error;
      return;
    }

    // Prevenir downgrade del plan contratado
    const planWeights = {
      'free': 0,
      'eventual': 1,
      'premium': 2,
      'vip': 3,
      'pro_1d': 3.5,
      'pro': 4
    };

    const selectedWeight = planWeights[planName] !== undefined ? planWeights[planName] : -1;
    const currentWeight = planWeights[currentActivePlan] !== undefined ? planWeights[currentActivePlan] : 0;

    // REGLA ESTRICTA: Si la cuenta tiene una suscripción de pago (premium, vip, eventual),
    // está estrictamente prohibido cambiarse al plan Demo (free).
    const isCurrentPaid = currentActivePlan !== 'free';
    if (isCurrentPaid && planName === 'free') {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: currentActivePlan
        })
        .eq('id', user.id);
      if (error) throw error;
      return;
    }

    if (selectedWeight <= currentWeight) {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: currentActivePlan
        })
        .eq('id', user.id);
      if (error) throw error;
      return;
    }

    const planConfig = DEFAULT_PLANS_CONFIG[planName];
    const price = planConfig ? parseFloat(planConfig.price) : 0;
    
    let updates = {};
    
    if (price === 0 || planName === 'free') {
      // El plan es gratuito o es el plan Demo, activarlo inmediatamente
      const duration = planConfig ? parseInt(planConfig.duration, 10) || 0 : 0;
      const durationUnit = planConfig ? planConfig.durationUnit || 'meses' : 'meses';
      
      let msToAdd = 0;
      if (duration > 0) {
        if (durationUnit === 'hours' || durationUnit === 'horas') {
          msToAdd = duration * 60 * 60 * 1000;
        } else if (durationUnit === 'days' || durationUnit === 'días') {
          msToAdd = duration * 24 * 60 * 60 * 1000;
        } else if (durationUnit === 'months' || durationUnit === 'meses') {
          msToAdd = duration * 30 * 24 * 60 * 60 * 1000;
        } else {
          msToAdd = duration * 24 * 60 * 60 * 1000;
        }
      }
      
      updates.subscription_status = planName === 'free' ? 'free' : planName;
      updates.active_plan = planName;
      updates.expires_at = msToAdd > 0 ? new Date(Date.now() + msToAdd).toISOString() : null;
    } else {
      // Plan de cobro -> mandar a pasarela
      updates.subscription_status = 'pending_payment';
    }
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
      
    if (error) throw error;
  };

  const cancelPlanSelection = async () => {
    if (isMockMode) return;
    if (!user?.id) return;
    const currentActivePlan = userProfile?.activePlan || 'free';
    
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: currentActivePlan
      })
      .eq('id', user.id);
      
    if (error) throw error;
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
      plansConfig,
      loginDJ,
      registerDJ,
      logoutDJ,
      recoverPassword,
      addRequest,
      voteRequest,
      updateRequestStatus,
      clearActiveAndPlayedRequests,
      updateEventSettings,
      selectPlan,
      cancelPlanSelection,
      changeEvent
    }}>
      {children}
    </SupabaseContext.Provider>
  );
};
