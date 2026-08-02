'use client';
import Link from 'next/link';
import { useFavorites } from '@/lib/FavoriteContext';
import { getImageUrl } from '@/lib/api';
import styles from './BookCard.module.css';

export default function BookCard({ book }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(book.id);

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



  const getOptimizedCloudinaryUrl = (url) => {
    if (!url) return url;
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      if (!url.includes('/upload/f_webp') && !url.includes('/upload/q_auto')) {
        return url.replace('/upload/', '/upload/f_webp,q_auto/');
      }
    }
    return url;
  };
  
  const finalCoverImage = getOptimizedCloudinaryUrl(getImageUrl(coverImage));

  return (
    <div className={styles.card}>
      {discount > 0 && (
        <span className={styles.discountBadge}>-{discount}%</span>
      )}

      <button 
        className={`${styles.favoriteBtn} ${favorited ? styles.favorited : ''}`} 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(book);
        }}
        aria-label={favorited ? "ফেভারিট থেকে বাদ দিন" : "ফেভারিটে যোগ করুন"}
      >
        <svg width="16" height="16" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      <Link href={`/books/${slug}`} className={styles.imageWrap}>
        {finalCoverImage ? (
          <img
            src={finalCoverImage}
            alt={book.cover_alt_text || title}
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

        <div className={styles.ratingRow}>
          <span className={styles.stars}>{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}</span>
          <span className={styles.ratingScore}>({reviewCount})</span>
        </div>

        <div className={styles.priceRow}>
          {originalPrice > price && (
            <span className={styles.originalPrice}>৳{originalPrice.toLocaleString()}</span>
          )}
          <span className={styles.price}>৳{price.toLocaleString()}</span>
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
