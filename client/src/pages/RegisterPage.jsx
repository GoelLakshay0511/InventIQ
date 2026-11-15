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

/* ── Input field ────────────────────────────────────────────────────────── */
function InputField({ id, label, type = 'text', placeholder, inputMode, autoComplete, value, onChange, hint, isPhone }) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === 'password';
  const resolvedType = isPwd ? (showPwd ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem' }}>
      <label htmlFor={id} style={{ fontSize: '.875rem', fontWeight: 600, color: C.gray700, letterSpacing: '.01em' }}>{label}</label>
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
          id={id} name={id} type={resolvedType} inputMode={inputMode}
          autoComplete={autoComplete} required value={value} onChange={onChange}
          maxLength={isPhone ? 10 : (id === 'pincode' ? 6 : undefined)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: '.8125rem 1rem',
            paddingLeft: isPhone ? '4.8rem' : '1rem',
            paddingRight: isPwd ? '3rem' : '1rem',
            border: `1.5px solid ${focused ? C.green500 : C.gray200}`,
            borderRadius: '.75rem', fontSize: '.9375rem', color: C.gray900,
            background: focused ? '#fff' : C.gray100, outline: 'none',
            boxShadow: focused ? `0 0 0 3px rgba(34,197,94,.12)` : 'none',
            transition: 'all .2s', boxSizing: 'border-box',
          }}
        />
        {isPwd && (
          <button type="button" onClick={() => setShowPwd(v => !v)}
            style={{ position: 'absolute', right: '.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.gray400, fontSize: '1rem', lineHeight: 1, padding: 0 }}>
            {showPwd ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: '.75rem', color: C.gray400, margin: 0 }}>{hint}</p>}
    </div>
  );
}

/* ── Password strength bar ──────────────────────────────────────────────── */
function StrengthBar({ password }) {
  if (!password) return null;
  const len = password.length;
  const score = len >= 10 ? 4 : len >= 8 ? 3 : len >= 6 ? 2 : len >= 3 ? 1 : 0;
  const colors = ['', '#ef4444', '#f97316', C.green400, C.green600];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '-.25rem' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= score ? colors[score] : C.gray200, transition: 'background .3s' }} />
      ))}
      <span style={{ fontSize: '.75rem', fontWeight: 600, color: colors[score] || C.gray400, whiteSpace: 'nowrap', minWidth: 38 }}>{labels[score]}</span>
    </div>
  );
}

const initialForm = { name: '', storeName: '', phone: '', pincode: '', password: '', confirmPassword: '' };

