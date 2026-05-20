'use client';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

export default function AccountPage() {
  const { user, token, logout, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (token) {
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
  }, [user, loading, router, token]);

  if (loading || !user) {
    return <div className="container section" style={{ textAlign: 'center', padding: '10rem 0' }}>লোড হচ্ছে...</div>;
  }

  return (
    <div className="container section">
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        {/* Sidebar */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', alignSelf: 'start' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-primary-50)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1rem', fontWeight: 'bold' }}>
              {profile?.first_name?.charAt(0) || user.name?.charAt(0) || 'U'}
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{profile?.first_name} {profile?.last_name}</h3>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>{user.phone}</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link href="/account" style={{ padding: '0.75rem 1rem', background: 'var(--color-primary)', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>ড্যাশবোর্ড</Link>
            <Link href="/account/orders" style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', borderRadius: '4px' }}>আমার অর্ডারসমূহ</Link>
            <Link href="/account/settings" style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', borderRadius: '4px' }}>একাউন্ট সেটিংস</Link>
            <button onClick={logout} style={{ padding: '0.75rem 1rem', color: '#dc2626', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>লগআউট</button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
            
            <button className="btn btn-outline" style={{ marginTop: '2rem' }}>প্রোফাইল আপডেট করুন</button>
          </div>

          <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem' }}>সাম্প্রতিক অর্ডার</h2>
            
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
        </div>
      </div>
    </div>
  );
}
