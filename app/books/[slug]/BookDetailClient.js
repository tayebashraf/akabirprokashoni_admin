'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/CartContext';
import BookCard from '@/components/BookCard';
import { submitReview } from '@/lib/api';
import styles from './page.module.css';

export default function BookDetailClient({ book, relatedBooks }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [addedToCart, setAddedToCart] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState(null);
  const [reviewError, setReviewError] = useState(null);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      setReviewError('নাম এবং মন্তব্য আবশ্যক।');
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    setReviewMessage(null);
    try {
      await submitReview(book.slug, {
        customer_name: reviewName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      setReviewMessage('রিভিউ সফলভাবে জমা দেওয়া হয়েছে এবং অনুমোদনের অপেক্ষায় আছে। ধন্যবাদ!');
      setReviewName('');
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      setReviewError(err.message || 'রিভিউ জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (score) => {
    const stars = [];
    const val = Math.round(score || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= val ? '#f39c12' : '#ccc', fontSize: '18px', marginRight: '2px' }}>
          ★
        </span>
      );
    }
    return stars;
  };

  const renderInteractiveStars = () => {
    return (
      <div style={{ display: 'flex', gap: '8px', fontSize: '24px', cursor: 'pointer', margin: '8px 0' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setReviewRating(star)}
            style={{ color: star <= reviewRating ? '#f39c12' : '#ccc' }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (!book) return null;

  // Normalize API fields
  const title = book.title || '';
  const price = Number(book.price) || 0;
  const originalPrice = Number(book.original_price) || 0;
  const coverImage = book.cover_url || book.cover || book.cover_image || null;
  let authorName = book.author_name || book.author?.name || '';
  let authorSlug = book.author?.slug || '';
  
  if (Array.isArray(book.author_details) && book.author_details.length > 0) {
    authorName = book.author_details.map(a => a.name).join(', ');
    authorSlug = book.author_details[0].slug;
  }
  const categoryName = book.category_details?.name || book.category?.name || book.category_name || '';
  const categorySlug = book.category_details?.slug || book.category?.slug || '';
  const stock = book.stock || 0;
  const discount = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // Ensure image URL is absolute and uses correct host
  const getFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
      : 'http://127.0.0.1:8000';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };
  const finalCoverImage = getFileUrl(coverImage);
  const samplePdfUrl = getFileUrl(book.sample_pdf_url || book.sample_pdf);

  // Check if sample is image (jpg/png/webp), otherwise treat as PDF since field is sample_pdf
  const isImage = samplePdfUrl && samplePdfUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/);
  const isPdf = samplePdfUrl && !isImage;

  // Convert Cloudinary PDF URL to image URL (renders specific page)
  const getPdfAsImageUrl = (url, page = 1) => {
    // Keep this for backwards compatibility if any old PDFs exist
    if (!url) return null;
    if (!url.includes('cloudinary.com')) return url;
    let imgUrl = url.replace('/raw/upload/', '/image/upload/');
    if (imgUrl.includes('/upload/v')) {
      imgUrl = imgUrl.replace('/upload/v', `/upload/pg_${page}/v`);
    } else {
      imgUrl = imgUrl.replace('/upload/', `/upload/pg_${page}/`);
    }
    if (imgUrl.toLowerCase().includes('.pdf')) {
      imgUrl = imgUrl.replace(/\.pdf($|\?)/i, '.jpg$1');
    } else {
      if (imgUrl.includes('?')) imgUrl = imgUrl.replace('?', '.jpg?');
      else imgUrl += '.jpg';
    }
    return imgUrl;
  };
  
  const sampleImages = book.images || [];
  const hasSampleImages = sampleImages.length > 0;
  const showPreviewBtn = hasSampleImages || samplePdfUrl;

  const handleAddToCart = () => {
    addToCart({
      id: book.id,
      title: title,
      price: price,
      coverImage: finalCoverImage,
      author: authorName,
      slug: book.slug,
      weight: book.weight || 0
    }, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart({
      id: book.id,
      title: title,
      price: price,
      coverImage: finalCoverImage,
      author: authorName,
      slug: book.slug,
      weight: book.weight || 0
    }, quantity);
    router.push('/checkout');
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <div className="container">
          <Link href="/">হোম</Link>
          <span className={styles.separator}>/</span>
          <Link href="/books">সকল বই</Link>
          {categoryName && (
            <>
              <span className={styles.separator}>/</span>
              <Link href={`/books?category=${categorySlug}`}>{categoryName}</Link>
            </>
          )}
          <span className={styles.separator}>/</span>
          <span className={styles.breadcrumbCurrent}>{title}</span>
        </div>
      </nav>

      <div className="container">
        <div className={styles.detailGrid}>
          {/* Left: Book Cover */}
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              {discount > 0 && <span className={styles.discountBadge}>{discount}% ছাড়</span>}
              {finalCoverImage ? (
                <img
                  src={finalCoverImage}
                  alt={title}
                  className={styles.bookCover}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <span className={styles.placeholderTitle}>{title}</span>
                </div>
              )}
            </div>

            {/* "একটু পড়ে দেখুন" Button */}
            {showPreviewBtn && (
              <button
                className={styles.previewBtn}
                onClick={() => setShowPreview(true)}
              >
                একটু পড়ে দেখুন
              </button>
            )}
          </div>

          {/* Right: Book Info */}
          <div className={styles.infoSection}>
            <h1 className={styles.bookTitle}>{title}</h1>

            <div className={styles.metaInfoRow}>
              <div style={{ fontSize: '16px', color: '#444' }}>
                <span style={{ color: '#555' }}>লেখক: </span>
                {authorName ? (
                  <Link href={`/books?author=${authorSlug}`} className={styles.authorLink}>
                    {authorName}
                  </Link>
                ) : 'অজানা'}
              </div>

              <div style={{ fontSize: '16px', color: '#444' }}>
                <span style={{ color: '#555' }}>বিষয়: </span>
                {categoryName ? (
                  <Link href={`/books?category=${categorySlug}`} className={styles.authorLink}>
                    {categoryName}
                  </Link>
                ) : 'সাধারণ'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ display: 'flex' }}>
                  {renderStars(book.rating)}
                </div>
                <span style={{ color: '#777', fontSize: '14px', marginLeft: '4px' }}>({book.review_count || 0} রিভিউ)</span>
              </div>
            </div>

            <div className={styles.priceBlock}>
              <span className={styles.currentPrice}>
                ৳{price.toLocaleString('bn-BD')}
              </span>
              {originalPrice > price && (
                <span className={styles.originalPrice}>
                  ৳{originalPrice.toLocaleString('bn-BD')}
                </span>
              )}
              {discount > 0 && (
                <span className={styles.saveBadge}>
                  ({discount}% ছাড়)
                </span>
              )}
            </div>

            {/* Action Area Card */}
            <div className={styles.actionArea}>
              <div className={styles.quantityRow}>
                <span className={styles.qtyLabel}>পরিমাণ:</span>
                <div className={styles.qtyControl}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
                
                <div className={styles.stockInfo}>
                  {stock > 0 ? (
                    <span className={styles.inStock}>● স্টকে আছে</span>
                  ) : (
                    <span className={styles.outOfStock}>● স্টক শেষ</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={handleAddToCart}
                  disabled={stock <= 0}
                  className={styles.cartBtn}
                >
                  {addedToCart ? '✓ যোগ করা হয়েছে' : 'কার্টে যোগ করুন'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={stock <= 0}
                  className={styles.buyBtn}
                >
                  এখনই কিনুন
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className={styles.trustBadges}>
              <div className={styles.badgeItem}>
                <span className={styles.badgeIcon}>🚚</span>
                <span>সারা দেশে ক্যাশ অন ডেলিভারি</span>
              </div>
              <div className={styles.badgeItem}>
                <span className={styles.badgeIcon}>🛡️</span>
                <span>১০০% অরিজিনাল বই</span>
              </div>
              <div className={styles.badgeItem}>
                <span className={styles.badgeIcon}>🔄</span>
                <span>৩ দিনে সহজ রিটার্ন সুবিধা</span>
              </div>
            </div>

            {/* Specs Table Shown Inline */}
            <div className={styles.specsTable}>
              <h3 className={styles.specsTitle}>বইয়ের বিবরণ</h3>
              <table className={styles.specTable}>
                <tbody>
                  <tr>
                    <td className={styles.specLabel}>শিরোনাম</td>
                    <td className={styles.specValue}>{title}</td>
                  </tr>
                  <tr>
                    <td className={styles.specLabel}>লেখক</td>
                    <td className={styles.specValue}>
                      {authorName ? (
                        <Link href={`/books?author=${authorSlug}`} className={styles.specLink}>
                          {authorName}
                        </Link>
                      ) : 'অজানা'}
                    </td>
                  </tr>
                  {book.publisher && (
                    <tr>
                      <td className={styles.specLabel}>প্রকাশক</td>
                      <td className={styles.specValue}>{book.publisher}</td>
                    </tr>
                  )}
                  {book.isbn && (
                    <tr>
                      <td className={styles.specLabel}>ISBN</td>
                      <td className={styles.specValue}>{book.isbn}</td>
                    </tr>
                  )}
                  {book.edition && (
                    <tr>
                      <td className={styles.specLabel}>সংস্করণ</td>
                      <td className={styles.specValue}>{book.edition}</td>
                    </tr>
                  )}
                  {book.pages > 0 && (
                    <tr>
                      <td className={styles.specLabel}>পৃষ্ঠা সংখ্যা</td>
                      <td className={styles.specValue}>{book.pages}</td>
                    </tr>
                  )}
                  <tr>
                    <td className={styles.specLabel}>ভাষা</td>
                    <td className={styles.specValue}>
                      {book.language === 'bangla' ? 'বাংলা' : book.language === 'english' ? 'English' : 'আরবি'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Share Section */}
            <div className={styles.shareSection}>
              <span className={styles.shareTitle}>শেয়ার করুন:</span>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer" className={styles.shareFb}>
                Facebook
              </a>
              <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`} target="_blank" rel="noopener noreferrer" className={styles.shareWa}>
                WhatsApp
              </a>
            </div>

          </div>
        </div>

        {/* Description Tabs */}
        <div className={styles.descSection}>
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${activeTab === 'description' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('description')}
            >সারসংক্ষেপ</button>
            <button
              className={`${styles.tab} ${activeTab === 'author' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('author')}
            >লেখক পরিচিতি</button>
            <button
              className={`${styles.tab} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('reviews')}
            >গ্রাহক রিভিউ ({book.review_count || 0})</button>
          </div>
          <div className={styles.tabContent}>
            {activeTab === 'description' && (
              <div className={styles.descriptionText}>
                <h3 className={styles.contentTitle}>সারসংক্ষেপ</h3>
                <p>{book.description || 'বিবরণ পাওয়া যায়নি।'}</p>
              </div>
            )}

            {activeTab === 'author' && (
              <div className={styles.authorBio}>
                <h3 className={styles.contentTitle}>লেখক পরিচিতি</h3>
                <p>{book.author_bio || book.author_details?.bio || book.author?.bio || 'লেখকের তথ্য পাওয়া যায়নি।'}</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className={styles.reviewsTab}>
                <h3 className={styles.contentTitle}>গ্রাহক রিভিউ ও রেটিং</h3>
                
                {/* Rating Summary */}
                <div className={styles.ratingSummaryCard}>
                  <div className={styles.ratingSummaryScore}>
                    <div className={styles.averageScore}>{book.rating || '0.0'}</div>
                    <div className={styles.averageStars}>{renderStars(book.rating)}</div>
                    <div className={styles.totalReviewsCount}>{book.review_count || 0}টি রিভিউ</div>
                  </div>
                  <div className={styles.ratingInfoText}>
                    আমাদের সকল রিভিউ যাচাইকৃত ক্রেতাদের থেকে প্রাপ্ত। বইটির ব্যাপারে আপনার মূল্যবান মতামত শেয়ার করুন।
                  </div>
                </div>

                {/* Reviews List */}
                <div className={styles.reviewsList}>
                  {Array.isArray(book.reviews) && book.reviews.length > 0 ? (
                    book.reviews.map((rev, idx) => (
                      <div key={rev.id || idx} className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                          <span className={styles.reviewAuthor}>{rev.customer_name}</span>
                          <span className={styles.reviewDate}>
                            {rev.created_at ? new Date(rev.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                          </span>
                        </div>
                        <div className={styles.reviewStars}>{renderStars(rev.rating)}</div>
                        <p className={styles.reviewComment}>{rev.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noReviews}>বইটির কোনো রিভিউ এখনো দেওয়া হয়নি। প্রথম রিভিউটি আপনি দিন!</div>
                  )}
                </div>

                {/* Review Form */}
                <div className={styles.reviewFormContainer}>
                  <h4 className={styles.formTitle}>রিভিউ লিখুন</h4>
                  {reviewMessage && <div className={styles.successAlert}>{reviewMessage}</div>}
                  {reviewError && <div className={styles.errorAlert}>{reviewError}</div>}
                  
                  <form onSubmit={handleReviewSubmit} className={styles.reviewForm}>
                    <div className={styles.formGroup}>
                      <label>আপনার নাম:</label>
                      <input
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        className={styles.formInput}
                        placeholder="যেমন: আরিয়ান রহমান"
                        required
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>রেটিং দিন:</label>
                      {renderInteractiveStars()}
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>আপনার মতামত:</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className={styles.formTextarea}
                        placeholder="বইটি কেমন লেগেছে? আপনার অনুভূতি বিস্তারিত লিখুন..."
                        rows={4}
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className={styles.submitReviewBtn}
                    >
                      {submittingReview ? 'জমা দেওয়া হচ্ছে...' : 'রিভিউ জমা দিন'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Books */}
      {relatedBooks?.length > 0 && (
        <section style={{ marginTop: '48px', padding: '48px 0', background: '#f1f5f9' }}>
          <div className="container">
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px' }}>সম্পর্কিত বই</h2>
            <div className="grid grid-5">
              {relatedBooks.map(b => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          </div>
        </section>
      )}


      {/* Preview Modal */}
      {showPreview && showPreviewBtn && (
        <div className={styles.modalOverlay} onClick={() => setShowPreview(false)}>
          <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>একটু পড়ে দেখুন — {title}</h3>
              <button className={styles.modalClose} onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {hasSampleImages ? (
                <div className={styles.pdfPagesWrap}>
                  {sampleImages.map((img, idx) => (
                    <img
                      key={img.id || idx}
                      src={getFileUrl(img.image)}
                      alt={`${title} - পৃষ্ঠা ${idx + 1}`}
                      className={styles.pdfPageImage}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ))}
                </div>
              ) : isPdf ? (
                <div className={styles.pdfPagesWrap}>
                  {[1, 2, 3, 4].map(page => (
                    <img
                      key={page}
                      src={getPdfAsImageUrl(samplePdfUrl, page)}
                      alt={`${title} - পৃষ্ঠা ${page}`}
                      className={styles.pdfPageImage}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.modalImageWrap}>
                  <img
                    src={samplePdfUrl}
                    alt={`${title} - একটু পড়ে দেখুন`}
                    className={styles.modalImage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
