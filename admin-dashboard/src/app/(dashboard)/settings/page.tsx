'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Settings, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { siteSettingsApi } from '@/lib/api';
import type { SiteSettings } from '@/lib/types';
import { toast } from 'sonner';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ['site-settings'],
    queryFn: siteSettingsApi.get,
  });

  const updateMutation = useMutation({
    mutationFn: (fd: FormData) => siteSettingsApi.update(fd),
    onSuccess: () => {
      toast.success('সেটিংস আপডেট হয়েছে!');
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
    onError: () => toast.error('আপডেট ব্যর্থ।'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate(fd);
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 bg-zinc-900/50" />)}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Hind Siliguri'" }}>⚙️ সাইট সেটিংস</h1>
        <p className="text-zinc-500 text-sm mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>ওয়েবসাইটের মূল তথ্য পরিবর্তন করুন</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardHeader><CardTitle className="text-base text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>প্রাথমিক তথ্য</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>সাইটের নাম</Label>
                <Input name="site_name" defaultValue={settings?.site_name} className="bg-zinc-800/50 border-zinc-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>ট্যাগলাইন</Label>
                <Input name="site_tagline" defaultValue={settings?.site_tagline} className="bg-zinc-800/50 border-zinc-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>ফোন</Label>
                <Input name="phone" defaultValue={settings?.phone} className="bg-zinc-800/50 border-zinc-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>ইমেইল</Label>
                <Input name="email" type="email" defaultValue={settings?.email} className="bg-zinc-800/50 border-zinc-700 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>ঠিকানা</Label>
              <Textarea name="address" defaultValue={settings?.address} rows={2} className="bg-zinc-800/50 border-zinc-700 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardHeader><CardTitle className="text-base text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>সোশ্যাল মিডিয়া</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Facebook URL</Label>
              <Input name="facebook_url" defaultValue={settings?.facebook_url} className="bg-zinc-800/50 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">YouTube URL</Label>
              <Input name="youtube_url" defaultValue={settings?.youtube_url} className="bg-zinc-800/50 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Instagram URL</Label>
              <Input name="instagram_url" defaultValue={settings?.instagram_url} className="bg-zinc-800/50 border-zinc-700 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardHeader><CardTitle className="text-base text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>অন্যান্য</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>ফুটার টেক্সট</Label>
              <Textarea name="footer_text" defaultValue={settings?.footer_text} rows={2} className="bg-zinc-800/50 border-zinc-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>ঘোষণা ব্যানার</Label>
              <Input name="announcement" defaultValue={settings?.announcement} className="bg-zinc-800/50 border-zinc-700 text-white" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 gap-2"
                style={{ fontFamily: "'Hind Siliguri'" }}>
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          সংরক্ষণ করুন
        </Button>
      </form>
    </motion.div>
  );
}
