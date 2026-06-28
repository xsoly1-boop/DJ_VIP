import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { MOCK_ACCOUNTS, MASTER_ADMIN_EMAIL, database, ref, set, get } from '../firebase';
import { CURRENT_APP_VERSION } from '../utils/AppVersionConfig';
import AdminSubscriptions from './AdminSubscriptions';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { 
  Music, LogOut, Settings, Calendar, Download, RefreshCw, 
  Trash2, Plus, Play, Check, X, Bell, BellOff, Volume2, 
  Sparkles, Sliders, Users, Layers, ShieldCheck, Database,
  Link, AlertTriangle, ShieldAlert, ArrowLeft, UserCog, Edit, UserPlus, Mail, Lock, User, CreditCard,
  LayoutGrid, ExternalLink, Image, Search, Megaphone, Star, MessageSquare, Send, Printer,
  TrendingUp, DollarSign, BarChart2, ArrowUpCircle, Download as DownloadIcon, Clock, CreditCard as CardIcon
} from 'lucide-react';


function PlanValidityDisplay({ activePlan, expiresAt }) {
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    if (!expiresAt || expiresAt <= 0) {
      setTimeLeft('Sin vencimiento');
      return;
    }

    const updateTime = () => {
      const now = Date.now();
      const diffMs = expiresAt - now;

      if (diffMs <= 0) {
        setTimeLeft('Expirado');
        return;
      }

      if (activePlan === 'eventual') {
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        
        const pad = (num) => String(num).padStart(2, '0');
        setTimeLeft(`${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`);
      } else {
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        setTimeLeft(`${diffDays} día${diffDays !== 1 ? 's' : ''}`);
      }
    };

    updateTime();
    const intervalTime = activePlan === 'eventual' ? 1000 : 60000;
    const timer = setInterval(updateTime, intervalTime);
    return () => clearInterval(timer);
  }, [activePlan, expiresAt]);

  return (
    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
      {timeLeft}
    </span>
  );
}

