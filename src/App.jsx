import React from 'react';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import PublicView from './views/PublicView';
import LoginView from './views/LoginView';
import DjDashboard from './views/DjDashboard';
import AdminSubscriptions from './views/AdminSubscriptions';
import PlanSelection from './views/PlanSelection';
import PaymentView from './views/PaymentView';

import { database, ref, onValue } from './firebase';
import { CURRENT_APP_VERSION } from './utils/AppVersionConfig';

// ─── Detección de plataforma ──────────────────────────────────────────────────
function detectPlatform() {
  // Electron (macOS / Windows) — DEBE ir ANTES de window.AndroidApp porque
  // preload.cjs expone un polyfill AndroidApp dentro de Electron.
  if (window.electronAPI) {
    const ua = navigator.userAgent || '';
    if (/Windows/i.test(ua)) return 'windows';
    if (/Mac/i.test(ua)) {
      // Apple Silicon tiene «arm64» o «Apple M» en el UA del proceso
      return /arm64|Apple M/i.test(ua) ? 'macos-silicon' : 'macos-intel';
    }
  }
  // Android APK nativa (solo cuando NO hay electronAPI)
  if (window.AndroidApp) return 'android';
  // iOS WebView nativa (Capacitor / WKWebView)
  if (
    window.webkit?.messageHandlers ||
    /iPhone|iPad|iPod/i.test(navigator.userAgent)
  ) return 'ios';
  // Navegador web puro — no se muestra modal
  return 'web';
}
// ─────────────────────────────────────────────────────────────────────────────

