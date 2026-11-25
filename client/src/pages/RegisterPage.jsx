import { useState, useRef, useEffect, useCallback } from 'react';
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
  red500: '#ef4444',
};

/* ── Input field ─────────────────────────────────────────────────────────── */
function InputField({ id, label, type = 'text', placeholder, inputMode, autoComplete, value, onChange, hint, isPhone, required = true }) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === 'password';
  const resolvedType = isPwd ? (showPwd ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem' }}>
      <label htmlFor={id} style={{ fontSize: '.875rem', fontWeight: 600, color: C.gray700, letterSpacing: '.01em' }}>
        {label}{required && <span style={{ color: C.red500, marginLeft: 2 }}>*</span>}
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
          id={id} name={id} type={resolvedType} inputMode={inputMode}
          autoComplete={autoComplete} required={required} value={value} onChange={onChange}
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

/* ── Step indicator ─────────────────────────────────────────────────────── */
function StepDots({ current, total }) {
  const labels = ['Store info', 'Set password', 'Verify email'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'center', marginBottom: '1.75rem' }}>
      {Array.from({ length: total }, (_, i) => i + 1).map((s, i, arr) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: current >= s ? C.green600 : C.gray200, color: current >= s ? '#fff' : C.gray500, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, transition: 'all .3s', flexShrink: 0 }}>
              {current > s ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg> : s}
            </div>
            <span style={{ fontSize: '.8125rem', fontWeight: 600, color: current >= s ? C.green700 : C.gray400, transition: 'color .3s' }}>
              {labels[s - 1]}
            </span>
          </div>
          {i < arr.length - 1 && (
            <div style={{ width: 24, height: 2, borderRadius: 2, background: current > s ? C.green400 : C.gray200, transition: 'background .3s', margin: '0 .1rem' }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── OTP input boxes ─────────────────────────────────────────────────────── */
function OtpInput({ value, onChange }) {
  const digits = (value + '      ').slice(0, 6).split('');
  const refs = useRef([]);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleChange = (i, e) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    if (!ch) return;
    const arr = value.padEnd(6, ' ').split('');
    arr[i] = ch;
    const next = arr.join('').trimEnd().slice(0, 6);
    onChange(next);
    if (i < 5) setTimeout(() => refs.current[i + 1]?.focus(), 0);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    setTimeout(() => refs.current[focusIdx]?.focus(), 0);
  };

  return (
    <div style={{ display: 'flex', gap: '.625rem', justifyContent: 'center' }}>
      {digits.map((d, i) => {
        const filled = value.length > i;
        return (
          <input
            key={i}
            ref={el => refs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={filled ? value[i] : ''}
            onChange={e => handleChange(i, e)}
            onKeyDown={e => handleKey(i, e)}
            onPaste={handlePaste}
            style={{
              width: 48, height: 56, textAlign: 'center', fontSize: '1.5rem', fontWeight: 700,
              border: `2px solid ${filled ? C.green500 : C.gray200}`,
              borderRadius: '.75rem', outline: 'none', color: C.gray900,
              background: filled ? C.green50 : C.gray100,
              boxShadow: filled ? `0 0 0 3px rgba(34,197,94,.10)` : 'none',
              transition: 'all .18s', caretColor: 'transparent', boxSizing: 'border-box',
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Countdown timer hook ────────────────────────────────────────────────── */
function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds);
  const reset = useCallback((s = seconds) => setRemaining(s), [seconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  return { remaining, reset };
}

/* ── Summary pill ─────────────────────────────────────────────────────────── */
function StorePill({ form, onEdit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', background: C.green50, border: `1px solid ${C.green200}`, borderRadius: '.875rem', padding: '.75rem 1rem' }}>
      <span style={{ fontSize: '1.25rem' }}>🏪</span>
      <div>
        <div style={{ fontWeight: 600, fontSize: '.875rem', color: C.gray800 }}>{form.storeName || 'Your Store'}</div>
        <div style={{ fontSize: '.75rem', color: C.gray500 }}>{form.phone} · {form.email}</div>
      </div>
      <button type="button" onClick={onEdit} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.green600, fontSize: '.8125rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Edit</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const initialForm = { name: '', storeName: '', phone: '', email: '', pincode: '', password: '', confirmPassword: '' };

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');

  const { remaining: countdown, reset: resetCountdown } = useCountdown(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setForm(p => ({ ...p, phone: value.replace(/\D/g, '').slice(0, 10) }));
    } else if (name === 'pincode') {
      setForm(p => ({ ...p, pincode: value.replace(/\D/g, '').slice(0, 6) }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  };

  /* ── Step 1: validate store info ─────────────────────────────────────────── */
  const handleStep1 = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Please enter your full name.'); return; }
    if (!form.storeName.trim()) { toast.error('Please enter your store name.'); return; }
    if (!/^[6-9]\d{9}$/.test(form.phone)) { toast.error('Please enter a valid 10-digit Indian mobile number.'); return; }
    if (!form.email.trim()) { toast.error('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { toast.error('Please enter a valid email address.'); return; }
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) { toast.error('Pincode must be 6 digits.'); return; }
    setStep(2);
  };

  /* ── Step 2: validate password, send OTP ─────────────────────────────────── */
  const handleStep2 = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match.'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      await apiClient.post('/auth/send-otp', {
        email: form.email.trim(),
        phone: form.phone,
        storeName: form.storeName,
      });
      toast.success(`Verification code sent to ${form.email}!`);
      setOtp('');
      resetCountdown(60);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP ──────────────────────────────────────────────────────────── */
  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await apiClient.post('/auth/resend-otp', {
        email: form.email.trim(),
        storeName: form.storeName,
      });
      toast.success('New verification code sent!');
      setOtp('');
      resetCountdown(60);
    } catch (err) {
      const wait = err.response?.data?.waitSeconds;
      toast.error(err.response?.data?.message || 'Please wait before requesting a new code.');
      if (wait) resetCountdown(wait);
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: verify OTP and create account ───────────────────────────────── */
  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { toast.error('Please enter the full 6-digit code.'); return; }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-otp-register', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        storeName: form.storeName.trim(),
        pincode: form.pincode,
        password: form.password,
        otp: otp.trim(),
      });

      const payload = res.data?.data || res.data;
      if (!payload?.accessToken) throw new Error('Account created but auto-login failed.');

      setAuth(payload.user, payload.accessToken, true);
      toast.success(`Welcome to InventIQ, ${payload.user?.name || 'Shopkeeper'}! 🎉`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ───────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, sans-serif; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }
        .iq-reg-card { animation: fadeUp .5s ease both; }
        .iq-submit:hover:not(:disabled) { background: ${C.green700} !important; box-shadow: 0 8px 24px rgba(22,163,74,.45) !important; transform: translateY(-1px); }
        .iq-submit:active:not(:disabled) { transform: translateY(0) !important; }
        .iq-submit:disabled { opacity:.65; cursor:not-allowed; }
        .iq-link:hover { color: ${C.green700} !important; text-decoration: underline; }
        .iq-ghost:hover { background: ${C.green50} !important; border-color: ${C.green500} !important; }
        .iq-back-btn:hover { background: ${C.gray200} !important; }
        .iq-resend:hover:not(:disabled) { text-decoration: underline; }
        .iq-resend:disabled { opacity:.5; cursor:not-allowed; }
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
        <div className="iq-reg-card" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 500, background: '#fff', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,.07), 0 24px 48px -12px rgba(0,0,0,.18)', border: `1px solid ${C.gray200}`, overflow: 'hidden' }}>

          {/* Accent bar */}
          <div style={{ height: 4, background: `linear-gradient(90deg, ${C.green600}, ${C.green400}, #34d399)` }} />

          <div style={{ padding: '2.5rem 2.5rem 2rem' }}>

            {/* Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
              <img
                src="/icon.svg"
                alt="InventIQ"
                style={{ width: 56, height: 56, borderRadius: 16, marginBottom: '1rem', boxShadow: `0 8px 24px rgba(22,163,74,.35)`, display: 'block' }}
              />
              <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '1.625rem', fontWeight: 800, color: C.gray900, letterSpacing: '-.02em', marginBottom: '.25rem' }}>Create your account</h1>
              <p style={{ color: C.gray500, fontSize: '.875rem', textAlign: 'center' }}>Register your kirana store on InventIQ — free, forever.</p>
            </div>

            {/* Step indicator */}
            <StepDots current={step} total={3} />

            {/* ── Step 1: Store info + contact ────────────────────────────────── */}
            {step === 1 && (
              <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <InputField id="name" label="Your name" placeholder="Ramesh Kumar" value={form.name} onChange={handleChange} />
                  <InputField id="pincode" label="Pincode" inputMode="numeric" placeholder="400001" value={form.pincode} onChange={handleChange} required={false} />
                </div>
                <InputField id="storeName" label="Store name" placeholder="Ramesh General Store" value={form.storeName} onChange={handleChange} />
                <InputField id="phone" label="Phone number" type="tel" inputMode="numeric" autoComplete="tel" placeholder="98765 43210" isPhone={true} value={form.phone} onChange={handleChange} />
                <InputField id="email" label="Email address" type="email" autoComplete="email" placeholder="ramesh@example.com" value={form.email} onChange={handleChange}
                  hint="A verification code will be sent to this email." />

                <button type="submit" className="iq-submit"
                  style={{ width: '100%', background: C.green600, color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '.9rem', borderRadius: '.75rem', border: 'none', cursor: 'pointer', marginTop: '.25rem', boxShadow: `0 4px 16px rgba(22,163,74,.35)`, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m0 0l-7-7m7 7l-7 7" /></svg>
                </button>
              </form>
            )}

            {/* ── Step 2: Password ──────────────────────────────────────────── */}
            {step === 2 && (
              <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                <StorePill form={form} onEdit={() => setStep(1)} />

                <InputField id="password" label="Password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={form.password} onChange={handleChange} />
                <StrengthBar password={form.password} />

                <InputField id="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" placeholder="Re-enter your password" value={form.confirmPassword} onChange={handleChange} />

                {form.confirmPassword.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', fontSize: '.8125rem', fontWeight: 500, color: form.password === form.confirmPassword ? C.green600 : C.red500 }}>
                    {form.password === form.confirmPassword
                      ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Passwords match</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>Passwords don't match</>
                    }
                  </div>
                )}

                {/* Info banner */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '.75rem', padding: '.875rem 1rem', fontSize: '.8125rem', color: '#1e40af', display: 'flex', gap: '.5rem' }}>
                  <span>📧</span>
                  <span>Clicking <strong>"Send Verification Code"</strong> will email a 6-digit OTP to <strong>{form.email}</strong></span>
                </div>

                <div style={{ display: 'flex', gap: '.75rem', marginTop: '.25rem' }}>
                  <button type="button" onClick={() => setStep(1)} className="iq-back-btn"
                    style={{ padding: '.875rem 1.25rem', borderRadius: '.75rem', border: `1.5px solid ${C.gray300}`, background: C.gray100, color: C.gray600, fontWeight: 600, fontSize: '.9375rem', cursor: 'pointer', transition: 'background .2s', display: 'flex', alignItems: 'center', gap: '.375rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m0 0l7 7m-7-7l7-7" /></svg>
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="iq-submit"
                    style={{ flex: 1, background: C.green600, color: '#fff', fontWeight: 700, fontSize: '.9375rem', padding: '.875rem', borderRadius: '.75rem', border: 'none', cursor: 'pointer', boxShadow: `0 4px 16px rgba(22,163,74,.35)`, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                    {loading
                      ? <><svg style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>Sending…</>
                      : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Send Verification Code</>
                    }
                  </button>
                </div>
              </form>
            )}

            {/* ── Step 3: OTP verification ──────────────────────────────────── */}
            {step === 3 && (
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Email badge */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: C.green50, border: `1px solid ${C.green200}`, borderRadius: '2rem', padding: '.5rem 1rem', fontSize: '.875rem', color: C.green700, fontWeight: 600, marginBottom: '.5rem' }}>
                    <span>📧</span>
                    <span>{form.email}</span>
                  </div>
                  <p style={{ fontSize: '.875rem', color: C.gray500 }}>
                    We sent a 6-digit code to this address.<br />
                    <span style={{ fontSize: '.8125rem' }}>Check your inbox (and spam folder).</span>
                  </p>
                </div>

                {/* OTP input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
                  <label style={{ textAlign: 'center', fontSize: '.875rem', fontWeight: 600, color: C.gray700 }}>Enter verification code</label>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>

                {/* Resend */}
                <div style={{ textAlign: 'center', fontSize: '.8125rem', color: C.gray500 }}>
                  Didn't receive it?{' '}
                  <button type="button" disabled={countdown > 0 || loading} onClick={handleResend} className="iq-resend"
                    style={{ background: 'none', border: 'none', color: countdown > 0 ? C.gray400 : C.green600, fontWeight: 600, cursor: countdown > 0 ? 'not-allowed' : 'pointer', padding: 0, fontSize: '.8125rem', transition: 'color .2s' }}>
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                </div>

                {/* Change email */}
                <div style={{ textAlign: 'center' }}>
                  <button type="button" onClick={() => { setStep(1); setOtp(''); }}
                    style={{ background: 'none', border: 'none', color: C.gray500, fontSize: '.8125rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                    Wrong email? Change it
                  </button>
                </div>

                {/* Dev hint */}
                <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '.75rem', padding: '.75rem 1rem', fontSize: '.8rem', color: '#78350f' }}>
                  <strong>💡 Development mode:</strong> If no email arrives, check your <strong>server terminal</strong> — the OTP is printed there.
                </div>

                {/* Verify button */}
                <button type="submit" disabled={loading || otp.length < 6} className="iq-submit"
                  style={{ width: '100%', background: C.green600, color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '.9rem', borderRadius: '.75rem', border: 'none', cursor: 'pointer', boxShadow: `0 4px 16px rgba(22,163,74,.35)`, transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  {loading
                    ? <><svg style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>Verifying…</>
                    : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Verify &amp; Create Account</>
                  }
                </button>
              </form>
            )}

            {/* Sign-in link */}
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
