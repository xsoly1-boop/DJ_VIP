import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, supabaseAdmin } from '../supabase';

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
    ...(profile.custom_settings || {}),
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

// Mapper: convierte fila snake_case de Supabase → camelCase que usa el dashboard
const mapSupabaseEvent = (ev) => ({
  ...ev,
  djName: ev.dj_name || '',
  eventType: ev.event_type || 'Otro',
  date: ev.event_date || '',
  logoUrl: ev.logo_url || '',
  themeColor: ev.theme_color || '#7c3aed',
  themeColorSecondary: ev.theme_color_secondary || '#06b6d4',
  webName: ev.web_name || 'DJ a la Carta',
  tipsEnabled: ev.tips_enabled || false,
  paypalUsername: ev.paypal_username || '',
  mercadopagoLink: ev.mercadopago_link || '',
  promoEnabled: ev.promo_enabled || false,
  promoWhatsapp: ev.promo_whatsapp || '',
  promoWebsite: ev.promo_website || '',
  promoInstagram: ev.promo_instagram || '',
  promoTiktok: ev.promo_tiktok || '',
  productionUrl: ev.production_url || '',
  customGenres: ev.custom_genres || '',
  createdAt: ev.created_at ? new Date(ev.created_at).getTime() : 0,
  fontFamily: ev.font_family || 'Outfit',
  logoSize: ev.logo_size || 'medium',
  dedicationsEnabled: ev.dedications_enabled || false,
  bankClabe: ev.bank_clabe || '',
  tipCurrency: ev.tip_currency || 'MXN',
  strictModeEnabled: ev.strict_mode_enabled !== false
});

// Helper: mapea configuración camelCase de Firebase → columnas snake_case de Supabase
const mapFirebaseEventToSupabase = (settings) => {
  const mapped = {};
  if (settings.title !== undefined) mapped.title = settings.title;
  if (settings.djName !== undefined) mapped.dj_name = settings.djName;
  if (settings.webName !== undefined) mapped.web_name = settings.webName;
  if (settings.date !== undefined) mapped.event_date = settings.date;
  if (settings.themeColor !== undefined) mapped.theme_color = settings.themeColor;
  if (settings.themeColorSecondary !== undefined) mapped.theme_color_secondary = settings.themeColorSecondary;
  if (settings.productionUrl !== undefined) mapped.production_url = settings.productionUrl;
  if (settings.fontFamily !== undefined) mapped.font_family = settings.fontFamily;
  if (settings.logoSize !== undefined) mapped.logo_size = settings.logoSize;
  if (settings.tipsEnabled !== undefined) mapped.tips_enabled = settings.tipsEnabled;
  if (settings.paypalUsername !== undefined) mapped.paypal_username = settings.paypalUsername;
  if (settings.mercadopagoLink !== undefined) mapped.mercadopago_link = settings.mercadopagoLink;
  if (settings.bankClabe !== undefined) mapped.bank_clabe = settings.bankClabe;
  if (settings.tipCurrency !== undefined) mapped.tip_currency = settings.tipCurrency;
  if (settings.dedicationsEnabled !== undefined) mapped.dedications_enabled = settings.dedicationsEnabled;
  if (settings.customGenres !== undefined) mapped.custom_genres = settings.customGenres;
  if (settings.logoUrl !== undefined) mapped.logo_url = settings.logoUrl;
  if (settings.promoEnabled !== undefined) mapped.promo_enabled = settings.promoEnabled;
  if (settings.promoWhatsapp !== undefined) mapped.promo_whatsapp = settings.promoWhatsapp;
  if (settings.promoWebsite !== undefined) mapped.promo_website = settings.promoWebsite;
  if (settings.promoInstagram !== undefined) mapped.promo_instagram = settings.promoInstagram;
  if (settings.promoTiktok !== undefined) mapped.promo_tiktok = settings.promoTiktok;
  return mapped;
};

const DEFAULT_EVENT_SETTINGS = {
  title: 'Mi Gran Evento VIP',
  logoUrl: '',
  themeColor: '#7c3aed',
  themeColorSecondary: '#06b6d4',
  djName: 'No registrado',
  webName: 'DJ a la Carta',
  eventType: 'Otro',
  fontFamily: 'Outfit',
  fontSize: 'medium',
  logoSize: 'medium',
  tipsEnabled: false,
  paypalUsername: '',
  mercadopagoLink: '',
  dedicationsEnabled: false
};

