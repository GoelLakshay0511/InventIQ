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
    <footer className="bg-gray-900 pt-7 pb-5 sm:pt-12 sm:pb-7 m-0 mt-auto w-full border-none">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div
          className="grid grid-cols-3 lg:grid-cols-[2fr_1fr_1.2fr_1fr] gap-x-3 gap-y-5 sm:gap-8 lg:gap-12 mb-5 sm:mb-8 pb-5 sm:pb-8"
          style={{ borderBottom: `1px solid ${C.gray800}` }}
        >
          <div className="col-span-3 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-lg sm:text-2xl text-white no-underline mb-1.5 sm:mb-2.5" style={{ fontFamily: "'Outfit',sans-serif" }}>
              <div style={{ width: 30, height: 30, background: C.green600, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem' }}>📦</div>
              InventIQ
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed m-0 max-w-[320px]" style={{ color: C.gray400 }}>
              Smart Kirana Inventory Forecaster. Less time on spreadsheets, more time with customers.
            </p>
          </div>

          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3" style={{ color: C.gray200 }}>Product</div>
            <ul className="list-none flex flex-col gap-1.5 sm:gap-2.5 p-0 m-0">
              {[
                ['/#features', 'Features'],
                ['/#how-it-works', 'How It Works'],
                ['/#forecasting', 'Forecasting'],
              ].map(([href, lbl]) => (
                <li key={lbl}>
                  <a href={href} className="text-xs sm:text-sm no-underline transition-colors duration-200" style={{ color: C.gray400 }}
                    onMouseEnter={e => e.currentTarget.style.color = C.green400}
                    onMouseLeave={e => e.currentTarget.style.color = C.gray400}>
                    {lbl}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3" style={{ color: C.gray200 }}>Company</div>
            <ul className="list-none flex flex-col gap-1.5 sm:gap-2.5 p-0 m-0">
              <li>
                <Link to="/about" className="text-xs sm:text-sm no-underline transition-colors duration-200" style={{ color: C.gray400 }}
                  onMouseEnter={e => e.currentTarget.style.color = C.green400}
                  onMouseLeave={e => e.currentTarget.style.color = C.gray400}>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-xs sm:text-sm no-underline transition-colors duration-200" style={{ color: C.gray400 }}
                  onMouseEnter={e => e.currentTarget.style.color = C.green400}
                  onMouseLeave={e => e.currentTarget.style.color = C.gray400}>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3" style={{ color: C.gray200 }}>Account</div>
            <ul className="list-none flex flex-col gap-1.5 sm:gap-2.5 p-0 m-0">
              <li>
                <Link to="/register" className="text-xs sm:text-sm no-underline transition-colors duration-200" style={{ color: C.gray400 }}
                  onMouseEnter={e => e.currentTarget.style.color = C.green400}
                  onMouseLeave={e => e.currentTarget.style.color = C.gray400}>
                  Register Store
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-xs sm:text-sm no-underline transition-colors duration-200" style={{ color: C.gray400 }}
                  onMouseEnter={e => e.currentTarget.style.color = C.green400}
                  onMouseLeave={e => e.currentTarget.style.color = C.gray400}>
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-center sm:text-left">
          <p className="text-xs sm:text-sm m-0" style={{ color: C.gray500 }}>
            © 2026 InventIQ Technologies Inc. · All rights reserved
          </p>
          <div className="flex items-center justify-center gap-3 text-xs sm:text-sm flex-wrap">
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
