import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/shared/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import useAuthStore from './store/authStore';

// Page imports — code-split automatically by Vite
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import DashboardPage from './pages/DashboardPage';
import QuickTapPage from './pages/QuickTapPage';
import ProductsPage from './pages/ProductsPage';
import ReorderPage from './pages/ReorderPage';
import DistributorsPage from './pages/DistributorsPage';
import SettingsPage from './pages/SettingsPage';

/** Inline 404 component — keeps the bundle lean */
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-gray-500">
      <span className="text-6xl">📦</span>
      <h1 className="text-2xl font-bold text-gray-700">Page not found</h1>
      <p className="text-sm">The route you requested doesn't exist.</p>
      <a href="/dashboard" className="btn-primary mt-2">
        Go to Dashboard
      </a>
    </div>
  );
}

/** Auth redirect — send authenticated users to dashboard if they try to access login/register */
function AuthRedirect({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ── Public routes ─────────────────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
      <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
      <Route path="/forgot-password" element={<AuthRedirect><ForgotPasswordPage /></AuthRedirect>} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* ── Protected routes (require valid access token) ─────────────── */}
      <Route element={<ProtectedRoute />}>
        {/* All protected pages share the AppLayout shell */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sales/quick-tap" element={<QuickTapPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/reorder" element={<ReorderPage />} />
          <Route path="/distributors" element={<DistributorsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* ── Catch-all ────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
