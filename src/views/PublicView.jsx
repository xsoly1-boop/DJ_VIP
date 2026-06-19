import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { Music, Search, Heart, Sparkles, Send, Clock, Volume2, ShieldAlert } from 'lucide-react';

// Generar o recuperar ID de sesión único para controlar anti-spam y votos
const getSessionId = () => {
  let sessionId = localStorage.getItem('dj_platform_session');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('dj_platform_session', sessionId);
  }
  return sessionId;
};

const COOLDOWN_TIME_MS = 120000; // 2 minutos de cooldown para anti-spam

export default function PublicView() {
  const { 
    eventSettings, 
    requests, 
    autocompleteSongs, 
    addRequest, 
    voteRequest,
    eventOwnerUid
  } = useFirebase();

  const sessionId = getSessionId();

  // Estados del Formulario
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [isCustomGenre, setIsCustomGenre] = useState(false);

  // Géneros aprendidos dinámicamente del historial de peticiones y autocompletado
  const dynamicGenres = React.useMemo(() => {
    const BASE_GENRES = [
      'Reggaetón / Urbano',
      'Regional Mexicano (Banda/Norteño)',
      'Cumbia / Sonidero',
      'Pop Latino / Baladas',
      'Rock en Español',
      'Salsa / Bachata',
      'Electrónica / Circuit',
      'Ska / Reggae'
    ];

    // Contar frecuencia de cada género en peticiones reales
    const frequencyMap = {};

    // Aprender de las canciones del autocompletado (historial global)
    autocompleteSongs.forEach(song => {
      if (song.genre && song.genre.trim() && song.genre !== 'Personalizado') {
        const g = song.genre.trim();
        frequencyMap[g] = (frequencyMap[g] || 0) + 1;
      }
    });

    // Aprender de las peticiones del evento actual (peso mayor = más reciente)
    Object.values(requests).forEach(req => {
      if (req.genre && req.genre.trim() && req.genre !== 'Personalizado') {
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

  const autocompleteRef = useRef(null);

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

  // Cerrar sugerencias al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanTitle = title.trim();
    const cleanArtist = artist.trim();
    const finalGenre = isCustomGenre ? customGenre.trim() : genre;

    // Al menos un campo debe estar lleno para proceder
    if (!cleanTitle && !cleanArtist && !finalGenre) {
      showToast('Por favor, ingresa al menos un dato (canción, artista o género) para tu petición.');
      return;
    }

    if (cooldownTimeLeft > 0) {
      showToast(`¡Anti-Spam activo! Espera ${Math.ceil(cooldownTimeLeft / 1000)}s.`);
      return;
    }

    try {
      await addRequest(
        cleanTitle || 'Tema no especificado',
        cleanArtist || 'Artista no especificado',
        finalGenre || 'Personalizado',
        sessionId,
        eventOwnerUid
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

      showToast('🎵 ¡Petición enviada al DJ con éxito!');
    } catch (err) {
      console.error(err);
      showToast('Error al enviar la petición. Inténtalo de nuevo.');
    }
  };

  // Convertir peticiones en array y ordenar por popularidad (votos) o fecha
  const requestList = Object.keys(requests).map(key => ({
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
        {eventSettings.logoUrl ? (
          <img 
            src={eventSettings.logoUrl} 
            alt="Logo Evento" 
            style={{ 
              height: '70px', 
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
        
        <div>
          <span className="badge badge-playing" style={{ marginBottom: '6px' }}>En Vivo ⚡</span>
          <h1 className="glow-text-primary" style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>
            {eventSettings.title}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            DJ en cabina: <strong style={{ color: 'var(--secondary-color)' }}>{eventSettings.djName}</strong>
          </p>
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
          <section className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Sparkles size={20} color="var(--primary-color)" />
              <h2 style={{ fontSize: '1.25rem' }}>¿Qué canción quieres escuchar?</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
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
                      {req.status === 'playing' && <span className="badge badge-playing animate-pulse-glow">Sonando ahora 🎵</span>}
                      {req.status === 'rejected' && <span className="badge badge-rejected">Declinada</span>}
                    </div>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.artist} • <span style={{ color: 'var(--secondary-color)' }}>{req.genre}</span>
                    </p>
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
      </main>
    </div>
  );
}
