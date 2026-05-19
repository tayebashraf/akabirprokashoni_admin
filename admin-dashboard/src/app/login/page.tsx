'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Lock, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authApi.login(phone, password);
      login(data.access, data.refresh, data.user);
      toast.success('সফলভাবে লগইন হয়েছে!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'লগইন ব্যর্থ হয়েছে। তথ্য পরীক্ষা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 p-4">
      {/* পেছনের গ্লো ইফেক্ট */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-zinc-800/50 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
              className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <BookOpen className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold text-white" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                আকাবির প্রকাশনী
              </CardTitle>
              <CardDescription className="text-zinc-400" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                অ্যাডমিন প্যানেলে লগইন করুন
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                  ফোন নম্বর / ইউজারনেম
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    id="phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="আপনার ফোন নম্বর দিন"
                    className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                  পাসওয়ার্ড
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড দিন"
                    className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold h-11 shadow-lg shadow-emerald-500/20 transition-all duration-200"
                style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    লগইন হচ্ছে...
                  </>
                ) : (
                  'লগইন করুন'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-zinc-600 text-sm mt-6" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
          আকাবির প্রকাশনী © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
