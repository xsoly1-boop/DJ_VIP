import React, { useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { CreditCard, CheckCircle, ArrowLeft, LogOut, Check, RefreshCw } from 'lucide-react';

export default function PaymentView() {
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:' || !window.location.hostname) ? 'http://localhost:4000' : '';
  const { userProfile, selectPlan, submitPaymentProof, logoutDJ, plansConfig, publicPaymentInfo } = useFirebase();
  const [gateway, setGateway] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const planName = userProfile?.selectedPlan || 'premium';
  const planDetails = plansConfig?.[planName];
  const price = planDetails ? `$${planDetails.price} ${planDetails.currency || 'MXN'}` : (planName === 'vip' ? '$549 MXN' : '$299 MXN');

  const handleBackToPlans = async () => {
    try {
      await selectPlan('pending_plan'); // resets back to selection
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckoutMock = async (method) => {
    setGateway(method);
    if (method === 'transfer') {
      setTransactionId('');
      return;
    }
    setLoading(true);
    try {
      // Llamar al backend para simular la preferencia/creación
      const res = await fetch(`${API_BASE}/api/subscription/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile?.email || 'user',
          planId: planName,
          paymentMethod: method
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Simulando redirección a la pasarela de pago de ${method === 'paypal' ? 'PayPal' : 'Mercado Pago'}...\n\nPago simulado con éxito.`);
        // Autocompletar el ID de transacción simulado para facilidad del usuario
        setTransactionId('TXN-' + Date.now().toString().slice(-6));
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error al simular pago: ' + e.message + '\n\nProcediendo con simulación offline.');
      setTransactionId('TXN-' + Date.now().toString().slice(-6));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!gateway) {
      alert('Por favor selecciona una pasarela de pago y realiza la transacción simulada.');
      return;
    }
    if (!transactionId.trim()) {
      alert('Por favor ingresa el ID de transacción.');
      return;
    }
    setLoading(true);
    try {
      await submitPaymentProof(gateway, transactionId);
      setSuccess(true);
    } catch (e) {
      console.error(e);
      alert('Error al enviar el comprobante: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success || userProfile?.subscriptionStatus === 'pending_validation') {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', padding: '20px', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-panel" style={{
          width: '100%',
          maxWidth: '500px',
          padding: '40px 30px',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div className="flex-center" style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 20px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle size={32} color="var(--success-color)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: '#fff' }}>Pago en Proceso de Verificación</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Hemos recibido los detalles de tu pago. Un administrador master validará la transacción y activará tu servicio a la brevedad.
          </p>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            textAlign: 'left',
            fontSize: '0.85rem',
            marginBottom: '30px',
            border: '1px solid var(--surface-border)'
          }}>
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}><strong>Plan:</strong> {planName.toUpperCase()}</p>
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}><strong>Método:</strong> {userProfile?.paymentDetails?.gateway || gateway}</p>
            <p style={{ margin: '0', color: 'var(--text-secondary)' }}><strong>ID Transacción:</strong> {userProfile?.paymentDetails?.transactionId || transactionId}</p>
          </div>
          <button onClick={logoutDJ} className="btn btn-secondary" style={{ width: '100%', padding: '12px' }}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '20px', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '500px',
        padding: '35px 30px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <button onClick={handleBackToPlans} className="flex-center" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', gap: '6px', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Cambiar Plan
          </button>
          <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--primary-color)', fontWeight: 'bold' }}>Paso 2: Pago</h4>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '6px' }}>Adquirir Plan {planName.toUpperCase()}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total a pagar: <strong style={{ color: 'var(--success-color)', fontSize: '1.1rem' }}>{price}</strong></p>
        </div>

        {/* Pasos de Pago */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Paso A: Seleccionar Pasarela */}
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '10px' }}>1. Elige un método y realiza el Pago:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleCheckoutMock('paypal')}
                  style={{
                    background: gateway === 'paypal' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: gateway === 'paypal' ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ color: '#003087', fontSize: '1.1rem', fontWeight: '800' }}>PayPal</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Paga en MXN</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCheckoutMock('mercadopago')}
                  style={{
                    background: gateway === 'mercadopago' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: gateway === 'mercadopago' ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ color: '#009ee3', fontSize: '1.1rem', fontWeight: '800' }}>MercadoPago</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pesos locales / Tarjeta</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCheckoutMock('transfer')}
                style={{
                  background: gateway === 'transfer' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  border: gateway === 'transfer' ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
              >
                <div style={{ color: 'var(--secondary-color)', fontSize: '1.1rem', fontWeight: '800' }}>Transferencia Bancaria</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SPEI / Depósito directo</span>
              </button>
            </div>
          </div>

          {/* Paso B: Enviar Comprobante */}
          {gateway && (
            <form onSubmit={handleSubmitProof} style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', margin: 0 }}>2. Reporta tu transacción para validación:</p>
              
              {gateway === 'transfer' && (
                <div style={{
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#fff' }}>Instrucciones de Transferencia:</p>
                  <p style={{ margin: 0 }}>
                    Realiza una transferencia electrónica (SPEI) por el total de <strong style={{ color: 'var(--success-color)' }}>{price}</strong>.
                  </p>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    textAlign: 'center',
                    color: '#fff',
                    userSelect: 'all'
                  }}>
                    CLABE: {publicPaymentInfo?.adminClabe || 'No configurada por Administrador'}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    *Copia la CLABE anterior. Una vez realizada la transferencia, ingresa el número de referencia, folio o clave de rastreo a continuación.
                  </span>
                </div>
              )}

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label">Folio de Operación / Referencia / ID de Transacción</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder={gateway === 'transfer' ? "ej. SPEI-123456" : "ej. TXN-123456"}
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Ingresa el código identificador que te dio el banco o pasarela de pago.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                {loading ? <><RefreshCw size={16} className="animate-spin" /> Enviando...</> : <><Check size={16} /> Enviar para Validación</>}
              </button>
            </form>
          )}
        </div>

        <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', textAlign: 'center' }}>
          <button onClick={logoutDJ} className="btn btn-secondary" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
