import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * ProtectedRoute — wraps any route that requires authentication.
 * If the in-memory access token is absent, redirect to /login.
 * Otherwise render nested routes via <Outlet />.
 */
export default function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!accessToken || typeof accessToken !== 'string' || accessToken === 'undefined' || accessToken === 'null') {
    // Replace so the user can't hit the Back button to return to a protected page
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
