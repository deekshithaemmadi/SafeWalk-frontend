import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorMessage({
  title = "Error",
  message,
  onRetry,
  variant = "error", // 'error' | 'warning' | 'info'
}) {
  if (!message) return null;

  return (
    <div className={`alert-box alert-${variant}`} role="alert">
      <div className="alert-content">
        <AlertCircle className="alert-icon" size={20} />
        <div>
          {title && <h4 className="alert-title">{title}</h4>}
          <p className="alert-message">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button type="button" className="alert-retry-btn" onClick={onRetry}>
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
