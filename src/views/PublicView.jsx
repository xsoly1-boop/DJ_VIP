import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from '../context/SupabaseContext';
import { Music, Heart, Sparkles, Send, Clock, Volume2, ShieldAlert, CheckCircle, Mic, MicOff, Loader2 } from 'lucide-react';

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

const checkCoherence = (text) => {
  if (!text) return true;
  const clean = text.toLowerCase().trim();
  if (clean.length < 3) return true; // Muy corto para juzgar coherencia
  
  // 1. Repetición de un mismo caracter 4 o más veces (ej: aaaa, zzzz)
  if (/(.)\1{3,}/.test(clean)) return false;
  
  // 2. Patrones comunes de mashing de teclado
  const mashingPatterns = [
    'asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl', 
    'qwer', 'wert', 'erty', 'rtyu', 'tyui', 'yuio', 'uiop', 
    'zxcv', 'xcvb', 'cvbn', 'vbnm',
    'asdfgh', 'qwerty', 'zxcvbn'
  ];
  for (const pattern of mashingPatterns) {
    if (clean.includes(pattern)) return false;
  }
  
  // 3. Evaluar palabras individuales sin vocales
  const words = clean.replace(/[^a-zñ\s]/g, '').split(/\s+/).filter(w => w.length >= 4);
  for (const word of words) {
    const vowels = word.match(/[aeiouáéíóúü]/g);
    if (!vowels) return false;
    if (vowels.length / word.length < 0.15) return false;
  }
  
  return true;
};

const getLevenshteinDistance = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const getStringSimilarity = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1.0;
  const dist = getLevenshteinDistance(str1, str2);
  return 1.0 - dist / maxLen;
};

