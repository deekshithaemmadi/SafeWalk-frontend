import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { ApiError } from "../services/api";

const emptyContact = {
  name: "",
  phone: "",
  relation: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    contact1: { ...emptyContact },
    contact2: { ...emptyContact },
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateContact = (contactKey, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [contactKey]: {
        ...prev[contactKey],
        [field]: value,
      },
    }));
    const errKey = `${contactKey}_${field}`;
    if (fieldErrors[errKey]) {
      setFieldErrors((prev) => ({ ...prev, [errKey]: "" }));
    }
  };

  const validate = () => {
    const errors = {};

    // Personal details
    if (!formData.name.trim()) errors.name = "Full name is required.";
    if (!formData.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = "Phone number must be exactly 10 digits.";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    // Mandatory Contact 1
    if (!formData.contact1.name.trim()) errors.contact1_name = "Contact 1 name is required.";
    if (!formData.contact1.phone.trim()) {
      errors.contact1_phone = "Contact 1 phone is required.";
    } else if (!/^\d{10}$/.test(formData.contact1.phone.trim())) {
      errors.contact1_phone = "Must be a 10-digit phone number.";
    }
    if (!formData.contact1.relation.trim()) errors.contact1_relation = "Relationship is required.";

    // Mandatory Contact 2
    if (!formData.contact2.name.trim()) errors.contact2_name = "Contact 2 name is required.";
    if (!formData.contact2.phone.trim()) {
      errors.contact2_phone = "Contact 2 phone is required.";
    } else if (!/^\d{10}$/.test(formData.contact2.phone.trim())) {
      errors.contact2_phone = "Must be a 10-digit phone number.";
    }
    if (!formData.contact2.relation.trim()) errors.contact2_relation = "Relationship is required.";

    // Check duplicate phone numbers
    if (
      formData.contact1.phone &&
      formData.contact2.phone &&
      formData.contact1.phone.trim() === formData.contact2.phone.trim()
    ) {
      errors.contact2_phone = "Contact 1 and Contact 2 must have distinct phone numbers.";
    }

    if (!formData.agreeTerms) {
      errors.agreeTerms = "You must acknowledge the terms and safety disclaimer to proceed.";
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
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        emergencyContacts: [
          {
            name: formData.contact1.name.trim(),
            phone: formData.contact1.phone.trim(),
            relation: formData.contact1.relation.trim(),
          },
          {
            name: formData.contact2.name.trim(),
            phone: formData.contact2.phone.trim(),
            relation: formData.contact2.relation.trim(),
          },
        ],
      });

      setRegistrationSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError && err.isNetworkError) {
        setIsBackendOffline(true);
        setServerError(
          "Backend registration service at http://localhost:8080 is unreachable. Please verify that the Spring Boot server is running."
        );
      } else {
        setServerError(err.message || "Registration failed. Please check your details and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Demo fallback for offline review
  const handleOfflineDemoRegister = () => {
    const demoUser = {
      name: formData.name.trim() || "New Traveler",
      email: formData.email.trim() || "traveler@safewalk.org",
      phone: formData.phone.trim() || "9876543210",
      emergencyContacts: [
        {
          id: "1",
          name: formData.contact1.name.trim() || "Mom",
          phone: formData.contact1.phone.trim() || "9876543211",
          relation: formData.contact1.relation.trim() || "Mother",
        },
        {
          id: "2",
          name: formData.contact2.name.trim() || "Pooja",
          phone: formData.contact2.phone.trim() || "9876543212",
          relation: formData.contact2.relation.trim() || "Sister",
        },
      ],
    };
    updateUser(demoUser);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="auth-page-container">
      <div className="auth-page-card signup-wide-card">
        {/* Header */}
        <div className="auth-card-top">
          <div className="auth-brand-badge">
            <Shield size={24} />
          </div>
          <span className="auth-badge-label">SAFEWALK ONBOARDING</span>
          <h1 className="auth-card-title">Create SafeWalk Account</h1>
          <p className="auth-card-subtitle">
            Set up your personal profile and mandatory emergency contact network.
          </p>
        </div>

        {/* Success Banner */}
        {registrationSuccess && (
          <div className="auth-success-banner" role="status">
            <CheckCircle2 size={20} className="success-icon" />
            <div>
              <strong>Account registered successfully!</strong>
              <p>Redirecting to login page...</p>
            </div>
          </div>
        )}

        {/* Server Error */}
        {serverError && (
          <div className="auth-alert-wrapper">
            <ErrorMessage
              title={isBackendOffline ? "Backend Unreachable" : "Registration Notice"}
              message={serverError}
              variant={isBackendOffline ? "warning" : "error"}
            />

            {isBackendOffline && (
              <div className="offline-demo-banner">
                <p className="offline-demo-hint">
                  The Spring Boot backend server at http://localhost:8080 is not currently active.
                  You can explore the frontend flow using local preview mode:
                </p>
                <button
                  type="button"
                  className="btn-offline-demo"
                  onClick={handleOfflineDemoRegister}
                >
                  <UserCheck size={16} />
                  <span>Enter Dashboard via Local Preview</span>
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Section 1: Personal Details */}
          <div className="form-subheading">
            <User size={16} />
            <span>Personal Information</span>
          </div>

          <div className="form-grid-two">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="reg-name" className="input-label">
                Full Name
              </label>
              <div className={`input-icon-field ${fieldErrors.name ? "has-error" : ""}`}>
                <User className="field-icon" size={18} />
                <input
                  id="reg-name"
                  type="text"
                  placeholder="e.g. Ananya Rao"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  disabled={submitting}
                  autoComplete="name"
                />
              </div>
              {fieldErrors.name && <p className="input-error-msg">{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="reg-email" className="input-label">
                Email Address
              </label>
              <div className={`input-icon-field ${fieldErrors.email ? "has-error" : ""}`}>
                <Mail className="field-icon" size={18} />
                <input
                  id="reg-email"
                  type="email"
                  placeholder="e.g. ananya@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  disabled={submitting}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && <p className="input-error-msg">{fieldErrors.email}</p>}
            </div>
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="reg-phone" className="input-label">
              10-Digit Mobile Phone
            </label>
            <div className={`input-icon-field ${fieldErrors.phone ? "has-error" : ""}`}>
              <Phone className="field-icon" size={18} />
              <input
                id="reg-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, ""))}
                disabled={submitting}
                autoComplete="tel"
              />
            </div>
            {fieldErrors.phone && <p className="input-error-msg">{fieldErrors.phone}</p>}
          </div>

          {/* Passwords */}
          <div className="form-grid-two">
            <div className="form-group">
              <label htmlFor="reg-pass" className="input-label">
                Password
              </label>
              <div className={`input-icon-field ${fieldErrors.password ? "has-error" : ""}`}>
                <Lock className="field-icon" size={18} />
                <input
                  id="reg-pass"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  disabled={submitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && <p className="input-error-msg">{fieldErrors.password}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm-pass" className="input-label">
                Confirm Password
              </label>
              <div className={`input-icon-field ${fieldErrors.confirmPassword ? "has-error" : ""}`}>
                <Lock className="field-icon" size={18} />
                <input
                  id="reg-confirm-pass"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  disabled={submitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="input-error-msg">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Section 2: Emergency Contact 1 */}
          <div className="form-subheading">
            <Users size={16} />
            <span>Emergency Contact 1 (Mandatory)</span>
          </div>

          <div className="form-grid-three">
            <div className="form-group">
              <label htmlFor="c1-name" className="input-label">
                Full Name
              </label>
              <input
                id="c1-name"
                type="text"
                className={`text-input ${fieldErrors.contact1_name ? "has-error" : ""}`}
                placeholder="e.g. Smt. Kavitha"
                value={formData.contact1.name}
                onChange={(e) => updateContact("contact1", "name", e.target.value)}
                disabled={submitting}
              />
              {fieldErrors.contact1_name && (
                <p className="input-error-msg">{fieldErrors.contact1_name}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="c1-phone" className="input-label">
                Phone Number
              </label>
              <input
                id="c1-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className={`text-input ${fieldErrors.contact1_phone ? "has-error" : ""}`}
                placeholder="10-digit number"
                value={formData.contact1.phone}
                onChange={(e) =>
                  updateContact("contact1", "phone", e.target.value.replace(/\D/g, ""))
                }
                disabled={submitting}
              />
              {fieldErrors.contact1_phone && (
                <p className="input-error-msg">{fieldErrors.contact1_phone}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="c1-rel" className="input-label">
                Relationship
              </label>
              <input
                id="c1-rel"
                type="text"
                className={`text-input ${fieldErrors.contact1_relation ? "has-error" : ""}`}
                placeholder="e.g. Mother, Sister"
                value={formData.contact1.relation}
                onChange={(e) => updateContact("contact1", "relation", e.target.value)}
                disabled={submitting}
              />
              {fieldErrors.contact1_relation && (
                <p className="input-error-msg">{fieldErrors.contact1_relation}</p>
              )}
            </div>
          </div>

          {/* Section 3: Emergency Contact 2 */}
          <div className="form-subheading">
            <Users size={16} />
            <span>Emergency Contact 2 (Mandatory)</span>
          </div>

          <div className="form-grid-three">
            <div className="form-group">
              <label htmlFor="c2-name" className="input-label">
                Full Name
              </label>
              <input
                id="c2-name"
                type="text"
                className={`text-input ${fieldErrors.contact2_name ? "has-error" : ""}`}
                placeholder="e.g. Priya Sharma"
                value={formData.contact2.name}
                onChange={(e) => updateContact("contact2", "name", e.target.value)}
                disabled={submitting}
              />
              {fieldErrors.contact2_name && (
                <p className="input-error-msg">{fieldErrors.contact2_name}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="c2-phone" className="input-label">
                Phone Number
              </label>
              <input
                id="c2-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className={`text-input ${fieldErrors.contact2_phone ? "has-error" : ""}`}
                placeholder="10-digit number"
                value={formData.contact2.phone}
                onChange={(e) =>
                  updateContact("contact2", "phone", e.target.value.replace(/\D/g, ""))
                }
                disabled={submitting}
              />
              {fieldErrors.contact2_phone && (
                <p className="input-error-msg">{fieldErrors.contact2_phone}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="c2-rel" className="input-label">
                Relationship
              </label>
              <input
                id="c2-rel"
                type="text"
                className={`text-input ${fieldErrors.contact2_relation ? "has-error" : ""}`}
                placeholder="e.g. Friend, Roommate"
                value={formData.contact2.relation}
                onChange={(e) => updateContact("contact2", "relation", e.target.value)}
                disabled={submitting}
              />
              {fieldErrors.contact2_relation && (
                <p className="input-error-msg">{fieldErrors.contact2_relation}</p>
              )}
            </div>
          </div>

          {/* Terms and Privacy Checkbox */}
          <div className="terms-checkbox-field">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={(e) => updateField("agreeTerms", e.target.checked)}
                disabled={submitting}
              />
              <span className="checkbox-text">
                I understand that SafeWalk is a journey planning tool and does not guarantee personal safety
                or provide automated police tracking. I agree to the terms of service and privacy policy.
              </span>
            </label>
            {fieldErrors.agreeTerms && (
              <p className="input-error-msg">{fieldErrors.agreeTerms}</p>
            )}
          </div>

          {/* Submit button */}
          <button type="submit" className="btn-auth-submit" disabled={submitting}>
            {submitting ? (
              <LoadingSpinner message="Creating account..." size="sm" inline />
            ) : (
              <>
                <span>Create SafeWalk Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