function AppContent() {
  const { user, userProfile, authLoading, changeEvent, isAdminMaster } = useFirebase();
  const [bypassPaymentLock, setBypassPaymentLock] = React.useState(() => {
    return sessionStorage.getItem('bypass_payment_lock') === 'true';
  });
  const [updateInfo, setUpdateInfo] = React.useState(null);
  const [showUpdateModal, setShowUpdateModal] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  // Ref permanente para bloquear doble-tap / doble ejecución de la descarga
  const downloadGuardRef = React.useRef(false);

  // Comprobar actualizaciones UNA SOLA VEZ al iniciar (get, no onValue)
  // Usamos onValue pero con un flag para ignorar actualizaciones posteriores
  React.useEffect(() => {
    let alreadyChecked = false;
    const updatesRef = ref(database, 'config/updates');
    const unsubscribe = onValue(updatesRef, async (snapshot) => {
      // Solo procesar la PRIMERA entrega del listener; ignorar disparos posteriores
      if (alreadyChecked) return;
      alreadyChecked = true;
      // Desuscribirse inmediatamente para que cambios futuros en el nodo no
      // vuelvan a mostrar el modal a usuarios que ya lo descartaron.
      unsubscribe();

      try {
        let data = snapshot.val();
        if (!data) {
          const baseUrl = import.meta.env.VITE_PUBLIC_URL 
            ? import.meta.env.VITE_PUBLIC_URL.replace(/\/$/, '') 
            : 'https://dj-vip.vercel.app';
          const response = await fetch(`${baseUrl}/version.json?t=${Date.now()}`);
          if (!response.ok) return;
          data = await response.json();
        }
        
        if (data && data.latestVersion) {
          
          const isNewer = (latest, current) => {
            const lParts = latest.split('.').map(Number);
            const cParts = current.split('.').map(Number);
            for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
              const l = lParts[i] || 0;
              const c = cParts[i] || 0;
              if (l > c) return true;
              if (l < c) return false;
            }
            return false;
          };

          // Si el usuario ya descartó este modal en esta sesión, no volver a mostrarlo
          const dismissedKey = `update_dismissed_${data.latestVersion}`;
          if (sessionStorage.getItem(dismissedKey)) return;

          // En navegador web puro no hay descarga disponible → no mostrar
          const platform = detectPlatform();
          if (platform === 'web') return;

          if (isNewer(data.latestVersion, CURRENT_APP_VERSION)) {
            setUpdateInfo(data);
            setShowUpdateModal(true);
          }
        }
      } catch (err) {
        console.warn('[Update Check] Error comprobando actualizaciones:', err);
      }
    });
    // Limpiar solo si el listener aún está activo (en caso de desmontaje antes del primer disparo)
    return () => unsubscribe();
  }, []);

  // Escuchar evento personalizado para alternar el bypass del bloqueo de pago
  React.useEffect(() => {
    const handleBypass = () => {
      setBypassPaymentLock(sessionStorage.getItem('bypass_payment_lock') === 'true');
    };
    window.addEventListener('bypass_payment_lock', handleBypass);
    return () => window.removeEventListener('bypass_payment_lock', handleBypass);
  }, []);

  // Enrutar basado en parámetros de búsqueda de la URL (?event=nombre-evento)
  const queryParams = new URLSearchParams(window.location.search);
  const eventParam = queryParams.get('event');

  // Si hay un parámetro de evento en la URL, cargar ese evento y mostrar la vista del público
  React.useEffect(() => {
    if (eventParam) {
      changeEvent(eventParam);
    }
  }, [eventParam, changeEvent]);

  if (authLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
        <div className="glass-panel loading-card" style={{
          padding: '40px 30px',
          borderRadius: '24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          maxWidth: '320px',
          width: '100%'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: 'rgba(124, 58, 237, 0.8)',
            borderRadius: '50%'
          }} className="animate-spin" />
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>Cargando plataforma interactiva...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Vistas Principales */}
      {(() => {
        if (eventParam) {
          return <PublicView />;
        }
        if (window.location.pathname === '/subscriptions' && user && isAdminMaster) {
          return <AdminSubscriptions />;
        }
        if (user) {
          if (isAdminMaster) {
            return <DjDashboard />;
          }

          const status = userProfile?.subscriptionStatus || 'pending_plan';
          const isBypassed = bypassPaymentLock || sessionStorage.getItem('bypass_payment_lock') === 'true';
          
          if (!isBypassed) {
            if (status === 'pending_plan') {
              return <PlanSelection />;
            }
            if (status === 'pending_payment' || status === 'pending_validation') {
              return <PaymentView />;
            }
          }

          return <DjDashboard />;
        }
        return <LoginView />;
      })()}

      {/* Modal de Actualización In-App */}
      {showUpdateModal && updateInfo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px',
          overflow: 'hidden',
          backgroundColor: 'rgba(8, 6, 14, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}>
          <style>{`
            .update-modal-card {
              position: relative;
              max-width: 600px;
              width: 100%;
              padding: 40px 32px 30px;
              border-radius: 24px;
              border: 2px solid rgba(168, 85, 247, 0.45);
              box-shadow: 0 0 30px rgba(168, 85, 247, 0.3), 0 20px 50px rgba(0, 0, 0, 0.85);
              text-align: center;
              background: #110c1c;
              animation: modalScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
              max-height: 90vh;
              display: flex;
              flex-direction: column;
            }
            @keyframes modalScaleIn {
              from { transform: scale(0.9); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .update-modal-rocket-wrapper {
              position: absolute;
              top: -42px;
              left: 50%;
              transform: translateX(-50%);
              width: 84px;
              height: 84px;
              border-radius: 50%;
              background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
              box-shadow: 0 0 25px rgba(139, 92, 246, 0.6);
              border: 5px solid #110c1c;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 100000;
            }
            .update-modal-title {
              font-size: 2rem;
              font-weight: 800;
              color: #ffffff;
              margin-top: 15px;
              margin-bottom: 4px;
              letter-spacing: -0.5px;
              font-family: 'Outfit', 'Inter', sans-serif;
            }
            .update-modal-version {
              font-size: 0.95rem;
              font-weight: 600;
              color: rgba(255, 255, 255, 0.4);
              margin-bottom: 20px;
              letter-spacing: 0.5px;
            }
            .update-modal-heading {
              font-size: 1.25rem;
              font-weight: 700;
              color: #ffffff;
              margin-bottom: 16px;
              font-family: 'Outfit', 'Inter', sans-serif;
            }
            .update-modal-list-container {
              overflow-y: auto;
              flex: 1;
              text-align: left;
              background: rgba(255, 255, 255, 0.02);
              padding: 20px 24px;
              border-radius: 16px;
              margin-bottom: 28px;
              border: 1px solid rgba(255, 255, 255, 0.05);
            }
            .update-modal-list {
              list-style-type: none;
              padding: 0;
              margin: 0;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .update-modal-list-item {
              color: rgba(255, 255, 255, 0.85);
              font-size: 0.95rem;
              line-height: 1.5;
              display: flex;
              align-items: flex-start;
              gap: 10px;
            }
            .update-modal-bullet {
              display: inline-block;
              width: 6px;
              height: 6px;
              background-color: #a855f7;
              border-radius: 50%;
              flex-shrink: 0;
              margin-top: 8px;
            }
            .update-modal-actions {
              display: flex;
              gap: 16px;
              justify-content: center;
              margin-top: auto;
            }
            .update-modal-btn-later {
              background: rgba(255, 255, 255, 0.06);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 30px;
              color: rgba(255, 255, 255, 0.7);
              padding: 14px 28px;
              font-weight: 600;
              font-size: 1rem;
              cursor: pointer;
              transition: all 0.2s ease;
              flex: 1;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              outline: none;
            }
            .update-modal-btn-later:hover {
              background: rgba(255, 255, 255, 0.12);
              color: #fff;
              border-color: rgba(255, 255, 255, 0.2);
            }
            .update-modal-btn-now {
              background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
              box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
              border: none;
              border-radius: 30px;
              color: #fff;
              padding: 14px 28px;
              font-weight: 700;
              font-size: 1rem;
              cursor: pointer;
              transition: all 0.2s ease;
              flex: 1.5;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              outline: none;
            }
            .update-modal-btn-now:hover {
              box-shadow: 0 0 25px rgba(168, 85, 247, 0.7);
              transform: translateY(-1px);
            }

            /* Responsive landscape layout rules (80% width / 70% height) */
            @media (max-height: 500px) or (orientation: landscape) {
              .update-modal-card {
                width: 80% !important;
                max-width: 80vw !important;
                height: 70% !important;
                max-height: 70vh !important;
                padding: 16px 24px 12px !important;
                border-radius: 18px !important;
              }
              .update-modal-rocket-wrapper {
                width: 48px !important;
                height: 48px !important;
                top: -24px !important;
                border-width: 3px !important;
              }
              .update-modal-rocket-wrapper span {
                font-size: 1.5rem !important;
              }
              .update-modal-title {
                font-size: 1.2rem !important;
                margin-top: 5px !important;
                margin-bottom: 2px !important;
              }
              .update-modal-version {
                font-size: 0.8rem !important;
                margin-bottom: 8px !important;
              }
              .update-modal-heading {
                font-size: 0.95rem !important;
                margin-bottom: 10px !important;
              }
              .update-modal-list-container {
                padding: 10px 16px !important;
                margin-bottom: 12px !important;
                max-height: 110px !important;
              }
              .update-modal-list {
                gap: 8px !important;
              }
              .update-modal-list-item {
                font-size: 0.8rem !important;
                gap: 8px !important;
                line-height: 1.4 !important;
              }
              .update-modal-bullet {
                margin-top: 6px !important;
              }
              .update-modal-actions {
                gap: 12px !important;
              }
              .update-modal-btn-later, .update-modal-btn-now {
                padding: 8px 18px !important;
                font-size: 0.85rem !important;
                border-radius: 20px !important;
              }
            }
          `}</style>
          
          <div className="update-modal-card">
            {/* Rocket Icon Wrapper */}
            <div className="update-modal-rocket-wrapper">
              <span style={{ fontSize: '2.5rem', lineHeight: '1' }}>🚀</span>
            </div>

            {/* Application Title */}
            <div className="update-modal-title">DJ Panel Pro</div>
            <div className="update-modal-version">v{updateInfo.latestVersion}</div>

            {/* Heading */}
            <div className="update-modal-heading">A New Update is Available!</div>

            {/* Release Notes */}
            {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && (
              <div className="update-modal-list-container">
                <ul className="update-modal-list">
                  {updateInfo.releaseNotes.map((note, idx) => (
                    <li key={idx} className="update-modal-list-item">
                      <span className="update-modal-bullet"></span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons — por plataforma */}
            {(() => {
              const platform = detectPlatform();

              // Helper para disparar la descarga con guard anti doble-tap
              const handleDownload = (e, url, useElectron = false) => {
                e.preventDefault();
                e.stopPropagation();
                // Guard JS: bloquea doble-tap antes de llegar al nativo
                if (downloadGuardRef.current) return;
                downloadGuardRef.current = true;
                setIsDownloading(true);
                if (useElectron && window.electronAPI?.openExternalUrl) {
                  window.electronAPI.openExternalUrl(url);
                } else if (window.AndroidApp?.downloadApk) {
                  // Bridge nativo Android con guard AtomicBoolean — sin window.open duplicado
                  window.AndroidApp.downloadApk(url);
                } else {
                  // iOS / web fallback
                  window.open(url, '_system');
                }
                if (updateInfo?.latestVersion) {
                  sessionStorage.setItem(`update_dismissed_${updateInfo.latestVersion}`, '1');
                }
                setShowUpdateModal(false);
              };

              const dismissBtn = (
                <button
                  onClick={() => {
                    if (updateInfo?.latestVersion) {
                      sessionStorage.setItem(`update_dismissed_${updateInfo.latestVersion}`, '1');
                    }
                    setShowUpdateModal(false);
                  }}
                  className="update-modal-btn-later"
                >
                  Ahora no
                </button>
              );

              // ── ANDROID ──────────────────────────────────────────────────
              if (platform === 'android') return (
                <div className="update-modal-actions" style={{ flexDirection: 'column', gap: '10px' }}>
                  <button
                    disabled={isDownloading}
                    onClick={(e) => handleDownload(e, updateInfo.apkUrl)}
                    className="update-modal-btn-now"
                    style={{
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      boxShadow: '0 0 18px rgba(22,163,74,0.45)',
                      opacity: isDownloading ? 0.6 : 1,
                      cursor: isDownloading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isDownloading ? 'Descargando...' : '📥 Descargar APK'}
                  </button>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Archivo .apk para Android</span>
                  {dismissBtn}
                </div>
              );

              // ── macOS Silicon (arm64) ─────────────────────────────────────
              if (platform === 'macos-silicon') return (
                <div className="update-modal-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                  <button
                    disabled={isDownloading}
                    onClick={(e) => handleDownload(e, updateInfo.dmgUrl || 'https://github.com/xsoly1-boop/DJ_VIP/releases/latest', true)}
                    className="update-modal-btn-now"
                    style={{ opacity: isDownloading ? 0.6 : 1, cursor: isDownloading ? 'not-allowed' : 'pointer' }}
                  >
                    {isDownloading ? 'Abriendo...' : '🍎 Apple Silicon (arm64)'}
                  </button>
                  <button
                    disabled={isDownloading}
                    onClick={(e) => handleDownload(e, updateInfo.dmgUrlIntel || 'https://github.com/xsoly1-boop/DJ_VIP/releases/latest', true)}
                    className="update-modal-btn-later"
                    style={{ fontSize: '0.82rem' }}
                  >
                    💻 Intel (x64)
                  </button>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Archivo .dmg · macOS 10.14+</span>
                  <div style={{
                    fontSize: '0.68rem',
                    color: '#facc15',
                    background: 'rgba(250,204,21,0.08)',
                    border: '1px solid rgba(250,204,21,0.25)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    marginTop: '4px',
                    textAlign: 'left',
                    lineHeight: '1.4'
                  }}>
                    ⚠️ <strong>Si macOS dice que la app está dañada al abrirla:</strong><br />
                    Abre la Terminal y ejecuta:<br />
                    <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px', display: 'block', marginTop: '4px', wordBreak: 'break-all', fontFamily: 'monospace' }}>xattr -cr /Applications/DJ\ Panel\ Pro.app</code>
                  </div>
                  {dismissBtn}
                </div>
              );

              // ── macOS Intel (x64) ─────────────────────────────────────────
              if (platform === 'macos-intel') return (
                <div className="update-modal-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                  <button
                    disabled={isDownloading}
                    onClick={(e) => handleDownload(e, updateInfo.dmgUrlIntel || updateInfo.dmgUrl || 'https://github.com/xsoly1-boop/DJ_VIP/releases/latest', true)}
                    className="update-modal-btn-now"
                    style={{ opacity: isDownloading ? 0.6 : 1, cursor: isDownloading ? 'not-allowed' : 'pointer' }}
                  >
                    {isDownloading ? 'Abriendo...' : '💻 Descargar para Intel (x64)'}
                  </button>
                  <button
                    disabled={isDownloading}
                    onClick={(e) => handleDownload(e, updateInfo.dmgUrl || 'https://github.com/xsoly1-boop/DJ_VIP/releases/latest', true)}
                    className="update-modal-btn-later"
                    style={{ fontSize: '0.82rem' }}
                  >
                    🍎 Apple Silicon (arm64)
                  </button>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Archivo .dmg · macOS 10.14+</span>
                  <div style={{
                    fontSize: '0.68rem',
                    color: '#facc15',
                    background: 'rgba(250,204,21,0.08)',
                    border: '1px solid rgba(250,204,21,0.25)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    marginTop: '4px',
                    textAlign: 'left',
                    lineHeight: '1.4'
                  }}>
                    ⚠️ <strong>Si macOS dice que la app está dañada al abrirla:</strong><br />
                    Abre la Terminal y ejecuta:<br />
                    <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px', display: 'block', marginTop: '4px', wordBreak: 'break-all', fontFamily: 'monospace' }}>xattr -cr /Applications/DJ\ Panel\ Pro.app</code>
                  </div>
                  {dismissBtn}
                </div>
              );

              // ── iOS ───────────────────────────────────────────────────────
              if (platform === 'ios') return (
                <div className="update-modal-actions" style={{ flexDirection: 'column', gap: '10px' }}>
                  <button
                    disabled={isDownloading}
                    onClick={(e) => handleDownload(e, updateInfo.ipaUrl || 'https://dj-vip.vercel.app/DJ-Panel-Pro.ipa')}
                    className="update-modal-btn-now"
                    style={{
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                      boxShadow: '0 0 18px rgba(14,165,233,0.4)',
                      opacity: isDownloading ? 0.6 : 1,
                      cursor: isDownloading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isDownloading ? 'Descargando...' : '📲 Descargar IPA'}
                  </button>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Requiere iOS 13+</span>
                  {dismissBtn}
                </div>
              );

              // ── Windows ───────────────────────────────────────────────────
              if (platform === 'windows') return (
                <div className="update-modal-actions" style={{ flexDirection: 'column', gap: '10px' }}>
                  <button
                    disabled={isDownloading}
                    onClick={(e) => handleDownload(e, updateInfo.exeUrl || 'https://dj-vip.vercel.app/DJ-Panel-Pro-Setup.exe', true)}
                    className="update-modal-btn-now"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      boxShadow: '0 0 18px rgba(59,130,246,0.4)',
                      opacity: isDownloading ? 0.6 : 1,
                      cursor: isDownloading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isDownloading ? 'Descargando...' : '🪟 Descargar instalador .exe'}
                  </button>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Windows 10 / 11 · 64-bit</span>
                  {dismissBtn}
                </div>
              );

              // Fallback (no debería llegar aquí si platform === 'web' se filtra arriba)
              return null;
            })()}
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
