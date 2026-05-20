'use client';
import { useState, useEffect } from 'react';
import { getHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide, getImageUrl } from '@/lib/api';
import styles from './page.module.css';

export default function AdminHero() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', subtitle: '', link: '', order: 0, is_active: true
  });
  const [imageFile, setImageFile] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getHeroSlides();
      setSlides(data.results || data || []);
    } catch (error) {
      console.error("Error fetching slides:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ title: '', subtitle: '', link: '', order: slides.length, is_active: true });
    setImageFile(null);
    setShowForm(true);
  };

  const openEditForm = (slide) => {
    setEditingId(slide.id);
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      link: slide.link || '',
      order: slide.order || 0,
      is_active: slide.is_active
    });
    setImageFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (imageFile) {
        data.append('image', imageFile);
      } else if (!editingId) {
        alert("ব্যানার ইমেজ দেওয়া বাধ্যতামূলক!");
        setIsSubmitting(false);
        return;
      }

      if (editingId) {
        await updateHeroSlide(editingId, data);
        alert('স্লাইড আপডেট হয়েছে!');
      } else {
        await createHeroSlide(data);
        alert('নতুন স্লাইড যোগ হয়েছে!');
      }
      
      setShowForm(false);
      fetchData();
    } catch (error) {
      alert(`সমস্যা হয়েছে: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই স্লাইডটি ডিলিট করতে চান?')) {
      try {
        await deleteHeroSlide(id);
        setSlides(prev => prev.filter(s => s.id !== id));
        alert('স্লাইড সফলভাবে ডিলিট হয়েছে!');
      } catch (error) {
        alert('ডিলিট করতে সমস্যা হয়েছে।');
      }
    }
  };

  return (
    <>
      <div className={styles.topBar}>
        <h1>🖼️ হিরো স্লাইডার ম্যানেজমেন্ট</h1>
        <button className="btn btn-primary" onClick={openAddForm}>
          + নতুন স্লাইড
        </button>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
           <div style={{ padding: '20px', textAlign: 'center' }}>লোড হচ্ছে...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ইমেজ</th>
                  <th>শিরোনাম</th>
                  <th>ক্রম</th>
                  <th>স্ট্যাটাস</th>
                  <th>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {slides.map(slide => (
                  <tr key={slide.id}>
                    <td>
                      {slide.image && (
                        <img src={getImageUrl(slide.image)} alt={slide.title} style={{ width: '100px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                    </td>
                    <td>
                      <strong>{slide.title || '(শিরোনামহীন)'}</strong>
                      <div style={{ fontSize: '12px', color: '#666' }}>{slide.link}</div>
                    </td>
                    <td>{slide.order}</td>
                    <td>
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
                        background: slide.is_active ? '#dcfce7' : '#fee2e2',
                        color: slide.is_active ? '#166534' : '#991b1b'
                      }}>
                        {slide.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={styles.editBtn} onClick={() => openEditForm(slide)} title="সম্পাদনা করুন">✏️</button>
                        <button className={styles.deleteBtn} onClick={() => handleDelete(slide.id)} title="ডিলিট করুন">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {slides.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>কোনো স্লাইড পাওয়া যায়নি</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'স্লাইড সম্পাদনা' : 'নতুন স্লাইড যোগ করুন'}</h2>
              <button className={styles.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.catForm}>
              <div>
                <label>ব্যানার ইমেজ {editingId ? '' : '*'}</label>
                <input type="file" name="image" accept="image/*" onChange={handleFileChange} className="form-control" />
                {editingId && <small style={{ color: '#666' }}>নতুন ছবি না দিলে আগেরটিই থাকবে</small>}
              </div>
              <div>
                <label>শিরোনাম</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="form-control" />
              </div>
              <div>
                <label>সাবটাইটেল</label>
                <input type="text" name="subtitle" value={formData.subtitle} onChange={handleInputChange} className="form-control" />
              </div>
              <div>
                <label>লিংক (ঐচ্ছিক)</label>
                <input type="text" name="link" value={formData.link} onChange={handleInputChange} className="form-control" placeholder="যেমন: /books?category=islamic" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label>সাজানোর ক্রম</label>
                  <input type="number" name="order" value={formData.order} onChange={handleInputChange} className="form-control" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '25px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                    স্লাইডটি সক্রিয় রাখুন
                  </label>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>বাতিল</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
