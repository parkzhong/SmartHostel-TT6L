import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./WardenDashboard.css";
import NotificationBell from "../component/NotificationBell";

export default function WardenDashboard() {
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({
    roomRequests: 0,
    maintenanceReports: 0,
    visitorRequests: 0,
    incidentReports: 0,
    activeStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        // Load warden profile
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          await signOut(auth);
          navigate("/login");
          return;
        }

        const data = snap.data();
        if (data.role !== "warden" || data.status?.toLowerCase() !== "active") {
          await signOut(auth);
          navigate("/login");
          return;
        }

        // Initialize profile first to prevent infinite loading
        setProfile({
          uid: user.uid,
          email: user.email,
          fullName: data.fullName || "Chief Warden",
          wardenEmail: data.wardenEmail || user.email,
          jurisdiction: data.jurisdiction || "All Blocks",
        });

        // Fetch pending counts
        await fetchPendingCounts(user);
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }

    const unsub = auth.onAuthStateChanged(load);
    return () => unsub();
  }, [navigate]);

  const fetchPendingCounts = async (user) => {
    try {
      const token = await user.getIdToken();

      // Room requests
      const roomRes = await fetch("http://127.0.0.1:5000/api/warden/pending-room-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const roomData = roomRes.ok ? await roomRes.json() : [];

      // Maintenance reports
      const maintRes = await fetch("http://127.0.0.1:5000/api/warden/pending-maintenance-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const maintData = maintRes.ok ? await maintRes.json() : [];

      // Visitor requests
      const visitorRes = await fetch("http://127.0.0.1:5000/api/warden/pending-visitor-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const visitorData = visitorRes.ok ? await visitorRes.json() : [];

      // Incident reports
      const incidentRes = await fetch("http://127.0.0.1:5000/api/warden/pending-incident-reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const incidentData = incidentRes.ok ? await incidentRes.json() : [];

      // Stats/Occupancy
      const statsRes = await fetch("http://127.0.0.1:5000/api/warden/dashboard-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = statsRes.ok ? await statsRes.json() : { activeStudents: 0 };

      setCounts({
        roomRequests: Array.isArray(roomData) ? roomData.length : 0,
        maintenanceReports: Array.isArray(maintData) ? maintData.length : 0,
        visitorRequests: Array.isArray(visitorData) ? visitorData.length : 0,
        incidentReports: Array.isArray(incidentData) ? incidentData.length : 0,
        activeStudents: statsData.activeStudents || 0,
      });
    } catch (err) {
      console.error("Failed to fetch counts:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading || !profile) {
    return (
      <div className="warden-dashboard-page">
        <div className="warden-dashboard-container">
          <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="warden-dashboard-page">
      <div className="warden-dashboard-container">
        {/* Header */}
        <div className="warden-dashboard-header">
          <div className="header-logo">
            <div className="logo-icon">
              <img src="/logo.png" alt="Smart Hostel Logo" />
            </div>
            <div className="logo-text">
              <h1>Smart Hostel</h1>
              <p>Warden Administration</p>
            </div>
          </div>
          <div className="header-actions">
            <NotificationBell />
            <button className="header-btn" onClick={() => navigate("/warden-settings")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Settings
            </button>
            <button className="header-btn" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="warden-dashboard-content">
          {/* Sidebar */}
          <div className="warden-sidebar">
            <div className="warden-profile">
              <div className="warden-avatar">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h2 className="warden-name">Chief Warden</h2>
              <p className="warden-email">{profile.wardenEmail}</p>
              <div className="on-duty-badge">
                <span className="duty-dot"></span>
                On Duty
              </div>
            </div>

            <div className="warden-stats">
              <div className="stat-row">
                <span className="stat-label">Jurisdiction</span>
                <span className="stat-value">{profile.jurisdiction}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Occupancy</span>
                <span className="stat-value">{counts.activeStudents} Students</span>
              </div>
            </div>

            <button className="sidebar-button" onClick={() => navigate("/warden-staff-directory")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Staff Directory
            </button>
          </div>

          {/* Main Content */}
          <div className="warden-main-content">
            <div className="action-queue-header">
              <h1 className="action-queue-title">Action Queue Hub</h1>
              <p className="action-queue-subtitle">
                Efficiency triage for pending administrative approvals and reports.
              </p>
            </div>

            <div className="action-cards-grid">
              {/* Pending Room Requests */}
              <div className="action-card">
                <div className="action-icon purple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <h3 className="action-title">Pending Room Requests</h3>
                <p className="action-description">
                  Allocate, approve or decline room change applications.
                </p>
                <div className="action-count">
                  <span className="count-number">{String(counts.roomRequests).padStart(2, '0')}</span>
                  <span className="count-label">Pending Items</span>
                </div>
                <button
                  className="action-button purple"
                  onClick={() => navigate("/warden-dashboard-rooms")}
                >
                  Review Requests
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>

              {/* Maintenance Reports */}
              <div className="action-card">
                <div className="action-icon orange">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                </div>
                <h3 className="action-title">Maintenance Reports</h3>
                <p className="action-description">
                  Review repair tickets and assign technicians to tasks.
                </p>
                <div className="action-count">
                  <span className="count-number">{String(counts.maintenanceReports).padStart(2, '0')}</span>
                  <span className="count-label">Pending Items</span>
                </div>
                <button
                  className="action-button orange"
                  onClick={() => navigate("/warden-maintenance-dashboard")}
                >
                  Review Reports
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </div>

              {/* Visitor Requests */}
              <div className="action-card">
                <div className="action-icon blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3 className="action-title">Visitor Requests</h3>
                <p className="action-description">
                  Grant or deny access for external guests and temporary visitors.
                </p>
                <div className="action-count">
                  <span className="count-number">{String(counts.visitorRequests).padStart(2, '0')}</span>
                  <span className="count-label">Pending Items</span>
                </div>
                <button
                  className="action-button blue"
                  onClick={() => navigate("/warden-visitor-dashboard")}
                >
                  Review Requests
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4"></path>
                  </svg>
                </button>
              </div>

              {/* Incident Reports */}
              <div className="action-card">
                <div className="action-icon red">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <h3 className="action-title">Incident Reports</h3>
                <p className="action-description">
                  Respond to safety concerns, noise issues, or security alerts.
                </p>
                <div className="action-count">
                  <span className="count-number">{String(counts.incidentReports).padStart(2, '0')}</span>
                  <span className="count-label">Pending Items</span>
                </div>
                <button
                  className="action-button red"
                  onClick={() => navigate("/warden-incident-dashboard")}
                >
                  Handle Now
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}