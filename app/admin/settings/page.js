'use client';
import { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSettings } from '@/lib/api';
import styles from './page.module.css'; // Reusing similar CSS

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    site_name: '', site_tagline: '', phone: '', email: '', address: '',
    facebook_url: '', youtube_url: '', instagram_url: '',
    footer_text: '', announcement: '',
    delivery_charge_dhaka: 60, delivery_charge_outside: 120,
    extra_charge_per_kg_dhaka: 15, extra_charge_per_kg_outside: 20
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
          extra_charge_per_kg_outside: data.extra_charge_per_kg_outside !== undefined ? data.extra_charge_per_kg_outside : 20
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
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      
      if (files.logo) data.append('logo', files.logo);
      if (files.favicon) data.append('favicon', files.favicon);

      await updateSiteSettings(data);
      alert('সাইট সেটিংস সফলভাবে আপডেট হয়েছে!');
      fetchData();
    } catch (error) {
      alert(`সমস্যা হয়েছে: ${error.message}`);
    } finally {
      setIsSubmitting(false);
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
