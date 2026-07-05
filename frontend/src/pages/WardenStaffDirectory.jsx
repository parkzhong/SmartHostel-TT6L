import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./WardenDashboard.css";
import NotificationBell from "../component/NotificationBell";

export default function WardenStaffDirectory() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }
        const token = await user.getIdToken();
        const res = await fetch("http://127.0.0.1:5000/api/warden/staff-directory", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load staff directory");
        setList(Array.isArray(data) ? data : []);
        // load profile for sidebar
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const d = snap.data();
            setProfile({
              uid: user.uid,
              email: user.email,
              fullName: d.fullName || "Chief Warden",
              wardenEmail: d.wardenEmail || user.email,
              jurisdiction: d.jurisdiction || "All Blocks",
            });
          }
        } catch (e) {
          console.warn("Failed to load profile:", e);
        }
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }

    const unsub = auth.onAuthStateChanged((u) => {
      if (u) load();
      else navigate("/login");
    });
    return () => unsub();
  }, [navigate]);

  return (
    <div className="warden-settings-page">
      <div className="warden-settings-container">
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
            <button className="header-btn" onClick={async () => { await signOut(auth); navigate('/login'); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>

        <div className="warden-settings-content">
          <div className="warden-sidebar">
            <div className="warden-profile">
              <div className="warden-avatar">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h2 className="warden-name">{profile?.fullName || "Chief Warden"}</h2>
              <p className="warden-email">{profile?.wardenEmail || auth.currentUser?.email}</p>
              <div className="on-duty-badge">
                <span className="duty-dot"></span>
                On Duty
              </div>
            </div>

            <div className="warden-stats">
              <div className="stat-row">
                <span className="stat-label">Jurisdiction</span>
                <span className="stat-value">{profile?.jurisdiction || "All Blocks"}</span>
              </div>
            </div>

            <button className="sidebar-button" onClick={() => navigate('/warden-dashboard')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
              Back to Dashboard
            </button>
          </div>

          <div className="settings-main-wrapper">
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Warden Staff Directory</h1>
            <p style={{ color: "#6b7280" }}>List of active wardens (uid and email).</p>

            {loading && <div>Loading...</div>}
            {err && <div style={{ color: "#dc2626" }}>{err}</div>}

            {!loading && !err && (
              <div style={{ marginTop: 16 }}>
                {list.length === 0 && <div>No wardens found.</div>}
                {list.map((w) => (
                  <div key={w.uid} style={{ padding: 12, border: "1px solid #eef2f7", borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{w.fullName || "(No name)"}</div>
                    <div style={{ fontSize: 13, color: "#374151" }}>{w.email || "(no email)"}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>UID: {w.uid}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
