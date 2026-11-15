import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import SiteFooter from '../components/shared/SiteFooter';
import useAuthStore from '../store/authStore';

const C = {
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green400: '#4ade80',
  green500: '#22c55e',
  green600: '#16a34a',
  green700: '#15803d',
  green900: '#14532d',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
};

export default function ContactPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoggedIn = !!accessToken;
  const [form, setForm] = useState({ name: '', email: '', phone: '', storeName: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Thank you! Your message has been received.');
      setForm({ name: '', email: '', phone: '', storeName: '', message: '' });
    }, 600);
  };

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#fff', color: C.gray900, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── TOP NAV ──────────────────────────────────────────────────────── */}
      <header style={{ background: '#fff', borderBottom: `1px solid ${C.gray200}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.625rem', textDecoration: 'none', fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.35rem', color: C.green700 }}>
            <div style={{ width: 34, height: 34, background: C.green600, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#fff' }}>📦</div>
            InventIQ
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" style={{ color: C.gray600, textDecoration: 'none', fontSize: '.9rem', fontWeight: 500 }}>Home</Link>
            {isLoggedIn ? (
              <Link to="/dashboard" style={{ background: C.green600, color: '#fff', textDecoration: 'none', fontSize: '.9rem', fontWeight: 600, padding: '.45rem 1.15rem', borderRadius: 8, boxShadow: '0 2px 8px rgba(22,163,74,.3)', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" style={{ color: C.gray700, textDecoration: 'none', fontSize: '.9rem', fontWeight: 600, padding: '.45rem 1rem', borderRadius: 8, border: `1.5px solid ${C.gray200}` }}>Login</Link>
                <Link to="/register" style={{ background: C.green600, color: '#fff', textDecoration: 'none', fontSize: '.9rem', fontWeight: 600, padding: '.45rem 1.15rem', borderRadius: 8, boxShadow: '0 2px 8px rgba(22,163,74,.3)' }}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <section style={{ background: `linear-gradient(135deg, ${C.green900} 0%, ${C.green700} 100%)`, color: '#fff', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', padding: '.35rem 1rem', borderRadius: 999, fontSize: '.8125rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            💬 We'd Love to Hear From You
          </div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(2.25rem, 4vw, 3rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem' }}>
            Contact Us
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,.85)', maxWidth: 640, margin: '0 auto', lineHeight: 1.65 }}>
            Have questions about store setup, WhatsApp ordering, or our forecasting engine? Reach out anytime.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '4rem 1.5rem', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'start' }}>
          
          {/* Left Column: Form */}
          <div style={{ background: '#fff', border: `1px solid ${C.gray200}`, borderRadius: 16, padding: '2.25rem', boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.5rem', fontWeight: 700, color: C.gray900, marginBottom: '.5rem' }}>Send a Message</h2>
            <p style={{ color: C.gray500, fontSize: '.875rem', marginBottom: '1.75rem' }}>Fill out this form and our support team will respond promptly.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 600, color: C.gray700, marginBottom: '.375rem' }}>Your Name *</label>
                <input required type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Ramesh Kumar"
                  style={{ width: '100%', padding: '.75rem 1rem', borderRadius: 8, border: `1.5px solid ${C.gray200}`, fontSize: '.9375rem', outline: 'none', background: C.gray50, boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 600, color: C.gray700, marginBottom: '.375rem' }}>Phone Number *</label>
                  <input required type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit mobile"
                    style={{ width: '100%', padding: '.75rem 1rem', borderRadius: 8, border: `1.5px solid ${C.gray200}`, fontSize: '.9375rem', outline: 'none', background: C.gray50, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 600, color: C.gray700, marginBottom: '.375rem' }}>Email Address</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="ramesh@kirana.in"
                    style={{ width: '100%', padding: '.75rem 1rem', borderRadius: 8, border: `1.5px solid ${C.gray200}`, fontSize: '.9375rem', outline: 'none', background: C.gray50, boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 600, color: C.gray700, marginBottom: '.375rem' }}>Kirana Store Name</label>
                <input type="text" name="storeName" value={form.storeName} onChange={handleChange} placeholder="e.g. Om Sai Super Market"
                  style={{ width: '100%', padding: '.75rem 1rem', borderRadius: 8, border: `1.5px solid ${C.gray200}`, fontSize: '.9375rem', outline: 'none', background: C.gray50, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 600, color: C.gray700, marginBottom: '.375rem' }}>Your Message *</label>
                <textarea required rows={4} name="message" value={form.message} onChange={handleChange} placeholder="How can we help your store?"
                  style={{ width: '100%', padding: '.75rem 1rem', borderRadius: 8, border: `1.5px solid ${C.gray200}`, fontSize: '.9375rem', outline: 'none', background: C.gray50, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" disabled={submitting}
                style={{ background: C.green600, color: '#fff', border: 'none', padding: '.875rem', borderRadius: 8, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'background .2s', boxShadow: '0 4px 12px rgba(22,163,74,.3)', marginTop: '.5rem' }}>
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Right Column: Info & FAQs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: C.gray50, border: `1px solid ${C.gray200}`, borderRadius: 16, padding: '2rem' }}>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.25rem', fontWeight: 700, color: C.gray900, marginBottom: '1.25rem' }}>Contact Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '.875rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem' }}>📧</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.9375rem', color: C.gray900 }}>Email</div>
                    <div style={{ fontSize: '.875rem', color: C.gray600 }}>support@inventiq.in</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.875rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem' }}>📍</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.9375rem', color: C.gray900 }}>Academic Project</div>
                    <div style={{ fontSize: '.875rem', color: C.gray600 }}>Full-Stack Engineering Project, Sem 5</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.875rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem' }}>⏰</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.9375rem', color: C.gray900 }}>Daily Nightly Cron</div>
                    <div style={{ fontSize: '.875rem', color: C.gray600 }}>Runs 11:00 PM IST automatically</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: C.green50, border: `1px solid ${C.green200}`, borderRadius: 16, padding: '2rem' }}>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.25rem', fontWeight: 700, color: C.green900, marginBottom: '.75rem' }}>Frequently Asked Questions</h3>
              <p style={{ color: C.green800, fontSize: '.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                <strong>Does WhatsApp ordering require an official Meta API account?</strong><br />
                No, InventIQ uses standard WhatsApp deep links (`wa.me`) that open your phone's WhatsApp with a pre-formatted order message directly to your distributor.
              </p>
              <p style={{ color: C.green800, fontSize: '.875rem', lineHeight: 1.6, margin: 0 }}>
                <strong>Can I import items from Khatabook or Vyapar?</strong><br />
                Yes, simply upload your weekly CSV export via the Quick-Tap page to sync your product catalog and sales records.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <SiteFooter />

    </div>
  );
}
