import React from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { Music, Check, Star, Sparkles, LogOut, X, ArrowLeft } from 'lucide-react';

export default function PlanSelection() {
  const { selectPlan, cancelPlanSelection, logoutDJ, plansConfig } = useFirebase();

  const handleSelectPlan = async (plan) => {
    try {
      await selectPlan(plan);
    } catch (e) {
      console.error(e);
      alert('Error al seleccionar el plan: ' + e.message);
    }
  };

  const plans = Object.keys(plansConfig || {}).map((key) => {
    const config = plansConfig[key];
    const isPrimary = key === 'premium';
    const recommended = key === 'premium';
    
    let buttonText = `Obtener ${config.name}`;
    if (key === 'free') buttonText = 'Comenzar Gratis';
    else if (key === 'premium') buttonText = 'Obtener Premium';
    else if (key === 'vip') buttonText = 'Obtener VIP';
    else if (config.price === "0" || parseFloat(config.price) === 0) buttonText = 'Comenzar Gratis';
    
    return {
      key,
      config,
      buttonText,
      isPrimary,
      recommended
    };
  });

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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        width: '100%',
        maxWidth: '1000px',
        marginTop: '20px'
      }}>
        {plans.map((plan) => {
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
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {plan.config.name} {plan.key === 'premium' && <Sparkles size={16} color="var(--primary-color)" />}
                  {plan.key === 'vip' && <Star size={16} color="var(--secondary-color)" fill="var(--secondary-color)" />}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>{plan.config.description}</p>
                <div style={{ fontSize: '2.0rem', fontWeight: 'bold', marginBottom: '25px', color: 'var(--primary-color)' }}>
                  {plan.config.price === "0" ? "Gratis" : `${plan.config.price} ${plan.config.currency || 'USD'}`} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {plan.config.billing}</span>
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
                onClick={() => handleSelectPlan(plan.key)}
                className={`btn ${plan.isPrimary ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', marginTop: '30px', padding: '12px' }}
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
