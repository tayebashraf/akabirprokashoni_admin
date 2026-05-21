'use client';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import styles from './BookCard.module.css';

export default function BookCard({ book }) {
  const { addToCart } = useCart();

  // Normalize API field names (handle both API formats)
  const title = book.title || '';
  const slug = book.slug || '';
  const authorName = book.author_name || book.author?.name || book.author || '';
  const price = Number(book.price) || 0;
  const originalPrice = Number(book.original_price || book.originalPrice) || 0;
  const coverImage = book.cover_url || book.cover || book.cover_image || book.coverImage || null;
  const rating = Number(book.rating) || 0;
  const reviewCount = Number(book.review_count || book.reviewCount) || 0;
  const discount = book.discount || (originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0);

  // Ensure image URL is absolute and uses correct host
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;  // Already absolute
    // Relative path: prepend API base
    const base = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
      : 'http://127.0.0.1:8000';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };
  
  const finalCoverImage = getImageUrl(coverImage);

  return (
    <div className={styles.card}>
      {discount > 0 && (
        <span className={styles.discountBadge}>-{discount}%</span>
      )}

      <Link href={`/books/${slug}`} className={styles.imageWrap}>
        {finalCoverImage ? (
          <img
            src={finalCoverImage}
            alt={title}
            className={styles.coverImg}
            loading="lazy"
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className={styles.placeholderTitle}>{title}</span>
          </div>
        )}
      </Link>

      <div className={styles.info}>
        <Link href={`/books/${slug}`} className={styles.title}>
          {title}
        </Link>
        {authorName && (
          <span className={styles.author}>{authorName}</span>
        )}

        <div className={styles.priceRow}>
          <span className={styles.price}>৳{price.toLocaleString()}</span>
          {originalPrice > price && (
            <span className={styles.originalPrice}>৳{originalPrice.toLocaleString()}</span>
          )}
        </div>

        <Link
          href={`/books/${slug}`}
          className={styles.addBtn}
          style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}
        >
          বিস্তারিত দেখুন
        </Link>
      </div>
    </div>
  );
}
