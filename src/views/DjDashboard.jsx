import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { MOCK_ACCOUNTS, MASTER_ADMIN_EMAIL } from '../firebase';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { 
  Music, LogOut, Settings, Calendar, Download, RefreshCw, 
  Trash2, Plus, Play, Check, X, Bell, BellOff, Volume2, 
  Sparkles, Sliders, Users, Layers, ShieldCheck,
  Link, AlertTriangle, ShieldAlert, ArrowLeft, UserCog, Edit, UserPlus, Mail, Lock, User,
  LayoutGrid, ExternalLink, Image
} from 'lucide-react';

export default function DjDashboard() {
  const { 
    user, 
    logoutDJ, 
    currentEventId, 
    eventSettings, 
    requests, 
    updateRequestStatus, 
    updateEventSettings, 
    createNewEvent,
    changeEvent,
    isMock,
    isAdminMaster,
    impersonatingUid,
    impersonateUser,
    stopImpersonating,
    allUsersData,
    eventsList,
    deleteEvent,
    archiveEvent,
    updateEventMetadata,
    clearHistoryWithOptions,
    autocompleteSongs,
    allEventsData,
    createDjAccount,
    uploadLogo
  } = useFirebase();

  // Estados Locales
  const [activeTab, setActiveTab] = useState('requests'); // requests | settings | calendar | admin
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
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
  }, [eventSettings, currentEventId]);

  // Actualizar el título del navegador dinámicamente
  useEffect(() => {
    const webName = eventSettings.webName || 'DJ a la Carta';
    const eventTitle = eventSettings.title ? ` — ${eventSettings.title}` : '';
    document.title = `${webName}${eventTitle}`;
  }, [eventSettings.webName, eventSettings.title]);

  // Sintetizador de audio premium con Web Audio API
  const playNotificationSound = (toneType = selectedTone) => {
    if (!soundEnabled) return;
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
  }, [requests]);

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
        mercadopagoLink: mercadopagoLinkInput.trim()
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

  const stats = {
    total: Object.keys(requests).length,
    pending: Object.values(requests).filter(r => r.status === 'pending').length,
    playing: Object.values(requests).filter(r => r.status === 'playing').length,
    votes: Object.values(requests).reduce((sum, r) => sum + (r.votes || 0), 0)
  };

  // Construir lista de usuarios para el panel admin
  const adminUsersList = Object.keys(allUsersData).map(uid => {
    const userData = allUsersData[uid];
    const events = userData?.events_index ? Object.values(userData.events_index) : [];
    const eventsCount = events.length;
    
    // Obtener nombres de eventos y el djName común
    const eventTitles = events.map(e => e.title);
    // Intentar buscar el nombre de DJ y email en las cuentas mock o en los eventos
    let djName = 'DJ Sin Nombre';
    let email = '';

    if (uid === 'uid-admin-master') {
      djName = 'Administrador';
      email = MASTER_ADMIN_EMAIL || 'dj@admin.com';
    } else {
      // Leer MOCK_ACCOUNTS directamente desde localStorage (puede haberse actualizado)
      const allAccounts = (() => {
        try { return JSON.parse(localStorage.getItem('mock_accounts') || '[]'); } catch { return []; }
      })();
      const match = allAccounts.find(a => a.uid === uid) || MOCK_ACCOUNTS.find(a => a.uid === uid);
      if (match) {
        djName = match.displayName;
        email = match.email;
      } else if (events.length > 0) {
        djName = events[0].djName;
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
              DJ Cabina Panel
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{req.title}</span>
                          {req.status === 'pending'   && <span className="badge badge-pending">En espera</span>}
                          {req.status === 'accepted'  && <span className="badge badge-accepted">Aceptada</span>}
                          {req.status === 'playing'   && <span className="badge badge-playing animate-pulse-glow">En Reproducción 🎵</span>}
                          {req.status === 'rejected'  && <span className="badge badge-rejected">Rechazada</span>}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {req.artist} • <span style={{ color: 'var(--secondary-color)' }}>{req.genre}</span>
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Recibido: {new Date(req.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Votos</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>{req.votes}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
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

              {/* Géneros aprendidos */}
              {(() => {
                const genreCount = {};
                Object.values(requests).forEach(r => { if (r.genre && r.genre !== 'Personalizado') genreCount[r.genre] = (genreCount[r.genre] || 0) + 1; });
                autocompleteSongs.forEach(s => { if (s.genre && s.genre !== 'Personalizado') genreCount[s.genre] = (genreCount[s.genre] || 0) + 1; });
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

                {/* Integración con Virtual DJ (Solo Desktop) */}
                {window.electronAPI && window.electronAPI.isDesktop && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary-color)', fontWeight: '600' }}>
                      💿 Integración en Tiempo Real con Virtual DJ
                    </label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Escribe de forma automática las peticiones aceptadas en una lista de reproducción o carpeta virtual local dentro de Virtual DJ.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Switch Activar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="vdj-enabled" style={{ fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                          Activar Sincronización Automática con Virtual DJ
                        </label>
                      </div>

                      {virtualDJEnabled && (
                        <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          {/* Ruta de carpeta */}
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Ruta de la Carpeta de Virtual DJ</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                type="text" 
                                className="input-field" 
                                placeholder="Ej: /Users/usuario/Documents/VirtualDJ" 
                                value={virtualDJPath} 
                                onChange={(e) => {
                                  setVirtualDJPath(e.target.value);
                                  localStorage.setItem('vdj_path', e.target.value);
                                }}
                                style={{ fontSize: '0.85rem' }}
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
                                    showToast("❌ No se encontró la carpeta por defecto.");
                                  }
                                }}
                                style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                              >
                                Auto-detectar
                              </button>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Normalmente se encuentra en tus Documentos bajo la carpeta 'VirtualDJ'.
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Formato de archivo */}
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>Formato del Archivo</label>
                              <select 
                                className="input-field" 
                                value={virtualDJFormat} 
                                onChange={(e) => {
                                  setVirtualDJFormat(e.target.value);
                                  localStorage.setItem('vdj_format', e.target.value);
                                }}
                                style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                              >
                                <option value="m3u">M3U Playlist (Recomendado - Carpeta Playlists)</option>
                                <option value="vdjfolder">Virtual Folder XML (Carpeta My Lists)</option>
                              </select>
                            </div>

                            {/* Filtro de sincronización */}
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>Qué Canciones Sincronizar</label>
                              <select 
                                className="input-field" 
                                value={virtualDJSyncMode} 
                                onChange={(e) => {
                                  setVirtualDJSyncMode(e.target.value);
                                  localStorage.setItem('vdj_sync_mode', e.target.value);
                                }}
                                style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                              >
                                <option value="accepted">Solo Aceptadas y Reproduciendo</option>
                                <option value="all">Todas las Peticiones Recibidas (excepto rechazadas)</option>
                              </select>
                            </div>
                          </div>

                          <span style={{ fontSize: '0.75rem', color: 'var(--secondary-color)', fontWeight: '500' }}>
                            💡 Archivo generado: {virtualDJFormat === 'm3u' ? 'Playlists/Peticiones DJ a la Carta.m3u' : 'My Lists/Peticiones DJ a la Carta.vdjfolder'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Módulo de Propinas Voluntarias */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontWeight: '600' }}>
                    💸 Módulo de Propinas Voluntarias (PayPal / Mercado Pago)
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Permite que tu audiencia apoye tu trabajo dejándote propinas. Se mostrará un banner especial en la vista de peticiones.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Switch Activar Propinas */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        id="tips-enabled"
                        checked={tipsEnabledInput} 
                        onChange={(e) => setTipsEnabledInput(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="tips-enabled" style={{ fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                        Habilitar Propinas Voluntarias para el público
                      </label>
                    </div>

                    {tipsEnabledInput && (
                      <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flexWrap: 'wrap' }}>
                          
                          {/* PayPal Username */}
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: '#0079C1', fontWeight: 'bold' }}>PayPal</span> Usuario o Correo
                            </label>
                            <input 
                              type="text" 
                              className="input-field" 
                              placeholder="Ej: djmastermix o correo@paypal.com" 
                              value={paypalUsernameInput}
                              onChange={(e) => setPaypalUsernameInput(e.target.value)}
                              style={{ fontSize: '0.85rem' }}
                            />
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Si ingresas tu usuario, usaremos paypal.me. Si es un correo, redireccionaremos a su página de pagos.
                            </span>
                          </div>

                          {/* Mercado Pago Link / Alias */}
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: '#009EE3', fontWeight: 'bold' }}>Mercado Pago</span> Enlace / Alias / CVU
                            </label>
                            <input 
                              type="text" 
                              className="input-field" 
                              placeholder="Ej: link de pago, alias (dj.mastermix.mp) o CVU" 
                              value={mercadopagoLinkInput}
                              onChange={(e) => setMercadopagoLinkInput(e.target.value)}
                              style={{ fontSize: '0.85rem' }}
                            />
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Si ingresas un alias o CVU, se copiará automáticamente al portapapeles de los usuarios.
                            </span>
                          </div>

                        </div>
                      </div>
                    )}
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
                    showToast("Revertido a cambios guardados");
                  }}>Descartar Cambios</button>
                </div>
              </form>
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
                          <div>
                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                              {uid === 'uid-admin-master' ? '👑 Administrador Master' : djName}
                            </strong>
                            {email && (
                              <p style={{ fontSize: '0.78rem', color: 'var(--secondary-color)', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Mail size={11} /> {email}
                              </p>
                            )}
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              UID: <code style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>{uid}</code>
                            </p>
                          </div>
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

                          {uid !== 'uid-admin-master' && (
                            <button
                              onClick={() => { impersonateUser(uid); setActiveTab('requests'); showToast(`👁️ Viendo panel de ${djName}`); }}
                              className="btn btn-secondary"
                              style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(124,58,237,0.3)' }}
                            >
                              <UserCog size={14} /> Ver Panel
                            </button>
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
    </div>
  );
}
