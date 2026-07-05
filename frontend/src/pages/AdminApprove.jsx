import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./AdminApprove.css";
import "./AdminDashboard.css";
import NotificationBell from "../component/NotificationBell";

export default function AdminApprove() {
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailInUseTooltip, setEmailInUseTooltip] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            uid: user.uid,
            email: user.email,
            fullName: data.fullName || "Admin",
            role: data.role || "admin"
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    }

    loadProfile();
    load();
  }, [navigate]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Not logged in");

      const res = await fetch("http://127.0.0.1:5000/api/admin/pending-students", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");

      setStudents(Array.isArray(data) ? data : []);
      setFilteredStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(s =>
        (s.fullName || "").toLowerCase().includes(query) ||
        (s.uid || "").toLowerCase().includes(query) ||
        (s.personalEmail || "").toLowerCase().includes(query)
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  async function approve(uid) {
    setErr("");
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Not logged in");

      const res = await fetch("http://127.0.0.1:5000/api/admin/approve-student", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approve failed");

      load();
    } catch (e) {
      setErr(e.message);
      load();
    }
  }

  async function reject(uid) {
    setErr("");
    const reason = prompt("Reject reason (optional):") || "Rejected by admin";
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Not logged in");

      const res = await fetch("http://127.0.0.1:5000/api/admin/reject-student", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reject failed");

      load();
    } catch (e) {
      setErr(e.message);
      load();
    }
  }

  async function retryEmail(uid) {
    setErr("");
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Not logged in");

      const res = await fetch("http://127.0.0.1:5000/api/admin/retry-approval-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Retry failed");

      load();
    } catch (e) {
      setErr(e.message);
      load();
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const getStatusClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("pending") || s === "approving") return "pending";
    if (s.includes("error") || s.includes("failed")) return "error";
    return "default";
  };

  const displayedCount = filteredStudents.length;
  const totalCount = students.length;

  if (!profile) {
    return (
      <div className="admin-approve-page">
        <div className="admin-approve-container">
          <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-approve-page">
      <div className="admin-approve-container">
        {/* Header */}
        <div className="admin-dashboard-header">
          <div className="header-logo">
            <div className="logo-icon">
              <img src="/logo.png" alt="Smart Hostel Logo" />
            </div>
            <div className="logo-text">
              <h1>Smart Hostel</h1>
              <p>Admin</p>
            </div>
          </div>
          <div className="header-actions">
            <NotificationBell />
            <button className="header-btn" onClick={() => navigate("/admin-settings")}>
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
        <div className="admin-approve-content">
          {/* Sidebar */}
          <div className="admin-sidebar">
            <div className="sidebar-section">
              <h3 className="sidebar-title">Admin Quick Actions</h3>
              <nav className="sidebar-nav">
                <button className="nav-item" onClick={() => navigate("/admin-dashboard")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  Dashboard
                </button>
                <button className="nav-item" onClick={() => navigate("/admin-manage-students")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Student List
                </button>
                <button className="nav-item" onClick={() => navigate("/admin-staff-directory")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  Staff Directory
                </button>
              </nav>
            </div>

            <div className="sidebar-section">
              <h3 className="sidebar-title">System Status</h3>
              <div className="system-status">
                <div className="status-indicator online">
                  <span className="status-dot"></span>
                  All Systems Online
                </div>
              </div>
              <button className="view-logs-btn" onClick={() => navigate("/admin-server-logs")}>
                View Server Logs
              </button>
            </div>
          </div>

          {/* Main Table Area */}
          <div className="approval-main-content">
            <div className="content-header">
              <div>
                <h1 className="content-title">Student Account Approvals</h1>
                <p className="content-subtitle">Review and process new registration requests.</p>
              </div>
              <div className="header-controls">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Filter by name or UID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>

              </div>
            </div>

            {err && <div className="error-message">{err}</div>}
            {loading && <div className="loading-message">Loading...</div>}

            {!loading && filteredStudents.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <p>No pending student approvals.</p>
              </div>
            ) : (
              <>
                <div className="approvals-table-wrapper">
                  <table className="approvals-table">
                    <thead>
                      <tr>
                        <th>UID</th>
                        <th>Full Name</th>
                        <th>Personal Email</th>
                        <th>Status</th>
                        <th>Last Error</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.uid}>
                          <td className="uid-cell">{student.uid?.slice(0, 12) || "#STU-882"}</td>
                          <td className="name-cell">{student.fullName || "-"}</td>
                          <td className="email-cell">{student.personalEmail || "-"}</td>
                          <td>
                            <span className={`status-badge ${getStatusClass(student.status)}`}>
                              {student.status === "pending_warden" ? "Pending" :
                                student.status === "approving" ? "Pending" :
                                  student.status?.includes("error") || student.status?.includes("failed") ? "Error" :
                                    student.status || "Pending"}
                            </span>
                          </td>
                          <td className="error-cell">
                            {student.lastError ? (
                              <div
                                className="error-wrapper"
                                onMouseEnter={() => setEmailInUseTooltip(student.uid)}
                                onMouseLeave={() => setEmailInUseTooltip(null)}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="8" x2="12" y2="12"></line>
                                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                {emailInUseTooltip === student.uid && (
                                  <div className="error-tooltip">
                                    {student.lastError}
                                  </div>
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="action-cell">
                            <button
                              className="approve-btn"
                              onClick={() => approve(student.uid)}
                            >
                              Approve
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => reject(student.uid)}
                            >
                              Reject
                            </button>
                            {(student.status === "email_failed" || student.status === "approving") && (
                              <button
                                className="retry-btn"
                                onClick={() => retryEmail(student.uid)}
                                title="Retry sending approval email"
                              >
                                Retry
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <p className="showing-text">
                    Showing {displayedCount} of {totalCount} pending requests
                  </p>
                  <div className="pagination">
                    <button className="pagination-btn" disabled>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button className="pagination-btn" disabled>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}