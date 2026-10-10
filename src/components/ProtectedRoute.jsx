import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-loading-wrapper">
        <LoadingSpinner message="Checking authentication..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and remember where the user was trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
