import React from 'react';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import PublicView from './views/PublicView';
import LoginView from './views/LoginView';
import DjDashboard from './views/DjDashboard';
import AdminSubscriptions from './views/AdminSubscriptions';
import PlanSelection from './views/PlanSelection';
import PaymentView from './views/PaymentView';

function AppContent() {
  const { user, userProfile, authLoading, changeEvent, isAdminMaster } = useFirebase();
  const [bypassPaymentLock, setBypassPaymentLock] = React.useState(() => {
    return sessionStorage.getItem('bypass_payment_lock') === 'true';
  });
  const [updateInfo, setUpdateInfo] = React.useState(null);
  const [showUpdateModal, setShowUpdateModal] = React.useState(false);

  // Comprobar actualizaciones al iniciar
  React.useEffect(() => {
    const checkUpdates = async () => {
      try {
        const baseUrl = import.meta.env.VITE_PUBLIC_URL 
          ? import.meta.env.VITE_PUBLIC_URL.replace(/\/$/, '') 
          : 'https://dj-vip.vercel.app';
        const response = await fetch(`${baseUrl}/version.json?t=${Date.now()}`);
        if (!response.ok) return;
        const data = await response.json();
        
        const { CURRENT_APP_VERSION } = await import('./utils/AppVersionConfig');
        
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

        if (isNewer(data.latestVersion, CURRENT_APP_VERSION)) {
          setUpdateInfo(data);
          setShowUpdateModal(true);
        }
      } catch (err) {
        console.warn('[Update Check] Error comprobando actualizaciones:', err);
      }
    };

    checkUpdates();
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
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '15px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: 'var(--primary-color)',
          borderRadius: '50%'
        }} className="animate-spin" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cargando plataforma interactiva...</p>
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
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <style>{`
            .update-modal-card {
              position: relative;
              max-width: 600px;
              width: 100%;
              padding: 40px 32px 30px;
              border-radius: 24px;
              border: 2px solid rgba(168, 85, 247, 0.4);
              box-shadow: 0 0 30px rgba(168, 85, 247, 0.25), 0 20px 50px rgba(0, 0, 0, 0.75);
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
              justifyContent: center;
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
              color: #a855f7;
              font-size: 1.2rem;
              line-height: 1;
              flex-shrink: 0;
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
                      <span className="update-modal-bullet">🟣</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>

                {/* Nota de soporte/resolución de problemas al pie de las notas de versión */}
                <div style={{
                  fontSize: '0.8rem',
                  color: 'rgba(239, 68, 68, 0.9)',
                  lineHeight: '1.45',
                  marginTop: '18px',
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1.05rem', lineHeight: '1' }}>💡</span>
                  <span>
                    <strong>Nota:</strong> Si la instalación automática falla, desinstala por completo la aplicación anterior del dispositivo e instálala de nuevo usando el archivo recién descargado.
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="update-modal-actions">
              <button 
                onClick={() => setShowUpdateModal(false)}
                className="update-modal-btn-later"
              >
                Later
              </button>
              <button 
                onClick={() => {
                  window.open(updateInfo.apkUrl, '_system');
                }}
                className="update-modal-btn-now"
              >
                Update Now
              </button>
            </div>
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
