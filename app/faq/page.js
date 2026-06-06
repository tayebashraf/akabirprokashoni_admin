import styles from '../page.module.css';
import Link from 'next/link';

export const metadata = {
  title: 'জিজ্ঞাসা (FAQ)',
  alternates: {
    canonical: 'https://akabirprokashoni.com/faq',
  },
};

export default function FaqPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '১. কীভাবে অর্ডার করবো?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'যেকোনো বইয়ের পেজে গিয়ে "Add to Cart" বাটনে ক্লিক করুন। এরপর ওপরের কার্ট আইকনে ক্লিক করে "Proceed to Checkout" এ গিয়ে আপনার নাম, ঠিকানা এবং ফোন নম্বর দিয়ে অর্ডার কনফার্ম করতে পারবেন।'
        }
      },
      {
        '@type': 'Question',
        name: '২. ডেলিভারি চার্জ কত?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা এবং ঢাকার বাইরে ১০০ টাকা।'
        }
      },
      {
        '@type': 'Question',
        name: '৩. আমি কি অর্ডার করার পর ট্র্যাক করতে পারবো?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'হ্যাঁ, অবশ্যই। ওয়েবসাইটের ওপরে থাকা অর্ডার ট্র্যাক করুন অপশনে গিয়ে আপনার অর্ডার আইডি দিলে অর্ডারের বর্তমান অবস্থা দেখতে পাবেন।'
        }
      },
      {
        '@type': 'Question',
        name: '৪. ভুল বই পেলে কী করবো?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'যদি ভুলবশত অন্য কোনো বই চলে যায়, তবে ডেলিভারি পাওয়ার ৩ দিনের মধ্যে আমাদের কাস্টমার সাপোর্টে কল করে অথবা ইমেইল করে জানাতে হবে। আমরা বিনা খরচে আপনার বইটি পরিবর্তন করে দেব।'
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="container section" style={{ minHeight: '60vh', padding: '40px 0' }}>
        <h1 className="section-title" style={{ marginBottom: '24px' }}>সচরাচর জিজ্ঞাসা (FAQ)</h1>
        <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: 'var(--shadow-sm)', lineHeight: '1.8' }}>
          
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--color-primary)' }}>১. কীভাবে অর্ডার করবো?</h3>
            <p style={{ marginTop: '8px' }}>
              যেকোনো বইয়ের পেজে গিয়ে "Add to Cart" বাটনে ক্লিক করুন। এরপর ওপরের কার্ট আইকনে ক্লিক করে "Proceed to Checkout" এ গিয়ে আপনার নাম, ঠিকানা এবং ফোন নম্বর দিয়ে অর্ডার কনফার্ম করতে পারবেন।
            </p>
          </div>

          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--color-primary)' }}>২. ডেলিভারি চার্জ কত?</h3>
            <p style={{ marginTop: '8px' }}>
              ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা এবং ঢাকার বাইরে ১০০ টাকা।
            </p>
          </div>

          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--color-primary)' }}>৩. আমি কি অর্ডার করার পর ট্র্যাক করতে পারবো?</h3>
            <p style={{ marginTop: '8px' }}>
              হ্যাঁ, অবশ্যই। ওয়েবসাইটের ওপরে থাকা <Link href="/track" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>অর্ডার ট্র্যাক করুন</Link> অপশনে গিয়ে আপনার অর্ডার আইডি দিলে অর্ডারের বর্তমান অবস্থা দেখতে পাবেন।
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--color-primary)' }}>৪. ভুল বই পেলে কী করবো?</h3>
            <p style={{ marginTop: '8px' }}>
              যদি ভুলবশত অন্য কোনো বই চলে যায়, তবে ডেলিভারি পাওয়ার ৩ দিনের মধ্যে আমাদের কাস্টমার সাপোর্টে কল করে অথবা ইমেইল করে জানাতে হবে। আমরা বিনা খরচে আপনার বইটি পরিবর্তন করে দেব।
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
