'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/CartContext';
import { submitReview } from '@/lib/api';
import styles from './page.module.css';

export function parseFaq(faqInput) {
  if (!faqInput) return [];
  if (Array.isArray(faqInput)) return faqInput;
  
  if (typeof faqInput === 'string') {
    // 1. Try to parse as JSON after replacing smart quotes
    const cleanJson = faqInput.replace(/[\u201C\u201D\u201E\u201F]/g, '"').trim();
    if (cleanJson.startsWith('[') && cleanJson.endsWith(']')) {
      try {
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fall through to plain text parsing
      }
    }
    
    // 2. Parse as plain text (lines alternating or prefixed by Q/A, প্রশ্ন/উত্তর)
    const faqItems = [];
    const lines = faqInput.split('\n').map(l => l.trim()).filter(Boolean);
    let currentItem = null;
    
    for (let line of lines) {
      const lowerLine = line.toLowerCase();
      
      const isQuestion = 
        lowerLine.startsWith('q:') || 
        lowerLine.startsWith('q.') || 
        lowerLine.startsWith('question:') ||
        lowerLine.startsWith('প্রশ্ন') ||
        lowerLine.startsWith('প্র:') ||
        lowerLine.endsWith('?') ||
        /^[q\d\.\-]+\s*[:\.-]/i.test(line) ||
        /^(প্রশ্ন|প্র)\s*\d*\s*[:\.-]/i.test(line);
        
      const isAnswer = 
        lowerLine.startsWith('a:') || 
        lowerLine.startsWith('a.') || 
        lowerLine.startsWith('answer:') ||
        lowerLine.startsWith('উত্তর') ||
        lowerLine.startsWith('উ:') ||
        /^(a|answer|উত্তর|উ)\s*\d*\s*[:\.-]/i.test(line);
        
      if (isQuestion) {
        if (currentItem && currentItem.q && currentItem.a) {
          faqItems.push(currentItem);
        }
        const cleanQ = line.replace(/^(q|question|প্রশ্ন|প্র|q\d+|প্রশ্ন\s*\d+)\s*[:\.-]\s*/i, '').trim();
        currentItem = { q: cleanQ, a: '' };
      } else if (isAnswer && currentItem) {
        const cleanA = line.replace(/^(a|answer|উত্তর|উ|a\d+|উত্তর\s*\d+)\s*[:\.-]\s*/i, '').trim();
        currentItem.a = cleanA;
      } else {
        if (currentItem) {
          if (!currentItem.a) {
            currentItem.q = (currentItem.q + ' ' + line).trim();
          } else {
            currentItem.a = (currentItem.a + ' ' + line).trim();
          }
        } else {
          currentItem = { q: line, a: '' };
        }
      }
    }
    
    if (currentItem && currentItem.q && currentItem.a) {
      faqItems.push(currentItem);
    }
    
    return faqItems;
  }
  
  return [];
}

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

  const [copied, setCopied] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);

  const descSectionRef = useRef(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      setIsShareSupported(true);
    }
  }, []);

  const copyToClipboard = () => {
    const bookUrl = `https://akabirprokashoni.com/books/${book.slug}`;
    navigator.clipboard.writeText(bookUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
    });
  };

  const handleNativeShare = async () => {
    const bookUrl = `https://akabirprokashoni.com/books/${book.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `দ্বীনি ও ইসলামিক বইয়ের নির্ভরযোগ্য অনলাইন বুকশপ আকাবির প্রকাশনী থেকে "${book.title}" বইটি দেখুন।`,
          url: bookUrl,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    }
  };

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
      setReviewError(err.message || 'রিভিউ জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
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

  const handleReadMore = () => {
    setActiveTab('description');
    setTimeout(() => {
      if (descSectionRef.current) {
        descSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
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
    
    let base = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
      : 'http://127.0.0.1:8000';
      
    // Handle LAN testing from mobile
    if (typeof window !== 'undefined' && window.location.hostname) {
      const currentHost = window.location.hostname;
      if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
        base = base.replace('127.0.0.1', currentHost).replace('localhost', currentHost);
        if (url.startsWith('http')) {
          return url.replace('127.0.0.1', currentHost).replace('localhost', currentHost);
        }
      }
    }
    
    if (url.startsWith('http')) return url;
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getOptimizedCloudinaryUrl = (url) => {
    if (!url) return url;
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      if (!url.includes('/upload/f_webp') && !url.includes('/upload/q_auto')) {
        return url.replace('/upload/', '/upload/f_webp,q_auto/');
      }
    }
    return url;
  };

  const finalCoverImage = getOptimizedCloudinaryUrl(getFileUrl(coverImage));
  const samplePdfUrl = getFileUrl(book.sample_pdf_url || book.sample_pdf);

  // Check if sample is image (jpg/png/webp), otherwise treat as PDF since field is sample_pdf
  const isImage = samplePdfUrl && samplePdfUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/);
  const isPdf = samplePdfUrl && !isImage;

  // Convert Cloudinary PDF URL to image URL (renders specific page)
  const getPdfAsImageUrl = (url, page = 1) => {
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

  // Truncated description for inline preview
  const description = book.description || '';
  const shortDescription = description.length > 200 
    ? description.substring(0, 200) + '...' 
    : description;
  const hasLongDesc = description.length > 200;

  // Get sidebar related books cover URL
  const getRelatedBookCover = (b) => {
    const cover = b.cover_url || b.cover || b.cover_image;
    return getOptimizedCloudinaryUrl(getFileUrl(cover));
  };

  // Limit sidebar to 4 books
  const sidebarBooks = (relatedBooks || []).slice(0, 4);

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
        {/* ===== Main 3-Column Layout ===== */}
        <div className={styles.topSection}>
          {/* LEFT: Book Cover */}
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              {discount > 0 && <span className={styles.discountBadge}>{discount}% ছাড়</span>}
              {finalCoverImage ? (
                <img
                  src={finalCoverImage}
                  alt={book.cover_alt_text || title}
                  className={styles.bookCover}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <span className={styles.placeholderTitle}>{title}</span>
                </div>
              )}
            </div>
            
            {/* Buttons under image */}
            <div className={styles.imageActions}>
              {showPreviewBtn && (
                <button
                  className={styles.previewBtn}
                  onClick={() => setShowPreview(true)}
                >
                  একটু পড়ে দেখুন
                </button>
              )}
            </div>
          </div>

          {/* CENTER: Book Info */}
          <div className={styles.infoSection}>
            <h1 className={styles.bookTitle}>
              {title}
              {book.original_title && (
                <span style={{ display: 'block', fontSize: '16px', fontWeight: 500, color: '#64748b', marginTop: '4px', direction: 'rtl' }}>
                  {book.original_title}
                </span>
              )}
            </h1>

            {/* Compact Meta Info Table */}
            <table className={styles.metaTable}>
              <tbody>
                <tr>
                  <td className={styles.metaLabel}>লেখক :</td>
                  <td className={styles.metaValue}>
                    {authorName ? (
                      <Link href={`/books?author=${authorSlug}`} className={styles.metaLink}>
                        {authorName}
                      </Link>
                    ) : 'অজানা'}
                  </td>
                </tr>
                {book.publisher && (
                  <tr>
                    <td className={styles.metaLabel}>প্রকাশনী :</td>
                    <td className={styles.metaValue}>{book.publisher}</td>
                  </tr>
                )}
                <tr>
                  <td className={styles.metaLabel}>বিষয় :</td>
                  <td className={styles.metaValue}>
                    {categoryName ? (
                      <Link href={`/books?category=${categorySlug}`} className={styles.metaLink}>
                        {categoryName}
                      </Link>
                    ) : 'সাধারণ'}
                  </td>
                </tr>
                {book.pages > 0 && (
                  <tr>
                    <td className={styles.metaLabel}>পৃষ্ঠা :</td>
                    <td className={styles.metaValue}>{book.pages}</td>
                  </tr>
                )}
                {book.edition && (
                  <tr>
                    <td className={styles.metaLabel}>সংস্করণ :</td>
                    <td className={styles.metaValue}>{book.edition}</td>
                  </tr>
                )}
                {book.cover_type && (
                  <tr>
                    <td className={styles.metaLabel}>বাইন্ডিং :</td>
                    <td className={styles.metaValue}>{book.cover_type === 'hardcover' ? 'হার্ডকভার' : book.cover_type === 'paperback' ? 'পেপারব্যাক' : book.cover_type === 'spiral' ? 'স্পাইরাল' : book.cover_type}</td>
                  </tr>
                )}
                {book.publish_year && (
                  <tr>
                    <td className={styles.metaLabel}>প্রকাশসাল :</td>
                    <td className={styles.metaValue}>{book.publish_year}</td>
                  </tr>
                )}
                {book.isbn && (
                  <tr>
                    <td className={styles.metaLabel}>ISBN :</td>
                    <td className={styles.metaValue}>{book.isbn}</td>
                  </tr>
                )}
                <tr>
                  <td className={styles.metaLabel}>ভাষা :</td>
                  <td className={styles.metaValue}>
                    {book.language === 'bangla' ? 'বাংলা' : book.language === 'english' ? 'English' : 'আরবি'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Rating */}
            <div className={styles.ratingRow}>
              <div style={{ display: 'flex' }}>
                {renderStars(book.rating)}
              </div>
              <span className={styles.ratingCount}>({book.review_count || 0} রিভিউ)</span>
            </div>

            {/* Inline Short Description with Read More */}
            {description && (
              <div className={styles.inlineDesc}>
                <div className={`${styles.descText} ${hasLongDesc ? styles.descTextClamped : ''}`}>
                  {shortDescription}
                </div>
                {hasLongDesc && (
                  <button 
                    className={styles.readMoreBtn}
                    onClick={handleReadMore}
                  >
                    ...আরো পড়ুন
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Price */}
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
                  ({discount}% ছাড়)
                </span>
              )}
            </div>

            {/* Action Area */}
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

              <div className={styles.btnRow}>
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

            {/* Share Section */}
            <div className={styles.shareSection}>
              <span className={styles.shareTitle}>শেয়ার করুন:</span>
              
              {/* Facebook */}
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://akabirprokashoni.com/books/${book.slug}`)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.shareFb}
                title="ফেসবুকে শেয়ার করুন"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>

              {/* WhatsApp */}
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`*${title}* - ${authorName}\nদ্বীনি ও ইসলামিক বইয়ের নির্ভরযোগ্য অনলাইন বুকশপ আকাবির প্রকাশনী থেকে বইটি সংগ্রহ করতে ভিজিট করুন: https://akabirprokashoni.com/books/${book.slug}`)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.shareWa}
                title="হোয়াটসঅ্যাপে শেয়ার করুন"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.59 1.97 14.12 .95 11.5 1.05c-5.432 0-9.858 4.37-9.862 9.8-.001 1.748.484 3.454 1.411 4.967l-.962 3.512 3.6-.926zm12.39-3.793c-.272-.136-1.613-.797-1.863-.888-.25-.09-.432-.136-.613.136-.182.273-.705.888-.864 1.07-.159.18-.318.203-.59.067-.272-.135-1.15-.423-2.186-1.348-.806-.717-1.35-1.607-1.508-1.88-.159-.272-.017-.419.12-.556.122-.122.272-.318.408-.477.136-.16.182-.272.272-.455.09-.181.045-.34-.023-.477-.068-.136-.613-1.477-.838-2.023-.22-.53-.44-.457-.613-.466-.159-.008-.34-.01-.522-.01-.182 0-.477.067-.727.34-.25.272-.954.933-.954 2.273s.977 2.636 1.114 2.818c.136.182 1.92 2.93 4.65 4.113.65.28 1.157.447 1.553.573.654.207 1.25.177 1.719.108.524-.078 1.613-.659 1.84-1.295.228-.636.228-1.182.16-1.295-.069-.114-.25-.205-.523-.341z"/></svg>
                WhatsApp
              </a>

              {/* Telegram */}
              <a 
                href={`https://t.me/share/url?url=${encodeURIComponent(`https://akabirprokashoni.com/books/${book.slug}`)}&text=${encodeURIComponent(`*${title}* — ${authorName}`)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.shareTg}
                title="টেলিগ্রামে শেয়ার করুন"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.58.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-1 .54-1.43.53-.48-.01-1.4-.27-2.08-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.2z"/></svg>
                Telegram
              </a>

              {/* Twitter / X */}
              <a 
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://akabirprokashoni.com/books/${book.slug}`)}&text=${encodeURIComponent(`আকাবির প্রকাশনী থেকে পড়ুন "${title}" - ${authorName}`)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.shareTw}
                title="টুইটারে শেয়ার করুন"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                X
              </a>

              {/* Copy Link */}
              <button 
                type="button"
                onClick={copyToClipboard}
                className={styles.shareCopy}
                title="লিংক কপি করুন"
              >
                {copied ? (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                )}
                <span>কপি লিংক</span>
                {copied && <span className={styles.copiedTooltip}>লিংক কপি হয়েছে!</span>}
              </button>

              {/* Native System Share on Mobile */}
              {isShareSupported && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className={styles.shareNative}
                  title="অন্যান্য মাধ্যমে শেয়ার করুন"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                  <span>শেয়ার</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Related Books Sidebar */}
          {sidebarBooks.length > 0 && (
            <div className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <span className={styles.sidebarTitle}>আরো দেখুন...</span>
                <Link href="/books" className={styles.sidebarViewAll}>সবগুলো দেখুন</Link>
              </div>
              <div className={styles.sidebarBookList}>
                {sidebarBooks.map(b => {
                  const bPrice = Number(b.price) || 0;
                  const bOrigPrice = Number(b.original_price) || 0;
                  const bDiscount = bOrigPrice > bPrice ? Math.round(((bOrigPrice - bPrice) / bOrigPrice) * 100) : 0;
                  const bAuthor = Array.isArray(b.author_details) && b.author_details.length > 0
                    ? b.author_details.map(a => a.name).join(', ')
                    : b.author_name || b.author?.name || '';
                  
                  return (
                    <Link key={b.id} href={`/books/${b.slug}`} className={styles.sidebarBookCard}>
                      {getRelatedBookCover(b) ? (
                        <img
                          src={getRelatedBookCover(b)}
                          alt={b.title}
                          className={styles.sidebarBookCover}
                        />
                      ) : (
                        <div className={styles.sidebarBookCover} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999', textAlign: 'center', padding: '4px' }}>
                          {b.title}
                        </div>
                      )}
                      <div className={styles.sidebarBookInfo}>
                        <span className={styles.sidebarBookTitle}>{b.title}</span>
                        <span className={styles.sidebarBookAuthor}>{bAuthor}</span>
                        <div className={styles.sidebarBookPrice}>
                          <span className={styles.sidebarPrice}>৳{bPrice.toLocaleString('bn-BD')}</span>
                          {bOrigPrice > bPrice && (
                            <span className={styles.sidebarOrigPrice}>৳{bOrigPrice.toLocaleString('bn-BD')}</span>
                          )}
                          {bDiscount > 0 && (
                            <span className={styles.sidebarDiscount}>({bDiscount}% ছাড়)</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ===== Full Description Tabs Section ===== */}
        <div className={styles.descSection} ref={descSectionRef}>
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${activeTab === 'description' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('description')}
            >সারসংক্ষেপ</button>
            {book.table_of_contents && (
              <button
                className={`${styles.tab} ${activeTab === 'toc' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('toc')}
              >সূচিপত্র</button>
            )}
            {book.faq && (
              <button
                className={`${styles.tab} ${activeTab === 'faq' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('faq')}
              >প্রশ্ন ও উত্তর</button>
            )}
            <button
              className={`${styles.tab} ${activeTab === 'author' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('author')}
            >{(book.book_type === 'translated' || book.translator) ? 'লেখক ও অনুবাদক' : 'লেখক পরিচিতি'}</button>
            <button
              className={`${styles.tab} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('reviews')}
            >গ্রাহক রিভিউ ({book.review_count || 0})</button>
          </div>
          <div className={styles.tabContent}>
            {activeTab === 'description' && (
              <div className={styles.descriptionText}>
                <h3 className={styles.contentTitle}>বইয়ের বিবরণ</h3>
                <div className={styles.formattedText}>
                  {book.long_description ? book.long_description : (book.description || 'বিবরণ পাওয়া যায়নি।')}
                </div>
                
                {book.why_read && (
                  <div className={styles.seoBlock}>
                    <h4 className={styles.seoBlockTitle}>💡 বইটি কেন পড়বেন?</h4>
                    <div className={styles.seoBlockContent}>
                      {book.why_read.split('\n').filter(Boolean).map((line, idx) => (
                        <div key={idx} className={styles.seoBulletPoint}>
                          <span className={styles.bulletIcon}>✓</span>
                          <span className={styles.bulletText}>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {book.key_takeaways && (
                  <div className={styles.seoBlock}>
                    <h4 className={styles.seoBlockTitle}>🔑 বইটির মূল শিক্ষা</h4>
                    <div className={styles.seoBlockContent}>
                      {book.key_takeaways.split('\n').filter(Boolean).map((line, idx) => (
                        <div key={idx} className={styles.seoBulletPoint}>
                          <span className={styles.bulletIcon}>•</span>
                          <span className={styles.bulletText}>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {book.target_audience && (
                  <div className={styles.seoBlock}>
                    <h4 className={styles.seoBlockTitle}>🎯 বইটি কাদের জন্য?</h4>
                    <p className={styles.seoBlockParagraph}>{book.target_audience}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'toc' && book.table_of_contents && (
              <div className={styles.tocSection}>
                <h3 className={styles.contentTitle}>সূচিপত্র</h3>
                <div className={styles.tocList}>
                  {book.table_of_contents.split('\n').filter(Boolean).map((chapter, idx) => (
                    <div key={idx} className={styles.tocItem}>
                      <span className={styles.tocNumber}>{(idx + 1).toLocaleString('bn-BD')}.</span>
                      <span className={styles.tocText}>{chapter}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'faq' && book.faq && (() => {
              const faqItems = parseFaq(book.faq);
              return (
                <div className={styles.faqSection}>
                  <h3 className={styles.contentTitle}>প্রায়শই জিজ্ঞাসিত প্রশ্নাবলী (FAQ)</h3>
                  {faqItems.length > 0 ? (
                    <div className={styles.faqList}>
                      {faqItems.map((item, idx) => (
                        <div key={idx} className={styles.faqItem}>
                          <h4 className={styles.faqQuestion}>
                            <span className={styles.faqQBadge}>Q</span>
                            {item.q || item.question}
                          </h4>
                          <div className={styles.faqAnswer}>
                            <span className={styles.faqABadge}>A</span>
                            <span>{item.a || item.answer}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>প্রশ্নোত্তর পাওয়া যায়নি।</p>
                  )}
                </div>
              );
            })()}

            {activeTab === 'author' && (
              <div className={styles.authorBio} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h3 className={styles.contentTitle} style={{ borderBottom: '2px solid #0f766e', paddingBottom: '6px', marginBottom: '12px', display: 'inline-block' }}>লেখক পরিচিতি</h3>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#334155' }}>
                    {book.author_bio || 
                     (Array.isArray(book.author_details) && book.author_details.length > 0 ? book.author_details.map(a => a.bio).filter(Boolean).join('\n\n') : null) || 
                     book.author_details?.bio || 
                     book.author?.bio || 
                     'লেখকের তথ্য পাওয়া যায়নি।'}
                  </p>
                </div>
                {(book.book_type === 'translated' || book.translator) && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                    <h3 className={styles.contentTitle} style={{ borderBottom: '2px solid #0f766e', paddingBottom: '6px', marginBottom: '12px', display: 'inline-block' }}>অনুবাদক পরিচিতি</h3>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#334155' }}>
                      {book.translator_bio || 'অনুবাদকের তথ্য পাওয়া যায়নি।'}
                    </p>
                  </div>
                )}
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
                    আমাদের সকল রিভিউ যাচাইকৃত ক্রেতাদের থেকে প্রাপ্ত। বইটির ব্যাপারে আপনার মূল্যবান মতামত শেয়ার করুন।
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
                    <div className={styles.noReviews}>বইটির কোনো রিভিউ এখনো দেওয়া হয়নি। প্রথম রিভিউটি আপনি দিন!</div>
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
                        placeholder="যেমন: আরিয়ান রহমান"
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
                      {submittingReview ? 'জমা দেওয়া হচ্ছে...' : 'রিভিউ জমা দিন'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Books Bottom (Full width, visible on all screens) */}
      {relatedBooks?.length > 0 && (
        <section className={styles.relatedBooksBottom}>
          <div className="container">
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px' }}>সম্পর্কিত আরো বই</h2>
            <div className="grid grid-5">
              {relatedBooks.map(b => (
                <Link key={b.id} href={`/books/${b.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #e5e5e5',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}>
                    {getRelatedBookCover(b) ? (
                      <img
                        src={getRelatedBookCover(b)}
                        alt={b.title}
                        style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '3/4', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#999', padding: '12px', textAlign: 'center' }}>
                        {b.title}
                      </div>
                    )}
                    <div style={{ padding: '12px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '4px', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.title}</h3>
                      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                        {Array.isArray(b.author_details) && b.author_details.length > 0
                          ? b.author_details.map(a => a.name).join(', ')
                          : b.author_name || b.author?.name || ''}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-primary)' }}>৳{(Number(b.price) || 0).toLocaleString('bn-BD')}</span>
                        {Number(b.original_price) > Number(b.price) && (
                          <span style={{ fontSize: '12px', color: '#aaa', textDecoration: 'line-through' }}>৳{(Number(b.original_price) || 0).toLocaleString('bn-BD')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
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
                      src={getOptimizedCloudinaryUrl(getFileUrl(img.image_url || img.image))}
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
