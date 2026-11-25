import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteFooter from '../components/shared/SiteFooter';
import useAuthStore from '../store/authStore';

const ABOUT_STYLES = `
  .iq-sp-nav-inner { max-width:1200px; margin:0 auto; padding:.875rem 1.5rem; display:flex; align-items:center; justify-content:space-between; }
  .iq-sp-logo { display:flex; align-items:center; gap:.625rem; text-decoration:none; font-family:'Outfit',sans-serif; font-weight:800; font-size:1.35rem; color:#15803d; white-space:nowrap; }
  .iq-sp-logo-badge { width:34px; height:34px; min-width:34px; background:#16a34a; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1rem; color:#fff; }
  .iq-sp-nav-right { display:flex; align-items:center; gap:1rem; }
  .iq-sp-nav-home { color:#4b5563; text-decoration:none; font-size:.9rem; font-weight:500; white-space:nowrap; }
  .iq-sp-cta { background:#16a34a; color:#fff; text-decoration:none; font-size:.9rem; font-weight:600; padding:.45rem 1.15rem; border-radius:8px; box-shadow:0 2px 8px rgba(22,163,74,.3); display:inline-flex; align-items:center; gap:.4rem; white-space:nowrap; }
  .iq-sp-login-btn { color:#374151; text-decoration:none; font-size:.9rem; font-weight:600; padding:.45rem 1rem; border-radius:8px; border:1.5px solid #e5e7eb; white-space:nowrap; }
  .iq-sp-get-started { background:#16a34a; color:#fff; text-decoration:none; font-size:.9rem; font-weight:600; padding:.45rem 1.15rem; border-radius:8px; box-shadow:0 2px 8px rgba(22,163,74,.3); white-space:nowrap; }
  .iq-sp-hero { background:linear-gradient(135deg,#14532d 0%,#15803d 100%); color:#fff; padding:4rem 1.5rem; text-align:center; }
  .iq-sp-main { max-width:960px; margin:0 auto; padding:4rem 1.5rem; flex:1; }
  .iq-sp-cards-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:2rem; margin-bottom:3.5rem; }
  @media (max-width:640px) {
    .iq-sp-nav-inner { padding:.6rem 1rem; }
    .iq-sp-logo { font-size:1.1rem; gap:.4rem; }
    .iq-sp-logo-badge { width:28px; height:28px; min-width:28px; font-size:.85rem; border-radius:6px; }
    .iq-sp-nav-home { display:none; }
    .iq-sp-nav-right { gap:.5rem; }
    .iq-sp-cta { font-size:.78rem; padding:.38rem .75rem; border-radius:7px; }
    .iq-sp-login-btn { font-size:.78rem; padding:.38rem .65rem; }
    .iq-sp-get-started { font-size:.78rem; padding:.38rem .75rem; }
    .iq-sp-hero { padding:2.5rem 1rem; }
    .iq-sp-main { padding:2rem 1rem; }
    .iq-sp-cards-grid { grid-template-columns:1fr; gap:1rem; margin-bottom:2rem; }
  }
`;