export const SupabaseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentEventId, setCurrentEventId] = useState('default-event');
  const [eventSettings, setEventSettings] = useState(DEFAULT_EVENT_SETTINGS);
  const [requests, setRequests] = useState({});
  const [playedRequests, setPlayedRequests] = useState({});
  const [autocompleteSongs, setAutocompleteSongs] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [plansConfig, setPlansConfig] = useState(DEFAULT_PLANS_CONFIG);
  // Soporte de Modo Mock (desconectado)
  const [isMockMode, setIsMockMode] = useState(!import.meta.env.VITE_SUPABASE_URL);
  
  const isAdminMaster = user?.email === 'dj@admin.com';

  // ── ESTADOS Y STUBS DE ADMIN PARA DJDASHBOARD ──
  const [allUsersData, setAllUsersData] = useState({});
  const [allSuggestions, setAllSuggestions] = useState({});
  const [allEventsData, setAllEventsData] = useState({});
  const [twilioConfig, setTwilioConfig] = useState({});
  const [ratingsStats, setRatingsStats] = useState({});
  const [revenueResetTimestamp, setRevenueResetTimestamp] = useState(null);
  const [impersonatingUid, setImpersonatingUid] = useState(null);

  const activeUid = impersonatingUid || user?.id;

  const impersonateUser = (uid) => {
    setImpersonatingUid(uid);
    setCurrentEventId('default-event');
  };
  const stopImpersonating = () => {
    setImpersonatingUid(null);
    setCurrentEventId('default-event');
  };

  const updateActiveRequest = async () => {};
  const updateAutocompleteSong = async (songId, songData) => {
    if (isMockMode) return;
    await supabase.from('autocomplete_songs').upsert({ id: songId, ...songData });
  };
  const deleteAutocompleteSong = async (songId) => {
    if (isMockMode) return;
    await supabase.from('autocomplete_songs').delete().eq('id', songId);
  };

  const deleteEvent = async (eventId) => {
    if (isMockMode) return;
    await supabase.from('events').delete().eq('id', eventId);
  };
  const archiveEvent = async (eventId, archived = true) => {
    if (isMockMode) return;
    await supabase.from('events').update({ archived }).eq('id', eventId);
  };
  const updateEventMetadata = async (eventId, title, djName, date, eventType, logoUrl = null, logoSize = null) => {
    if (isMockMode) return;
    const updates = {
      title: title || 'Mi Gran Evento VIP',
      dj_name: djName || 'No registrado',
      event_date: date || null,
      event_type: eventType || 'Otro',
    };
    if (logoUrl !== null) updates.logo_url = logoUrl;
    if (logoSize !== null) updates.logo_size = logoSize;
    const targetId = eventId === 'default-event' ? `default-event-${activeUid}` : eventId;
    await supabase.from('events').update(updates).eq('id', targetId);
  };

  const clearHistoryWithOptions = async (options) => {
    if (isMockMode) {
      if (options.songs) {
        setRequests({});
        setPlayedRequests({});
      }
      return;
    }

    const targetEventDbId = currentEventId === 'default-event' ? `default-event-${activeUid}` : currentEventId;

    if (options.songs) {
      await supabase.from('requests').delete().eq('event_id', targetEventDbId);
      await supabase.from('played_requests').delete().eq('event_id', targetEventDbId);
    }

    if (options.genres) {
      // Resetear géneros a 'Personalizado' en peticiones activas
      const { data: activeReqs } = await supabase
        .from('requests')
        .select('id')
        .eq('event_id', targetEventDbId);
      if (activeReqs && activeReqs.length > 0) {
        const ids = activeReqs.map(r => r.id);
        await supabase.from('requests').update({ genre: 'Personalizado' }).in('id', ids);
      }
      // Resetear géneros en autocompletado del usuario activo
      const { data: userSongs } = await supabase
        .from('autocomplete_songs')
        .select('id')
        .eq('owner_id', activeUid);
      if (userSongs && userSongs.length > 0) {
        const ids = userSongs.map(s => s.id);
        await supabase.from('autocomplete_songs').update({ genre: 'Personalizado' }).in('id', ids);
      }
    }

    if (options.artists) {
      const { data: activeReqs } = await supabase
        .from('requests')
        .select('id')
        .eq('event_id', targetEventDbId);
      if (activeReqs && activeReqs.length > 0) {
        const ids = activeReqs.map(r => r.id);
        await supabase.from('requests').update({ artist: 'Artista no especificado' }).in('id', ids);
      }
    }

    if (options.dedications) {
      const { data: activeReqs } = await supabase
        .from('requests')
        .select('id')
        .eq('event_id', targetEventDbId);
      if (activeReqs && activeReqs.length > 0) {
        const ids = activeReqs.map(r => r.id);
        await supabase.from('requests').update({ dedication: '' }).in('id', ids);
      }
    }
  };
  const createDjAccount = async (email, password, displayName) => {
    if (!isAdminMaster) {
      throw new Error('Solo el Administrador Master puede crear cuentas.');
    }
    if (!supabaseAdmin) {
      throw new Error('Supabase Service Role Key no configurada.');
    }

    // 1. Crear el usuario en Supabase Auth
    const { data: { user: newUser }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName }
    });

    if (authError) throw authError;

    // 2. Insertar perfil en profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.id,
        email,
        display_name: displayName || email.split('@')[0],
        active_plan: 'free',
        subscription_status: 'free',
        strict_limit_enabled: true,
        logo_upload_enabled: false
      });

    if (profileError) {
      // Intentar limpiar el auth user si falla
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      throw profileError;
    }

    // 3. Crear el evento por defecto en events
    const defaultEventId = `default-event-${newUser.id}`;
    const { error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        id: defaultEventId,
        owner_id: newUser.id,
        title: 'Mi Gran Evento VIP',
        dj_name: displayName || email.split('@')[0],
        active: true,
        theme_color: '#7c3aed',
        theme_color_secondary: '#06b6d4',
        web_name: 'DJ a la Carta',
        event_type: 'Otro',
        tips_enabled: false
      });

    if (eventError) {
      console.error("Error creating default event for new DJ:", eventError.message);
    }

    return { uid: newUser.id, email, displayName: displayName || email.split('@')[0] };
  };

  const updateDjAccount = async (uid, newEmail, newDisplayName, newPassword, newPlan, demoLimit, strictLimitEnabled, premiumLimit, logoUploadEnabled) => {
    if (!isAdminMaster) {
      throw new Error('Solo el Administrador Master puede editar cuentas.');
    }
    if (!supabaseAdmin) {
      throw new Error('Supabase Service Role Key no configurada.');
    }

    // 1. Actualizar credenciales en Supabase Auth
    const authUpdates = {};
    if (newEmail) authUpdates.email = newEmail;
    if (newPassword) authUpdates.password = newPassword;
    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(uid, authUpdates);
      if (authError) throw authError;
    }

    // 2. Actualizar campos en el perfil
    const profileUpdates = {
      display_name: newDisplayName,
      active_plan: newPlan,
      subscription_status: newPlan,
      demo_limit: parseInt(demoLimit, 10) || 35,
      strict_limit_enabled: strictLimitEnabled !== false,
      premium_limit: parseInt(premiumLimit, 10) || 80,
      logo_upload_enabled: logoUploadEnabled === true
    };
    if (newEmail) profileUpdates.email = newEmail;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', uid);

    if (profileError) throw profileError;
  };
  const updateDjOwnProfile = async (updates) => {
    if (!activeUid) return;
    if (isMockMode) return;

    // Obtener perfil actual para mezclar custom_settings
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('custom_settings')
      .eq('id', activeUid)
      .maybeSingle();

    const existingCustom = currentProfile?.custom_settings || {};
    const dbUpdates = {};
    const newCustom = { ...existingCustom };

    // Mapear cada campo a columna o a custom_settings
    Object.keys(updates).forEach(key => {
      const val = updates[key];
      if (key === 'displayName') {
        dbUpdates.display_name = val;
      } else if (key === 'email') {
        dbUpdates.email = val;
      } else if (key === 'strictLimitEnabled') {
        dbUpdates.strict_limit_enabled = val;
      } else if (key === 'logoUploadEnabled') {
        dbUpdates.logo_upload_enabled = val;
      } else {
        newCustom[key] = val;
      }
    });

    dbUpdates.custom_settings = newCustom;

    await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', activeUid);
  };

  const updateAdminProfile = async (alias, whatsapp, callmebotApiKey) => {
    if (!user) throw new Error("Debes iniciar sesión.");
    if (!isAdminMaster) throw new Error("Acceso denegado: Solo el administrador master puede realizar esta acción.");
    
    await updateDjOwnProfile({
      displayName: alias,
      whatsapp: whatsapp || '',
      callmebotApiKey: callmebotApiKey || ''
    });
  };

  const updateTwilioConfig = async (config) => {
    if (!isAdminMaster) throw new Error("Acceso denegado: Solo el administrador master puede realizar esta acción.");
    if (isMockMode) {
      setTwilioConfig(config);
      return;
    }
    
    // Obtener perfil de admin actual
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('custom_settings')
      .eq('email', 'dj@admin.com')
      .maybeSingle();

    const custom = adminProfile?.custom_settings || {};
    custom.twilio = config;

    await supabase
      .from('profiles')
      .update({ custom_settings: custom })
      .eq('email', 'dj@admin.com');

    setTwilioConfig(config);
  };

  const uploadLogo = async (file) => {
    if (isMockMode) return "";
    const fileExt = file.name.split('.').pop();
    const filePath = `logos/${activeUid}_${currentEventId}_logo_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    await updateEventSettings({ logoUrl: publicUrl });
    return publicUrl;
  };
  const getDatabaseBackup = async () => {
    if (!isAdminMaster || impersonatingUid) {
      throw new Error("No autorizado: solo el administrador master puede realizar respaldos.");
    }
    if (!supabaseAdmin) throw new Error("Supabase Service Role Key no configurada.");

    const [r1, r2, r3, r4, r5] = await Promise.all([
      supabaseAdmin.from('profiles').select('*'),
      supabaseAdmin.from('events').select('*'),
      supabaseAdmin.from('requests').select('*'),
      supabaseAdmin.from('played_requests').select('*'),
      supabaseAdmin.from('autocomplete_songs').select('*')
    ]);

    return {
      timestamp: new Date().toISOString(),
      profiles: r1.data || [],
      events: r2.data || [],
      requests: r3.data || [],
      played_requests: r4.data || [],
      autocomplete_songs: r5.data || []
    };
  };

  const deleteSuggestion = async (suggestionId) => {
    if (!isAdminMaster || impersonatingUid) {
      throw new Error("Acceso denegado: Solo el administrador master puede realizar esta acción.");
    }
    if (isMockMode) return;
    await supabase.from('suggestions').delete().eq('id', suggestionId);
  };

  const updatePlansConfig = async (newPlansConfig) => {
    if (!isAdminMaster) throw new Error("Acceso denegado: Solo el administrador master puede realizar esta acción.");
    if (isMockMode) {
      setPlansConfig(newPlansConfig);
      return;
    }
    // Guardar la configuración de planes en custom_settings del admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('custom_settings')
      .eq('email', 'dj@admin.com')
      .maybeSingle();

    const custom = adminProfile?.custom_settings || {};
    custom.plans_config = newPlansConfig;

    const { error } = await supabase
      .from('profiles')
      .update({ custom_settings: custom })
      .eq('email', 'dj@admin.com');

    if (error) throw error;
    setPlansConfig(newPlansConfig);
  };
  const sendSupportMessage = async (userUid, text) => {
    if (!user) throw new Error("Debes iniciar sesión para chatear.");
    const senderId = impersonatingUid || user.id;
    const isSenderAdmin = senderId === 'uid-admin-master' || user.email === 'dj@admin.com';
    const finalSenderId = isSenderAdmin ? 'uid-admin-master' : senderId;
    
    let senderName = "DJ";
    if (isSenderAdmin) {
      senderName = "Soporte (Admin)";
    } else {
      senderName = userProfile?.displayName || user.email?.split('@')[0] || "DJ PRO";
    }

    const messageTimestamp = Date.now();

    // 1. Obtener o crear cabecera del chat de soporte
    let { data: chat } = await supabase
      .from('support_chats')
      .select('id, unread_count_by_admin, unread_count_by_user')
      .eq('user_id', userUid)
      .maybeSingle();

    if (!chat) {
      const { data: newChat, error: chatError } = await supabase
        .from('support_chats')
        .insert({
          user_id: userUid,
          unread_count_by_admin: isSenderAdmin ? 0 : 1,
          unread_count_by_user: isSenderAdmin ? 1 : 0,
          last_message: text,
          last_timestamp: messageTimestamp
        })
        .select()
        .single();
      if (chatError) throw chatError;
      chat = newChat;
    } else {
      const unread_count_by_admin = isSenderAdmin ? 0 : (chat.unread_count_by_admin || 0) + 1;
      const unread_count_by_user = isSenderAdmin ? (chat.unread_count_by_user || 0) + 1 : 0;
      
      const { error: updateError } = await supabase
        .from('support_chats')
        .update({
          unread_count_by_admin,
          unread_count_by_user,
          last_message: text,
          last_timestamp: messageTimestamp
        })
        .eq('id', chat.id);
      if (updateError) throw updateError;
    }

    // 2. Insertar el mensaje
    const { error: msgError } = await supabase
      .from('support_messages')
      .insert({
        chat_id: chat.id,
        sender_id: finalSenderId,
        sender_name: senderName,
        text,
        timestamp: messageTimestamp
      });
    if (msgError) throw msgError;

    // 3. Notificación de CallMeBot Whatsapp (opcional si el remitente no es admin)
    if (!isSenderAdmin) {
      try {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('custom_settings')
          .eq('email', 'dj@admin.com')
          .maybeSingle();
        
        const adminSettings = adminProfile?.custom_settings || {};
        if (adminSettings.whatsapp && adminSettings.callmebotApiKey) {
          const msg = `💬 Soporte PRO: El DJ "${senderName}" escribió:\n"${text}"`;
          const url = `https://api.callmebot.com/whatsapp.php?phone=${adminSettings.whatsapp.trim()}&text=${encodeURIComponent(msg)}&apikey=${adminSettings.callmebotApiKey.trim()}`;
          fetch(url).catch(e => console.error("Error en CallMeBot real:", e));
        }
      } catch (err) {
        console.error("Error al enviar notificación de WhatsApp:", err);
      }
    }
  };

  const markSupportChatAsRead = async (userUid, readerType) => {
    if (isMockMode) return;
    const updates = {};
    if (readerType === 'admin') {
      updates.unread_count_by_admin = 0;
    } else {
      updates.unread_count_by_user = 0;
    }
    await supabase
      .from('support_chats')
      .update(updates)
      .eq('user_id', userUid);
  };

  const subscribeToSupportChat = (userUid, callback) => {
    if (isMockMode) {
      return () => {};
    }

    let activeChannel = null;

    const loadChatData = async () => {
      const { data: chatHeader } = await supabase
        .from('support_chats')
        .select('*')
        .eq('user_id', userUid)
        .maybeSingle();

      if (!chatHeader) {
        callback({ metadata: {}, messages: [] });
        return;
      }

      const { data: dbMsgs } = await supabase
        .from('support_messages')
        .select('*')
        .eq('chat_id', chatHeader.id)
        .order('timestamp', { ascending: true });

      const mappedMetadata = {
        djName: chatHeader.dj_name || "DJ PRO",
        lastMessage: chatHeader.last_message || "",
        lastTimestamp: Number(chatHeader.last_timestamp || 0),
        unreadCountByAdmin: chatHeader.unread_count_by_admin || 0,
        unreadCountByUser: chatHeader.unread_count_by_user || 0
      };

      const mappedMessages = (dbMsgs || []).map(m => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        text: m.text,
        timestamp: Number(m.timestamp)
      }));

      callback({ metadata: mappedMetadata, messages: mappedMessages });

      if (!activeChannel) {
        activeChannel = supabase
          .channel(`support-messages-${chatHeader.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages', filter: `chat_id=eq.${chatHeader.id}` }, () => {
            loadChatData();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'support_chats', filter: `id=eq.${chatHeader.id}` }, () => {
            loadChatData();
          })
          .subscribe();
      }
    };

    loadChatData();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  };

  const subscribeToAllSupportChats = (callback) => {
    if (isMockMode) {
      return () => {};
    }

    let activeChannel = null;

    const loadAllChats = async () => {
      const { data: chats } = await supabase
        .from('support_chats')
        .select('*');

      // Buscar nombres reales de DJs desde profiles para los chats
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name');

      const namesMap = {};
      (profiles || []).forEach(p => {
        namesMap[p.id] = p.display_name;
      });

      const allChatsMap = {};
      (chats || []).forEach(c => {
        allChatsMap[c.user_id] = {
          metadata: {
            djName: namesMap[c.user_id] || c.dj_name || "DJ PRO",
            lastMessage: c.last_message || "",
            lastTimestamp: Number(c.last_timestamp || 0),
            unreadCountByAdmin: c.unread_count_by_admin || 0,
            unreadCountByUser: c.unread_count_by_user || 0
          },
          messages: []
        };
      });

      callback(allChatsMap);

      if (!activeChannel) {
        activeChannel = supabase
          .channel('support-all-chats')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'support_chats' }, () => {
            loadAllChats();
          })
          .subscribe();
      }
    };

    loadAllChats();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  };
  const submitFeedback = async (text, rating, sessionId) => {
    if (isMockMode) return;
    if (!activeUid) return;
    const targetEventDbId = currentEventId === 'default-event' ? `default-event-${activeUid}` : currentEventId;
    await supabase.from('ratings').upsert({
      event_id: targetEventDbId,
      session_id: sessionId || 'anon',
      text: text || '',
      rating: rating || 5,
      timestamp: Date.now()
    }, { onConflict: 'event_id,session_id' });
  };

  const refreshAdminData = async () => {
    if (!isAdminMaster) return;
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('*');

    const { data: allEvents, error: eventsError } = await supabase
      .from('events')
      .select('*');

    if (!profError && profiles) {
      const eventsByOwner = {};
      if (!eventsError && allEvents) {
        allEvents.forEach(e => {
          if (!eventsByOwner[e.owner_id]) eventsByOwner[e.owner_id] = {};
          eventsByOwner[e.owner_id][e.id] = {
            id: e.id,
            title: e.title || 'Evento',
            active: e.active || false,
            djName: e.dj_name || 'DJ'
          };
        });
      }
      const usersObj = {};
      profiles.forEach(p => {
        usersObj[p.id] = {
          profile: mapSupabaseProfileToFirebase(p),
          events: {},
          events_index: eventsByOwner[p.id] || {}
        };
      });
      setAllUsersData(usersObj);
    }
  };

  // Sincronizar userProfile con el activeUid (admite impersonación)
  useEffect(() => {
    if (isMockMode) return;
    if (!activeUid) {
      setUserProfile(null);
      return;
    }

    const fetchActiveProfile = async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUid)
        .single();
      
      if (!error && profile) {
        setUserProfile(mapSupabaseProfileToFirebase(profile));
      }
    };

    fetchActiveProfile();

    // Escuchar en tiempo real cambios del perfil activo
    const profileChannel = supabase
      .channel(`realtime-active-profile-${activeUid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${activeUid}` }, (payload) => {
        if (payload.new) {
          setUserProfile(mapSupabaseProfileToFirebase(payload.new));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [activeUid, isMockMode]);

  // Cargar lista de eventos del DJ activo (admite impersonación)
  useEffect(() => {
    if (isMockMode) return;
    if (!activeUid) {
      setEventsList([]);
      return;
    }

    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('owner_id', activeUid);
      
      if (!error && data) {
        setEventsList(data.map(mapSupabaseEvent));
      }
    };

    fetchEvents();

    const eventsChannel = supabase
      .channel(`realtime-events-list-${activeUid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `owner_id=eq.${activeUid}` }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
    };
  }, [activeUid, isMockMode]);

  // Cargar configuración del evento activo (admite impersonación)
  useEffect(() => {
    if (isMockMode) return;
    if (!activeUid || !currentEventId) {
      setEventSettings(DEFAULT_EVENT_SETTINGS);
      return;
    }

    const targetEventDbId = currentEventId === 'default-event' ? `default-event-${activeUid}` : currentEventId;

    const fetchEventSettings = async () => {
      const { data: eventRow, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', targetEventDbId)
        .single();
      
      if (!error && eventRow) {
        setEventSettings({
          title: eventRow.title || 'Mi Gran Evento VIP',
          logoUrl: eventRow.logo_url || '',
          themeColor: eventRow.theme_color || '#7c3aed',
          themeColorSecondary: eventRow.theme_color_secondary || '#06b6d4',
          djName: eventRow.dj_name || 'No registrado',
          webName: eventRow.web_name || 'DJ a la Carta',
          eventType: eventRow.event_type || 'Otro',
          date: eventRow.event_date || '',
          tipsEnabled: eventRow.tips_enabled || false,
          paypalUsername: eventRow.paypal_username || '',
          mercadopagoLink: eventRow.mercadopago_link || '',
          bankClabe: eventRow.bank_clabe || '',
          tipCurrency: eventRow.tip_currency || 'MXN',
          promoEnabled: eventRow.promo_enabled || false,
          promoWhatsapp: eventRow.promo_whatsapp || '',
          promoWebsite: eventRow.promo_website || '',
          promoInstagram: eventRow.promo_instagram || '',
          promoTiktok: eventRow.promo_tiktok || '',
          productionUrl: eventRow.production_url || '',
          customGenres: eventRow.custom_genres || '',
          fontFamily: eventRow.font_family || 'Outfit',
          logoSize: eventRow.logo_size || 'medium',
          dedicationsEnabled: eventRow.dedications_enabled || false,
          strictModeEnabled: eventRow.strict_mode_enabled !== false
        });
      } else if (error && error.code === 'PGRST116') {
        const defaultEventRow = {
          id: targetEventDbId,
          owner_id: activeUid,
          title: 'Mi Gran Evento VIP',
          dj_name: 'No registrado',
          active: true,
          theme_color: '#7c3aed',
          theme_color_secondary: '#06b6d4',
          web_name: 'DJ a la Carta',
          event_type: 'Otro',
          tips_enabled: false
        };
        await supabase.from('events').insert(defaultEventRow);
        setEventSettings(defaultEventRow);
      }
    };

    fetchEventSettings();

    const settingsChannel = supabase
      .channel(`realtime-event-settings-${targetEventDbId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `id=eq.${targetEventDbId}` }, (payload) => {
        if (payload.new) {
          const newRow = payload.new;
          setEventSettings({
            title: newRow.title || 'Mi Gran Evento VIP',
            logoUrl: newRow.logo_url || '',
            themeColor: newRow.theme_color || '#7c3aed',
            themeColorSecondary: newRow.theme_color_secondary || '#06b6d4',
            djName: newRow.dj_name || 'No registrado',
            webName: newRow.web_name || 'DJ a la Carta',
            eventType: newRow.event_type || 'Otro',
            date: newRow.event_date || '',
            tipsEnabled: newRow.tips_enabled || false,
            paypalUsername: newRow.paypal_username || '',
            mercadopagoLink: newRow.mercadopago_link || '',
            bankClabe: newRow.bank_clabe || '',
            tipCurrency: newRow.tip_currency || 'MXN',
            promoEnabled: newRow.promo_enabled || false,
            promoWhatsapp: newRow.promo_whatsapp || '',
            promoWebsite: newRow.promo_website || '',
            promoInstagram: newRow.promo_instagram || '',
            promoTiktok: newRow.promo_tiktok || '',
            productionUrl: newRow.production_url || '',
            customGenres: newRow.custom_genres || '',
            fontFamily: newRow.font_family || 'Outfit',
            logoSize: newRow.logo_size || 'medium',
            dedicationsEnabled: newRow.dedications_enabled || false,
            strictModeEnabled: newRow.strict_mode_enabled !== false
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, [activeUid, currentEventId, isMockMode]);

  // Cargar todos los perfiles si el usuario es Admin Master
  useEffect(() => {
    if (isMockMode) return;
    if (!isAdminMaster) {
      setAllUsersData({});
      return;
    }

    const fetchAllProfiles = async () => {
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*');
      
      const { data: allEvents, error: eventsError } = await supabase
        .from('events')
        .select('*');
      
      if (!profError && profiles) {
        const eventsByOwner = {};
        if (!eventsError && allEvents) {
          allEvents.forEach(e => {
            if (!eventsByOwner[e.owner_id]) {
              eventsByOwner[e.owner_id] = {};
            }
            eventsByOwner[e.owner_id][e.id] = {
              id: e.id,
              title: e.title || 'Evento',
              active: e.active || false,
              djName: e.dj_name || 'DJ'
            };
          });
        }

        const usersObj = {};
        profiles.forEach(p => {
          usersObj[p.id] = {
            profile: mapSupabaseProfileToFirebase(p),
            events: {}, // default
            events_index: eventsByOwner[p.id] || {}
          };
        });
        setAllUsersData(usersObj);
      }
    };

    fetchAllProfiles();

    // Suscribirse a cambios en las tablas profiles y events para refrescar en tiempo real
    const profilesChannel = supabase
      .channel('realtime-all-profiles-and-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchAllProfiles();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchAllProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, [isAdminMaster, isMockMode]);

  // Cargar canciones de autocompletado en tiempo real
  useEffect(() => {
    if (isMockMode) return;

    const fetchAutocompleteSongs = async () => {
      let allSongs = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('autocomplete_songs')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error || !data || data.length === 0) {
          hasMore = false;
        } else {
          allSongs = allSongs.concat(data);
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }

      if (allSongs.length > 0) {
        setAutocompleteSongs(allSongs);
      }
    };

    fetchAutocompleteSongs();

    const autocompleteChannel = supabase
      .channel('realtime-autocomplete-songs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'autocomplete_songs' }, () => {
        fetchAutocompleteSongs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(autocompleteChannel);
    };
  }, [isMockMode]);

  useEffect(() => {
    if (isMockMode) {
      setAuthLoading(false);
      const mockDb = JSON.parse(localStorage.getItem('mock_rtdb_v2') || '{}');
      setRequests(mockDb.requests || {});
      setPlayedRequests(mockDb.played_requests || {});
      return;
    }

    // Escuchar cambios de sesión de Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        setUser({ ...session.user, uid: session.user.id });
      } else {
        setUser(null);
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
      setUser({ id: 'mock-dj-uid', uid: 'mock-dj-uid', email });
      setUserProfile({ display_name: 'DJ Mock Pro', active_plan: 'premium' });
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const registerDJ = async (email, password, displayName, phone) => {
    if (isMockMode) {
      setUser({ id: 'mock-dj-uid', uid: 'mock-dj-uid', email });
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

    const targetEventDbId = currentEventId === 'default-event' ? `default-event-${eventOwnerUid || activeUid}` : currentEventId;

    // Insertar petición y registrar el voto
    const { data, error } = await supabase
      .from('requests')
      .insert({
        id: reqId,
        event_id: targetEventDbId,
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
    const targetEventDbId = currentEventId === 'default-event' ? `default-event-${activeUid}` : currentEventId;
    const dbSettings = mapFirebaseEventToSupabase(settings);
    await supabase
      .from('events')
      .update(dbSettings)
      .eq('id', targetEventDbId);
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
      isAdminMaster,
      currentEventId,
      eventSettings,
      requests,
      playedRequests,
      impersonatingUid,
      impersonateUser,
      stopImpersonating,
      updateActiveRequest,
      updateAutocompleteSong,
      deleteAutocompleteSong,
      allUsersData,
      allSuggestions,
      eventsList,
      deleteEvent,
      archiveEvent,
      updateEventMetadata,
      updateDjOwnProfile,
      clearHistoryWithOptions,
      autocompleteSongs,
      allEventsData,
      createDjAccount,
      updateDjAccount,
      updateAdminProfile,
      twilioConfig,
      updateTwilioConfig,
      uploadLogo,
      getDatabaseBackup,
      deleteSuggestion,
      ratingsStats,
      plansConfig,
      revenueResetTimestamp,
      updatePlansConfig,
      sendSupportMessage,
      markSupportChatAsRead,
      subscribeToSupportChat,
      subscribeToAllSupportChats,
      submitFeedback,
      refreshAdminData,
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
