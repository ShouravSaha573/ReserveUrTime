import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  role,
  loginPath,
  children
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-white/55">
        Checking session...
      </div>
    );
  }

  if (!user || (role && user.role !== role)) {
    const returnTo = encodeURIComponent(
      `${location.pathname}${location.search}`
    );

    return (
      <Navigate
        to={`${loginPath}?returnTo=${returnTo}`}
        replace
      />
    );
  }

  return children;
}
