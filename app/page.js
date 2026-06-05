import Link from 'next/link';
import BookCard from '@/components/BookCard';
import HeroSlider from '@/components/HeroSlider';
import OfferBanner from '@/components/OfferBanner';
import { getCategories, getTrendingBooks, getNewReleases, getBooks, getHeroSlides, getAuthors, getOfferBanners, getImageUrl } from '@/lib/api';
import styles from './page.module.css';

export default async function Home() {
  const [categoriesData, trendingBooksData, newBooksData, allBooksData, slidesData, authorsData, offerBannersData] = await Promise.all([
    getCategories().catch(() => ({ results: [] })),
    getTrendingBooks().catch(() => []),
    getNewReleases().catch(() => []),
    getBooks({ preorder: 'true' }).catch(() => ({ results: [] })),
    getHeroSlides().catch(() => ({ results: [] })),
    getAuthors().catch(() => ({ results: [] })),
    getOfferBanners().catch(() => ({ results: [] }))
  ]);

  const categories = Array.isArray(categoriesData?.results) ? categoriesData.results : (Array.isArray(categoriesData) ? categoriesData : []);
  let trendingBooks = Array.isArray(trendingBooksData?.results) ? trendingBooksData.results : (Array.isArray(trendingBooksData) ? trendingBooksData : []);
  const newBooks = Array.isArray(newBooksData?.results) ? newBooksData.results : (Array.isArray(newBooksData) ? newBooksData : []);
  const preorderBooks = Array.isArray(allBooksData?.results) ? allBooksData.results : (Array.isArray(allBooksData) ? allBooksData : []);
  const authors = Array.isArray(authorsData?.results) ? authorsData.results : (Array.isArray(authorsData) ? authorsData : []);
  
  // Filter active slides and sort by order
  let heroSlides = Array.isArray(slidesData?.results) ? slidesData.results : (Array.isArray(slidesData) ? slidesData : []);
  heroSlides = heroSlides.filter(s => s.is_active).sort((a, b) => a.order - b.order);
  
  const offerBanners = Array.isArray(offerBannersData?.results) ? offerBannersData.results : (Array.isArray(offerBannersData) ? offerBannersData : []);
  
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

      {/* Offer Banner */}
      <OfferBanner banners={offerBanners} />

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

      {/* Popular Authors — Compact Horizontal Strip */}
      {popularAuthors.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">জনপ্রিয় লেখক</h2>
              <Link href="/books" className="section-link">সকল লেখক →</Link>
            </div>
            <div className={styles.authorsStrip}>
              {popularAuthors.map((author, i) => {
                const authorImage = author.image_url || getImageUrl(author.image) || author.image;
                const initial = author.name ? author.name.trim().charAt(0) : '?';
                return (
                  <Link
                    key={author.slug}
                    href={`/books?author=${author.slug}`}
                    className={styles.authorChip}
                  >
                    <div className={styles.authorChipAvatar}>
                      {authorImage ? (
                        <img src={authorImage} alt={author.name} />
                      ) : (
                        <span className={styles.authorChipInitial}>{initial}</span>
                      )}
                    </div>
                    <span className={styles.authorChipName}>{author.name}</span>
                  </Link>
                );
              })}
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