const C = {
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green400: '#4ade80',
  green500: '#22c55e',
  green600: '#16a34a',
  green700: '#15803d',
  green800: '#166534',
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

export default function AboutPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoggedIn = !!accessToken;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#fff', color: C.gray900, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{ABOUT_STYLES}</style>

      {/* ── TOP NAV ──────────────────────────────────────────────────────── */}
      <header style={{ background: '#fff', borderBottom: `1px solid ${C.gray200}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="iq-sp-nav-inner">
          <Link to="/" className="iq-sp-logo">
            <div className="iq-sp-logo-badge">📦</div>
            InventIQ
          </Link>
          <div className="iq-sp-nav-right">
            <Link to="/" className="iq-sp-nav-home">Home</Link>
            {isLoggedIn ? (
              <Link to="/dashboard" className="iq-sp-cta">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="iq-sp-login-btn">Login</Link>
                <Link to="/register" className="iq-sp-get-started">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <section className="iq-sp-hero">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', padding: '.35rem 1rem', borderRadius: 999, fontSize: '.8125rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            🌾 Empowering Neighborhood Kiranas
          </div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem' }}>
            About InventIQ
          </h1>
          <p style={{ fontSize: 'clamp(.9rem, 2.5vw, 1.125rem)', color: 'rgba(255,255,255,.85)', maxWidth: 640, margin: '0 auto', lineHeight: 1.65 }}>
            Smart Kirana inventory forecasting designed to bridge the gap between traditional retail intuition and modern predictive mathematics.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="iq-sp-main">
        <div className="iq-sp-cards-grid">
          <div style={{ background: C.gray50, border: `1px solid ${C.gray200}`, borderRadius: 16, padding: '2rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.green100, color: C.green700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.25rem', fontWeight: 700, color: C.gray900, marginBottom: '.5rem' }}>Our Mission</h3>
            <p style={{ color: C.gray600, lineHeight: 1.65, fontSize: '.9375rem' }}>
              To eliminate stockouts and dead capital for neighborhood kirana store owners through simple, zero-friction daily tap-ins and automated restock suggestions.
            </p>
          </div>

          <div style={{ background: C.gray50, border: `1px solid ${C.gray200}`, borderRadius: 16, padding: '2rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '1rem' }}>💡</div>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.25rem', fontWeight: 700, color: C.gray900, marginBottom: '.5rem' }}>The Kirana Dilemma</h3>
            <p style={{ color: C.gray600, lineHeight: 1.65, fontSize: '.9375rem' }}>
              Kirana shopkeepers work 14+ hours a day. They don't have time for complex ERP software or slow invoice scanning. InventIQ works in under 60 seconds with simple +/- quick taps.
            </p>
          </div>

          <div style={{ background: C.gray50, border: `1px solid ${C.gray200}`, borderRadius: 16, padding: '2rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '1rem' }}>⚙️</div>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.25rem', fontWeight: 700, color: C.gray900, marginBottom: '.5rem' }}>Algorithmic Engine</h3>
            <p style={{ color: C.gray600, lineHeight: 1.65, fontSize: '.9375rem' }}>
              Using Weighted Moving Averages, historical 28-day demand tracking, and statistical safety margins (1.65σ), InventIQ automatically accounts for salary weeks and weekend surges.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div style={{ borderTop: `1px solid ${C.gray200}`, paddingTop: '3rem', marginTop: 0 }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.75rem', fontWeight: 800, color: C.gray900, marginBottom: '1rem' }}>Built for Real-World Reliability</h2>
          <p style={{ color: C.gray600, lineHeight: 1.7, marginBottom: '1.25rem', fontSize: '1rem' }}>
            InventIQ was engineered with a mobile-first Progressive Web App (PWA) architecture. It functions offline, installs directly onto your phone without requiring app store downloads, and connects directly to distributors through WhatsApp deep links.
          </p>
          <p style={{ color: C.gray600, lineHeight: 1.7, marginBottom: '2rem', fontSize: '1rem' }}>
            No subscriptions, no complex setup, and no hidden fees — designed to run smoothly on modern free tiers for fast, zero-cost deployment.
          </p>

          <div style={{ background: C.green50, border: `1px solid ${C.green200}`, borderRadius: 12, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: C.green900, fontSize: '1.1rem' }}>Ready to optimize your inventory?</div>
              <div style={{ color: C.green700, fontSize: '.875rem' }}>Get started in less than 2 minutes. Free forever.</div>
            </div>
            <Link to="/register" style={{ background: C.green600, color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '.75rem 1.5rem', borderRadius: 8, fontSize: '.9375rem', boxShadow: '0 4px 12px rgba(22,163,74,.3)' }}>Register Store</Link>
          </div>
        </div>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <SiteFooter />

    </div>
  );
}
