import React from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { Music, Check, Star, Sparkles, LogOut, X, ArrowLeft } from 'lucide-react';

export default function PlanSelection() {
  const { selectPlan, cancelPlanSelection, logoutDJ, plansConfig, userProfile } = useFirebase();

  const activePlan = userProfile?.activePlan || 'free';
  const isBonusAllowed = activePlan === 'free' || activePlan === 'premium';

  const handleSelectPlan = async (plan) => {
    try {
      await selectPlan(plan);
    } catch (e) {
      console.error(e);
      alert('Error al seleccionar el plan: ' + e.message);
    }
  };

  const plans = Object.keys(plansConfig || {})
    .filter((key) => {
      if (key === 'pro_1d') {
        // Ocultar si ya fue usado o si es el plan activo actual
        if (userProfile?.pro1dUsed || activePlan === 'pro_1d') {
          return false;
        }
      }
      return true;
    })
    .map((key) => {
      const config = plansConfig[key];
      const isPrimary = key === 'premium';
      const recommended = key === 'premium';
      const isEnDesarrollo = config.status === 'En Desarrollo';
      
      let buttonText = `Obtener ${config.name}`;
      if (isEnDesarrollo) buttonText = 'En Desarrollo';
      else if (key === 'free') buttonText = 'Comenzar Gratis';
      else if (key === 'premium') buttonText = 'Obtener Premium';
      else if (key === 'vip') buttonText = 'Obtener VIP';
      else if (key === 'pro') buttonText = 'Obtener PRO';
      else if (key === 'pro_1d') buttonText = 'Obtener Pro 1 Día';
      else if (key === 'bonus') buttonText = 'Adquirir Bonus';
      else if (config.price === "0" || parseFloat(config.price) === 0) buttonText = 'Comenzar Gratis';
      
      return {
        key,
        config,
        buttonText,
        isPrimary,
        recommended,
        isEnDesarrollo
      };
    });

  const mainPlans = plans.filter((p) => p.key !== 'bonus');
  const bonusPlan = plans.find((p) => p.key === 'bonus');

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '40px 20px', flexDirection: 'column', gap: '30px' }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 className="glow-text-primary" style={{ fontSize: '2.2rem', marginBottom: '12px' }}>
          Selecciona tu Plan de DJ
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6' }}>
          Elige el nivel de personalización y potencia que necesitas para tus eventos interactivos.
        </p>
      </div>

      {bonusPlan && (
        <div className="glass-panel" style={{
          width: '100%',
          maxWidth: '1000px',
          padding: '30px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.04), rgba(255, 255, 255, 0.01))',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '24px',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{
                background: 'linear-gradient(135deg, #d4af37, #f3e5ab)',
                color: '#1a1a1a',
                fontSize: '0.65rem',
                fontWeight: '800',
                padding: '4px 10px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Add-on / Suscripción Independiente
              </div>
              <h3 style={{ fontSize: '1.35rem', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                {bonusPlan.config.name} <Sparkles size={18} color="#d4af37" fill="#d4af37" />
              </h3>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: '1.5' }}>
              {bonusPlan.config.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '6px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Beneficios del Complemento:</span>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {bonusPlan.config.benefits && bonusPlan.config.benefits.map((benefit, i) => (
                    <li key={`b-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Check size={14} color="#d4af37" style={{ marginTop: '2px', flexShrink: 0 }} /> <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {bonusPlan.config.restrictions && bonusPlan.config.restrictions.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Requisitos del Sistema:</span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {bonusPlan.config.restrictions.map((restriction, i) => (
                      <li key={`r-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', opacity: 0.85 }}>
                        <X size={14} color="var(--danger-color)" style={{ marginTop: '2px', flexShrink: 0 }} /> <span>{restriction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div style={{ 
            flex: '1 1 220px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '15px', 
            padding: '10px 20px',
            minWidth: '200px',
            borderLeft: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Inversión Única</span>
              <div style={{ fontSize: '2.1rem', fontWeight: 'bold', color: '#d4af37' }}>
                ${bonusPlan.config.price} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>{bonusPlan.config.currency || 'MXN'}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Vigente por {bonusPlan.config.billing}</span>
            </div>
            
            <button
              onClick={() => isBonusAllowed && handleSelectPlan(bonusPlan.key)}
              disabled={!isBonusAllowed}
              className="btn"
              style={{ 
                width: '100%', 
                padding: '11px',
                background: isBonusAllowed 
                  ? 'linear-gradient(135deg, #d4af37, #b8860b)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: isBonusAllowed ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isBonusAllowed ? '#1a1a1a' : 'var(--text-muted)',
                fontWeight: 'bold',
                boxShadow: isBonusAllowed ? '0 4px 14px rgba(212, 175, 55, 0.15)' : 'none',
                cursor: isBonusAllowed ? 'pointer' : 'not-allowed',
                opacity: isBonusAllowed ? 1 : 0.5,
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {isBonusAllowed ? bonusPlan.buttonText : 'No aplicable para tu Plan'}
            </button>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        width: '100%',
        maxWidth: '1000px',
        marginTop: '20px'
      }}>
        {mainPlans.map((plan) => {
          const isVipBorder = plan.key === 'vip';
          const borderStyle = plan.recommended 
            ? '1px solid rgba(124, 58, 237, 0.3)' 
            : isVipBorder 
              ? '1px solid rgba(6, 182, 212, 0.25)' 
              : '1px solid rgba(255, 255, 255, 0.05)';
          const bgStyle = plan.recommended 
            ? 'rgba(124, 58, 237, 0.03)' 
            : isVipBorder 
              ? 'rgba(6, 182, 212, 0.01)' 
              : 'rgba(255, 255, 255, 0.01)';

          return (
            <div key={plan.key} className="glass-panel" style={{
              padding: '30px 24px',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: borderStyle,
              background: bgStyle,
              position: 'relative'
            }}>
              {plan.recommended && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Star size={10} fill="#fff" /> Recomendado
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6.6px', flexWrap: 'wrap' }}>
                  {plan.config.name} {plan.key === 'premium' && <Sparkles size={16} color="var(--primary-color)" />}
                  {plan.key === 'vip' && <Star size={16} color="var(--secondary-color)" fill="var(--secondary-color)" />}
                  {plan.isEnDesarrollo && (
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: '700', border: '1px solid rgba(239,68,68,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      En Desarrollo
                    </span>
                  )}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>{plan.config.description}</p>
                <div style={{ fontSize: '2.0rem', fontWeight: 'bold', marginBottom: '25px', color: 'var(--primary-color)' }}>
                  {plan.config.price === "0" ? "Gratis" : `$${plan.config.price} ${plan.config.currency || 'MXN'}`} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {plan.config.billing}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Beneficios:</span>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {plan.config.benefits && plan.config.benefits.map((benefit, i) => (
                        <li key={`b-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <Check size={14} color="var(--success-color)" style={{ marginTop: '2px', flexShrink: 0 }} /> <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.config.restrictions && plan.config.restrictions.filter(r => r !== 'Ninguna' && r !== 'Ninguna restricción' && r !== '').length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Límites / Restricciones:</span>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {plan.config.restrictions.filter(r => r !== 'Ninguna' && r !== 'Ninguna restricción' && r !== '').map((restriction, i) => (
                          <li key={`r-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', opacity: 0.75 }}>
                            <X size={14} color="var(--danger-color)" style={{ marginTop: '2px', flexShrink: 0 }} /> <span>{restriction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => !plan.isEnDesarrollo && handleSelectPlan(plan.key)}
                disabled={plan.isEnDesarrollo}
                className={`btn ${plan.isEnDesarrollo ? 'btn-secondary' : plan.isPrimary ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  width: '100%', 
                  marginTop: '30px', 
                  padding: '12px',
                  opacity: plan.isEnDesarrollo ? 0.6 : 1,
                  cursor: plan.isEnDesarrollo ? 'not-allowed' : 'pointer'
                }}
              >
                {plan.buttonText}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '25px', display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={cancelPlanSelection}
          className="btn btn-primary"
          style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} /> Regresar al DJ Panel
        </button>
        
        <button
          onClick={logoutDJ}
          className="btn btn-secondary"
          style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
