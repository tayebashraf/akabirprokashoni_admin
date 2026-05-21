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
};

export default async function BooksPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const selectedCat = resolvedParams.category || 'all';
  const selectedAuthor = resolvedParams.author || 'all';
  const sortBy = resolvedParams.sort || 'popular';
  const viewMode = resolvedParams.view || 'grid';
  const filter = resolvedParams.filter || ''; // new, preorder, offer
  const searchQuery = resolvedParams.search || '';

  // Fetch categories and authors for sidebar
  const [categoriesResult, authorsResult] = await Promise.all([
    getCategories().catch(() => ({ results: [] })),
    getAuthors().catch(() => ({ results: [] }))
  ]);
  const categories = Array.isArray(categoriesResult?.results) ? categoriesResult.results : (Array.isArray(categoriesResult) ? categoriesResult : []);
  const authors = Array.isArray(authorsResult?.results) ? authorsResult.results : (Array.isArray(authorsResult) ? authorsResult : []);

  // Build params for API
  const apiParams = {};
  if (selectedCat !== 'all') apiParams.category = selectedCat;
  if (selectedAuthor !== 'all') apiParams.author = selectedAuthor;
  if (searchQuery) apiParams.search = searchQuery;
  if (sortBy === 'new') apiParams.new_release = 'true';
  // Note: API doesn't support 'price-low' sort natively yet, this is basic mapping
  if (filter === 'new') apiParams.new_release = 'true';
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

  return (
    <div className="container section">
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>সকল বই</h1>
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
        </div>
      </div>
    </div>
  );
}
