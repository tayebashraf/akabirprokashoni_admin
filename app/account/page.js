'use client';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

export default function AccountPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Fetch user profile from Django
      fetch(`${API_URL}/accounts/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error(err));

      // Fetch user's orders
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
  }, [user, router, token]);

  if (!user) return null;

  return (
    <>
      <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem' }}>আমার প্রোফাইল</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>নাম</p>
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{profile?.first_name} {profile?.last_name}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>মোবাইল নম্বর</p>
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user.phone}</p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>ঠিকানা</p>
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{profile?.profile?.address || 'ঠিকানা যুক্ত করা হয়নি'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>শহর</p>
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{profile?.profile?.city || 'যুক্ত করা হয়নি'}</p>
          </div>
        </div>
        
        <button onClick={() => router.push('/account/settings')} className="btn btn-outline" style={{ marginTop: '2rem' }}>প্রোফাইল আপডেট করুন</button>
      </div>

      <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>সাম্প্রতিক অর্ডার</h2>
          <Link href="/account/orders" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>সব দেখুন</Link>
        </div>
        
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
            {orders.slice(0, 3).map(order => (
              <div key={order.order_id} style={{ border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>#{order.order_id}</h4>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                    তারিখ: {new Date(order.created_at).toLocaleDateString('bn-BD')}
                  </p>
                  <p style={{ margin: 0, fontWeight: '500' }}>সর্বমোট: ৳{order.total}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-badge status-${order.status}`} style={{ display: 'inline-block', marginBottom: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', background: '#e0f2fe', color: '#0284c7' }}>
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
    </>
  );
}
