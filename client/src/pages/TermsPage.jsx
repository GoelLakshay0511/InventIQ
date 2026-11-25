import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteFooter from '../components/shared/SiteFooter';
import useAuthStore from '../store/authStore';

const TERMS_STYLES = `
  .iq-sp-nav-inner { max-width:1200px; margin:0 auto; padding:.875rem 1.5rem; display:flex; align-items:center; justify-content:space-between; }
  .iq-sp-logo { display:flex; align-items:center; gap:.625rem; text-decoration:none; font-family:'Outfit',sans-serif; font-weight:800; font-size:1.35rem; color:#15803d; white-space:nowrap; }
  .iq-sp-logo-badge { width:34px; height:34px; min-width:34px; background:#16a34a; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1rem; color:#fff; }
  .iq-sp-nav-right { display:flex; align-items:center; gap:1rem; }
  .iq-sp-nav-home { color:#4b5563; text-decoration:none; font-size:.9rem; font-weight:500; white-space:nowrap; }
  .iq-sp-cta { background:#16a34a; color:#fff; text-decoration:none; font-size:.9rem; font-weight:600; padding:.45rem 1.15rem; border-radius:8px; box-shadow:0 2px 8px rgba(22,163,74,.3); display:inline-flex; align-items:center; gap:.4rem; white-space:nowrap; }
  .iq-sp-login-btn { color:#374151; text-decoration:none; font-size:.9rem; font-weight:600; padding:.45rem 1rem; border-radius:8px; border:1.5px solid #e5e7eb; white-space:nowrap; }
  .iq-sp-get-started { background:#16a34a; color:#fff; text-decoration:none; font-size:.9rem; font-weight:600; padding:.45rem 1.15rem; border-radius:8px; box-shadow:0 2px 8px rgba(22,163,74,.3); white-space:nowrap; }
  .iq-sp-hero { background:linear-gradient(135deg,#14532d 0%,#15803d 100%); color:#fff; padding:3.5rem 1.5rem; text-align:center; }
  .iq-sp-main { max-width:840px; margin:0 auto; padding:3.5rem 1.5rem; flex:1; line-height:1.7; }
  @media (max-width:640px) {
    .iq-sp-nav-inner { padding:.6rem 1rem; }
    .iq-sp-logo { font-size:1.1rem; gap:.4rem; }
    .iq-sp-logo-badge { width:28px; height:28px; min-width:28px; font-size:.85rem; border-radius:6px; }
    .iq-sp-nav-home { display:none; }
    .iq-sp-nav-right { gap:.5rem; }
    .iq-sp-cta { font-size:.78rem; padding:.38rem .75rem; border-radius:7px; }
    .iq-sp-login-btn { font-size:.78rem; padding:.38rem .65rem; }
    .iq-sp-get-started { font-size:.78rem; padding:.38rem .75rem; }
    .iq-sp-hero { padding:2rem 1rem; }
    .iq-sp-main { padding:1.75rem 1rem; }
  }
`;

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

export default function TermsPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoggedIn = !!accessToken;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#fff', color: C.gray900, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{TERMS_STYLES}</style>

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
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 800, marginBottom: '.5rem' }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 'clamp(.85rem, 2.5vw, 1rem)', color: 'rgba(255,255,255,.8)' }}>
            Effective: October 2026 · Guidelines for using the InventIQ Kirana Platform
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="iq-sp-main">
        <div style={{ background: C.gray50, border: `1px solid ${C.gray200}`, padding: '1.25rem 1.5rem', borderRadius: 12, marginBottom: '2.5rem', color: C.gray700, fontSize: '.9375rem' }}>
          Please review these Terms of Service carefully before utilizing the InventIQ inventory management application. By registering an account, you agree to these operational terms.
        </div>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.35rem', fontWeight: 700, color: C.gray900, marginBottom: '.75rem' }}>
            1. Acceptance & Service Scope
          </h2>
          <p style={{ color: C.gray600, fontSize: '.9375rem' }}>
            InventIQ provides neighborhood kirana retail outlets with predictive inventory assistance, daily sales tracking, automated reorder suggestions, and WhatsApp dispatch shortcuts. Use of the software is governed by standard MIT open-source licensing principles for educational and small business enablement.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.35rem', fontWeight: 700, color: C.gray900, marginBottom: '.75rem' }}>
            2. Account Responsibility
          </h2>
          <p style={{ color: C.gray600, fontSize: '.9375rem' }}>
            Store owners are responsible for maintaining the confidentiality of their phone login credentials and ensuring accurate inventory baseline inputs. You agree to notify us immediately of any unauthorized access to your account.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.35rem', fontWeight: 700, color: C.gray900, marginBottom: '.75rem' }}>
            3. Algorithmic Recommendations Disclaimer
          </h2>
          <p style={{ color: C.gray600, fontSize: '.9375rem' }}>
            While our forecasting algorithms utilize Weighted Moving Averages, historical trends, and statistical safety factors, all generated reorder quantities and urgency badges are predictive recommendations. Store managers retain sole discretion when dispatching orders or committing to supplier purchases.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.35rem', fontWeight: 700, color: C.gray900, marginBottom: '.75rem' }}>
            4. WhatsApp Messaging Integration
          </h2>
          <p style={{ color: C.gray600, fontSize: '.9375rem' }}>
            InventIQ facilitates order transmission by generating standard `wa.me` links. Delivery, payment terms, distributor fulfillment, and physical stock arrival remain entirely between the retail store and the designated vendor.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.35rem', fontWeight: 700, color: C.gray900, marginBottom: '.75rem' }}>
            5. Modifications & Inquiries
          </h2>
          <p style={{ color: C.gray600, fontSize: '.9375rem' }}>
            We reserve the right to refine platform features and technical architectures. Continued use of the platform after updates indicates acceptance of modified terms. For legal or project inquiries, contact <strong>legal@inventiq.in</strong>.
          </p>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <SiteFooter />

    </div>
  );
}
