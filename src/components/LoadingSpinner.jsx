import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ message = "Loading...", size = "md", inline = false }) {
  const pixelMap = {
    sm: 16,
    md: 24,
    lg: 40,
  };

  const spinnerPx = pixelMap[size] || 24;

  if (inline) {
    return (
      <span className="spinner-inline" role="status" aria-live="polite">
        <Loader2 className="spinner-icon animate-spin" size={spinnerPx} />
        {message && <span className="spinner-message">{message}</span>}
      </span>
    );
  }

  return (
    <div className={`spinner-container spinner-${size}`} role="status" aria-live="polite">
      <Loader2 className="spinner-icon animate-spin" size={spinnerPx} />
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
}
