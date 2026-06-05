'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { API_URL } from '@/lib/api';
import styles from './layout.module.css';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { user, login, logout, loading } = useAuth();
  
  // Inline admin login form state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch(`${API_URL}/accounts/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: phone, password })
      });
      if (!res.ok) throw new Error('ফোন নম্বর বা পাসওয়ার্ড ভুল।');
      const data = await res.json();
      const userData = data.user || { phone, name: 'Admin', is_staff: false, is_superuser: false };
      
      if (!userData.is_staff && !userData.is_superuser) {
        throw new Error('এই অ্যাকাউন্টে অ্যাডমিন পারমিশন নেই।');
      }
      
      login(userData, data.access, data.refresh);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1e293b' }}>
        <div style={{ color: '#22c55e', fontSize: '1.2rem', fontWeight: 'bold' }}>লোড হচ্ছে...</div>
      </div>
    );
  }

  // Check if user is logged in AND is staff/superuser
  const isAuthorized = user && (user.is_staff || user.is_superuser);

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', padding: '2rem' }}>
        <div style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', maxWidth: '420px', width: '100%', border: '1px solid #334155' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📚</span>
            <h2 style={{ color: '#f1f5f9', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.5rem' }}>অ্যাডমিন প্যানেল</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>আকাবির প্রকাশনী ম্যানেজমেন্ট</p>
          </div>

          {loginError && (
            <div style={{ background: '#451a1a', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem', border: '1px solid #7f1d1d' }}>
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: '600' }}>মোবাইল নম্বর</label>
              <input 
                type="tel" 
                required
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem', background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', color: '#f1f5f9', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: '600' }}>পাসওয়ার্ড</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem', background: '#0f172a', border: '1px solid #475569', borderRadius: '8px', color: '#f1f5f9', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            
            <button 
              type="submit"
              disabled={loginLoading}
              style={{ width: '100%', padding: '0.85rem', background: loginLoading ? '#475569' : '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1.05rem', fontWeight: 'bold', cursor: loginLoading ? 'wait' : 'pointer', transition: 'background 0.2s' }}
            >
              {loginLoading ? '⏳ যাচাই করা হচ্ছে...' : '🔐 অ্যাডমিন লগইন'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link href="/" style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none' }}>
              ← ওয়েবসাইটে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span>📚</span> অ্যাডমিন
        </div>
        <nav className={styles.sidebarNav}>
          <Link href="/admin" className={`${styles.navLink} ${pathname === '/admin' ? styles.navActive : ''}`}>
            📊 ড্যাশবোর্ড
          </Link>
          <Link href="/admin/books" className={`${styles.navLink} ${pathname.includes('/books') ? styles.navActive : ''}`}>
            📖 বই ম্যানেজমেন্ট
          </Link>
          <Link href="/admin/categories" className={`${styles.navLink} ${pathname.includes('/categories') ? styles.navActive : ''}`}>
            📂 ক্যাটাগরি ম্যানেজমেন্ট
          </Link>
          <Link href="/admin/authors" className={`${styles.navLink} ${pathname.includes('/authors') ? styles.navActive : ''}`}>
            ✍️ লেখক ম্যানেজমেন্ট
          </Link>
          <Link href="/admin/hero" className={`${styles.navLink} ${pathname.includes('/hero') ? styles.navActive : ''}`}>
            🖼️ হিরো স্লাইডার
          </Link>
          <Link href="/admin/orders" className={`${styles.navLink} ${pathname.includes('/orders') ? styles.navActive : ''}`}>
            📦 অর্ডার ম্যানেজমেন্ট
          </Link>
          <Link href="/admin/reviews" className={`${styles.navLink} ${pathname.includes('/reviews') ? styles.navActive : ''}`}>
            ⭐ রিভিউ ম্যানেজমেন্ট
          </Link>
          <Link href="/admin/settings" className={`${styles.navLink} ${pathname.includes('/settings') ? styles.navActive : ''}`}>
            ⚙️ সাইট সেটিংস
          </Link>
          <button 
            type="button" 
            onClick={logout} 
            className={styles.logoutBtn}
          >
            🔒 লগআউট
          </button>
        </nav>
        <Link href="/" className={styles.backLink}>← ওয়েবসাইটে ফিরুন</Link>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
