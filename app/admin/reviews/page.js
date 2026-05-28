'use client';
import { useState, useEffect } from 'react';
import { getAdminReviews, adminReviewAction } from '@/lib/api';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending' or 'all'

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getAdminReviews(); // In reality backend filter param would be used, but since we didn't add the param in API we'll filter client-side or modify API.
      // Wait, API `getAdminReviews` doesn't take filter yet. Let's fix that or just fetch all and filter in frontend.
      // Currently backend takes `?filter=pending` or `?filter=all`. I'll just append it to the URL in the API call.
      // But let me just modify `getAdminReviews` in my code right below to take a filter param, wait, no, I'll just use fetch here if I want to pass filter.
      // Actually let's just use the `getAdminReviews` and then filter it client-side since the list isn't huge.
      setReviews(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleAction = async (id, action) => {
    if (!confirm(`Are you sure you want to ${action} this review?`)) return;
    
    try {
      await adminReviewAction(id, action);
      alert(`Review ${action}d successfully`);
      fetchReviews();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const filteredReviews = filter === 'pending' ? reviews.filter(r => !r.is_approved) : reviews;

  if (loading) return <div style={{ padding: '2rem' }}>লোড হচ্ছে...</div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>⭐ রিভিউ ম্যানেজমেন্ট</h1>
        
        <div>
          <select 
            className="input" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="pending">পেন্ডিং রিভিউ</option>
            <option value="all">সব রিভিউ</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>বই</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>কাস্টমার</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>রেটিং</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>রিভিউ</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>তারিখ</th>
                <th style={{ padding: '1rem', color: '#64748b', fontWeight: '600', fontSize: '0.9rem', textAlign: 'right' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>কোনো {filter === 'pending' ? 'পেন্ডিং' : ''} রিভিউ নেই</td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{review.book_title}</td>
                    <td style={{ padding: '1rem' }}>{review.customer_name}</td>
                    <td style={{ padding: '1rem', color: '#f59e0b' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</td>
                    <td style={{ padding: '1rem', maxWidth: '300px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={review.comment}>
                        {review.comment}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                      {new Date(review.created_at).toLocaleDateString('bn-BD')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {!review.is_approved && (
                        <button 
                          onClick={() => handleAction(review.id, 'approve')}
                          className="btn" 
                          style={{ background: '#10b981', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginRight: '0.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          অ্যাপ্রুভ
                        </button>
                      )}
                      <button 
                        onClick={() => handleAction(review.id, 'reject')}
                        className="btn" 
                        style={{ background: '#ef4444', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.85rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        ডিলিট/রিজেক্ট
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
