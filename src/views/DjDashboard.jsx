import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { MOCK_ACCOUNTS, MASTER_ADMIN_EMAIL } from '../firebase';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { 
  Music, LogOut, Settings, Calendar, Download, RefreshCw, 
  Trash2, Plus, Play, Check, X, Bell, BellOff, Volume2, 
  Sparkles, Sliders, Users, Layers, ShieldCheck,
  Link, AlertTriangle, ShieldAlert, ArrowLeft, UserCog, Edit, UserPlus, Mail, Lock, User,
  LayoutGrid, ExternalLink, Image, Search, Megaphone
} from 'lucide-react';

export default function DjDashboard() {
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
    eventsList,
    deleteEvent,
    archiveEvent,
    updateEventMetadata,
    clearHistoryWithOptions,
    autocompleteSongs,
    allEventsData,
    createDjAccount,
    updateDjAccount,
    uploadLogo
  } = useFirebase();

  // Estados Locales
  const [activeTab, setActiveTab] = useState('requests'); // requests | settings | calendar | optimization | benefits | admin
  const [filterSort, setFilterSort] = useState('time');
  const [filterStatus, setFilterStatus] = useState('all');

  // Branding temporal
  const [titleInput, setTitleInput] = useState(eventSettings.title);
  const [djNameInput, setDjNameInput] = useState(eventSettings.djName);
  const [webNameInput, setWebNameInput] = useState(eventSettings.webName || 'DJ a la Carta');
  const [dateInput, setDateInput] = useState(eventSettings.date || new Date().toISOString().split('T')[0]);
  const [primaryColor, setPrimaryColor] = useState(eventSettings.themeColor || '#7c3aed');
  const [secondaryColor, setSecondaryColor] = useState(eventSettings.themeColorSecondary || '#06b6d4');
  const [productionUrl, setProductionUrl] = useState(eventSettings.productionUrl || import.meta.env.VITE_PUBLIC_URL || '');
  // Logo solo por URL externa
  const [logoUrlInput, setLogoUrlInput] = useState(eventSettings.logoUrl || '');
  const [fontFamily, setFontFamily] = useState(eventSettings.fontFamily || 'Outfit');
  const [fontSize, setFontSize] = useState(eventSettings.fontSize || 'medium');
  const [logoSize, setLogoSize] = useState(eventSettings.logoSize || 'medium');

  // Propinas
  const [tipsEnabledInput, setTipsEnabledInput] = useState(eventSettings.tipsEnabled || false);
  const [paypalUsernameInput, setPaypalUsernameInput] = useState(eventSettings.paypalUsername || '');
  const [mercadopagoLinkInput, setMercadopagoLinkInput] = useState(eventSettings.mercadopagoLink || '');
  const [clabeInput, setClabeInput] = useState(eventSettings.bankClabe || '');
  const [dedicationsEnabledInput, setDedicationsEnabledInput] = useState(eventSettings.dedicationsEnabled || false);
  const [customGenresInput, setCustomGenresInput] = useState(eventSettings.customGenres || '');

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

  // Alertas / Audio / Notificaciones
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTone, setSelectedTone] = useState(() => localStorage.getItem('dj_notification_tone') || 'chime');
  const [androidSoundName, setAndroidSoundName] = useState('Predeterminado del sistema');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
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
    setDateInput(eventSettings.date || new Date().toISOString().split('T')[0]);
    setPrimaryColor(eventSettings.themeColor || '#7c3aed');
    setSecondaryColor(eventSettings.themeColorSecondary || '#06b6d4');
    setProductionUrl(eventSettings.productionUrl || import.meta.env.VITE_PUBLIC_URL || '');
    setLogoUrlInput(eventSettings.logoUrl || '');
    setFontFamily(eventSettings.fontFamily || 'Outfit');
    setFontSize(eventSettings.fontSize || 'medium');
    setLogoSize(eventSettings.logoSize || 'medium');
    setTipsEnabledInput(eventSettings.tipsEnabled || false);
    setPaypalUsernameInput(eventSettings.paypalUsername || '');
    setMercadopagoLinkInput(eventSettings.mercadopagoLink || '');
    setClabeInput(eventSettings.bankClabe || '');
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

    // Si estamos en la app Android y tenemos la interfaz nativa
    if (window.AndroidApp && window.AndroidApp.playSystemNotificationSound) {
      window.AndroidApp.playSystemNotificationSound();
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
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
    showToast(permission === 'granted' ? '🔔 Notificaciones activadas' : '❌ Permiso denegado');
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

          if (notificationsEnabled && Notification.permission === 'granted') {
            new Notification(`Nueva petición: ${req.title}`, {
              body: `De: ${req.artist} (${req.genre})`,
              icon: '/icon-192.png'
            });
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

  // Guardar configuraciones de Marca Blanca
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
        date: dateInput,
        themeColor: primaryColor,
        themeColorSecondary: secondaryColor,
        productionUrl: productionUrl.trim().replace(/\/$/, ''),
        fontFamily,
        fontSize,
        logoSize,
        tipsEnabled: tipsEnabledInput,
        paypalUsername: paypalUsernameInput.trim(),
        mercadopagoLink: mercadopagoLinkInput.trim(),
        bankClabe: clabeInput.trim(),
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

  // Guardar configuraciones de propinas desde el panel de beneficios
  const handleSaveBenefitsSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      await updateEventSettings({
        tipsEnabled: tipsEnabledInput,
        paypalUsername: paypalUsernameInput.trim(),
        mercadopagoLink: mercadopagoLinkInput.trim(),
        bankClabe: clabeInput.trim()
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
      showToast(`❌ Error al crear evento: ${err.message || ''}`);
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
      showToast(`❌ Error al eliminar: ${err.message || ''}`);
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
      await updateDjAccount(uid, editDjEmail.trim(), editDjDisplayName.trim(), editDjPassword.trim() || null);
      showToast('✅ Datos de registro actualizados correctamente');
      setEditingDjUid(null);
      setEditDjPassword('');
    } catch (err) {
      showToast(`❌ Error al actualizar: ${err.message || ''}`);
    } finally {
      setEditDjLoading(false);
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
    return { uid, eventsCount, requestsCount, djName, eventTitles, email };
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 15px' }}>
      
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
      <header className="glass-panel" style={{
        padding: '20px 30px', borderRadius: 'var(--radius-lg)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '20px', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="flex-center animate-pulse-glow" style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
          }}>
            <Music size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              DJ Panel
              <span className="badge badge-playing" style={{ fontSize: '0.65rem' }}>PWA Activo 💻</span>
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
                {window.AndroidApp ? (
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
                  <select value={selectedTone} onChange={(e) => { const t = e.target.value; setSelectedTone(t); localStorage.setItem('dj_notification_tone', t); playNotificationSound(t); }}
                    className="input-field" style={{ padding: '4px 8px', fontSize: '0.75rem', height: '36px', width: '130px', border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                    <option value="chime">🔔 Campana</option>
                    <option value="beep">📟 Bip Suave</option>
                    <option value="retro">🎮 Alarma Retro</option>
                    <option value="synth">🎹 Pulsos Synth</option>
                  </select>
                )}
                <button className="btn btn-secondary btn-icon" onClick={() => playNotificationSound(selectedTone)}
                  style={{ width: '36px', height: '36px', border: 'none', background: 'transparent' }} title="Probar Sonido">
                  <Volume2 size={14} color="var(--text-secondary)" />
                </button>
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
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Total Peticiones</p>
            <h3 style={{ fontSize: '2rem', marginTop: '6px' }}>{stats.total}</h3></div>
          <Layers size={36} color="var(--primary-color)" style={{ opacity: 0.6 }} />
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Por Aceptar</p>
            <h3 style={{ fontSize: '2rem', marginTop: '6px', color: 'var(--warning-color)' }}>{stats.pending}</h3></div>
          <RefreshCw size={36} color="var(--warning-color)" style={{ opacity: 0.6 }} className={stats.pending > 0 ? 'animate-spin' : ''} />
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Sonando Ahora</p>
            <h3 style={{ fontSize: '2rem', marginTop: '6px', color: 'var(--secondary-color)' }}>{stats.playing}</h3></div>
          <Play size={36} color="var(--secondary-color)" style={{ opacity: 0.6 }} />
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Votos de la Audiencia</p>
            <h3 style={{ fontSize: '2rem', marginTop: '6px', color: 'var(--success-color)' }}>{stats.votes}</h3></div>
          <Users size={36} color="var(--success-color)" style={{ opacity: 0.6 }} />
        </div>
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
              <Settings size={16} /><span>Personalizar Evento</span>
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
            </button>
            <button className={`btn ${activeTab === 'benefits' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('benefits')} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Sparkles size={16} /><span>Beneficios para el DJ</span>
            </button>
            {/* Tab Admin: solo visible para dj@admin.com sin impersonar */}
            {isAdminMaster && !impersonatingUid && (
              <button className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('admin')} style={{ justifyContent: 'flex-start', width: '100%', borderColor: activeTab === 'admin' ? undefined : 'rgba(245,158,11,0.2)' }}>
                <UserCog size={16} /><span>Panel Admin</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: 'rgba(245,158,11,0.15)', color: 'var(--warning-color)', padding: '2px 6px', borderRadius: '8px', fontWeight: '700' }}>MASTER</span>
              </button>
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
                      if (window.confirm("¿Estás seguro de limpiar la lista?")) {
                        try {
                          await clearActiveAndPlayedRequests();
                          showToast("🧹 Lista de peticiones e historial limpiados con éxito");
                        } catch (err) {
                          console.error(err);
                          showToast("❌ Error al limpiar la lista");
                        }
                      }
                    }}
                    className="btn btn-danger"
                    style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Limpiar toda la cola de peticiones e historial"
                  >
                    <Trash2 size={14} />
                    <span>Limpiar Cola</span>
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

              {/* Melodías más pedidas (Top Popularidad) */}
              {(() => {
                const songCount = {};
                
                // Procesar peticiones activas
                Object.values(requests).forEach(r => {
                  if (r.title) {
                    const key = `${r.title.trim().toLowerCase()} - ${r.artist ? r.artist.trim().toLowerCase() : 'artista no especificado'}`;
                    const votes = r.votes || 1;
                    if (!songCount[key]) {
                      songCount[key] = {
                        title: r.title.trim(),
                        artist: r.artist ? r.artist.trim() : 'Artista no especificado',
                        genre: r.genre || '',
                        votes: 0
                      };
                    }
                    songCount[key].votes += votes;
                  }
                });

                // Procesar peticiones ya reproducidas
                Object.values(playedRequests || {}).forEach(r => {
                  if (r.title) {
                    const key = `${r.title.trim().toLowerCase()} - ${r.artist ? r.artist.trim().toLowerCase() : 'artista no especificado'}`;
                    const votes = r.votes || 1;
                    if (!songCount[key]) {
                      songCount[key] = {
                        title: r.title.trim(),
                        artist: r.artist ? r.artist.trim() : 'Artista no especificado',
                        genre: r.genre || '',
                        votes: 0
                      };
                    }
                    songCount[key].votes += votes;
                  }
                });

                const sortedSongs = Object.values(songCount).sort((a, b) => b.votes - a.votes);
                if (sortedSongs.length === 0) return null;
                
                // Mostrar solo las top 5 melodías más pedidas para mantenerlo compacto
                const topSongs = sortedSongs.slice(0, 5);

                return (
                  <div style={{ marginTop: '24px', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Music size={14} color="var(--primary-color)" />
                      Melodías más pedidas (Top Popularidad)
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
                              ❤️ {song.votes}
                            </span>
                          </div>
                        </div>
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
                Configuración de Marca Blanca (White-Label)
              </h2>

              <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Logo Personalizado */}
                <div className="form-group" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Image size={15} color="var(--secondary-color)" />
                    Logotipo Personalizado (Marca Blanca)
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
                      
                      {/* Opción A: Subir Archivo */}
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

                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

                      {/* Opción B: URL Externa */}
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

                {/* URL de Producción (Vercel) */}
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

                {/* Nombre de la Web / Plataforma */}
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

                {/* Títulos */}
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

                {/* Paleta de Colores */}
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

                {/* Tipografía y Escala */}
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

                {/* Módulo de Comentarios o Dedicatorias */}
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
                    setDedicationsEnabledInput(eventSettings.dedicationsEnabled || false);
                    showToast("Revertido a cambios guardados");
                  }}>Descartar Cambios</button>
                </div>
              </form>
            </div>
          )}

          {/* PANEL AJUSTES DE OPTIMIZACIÓN */}
          {activeTab === 'optimization' && (
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
                  {adminUsersList.map(({ uid, eventsCount, requestsCount, djName, eventTitles, email }) => (
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
            Plataforma creada por <strong style={{ color: 'var(--primary-color)' }}>Dorian Najera</strong>
          </span>
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', opacity: 0.6 }}>
          {eventSettings.webName || 'DJ a la Carta'} © {new Date().getFullYear()} — Todos los derechos reservados
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
    </div>
  );
}
