import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Shield, User, PhoneCall, LogOut, Menu, X, Compass, MapPinned, Siren, Flag } from "lucide-react";
import { useAuth } from "../context/useAuth";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="navbar-brand" onClick={closeMenu}>
          <div className="brand-badge">
            <Shield className="brand-badge-icon" size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-name">SafeWalk</span>
            <span className="brand-tagline">Travel Safety</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-links desktop-only" aria-label="Main Navigation">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            end
          >
            Home
          </NavLink>

          <NavLink
            to="/plan"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <Compass size={16} className="nav-icon" />
            Plan Journey
          </NavLink>

          <NavLink
            to="/nearby-help"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <MapPinned size={16} className="nav-icon" />
            Nearby Help
          </NavLink>

          <NavLink
            to="/sos"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link sos-nav-link")}
          >
            <Siren size={16} className="nav-icon" />
            SOS
          </NavLink>

          <NavLink
            to="/community"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <Flag size={16} className="nav-icon" />
            Community
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/emergency-contacts"
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                <PhoneCall size={16} className="nav-icon" />
                Emergency Contacts
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                <User size={16} className="nav-icon" />
                Profile
              </NavLink>
            </>
          ) : (
            <a href="#features" className="nav-link">
              Features
            </a>
          )}
        </nav>

        {/* Desktop Auth Controls */}
        <div className="navbar-auth desktop-only">
          {isAuthenticated ? (
            <div className="auth-user-menu">
              <Link to="/profile" className="user-profile-chip" title="View Profile">
                <span className="user-avatar-circle">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
                <span className="user-name-display">{user?.name || "My Account"}</span>
              </Link>
              <button
                type="button"
                className="btn-logout"
                onClick={handleLogout}
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <div className="auth-buttons-group">
              <Link to="/login" className="btn-secondary-nav">
                Log In
              </Link>
              <Link to="/register" className="btn-primary-nav">
                Create Account
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="mobile-menu-toggle mobile-only"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="mobile-dropdown mobile-only">
          <nav className="mobile-nav-links">
            <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
              Home
            </Link>
            <Link to="/plan" className="mobile-nav-link" onClick={closeMenu}>
              Plan Journey
            </Link>
            <Link to="/nearby-help" className="mobile-nav-link" onClick={closeMenu}>
              Nearby Help
            </Link>
            <Link to="/sos" className="mobile-nav-link sos-mobile-link" onClick={closeMenu}>
              SOS Emergency
            </Link>
            <Link to="/community" className="mobile-nav-link" onClick={closeMenu}>
              Community Reports
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="mobile-nav-link" onClick={closeMenu}>
                  Dashboard
                </Link>
                <Link to="/emergency-contacts" className="mobile-nav-link" onClick={closeMenu}>
                  Emergency Contacts
                </Link>
                <Link to="/profile" className="mobile-nav-link" onClick={closeMenu}>
                  My Profile
                </Link>
                <div className="mobile-user-info">
                  <span className="mobile-user-name">Signed in as {user?.name || user?.email}</span>
                  <button type="button" className="btn-logout-mobile" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="mobile-auth-actions">
                <Link to="/login" className="btn-secondary-full" onClick={closeMenu}>
                  Log In
                </Link>
                <Link to="/register" className="btn-primary-full" onClick={closeMenu}>
                  Create SafeWalk Account
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