/* ── Step indicator ─────────────────────────────────────────────────────── */
function StepDots({ current, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'center', marginBottom: '1.75rem' }}>
      {Array.from({ length: total }, (_, i) => i + 1).map((s, i, arr) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: current >= s ? C.green600 : C.gray200, color: current >= s ? '#fff' : C.gray500, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, transition: 'all .3s', flexShrink: 0 }}>
              {current > s ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg> : s}
            </div>
            <span style={{ fontSize: '.8125rem', fontWeight: 600, color: current >= s ? C.green700 : C.gray400, transition: 'color .3s' }}>
              {['Store info', 'Set password'][s - 1]}
            </span>
          </div>
          {i < arr.length - 1 && (
            <div style={{ width: 36, height: 2, borderRadius: 2, background: current > s ? C.green400 : C.gray200, transition: 'background .3s', margin: '0 .25rem' }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setForm(p => ({ ...p, phone: digitsOnly }));
    } else if (name === 'pincode') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      setForm(p => ({ ...p, pincode: digitsOnly }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Please enter your full name.'); return; }
    if (!form.storeName.trim()) { toast.error('Please enter your kirana store name.'); return; }
    if (!/^[6-9]\d{9}$/.test(form.phone)) { toast.error('Please enter a valid 10-digit Indian mobile number.'); return; }
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) { toast.error('Pincode must be 6 digits.'); return; }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match.'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await apiClient.post('/auth/register', { name: form.name, storeName: form.storeName, phone: form.phone, pincode: form.pincode, password: form.password });
      const loginRes = await apiClient.post('/auth/login', { phone: form.phone, password: form.password });
      const payload = loginRes.data?.data || loginRes.data;
      if (!payload?.accessToken) throw new Error('Registration complete, but auto-login failed.');
      setAuth(payload.user, payload.accessToken, true);
      toast.success(`Welcome to InventIQ, ${payload.user?.name || 'Shopkeeper'}! 🎉`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
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
        .iq-reg-card { animation: fadeUp .5s ease both; }
        .iq-submit:hover:not(:disabled) { background: ${C.green700} !important; box-shadow: 0 8px 24px rgba(22,163,74,.45) !important; transform: translateY(-1px); }
        .iq-submit:active:not(:disabled) { transform: translateY(0) !important; }
        .iq-submit:disabled { opacity:.65; cursor:not-allowed; }
        .iq-link:hover { color: ${C.green700} !important; text-decoration: underline; }
        .iq-ghost:hover { background: ${C.green50} !important; border-color: ${C.green500} !important; }
        .iq-back-btn:hover { background: ${C.gray200} !important; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${C.green950}cc 0%, ${C.green900}88 40%, transparent 70%), ${C.gray100}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1rem', position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${C.gray200} 1px, transparent 1px), linear-gradient(90deg, ${C.gray200} 1px, transparent 1px)`, backgroundSize: '40px 40px', opacity: .5 }} />
        {/* Top glow */}
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${C.green600}22 0%, transparent 70%)`, top: -200, left: '50%', transform: 'translateX(-50%)' }} />

        {/* Card */}
        <div className="iq-reg-card" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, background: '#fff', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,.07), 0 24px 48px -12px rgba(0,0,0,.18)', border: `1px solid ${C.gray200}`, overflow: 'hidden' }}>

          {/* Accent bar */}
          <div style={{ height: 4, background: `linear-gradient(90deg, ${C.green600}, ${C.green400}, #34d399)` }} />

          <div style={{ padding: '2.5rem 2.5rem 2rem' }}>
            {/* Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${C.green700}, ${C.green500})`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', marginBottom: '1rem', boxShadow: `0 8px 24px rgba(22,163,74,.35)` }}>📦</div>
              <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.625rem', fontWeight: 800, color: C.gray900, letterSpacing: '-.02em', marginBottom: '.25rem' }}>Create your account</h1>
              <p style={{ color: C.gray500, fontSize: '.875rem', textAlign: 'center' }}>Register your kirana store on InventIQ — free, forever.</p>
            </div>

            {/* Step indicator */}
            <StepDots current={step} total={2} />

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <InputField id="name" label="Your name" placeholder="Ramesh Kumar" value={form.name} onChange={handleChange} />
                  <InputField id="pincode" label="Pincode" inputMode="numeric" placeholder="400001" value={form.pincode} onChange={handleChange} />
                </div>
                <InputField id="storeName" label="Store name" placeholder="Ramesh General Store" value={form.storeName} onChange={handleChange} />
                <InputField id="phone" label="Phone number" type="tel" inputMode="numeric" autoComplete="tel" placeholder="98765 43210" isPhone={true} value={form.phone} onChange={handleChange} />

                <button type="submit" className="iq-submit"
                  style={{ width: '100%', background: C.green600, color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '.9rem', borderRadius: '.75rem', border: 'none', cursor: 'pointer', marginTop: '.25rem', boxShadow: `0 4px 16px rgba(22,163,74,.35)`, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m0 0l-7-7m7 7l-7 7" /></svg>
                </button>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                {/* Store info summary pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', background: C.green50, border: `1px solid ${C.green200}`, borderRadius: '.875rem', padding: '.75rem 1rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🏪</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.875rem', color: C.gray800 }}>{form.storeName || 'Your Store'}</div>
                    <div style={{ fontSize: '.75rem', color: C.gray500 }}>{form.phone} · {form.pincode}</div>
                  </div>
                  <button type="button" onClick={() => setStep(1)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.green600, fontSize: '.8125rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Edit</button>
                </div>

                <InputField id="password" label="Password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={form.password} onChange={handleChange} />
                <StrengthBar password={form.password} />

                <InputField id="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" placeholder="Re-enter your password" value={form.confirmPassword} onChange={handleChange} />

                {/* Match indicator */}
                {form.confirmPassword.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', fontSize: '.8125rem', fontWeight: 500, color: form.password === form.confirmPassword ? C.green600 : '#ef4444' }}>
                    {form.password === form.confirmPassword
                      ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Passwords match</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>Passwords don't match</>
                    }
                  </div>
                )}

                <div style={{ display: 'flex', gap: '.75rem', marginTop: '.25rem' }}>
                  <button type="button" onClick={() => setStep(1)} className="iq-back-btn"
                    style={{ padding: '.875rem 1.25rem', borderRadius: '.75rem', border: `1.5px solid ${C.gray300}`, background: C.gray100, color: C.gray600, fontWeight: 600, fontSize: '.9375rem', cursor: 'pointer', transition: 'background .2s', display: 'flex', alignItems: 'center', gap: '.375rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m0 0l7 7m-7-7l7-7" /></svg>
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="iq-submit"
                    style={{ flex: 1, background: C.green600, color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '.875rem', borderRadius: '.75rem', border: 'none', cursor: 'pointer', boxShadow: `0 4px 16px rgba(22,163,74,.35)`, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                    {loading
                      ? <><svg style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>Creating…</>
                      : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Create Account</>
                    }
                  </button>
                </div>
              </form>
            )}

            {/* Sign in link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.875rem', margin: '1.5rem 0 0' }}>
              <div style={{ flex: 1, height: 1, background: C.gray200 }} />
              <span style={{ fontSize: '.8125rem', color: C.gray400, whiteSpace: 'nowrap' }}>
                Already registered?{' '}
                <Link to="/login" className="iq-link" style={{ color: C.green600, fontWeight: 600, textDecoration: 'none', transition: 'color .2s' }}>Sign in</Link>
              </span>
              <div style={{ flex: 1, height: 1, background: C.gray200 }} />
            </div>
          </div>

          {/* Footer bar */}
          <div style={{ background: C.gray100, borderTop: `1px solid ${C.gray200}`, padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
            <Link to="/" className="iq-link" style={{ fontSize: '.8125rem', color: C.gray500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.375rem', transition: 'color .2s' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m0 0l7 7m-7-7l7-7" /></svg>
              Back to home
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', color: C.gray400, fontSize: '.75rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              Secured
            </div>
          </div>
        </div>

        <p style={{ marginTop: '1.5rem', color: C.gray500, fontSize: '.8125rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          © 2026 InventIQ Technologies Inc. · All rights reserved
        </p>
      </div>
    </>
  );
}
