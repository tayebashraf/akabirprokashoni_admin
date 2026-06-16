'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import BookCard from './BookCard';
import styles from '../app/books/page.module.css';

export default function InfiniteBookList({ initialBooks, initialNextUrl, viewMode }) {
  const [books, setBooks] = useState(initialBooks);
  const [nextUrl, setNextUrl] = useState(initialNextUrl);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Reset state when filters change (initialBooks change)
  useEffect(() => {
    setBooks(initialBooks);
    setNextUrl(initialNextUrl);
  }, [initialBooks, initialNextUrl]);

  const loadMore = useCallback(async () => {
    if (!nextUrl || loading) return;
    setLoading(true);
    try {
      const res = await fetch(nextUrl);
      const data = await res.json();
      setBooks(prev => [...prev, ...data.results]);
      setNextUrl(data.next);
    } catch (err) {
      console.error('Failed to load more books', err);
    } finally {
      setLoading(false);
    }
  }, [nextUrl, loading]);

  // Keep ref updated so IntersectionObserver always calls latest loadMore
  loadMoreRef.current = loadMore;

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && loadMoreRef.current) {
        loadMoreRef.current();
      }
    }, { threshold: 0.1 });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [nextUrl, loading]);

  return (
    <>
      <div className={`${styles.booksGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
        {books.map((book, i) => (
          <div key={`${book.id}-${i}`} className="animate-fadeInUp" style={{ animationDelay: `${(i % 10) * 0.05}s` }}>
            <BookCard book={book} />
          </div>
        ))}
      </div>
      
      {/* Loading Indicator / Observer Target */}
      {nextUrl && (
        <div ref={observerRef} style={{ textAlign: 'center', padding: '2rem 0' }}>
          {loading ? (
            <div className="spinner" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          ) : (
            <p style={{ color: 'transparent' }}>Load more</p>
          )}
        </div>
      )}
      
      {!nextUrl && books.length > 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          সবগুলো বই দেখানো হয়েছে
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
