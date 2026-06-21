import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { Music, Heart, Sparkles, Send, Clock, Volume2, ShieldAlert, CheckCircle } from 'lucide-react';

// Generar o recuperar ID de sesión único para controlar anti-spam y votos
const getSessionId = () => {
  let sessionId = localStorage.getItem('dj_platform_session');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('dj_platform_session', sessionId);
  }
  return sessionId;
};

const COOLDOWN_TIME_MS = 10000; // 10 segundos de cooldown para anti-spam

export default function PublicView() {
  const { 
    eventSettings: rawEventSettings, 
    requests, 
    playedRequests,
    autocompleteSongs, 
    addRequest, 
    voteRequest,
    eventOwnerUid
  } = useFirebase();

  const defaults = {
    title: 'Mi Gran Evento VIP',
    djName: 'DJ MasterMix',
    logoUrl: '',
    themeColor: '#7c3aed',
    themeColorSecondary: '#06b6d4',
    archived: false,
    webName: 'DJ a la Carta',
    eventType: 'Otro',
    tipsEnabled: false,
    paypalUsername: '',
    mercadopagoLink: '',
    promoEnabled: false,
    promoWhatsapp: '',
    promoWebsite: '',
    promoInstagram: '',
    promoTiktok: ''
  };

  const eventSettings = rawEventSettings ? { ...defaults, ...rawEventSettings } : defaults;

  const sessionId = getSessionId();

  // Estados del Formulario
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [isCustomGenre, setIsCustomGenre] = useState(false);
  const [dedication, setDedication] = useState('');

  // Buscador Global
  const [searchQuery, setSearchQuery] = useState('');
  const [showGlobalSuggestions, setShowGlobalSuggestions] = useState(false);
  const [globalFilteredSongs, setGlobalFilteredSongs] = useState([]);

  // Estados de confirmación de duplicados
  const [showConfirmDuplicateModal, setShowConfirmDuplicateModal] = useState(false);
  const [pendingDuplicateRequest, setPendingDuplicateRequest] = useState(null);

  // Géneros aprendidos dinámicamente del historial de peticiones y autocompletado
  const dynamicGenres = React.useMemo(() => {
    const customGenresString = eventSettings?.customGenres || '';
    const BASE_GENRES = customGenresString.trim() !== ''
      ? customGenresString.split(',').map(g => g.trim()).filter(Boolean)
      : [
          'Reggaetón / Urbano',
          'Regional Mexicano (Banda/Norteño)',
          'Cumbia / Sonidero',
          'Pop Latino / Baladas',
          'Rock en Español',
          'Salsa / Bachata',
          'Electrónica / Circuit',
          'Ska / Reggae',
          'Kpop'
        ];

    // Contar frecuencia de cada género en peticiones reales
    const frequencyMap = {};

    // Aprender de las canciones del autocompletado (historial global)
    (autocompleteSongs || []).forEach(song => {
      if (song && song.genre && song.genre.trim() && song.genre !== 'Personalizado') {
        const g = song.genre.trim();
        frequencyMap[g] = (frequencyMap[g] || 0) + 1;
      }
    });

    // Aprender de las peticiones del evento actual (peso mayor = más reciente)
    Object.values(requests || {}).forEach(req => {
      if (req && req.genre && req.genre.trim() && req.genre !== 'Personalizado') {
        const g = req.genre.trim();
        frequencyMap[g] = (frequencyMap[g] || 0) + 3; // más peso porque es petición real
      }
    });

    // Combinar géneros base con aprendidos, ordenar por frecuencia (aprendidos primero si frecuentes)
    const learnedGenres = Object.entries(frequencyMap)
      .filter(([g]) => !BASE_GENRES.includes(g)) // solo los nuevos que no están en base
      .sort((a, b) => b[1] - a[1])
      .map(([g]) => g);

    // Los de la base también se ordenan por frecuencia de uso real
    const baseOrdered = [...BASE_GENRES].sort((a, b) => {
      return (frequencyMap[b] || 0) - (frequencyMap[a] || 0);
    });

    // Fusionar: base ordenada + aprendidos nuevos (sin duplicados)
    const merged = [...new Set([...baseOrdered, ...learnedGenres])];
    return merged;
  }, [autocompleteSongs, requests]);

  // Estados de Interfaz y Filtros
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  const popupTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
    };
  }, []);

  const autocompleteRef = useRef(null);
  const globalSearchRef = useRef(null);

  // PRESET_GENRES reemplazado por dynamicGenres (definido arriba con useMemo)

  // Control del cooldown (Anti-Spam)
  useEffect(() => {
    const lastRequestTime = localStorage.getItem('dj_platform_last_req');
    if (lastRequestTime) {
      const elapsed = Date.now() - parseInt(lastRequestTime, 10);
      if (elapsed < COOLDOWN_TIME_MS) {
        setCooldownTimeLeft(COOLDOWN_TIME_MS - elapsed);
      }
    }

    const timer = setInterval(() => {
      const lastReq = localStorage.getItem('dj_platform_last_req');
      if (lastReq) {
        const elapsed = Date.now() - parseInt(lastReq, 10);
        if (elapsed < COOLDOWN_TIME_MS) {
          setCooldownTimeLeft(COOLDOWN_TIME_MS - elapsed);
        } else {
          setCooldownTimeLeft(0);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Actualizar el título del navegador con el nombre de la plataforma y el evento
  useEffect(() => {
    const webName = eventSettings.webName || 'DJ a la Carta';
    const eventTitle = eventSettings.title ? ` — ${eventSettings.title}` : '';
    document.title = `${webName}${eventTitle}`;
  }, [eventSettings.webName, eventSettings.title]);

  // Filtrar canciones para el autocompletado evolutivo
  useEffect(() => {
    if (!title && !artist) {
      setFilteredSongs([]);
      return;
    }

    const query = (title || artist).toLowerCase();
    const matches = autocompleteSongs.filter(song => 
      song.title.toLowerCase().includes(query) || 
      song.artist.toLowerCase().includes(query)
    );
    
    // Limitar a 5 sugerencias más populares
    setFilteredSongs(matches.slice(0, 5));
  }, [title, artist, autocompleteSongs]);

  // Filtrar canciones para el buscador global rápido
  useEffect(() => {
    if (!searchQuery) {
      setGlobalFilteredSongs([]);
      return;
    }

    const q = searchQuery.toLowerCase();
    const matches = autocompleteSongs.filter(song => 
      (song.title && song.title.toLowerCase().includes(q)) || 
      (song.artist && song.artist.toLowerCase().includes(q)) ||
      (song.genre && song.genre.toLowerCase().includes(q))
    );
    
    setGlobalFilteredSongs(matches.slice(0, 8));
  }, [searchQuery, autocompleteSongs]);

  // Cerrar sugerencias al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (globalSearchRef.current && !globalSearchRef.current.contains(event.target)) {
        setShowGlobalSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (song) => {
    setTitle(song.title);
    setArtist(song.artist);
    
    if (song.genre && dynamicGenres.includes(song.genre)) {
      // El género ya está en la lista dinámica aprendida → seleccionarlo directamente
      setGenre(song.genre);
      setIsCustomGenre(false);
    } else if (song.genre && song.genre !== 'Personalizado') {
      // Género nuevo no visto aún → marcarlo como personalizado para que el usuario confirme
      setGenre('Personalizado');
      setCustomGenre(song.genre);
      setIsCustomGenre(true);
    } else {
      setGenre('');
      setIsCustomGenre(false);
    }
    
    setShowSuggestions(false);
  };

  const handleSelectGlobalSuggestion = (song) => {
    setTitle(song.title || '');
    setArtist(song.artist || '');
    
    if (song.genre && dynamicGenres.includes(song.genre)) {
      setGenre(song.genre);
      setIsCustomGenre(false);
      setCustomGenre('');
    } else if (song.genre && song.genre !== 'Personalizado') {
      setGenre('Personalizado');
      setCustomGenre(song.genre);
      setIsCustomGenre(true);
    } else {
      setGenre('');
      setIsCustomGenre(false);
      setCustomGenre('');
    }
    
    setSearchQuery('');
    setShowGlobalSuggestions(false);
  };

  const handleGenreChange = (e) => {
    const val = e.target.value;
    setGenre(val);
    if (val === 'Personalizado') {
      setIsCustomGenre(true);
    } else {
      setIsCustomGenre(false);
      setCustomGenre('');
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePaypalClick = () => {
    const userOrEmail = eventSettings.paypalUsername.trim();
    if (!userOrEmail) return;
    
    let url = '';
    if (userOrEmail.includes('@')) {
      url = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(userOrEmail)}&item_name=Propina%20al%20DJ&currency_code=USD`;
    } else {
      url = `https://paypal.me/${userOrEmail}`;
    }
    window.open(url, '_blank');
  };

  const handleMercadoPagoClick = () => {
    const input = eventSettings.mercadopagoLink.trim();
    if (!input) return;

    if (input.startsWith('http') || input.includes('mercadopago.com') || input.includes('mpago.la')) {
      window.open(input, '_blank');
    } else {
      navigator.clipboard.writeText(input)
        .then(() => {
          showToast(`📋 Alias/CVU copiado: ${input}`);
        })
        .catch((err) => {
          console.error('Error al copiar:', err);
          showToast('❌ No se pudo copiar automáticamente.');
        });
    }
  };

  const handleCopyClabeClick = () => {
    const clabe = eventSettings.bankClabe ? eventSettings.bankClabe.trim() : '';
    if (!clabe) return;
    navigator.clipboard.writeText(clabe)
      .then(() => {
        showToast(`📋 CLABE copiada: ${clabe}`);
      })
      .catch((err) => {
        console.error('Error al copiar CLABE:', err);
        showToast('❌ No se pudo copiar automáticamente.');
      });
  };

  const executeSubmit = async (cleanTitle, cleanArtist, finalGenre, cleanDedication, isRepeat = false) => {
    try {
      const result = await addRequest(
        cleanTitle || 'Tema no especificado',
        cleanArtist || 'Artista no especificado',
        finalGenre || 'Personalizado',
        cleanDedication,
        sessionId,
        eventOwnerUid,
        isRepeat
      );

      // Guardar marca de tiempo para el cooldown
      localStorage.setItem('dj_platform_last_req', Date.now().toString());
      setCooldownTimeLeft(COOLDOWN_TIME_MS);

      // Limpiar formulario
      setTitle('');
      setArtist('');
      setGenre('');
      setCustomGenre('');
      setIsCustomGenre(false);
      setDedication('');

      if (result && result.isDuplicateMerge) {
        showToast('❤️ ¡Esta canción ya estaba en la lista! Hemos sumado tu voto.');
      }
      setShowInfoPopup(true);
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
      popupTimerRef.current = setTimeout(() => {
        setShowInfoPopup(false);
        popupTimerRef.current = null;
      }, 8000);
    } catch (err) {
      console.error(err);
      showToast('Error al enviar la petición. Inténtalo de nuevo.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanTitle = title.trim();
    const cleanArtist = artist.trim();
    const finalGenre = isCustomGenre ? customGenre.trim() : genre;
    const cleanDedication = dedication.trim();

    // Al menos un campo debe estar lleno para proceder
    if (!cleanTitle && !cleanArtist && !finalGenre) {
      showToast('Por favor, ingresa al menos un dato (canción, artista o género) para tu petición.');
      return;
    }

    if (cooldownTimeLeft > 0) {
      showToast(`¡Anti-Spam activo! Espera ${Math.ceil(cooldownTimeLeft / 1000)}s.`);
      return;
    }

    const normalizeString = (str) => {
      if (!str) return '';
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/gi, "") // Quitar puntuación y símbolos
        .toLowerCase()
        .trim();
    };

    // Verificar si ya existe en playedRequests (historial de reproducidas)
    const existsInPlayed = Object.values(playedRequests || {}).some(
      req => {
        if (!req || !req.title) return false;
        
        const reqTitleNormalized = normalizeString(req.title);
        const userTitleNormalized = normalizeString(cleanTitle);
        
        const matchTitle = reqTitleNormalized === userTitleNormalized;
        if (!matchTitle) return false;
        
        const reqArtistNormalized = normalizeString(req.artist);
        const userArtistNormalized = normalizeString(cleanArtist);
        
        const isReqArtistEmpty = reqArtistNormalized === '' || reqArtistNormalized === 'artista no especificado';
        const isUserArtistEmpty = userArtistNormalized === '' || userArtistNormalized === 'artista no especificado';
        
        // Si el usuario no especificó artista, o si el tema registrado no tiene artista,
        // o si los artistas coinciden exactamente, se considera duplicado.
        return isUserArtistEmpty || isReqArtistEmpty || (reqArtistNormalized === userArtistNormalized);
      }
    );

    if (existsInPlayed) {
      setPendingDuplicateRequest({
        title: cleanTitle,
        artist: cleanArtist,
        genre: finalGenre,
        dedication: cleanDedication
      });
      setShowConfirmDuplicateModal(true);
      return;
    }

    await executeSubmit(cleanTitle, cleanArtist, finalGenre, cleanDedication);
  };

  // Convertir peticiones en array y ordenar por popularidad (votos) o fecha
  const requestList = Object.keys(requests || {})
    .filter(key => requests[key] !== null && typeof requests[key] === 'object')
    .map(key => ({
      id: key,
      ...requests[key],
      hasVoted: requests[key].voters ? !!requests[key].voters[sessionId] : false
    })).sort((a, b) => {
    // Si hay una en reproducción, va primero
    if (a.status === 'playing' && b.status !== 'playing') return -1;
    if (b.status === 'playing' && a.status !== 'playing') return 1;
    
    // Luego ordenar por votos descendente
    if (b.votes !== a.votes) return b.votes - a.votes;
    
    // Finalmente por timestamp descendente (más recientes primero)
    return b.timestamp - a.timestamp;
  });

  // Convertir peticiones ya reproducidas en array y ordenar por fecha de reproducción descendente
  const playedList = Object.keys(playedRequests || {})
    .filter(key => playedRequests[key] !== null && typeof playedRequests[key] === 'object')
    .map(key => ({
      id: key,
      ...playedRequests[key]
    })).sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0));

  const formatTimeLeft = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.ceil((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Toast Alert */}
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
          <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem' }}>{toastMessage}</p>
        </div>
      )}

      {/* HEADER DEL EVENTO (BRANDING DINÁMICO) */}
      <header className="glass-panel" style={{
        margin: '20px auto',
        maxWidth: '500px',
        padding: '20px',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '12px'
      }}>
        {/* Logo o ícono */}
        {eventSettings.logoUrl ? (
          <img 
            src={eventSettings.logoUrl} 
            alt="Logo Evento" 
            style={{ 
              height: eventSettings.logoSize === 'small' ? '50px' :
                      eventSettings.logoSize === 'large' ? '100px' :
                      eventSettings.logoSize === 'xlarge' ? '130px' : '75px', 
              objectFit: 'contain',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--surface-border)'
            }} 
          />
        ) : (
          <div className="flex-center" style={{
            width: '60px',
            height: '60px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            boxShadow: '0 0 15px var(--primary-glow)'
          }}>
            <Music size={28} color="#fff" />
          </div>
        )}
        
        <div style={{ width: '100%' }}>
          {/* Nombre de la plataforma / web */}
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
            {eventSettings.webName || 'DJ a la Carta'}
          </p>

          <span className="badge badge-playing" style={{ marginBottom: '10px' }}>En Vivo ⚡</span>
          
          {/* Tipo de evento — muy visible para que la audiencia sepa en qué evento está */}
          {eventSettings.eventType && eventSettings.eventType !== 'Otro' && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: 'var(--secondary-color)',
                background: 'rgba(6,182,212,0.1)',
                border: '1px solid rgba(6,182,212,0.25)',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                letterSpacing: '0.02em'
              }}>
                {eventSettings.eventType === 'Mis XV años' && '🌸'}
                {eventSettings.eventType === 'Mi Boda' && '💍'}
                {eventSettings.eventType === 'Cumpleaños' && '🎂'}
                {eventSettings.eventType === 'Graduación' && '🎓'}
                {eventSettings.eventType === 'Fiesta Corporativa' && '🏢'}
                {eventSettings.eventType === 'Aniversario' && '💝'}
                {eventSettings.eventType === 'Bautizo' && '👶'}
                {' '}{eventSettings.eventType}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Evento
            </span>
            <h1 className="glow-text-primary" style={{ fontSize: '1.6rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.3' }}>
              {eventSettings.title}
            </h1>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '16px', 
            flexWrap: 'wrap', 
            fontSize: '0.85rem', 
            color: 'var(--text-secondary)',
            borderTop: '1px solid var(--surface-border)',
            paddingTop: '12px',
            width: '100%'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              🎧 <strong>Dj en cabina:</strong> <span style={{ color: 'var(--secondary-color)', fontWeight: '600' }}>{eventSettings.djName}</span>
            </span>
            {eventSettings.date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                📅 <strong>Fecha:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                  {(() => {
                    const parts = eventSettings.date.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : eventSettings.date;
                  })()}
                </span>
              </span>
            )}
          </div>
        </div>
      </header>


      {/* FORMULARIO DE PETICIÓN (PÚBLICO) */}
      <main style={{ maxWidth: '500px', margin: '0 auto', padding: '0 15px' }}>
        {eventSettings.archived ? (
          <section className="glass-panel animate-slide-in" style={{ 
            padding: '40px 24px', 
            borderRadius: 'var(--radius-lg)', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            background: 'rgba(239, 68, 68, 0.02)'
          }}>
            <ShieldAlert size={48} color="var(--danger-color)" />
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>Evento Finalizado</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Este evento ha concluido y ya no acepta nuevas peticiones de canciones ni votos. ¡Muchas gracias por tu participación!
            </p>
          </section>
        ) : (
          <>
            {/* Tarjeta de Propinas Voluntarias */}
            {eventSettings.tipsEnabled && (eventSettings.paypalUsername || eventSettings.mercadopagoLink || eventSettings.bankClabe) && (
              <div 
                className={`glass-panel animate-slide-in ${cooldownTimeLeft > 0 ? 'tips-card-active' : ''}`}
                style={{ 
                  padding: '20px', 
                  borderRadius: 'var(--radius-lg)', 
                  marginBottom: '20px', 
                  border: cooldownTimeLeft > 0 ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
                  transition: 'all 0.4s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>💸</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {cooldownTimeLeft > 0 ? '⚡ ¡Destaca tu petición apoyando al DJ!' : 'Apoya al DJ (Propina Voluntaria)'}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Si estás disfrutando de la música, puedes apoyar el set enviando una propina por PayPal, Mercado Pago o por transferencia bancaria.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                  {eventSettings.paypalUsername && (
                    <button 
                      type="button" 
                      onClick={handlePaypalClick}
                      className="btn"
                      style={{ 
                        background: '#003087', 
                        color: '#ffffff', 
                        fontSize: '0.85rem', 
                        padding: '10px 16px', 
                        borderRadius: 'var(--radius-md)',
                        flex: '1 1 120px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: 'none',
                        boxShadow: '0 4px 10px rgba(0, 48, 135, 0.2)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span>Pagar con PayPal</span>
                    </button>
                  )}

                  {eventSettings.mercadopagoLink && (
                    <button 
                      type="button" 
                      onClick={handleMercadoPagoClick}
                      className="btn"
                      style={{ 
                        background: '#009EE3', 
                        color: '#ffffff', 
                        fontSize: '0.85rem', 
                        padding: '10px 16px', 
                        borderRadius: 'var(--radius-md)',
                        flex: '1 1 120px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: 'none',
                        boxShadow: '0 4px 10px rgba(0, 158, 227, 0.2)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span>{eventSettings.mercadopagoLink.startsWith('http') || eventSettings.mercadopagoLink.includes('mercadopago.com') || eventSettings.mercadopagoLink.includes('mpago.la') ? 'Pagar con Mercado Pago' : 'Copiar Alias Mercado Pago'}</span>
                    </button>
                  )}

                  {eventSettings.bankClabe && (
                    <button 
                      type="button" 
                      onClick={handleCopyClabeClick}
                      className="btn"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        color: 'var(--text-primary)', 
                        fontSize: '0.85rem', 
                        padding: '10px 16px', 
                        borderRadius: 'var(--radius-md)',
                        flex: '1 1 120px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <span>Copiar CLABE Interbancaria</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <section className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Sparkles size={20} color="var(--primary-color)" />
              <h2 style={{ fontSize: '1.25rem' }}>¿Qué canción quieres escuchar?</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Buscador Rápido Global */}
              <div className="form-group" style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }} ref={globalSearchRef}>
                <label className="form-label" style={{ color: 'var(--secondary-color)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔍 Buscador Rápido (Autocompletar)</span>
                </label>
                <input
                  type="text"
                  placeholder="Busca por canción, artista o género..."
                  className="input-field"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowGlobalSuggestions(true);
                  }}
                  onFocus={() => setShowGlobalSuggestions(true)}
                  style={{ borderColor: 'rgba(6,182,212,0.3)', boxShadow: searchQuery ? '0 0 10px rgba(6,182,212,0.1)' : 'none' }}
                />

                {/* Lista de Sugerencias Globales */}
                {showGlobalSuggestions && globalFilteredSongs.length > 0 && (
                  <div className="glass-panel" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 210,
                    marginTop: '6px',
                    borderRadius: 'var(--radius-md)',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    background: 'rgba(12, 12, 18, 0.98)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(6, 182, 212, 0.3)'
                  }}>
                    {globalFilteredSongs.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handleSelectGlobalSuggestion(song)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          textAlign: 'left'
                        }}
                        className="suggestion-item"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{song.title}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          👤 {song.artist} • <span style={{ color: 'var(--secondary-color)', fontWeight: '600' }}>{song.genre}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input Canción y Autocompletado */}
              <div className="form-group" style={{ position: 'relative' }} ref={autocompleteRef}>
                <label className="form-label">Nombre de la Canción (Opcional)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Ej. Ella Baila Sola"
                    className="input-field"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                </div>

                {/* Menú desplegable de autocompletado */}
                {showSuggestions && filteredSongs.length > 0 && (
                  <div className="glass-panel" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 200,
                    marginTop: '6px',
                    borderRadius: 'var(--radius-md)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    background: 'rgba(12, 12, 18, 0.95)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}>
                    {filteredSongs.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handleSelectSuggestion(song)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                        className="suggestion-item"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{song.title}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{song.artist} • <span style={{ color: 'var(--secondary-color)' }}>{song.genre}</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input Artista */}
              <div className="form-group">
                <label className="form-label">Artista / Grupo (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Peso Pluma"
                  className="input-field"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                />
              </div>

              {/* Selector de Género — autoaprendido del historial de peticiones */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Género Musical (Opcional)
                  {dynamicGenres.length > 8 && (
                    <span style={{
                      fontSize: '0.65rem',
                      background: 'rgba(6,182,212,0.12)',
                      color: 'var(--secondary-color)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '700'
                    }}>✨ {dynamicGenres.length} géneros aprendidos</span>
                  )}
                </label>
                <select 
                  className="input-field" 
                  value={genre} 
                  onChange={handleGenreChange}
                >
                  <option value="">Selecciona un género (opcional)...</option>
                  {dynamicGenres.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                  <option value="Personalizado">✏️ Otro género (escribir)...</option>
                </select>
              </div>

              {/* Input de Género Personalizado */}
              {isCustomGenre && (
                <div className="form-group animate-slide-in">
                  <label className="form-label">Introduce Género Personalizado</label>
                  <input
                    type="text"
                    placeholder="Ej. Techno, Bachata, Metal, etc."
                    className="input-field"
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                  />
                </div>
              )}

              {/* Comentario o Dedicatoria */}
              {eventSettings.dedicationsEnabled && (
                <div className="form-group animate-slide-in">
                  <label className="form-label">Comentario o Dedicatoria (Opcional)</label>
                  <textarea
                    placeholder="Ej. Dedicado para la novia de parte de sus primos de Monterrey"
                    className="input-field"
                    rows={2}
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    maxLength={150}
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textAlign: 'right', marginTop: '4px' }}>
                    {dedication.length}/150 caracteres
                  </span>
                </div>
              )}

              {/* Botón de Enviar con Anti-Spam */}
              <button
                type="submit"
                className={`btn btn-primary ${cooldownTimeLeft > 0 ? 'disabled' : ''}`}
                disabled={cooldownTimeLeft > 0}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  gap: '10px',
                  marginTop: '8px',
                  background: cooldownTimeLeft > 0 ? 'rgba(255, 255, 255, 0.05)' : undefined,
                  color: cooldownTimeLeft > 0 ? 'var(--text-muted)' : undefined,
                  cursor: cooldownTimeLeft > 0 ? 'not-allowed' : 'pointer',
                  boxShadow: cooldownTimeLeft > 0 ? 'none' : undefined,
                  border: cooldownTimeLeft > 0 ? '1px solid rgba(255, 255, 255, 0.05)' : undefined
                }}
              >
                {cooldownTimeLeft > 0 ? (
                  <>
                    <Clock size={18} />
                    <span>Espera {formatTimeLeft(cooldownTimeLeft)}</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Enviar Petición</span>
                  </>
                )}
              </button>
            </form>
          </section>
        </>
      )}

        {/* FEED EN VIVO DE PETICIONES */}
        <section style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={18} color="var(--secondary-color)" />
              Peticiones en vivo ({requestList.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ordenado por votos</span>
          </div>

          {/* Banner de Publicidad y Contacto para Contrataciones */}
          {eventSettings.promoEnabled && (eventSettings.promoWhatsapp || eventSettings.promoWebsite || eventSettings.promoInstagram || eventSettings.promoTiktok) && (
            <div className="glass-panel" style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="flex-center" style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#a855f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={14} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    ¿Te gusta el show? ¡Contrata a {eventSettings.djName || 'tu DJ'}! 🎧
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Contacto directo y redes oficiales
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {eventSettings.promoWhatsapp && (
                  <a 
                    href={`https://wa.me/${eventSettings.promoWhatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(37, 211, 102, 0.15)',
                      border: '1px solid rgba(37, 211, 102, 0.3)',
                      color: '#25d366',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <span>WhatsApp</span>
                  </a>
                )}

                {eventSettings.promoWebsite && (
                  <a 
                    href={eventSettings.promoWebsite.startsWith('http') ? eventSettings.promoWebsite : `https://${eventSettings.promoWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#3b82f6',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    <span>Sitio Web</span>
                  </a>
                )}

                {eventSettings.promoInstagram && (
                  <a 
                    href={eventSettings.promoInstagram.startsWith('http') ? eventSettings.promoInstagram : `https://instagram.com/${eventSettings.promoInstagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(236, 72, 153, 0.15)',
                      border: '1px solid rgba(236, 72, 153, 0.3)',
                      color: '#ec4899',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    <span>Instagram</span>
                  </a>
                )}

                {eventSettings.promoTiktok && (
                  <a 
                    href={eventSettings.promoTiktok.startsWith('http') ? eventSettings.promoTiktok : `https://tiktok.com/@${eventSettings.promoTiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    <Music size={14} />
                    <span>TikTok</span>
                  </a>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requestList.length === 0 ? (
              <div className="glass-panel" style={{
                padding: '30px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-md)'
              }}>
                <p>No hay peticiones aún. ¡Sé el primero en pedir un tema!</p>
              </div>
            ) : (
              requestList.map((req) => (
                <div
                  key={req.id}
                  className="glass-panel animate-slide-in"
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    borderLeft: req.status === 'playing' ? '4px solid var(--secondary-color)' : 
                               req.status === 'accepted' ? '4px solid var(--success-color)' : undefined,
                    background: req.status === 'playing' ? 'rgba(6, 182, 212, 0.06)' : undefined
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '1rem' }}>
                        {req.title}
                      </span>
                      {req.status === 'pending' && <span className="badge badge-pending">En espera</span>}
                      {req.status === 'accepted' && <span className="badge badge-accepted">Aceptada</span>}
                      {req.status === 'playing' && <span className="badge badge-playing animate-pulse-glow">En Reproducción 🎵</span>}
                      {req.status === 'rejected' && <span className="badge badge-rejected">Rechazada</span>}
                    </div>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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
                      <p style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--text-muted)', 
                        marginTop: '6px',
                        fontStyle: 'italic',
                        background: 'rgba(255, 255, 255, 0.02)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        borderLeft: '2px solid var(--primary-color)',
                        textAlign: 'left'
                      }}>
                        💬 "{req.dedication}"
                      </p>
                    )}
                  </div>

                  {/* Votos */}
                  <button
                    onClick={() => {
                      if (eventSettings.archived) {
                        showToast('El evento ha finalizado y ya no se puede votar.');
                        return;
                      }
                      voteRequest(req.id, sessionId, req.hasVoted, eventOwnerUid);
                    }}
                    disabled={eventSettings.archived}
                    style={{
                      background: req.hasVoted ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                      border: req.hasVoted ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: eventSettings.archived ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      color: req.hasVoted ? 'var(--danger-color)' : 'var(--text-secondary)',
                      opacity: eventSettings.archived ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!eventSettings.archived) e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      if (!eventSettings.archived) e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Heart size={16} fill={req.hasVoted ? 'var(--danger-color)' : 'none'} color={req.hasVoted ? 'var(--danger-color)' : 'currentColor'} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{req.votes}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* HISTORIAL DE CANCIONES YA REPRODUCIDAS */}
        {playedList.length > 0 && (
          <section style={{ marginTop: '40px', opacity: 0.75 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <span>✅ Ya reproducidas ({playedList.length})</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Historial del evento</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {playedList.map((req) => (
                <div
                  key={req.id}
                  className="glass-panel"
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.03)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontWeight: '600', 
                        color: 'var(--text-muted)', 
                        textDecoration: 'line-through',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap', 
                        fontSize: '0.95rem' 
                      }}>
                        {req.title}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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
                  {req.playedAt && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(req.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal de Confirmación de Duplicado */}
      {showConfirmDuplicateModal && pendingDuplicateRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1100,
          background: 'rgba(5, 5, 10, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel animate-slide-in" style={{
            maxWidth: '400px',
            width: '100%',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--primary-color)',
            boxShadow: '0 0 25px var(--primary-glow)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div className="flex-center" style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(124, 58, 237, 0.15)',
              margin: '0 auto',
              color: 'var(--primary-color)'
            }}>
              <Volume2 size={24} />
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                ⚠️ Canción ya reproducida
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                La canción <strong style={{ color: 'var(--secondary-color)' }}>"{pendingDuplicateRequest.title}"</strong> de <strong style={{ color: 'var(--text-primary)' }}>{pendingDuplicateRequest.artist || 'Artista no especificado'}</strong> ya fue reproducida en este evento. ¿Aún deseas volver a realizar la petición?
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  setShowConfirmDuplicateModal(false);
                  if (pendingDuplicateRequest) {
                    await executeSubmit(
                      pendingDuplicateRequest.title,
                      pendingDuplicateRequest.artist,
                      pendingDuplicateRequest.genre,
                      pendingDuplicateRequest.dedication,
                      true
                    );
                    setPendingDuplicateRequest(null);
                  }
                }}
                style={{ flex: 1, padding: '12px' }}
              >
                Sí, pedir otra vez
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowConfirmDuplicateModal(false);
                  setPendingDuplicateRequest(null);
                }}
                style={{ 
                  flex: 1, 
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)'
                }}
              >
                No, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ventana emergente informativa de 8 segundos */}
      {showInfoPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel animate-slide-in" style={{
            maxWidth: '420px',
            width: '100%',
            padding: '32px 24px 24px 24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--primary-color)',
            boxShadow: '0 0 30px var(--primary-glow)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <style>{`
              @keyframes shrinkBar {
                from { width: 100%; }
                to { width: 0%; }
              }
            `}</style>
            
            {/* Animación del progress bar de 8 segundos en la parte superior */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '4px',
              background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))',
              animation: 'shrinkBar 8s linear forwards'
            }} />

            <div className="flex-center" style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(139, 92, 246, 0.15)',
              margin: '0 auto',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={28} />
            </div>

            <div>
              <h3 style={{ 
                fontSize: '1.3rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                marginBottom: '12px' 
              }}>
                ¡Petición Enviada!
              </h3>
              <p style={{ 
                fontSize: '0.95rem', 
                color: 'var(--text-secondary)', 
                lineHeight: '1.6',
                textAlign: 'left',
                margin: 0
              }}>
                Tu petición se reproducirá basándose en dos cosas:
              </p>
              <ul style={{
                textAlign: 'left',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                margin: '12px 0 0 0',
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <li style={{ listStyleType: 'disc' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>El contexto:</strong> si es para bailar o solo escuchar.
                </li>
                <li style={{ listStyleType: 'disc' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>La popularidad:</strong> la cantidad de votos recibidos.
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowInfoPopup(false);
                if (popupTimerRef.current) {
                  clearTimeout(popupTimerRef.current);
                  popupTimerRef.current = null;
                }
              }}
              style={{ 
                width: '100%', 
                padding: '12px',
                fontWeight: '600'
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
