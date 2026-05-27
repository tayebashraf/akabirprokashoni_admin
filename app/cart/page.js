'use client';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import styles from './page.module.css';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalItems, totalPrice, isLoaded } = useCart();
  const deliveryCharge = totalPrice >= 500 ? 0 : 60;
  const grandTotal = totalPrice + deliveryCharge;

  if (!isLoaded) return <div className="container section"><p>লোড হচ্ছে...</p></div>;

  return (
    <div className="container section">
      <h1 className={styles.pageTitle}>🛒 শপিং কার্ট</h1>

      {cart.length === 0 ? (
        <div className={styles.emptyCart}>
          <span className={styles.emptyIcon}>🛒</span>
          <h2>আপনার কার্ট খালি</h2>
          <p>পছন্দের বই কার্টে যোগ করুন</p>
          <Link href="/books" className="btn btn-primary btn-lg">
            বই দেখুন →
          </Link>
        </div>
      ) : (
        <div className={styles.cartGrid}>
          {/* Cart Items */}
          <div className={styles.cartItems}>
            <div className={styles.cartHeader}>
              <span>বই ({totalItems} টি)</span>
              <span>মূল্য</span>
            </div>

            {cart.map(item => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  {item.coverImage ? (
                    <img src={item.coverImage} alt={item.title} />
                  ) : (
                    <span style={{ fontSize: '2.5rem' }}>📖</span>
                  )}
                </div>
                <div className={styles.itemInfo}>
                  <Link href={`/books/${item.slug}`} className={styles.itemTitle}>
                    {item.title}
                  </Link>
                  <p className={styles.itemAuthor}>{item.author}</p>
                  <div className={styles.itemActions}>
                    <div className="quantity-control">
                      <button className="quantity-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <input className="quantity-value" value={item.quantity} readOnly />
                      <button className="quantity-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>
                      🗑️ মুছুন
                    </button>
                  </div>
                </div>
                <div className={styles.itemPrice}>
                  <span className={styles.itemCurrentPrice}>৳{(item.price * item.quantity).toLocaleString()}</span>
                  {item.originalPrice > item.price && (
                    <span className={styles.itemOriginalPrice}>৳{(item.originalPrice * item.quantity).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>অর্ডার সামারি</h3>

              <div className={styles.summaryRow}>
                <span>মোট মূল্য ({totalItems} টি বই)</span>
                <span>৳{totalPrice.toLocaleString()}</span>
              </div>

              <div className={styles.summaryRow}>
                <span>ডেলিভারি চার্জ</span>
                <span className={deliveryCharge === 0 ? styles.freeDelivery : ''}>
                  {deliveryCharge === 0 ? 'ফ্রি!' : `৳${deliveryCharge}`}
                </span>
              </div>

              <div className={styles.summaryDivider} />

              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>সর্বমোট</span>
                <span>৳{grandTotal.toLocaleString()}</span>
              </div>

              <Link href="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-4)' }}>
                চেকআউট করুন →
              </Link>

              <Link href="/books" className={styles.continueLink}>
                ← আরও বই দেখুন
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
