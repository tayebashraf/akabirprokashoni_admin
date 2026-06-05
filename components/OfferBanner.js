import Link from 'next/link';
import { getImageUrl } from '@/lib/api';
import styles from './OfferBanner.module.css';

export default function OfferBanner({ banners }) {
  if (!banners || banners.length === 0) return null;

  // Find the first active banner (or use the first one if the API already filters them)
  const activeBanner = banners.find(b => b.is_active) || banners[0];

  if (!activeBanner) return null;

  const imageUrl = activeBanner.image_url || getImageUrl(activeBanner.image);

  if (!imageUrl) return null;

  const bannerContent = (
    <div className={styles.bannerWrapper}>
      <img 
        src={imageUrl} 
        alt={activeBanner.title || "Special Offer"} 
        className={styles.bannerImage}
        loading="lazy"
      />
    </div>
  );

  return (
    <section className="section" style={{ padding: '0', marginBottom: 'var(--space-8)' }}>
      <div className="container">
        {activeBanner.link ? (
          <Link href={activeBanner.link} className={styles.bannerLink}>
            {bannerContent}
          </Link>
        ) : (
          bannerContent
        )}
      </div>
    </section>
  );
}
