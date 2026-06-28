import { useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { Lock, Mail, ArrowRight, ShieldAlert, Phone, User, RefreshCw, Download } from 'lucide-react';
import { CURRENT_APP_VERSION } from '../utils/AppVersionConfig';

const APK_URL = 'https://dj-vip.vercel.app/DJ%20a%20la%20Carta%20Pro.apk';

export default function LoginView() {
  const { loginDJ, registerDJ, isMock } = useFirebase();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // States for input focus glows
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [displayNameFocused, setDisplayNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  // States for button hover glows
  const [btnHovered, setBtnHovered] = useState(false);
  const [toggleBtnHovered, setToggleBtnHovered] = useState(false);
  const [downloadBtnHovered, setDownloadBtnHovered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden.');
        await registerDJ(email, password, phone, displayName);
      } else {
        await loginDJ(email, password);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
    setPhone('');
    setConfirmPassword('');
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
        maxWidth: '440px',
        padding: '40px 30px 0',
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(25px) saturate(180%)',
        WebkitBackdropFilter: 'blur(25px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>

        {/* Logo Circular Glow */}
        <div style={{
          width: '84px',
          height: '84px',
          margin: '0 auto 24px',
          borderRadius: '50%',
          background: 'rgba(13, 10, 33, 0.6)',
          border: '2px solid rgba(124, 58, 237, 0.8)',
          boxShadow: '0 0 25px rgba(124, 58, 237, 0.3), inset 0 0 12px rgba(6, 182, 212, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <img src="./logo_vinyl.png" alt="DJ Connect Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <h1 style={{
          fontSize: '1.9rem',
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: '10px',
          textShadow: '0 0 15px rgba(255, 255, 255, 0.1), 0 0 10px rgba(124, 58, 237, 0.55)',
          letterSpacing: '-0.02em'
        }}>
          {isRegister ? 'Registro de DJ' : 'DJ Control Panel'}
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '0.9rem',
          lineHeight: '1.5',
          marginBottom: '35px',
          padding: '0 10px'
        }}>
          {isRegister
            ? 'Crea tu cuenta para comenzar a gestionar tus eventos interactivos.'
            : 'Inicia sesión para gestionar tus eventos y peticiones en vivo.'}
        </p>

        {/* Modo Demo */}
        {isMock && !isRegister && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            textAlign: 'left',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
          }}>
            <ShieldAlert size={18} color="var(--warning-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ color: 'var(--warning-color)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Modo Demostración</p>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4' }}>
                Para pruebas locales sin Firebase configurado, usa:<br />
                📧 <strong>dj@admin.com</strong> (Admin Master)<br />
                🔑 <strong>admin123</strong>
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '20px',
            color: 'var(--danger-color)',
            fontSize: '0.85rem',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {isRegister && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>Nombre del DJ / Nombre Artístico</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color={displayNameFocused ? 'rgba(124, 58, 237, 0.8)' : '#64748b'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s ease' }} />
                <input
                  type="text"
                  required
                  placeholder="ej. DJ MasterMix"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onFocus={() => setDisplayNameFocused(true)}
                  onBlur={() => setDisplayNameFocused(false)}
                  style={{
                    width: '100%',
                    padding: '14px 18px 14px 44px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: displayNameFocused ? '1px solid rgba(124, 58, 237, 0.8)' : '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: displayNameFocused ? '0 0 15px rgba(124, 58, 237, 0.35)' : 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color={emailFocused ? 'rgba(124, 58, 237, 0.8)' : '#64748b'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s ease' }} />
              <input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={{
                  width: '100%',
                  padding: '14px 18px 14px 44px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: emailFocused ? '1px solid rgba(124, 58, 237, 0.8)' : '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: emailFocused ? '0 0 15px rgba(124, 58, 237, 0.35)' : 'none'
                }}
              />
            </div>
          </div>

          {isRegister && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>Número de Teléfono</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color={phoneFocused ? 'rgba(124, 58, 237, 0.8)' : '#64748b'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s ease' }} />
                <input
                  type="tel"
                  required
                  placeholder="ej. +54 9 11 1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  style={{
                    width: '100%',
                    padding: '14px 18px 14px 44px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: phoneFocused ? '1px solid rgba(124, 58, 237, 0.8)' : '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: phoneFocused ? '0 0 15px rgba(124, 58, 237, 0.35)' : 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color={passwordFocused ? 'rgba(124, 58, 237, 0.8)' : '#64748b'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s ease' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                style={{
                  width: '100%',
                  padding: '14px 18px 14px 44px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: passwordFocused ? '1px solid rgba(124, 58, 237, 0.8)' : '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: passwordFocused ? '0 0 15px rgba(124, 58, 237, 0.35)' : 'none'
                }}
              />
            </div>
          </div>

          {!isRegister && (
            <div style={{ textAlign: 'right', marginTop: '-10px', padding: '0 4px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                ¿Olvidaste tu contraseña? Contacta al administrador para restablecerla.
              </span>
            </div>
          )}

          {isRegister && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>Confirmar Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color={confirmPasswordFocused ? 'rgba(124, 58, 237, 0.8)' : '#64748b'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s ease' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  style={{
                    width: '100%',
                    padding: '14px 18px 14px 44px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: confirmPasswordFocused ? '1px solid rgba(124, 58, 237, 0.8)' : '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: confirmPasswordFocused ? '0 0 15px rgba(124, 58, 237, 0.35)' : 'none'
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '1rem',
              fontWeight: '600',
              marginTop: '10px',
              gap: '10px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#ffffff',
              border: 'none',
              boxShadow: btnHovered ? '0 12px 30px rgba(124, 58, 237, 0.75)' : '0 8px 25px rgba(124, 58, 237, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none'
            }}
          >
            {loading ? (
              <><RefreshCw size={18} className="animate-spin" /> {isRegister ? 'Registrando...' : 'Iniciando Sesión...'}</>
            ) : (
              <>{isRegister ? 'Crear Cuenta DJ' : 'Entrar al Panel'} <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        {/* Toggle login/registro */}
        <div style={{ marginTop: '25px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
          <button
            onClick={toggleMode}
            onMouseEnter={() => setToggleBtnHovered(true)}
            onMouseLeave={() => setToggleBtnHovered(false)}
            style={{
              background: 'none',
              border: 'none',
              color: toggleBtnHovered ? '#c084fc' : '#a78bfa',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              transition: 'color 0.2s ease',
              outline: 'none'
            }}
          >
            {isRegister ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>

        {/* Versión */}
        <p style={{
          fontSize: '0.7rem',
          color: 'rgba(255, 255, 255, 0.35)',
          marginTop: '25px',
          marginBottom: '15px',
          fontWeight: '600'
        }}>
          Versión Instalada: v{CURRENT_APP_VERSION}
        </p>

        {/* ── Footer: Botón descarga APK ── */}
        <div style={{
          marginTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '14px 0 20px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <a
            href={APK_URL}
            download
            onMouseEnter={() => setDownloadBtnHovered(true)}
            onMouseLeave={() => setDownloadBtnHovered(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 24px',
              borderRadius: '999px',
              background: 'rgba(6, 182, 212, 0.04)',
              border: '1px solid rgba(6, 182, 212, 0.45)',
              color: '#06b6d4',
              fontSize: '0.78rem',
              fontWeight: '600',
              letterSpacing: '0.02em',
              textDecoration: 'none',
              boxShadow: downloadBtnHovered ? '0 0 20px rgba(6, 182, 212, 0.45)' : '0 0 10px rgba(6, 182, 212, 0.15)',
              borderColor: downloadBtnHovered ? 'rgba(6, 182, 212, 0.8)' : 'rgba(6, 182, 212, 0.45)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            Descargar App v{CURRENT_APP_VERSION}
          </a>
        </div>

      </div>
    </div>
  );
}
