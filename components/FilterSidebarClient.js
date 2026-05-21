'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from '../app/books/page.module.css';
import { useSearchParams } from 'next/navigation';

export default function FilterSidebarClient({ categories, authors, getUrl }) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const selectedCat = searchParams.get('category') || 'all';
  const selectedAuthor = searchParams.get('author') || 'all';

  // We need a way to generate URL on client since we can't pass a server function directly if it depends on request.
  // Actually, we can just use the current searchParams to generate the URL.
  const createUrl = (updates) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === 'all') params.delete(key);
      else params.set(key, value);
    }
    return `?${params.toString()}`;
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <button 
        className={styles.mobileFilterBtn} 
        onClick={() => setIsOpen(true)}
        aria-label="Filter"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className={styles.filterOverlay} onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar Content */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>ফিল্টার অপশন</h2>
          <button className={styles.closeSidebar} onClick={() => setIsOpen(false)}>&times;</button>
        </div>

        <div className={styles.filterGroup}>
          <h3 className={styles.filterTitle}>বিষয়</h3>
          <Link
            href={createUrl({ category: 'all' })}
            className={`${styles.filterBtn} ${selectedCat === 'all' ? styles.filterActive : ''}`}
            onClick={() => setIsOpen(false)}
          >
            সকল বিষয়
          </Link>
          {categories.map(cat => (
            <Link
              key={cat.slug}
              href={createUrl({ category: cat.slug })}
              className={`${styles.filterBtn} ${selectedCat === cat.slug ? styles.filterActive : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <div className={styles.filterGroup} style={{ marginTop: '24px' }}>
          <h3 className={styles.filterTitle}>লেখক</h3>
          <Link
            href={createUrl({ author: 'all' })}
            className={`${styles.filterBtn} ${selectedAuthor === 'all' ? styles.filterActive : ''}`}
            onClick={() => setIsOpen(false)}
          >
            সকল লেখক
          </Link>
          {authors.map(author => (
            <Link
              key={author.slug}
              href={createUrl({ author: author.slug })}
              className={`${styles.filterBtn} ${selectedAuthor === author.slug ? styles.filterActive : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {author.name}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
