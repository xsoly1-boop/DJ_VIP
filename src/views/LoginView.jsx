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
    <div className="flex-center" style={{ minHeight: '90vh', padding: '20px' }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '35px 30px 0',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>

        {/* Logo */}
        <div className="flex-center" style={{
          width: '64px', height: '64px', margin: '0 auto 20px',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
          boxShadow: '0 0 20px var(--primary-glow)', overflow: 'hidden'
        }}>
          <img src="./logo_vinyl.png" alt="DJ Connect Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <h1 className="glow-text-primary" style={{ fontSize: '1.75rem', marginBottom: '8px' }}>
          {isRegister ? 'Registro de DJ' : 'DJ Control Panel'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '30px' }}>
          {isRegister
            ? 'Crea tu cuenta para comenzar a gestionar tus eventos interactivos.'
            : 'Inicia sesión para gestionar tus eventos y peticiones en vivo.'}
        </p>

        {/* Modo Demo */}
        {isMock && !isRegister && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '24px',
            textAlign: 'left', display: 'flex', gap: '10px', alignItems: 'flex-start'
          }}>
            <ShieldAlert size={18} color="var(--warning-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ color: 'var(--warning-color)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Modo Demostración</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4' }}>
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
            background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '20px',
            color: 'var(--danger-color)', fontSize: '0.85rem', textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {isRegister && (
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Nombre del DJ / Nombre Artístico</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" required className="input-field" placeholder="ej. DJ MasterMix"
                  value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ paddingLeft: '44px' }} />
              </div>
            </div>
          )}

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="email" required className="input-field" placeholder="correo@ejemplo.com"
                value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '44px' }} />
            </div>
          </div>

          {isRegister && (
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Número de Teléfono</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="tel" required className="input-field" placeholder="ej. +54 9 11 1234-5678"
                  value={phone} onChange={(e) => setPhone(e.target.value)} style={{ paddingLeft: '44px' }} />
              </div>
            </div>
          )}

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="password" required className="input-field" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: '44px' }} />
            </div>
          </div>

          {isRegister && (
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Confirmar Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="password" required className="input-field" placeholder="••••••••"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ paddingLeft: '44px' }} />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '600', marginTop: '10px', gap: '10px' }}>
            {loading
              ? <><RefreshCw size={18} className="animate-spin" /> {isRegister ? 'Registrando...' : 'Iniciando Sesión...'}</>
              : <>{isRegister ? 'Crear Cuenta DJ' : 'Entrar al Panel'} <ArrowRight size={18} /></>
            }
          </button>
        </form>

        {/* Toggle login/registro */}
        <div style={{ marginTop: '25px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
          <button onClick={toggleMode} style={{
            background: 'none', border: 'none', color: 'var(--primary-color)',
            fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline'
          }}>
            {isRegister ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>

        {/* Versión */}
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '20px', opacity: 0.5, fontWeight: '600' }}>
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 22px',
              borderRadius: '999px',
              background: 'rgba(6, 182, 212, 0.06)',
              border: '1px solid rgba(6, 182, 212, 0.45)',
              color: 'rgba(6, 182, 212, 0.9)',
              fontSize: '0.78rem',
              fontWeight: '600',
              letterSpacing: '0.02em',
              textDecoration: 'none',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.15)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.14)';
              e.currentTarget.style.boxShadow = '0 0 18px rgba(6, 182, 212, 0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.06)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(6, 182, 212, 0.15)';
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
