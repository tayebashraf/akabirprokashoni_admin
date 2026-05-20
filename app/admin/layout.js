'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import styles from './layout.module.css';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ color: 'var(--color-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>লোড হচ্ছে...</div>
      </div>
    );
  }

  // Check if user is logged in AND is staff/superuser
  const isAuthorized = user && (user.is_staff || user.is_superuser);

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', padding: '2rem' }}>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', maxWidth: '450px', textAlign: 'center' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>⚠️</span>
          <h2 style={{ color: '#b91c1c', marginBottom: '1rem', fontWeight: 'bold' }}>অননুমোদিত অ্যাক্সেস</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            দুঃখিত, এই পাতাটি দেখার জন্য আপনার প্রয়োজনীয় অ্যাডমিন পারমিশন নেই। অনুগ্রহ করে অ্যাডমিন অ্যাকাউন্ট দিয়ে লগইন করুন।
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/login" style={{ padding: '0.75rem 1.5rem', background: 'var(--color-primary)', color: 'white', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none' }}>
              লগইন করুন
            </Link>
            <Link href="/" style={{ padding: '0.75rem 1.5rem', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none' }}>
              হোমপেজ
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
          <Link href="/admin/settings" className={`${styles.navLink} ${pathname.includes('/settings') ? styles.navActive : ''}`}>
            ⚙️ সাইট সেটিংস
          </Link>
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
