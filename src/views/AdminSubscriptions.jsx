import React, { useEffect, useState } from 'react';

const AdminSubscriptions = () => {
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:4000'
    : (window.location.protocol === 'file:' || !window.location.hostname)
      ? (import.meta.env.DEV ? 'http://localhost:4000' : (import.meta.env.VITE_PUBLIC_URL ? import.meta.env.VITE_PUBLIC_URL.replace(/\/$/, '') : 'https://dj-vip.vercel.app'))
      : '';
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const secret = import.meta.env.VITE_ADMIN_MASTER_SECRET;

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/listSubscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (data.success) setSubscriptions(data.subscriptions);
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
    const updatesStr = prompt('Enter updates as JSON (e.g., {"plan":"premium"})', JSON.stringify(sub));
    if (!updatesStr) return;
    let updates;
    try { updates = JSON.parse(updatesStr); } catch (e) { alert('Invalid JSON'); return; }
    try {
      const res = await fetch(`${API_BASE}/api/admin/updateSubscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, subscriptionId: sub.id, updates }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Updated');
        fetchSubscriptions();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (sub) => {
    if (!window.confirm('Delete subscription?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/deleteSubscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, subscriptionId: sub.id }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Deleted');
        fetchSubscriptions();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div>Loading subscriptions...</div>;

  return (
    <div className="admin-subscriptions" style={{ padding: '2rem' }}>
      <button
        onClick={() => window.location.href = '/'}
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
