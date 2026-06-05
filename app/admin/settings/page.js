'use client';
import { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSettings, testSteadfastConnection } from '@/lib/api';
import styles from './page.module.css'; // Reusing similar CSS

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyStatus, setKeyStatus] = useState({ api_set: false, secret_set: false });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [formData, setFormData] = useState({
    site_name: '', site_tagline: '', phone: '', email: '', address: '',
    facebook_url: '', youtube_url: '', instagram_url: '',
    footer_text: '', announcement: '',
    delivery_charge_dhaka: 60, delivery_charge_outside: 120,
    extra_charge_per_kg_dhaka: 15, extra_charge_per_kg_outside: 20,
    steadfast_api_key: '', steadfast_secret_key: ''
  });
  const [files, setFiles] = useState({
    logo: null,
    favicon: null
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getSiteSettings();
      if (data) {
        setFormData({
          site_name: data.site_name || '',
          site_tagline: data.site_tagline || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          facebook_url: data.facebook_url || '',
          youtube_url: data.youtube_url || '',
          instagram_url: data.instagram_url || '',
          footer_text: data.footer_text || '',
          announcement: data.announcement || '',
          delivery_charge_dhaka: data.delivery_charge_dhaka !== undefined ? data.delivery_charge_dhaka : 60,
          delivery_charge_outside: data.delivery_charge_outside !== undefined ? data.delivery_charge_outside : 120,
          extra_charge_per_kg_dhaka: data.extra_charge_per_kg_dhaka !== undefined ? data.extra_charge_per_kg_dhaka : 15,
          extra_charge_per_kg_outside: data.extra_charge_per_kg_outside !== undefined ? data.extra_charge_per_kg_outside : 20,
          steadfast_api_key: '',
          steadfast_secret_key: ''
        });
        setKeyStatus({
          api_set: !!data.steadfast_api_key_set,
          secret_set: !!data.steadfast_secret_key_set,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList.length > 0) {
      setFiles(prev => ({ ...prev, [name]: fileList[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        // Steadfast keys are write-only on the backend, so they always load
        // empty here. Only send them when the admin actually typed a value,
        // otherwise an empty submit would wipe the saved key (-> 401 Unauthorized).
        if (key === 'steadfast_api_key' || key === 'steadfast_secret_key') {
          const trimmed = (formData[key] || '').trim();
          if (trimmed) data.append(key, trimmed);
          return;
        }
        data.append(key, formData[key]);
      });
      
      if (files.logo) data.append('logo', files.logo);
      if (files.favicon) data.append('favicon', files.favicon);

      await updateSiteSettings(data);
      // Optimistically mark keys as set if the admin just typed them, so the
      // status reflects reality even if the refetch is served from cache.
      setKeyStatus(prev => ({
        api_set: prev.api_set || !!(formData.steadfast_api_key || '').trim(),
        secret_set: prev.secret_set || !!(formData.steadfast_secret_key || '').trim(),
      }));
      setTestResult(null);
      alert('সাইট সেটিংস সফলভাবে আপডেট হয়েছে!');
      fetchData();
    } catch (error) {
      alert(`সমস্যা হয়েছে: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSteadfastConnection();
      setTestResult(res);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>লোড হচ্ছে...</div>;

  return (
    <>
      <div className={styles.topBar}>
        <h1>⚙️ সাইট সেটিংস</h1>
      </div>

      <div className={styles.tableCard} style={{ padding: '30px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>সাধারণ তথ্য</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label>ওয়েবসাইটের নাম *</label>
              <input type="text" name="site_name" required value={formData.site_name} onChange={handleInputChange} className="form-control" />
            </div>
            <div>
              <label>ট্যাগলাইন</label>
              <input type="text" name="site_tagline" value={formData.site_tagline} onChange={handleInputChange} className="form-control" />
            </div>
            <div>
              <label>লোগো (নতুন দিলে আপডেট হবে)</label>
              <input type="file" name="logo" accept="image/*" onChange={handleFileChange} className="form-control" />
            </div>
            <div>
              <label>ফেভিকন (নতুন দিলে আপডেট হবে)</label>
              <input type="file" name="favicon" accept="image/*" onChange={handleFileChange} className="form-control" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>অ্যানাউন্সমেন্ট (ওয়েবসাইটের উপরের নোটিশ)</label>
              <input type="text" name="announcement" value={formData.announcement} onChange={handleInputChange} className="form-control" />
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '20px' }}>যোগাযোগের মাধ্যম</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label>ফোন নম্বর</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="form-control" />
            </div>
            <div>
              <label>ইমেইল</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-control" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>ঠিকানা</label>
              <textarea name="address" value={formData.address} onChange={handleInputChange} className="form-control" rows="2"></textarea>
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '20px' }}>সোশ্যাল মিডিয়া</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div>
              <label>Facebook URL</label>
              <input type="url" name="facebook_url" value={formData.facebook_url} onChange={handleInputChange} className="form-control" />
            </div>
            <div>
              <label>YouTube URL</label>
              <input type="url" name="youtube_url" value={formData.youtube_url} onChange={handleInputChange} className="form-control" />
            </div>
            <div>
              <label>Instagram URL</label>
              <input type="url" name="instagram_url" value={formData.instagram_url} onChange={handleInputChange} className="form-control" />
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '20px' }}>🚚 ডেলিভারি চার্জ</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
            <div>
              <label>ঢাকার ভিতরে (প্রথম ১ কেজি)</label>
              <input type="number" name="delivery_charge_dhaka" value={formData.delivery_charge_dhaka} onChange={handleInputChange} className="form-control" />
            </div>
            <div>
              <label>ঢাকার বাইরে (প্রথম ১ কেজি)</label>
              <input type="number" name="delivery_charge_outside" value={formData.delivery_charge_outside} onChange={handleInputChange} className="form-control" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label>ঢাকায় অতিরিক্ত প্রতি কেজি (৳)</label>
              <input type="number" name="extra_charge_per_kg_dhaka" value={formData.extra_charge_per_kg_dhaka} onChange={handleInputChange} className="form-control" />
            </div>
            <div>
              <label>ঢাকার বাইরে অতিরিক্ত প্রতি কেজি (৳)</label>
              <input type="number" name="extra_charge_per_kg_outside" value={formData.extra_charge_per_kg_outside} onChange={handleInputChange} className="form-control" />
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '20px' }}>🚚 SteadFast API কনফিগারেশন</h3>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 5px' }}>
            পোর্টাল থেকে Key কপি করে বসিয়ে সেভ করুন। সেভ করার পর নিরাপত্তার জন্য ফিল্ড খালি দেখাবে — এটাই স্বাভাবিক।
            নিচের স্ট্যাটাস ও <b>টেস্ট</b> বাটন দিয়ে নিশ্চিত করুন।
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label>
                Steadfast API Key{' '}
                <span style={{ fontSize: '12px', fontWeight: 600, color: keyStatus.api_set ? '#16a34a' : '#dc2626' }}>
                  {keyStatus.api_set ? '✓ সংরক্ষিত আছে' : '✗ সেট করা নেই'}
                </span>
              </label>
              <input type="text" name="steadfast_api_key" value={formData.steadfast_api_key} onChange={handleInputChange} className="form-control" placeholder="নতুন কী দিন (খালি রাখলে আগেরটি থাকবে)" />
            </div>
            <div>
              <label>
                Steadfast Secret Key{' '}
                <span style={{ fontSize: '12px', fontWeight: 600, color: keyStatus.secret_set ? '#16a34a' : '#dc2626' }}>
                  {keyStatus.secret_set ? '✓ সংরক্ষিত আছে' : '✗ সেট করা নেই'}
                </span>
              </label>
              <input type="text" name="steadfast_secret_key" value={formData.steadfast_secret_key} onChange={handleInputChange} className="form-control" placeholder="নতুন কী দিন (খালি রাখলে আগেরটি থাকবে)" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '5px' }}>
            <button type="button" onClick={handleTestConnection} disabled={testing}
                    className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              {testing ? 'টেস্ট হচ্ছে...' : '🔌 কানেকশন টেস্ট করুন'}
            </button>
            <span style={{ fontSize: '12px', color: '#888' }}>Key সেভ করার পর টেস্ট করুন</span>
          </div>
          {testResult && (
            <div style={{
              marginTop: '10px', padding: '12px 15px', borderRadius: '8px', fontSize: '13px',
              border: `1px solid ${testResult.test_status_code === 200 ? '#86efac' : '#fca5a5'}`,
              background: testResult.test_status_code === 200 ? '#f0fdf4' : '#fef2f2',
            }}>
              {testResult.error ? (
                <div style={{ color: '#dc2626', fontWeight: 600 }}>❌ {testResult.error}</div>
              ) : (
                <>
                  <div style={{ fontWeight: 700, color: testResult.test_status_code === 200 ? '#15803d' : '#b91c1c' }}>
                    {testResult.test_status_code === 200 ? '✅ কানেকশন সফল' : '❌ কানেকশন ব্যর্থ'}
                  </div>
                  <div style={{ marginTop: '6px', color: '#444', lineHeight: 1.8, fontFamily: 'monospace', fontSize: '12px' }}>
                    Status Code: <b>{testResult.test_status_code ?? 'N/A'}</b><br />
                    API Key: {testResult.db_api_key_present ? `${testResult.db_api_key_first4} ✓` : 'অনুপস্থিত ✗'}<br />
                    Secret Key: {testResult.db_secret_key_present ? `${testResult.db_secret_key_first4} ✓` : 'অনুপস্থিত ✗'}<br />
                    Base URL: {testResult.base_url}
                  </div>
                  {testResult.test_status_code !== 200 && (
                    <div style={{ marginTop: '6px', color: '#b91c1c' }}>
                      {testResult.test_status_code === 401 || testResult.test_status_code === 403
                        ? 'Key ভুল বা নিষ্ক্রিয়। portal.packzy.com এ গিয়ে সঠিক API Key ও Secret Key নিশ্চিত করুন, তারপর এখানে আবার বসিয়ে সেভ করুন।'
                        : 'Steadfast সার্ভার থেকে অপ্রত্যাশিত উত্তর এসেছে।'}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '20px' }}>ফুটার</h3>
          <div>
            <label>ফুটার টেক্সট</label>
            <textarea name="footer_text" value={formData.footer_text} onChange={handleInputChange} className="form-control" rows="3"></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
              {isSubmitting ? 'সেভ হচ্ছে...' : 'সেটিংস সেভ করুন'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
