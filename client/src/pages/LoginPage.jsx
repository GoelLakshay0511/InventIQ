import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import useAuthStore from '../store/authStore';

const C = {
  green50: '#f0fdf4', green100: '#dcfce7', green200: '#bbf7d0',
  green400: '#4ade80', green500: '#22c55e', green600: '#16a34a',
  green700: '#15803d', green900: '#14532d', green950: '#052e16',
  gray100: '#f3f4f6', gray200: '#e5e7eb', gray300: '#d1d5db',
  gray400: '#9ca3af', gray500: '#6b7280', gray600: '#4b5563',
  gray700: '#374151', gray800: '#1f2937', gray900: '#111827',
};

/* ── Reusable Input ─────────────────────────────────────────────────────── */
function InputField({ id, label, type = 'text', placeholder, inputMode, autoComplete, value, onChange, hint, isPhone }) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false); // false = password hidden, true = password shown
  const isPwd = type === 'password';
  const resolvedType = isPwd ? (showPwd ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem' }}>
      <label htmlFor={id} style={{ fontSize: '.875rem', fontWeight: 600, color: C.gray700, letterSpacing: '.01em' }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {isPhone && (
          <div style={{
            position: 'absolute', left: '0.875rem', display: 'flex', alignItems: 'center', gap: '.35rem',
            paddingRight: '.6rem', borderRight: `1.5px solid ${C.gray300}`, zIndex: 2, pointerEvents: 'none'
          }}>
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>🇮🇳</span>
            <span style={{ fontSize: '.875rem', fontWeight: 600, color: C.gray600 }}>+91</span>
          </div>
        )}
        <input
          id={id}
          name={id}
          type={resolvedType}
          inputMode={inputMode}
          autoComplete={autoComplete}
          required
          maxLength={isPhone ? 10 : undefined}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="iq-password-input"
          style={{
            width: '100%',
            padding: '.8125rem 1rem',
            paddingLeft: isPhone ? '4.8rem' : '1rem',
            paddingRight: isPwd ? '3rem' : '1rem',
            border: `1.5px solid ${focused ? C.green500 : C.gray200}`,
            borderRadius: '.75rem',
            fontSize: '.9375rem',
            color: C.gray900,
            background: focused ? '#fff' : C.gray100,
            outline: 'none',
            boxShadow: focused ? `0 0 0 3px rgba(34,197,94,.12)` : 'none',
            transition: 'all .2s',
            boxSizing: 'border-box',
          }}
        />
        {isPwd && (
          <button
            type="button"
            onClick={() => setShowPwd(prev => !prev)}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
            className="iq-eye-btn"
            style={{
              position: 'absolute', right: '.875rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: C.gray400,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '.25rem',
              borderRadius: '.375rem', transition: 'color .2s', zIndex: 3
            }}
          >
            {showPwd ? (
              /* Eye Open Icon (Displayed when text is shown, click to hide) */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              /* Eye Off Icon (Displayed when text is hidden/dots, click to show) */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: '.75rem', color: C.gray400, margin: 0 }}>{hint}</p>}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setForm(p => ({ ...p, phone: digitsOnly }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.phone.trim()) {
      toast.error('Please enter your 10-digit mobile number.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      toast.error('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!form.password) {
      toast.error('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', {
        phone: form.phone.trim(),
        password: form.password,
      });
      const payload = res.data?.data || res.data;
      if (!payload?.accessToken) throw new Error(res.data?.message || 'Login failed: missing access token');
      setAuth(payload.user, payload.accessToken, rememberMe);
      toast.success(`Welcome back, ${payload.user?.name || 'Shopkeeper'}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid credentials. Please verify your phone and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, sans-serif; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .iq-login-card { animation: fadeUp .5s ease both; }
        .iq-submit:hover:not(:disabled) { background: ${C.green700} !important; box-shadow: 0 8px 24px rgba(22,163,74,.45) !important; transform: translateY(-1px); }
        .iq-submit:active:not(:disabled) { transform: translateY(0); }
        .iq-submit:disabled { opacity: .65; cursor: not-allowed; }
        .iq-link:hover { color: ${C.green700} !important; text-decoration: underline; }
        .iq-ghost:hover { background: ${C.green50} !important; border-color: ${C.green600} !important; }
        .iq-eye-btn:hover { color: ${C.gray700} !important; }

        /* Hides the browser's built-in default password reveal buttons */
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none !important;
        }
        input[type="password"]::-webkit-credentials-auto-fill-button {
          visibility: hidden !important;
          pointer-events: none !important;
          position: absolute !important;
          right: 0 !important;
        }
      `}</style>

      {/* Full-page background */}
      <div style={{
        minHeight: '100vh',
        background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${C.green950}cc 0%, ${C.green900}88 40%, transparent 70%), ${C.gray100}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1rem', position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle grid pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${C.gray200} 1px, transparent 1px), linear-gradient(90deg, ${C.gray200} 1px, transparent 1px)`, backgroundSize: '40px 40px', opacity: .5 }} />
        {/* Glow orb */}
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${C.green600}22 0%, transparent 70%)`, top: -200, left: '50%', transform: 'translateX(-50%)' }} />

        {/* Card */}
        <div className="iq-login-card" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, background: '#fff', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,.07), 0 24px 48px -12px rgba(0,0,0,.18)', border: `1.5px solid ${C.gray200}`, overflow: 'hidden' }}>

          {/* Card top accent bar */}
          <div style={{ height: 4, background: `linear-gradient(90deg, ${C.green600}, ${C.green400}, #34d399)` }} />

          <div style={{ padding: '2.5rem 2.5rem 2rem' }}>
            {/* Brand Header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${C.green700}, ${C.green500})`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', marginBottom: '1rem', boxShadow: `0 8px 24px rgba(22,163,74,.35)` }}>
                📦
              </div>
              <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.625rem', fontWeight: 800, color: C.gray900, letterSpacing: '-.02em', marginBottom: '.25rem' }}>
                Sign in to your store
              </h1>
              <p style={{ color: C.gray500, fontSize: '.875rem', textAlign: 'center' }}>
                Access inventory forecasts & automated restock alerts
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <InputField
                id="phone"
                label="Registered Mobile Number"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="98765 43210"
                isPhone={true}
                value={form.phone}
                onChange={handleChange}
              />
              <InputField
                id="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter account password"
                value={form.password}
                onChange={handleChange}
              />

              {/* Remember me */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-.25rem', fontSize: '.8125rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: C.gray600, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: C.green600, width: 15, height: 15, cursor: 'pointer' }}
                  />
                  Remember this device
                </label>
                <Link
                  to="/forgot-password"
                  style={{ color: C.green600, fontWeight: 600, textDecoration: 'none', fontSize: '.8125rem', transition: 'color .2s' }}
                  className="iq-link"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="iq-submit"
                style={{
                  width: '100%', background: C.green600, color: '#fff', fontWeight: 700,
                  fontSize: '1rem', padding: '.9rem', borderRadius: '.75rem', border: 'none',
                  cursor: 'pointer', marginTop: '.375rem', boxShadow: `0 4px 16px rgba(22,163,74,.35)`,
                  transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem'
                }}
              >
                {loading ? (
                  <>
                    <svg style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Authenticating…
                  </>
                ) : 'Sign In to Store →'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.875rem', margin: '1.5rem 0' }}>
              <div style={{ flex: 1, height: 1, background: C.gray200 }} />
              <span style={{ fontSize: '.75rem', color: C.gray400, whiteSpace: 'nowrap' }}>New to InventIQ?</span>
              <div style={{ flex: 1, height: 1, background: C.gray200 }} />
            </div>

            <Link
              to="/register"
              className="iq-ghost"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
                padding: '.875rem', borderRadius: '.75rem', border: `1.5px solid ${C.gray300}`,
                color: C.gray700, fontWeight: 600, fontSize: '.9375rem', textDecoration: 'none',
                background: '#fff', transition: 'all .2s', gap: '.5rem'
              }}
            >
              Register your kirana store
            </Link>
          </div>

          {/* Card footer */}
          <div style={{ background: C.gray100, borderTop: `1px solid ${C.gray200}`, padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
            <Link to="/" className="iq-link" style={{ fontSize: '.8125rem', color: C.gray500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.375rem', transition: 'color .2s' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5m0 0l7 7m-7-7l7-7" />
              </svg>
              Back to home
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', color: C.gray400, fontSize: '.75rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Secured
            </div>
          </div>
        </div>

        {/* Below card */}
        <p style={{ marginTop: '1.5rem', color: C.gray500, fontSize: '.8125rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          © 2026 InventIQ Technologies Inc. · All rights reserved
        </p>
      </div>
    </>
  );
}