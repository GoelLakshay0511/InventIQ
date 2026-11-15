import { Link } from 'react-router-dom';

const C = {
  green600: '#16a34a',
  green400: '#4ade80',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
};

export default function SiteFooter() {
  return (
    <footer style={{ background: C.gray900, padding: '4rem 0 2rem', margin: 0, marginTop: 'auto', width: '100%', border: 'none' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr', gap: '3rem', marginBottom: '3rem', paddingBottom: '3rem', borderBottom: `1px solid ${C.gray800}` }} className="iq-footer-grid">
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.625rem', fontFamily: "'Outfit',sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#fff', textDecoration: 'none', marginBottom: '.75rem' }}>
              <div style={{ width: 36, height: 36, background: C.green600, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📦</div>
              InventIQ
            </Link>
            <p style={{ color: C.gray400, fontSize: '.9375rem', lineHeight: 1.65, maxWidth: 320, margin: 0 }}>
              Smart Kirana Inventory Forecaster. Less time on spreadsheets, more time with customers.
            </p>
          </div>

          <div>
            <div style={{ color: C.gray200, fontWeight: 700, fontSize: '.875rem', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1.25rem' }}>Product</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.75rem', padding: 0, margin: 0 }}>
              {[
                ['/#features', 'Features'],
                ['/#how-it-works', 'How It Works'],
                ['/#forecasting', 'Forecasting Engine'],
              ].map(([href, lbl]) => (
                <li key={lbl}>
                  <a href={href} style={{ color: C.gray400, fontSize: '.9375rem', textDecoration: 'none', transition: 'color .2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = C.green400}
                    onMouseLeave={e => e.currentTarget.style.color = C.gray400}>
                    {lbl}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ color: C.gray200, fontWeight: 700, fontSize: '.875rem', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1.25rem' }}>Company</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.75rem', padding: 0, margin: 0 }}>
              <li>
                <Link to="/about" style={{ color: C.gray400, fontSize: '.9375rem', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.green400}
                  onMouseLeave={e => e.currentTarget.style.color = C.gray400}>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" style={{ color: C.gray400, fontSize: '.9375rem', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.green400}
                  onMouseLeave={e => e.currentTarget.style.color = C.gray400}>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div style={{ color: C.gray200, fontWeight: 700, fontSize: '.875rem', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1.25rem' }}>Account</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.75rem', padding: 0, margin: 0 }}>
              <li>
                <Link to="/register" style={{ color: C.gray400, fontSize: '.9375rem', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.green400}
                  onMouseLeave={e => e.currentTarget.style.color = C.gray400}>
                  Register Store
                </Link>
              </li>
              <li>
                <Link to="/login" style={{ color: C.gray400, fontSize: '.9375rem', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.green400}
                  onMouseLeave={e => e.currentTarget.style.color = C.gray400}>
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ color: C.gray500, fontSize: '.875rem', margin: 0 }}>
            © 2026 InventIQ Technologies Inc. · All rights reserved
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '.875rem' }}>
            <Link to="/privacy" style={{ color: C.gray400, textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.green400}
              onMouseLeave={e => e.currentTarget.style.color = C.gray400}>
              Privacy Policy
            </Link>
            <span style={{ color: C.gray700 }}>·</span>
            <Link to="/terms" style={{ color: C.gray400, textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.green400}
              onMouseLeave={e => e.currentTarget.style.color = C.gray400}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
