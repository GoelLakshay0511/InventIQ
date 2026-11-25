import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteFooter from '../components/shared/SiteFooter';
import useAuthStore from '../store/authStore';

/* ─── Inline design tokens (matches index.css green brand palette) ─────── */
const C = {
  green50:  '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green400: '#4ade80',
  green500: '#22c55e',
  green600: '#16a34a',
  green700: '#15803d',
  green800: '#166534',
  green900: '#14532d',
  green950: '#052e16',
  gray50:   '#f9fafb',
  gray100:  '#f3f4f6',
  gray200:  '#e5e7eb',
  gray400:  '#9ca3af',
  gray500:  '#6b7280',
  gray600:  '#4b5563',
  gray700:  '#374151',
  gray800:  '#1f2937',
  gray900:  '#111827',
};

/* ─── Keyframe injection (runs once) ────────────────────────────────────── */
const STYLES_ID = 'inventiq-landing-styles';
function injectStyles() {
  const existing = document.getElementById(STYLES_ID);
  if (existing) existing.remove();
  const el = document.createElement('style');
  el.id = STYLES_ID;
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');

    .iq-fade-up          { opacity:0; transform:translateY(28px); transition:opacity .6s ease,transform .6s ease; }
    .iq-fade-up.iq-vis   { opacity:1; transform:translateY(0); }
    .iq-d1 { transition-delay:.1s }
    .iq-d2 { transition-delay:.2s }
    .iq-d3 { transition-delay:.3s }
    .iq-d4 { transition-delay:.4s }

    @keyframes iq-blob    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(18px,-28px) scale(1.04)} 66%{transform:translate(-8px,18px) scale(0.96)} }
    @keyframes iq-float   { 0%,100%{transform:translateY(0)}           50%{transform:translateY(-14px)} }
    @keyframes iq-badge   { 0%,100%{transform:translateY(0)}           50%{transform:translateY(-7px)} }
    @keyframes iq-pulse   { 0%,100%{opacity:1;transform:scale(1)}      50%{opacity:.55;transform:scale(1.35)} }
    @keyframes iq-bounce  { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(6px)} }
    @keyframes iq-wabounce{ 0%,100%{transform:scale(1)}                50%{transform:scale(1.035)} }

    .iq-blob1  { animation: iq-blob  8s ease-in-out infinite; }
    .iq-blob2  { animation: iq-blob  8s ease-in-out infinite; animation-delay:-3s; }
    .iq-phone  { animation: iq-float 6s ease-in-out infinite; }
    .iq-fb1    { animation: iq-badge 4s ease-in-out infinite; }
    .iq-fb2    { animation: iq-badge 4s ease-in-out infinite; animation-delay:-2s; }
    .iq-pulse  { animation: iq-pulse 2s ease-in-out infinite; }
    .iq-scroll { animation: iq-bounce 2s ease-in-out infinite; }
    .iq-wabtn:hover { animation: iq-wabounce .5s ease-in-out; }

    .iq-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; width: 100%; }

    .iq-nav-link { transition:color .2s; }
    .iq-nav-link:hover { color:${C.green400} !important; }
    .iq-mobile-only-actions { display: none; }

    .iq-feat-card { transition:all .3s ease; border-top:3px solid transparent; }
    .iq-feat-card:hover { transform:translateY(-5px); box-shadow:0 12px 32px rgba(22,163,74,.13); border-top-color:${C.green500}; border-color:${C.green200}; }

    .iq-step-num { transition:all .25s; }
    .iq-step-card:hover .iq-step-num { background:${C.green600}; color:#fff; transform:scale(1.08); }

    .iq-forecast-step { transition:all .3s; }
    .iq-forecast-step:hover { background:rgba(255,255,255,.1); transform:translateX(6px); }

    .iq-alert-row { transition:transform .2s; }
    .iq-alert-row:hover { transform:translateX(5px); }

    .iq-btn-primary { transition:all .2s; }
    .iq-btn-primary:hover { background:${C.green700} !important; box-shadow:0 6px 22px rgba(22,163,74,.5) !important; transform:translateY(-1px); }

    .iq-btn-ghost { transition:all .2s; }
    .iq-btn-ghost:hover { background:rgba(255,255,255,.25) !important; transform:translateY(-1px); }

    .iq-btn-outline { transition:all .2s; }
    .iq-btn-outline:hover { background:${C.green700} !important; border-color:${C.green700} !important; color:#fff !important; box-shadow:0 6px 22px rgba(22,163,74,.5) !important; transform:translateY(-1px); }

    .iq-btn-white { transition:all .2s; }
    .iq-btn-white:hover { background:${C.green50} !important; transform:translateY(-1px); }

    /* Scroll to top ("scroll to above") button */
    .iq-scroll-top-btn {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${C.green600}, ${C.green700});
      color: #fff;
      border: 1.5px solid rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(22,163,74,0.45);
      cursor: pointer;
      z-index: 999;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .iq-scroll-top-btn:hover {
      background: linear-gradient(135deg, ${C.green500}, ${C.green600});
      transform: translateY(-4px) scale(1.08);
      box-shadow: 0 12px 28px rgba(22,163,74,0.6);
    }
    .iq-scroll-top-btn:active {
      transform: translateY(-1px) scale(0.96);
    }

    /* Navbar scroll */
    .iq-nav          { background:transparent; }
    .iq-nav.scrolled { background:rgba(255,255,255,.95); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .iq-nav.scrolled .iq-logo-text   { color:${C.green700} !important; }
    .iq-nav.scrolled .iq-nav-link    { color:${C.gray600} !important; }
    .iq-nav.scrolled .iq-nav-link:hover { color:${C.green600} !important; }
    .iq-nav.scrolled .iq-nav-cta     { background:${C.green600} !important; color:#fff !important; border-color:${C.green600} !important; }
    .iq-nav.scrolled .iq-nav-cta:hover { background:${C.green700} !important; border-color:${C.green700} !important; box-shadow:0 6px 22px rgba(22,163,74,.5) !important; transform:translateY(-1px); }
    .iq-nav.scrolled .iq-hamburger-bar { background:${C.gray700} !important; }
    .iq-nav.menu-open { background:#ffffff !important; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .iq-nav.menu-open .iq-logo-text   { color:${C.green700} !important; }
    .iq-nav.menu-open .iq-hamburger-bar { background:${C.gray700} !important; }
    .iq-nav.menu-open .iq-nav-cta     { background:transparent !important; color:${C.green700} !important; border-color:${C.green600} !important; }

    /* Tablet breakpoint */
    @media (max-width:1024px) {
      .iq-hero-grid     { gap: 2.5rem !important; }
      .iq-alerts-grid   { gap: 2.5rem !important; }
      .iq-forecast-grid { gap: 2.5rem !important; }
      .iq-feat-grid     { grid-template-columns: repeat(2, 1fr) !important; gap: 1.25rem !important; }
      .iq-steps-line    { display: none !important; }
      .iq-steps-grid    { grid-template-columns: repeat(2, 1fr) !important; gap: 1.5rem !important; }
    }

    /* Mobile breakpoint */
    @media (max-width:768px) {
      .iq-nav           { padding: .65rem 0 !important; }
      .iq-nav-row       { gap: .75rem !important; }
      .iq-logo-link     { font-size: 1.2rem !important; gap: .5rem !important; }
      .iq-logo-badge    { width: 32px !important; height: 32px !important; font-size: 1rem !important; }
      .iq-nav-links     { display:none !important; }
      .iq-hamburger     { display:flex !important; }
      .iq-nav-links.open {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #ffffff;
        border-top: 1px solid ${C.gray200};
        box-shadow: 0 18px 36px rgba(0,0,0,.16);
        padding: .75rem 1.25rem 1.25rem !important;
        gap: .25rem !important;
      }
      .iq-nav-links.open .iq-nav-link {
        color: ${C.gray800} !important;
        display: block;
        text-align: left;
        padding: .75rem .75rem;
        border-radius: .625rem;
        font-size: .975rem !important;
        font-weight: 600 !important;
      }
      .iq-nav-links.open .iq-nav-link:hover {
        background: ${C.green50};
        color: ${C.green700} !important;
      }
      .iq-mobile-only-actions {
        display: flex;
        flex-direction: column;
        gap: .6rem;
        margin-top: .5rem;
        padding-top: .85rem;
        border-top: 1px solid ${C.gray200};
      }
      .iq-nav-cta-wrapper { gap: .45rem !important; }
      .iq-nav-cta-btn   { padding: .45rem .85rem !important; font-size: .8125rem !important; border-radius: .55rem !important; white-space: nowrap; }
      .iq-nav-cta-text  { display: none !important; }
      .iq-hero-section  { min-height: 100svh !important; align-items: flex-start !important; }
      .iq-hero-grid     { display: flex !important; flex-direction: column !important; align-items: stretch !important; padding-top: 4.5rem !important; padding-bottom: 1.75rem !important; gap: .85rem !important; }
      .iq-hero-copy     { display: contents !important; }
      .iq-hero-top      { order: 1; text-align: center; display: flex; flex-direction: column; align-items: center; }
      .iq-hero-badge    { margin-bottom: .55rem !important; font-size: .72rem !important; padding: .28rem .75rem !important; }
      .iq-hero-h1       { font-size: clamp(1.55rem, 6.2vw, 2.25rem) !important; line-height: 1.12 !important; margin-bottom: .45rem !important; }
      .iq-hero-sub      { font-size: .825rem !important; line-height: 1.48 !important; margin-bottom: 0 !important; max-width: 340px !important; }
      .iq-phone-wrap    { order: 2; display: flex !important; padding: .25rem 0; width: 100%; max-width: 330px; margin: 0 auto; }
      .iq-hero-phone    { width: clamp(150px, 42vw, 195px) !important; border-radius: 1.35rem !important; box-shadow: 0 22px 45px rgba(0,0,0,.35) !important; }
      .iq-fb1           { top: 10% !important; right: 0 !important; padding: .35rem .55rem !important; font-size: .66rem !important; border-radius: 9px !important; gap: .35rem !important; }
      .iq-fb2           { bottom: 12% !important; left: 0 !important; padding: .35rem .55rem !important; font-size: .66rem !important; border-radius: 9px !important; gap: .35rem !important; }
      .iq-fb-icon       { font-size: .88rem !important; }
      .iq-fb-sub        { font-size: .56rem !important; }
      .iq-hero-actions  { order: 3; display: grid !important; grid-template-columns: 1fr 1fr !important; gap: .6rem !important; margin-bottom: 0 !important; width: 100%; }
      .iq-hero-actions a { width: 100% !important; padding: .68rem .5rem !important; font-size: .8rem !important; border-radius: .65rem !important; white-space: nowrap; gap: .35rem !important; }
      .iq-hero-stats    { order: 4; display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: .5rem !important; align-items: start !important; text-align: center; padding-top: .25rem; }
      .iq-stat-divider  { display: none !important; }
      .iq-stat-item     { border-left: 1px solid rgba(255,255,255,.2); padding-left: .25rem; }
      .iq-stat-item:first-child { border-left: none; padding-left: 0; }
      .iq-stat-val      { font-size: 1.15rem !important; }
      .iq-stat-lbl      { font-size: .7rem !important; }
      .iq-section       { padding: 3.25rem 0 !important; }
      .iq-section-header { margin-bottom: 2rem !important; }
      .iq-heading-lg    { font-size: clamp(1.85rem, 7vw, 2.5rem) !important; line-height: 1.15 !important; margin-bottom: .9rem !important; }
      .iq-heading-md    { font-size: clamp(1.5rem, 5.5vw, 2rem) !important; line-height: 1.25 !important; margin-bottom: .75rem !important; }
      .iq-subtext       { font-size: .95rem !important; line-height: 1.6 !important; margin-bottom: 1.5rem !important; }
      .iq-alerts-grid   { grid-template-columns: 1fr !important; gap: 2rem !important; }
      .iq-forecast-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
      .iq-scroll-top-btn { width: 42px !important; height: 42px !important; bottom: 1.25rem !important; right: 1rem !important; }
    }

    @media (max-width:640px) {
      .iq-container     { padding: 0 1rem !important; }
      .iq-feat-grid     { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: .75rem !important; }
      .iq-feat-card     { padding: 1rem !important; border-radius: 1rem !important; display: flex; flex-direction: column; height: 100%; min-width: 0; }
      .iq-feat-icon     { width: 38px !important; height: 38px !important; border-radius: 10px !important; font-size: 1.15rem !important; margin-bottom: .75rem !important; }
      .iq-feat-title    { font-size: .925rem !important; line-height: 1.3 !important; margin-bottom: .35rem !important; }
      .iq-feat-desc     { font-size: .78rem !important; line-height: 1.48 !important; }
      .iq-steps-grid    { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: .75rem !important; }
      .iq-step-card     { flex-direction: column !important; text-align: center !important; align-items: center !important; background: #fff; border: 1px solid ${C.gray200}; border-radius: 1rem; padding: 1rem .75rem; gap: .6rem !important; height: 100%; min-width: 0; box-shadow: 0 2px 8px rgba(0,0,0,.03); }
      .iq-step-num      { width: 40px !important; height: 40px !important; font-size: 1rem !important; border-width: 2.5px !important; flex-shrink: 0; }
      .iq-step-title    { font-size: .9rem !important; line-height: 1.3 !important; margin-bottom: .25rem !important; }
      .iq-step-desc     { font-size: .775rem !important; line-height: 1.45 !important; }
      .iq-alerts-card   { padding: 1rem !important; border-radius: 1.125rem !important; }
      .iq-alert-row     { padding: .75rem !important; gap: .625rem !important; }
      .iq-forecast-step { padding: .85rem !important; gap: .7rem !important; }
      .iq-forecast-text { font-size: .84rem !important; }
    }

    @media (max-width:480px) {
      .iq-nav-login-inline { display: none !important; }
      .iq-forecast-cta  { width: 100% !important; padding: .8rem 1.25rem !important; font-size: .9375rem !important; }
      .iq-cta-actions   { flex-direction: column !important; align-items: center; gap: .65rem !important; }
      .iq-cta-actions a { width: 100% !important; max-width: 320px; padding: .8rem 1.25rem !important; font-size: .9375rem !important; }
    }

    @media (max-width:340px) {
      .iq-hero-actions  { grid-template-columns: 1fr !important; }
      .iq-feat-grid     { grid-template-columns: 1fr !important; }
      .iq-steps-grid    { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(el);
}

/* ─── Small helpers ─────────────────────────────────────────────────────── */
function SectionTag({ children }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:'.375rem',
      background:C.green50, border:`1px solid ${C.green200}`, color:C.green700,
      fontSize:'.8125rem', fontWeight:600, padding:'.375rem .875rem',
      borderRadius:999, marginBottom:'1rem' }}>
      {children}
    </div>
  );
}

function SectionTagDark({ children }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:'.375rem',
      background:'rgba(74,222,128,.1)', border:'1px solid rgba(74,222,128,.3)',
      color:C.green400, fontSize:'.8125rem', fontWeight:600,
      padding:'.375rem .875rem', borderRadius:999, marginBottom:'1rem' }}>
      {children}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { accessToken } = useAuthStore();
  const isLoggedIn = !!accessToken;
  const navRef  = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    injectStyles();

    /* Navbar scroll & Scroll-to-top visibility */
    const onScroll = () => {
      navRef.current?.classList.toggle('scrolled', window.scrollY > 40);
      setShowScrollTop(window.scrollY > 300);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    /* Fade-up observer */
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('iq-vis'); obs.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.iq-fade-up').forEach(el => obs.observe(el));

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown);
      obs.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function toggleMenu() {
    setMenuOpen(prev => !prev);
  }
  function closeMenu() {
    setMenuOpen(false);
  }

  /* ── Shared style objects ───────────────────────────────────────────── */
  const btnPrimary = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'.5rem',
    background:C.green600, color:'#fff', fontWeight:700, fontSize:'1rem',
    padding:'.875rem 2rem', borderRadius:'.75rem', border:'none', cursor:'pointer',
    textDecoration:'none', boxShadow:'0 4px 14px rgba(22,163,74,.4)',
  };
  const btnGhost = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'.5rem',
    background:'rgba(255,255,255,.15)', color:'#fff', fontWeight:600, fontSize:'1rem',
    padding:'.875rem 2rem', borderRadius:'.75rem', border:'2px solid rgba(255,255,255,.4)',
    cursor:'pointer', textDecoration:'none', backdropFilter:'blur(8px)',
  };
  const btnOutline = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'.5rem',
    background:'transparent', color:C.green700, fontWeight:600, fontSize:'1rem',
    padding:'.75rem 1.75rem', borderRadius:'.75rem', border:`2px solid ${C.green600}`,
    cursor:'pointer', textDecoration:'none',
  };
  const btnWhite = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'.5rem',
    background:'#fff', color:C.green700, fontWeight:700, fontSize:'1rem',
    padding:'.875rem 2rem', borderRadius:'.75rem', border:'none', cursor:'pointer',
    textDecoration:'none', boxShadow:'0 4px 20px rgba(0,0,0,.14)',
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background: C.gray900, color:C.gray900, minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX:'clip', lineHeight:1.6, margin: 0, padding: 0 }}>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav ref={navRef} className={`iq-nav${menuOpen ? ' menu-open' : ''}`}
        style={{ position:'fixed', top:0, left:0, right:0, zIndex:1000, padding:'1rem 0', transition:'all .3s ease' }}>
        <div className="iq-container">
          <div className="iq-nav-row" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'2rem' }}>
            {/* Logo */}
            <a href="#" className="iq-logo-link" style={{ display:'flex', alignItems:'center', gap:'.625rem', fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:'1.4rem', textDecoration:'none', flexShrink:0 }}>
              <div className="iq-logo-badge" style={{ width:36, height:36, background:C.green600, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>📦</div>
              <span className="iq-logo-text" style={{ color:'#fff', transition:'color .3s' }}>InventIQ</span>
            </a>
            {/* Desktop links + Mobile drawer */}
            <ul className={`iq-nav-links${menuOpen ? ' open' : ''}`}
              style={{ display:'flex', alignItems:'center', gap:'2rem', listStyle:'none', margin:0, padding:0 }}>
              {['#features','#how-it-works','#forecasting'].map((href, i) => (
                <li key={i}><a href={href} onClick={closeMenu} className="iq-nav-link"
                  style={{ fontWeight:500, fontSize:'.9375rem', color:'rgba(255,255,255,.85)', textDecoration:'none' }}>
                  {['Features','How It Works','Forecasting Engine'][i]}
                </a></li>
              ))}
              <li className="iq-mobile-only-actions">
                {isLoggedIn ? (
                  <Link to="/dashboard" onClick={closeMenu} className="iq-btn-primary"
                    style={{ ...btnPrimary, width:'100%', padding:'.75rem 1rem', fontSize:'.9375rem' }}>
                    Go to Dashboard →
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMenu} className="iq-btn-outline"
                      style={{ ...btnOutline, width:'100%', padding:'.65rem 1rem', fontSize:'.9375rem' }}>
                      Login
                    </Link>
                    <Link to="/register" onClick={closeMenu} className="iq-btn-primary"
                      style={{ ...btnPrimary, width:'100%', padding:'.7rem 1rem', fontSize:'.9375rem' }}>
                      Get Started Free
                    </Link>
                  </>
                )}
              </li>
            </ul>
            {/* Right Actions + Hamburger */}
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexShrink:0 }}>
              {isLoggedIn ? (
                <Link to="/dashboard" className="iq-btn-primary iq-nav-cta-btn"
                  style={{ ...btnPrimary, padding:'.55rem 1.4rem', fontSize:'.9rem', display:'inline-flex', alignItems:'center', gap:'.45rem' }}>
                  <span className="iq-nav-cta-text">Go to </span>Dashboard →
                </Link>
              ) : (
                <div className="iq-nav-cta-wrapper" style={{ display:'flex', gap:'.75rem', alignItems:'center' }}>
                  <Link to="/login" className="iq-btn-outline iq-nav-cta iq-nav-cta-btn iq-nav-login-inline"
                    style={{ ...btnOutline, padding:'.5rem 1.25rem', fontSize:'.875rem', color:'rgba(255,255,255,.9)', borderColor:'rgba(255,255,255,.5)', background:'rgba(255,255,255,.1)' }}>
                    Login
                  </Link>
                  <Link to="/register" className="iq-btn-primary iq-nav-cta-btn"
                    style={{ ...btnPrimary, padding:'.5rem 1.25rem', fontSize:'.875rem' }}>
                    Get Started
                  </Link>
                </div>
              )}
              {/* Hamburger */}
              <button
                type="button"
                onClick={toggleMenu}
                className="iq-hamburger"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={menuOpen}
                style={{ display:'none', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:5, cursor:'pointer', padding:8, width:40, height:40, background:'transparent', border:'none', borderRadius:8 }}
              >
                <span className="iq-hamburger-bar"
                  style={{ display:'block', width:22, height:2, background:'#fff', borderRadius:2, transition:'all .25s', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
                <span className="iq-hamburger-bar"
                  style={{ display:'block', width:22, height:2, background:'#fff', borderRadius:2, transition:'all .25s', opacity: menuOpen ? 0 : 1 }} />
                <span className="iq-hamburger-bar"
                  style={{ display:'block', width:22, height:2, background:'#fff', borderRadius:2, transition:'all .25s', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section id="hero" className="iq-hero-section" style={{ minHeight:'100vh', background:`linear-gradient(135deg,${C.green900} 0%,${C.green700} 40%,${C.green600} 70%,#34d399 100%)`, position:'relative', display:'flex', alignItems:'center', overflow:'hidden' }}>
        {/* Pattern */}
        <div style={{ position:'absolute', inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        {/* Blobs */}
        <div className="iq-blob1" style={{ position:'absolute', width:480, height:480, borderRadius:'50%', background:C.green400, filter:'blur(80px)', opacity:.2, top:-100, right:-100 }} />
        <div className="iq-blob2" style={{ position:'absolute', width:320, height:320, borderRadius:'50%', background:'#34d399', filter:'blur(80px)', opacity:.2, bottom:-80, left:'10%' }} />

        <div className="iq-container" style={{ position:'relative', zIndex:1 }}>
          <div className="iq-hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4rem', alignItems:'center', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
            {/* Copy */}
            <div className="iq-hero-copy">
              <div className="iq-hero-top">
                <div className="iq-hero-badge" style={{ display:'inline-flex', alignItems:'center', gap:'.5rem', background:'rgba(255,255,255,.15)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,.25)', color:'#fff', fontSize:'.8125rem', fontWeight:600, padding:'.375rem 1rem', borderRadius:999, marginBottom:'1.5rem' }}>
                  <span className="iq-pulse" style={{ width:6, height:6, background:C.green400, borderRadius:'50%', display:'inline-block' }} />
                  Smart Kirana Inventory · AI-Powered
                </div>
                <h1 className="iq-heading-lg iq-hero-h1" style={{ fontFamily:"'Outfit',sans-serif", fontSize:'clamp(2.5rem,5vw,3.75rem)', fontWeight:900, color:'#fff', lineHeight:1.1, letterSpacing:'-.02em', marginBottom:'1.5rem' }}>
                  Never Run Out of<br />
                  <span style={{ background:'linear-gradient(135deg,#4ade80,#a7f3d0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Stock Again</span>
                </h1>
                <p className="iq-subtext iq-hero-sub" style={{ fontSize:'1.125rem', color:'rgba(255,255,255,.8)', lineHeight:1.7, marginBottom:'2.5rem', maxWidth:520 }}>
                  InventIQ gives neighborhood kirana store owners AI-powered forecasting, color-coded reorder alerts, and 1-tap WhatsApp ordering.
                </p>
              </div>
              <div className="iq-hero-actions" style={{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'3rem' }}>
                {isLoggedIn ? (
                  <Link to="/dashboard" className="iq-btn-primary" style={btnPrimary}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Go to Dashboard →
                  </Link>
                ) : (
                  <Link to="/register" className="iq-btn-primary" style={btnPrimary}>
                    <img src="/icon.svg" alt="" style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: '1px solid rgba(255,255,255,.4)' }} />
                    Get Started Free
                  </Link>
                )}
                <a href="#how-it-works" className="iq-btn-ghost" style={btnGhost}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                  See How It Works
                </a>
              </div>
              {/* Stats */}
              <div className="iq-hero-stats" style={{ display:'flex', gap:'2rem', flexWrap:'wrap' }}>
                {[['28-Day','Sales History'],['<60s','Daily Tap-In'],['₹0','Running Cost']].map(([val, lbl], i, arr) => (
                  <Fragment key={i}>
                    <div className="iq-stat-item">
                      <div className="iq-stat-val" style={{ fontFamily:"'Outfit',sans-serif", fontSize:'1.75rem', fontWeight:800, color:'#fff' }}>{val}</div>
                      <div className="iq-stat-lbl" style={{ fontSize:'.8125rem', color:'rgba(255,255,255,.65)', marginTop:2 }}>{lbl}</div>
                    </div>
                    {i < arr.length - 1 && <div className="iq-stat-divider" style={{ width:1, background:'rgba(255,255,255,.2)' }} />}
                  </Fragment>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div className="iq-phone-wrap" style={{ position:'relative', display:'flex', justifyContent:'center', alignItems:'center' }}>
              <div style={{ position:'absolute', width:'min(360px, 82vw)', height:'min(360px, 82vw)', background:'radial-gradient(circle,rgba(74,222,128,.35) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
              <svg className="iq-phone iq-hero-phone" viewBox="0 0 300 560" xmlns="http://www.w3.org/2000/svg"
                style={{ position:'relative', zIndex:2, width:290, borderRadius:'2rem', boxShadow:'0 40px 80px rgba(0,0,0,.4)' }}>
                <defs>
                  <clipPath id="iq-phone-screen-clip">
                    <rect x="10" y="10" width="280" height="540" rx="28"/>
                  </clipPath>
                </defs>
                <rect width="300" height="560" rx="36" fill="#166534"/>
                <g clipPath="url(#iq-phone-screen-clip)">
                  <rect x="10" y="10" width="280" height="540" fill="#fff"/>
                  {/* Header */}
                  <rect x="10" y="10" width="280" height="55" fill={C.green600}/>
                  <rect x="10" y="10" width="280" height="28" fill={C.green700}/>
                  <text x="26" y="50" fontFamily="Inter,sans-serif" fontSize="15" fontWeight="700" fill="white">📦 Dashboard</text>
                  {/* Stat cards */}
                  <rect x="18" y="74" width="82" height="58" rx="10" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1"/>
                  <text x="28" y="93" fontFamily="Inter,sans-serif" fontSize="9" fill={C.gray500}>Products</text>
                  <text x="28" y="113" fontFamily="Inter,sans-serif" fontSize="19" fontWeight="800" fill={C.green600}>142</text>
                  <rect x="108" y="74" width="82" height="58" rx="10" fill="#fff1f2" stroke="#fecdd3" strokeWidth="1"/>
                  <text x="118" y="93" fontFamily="Inter,sans-serif" fontSize="9" fill={C.gray500}>Alerts</text>
                  <text x="118" y="113" fontFamily="Inter,sans-serif" fontSize="19" fontWeight="800" fill="#dc2626">4</text>
                  <rect x="198" y="74" width="86" height="58" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1"/>
                  <text x="208" y="93" fontFamily="Inter,sans-serif" fontSize="9" fill={C.gray500}>Sales Today</text>
                  <text x="208" y="113" fontFamily="Inter,sans-serif" fontSize="19" fontWeight="800" fill="#2563eb">₹3.2k</text>
                  {/* Reorder header */}
                  <text x="20" y="152" fontFamily="Inter,sans-serif" fontSize="12" fontWeight="700" fill={C.gray700}>Reorder Suggestions</text>
                  {/* Alert rows */}
                  {[
                    { y:162, bg:'#fff1f2', bc:'#fecdd3', name:'🌾 Aashirvaad Atta 5kg',     meta:'Stock: 2 · Order: 30u', label:'CRITICAL', lc:'#dc2626', lb:'#fee2e2', lx:221 },
                    { y:222, bg:'#fff7ed', bc:'#fed7aa', name:'🧴 Tata Tea 500g',           meta:'Stock: 5 · Order: 15u', label:'HIGH',     lc:'#ea580c', lb:'#ffedd5', lx:234 },
                    { y:282, bg:'#fefce8', bc:'#fef08a', name:'🍜 Maggi Noodles Pk-10',     meta:'Stock: 8 · Order: 20u', label:'MEDIUM',   lc:'#ca8a04', lb:'#fef9c3', lx:215 },
                    { y:342, bg:'#f0fdf4', bc:'#bbf7d0', name:'🧈 Amul Butter 100g',        meta:'Stock: 14 · Order: 10u', label:'LOW',      lc:C.green700, lb:C.green100, lx:232 },
                  ].map(({ y, bg, bc, name, meta, label, lc, lb, lx }) => (
                    <g key={y}>
                      <rect x="18" y={y} width="264" height="52" rx="10" fill={bg} stroke={bc} strokeWidth="1"/>
                      <text x="30" y={y+19} fontFamily="Inter,sans-serif" fontSize="11" fontWeight="600" fill={C.gray800}>{name}</text>
                      <text x="30" y={y+36} fontFamily="Inter,sans-serif" fontSize="9" fill={C.gray400}>{meta}</text>
                      <rect x={lx} y={y+8} width={282-lx} height="18" rx="9" fill={lb}/>
                      <text x={(lx + 282)/2} y={y+20} fontFamily="Inter,sans-serif" fontSize="8" fontWeight="700" fill={lc} textAnchor="middle">{label}</text>
                    </g>
                  ))}
                  {/* WhatsApp btn */}
                  <rect x="18" y="404" width="264" height="44" rx="12" fill="#25d366"/>
                  <text x="150" y="430" fontFamily="Inter,sans-serif" fontSize="12" fontWeight="700" fill="white" textAnchor="middle">📲 Send Order via WhatsApp</text>
                  {/* Bottom nav */}
                  <rect x="10" y="480" width="280" height="70" fill="#f9fafb" stroke={C.gray200} strokeWidth="1"/>
                  {[['🏠','Dashboard',C.green600,54],['📦','Products',C.gray400,116],['📋','Reorders',C.gray400,184],['⚙️','Settings',C.gray400,246]].map(([icon,lbl,clr,cx]) => (
                    <g key={cx}>
                      <text x={cx} y="510" fontFamily="Inter,sans-serif" fontSize="18" textAnchor="middle">{icon}</text>
                      <text x={cx} y="526" fontFamily="Inter,sans-serif" fontSize="8" fontWeight="600" fill={clr} textAnchor="middle">{lbl}</text>
                    </g>
                  ))}
                </g>
              </svg>
              {/* Floating badges */}
              <div className="iq-fb1" style={{ position:'absolute', top:'18%', right:'-11%', background:'#fff', borderRadius:12, padding:'.75rem 1rem', boxShadow:'0 20px 30px rgba(0,0,0,.12)', display:'flex', alignItems:'center', gap:'.5rem', fontSize:'.8125rem', fontWeight:600, color:C.gray800, zIndex:3, whiteSpace:'nowrap' }}>
                <span className="iq-fb-icon" style={{ fontSize:'1.2rem' }}>🔴</span>
                <div>
                  <div>Critical Alert!</div>
                  <div className="iq-fb-sub" style={{ fontSize:'.6875rem', color:C.gray500, fontWeight:400 }}>Atta 5kg — Stock: 2</div>
                </div>
              </div>
              <div className="iq-fb2" style={{ position:'absolute', bottom:'22%', left:'-15%', background:'#fff', borderRadius:12, padding:'.75rem 1rem', boxShadow:'0 20px 30px rgba(0,0,0,.12)', display:'flex', alignItems:'center', gap:'.5rem', fontSize:'.8125rem', fontWeight:600, color:C.gray800, zIndex:3, whiteSpace:'nowrap' }}>
                <span className="iq-fb-icon" style={{ fontSize:'1.2rem' }}>📲</span>
                <div>
                  <div>WhatsApp Sent!</div>
                  <div className="iq-fb-sub" style={{ fontSize:'.6875rem', color:C.gray500, fontWeight:400 }}>Order to Ramesh Dist.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="iq-section" style={{ padding:'6rem 0', background:'#fff', overflow:'hidden' }}>
        <div className="iq-container">
          <div className="iq-fade-up iq-section-header" style={{ textAlign:'center', maxWidth:640, margin:'0 auto 4rem' }}>
            <SectionTag>✨ Core Features</SectionTag>
            <h2 className="iq-heading-md" style={{ fontFamily:"'Outfit',sans-serif", fontSize:'clamp(1.875rem,4vw,2.75rem)', fontWeight:800, color:C.gray900, lineHeight:1.2, letterSpacing:'-.02em', marginBottom:'1rem' }}>
              Everything your kirana <span style={{ color:C.green600 }}>store needs</span>
            </h2>
            <p className="iq-subtext" style={{ color:C.gray500, fontSize:'1.0625rem', lineHeight:1.7 }}>A complete inventory management suite designed specifically for neighborhood kirana stores — fast, simple, and free to run.</p>
          </div>
          <div className="iq-feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem' }}>
            {[
              { icon:'⚡', bg:'#f0fdf4', title:'Quick-Tap Sales Entry',       desc:'Log daily sales for Top-25 items with a single tap. Done in under 60 seconds — no complex forms, no keyboard needed.', delay:'iq-d1' },
              { icon:'🧠', bg:'#eff6ff', title:'Smart AI Forecasting',          desc:'Weighted Moving Average (WMA) with 28-day history, weekend boosts (×1.15) and salary-week multipliers (×1.25).', delay:'iq-d2' },
              { icon:'🔔', bg:'#fef2f2', title:'Colour-Coded Reorder Alerts',  desc:'Know exactly what to reorder: 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low urgency with smart safety-stock calculation.', delay:'iq-d3' },
              { icon:'📲', bg:'#dcfce7', title:'1-Tap WhatsApp Orders',         desc:'Generate pre-filled WhatsApp order messages per distributor. One tap sends your entire order — zero typing.', delay:'iq-d1' },
              { icon:'📂', bg:'#fff7ed', title:'CSV Import from Vyapar',        desc:'Already using Vyapar or Khatabook? Import your weekly CSV export directly — your historical data, instantly integrated.', delay:'iq-d2' },
              { icon:'📱', bg:'#f0fdfa', title:'Installable PWA',               desc:'Works like a native app on Android & iOS. Install on your home screen, works offline. No app store, no monthly fees.', delay:'iq-d3' },
            ].map(({ icon, bg, title, desc, delay }) => (
              <div key={title} className={`iq-feat-card iq-fade-up ${delay}`}
                style={{ background:'#fff', border:`1px solid ${C.gray100}`, borderRadius:'1.25rem', padding:'2rem', position:'relative', overflow:'hidden' }}>
                <div className="iq-feat-icon" style={{ width:52, height:52, borderRadius:14, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', marginBottom:'1.25rem' }}>{icon}</div>
                <h3 className="iq-feat-title" style={{ fontFamily:"'Outfit',sans-serif", fontSize:'1.125rem', fontWeight:700, color:C.gray900, marginBottom:'.625rem' }}>{title}</h3>
                <p className="iq-feat-desc" style={{ color:C.gray500, fontSize:'.9375rem', lineHeight:1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="iq-section" style={{ padding:'6rem 0', background:`linear-gradient(180deg,${C.gray50} 0%,#fff 100%)`, overflow:'hidden' }}>
        <div className="iq-container">
          <div className="iq-fade-up iq-section-header" style={{ textAlign:'center', maxWidth:640, margin:'0 auto 4rem' }}>
            <SectionTag>🗺️ Process</SectionTag>
            <h2 className="iq-heading-md" style={{ fontFamily:"'Outfit',sans-serif", fontSize:'clamp(1.875rem,4vw,2.75rem)', fontWeight:800, color:C.gray900, lineHeight:1.2, letterSpacing:'-.02em', marginBottom:'1rem' }}>
              Up and running in <span style={{ color:C.green600 }}>4 simple steps</span>
            </h2>
            <p className="iq-subtext" style={{ color:C.gray500, fontSize:'1.0625rem', lineHeight:1.7 }}>Designed to be set up once and then get out of your way.</p>
          </div>
          <div className="iq-steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'2rem', position:'relative' }}>
            <div className="iq-steps-line" style={{ position:'absolute', top:28, left:'calc(12.5% + 28px)', right:'calc(12.5% + 28px)', height:2, background:`linear-gradient(90deg,${C.green200},${C.green400},${C.green200})` }} />
            {[
              { n:'1', title:'Add Your Products',   desc:'Add your catalogue with pack sizes, lead times and distributor details. Import CSV or add manually.', delay:'iq-d1' },
              { n:'2', title:'Tap Daily Sales',     desc:'Each evening tap + or − for your top 25 items. Under a minute. InventIQ records it all.', delay:'iq-d2' },
              { n:'3', title:'Get Smart Alerts',    desc:'Nightly at 11 PM the forecasting engine runs and flags low stock with colour-coded urgency.', delay:'iq-d3' },
              { n:'4', title:'Order via WhatsApp',  desc:'Review your list, tap "Send via WhatsApp" — a pre-filled message goes straight to your distributor.', delay:'iq-d4' },
            ].map(({ n, title, desc, delay }) => (
              <div key={n} className={`iq-step-card iq-fade-up ${delay}`} style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:'1rem' }}>
                <div className="iq-step-num" style={{ width:56, height:56, borderRadius:'50%', background:'#fff', border:`3px solid ${C.green400}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Outfit',sans-serif", fontSize:'1.25rem', fontWeight:800, color:C.green600, position:'relative', zIndex:1, boxShadow:'0 4px 12px rgba(22,163,74,.2)' }}>{n}</div>
                <div style={{ minWidth:0 }}>
                  <h3 className="iq-step-title" style={{ fontFamily:"'Outfit',sans-serif", fontSize:'1rem', fontWeight:700, color:C.gray900, marginBottom:'.35rem' }}>{title}</h3>
                  <p className="iq-step-desc" style={{ fontSize:'.875rem', color:C.gray500, lineHeight:1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALERTS DEMO ─────────────────────────────────────────────────── */}
      <section id="alerts-demo" className="iq-section" style={{ padding:'6rem 0', background:'#fff', overflow:'hidden' }}>
        <div className="iq-container">
          <div className="iq-alerts-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5rem', alignItems:'center' }}>
            {/* Mockup */}
            <div className="iq-fade-up" style={{ minWidth:0 }}>
              <div className="iq-alerts-card" style={{ background:C.gray50, border:`1px solid ${C.gray200}`, borderRadius:'1.5rem', padding:'1.5rem', boxShadow:'0 10px 15px -3px rgba(0,0,0,.08)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1.25rem', paddingBottom:'1rem', borderBottom:`1px solid ${C.gray200}` }}>
                  <span style={{ fontSize:'1.1rem' }}>📋</span>
                  <span style={{ fontWeight:700, color:C.gray800, fontSize:'.9375rem' }}>Reorder Suggestions</span>
                  <span style={{ marginLeft:'auto', background:C.green100, color:C.green700, fontSize:'.75rem', fontWeight:600, padding:'.25rem .625rem', borderRadius:999, flexShrink:0 }}>4 items</span>
                </div>
                {[
                  { bg:'#fff1f2', bc:'#fecdd3', name:'🌾 Aashirvaad Atta 5kg',   meta:'Stock: 2 · Reorder at: 12 · Order: 30u (3 ctn)', ub:'Critical', uc:'#dc2626', ub_bg:'#fee2e2' },
                  { bg:'#fff7ed', bc:'#fed7aa', name:'🧴 Tata Tea Premium 500g', meta:'Stock: 5 · Reorder at: 10 · Order: 15u (1 ctn)', ub:'High',     uc:'#ea580c', ub_bg:'#ffedd5' },
                  { bg:'#fefce8', bc:'#fef08a', name:'🍜 Maggi Noodles Pack-10', meta:'Stock: 8 · Reorder at: 12 · Order: 20u (2 ctn)', ub:'Medium',   uc:'#ca8a04', ub_bg:'#fef9c3' },
                  { bg:'#f0fdf4', bc:C.green200, name:'🧈 Amul Butter 100g',    meta:'Stock: 14 · Reorder at: 15 · Order: 10u (1 ctn)',ub:'Low',      uc:C.green700, ub_bg:C.green100 },
                ].map(({ bg, bc, name, meta, ub, uc, ub_bg }) => (
                  <div key={name} className="iq-alert-row" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'.75rem', padding:'.875rem 1rem', borderRadius:'.875rem', marginBottom:'.625rem', border:`1px solid ${bc}`, background:bg }}>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:'.875rem', color:C.gray800 }}>{name}</div>
                      <div style={{ fontSize:'.75rem', color:C.gray500, marginTop:2, lineHeight:1.45 }}>{meta}</div>
                    </div>
                    <span style={{ fontSize:'.6875rem', fontWeight:700, padding:'.25rem .625rem', borderRadius:999, textTransform:'uppercase', letterSpacing:'.03em', background:ub_bg, color:uc, flexShrink:0 }}>{ub}</span>
                  </div>
                ))}
                <a href="#cta" className="iq-wabtn" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.625rem', width:'100%', marginTop:'1rem', padding:'.875rem', background:'#25d366', color:'#fff', borderRadius:'.875rem', fontWeight:700, fontSize:'.9375rem', textDecoration:'none', transition:'all .2s' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.893.066C5.635.066.548 5.154.548 11.412c0 2.011.525 3.899 1.443 5.536L.07 23.398l6.56-1.721a11.31 11.31 0 005.264 1.302c6.258 0 11.345-5.088 11.345-11.345 0-6.258-5.087-11.568-11.346-11.568zm0 20.754a9.384 9.384 0 01-4.79-1.31l-.344-.203-3.534.928.942-3.449-.223-.355a9.36 9.36 0 01-1.434-4.999c0-5.18 4.213-9.393 9.393-9.393 5.181 0 9.394 4.213 9.394 9.393 0 5.181-4.213 9.388-9.404 9.388z"/></svg>
                  Send Order via WhatsApp
                </a>
              </div>
            </div>
            {/* Copy */}
            <div className="iq-fade-up iq-d2" style={{ minWidth:0 }}>
              <SectionTag>🔴 Smart Alerts</SectionTag>
              <h2 className="iq-heading-md" style={{ fontFamily:"'Outfit',sans-serif", fontSize:'clamp(1.875rem,4vw,2.5rem)', fontWeight:800, color:C.gray900, lineHeight:1.2, letterSpacing:'-.02em', marginBottom:'1rem' }}>
                Know <span style={{ color:C.green600 }}>exactly</span> what<br />to order, and when
              </h2>
              <p className="iq-subtext" style={{ color:C.gray500, fontSize:'1.0625rem', lineHeight:1.7, marginBottom:'1.75rem' }}>
                InventIQ's forecasting engine runs every night at 11 PM IST and generates prioritised reorder suggestions based on your actual sales patterns — not guesswork.
              </p>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'1rem', padding:0, margin:0 }}>
                {[
                  'Safety stock calculated using statistical deviation (1.65σ) — prevents stockouts even during demand spikes.',
                  'Reorder quantities rounded up to the nearest pack or carton size automatically.',
                  'Salary-week and weekend demand boosts baked in — because Fridays really do sell more Maggi.',
                  '1-tap WhatsApp deep link with pre-filled order message per distributor — zero manual typing.',
                ].map((text, i) => (
                  <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:'.875rem', fontSize:'.9375rem', color:C.gray600 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:C.green100, color:C.green600, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.75rem', flexShrink:0, marginTop:1 }}>✓</div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FORECASTING ENGINE ──────────────────────────────────────────── */}
      <section id="forecasting" className="iq-section" style={{ padding:'6rem 0', background:`linear-gradient(135deg,${C.green950} 0%,${C.green900} 100%)`, position:'relative', overflow:'hidden' }}>
        <div className="iq-container">
          <div className="iq-forecast-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5rem', alignItems:'center' }}>
            <div className="iq-fade-up" style={{ minWidth:0 }}>
              <SectionTagDark>🧠 Under the Hood</SectionTagDark>
              <h2 className="iq-heading-md" style={{ fontFamily:"'Outfit',sans-serif", fontSize:'clamp(1.875rem,4vw,2.5rem)', fontWeight:800, color:'#fff', lineHeight:1.2, letterSpacing:'-.02em', marginBottom:'.75rem' }}>
                The Forecasting<br />Engine Explained
              </h2>
              <p className="iq-subtext" style={{ color:'rgba(255,255,255,.65)', fontSize:'1.0625rem', lineHeight:1.7, marginBottom:'2rem' }}>
                Our Weighted Moving Average algorithm is purpose-built for kirana stores — accounting for seasonal patterns, salary weeks, and lead times.
              </p>
              <Link to={isLoggedIn ? '/dashboard' : '/register'} className="iq-btn-primary iq-forecast-cta" style={btnPrimary}>
                {isLoggedIn ? 'Open Dashboard →' : 'Try It Free →'}
              </Link>
            </div>
            <div className="iq-fade-up iq-d2" style={{ display:'flex', flexDirection:'column', gap:'.875rem', minWidth:0 }}>
              {[
                ['1','Pull last 28 days of sales for each product'],
                ['2','Apply Weighted Moving Average — last 7 days, recent = higher weight'],
                ['3','Apply seasonal multipliers: Weekend ×1.15, Salary week (1st–7th) ×1.25'],
                ['4','Safety Stock = 1.65 × σ(daily_sales) × √(lead_time_days)'],
                ['5','Reorder Point = (avg_daily × lead_time) + safety_stock'],
                ['6','If currentStock ≤ reorderPoint → generate urgency-ranked suggestion'],
                ['7','Order qty rounded up to nearest pack/carton → sent via WhatsApp'],
              ].map(([n, text]) => (
                <div key={n} className="iq-forecast-step" style={{ display:'flex', alignItems:'flex-start', gap:'1rem', padding:'1.125rem', borderRadius:'1rem', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)' }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'rgba(74,222,128,.2)', color:C.green400, fontWeight:700, fontSize:'.875rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{n}</div>
                  <div className="iq-forecast-text" style={{ fontSize:'.9375rem', color:'rgba(255,255,255,.75)', lineHeight:1.6, minWidth:0, overflowWrap:'anywhere', wordBreak:'break-word' }} dangerouslySetInnerHTML={{ __html: text.replace(/(Weighted Moving Average|seasonal multipliers|Safety Stock|Reorder Point|currentStock ≤ reorderPoint|rounded up|last 28 days)/g, '<strong style="color:#fff">$1</strong>') }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section id="cta" className="iq-section" style={{ padding:'6rem 0', background:`linear-gradient(135deg,${C.green700} 0%,${C.green600} 50%,#34d399 100%)`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'rgba(255,255,255,.06)', top:-200, right:-200 }} />
        <div className="iq-container" style={{ position:'relative', zIndex:1 }}>
          <div className="iq-fade-up" style={{ textAlign:'center' }}>
            <h2 className="iq-heading-lg" style={{ fontFamily:"'Outfit',sans-serif", fontSize:'clamp(2rem,5vw,3.25rem)', fontWeight:900, color:'#fff', lineHeight:1.15, letterSpacing:'-.02em', marginBottom:'1.25rem' }}>
              Ready to take control<br />of your inventory?
            </h2>
            <p className="iq-subtext" style={{ fontSize:'1.125rem', color:'rgba(255,255,255,.8)', maxWidth:520, margin:'0 auto 2.5rem', lineHeight:1.7 }}>
              Set up in minutes, runs free forever. Never run out of stock again.
            </p>
            <div className="iq-cta-actions" style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
              {isLoggedIn ? (
                <Link to="/dashboard" className="iq-btn-white" style={btnWhite}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Open Store Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="iq-btn-white" style={btnWhite}>
                    <img src="/icon.svg" alt="" style={{ width: 19, height: 19, borderRadius: 5, flexShrink: 0 }} />
                    Launch InventIQ Free
                  </Link>
                  <Link to="/login" className="iq-btn-ghost" style={btnGhost}>Already have an account? Login →</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <SiteFooter />

      {/* ── SCROLL TO TOP ("SCROLL TO ABOVE") BUTTON ──────────────────── */}
      <button
        type="button"
        onClick={scrollToTop}
        className="iq-scroll-top-btn"
        aria-label="Scroll to top"
        title="Scroll to top"
        style={{
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.8)',
          pointerEvents: showScrollTop ? 'auto' : 'none',
          visibility: showScrollTop ? 'visible' : 'hidden',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

    </div>
  );
}
