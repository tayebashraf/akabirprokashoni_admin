import Link from 'next/link';
import BookCard from '@/components/BookCard';
import InfiniteBookList from '@/components/InfiniteBookList';
import FilterSidebarClient from '@/components/FilterSidebarClient';
import { getBooks, getCategories, getAuthors } from '@/lib/api';
import styles from './page.module.css';

export const metadata = {
  title: 'সকল বই | ইসলামিক, দ্বীনি ও আত্মশুদ্ধির বইয়ের সংগ্রহ',
  description: 'আকাবির প্রকাশনী থেকে কিনুন সেরা সব ইসলামিক বই, দ্বীনি বই, আত্মশুদ্ধির বই এবং ইসলাহ সংক্রান্ত বই। সব ক্যাটাগরি ও লেখকের বই এখানে পাবেন।',
  keywords: ['সকল বই', 'ইসলামিক বই', 'দ্বীনি বই', 'আত্মশুদ্ধির বই', 'আত্মশুদ্ধি', 'ইসলাহ', 'Akabir Prokashoni Books', 'আকাবির প্রকাশনী বই'],
  alternates: {
    canonical: 'https://akabirprokashoni.com/books',
  },
};

export default async function BooksPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const selectedCat = resolvedParams.category || 'all';
  const selectedAuthor = resolvedParams.author || 'all';
  const sortBy = resolvedParams.sort || 'popular';
  const viewMode = resolvedParams.view || 'grid';
  const filter = resolvedParams.filter || ''; // new, preorder, offer
  const searchQuery = resolvedParams.search || '';
  const minPrice = resolvedParams.min_price || '';
  const maxPrice = resolvedParams.max_price || '';

  // Fetch categories and authors for sidebar
  const [categoriesResult, authorsResult] = await Promise.all([
    getCategories().catch(() => ({ results: [] })),
    getAuthors().catch(() => ({ results: [] }))
  ]);
  const categories = Array.isArray(categoriesResult?.results) ? categoriesResult.results : (Array.isArray(categoriesResult) ? categoriesResult : []);
  const authors = Array.isArray(authorsResult?.results) ? authorsResult.results : (Array.isArray(authorsResult) ? authorsResult : []);

  // Selected category / author objects for SEO content
  const activeCat = selectedCat !== 'all' ? categories.find(c => c.slug === selectedCat || String(c.id) === selectedCat) : null;
  const activeAuthor = selectedAuthor !== 'all' ? authors.find(a => a.slug === selectedAuthor || String(a.id) === selectedAuthor) : null;

  // Build params for API
  const apiParams = {};
  if (selectedCat !== 'all') apiParams.category = selectedCat;
  if (selectedAuthor !== 'all') apiParams.author = selectedAuthor;
  if (searchQuery) apiParams.search = searchQuery;
  if (minPrice) apiParams.min_price = minPrice;
  if (maxPrice) apiParams.max_price = maxPrice;
  if (sortBy === 'new') apiParams.new = 'true';
  if (filter === 'new') apiParams.new = 'true';
  if (filter === 'preorder') apiParams.preorder = 'true';

  // Fetch books
  const booksResult = await getBooks(apiParams).catch(() => ({ results: [] }));
  let sortedBooks = Array.isArray(booksResult?.results) ? booksResult.results : (Array.isArray(booksResult) ? booksResult : []);
  let nextUrl = booksResult?.next || null;

  // Manual sorting if API doesn't support it fully
  if (sortBy === 'price-low') sortedBooks.sort((a, b) => a.price - b.price);
  if (sortBy === 'price-high') sortedBooks.sort((a, b) => b.price - a.price);

  // Helper for generating URLs
  const getUrl = (updates) => {
    const params = new URLSearchParams(resolvedParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    return `?${params.toString()}`;
  };

  // Build CollectionPage & ItemList JSON-LD Schema
  const itemListElements = sortedBooks.slice(0, 20).map((book, index) => {
    let imgUrl = 'https://akabirprokashoni.com/default-book.png';
    const rawCover = book.cover_url || book.cover || book.cover_image;
    if (rawCover) {
      imgUrl = rawCover.startsWith('http') 
        ? rawCover 
        : `https://akabirprokashoni.com${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;
    }
    return {
      '@type': 'ListItem',
      position: index + 1,
      url: `https://akabirprokashoni.com/books/${book.slug}`,
      name: book.title,
      image: imgUrl
    };
  });

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'সকল বই | আকাবির প্রকাশনী',
    description: 'আকাবির প্রকাশনী থেকে কিনুন সেরা সব ইসলামিক বই, দ্বীনি বই, আত্মশুদ্ধির বই এবং ইসলাহ সংক্রান্ত বই।',
    url: 'https://akabirprokashoni.com/books',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: sortedBooks.length,
      itemListElement: itemListElements
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <div className="container section">
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            {activeCat ? `${activeCat.icon || '📚'} ${activeCat.name}` : activeAuthor ? `${activeAuthor.name}-এর বই` : 'সকল বই'}
          </h1>
          <p className={styles.resultCount}>({sortedBooks.length})</p>
        </div>

        <div className={styles.pageGrid}>
          {/* Sidebar Filters */}
          <FilterSidebarClient categories={categories} authors={authors} />

          {/* Books */}
          <div className={styles.booksSection}>
            <div className={styles.toolbar}>
              <div className={styles.sortGroup}>
                <label>সাজান:</label>
                <div className={styles.sortLinks}>
                  <Link href={getUrl({ sort: 'popular' })} className={sortBy === 'popular' ? styles.sortActive : ''}>জনপ্রিয়</Link>
                  <Link href={getUrl({ sort: 'new' })} className={sortBy === 'new' ? styles.sortActive : ''}>নতুন</Link>
                  <Link href={getUrl({ sort: 'price-low' })} className={sortBy === 'price-low' ? styles.sortActive : ''}>মূল্য কম</Link>
                  <Link href={getUrl({ sort: 'price-high' })} className={sortBy === 'price-high' ? styles.sortActive : ''}>মূল্য বেশি</Link>
                </div>
              </div>
              <div className={styles.viewToggle}>
                <Link href={getUrl({ view: 'grid' })} className={viewMode === 'grid' ? styles.viewActive : ''}>▦</Link>
                <Link href={getUrl({ view: 'list' })} className={viewMode === 'list' ? styles.viewActive : ''}>☰</Link>
              </div>
            </div>

            <InfiniteBookList initialBooks={sortedBooks} initialNextUrl={nextUrl} viewMode={viewMode} />

            {sortedBooks.length === 0 && (
              <div className={styles.noResults}>
                <p>এই বিষয়ে কোনো বই পাওয়া যায়নি</p>
                <Link href="/books" className="btn btn-outline">সকল বই দেখুন</Link>
              </div>
            )}

            {/* Category SEO Description */}
            {activeCat?.seo_description && (
              <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--bg-card, #f8f7f4)', borderRadius: '12px', borderLeft: '4px solid var(--color-primary, #1a5c38)' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  {activeCat.icon} {activeCat.name} সম্পর্কে
                </h2>
                <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  {activeCat.seo_description}
                </div>
              </div>
            )}

            {/* Author Bio */}
            {activeAuthor?.bio && (
              <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--bg-card, #f8f7f4)', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {activeAuthor.image_url && (
                  <img src={activeAuthor.image_url} alt={activeAuthor.name} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    লেখক পরিচিতি — {activeAuthor.name}
                  </h2>
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    {activeAuthor.bio}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
