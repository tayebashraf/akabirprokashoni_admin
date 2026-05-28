'use client';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import styles from './layout.module.css';

export default function AccountLayout({ children }) {
  const { user, token, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (token) {
      fetch(`${API_URL}/accounts/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error(err));
    }
  }, [user, loading, router, token]);

  if (loading || !user) {
    return <div className="container section" style={{ textAlign: 'center', padding: '10rem 0' }}>লোড হচ্ছে...</div>;
  }

  const navLinks = [
    { href: '/account', label: 'ড্যাশবোর্ড' },
    { href: '/account/orders', label: 'আমার অর্ডারসমূহ' },
    { href: '/account/settings', label: 'একাউন্ট সেটিংস' },
  ];

  return (
    <div className="container section">
      <div className={styles.accountGrid}>
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
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href}
                  href={link.href} 
                  style={{ 
                    padding: '0.75rem 1rem', 
                    background: isActive ? 'var(--color-primary)' : 'transparent', 
                    color: isActive ? 'white' : 'var(--color-text-secondary)', 
                    borderRadius: '4px', 
                    fontWeight: isActive ? 'bold' : 'normal' 
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            <button onClick={logout} style={{ padding: '0.75rem 1rem', color: '#dc2626', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>লগআউট</button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
