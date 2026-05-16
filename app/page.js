import Link from 'next/link';
import BookCard from '@/components/BookCard';
import HeroSlider from '@/components/HeroSlider';
import { getCategories, getTrendingBooks, getNewReleases, getBooks, getHeroSlides, getAuthors } from '@/lib/api';
import styles from './page.module.css';

export default async function Home() {
  const [categoriesData, trendingBooksData, newBooksData, allBooksData, slidesData, authorsData] = await Promise.all([
    getCategories().catch(() => ({ results: [] })),
    getTrendingBooks().catch(() => []),
    getNewReleases().catch(() => []),
    getBooks({ preorder: 'true' }).catch(() => ({ results: [] })),
    getHeroSlides().catch(() => ({ results: [] })),
    getAuthors().catch(() => ({ results: [] }))
  ]);

  const categories = Array.isArray(categoriesData?.results) ? categoriesData.results : (Array.isArray(categoriesData) ? categoriesData : []);
  let trendingBooks = Array.isArray(trendingBooksData?.results) ? trendingBooksData.results : (Array.isArray(trendingBooksData) ? trendingBooksData : []);
  const newBooks = Array.isArray(newBooksData?.results) ? newBooksData.results : (Array.isArray(newBooksData) ? newBooksData : []);
  const preorderBooks = Array.isArray(allBooksData?.results) ? allBooksData.results : (Array.isArray(allBooksData) ? allBooksData : []);
  const authors = Array.isArray(authorsData?.results) ? authorsData.results : (Array.isArray(authorsData) ? authorsData : []);
  
  // Filter active slides and sort by order
  let heroSlides = Array.isArray(slidesData?.results) ? slidesData.results : (Array.isArray(slidesData) ? slidesData : []);
  heroSlides = heroSlides.filter(s => s.is_active).sort((a, b) => a.order - b.order);
  
  // Pad trending books with new books if there aren't enough, to keep the UI looking full
  if (trendingBooks.length < 5 && newBooks.length > 0) {
    const existingIds = new Set(trendingBooks.map(b => b.id));
    const extraBooks = newBooks.filter(b => !existingIds.has(b.id));
    trendingBooks = [...trendingBooks, ...extraBooks].slice(0, 10);
  }
  
  // Popular authors logic
  const popularAuthors = authors.slice(0, 10);

  return (
    <>
      {/* Hero Banner */}
      <HeroSlider slides={heroSlides} />

      {/* Categories */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">বিষয় অনুযায়ী বই</h2>
            <Link href="/books" className="section-link">সকল বিষয় →</Link>
          </div>
          <div className={styles.catGrid}>
            {categories.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/books?category=${cat.slug}`}
                className={styles.catCard}
                style={{ animationDelay: `${i * 0.05}s`, '--cat-color': cat.color || '#3B82F6' }}
              >
                <span className={styles.catName}>{cat.name}</span>
                <span className={styles.catCount}>{cat.book_count || 0} বই</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* Trending Books */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">ট্রেন্ডিং বই</h2>
            <Link href="/books?sort=trending" className="section-link">সব দেখুন →</Link>
          </div>
          <div className={`grid grid-5 ${styles.bookGrid}`}>
            {trendingBooks.map((book, i) => (
              <div key={book.id} style={{ animationDelay: `${i * 0.08}s` }} className="animate-fadeInUp">
                <BookCard book={book} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Authors */}
      {popularAuthors.length > 0 && (
        <section className="section" style={{ background: '#f0fdf4' }}>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">জনপ্রিয় লেখক</h2>
              <Link href="/books" className="section-link">সকল লেখক →</Link>
            </div>
            <div className={styles.catGrid}>
              {popularAuthors.map((author, i) => (
                <Link
                  key={author.slug}
                  href={`/books?author=${author.slug}`}
                  className={styles.catCard}
                  style={{ animationDelay: `${i * 0.05}s`, '--cat-color': '#10b981' }}
                >
                  {author.image && (
                    <img src={author.image} alt={author.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px' }} />
                  )}
                  <span className={styles.catName}>{author.name}</span>
                  <span className={styles.catCount}>{author.book_count || 0} বই</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}





      {/* New Releases */}
      {newBooks.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">নতুন প্রকাশিত</h2>
              <Link href="/books?filter=new" className="section-link">সব দেখুন →</Link>
            </div>
            <div className={`grid grid-5 ${styles.bookGrid}`}>
              {newBooks.map((book, i) => (
                <div key={book.id} style={{ animationDelay: `${i * 0.08}s` }} className="animate-fadeInUp">
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}



      {/* Pre-Orders */}
      {preorderBooks.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">প্রি-অর্ডার</h2>
              <Link href="/books?filter=preorder" className="section-link">সব দেখুন →</Link>
            </div>
            <div className={`grid grid-5 ${styles.bookGrid}`}>
              {preorderBooks.map((book, i) => (
                <div key={book.id} style={{ animationDelay: `${i * 0.08}s` }} className="animate-fadeInUp">
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* View All Books Button */}
      <section style={{ textAlign: 'center', marginTop: 'var(--space-16)', paddingBottom: 'var(--space-2)' }}>
        <Link href="/books" className="btn btn-outline" style={{ borderRadius: 'var(--radius-full)', padding: '10px 32px', fontSize: '15px' }}>
          সকল বই দেখুন <span>→</span>
        </Link>
      </section>

    </>
  );
}
