import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, supabaseAdmin } from '../supabase';

const SupabaseContext = createContext(null);

export const useFirebase = () => {
  return useContext(SupabaseContext);
};

const BANNED_DOMAINS = [
  'gamail.com', 'gamil.com', 'gmal.com', 'gamil.co', 'gmaill.com',
  'yaho.com', 'yahu.com', 'yaho.co',
  'hotmial.com', 'hotmai.com', 'hotmial.co', 'outlok.com',
  'test.com', 'fake.com', 'tempmail.com', 'mailinator.com'
];

export const isBannedEmailDomain = (email) => {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@').pop().toLowerCase().trim();
  return BANNED_DOMAINS.includes(domain);
};

export const DEFAULT_MOCK_ACCOUNTS = [
  { email: 'dj@admin.com', password: 'admin',      uid: 'uid-admin-master', displayName: 'Administrador Master', isAdmin: true },
  { email: 'dj1@dj.com',   password: 'dj123',    uid: 'uid-dj1',          displayName: 'No registrado', isAdmin: false },
  { email: 'dj2@dj.com',   password: 'dj456',    uid: 'uid-dj2',          displayName: 'DJ Neon Vibes', isAdmin: false },
  { email: 'demo@dj.com',  password: 'demo123',  uid: 'uid-demo',         displayName: 'DJ Demo', isAdmin: false }
];

const savedAccounts = localStorage.getItem('mock_accounts');
let finalMockAccounts = DEFAULT_MOCK_ACCOUNTS;
if (savedAccounts) {
  try {
    const parsed = JSON.parse(savedAccounts);
    const hasDemo = parsed.some(a => a.email === 'demo@dj.com');
    if (!hasDemo) {
      parsed.push({ email: 'demo@dj.com', password: 'demo123', uid: 'uid-demo', displayName: 'DJ Demo', isAdmin: false });
      localStorage.setItem('mock_accounts', JSON.stringify(parsed));
    }
    finalMockAccounts = parsed;
  } catch (e) {
    localStorage.setItem('mock_accounts', JSON.stringify(DEFAULT_MOCK_ACCOUNTS));
  }
} else {
  localStorage.setItem('mock_accounts', JSON.stringify(DEFAULT_MOCK_ACCOUNTS));
}

