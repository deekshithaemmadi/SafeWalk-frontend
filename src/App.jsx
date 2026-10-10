import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import PlanJourneyPage from "./pages/PlanJourneyPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import EmergencyContactsPage from "./pages/EmergencyContactsPage";
import NotFoundPage from "./pages/NotFoundPage";
import NearbyHelpPage from "./pages/NearbyHelpPage";
import SosPage from "./pages/SosPage";
import CommunityReportsPage from "./pages/CommunityReportsPage";
import SafetyChatbot from "./components/SafetyChatbot";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/plan" element={<PlanJourneyPage />} />
              <Route path="/nearby-help" element={<NearbyHelpPage />} />
              <Route path="/sos" element={<SosPage />} />
              <Route path="/community" element={<CommunityReportsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/emergency-contacts"
                element={
                  <ProtectedRoute>
                    <EmergencyContactsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback & Not Found */}
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
          <SafetyChatbot />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}