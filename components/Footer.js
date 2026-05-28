import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={`container ${styles.footerGrid}`}>
          {/* Brand */}
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.brandLogo}>
              <Image 
                src="/images/logo.png" 
                alt="আকাবির প্রকাশনী" 
                width={150} 
                height={50} 
                className={styles.logoImg}
              />
            </Link>
            <p className={styles.brandTagline}>জ্ঞানের আলোয় আলোকিত হোন</p>
            <p className={styles.brandDesc}>
              বাংলাদেশের বিশ্বস্ত অনলাইন বুকশপ। হাজারো বইয়ের বিশাল সংগ্রহ থেকে আপনার পছন্দের বই বেছে নিন।
            </p>
            <div className={styles.socialLinks}>
              <a href="https://www.facebook.com/profile.php?id=61571561526323&mibextid=rS40aB7S9Ucbxw6v" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={styles.socialLink}>f</a>
              <a href="https://wa.me/8801718763978" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={styles.socialLink}>w</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.footerCol}>
            <h4 className={styles.colTitle}>লিংক</h4>
            <ul className={styles.colLinks}>
              <li><Link href="/books">সকল বই</Link></li>
              <li><Link href="/books?filter=new">নতুন প্রকাশিত</Link></li>
              <li><Link href="/track">অর্ডার ট্র্যাক</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className={styles.footerCol}>
            <h4 className={styles.colTitle}>সেবা</h4>
            <ul className={styles.colLinks}>
              <li><Link href="/shipping">শিপিং পলিসি</Link></li>
              <li><Link href="/return">রিটার্ন পলিসি</Link></li>
              <li><Link href="/faq">জিজ্ঞাসা</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.footerCol}>
            <h4 className={styles.colTitle}>যোগাযোগ করুন</h4>
            <ul className={styles.colContact}>
              <li>বাংলাবাজার, ঢাকা-১১০০</li>
              <li>ফোন: +880 1718763978</li>
              <li>ইমেইল: akabirprokashoni@gmail.com</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Partners */}
      <div className={styles.paymentBar}>
        <div className={`container ${styles.paymentInner}`}>
          <span className={styles.paymentLabel}>পেমেন্ট:</span>
          <div className={styles.paymentLogos}>
            <span className={styles.paymentBadge}>Cash on Delivery</span>
            <span className={styles.paymentBadge}>bKash</span>
            <span className={styles.paymentBadge}>Nagad</span>
            <span className={styles.paymentBadge}>Visa/Mastercard</span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className={styles.copyright}>
        <div className="container">
          <p>© {new Date().getFullYear()} আকাবির প্রকাশনী।</p>
        </div>
      </div>
    </footer>
  );
}