export const MOCK_ACCOUNTS = finalMockAccounts;
export const MASTER_ADMIN_EMAIL = 'dj@admin.com';

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
  
  let activePlan = profile.active_plan || 'free';
  let subscriptionStatus = profile.subscription_status || 'inactive';
  let expiresAt = profile.expires_at ? new Date(profile.expires_at).getTime() : null;

  if (profile.email === 'dj@admin.com' || profile.email === 'misturyflash@yahoo.com.mx') {
    activePlan = 'pro';
    subscriptionStatus = 'active';
    expiresAt = Date.now() + 10 * 365 * 24 * 60 * 60 * 1000; // 10 years
  }

  const custom = profile.custom_settings || {};
  return {
    ...profile,
    ...custom,
    activePlan,
    subscriptionStatus,
    createdAt: profile.created_at ? new Date(profile.created_at).getTime() : null,
    expiresAt,
    extraRequests: profile.extra_requests || 0,
    extraRequestsExpiresAt: profile.extra_requests_expires_at || null,
    demoLimit: profile.demo_limit || 35,
    premiumLimit: profile.premium_limit || 80,
    strictLimitEnabled: profile.strict_limit_enabled !== undefined ? profile.strict_limit_enabled : true,
    displayName: profile.display_name || '',
    email: profile.email || '',
    djName: custom.djName || profile.display_name || '',
    sidebarTitles: custom.sidebarTitles || null,
    themeAccent: custom.themeAccent || '',
    whatsappNumber: custom.whatsappNumber || '',
    whatsappToken: custom.whatsappToken || ''
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
  if (settings.webNameFontSize !== undefined) mapped.web_name_font_size = settings.webNameFontSize;
  if (settings.date !== undefined) mapped.event_date = settings.date;
  if (settings.themeColor !== undefined) mapped.theme_color = settings.themeColor;
  if (settings.themeColorSecondary !== undefined) mapped.theme_color_secondary = settings.themeColorSecondary;
  if (settings.productionUrl !== undefined) mapped.production_url = settings.productionUrl;
  if (settings.fontFamily !== undefined) mapped.font_family = settings.fontFamily;
  if (settings.fontSize !== undefined) mapped.font_size = settings.fontSize;
  if (settings.logoSize !== undefined) mapped.logo_size = settings.logoSize;
  if (settings.bgSkin !== undefined) mapped.bg_skin = settings.bgSkin;
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
  if (settings.djOnline !== undefined) mapped.dj_online = settings.djOnline;
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
  const [currentEventId, setCurrentEventId] = useState(() => {
    // Restaurar el evento activo desde localStorage al iniciar
    try {
      const stored = Object.entries(localStorage)
        .find(([k]) => k.startsWith('djvip_active_event_id_'));
      return stored ? stored[1] : 'default-event';
    } catch { return 'default-event'; }
  });
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
  const [eventOwnerUid, setEventOwnerUid] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);

  const activeUid = impersonatingUid || user?.id;

  const impersonateUser = async (uid) => {
    setImpersonatingUid(uid);
    try {
      const { data: activeEvent } = await supabase
        .from('events')
        .select('id')
        .eq('owner_id', uid)
        .eq('active', true)
        .maybeSingle();

      if (activeEvent) {
        const frontendEventId = activeEvent.id === `default-event-${uid}` ? 'default-event' : activeEvent.id;
        setCurrentEventId(frontendEventId);
        localStorage.setItem(`djvip_active_event_id_${uid}`, frontendEventId);
      } else {
        const savedEventId = localStorage.getItem(`djvip_active_event_id_${uid}`);
        setCurrentEventId(savedEventId || 'default-event');
      }
    } catch {
      const savedEventId = localStorage.getItem(`djvip_active_event_id_${uid}`);
      setCurrentEventId(savedEventId || 'default-event');
    }
  };

  const stopImpersonating = async () => {
    setImpersonatingUid(null);
    const adminUid = user?.id;
    if (adminUid) {
      try {
        const { data: activeEvent } = await supabase
          .from('events')
          .select('id')
          .eq('owner_id', adminUid)
          .eq('active', true)
          .maybeSingle();

        if (activeEvent) {
          const frontendEventId = activeEvent.id === `default-event-${adminUid}` ? 'default-event' : activeEvent.id;
          setCurrentEventId(frontendEventId);
          localStorage.setItem(`djvip_active_event_id_${adminUid}`, frontendEventId);
        } else {
          const savedEventId = localStorage.getItem(`djvip_active_event_id_${adminUid}`);
          setCurrentEventId(savedEventId || 'default-event');
        }
      } catch {
        const savedEventId = localStorage.getItem(`djvip_active_event_id_${adminUid}`);
        setCurrentEventId(savedEventId || 'default-event');
      }
    } else {
      setCurrentEventId('default-event');
    }
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
    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : (import.meta.env.VITE_PUBLIC_URL ? import.meta.env.VITE_PUBLIC_URL.replace(/\/$/, '') : 'https://dj-vip.onrender.com');

    const res = await fetch(`${API_BASE}/api/admin/createDjAccount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        displayName,
        secret: 'najera2401'
      })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Fallo al crear la cuenta del DJ en el backend.');
    }
    return { uid: data.user.id, email: data.user.email, displayName: data.user.displayName || displayName };
  };

  const updateDjAccount = async (uid, newEmail, newDisplayName, newPassword, newPlan, demoLimit, strictLimitEnabled, premiumLimit, logoUploadEnabled) => {
    if (!isAdminMaster) {
      throw new Error('Solo el Administrador Master puede editar cuentas.');
    }
    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : (import.meta.env.VITE_PUBLIC_URL ? import.meta.env.VITE_PUBLIC_URL.replace(/\/$/, '') : 'https://dj-vip.onrender.com');

    const res = await fetch(`${API_BASE}/api/admin/updateDjAccount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uid,
        newEmail,
        newDisplayName,
        newPassword,
        newPlan,
        demoLimit,
        strictLimitEnabled,
        premiumLimit,
        logoUploadEnabled,
        secret: 'najera2401'
      })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Fallo al actualizar la cuenta del DJ en el backend.');
    }
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
    const filePath = `logos/${activeUid || 'unknown'}_${currentEventId || 'unknown'}_logo_${Date.now()}.${fileExt}`;
    
    // Subir el archivo usando el cliente público autenticado
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Obtener la URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    // Actualizar los ajustes del evento con la nueva URL del logotipo
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

  const updateVersionConfig = async (versionConfig) => {
    if (!isAdminMaster) throw new Error("Acceso denegado: Solo el administrador master puede realizar esta acción.");
    if (isMockMode) return;

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('custom_settings')
      .eq('email', 'dj@admin.com')
      .maybeSingle();

    const custom = adminProfile?.custom_settings || {};
    custom.version_config = versionConfig;

    const { error } = await supabase
      .from('profiles')
      .update({ custom_settings: custom })
      .eq('email', 'dj@admin.com');

    if (error) throw error;
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

  const isPublicView = window.location.search.includes('event=');

  // Sincronizar el evento activo al cambiar de usuario o al cargar la sesión
  useEffect(() => {
    if (isMockMode || !activeUid || isPublicView) return;

    const syncActiveEvent = async () => {
      try {
        const { data: activeEvent } = await supabase
          .from('events')
          .select('id')
          .eq('owner_id', activeUid)
          .eq('active', true)
          .maybeSingle();

        if (activeEvent) {
          const frontendEventId = activeEvent.id === `default-event-${activeUid}` ? 'default-event' : activeEvent.id;
          setCurrentEventId(frontendEventId);
          localStorage.setItem(`djvip_active_event_id_${activeUid}`, frontendEventId);
        } else {
          const savedEventId = localStorage.getItem(`djvip_active_event_id_${activeUid}`);
          if (savedEventId) {
            setCurrentEventId(savedEventId);
          } else {
            setCurrentEventId('default-event');
          }
        }
      } catch (e) {
        console.warn("Fallo al sincronizar evento activo del usuario:", e);
      }
    };

    syncActiveEvent();
  }, [activeUid, isMockMode, isPublicView]);

  // Resolver el ownerUid del evento actual
  useEffect(() => {
    if (isMockMode) return;

    if (activeUid && !isPublicView) {
      setEventOwnerUid(activeUid);
      return;
    }

    if (!currentEventId) {
      setEventOwnerUid(null);
      return;
    }

    if (currentEventId.startsWith('default-event-')) {
      const extractedUid = currentEventId.replace('default-event-', '');
      setEventOwnerUid(extractedUid);
      return;
    }

    if (currentEventId === 'default-event') {
      if (activeUid) {
        setEventOwnerUid(activeUid);
      } else {
        setEventOwnerUid(null);
      }
      return;
    }

    const resolveOwner = async () => {
      const { data: ev, error } = await supabase
        .from('events')
        .select('owner_id')
        .eq('id', currentEventId)
        .maybeSingle();
      
      if (!error && ev) {
        setEventOwnerUid(ev.owner_id);
      } else {
        setEventOwnerUid(null);
      }
    };

    resolveOwner();
  }, [currentEventId, activeUid, isPublicView, isMockMode]);

  // Cargar perfil del dueño del evento en tiempo real
  useEffect(() => {
    if (isMockMode || !eventOwnerUid) {
      setOwnerProfile(null);
      return;
    }

    const fetchOwnerProfile = async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', eventOwnerUid)
        .maybeSingle();

      if (!error && profile) {
        setOwnerProfile(mapSupabaseProfileToFirebase(profile));
      } else {
        setOwnerProfile(null);
      }
    };

    fetchOwnerProfile();

    const ownerChannel = supabase
      .channel(`realtime-owner-profile-${eventOwnerUid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${eventOwnerUid}` }, payload => {
        if (payload.new) {
          setOwnerProfile(mapSupabaseProfileToFirebase(payload.new));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ownerChannel);
    };
  }, [eventOwnerUid, isMockMode]);

  // Cargar configuración del evento activo (admite impersonación y vista pública)
  useEffect(() => {
    if (isMockMode) return;
    if (!currentEventId) {
      setEventSettings(DEFAULT_EVENT_SETTINGS);
      return;
    }

    const resolvedOwnerUid = activeUid || eventOwnerUid;
    if (currentEventId === 'default-event' && !resolvedOwnerUid) {
      setEventSettings(DEFAULT_EVENT_SETTINGS);
      return;
    }

    const targetEventDbId = currentEventId === 'default-event' ? `default-event-${resolvedOwnerUid}` : currentEventId;

    const fetchEventSettings = async () => {
      const { data: eventRow, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', targetEventDbId)
        .maybeSingle();
      
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
  }, [activeUid, eventOwnerUid, currentEventId, isMockMode]);

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

  // Cargar canciones de autocompletado en tiempo real (Límite de 1000 para optimización)
  useEffect(() => {
    if (isMockMode) return;

    const fetchAutocompleteSongs = async () => {
      const { data, error } = await supabase
        .from('autocomplete_songs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!error && data) {
        setAutocompleteSongs(data);
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
        setUser({ 
          ...session.user, 
          uid: session.user.id,
          emailVerified: !!session.user.email_confirmed_at
        });
        
        try {
          // 1. Cargar el evento activo guardado en Supabase
          const { data: activeEvent } = await supabase
            .from('events')
            .select('id')
            .eq('owner_id', session.user.id)
            .eq('active', true)
            .maybeSingle();

          if (activeEvent) {
            const frontendEventId = activeEvent.id === `default-event-${session.user.id}` ? 'default-event' : activeEvent.id;
            setCurrentEventId(frontendEventId);
            localStorage.setItem(`djvip_active_event_id_${session.user.id}`, frontendEventId);
          } else {
            // 2. Si no hay ninguno activo en la BD, usar localStorage
            const savedEventId = localStorage.getItem(`djvip_active_event_id_${session.user.id}`);
            if (savedEventId) {
              const frontendEventId = savedEventId;
              setCurrentEventId(frontendEventId);
              const targetEventDbId = frontendEventId === 'default-event' ? `default-event-${session.user.id}` : frontendEventId;
              await supabase.from('events').update({ active: true }).eq('id', targetEventDbId);
            } else {
              // 3. Fallback a default-event
              setCurrentEventId('default-event');
              await supabase.from('events').update({ active: true }).eq('id', `default-event-${session.user.id}`);
            }
          }
        } catch (e) {
          console.warn("Fallo al restaurar evento activo de la BD:", e);
          const savedEventId = localStorage.getItem(`djvip_active_event_id_${session.user.id}`);
          if (savedEventId) {
            setCurrentEventId(savedEventId);
          }
        }
      } else {
        setUser(null);
        setCurrentEventId('default-event');
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

    const resolvedOwnerUid = activeUid || eventOwnerUid;
    if (currentEventId === 'default-event' && !resolvedOwnerUid) return;

    // Resolver el ID real de la BD (default-event → default-event-{uid})
    const targetEventDbId = currentEventId === 'default-event' ? `default-event-${resolvedOwnerUid}` : currentEventId;

    // 1. Cargar peticiones iniciales
    const loadRequests = async () => {
      const { data: activeReqs } = await supabase
        .from('requests')
        .select('*')
        .eq('event_id', targetEventDbId);
      
      const reqObj = {};
      (activeReqs || []).forEach(r => {
        reqObj[r.id] = r;
      });
      setRequests(reqObj);

      const { data: playedReqs } = await supabase
        .from('played_requests')
        .select('*')
        .eq('event_id', targetEventDbId);
      
      const playedObj = {};
      (playedReqs || []).forEach(r => {
        playedObj[r.id] = r;
      });
      setPlayedRequests(playedObj);
    };

    loadRequests();

    // 2. Escuchar cambios en tiempo real con el ID real de la BD
    const requestsChannel = supabase
      .channel(`realtime-requests-${targetEventDbId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests', filter: `event_id=eq.${targetEventDbId}` }, payload => {
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'played_requests', filter: `event_id=eq.${targetEventDbId}` }, payload => {
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
  }, [currentEventId, activeUid, eventOwnerUid, isMockMode]);

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

  const refreshUser = async () => {
    if (isMockMode) return;
    const { data: { user: updatedUser }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (updatedUser) {
      setUser({ 
        ...updatedUser, 
        uid: updatedUser.id,
        emailVerified: !!updatedUser.email_confirmed_at
      });
      return { 
        ...updatedUser, 
        uid: updatedUser.id,
        emailVerified: !!updatedUser.email_confirmed_at
      };
    }
    return null;
  };

  const sendEmailVerification = async () => {
    if (isMockMode) return;
    if (!user?.email) return;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email
    });
    if (error) throw error;
  };

  const listPendingSubscriptions = async () => {
    if (isMockMode) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('subscription_status', ['pending_validation', 'pending_payment']);
    if (error) throw error;
    return (data || []).map(mapSupabaseProfileToFirebase);
  };

  const approveSubscription = async (uid, plan) => {
    if (isMockMode) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: plan,
        active_plan: plan,
        payment_rejected_reason: null,
        transaction_id: null,
        gateway: null
      })
      .eq('id', uid);
    if (error) throw error;
  };

  const rejectSubscription = async (uid, reason) => {
    if (isMockMode) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'pending_plan',
        active_plan: 'free',
        payment_rejected_reason: reason
      })
      .eq('id', uid);
    if (error) throw error;
  };

  const deleteUser = async (uid) => {
    if (isMockMode) return;
    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : (import.meta.env.VITE_PUBLIC_URL ? import.meta.env.VITE_PUBLIC_URL.replace(/\/$/, '') : 'https://dj-vip.onrender.com');

    const res = await fetch(`${API_BASE}/api/admin/deleteUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uid,
        secret: 'najera2401'
      })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Fallo al eliminar cuenta de DJ en el servidor backend.');
    }
  };

  const getPaymentConfig = async () => {
    if (isMockMode) return {};
    const { data, error } = await supabase
      .from('profiles')
      .select('custom_settings')
      .eq('email', 'dj@admin.com')
      .maybeSingle();
    if (error) throw error;
    return data?.custom_settings?.payment_config || {};
  };

  const savePaymentConfig = async (config) => {
    if (isMockMode) return;
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('custom_settings')
      .eq('email', 'dj@admin.com')
      .maybeSingle();
    
    const custom = adminProfile?.custom_settings || {};
    custom.payment_config = config;

    const { error } = await supabase
      .from('profiles')
      .update({ custom_settings: custom })
      .eq('email', 'dj@admin.com');
    if (error) throw error;
  };

  const resetRevenue = async () => {
    if (isMockMode) return;
    const { error } = await supabase
      .from('profiles')
      .update({ revenue: 0 });
    if (error) throw error;
    setRevenueResetTimestamp(Date.now());
  };

  const listSubscriptions = async () => {
    if (isMockMode) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    if (error) throw error;
    return (data || []).map(mapSupabaseProfileToFirebase);
  };

  const updateSubscription = async (uid, plan) => {
    if (isMockMode) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: plan,
        active_plan: plan
      })
      .eq('id', uid);
    if (error) throw error;
  };

  const deleteSubscription = async (uid) => {
    if (isMockMode) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'pending_plan',
        active_plan: 'free'
      })
      .eq('id', uid);
    if (error) throw error;
  };

  const checkAndAddToAutocomplete = async (title, artist, genre) => {
    if (isMockMode) return;
    const cleanTitle = (title || '').trim();
    const cleanArtist = (artist || '').trim();
    if (!cleanTitle) return;

    const songIndex = (autocompleteSongs || []).findIndex(
      song => song && song.title && song.artist &&
              song.title.toLowerCase() === cleanTitle.toLowerCase() && 
              song.artist.toLowerCase() === cleanArtist.toLowerCase()
    );

    if (songIndex === -1) {
      const songId = 'song-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      await supabase
        .from('autocomplete_songs')
        .insert({
          id: songId,
          title: cleanTitle,
          artist: cleanArtist || 'Artista no especificado',
          genre: genre || 'Personalizado'
        });
    }
  };

  const searchAutocompleteSongs = async (queryText) => {
    if (isMockMode) return [];
    const cleanQuery = (queryText || '').trim();
    if (!cleanQuery) return [];
    const { data, error } = await supabase
      .from('autocomplete_songs')
      .select('*')
      .or(`title.ilike.%${cleanQuery}%,artist.ilike.%${cleanQuery}%`)
      .limit(100);
    if (error) throw error;
    return data || [];
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

    // 1. Obtener peticiones activas de la BD para buscar duplicados
    const { data: activeReqs } = await supabase
      .from('requests')
      .select('*')
      .eq('event_id', targetEventDbId);

    const normalize = (str) => {
      if (!str) return '';
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase()
        .trim();
    };

    const cleanTitleNorm = normalize(cleanTitle);
    const cleanArtistNorm = normalize(cleanArtist);

    // Ignorar títulos genéricos o vacíos para la fusión de duplicados
    const isGenericTitle = !cleanTitleNorm || ['temanoespecificado', 'cualquiera', 'sinnombre'].includes(cleanTitleNorm);

    const existingReq = !isGenericTitle ? (activeReqs || []).find(r => {
      const rTitleNorm = normalize(r.title);
      const rArtistNorm = normalize(r.artist);
      if (!rTitleNorm || ['temanoespecificado', 'cualquiera', 'sinnombre'].includes(rTitleNorm)) return false;
      
      const isReqArtistEmpty = rArtistNorm === '' || rArtistNorm === 'artista no especificado';
      const isUserArtistEmpty = cleanArtistNorm === '' || cleanArtistNorm === 'artista no especificado';

      const matchTitle = rTitleNorm === cleanTitleNorm;
      const matchArtist = (isUserArtistEmpty && isReqArtistEmpty) || (rArtistNorm === cleanArtistNorm);

      return matchTitle && matchArtist;
    }) : null;

    if (existingReq) {
      // Registrar el voto para el usuario en la petición existente
      const { error: voteError } = await supabase
        .from('request_voters')
        .insert({
          request_id: existingReq.id,
          session_id: sessionId
        });

      if (voteError) {
        // Ya votó para esta misma petición, retornar duplicado sin sumar de nuevo
        return { key: existingReq.id, isDuplicateMerge: true, alreadyVoted: true };
      }

      // Si no había votado, sumarle el voto atómicamente
      await supabase.rpc('increment_votes', { row_id: existingReq.id });
      
      // Auto-alimentar de forma segura en segundo plano
      try {
        await checkAndAddToAutocomplete(cleanTitle, cleanArtist, genre);
      } catch (e) {
        console.warn("No se pudo agregar a autocompletado:", e);
      }

      return { key: existingReq.id, isDuplicateMerge: true };
    }

    // 2. Si no es duplicado, comprobar límites del plan contratado por el DJ
    const ownerUid = eventOwnerUid || activeUid;
    if (!ownerUid) {
      throw new Error('No se pudo identificar al propietario del evento.');
    }

    let maxRequests = 35; // Límite por defecto (Demo)
    let strictLimitEnabled = true;

    try {
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ownerUid)
        .maybeSingle();

      if (ownerProfile) {
        let planKey = ownerProfile.active_plan || ownerProfile.subscription_status || 'free';
        if (ownerProfile.email === 'dj@admin.com' || ownerProfile.email === 'misturyflash@yahoo.com.mx') {
          planKey = 'pro';
        }
        strictLimitEnabled = ownerProfile.strict_limit_enabled !== false;

        let extraRequests = ownerProfile.extra_requests || 0;
        let extraRequestsExpiresAt = ownerProfile.extra_requests_expires_at ? parseInt(ownerProfile.extra_requests_expires_at, 10) : 0;

        const isExtraValid = extraRequests > 0 && (!extraRequestsExpiresAt || Date.now() <= extraRequestsExpiresAt);
        const activeExtra = isExtraValid ? extraRequests : 0;

        if (planKey === 'free') {
          maxRequests = (ownerProfile.demo_limit || 35) + activeExtra;
        } else if (planKey === 'premium') {
          maxRequests = (ownerProfile.premium_limit || 80) + activeExtra;
        } else if (planKey === 'vip' || planKey === 'pro' || planKey === 'pro_1d') {
          maxRequests = 0; // Ilimitado
        } else {
          // Plan personalizado fallback
          const planDetails = plansConfig?.[planKey] || DEFAULT_PLANS_CONFIG[planKey] || DEFAULT_PLANS_CONFIG.free;
          maxRequests = planDetails && planDetails.maxRequests !== undefined
            ? parseInt(planDetails.maxRequests, 10)
            : 35;
        }
      }
    } catch (e) {
      console.warn('Fallo al validar límites de suscripción:', e);
    }

    if (strictLimitEnabled && maxRequests > 0) {
      const { count: activeCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', targetEventDbId);

      const { count: playedCount } = await supabase
        .from('played_requests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', targetEventDbId);

      const totalRequests = (activeCount || 0) + (playedCount || 0);
      if (totalRequests >= maxRequests) {
        throw new Error('El plan contratado por el DJ ha alcanzado su límite de peticiones.');
      }
    }

    // 3. Insertar nueva petición y registrar voto inicial
    const { error } = await supabase
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
      });

    if (error) throw error;

    await supabase
      .from('request_voters')
      .insert({
        request_id: reqId,
        session_id: sessionId
      });

    // Auto-alimentar base de datos de autocompletado
    try {
      await checkAndAddToAutocomplete(cleanTitle, cleanArtist, genre);
    } catch (e) {
      console.warn("No se pudo agregar a autocompletado:", e);
    }

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

    if (status === 'played' || status === 'playing' || status === 'rejected') {
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
    const targetEventDbId = currentEventId === 'default-event' ? `default-event-${eventOwnerUid || activeUid}` : currentEventId;
    await supabase.from('requests').delete().eq('event_id', targetEventDbId);
    await supabase.from('played_requests').delete().eq('event_id', targetEventDbId);
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

  const changeEvent = async (eventId) => {
    setCurrentEventId(eventId);
    if (activeUid) {
      // Persistir selección en localStorage
      localStorage.setItem(`djvip_active_event_id_${activeUid}`, eventId);

      if (!isMockMode) {
        // Marcar el evento como activo en Supabase y desactivar el anterior
        const targetEventDbId = eventId === 'default-event' ? `default-event-${activeUid}` : eventId;
        // Desactivar todos los eventos del DJ
        await supabase.from('events').update({ active: false }).eq('owner_id', activeUid);
        // Activar el seleccionado
        await supabase.from('events').update({ active: true }).eq('id', targetEventDbId);
      }
    }
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
      eventOwnerUid,
      ownerProfile,
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
      updateVersionConfig,
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
      refreshUser,
      sendEmailVerification,
      addRequest,
      voteRequest,
      updateRequestStatus,
      clearActiveAndPlayedRequests,
      updateEventSettings,
      selectPlan,
      cancelPlanSelection,
      changeEvent,
      listPendingSubscriptions,
      approveSubscription,
      rejectSubscription,
      deleteUser,
      getPaymentConfig,
      savePaymentConfig,
      resetRevenue,
      listSubscriptions,
      updateSubscription,
      deleteSubscription,
      searchAutocompleteSongs
    }}>
      {children}
    </SupabaseContext.Provider>
  );
};
