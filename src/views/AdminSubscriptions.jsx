import React, { useEffect, useState } from 'react';
import { useFirebase } from '../context/SupabaseContext';

const AdminSubscriptions = ({ onBack }) => {
  const { listSubscriptions, updateSubscription, deleteSubscription, isMock } = useFirebase();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    try {
      if (isMock) {
        setSubscriptions([]);
        return;
      }
      const list = await listSubscriptions();
      setSubscriptions(list);
    } catch (e) {
      console.error('Failed to fetch subscriptions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleEdit = async (sub) => {
    const planName = prompt('Ingrese el nuevo plan (free, premium, vip, pro, pro_1d):', sub.activePlan);
    if (!planName) return;
    try {
      if (isMock) {
        alert('Modificado [Mock]');
        return;
      }
      await updateSubscription(sub.id, planName);
      alert('Suscripción actualizada con éxito.');
      fetchSubscriptions();
    } catch (e) {
      console.error(e);
      alert('Error: ' + e.message);
    }
  };

  const handleDelete = async (sub) => {
    if (!window.confirm('¿Desea restablecer esta suscripción a Plan Demo?')) return;
    try {
      if (isMock) {
        alert('Restablecido [Mock]');
        return;
      }
      await deleteSubscription(sub.id);
      alert('Suscripción restablecida.');
      fetchSubscriptions();
    } catch (e) {
      console.error(e);
      alert('Error: ' + e.message);
    }
  };

  if (loading) return <div>Loading subscriptions...</div>;

  return (
    <div className="admin-subscriptions" style={{ padding: '2rem' }}>
      <button
        onClick={() => {
          if (typeof onBack === 'function') {
            onBack();
          } else {
            window.location.href = '/';
          }
        }}
        style={{
          marginBottom: '1.5rem',
          padding: '8px 16px',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 'var(--radius-md, 6px)',
          cursor: 'pointer',
          fontSize: '0.85rem'
        }}
      >
        ← Volver al Panel de DJ
      </button>
      <h2>Gestión de Suscripciones</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--secondary-color)', color: '#fff' }}>
            <th style={{ padding: '0.5rem' }}>ID</th>
            <th style={{ padding: '0.5rem' }}>Usuario UID</th>
            <th style={{ padding: '0.5rem' }}>Plan</th>
            <th style={{ padding: '0.5rem' }}>Estado</th>
            <th style={{ padding: '0.5rem' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map(sub => (
            <tr key={sub.id} style={{ borderBottom: '1px solid var(--primary-color)' }}>
              <td style={{ padding: '0.5rem' }}>{sub.id}</td>
              <td style={{ padding: '0.5rem' }}>{sub.uid || sub.userId || ''}</td>
              <td style={{ padding: '0.5rem' }}>{sub.plan || sub.type || ''}</td>
              <td style={{ padding: '0.5rem' }}>{sub.status || ''}</td>
              <td style={{ padding: '0.5rem' }}>
                <button onClick={() => handleEdit(sub)} style={{ marginRight: '0.5rem' }}>Editar</button>
                <button onClick={() => handleDelete(sub)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminSubscriptions;
