import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteFooter from '../components/shared/SiteFooter';
import useAuthStore from '../store/authStore';

const C = {
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green600: '#16a34a',
  green700: '#15803d',
  green900: '#14532d',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
};

export default function PrivacyPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoggedIn = !!accessToken;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

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
      <section style={{ background: `linear-gradient(135deg, ${C.green900} 0%, ${C.green700} 100%)`, color: '#fff', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, marginBottom: '.5rem' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,.8)' }}>
            Last Updated: October 2026 · Committed to protecting kirana store data privacy
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 840, margin: '0 auto', padding: '3.5rem 1.5rem', flex: 1, lineHeight: 1.7 }}>
        <div style={{ background: C.green50, border: `1px solid ${C.green200}`, padding: '1.25rem 1.5rem', borderRadius: 12, marginBottom: '2.5rem', color: C.green900, fontSize: '.9375rem' }}>
          <strong>🔒 Summary:</strong> InventIQ does not sell, lease, or distribute your store inventory or customer sales data to third parties. Your data is used exclusively for generating inventory restock forecasts and facilitating distributor orders.
        </div>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.35rem', fontWeight: 700, color: C.gray900, marginBottom: '.75rem' }}>
            1. Information We Collect
          </h2>
          <p style={{ color: C.gray600, fontSize: '.9375rem', marginBottom: '.75rem' }}>
            When you register and use InventIQ, we collect the minimum necessary data to fulfill the service:
          </p>
          <ul style={{ paddingLeft: '1.25rem', color: C.gray600, fontSize: '.9375rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <li><strong>Store Account Data:</strong> Kirana store name, shopkeeper contact number, and hashed authentication password.</li>
            <li><strong>Inventory Catalog:</strong> Product names, category classifications, pack sizes, and supplier lead times.</li>
            <li><strong>Daily Sales Logs:</strong> Units sold per SKU logged via the Quick-Tap counter or CSV upload.</li>
            <li><strong>Distributor Directory:</strong> Vendor name and WhatsApp phone number used for dispatching order links.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.35rem', fontWeight: 700, color: C.gray900, marginBottom: '.75rem' }}>
            2. How Your Data Is Processed
          </h2>
          <p style={{ color: C.gray600, fontSize: '.9375rem', marginBottom: '.75rem' }}>
            All stored inventory metrics are used strictly within your authorized account context:
          </p>
          <ul style={{ paddingLeft: '1.25rem', color: C.gray600, fontSize: '.9375rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <li><strong>Statistical Forecasting:</strong> Running our Weighted Moving Average algorithms during nightly 11 PM IST cron jobs to compute safety stock and reorder points.</li>
            <li><strong>WhatsApp Order Formatting:</strong> Assembling URL deep links (`wa.me`) with pre-composed item lists for direct messaging.</li>
            <li><strong>Session Authentication:</strong> Verifying user access through stateless JWT access tokens and secure HTTP-only refresh cookies.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.35rem', fontWeight: 700, color: C.gray900, marginBottom: '.75rem' }}>
            3. Data Security & Storage
          </h2>
          <p style={{ color: C.gray600, fontSize: '.9375rem' }}>
            We implement industry-standard database encryption and access controls. Passwords are cryptographically hashed using bcrypt. Your sessions are protected by timed JSON Web Tokens, and databases are hosted on secured MongoDB Atlas infrastructure with strict IP whitelisting.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.35rem', fontWeight: 700, color: C.gray900, marginBottom: '.75rem' }}>
            4. Third-Party Interactions
          </h2>
          <p style={{ color: C.gray600, fontSize: '.9375rem' }}>
            When you tap "Send via WhatsApp", InventIQ does not expose your database to WhatsApp or Meta. The application merely generates a client-side link that triggers WhatsApp on your local device. No proprietary inventory data is transmitted to external ad networks.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.35rem', fontWeight: 700, color: C.gray900, marginBottom: '.75rem' }}>
            5. Store Owner Rights & Support
          </h2>
          <p style={{ color: C.gray600, fontSize: '.9375rem' }}>
            You have full ownership of your catalog and sales records. You may export or request deletion of your store profile and associated historical sales records at any time by contacting us at <strong>privacy@inventiq.in</strong>.
          </p>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <SiteFooter />

    </div>
  );
}
