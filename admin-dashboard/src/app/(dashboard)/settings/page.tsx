'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Save, Truck, CheckCircle2, XCircle, Plug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { siteSettingsApi } from '@/lib/api';
import type { SiteSettings, SteadfastTestResult } from '@/lib/types';
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

  const testMutation = useMutation<SteadfastTestResult>({
    mutationFn: () => siteSettingsApi.testSteadfast(),
    onSuccess: (res) => {
      if (res.test_status_code === 200) {
        toast.success('Steadfast কানেকশন সফল! ✅');
      } else {
        toast.error(`Steadfast কানেকশন ব্যর্থ (স্ট্যাটাস: ${res.test_status_code ?? 'N/A'})`);
      }
    },
    onError: () => toast.error('টেস্ট রিকোয়েস্ট ব্যর্থ।'),
  });
  const testResult = testMutation.data;

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

        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardHeader>
            <CardTitle className="text-base text-zinc-300 flex items-center gap-2" style={{ fontFamily: "'Hind Siliguri'" }}>
              <Truck className="w-4 h-4 text-emerald-400" /> Steadfast কুরিয়ার API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-zinc-500" style={{ fontFamily: "'Hind Siliguri'" }}>
              পোর্টাল থেকে API Key ও Secret Key কপি করে বসান। ফাঁকা রাখলে আগের সংরক্ষিত key অপরিবর্তিত থাকবে।
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">API Key</Label>
                <Input name="steadfast_api_key" type="password" autoComplete="off"
                       placeholder={settings?.steadfast_api_key ? '•••••••• (সংরক্ষিত)' : 'API Key বসান'}
                       className="bg-zinc-800/50 border-zinc-700 text-white font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Secret Key</Label>
                <Input name="steadfast_secret_key" type="password" autoComplete="off"
                       placeholder={settings?.steadfast_secret_key ? '•••••••• (সংরক্ষিত)' : 'Secret Key বসান'}
                       className="bg-zinc-800/50 border-zinc-700 text-white font-mono" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="button" variant="outline"
                      onClick={() => testMutation.mutate()} disabled={testMutation.isPending}
                      className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-200 gap-2"
                      style={{ fontFamily: "'Hind Siliguri'" }}>
                {testMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                কানেকশন টেস্ট করুন
              </Button>
              <span className="text-xs text-zinc-500" style={{ fontFamily: "'Hind Siliguri'" }}>
                key সংরক্ষণ করার পর টেস্ট করুন
              </span>
            </div>

            {testResult && (
              <div className={`rounded-lg border p-3 text-sm space-y-1.5 ${
                testResult.test_status_code === 200
                  ? 'border-emerald-800/60 bg-emerald-950/30'
                  : 'border-red-800/60 bg-red-950/30'}`}>
                <div className="flex items-center gap-2 font-medium">
                  {testResult.test_status_code === 200
                    ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-emerald-300">কানেকশন সফল</span></>
                    : <><XCircle className="w-4 h-4 text-red-400" /><span className="text-red-300">কানেকশন ব্যর্থ</span></>}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-400 font-mono">
                  <span>Status Code:</span><span className="text-zinc-200">{testResult.test_status_code ?? 'N/A'}</span>
                  <span>API Key:</span>
                  <span className="text-zinc-200">{testResult.db_api_key_present ? `${testResult.db_api_key_first4} ✓` : 'অনুপস্থিত ✗'}</span>
                  <span>Secret Key:</span>
                  <span className="text-zinc-200">{testResult.db_secret_key_present ? `${testResult.db_secret_key_first4} ✓` : 'অনুপস্থিত ✗'}</span>
                  <span>Base URL:</span><span className="text-zinc-200 break-all">{testResult.base_url}</span>
                </div>
                {testResult.test_status_code !== 200 && (
                  <p className="text-xs text-red-300/80 pt-1" style={{ fontFamily: "'Hind Siliguri'" }}>
                    {testResult.test_status_code === 401 || testResult.test_status_code === 403
                      ? 'Key ভুল বা নিষ্ক্রিয়। পোর্টালে গিয়ে সঠিক key নিশ্চিত করুন।'
                      : 'Steadfast সার্ভার থেকে অপ্রত্যাশিত উত্তর।'}
                  </p>
                )}
              </div>
            )}
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
