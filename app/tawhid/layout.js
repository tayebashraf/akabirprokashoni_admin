'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { API_URL } from '@/lib/api';
import styles from './layout.module.css';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { user, login, logout, loading, hasPermission } = useAuth();
  
  // Inline admin login form state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Register sw.js for PWA eligibility
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Admin Service Worker registered', reg))
        .catch((err) => console.error('Admin Service Worker registration failed', err));
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Admin PWA install choice: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

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
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: '600' }}>মোবাইল নম্বর অথবা ইমেইল</label>
              <input 
                type="text" 
                required
                placeholder="01XXXXXXXXX অথবা email@example.com"
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
      <link rel="manifest" href="/manifest-admin.json" />
      <meta name="robots" content="noindex, nofollow" />

      {/* Mobile Top Header */}
      <header className={styles.mobileHeader}>
        <button 
          type="button"
          className={styles.hamburgerBtn}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="মেনু"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
        <div className={styles.mobileLogo}>
          📚 আকাবির প্রকাশনী অ্যাডমিন
        </div>
        <div style={{ width: '24px' }}></div> {/* Spacer to balance layout */}
      </header>

      {/* Backdrop Overlay when Sidebar is open on Mobile */}
      {isMobileMenuOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}>

        <div className={styles.sidebarLogo}>
          <span>📚</span> অ্যাডমিন
        </div>
        <nav className={styles.sidebarNav}>
          {hasPermission('view_dashboard') && (
            <Link href="/tawhid" className={`${styles.navLink} ${pathname === '/tawhid' ? styles.navActive : ''}`}>
              📊 ড্যাশবোর্ড
            </Link>
          )}
          {hasPermission('manage_books') && (
            <Link href="/tawhid/books" className={`${styles.navLink} ${pathname.includes('/books') ? styles.navActive : ''}`}>
              📖 বই ম্যানেজমেন্ট
            </Link>
          )}
          {hasPermission('manage_categories') && (
            <Link href="/tawhid/categories" className={`${styles.navLink} ${pathname.includes('/categories') ? styles.navActive : ''}`}>
              📂 ক্যাটাগরি ম্যানেজমেন্ট
            </Link>
          )}
          {hasPermission('manage_authors') && (
            <Link href="/tawhid/authors" className={`${styles.navLink} ${pathname.includes('/authors') ? styles.navActive : ''}`}>
              ✍️ লেখক ম্যানেজমেন্ট
            </Link>
          )}
          {hasPermission('manage_hero') && (
            <Link href="/tawhid/hero" className={`${styles.navLink} ${pathname.includes('/hero') ? styles.navActive : ''}`}>
              🖼️ হিরো স্লাইডার
            </Link>
          )}
          {hasPermission('manage_orders') && (
            <Link href="/tawhid/orders" className={`${styles.navLink} ${pathname.includes('/orders') ? styles.navActive : ''}`}>
              📦 অর্ডার ম্যানেজমেন্ট
            </Link>
          )}
          {hasPermission('manage_customers') && (
            <Link href="/tawhid/customers" className={`${styles.navLink} ${pathname.includes('/customers') ? styles.navActive : ''}`}>
              👥 গ্রাহক ম্যানেজমেন্ট
            </Link>
          )}
          {hasPermission('manage_reviews') && (
            <Link href="/tawhid/reviews" className={`${styles.navLink} ${pathname.includes('/reviews') ? styles.navActive : ''}`}>
              ⭐ রিভিউ ম্যানেজমেন্ট
            </Link>
          )}
          {hasPermission('manage_settings') && (
            <Link href="/tawhid/settings" className={`${styles.navLink} ${pathname.includes('/settings') ? styles.navActive : ''}`}>
              ⚙️ সাইট সেটিংস
            </Link>
          )}
          {(user?.is_superuser || user?.is_super_admin) && (
            <Link href="/tawhid/team" className={`${styles.navLink} ${pathname.includes('/team') ? styles.navActive : ''}`}>
              👥 টিম ম্যানেজমেন্ট
            </Link>
          )}
          {showInstallBtn && (
            <button 
              type="button" 
              onClick={handleInstallClick} 
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #0d6b3f, #1e3a8a)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
                marginBottom: '12px',
                boxShadow: '0 4px 12px rgba(13, 107, 63, 0.2)'
              }}
            >
              📱 অ্যাপ ইনস্টল করুন
            </button>
          )}
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
        {(() => {
          let hasAccess = true;
          let deniedMessage = '';

          if (pathname === '/tawhid' || pathname === '/tawhid/') {
            if (!hasPermission('view_dashboard')) {
              hasAccess = false;
              deniedMessage = 'ড্যাশবোর্ড দেখার অনুমতি আপনার নেই।';
            }
          } else if (pathname.startsWith('/tawhid/books')) {
            if (!hasPermission('manage_books')) {
              hasAccess = false;
              deniedMessage = 'বই ম্যানেজমেন্টের অনুমতি আপনার নেই।';
            }
          } else if (pathname.startsWith('/tawhid/categories')) {
            if (!hasPermission('manage_categories')) {
              hasAccess = false;
              deniedMessage = 'ক্যাটাগরি ম্যানেজমেন্টের অনুমতি আপনার নেই।';
            }
          } else if (pathname.startsWith('/tawhid/authors')) {
            if (!hasPermission('manage_authors')) {
              hasAccess = false;
              deniedMessage = 'লেখক ম্যানেজমেন্টের অনুমতি আপনার নেই।';
            }
          } else if (pathname.startsWith('/tawhid/hero')) {
            if (!hasPermission('manage_hero')) {
              hasAccess = false;
              deniedMessage = 'হিরো স্লাইডার ম্যানেজমেন্টের অনুমতি আপনার নেই।';
            }
          } else if (pathname.startsWith('/tawhid/orders')) {
            if (!hasPermission('manage_orders')) {
              hasAccess = false;
              deniedMessage = 'অর্ডার ম্যানেজমেন্টের অনুমতি আপনার নেই।';
            }
          } else if (pathname.startsWith('/tawhid/customers')) {
            if (!hasPermission('manage_customers')) {
              hasAccess = false;
              deniedMessage = 'গ্রাহক তালিকা দেখার অনুমতি আপনার নেই।';
            }
          } else if (pathname.startsWith('/tawhid/reviews')) {
            if (!hasPermission('manage_reviews')) {
              hasAccess = false;
              deniedMessage = 'রিভিউ ম্যানেজমেন্টের অনুমতি আপনার নেই।';
            }
          } else if (pathname.startsWith('/tawhid/settings')) {
            if (!hasPermission('manage_settings')) {
              hasAccess = false;
              deniedMessage = 'সাইট সেটিংস পরিবর্তনের অনুমতি আপনার নেই।';
            }
          } else if (pathname.startsWith('/tawhid/team')) {
            if (!user?.is_superuser && !user?.is_super_admin) {
              hasAccess = false;
              deniedMessage = 'টিম ম্যানেজমেন্টে প্রবেশের অনুমতি শুধুমাত্র সুপার অ্যাডমিনের রয়েছে।';
            }
          }

          if (hasAccess) return children;

          return (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center',
              padding: '2rem',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              margin: '2rem auto',
              maxWidth: '500px'
            }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</span>
              <h3 style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.5rem' }}>অ্যাক্সেস বর্জনীয় (অনুমতি নেই)</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>{deniedMessage}</p>
              <Link href="/tawhid" style={{
                padding: '0.5rem 1rem',
                background: '#22c55e',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                ড্যাশবোর্ডে ফিরে যান
              </Link>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
