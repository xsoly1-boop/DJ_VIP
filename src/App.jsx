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
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '450px',
            width: '100%',
            padding: '30px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            background: 'rgba(23, 17, 35, 0.95)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.15)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '2rem'
            }}>
              🚀
            </div>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Actualización Disponible
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Una nueva versión de <strong>DJ Panel Pro</strong> está lista para instalar (v{updateInfo.latestVersion}).
            </p>

            {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && (
              <div style={{
                textAlign: 'left',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '25px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  Novedades de esta versión:
                </h4>
                <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {updateInfo.releaseNotes.map((note, idx) => (
                    <li key={idx} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', listStyleType: 'disc', lineHeight: '1.4' }}>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowUpdateModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px', fontWeight: '600' }}
              >
                Más Tarde
              </button>
              <button 
                onClick={() => {
                  window.open(updateInfo.apkUrl, '_system');
                }}
                className="btn btn-primary"
                style={{ flex: 2, padding: '12px', fontWeight: '600', gap: '8px' }}
              >
                Descargar e Instalar
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
