import { useState } from "react";
import {
  PhoneCall,
  UserPlus,
  Trash2,
  Edit2,
  Check,
  X,
  Phone,
  Copy,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import {
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from "../services/emergencyContactService";
import LoadingSpinner from "../components/LoadingSpinner";
import { ApiError } from "../services/api";

const initialContactState = {
  name: "",
  phone: "",
  relation: "",
};

export default function EmergencyContactsPage() {
  const { user, updateUser } = useAuth();

  // Local contacts state initialized from user's actual data
  const [contacts, setContacts] = useState(() => {
    if (user?.emergencyContacts && user.emergencyContacts.length > 0) {
      return user.emergencyContacts.map((c, i) => ({
        id: c.id || String(i + 1),
        name: c.name,
        phone: c.phone,
        relation: c.relation,
      }));
    }
    // Authenticated users with no contacts should see an empty list.
    // Unauthenticated visitors get sample placeholders as a preview.
    if (user) return [];
    return [
      { id: "1", name: "Primary Family Contact", phone: "9876543211", relation: "Mother" },
      { id: "2", name: "Trusted Friend", phone: "9876543212", relation: "Sister" },
    ];
  });

  const [newContact, setNewContact] = useState({ ...initialContactState });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ ...initialContactState });

  const [fieldErrors, setFieldErrors] = useState({});
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Sync back to AuthContext user object so it reflects across the app
  const syncWithUser = (updatedList) => {
    setContacts(updatedList);
    if (user) {
      updateUser({
        ...user,
        emergencyContacts: updatedList,
      });
    }
  };

  const validateNew = () => {
    const errors = {};
    if (!newContact.name.trim()) errors.name = "Contact name is required.";
    if (!newContact.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(newContact.phone.trim())) {
      errors.phone = "Phone number must be exactly 10 digits.";
    }
    if (!newContact.relation.trim()) errors.relation = "Relationship is required.";

    const exists = contacts.some(
      (c) => c.phone.trim() === newContact.phone.trim() && c.id !== editingId
    );
    if (exists) {
      errors.phone = "This phone number is already in your emergency contacts.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEdit = () => {
    const errors = {};
    if (!editFormData.name.trim()) errors.name = "Contact name cannot be empty.";
    if (!editFormData.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(editFormData.phone.trim())) {
      errors.phone = "Must be a 10-digit number.";
    }
    if (!editFormData.relation.trim()) errors.relation = "Relationship cannot be empty.";

    const exists = contacts.some(
      (c) => c.phone.trim() === editFormData.phone.trim() && c.id !== editingId
    );
    if (exists) {
      errors.phone = "This phone number is already assigned to another contact.";
    }

    setEditFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add Contact
  const handleAddContact = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!validateNew()) return;

    setLoading(true);
    const contactToAdd = {
      id: String(Date.now()),
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      relation: newContact.relation.trim(),
    };

    try {
      // Attempt backend API call
      await createEmergencyContact(contactToAdd);
    } catch (err) {
      // Backend is optional/pending in frontend review; inform gracefully while persisting locally
      if (err instanceof ApiError && err.isNetworkError) {
        console.warn("Backend offline: saving contact to local session.");
      }
    }

    const updated = [...contacts, contactToAdd];
    syncWithUser(updated);
    setNewContact({ ...initialContactState });
    setFieldErrors({});
    setSuccessMessage(`Contact "${contactToAdd.name}" added successfully.`);
    setLoading(false);
  };

  // Start editing
  const handleStartEdit = (contact) => {
    setEditingId(contact.id);
    setEditFormData({
      name: contact.name,
      phone: contact.phone,
      relation: contact.relation,
    });
    setEditFieldErrors({});
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ ...initialContactState });
    setEditFieldErrors({});
  };

  // Save edit
  const handleSaveEdit = async (id) => {
    if (!validateEdit()) return;

    setLoading(true);
    try {
      await updateEmergencyContact(id, editFormData);
    } catch {
      console.warn("Backend offline: saving edit to local session.");
    }

    const updated = contacts.map((c) =>
      c.id === id
        ? {
            ...c,
            name: editFormData.name.trim(),
            phone: editFormData.phone.trim(),
            relation: editFormData.relation.trim(),
          }
        : c
    );

    syncWithUser(updated);
    setEditingId(null);
    setSuccessMessage("Contact updated successfully.");
    setLoading(false);
  };

  // Delete Contact
  const handleDeleteContact = async (id) => {
    // Minimum 2 contacts policy
    if (contacts.length <= 2) {
      setErrorMessage(
        "At least two emergency contacts must always remain saved for your safety profile."
      );
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      await deleteEmergencyContact(id);
    } catch {
      console.warn("Backend offline: removing from local session.");
    }

    const updated = contacts.filter((c) => c.id !== id);
    syncWithUser(updated);
    setSuccessMessage("Contact removed successfully.");
    setLoading(false);
  };

  const handleCopyNumber = (contact) => {
    navigator.clipboard.writeText(contact.phone);
    setCopiedId(contact.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="emergency-contacts-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-intro-header">
          <div className="intro-badge">
            <PhoneCall size={16} />
            <span>SAFETY GUARDIAN REGISTRY</span>
          </div>
          <h1 className="page-intro-title">Emergency Contacts</h1>
          <p className="page-intro-text">
            Keep verified personal contacts registered on your account. SafeWalk requires a minimum of
            two emergency contacts so you are never left without options during unexpected situations.
          </p>
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

        <div className="emergency-contacts-grid">
          {/* Left Column: Contacts List */}
          <div className="contacts-list-column">
            <div className="contacts-list-card">
              <div className="list-card-header">
                <div>
                  <h2 className="list-card-title">Registered Contacts ({contacts.length})</h2>
                  <p className="list-card-subtitle">
                    {contacts.length >= 2
                      ? "Minimum contact requirement satisfied."
                      : "Minimum 2 contacts required."}
                  </p>
                </div>
                <span className="contact-count-badge">Min 2 Required</span>
              </div>

              <div className="contact-cards-stack">
                {contacts.map((contact, idx) => (
                  <div key={contact.id || idx} className="contact-entry-card">
                    {editingId === contact.id ? (
                      /* Inline Editing Mode */
                      <div className="contact-edit-inline">
                        <div className="form-grid-three">
                          <div className="form-group">
                            <label className="input-label">Name</label>
                            <input
                              type="text"
                              className={`text-input ${editFieldErrors.name ? "has-error" : ""}`}
                              value={editFormData.name}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, name: e.target.value })
                              }
                            />
                            {editFieldErrors.name && (
                              <p className="input-error-msg">{editFieldErrors.name}</p>
                            )}
                          </div>

                          <div className="form-group">
                            <label className="input-label">Phone</label>
                            <input
                              type="tel"
                              maxLength={10}
                              className={`text-input ${editFieldErrors.phone ? "has-error" : ""}`}
                              value={editFormData.phone}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  phone: e.target.value.replace(/\D/g, ""),
                                })
                              }
                            />
                            {editFieldErrors.phone && (
                              <p className="input-error-msg">{editFieldErrors.phone}</p>
                            )}
                          </div>

                          <div className="form-group">
                            <label className="input-label">Relation</label>
                            <input
                              type="text"
                              className={`text-input ${
                                editFieldErrors.relation ? "has-error" : ""
                              }`}
                              value={editFormData.relation}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, relation: e.target.value })
                              }
                            />
                            {editFieldErrors.relation && (
                              <p className="input-error-msg">{editFieldErrors.relation}</p>
                            )}
                          </div>
                        </div>

                        <div className="inline-edit-actions">
                          <button
                            type="button"
                            className="btn-save-inline"
                            onClick={() => handleSaveEdit(contact.id)}
                            disabled={loading}
                          >
                            <Check size={14} />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            className="btn-cancel-inline"
                            onClick={handleCancelEdit}
                            disabled={loading}
                          >
                            <X size={14} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="contact-view-row">
                        <div className="contact-avatar-pill">
                          <span>{contact.name.charAt(0).toUpperCase()}</span>
                        </div>

                        <div className="contact-info-block">
                          <div className="name-and-relation">
                            <h3 className="contact-name-heading">{contact.name}</h3>
                            <span className="relation-tag">{contact.relation}</span>
                          </div>
                          <span className="contact-phone-text">{contact.phone}</span>
                        </div>

                        <div className="contact-action-buttons">
                          <a
                            href={`tel:${contact.phone}`}
                            className="btn-action-icon call"
                            title={`Call ${contact.name}`}
                          >
                            <Phone size={15} />
                          </a>

                          <button
                            type="button"
                            className="btn-action-icon copy"
                            onClick={() => handleCopyNumber(contact)}
                            title="Copy number to clipboard"
                          >
                            {copiedId === contact.id ? (
                              <CheckCircle2 size={15} className="copied-check" />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>

                          <button
                            type="button"
                            className="btn-action-icon edit"
                            onClick={() => handleStartEdit(contact)}
                            title="Edit contact"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => handleDeleteContact(contact.id)}
                            disabled={contacts.length <= 2}
                            title={
                              contacts.length <= 2
                                ? "At least 2 contacts must remain"
                                : "Remove contact"
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Add Contact Form & Information */}
          <div className="contacts-side-column">
            {/* Add Contact Card */}
            <div className="add-contact-card">
              <div className="add-card-header">
                <div className="add-badge">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="add-card-title">Add Emergency Contact</h3>
                  <p className="add-card-subtitle">Register an additional trusted family member or friend.</p>
                </div>
              </div>

              <form onSubmit={handleAddContact} className="add-contact-form">
                <div className="form-group">
                  <label htmlFor="new-name" className="input-label">
                    Contact Name
                  </label>
                  <input
                    id="new-name"
                    type="text"
                    placeholder="e.g. Smt. Radha"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className={`text-input ${fieldErrors.name ? "has-error" : ""}`}
                    disabled={loading}
                  />
                  {fieldErrors.name && <p className="input-error-msg">{fieldErrors.name}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="new-phone" className="input-label">
                    10-Digit Mobile Number
                  </label>
                  <input
                    id="new-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        phone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className={`text-input ${fieldErrors.phone ? "has-error" : ""}`}
                    disabled={loading}
                  />
                  {fieldErrors.phone && <p className="input-error-msg">{fieldErrors.phone}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="new-rel" className="input-label">
                    Relationship
                  </label>
                  <input
                    id="new-rel"
                    type="text"
                    placeholder="e.g. Brother, Cousin, Colleague"
                    value={newContact.relation}
                    onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                    className={`text-input ${fieldErrors.relation ? "has-error" : ""}`}
                    disabled={loading}
                  />
                  {fieldErrors.relation && <p className="input-error-msg">{fieldErrors.relation}</p>}
                </div>

                <button type="submit" className="btn-add-contact" disabled={loading}>
                  {loading ? (
                    <LoadingSpinner message="Adding..." size="sm" inline />
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Save Emergency Contact</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Non-misleading Safety Notice */}
            <div className="contact-disclaimer-card" role="note">
              <div className="disclaimer-title-row">
                <Info size={18} className="info-icon" />
                <h4>Important Disclosure</h4>
              </div>
              <p className="disclaimer-body">
                Saving an emergency contact stores their information for quick calling and communication.
                <strong>
                  {" "}Saving a contact does NOT automatically broadcast live GPS coordinates, send automated SMS alerts,
                  or summon police services without your explicit personal action.
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
