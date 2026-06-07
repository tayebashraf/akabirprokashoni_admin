'use client';
import { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSettings, testSteadfastConnection, API_URL } from '@/lib/api';
import styles from './page.module.css'; // Reusing similar CSS

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyStatus, setKeyStatus] = useState({ api_set: false, secret_set: false });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Sessions & Devices management state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [pwaTab, setPwaTab] = useState('android'); // android or ios

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/accounts/admin/sessions/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Error fetching admin sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleLogoutSession = async (sessionId) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ডিভাইসটি লগআউট করতে চান?')) return;
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/accounts/admin/sessions/${sessionId}/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        alert('ডিভাইসটি সফলভাবে লগআউট করা হয়েছে।');
        fetchSessions();
      } else {
        alert('ডিভাইস লগআউট করতে সমস্যা হয়েছে।');
      }
    } catch (error) {
      alert('ত্রুটি দেখা দিয়েছে।');
    }
  };

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
    fetchSessions();
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

      {/* Active Device Sessions List */}
      <div className={styles.tableCard} style={{ padding: '30px', marginTop: '30px' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🔐 লগইন করা ডিভাইসসমূহ (Active Sessions)</span>
          <button 
            type="button" 
            onClick={fetchSessions} 
            className="btn btn-secondary" 
            style={{ fontSize: '13px', padding: '6px 12px' }}
          >
            🔄 রিফ্রেশ করুন
          </button>
        </h3>
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 20px' }}>
          নিচের তালিকায় বর্তমানে আপনার এই এডমিন প্যানেলে লগইন থাকা মোবাইল ও পিসির তালিকা দেখতে পাচ্ছেন। অপরিচিত কোনো ডিভাইস দেখলে লগআউট বোতাম চাপুন।
        </p>

        {loadingSessions ? (
          <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>সেশন ডাটা লোড হচ্ছে...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sessions.map((sess) => (
              <div 
                key={sess.id} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: sess.is_current ? '#f0fdf4' : '#fafafa',
                  borderRadius: '12px',
                  border: sess.is_current ? '1.5px solid #bbf7d0' : '1px solid #e5e7eb',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '1.8rem' }}>
                    {sess.device_name.includes('Mobile') || sess.device_name.includes('iPhone') ? '📱' : '💻'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {sess.device_name}
                      {sess.is_current && (
                        <span style={{ background: '#16a34a', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                          এই ডিভাইস (Current)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      IP Address: <b>{sess.ip_address}</b> • লগইন: {new Date(sess.created_at).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}
                    </div>
                  </div>
                </div>

                {!sess.is_current && (
                  <button 
                    type="button" 
                    onClick={() => handleLogoutSession(sess.id)}
                    style={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fca5a5',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.target.style.background = '#fecaca'; }}
                    onMouseLeave={(e) => { e.target.style.background = '#fee2e2'; }}
                  >
                    🔒 লগআউট করে দিন
                  </button>
                )}
              </div>
            ))}
            {sessions.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>কোনো সক্রিয় সেশন পাওয়া যায়নি।</div>
            )}
          </div>
        )}
      </div>

      {/* PWA Mobile Installation Guide */}
      <div className={styles.tableCard} style={{ padding: '30px', marginTop: '30px' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>📱 মোবাইলে এডমিন প্যানেল ইন্সটলেশন গাইড (PWA Guide)</h3>
        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 20px' }}>
          এডমিন প্যানেলটিকে সরাসরি মোবাইলের হোমস্ক্রিনে অ্যাপের মতো (PWA) ইন্সটল করে নিতে নিচের গাইড অনুসরণ করুন।
        </p>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            type="button" 
            onClick={() => setPwaTab('android')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              border: pwaTab === 'android' ? '2px solid #0d6b3f' : '1px solid #d1d5db',
              background: pwaTab === 'android' ? '#eaf5ee' : '#fff',
              color: pwaTab === 'android' ? '#0d6b3f' : '#4b5563',
              cursor: 'pointer'
            }}
          >
            🤖 অ্যান্ড্রয়েড (Android)
          </button>
          <button 
            type="button" 
            onClick={() => setPwaTab('ios')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              border: pwaTab === 'ios' ? '2px solid #0d6b3f' : '1px solid #d1d5db',
              background: pwaTab === 'ios' ? '#eaf5ee' : '#fff',
              color: pwaTab === 'ios' ? '#0d6b3f' : '#4b5563',
              cursor: 'pointer'
            }}
          >
            🍎 আইফোন (iOS / Safari)
          </button>
        </div>

        {pwaTab === 'android' ? (
          <div style={{ lineHeight: 1.8, fontSize: '14px', color: '#374151' }}>
            অ্যান্ড্রয়েড ফোনে এডমিন প্যানেলটিকে অ্যাপ হিসেবে ব্যবহার করার নিয়ম:<br />
            ১. আপনার মোবাইলের <b>Google Chrome</b> ব্রাউজার দিয়ে এডমিন প্যানেলে প্রবেশ করুন।<br />
            ২. ব্রাউজারের উপরে বা নিচে <b>"অ্যাপ ইন্সটল করুন"</b> নোটিফিকেশন বারটি দেখতে পাবেন, সেখানে ক্লিক করুন।<br />
            ৩. যদি নোটিফিকেশন বারটি না আসে, তবে ব্রাউজারের ডানদিকের উপরের <b>থ্রি-ডট (Three Dots)</b> আইকনে ক্লিক করুন।<br />
            ৪. মেনু থেকে <b>"Install app"</b> (বা "Add to Home screen") অপশনটি নির্বাচন করুন।<br />
            ৫. পপ-আপ বক্সে <b>Install</b> বাটনে চাপলেই এটি আপনার ফোনে সম্পূর্ণ অ্যাপের মতো আইকন আকারে যুক্ত হয়ে যাবে।
          </div>
        ) : (
          <div style={{ lineHeight: 1.8, fontSize: '14px', color: '#374151' }}>
            আইফোনে (iOS) সাফারি ব্রাউজার দিয়ে এডমিন প্যানেলকে হোমস্ক্রিনে অ্যাপ হিসেবে যুক্ত করার নিয়ম:<br />
            ১. আইফোনের <b>Safari</b> ব্রাউজার দিয়ে এডমিন প্যানেল লিঙ্কে প্রবেশ করুন।<br />
            ২. ব্রাউজারের নিচের মেনু বার থেকে <b>Share (শেয়ার)</b> আইকনে (বক্স ও তীরের মতো) ট্যাপ করুন।<br />
            ৩. শেয়ার তালিকাটি স্ক্রল করে একটু নিচে নামুন এবং <b>"Add to Home Screen"</b> (হোম স্ক্রিনে যোগ করুন) অপশনটি নির্বাচন করুন।<br />
            ৪. উপরের ডান কোণায় থাকা <b>"Add"</b> (যোগ করুন) বাটনে ট্যাপ করুন।<br />
            ৫. ব্যাস! এডমিন প্যানেলটি আপনার আইফোনে অন্যান্য সাধারণ অ্যাপের মতো ইন্সটল হয়ে যাবে।
          </div>
        )}
      </div>
    </>
  );
}

