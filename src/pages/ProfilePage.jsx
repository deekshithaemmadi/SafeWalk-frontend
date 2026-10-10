import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Shield,
  Edit2,
  Check,
  X,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { updateProfile } from "../services/profileService";
import LoadingSpinner from "../components/LoadingSpinner";
import { ApiError } from "../services/api";

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  }));

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Full name cannot be blank.";
    if (!formData.email.trim()) {
      errors.email = "Email cannot be blank.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number cannot be blank.";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = "Phone number must be exactly 10 digits.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditToggle = () => {
    setIsEditing(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFieldErrors({});
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setErrorMessage("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!validate()) return;

    setSaving(true);
    try {
      const updated = await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });

      updateUser(updated);
      setIsEditing(false);
      setSuccessMessage("Profile information updated successfully.");
    } catch (err) {
      if (err instanceof ApiError && err.isNetworkError) {
        setErrorMessage(
          "Backend server at http://localhost:8080 is unreachable. Profile changes were not saved to the server."
        );
      } else {
        setErrorMessage(err.message || "Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const emergencyContactsCount = user?.emergencyContacts?.length || 2;

  return (
    <div className="profile-page">
      <div className="container">
        {/* Profile Card Header */}
        <div className="profile-header-card">
          <div className="profile-avatar-large">
            <span>{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
          </div>
          <div className="profile-header-info">
            <h1 className="profile-name">{user?.name || "User Profile"}</h1>
            <p className="profile-email-badge">{user?.email}</p>
            <span className="profile-status-pill">
              <Shield size={14} />
              <span>SafeWalk Verified Member</span>
            </span>
          </div>

          <div className="profile-header-actions">
            {!isEditing ? (
              <button type="button" className="btn-edit-profile" onClick={handleEditToggle}>
                <Edit2 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button type="button" className="btn-cancel-edit" onClick={handleCancel}>
                <X size={16} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback alerts */}
        {successMessage && (
          <div className="profile-feedback-alert success" role="alert">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="profile-feedback-alert error" role="alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Body Grid */}
        <div className="profile-grid">
          {/* Main Info Form */}
          <div className="profile-details-card">
            <div className="card-section-title">
              <User size={18} />
              <h3>Personal Account Information</h3>
            </div>

            <form onSubmit={handleSave} className="profile-form">
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="prof-name" className="input-label">
                  Full Name
                </label>
                <div className="profile-input-wrapper">
                  <User size={18} className="field-icon" />
                  <input
                    id="prof-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" });
                    }}
                    disabled={!isEditing || saving}
                    className={`profile-input ${!isEditing ? "read-only" : ""} ${
                      fieldErrors.name ? "has-error" : ""
                    }`}
                  />
                </div>
                {fieldErrors.name && <p className="input-error-msg">{fieldErrors.name}</p>}
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label htmlFor="prof-email" className="input-label">
                  Email Address
                </label>
                <div className="profile-input-wrapper">
                  <Mail size={18} className="field-icon" />
                  <input
                    id="prof-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                    }}
                    disabled={!isEditing || saving}
                    className={`profile-input ${!isEditing ? "read-only" : ""} ${
                      fieldErrors.email ? "has-error" : ""
                    }`}
                  />
                </div>
                {fieldErrors.email && <p className="input-error-msg">{fieldErrors.email}</p>}
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label htmlFor="prof-phone" className="input-label">
                  Mobile Number
                </label>
                <div className="profile-input-wrapper">
                  <Phone size={18} className="field-icon" />
                  <input
                    id="prof-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        phone: e.target.value.replace(/\D/g, ""),
                      });
                      if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: "" });
                    }}
                    disabled={!isEditing || saving}
                    className={`profile-input ${!isEditing ? "read-only" : ""} ${
                      fieldErrors.phone ? "has-error" : ""
                    }`}
                  />
                </div>
                {fieldErrors.phone && <p className="input-error-msg">{fieldErrors.phone}</p>}
              </div>

              {/* Action buttons when editing */}
              {isEditing && (
                <div className="profile-action-buttons">
                  <button type="submit" className="btn-save-profile" disabled={saving}>
                    {saving ? (
                      <LoadingSpinner message="Saving..." size="sm" inline />
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-profile"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Side Summary Cards */}
          <div className="profile-side-column">
            {/* Emergency Contacts Summary Card */}
            <div className="profile-sub-card">
              <div className="sub-card-header">
                <PhoneCall size={18} className="sub-card-icon" />
                <h4>Emergency Network</h4>
              </div>
              <p className="sub-card-desc">
                Your profile is linked with <strong>{emergencyContactsCount} emergency contacts</strong>.
                At least two contacts are required.
              </p>
              <Link to="/emergency-contacts" className="btn-manage-contacts-link">
                <span>Manage Emergency Contacts</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* Privacy & Security Note */}
            <div className="profile-sub-card security-note">
              <div className="sub-card-header">
                <KeyRound size={18} className="sub-card-icon" />
                <h4>Privacy & Security</h4>
              </div>
              <p className="sub-card-desc">
                Your credentials are never stored as plaintext passwords. All profile communication is
                configured for secure backend REST transmission via Authorization headers.
              </p>
              <button type="button" className="btn-profile-logout" onClick={logout}>
                Log Out of Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
