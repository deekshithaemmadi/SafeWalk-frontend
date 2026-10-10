import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, UserCheck } from "lucide-react";
import { useAuth } from "../context/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { ApiError } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setIsBackendOffline(false);

    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.isNetworkError) {
        setIsBackendOffline(true);
        setServerError(
          "Backend authentication service at http://localhost:8080 is unreachable. Please verify that the Spring Boot server is running."
        );
      } else {
        setServerError(err.message || "Invalid credentials. Please check your email and password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Offline Preview Mode for frontend evaluation when backend server is not running
  const handleOfflineDemoLogin = () => {
    const demoUser = {
      name: formData.email ? formData.email.split("@")[0] : "Demo Traveler",
      email: formData.email.trim() || "demo@safewalk.org",
      phone: "9876543210",
      emergencyContacts: [
        { id: "1", name: "Family Primary", phone: "9876543211", relation: "Mother" },
        { id: "2", name: "Trusted Friend", phone: "9876543212", relation: "Sister" },
      ],
    };
    updateUser(demoUser);
    navigate(from, { replace: true });
  };

  return (
    <div className="auth-page-container">
      <div className="auth-page-card">
        {/* Brand header */}
        <div className="auth-card-top">
          <div className="auth-brand-badge">
            <Shield size={24} />
          </div>
          <span className="auth-badge-label">SAFEWALK ACCESS</span>
          <h1 className="auth-card-title">Welcome Back</h1>
          <p className="auth-card-subtitle">
            Sign in to access your safety dashboard and manage travel routes.
          </p>
        </div>

        {/* Server error alert */}
        {serverError && (
          <div className="auth-alert-wrapper">
            <ErrorMessage
              title={isBackendOffline ? "Backend Unreachable" : "Login Failed"}
              message={serverError}
              variant={isBackendOffline ? "warning" : "error"}
            />

            {isBackendOffline && (
              <div className="offline-demo-banner">
                <p className="offline-demo-hint">
                  Running a frontend review without the Spring Boot backend? You can explore the UI with local preview state:
                </p>
                <button
                  type="button"
                  className="btn-offline-demo"
                  onClick={handleOfflineDemoLogin}
                >
                  <UserCheck size={16} />
                  <span>Explore Offline Preview Mode</span>
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email input */}
          <div className="form-group">
            <label htmlFor="login-email" className="input-label">
              Email Address
            </label>
            <div className={`input-icon-field ${fieldErrors.email ? "has-error" : ""}`}>
              <Mail className="field-icon" size={18} />
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                }}
                disabled={submitting}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && <p className="input-error-msg">{fieldErrors.email}</p>}
          </div>

          {/* Password input */}
          <div className="form-group">
            <label htmlFor="login-password" className="input-label">
              Password
            </label>
            <div className={`input-icon-field ${fieldErrors.password ? "has-error" : ""}`}>
              <Lock className="field-icon" size={18} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                }}
                disabled={submitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <p className="input-error-msg">{fieldErrors.password}</p>}
          </div>

          {/* Submit button */}
          <button type="submit" className="btn-auth-submit" disabled={submitting}>
            {submitting ? (
              <LoadingSpinner message="Signing in..." size="sm" inline />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Don't have an account yet?{" "}
            <Link to="/register" className="auth-link">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
