'use client';
import { useAuth } from '@/lib/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

export default function AccountOrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/orders/my-orders/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setOrdersLoading(false);
      })
      .catch(err => {
        console.error(err);
        setOrdersLoading(false);
      });
    }
  }, [token]);

  if (!user) return null;

  return (
    <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
      <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem' }}>সকল অর্ডার</h2>
      
      {ordersLoading ? (
        <p>অর্ডার লোড হচ্ছে...</p>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🛒</span>
          <p>আপনি এখনো কোনো অর্ডার করেননি।</p>
          <Link href="/books" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>বই কেনা শুরু করুন</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => (
            <div key={order.order_id} style={{ border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>#{order.order_id}</h4>
                <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                  তারিখ: {new Date(order.created_at).toLocaleDateString('bn-BD')}
                </p>
                <p style={{ margin: 0, fontWeight: '500' }}>সর্বমোট: ৳{order.total}</p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    ঠিকানা: {order.address}, {order.district}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`status-badge status-${order.status}`} style={{ display: 'inline-block', marginBottom: '0.5rem', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', background: '#e0f2fe', color: '#0284c7', fontWeight: 'bold' }}>
                  {order.status_display}
                </span>
                <br/>
                <Link href={`/track?id=${order.order_id}`} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                  ট্র্যাক করুন
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
