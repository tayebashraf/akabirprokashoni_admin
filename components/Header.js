'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/CartContext';
import { getCategories, getAuthors } from '@/lib/api';
import styles from './Header.module.css';

export default function Header() {
  const { totalItems } = useCart();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);

  // Helper function to determine if a link is active
  const isActive = (path) => {
    if (!pathname) return false;
    
    // Exact match for home
    if (path === '/') {
      return pathname === '/' && searchParams.toString() === '';
    }
    
    // For path with query params (e.g. /books?filter=offer)
    if (path.includes('?')) {
      const [base, query] = path.split('?');
      if (pathname !== base) return false;
      
      const urlParams = new URLSearchParams(query);
      for (const [key, value] of urlParams.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
      return true;
    }
    
    // Standard path matching (e.g. /books)
    if (path === '/books') {
      return pathname === '/books' && !searchParams.has('filter') && !searchParams.has('category') && !searchParams.has('author');
    }
    
    return pathname.startsWith(path);
  };

  useEffect(() => {
    getCategories()
      .then(data => {
        const cats = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setCategories(cats);
      })
      .catch(() => setCategories([]));
      
    getAuthors()
      .then(data => {
        const auts = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setAuthors(auts);
      })
      .catch(() => setAuthors([]));
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={`container ${styles.topBarInner}`}>
          <span>Phone: +880 1718763978</span>
          <div className={styles.topBarRight}>
            <Link href="/track">অর্ডার ট্র্যাক করুন</Link>
            <Link href="/account">আমার একাউন্ট</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          {/* Left section: Hamburger & Logo */}
          <div className={styles.leftSection}>
            <button
              className={styles.menuToggle}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`} />
            </button>
            <Link href="/" className={styles.logo}>
              <img src="/images/logo.png" alt="Akabir Prokashoni" width="240" height="85" className={styles.logoImg} />
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          <div className={`${styles.searchBar} ${searchOpen ? styles.searchOpen : ''}`}>
            <input
              type="text"
              placeholder="বই, লেখক বা প্রকাশক খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button className={styles.searchBtn}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
          </div>

          {/* Right section: Actions */}
          <div className={styles.actions}>
            <button
              className={styles.mobileSearchBtn}
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>

            <Link href="/cart" className={styles.cartBtn}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {totalItems > 0 && (
                <span className={styles.cartBadge}>{totalItems}</span>
              )}
            </Link>

            <Link href="/account" className={styles.actionBtn}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Overlay - closes menu when clicking outside */}
        <div
          className={`${styles.navOverlay} ${menuOpen ? styles.navOverlayVisible : ''}`}
          onClick={closeMenu}
        />

        {/* Navigation */}
        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          <div className={`container ${styles.navInner}`}>
            <Link href="/" className={`${styles.navLink} ${isActive('/') ? styles.navLinkHighlight : ''}`} onClick={closeMenu}>হোম</Link>
            <Link href="/books" className={`${styles.navLink} ${isActive('/books') ? styles.navLinkHighlight : ''}`} onClick={closeMenu}>সকল বই</Link>

            <div className={styles.navDropdown}>
              <span className={`${styles.navLink} ${searchParams?.has('category') ? styles.navLinkHighlight : ''}`}>
                বিষয় <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
              </span>
              <div className={styles.dropdownMenu}>
                {categories.map(cat => (
                  <Link key={cat.slug} href={`/books?category=${cat.slug}`} className={searchParams?.get('category') === cat.slug ? styles.navLinkHighlight : ''} onClick={closeMenu}>
                    {cat.name}
                  </Link>
                ))}
                {categories.length === 0 && (
                  <span style={{ padding: '8px 16px', color: '#999', fontSize: '13px' }}>লোড হচ্ছে...</span>
                )}
              </div>
            </div>

            <div className={styles.navDropdown}>
              <span className={`${styles.navLink} ${searchParams?.has('author') ? styles.navLinkHighlight : ''}`}>
                লেখক <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
              </span>
              <div className={styles.dropdownMenu}>
                {authors.map(author => (
                  <Link key={author.slug} href={`/books?author=${author.slug}`} className={searchParams?.get('author') === author.slug ? styles.navLinkHighlight : ''} onClick={closeMenu}>
                    {author.name}
                  </Link>
                ))}
                {authors.length === 0 && (
                  <span style={{ padding: '8px 16px', color: '#999', fontSize: '13px' }}>লোড হচ্ছে...</span>
                )}
              </div>
            </div>

            <Link href="/books?filter=new" className={`${styles.navLink} ${isActive('/books?filter=new') ? styles.navLinkHighlight : ''}`} onClick={closeMenu}>নতুন প্রকাশিত</Link>
            <Link href="/books?filter=preorder" className={`${styles.navLink} ${isActive('/books?filter=preorder') ? styles.navLinkHighlight : ''}`} onClick={closeMenu}>প্রি-অর্ডার</Link>
            <Link href="/books?filter=offer" className={`${styles.navLink} ${isActive('/books?filter=offer') ? styles.navLinkHighlight : ''}`} onClick={closeMenu}>আজকের অফার</Link>

            {/* Mobile Only Links at the bottom of the hamburger menu */}
            <div className={styles.mobileOnlyLinks}>
              <a href="https://wa.me/8801718763978" target="_blank" rel="noopener noreferrer" className={styles.navLink} onClick={closeMenu}>
                <span style={{ fontSize: '18px', marginRight: '6px' }}>💬</span> যোগাযোগ করুন
              </a>
              <Link href="/account" className={styles.navLink} onClick={closeMenu}>
                <span style={{ fontSize: '18px', marginRight: '6px' }}>👤</span> আমার প্রোফাইল
              </Link>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