const highlightMatch = (text, query) => {
  if (!query || !text) return <span>{text}</span>;
  const cleanQuery = query.toLowerCase();
  const parts = text.split(new RegExp(`(${cleanQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === cleanQuery ? (
          <strong key={i} style={{ color: 'var(--primary-color)', fontWeight: '700' }}>{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export default function PublicView() {
  const { 
    eventSettings: rawEventSettings, 
    requests, 
    playedRequests,
    autocompleteSongs, 
    addRequest, 
    voteRequest,
    submitRating,
    eventOwnerUid,
    ownerProfile,
    searchAutocompleteSongs
  } = useFirebase();

  const defaults = {
    title: 'Mi Gran Evento VIP',
    djName: 'No registrado',
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

  // Determinar logo a mostrar en la pantalla de peticiones según el plan del DJ dueño
  const djActivePlan = ownerProfile?.activePlan || 'free';
  const isPremiumDj = djActivePlan === 'premium';
  const isProOrVipDj = ['pro', 'vip', 'pro_1d'].includes(djActivePlan) || eventOwnerUid === 'uid-admin-master';

  let logoToDisplay = '';
  if (isPremiumDj) {
    // Premium maneja su branding (Logotipo URL) de forma global desde el perfil
    logoToDisplay = ownerProfile?.logoUrl || '';
  } else if (isProOrVipDj) {
    // PRO y VIP manejan su branding individual y personalizado por cada evento activo
    logoToDisplay = eventSettings.logoUrl || '';
  } else {
    // Cualquier otro plan: si el evento tiene logo guardado, también se muestra
    logoToDisplay = eventSettings.logoUrl || '';
  }

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
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalMessage, setLimitModalMessage] = useState('');
  const [pendingDuplicateRequest, setPendingDuplicateRequest] = useState(null);

  // Estados para modales de validación avanzada de canción vacía y coherencia
  const [showEmptySongModal, setShowEmptySongModal] = useState(false);
  const [showIncoherentTextModal, setShowIncoherentTextModal] = useState(false);
  const [pendingValidationRequest, setPendingValidationRequest] = useState(null);

  // Estados de validación de ortografía y sugerencias
  const [showSpellingModal, setShowSpellingModal] = useState(false);
  const [spellingVerifyMatch, setSpellingVerifyMatch] = useState(null);
  
  // Soporte de navegación por teclado y caché de búsquedas recientes
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [inlineSpellingSuggestion, setInlineSpellingSuggestion] = useState(null);

  // ── AI Mic Recognition ────────────────────────────────────────────────
  const [showMicModal, setShowMicModal] = useState(false);
  const [micState, setMicState] = useState('idle'); // idle | recording | processing | done | error
  const [micResult, setMicResult] = useState(null);
  const [micError, setMicError] = useState('');
  const [micCountdown, setMicCountdown] = useState(10);
  const [micVolume, setMicVolume] = useState(0);
  const micRecorderRef = useRef(null);
  const micStreamRef = useRef(null);
  const micChunksRef = useRef([]);
  const micCountdownRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micAudioCtxRef = useRef(null);
  const micAnimFrameRef = useRef(null);

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

  // Cargar búsquedas recientes del cache local al montar
  useEffect(() => {
    try {
      const cached = localStorage.getItem('dj_platform_recent_searches');
      if (cached) {
        setRecentSearches(JSON.parse(cached));
      }
    } catch (e) {
      console.error("Fallo al cargar búsquedas recientes:", e);
    }
  }, []);

  // Resetear el índice enfocado al cambiar el texto de búsqueda o los resultados
  useEffect(() => {
    setFocusedSuggestionIndex(-1);
  }, [title, artist, filteredSongs]);

  // Calcular sugerencia de ortografía en tiempo real para atajo rápido
  useEffect(() => {
    if (!title.trim() || filteredSongs.length === 0) {
      setInlineSpellingSuggestion(null);
      return;
    }

    const normalize = (str) => {
      if (!str) return '';
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase()
        .trim();
    };

    const userTitleNorm = normalize(title);
    const firstSong = filteredSongs[0];
    if (firstSong && firstSong.title) {
      const songTitleNorm = normalize(firstSong.title);
      const titleSim = getStringSimilarity(songTitleNorm, userTitleNorm);
      
      if (titleSim >= 0.70 && titleSim < 0.90) {
        setInlineSpellingSuggestion(firstSong);
        return;
      }
    }
    setInlineSpellingSuggestion(null);
  }, [title, filteredSongs]);

  // Actualizar el título del navegador con el nombre de la plataforma y el evento
  useEffect(() => {
    const webName = eventSettings.webName || 'DJ a la Carta';
    const eventTitle = eventSettings.title ? ` — ${eventSettings.title}` : '';
    document.title = `${webName}${eventTitle}`;
  }, [eventSettings.webName, eventSettings.title]);

  // Buscar sugerencias para el autocompletado evolutivo en la BD (con debounce)
  useEffect(() => {
    const query = (title || artist || '').trim();
    if (!query || query.length < 2) {
      setFilteredSongs([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        if (searchAutocompleteSongs) {
          const matches = await searchAutocompleteSongs(query);
          setFilteredSongs(matches.slice(0, 5));
        }
      } catch (e) {
        console.error("Error al buscar autocompletado:", e);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [title, artist, searchAutocompleteSongs]);

  // Buscar canciones para el buscador global rápido en la BD (con debounce)
  useEffect(() => {
    const q = (searchQuery || '').trim();
    if (!q || q.length < 2) {
      setGlobalFilteredSongs([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        if (searchAutocompleteSongs) {
          const matches = await searchAutocompleteSongs(q);
          setGlobalFilteredSongs(matches.slice(0, 8));
        }
      } catch (e) {
        console.error("Error al buscar autocompletado global:", e);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchAutocompleteSongs]);

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
  const handleTitleKeyDown = (e) => {
    if (!showSuggestions || filteredSongs.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => (prev + 1) % filteredSongs.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => (prev - 1 + filteredSongs.length) % filteredSongs.length);
    } else if (e.key === 'Enter') {
      if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < filteredSongs.length) {
        e.preventDefault();
        handleSelectSuggestion(filteredSongs[focusedSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setFocusedSuggestionIndex(-1);
    }
  };

  const addRecentSearch = (title, artist, genre) => {
    if (!title) return;
    try {
      const cached = localStorage.getItem('dj_platform_recent_searches');
      let searches = cached ? JSON.parse(cached) : [];
      
      // Quitar duplicados previos
      searches = searches.filter(s => !(s.title.toLowerCase() === title.toLowerCase() && (s.artist || '').toLowerCase() === (artist || '').toLowerCase()));
      
      // Añadir al inicio
      searches.unshift({ title, artist, genre, id: 'recent-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5) });
      
      // Limitar a 10
      searches = searches.slice(0, 10);
      
      localStorage.setItem('dj_platform_recent_searches', JSON.stringify(searches));
      setRecentSearches(searches);
    } catch (e) {
      console.error("Fallo al guardar búsqueda reciente:", e);
    }
  };

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
    const currency = eventSettings.tipCurrency || 'MXN';
    if (userOrEmail.includes('@')) {
      url = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(userOrEmail)}&item_name=Propina%20al%20DJ&currency_code=${currency}`;
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

      if (result && result.alreadyVoted) {
        showToast('⚠️ Ya has pedido o votado por esta canción en este evento.');
        return;
      }

      // Guardar marca de tiempo para el cooldown
      localStorage.setItem('dj_platform_last_req', Date.now().toString());
      setCooldownTimeLeft(COOLDOWN_TIME_MS);

      // Guardar en caché local de búsquedas recientes
      if (cleanTitle) {
        addRecentSearch(cleanTitle, cleanArtist, finalGenre);
      }

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
      if (err.message && (err.message.includes('límite') || err.message.includes('limite') || err.message.includes('plan activado'))) {
        setLimitModalMessage(err.message);
        setShowLimitModal(true);
      } else {
        showToast(err.message || 'Error al enviar la petición. Inténtalo de nuevo.');
      }
    }
  };

  const checkDuplicateAndSubmit = async (cleanTitle, cleanArtist, finalGenre, cleanDedication) => {
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
        
        // Usar Levenshtein de 90% para considerar duplicado en historial de reproducidas
        const similarity = getStringSimilarity(reqTitleNormalized, userTitleNormalized);
        const matchTitle = similarity >= 0.9;
        if (!matchTitle) return false;
        
        const reqArtistNormalized = normalizeString(req.artist);
        const userArtistNormalized = normalizeString(cleanArtist);
        
        const isReqArtistEmpty = reqArtistNormalized === '' || reqArtistNormalized === 'artista no especificado';
        const isUserArtistEmpty = userArtistNormalized === '' || userArtistNormalized === 'artista no especificado';
        
        // Coincidencia de artista por similitud de 85%
        const matchArtist = isUserArtistEmpty || isReqArtistEmpty || 
                            (reqArtistNormalized === userArtistNormalized) ||
                            (getStringSimilarity(reqArtistNormalized, userArtistNormalized) >= 0.85);
        return matchArtist;
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

  const handleAcceptCorrection = async () => {
    if (!spellingVerifyMatch) return;
    const match = spellingVerifyMatch;
    setShowSpellingModal(false);
    setSpellingVerifyMatch(null);
    await checkDuplicateAndSubmit(match.title, match.artist, match.genre, match.dedication);
  };

  const handleDeclineCorrection = async () => {
    if (!spellingVerifyMatch) return;
    const match = spellingVerifyMatch;
    setShowSpellingModal(false);
    setSpellingVerifyMatch(null);
    await checkDuplicateAndSubmit(match.originalTitle, match.originalArtist, match.genre, match.dedication);
  };

  const checkSpellingAndSubmit = async (cleanTitle, cleanArtist, finalGenre, cleanDedication) => {
    if (!cleanTitle) {
      await checkDuplicateAndSubmit(cleanTitle, cleanArtist, finalGenre, cleanDedication);
      return;
    }

    const normalize = (str) => {
      if (!str) return '';
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase()
        .trim();
    };

    const userTitleNorm = normalize(cleanTitle);
    const userArtistNorm = normalize(cleanArtist);

    // Obtener los primeros 3 caracteres del título para buscar prefijos similares
    const titlePrefix = userTitleNorm.substring(0, 3);
    
    let candidateSongs = [];
    try {
      if (searchAutocompleteSongs) {
        candidateSongs = await searchAutocompleteSongs(titlePrefix);
      }
    } catch (e) {
      console.warn("Fallo al buscar sugerencias de ortografía en la BD:", e);
    }

    // Si falló o no devolvió resultados, usar lista en memoria como fallback
    if (!candidateSongs || candidateSongs.length === 0) {
      candidateSongs = autocompleteSongs || [];
    }

    let bestMatch = null;
    let maxSimilarity = 0;

    candidateSongs.forEach(song => {
      if (!song || !song.title) return;
      const songTitleNorm = normalize(song.title);
      const songArtistNorm = normalize(song.artist);

      const titleSim = getStringSimilarity(songTitleNorm, userTitleNorm);
      
      let artistSim = 1.0;
      if (cleanArtist && songArtistNorm) {
        artistSim = getStringSimilarity(songArtistNorm, userArtistNorm);
      }

      // 70% peso al título, 30% al artista si se especificó
      const overallSim = cleanArtist ? (titleSim * 0.7 + artistSim * 0.3) : titleSim;

      if (overallSim > maxSimilarity) {
        maxSimilarity = overallSim;
        bestMatch = song;
      }
    });

    // 1. Similitud >= 90%: Autocompletar / corregir automáticamente
    if (bestMatch && maxSimilarity >= 0.90) {
      console.log(`Auto-corrigiendo: "${cleanTitle}" -> "${bestMatch.title}"`);
      showToast(`📝 Autocorregido a: ${bestMatch.title} - ${bestMatch.artist}`);
      await checkDuplicateAndSubmit(bestMatch.title, bestMatch.artist, finalGenre, cleanDedication);
      return;
    }

    // 2. Similitud entre 75% y 89%: Preguntar al usuario si está bien escrito o si se parece a la sugerencia
    if (bestMatch && maxSimilarity >= 0.75) {
      setSpellingVerifyMatch({
        title: bestMatch.title,
        artist: bestMatch.artist,
        originalTitle: cleanTitle,
        originalArtist: cleanArtist,
        genre: finalGenre,
        dedication: cleanDedication
      });
      setShowSpellingModal(true);
      return;
    }

    // 3. Menor a 75% de similitud: Proceder directamente con la versión del usuario
    await checkDuplicateAndSubmit(cleanTitle, cleanArtist, finalGenre, cleanDedication);
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

    // Pipeline de validaciones:
    // 1. Canción vacía por elección
    if (!cleanTitle && cleanArtist) {
      setPendingValidationRequest({
        title: 'Cualquiera', // El DJ elegirá la canción
        artist: cleanArtist,
        genre: finalGenre,
        dedication: cleanDedication
      });
      setShowEmptySongModal(true);
      return;
    }

    // 2. Validación de coherencia
    const isTitleCoherent = !cleanTitle || checkCoherence(cleanTitle);
    const isArtistCoherent = !cleanArtist || checkCoherence(cleanArtist);
    if (!isTitleCoherent || !isArtistCoherent) {
      setPendingValidationRequest({
        title: cleanTitle || 'Tema no especificado',
        artist: cleanArtist || 'Artista no especificado',
        genre: finalGenre,
        dedication: cleanDedication
      });
      setShowIncoherentTextModal(true);
      return;
    }

    // 3. Comprobar ortografía, duplicado y enviar
    await checkSpellingAndSubmit(cleanTitle, cleanArtist, finalGenre, cleanDedication);
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
      <div style={{ maxWidth: '500px', margin: '20px auto 0', padding: '0 15px', boxSizing: 'border-box', width: '100%' }}>
      <header className="glass-panel" style={{
        padding: '20px',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '12px'
      }}>
        {/* Logo o ícono */}
        {logoToDisplay ? (
          <img 
            src={logoToDisplay} 
            alt="Logo Evento" 
            style={{ 
              height: eventSettings.logoSize === 'small' ? '80px' :
                      eventSettings.logoSize === 'medium' ? '100px' :
                      eventSettings.logoSize === 'large' ? '130px' : '100px', 
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
            boxShadow: '0 0 15px var(--primary-glow)',
            overflow: 'hidden'
          }}>
            <img src="./logo_vinyl.png" alt="DJ a la Carta Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        
        <div style={{ width: '100%' }}>
          {/* Nombre de la plataforma / web */}
          <p style={{ 
            fontSize: eventSettings.webNameFontSize ? `${eventSettings.webNameFontSize}px` : '0.7rem', 
            color: 'var(--text-muted)', 
            fontWeight: '600', 
            letterSpacing: '0.08em', 
            textTransform: 'uppercase', 
            marginBottom: '6px' 
          }}>
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
      </div>


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
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
                    style={{ borderColor: 'rgba(6,182,212,0.3)', boxShadow: searchQuery ? '0 0 10px rgba(6,182,212,0.1)' : 'none', paddingRight: '48px' }}
                  />
                  {/* Botón de micrófono IA */}
                  <button
                    id="btn-mic-identify"
                    type="button"
                    title="Identificar canción con IA 🎙️"
                    onClick={() => { setShowMicModal(true); setMicState('idle'); setMicResult(null); setMicError(''); setMicCountdown(10); }}
                    style={{
                      position: 'absolute', right: '10px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(6,182,212,0.8)', padding: '4px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'color 0.2s, transform 0.2s',
                      borderRadius: '50%',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#06b6d4'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(6,182,212,0.8)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Mic size={18} />
                  </button>
                </div>

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
                    onKeyDown={handleTitleKeyDown}
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
                    {filteredSongs.map((song, index) => {
                      const isFocused = index === focusedSuggestionIndex;
                      return (
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
                            gap: '2px',
                            background: isFocused ? 'rgba(255, 255, 255, 0.12)' : 'transparent'
                          }}
                          className={`suggestion-item ${isFocused ? 'focused' : ''}`}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = isFocused ? 'rgba(255, 255, 255, 0.12)' : 'transparent'}
                        >
                          <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {highlightMatch(song.title, title)}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {highlightMatch(song.artist, artist)} • <span style={{ color: 'var(--secondary-color)' }}>{song.genre}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Menú desplegable de búsquedas recientes si el input está vacío */}
                {showSuggestions && !title && !artist && recentSearches.length > 0 && (
                  <div className="glass-panel" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 200,
                    marginTop: '6px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(12, 12, 18, 0.95)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '8px 0',
                    maxHeight: '220px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ padding: '6px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Peticiones Recientes
                    </div>
                    {recentSearches.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSuggestion(s)}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        className="recent-item"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{s.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.artist}</div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', background: 'rgba(124, 58, 237, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>{s.genre}</span>
                      </div>
                    ))}
                  </div>
                )}

                {inlineSpellingSuggestion && (
                  <div 
                    onClick={() => handleSelectSuggestion(inlineSpellingSuggestion)}
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      marginTop: '8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed rgba(255, 255, 255, 0.15)',
                      transition: 'all 0.2s',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                  >
                    <span>💡 ¿Quisiste decir: <strong>{inlineSpellingSuggestion.title}</strong> de <em>{inlineSpellingSuggestion.artist}</em>? <span style={{ color: 'var(--primary-light)', textDecoration: 'underline', marginLeft: '4px' }}>Corregir</span></span>
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
                    placeholder="Para priorizar tu dedicatoria, incluye tu nombre o mesa y a quién va dirigida."
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

              {/* ⭐ CALIFICACIÓN DEL SERVICIO */}
              {(() => {
                const [ratingStars, setRatingStars] = React.useState(0);
                const [ratingHover, setRatingHover] = React.useState(0);
                const [ratingComment, setRatingComment] = React.useState('');
                const [ratingSubmitted, setRatingSubmitted] = React.useState(false);
                const [ratingLoading, setRatingLoading] = React.useState(false);

                const handleRatingSubmit = async (stars) => {
                  if (!stars || ratingLoading || ratingSubmitted) return;
                  setRatingLoading(true);
                  try {
                    await submitRating({
                      ownerUid: eventOwnerUid,
                      eventId: eventSettings.currentEventId || 'default-event',
                      stars,
                      comment: ratingComment
                    });
                    setRatingSubmitted(true);
                  } catch (e) {
                    console.error('Error al calificar:', e);
                  }
                  setRatingLoading(false);
                };

                return (
                  <div style={{
                    marginTop: '16px',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    {ratingSubmitted ? (
                      <div style={{ textAlign: 'center', padding: '6px 0' }}>
                        <p style={{ fontSize: '1.3rem' }}>⭐</p>
                        <p style={{ fontWeight: '700', color: 'var(--success-color)', fontSize: '0.9rem' }}>¡Gracias por tu calificación!</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Tu opinión ayuda a mejorar el servicio.</p>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: '600', textAlign: 'center' }}>
                          ⭐ ¿Cómo calificarías el servicio del DJ?
                        </p>
                        {/* Estrellas */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
                          {[1,2,3,4,5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => { setRatingStars(star); handleRatingSubmit(star); }}
                              onMouseEnter={() => setRatingHover(star)}
                              onMouseLeave={() => setRatingHover(0)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.8rem',
                                lineHeight: 1,
                                padding: '2px',
                                transition: 'transform 0.15s ease',
                                transform: (ratingHover >= star || ratingStars >= star) ? 'scale(1.2)' : 'scale(1)',
                                filter: (ratingHover >= star || ratingStars >= star) ? 'brightness(1)' : 'grayscale(1) opacity(0.4)',
                              }}
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                        {ratingStars > 0 && (
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '-4px' }}>
                            {['', 'Muy malo', 'Regular', 'Bueno', 'Muy bueno', '¡Excelente!'][ratingStars]}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
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
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {eventSettings.promoWhatsapp && (
                  <a 
                    href={`https://wa.me/${eventSettings.promoWhatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(37, 211, 102, 0.15)',
                      border: '1px solid rgba(37, 211, 102, 0.3)',
                      color: '#25d366',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
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
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#3b82f6',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
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
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(236, 72, 153, 0.15)',
                      border: '1px solid rgba(236, 72, 153, 0.3)',
                      color: '#ec4899',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
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
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    <Music size={12} />
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

      {/* Modal de Límite de Peticiones */}
      {showLimitModal && (
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
            border: '1px solid var(--danger-color)',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div className="flex-center" style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(239, 68, 68, 0.15)',
              margin: '0 auto',
              color: 'var(--danger-color)'
            }}>
              <ShieldAlert size={24} />
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Límite de Peticiones
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {limitModalMessage || 'Has alcanzado el límite del plan activado'}
              </p>
            </div>

            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowLimitModal(false)}
                style={{ width: '100%', padding: '12px', background: 'var(--danger-color)', border: 'none' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Verificación de Ortografía */}
      {showSpellingModal && spellingVerifyMatch && (
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
            maxWidth: '420px',
            width: '100%',
            padding: '28px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--primary-color)',
            boxShadow: '0 0 25px var(--primary-glow)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--primary-light)', margin: 0, fontWeight: 700 }}>
              ¿Quisiste decir esta canción?
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              Encontramos una canción muy similar en la base de datos:
            </p>

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              margin: '8px 0',
              textAlign: 'left'
            }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.1rem' }}>
                {spellingVerifyMatch.title}
              </div>
              <div style={{ color: 'var(--primary-light)', fontSize: '0.9rem', marginTop: '4px' }}>
                de {spellingVerifyMatch.artist}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={handleAcceptCorrection}
                style={{ width: '100%', padding: '12px', background: 'var(--primary-color)', border: 'none', fontWeight: 600 }}
              >
                Sí, esa es (Corregir y enviar)
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={handleDeclineCorrection}
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 500 }}
              >
                No, está bien como la escribí
              </button>
              
              <button
                onClick={() => {
                  setShowSpellingModal(false);
                  setSpellingVerifyMatch(null);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer', marginTop: '4px' }}
              >
                Cancelar y editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Advertencia de Canción Vacía */}
      {showEmptySongModal && pendingValidationRequest && (
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
              <Music size={24} />
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                ¿Enviar sin especificar canción?
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Has dejado el campo de canción vacío. Solo se tomará en cuenta el artista/grupo <strong style={{ color: 'var(--primary-color)' }}>"{pendingValidationRequest.artist}"</strong>. Cualquier canción de ellos será elegida por el DJ. ¿Deseas continuar?
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  setShowEmptySongModal(false);
                  
                  // Proceder a la siguiente validación (Coherencia del artista)
                  const isArtistCoherent = checkCoherence(pendingValidationRequest.artist);
                  if (!isArtistCoherent) {
                    setShowIncoherentTextModal(true);
                  } else {
                    const { title, artist, genre, dedication } = pendingValidationRequest;
                    await checkDuplicateAndSubmit(title, artist, genre, dedication);
                    setPendingValidationRequest(null);
                  }
                }}
                style={{ flex: 1, padding: '12px' }}
              >
                Sí, enviar
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowEmptySongModal(false);
                  setPendingValidationRequest(null);
                }}
                style={{ 
                  flex: 1, 
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)'
                }}
              >
                No, corregir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Advertencia de Texto Incoherente */}
      {showIncoherentTextModal && pendingValidationRequest && (
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
            border: '1px solid var(--danger-color)',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div className="flex-center" style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(239, 68, 68, 0.15)',
              margin: '0 auto',
              color: 'var(--danger-color)'
            }}>
              <ShieldAlert size={24} />
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                ¿Está bien escrito?
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                El texto ingresado en tu petición parece tener un error tipográfico o no tiene coherencia:<br />
                {pendingValidationRequest.title !== 'Cualquiera' && (
                  <>Canción: <strong style={{ color: 'var(--text-primary)' }}>"{pendingValidationRequest.title}"</strong><br /></>
                )}
                Artista: <strong style={{ color: 'var(--text-primary)' }}>"{pendingValidationRequest.artist}"</strong><br /><br />
                ¿Deseas enviar la petición de todas formas?
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  setShowIncoherentTextModal(false);
                  const { title, artist, genre, dedication } = pendingValidationRequest;
                  await checkDuplicateAndSubmit(title, artist, genre, dedication);
                  setPendingValidationRequest(null);
                }}
                style={{ flex: 1, padding: '12px', background: 'var(--primary-color)', border: 'none' }}
              >
                Sí, enviar
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowIncoherentTextModal(false);
                  setPendingValidationRequest(null);
                }}
                style={{ 
                  flex: 1, 
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)'
                }}
              >
                No, corregir
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
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 🎙️ MODAL DE RECONOCIMIENTO DE CANCIÓN POR IA                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showMicModal && (
        <MicModal
          state={micState}
          result={micResult}
          error={micError}
          countdown={micCountdown}
          volume={micVolume}
          onStart={() => startMicRecording()}
          onStop={() => stopMicRecording()}
          onUse={(song) => {
            setTitle(song.title || '');
            setArtist(song.artist || '');
            setSearchQuery(song.title ? `${song.title} - ${song.artist}` : '');
            setShowMicModal(false);
            setMicState('idle');
            showToast(`✅ "${song.title}" añadido al formulario`, 'success');
          }}
          onClose={() => {
            stopMicRecording();
            setShowMicModal(false);
            setMicState('idle');
          }}
        />
      )}
    </div>
  );

  // ── Helpers de grabación ──────────────────────────────────────────────────
  function startMicRecording() {
    setMicState('recording');
    setMicResult(null);
    setMicError('');
    setMicCountdown(10);
    micChunksRef.current = [];

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      micStreamRef.current = stream;

      // Analizador de volumen en tiempo real
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      micAudioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      micAnalyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);

      const buf = new Uint8Array(analyser.frequencyBinCount);
      const trackVolume = () => {
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        setMicVolume(Math.min(100, Math.round(avg * 2.5)));
        micAnimFrameRef.current = requestAnimationFrame(trackVolume);
      };
      trackVolume();

      let recOptions = {};
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          recOptions = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          recOptions = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          recOptions = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          recOptions = { mimeType: 'audio/aac' };
        }
      }

      const recorder = new MediaRecorder(stream, recOptions);
      micRecorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) micChunksRef.current.push(e.data); };
      recorder.onstop = () => sendMicAudioToAPI();
      recorder.start();

      // Cuenta regresiva de 10s
      let secs = 10;
      micCountdownRef.current = setInterval(() => {
        secs -= 1;
        setMicCountdown(secs);
        if (secs <= 0) stopMicRecording();
      }, 1000);
    }).catch(err => {
      setMicError('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
      setMicState('error');
    });
  }

  function stopMicRecording() {
    clearInterval(micCountdownRef.current);
    cancelAnimationFrame(micAnimFrameRef.current);
    setMicVolume(0);
    if (micRecorderRef.current && micRecorderRef.current.state !== 'inactive') {
      micRecorderRef.current.stop();
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (micAudioCtxRef.current) {
      micAudioCtxRef.current.close();
    }
    setMicState('processing');
  }

  async function sendMicAudioToAPI() {
    try {
      const mime = micRecorderRef.current?.mimeType || 'audio/webm';
      const blob = new Blob(micChunksRef.current, { type: mime });
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const backendUrl = import.meta.env.VITE_PUBLIC_URL || '';
      const res = await fetch(`${backendUrl}/api/identify-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64 }),
      });
      
      let data = {};
      const text = await res.text();
      if (text && text.trim()) {
        try { data = JSON.parse(text); } catch (e) { /* ignore */ }
      }

      if (res.ok && data.success && data.result) {
        setMicResult({ ...data.result, demo: data.demo });
        setMicState('done');
      } else {
        setMicError(data.error || `No se pudo identificar la canción (${res.status}). Intenta de nuevo.`);
        setMicState('error');
      }
    } catch (err) {
      setMicError('Error de conexión con el servidor. Intenta de nuevo.');
      setMicState('error');
    }
  }

}

// ══════════════════════════════════════════════════════════════════════════════
// 🎙️ MicModal — Modal de reconocimiento premium
// ══════════════════════════════════════════════════════════════════════════════
function MicModal({ state, result, error, countdown, volume, onStart, onStop, onUse, onClose }) {
  const bars = 20;
  return (
    <>
      <style>{`
        @keyframes micPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.18); opacity: 0.75; }
        }
        @keyframes micRing {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes micFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes micSpin {
          to { transform: rotate(360deg); }
        }
        .mic-bar { transition: height 0.08s ease; }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9001,
        width: 'min(92vw, 400px)',
        background: 'linear-gradient(145deg, rgba(14,14,24,0.98), rgba(20,20,36,0.98))',
        border: '1px solid rgba(6,182,212,0.3)',
        borderRadius: '20px',
        padding: '32px 28px 28px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(6,182,212,0.12)',
        animation: 'micFadeIn 0.3s ease',
        textAlign: 'center',
      }}>
        {/* Cerrar */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '14px', right: '16px',
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          fontSize: '20px', cursor: 'pointer', lineHeight: 1,
        }}>✕</button>

        {/* Título */}
        <p style={{ margin: '0 0 6px', fontSize: '0.72rem', letterSpacing: '2px', color: 'rgba(6,182,212,0.7)', textTransform: 'uppercase', fontWeight: '700' }}>
          Identificar Canción
        </p>
        <h3 style={{ margin: '0 0 28px', fontSize: '1.3rem', fontWeight: '800', color: '#fff' }}>
          🎙️ Reconocimiento por IA
        </h3>

        {/* Icono central animado */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          {state === 'recording' && (
            <>
              <div style={{ position:'absolute', width:'80px', height:'80px', borderRadius:'50%', border:'2px solid rgba(6,182,212,0.6)', animation:'micRing 1.2s ease-out infinite' }} />
              <div style={{ position:'absolute', width:'80px', height:'80px', borderRadius:'50%', border:'2px solid rgba(6,182,212,0.3)', animation:'micRing 1.2s ease-out infinite 0.4s' }} />
            </>
          )}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: state === 'recording'
              ? `radial-gradient(circle, rgba(6,182,212,${0.25 + volume / 250}) 0%, rgba(6,182,212,0.15) 70%)`
              : state === 'processing'
                ? 'rgba(124,58,237,0.2)'
                : state === 'done'
                  ? 'rgba(16,185,129,0.2)'
                  : state === 'error'
                    ? 'rgba(239,68,68,0.2)'
                    : 'rgba(6,182,212,0.1)',
            border: `2px solid ${state === 'done' ? '#10b981' : state === 'error' ? '#ef4444' : '#06b6d4'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: state === 'recording' ? 'micPulse 0.8s ease-in-out infinite' : 'none',
            transition: 'background 0.2s',
          }}>
            {state === 'processing'
              ? <Loader2 size={32} color="#7c3aed" style={{ animation: 'micSpin 1s linear infinite' }} />
              : state === 'done'
                ? <span style={{ fontSize: '32px' }}>✅</span>
                : state === 'error'
                  ? <MicOff size={32} color="#ef4444" />
                  : <Mic size={32} color="#06b6d4" />
            }
          </div>
        </div>

        {/* Visualizador de ondas durante grabación */}
        {state === 'recording' && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '3px', height: '48px', marginBottom: '16px' }}>
            {Array.from({ length: bars }).map((_, i) => {
              const heightPct = volume > 5
                ? 15 + Math.abs(Math.sin((i / bars) * Math.PI + Date.now() / 250 + i)) * volume * 0.6
                : 8 + Math.random() * 8;
              return (
                <div
                  key={i}
                  className="mic-bar"
                  style={{
                    width: '4px',
                    height: `${Math.min(48, heightPct)}px`,
                    borderRadius: '2px',
                    background: `rgba(6,182,212,${0.4 + (i % 3) * 0.2})`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Mensajes de estado */}
        <div style={{ minHeight: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          {state === 'idle' && (
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Toca <strong style={{ color: '#06b6d4' }}>Escuchar</strong> y acerca el celular a la música,<br />o tararea la melodía.
            </p>
          )}
          {state === 'recording' && (
            <>
              <p style={{ margin: 0, color: '#06b6d4', fontWeight: '700', fontSize: '0.95rem' }}>
                Escuchando... {countdown}s
              </p>
              <div style={{ width: '160px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(countdown / 10) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #06b6d4, #7c3aed)', borderRadius: '4px', transition: 'width 0.9s linear' }} />
              </div>
            </>
          )}
          {state === 'processing' && (
            <p style={{ margin: 0, color: '#a78bfa', fontWeight: '700', fontSize: '0.95rem' }}>
              Procesando con IA...
            </p>
          )}
          {state === 'done' && result && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '14px 18px', width: '100%' }}>
              <p style={{ margin: '0 0 4px', fontWeight: '800', fontSize: '1.05rem', color: '#fff' }}>🎵 {result.title}</p>
              <p style={{ margin: '0 0 2px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)' }}>👤 {result.artist}</p>
              {result.album && <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>💿 {result.album}</p>}
              {result.demo && <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'rgba(6,182,212,0.6)', letterSpacing: '1px' }}>MODO DEMO</p>}
            </div>
          )}
          {state === 'error' && (
            <p style={{ margin: 0, color: '#f87171', fontSize: '0.88rem', lineHeight: 1.5 }}>{error}</p>
          )}
        </div>

        {/* Botones de acción */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {state === 'idle' && (
            <button
              id="btn-mic-start"
              onClick={onStart}
              style={{
                flex: 1, padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #06b6d4, #7c3aed)',
                color: '#fff', fontWeight: '700', fontSize: '0.95rem',
                boxShadow: '0 4px 20px rgba(6,182,212,0.35)',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              🎙️ Escuchar
            </button>
          )}
          {state === 'recording' && (
            <button
              id="btn-mic-stop"
              onClick={onStop}
              style={{
                flex: 1, padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: 'rgba(239,68,68,0.85)', color: '#fff', fontWeight: '700', fontSize: '0.95rem',
                boxShadow: '0 4px 20px rgba(239,68,68,0.3)',
              }}
            >
              ⏹ Detener
            </button>
          )}
          {state === 'done' && result && (
            <>
              <button
                id="btn-mic-use"
                onClick={() => onUse(result)}
                style={{
                  flex: 1, padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  color: '#fff', fontWeight: '700', fontSize: '0.9rem',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                }}
              >
                ✅ Usar esta canción
              </button>
              <button
                id="btn-mic-retry"
                onClick={() => { onStart(); }}
                style={{
                  padding: '13px 16px', borderRadius: '12px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: '0.88rem',
                }}
              >
                🔄
              </button>
            </>
          )}
          {state === 'error' && (
            <button
              id="btn-mic-retry-error"
              onClick={() => { onStart(); }}
              style={{
                flex: 1, padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #06b6d4, #7c3aed)',
                color: '#fff', fontWeight: '700', fontSize: '0.95rem',
              }}
            >
              🔄 Intentar de nuevo
            </button>
          )}
          {(state === 'processing') && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>Por favor espera...</p>
          )}
        </div>
      </div>
    </>
  );
}
