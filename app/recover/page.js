import RecoverClient from './RecoverClient';

export const metadata = {
  title: 'অ্যাকাউন্ট পুনরুদ্ধার | আকাবির প্রকাশনী',
  description: 'আকাবির প্রকাশনী অ্যাকাউন্টে লগইন করতে পাসওয়ার্ড ভুলে গেছেন? ওটিপির ঝামেলা ছাড়াই আপনার নাম অথবা সর্বশেষ অর্ডার নাম্বার দিয়ে সহজে অ্যাকাউন্ট পুনরুদ্ধার করুন।',
};

export default function RecoverPage() {
  return <RecoverClient />;
}