export default function DjDashboard() {
  const API_BASE = ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '')
    ? 'http://localhost:4000'
    : (import.meta.env.VITE_PUBLIC_URL ? import.meta.env.VITE_PUBLIC_URL.replace(/\/$/, '') : 'https://dj-vip.vercel.app');

  const { 
    user, 
    logoutDJ, 
    currentEventId, 
    eventSettings, 
    requests, 
    playedRequests,
    updateRequestStatus, 
    clearActiveAndPlayedRequests,
    updateEventSettings, 
    createNewEvent,
    changeEvent,
    isMock,
    isAdminMaster,
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
    userProfile,
    selectPlan,
    plansConfig,
    updatePlansConfig,
    sendSupportMessage,
    markSupportChatAsRead,
    subscribeToSupportChat,
    subscribeToAllSupportChats,
    submitFeedback,
    refreshAdminData
  } = useFirebase();

  // Estados Locales
  const [activeTab, setActiveTab] = useState('requests'); // requests | settings | calendar | optimization | benefits | admin
  const [filterSort, setFilterSort] = useState('time');
  const [filterStatus, setFilterStatus] = useState('all');

  // Branding temporal
  const [titleInput, setTitleInput] = useState(eventSettings.title);
  const [djNameInput, setDjNameInput] = useState(eventSettings.djName);
  const [webNameInput, setWebNameInput] = useState(eventSettings.webName || 'DJ a la Carta');
  const [webNameFontSize, setWebNameFontSize] = useState(eventSettings.webNameFontSize || 11);
  const [dateInput, setDateInput] = useState(eventSettings.date || new Date().toISOString().split('T')[0]);
  const [primaryColor, setPrimaryColor] = useState(eventSettings.themeColor || '#7c3aed');
  const [secondaryColor, setSecondaryColor] = useState(eventSettings.themeColorSecondary || '#06b6d4');
  const [productionUrl, setProductionUrl] = useState(eventSettings.productionUrl || 'https://dj-vip.vercel.app/');
  // Logo solo por URL externa
  const [logoUrlInput, setLogoUrlInput] = useState(eventSettings.logoUrl || '');
  const [fontFamily, setFontFamily] = useState(eventSettings.fontFamily || 'Outfit');
  const [fontSize, setFontSize] = useState(eventSettings.fontSize || 'medium');
  const [logoSize, setLogoSize] = useState(eventSettings.logoSize || 'medium');
  const [bgSkinInput, setBgSkinInput] = useState(eventSettings.bgSkin || 'default');

  // Propinas
  const [tipsEnabledInput, setTipsEnabledInput] = useState(eventSettings.tipsEnabled || false);
  const [paypalUsernameInput, setPaypalUsernameInput] = useState(eventSettings.paypalUsername || '');
  const [mercadopagoLinkInput, setMercadopagoLinkInput] = useState(eventSettings.mercadopagoLink || '');
  const [clabeInput, setClabeInput] = useState(eventSettings.bankClabe || '');
  const [tipCurrencyInput, setTipCurrencyInput] = useState(eventSettings.tipCurrency || 'MXN');
  const [dedicationsEnabledInput, setDedicationsEnabledInput] = useState(eventSettings.dedicationsEnabled || false);
  const [customGenresInput, setCustomGenresInput] = useState(eventSettings.customGenres || '');
  const [minimizeToTrayInput, setMinimizeToTrayInput] = useState(false);

  // Publicidad y Contacto
  const [promoEnabledInput, setPromoEnabledInput] = useState(eventSettings.promoEnabled || false);
  const [promoWhatsappInput, setPromoWhatsappInput] = useState(eventSettings.promoWhatsapp || '');
  const [promoWebsiteInput, setPromoWebsiteInput] = useState(eventSettings.promoWebsite || '');
  const [promoInstagramInput, setPromoInstagramInput] = useState(eventSettings.promoInstagram || '');
  const [promoTiktokInput, setPromoTiktokInput] = useState(eventSettings.promoTiktok || '');

  // Pestaña Calendario: Crear Evento
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDjName, setNewEventDjName] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventType, setNewEventType] = useState('Otro');
  const [createEventLoading, setCreateEventLoading] = useState(false);

  // Pestaña Calendario: Editar Evento
  const [editingEventId, setEditingEventId] = useState(null);
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventDjName, setEditEventDjName] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventType, setEditEventType] = useState('Otro');

  // Admin Master: Editar DJ
  const [editingDjUid, setEditingDjUid] = useState(null);
  const [editDjDisplayName, setEditDjDisplayName] = useState('');
  const [editDjEmail, setEditDjEmail] = useState('');
  const [editDjPassword, setEditDjPassword] = useState('');
  const [editDjPlan, setEditDjPlan] = useState('free');
  const [editDjDemoLimit, setEditDjDemoLimit] = useState(35);
  const [editDjPremiumLimit, setEditDjPremiumLimit] = useState(80);
  const [editDjLogoUploadEnabled, setEditDjLogoUploadEnabled] = useState(false);
  const [editDjStrictLimit, setEditDjStrictLimit] = useState(true);
  const [editDjLoading, setEditDjLoading] = useState(false);

  // Confirmación de borrado de evento
  const [deletingEventId, setDeletingEventId] = useState(null);

  
  // Modal Borrar Historial Opcional con palabra clave
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearWordConfirm, setClearWordConfirm] = useState('');
  const [clearOptionSongs, setClearOptionSongs] = useState(false);
  const [clearOptionGenres, setClearOptionGenres] = useState(false);
  const [clearOptionArtists, setClearOptionArtists] = useState(false);
  const [clearOptionAutocomplete, setClearOptionAutocomplete] = useState(false);
  const [clearOptionCalendar, setClearOptionCalendar] = useState(false);
  const [clearErrorMsg, setClearErrorMsg] = useState('');
  const [clearingHistory, setClearingHistory] = useState(false);

  // Panel Admin: Agregar DJ
  const [showAddDjForm, setShowAddDjForm] = useState(false);
  const [newDjEmail, setNewDjEmail] = useState('');
  const [newDjPassword, setNewDjPassword] = useState('');
  const [newDjDisplayName, setNewDjDisplayName] = useState('');
  const [addDjLoading, setAddDjLoading] = useState(false);
  const [addDjError, setAddDjError] = useState('');
  const [addDjSuccess, setAddDjSuccess] = useState('');

  // Retroalimentación / Sugerencias
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Alertas / Audio / Notificaciones
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTone, setSelectedTone] = useState(() => localStorage.getItem('dj_notification_tone') || 'chime');
  const [androidSoundName, setAndroidSoundName] = useState('Predeterminado del sistema');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('dj_notifications_enabled');
    if (saved !== null) {
      return saved === 'true';
    }
    if (window.electronAPI) return true;
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });
  const [toastMessage, setToastMessage] = useState(null);

  // --- SOPORTE CHAT ESTADOS Y EFECTOS ---
  const [supportChatOpen, setSupportChatOpen] = useState(false);
  const [supportChatText, setSupportChatText] = useState('');
  const [supportChatData, setSupportChatData] = useState({ metadata: {}, messages: [] });
  const supportChatEndRef = useRef(null);

  // Admin Master Soporte Chats
  const [adminChats, setAdminChats] = useState({});
  const [adminSelectedChatUid, setAdminSelectedChatUid] = useState(null);
  const [adminChatText, setAdminChatText] = useState('');
  const [adminChatData, setAdminChatData] = useState({ metadata: {}, messages: [] });
  const adminChatEndRef = useRef(null);

  // Admin Master: Estados para Gestor de Actualizaciones
  const [adminUpdateVersion, setAdminUpdateVersion] = useState('');
  const [adminUpdateApkUrl, setAdminUpdateApkUrl] = useState('https://dj-vip.vercel.app/DJ%20a%20la%20Carta%20Pro.apk');
  const [adminReleaseNotesRaw, setAdminReleaseNotesRaw] = useState('');
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [isPublishingNotes, setIsPublishingNotes] = useState(false);

  // Perfil del Admin Master
  const [adminAlias, setAdminAlias] = useState('');
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const [adminCallmebotApiKey, setAdminCallmebotApiKey] = useState('');
  const [saveAdminProfileLoading, setSaveAdminProfileLoading] = useState(false);
  const [nativeFcmToken, setNativeFcmToken] = useState('');

  // Sincronizar token FCM nativo (polling para diagnosticar en caliente)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AndroidApp) {
      const token = window.AndroidApp.getFCMToken?.() || '';
      setNativeFcmToken(token);

      const interval = setInterval(() => {
        const freshToken = window.AndroidApp.getFCMToken?.() || '';
        setNativeFcmToken(freshToken);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, []);

  // Cargar configuración de actualización al activar la pestaña de soporte
  useEffect(() => {
    if (activeTab === 'support' && isAdminMaster && !impersonatingUid) {
      const updatesRef = ref(database, 'config/updates');
      get(updatesRef).then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setAdminUpdateVersion(data.latestVersion || '');
          setAdminUpdateApkUrl(data.apkUrl || 'https://dj-vip.vercel.app/DJ%20a%20la%20Carta%20Pro.apk');
          if (data.releaseNotes) {
            setAdminReleaseNotesRaw(data.releaseNotes.join('\n'));
          }
        }
      }).catch(err => console.error(err));
    }
  }, [activeTab, isAdminMaster, impersonatingUid]);

  // Autorellenar notas de actualización analizando los cambios recientes desde GitHub
  const handleAutoFillReleaseNotes = async () => {
    setIsGeneratingNotes(true);
    showToast("🔍 Conectando con GitHub para analizar cambios recientes...");
    try {
      const res = await fetch('https://api.github.com/repos/xsoly1-boop/DJ_VIP/commits?per_page=10');
      if (!res.ok) throw new Error('Error al conectar con GitHub API.');
      const commits = await res.json();
      
      const notes = commits
        .map(c => {
          let msg = c.commit.message || '';
          msg = msg.split('\n')[0].trim();
          
          if (msg.toLowerCase().includes('merge branch') || 
              msg.toLowerCase().includes('rebuild android apk') ||
              msg.toLowerCase().includes('revert')) {
            return null;
          }
          
          if (msg.startsWith('feat:')) {
            msg = msg.replace(/^feat:\s*/i, '').trim();
            msg = msg.charAt(0).toUpperCase() + msg.slice(1);
            return `General: ${msg}.`;
          } else if (msg.startsWith('design:')) {
            msg = msg.replace(/^design:\s*/i, '').trim();
            msg = msg.charAt(0).toUpperCase() + msg.slice(1);
            return `Diseño: ${msg}.`;
          } else if (msg.startsWith('fix:')) {
            msg = msg.replace(/^fix:\s*/i, '').trim();
            msg = msg.charAt(0).toUpperCase() + msg.slice(1);
            return `Corrección: ${msg}.`;
          }
          
          return msg.charAt(0).toUpperCase() + msg.slice(1);
        })
        .filter(Boolean);

      if (notes.length === 0) {
        notes.push("General: Optimización de rendimiento y correcciones de bugs menores.");
      }

      setAdminReleaseNotesRaw(notes.join('\n'));

      const response = await fetch(`${API_BASE}/version.json?t=${Date.now()}`);
      if (response.ok) {
        const currentData = await response.json();
        const parts = (currentData.latestVersion || '1.0.0.0').split('.');
        const lastPart = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastPart)) {
          parts[parts.length - 1] = (lastPart + 1).toString();
          setAdminUpdateVersion(parts.join('.'));
        }
      }

      showToast("✨ Notas y versión autorellenadas con éxito basadas en el repositorio.");
    } catch (err) {
      console.error(err);
      showToast("❌ Error al autorellenar desde GitHub: " + err.message);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  // Guardar/Publicar notas en Firebase RTDB
  const handlePublishReleaseNotes = async () => {
    if (!adminUpdateVersion) {
      showToast("⚠️ Debes especificar la última versión.");
      return;
    }
    setIsPublishingNotes(true);
    try {
      const parsedNotes = adminReleaseNotesRaw
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const updatesRef = ref(database, 'config/updates');
      await set(updatesRef, {
        latestVersion: adminUpdateVersion,
        apkUrl: adminUpdateApkUrl,
        dmgUrl: "https://github.com/xsoly1-boop/DJ_VIP/releases/latest",
        releaseNotes: parsedNotes
      });

      showToast("🚀 ¡Actualización publicada en vivo para todos los usuarios!");
    } catch (err) {
      console.error(err);
      showToast("❌ Error al publicar la actualización: " + err.message);
    } finally {
      setIsPublishingNotes(false);
    }
  };

  // Estados para Twilio SMS
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioFromNumber, setTwilioFromNumber] = useState('');
  const [twilioToNumber, setTwilioToNumber] = useState('');

  // Sincronizar campos cuando cargue el perfil del admin
  useEffect(() => {
    if (isAdminMaster && userProfile) {
      setAdminAlias(userProfile.displayName || '');
      setAdminWhatsapp(userProfile.whatsapp || '');
      setAdminCallmebotApiKey(userProfile.callmebotApiKey || '');
    }
  }, [userProfile, isAdminMaster]);

  // Sincronizar ajuste de bandeja (Tray) de escritorio al montar
  useEffect(() => {
    if (window.AndroidApp && typeof window.AndroidApp.getMinimizeToTray === 'function') {
      setMinimizeToTrayInput(window.AndroidApp.getMinimizeToTray());
    }
  }, []);

  // Sincronizar Twilio config cuando cargue de la BD
  useEffect(() => {
    if (isAdminMaster && twilioConfig) {
      setTwilioAccountSid(twilioConfig.accountSid || '');
      setTwilioAuthToken(twilioConfig.authToken || '');
      setTwilioFromNumber(twilioConfig.fromNumber || '');
      setTwilioToNumber(twilioConfig.toNumber || '');
    }
  }, [twilioConfig, isAdminMaster]);

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    if (!adminAlias.trim()) {
      showToast('⚠️ El Nombre o Alias es requerido.');
      return;
    }
    setSaveAdminProfileLoading(true);
    try {
      await updateAdminProfile(adminAlias.trim(), adminWhatsapp.trim(), adminCallmebotApiKey.trim());
      await updateTwilioConfig({
        accountSid: twilioAccountSid.trim(),
        authToken: twilioAuthToken.trim(),
        fromNumber: twilioFromNumber.trim(),
        toNumber: twilioToNumber.trim()
      });
      showToast('✅ Perfil y configuración de SMS guardados correctamente.');
    } catch (err) {
      showToast('❌ Error al guardar perfil: ' + err.message);
    } finally {
      setSaveAdminProfileLoading(false);
    }
  };

  // Efecto para DJ PRO: Suscribirse a su chat de soporte
  useEffect(() => {
    if (!supportChatOpen || !user?.uid) return;
    
    // Marcar como leído al abrir
    markSupportChatAsRead(user.uid, 'user');
    
    const unsubscribe = subscribeToSupportChat(user.uid, (data) => {
      setSupportChatData(data);
    });
    return () => unsubscribe();
  }, [supportChatOpen, user?.uid]);

  // Autoscroll para chat del DJ PRO
  useEffect(() => {
    if (supportChatOpen && supportChatEndRef.current) {
      supportChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [supportChatData.messages, supportChatOpen]);

  // Efecto para Admin Master: Suscribirse a la lista de todos los chats
  useEffect(() => {
    if (!isAdminMaster || (activeTab !== 'admin' && activeTab !== 'support')) return;
    const unsubscribe = subscribeToAllSupportChats((chats) => {
      setAdminChats(chats || {});
    });
    return () => unsubscribe();
  }, [isAdminMaster, activeTab]);

  // Efecto para Admin Master: Suscribirse al chat seleccionado
  useEffect(() => {
    if (!isAdminMaster || !adminSelectedChatUid) return;
    
    // Marcar como leído al seleccionar
    markSupportChatAsRead(adminSelectedChatUid, 'admin');
    
    const unsubscribe = subscribeToSupportChat(adminSelectedChatUid, (data) => {
      setAdminChatData(data);
    });
    return () => unsubscribe();
  }, [isAdminMaster, adminSelectedChatUid]);

  // Autoscroll para chat del Admin
  useEffect(() => {
    if (adminSelectedChatUid && adminChatEndRef.current) {
      adminChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adminChatData.messages, adminSelectedChatUid]);

  const handleSendSupportMessage = async (e) => {
    e.preventDefault();
    if (!supportChatText.trim() || !user?.uid) return;
    try {
      await sendSupportMessage(user.uid, supportChatText.trim());
      setSupportChatText('');
    } catch (e) {
      showToast('❌ Error al enviar mensaje: ' + e.message);
    }
  };

  const handleSendAdminChatMessage = async (e) => {
    e.preventDefault();
    if (!adminChatText.trim() || !adminSelectedChatUid) return;
    try {
      await sendSupportMessage(adminSelectedChatUid, adminChatText.trim());
      setAdminChatText('');
    } catch (e) {
      showToast('❌ Error al responder: ' + e.message);
    }
  };

  // Estado DJ en cabina (persiste en Firebase vía eventSettings)
  const [djOnline, setDjOnline] = useState(() => {
    return eventSettings?.djOnline !== undefined ? eventSettings.djOnline : true;
  });
  const [visualAlertEnabled, setVisualAlertEnabled] = useState(() => {
    return localStorage.getItem('dj_visual_alert_enabled') !== 'false';
  });
  const [visualAlertDuration, setVisualAlertDuration] = useState(() => {
    return parseInt(localStorage.getItem('dj_visual_alert_duration') || '3', 10);
  });
  const [activeVisualAlert, setActiveVisualAlert] = useState(null);
  
  // Integración con Virtual DJ
  const [virtualDJEnabled, setVirtualDJEnabled] = useState(() => {
    return localStorage.getItem('vdj_sync_enabled') === 'true';
  });
  const [virtualDJPath, setVirtualDJPath] = useState(() => {
    return localStorage.getItem('vdj_path') || '';
  });
  const [virtualDJSyncMode, setVirtualDJSyncMode] = useState(() => {
    return localStorage.getItem('vdj_sync_mode') || 'accepted'; // 'all' o 'accepted'
  });
  const [virtualDJFormat, setVirtualDJFormat] = useState(() => {
    return localStorage.getItem('vdj_format') || 'm3u'; // 'm3u' o 'vdjfolder'
  });
  
  const prevRequestsRef = useRef({});

  // Ajustes de Optimización: Gestión de Géneros
  const [genresList, setGenresList] = useState([]);
  const [newGenreInput, setNewGenreInput] = useState('');
  const [editingGenreIndex, setEditingGenreIndex] = useState(null);
  const [editingGenreValue, setEditingGenreValue] = useState('');

  // Ajustes de Optimización: Buscador y Corrector de Ortografía
  const [correctorQuery, setCorrectorQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null); // { id, type, title, artist, genre }
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemArtist, setEditItemArtist] = useState('');
  const [editItemGenre, setEditItemGenre] = useState('');

  // Edición directa desde la cola de peticiones
  const [editingQueueRequestId, setEditingQueueRequestId] = useState(null);
  const [queueEditTitle, setQueueEditTitle] = useState('');
  const [queueEditArtist, setQueueEditArtist] = useState('');
  const [queueEditGenre, setQueueEditGenre] = useState('');

  const handleStartEditQueueRequest = (req) => {
    setEditingQueueRequestId(req.id);
    setQueueEditTitle(req.title || '');
    setQueueEditArtist(req.artist || '');
    setQueueEditGenre(req.genre || '');
  };

  const handleSaveQueueRequestEdit = async (id) => {
    const title = queueEditTitle.trim();
    const artist = queueEditArtist.trim();
    const genre = queueEditGenre.trim();
    if (!title) {
      showToast("⚠️ El título no puede estar vacío");
      return;
    }
    try {
      await updateActiveRequest(id, { title, artist, genre });
      showToast("✅ Petición editada con éxito");
      setEditingQueueRequestId(null);
    } catch (err) {
      console.error(err);
      showToast("❌ Error al guardar la edición");
    }
  };

  // Admin Master: Personalización de planes
  const [editingPlanTab, setEditingPlanTab] = useState('free'); // 'free' | 'premium' | 'vip'
  const [tempPlansConfig, setTempPlansConfig] = useState(null);
  const [savePlansLoading, setSavePlansLoading] = useState(false);
  const [showCreatePlanForm, setShowCreatePlanForm] = useState(false);
  const [newPlanKey, setNewPlanKey] = useState('');
  const [newPlanName, setNewPlanName] = useState('');

  const handleCreateNewPlan = () => {
    const key = newPlanKey.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();
    const name = newPlanName.trim();
    if (!key) {
      showToast("⚠️ El identificador único del plan no puede estar vacío");
      return;
    }
    if (!name) {
      showToast("⚠️ El nombre del plan no puede estar vacío");
      return;
    }
    if (tempPlansConfig && tempPlansConfig[key]) {
      showToast("⚠️ Este plan ya existe");
      return;
    }
    
    setTempPlansConfig(prev => ({
      ...prev,
      [key]: {
        name,
        price: "0",
        billing: "mes",
        currency: "MXN",
        description: "Nuevo plan personalizado.",
        maxRequests: 35,
        duration: 1,
        durationUnit: "meses",
        benefits: ["Nuevo beneficio"],
        restrictions: ["Sin restricciones"]
      }
    }));
    
    setEditingPlanTab(key);
    setShowCreatePlanForm(false);
    setNewPlanKey("");
    setNewPlanName("");
    showToast(`✅ Plan "${name}" creado localmente. Completa sus campos y haz clic en Guardar.`);
  };

  const handleDeletePlan = (planKey) => {
    if (planKey === 'free' || planKey === 'premium' || planKey === 'vip' || planKey === 'pro' || planKey === 'pro_1d') {
      showToast("⚠️ No puedes eliminar los planes principales (Demo, Premium, VIP, PRO, Pro x 1 Día).");
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar el plan "${tempPlansConfig[planKey]?.name || planKey}"?`)) {
      setTempPlansConfig(prev => {
        const copy = { ...prev };
        delete copy[planKey];
        return copy;
      });
      setEditingPlanTab('free');
      showToast("🗑️ Plan eliminado localmente. Recuerda guardar los cambios.");
    }
  };

  useEffect(() => {
    if (plansConfig && !tempPlansConfig) {
      setTempPlansConfig(plansConfig);
    }
  }, [plansConfig, tempPlansConfig]);

  const handleAddPlanBenefit = (planKey) => {
    setTempPlansConfig(prev => {
      const current = prev?.[planKey] || {};
      const benefits = [...(current.benefits || [])];
      benefits.push("");
      return {
        ...prev,
        [planKey]: {
          ...current,
          benefits
        }
      };
    });
  };

  const handleEditPlanBenefit = (planKey, index, val) => {
    setTempPlansConfig(prev => {
      const current = prev?.[planKey] || {};
      const benefits = [...(current.benefits || [])];
      benefits[index] = val;
      return {
        ...prev,
        [planKey]: {
          ...current,
          benefits
        }
      };
    });
  };

  const handleDeletePlanBenefit = (planKey, index) => {
    setTempPlansConfig(prev => {
      const current = prev?.[planKey] || {};
      const benefits = (current.benefits || []).filter((_, i) => i !== index);
      return {
        ...prev,
        [planKey]: {
          ...current,
          benefits
        }
      };
    });
  };

  const handleAddPlanRestriction = (planKey) => {
    setTempPlansConfig(prev => {
      const current = prev?.[planKey] || {};
      const restrictions = [...(current.restrictions || [])];
      restrictions.push("");
      return {
        ...prev,
        [planKey]: {
          ...current,
          restrictions
        }
      };
    });
  };

  const handleEditPlanRestriction = (planKey, index, val) => {
    setTempPlansConfig(prev => {
      const current = prev?.[planKey] || {};
      const restrictions = [...(current.restrictions || [])];
      restrictions[index] = val;
      return {
        ...prev,
        [planKey]: {
          ...current,
          restrictions
        }
      };
    });
  };

  const handleDeletePlanRestriction = (planKey, index) => {
    setTempPlansConfig(prev => {
      const current = prev?.[planKey] || {};
      const restrictions = (current.restrictions || []).filter((_, i) => i !== index);
      return {
        ...prev,
        [planKey]: {
          ...current,
          restrictions
        }
      };
    });
  };

  const handleSavePlansConfig = async (e) => {
    e.preventDefault();
    setSavePlansLoading(true);
    try {
      const cleanedConfig = JSON.parse(JSON.stringify(tempPlansConfig));
      for (const planKey in cleanedConfig) {
        cleanedConfig[planKey].benefits = (cleanedConfig[planKey].benefits || []).map(b => b.trim()).filter(Boolean);
        cleanedConfig[planKey].restrictions = (cleanedConfig[planKey].restrictions || []).map(r => r.trim()).filter(Boolean);
      }
      await updatePlansConfig(cleanedConfig);
      setTempPlansConfig(cleanedConfig);
      showToast("✅ Configuración de planes guardada con éxito");
    } catch (err) {
      console.error(err);
      showToast("❌ Error al guardar la configuración: " + err.message);
    } finally {
      setSavePlansLoading(false);
    }
  };

  // Respaldo de Base de Datos para Admin Master
  const [backupLoading, setBackupLoading] = useState(false);

  const handleDownloadBackup = async () => {
    if (backupLoading) return;
    setBackupLoading(true);
    try {
      const data = await getDatabaseBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const nowStr = new Date().toISOString().split('T')[0];
      link.download = `dj_panel_backup_${nowStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast("💾 Respaldo de base de datos descargado con éxito");
    } catch (error) {
      console.error("Error al descargar respaldo:", error);
      showToast(`❌ Error: ${error.message || "No se pudo generar la copia de seguridad"}`);
    } finally {
      setBackupLoading(false);
    }
  };

  // Notificación de Actualización Global (Admin Master)
  const [updateVersionInput, setUpdateVersionInput] = useState('');
  const [updateNotesInput, setUpdateNotesInput] = useState('');
  const [updateNotificationLoading, setUpdateNotificationLoading] = useState(false);

  const handleSendUpdateNotification = async () => {
    if (updateNotificationLoading) return;
    const version = updateVersionInput.trim();
    if (!version) {
      showToast("⚠️ Por favor escribe el número de versión.");
      return;
    }
    
    setUpdateNotificationLoading(true);
    try {
      const backendUrl = `${API_BASE}/api/admin/notify-update`;
            
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          versionName: version,
          releaseNotes: updateNotesInput.trim()
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        showToast("🚀 Notificación de actualización enviada con éxito.");
        setUpdateVersionInput('');
        setUpdateNotesInput('');
      } else {
        throw new Error(data.error || "Error al enviar la notificación.");
      }
    } catch (error) {
      console.error("Error al enviar notificación global:", error);
      showToast(`❌ Error: ${error.message}`);
    } finally {
      setUpdateNotificationLoading(false);
    }
  };

  // Sincronizar géneros desde base de datos
  useEffect(() => {
    const raw = eventSettings.customGenres || '';
    if (raw.trim() === '') {
      setGenresList([
        'Reggaetón / Urbano',
        'Regional Mexicano (Banda/Norteño)',
        'Cumbia / Sonidero',
        'Pop Latino / Baladas',
        'Rock en Español',
        'Salsa / Bachata',
        'Electrónica / Circuit',
        'Ska / Reggae',
        'Kpop'
      ]);
    } else {
      setGenresList(raw.split(',').map(g => g.trim()).filter(Boolean));
    }
  }, [eventSettings.customGenres]);

  // Obtener géneros creados por los usuarios (que no están en la lista oficial del DJ)
  const userGenres = React.useMemo(() => {
    const frequencyMap = {};
    
    // 1. Contar desde el catálogo de autocompletado global
    if (Array.isArray(autocompleteSongs)) {
      autocompleteSongs.forEach(song => {
        if (song && song.genre && song.genre.trim() && song.genre !== 'Personalizado') {
          const g = song.genre.trim();
          frequencyMap[g] = (frequencyMap[g] || 0) + 1;
        }
      });
    }

    // 2. Contar desde la cola de peticiones activa
    if (requests) {
      Object.values(requests).forEach(req => {
        if (req && req.genre && req.genre.trim() && req.genre !== 'Personalizado') {
          const g = req.genre.trim();
          frequencyMap[g] = (frequencyMap[g] || 0) + 3;
        }
      });
    }

    // Filtrar los que no están en la lista actual de géneros (insensible a mayúsculas)
    return Object.keys(frequencyMap)
      .filter(g => !genresList.some(activeG => activeG.toLowerCase() === g.toLowerCase()))
      .sort((a, b) => frequencyMap[b] - frequencyMap[a]);
  }, [autocompleteSongs, requests, genresList]);

  // Buscar coincidencias de ortografía en la cola de peticiones y autocompletado
  const correctorResults = React.useMemo(() => {
    if (!correctorQuery.trim()) return [];
    const query = correctorQuery.toLowerCase();
    const results = [];
    const seenKeys = new Set(); // Para evitar duplicar

    // Buscar en peticiones activas
    if (requests) {
      Object.entries(requests).forEach(([id, req]) => {
        if (req && (
          (req.title && req.title.toLowerCase().includes(query)) ||
          (req.artist && req.artist.toLowerCase().includes(query)) ||
          (req.genre && req.genre.toLowerCase().includes(query))
        )) {
          const key = `req-${id}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            results.push({
              id,
              type: 'request',
              title: req.title,
              artist: req.artist,
              genre: req.genre,
              votes: req.votes || 0
            });
          }
        }
      });
    }

    // Buscar en autocompletado global
    if (Array.isArray(autocompleteSongs)) {
      autocompleteSongs.forEach(song => {
        if (song && (
          (song.title && song.title.toLowerCase().includes(query)) ||
          (song.artist && song.artist.toLowerCase().includes(query)) ||
          (song.genre && song.genre.toLowerCase().includes(query))
        )) {
          const key = `auto-${song.id}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            results.push({
              id: song.id,
              type: 'autocomplete',
              title: song.title,
              artist: song.artist,
              genre: song.genre
            });
          }
        }
      });
    }

    return results.slice(0, 30);
  }, [correctorQuery, requests, autocompleteSongs]);

  // Añadir un género a la lista
  const handleAddGenre = async () => {
    const trimmed = newGenreInput.trim();
    if (!trimmed) {
      showToast("⚠️ Escribe el nombre del género");
      return;
    }
    if (genresList.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
      showToast("⚠️ Este género ya está en la lista.");
      return;
    }
    const updated = [...genresList, trimmed];
    setGenresList(updated);
    setNewGenreInput('');
    try {
      await updateEventSettings({ customGenres: updated.join(', ') });
      showToast("🎵 Género agregado y guardado");
    } catch (err) {
      showToast("❌ Error al guardar el género");
    }
  };

  // Eliminar un género de la lista
  const handleDeleteGenre = async (genreToDelete) => {
    const updated = genresList.filter(g => g !== genreToDelete);
    setGenresList(updated);
    try {
      await updateEventSettings({ customGenres: updated.join(', ') });
      showToast("🗑️ Género eliminado de la lista");
    } catch (err) {
      showToast("❌ Error al eliminar el género");
    }
  };

  // Guardar edición de género
  const handleSaveEditGenre = async (index) => {
    const trimmed = editingGenreValue.trim();
    if (!trimmed) return;
    const updated = [...genresList];
    updated[index] = trimmed;
    setGenresList(updated);
    setEditingGenreIndex(null);
    setEditingGenreValue('');
    try {
      await updateEventSettings({ customGenres: updated.join(', ') });
      showToast("📝 Género actualizado");
    } catch (err) {
      showToast("❌ Error al guardar actualización");
    }
  };

  // Aprobar género sugerido por usuarios
  const handleApproveUserGenre = async (genreToApprove) => {
    if (genresList.some(g => g.toLowerCase() === genreToApprove.toLowerCase())) {
      showToast("⚠️ Este género ya está en la lista.");
      return;
    }
    const updated = [...genresList, genreToApprove];
    setGenresList(updated);
    try {
      await updateEventSettings({ customGenres: updated.join(', ') });
      showToast(`✅ Género "${genreToApprove}" aprobado y agregado`);
    } catch (err) {
      showToast("❌ Error al aprobar género");
    }
  };

  // Iniciar edición de corrección de ortografía
  const handleStartEditItem = (item) => {
    setEditingItem(item);
    setEditItemTitle(item.title || '');
    setEditItemArtist(item.artist || '');
    setEditItemGenre(item.genre || '');
  };

  // Guardar corrección de ortografía (Active Request or Autocomplete)
  const handleSaveCorrectedItem = async () => {
    if (!editingItem) return;
    const title = editItemTitle.trim();
    const artist = editItemArtist.trim();
    const genre = editItemGenre.trim();

    try {
      if (editingItem.type === 'request') {
        await updateActiveRequest(editingItem.id, {
          title,
          artist,
          genre
        });
        showToast("✅ Petición corregida en tiempo real");
      } else {
        await updateAutocompleteSong(editingItem.id, {
          title,
          artist,
          genre
        });
        showToast("✅ Autocompletado corregido correctamente");
      }
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      showToast("❌ Error al guardar corrección");
    }
  };

  // Eliminar elemento de autocompletado
  const handleDeleteAutocompleteItem = async (songId) => {
    if (window.confirm("¿Deseas eliminar esta sugerencia del catálogo global de autocompletado?")) {
      try {
        await deleteAutocompleteSong(songId);
        showToast("🗑️ Sugerencia eliminada del catálogo");
      } catch (err) {
        showToast("❌ Error al eliminar sugerencia");
      }
    }
  };

  // Sincronizar inputs locales al cambiar de evento
  useEffect(() => {
    setTitleInput(eventSettings.title);
    setDjNameInput(eventSettings.djName);
    setWebNameInput(eventSettings.webName || 'DJ a la Carta');
    setWebNameFontSize(eventSettings.webNameFontSize || 11);
    setDateInput(eventSettings.date || new Date().toISOString().split('T')[0]);
    setPrimaryColor(eventSettings.themeColor || '#7c3aed');
    setSecondaryColor(eventSettings.themeColorSecondary || '#06b6d4');
    setProductionUrl(eventSettings.productionUrl || 'https://dj-vip.vercel.app/');
    setLogoUrlInput(eventSettings.logoUrl || '');
    setFontFamily(eventSettings.fontFamily || 'Outfit');
    setFontSize(eventSettings.fontSize || 'medium');
    setLogoSize(eventSettings.logoSize || 'medium');
    setBgSkinInput(eventSettings.bgSkin || 'default');
    setTipsEnabledInput(eventSettings.tipsEnabled || false);
    setPaypalUsernameInput(eventSettings.paypalUsername || '');
    setMercadopagoLinkInput(eventSettings.mercadopagoLink || '');
    setClabeInput(eventSettings.bankClabe || '');
    setTipCurrencyInput(eventSettings.tipCurrency || 'MXN');
    setDedicationsEnabledInput(eventSettings.dedicationsEnabled || false);
    setCustomGenresInput(eventSettings.customGenres || '');
    setPromoEnabledInput(eventSettings.promoEnabled || false);
    setPromoWhatsappInput(eventSettings.promoWhatsapp || '');
    setPromoWebsiteInput(eventSettings.promoWebsite || '');
    setPromoInstagramInput(eventSettings.promoInstagram || '');
    setPromoTiktokInput(eventSettings.promoTiktok || '');
  }, [eventSettings, currentEventId]);

  // Cargar nombre del tono seleccionado en Android
  useEffect(() => {
    if (window.AndroidApp && window.AndroidApp.getSelectedSoundName) {
      setAndroidSoundName(window.AndroidApp.getSelectedSoundName());
    }
  }, []);

  // Actualizar el título del navegador dinámicamente
  useEffect(() => {
    const webName = eventSettings.webName || 'DJ a la Carta';
    const eventTitle = eventSettings.title ? ` — ${eventSettings.title}` : '';
    document.title = `${webName}${eventTitle}`;
  }, [eventSettings.webName, eventSettings.title]);

  // Sintetizador de audio premium con Web Audio API
  const playNotificationSound = (toneType = selectedTone) => {
    if (!soundEnabled) return;
    
    // Si estamos en Android APK o iOS IPA (móvil nativo), delegamos a la interfaz nativa del dispositivo
    if (window.AndroidApp && !window.electronAPI) {
      if (window.AndroidApp.playSystemNotificationSound) {
        window.AndroidApp.playSystemNotificationSound();
      }
      return;
    }

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      if (toneType === 'chime') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.4);
      } else if (toneType === 'beep') {
        const playBeep = (time, freq) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(0.08, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
          osc.connect(gain); gain.connect(audioCtx.destination);
          osc.start(time); osc.stop(time + 0.1);
        };
        playBeep(now, 880); playBeep(now + 0.12, 880);
      } else if (toneType === 'retro') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.26);
      } else if (toneType === 'synth') {
        const freqs = [261.63, 329.63, 392.00, 523.25];
        freqs.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + i * 0.03);
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'lowpass'; filter.frequency.setValueAtTime(800, now);
          gain.gain.setValueAtTime(0.03, now + i * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
          osc.start(now + i * 0.03); osc.stop(now + 0.35);
        });
      }
    } catch (e) { console.error("Audio Context error", e); }
  };

  const requestNotificationPermission = async () => {
    if (window.electronAPI) {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      localStorage.setItem('dj_notifications_enabled', String(newValue));
      showToast(newValue ? '🔔 Notificaciones activadas' : '❌ Notificaciones desactivadas');
      return;
    }

    if (window.AndroidApp) {
      showToast('🔊 Las notificaciones de Android son nativas. Confirma que tienes concedidos los permisos en los ajustes de tu celular.');
      return;
    }

    if (!('Notification' in window)) {
      showToast('❌ Las notificaciones no están soportadas en este navegador');
      return;
    }
    const permission = await Notification.requestPermission();
    const isGranted = permission === 'granted';
    setNotificationsEnabled(isGranted);
    localStorage.setItem('dj_notifications_enabled', String(isGranted));
    showToast(isGranted ? '🔔 Notificaciones activadas' : '❌ Permiso denegado');
  };

  useEffect(() => {
    const prevCount = Object.keys(prevRequestsRef.current).length;
    const currentKeys = Object.keys(requests);
    const currentCount = currentKeys.length;
    if (currentCount > prevCount) {
      const newKeys = currentKeys.filter(key => !prevRequestsRef.current[key]);
      newKeys.forEach(key => {
        const req = requests[key];
        if (req && req.status === 'pending') {
          // Evitar alertas para peticiones antiguas al iniciar sesión o recargar la página
          const isRecent = req.timestamp && Math.abs(Date.now() - req.timestamp) < 30000;
          if (!isRecent) return;

          playNotificationSound(selectedTone);
          
          if (visualAlertEnabled) {
            let type = 'new';
            if (req.isRepeat) {
              type = 'repeat';
            } else if (req.dedication && req.dedication.trim() !== '') {
              type = 'dedication';
            }
            
            setActiveVisualAlert({
              type,
              title: req.title,
              artist: req.artist
            });
          }

          if (notificationsEnabled && (window.electronAPI || Notification.permission === 'granted')) {
            if (window.electronAPI && window.electronAPI.showNativeNotification) {
              window.electronAPI.showNativeNotification(`Nueva petición: ${req.title}`, `De: ${req.artist} (${req.genre})`, soundEnabled);
            } else {
              new Notification(`Nueva petición: ${req.title}`, {
                body: `De: ${req.artist} (${req.genre})`,
                icon: '/icon-192.png',
                silent: true
              });
            }
          }
        }
      });
    }
    prevRequestsRef.current = requests;
  }, [requests, visualAlertEnabled, notificationsEnabled, selectedTone]);

  useEffect(() => {
    if (activeVisualAlert) {
      const timer = setTimeout(() => {
        setActiveVisualAlert(null);
      }, visualAlertDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [activeVisualAlert, visualAlertDuration]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (virtualDJEnabled && virtualDJPath) {
      const syncVirtualDJPlaylist = async (currentRequests) => {
        // Filtrar según el modo de sincronización
        const filtered = currentRequests.filter(req => {
          if (virtualDJSyncMode === 'all') {
            return req.status !== 'rejected';
          } else {
            return req.status === 'accepted' || req.status === 'playing';
          }
        });

        // Generar contenido basado en el formato
        let filename = '';
        let content = '';

        if (virtualDJFormat === 'm3u') {
          filename = 'Peticiones DJ a la Carta.m3u';
          content = '#EXTM3U\n';
          filtered.forEach(req => {
            content += `#EXTINF:-1,${req.artist} - ${req.title} (${req.genre})\n`;
            content += `${req.artist} - ${req.title}\n`;
          });
        } else if (virtualDJFormat === 'vdjfolder') {
          filename = 'Peticiones DJ a la Carta.vdjfolder';
          content = '<?xml version="1.0" encoding="UTF-8"?>\n<virtualfolder>\n';
          filtered.forEach(req => {
            const safeTitle = (req.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const safeArtist = (req.artist || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            content += `  <song path="${safeArtist} - ${safeTitle}" />\n`;
          });
          content += '</virtualfolder>\n';
        }

        // Invocar API de Electron si está disponible
        if (window.electronAPI && window.electronAPI.writePlaylist) {
          try {
            const res = await window.electronAPI.writePlaylist({
              vdjPath: virtualDJPath,
              filename,
              content
            });
            if (!res.success) {
              console.error('Error al guardar playlist en VirtualDJ:', res.error);
            }
          } catch (err) {
            console.error('Error invocando writePlaylist:', err);
          }
        }
      };

      // Convertir peticiones en array ordenado
      const requestList = Object.keys(requests || {})
        .filter(key => requests[key] !== null && typeof requests[key] === 'object')
        .map(key => ({
          id: key,
          ...requests[key]
        })).sort((a, b) => {
          if (a.status === 'playing' && b.status !== 'playing') return -1;
          if (b.status === 'playing' && a.status !== 'playing') return 1;
          if (b.votes !== a.votes) return b.votes - a.votes;
          return b.timestamp - a.timestamp;
        });

      syncVirtualDJPlaylist(requestList);
    }
  }, [requests, virtualDJEnabled, virtualDJPath, virtualDJSyncMode, virtualDJFormat]);

  const downloadQR = () => {
    const canvasElement = document.getElementById('qr-code-canvas');
    if (!canvasElement) { showToast('❌ No se encontró el código QR en canvas'); return; }

    try {
      const pngUrl = canvasElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `QR-${eventSettings.title || 'evento'}-1500px.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('⬇️ QR de alta calidad (1500px) descargado');
    } catch (err) {
      console.error(err);
      showToast('❌ Error al exportar la imagen del QR');
    }
  };

  const downloadQRSvg = () => {
    const svgElement = document.getElementById('qr-code-svg');
    if (!svgElement) { showToast('❌ No se encontró el código QR'); return; }

    const serializer = new XMLSerializer();
    const svgXml = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = svgUrl;
    link.download = `QR-${eventSettings.title || 'evento'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(svgUrl);
    showToast('⬇️ Código QR (SVG) descargado');
  };

  // Subir Logotipo local
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast("⚠️ Por favor selecciona una imagen válida");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("⚠️ La imagen no debe superar los 2MB");
      return;
    }
    try {
      showToast("⏳ Subiendo logotipo...");
      const url = await uploadLogo(file);
      setLogoUrlInput(url);
      showToast("🖼️ Logotipo subido con éxito");
    } catch (err) {
      console.error(err);
      showToast("❌ Error al subir logotipo. Verifica Firebase Storage.");
    }
  };

  // Guardar configuraciones de Marca
  const handleSaveBranding = async (e) => {
    e.preventDefault();
    if (productionUrl && !productionUrl.startsWith('http')) {
      showToast("⚠️ La URL debe comenzar con https://");
      return;
    }
    try {
      await updateEventSettings({
        title: titleInput,
        djName: djNameInput,
        webName: webNameInput.trim() || 'DJ a la Carta',
        webNameFontSize: parseInt(webNameFontSize, 10) || 11,
        date: dateInput,
        themeColor: primaryColor,
        themeColorSecondary: secondaryColor,
        bgSkin: bgSkinInput,
        productionUrl: productionUrl.trim().replace(/\/$/, ''),
        fontFamily,
        fontSize,
        logoSize,
        tipsEnabled: tipsEnabledInput,
        paypalUsername: paypalUsernameInput.trim(),
        mercadopagoLink: mercadopagoLinkInput.trim(),
        bankClabe: clabeInput.trim(),
        tipCurrency: tipCurrencyInput,
        dedicationsEnabled: dedicationsEnabledInput,
        customGenres: customGenresInput.trim()
      });
      showToast("💾 Configuración de marca guardada");
    } catch (err) {
      console.error('Error guardando configuración:', err);
      const msg = err?.message || '';
      if (msg.includes('PERMISSION_DENIED') || msg.includes('permission')) {
        showToast('⛔ Sin permiso en Firebase. Actualiza las reglas de la BD.');
      } else if (msg.includes('sesión') || msg.includes('session')) {
        showToast('🔒 Sin sesión activa. Cierra sesión y vuelve a entrar.');
      } else {
        showToast(`❌ Error: ${msg.slice(0, 60)}`);
      }
    }
  };

  const handleFeedbackSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!feedbackText.trim()) return;
    setSubmittingFeedback(true);
    try {
      await submitFeedback(feedbackText.trim());
      showToast("✅ ¡Sugerencia enviada! Gracias por ayudarnos a mejorar.");
      setFeedbackText('');
    } catch (err) {
      console.error('Error enviando sugerencia:', err);
      showToast("❌ Error al enviar la sugerencia. Inténtalo de nuevo.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Guardar configuraciones de propinas desde el panel de beneficios
  const handleSaveBenefitsSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      await updateEventSettings({
        tipsEnabled: tipsEnabledInput,
        paypalUsername: paypalUsernameInput.trim(),
        mercadopagoLink: mercadopagoLinkInput.trim(),
        bankClabe: clabeInput.trim(),
        tipCurrency: tipCurrencyInput
      });
      showToast("💾 Configuración de propinas guardada");
    } catch (err) {
      console.error('Error guardando propinas:', err);
      showToast("❌ Error al guardar las propinas");
    }
  };

  // Guardar configuración de Publicidad / Contacto para Contrataciones
  const handleSavePromoSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      await updateEventSettings({
        promoEnabled: promoEnabledInput,
        promoWhatsapp: promoWhatsappInput.trim(),
        promoWebsite: promoWebsiteInput.trim(),
        promoInstagram: promoInstagramInput.trim(),
        promoTiktok: promoTiktokInput.trim()
      });
      showToast("💾 Configuración de contacto/publicidad guardada");
    } catch (err) {
      console.error('Error guardando contacto/publicidad:', err);
      showToast("❌ Error al guardar la configuración");
    }
  };

  // Guardar URL externa de logo
  const handleSaveLogoUrl = async () => {
    if (!logoUrlInput.trim()) {
      showToast('⚠️ Ingresa una URL válida para el logo');
      return;
    }
    if (!logoUrlInput.startsWith('http')) {
      showToast('⚠️ La URL del logo debe comenzar con https://');
      return;
    }
    try {
      await updateEventSettings({ logoUrl: logoUrlInput.trim() });
      showToast('✅ URL de logo guardada correctamente');
    } catch (err) {
      console.error('Error guardando logo URL:', err);
      const msg = err?.message || '';
      if (msg.includes('PERMISSION_DENIED') || msg.includes('permission')) {
        showToast('⛔ Sin permiso en Firebase. Actualiza las reglas de la BD en la consola.');
      } else if (msg.includes('sesión') || msg.includes('session')) {
        showToast('🔒 Sin sesión activa. Cierra sesión y vuelve a entrar.');
      } else {
        showToast(`❌ Error: ${msg.slice(0, 60)}`);
      }
    }
  };

  // Borrado de historial opcional con palabra clave "clear"
  const handleClearHistory = async () => {
    setClearErrorMsg('');
    
    // Validar palabra clave
    if (clearWordConfirm.trim().toLowerCase() !== 'clear') {
      setClearErrorMsg('❌ Debes escribir exactamente "clear" para confirmar la acción.');
      return;
    }

    // Validar que al menos una opción esté seleccionada
    const hasSelectedOption = clearOptionSongs || clearOptionGenres || clearOptionArtists || clearOptionAutocomplete || clearOptionCalendar;
    if (!hasSelectedOption) {
      setClearErrorMsg('⚠️ Selecciona al menos una sección para eliminar.');
      return;
    }

    setClearingHistory(true);
    try {
      await clearHistoryWithOptions({
        songs: clearOptionSongs,
        genres: clearOptionGenres,
        artists: clearOptionArtists,
        autocomplete: clearOptionAutocomplete,
        calendar: clearOptionCalendar
      });
      showToast('🗑️ Datos seleccionados eliminados correctamente');
      
      // Cerrar y resetear modal
      setShowClearModal(false);
      setClearWordConfirm('');
      setClearOptionSongs(false);
      setClearOptionGenres(false);
      setClearOptionArtists(false);
      setClearOptionAutocomplete(false);
      setClearOptionCalendar(false);
    } catch (err) {
      console.error(err);
      setClearErrorMsg(`❌ Error: ${err.message || 'Intenta de nuevo.'}`);
    } finally {
      setClearingHistory(false);
    }
  };

  // Crear nuevo evento desde el panel Calendario
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventTitle.trim()) { showToast('⚠️ El título del evento es requerido'); return; }

    // ── Restricción: Plan Premium = máximo 2 eventos ──────────────────────────
    if ((userProfile?.activePlan || 'free') === 'premium' && eventsList.length >= 2) {
      showToast('⚠️ El plan contratado por el DJ ha alcanzado su límite de 2 eventos. Mejora a VIP para eventos ilimitados.');
      return;
    }

    // ── Verificación preventiva de cooldown 8h (Demo, Premium y Bonus) ───────
    const planActual = userProfile?.activePlan || 'free';
    if (['free', 'premium', 'bonus'].includes(planActual)) {
      const COOLDOWN_MS = 8 * 60 * 60 * 1000;
      const latestCreatedAt = eventsList.reduce((max, ev) => {
        const ts = typeof ev.createdAt === 'number' ? ev.createdAt : 0;
        return ts > max ? ts : max;
      }, 0);
      if (latestCreatedAt > 0 && (Date.now() - latestCreatedAt) < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - (Date.now() - latestCreatedAt);
        const remainingH = Math.floor(remainingMs / 3600000);
        const remainingM = Math.floor((remainingMs % 3600000) / 60000);
        const planLabel = planActual === 'free' ? 'Demo' : (planActual === 'bonus' ? 'Bonus' : 'Premium');
        showToast(`⏳ Plan ${planLabel}: solo puedes crear un evento cada 8 horas. Tiempo restante: ${remainingH}h ${remainingM}min.`);
        return;
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    setCreateEventLoading(true);

    try {
      const slug = newEventTitle.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
      await createNewEvent(slug, newEventTitle.trim(), newEventDjName.trim() || djNameInput, newEventDate, newEventType);
      showToast(`🎉 Evento "${newEventTitle}" creado correctamente`);
      setNewEventTitle('');
      setNewEventDjName('');
      setNewEventDate(new Date().toISOString().split('T')[0]);
      setNewEventType('Otro');
      setShowCreateEventForm(false);
    } catch (err) {
      // Manejo específico del error de cooldown
      if (err?.message?.startsWith('COOLDOWN:')) {
        const tiempoRestante = err.message.replace('COOLDOWN:', '');
        const planLabel = planActual === 'free' ? 'Demo' : (planActual === 'bonus' ? 'Bonus' : 'Premium');
        showToast(`⏳ Plan ${planLabel}: solo puedes crear un evento cada 8 horas. Tiempo restante: ${tiempoRestante}.`);
      } else {
        showToast(`❌ Error al crear evento: ${err.message || ''}`);
      }
    } finally {
      setCreateEventLoading(false);
    }
  };


  // Guardar edición de evento existente
  const handleSaveEditEvent = async (eventId) => {
    if (!editEventTitle.trim()) { showToast('⚠️ El título es requerido'); return; }
    try {
      await updateEventMetadata(eventId, editEventTitle.trim(), editEventDjName.trim() || djNameInput, editEventDate, editEventType);
      showToast('✅ Evento actualizado correctamente');
      setEditingEventId(null);
    } catch (err) {
      showToast(`❌ Error al actualizar: ${err.message || ''}`);
    }
  };

  // Confirmar y eliminar evento
  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteEvent(eventId);
      showToast('🗑️ Evento eliminado');
      setDeletingEventId(null);
    } catch (err) {
      showToast(`❌ Error: ${err.message || ''}`);
    }
  };

  const handleCreateDjAccount = async (e) => {
    e.preventDefault();
    setAddDjError('');
    setAddDjSuccess('');
    if (!newDjEmail.trim() || !newDjPassword.trim()) {
      setAddDjError('⚠️ Email y contraseña son obligatorios.');
      return;
    }
    if (newDjPassword.length < 6) {
      setAddDjError('⚠️ La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setAddDjLoading(true);
    try {
      const result = await createDjAccount(newDjEmail.trim(), newDjPassword, newDjDisplayName.trim());
      setAddDjSuccess(`✅ Cuenta creada: ${result.displayName} (${result.email})`);
      setNewDjEmail(''); setNewDjPassword(''); setNewDjDisplayName('');
      showToast(`🎧 Nuevo DJ registrado: ${result.displayName}`);
    } catch (err) {
      setAddDjError(`❌ ${err.message || 'Error al crear la cuenta.'}`);
    } finally {
      setAddDjLoading(false);
    }
  };

  const handleSaveEditDjAccount = async (uid) => {
    if (!editDjDisplayName.trim() || !editDjEmail.trim()) {
      showToast('⚠️ Nombre y correo electrónico son requeridos.');
      return;
    }
    setEditDjLoading(true);
    try {
      await updateDjAccount(
        uid, 
        editDjEmail.trim(), 
        editDjDisplayName.trim(), 
        editDjPassword.trim() || null, 
        editDjPlan, 
        editDjPlan === 'free' ? editDjDemoLimit : null, 
        editDjPlan === 'free' || editDjPlan === 'premium' ? editDjStrictLimit : null,
        editDjPlan === 'premium' ? editDjPremiumLimit : null,
        editDjPlan === 'vip' ? editDjLogoUploadEnabled : false
      );
      showToast('✅ Datos de registro y plan actualizados correctamente');
      setEditingDjUid(null);
      setEditDjPassword('');
    } catch (err) {
      showToast(`❌ Error al actualizar: ${err.message || ''}`);
    } finally {
      setEditDjLoading(false);
    }
  };

  // Delete a DJ user account (admin only)
  const handleDeleteDjAccount = async (uid) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/deleteUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, secret: import.meta.env.VITE_ADMIN_MASTER_SECRET }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Usuario ${uid} eliminado`);
        // Reload to refresh list
        window.location.reload();
      } else {
        showToast(`❌ Error al eliminar: ${data.error || "unknown"}`);
      }
    } catch (e) {
      showToast(`❌ Error de red: ${e.message}`);
    }
  };

  const [paymentConfig, setPaymentConfig] = useState({
    paypalClientId: '',
    paypalClientSecret: '',
    paypalMode: 'sandbox',
    mercadopagoPublicKey: '',
    mercadopagoAccessToken: '',
    adminClabe: '',
    paypalEnabled: true,
    mercadopagoEnabled: true,
    transferEnabled: true
  });
  const [saveConfigLoading, setSaveConfigLoading] = useState(false);
  const [pendingSubs, setPendingSubs] = useState([]);
  const [pendingSubsLoading, setPendingSubsLoading] = useState(false);
  const [showResetRevenueModal, setShowResetRevenueModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [resetRevenueLoading, setResetRevenueLoading] = useState(false);

  const fetchPaymentConfig = async () => {
    try {
      const secret = import.meta.env.VITE_ADMIN_MASTER_SECRET;
      const res = await fetch(`${API_BASE}/api/admin/getPaymentConfig`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (data.success && data.config) {
        setPaymentConfig(data.config);
      } else {
        showToast(`❌ Configuración: ${data.error || "Error al obtener pasarelas"}`);
      }
    } catch (e) {
      console.error('Error fetching payment config', e);
      showToast(`❌ Error de red (pasarelas): ${e.message}`);
    }
  };

  const fetchPendingSubscriptions = async () => {
    setPendingSubsLoading(true);
    try {
      const secret = import.meta.env.VITE_ADMIN_MASTER_SECRET;
      const res = await fetch(`${API_BASE}/api/admin/listPendingSubscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingSubs(data.pendingSubscriptions || []);
      } else {
        showToast(`❌ Suscripciones: ${data.error || "No se pudo cargar la lista"}`);
      }
    } catch (e) {
      console.error('Error fetching pending subscriptions', e);
      showToast(`❌ Error de red (suscripciones): ${e.message}`);
    } finally {
      setPendingSubsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminMaster) {
      if (activeTab === 'admin') {
        fetchPaymentConfig();
        fetchPendingSubscriptions();
      } else if (activeTab === 'revenue') {
        fetchPaymentConfig();
      }
    }
  }, [isAdminMaster, activeTab]);

  const handleSavePaymentConfig = async (e) => {
    e.preventDefault();
    setSaveConfigLoading(true);
    try {
      const secret = import.meta.env.VITE_ADMIN_MASTER_SECRET;
      const res = await fetch(`${API_BASE}/api/admin/savePaymentConfig`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, config: paymentConfig }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Configuración de pasarelas de pago guardada con éxito.');
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error al guardar configuración: ' + e.message);
    } finally {
      setSaveConfigLoading(false);
    }
  };

  const handleResetRevenue = async (e) => {
    e.preventDefault();
    if (!adminPasswordInput.trim()) {
      showToast('⚠️ Ingresa la contraseña de administrador.');
      return;
    }
    setResetRevenueLoading(true);
    try {
      const secret = adminPasswordInput.trim();
      const res = await fetch(`${API_BASE}/api/admin/resetRevenue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Finanzas y suscripciones restablecidas a cero.');
        setShowResetRevenueModal(false);
        setAdminPasswordInput('');
        await refreshAdminData();
      } else {
        showToast(`❌ Error: ${data.error || 'unknown'}`);
      }
    } catch (err) {
      showToast(`❌ Error de red: ${err.message}`);
    } finally {
      setResetRevenueLoading(false);
    }
  };

  const handleApproveSub = async (uid, plan) => {
    if (!window.confirm(`¿Aprobar el plan ${plan.toUpperCase()} para este usuario?`)) return;
    try {
      const secret = import.meta.env.VITE_ADMIN_MASTER_SECRET;
      const res = await fetch(`${API_BASE}/api/admin/approveSubscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, uid, plan }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Suscripción aprobada con éxito.');
        fetchPendingSubscriptions();
        await refreshAdminData();
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error al aprobar: ' + e.message);
    }
  };

  const handleRejectSub = async (uid) => {
    if (!window.confirm('¿Rechazar el comprobante de este usuario? Su estado volverá a Pago Pendiente.')) return;
    try {
      const secret = import.meta.env.VITE_ADMIN_MASTER_SECRET;
      const res = await fetch(`${API_BASE}/api/admin/rejectSubscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, uid }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Suscripción rechazada.');
        fetchPendingSubscriptions();
        await refreshAdminData();
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error al rechazar: ' + e.message);
    }
  };

  // Enlace público único por DJ — apunta a default-event-{uid} para que cada DJ tenga su propio QR
  const baseUrl = eventSettings.productionUrl || productionUrl || 
    (window.location.protocol !== 'file:' ? window.location.origin : '');
  const effectiveUid = impersonatingUid || user?.uid;
  const uniqueEventKey = currentEventId === 'default-event' && effectiveUid 
    ? `default-event-${effectiveUid}` 
    : currentEventId;
  const publicEventUrl = baseUrl 
    ? `${baseUrl}/?event=${uniqueEventKey}` 
    : `/?event=${uniqueEventKey}`;

  // Filtrar y ordenar peticiones
  const sortedRequests = Object.keys(requests)
    .map(key => ({ id: key, ...requests[key] }))
    .filter(req => filterStatus === 'all' ? true : req.status === filterStatus)
    .sort((a, b) => {
      if (filterSort === 'popularity') {
        if (b.votes !== a.votes) return b.votes - a.votes;
      }
      return b.timestamp - a.timestamp;
    });

  const playedRequestsList = Object.keys(playedRequests || {})
    .map(key => ({ id: key, ...playedRequests[key] }))
    .sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0));

  const stats = {
    total: Object.keys(requests).length + Object.keys(playedRequests || {}).length,
    pending: Object.values(requests).filter(r => r.status === 'pending').length,
    playing: Object.values(playedRequests || {}).filter(r => r.status === 'playing').length,
    votes: Object.values(requests).reduce((sum, r) => sum + (r.votes || 0), 0) + 
           Object.values(playedRequests || {}).reduce((sum, r) => sum + (r.votes || 0), 0)
  };

  // Construir lista de usuarios para el panel admin
  const adminUsersList = Object.keys(allUsersData).map(uid => {
    const userData = allUsersData[uid];
    const events = userData?.events_index ? Object.values(userData.events_index) : [];
    const eventsCount = events.length;
    
    // Obtener nombres de eventos y el djName común
    const eventTitles = events.map(e => e.title);
    
    // Intentar buscar el nombre de DJ y email en el profile, cuentas mock o en los eventos
    let djName = userData?.profile?.displayName || userData?.profile?.djName || 'DJ Sin Nombre';
    let email = userData?.profile?.email || '';

    if (uid === 'uid-admin-master') {
      djName = 'Administrador';
      email = MASTER_ADMIN_EMAIL || 'dj@admin.com';
    } else {
      if (!email || djName === 'DJ Sin Nombre') {
        // Leer MOCK_ACCOUNTS directamente desde localStorage (puede haberse actualizado)
        const allAccounts = (() => {
          try { return JSON.parse(localStorage.getItem('mock_accounts') || '[]'); } catch { return []; }
        })();
        const match = allAccounts.find(a => a.uid === uid) || MOCK_ACCOUNTS.find(a => a.uid === uid);
        if (match) {
          if (djName === 'DJ Sin Nombre') djName = match.displayName;
          if (!email) email = match.email;
        } else if (events.length > 0) {
          if (djName === 'DJ Sin Nombre') djName = events[0].djName;
        }
      }
    }
    
    const requestsCount = Object.values(userData?.events || {}).reduce((sum, ev) => {
      return sum + Object.keys(ev?.requests || {}).length;
    }, 0);
    
    const currentPlan = uid === 'uid-admin-master' ? 'pro' : (userData?.profile?.activePlan || userData?.profile?.subscriptionStatus || 'free');
    const expiresAt = userData?.profile?.expiresAt || 0;
    const extraRequests = userData?.profile?.extraRequests !== undefined ? parseInt(userData.profile.extraRequests, 10) : 0;
    const extraRequestsExpiresAt = userData?.profile?.extraRequestsExpiresAt ? parseInt(userData.profile.extraRequestsExpiresAt, 10) : 0;
    const isExtraValid = extraRequests > 0 && (!extraRequestsExpiresAt || Date.now() <= extraRequestsExpiresAt);
    const activeExtra = isExtraValid ? extraRequests : 0;

    // Fallback for old accounts
    let resolvedExtra = activeExtra;
    if (resolvedExtra === 0) {
      if (currentPlan === 'free') {
        const rawLimit = userData?.profile?.demoLimit !== undefined ? parseInt(userData.profile.demoLimit, 10) : 35;
        const expiresAtVal = userData?.profile?.demoLimitExpiresAt || 0;
        if (rawLimit > 35 && (!expiresAtVal || Date.now() <= expiresAtVal)) {
          resolvedExtra = rawLimit - 35;
        }
      } else if (currentPlan === 'premium') {
        const rawLimit = userData?.profile?.premiumLimit !== undefined ? parseInt(userData.profile.premiumLimit, 10) : 80;
        const expiresAtVal = userData?.profile?.premiumLimitExpiresAt || 0;
        if (rawLimit > 80 && (!expiresAtVal || Date.now() <= expiresAtVal)) {
          resolvedExtra = rawLimit - 80;
        }
      }
    }

    const demoLimit = 35 + resolvedExtra;
    const premiumLimit = 80 + resolvedExtra;
    const demoLimitExpiresAt = extraRequestsExpiresAt || userData?.profile?.demoLimitExpiresAt || 0;
    const premiumLimitExpiresAt = extraRequestsExpiresAt || userData?.profile?.premiumLimitExpiresAt || 0;
    const logoUploadEnabled = userData?.profile?.logoUploadEnabled || false;
    const strictLimitEnabled = userData?.profile?.strictLimitEnabled !== false;
    
    return { uid, eventsCount, requestsCount, djName, eventTitles, email, currentPlan, expiresAt, demoLimit, premiumLimit, demoLimitExpiresAt, premiumLimitExpiresAt, logoUploadEnabled, strictLimitEnabled, extraRequests, extraRequestsExpiresAt };
  });

  const isProUser = (userProfile?.activePlan || 'free') === 'pro' || (userProfile?.activePlan || 'free') === 'pro_1d';
  const currentPlan = userProfile?.activePlan || 'free';
  const isPrintAllowed = ['vip', 'pro', 'pro_1d', 'eventual'].includes(currentPlan) || isAdminMaster;

  return (
    <>
      <div className="no-print" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 15px' }}>
      
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: 'rgba(18, 18, 24, 0.9)',
          border: '1px solid var(--primary-color)', boxShadow: '0 0 15px var(--primary-glow)',
          padding: '12px 24px', borderRadius: 'var(--radius-md)',
          backdropFilter: 'blur(10px)', animation: 'slideIn 0.2s ease-out'
        }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{toastMessage}</p>
        </div>
      )}

      {/* Banner de suscripción pendiente de validación */}
      {(userProfile?.subscriptionStatus === 'pending_validation' || userProfile?.subscriptionStatus === 'pending_payment') && (
        <div style={{
          marginBottom: '16px', padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'
        }}>
          <span style={{ color: '#f59e0b', fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} />
            Mejora en proceso: Tu pago para el plan <strong>{(userProfile?.selectedPlan || '').toUpperCase()}</strong> está pendiente de validación. Disfrutas de tu plan actual entre tanto.
          </span>
          <button
            onClick={() => {
              sessionStorage.removeItem('bypass_payment_lock');
              window.location.reload();
            }}
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              background: '#f59e0b',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(245,158,11,0.2)',
              transition: 'all 0.2s'
            }}
          >
            Ver Estado de Pago
          </button>
        </div>
      )}

      {/* Banner de impersonación (admin viendo un DJ) */}
      {impersonatingUid && (
        <div style={{
          marginBottom: '16px', padding: '12px 20px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
        }}>
          <span style={{ color: 'var(--warning-color)', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} />
            Admin: Viendo panel del usuario <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>{impersonatingUid}</code>
          </span>
          <button
            onClick={stopImpersonating}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Volver al Panel Admin
          </button>
        </div>
      )}

      {/* HEADER DE CABINA */}
      <header className={`glass-panel ${isProUser ? 'pro-gold-frame' : ''}`} style={{
        padding: '20px 30px', borderRadius: 'var(--radius-lg)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '20px', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="flex-center animate-pulse-glow" style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            overflow: 'hidden'
          }}>
            <img src="./logo_vinyl.png" alt="DJ Panel Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              DJ Panel
              <span className="badge badge-playing" style={{ fontSize: '0.65rem' }}>PWA Activo 💻</span>
              {/* Botón de Estado DJ */}
              <button
                onClick={() => {
                  const next = !djOnline;
                  setDjOnline(next);
                  updateEventSettings({ djOnline: next });
                  showToast(next ? '🎧 Estado: EN CABINA' : '⏸ Estado: FUERA DE CABINA');
                }}
                title={djOnline ? 'Haz clic para marcar como Fuera de Cabina' : 'Haz clic para marcar como En Cabina'}
                style={{
                  fontSize: '0.65rem',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  border: djOnline ? '1px solid rgba(34,195,93,0.45)' : '1px solid rgba(232,48,91,0.45)',
                  background: djOnline ? 'rgba(34,195,93,0.15)' : 'rgba(232,48,91,0.12)',
                  color: djOnline ? 'var(--success-color)' : 'var(--danger-color)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.25s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {(() => {
                  const djName = eventSettings.djName || user?.displayName || (user?.email ? user.email.split('@')[0] : 'DJ');
                  return djOnline
                    ? <>🎧 <strong style={{ fontWeight: '800' }}>{djName}</strong>&nbsp;· EN CABINA</>
                    : <>⏸ <strong style={{ fontWeight: '800' }}>{djName}</strong>&nbsp;· FUERA</>;
                })()}
              </button>
              {isAdminMaster && !impersonatingUid && (
                <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '8px', background: 'rgba(245,158,11,0.15)', color: 'var(--warning-color)', fontWeight: '700', border: '1px solid rgba(245,158,11,0.3)' }}>
                  👑 ADMIN MASTER
                </span>
              )}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {impersonatingUid
                ? <span style={{ color: 'var(--warning-color)' }}>Viendo: {impersonatingUid}</span>
                : <>Evento: <strong style={{ color: 'var(--secondary-color)' }}>{eventSettings.title}</strong></>
              }
            </p>
            <p style={{ fontSize: '0.75rem', color: '#facc15', fontWeight: '600', marginTop: '2px', letterSpacing: '0.5px' }}>
              {(() => {
                const plan = userProfile?.activePlan || 'free';
                const planName = plansConfig?.[plan]?.name || (plan === 'free' ? 'Plan Demo' : plan);
                const isFree = plan === 'free';
                const isPremium = plan === 'premium';
                let maxReq = 0;
                let extraQuantity = 0;

                let extraRequests = userProfile?.extraRequests !== undefined ? parseInt(userProfile.extraRequests, 10) : 0;
                let extraRequestsExpiresAt = userProfile?.extraRequestsExpiresAt ? parseInt(userProfile.extraRequestsExpiresAt, 10) : 0;

                // Fallback for old accounts
                if (extraRequests === 0) {
                  if (plan === 'free' && userProfile?.demoLimit !== undefined) {
                    const rawLimit = parseInt(userProfile.demoLimit, 10);
                    if (rawLimit > 35) {
                      extraRequests = rawLimit - 35;
                      extraRequestsExpiresAt = userProfile.demoLimitExpiresAt ? parseInt(userProfile.demoLimitExpiresAt, 10) : 0;
                    }
                  } else if (plan === 'premium' && userProfile?.premiumLimit !== undefined) {
                    const rawLimit = parseInt(userProfile.premiumLimit, 10);
                    if (rawLimit > 80) {
                      extraRequests = rawLimit - 80;
                      extraRequestsExpiresAt = userProfile.premiumLimitExpiresAt ? parseInt(userProfile.premiumLimitExpiresAt, 10) : 0;
                    }
                  }
                }

                const isExtraValid = extraRequests > 0 && (!extraRequestsExpiresAt || Date.now() <= extraRequestsExpiresAt);
                const activeExtra = isExtraValid ? extraRequests : 0;

                if (plan === 'free') {
                  maxReq = 35 + activeExtra;
                  extraQuantity = activeExtra;
                } else if (plan === 'premium') {
                  maxReq = 80 + activeExtra;
                  extraQuantity = activeExtra;
                } else if (plan === 'vip') {
                  maxReq = 0;
                }

                const usedReq = Object.keys(requests || {}).length + Object.keys(playedRequests || {}).length;
                if (maxReq > 0) {
                  const pct = Math.min(100, Math.round((usedReq / maxReq) * 100));
                  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f97316' : '#facc15';
                  return (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>📋 Plan activo: <strong>{planName}{extraQuantity > 0 ? ` +${extraQuantity} Extra` : ''}</strong></span>
                      {extraQuantity > 0 && (
                        <button
                          onClick={() => showToast(`⚡ Tienes ${extraQuantity} peticiones extra contratadas por 30 días.`)}
                          style={{
                            fontSize: '0.7rem',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            border: '1px solid rgba(59, 130, 246, 0.45)',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                            e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.6)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                            e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.45)';
                          }}
                        >
                          +{extraQuantity}
                        </button>
                      )}
                      <span style={{
                        background: pct >= 90 ? 'rgba(239,68,68,0.15)' : pct >= 70 ? 'rgba(249,115,22,0.15)' : 'rgba(250,204,21,0.1)',
                        color: color,
                        padding: '1px 8px',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        border: `1px solid ${color}40`
                      }}>
                        {usedReq} / {maxReq} peticiones
                      </span>
                      {pct >= 100 && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>⛔ Límite alcanzado</span>}
                    </span>
                  );
                }
                return <span>📋 Plan activo: <strong>{planName}</strong> ✨ Peticiones ilimitadas</span>;
              })()}
            </p>

          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Indicador Modo */}
          <div className="glass-panel" style={{ 
            padding: '8px 12px', borderRadius: 'var(--radius-md)', 
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.04)', fontSize: '0.85rem',
            border: isMock ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: isMock ? 'var(--warning-color)' : 'var(--success-color)',
              boxShadow: isMock ? '0 0 8px var(--warning-color)' : '0 0 8px var(--success-color)'
            }} />
            <span style={{ color: isMock ? 'var(--warning-color)' : 'var(--success-color)', fontWeight: '600' }}>
              {isMock ? 'Modo Local' : 'Firebase Conectado'}
            </span>
          </div>

          {/* Indicador Token FCM (Solo en Android) */}
          {window.AndroidApp && (
            <div className="glass-panel" style={{ 
              padding: '8px 12px', borderRadius: 'var(--radius-md)', 
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.04)', fontSize: '0.85rem',
              border: nativeFcmToken ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: nativeFcmToken ? 'var(--success-color)' : 'var(--danger-color)',
                boxShadow: nativeFcmToken ? '0 0 8px var(--success-color)' : '0 0 8px var(--danger-color)'
              }} />
              <span style={{ color: nativeFcmToken ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: '600' }}>
                FCM: {nativeFcmToken ? 'Listo' : '⏳ Obteniendo Token...'}
              </span>
            </div>
          )}

          {/* Sonido */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 'var(--radius-md)' }}>
            <button className="btn btn-secondary btn-icon" 
              onClick={() => { setSoundEnabled(!soundEnabled); showToast(soundEnabled ? '🔇 Sonido apagado' : '🔊 Sonido encendido'); }}
              style={{ width: '36px', height: '36px' }} title={soundEnabled ? "Silenciar" : "Activar Sonido"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <Volume2 size={16} style={{ opacity: 0.4 }} />}
            </button>
            {soundEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {window.AndroidApp && !window.electronAPI ? (
                  // Android APK & iOS IPA (móvil nativo): Mantenemos intacto el selector de tonos locales personalizado
                  <>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                      🔊 Tono: {androidSoundName}
                    </span>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => { if (window.AndroidApp.chooseNotificationSound) window.AndroidApp.chooseNotificationSound(); }}
                      style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    >
                      Cambiar tono
                    </button>
                  </>
                ) : (
                  // Web & macOS / Windows DMG (Escritorio): Usan el selector clásico de tonos sintetizados (sonidos API)
                  <>
                    <select value={selectedTone} onChange={(e) => { const t = e.target.value; setSelectedTone(t); localStorage.setItem('dj_notification_tone', t); playNotificationSound(t); }}
                      className="input-field" style={{ padding: '4px 8px', fontSize: '0.75rem', height: '36px', width: '130px', border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                      <option value="chime">🔔 Campana</option>
                      <option value="beep">📟 Bip Suave</option>
                      <option value="retro">🎮 Alarma Retro</option>
                      <option value="synth">🎹 Pulsos Synth</option>
                    </select>
                    <button className="btn btn-secondary btn-icon" onClick={() => playNotificationSound(selectedTone)}
                      style={{ width: '36px', height: '36px', border: 'none', background: 'transparent' }} title="Probar Sonido">
                      <Volume2 size={14} color="var(--text-secondary)" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Notificaciones Push */}
          <button className="btn btn-secondary btn-icon" onClick={requestNotificationPermission} title="Activar Notificaciones Push">
            {notificationsEnabled ? <Bell size={18} color="var(--secondary-color)" /> : <BellOff size={18} />}
          </button>

          {/* Cerrar Sesión */}
          <button className="btn btn-danger" onClick={logoutDJ} style={{ padding: '10px 18px' }}>
            <LogOut size={16} /><span>Salir</span>
          </button>
        </div>
      </header>

      {/* MÉTRICAS RÁPIDAS */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '500', lineHeight: 1.2 }}>Total<br/>Peticiones</p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '2px' }}>{stats.total}</h3>
          </div>
          <Layers size={18} color="var(--primary-color)" style={{ opacity: 0.6, flexShrink: 0 }} />
        </div>
        <div className="glass-panel" style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '500', lineHeight: 1.2 }}>Por<br/>Aceptar</p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '2px', color: 'var(--warning-color)' }}>{stats.pending}</h3>
          </div>
          <RefreshCw size={18} color="var(--warning-color)" style={{ opacity: 0.6, flexShrink: 0 }} className={stats.pending > 0 ? 'animate-spin' : ''} />
        </div>
        <div className="glass-panel" style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '500', lineHeight: 1.2 }}>Sonando<br/>Ahora</p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '2px', color: 'var(--secondary-color)' }}>{stats.playing}</h3>
          </div>
          <Play size={18} color="var(--secondary-color)" style={{ opacity: 0.6, flexShrink: 0 }} />
        </div>
        <div className="glass-panel" style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '500', lineHeight: 1.2 }}>Votos<br/>Audiencia</p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '2px', color: 'var(--success-color)' }}>{stats.votes}</h3>
          </div>
          <Users size={18} color="var(--success-color)" style={{ opacity: 0.6, flexShrink: 0 }} />
        </div>
        <div className="glass-panel" style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '500', lineHeight: 1.2 }}>Canciones<br/>BD</p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '2px', color: 'var(--primary-color)' }}>{(autocompleteSongs || []).length}</h3>
          </div>
          <Database size={18} color="var(--primary-color)" style={{ opacity: 0.6, flexShrink: 0 }} />
        </div>
        <div className="glass-panel" style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '500', lineHeight: 1.2 }}>Calificación<br/>Servicio</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#f59e0b' }}>{ratingsStats?.avg || 0}</h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({ratingsStats?.total || 0})</span>
            </div>
          </div>
          <Star size={18} color="#f59e0b" style={{ opacity: 0.6, flexShrink: 0 }} />
        </div>
        <div className="glass-panel" style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '500', lineHeight: 1.2 }}>Vigencia<br/>Plan Activo</p>
            <h3 style={{ fontSize: '1rem', marginTop: '2px', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {(userProfile?.activePlan || 'free').toUpperCase()}
              {((userProfile?.activePlan === 'pro' || userProfile?.activePlan === 'pro_1d') && ' 😎')}
            </h3>
            <PlanValidityDisplay activePlan={userProfile?.activePlan || 'free'} expiresAt={userProfile?.expiresAt} />
          </div>
          <Clock size={18} color="#a855f7" style={{ opacity: 0.6, flexShrink: 0 }} />
        </div>
        {isAdminMaster && (
          <div className="glass-panel" style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '500', lineHeight: 1.2 }}>DJs<br/>Registrados</p>
              <h3 style={{ fontSize: '1.25rem', marginTop: '2px', color: '#06b6d4' }}>
                {Object.keys(allUsersData || {}).filter(uid => uid !== 'uid-admin-master' && allUsersData[uid]?.profile?.email !== 'dj@admin.com').length}
              </h3>
            </div>
            <Users size={18} color="#06b6d4" style={{ opacity: 0.6, flexShrink: 0 }} />
          </div>
        )}
      </section>

      {/* PANEL PRINCIPAL */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* COLUMNA IZQUIERDA */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <nav className="glass-panel" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('requests')} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Music size={16} /><span>Lista de Peticiones</span>
            </button>
            <button className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('settings')} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Settings size={16} /><span>Personalizar mi Panel</span>
              {(!currentPlan || currentPlan === 'free') && <Lock size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
            </button>
            <button className={`btn ${activeTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('calendar')} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Calendar size={16} /><span>Mis Eventos</span>
              {eventsList.length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: 'rgba(124,58,237,0.15)', color: 'var(--primary-color)', padding: '2px 6px', borderRadius: '8px', fontWeight: '700' }}>
                  {eventsList.length}
                </span>
              )}
            </button>
            <button className={`btn ${activeTab === 'optimization' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('optimization')} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Sliders size={16} /><span>Ajustes de Optimización</span>
              {(!currentPlan || currentPlan === 'free' || currentPlan === 'premium') && <Lock size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
            </button>
            <button className={`btn ${activeTab === 'benefits' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('benefits')} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Sparkles size={16} /><span>Beneficios para el DJ</span>
              {(!currentPlan || currentPlan === 'free' || currentPlan === 'premium') && <Lock size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
            </button>
            {/* Tab Admin: solo visible para dj@admin.com sin impersonar */}
            {isAdminMaster && !impersonatingUid && (
              <>
                <button className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('admin')} style={{ justifyContent: 'flex-start', width: '100%', borderColor: activeTab === 'admin' ? undefined : 'rgba(245,158,11,0.2)' }}>
                  <UserCog size={16} /><span>Panel Admin</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: 'rgba(245,158,11,0.15)', color: 'var(--warning-color)', padding: '2px 6px', borderRadius: '8px', fontWeight: '700' }}>MASTER</span>
                </button>
                <button className={`btn ${activeTab === 'support' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('support')} style={{ justifyContent: 'flex-start', width: '100%', borderColor: activeTab === 'support' ? undefined : 'rgba(124,58,237,0.2)' }}>
                  <MessageSquare size={16} /><span>Soporte PRO</span>
                  {Object.values(adminChats || {}).reduce((acc, chat) => acc + (chat.metadata?.unreadCountByAdmin || 0), 0) > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: '0.65rem',
                      background: 'red',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontWeight: '700'
                    }}>
                      {Object.values(adminChats || {}).reduce((acc, chat) => acc + (chat.metadata?.unreadCountByAdmin || 0), 0)}
                    </span>
                  )}
                </button>
                <button className={`btn ${activeTab === 'admin_profile' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('admin_profile')} style={{ justifyContent: 'flex-start', width: '100%', borderColor: activeTab === 'admin_profile' ? undefined : 'rgba(124,58,237,0.2)' }}>
                  <User size={16} /><span>Mi Perfil Admin</span>
                </button>
                <button className={`btn ${activeTab === 'revenue' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('revenue')} style={{ justifyContent: 'flex-start', width: '100%', borderColor: activeTab === 'revenue' ? undefined : 'rgba(16,185,129,0.2)' }}>
                  <TrendingUp size={16} /><span>Finanzas</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: 'rgba(16,185,129,0.15)', color: 'var(--success-color)', padding: '2px 6px', borderRadius: '8px', fontWeight: '700' }}>INGRESOS</span>
                </button>
              </>
            )}
          </nav>

          {/* QR del Evento */}
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Código QR para el Público</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Muestra o descarga este QR para que el público escanee y acceda a la web app.
            </p>
            <div className="flex-center" style={{ background: '#fff', padding: '15px', borderRadius: 'var(--radius-md)', display: 'inline-flex', boxShadow: 'var(--shadow-sm)', marginBottom: '16px' }}>
              <QRCodeSVG id="qr-code-svg" value={publicEventUrl} size={180} level={"H"} includeMargin={false} />
              <div style={{ display: 'none' }}>
                <QRCodeCanvas id="qr-code-canvas" value={publicEventUrl} size={1500} level={"H"} includeMargin={true} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={downloadQR} style={{ width: '100%', padding: '10px' }}>
                <Download size={14} /><span>Descargar QR PNG (1500px)</span>
              </button>
              <button className="btn btn-secondary" onClick={downloadQRSvg} style={{ width: '100%', padding: '10px' }}>
                <Download size={14} /><span>Descargar QR SVG (Vectorial)</span>
              </button>
              <a href={publicEventUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: '100%', padding: '10px', textDecoration: 'none', justifyContent: 'center' }}>
                <ExternalLink size={14} /><span>Abrir Panel del Público</span>
              </a>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (!isPrintAllowed) {
                    showToast("🔒 La impresión de tarjetas QR en tamaño A4 es una función exclusiva para planes VIP, PRO y Eventual. ¡Mejora tu plan para desbloquearla!");
                  } else {
                    if (window.AndroidApp && window.AndroidApp.printPage) {
                      window.AndroidApp.printPage();
                    } else {
                      window.print();
                    }
                  }
                }}
                style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Printer size={14} />
                <span>Imprimir Tarjetas QR (A4)</span>
                {!isPrintAllowed && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
              </button>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all', marginTop: '4px' }}>
                {publicEventUrl}
              </div>
            </div>
          </div>
        </aside>

        {/* COLUMNA DERECHA */}
        <main>

          {/* 1. LISTA DE PETICIONES */}
          {activeTab === 'requests' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={20} color="var(--primary-color)" />
                  Peticiones en Cola
                </h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={async () => {
                      if (window.confirm("⚠️ ¿Estás seguro?\n\nEsto borrará:\n• Todas las Peticiones en Cola\n• Todo el Historial de Ya Reproducidas\n\nEsta acción no se puede deshacer.")) {
                        try {
                          await clearActiveAndPlayedRequests();
                          showToast("🧹 Lista de peticiones e historial de reproducidas limpiados con éxito");
                        } catch (err) {
                          console.error(err);
                          showToast(`❌ Error: ${err.message || "No se pudo limpiar la lista"}`);
                        }
                      }
                    }}
                    className="btn btn-danger"
                    style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Borra toda la cola de peticiones Y el historial de Ya Reproducidas"
                  >
                    <Trash2 size={14} />
                    <span>Limpiar Lista de Peticiones</span>
                  </button>
                  <select className="input-field" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}>
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="accepted">Aceptadas</option>
                    <option value="playing">Reproduciendo</option>
                    <option value="rejected">Declinadas</option>
                  </select>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
                    <button onClick={() => setFilterSort('time')} style={{ padding: '6px 12px', background: filterSort === 'time' ? 'var(--primary-color)' : 'transparent', border: 'none', borderRadius: 'calc(var(--radius-md) - 3px)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Más Recientes</button>
                    <button onClick={() => setFilterSort('popularity')} style={{ padding: '6px 12px', background: filterSort === 'popularity' ? 'var(--primary-color)' : 'transparent', border: 'none', borderRadius: 'calc(var(--radius-md) - 3px)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>Más Votadas 🔥</button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedRequests.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Ninguna petición coincide con los filtros aplicados.
                  </div>
                ) : (
                  sortedRequests.map((req) => (
                    <div key={req.id} className="glass-panel" style={{
                      padding: '16px 20px', borderRadius: 'var(--radius-md)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap',
                      borderLeft: req.status === 'playing' ? '4px solid var(--secondary-color)' :
                                  req.status === 'accepted' ? '4px solid var(--success-color)' :
                                  req.status === 'rejected' ? '4px solid var(--danger-color)' : '4px solid var(--warning-color)'
                    }}>
                      {editingQueueRequestId === req.id ? (
                        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.7rem' }}>Canción</label>
                              <input 
                                type="text" 
                                className="input-field" 
                                value={queueEditTitle} 
                                onChange={(e) => setQueueEditTitle(e.target.value)} 
                                style={{ fontSize: '0.8rem', padding: '6px 10px' }} 
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.7rem' }}>Artista</label>
                              <input 
                                type="text" 
                                className="input-field" 
                                value={queueEditArtist} 
                                onChange={(e) => setQueueEditArtist(e.target.value)} 
                                style={{ fontSize: '0.8rem', padding: '6px 10px' }} 
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.7rem' }}>Género</label>
                              <input 
                                type="text" 
                                className="input-field" 
                                value={queueEditGenre} 
                                onChange={(e) => setQueueEditGenre(e.target.value)} 
                                style={{ fontSize: '0.8rem', padding: '6px 10px' }} 
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleSaveQueueRequestEdit(req.id)} 
                              className="btn btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Check size={12} /> Guardar
                            </button>
                            <button 
                              onClick={() => setEditingQueueRequestId(null)} 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <X size={12} /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{req.title}</span>
                            {req.status === 'pending'   && <span className="badge badge-pending">En espera</span>}
                            {req.status === 'accepted'  && <span className="badge badge-accepted">Aceptada</span>}
                            {req.status === 'playing'   && <span className="badge badge-playing animate-pulse-glow">En Reproducción 🎵</span>}
                            {req.status === 'rejected'  && <span className="badge badge-rejected">Rechazada</span>}
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>{req.artist}</span>
                            <span>•</span>
                            {req.genre ? (
                              req.genre.split('/').map((g, idx) => (
                                <span key={idx} style={{
                                  display: 'inline-block',
                                  background: 'rgba(6, 182, 212, 0.08)',
                                  color: 'var(--secondary-color)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  border: '1px solid rgba(6, 182, 212, 0.15)'
                                }}>
                                  {g.trim()}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Sin género</span>
                            )}
                          </p>
                          {req.dedication && (
                            <div style={{
                              fontSize: '0.85rem',
                              color: 'var(--warning-color)',
                              background: 'rgba(245, 158, 11, 0.05)',
                              borderLeft: '3px solid var(--warning-color)',
                              padding: '6px 12px',
                              margin: '8px 0',
                              borderRadius: '4px',
                              fontWeight: '500',
                              textAlign: 'left'
                            }}>
                              💬 Dedicatoria: "{req.dedication}"
                            </div>
                          )}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Recibido: {new Date(req.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Votos</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>{req.votes}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {editingQueueRequestId !== req.id && (
                            <button onClick={() => handleStartEditQueueRequest(req)}
                              className="btn btn-secondary btn-icon" style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-secondary)' }} title="Editar Petición">
                              <Edit size={16} />
                            </button>
                          )}
                          {req.status !== 'accepted' && req.status !== 'playing' && (
                            <button onClick={() => { updateRequestStatus(req.id, 'accepted'); showToast(`Aceptaste: ${req.title}`); }}
                              className="btn btn-secondary btn-icon" style={{ border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--success-color)' }} title="Aceptar">
                              <Check size={16} />
                            </button>
                          )}
                          {req.status !== 'playing' && (
                            <button onClick={() => { updateRequestStatus(req.id, 'playing'); showToast(`Sonando: ${req.title}`); }}
                              className="btn btn-secondary btn-icon" style={{ border: '1px solid rgba(6, 182, 212, 0.4)', color: 'var(--secondary-color)' }} title="Poner a Sonar">
                              <Play size={16} />
                            </button>
                          )}
                          {req.status !== 'rejected' && (
                            <button onClick={() => { updateRequestStatus(req.id, 'rejected'); showToast(`Rechazaste: ${req.title}`); }}
                              className="btn btn-secondary btn-icon" style={{ border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--danger-color)' }} title="Declinar">
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* HISTORIAL DE CANCIONES YA REPRODUCIDAS */}
              {playedRequestsList.length > 0 && (
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <span>✅ Historial: Ya Reproducidas ({playedRequestsList.length})</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {playedRequestsList.map((req) => (
                      <div key={req.id} className="glass-panel" style={{
                        padding: '12px 16px', borderRadius: 'var(--radius-md)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.03)'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              fontWeight: '600', 
                              color: 'var(--text-muted)', 
                              textDecoration: 'line-through',
                              fontSize: '0.95rem'
                            }}>
                              {req.title}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>{req.artist}</span>
                            <span>•</span>
                            {req.genre ? (
                              req.genre.split('/').map((g, idx) => (
                                <span key={idx} style={{
                                  display: 'inline-block',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  color: 'var(--text-muted)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  border: '1px solid rgba(255, 255, 255, 0.05)'
                                }}>
                                  {g.trim()}
                                </span>
                              ))
                            ) : (
                              <span>Sin género</span>
                            )}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {req.dedication && (
                            <span 
                              title={`Dedicatoria: ${req.dedication}`} 
                              style={{ cursor: 'help', fontSize: '1.1rem' }}
                            >
                              💬
                            </span>
                          )}
                          {req.playedAt && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Reproducida: {new Date(req.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Melodías más pedidas (Top Popularidad Global) */}
              {(() => {
                const sortedSongs = (autocompleteSongs || [])
                  .filter(s => s && s.title)
                  .map(s => ({
                    title: s.title,
                    artist: s.artist || 'Artista no especificado',
                    genre: s.genre || '',
                    votes: s.globalRequests || 1
                  }))
                  .sort((a, b) => b.votes - a.votes);

                if (sortedSongs.length === 0) return null;
                
                const topSongs = sortedSongs.slice(0, 10);

                return (
                  <div style={{ marginTop: '24px', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Music size={14} color="var(--primary-color)" />
                      Melodías más pedidas (Top Global)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {topSongs.map((song, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.04)',
                          borderRadius: 'var(--radius-md)',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                            <span style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: index === 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: index === 0 ? 'var(--warning-color)' : 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              flexShrink: 0
                            }}>
                              {index + 1}
                            </span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {song.title}
                              </p>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {song.artist}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {song.genre && (
                              <span style={{
                                background: 'rgba(6, 182, 212, 0.08)',
                                color: 'var(--secondary-color)',
                                border: '1px solid rgba(6, 182, 212, 0.15)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: '600'
                              }}>
                                {song.genre.split('/')[0].trim()}
                              </span>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: 'rgba(236, 72, 153, 0.08)',
                                border: '1px solid rgba(236, 72, 153, 0.15)',
                                color: '#ec4899',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                ❤️ {song.votes} {song.votes === 1 ? 'voto global' : 'votos globales'}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                Pedida {song.votes} {song.votes === 1 ? 'vez' : 'veces'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Géneros aprendidos */}
              {(() => {
                const genreCount = {};
                Object.values(requests).forEach(r => { 
                  if (r.genre && r.genre !== 'Personalizado') {
                    r.genre.split('/').forEach(g => {
                      const cleanG = g.trim();
                      if (cleanG) genreCount[cleanG] = (genreCount[cleanG] || 0) + 1;
                    });
                  }
                });
                autocompleteSongs.forEach(s => { 
                  if (s.genre && s.genre !== 'Personalizado') {
                    s.genre.split('/').forEach(g => {
                      const cleanG = g.trim();
                      if (cleanG) genreCount[cleanG] = (genreCount[cleanG] || 0) + 1;
                    });
                  }
                });
                const sorted = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
                if (sorted.length === 0) return null;
                return (
                  <div style={{ marginTop: '24px', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} color="var(--secondary-color)" />
                      Géneros más pedidos (aprendidos del público)
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {sorted.map(([genre, count]) => (
                        <span key={genre} style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', color: 'var(--secondary-color)', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {genre}<span style={{ background: 'rgba(6,182,212,0.2)', borderRadius: '10px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: '800' }}>{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}



          {/* 2. PERSONALIZACIÓN DE MARCA */}
          {activeTab === 'settings' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--primary-color)" />
                Configuración de Marca
              </h2>

              {(!currentPlan || currentPlan === 'free') ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--warning-color)',
                    marginBottom: '10px'
                  }}>
                    <Lock size={30} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>Función Exclusiva para Planes de Pago</h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '450px', lineHeight: '1.6' }}>
                    La personalización de marca (logotipo propio, nombre de plataforma web, colores y tipografía) no está disponible en la cuenta Demo.
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--warning-color)', fontWeight: '600' }}>
                    Adquiere el Plan Premium, VIP o un pase Eventual para desbloquear esta sección.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setActiveTab('benefits')}
                    style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    📦 Ver Planes y Beneficios
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Logo Personalizado - Visible para Admin Master, Premium, VIP y PRO */}
                {(isAdminMaster || currentPlan === 'premium' || currentPlan === 'vip' || currentPlan === 'pro') && (
                <div className="form-group" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Image size={15} color="var(--secondary-color)" />
                    Logotipo Personalizado (Marca)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                    {/* Vista previa */}
                    <div style={{ width: '90px', height: '90px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {(eventSettings.logoUrl || logoUrlInput) ? (
                        <img src={logoUrlInput || eventSettings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <Music size={30} color="var(--text-muted)" />
                      )}
                    </div>
                    {/* Controles de Subida / URL */}
                    <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      
                      {/* Opción A: Subir Archivo - Solo Admin Master, PRO, o VIP con logoUploadEnabled */}
                      {(isAdminMaster || currentPlan === 'pro' || (currentPlan === 'vip' && userProfile?.logoUploadEnabled)) && (
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
                            Opción A: Subir desde tu computadora
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>
                      )}

                      {(isAdminMaster || currentPlan === 'pro' || (currentPlan === 'vip' && userProfile?.logoUploadEnabled)) && (
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                      )}

                      {/* Opción B: URL Externa - Visible para Premium, VIP y Admin Master */}
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
                          Opción B: URL externa de imagen
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="url"
                            className="input-field"
                            placeholder="https://ejemplo.com/mi-logo.png"
                            value={logoUrlInput}
                            onChange={(e) => setLogoUrlInput(e.target.value)}
                            style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                          />
                          <button type="button" className="btn btn-secondary" onClick={handleSaveLogoUrl} style={{ whiteSpace: 'nowrap', padding: '8px 14px', fontSize: '0.85rem' }}>
                            <Link size={13} style={{ marginRight: '4px' }} />Aplicar URL
                          </button>
                        </div>
                      </div>

                      {/* Botón de Limpiar */}
                      {(logoUrlInput || eventSettings.logoUrl) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                          <button type="button" onClick={() => { setLogoUrlInput(''); updateEventSettings({ logoUrl: '' }); showToast('Logo eliminado'); }}
                            style={{ alignSelf: 'flex-start', fontSize: '0.75rem', color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <X size={12} /> Quitar logotipo
                          </button>

                          <div style={{ marginTop: '6px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
                              Tamaño de visualización del logotipo (público)
                            </span>
                            <select 
                              className="input-field" 
                              value={logoSize} 
                              onChange={(e) => { setLogoSize(e.target.value); updateEventSettings({ logoSize: e.target.value }); showToast("📏 Tamaño del logo actualizado"); }} 
                              style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto', minWidth: '160px', cursor: 'pointer' }}
                            >
                              <option value="small">Pequeño (50px)</option>
                              <option value="medium">Mediano (75px)</option>
                              <option value="large">Grande (100px)</option>
                              <option value="xlarge">Extra Grande (130px)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}

                {/* URL de Producción (Vercel) - Solo visible para Admin Master */}
                {isAdminMaster && (
                <div className="form-group" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔗 URL de Producción (Vercel)
                    <span style={{ fontSize: '0.7rem', color: 'var(--warning-color)', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>REQUERIDA PARA QR</span>
                  </label>
                  <input type="url" className="input-field" placeholder="https://mi-app.vercel.app" value={productionUrl} onChange={(e) => setProductionUrl(e.target.value)} />
                  <p style={{ fontSize: '0.75rem', color: productionUrl ? 'var(--success-color)' : 'var(--warning-color)', marginTop: '6px' }}>
                    {productionUrl ? `✅ QR generará: ${productionUrl}/?event=${currentEventId}` : '⚠️ Sin URL configurada el QR no funcionará en la app de escritorio.'}
                  </p>
                </div>
                )}

                {/* Nombre de la Web / Plataforma - Solo VIP/Eventual */}
                {currentPlan !== 'premium' && (
                <div className="form-group" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={15} color="var(--primary-color)" />
                    Nombre de la Plataforma / Web
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="DJ a la Carta"
                    value={webNameInput}
                    onChange={(e) => setWebNameInput(e.target.value)}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Este nombre aparecerá en el título de la pestaña del navegador y en el pie de página de la plataforma.
                  </p>
                </div>
                )}

                {/* Tamaño de letra del Nombre de la Plataforma - Solo VIP/Eventual */}
                {currentPlan !== 'premium' && (
                <div className="form-group" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={15} color="var(--primary-color)" />
                    Tamaño de letra del Nombre de la Plataforma (en Píxeles)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="number"
                      className="input-field"
                      min="8"
                      max="32"
                      value={webNameFontSize}
                      onChange={(e) => setWebNameFontSize(parseInt(e.target.value, 10) || 11)}
                      style={{ width: '100px' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>px (Predeterminado: 11px)</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Ajusta el tamaño del título de la plataforma que se muestra arriba en la vista del cliente.
                  </p>
                </div>
                )}

                {/* Títulos y Fecha - Solo VIP/Eventual */}
                {currentPlan !== 'premium' && (<>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Título del Evento (Público)</label>
                    <input type="text" className="input-field" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre del DJ en Cabina</label>
                    <input type="text" className="input-field" value={djNameInput} onChange={(e) => setDjNameInput(e.target.value)} required />
                  </div>
                </div>

                {/* Fecha del Evento */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={15} color="var(--secondary-color)" />
                    Fecha del Evento
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    style={{ maxWidth: '280px' }}
                  />
                </div>
                </>)}

                {/* Paleta de Colores - Solo VIP/Eventual */}
                {currentPlan !== 'premium' && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <label className="form-label">Esquema de Colores Dinámico</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Personaliza los colores que verá el público. Los estilos se adaptan en caliente.
                  </p>
                  <div style={{ display: 'flex', gap: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '44px', height: '44px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block' }}>Color Primario</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Botones y Títulos</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} style={{ width: '44px', height: '44px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block' }}>Color Secundario</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status y Destacados</span>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎨 Tema / Color de Fondo
                    {!(currentPlan === 'vip' || currentPlan === 'eventual' || isProUser) && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--warning-color)', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        🔒 EXCLUSIVO VIP / EVENTUAL / PRO
                      </span>
                    )}
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Personaliza el fondo del sitio y del panel del público con una paleta de alto contraste.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {(() => {
                      const isSkinUnlocked = (skinKey) => {
                        if (skinKey === 'default') return true;
                        if (skinKey === 'skin_luxury' || skinKey === 'skin_crystal') return isProUser;
                        return ['vip', 'eventual', 'pro'].includes(currentPlan);
                      };

                      return [
                        { key: 'default', name: 'Original', color: '#060609' },
                        { key: 'skin1', name: 'Carbón', color: '#383636' },
                        { key: 'skin2', name: 'Púrpura', color: '#380357' },
                        { key: 'skin3', name: 'Azul', color: '#032557' },
                        { key: 'skin4', name: 'Turquesa', color: '#02313f' },
                        { key: 'skin5', name: 'Guinda', color: '#3f020a' },
                        { key: 'skin_luxury', name: 'Luxury', color: '#d4af37' },
                        { key: 'skin_crystal', name: 'Crystal', color: '#7c3aed' }
                      ].map((skin) => {
                        const isSelected = bgSkinInput === skin.key;
                        const unlocked = isSkinUnlocked(skin.key);
                        return (
                          <button
                            key={skin.key}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => {
                              setBgSkinInput(skin.key);
                              showToast(`Tema seleccionado: ${skin.name}`);
                            }}
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-md)',
                              background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                              border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
                              cursor: unlocked ? 'pointer' : 'not-allowed',
                              opacity: unlocked ? 1 : 0.4,
                              transition: 'all 0.2s ease',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ width: '18px', height: '18px', borderRadius: 'var(--radius-full)', background: skin.color, border: '2px solid rgba(255,255,255,0.2)', boxShadow: isSelected ? '0 0 10px var(--primary-glow)' : 'none', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? '700' : '500', color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {skin.name} {!unlocked && '🔒'}
                            </span>
                          </button>
                        );
                      });
                    })()}
                  </div>
                  {!(currentPlan === 'vip' || currentPlan === 'eventual' || isProUser) ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--warning-color)', marginTop: '8px' }}>
                      💡 Mejora tu plan a <strong>VIP</strong>, <strong>PRO</strong> o adquiere un pase <strong>Eventual</strong> en la sección de planes para desbloquear esta personalización.
                    </p>
                  ) : (
                    !isProUser && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        👑 Adquiere el plan <strong>PRO</strong> para desbloquear los exclusivos temas <strong>Luxury</strong> y <strong>Crystal</strong>.
                      </p>
                    )
                  )}
                </div>

                {/* Tipografía y Escala - Solo VIP/Eventual */}
                {currentPlan !== 'premium' && (<>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Tipografía / Fuente del Sitio</label>
                    <select className="input-field" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} style={{ cursor: 'pointer' }}>
                      <option value="Outfit">Outfit (Moderna/Sleek)</option>
                      <option value="Inter">Inter (Limpia/Minimalista)</option>
                      <option value="Roboto">Roboto (Clásica/Geométrica)</option>
                      <option value="Montserrat">Montserrat (Llamativa/Ancha)</option>
                      <option value="Playfair Display">Playfair Display (Elegante/Serif)</option>
                      <option value="Caveat">Caveat (Manuscrita/Divertida)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Escala / Tamaño de Texto</label>
                    <select className="input-field" value={fontSize} onChange={(e) => setFontSize(e.target.value)} style={{ cursor: 'pointer' }}>
                      <option value="small">Pequeño</option>
                      <option value="medium">Mediano (Estándar)</option>
                      <option value="large">Grande</option>
                      <option value="xlarge">Extra Grande</option>
                    </select>
                  </div>
                </div>
                </>)}

                {/* Módulo de Comentarios o Dedicatorias - Solo VIP/Eventual */}
                {currentPlan !== 'premium' && (<>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontWeight: '600' }}>
                    💬 Módulo de Dedicatorias y Comentarios
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Permite que tu audiencia te deje comentarios o dedicatorias al momento de enviar sus peticiones de canciones.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="dedications-enabled"
                      checked={dedicationsEnabledInput} 
                      onChange={(e) => setDedicationsEnabledInput(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="dedications-enabled" style={{ fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                      Habilitar apartado de Comentario/Dedicatoria para el público
                    </label>
                  </div>
                </div>
                </>)}

                {/* Opciones de la Aplicación de Escritorio */}
                {window.electronAPI && window.electronAPI.isDesktop && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontWeight: '600' }}>
                      🖥️ Aplicación de Escritorio (Desktop)
                      {!(isProUser || isAdminMaster) && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--warning-color)', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          🔒 EXCLUSIVO PLAN PRO
                        </span>
                      )}
                    </label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Configura el comportamiento de la aplicación de escritorio en tu computadora.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: (isProUser || isAdminMaster) ? 1 : 0.5 }}>
                      <input 
                        type="checkbox" 
                        id="minimize-to-tray-checkbox"
                        disabled={!(isProUser || isAdminMaster)}
                        checked={minimizeToTrayInput} 
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setMinimizeToTrayInput(checked);
                          if (window.AndroidApp && typeof window.AndroidApp.setMinimizeToTray === 'function') {
                            window.AndroidApp.setMinimizeToTray(checked);
                          }
                          showToast(checked ? "📥 Minimizar al tray activado" : "❌ Minimizar al tray desactivado");
                        }}
                        style={{ width: '18px', height: '18px', cursor: (isProUser || isAdminMaster) ? 'pointer' : 'not-allowed' }}
                      />
                      <label htmlFor="minimize-to-tray-checkbox" style={{ fontSize: '0.9rem', fontWeight: '600', cursor: (isProUser || isAdminMaster) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Minimizar la app a la barra de menú / System Tray al cerrar la ventana
                        {!(isProUser || isAdminMaster) && <Lock size={14} style={{ opacity: 0.8 }} />}
                      </label>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
                  <button type="submit" className="btn btn-primary">Guardar Configuración</button>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setTitleInput(eventSettings.title); setDjNameInput(eventSettings.djName);
                    setPrimaryColor(eventSettings.themeColor || '#7c3aed');
                    setSecondaryColor(eventSettings.themeColorSecondary || '#06b6d4');
                    setFontFamily(eventSettings.fontFamily || 'Outfit');
                    setFontSize(eventSettings.fontSize || 'medium');
                    setTipsEnabledInput(eventSettings.tipsEnabled || false);
                    setPaypalUsernameInput(eventSettings.paypalUsername || '');
                    setMercadopagoLinkInput(eventSettings.mercadopagoLink || '');
                    setClabeInput(eventSettings.bankClabe || '');
                    setTipCurrencyInput(eventSettings.tipCurrency || 'MXN');
                    setDedicationsEnabledInput(eventSettings.dedicationsEnabled || false);
                    if (window.AndroidApp && typeof window.AndroidApp.getMinimizeToTray === 'function') {
                      setMinimizeToTrayInput(window.AndroidApp.getMinimizeToTray());
                    }
                    showToast("Revertido a cambios guardados");
                  }}>Descartar Cambios</button>
                </div>
              </form>
              )}
            </div>
          )}

          {/* PANEL AJUSTES DE OPTIMIZACIÓN */}
          {activeTab === 'optimization' && (
            (!currentPlan || currentPlan === 'free' || currentPlan === 'premium') ? (
              <div className="glass-panel animate-slide-in" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={20} color="var(--primary-color)" />
                  Ajustes de Optimización
                </h2>
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--warning-color)',
                    marginBottom: '10px'
                  }}>
                    <Lock size={30} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>Función Exclusiva para Planes de Pago</h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '450px', lineHeight: '1.6' }}>
                    Los ajustes avanzados de optimización (personalización de géneros musicales, reglas del buscador y corrector ortográfico inteligente) no están disponibles en la cuenta Demo.
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--warning-color)', fontWeight: '600' }}>
                    Adquiere el Plan Premium, VIP o un pase Eventual para desbloquear esta sección.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => selectPlan('pending_plan')}
                    style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    📦 Ver Planes de Suscripción
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* MÓDULO GESTIÓN DE GÉNEROS */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={20} color="var(--primary-color)" />
                    Personalización de Géneros Musicales
                  </h2>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Administra los géneros que se muestran al público al enviar peticiones. Puedes agregar nuevos géneros, editar los existentes y eliminar los que no necesites.
                </p>

                {/* Listado de Géneros Actuales */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                  {genresList.map((genre, idx) => {
                    const isEditing = editingGenreIndex === idx;
                    return (
                      <div 
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--surface-border)',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          transition: 'all 0.2s',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input 
                              type="text" 
                              value={editingGenreValue}
                              onChange={(e) => setEditingGenreValue(e.target.value)}
                              className="input-field"
                              style={{
                                padding: '2px 8px',
                                fontSize: '0.8rem',
                                borderRadius: '4px',
                                width: '120px',
                                height: 'auto',
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid var(--primary-color)'
                              }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditGenre(idx);
                                else if (e.key === 'Escape') setEditingGenreIndex(null);
                              }}
                            />
                            <button 
                              onClick={() => handleSaveEditGenre(idx)}
                              style={{ background: 'none', border: 'none', color: 'var(--success-color)', cursor: 'pointer', padding: 0 }}
                              title="Guardar"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => setEditingGenreIndex(null)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: 0 }}
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span>{genre}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                              <button 
                                onClick={() => { setEditingGenreIndex(idx); setEditingGenreValue(genre); }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                title="Editar"
                              >
                                <Edit size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeleteGenre(genre)}
                                style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                title="Eliminar"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Formulario Agregar Género */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '24px', maxWidth: '400px' }}>
                  <input 
                    type="text" 
                    placeholder="Nuevo género (ej. Dembow, Synthwave)" 
                    className="input-field" 
                    value={newGenreInput}
                    onChange={(e) => setNewGenreInput(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '10px 14px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddGenre();
                    }}
                  />
                  <button 
                    onClick={handleAddGenre}
                    className="btn btn-primary"
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    <Plus size={16} /> Agregar
                  </button>
                </div>

                {/* Géneros Sugeridos por Usuarios */}
                {userGenres.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '20px', marginTop: '20px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      💡 Géneros Sugeridos por Usuarios
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Géneros ingresados manualmente por usuarios en el buscador de la web app que no están en tu lista oficial:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {userGenres.map((genre, idx) => (
                        <div 
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(6, 182, 212, 0.05)',
                            border: '1px solid rgba(6, 182, 212, 0.25)',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '0.8rem',
                            color: 'var(--secondary-color)'
                          }}
                        >
                          <span>{genre}</span>
                          <button 
                            onClick={() => handleApproveUserGenre(genre)}
                            style={{
                              background: 'rgba(6, 182, 212, 0.15)',
                              border: 'none',
                              color: 'var(--secondary-color)',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0
                            }}
                            title="Aprobar e integrar a tu lista oficial"
                          >
                            <Plus size={10} />
                          </button>
                          <button 
                            onClick={() => { setCorrectorQuery(genre); showToast(`Buscando canciones con el género "${genre}"...`); }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: 'none',
                              color: 'var(--text-muted)',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              cursor: 'pointer'
                            }}
                            title="Buscar y corregir canciones con este género"
                          >
                            Corregir
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* MÓDULO DE CORRECCIÓN ORTOGRÁFICA */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={20} color="var(--primary-color)" />
                    Corrector Ortográfico y de Catálogo
                  </h2>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Busca peticiones de la cola activa o sugerencias del catálogo de autocompletado para corregir errores de escritura de los usuarios.
                </p>

                {/* Buscador */}
                <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '500px' }}>
                  <input 
                    type="text"
                    placeholder="Busca por canción, artista o género..."
                    className="input-field"
                    value={correctorQuery}
                    onChange={(e) => setCorrectorQuery(e.target.value)}
                    style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
                  />
                  <Search 
                    size={16} 
                    color="var(--text-muted)" 
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} 
                  />
                  {correctorQuery && (
                    <button 
                      onClick={() => setCorrectorQuery('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Formulario de Corrección Activo */}
                {editingItem && (
                  <div 
                    className="glass-panel animate-slide-in" 
                    style={{ 
                      padding: '16px', 
                      background: 'rgba(124, 58, 237, 0.05)', 
                      border: '1px solid var(--primary-color)', 
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '20px'
                    }}
                  >
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✏️ Corrigiendo: {editingItem.type === 'request' ? 'Petición en cola' : 'Sugerencia de autocompletado'}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Título de Canción</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          value={editItemTitle} 
                          onChange={(e) => setEditItemTitle(e.target.value)} 
                          style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Artista / Banda</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          value={editItemArtist} 
                          onChange={(e) => setEditItemArtist(e.target.value)} 
                          style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Género</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          value={editItemGenre} 
                          onChange={(e) => setEditItemGenre(e.target.value)} 
                          style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSaveCorrectedItem} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                        Guardar Cambios
                      </button>
                      <button onClick={() => setEditingItem(null)} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Resultados de Búsqueda del Corrector */}
                {correctorQuery.trim() !== '' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      Resultados de coincidencia ({correctorResults.length}):
                    </span>
                    {correctorResults.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        No se encontraron coincidencias para "{correctorQuery}"
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {correctorResults.map((item) => (
                          <div 
                            key={`${item.type}-${item.id}`}
                            className="glass-panel"
                            style={{ 
                              padding: '12px 16px', 
                              borderRadius: 'var(--radius-sm)', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              gap: '12px',
                              background: item.type === 'request' ? 'rgba(124, 58, 237, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                              borderLeft: item.type === 'request' ? '3px solid var(--primary-color)' : '3px solid var(--secondary-color)'
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.title}
                                </span>
                                <span 
                                  style={{ 
                                    fontSize: '0.65rem', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    fontWeight: '700',
                                    background: item.type === 'request' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                                    color: item.type === 'request' ? 'var(--primary-color)' : 'var(--secondary-color)'
                                  }}
                                >
                                  {item.type === 'request' ? `En Cola (Votos: ${item.votes})` : 'Autocompletado'}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                👤 {item.artist} • <span style={{ color: 'var(--secondary-color)' }}>{item.genre}</span>
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button 
                                onClick={() => handleStartEditItem(item)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Edit size={12} /> Corregir
                              </button>
                              {item.type === 'autocomplete' && (
                                <button 
                                  onClick={() => handleDeleteAutocompleteItem(item.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--danger-color)',
                                    cursor: 'pointer',
                                    padding: '6px'
                                  }}
                                  title="Eliminar del autocompletado"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
          )}

          {/* PANEL BENEFICIOS PARA EL DJ */}
          {activeTab === 'benefits' && (
            <div className="glass-panel animate-slide-in" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="var(--primary-color)" />
                  Beneficios Exclusivos para el DJ 🚀
                </h2>
              </div>

              {(!currentPlan || currentPlan === 'free' || currentPlan === 'premium') ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--warning-color)',
                    marginBottom: '10px'
                  }}>
                    <Lock size={30} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>Función Exclusiva para Planes de Pago</h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '450px', lineHeight: '1.6' }}>
                    La sección de Beneficios Exclusivos para el DJ (que incluye estadísticas detalladas de votación, panel de propinas directas vía PayPal y Mercado Pago, y configuración de monetización) no está disponible en tu plan actual.
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--warning-color)', fontWeight: '600' }}>
                    Adquiere el Plan VIP o un pase Eventual para desbloquear esta sección.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => selectPlan('pending_plan')}
                    style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    📦 Ver Planes de Suscripción
                  </button>
                </div>
              ) : (
                <>
                  {/* SECCIÓN DE MEJORA DE PLAN */}
                  {!(isAdminMaster && !impersonatingUid) && (
                    <div 
                      className="glass-panel" 
                      style={{ 
                        marginBottom: '32px', 
                        padding: '24px', 
                        borderRadius: 'var(--radius-lg)', 
                        border: '1px solid rgba(124, 58, 237, 0.25)', 
                        background: 'rgba(124, 58, 237, 0.03)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '20px'
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sparkles size={18} color="var(--primary-color)" />
                          Tu Plan Actual: <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {plansConfig?.[userProfile?.activePlan || 'free']?.name || userProfile?.activePlan || 'demo/gratis'}
                            {((userProfile?.activePlan === 'pro' || userProfile?.activePlan === 'pro_1d') && ' 😎')}
                            {(() => {
                              const extraRequests = userProfile?.extraRequests !== undefined ? parseInt(userProfile.extraRequests, 10) : 0;
                              const extraRequestsExpiresAt = userProfile?.extraRequestsExpiresAt ? parseInt(userProfile.extraRequestsExpiresAt, 10) : 0;
                              const isExtraValid = extraRequests > 0 && (!extraRequestsExpiresAt || Date.now() <= extraRequestsExpiresAt);
                              return isExtraValid ? ` (+${extraRequests} Extra)` : '';
                            })()}
                          </span>
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '500px' }}>
                          {(!userProfile?.activePlan || userProfile?.activePlan === 'free') && `Estás usando el ${plansConfig?.free?.name || 'Plan Demo'} con límites. Pásate a ${plansConfig?.premium?.name || 'Premium'} para personalización de marca, logo y peticiones ilimitadas.`}
                          {userProfile?.activePlan === 'premium' && `Tienes acceso a ${plansConfig?.premium?.name || 'Plan Premium'}. Pásate a ${plansConfig?.vip?.name || 'VIP'} para soporte técnico prioritario 24/7 y eventos simultáneos.`}
                          {userProfile?.activePlan === 'vip' && `Tienes acceso a ${plansConfig?.vip?.name || 'Plan VIP'}. Pásate a ${plansConfig?.pro?.name || 'PRO'} para multieventos activos en paralelo y soporte prioritario 24/7.`}
                          {userProfile?.activePlan === 'pro' && `¡Tienes el ${plansConfig?.pro?.name || 'Plan PRO'} con acceso total, soporte prioritario 24/7 y multieventos habilitados! Gracias por confiar en nosotros.`}
                          {userProfile?.activePlan === 'pro_1d' && `¡Tienes el ${plansConfig?.pro_1d?.name || 'Plan Pro x 1 Día'} con acceso total de cortesía por 24 horas. Disfruta de multieventos, soporte prioritario 24/7 y herramientas PRO sin límites!`}
                        </p>
                      </div>
                      
                      {userProfile?.activePlan !== 'pro' && (
                        <button
                          onClick={() => selectPlan('pending_plan')}
                          className="btn btn-primary"
                          style={{
                            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                            border: 'none',
                            padding: '12px 24px',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Sparkles size={16} /> Mejorar / Cambiar Plan
                        </button>
                      )}
                    </div>
                  )}

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
                    Nuestra plataforma inteligente está diseñada para optimizar tu flujo de trabajo, mantener la energía en la pista y potenciar tu marca como DJ. A continuación se presentan las características clave y beneficios incluidos:
                  </p>

              {/* Grid de 6 Tarjetas de Beneficios */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {/* 1. Base de Datos Evolutiva */}
                <div 
                  className="glass-panel" 
                  style={{ 
                    padding: '20px', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(255,255,255,0.01)',
                    transition: 'transform 0.2s',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.15)', display: 'flex', alignItems: 'center', marginBottom: '14px', color: 'var(--primary-color)', alignSelf: 'start', justifyContent: 'center' }}>
                    <Music size={20} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Autocompletado Evolutivo
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Ahorra tiempo valioso. El sistema aprende automáticamente las canciones ingresadas por los usuarios y las suma al catálogo inteligente global de autocompletado en tiempo real.
                  </p>
                </div>

                {/* 2. Deduplicación inteligente */}
                <div 
                  className="glass-panel" 
                  style={{ 
                    padding: '20px', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(255,255,255,0.01)',
                    transition: 'transform 0.2s',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', marginBottom: '14px', color: 'var(--secondary-color)', alignSelf: 'start', justifyContent: 'center' }}>
                    <Users size={20} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Deduplicación e Incremento de Votos
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Mantén tu cola de peticiones limpia y ordenada. Si dos o más personas solicitan la misma canción, la petición se fusiona automáticamente sumando un voto y destacando su popularidad.
                  </p>
                </div>

                {/* 3. Wake lock */}
                <div 
                  className="glass-panel" 
                  style={{ 
                    padding: '20px', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(255,255,255,0.01)',
                    transition: 'transform 0.2s',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', marginBottom: '14px', color: '#10b981', alignSelf: 'start', justifyContent: 'center' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Wake Lock del Navegador
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Evita interrupciones en cabina. La aplicación implementa el API de Wake Lock para prevenir que la pantalla del DJ se apague o suspenda automáticamente durante el show en vivo.
                  </p>
                </div>

                {/* 4. Alertas inmersivas */}
                <div 
                  className="glass-panel" 
                  style={{ 
                    padding: '20px', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(255,255,255,0.01)',
                    transition: 'transform 0.2s',
                    cursor: 'default',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', marginBottom: '14px', color: 'var(--warning-color)', alignSelf: 'start', justifyContent: 'center' }}>
                    <Bell size={20} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Alertas Visuales Inmersivas
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
                    Entérate al instante de dedicatorias críticas o peticiones altamente votadas mediante destellos perimetrales en tu panel de control, adaptándose a entornos oscuros de discoteca.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="visual-alerts-enabled"
                        checked={visualAlertEnabled} 
                        onChange={(e) => {
                          setVisualAlertEnabled(e.target.checked);
                          localStorage.setItem('dj_visual_alert_enabled', e.target.checked.toString());
                          showToast(e.target.checked ? '📺 Alertas visuales activadas' : '📺 Alertas visuales desactivadas');
                        }}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="visual-alerts-enabled" style={{ fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                        Habilitar destellos
                      </label>
                    </div>

                    {visualAlertEnabled && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duración (seg):</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          className="input-field" 
                          value={visualAlertDuration} 
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                            setVisualAlertDuration(val);
                            localStorage.setItem('dj_visual_alert_duration', val.toString());
                          }}
                          style={{ width: '50px', padding: '4px 8px', fontSize: '0.8rem', textAlign: 'center', height: '30px' }}
                        />
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => {
                            setActiveVisualAlert({
                              type: 'new',
                              title: 'Tema de Prueba',
                              artist: 'Artista de Prueba'
                            });
                          }}
                          style={{ fontSize: '0.75rem', padding: '4px 10px', height: '30px' }}
                        >
                          Probar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Propinas */}
                <div 
                  className="glass-panel" 
                  style={{ 
                    padding: '20px', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(255,255,255,0.01)',
                    transition: 'transform 0.2s',
                    cursor: 'default',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', marginBottom: '14px', color: '#ec4899', alignSelf: 'start', justifyContent: 'center' }}>
                    <Sparkles size={20} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Propinas e Integraciones de Pago
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
                    Monetiza tu trabajo. Habilita links directos a PayPal, alias de Mercado Pago o transferencia bancaria (CLABE) para que los usuarios puedan recompensarte con propinas voluntarias directamente desde sus celulares.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="tips-enabled"
                        checked={tipsEnabledInput} 
                        onChange={(e) => setTipsEnabledInput(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="tips-enabled" style={{ fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                        Habilitar propinas
                      </label>
                    </div>

                    {tipsEnabledInput && (
                      <form onSubmit={handleSaveBenefitsSettings} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>PayPal Usuario/Email</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ej: djmastermix" 
                            value={paypalUsernameInput}
                            onChange={(e) => setPaypalUsernameInput(e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '6px 10px', height: '32px' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Mercado Pago Alias/Link</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ej: dj.mastermix.mp" 
                            value={mercadopagoLinkInput}
                            onChange={(e) => setMercadopagoLinkInput(e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '6px 10px', height: '32px' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>CLABE Interbancaria (Transferencias)</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ej: 18 dígitos CLABE" 
                            value={clabeInput}
                            onChange={(e) => setClabeInput(e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '6px 10px', height: '32px' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '8px' }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Moneda para Propinas (Opcional)</label>
                          <select
                            className="input-field"
                            value={tipCurrencyInput}
                            onChange={(e) => setTipCurrencyInput(e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '0 10px', height: '32px', cursor: 'pointer', display: 'block', width: '100%', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-sm)' }}
                          >
                            <option value="MXN">MXN (Peso Mexicano - Predeterminado)</option>
                            <option value="USD">USD (Dólar Estadounidense)</option>
                            <option value="EUR">EUR (Euro)</option>
                            <option value="GBP">GBP (Libra Esterlina)</option>
                            <option value="CAD">CAD (Dólar Canadiense)</option>
                            <option value="ARS">ARS (Peso Argentino)</option>
                            <option value="COP">COP (Peso Colombiano)</option>
                            <option value="CLP">CLP (Peso Chileno)</option>
                            <option value="PEN">PEN (Sol Peruano)</option>
                          </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem', width: '100%', height: '32px', display: 'flex', justifyContent: 'center' }}>
                          Guardar Propinas
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* 6. Virtual DJ */}
                <div 
                  className="glass-panel" 
                  style={{ 
                    padding: '20px', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(255,255,255,0.01)',
                    transition: 'transform 0.2s',
                    cursor: 'default',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', marginBottom: '14px', color: '#3b82f6', alignSelf: 'start', justifyContent: 'center' }}>
                    <Sliders size={20} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Sincronización con Virtual DJ
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
                    Exporta la cola directamente a una carpeta o playlist M3U en tu computadora. Virtual DJ leerá y actualizará el listado de temas solicitados de forma dinámica mientras mezclas.
                  </p>
                  
                  {window.electronAPI && window.electronAPI.isDesktop ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox" 
                          id="vdj-enabled"
                          checked={virtualDJEnabled} 
                          onChange={(e) => {
                            const val = e.target.checked;
                            setVirtualDJEnabled(val);
                            localStorage.setItem('vdj_sync_enabled', val ? 'true' : 'false');
                            if (val && !virtualDJPath) {
                              window.electronAPI.detectVirtualDJPath().then(path => {
                                if (path) {
                                  setVirtualDJPath(path);
                                  localStorage.setItem('vdj_path', path);
                                  showToast("💿 Ruta de Virtual DJ detectada!");
                                } else {
                                  showToast("⚠️ No se pudo auto-detectar. Introduce la ruta manualmente.");
                                }
                              });
                            }
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <label htmlFor="vdj-enabled" style={{ fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                          Activar Sincronización
                        </label>
                      </div>

                      {virtualDJEnabled && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.7rem' }}>Carpeta Virtual DJ</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <input 
                                type="text" 
                                className="input-field" 
                                placeholder="/Users/.../VirtualDJ" 
                                value={virtualDJPath} 
                                onChange={(e) => {
                                  setVirtualDJPath(e.target.value);
                                  localStorage.setItem('vdj_path', e.target.value);
                                }}
                                style={{ fontSize: '0.75rem', padding: '4px 8px', height: '30px' }}
                              />
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={async () => {
                                  const path = await window.electronAPI.detectVirtualDJPath();
                                  if (path) {
                                    setVirtualDJPath(path);
                                    localStorage.setItem('vdj_path', path);
                                    showToast("💿 Ruta de Virtual DJ detectada!");
                                  } else {
                                    showToast("❌ No se encontró carpeta.");
                                  }
                                }}
                                style={{ fontSize: '0.7rem', padding: '4px 8px', height: '30px', whiteSpace: 'nowrap' }}
                              >
                                Auto
                              </button>
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.7rem' }}>Formato</label>
                            <select 
                              className="input-field" 
                              value={virtualDJFormat} 
                              onChange={(e) => {
                                setVirtualDJFormat(e.target.value);
                                localStorage.setItem('vdj_format', e.target.value);
                              }}
                              style={{ fontSize: '0.75rem', padding: '4px 8px', height: '30px', cursor: 'pointer' }}
                            >
                              <option value="m3u">M3U Playlist (Playlists/)</option>
                              <option value="vdjfolder">Virtual Folder XML (My Lists/)</option>
                            </select>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.7rem' }}>Sincronizar</label>
                            <select 
                              className="input-field" 
                              value={virtualDJSyncMode} 
                              onChange={(e) => {
                                setVirtualDJSyncMode(e.target.value);
                                localStorage.setItem('vdj_sync_mode', e.target.value);
                              }}
                              style={{ fontSize: '0.75rem', padding: '4px 8px', height: '30px', cursor: 'pointer' }}
                            >
                              <option value="accepted">Solo Aceptadas</option>
                              <option value="all">Todas las Recibidas</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        🖥️ Sincronización con Virtual DJ disponible en la versión de escritorio Mac/Windows.
                      </span>
                    </div>
                  )}
                </div>

                {/* 7. Publicidad o Contacto para Contrataciones */}
                <div 
                  className="glass-panel" 
                  style={{ 
                    padding: '20px', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(255,255,255,0.01)',
                    transition: 'transform 0.2s',
                    cursor: 'default',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', marginBottom: '14px', color: '#a855f7', alignSelf: 'start', justifyContent: 'center' }}>
                    <Megaphone size={20} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Publicidad y Contacto
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
                    Promociónate. Habilita una sección compacta y atractiva sobre la lista de peticiones en la web del público con tus enlaces de WhatsApp, Sitio Web, Instagram y TikTok para contrataciones.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="promo-enabled"
                        checked={promoEnabledInput} 
                        onChange={(e) => {
                          setPromoEnabledInput(e.target.checked);
                          updateEventSettings({ promoEnabled: e.target.checked });
                          showToast(e.target.checked ? '📢 Banner de contacto activado' : '📢 Banner de contacto desactivado');
                        }}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="promo-enabled" style={{ fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                        Habilitar banner en frontend
                      </label>
                    </div>

                    {promoEnabledInput && (
                      <form onSubmit={handleSavePromoSettings} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>WhatsApp (Número con código de país)</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ej: 5215512345678" 
                            value={promoWhatsappInput}
                            onChange={(e) => setPromoWhatsappInput(e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '6px 10px', height: '32px' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Sitio Web URL</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ej: https://misitioweb.com" 
                            value={promoWebsiteInput}
                            onChange={(e) => setPromoWebsiteInput(e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '6px 10px', height: '32px' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Instagram (Usuario sin @)</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ej: dj_mastermix" 
                            value={promoInstagramInput}
                            onChange={(e) => setPromoInstagramInput(e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '6px 10px', height: '32px' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>TikTok (Usuario sin @)</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ej: dj_mastermix" 
                            value={promoTiktokInput}
                            onChange={(e) => setPromoTiktokInput(e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '6px 10px', height: '32px' }}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem', width: '100%', height: '32px', display: 'flex', justifyContent: 'center' }}>
                          Guardar Datos de Contacto
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Sección de Retroalimentación / Sugerencias (Accesible para todos los planes) */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid var(--surface-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Sparkles size={16} color="#ec4899" /> Sugerencias para Mejorar la Plataforma
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              ¿Tienes alguna idea o comentario para optimizar DJVIP? Tu opinión es valiosa para nosotros, sin importar tu nivel de plan activo. ¡Déjanos tu sugerencia a continuación!
            </p>
            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe tu sugerencia o comentario aquí..."
                rows={3}
                required
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--surface-border)'}
              />
              <button
                type="submit"
                disabled={submittingFeedback || !feedbackText.trim()}
                className="btn btn-primary"
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 20px',
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: (submittingFeedback || !feedbackText.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (submittingFeedback || !feedbackText.trim()) ? 0.6 : 1,
                  background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 'bold',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
                  transition: 'all 0.2s'
                }}
              >
                {submittingFeedback ? 'Enviando...' : 'Enviar Sugerencia'}
              </button>
            </form>
          </div>
        </div>
      )}

          {/* 3. PANEL CALENDARIO Y GESTIÓN DE EVENTOS */}
          {activeTab === 'calendar' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} color="var(--primary-color)" />
                  Mis Eventos
                </h2>
                <button
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  onClick={() => setShowCreateEventForm(!showCreateEventForm)}
                >
                  <Plus size={15} /><span>{showCreateEventForm ? 'Cancelar' : 'Nuevo Evento'}</span>
                </button>
              </div>

              {/* FORMULARIO CREAR EVENTO */}
              {showCreateEventForm && (
                <form onSubmit={handleCreateEvent} style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
                    <Plus size={16} /> Crear Nuevo Evento
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Título del Evento *</label>
                      <input type="text" className="input-field" placeholder="Mi Gran Fiesta" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tipo de Evento</label>
                      <select className="input-field" value={newEventType} onChange={(e) => setNewEventType(e.target.value)} style={{ cursor: 'pointer' }}>
                        <option value="Mis XV años">🌸 Mis XV años</option>
                        <option value="Mi Boda">💍 Mi Boda</option>
                        <option value="Cumpleaños">🎂 Cumpleaños</option>
                        <option value="Graduación">🎓 Graduación</option>
                        <option value="Fiesta Corporativa">🏢 Fiesta Corporativa</option>
                        <option value="Aniversario">💝 Aniversario</option>
                        <option value="Bautizo">👶 Bautizo</option>
                        <option value="Otro">🎉 Otro</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">DJ en Cabina (opcional)</label>
                      <input type="text" className="input-field" placeholder={djNameInput || 'DJ MasterMix'} value={newEventDjName} onChange={(e) => setNewEventDjName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fecha del Evento</label>
                      <input type="date" className="input-field" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
                    </div>
                  </div>
                  {/* Aviso de cooldown 8h para planes Demo, Premium y Bonus */}
                  {(() => {
                    const planActual = userProfile?.activePlan || 'free';
                    if (!['free', 'premium', 'bonus'].includes(planActual)) return null;
                    const COOLDOWN_MS = 8 * 60 * 60 * 1000;
                    const latestCreatedAt = eventsList.reduce((max, ev) => {
                      const ts = typeof ev.createdAt === 'number' ? ev.createdAt : 0;
                      return ts > max ? ts : max;
                    }, 0);
                    if (latestCreatedAt === 0) return null;
                    const elapsed = Date.now() - latestCreatedAt;
                    if (elapsed >= COOLDOWN_MS) return null;
                    const remainingMs = COOLDOWN_MS - elapsed;
                    const remainingH = Math.floor(remainingMs / 3600000);
                    const remainingM = Math.floor((remainingMs % 3600000) / 60000);
                    const planLabel = planActual === 'free' ? 'Demo' : (planActual === 'bonus' ? 'Bonus' : 'Premium');
                    return (
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 14px',
                        fontSize: '0.82rem',
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        ⏳ <span><strong>Plan {planLabel}:</strong> solo un evento cada 8 horas. Tiempo de espera restante: <strong>{remainingH}h {remainingM}min</strong>.</span>
                      </div>
                    );
                  })()}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary" disabled={createEventLoading}>
                      {createEventLoading ? <><RefreshCw size={14} className="animate-spin" /> Creando...</> : <><Check size={14} /> Crear Evento</>}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateEventForm(false)}>Cancelar</button>
                  </div>

                </form>
              )}

              {/* LISTA DE EVENTOS */}
              {eventsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Calendar size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>No hay eventos creados todavía.</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Crea tu primer evento con el botón de arriba.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {eventsList
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                    .map((ev) => {
                      const isActive = currentEventId === ev.id;
                      const isArchived = ev.archived;
                      const isEditing = editingEventId === ev.id;
                      const isDeleting = deletingEventId === ev.id;
                      const evRequests = allEventsData?.[ev.id]?.requests || {};
                      const reqCount = Object.keys(evRequests).length;

                      return (
                        <div key={ev.id} style={{
                          padding: '16px 20px',
                          borderRadius: 'var(--radius-md)',
                          border: isActive ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
                          background: isActive ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)',
                          opacity: isArchived ? 0.6 : 1,
                          display: 'flex', flexDirection: 'column', gap: '12px'
                        }}>
                          {/* Header del evento */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input type="text" className="input-field" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={editEventTitle} onChange={(e) => setEditEventTitle(e.target.value)} placeholder="Título" />
                                    <select className="input-field" style={{ padding: '6px 10px', fontSize: '0.85rem', cursor: 'pointer' }} value={editEventType} onChange={(e) => setEditEventType(e.target.value)}>
                                      <option value="Mis XV años">🌸 Mis XV años</option>
                                      <option value="Mi Boda">💍 Mi Boda</option>
                                      <option value="Cumpleaños">🎂 Cumpleaños</option>
                                      <option value="Graduación">🎓 Graduación</option>
                                      <option value="Fiesta Corporativa">🏢 Fiesta Corporativa</option>
                                      <option value="Aniversario">💝 Aniversario</option>
                                      <option value="Bautizo">👶 Bautizo</option>
                                      <option value="Otro">🎉 Otro</option>
                                    </select>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input type="text" className="input-field" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={editEventDjName} onChange={(e) => setEditEventDjName(e.target.value)} placeholder="Nombre DJ" />
                                    <input type="date" className="input-field" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={editEventDate} onChange={(e) => setEditEventDate(e.target.value)} />
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => handleSaveEditEvent(ev.id)}><Check size={13} /> Guardar</button>
                                    <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => setEditingEventId(null)}><X size={13} /> Cancelar</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>{ev.title}</span>
                                    {isActive && <span className="badge badge-playing" style={{ fontSize: '0.65rem' }}>Activo</span>}
                                    {isArchived && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: '600' }}>Archivado</span>}
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
                                    {ev.eventType && <span style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--secondary-color)', padding: '2px 8px', borderRadius: '8px', fontWeight: '600' }}>{ev.eventType}</span>}
                                    <span>📅 {ev.date || 'Sin fecha'}</span>
                                    <span>🎧 {ev.djName || 'Sin DJ'}</span>
                                    <span>🎵 {reqCount} petición{reqCount !== 1 ? 'es' : ''}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Botones de acción */}
                            {!isEditing && !isDeleting && (
                              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                {!isActive && (
                                  <button title="Activar este evento" className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => { changeEvent(ev.id); showToast(`✅ Evento "${ev.title}" activado`); }}>
                                    <Play size={13} /> Activar
                                  </button>
                                )}
                                <button title="Editar evento" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => { setEditingEventId(ev.id); setEditEventTitle(ev.title); setEditEventDjName(ev.djName || ''); setEditEventDate(ev.date || ''); setEditEventType(ev.eventType || 'Otro'); }}>
                                  <Edit size={13} />
                                </button>
                                <button title={isArchived ? 'Desarchivar' : 'Archivar'} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => { archiveEvent(ev.id, !isArchived); showToast(isArchived ? `📂 Evento desarchivado` : `🗄️ Evento archivado`); }}>
                                  <Layers size={13} />
                                </button>
                                <button title={ev.id === 'default-event' ? "Restablecer evento por defecto" : "Eliminar evento"} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--danger-color)' }} onClick={() => setDeletingEventId(ev.id)}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Confirmación de eliminación inline */}
                          {isDeleting && (
                            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--danger-color)', fontWeight: '600' }}>
                                {ev.id === 'default-event' 
                                  ? '⚠️ ¿Restablecer el evento por defecto a su estado original?' 
                                  : <>⚠️ ¿Eliminar "<strong>{ev.title}</strong>" permanentemente?</>}
                              </span>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={() => setDeletingEventId(null)}>Cancelar</button>
                                <button style={{ padding: '5px 12px', fontSize: '0.8rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--danger-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handleDeleteEvent(ev.id)}>
                                  <Trash2 size={13} /> {ev.id === 'default-event' ? 'Restablecer' : 'Eliminar'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>
          )}



          {/* 4. PANEL ADMIN MASTER */}
          {activeTab === 'admin' && isAdminMaster && !impersonatingUid && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCog size={20} color="var(--warning-color)" />
                Panel de Administración Master
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
                Acceso total a todas las cuentas de DJ registradas en la plataforma. Solo visible para <strong style={{ color: 'var(--warning-color)' }}>dj@admin.com</strong>.
              </p>

              {/* Botón para gestionar suscripciones */}
              <div style={{ marginBottom: '28px', display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <CreditCard size={16} /> Gestionar Todas las Suscripciones
                </button>
              </div>

              {/* === SECCIÓN: VALIDACIÓN DE PAGOS PENDIENTES === */}
              <div style={{ marginBottom: '28px', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', background: 'rgba(16, 185, 129, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)' }}>
                    <CreditCard size={16} /> Suscripciones Pendientes de Validación ({pendingSubs.length})
                  </span>
                  <button 
                    onClick={fetchPendingSubscriptions} 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 8px', fontSize: '0.75rem', height: '24px' }}
                    disabled={pendingSubsLoading}
                  >
                    <RefreshCw size={12} className={pendingSubsLoading ? 'animate-spin' : ''} /> Actualizar
                  </button>
                </div>

                <div style={{ padding: '20px' }}>
                  {pendingSubsLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Cargando solicitudes...</div>
                  ) : pendingSubs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No hay solicitudes de pago pendientes de verificación.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {pendingSubs.map((sub) => (
                        <div key={sub.uid} className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                            <div>
                              <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#fff' }}>{sub.displayName || 'DJ sin nombre'}</h5>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Email: <strong>{sub.email}</strong> | Teléfono: <strong>{sub.phone || 'No especificado'}</strong>
                              </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                background: 'rgba(124, 58, 237, 0.15)',
                                color: 'var(--primary-color)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}>
                                PLAN: {sub.selectedPlan?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            marginBottom: '14px',
                            border: '1px solid var(--surface-border)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px'
                          }}>
                            <div><strong>Pasarela:</strong> {sub.gateway?.toUpperCase()}</div>
                            <div><strong>ID Transacción:</strong> <code style={{ color: 'var(--warning-color)' }}>{sub.transactionId}</code></div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <strong>Fecha de envío:</strong> {new Date(sub.submittedAt).toLocaleString()}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleApproveSub(sub.uid, sub.selectedPlan || 'premium')}
                              className="btn btn-primary"
                              style={{ padding: '6px 14px', fontSize: '0.8rem', height: '32px', background: 'var(--success-color)', border: 'none' }}
                            >
                              Aprobar Pago y Activar
                            </button>
                            <button
                              onClick={() => handleRejectSub(sub.uid)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 14px', fontSize: '0.8rem', height: '32px', color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            >
                              Rechazar Pago
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* === SECCIÓN: PERSONALIZACIÓN DE PLANES DE SUSCRIPCIÓN === */}
              {tempPlansConfig && (
                <div style={{ marginBottom: '28px', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', background: 'rgba(124, 58, 237, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="var(--primary-color)" /> Personalización de Planes de Suscripción (Solo Admin Master)
                    </span>
                  </div>

                  <div style={{ padding: '20px' }}>
                    {/* Tabs de Selección de Plan */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {Object.keys(tempPlansConfig).map((planKey) => (
                          <button
                            key={planKey}
                            type="button"
                            className={`btn ${editingPlanTab === planKey ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setEditingPlanTab(planKey)}
                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                          >
                            {tempPlansConfig[planKey]?.name || planKey.toUpperCase()}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowCreatePlanForm(v => !v)}
                        style={{ fontSize: '0.8rem', padding: '6px 12px', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success-color)' }}
                      >
                        <Plus size={14} /> Crear Nuevo Plan
                      </button>
                    </div>

                    {showCreatePlanForm && (
                      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
                        <h4 style={{ fontSize: '0.85rem', color: '#fff', margin: 0 }}>Crear Nuevo Plan de Suscripción</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.7rem' }}>Identificador Único (ej. platino)</label>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="identificador_único"
                              value={newPlanKey}
                              onChange={(e) => setNewPlanKey(e.target.value)}
                              style={{ height: '32px', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.7rem' }}>Nombre del Plan (ej. Plan Platino)</label>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="Nombre visible"
                              value={newPlanName}
                              onChange={(e) => setNewPlanName(e.target.value)}
                              style={{ height: '32px', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCreateNewPlan}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--success-color)', border: 'none' }}
                          >
                            Crear Plan
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => { setShowCreatePlanForm(false); setNewPlanKey(""); setNewPlanName(""); }}
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSavePlansConfig} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {/* Inputs básicos */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Nombre del Plan</label>
                          <input
                            type="text" className="input-field"
                            value={tempPlansConfig[editingPlanTab]?.name || ''}
                            onChange={(e) => setTempPlansConfig({
                              ...tempPlansConfig,
                              [editingPlanTab]: { ...tempPlansConfig[editingPlanTab], name: e.target.value }
                            })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Precio</label>
                          <input
                            type="text" className="input-field"
                            value={tempPlansConfig[editingPlanTab]?.price || ''}
                            onChange={(e) => setTempPlansConfig({
                              ...tempPlansConfig,
                              [editingPlanTab]: { ...tempPlansConfig[editingPlanTab], price: e.target.value }
                            })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Moneda (ej. MXN, USD)</label>
                          <input
                            type="text" className="input-field"
                            placeholder="MXN"
                            value={tempPlansConfig[editingPlanTab]?.currency || ''}
                            onChange={(e) => setTempPlansConfig({
                              ...tempPlansConfig,
                              [editingPlanTab]: { ...tempPlansConfig[editingPlanTab], currency: e.target.value.toUpperCase() }
                            })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Periodo / Cobro (ej. mes, gratis)</label>
                          <input
                            type="text" className="input-field"
                            value={tempPlansConfig[editingPlanTab]?.billing || ''}
                            onChange={(e) => setTempPlansConfig({
                              ...tempPlansConfig,
                              [editingPlanTab]: { ...tempPlansConfig[editingPlanTab], billing: e.target.value }
                            })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Límite de Peticiones (0 = ilimitado)</label>
                          <input
                            type="number" min="0" className="input-field"
                            value={tempPlansConfig[editingPlanTab]?.maxRequests !== undefined ? tempPlansConfig[editingPlanTab].maxRequests : (editingPlanTab === 'free' ? 15 : 0)}
                            onChange={(e) => setTempPlansConfig({
                              ...tempPlansConfig,
                              [editingPlanTab]: { ...tempPlansConfig[editingPlanTab], maxRequests: parseInt(e.target.value, 10) || 0 }
                            })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Duración (Ej. 1, 24)</label>
                          <input
                            type="number" min="0" className="input-field"
                            value={tempPlansConfig[editingPlanTab]?.duration !== undefined ? tempPlansConfig[editingPlanTab].duration : 1}
                            onChange={(e) => setTempPlansConfig({
                              ...tempPlansConfig,
                              [editingPlanTab]: { ...tempPlansConfig[editingPlanTab], duration: parseInt(e.target.value, 10) || 0 }
                            })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Unidad de Duración</label>
                          <select
                            className="input-field"
                            value={tempPlansConfig[editingPlanTab]?.durationUnit || 'meses'}
                            onChange={(e) => setTempPlansConfig({
                              ...tempPlansConfig,
                              [editingPlanTab]: { ...tempPlansConfig[editingPlanTab], durationUnit: e.target.value }
                            })}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', color: '#fff', height: '48px', padding: '10px 14px' }}
                          >
                            <option value="horas">Horas</option>
                            <option value="días">Días</option>
                            <option value="meses">Meses</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Descripción</label>
                        <textarea
                          className="input-field"
                          rows={2}
                          value={tempPlansConfig[editingPlanTab]?.description || ''}
                          onChange={(e) => setTempPlansConfig({
                            ...tempPlansConfig,
                            [editingPlanTab]: { ...tempPlansConfig[editingPlanTab], description: e.target.value }
                          })}
                          style={{ resize: 'vertical', minHeight: '60px', padding: '10px' }}
                        />
                      </div>

                      {/* Lista de Beneficios */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>Beneficios Exclusivos</span>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleAddPlanBenefit(editingPlanTab)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Plus size={12} /> Añadir Beneficio
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(tempPlansConfig[editingPlanTab]?.benefits || []).map((benefit, idx) => (
                            <div key={`ben-${idx}`} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text" className="input-field"
                                value={benefit}
                                placeholder="ej. Peticiones ilimitadas de canciones"
                                onChange={(e) => handleEditPlanBenefit(editingPlanTab, idx, e.target.value)}
                                style={{ flex: 1, height: '32px', fontSize: '0.85rem' }}
                              />
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleDeletePlanBenefit(editingPlanTab, idx)}
                                style={{ padding: '6px', height: '32px', width: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {(tempPlansConfig[editingPlanTab]?.benefits || []).length === 0 && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>No hay beneficios agregados a este plan.</p>
                          )}
                        </div>
                      </div>

                      {/* Lista de Restricciones */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>Restricciones / Límites</span>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleAddPlanRestriction(editingPlanTab)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Plus size={12} /> Añadir Restricción
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(tempPlansConfig[editingPlanTab]?.restrictions || []).map((restriction, idx) => (
                            <div key={`rest-${idx}`} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text" className="input-field"
                                value={restriction}
                                placeholder="ej. Límite de 15 peticiones simultáneas"
                                onChange={(e) => handleEditPlanRestriction(editingPlanTab, idx, e.target.value)}
                                style={{ flex: 1, height: '32px', fontSize: '0.85rem' }}
                              />
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleDeletePlanRestriction(editingPlanTab, idx)}
                                style={{ padding: '6px', height: '32px', width: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {(tempPlansConfig[editingPlanTab]?.restrictions || []).length === 0 && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>No hay restricciones agregadas a este plan.</p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', flexWrap: 'wrap' }}>
                        <button type="submit" className="btn btn-primary" disabled={savePlansLoading} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {savePlansLoading ? <><RefreshCw size={14} className="animate-spin" /> Guardando...</> : <><Check size={14} /> Guardar Configuración de Planes</>}
                        </button>
                        
                        {editingPlanTab !== 'free' && editingPlanTab !== 'premium' && editingPlanTab !== 'vip' && editingPlanTab !== 'pro' && editingPlanTab !== 'pro_1d' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleDeletePlan(editingPlanTab)}
                            style={{ padding: '10px 20px', color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Trash2 size={14} /> Eliminar Plan
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* === SECCIÓN: AGREGAR NUEVO DJ === */}
              <div style={{ marginBottom: '28px', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div
                  style={{ padding: '14px 20px', background: 'rgba(124,58,237,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => { setShowAddDjForm(v => !v); setAddDjError(''); setAddDjSuccess(''); }}
                >
                  <span style={{ fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserPlus size={16} color="var(--primary-color)" /> Agregar Nuevo DJ a la Plataforma
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{showAddDjForm ? '▲ Cerrar' : '▼ Abrir'}</span>
                </div>

                {showAddDjForm && (
                  <form onSubmit={handleCreateDjAccount} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <User size={13} /> Nombre del DJ
                        </label>
                        <input
                          type="text" className="input-field"
                          placeholder="ej. DJ Neon" value={newDjDisplayName}
                          onChange={(e) => { setNewDjDisplayName(e.target.value); setAddDjError(''); setAddDjSuccess(''); }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Mail size={13} /> Correo Electrónico
                        </label>
                        <input
                          type="email" className="input-field"
                          placeholder="dj@ejemplo.com" value={newDjEmail}
                          onChange={(e) => { setNewDjEmail(e.target.value); setAddDjError(''); setAddDjSuccess(''); }}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Lock size={13} /> Contraseña (mín. 6 caracteres)
                        </label>
                        <input
                          type="password" className="input-field"
                          placeholder="contraseña segura" value={newDjPassword}
                          onChange={(e) => { setNewDjPassword(e.target.value); setAddDjError(''); setAddDjSuccess(''); }}
                          required minLength={6}
                        />
                      </div>
                    </div>

                    {addDjError && (
                      <p style={{ color: 'var(--danger-color)', fontSize: '0.82rem', background: 'rgba(239,68,68,0.06)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {addDjError}
                      </p>
                    )}
                    {addDjSuccess && (
                      <p style={{ color: 'var(--success-color)', fontSize: '0.82rem', background: 'rgba(16,185,129,0.06)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        {addDjSuccess}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button type="submit" className="btn btn-primary"
                        disabled={addDjLoading}
                        style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        {addDjLoading ? <><RefreshCw size={14} className="animate-spin" /> Creando...</> : <><UserPlus size={14} /> Crear Cuenta DJ</>}
                      </button>
                      <button type="button" className="btn btn-secondary"
                        onClick={() => { setNewDjEmail(''); setNewDjPassword(''); setNewDjDisplayName(''); setAddDjError(''); setAddDjSuccess(''); }}
                        style={{ padding: '10px 16px' }}>
                        Limpiar
                      </button>
                    </div>

                    {isMock && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--warning-color)', opacity: 0.8 }}>
                        ⚠️ Modo Local: La cuenta se guarda en localStorage. Recarga la página para verla en la lista.
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* === SECCIÓN: LISTA DE USUARIOS === */}
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} /> Usuarios Registrados en Firebase ({adminUsersList.length})
              </h4>

              {adminUsersList.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay usuarios registrados en la base de datos.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {adminUsersList.map(({ uid, eventsCount, requestsCount, djName, eventTitles, email, currentPlan, expiresAt, demoLimit, premiumLimit, demoLimitExpiresAt, premiumLimitExpiresAt, logoUploadEnabled, strictLimitEnabled, extraRequests }) => (
                    <div key={uid} className="glass-panel animate-slide-in" style={{
                      padding: '20px 24px', borderRadius: 'var(--radius-md)',
                      display: 'flex', flexDirection: 'column', gap: '14px',
                      border: uid === 'uid-admin-master' ? '1px solid rgba(245,158,11,0.25)' : undefined
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                          <div className="flex-center" style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-full)', background: uid === 'uid-admin-master' ? 'rgba(245,158,11,0.12)' : 'rgba(124, 58, 237, 0.1)', border: uid === 'uid-admin-master' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(124,58,237,0.2)' }}>
                            {uid === 'uid-admin-master' ? <ShieldCheck size={20} color="var(--warning-color)" /> : <Users size={20} color="var(--primary-color)" />}
                          </div>
                          {editingDjUid === uid ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Nombre del DJ</label>
                                  <input
                                    type="text" className="input-field"
                                    value={editDjDisplayName}
                                    onChange={(e) => setEditDjDisplayName(e.target.value)}
                                    style={{ padding: '4px 8px', fontSize: '0.8rem', height: '28px' }}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Correo Electrónico</label>
                                  <input
                                    type="email" className="input-field"
                                    value={editDjEmail}
                                    onChange={(e) => setEditDjEmail(e.target.value)}
                                    style={{ padding: '4px 8px', fontSize: '0.8rem', height: '28px' }}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Plan del DJ</label>
                                  <select
                                    className="input-field"
                                    value={editDjPlan}
                                    onChange={(e) => setEditDjPlan(e.target.value)}
                                    style={{ padding: '4px 8px', fontSize: '0.8rem', height: '28px', background: 'var(--surface-color)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
                                  >
                                    {Object.keys(plansConfig || DEFAULT_PLANS_CONFIG).map(planKey => (
                                      <option key={planKey} value={planKey}>
                                        {plansConfig?.[planKey]?.name || planKey}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {editDjPlan === 'free' && (
                                   <div className="form-group" style={{ marginBottom: 0 }}>
                                     <label className="form-label" style={{ fontSize: '0.7rem' }}>LÍMITE DE PETICIONES (DEMO)</label>
                                     <select
                                       className="input-field"
                                       value={editDjDemoLimit}
                                       onChange={(e) => setEditDjDemoLimit(parseInt(e.target.value, 10))}
                                       style={{ padding: '4px 8px', fontSize: '0.8rem', height: '28px', background: 'var(--surface-color)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
                                     >
                                       <option value={35}>35 Peticiones (Default)</option>
                                       <option value={50}>50 Peticiones</option>
                                       <option value={60}>60 Peticiones</option>
                                       {![35, 50, 60].includes(editDjDemoLimit) && (
                                         <option value={editDjDemoLimit}>{editDjDemoLimit} Peticiones</option>
                                       )}
                                     </select>
                                   </div>
                                 )}
                                 {editDjPlan === 'vip' && (
                                   <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                     <label className="form-label" style={{ fontSize: '0.7rem' }}>Logotipo de Marca</label>
                                     <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', height: '28px', color: 'var(--text-secondary)' }}>
                                       <input
                                         type="checkbox"
                                         checked={editDjLogoUploadEnabled}
                                         onChange={(e) => setEditDjLogoUploadEnabled(e.target.checked)}
                                         style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                       />
                                       <span>Permitir logotipo personalizado</span>
                                     </label>
                                   </div>
                                 )}
                                {editDjPlan === 'premium' && (
                                  <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.7rem' }}>LÍMITE DE PETICIONES (PREMIUM)</label>
                                    <select
                                      className="input-field"
                                      value={editDjPremiumLimit}
                                      onChange={(e) => setEditDjPremiumLimit(parseInt(e.target.value, 10))}
                                      style={{ padding: '4px 8px', fontSize: '0.8rem', height: '28px', background: 'var(--surface-color)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
                                    >
                                      <option value={80}>80 Peticiones (Default)</option>
                                      <option value={100}>100 Peticiones</option>
                                      <option value={120}>120 Peticiones</option>
                                      {![80, 100, 120].includes(editDjPremiumLimit) && (
                                        <option value={editDjPremiumLimit}>{editDjPremiumLimit} Peticiones</option>
                                      )}
                                    </select>
                                  </div>
                                )}
                                {(editDjPlan === 'free' || editDjPlan === 'premium') && (
                                  <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Restricción Estricta</label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', height: '28px', color: 'var(--text-secondary)' }}>
                                      <input
                                        type="checkbox"
                                        checked={editDjStrictLimit}
                                        onChange={(e) => setEditDjStrictLimit(e.target.checked)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                      />
                                      <span>Bloquear si supera límite</span>
                                    </label>
                                  </div>
                                )}
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Nueva Contraseña (Opcional)</label>
                                  <input
                                    type="password" className="input-field"
                                    placeholder="Dejar en blanco para conservar"
                                    value={editDjPassword}
                                    onChange={(e) => setEditDjPassword(e.target.value)}
                                    style={{ padding: '4px 8px', fontSize: '0.8rem', height: '28px' }}
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button
                                  onClick={() => handleSaveEditDjAccount(uid)}
                                  disabled={editDjLoading}
                                  className="btn btn-primary"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  {editDjLoading ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />} Guardar
                                </button>
                                <button
                                  onClick={() => { setEditingDjUid(null); setEditDjPassword(''); }}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <X size={12} /> Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                                {uid === 'uid-admin-master' ? '👑 Administrador Master' : djName}
                              </strong>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                UID: <code style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>{uid}</code>
                              </p>
                              {email && (
                                <p style={{ fontSize: '0.78rem', color: 'var(--secondary-color)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Mail size={11} /> {email}
                                </p>
                              )}
                              {uid !== 'uid-admin-master' && (
                                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{
                                    background: currentPlan === 'free' ? 'rgba(255,255,255,0.06)' : 'rgba(124, 58, 237, 0.12)',
                                    color: currentPlan === 'free' ? 'var(--text-secondary)' : 'var(--primary-color)',
                                    border: currentPlan === 'free' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(124,58,237,0.25)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: '600',
                                    textTransform: 'uppercase'
                                  }}>
                                    Plan: {plansConfig?.[currentPlan]?.name || currentPlan}{extraRequests > 0 ? ` (+${extraRequests} Extra)` : ''}
                                    {currentPlan === 'free' && ` (Límite: ${demoLimit})`}
                                    {currentPlan === 'premium' && ` (Límite: ${premiumLimit})`}
                                  </span>
                                   {currentPlan === 'vip' && (
                                     <span style={{
                                       background: logoUploadEnabled ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                       color: logoUploadEnabled ? 'var(--success-color)' : 'var(--danger-color)',
                                       border: logoUploadEnabled ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
                                       padding: '2px 8px',
                                       borderRadius: '4px',
                                       fontSize: '0.72rem',
                                       fontWeight: '600'
                                     }}>
                                       {logoUploadEnabled ? '🖼️ Logotipo Habilitado' : '🚫 Logotipo Deshabilitado'}
                                     </span>
                                   )}
                                  {(currentPlan === 'free' || currentPlan === 'premium') && (
                                    <span style={{
                                      background: strictLimitEnabled ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                                      color: strictLimitEnabled ? 'var(--danger-color)' : 'var(--success-color)',
                                      border: strictLimitEnabled ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(16,185,129,0.25)',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: '600'
                                    }}>
                                      {strictLimitEnabled ? '🚫 Límite Estricto' : '🔓 Límite Permisivo'}
                                    </span>
                                  )}
                                  {expiresAt > 0 && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                      (Expira: {new Date(expiresAt).toLocaleString()})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                              Eventos: <strong style={{ color: 'var(--primary-color)' }}>{eventsCount}</strong>
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                              Peticiones: <strong style={{ color: 'var(--secondary-color)' }}>{requestsCount}</strong>
                            </span>
                          </div>

                          {uid !== 'uid-admin-master' && editingDjUid !== uid && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setEditingDjUid(uid);
                                  setEditDjDisplayName(djName);
                                  setEditDjEmail(email);
                                  setEditDjPassword('');
                                  setEditDjPlan(currentPlan || 'free');
                                  setEditDjDemoLimit(demoLimit || 35);
                                  setEditDjPremiumLimit(premiumLimit || 80);
                                  setEditDjLogoUploadEnabled(logoUploadEnabled || false);
                                  setEditDjStrictLimit(strictLimitEnabled !== false);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                              >
                                <Edit size={14} /> Editar
                              </button>
                              <button
                                onClick={() => { impersonateUser(uid); setActiveTab('requests'); showToast(`👁️ Viendo panel de ${djName}`); }}
                                className="btn btn-secondary"
                                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(124,58,237,0.3)' }}
                              >
                                <UserCog size={14} /> Ver Panel
                              </button>
                               <button
                                 onClick={() => handleDeleteDjAccount(uid)}
                                 className="btn btn-danger"
                                 style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,0,0,0.3)' }}
                               >
                                 <Trash2 size={14} /> Eliminar
                               </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mostrar los títulos de los eventos creados por este DJ */}
                      {uid !== 'uid-admin-master' && eventTitles.length > 0 && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Eventos en actividad:
                          </span>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {eventTitles.map((title, idx) => (
                              <span key={idx} style={{ fontSize: '0.75rem', background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.15)', color: 'var(--text-primary)', padding: '3px 8px', borderRadius: '4px' }}>
                                🗓️ {title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* === SECCIÓN: RESPALDO DE BASE DE DATOS === */}
              {isAdminMaster && !impersonatingUid && (
                <div style={{ marginTop: '28px', padding: '20px', border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.03)', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                    <Database size={18} /> Copia de Seguridad y Respaldo de Base de Datos
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                    Descarga una copia de seguridad completa de la base de datos en formato JSON. Este archivo incluye todas las cuentas de DJ registradas, la configuración de todos los eventos, el historial de peticiones de canciones y el catálogo global de autocompletado.
                  </p>
                  <button
                    onClick={handleDownloadBackup}
                    disabled={backupLoading}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
                      padding: '10px 20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      height: 'auto'
                    }}
                  >
                    {backupLoading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                    {backupLoading ? 'Generando Copia...' : 'Descargar Respaldo Completo (JSON)'}
                  </button>
                </div>
              )}

              {/* === SECCIÓN: NOTIFICACIÓN DE ACTUALIZACIÓN DE APP === */}
              {isAdminMaster && !impersonatingUid && (
                <div style={{ marginTop: '28px', padding: '20px', border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.03)', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
                    <Bell size={18} /> Notificar Actualización de la App (Push Global)
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                    Envía una notificación push inmediata a todos los dispositivos móviles registrados indicando que hay una nueva versión disponible. Los usuarios verán la alerta en la barra de estado y el modal de actualización in-app al abrir la app.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Versión Lanzada (ej: 1.0.1)</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="ej: 1.0.1" 
                        value={updateVersionInput} 
                        onChange={(e) => setUpdateVersionInput(e.target.value)} 
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Notas de Versión (ej: Solución de iconos y macOS)</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="ej: Solución de iconos y macOS" 
                        value={updateNotesInput} 
                        onChange={(e) => setUpdateNotesInput(e.target.value)} 
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSendUpdateNotification}
                    disabled={updateNotificationLoading}
                    className="btn btn-primary"
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      height: 'auto'
                    }}
                  >
                    {updateNotificationLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {updateNotificationLoading ? 'Enviando...' : 'Enviar Notificación de Actualización'}
                  </button>
                </div>
              )}

              {/* Info de cuentas mock */}
              {isMock && (
                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 'var(--radius-md)' }}>
                  <h5 style={{ color: 'var(--warning-color)', marginBottom: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={13} /> Cuentas de Prueba (Modo Mock)
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {MOCK_ACCOUNTS.map(a => (
                      <div key={a.email} style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)', minWidth: '120px' }}>{a.isAdmin ? '👑 Admin Master' : '🎧 ' + a.displayName}</span>
                        <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: 'var(--secondary-color)' }}>{a.email}</code>
                        <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>{a.password}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4.5. PANEL GESTIÓN DE SUSCRIPCIONES (ADMIN MASTER) */}
          {activeTab === 'subscriptions' && isAdminMaster && !impersonatingUid && (
            <div className="glass-panel" style={{ padding: '24px', minHeight: '600px' }}>
              <AdminSubscriptions onBack={() => setActiveTab('admin')} />
            </div>
          )}

          {/* 5. PANEL SOPORTE PRO (ADMIN MASTER) */}
          {activeTab === 'support' && isAdminMaster && !impersonatingUid && (
            <div className="glass-panel" style={{ padding: '24px', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} color="var(--primary-color)" />
                💬 Soporte Técnico PRO
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
                Atiende las consultas en tiempo real de los DJs con plan <strong style={{ color: 'var(--primary-color)' }}>PRO</strong>.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', flex: 1 }}>
                {/* Columna Izquierda: Lista de chats */}
                <div style={{ borderRight: '1px solid var(--surface-border)', paddingRight: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                  <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '10px' }}>Conversaciones Activas</h3>
                  {Object.keys(adminChats || {}).length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No hay chats de soporte iniciados.
                    </div>
                  ) : (
                    Object.entries(adminChats)
                      .sort((a, b) => (b[1].metadata?.lastTimestamp || 0) - (a[1].metadata?.lastTimestamp || 0))
                      .map(([uid, chat]) => {
                        const isSelected = adminSelectedChatUid === uid;
                        const unreadCount = chat.metadata?.unreadCountByAdmin || 0;
                        return (
                          <div
                            key={uid}
                            onClick={() => setAdminSelectedChatUid(uid)}
                            style={{
                              padding: '12px',
                              borderRadius: 'var(--radius-md)',
                              background: isSelected ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                              border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: isSelected ? 'var(--primary-color)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {chat.metadata?.djName || 'DJ PRO'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                {chat.metadata?.lastMessage || 'Sin mensajes'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '4px' }}>
                              {chat.metadata?.lastTimestamp && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  {new Date(chat.metadata.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              {unreadCount > 0 && (
                                <span style={{
                                  background: 'red',
                                  color: '#fff',
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Columna Derecha: Chat activo */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '500px', background: '#0b1329', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
                  {adminSelectedChatUid ? (
                    <>
                      {/* Cabecera del chat seleccionado */}
                      <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#fff' }}>
                            {adminChats[adminSelectedChatUid]?.metadata?.djName || 'DJ PRO'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                            UID: {adminSelectedChatUid}
                          </span>
                        </div>
                        <button
                          onClick={() => setAdminSelectedChatUid(null)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', height: '24px' }}
                        >
                          Cerrar Chat
                        </button>
                      </div>

                      {/* Lista de mensajes */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {adminChatData.messages.map((msg, index) => {
                          const isAdmin = msg.senderId === 'uid-admin-master';
                          return (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px', padding: '0 4px' }}>
                                {msg.senderName}
                              </span>
                              <div style={{
                                padding: '8px 12px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                maxWidth: '75%',
                                wordBreak: 'break-word',
                                background: isAdmin ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' : 'rgba(255,255,255,0.06)',
                                color: '#fff',
                                borderRadius: isAdmin ? '12px 12px 2px 12px' : '12px 12px 12px 2px'
                              }}>
                                {msg.text}
                              </div>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}
                        <div ref={adminChatEndRef} />
                      </div>

                      {/* Formulario de envío */}
                      <form onSubmit={handleSendAdminChatMessage} style={{ padding: '12px', borderTop: '1px solid var(--surface-border)', display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.2)' }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Escribe una respuesta para el DJ..."
                          value={adminChatText}
                          onChange={(e) => setAdminChatText(e.target.value)}
                          style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
                        />
                        <button
                          type="submit"
                          className="btn btn-primary"
                          style={{
                            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                            border: 'none',
                            padding: '0 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '36px',
                            cursor: 'pointer'
                          }}
                        >
                          <Send size={14} />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
                      <MessageSquare size={48} style={{ opacity: 0.3 }} />
                      <span style={{ fontSize: '0.85rem' }}>Selecciona una conversación de la izquierda para comenzar.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contenedor Extra: Gestión de Notas de Actualización */}
              <div className="glass-panel" style={{ marginTop: '24px', padding: '20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--primary-color)" />
                  📢 Publicar Notas de Actualización (Modal de Inicio)
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Administra las notas de lanzamiento que los usuarios visualizan en el modal al abrir la aplicación.
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>ÚLTIMA VERSIÓN</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: 1.0.0.32"
                      value={adminUpdateVersion}
                      onChange={(e) => setAdminUpdateVersion(e.target.value)}
                      style={{ height: '38px', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>URL DE DESCARGA APK</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="https://..."
                      value={adminUpdateApkUrl}
                      onChange={(e) => setAdminUpdateApkUrl(e.target.value)}
                      style={{ height: '38px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>NOTAS DE LANZAMIENTO (UNA POR LÍNEA)</label>
                  <textarea
                    className="input-field"
                    placeholder="Ej:&#10;Android: Solucionado problema con notificaciones en segundo plano.&#10;General: Correcciones menores de diseño cristal."
                    value={adminReleaseNotesRaw}
                    onChange={(e) => setAdminReleaseNotesRaw(e.target.value)}
                    style={{ minHeight: '120px', padding: '10px 12px', fontSize: '0.85rem', lineHeight: '1.4', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAutoFillReleaseNotes}
                    disabled={isGeneratingNotes}
                    style={{ flex: 1, height: '40px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {isGeneratingNotes ? (
                      <><RefreshCw size={14} className="animate-spin" /> Analizando Commits...</>
                    ) : (
                      <><Sparkles size={14} /> Autorellenar Cambios (GitHub)</>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handlePublishReleaseNotes}
                    disabled={isPublishingNotes}
                    style={{ flex: 1, height: '40px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', border: 'none' }}
                  >
                    {isPublishingNotes ? (
                      <><RefreshCw size={14} className="animate-spin" /> Publicando...</>
                    ) : (
                      <><Check size={14} /> Publicar Actualización</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. PERFIL DEL ADMIN MASTER */}
          {activeTab === 'admin_profile' && isAdminMaster && !impersonatingUid && (
            <div className="glass-panel animate-fade-in" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="var(--primary-color)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#fff' }}>Perfil del Administrador Master</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Gestiona tus datos de contacto y la clave de notificaciones de WhatsApp.</p>
                </div>
              </div>

              {/* Detalle del Plan PRO Forzado */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{ background: 'rgba(124, 58, 237, 0.2)', padding: '10px', borderRadius: '12px', color: 'var(--primary-color)' }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', margin: '0 0 4px 0', color: '#fff', fontWeight: 'bold' }}>
                    Plan Activo: <span style={{ textTransform: 'uppercase', color: 'var(--primary-color)' }}>PRO</span> (Cuenta Administrativa)
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Como Administrador Master de la plataforma, tu cuenta tiene forzado el plan **PRO** de por vida, lo que te otorga acceso ilimitado a todas las herramientas premium de la plataforma, incluyendo marca personalizada, personalización completa y peticiones ilimitadas.
                  </p>
                </div>
              </div>

              {/* Formulario de Configuración */}
              <form onSubmit={handleSaveAdminProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: '600' }}>Nombre o Alias Administrador</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="ej. Admin General"
                      value={adminAlias}
                      onChange={(e) => setAdminAlias(e.target.value)}
                      required
                    />
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Este nombre será visible en las respuestas del chat de soporte.</p>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: '600' }}>WhatsApp (Formato Internacional)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="ej. 5215512345678"
                      value={adminWhatsapp}
                      onChange={(e) => setAdminWhatsapp(e.target.value)}
                    />
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Debe incluir código de país sin el signo '+' ni espacios (ej: 521 para México, 34 para España).</p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    CallMeBot API Key
                    <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--primary-color)' }}>
                      (<a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Obtén tu API Key gratis aquí</a>)
                    </span>
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Clave de CallMeBot"
                    value={adminCallmebotApiKey}
                    onChange={(e) => setAdminCallmebotApiKey(e.target.value)}
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Para recibir alertas por WhatsApp ante nuevos mensajes de soporte, agrega tu número a CallMeBot en WhatsApp, obtén tu API Key e ingrésala aquí.</p>
                </div>

                <div style={{ marginTop: '30px', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary-color)' }}>
                    <Bell size={18} /> Configuración de Notificaciones SMS (Twilio)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                    Configura tus credenciales de Twilio para recibir mensajes de texto SMS en tu teléfono móvil ante nuevas suscripciones, chats de soporte y sugerencias. Si dejas estos campos vacíos, el sistema guardará los mensajes localmente en el archivo <code style={{ color: 'var(--primary-color)' }}>scratch/sms_logs.txt</code>.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600' }}>Account SID de Twilio</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="ej. ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={twilioAccountSid}
                        onChange={(e) => setTwilioAccountSid(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600' }}>Auth Token de Twilio</label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Twilio Auth Token"
                        value={twilioAuthToken}
                        onChange={(e) => setTwilioAuthToken(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600' }}>Número Remitente Twilio (From)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="ej. +18559098765"
                        value={twilioFromNumber}
                        onChange={(e) => setTwilioFromNumber(e.target.value)}
                      />
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Número telefónico asignado por Twilio en formato internacional.</p>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600' }}>Número Receptor Admin (To)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="ej. +5215512345678"
                        value={twilioToNumber}
                        onChange={(e) => setTwilioToNumber(e.target.value)}
                      />
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Tu número telefónico personal en formato internacional (debe iniciar con +).</p>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saveAdminProfileLoading}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                      border: 'none',
                      padding: '12px 24px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    {saveAdminProfileLoading ? (
                      <><RefreshCw size={16} className="animate-spin" /> Guardando...</>
                    ) : (
                      <><Check size={16} /> Guardar Perfil Admin</>
                    )}
                  </button>
                </div>
              </form>

              {/* === SECCIÓN: SUGERENCIAS Y RETROALIMENTACIÓN === */}
              <div style={{ marginTop: '40px', borderTop: '1px solid var(--surface-border)', paddingTop: '28px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
                  <MessageSquare size={20} /> Buzón de Sugerencias y Retroalimentación
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Comentarios y sugerencias enviadas por los DJs para la mejora continua de la plataforma.
                </p>

                {(() => {
                  const suggestionsArray = Object.keys(allSuggestions || {}).reduce((acc, djUid) => {
                    const djSuggs = allSuggestions[djUid] || {};
                    const items = Object.keys(djSuggs).map(timestamp => ({
                      djUid,
                      timestamp: parseInt(timestamp, 10),
                      ...djSuggs[timestamp]
                    }));
                    return [...acc, ...items];
                  }, []).sort((a, b) => b.timestamp - a.timestamp);

                  if (suggestionsArray.length === 0) {
                    return (
                      <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--surface-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        No hay sugerencias en el buzón todavía.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                      {suggestionsArray.map((item) => (
                        <div key={`${item.djUid}-${item.timestamp}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '16px', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                            <div>
                              <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={14} color="var(--primary-color)" /> {item.djName || 'DJ Sin Nombre'}
                              </strong>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <Mail size={12} style={{ opacity: 0.7 }} /> {item.email || 'Correo no disponible'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} /> {new Date(item.timestamp).toLocaleString()}
                              </span>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm("¿Estás seguro de que deseas eliminar esta sugerencia?")) {
                                    try {
                                      await deleteSuggestion(item.djUid, item.timestamp);
                                      showToast("🗑️ Sugerencia eliminada exitosamente");
                                    } catch (err) {
                                      showToast(`❌ Error: ${err.message}`);
                                    }
                                  }
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 'auto', border: '1px solid rgba(255,0,0,0.25)', color: '#ef4444' }}
                                title="Eliminar Sugerencia"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.15)', borderLeft: '3px solid var(--primary-color)', padding: '12px', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                            {item.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          {activeTab === 'revenue' && isAdminMaster && !impersonatingUid && (() => {
            try {
              // ---- Lógica de cálculo financiero ----
              const PAID_PLANS = ['premium', 'vip', 'pro', 'bonus', 'eventual'];
              const usersArr = Object.entries(allUsersData || {}).map(([uid, u]) => {
                if (!u || typeof u !== 'object') return null;
                const profile = { ...(u.profile || {}) };
                return { ...u, uid, profile };
              })
              .filter(Boolean)
              .filter(u => u.uid !== 'uid-admin-master' && u.profile?.email !== 'dj@admin.com');

              // Calcular usuarios con plan de pago o bonus activos
              const activePayingUsers = [];
              let totalRevenue = 0;
              const byPlan = {};
              const activations = [];

              usersArr.forEach(u => {
                const profile = u?.profile;
                if (!profile) return;

                // 1. Plan activo base (si es de pago)
                const plan = profile.activePlan;
                if (plan && plan !== 'free' && plan !== 'bonus' && PAID_PLANS.includes(plan)) {
                  const price = parseFloat(plansConfig?.[plan]?.price || 0);
                  const currency = plansConfig?.[plan]?.currency || 'MXN';
                  totalRevenue += price;
                  
                  if (!byPlan[plan]) {
                    byPlan[plan] = { count: 0, subtotal: 0, price, currency, name: plansConfig?.[plan]?.name || plan };
                  }
                  byPlan[plan].count++;
                  byPlan[plan].subtotal += price;
                  activations.push({ ...profile, plan, price });
                  
                  if (!activePayingUsers.some(au => au.uid === u.uid)) {
                    activePayingUsers.push(u);
                  }
                }

                // 2. Add-on de Bonus activo
                const extraRequests = profile.extraRequests ? parseInt(profile.extraRequests, 10) : 0;
                const extraRequestsExpiresAt = profile.extraRequestsExpiresAt ? parseInt(profile.extraRequestsExpiresAt, 10) : 0;
                const isBonusActive = extraRequests > 0 && extraRequestsExpiresAt >= Date.now();
                if (isBonusActive) {
                  const bonusPrice = parseFloat(plansConfig?.bonus?.price || 50);
                  const bonusCurrency = plansConfig?.bonus?.currency || 'MXN';
                  totalRevenue += bonusPrice;
                  
                  if (!byPlan.bonus) {
                    byPlan.bonus = { count: 0, subtotal: 0, price: bonusPrice, currency: bonusCurrency, name: plansConfig?.bonus?.name || 'Plan Bonus (Extra)' };
                  }
                  byPlan.bonus.count++;
                  byPlan.bonus.subtotal += bonusPrice;
                  
                  activations.push({
                    ...profile,
                    plan: 'bonus',
                    price: bonusPrice,
                    activatedAt: extraRequestsExpiresAt - 30 * 24 * 60 * 60 * 1000,
                    expiresAt: extraRequestsExpiresAt
                  });
                  
                  if (!activePayingUsers.some(au => au.uid === u.uid)) {
                    activePayingUsers.push(u);
                  }
                }
              });

              // Ordenar activaciones más recientes primero
              activations.sort((a, b) => (b.activatedAt || 0) - (a.activatedAt || 0));

              // Suscripciones pendientes de validación
              const pendingUsers = usersArr.filter(u =>
                u?.profile?.subscriptionStatus === 'pending_validation'
              );
              const pendingRevenue = pendingUsers.reduce((acc, u) => {
                return acc + parseFloat(plansConfig?.[u?.profile?.selectedPlan]?.price || 0);
              }, 0);

              const avgRevenue = activePayingUsers.length > 0 ? (totalRevenue / activePayingUsers.length) : 0;

              // --- Exportar CSV ---
              const exportCSV = () => {
                const rows = [
                  ['Plan', 'DJ Name', 'Email', 'Gateway', 'Transaction ID', 'Activado', 'Expira', 'Monto MXN'],
                  ...activations.map(p => [
                    p.plan?.toUpperCase() || '',
                    p.djName || p.displayName || '',
                    p.email || '',
                    p.gateway || p.paymentDetails?.gateway || '',
                    p.transactionId || p.paymentDetails?.transactionId || '',
                    p.activatedAt ? new Date(p.activatedAt).toLocaleString('es-MX') : '',
                    p.expiresAt && p.expiresAt > 0 ? new Date(p.expiresAt).toLocaleString('es-MX') : 'Sin expiración',
                    p.price || 0
                  ])
                ];
                const csv = rows.map(r => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `djvip_ingresos_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              };

              const kpiCard = (icon, label, value, sub, color, bgColor) => (
                <div style={{
                  background: bgColor || 'rgba(255,255,255,0.03)',
                  border: `1px solid ${color}33`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  position: 'relative',
                  overflow: 'hidden',
                  minWidth: '120px'
                }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '50px', height: '50px', background: `radial-gradient(circle at top right, ${color}14, transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${color}14`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {React.cloneElement(icon, { size: 12, color })}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', lineHeight: 1.1 }}>{value}</div>
                  {sub && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
                </div>
              );

              return (
                <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
                  {/* Encabezado */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={22} color="var(--success-color)" />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#fff' }}>Estadísticas Financieras</h2>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Ingresos de la plataforma · Solo visible para Admin Master</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={async () => {
                          showToast('⏳ Actualizando finanzas...');
                          await refreshAdminData();
                          await fetchPendingSubscriptions();
                          await fetchPaymentConfig();
                          showToast('📊 Finanzas actualizadas.');
                        }}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.8rem', borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--success-color)' }}
                      >
                        <RefreshCw size={12} /> Actualizar Finanzas
                      </button>
                      <button
                        onClick={() => setShowResetRevenueModal(true)}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.8rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger-color)' }}
                      >
                        <Trash2 size={12} /> Restablecer a Cero
                      </button>
                      <button
                        onClick={exportCSV}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.8rem', borderColor: 'rgba(255, 255, 255, 0.15)', color: 'var(--text-secondary)' }}
                      >
                        <DownloadIcon size={12} /> Exportar CSV
                      </button>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                    marginBottom: '28px'
                  }}>
                    {kpiCard(<DollarSign />, 'Total Recaudado', `$${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, `${activations.length} suscripción${activations.length !== 1 ? 'es' : ''} activa${activations.length !== 1 ? 's' : ''}`, '#10b981', 'rgba(16,185,129,0.05)')}
                    {kpiCard(<Users />, 'DJs con Plan Activo', activePayingUsers.length, `de ${usersArr.length} DJs registrados`, '#7c3aed', 'rgba(124,58,237,0.05)')}
                    {kpiCard(<BarChart2 />, 'Promedio por Suscriptor', activePayingUsers.length > 0 ? `$${avgRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—', 'MXN por DJ activo', '#06b6d4', 'rgba(6,182,212,0.05)')}
                    {kpiCard(<Clock />, 'Pendientes de Validar', pendingUsers.length, pendingRevenue > 0 ? `$${pendingRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN potenciales` : 'Sin ingresos pendientes', '#f59e0b', 'rgba(245,158,11,0.05)')}
                  </div>

                  {/* Desglose por plan */}
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BarChart2 size={16} color="var(--primary-color)" /> Desglose por Plan
                    </h3>
                    {Object.keys(byPlan).length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>No hay suscripciones de pago activas.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                              {['Plan', 'Nombre', 'Suscriptores', 'Precio Unit.', 'Subtotal', '% del Total'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(byPlan).sort((a, b) => b[1].subtotal - a[1].subtotal).map(([planKey, d]) => {
                              const pct = totalRevenue > 0 ? ((d.subtotal / totalRevenue) * 100).toFixed(1) : 0;
                              const planColors = { premium: '#7c3aed', vip: '#06b6d4', pro: '#f59e0b', bonus: '#d4af37', eventual: '#10b981' };
                              const col = planColors[planKey] || '#6b7280';
                              return (
                                <tr key={planKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <td style={{ padding: '12px 14px' }}>
                                    <span style={{ background: `${col}22`, color: col, border: `1px solid ${col}44`, borderRadius: '6px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{planKey}</span>
                                  </td>
                                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{d.name}</td>
                                  <td style={{ padding: '12px 14px', color: '#fff', fontWeight: '700', textAlign: 'center' }}>{d.count}</td>
                                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>${d.price.toFixed(2)} {d.currency}</td>
                                  <td style={{ padding: '12px 14px', color: 'var(--success-color)', fontWeight: '700' }}>${d.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {d.currency}</td>
                                  <td style={{ padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${col}, ${col}aa)`, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                                      </div>
                                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '40px' }}>{pct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: '2px solid var(--surface-border)' }}>
                              <td colSpan={2} style={{ padding: '14px', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.85rem' }}>TOTAL</td>
                              <td style={{ padding: '14px', color: '#fff', fontWeight: '700', textAlign: 'center' }}>{activations.length}</td>
                              <td />
                              <td style={{ padding: '14px', color: 'var(--success-color)', fontWeight: '800', fontSize: '1rem' }}>${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</td>
                              <td style={{ padding: '14px', color: 'var(--text-muted)' }}>100%</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Activaciones recientes + Pendientes en 2 columnas */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>

                    {/* Activaciones recientes */}
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowUpCircle size={16} color="var(--success-color)" /> Activaciones Recientes
                      </h3>
                      {activations.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>Sin activaciones registradas.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
                          {activations.slice(0, 20).map((p, i) => {
                            const planColors = { premium: '#7c3aed', vip: '#06b6d4', pro: '#f59e0b', bonus: '#d4af37', eventual: '#10b981' };
                            const col = planColors[p.plan] || '#6b7280';
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${col}18`, border: `1px solid ${col}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: col }}>{(p.plan || '?')[0].toUpperCase()}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.djName || p.displayName || p.email || 'DJ'}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--success-color)' }}>${p.price.toFixed(0)}</div>
                                  <span style={{ fontSize: '0.68rem', background: `${col}22`, color: col, border: `1px solid ${col}44`, borderRadius: '4px', padding: '1px 6px' }}>{p.plan?.toUpperCase()}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Pendientes de validación */}
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#f59e0b" /> Pagos Pendientes de Validación
                      </h3>
                      {pendingUsers.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>No hay pagos pendientes. ✅</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
                          {pendingUsers.map((u, i) => {
                            const profile = u?.profile;
                            const plan = profile?.selectedPlan || 'pending';
                            const price = parseFloat(plansConfig?.[plan]?.price || 0);
                            const gatewayVal = profile?.gateway || profile?.paymentDetails?.gateway;
                            const gwLabel = { paypal: 'PayPal', mercadopago: 'MercadoPago', transfer: 'Transferencia' }[gatewayVal] || gatewayVal || '—';
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(245,158,11,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <CardIcon size={16} color="#f59e0b" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.djName || profile?.displayName || profile?.email || 'DJ'}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{gwLabel} · {profile?.transactionId || profile?.paymentDetails?.transactionId || '—'}</div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f59e0b' }}>${price.toFixed(0)} MXN</div>
                                  <span style={{ fontSize: '0.68rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '4px', padding: '1px 6px' }}>{plan?.toUpperCase()}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* === SECCIÓN: CONFIGURACIÓN DE PASARELAS DE PAGO === */}
                  <div style={{ marginTop: '28px', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <div style={{ padding: '14px 20px', background: 'rgba(16, 185, 129, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                        <Sliders size={16} color="var(--success-color)" /> Configuración de Pasarelas de Pago (PayPal / Mercado Pago)
                      </span>
                    </div>

                    <form onSubmit={handleSavePaymentConfig} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Estado de Pasarelas */}
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold', width: '100%' }}>Habilitar / Deshabilitar Pasarelas de Pago:</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#fff' }}>
                          <input
                            type="checkbox"
                            checked={paymentConfig.paypalEnabled !== false}
                            onChange={(e) => setPaymentConfig({ ...paymentConfig, paypalEnabled: e.target.checked })}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--success-color)' }}
                          />
                          <span>PayPal Activo</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#fff' }}>
                          <input
                            type="checkbox"
                            checked={paymentConfig.mercadopagoEnabled !== false}
                            onChange={(e) => setPaymentConfig({ ...paymentConfig, mercadopagoEnabled: e.target.checked })}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--success-color)' }}
                          />
                          <span>Mercado Pago Activo</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#fff' }}>
                          <input
                            type="checkbox"
                            checked={paymentConfig.transferEnabled !== false}
                            onChange={(e) => setPaymentConfig({ ...paymentConfig, transferEnabled: e.target.checked })}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--success-color)' }}
                          />
                          <span>Transferencia Bancaria Activa</span>
                        </label>
                      </div>

                      {/* PayPal Config */}
                      <div>
                        <h5 style={{ fontSize: '0.85rem', color: '#fff', borderBottom: '1px solid var(--surface-border)', paddingBottom: '6px', marginBottom: '12px' }}>Credenciales de PayPal</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">PayPal Client ID</label>
                            <input
                              type="text" className="input-field"
                              placeholder="Client ID de PayPal"
                              value={paymentConfig.paypalClientId || ''}
                              onChange={(e) => setPaymentConfig({ ...paymentConfig, paypalClientId: e.target.value })}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">PayPal Client Secret</label>
                            <input
                              type="password" className="input-field"
                              placeholder="Client Secret de PayPal"
                              value={paymentConfig.paypalClientSecret || ''}
                              onChange={(e) => setPaymentConfig({ ...paymentConfig, paypalClientSecret: e.target.value })}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Modo PayPal</label>
                            <select
                              className="input-field"
                              value={paymentConfig.paypalMode || 'sandbox'}
                              onChange={(e) => setPaymentConfig({ ...paymentConfig, paypalMode: e.target.value })}
                              style={{ width: '100%' }}
                            >
                              <option value="sandbox">Sandbox (Pruebas)</option>
                              <option value="live">Live (Producción)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Mercado Pago Config */}
                      <div>
                        <h5 style={{ fontSize: '0.85rem', color: '#fff', borderBottom: '1px solid var(--surface-border)', paddingBottom: '6px', marginBottom: '12px' }}>Credenciales de Mercado Pago</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Mercado Pago Public Key</label>
                            <input
                              type="text" className="input-field"
                              placeholder="Public Key de Mercado Pago"
                              value={paymentConfig.mercadopagoPublicKey || ''}
                              onChange={(e) => setPaymentConfig({ ...paymentConfig, mercadopagoPublicKey: e.target.value })}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Mercado Pago Access Token</label>
                            <input
                              type="password" className="input-field"
                              placeholder="Access Token de Mercado Pago"
                              value={paymentConfig.mercadopagoAccessToken || ''}
                              onChange={(e) => setPaymentConfig({ ...paymentConfig, mercadopagoAccessToken: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Transferencia Bancaria */}
                      <div>
                        <h5 style={{ fontSize: '0.85rem', color: '#fff', borderBottom: '1px solid var(--surface-border)', paddingBottom: '6px', marginBottom: '12px' }}>Datos para Transferencia Bancaria (Moneda Local)</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">CLABE Interbancaria de Recepción (18 dígitos)</label>
                            <input
                              type="text" className="input-field"
                              placeholder="Ingresa la CLABE de tu cuenta bancaria"
                              value={paymentConfig.adminClabe || ''}
                              onChange={(e) => setPaymentConfig({ ...paymentConfig, adminClabe: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn btn-primary" disabled={saveConfigLoading} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                          {saveConfigLoading ? <><RefreshCw size={14} className="animate-spin" /> Guardando...</> : <><Check size={14} /> Guardar Cambios de Pasarela</>}
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              );
            } catch (err) {
              console.error("Error rendering Finanzas:", err);
              return (
                <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-lg)', color: '#fff' }}>
                  <h3 style={{ color: 'var(--danger-color)', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} /> Error en Módulo de Finanzas
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                    Ha ocurrido un error al cargar o procesar las estadísticas financieras. Por favor, reporta el siguiente error al soporte técnico:
                  </p>
                  <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', overflowX: 'auto', border: '1px solid var(--surface-border)', color: '#ff8888' }}>
                    {err.stack || err.message}
                  </pre>
                </div>
              );
            }
          })()}

        </main>
      </div>

      {/* MODAL: BORRAR HISTORIAL SELECCIONADO */}
      {showClearModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 0 40px rgba(239,68,68,0.15)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', marginBottom: '12px' }}>
                <AlertTriangle size={36} color="var(--danger-color)" />
              </div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--danger-color)', marginBottom: '8px' }}>⚠️ Borrado de Historial</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Selecciona los elementos que deseas <strong style={{ color: 'var(--danger-color)' }}>eliminar permanentemente</strong> de tu cuenta.
              </p>
            </div>

            {/* Checkboxes de opciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={clearOptionSongs}
                  onChange={(e) => { setClearOptionSongs(e.target.checked); setClearErrorMsg(''); }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--danger-color)' }}
                />
                <span>🗑️ Todas las peticiones de canciones</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={clearOptionGenres}
                  onChange={(e) => { setClearOptionGenres(e.target.checked); setClearErrorMsg(''); }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--danger-color)' }}
                />
                <span>🗑️ Historial de géneros aprendidos</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={clearOptionArtists}
                  onChange={(e) => { setClearOptionArtists(e.target.checked); setClearErrorMsg(''); }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--danger-color)' }}
                />
                <span>🗑️ Historial de artistas registrados</span>
              </label>



              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={clearOptionAutocomplete}
                  onChange={(e) => { setClearOptionAutocomplete(e.target.checked); setClearErrorMsg(''); }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--danger-color)' }}
                />
                <span>🗑️ Catálogo de autocompletado</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={clearOptionCalendar}
                  onChange={(e) => { setClearOptionCalendar(e.target.checked); setClearErrorMsg(''); }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--danger-color)' }}
                />
                <span>🗑️ Calendario completo (todos los eventos)</span>
              </label>

            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <ShieldAlert size={14} /> Para confirmar, escribe la palabra clave <strong style={{ color: 'var(--danger-color)' }}>clear</strong>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder='Escribe "clear" aquí...'
                value={clearWordConfirm}
                onChange={(e) => { setClearWordConfirm(e.target.value); setClearErrorMsg(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleClearHistory()}
                style={{ borderColor: clearErrorMsg ? 'var(--danger-color)' : undefined }}
                autoFocus
              />
              {clearErrorMsg && (
                <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '6px' }}>{clearErrorMsg}</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }}
                onClick={() => {
                  setShowClearModal(false);
                  setClearWordConfirm('');
                  setClearOptionSongs(false);
                  setClearOptionGenres(false);
                  setClearOptionArtists(false);
                  setClearOptionAutocomplete(false);
                  setClearOptionCalendar(false);
                  setClearErrorMsg('');
                }}
                disabled={clearingHistory}>
                Cancelar
              </button>
              <button className="btn btn-danger" style={{ flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--danger-color)' }}
                onClick={handleClearHistory} disabled={clearingHistory || !clearWordConfirm.trim()}>
                {clearingHistory ? (
                  <><RefreshCw size={14} className="animate-spin" /> Borrando...</>
                ) : (
                  <><Trash2 size={14} /> Ejecutar Borrado</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetRevenueModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 0 40px rgba(239,68,68,0.15)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', marginBottom: '12px' }}>
                <AlertTriangle size={36} color="var(--danger-color)" />
              </div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--danger-color)', marginBottom: '8px' }}>⚠️ Restablecer Finanzas a Cero</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Esta acción restablecerá todas las suscripciones activas de los usuarios al <strong>Plan Demo (Gratuito)</strong>, eliminando los ingresos acumulados de la plataforma y eliminando los comprobantes de pago pendientes de validación.
              </p>
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#ff8888' }}>
                <strong>¡ATENCIÓN!</strong> Esta operación es irreversible y afectará a todos los usuarios registrados.
              </div>
            </div>

            <form onSubmit={handleResetRevenue} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <Lock size={14} /> Contraseña de Administrador (Master Secret)
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Introduce la contraseña maestra..."
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowResetRevenueModal(false);
                    setAdminPasswordInput('');
                  }}
                  disabled={resetRevenueLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  style={{ flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--danger-color)' }}
                  disabled={resetRevenueLoading}
                >
                  {resetRevenueLoading ? (
                    <><RefreshCw size={14} className="animate-spin" /> Restableciendo...</>
                  ) : (
                    <><Trash2 size={14} /> Confirmar Restablecer</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* CRÉDITOS DEL CREADOR */}
      <footer style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
        paddingBottom: '16px'
      }}>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.08))',
            border: '1px solid rgba(124,58,237,0.15)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontWeight: '600',
            color: 'var(--text-secondary)'
          }}>
            <Sparkles size={13} color="var(--primary-color)" />
            Plataforma creada por <strong style={{ color: 'var(--primary-color)' }}>DN Estudio</strong>
          </span>
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', opacity: 0.6 }}>
          {eventSettings.webName || 'DJ a la Carta'} © {new Date().getFullYear()} — Todos los derechos reservados
        </p>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.5, fontWeight: '600' }}>
          Versión Instalada: v{CURRENT_APP_VERSION}
        </p>
      </footer>

      {/* Alerta Visual a Pantalla Completa */}
      {activeVisualAlert && (
        <div className="animate-fade-in" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: activeVisualAlert.type === 'repeat' 
            ? 'rgba(239, 68, 68, 0.96)' // Red
            : activeVisualAlert.type === 'dedication'
              ? 'rgba(245, 158, 11, 0.96)' // Orange
              : 'rgba(16, 185, 129, 0.96)', // Green
          color: '#fff',
          textAlign: 'center',
          padding: '30px'
        }}>
          <h1 style={{
            fontSize: '4.5rem',
            fontWeight: '800',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            color: '#fff'
          }}>
            {activeVisualAlert.type === 'repeat' 
              ? 'Petición para repetir' 
              : activeVisualAlert.type === 'dedication'
                ? 'Petición Dedicada'
                : 'Petición Agregada'}
          </h1>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.95)',
            marginBottom: '10px',
            textShadow: '0 2px 10px rgba(0,0,0,0.4)'
          }}>
            "{activeVisualAlert.title}"
          </p>
          <p style={{
            fontSize: '1.8rem',
            fontWeight: '400',
            color: 'rgba(255,255,255,0.85)',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}>
            {activeVisualAlert.artist}
          </p>
        </div>
      )}

      {/* Chat de Soporte Flotante para DJ PRO */}
      {!isAdminMaster && currentPlan === 'pro' && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
          {/* Botón Flotante */}
          <button
            onClick={() => setSupportChatOpen(!supportChatOpen)}
            className="flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
            style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              position: 'relative'
            }}
            title="Soporte Técnico"
          >
            {supportChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
            {/* Globo de no leídos */}
            {!supportChatOpen && supportChatData?.metadata?.unreadCountByUser > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  width: '20px',
                  height: '20px',
                  transform: 'translate(25%, -25%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                {supportChatData.metadata.unreadCountByUser}
              </span>
            )}
          </button>

          {/* Ventana de Chat */}
          {supportChatOpen && (
            <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
              style={{
                position: 'absolute',
                bottom: '80px',
                right: 0,
                width: '360px',
                height: '480px',
                color: '#fff'
              }}>
              {/* Encabezado */}
              <div className="px-4 py-3 flex items-center justify-between"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
                }}>
                <div>
                  <h3 className="font-bold text-sm" style={{ margin: 0 }}>💬 Soporte Técnico PRO</h3>
                  <p className="text-xs text-purple-200" style={{ margin: 0, opacity: 0.8 }}>Respuesta en tiempo real</p>
                </div>
                <button
                  onClick={() => setSupportChatOpen(false)}
                  className="text-white hover:text-gray-200"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#0b1329', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(!supportChatData?.messages || supportChatData.messages.length === 0) ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 16px', color: 'var(--text-muted)' }}>
                    <MessageSquare size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.8rem', margin: '0 0 4px 0' }}>¿Tienes dudas o problemas técnicos?</p>
                    <p style={{ fontSize: '0.7rem', margin: 0, opacity: 0.7 }}>Escríbenos y el Admin Master te atenderá a la brevedad.</p>
                  </div>
                ) : (
                  supportChatData.messages.map((msg, index) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px', padding: '0 4px' }}>{msg.senderName}</span>
                        <div style={{
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          maxWidth: '85%',
                          wordBreak: 'break-word',
                          background: isMe ? '#7c3aed' : '#1e293b',
                          color: '#fff',
                          borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px'
                        }}>
                          {msg.text}
                        </div>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={supportChatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendSupportMessage} style={{ padding: '12px', borderTop: '1px solid var(--surface-border)', display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.2)' }}>
                <input
                  type="text"
                  value={supportChatText}
                  onChange={(e) => setSupportChatText(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  style={{ flex: 1, height: '36px', fontSize: '0.85rem', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '0 12px', color: '#fff' }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                    border: 'none',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '36px',
                    cursor: 'pointer',
                    color: '#fff'
                  }}
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}



      </div>

      {/* SECCIÓN DE IMPRESIÓN (OCULTA EN PANTALLA) */}
      <div id="print-section">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="print-quadrant">
            <div className="print-card">
              <img 
                src="/template_card.png" 
                alt="Tarjeta QR" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'block',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  zIndex: 1
                }} 
              />
              <div className="print-qr-overlay" style={{ zIndex: 2 }}>
                <QRCodeSVG value={publicEventUrl} size={150} level={"H"} includeMargin={false} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media screen {
          #print-section {
            display: none !important;
          }
        }
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 0 !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .no-print,
          #root > *:not(#print-section) {
            display: none !important;
          }
          
          #print-section {
            display: grid !important;
            grid-template-columns: 50% 50% !important;
            grid-template-rows: 50% 50% !important;
            width: 100% !important;
            height: 100% !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            visibility: visible !important;
          }

          .print-quadrant {
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: relative !important;
            box-sizing: border-box !important;
            border-right: 1px dashed rgba(0, 0, 0, 0.15) !important;
            border-bottom: 1px dashed rgba(0, 0, 0, 0.15) !important;
            visibility: visible !important;
          }

          /* Quitar bordes para los límites exteriores de la hoja A4 */
          .print-quadrant:nth-child(2n) {
            border-right: none !important;
          }
          .print-quadrant:nth-child(n+3) {
            border-bottom: none !important;
          }

          .print-card {
            height: 92% !important;
            aspect-ratio: 571 / 1024 !important;
            position: relative !important;
            box-sizing: border-box !important;
            visibility: visible !important;
          }

          .print-qr-overlay {
            position: absolute !important;
            left: 31.35% !important;
            top: 33.01% !important;
            width: 37.30% !important;
            height: 20.80% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
            visibility: visible !important;
          }

          .print-qr-overlay svg {
            width: 100% !important;
            height: 100% !important;
            display: block !important;
            visibility: visible !important;
          }
        }
      `}</style>
    </>
  );
}
