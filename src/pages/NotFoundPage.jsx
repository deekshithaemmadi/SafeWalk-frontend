import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-icon-wrapper">
          <Compass size={48} className="not-found-icon animate-pulse" />
        </div>
        <span className="not-found-badge">ERROR 404</span>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-desc">
          The page or route you are looking for does not exist or has been relocated.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="btn-not-found-primary">
            <Home size={18} />
            <span>Return to Homepage</span>
          </Link>
          <Link to="/plan" className="btn-not-found-secondary">
            <Compass size={18} />
            <span>Plan a Journey</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
