import React from 'react';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import PublicView from './views/PublicView';
import LoginView from './views/LoginView';
import DjDashboard from './views/DjDashboard';

function AppContent() {
  const { user, authLoading, changeEvent } = useFirebase();

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

  // 2. Caso DJ: URL normal
  if (user) {
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
