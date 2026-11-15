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

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,.8)' }}>
            Effective: October 2026 · Guidelines for using the InventIQ Kirana Platform
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 840, margin: '0 auto', padding: '3.5rem 1.5rem', flex: 1, lineHeight: 1.7 }}>
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
