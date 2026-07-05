import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./MaintenanceStaffDashboard.css";
import NotificationBell from "../component/NotificationBell";

export default function MaintenanceStaffDashboard() {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
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
            fullName: data.fullName || "Maintenance Staff",
            role: data.role || "maintenance_staff",
            status: "Available"
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
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not logged in");

      const res = await fetch("http://127.0.0.1:5000/api/maintenance/my-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch jobs");
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(requestId, status) {
    setErr("");
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Not logged in");

      const note = status === "completed" ? prompt("Resolution notes:") || "" : "";

      const res = await fetch("http://127.0.0.1:5000/api/maintenance/update-request-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, status, note }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // Group jobs by status
  const newRequests = jobs.filter(j => j.status === "pending_warden" || j.status === "pending");
  const assignedJobs = jobs.filter(j => j.status === "assigned");
  const inProgressJobs = jobs.filter(j => j.status === "in_progress");
  const resolvedJobs = jobs.filter(j => j.status === "completed" || j.status === "resolved");

  const assignedTodayCount = assignedJobs.length + inProgressJobs.length;

  const getPriorityBadge = (priority) => {
    const p = (priority || "normal").toLowerCase();
    if (p === "high") return "high";
    if (p === "low") return "low";
    return "medium";
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const firstName = profile?.fullName ? profile.fullName.split(" ")[0] : "User";

  if (!profile) {
    return (
      <div className="maintenance-staff-page">
        <div className="maintenance-staff-container">
          <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="maintenance-staff-page">
      <div className="maintenance-staff-container">
        {/* Header */}
        <div className="maintenance-staff-header">
          <div className="header-logo">
            <div className="logo-icon">
              <img src="/logo.png" alt="Smart Hostel Logo" />
            </div>
            <div className="logo-text">
              <h1>Smart Hostel</h1>
              <p>Maintenance Dept.</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="header-btn" onClick={() => navigate("/maintenance-settings")}>
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
        <div className="maintenance-staff-content">
          {/* Sidebar */}
          <div className="staff-sidebar">
            <div className="staff-profile">
              <div className="staff-avatar">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h2 className="staff-name">{firstName}</h2>
              <p className="staff-role">Senior Technician</p>
              <div className="available-badge">
                <span className="available-dot"></span>
                Available
              </div>
            </div>

            <div className="staff-stats">
              <div className="stat-item">
                <span className="stat-label">Active Tasks</span>
                <span className="stat-value">{String(assignedTodayCount).padStart(2, '0')} Tasks</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Done</span>
                <span className="stat-value">{String(resolvedJobs.length).padStart(2, '0')} Tasks</span>
              </div>
            </div>
          </div>

          {/* Main Workflow Board */}
          <div className="workflow-board">
            <div className="board-header">
              <div>
                <h1 className="board-title">Maintenance Workflow Board</h1>
                <p className="board-subtitle">Manage and track student maintenance requests in real-time.</p>
              </div>
              <div className="board-actions">
                <button className="new-log-button" onClick={load}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {err && <div className="error-message">{err}</div>}
            {loading && <div className="loading-message">Loading tasks...</div>}

            {/* Kanban Columns */}
            <div className="kanban-board">

              {/* Assigned Column */}
              <div className="kanban-column">
                <div className="column-header">
                  <div className="column-title">
                    <span className="column-icon assigned">●</span>
                    Assigned
                  </div>
                  <span className="column-count">{assignedJobs.length}</span>
                </div>
                <div className="column-cards">
                  {assignedJobs.map((job) => (
                    <div key={job.requestId} className="task-card">
                      <div className="card-header-row">
                        <span className="request-id">#{job.requestId?.slice(-6) || "REQ"}</span>
                        <span className={`priority-badge ${getPriorityBadge(job.priority)}`}>
                          {(job.priority || "Normal")}
                        </span>
                      </div>
                      <h3 className="task-title">{job.category || "Maintenance Request"}</h3>
                      <p className="task-student">Student: {job.studentName || "Unknown"}</p>
                      <div className="task-meta">
                        <div className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span>{job.location || "TBD"}</span>
                        </div>
                        <div className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span>{formatTime(job.createdAt)}</span>
                        </div>
                      </div>
                      <button
                        className="action-button start-work"
                        onClick={() => updateStatus(job.requestId, "in_progress")}
                      >
                        Start Work
                      </button>
                    </div>
                  ))}
                  {assignedJobs.length === 0 && (
                    <div className="empty-column">No assigned tasks</div>
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="kanban-column">
                <div className="column-header">
                  <div className="column-title">
                    <span className="column-icon in-progress">●</span>
                    In Progress
                  </div>
                  <span className="column-count">{inProgressJobs.length}</span>
                </div>
                <div className="column-cards">
                  {inProgressJobs.map((job) => (
                    <div key={job.requestId} className="task-card">
                      <div className="card-header-row">
                        <span className="request-id">#{job.requestId?.slice(-6) || "REQ"}</span>
                        <span className={`priority-badge ${getPriorityBadge(job.priority)}`}>
                          {(job.priority || "Normal")}
                        </span>
                      </div>
                      <h3 className="task-title">{job.category || "Maintenance Request"}</h3>
                      <p className="task-student">Student: {job.studentName || "Unknown"}</p>
                      <div className="task-meta">
                        <div className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span>{job.location || "TBD"}</span>
                        </div>
                        <div className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span>{formatTime(job.createdAt)}</span>
                        </div>
                      </div>
                      <button
                        className="action-button mark-resolved"
                        onClick={() => updateStatus(job.requestId, "completed")}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Mark Resolved
                      </button>
                    </div>
                  ))}
                  {inProgressJobs.length === 0 && (
                    <div className="empty-column">No tasks in progress</div>
                  )}
                </div>
              </div>

              {/* Resolved Column */}
              <div className="kanban-column">
                <div className="column-header">
                  <div className="column-title">
                    <span className="column-icon resolved">●</span>
                    Resolved
                  </div>
                  <span className="column-count">{resolvedJobs.length}</span>
                </div>
                <div className="column-cards">
                  {resolvedJobs.map((job) => (
                    <div key={job.requestId} className="task-card resolved">
                      <div className="card-header-row">
                        <span className="request-id">#{job.requestId?.slice(-6) || "REQ"}</span>
                        <span className={`priority-badge ${getPriorityBadge(job.priority)}`}>
                          {(job.priority || "Normal")}
                        </span>
                      </div>
                      <h3 className="task-title">{job.category || "Maintenance Request"}</h3>
                      <p className="task-student">Student: {job.studentName || "Unknown"}</p>
                      <div className="task-meta">
                        <div className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span>Completed at {formatTime(job.updatedAt || job.createdAt)}</span>
                        </div>
                      </div>
                      <div className="resolved-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Completed
                      </div>
                    </div>
                  ))}
                  {resolvedJobs.length === 0 && (
                    <div className="empty-column">No resolved tasks</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}