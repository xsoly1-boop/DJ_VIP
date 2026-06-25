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

  // 1. Caso Público: URL contiene "?event=xyz"
  if (eventParam) {
    return <PublicView />;
  }

  // 2. Caso Admin Subscriptions
  if (window.location.pathname === '/subscriptions' && user && isAdminMaster) {
    return <AdminSubscriptions />;
  }

  // 3. Caso DJ: URL normal
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
  } else {
    return <LoginView />;
  }
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
