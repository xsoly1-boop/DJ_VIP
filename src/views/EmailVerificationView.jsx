import React, { useState, useEffect } from 'react';
import { useFirebase } from '../context/SupabaseContext';
import { Mail, RefreshCw, LogOut, CheckCircle, Send } from 'lucide-react';

export default function EmailVerificationView() {
  const { user, logoutDJ, refreshUser, sendEmailVerification } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Focus and hover states for UI styling
  const [checkHovered, setCheckHovered] = useState(false);
  const [resendHovered, setResendHovered] = useState(false);
  const [logoutHovered, setLogoutHovered] = useState(false);

  // Timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCheckVerification = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await refreshUser();
      // Si tras refrescar el usuario ya está verificado, el enrutador de App.jsx cambiará de vista automáticamente.
      // Damos un pequeño mensaje de feedback por si acaso aún no se actualiza o no está verificado.
      setTimeout(() => {
        if (user && !user.emailVerified) {
          setError('El correo aún no ha sido verificado. Por favor revisa tu bandeja de entrada o spam.');
        }
      }, 500);
    } catch (err) {
      setError(err.message || 'Error al verificar el estado de la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await sendEmailVerification(user);
      setSuccessMessage('¡Correo de verificación reenviado con éxito!');
      setCooldown(60); // 60 seconds cooldown
    } catch (err) {
      setError(err.message || 'Error al reenviar el correo de verificación.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      margin: 0,
      padding: '40px 20px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, #1e124a 0%, #0d0a21 55%, #05050b 100%)',
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        padding: '40px 30px',
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(25px) saturate(180%)',
        WebkitBackdropFilter: 'blur(25px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>

        {/* Glowing Icon Container */}
        <div style={{
          width: '84px',
          height: '84px',
          margin: '0 auto 24px',
          borderRadius: '50%',
          background: 'rgba(124, 58, 237, 0.1)',
          border: '2px solid rgba(124, 58, 237, 0.8)',
          boxShadow: '0 0 25px rgba(124, 58, 237, 0.3), inset 0 0 12px rgba(124, 58, 237, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Mail size={40} color="#c084fc" />
        </div>

        <h1 style={{
          fontSize: '1.9rem',
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: '10px',
          textShadow: '0 0 15px rgba(255, 255, 255, 0.1), 0 0 10px rgba(124, 58, 237, 0.55)',
          letterSpacing: '-0.02em'
        }}>
          Verifica tu Correo
        </h1>

        <p style={{
          color: '#e2e8f0',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          Hemos enviado un enlace de confirmación a:<br />
          <strong style={{ color: '#c084fc', fontSize: '1rem', display: 'block', marginTop: '6px', wordBreak: 'break-all' }}>
            {user?.email}
          </strong>
        </p>

        <p style={{
          color: '#94a3b8',
          fontSize: '0.88rem',
          lineHeight: '1.5',
          marginBottom: '30px'
        }}>
          Por favor, haz clic en el enlace del mensaje para verificar tu cuenta. Si no lo encuentras, revisa tu bandeja de correo no deseado (Spam).
        </p>

        {/* Feedback Messages */}
        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: '#10b981',
            fontSize: '0.85rem',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: 'var(--danger-color)',
            fontSize: '0.85rem',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <button
            onClick={handleCheckVerification}
            disabled={loading}
            onMouseEnter={() => setCheckHovered(true)}
            onMouseLeave={() => setCheckHovered(false)}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#ffffff',
              border: 'none',
              boxShadow: checkHovered ? '0 12px 30px rgba(124, 58, 237, 0.75)' : '0 8px 25px rgba(124, 58, 237, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              outline: 'none'
            }}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span>{loading ? 'Comprobando estado...' : 'Ya he verificado mi correo'}</span>
          </button>

          <button
            onClick={handleResendEmail}
            disabled={resending || cooldown > 0}
            onMouseEnter={() => setResendHovered(true)}
            onMouseLeave={() => setResendHovered(false)}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '0.9rem',
              fontWeight: '500',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.03)',
              color: cooldown > 0 ? '#64748b' : (resendHovered ? '#ffffff' : '#a78bfa'),
              border: '1px solid rgba(255, 255, 255, 0.08)',
              cursor: (resending || cooldown > 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              outline: 'none'
            }}
          >
            {resending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            <span>
              {cooldown > 0 
                ? `Reenviar correo en ${cooldown}s` 
                : 'Reenviar enlace de confirmación'}
            </span>
          </button>

          <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
            <button
              onClick={logoutDJ}
              onMouseEnter={() => setLogoutHovered(true)}
              onMouseLeave={() => setLogoutHovered(false)}
              style={{
                background: 'none',
                border: 'none',
                color: logoutHovered ? '#f87171' : '#f87171d0',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                outline: 'none'
              }}
            >
              <LogOut size={16} />
              <span>Cerrar sesión / Usar otro correo</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
