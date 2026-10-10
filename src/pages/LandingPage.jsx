import { Link } from "react-router-dom";
import {
  Shield,
  Compass,
  MapPin,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Users,
} from "lucide-react";
import { useAuth } from "../context/useAuth";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-tag">
              <Shield size={16} className="tag-icon" />
              <span>Women's Travel Safety & Smart Routing</span>
            </div>

            <h1 className="hero-title">
              Plan your journeys with <span className="highlight-text">clarity</span>, confidence, and peace of mind.
            </h1>

            <p className="hero-description">
              SafeWalk provides transparent route planning, actual distance and duration calculations,
              and dedicated emergency contact support. We empower women with reliable travel information
              without making false promises or fabricating safety scores.
            </p>

            <div className="hero-actions">
              <Link to="/plan" className="btn-primary-hero">
                <span>Plan Your Journey</span>
                <ArrowRight size={18} />
              </Link>

              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-secondary-hero">
                  <span>Go to Dashboard</span>
                </Link>
              ) : (
                <Link to="/register" className="btn-secondary-hero">
                  <span>Create Free Account</span>
                </Link>
              )}
            </div>

            <div className="hero-trust-indicators">
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" />
                <span>Real Road Geometries</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" />
                <span>At least 2 Emergency Contacts</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" />
                <span>Zero Fabricated Scores</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card-preview">
              <div className="preview-map-mockup">
                <div className="mockup-header">
                  <div className="mockup-dot red"></div>
                  <div className="mockup-dot yellow"></div>
                  <div className="mockup-dot green"></div>
                  <span className="mockup-title">SafeWalk Live Route Explorer</span>
                </div>
                <div className="mockup-body">
                  <div className="mockup-route-visual">
                    <div className="route-step start">
                      <MapPin size={18} className="pin-start" />
                      <div>
                        <strong>Point A: Starting Location</strong>
                        <span>Real GPS / Address geocoding</span>
                      </div>
                    </div>
                    <div className="route-line-connector"></div>
                    <div className="route-step end">
                      <MapPin size={18} className="pin-end" />
                      <div>
                        <strong>Point B: Destination</strong>
                        <span>OpenStreetMap Verified Routing</span>
                      </div>
                    </div>
                  </div>

                  <div className="mockup-metrics">
                    <div className="metric-chip">
                      <span className="label">Calculated Distance</span>
                      <strong className="value">Actual Road km</strong>
                    </div>
                    <div className="metric-chip">
                      <span className="label">Travel Time</span>
                      <strong className="value">Estimated Duration</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Philosophy & Disclaimer Banner */}
      <section className="disclaimer-section">
        <div className="container">
          <div className="transparency-card">
            <div className="transparency-icon-box">
              <AlertTriangle size={24} className="warning-icon" />
            </div>
            <div className="transparency-content">
              <h3>Our Commitment to Real Data & Honest Safety</h3>
              <p>
                Unlike generic apps that display arbitrary "safety percentages" or pretend to predict street crime,
                SafeWalk strictly relies on genuine routing data. We never claim any route is completely safe or
                promise automated police dispatch. When verified public safety datasets are unavailable for a specific segment,
                we explicitly tell you so.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">CORE CAPABILITIES</span>
            <h2 className="section-title">Designed with Women's Daily Mobility in Mind</h2>
            <p className="section-lead">
              A comprehensive tool providing reliable road geometry, travel time estimates, and personal safety preparedness.
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper teal">
                <Compass size={24} />
              </div>
              <h3 className="feature-title">Smart Route Planning</h3>
              <p className="feature-desc">
                Input any origin and destination with debounced address suggestions via OpenStreetMap Nominatim.
                View interactive road maps with turn-by-turn route lines and real distance calculations.
              </p>
              <Link to="/plan" className="feature-link">
                <span>Explore Route Planning</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper navy">
                <Shield size={24} />
              </div>
              <h3 className="feature-title">Verified Travel Insights</h3>
              <p className="feature-desc">
                Transparent information panels that distinguish between verified municipal data and unverified zones.
                No arbitrary scores or fake algorithms.
              </p>
              <Link to="/plan" className="feature-link">
                <span>View Route Insights</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper emerald">
                <Users size={24} />
              </div>
              <h3 className="feature-title">Emergency Contact Readiness</h3>
              <p className="feature-desc">
                Every SafeWalk user profile requires at least two trusted emergency contacts, ensuring that family
                or friends can be quickly reached during any journey.
              </p>
              <Link to={isAuthenticated ? "/emergency-contacts" : "/register"} className="feature-link">
                <span>Manage Contacts</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper sky">
                <MapPin size={24} />
              </div>
              <h3 className="feature-title">Alternative Route Options</h3>
              <p className="feature-desc">
                Compare primary and alternative routes side-by-side whenever alternative paths are available, allowing
                you to choose the path best suited to your comfort and timing.
              </p>
              <Link to="/plan" className="feature-link">
                <span>Compare Routes</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">STEP-BY-STEP</span>
            <h2 className="section-title">How SafeWalk Works</h2>
          </div>

          <div className="steps-row">
            <div className="step-card">
              <div className="step-number">01</div>
              <h4>Search Locations</h4>
              <p>Type your starting point or use one-click GPS, then enter your intended destination.</p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <h4>Inspect Route & Metrics</h4>
              <p>Examine the interactive map, calculated travel time, road distance, and available alternatives.</p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <h4>Check Emergency Network</h4>
              <p>Ensure your emergency contacts know your expected arrival time and have quick access to verified numbers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Ready to plan your next journey?</h2>
              <p>
                Experience route planning built with genuine data, high-contrast usability, and female traveler safety at the forefront.
              </p>
            </div>
            <div className="cta-buttons">
              <Link to="/plan" className="btn-primary-hero">
                Plan a Journey Now
              </Link>
              {!isAuthenticated && (
                <Link to="/register" className="btn-secondary-hero">
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
