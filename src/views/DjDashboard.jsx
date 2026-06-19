import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Music, LogOut, Settings, Calendar, Download, RefreshCw, 
  Trash2, Plus, Play, Check, X, Bell, BellOff, Volume2, 
  Upload, Sparkles, Sliders, Users, Layers, ShieldCheck
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
    uploadLogo, 
    createNewEvent,
    changeEvent,
    isMock,
    eventsList,
    deleteEvent,
    archiveEvent
  } = useFirebase();

  // Estados Locales
  const [activeTab, setActiveTab] = useState('requests'); // requests | settings | events
  const [filterSort, setFilterSort] = useState('time'); // time | popularity
  const [filterStatus, setFilterStatus] = useState('all'); // all | pending | accepted | playing | rejected
  
  // Formulario Nuevo Evento
  const [newEventId, setNewEventId] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDj, setNewEventDj] = useState('');
  const [newEventDate, setNewEventDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [showArchived, setShowArchived] = useState(false);

  // Branding temporal
  const [titleInput, setTitleInput] = useState(eventSettings.title);
  const [djNameInput, setDjNameInput] = useState(eventSettings.djName);
  const [primaryColor, setPrimaryColor] = useState(eventSettings.themeColor || '#7c3aed');
  const [secondaryColor, setSecondaryColor] = useState(eventSettings.themeColorSecondary || '#06b6d4');
  
  // Alertas / Audio / Notificaciones
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTone, setSelectedTone] = useState(() => {
    return localStorage.getItem('dj_notification_tone') || 'chime';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Referencia para rastrear peticiones previas y detectar nuevas
  const prevRequestsRef = useRef({});

  // Sincronizar inputs locales al cambiar de evento
  useEffect(() => {
    setTitleInput(eventSettings.title);
    setDjNameInput(eventSettings.djName);
    setPrimaryColor(eventSettings.themeColor || '#7c3aed');
    setSecondaryColor(eventSettings.themeColorSecondary || '#06b6d4');
  }, [eventSettings, currentEventId]);

  // Sintetizador de audio premium con la Web Audio API (Soporta múltiples tonos)
  const playNotificationSound = (toneType = selectedTone) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      if (toneType === 'chime') {
        // Campana Espacial (Original Chime)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (toneType === 'beep') {
        // Bip Suave (Double beep)
        const playBeep = (time, freq) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(0.08, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(time);
          osc.stop(time + 0.1);
        };
        playBeep(now, 880); // A5
        playBeep(now + 0.12, 880);
      } else if (toneType === 'retro') {
        // Alarma Retro (8-bit laser sweep)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (toneType === 'synth') {
        // Pulsos Synth (Chord synth pluck)
        const freqs = [261.63, 329.63, 392.00, 523.25]; // C chord (C4, E4, G4, C5)
        freqs.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + i * 0.03);
          
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, now);
          
          gain.gain.setValueAtTime(0.03, now + i * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(now + i * 0.03);
          osc.stop(now + 0.35);
        });
      }
    } catch (e) {
      console.error("Audio Context error", e);
    }
  };

  // Solicitar permiso de Notificaciones Push
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
    showToast(permission === 'granted' ? '🔔 Notificaciones activadas' : '❌ Permiso denegado');
  };

  // Monitorear peticiones entrantes para disparar notificaciones
  useEffect(() => {
    const prevCount = Object.keys(prevRequestsRef.current).length;
    const currentKeys = Object.keys(requests);
    const currentCount = currentKeys.length;

    if (currentCount > prevCount) {
      // Encontrar las llaves que no existían antes
      const newKeys = currentKeys.filter(key => !prevRequestsRef.current[key]);
      
      newKeys.forEach(key => {
        const req = requests[key];
        
        // Alertar solo de peticiones pendientes entrantes
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

  // Descarga del código QR en formato SVG de alta calidad
  const downloadQR = () => {
    const svgElement = document.getElementById("qr-code-svg");
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    const svgXml = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgXml], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `QR-${currentEventId}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    showToast("⬇️ Código QR descargado exitosamente");
  };

  // Guardar configuraciones de Marca Blanca
  const handleSaveBranding = async (e) => {
    e.preventDefault();
    try {
      await updateEventSettings({
        title: titleInput,
        djName: djNameInput,
        themeColor: primaryColor,
        themeColorSecondary: secondaryColor
      });
      showToast("💾 Configuración de marca guardada");
    } catch (err) {
      console.error(err);
      showToast("Error al guardar configuraciones");
    }
  };

  // Manejar subida de Logotipo
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showToast("⏳ Subiendo logotipo...");
      await uploadLogo(file);
      showToast("✅ Logotipo actualizado");
    } catch (err) {
      console.error(err);
      showToast("Error al subir logotipo");
    }
  };

  // Crear un nuevo evento
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventId.trim() || !newEventTitle.trim()) {
      showToast("Por favor llena todos los campos");
      return;
    }
    
    const cleanId = newEventId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    try {
      await createNewEvent(cleanId, newEventTitle, newEventDj, newEventDate);
      showToast(`🎉 Evento "${newEventTitle}" creado`);
      setNewEventId('');
      setNewEventTitle('');
      setNewEventDj('');
      setNewEventDate(new Date().toISOString().split('T')[0]);
      setActiveTab('requests');
    } catch (err) {
      console.error(err);
      showToast("Error al crear evento");
    }
  };

  // Enlace público del evento
  const publicEventUrl = `${window.location.origin}/?event=${currentEventId}`;

  // Filtrar y ordenar peticiones
  const sortedRequests = Object.keys(requests)
    .map(key => ({
      id: key,
      ...requests[key]
    }))
    .filter(req => {
      if (filterStatus === 'all') return true;
      return req.status === filterStatus;
    })
    .sort((a, b) => {
      if (filterSort === 'popularity') {
        if (b.votes !== a.votes) return b.votes - a.votes;
      }
      // Por defecto ordenar por hora (más recientes primero)
      return b.timestamp - a.timestamp;
    });

  // Estadísticas rápidas para las tarjetas
  const stats = {
    total: Object.keys(requests).length,
    pending: Object.values(requests).filter(r => r.status === 'pending').length,
    playing: Object.values(requests).filter(r => r.status === 'playing').length,
    votes: Object.values(requests).reduce((sum, r) => sum + (r.votes || 0), 0)
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 15px' }}>
      
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(18, 18, 24, 0.9)',
          border: '1px solid var(--primary-color)',
          boxShadow: '0 0 15px var(--primary-glow)',
          padding: '12px 24px',
          borderRadius: 'var(--radius-md)',
          backdropFilter: 'blur(10px)',
          animation: 'slideIn 0.2s ease-out'
        }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{toastMessage}</p>
        </div>
      )}

      {/* HEADER DE CABINA */}
      <header className="glass-panel" style={{
        padding: '20px 30px',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="flex-center animate-pulse-glow" style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
          }}>
            <Music size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              DJ Cabina Panel
              <span className="badge badge-playing" style={{ fontSize: '0.65rem' }}>PWA Activo 💻</span>
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Evento Activo: <strong style={{ color: 'var(--secondary-color)' }}>{eventSettings.title}</strong>
            </p>
          </div>
        </div>

        {/* Controles de Sincronización y Notificaciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Indicador Modo */}
          <div className="glass-panel" style={{ 
            padding: '8px 12px', 
            borderRadius: 'var(--radius-md)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            fontSize: '0.85rem',
            border: isMock ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isMock ? 'var(--warning-color)' : 'var(--success-color)',
              boxShadow: isMock ? '0 0 8px var(--warning-color)' : '0 0 8px var(--success-color)'
            }} />
            <span style={{ color: isMock ? 'var(--warning-color)' : 'var(--success-color)', fontWeight: '600' }}>
              {isMock ? 'Modo Local' : 'Firebase Conectado'}
            </span>
          </div>

          {/* Sonido ON/OFF y Selector de Tono */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 'var(--radius-md)' }}>
            <button 
              className="btn btn-secondary btn-icon" 
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                showToast(soundEnabled ? '🔇 Alertas de sonido apagadas' : '🔊 Alertas de sonido encendidas');
              }}
              style={{ width: '36px', height: '36px' }}
              title={soundEnabled ? "Silenciar Alertas" : "Activar Alertas"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <Volume2 size={16} style={{ opacity: 0.4 }} />}
            </button>
            
            {soundEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <select
                  value={selectedTone}
                  onChange={(e) => {
                    const tone = e.target.value;
                    setSelectedTone(tone);
                    localStorage.setItem('dj_notification_tone', tone);
                    playNotificationSound(tone);
                  }}
                  className="input-field"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    height: '36px',
                    width: '130px',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                  title="Seleccionar tono de alerta"
                >
                  <option value="chime">🔔 Campana</option>
                  <option value="beep">📟 Bip Suave</option>
                  <option value="retro">🎮 Alarma Retro</option>
                  <option value="synth">🎹 Pulsos Synth</option>
                </select>
                <button
                  className="btn btn-secondary btn-icon"
                  onClick={() => playNotificationSound(selectedTone)}
                  style={{ width: '36px', height: '36px', border: 'none', background: 'transparent' }}
                  title="Probar Sonido"
                >
                  <Volume2 size={14} color="var(--text-secondary)" />
                </button>
              </div>
            )}
          </div>

          {/* Notificaciones Push ON/OFF */}
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={requestNotificationPermission}
            title="Activar Notificaciones Push"
          >
            {notificationsEnabled ? <Bell size={18} color="var(--secondary-color)" /> : <BellOff size={18} />}
          </button>

          {/* Cerrar Sesión */}
          <button className="btn btn-danger" onClick={logoutDJ} style={{ padding: '10px 18px' }}>
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* METRICAS RAPIDAS */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Total Peticiones</p>
            <h3 style={{ fontSize: '2rem', marginTop: '6px' }}>{stats.total}</h3>
          </div>
          <Layers size={36} color="var(--primary-color)" style={{ opacity: 0.6 }} />
        </div>
        
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Por Aceptar</p>
            <h3 style={{ fontSize: '2rem', marginTop: '6px', color: 'var(--warning-color)' }}>{stats.pending}</h3>
          </div>
          <RefreshCw size={36} color="var(--warning-color)" style={{ opacity: 0.6 }} className={stats.pending > 0 ? 'animate-spin' : ''} />
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Sonando Ahora</p>
            <h3 style={{ fontSize: '2rem', marginTop: '6px', color: 'var(--secondary-color)' }}>{stats.playing}</h3>
          </div>
          <Play size={36} color="var(--secondary-color)" style={{ opacity: 0.6 }} />
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Votos de la Audiencia</p>
            <h3 style={{ fontSize: '2rem', marginTop: '6px', color: 'var(--success-color)' }}>{stats.votes}</h3>
          </div>
          <Users size={36} color="var(--success-color)" style={{ opacity: 0.6 }} />
        </div>
      </section>

      {/* PANEL PRINCIPAL (DOCK DE NAVEGACION INTERNA) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* COLUMNA IZQUIERDA: MENÚS DE CONFIGURACIÓN Y QR */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Navegación Interna */}
          <nav className="glass-panel" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button 
              className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setActiveTab('requests')}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <Music size={16} />
              <span>Lista de Peticiones</span>
            </button>
            
            <button 
              className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setActiveTab('settings')}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <Settings size={16} />
              <span>Personalizar Marca</span>
            </button>
            
            <button 
              className={`btn ${activeTab === 'events' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setActiveTab('events')}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <Calendar size={16} />
              <span>Gestión de Eventos</span>
            </button>
          </nav>

          {/* TARJETA QR DEL EVENTO */}
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Código QR para el Público</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Muestra o descarga este QR para que el público escanee y acceda a la web app.
            </p>
            
            {/* Contenedor del QR */}
            <div className="flex-center" style={{
              background: '#fff',
              padding: '15px',
              borderRadius: 'var(--radius-md)',
              display: 'inline-flex',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '16px'
            }}>
              <QRCodeSVG 
                id="qr-code-svg"
                value={publicEventUrl} 
                size={180} 
                level={"H"}
                includeMargin={false}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={downloadQR} style={{ width: '100%', padding: '10px' }}>
                <Download size={14} />
                <span>Descargar QR (SVG)</span>
              </button>
              <a 
                href={publicEventUrl} 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: '0.8rem', color: 'var(--secondary-color)', textDecoration: 'none', wordBreak: 'break-all' }}
              >
                Abrir vista público 🔗
              </a>
            </div>
          </div>
        </aside>

        {/* COLUMNA DERECHA: PANELES DINÁMICOS */}
        <main>
          {/* 1. LISTA DE PETICIONES */}
          {activeTab === 'requests' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap',
                gap: '15px',
                marginBottom: '20px',
                borderBottom: '1px solid var(--surface-border)',
                paddingBottom: '16px'
              }}>
                <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={20} color="var(--primary-color)" />
                  Peticiones en Cola
                </h2>
                
                {/* Filtros de Orden y Estado */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Filtro Estado */}
                  <select 
                    className="input-field" 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="accepted">Aceptadas</option>
                    <option value="playing">Reproduciendo</option>
                    <option value="rejected">Declinadas</option>
                  </select>

                  {/* Filtro Orden */}
                  <div style={{
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: '3px'
                  }}>
                    <button 
                      onClick={() => setFilterSort('time')}
                      style={{
                        padding: '6px 12px',
                        background: filterSort === 'time' ? 'var(--primary-color)' : 'transparent',
                        border: 'none',
                        borderRadius: 'calc(var(--radius-md) - 3px)',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Más Recientes
                    </button>
                    <button 
                      onClick={() => setFilterSort('popularity')}
                      style={{
                        padding: '6px 12px',
                        background: filterSort === 'popularity' ? 'var(--primary-color)' : 'transparent',
                        border: 'none',
                        borderRadius: 'calc(var(--radius-md) - 3px)',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Más Votadas 🔥
                    </button>
                  </div>
                </div>
              </div>

              {/* Contenedor del listado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedRequests.length === 0 ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    Ninguna petición coincide con los filtros aplicados.
                  </div>
                ) : (
                  sortedRequests.map((req) => (
                    <div 
                      key={req.id}
                      className="glass-panel"
                      style={{
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '15px',
                        flexWrap: 'wrap',
                        borderLeft: req.status === 'playing' ? '4px solid var(--secondary-color)' : 
                                   req.status === 'accepted' ? '4px solid var(--success-color)' : 
                                   req.status === 'rejected' ? '4px solid var(--danger-color)' : '4px solid var(--warning-color)'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                            {req.title}
                          </span>
                          
                          {req.status === 'pending' && <span className="badge badge-pending">En espera</span>}
                          {req.status === 'accepted' && <span className="badge badge-accepted">Aceptada</span>}
                          {req.status === 'playing' && <span className="badge badge-playing animate-pulse-glow">Sonando ahora 🎵</span>}
                          {req.status === 'rejected' && <span className="badge badge-rejected">Declinada</span>}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {req.artist} • <span style={{ color: 'var(--secondary-color)' }}>{req.genre}</span>
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Recibido: {new Date(req.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Votos */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Votos</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>{req.votes}</span>
                        </div>

                        {/* Botones de acción del DJ */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {/* Aceptar */}
                          {req.status !== 'accepted' && req.status !== 'playing' && (
                            <button 
                              onClick={() => {
                                updateRequestStatus(req.id, 'accepted');
                                showToast(`Aceptaste: ${req.title}`);
                              }}
                              className="btn btn-secondary btn-icon"
                              style={{ border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--success-color)' }}
                              title="Aceptar Petición"
                            >
                              <Check size={16} />
                            </button>
                          )}

                          {/* Sonar */}
                          {req.status !== 'playing' && (
                            <button 
                              onClick={() => {
                                updateRequestStatus(req.id, 'playing');
                                showToast(`Sonando: ${req.title}`);
                              }}
                              className="btn btn-secondary btn-icon"
                              style={{ border: '1px solid rgba(6, 182, 212, 0.4)', color: 'var(--secondary-color)' }}
                              title="Poner a Sonar"
                            >
                              <Play size={16} />
                            </button>
                          )}

                          {/* Rechazar */}
                          {req.status !== 'rejected' && (
                            <button 
                              onClick={() => {
                                updateRequestStatus(req.id, 'rejected');
                                showToast(`Rechazaste: ${req.title}`);
                              }}
                              className="btn btn-secondary btn-icon"
                              style={{ border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--danger-color)' }}
                              title="Declinar Petición"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 2. PERSONALIZACION DE MARCA (BRANDING / WHITE-LABEL) */}
          {activeTab === 'settings' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--primary-color)" />
                Configuración de Marca Blanca (White-Label)
              </h2>

              <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Fila: Logo */}
                <div className="form-group" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                  <label className="form-label">Logotipo Personalizado</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '8px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--surface-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {eventSettings.logoUrl ? (
                        <img src={eventSettings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Music size={24} color="var(--text-muted)" />
                      )}
                    </div>
                    
                    <div>
                      <input 
                        type="file" 
                        id="logo-upload" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="logo-upload" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        <Upload size={14} />
                        <span>Subir Imagen</span>
                      </label>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Recomendado: Fondo transparente PNG, máx. 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fila: Títulos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Título del Evento (Público)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={titleInput} 
                      onChange={(e) => setTitleInput(e.target.value)} 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Nombre del DJ en Cabina</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={djNameInput} 
                      onChange={(e) => setDjNameInput(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                {/* Fila: Selector de Paleta de Colores */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <label className="form-label">Esquema de Colores Dinámico</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Personaliza los colores que verá el público. Los estilos se adaptan en caliente.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="color" 
                        value={primaryColor} 
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        style={{ 
                          width: '44px', 
                          height: '44px', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          background: 'transparent'
                        }}
                      />
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block' }}>Color Primario</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Botones y Títulos</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="color" 
                        value={secondaryColor} 
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        style={{ 
                          width: '44px', 
                          height: '44px', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          background: 'transparent'
                        }}
                      />
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block' }}>Color Secundario</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status y Destacados</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
                  <button type="submit" className="btn btn-primary">
                    Guardar Configuración
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setTitleInput(eventSettings.title);
                      setDjNameInput(eventSettings.djName);
                      setPrimaryColor(eventSettings.themeColor || '#7c3aed');
                      setSecondaryColor(eventSettings.themeColorSecondary || '#06b6d4');
                      showToast("Revertido a cambios guardados");
                    }}
                  >
                    Descartar Cambios
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* 3. GESTIÓN DE EVENTOS */}
          {activeTab === 'events' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="var(--primary-color)" />
                Crear y Gestionar Eventos Musicales
              </h2>

              {/* Crear Evento */}
              <form onSubmit={handleCreateEvent} style={{
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                marginBottom: '30px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                  <Plus size={16} color="var(--secondary-color)" />
                  Registrar Nuevo Evento en Calendario
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">ID Único (para QR / URL)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="ej. boda-carlos-y-sofia" 
                      value={newEventId}
                      onChange={(e) => setNewEventId(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Título del Evento (Ej: Mis XV Años)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="ej. Boda de Carlos y Sofía" 
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">DJ Residente</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="ej. DJ MasterMix" 
                      value={newEventDj}
                      onChange={(e) => setNewEventDj(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha del Evento</label>
                    <input 
                      type="date" 
                      className="input-field" 
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 20px' }}>
                  Crear e Iniciar Evento 🗓️
                </button>
              </form>

              {/* Selector Rápido de eventos */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <h4 style={{ fontSize: '0.95rem' }}>Listado de Eventos en Calendario</h4>
                  
                  {/* Selector de Archivados */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox" 
                      checked={showArchived}
                      onChange={(e) => setShowArchived(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Ver eventos finalizados / archivados
                  </label>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(eventsList || []).length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron eventos en la base de datos.
                    </div>
                  ) : (
                    (eventsList || [])
                      .filter(ev => showArchived ? ev.archived : !ev.archived)
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map(ev => (
                        <div 
                          key={ev.id}
                          className="glass-panel animate-slide-in"
                          style={{
                            padding: '14px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderRadius: 'var(--radius-md)',
                            borderColor: currentEventId === ev.id ? 'var(--secondary-color)' : undefined,
                            background: currentEventId === ev.id ? 'rgba(6, 182, 212, 0.04)' : undefined,
                            gap: '15px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', minWidth: '200px', flex: 1 }}>
                            <div className="flex-center" style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: 'var(--radius-sm)',
                              background: ev.archived ? 'rgba(255,255,255,0.03)' : 'rgba(124, 58, 237, 0.1)',
                              border: ev.archived ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(124, 58, 237, 0.2)'
                            }}>
                              <Calendar size={18} color={ev.archived ? 'var(--text-muted)' : 'var(--primary-color)'} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{ev.title}</strong>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                ID: <span style={{ color: 'var(--text-muted)' }}>{ev.id}</span> • DJ: <strong>{ev.djName || 'DJ MasterMix'}</strong>
                              </p>
                              <span style={{ fontSize: '0.75rem', color: 'var(--secondary-color)', fontWeight: '600' }}>
                                📅 Fecha: {new Date(ev.date + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          
                          {/* Botones de acción del evento */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {currentEventId === ev.id ? (
                              <span className="badge badge-playing" style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '32px' }}>
                                <ShieldCheck size={12} /> Activo en Cabina
                              </span>
                            ) : (
                              <button 
                                onClick={() => {
                                  changeEvent(ev.id);
                                  showToast(`Cambiado al evento: ${ev.title}`);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '6px 14px', fontSize: '0.8rem', height: '32px' }}
                              >
                                Seleccionar
                              </button>
                            )}

                            {/* Botón Archivar */}
                            <button
                              onClick={async () => {
                                const newState = !ev.archived;
                                await archiveEvent(ev.id, newState);
                                showToast(newState ? `📁 Evento "${ev.title}" archivado` : `📂 Evento "${ev.title}" restaurado`);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', height: '32px', color: ev.archived ? 'var(--success-color)' : 'var(--warning-color)' }}
                              title={ev.archived ? "Desarchivar Evento" : "Archivar Evento (Finalizar)"}
                            >
                              {ev.archived ? "Desarchivar" : "Archivar"}
                            </button>

                            {/* Botón Eliminar */}
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el evento "${ev.title}" y todas sus peticiones? Esta acción no se puede deshacer.`)) {
                                  deleteEvent(ev.id);
                                  showToast(`❌ Evento "${ev.title}" eliminado`);
                                }
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', height: '32px', color: 'var(--danger-color)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                              title="Eliminar Evento Permanentemente"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>
          )}
        </main>
      </div>

    </div>
  );
}
