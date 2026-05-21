'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/api';
import styles from './HeroSlider.module.css';

export default function HeroSlider({ slides }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [slides]);

  if (!slides || slides.length === 0) {
    return (
      <section className={styles.heroFallback}>
        <div className="container">
          {/* Fallback empty hero if no slides */}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.heroContainer}>
      {slides.map((slide, index) => (
        <div 
          key={slide.id}
          className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
          style={{ backgroundImage: `url(${slide.image_url || getImageUrl(slide.image) || slide.image})` }}
        >
          <div className={styles.overlay}>
            <div className="container">
              <div className={styles.content}>
                {slide.title && <h1 className={styles.title}>{slide.title}</h1>}
                {slide.subtitle && <p className={styles.subtitle}>{slide.subtitle}</p>}
                {slide.link && (
                  <Link href={slide.link} className="btn btn-primary btn-lg" style={{ marginTop: '20px' }}>
                    বিস্তারিত দেখুন
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Indicators */}
      {slides.length > 1 && (
        <div className={styles.indicators}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${index === currentSlide ? styles.activeIndicator : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
