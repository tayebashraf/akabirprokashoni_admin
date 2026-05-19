'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check, X, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { reviewsApi } from '@/lib/api';
import type { Review } from '@/lib/types';
import { toast } from 'sonner';

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: -100, scale: 0.9, transition: { duration: 0.3 } },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, showActions }: { review: Review; showActions: boolean }) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => reviewsApi.approve(review.id),
    onSuccess: () => {
      toast.success('রিভিউ অনুমোদিত হয়েছে!');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => reviewsApi.reject(review.id),
    onSuccess: () => {
      toast.success('রিভিউ মুছে ফেলা হয়েছে।');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });

  return (
    <motion.div variants={item} layout exit="exit">
      <Card className="bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/50 transition-all">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* বই ও রিভিউয়ার তথ্য */}
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400" style={{ fontFamily: "'Hind Siliguri'" }}>
                  {review.book_title}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                  {review.customer_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white" style={{ fontFamily: "'Hind Siliguri'" }}>
                    {review.customer_name}
                  </p>
                  <StarRating rating={review.rating} />
                </div>
              </div>

              {/* মন্তব্য */}
              <p className="text-sm text-zinc-300 leading-relaxed" style={{ fontFamily: "'Hind Siliguri'" }}>
                &ldquo;{review.comment}&rdquo;
              </p>

              <p className="text-xs text-zinc-600">
                {new Date(review.created_at).toLocaleDateString('bn-BD')}
              </p>
            </div>

            {/* অ্যাকশন বাটন */}
            {showActions && (
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                  style={{ fontFamily: "'Hind Siliguri'" }}
                >
                  {approveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  অনুমোদন
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1"
                  style={{ fontFamily: "'Hind Siliguri'" }}
                >
                  {rejectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  মুছুন
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ReviewsPage() {
  const [addReviewOpen, setAddReviewOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: pendingReviews, isLoading: loadingPending } = useQuery<Review[]>({
    queryKey: ['admin-reviews', 'pending'],
    queryFn: () => reviewsApi.getAll('pending'),
  });

  const { data: approvedReviews, isLoading: loadingApproved } = useQuery<Review[]>({
    queryKey: ['admin-reviews', 'approved'],
    queryFn: () => reviewsApi.getAll('approved'),
  });

  // Get books for the dropdown
  const { data: booksData } = useQuery({
    queryKey: ['books'],
    queryFn: () => import('@/lib/api').then(m => m.booksApi.getAll({ page_size: '100' })),
  });
  const books = booksData?.results || [];

  const addReviewMutation = useMutation({
    mutationFn: (data: { book: number; customer_name: string; rating: number; comment: string }) => reviewsApi.create(data),
    onSuccess: () => {
      toast.success('রিভিউ যুক্ত হয়েছে!');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setAddReviewOpen(false);
    },
    onError: () => toast.error('রিভিউ যুক্ত করতে সমস্যা হয়েছে।'),
  });

  const handleAddReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addReviewMutation.mutate({
      book: Number(fd.get('book')),
      customer_name: fd.get('customer_name') as string,
      rating: Number(fd.get('rating')),
      comment: fd.get('comment') as string,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Hind Siliguri'" }}>⭐ রিভিউ মডারেশন</h1>
          <p className="text-zinc-500 text-sm mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>
            গ্রাহকদের রিভিউ পর্যালোচনা ও অনুমোদন করুন
          </p>
        </div>
        <Dialog open={addReviewOpen} onOpenChange={setAddReviewOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2" style={{ fontFamily: "'Hind Siliguri'" }}>
              <Star className="w-4 h-4 fill-current" /> নতুন রিভিউ যুক্ত করুন
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white" style={{ fontFamily: "'Hind Siliguri'" }}>নতুন রিভিউ যুক্ত করুন</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddReview} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>বই নির্বাচন করুন *</label>
                <select name="book" required className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="">বই নির্বাচন করুন...</option>
                  {books.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>গ্রাহকের নাম *</label>
                <input name="customer_name" required className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>রেটিং *</label>
                <select name="rating" required defaultValue="5" className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="5">৫ স্টার ⭐⭐⭐⭐⭐</option>
                  <option value="4">৪ স্টার ⭐⭐⭐⭐</option>
                  <option value="3">৩ স্টার ⭐⭐⭐</option>
                  <option value="2">২ স্টার ⭐⭐</option>
                  <option value="1">১ স্টার ⭐</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>মন্তব্য *</label>
                <textarea name="comment" required rows={3} className="flex w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y" />
              </div>
              <Button type="submit" disabled={addReviewMutation.isPending} className="w-full bg-emerald-600 hover:bg-emerald-500" style={{ fontFamily: "'Hind Siliguri'" }}>
                {addReviewMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                রিভিউ সংরক্ষণ করুন
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-zinc-900/50 border border-zinc-800/50">
          <TabsTrigger value="pending" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                       style={{ fontFamily: "'Hind Siliguri'" }}>
            অপেক্ষমাণ
            {pendingReviews && pendingReviews.length > 0 && (
              <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-0 text-xs">{pendingReviews.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                       style={{ fontFamily: "'Hind Siliguri'" }}>
            অনুমোদিত
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {loadingPending ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 bg-zinc-900/50" />)}
            </div>
          ) : !pendingReviews?.length ? (
            <div className="text-center py-20">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <p className="text-5xl mb-4">🎉</p>
              </motion.div>
              <p className="text-zinc-400 text-lg" style={{ fontFamily: "'Hind Siliguri'" }}>
                সব রিভিউ পর্যালোচনা করা হয়েছে!
              </p>
            </div>
          ) : (
            <motion.div
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
              initial="hidden" animate="show"
              className="grid gap-4"
            >
              <AnimatePresence mode="popLayout">
                {pendingReviews.map((r) => (
                  <ReviewCard key={r.id} review={r} showActions={true} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {loadingApproved ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 bg-zinc-900/50" />)}
            </div>
          ) : !approvedReviews?.length ? (
            <div className="text-center py-20">
              <p className="text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>কোনো অনুমোদিত রিভিউ নেই</p>
            </div>
          ) : (
            <motion.div
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
              initial="hidden" animate="show"
              className="grid gap-4"
            >
              {approvedReviews.map((r) => (
                <ReviewCard key={r.id} review={r} showActions={false} />
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
