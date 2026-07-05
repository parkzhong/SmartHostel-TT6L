import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "./WardenVisitorRequest.css";
import "./WardenDashboard.css";
import NotificationBell from "../component/NotificationBell";

export default function WardenVisitorRequest() {
    const [profile, setProfile] = useState(null);
    const [occupancy, setOccupancy] = useState(0);
    const [requests, setRequests] = useState([]);
    const [statusMsg, setStatusMsg] = useState("");
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("pending"); // 'pending' or 'history'
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

                // Load requests
                await loadRequests(user);
                await loadStats(user);
            } catch (err) {
                console.error("Load error:", err);
            } finally {
                setLoading(false);
            }
        }

        const unsub = auth.onAuthStateChanged(load);
        return () => unsub();
    }, [navigate]);

    const loadStats = async (user) => {
        try {
            const token = await user.getIdToken();
            const res = await fetch("http://127.0.0.1:5000/api/warden/dashboard-stats", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setOccupancy(data.activeStudents || 0);
            }
        } catch (err) {
            console.error("Failed to load stats:", err);
        }
    };

    const loadRequests = async (user) => {
        try {
            const token = await user.getIdToken();
            const endpoint = viewMode === "pending"
                ? "http://127.0.0.1:5000/api/warden/pending-visitor-requests"
                : "http://127.0.0.1:5000/api/warden/visitor-request-history";

            const res = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setRequests(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to load requests:", err);
        }
    };

    const handleApprove = async (requestId) => {
        const remark = prompt("Enter remark (optional):") || "";

        try {
            const user = auth.currentUser;
            const token = await user.getIdToken(true);

            const res = await fetch("http://127.0.0.1:5000/api/warden/approve-visitor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    requestId,
                    remark: remark.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setStatusMsg(data.error || "Failed to approve request.");
                return;
            }

            setStatusMsg("Visitor request approved successfully!");
            // Reload requests
            await loadRequests(user);
        } catch (err) {
            setStatusMsg(err.message);
        }
    };

    const handleReject = async (requestId) => {
        const reason = prompt("Enter rejection reason (optional):") || "Rejected by warden";

        try {
            const user = auth.currentUser;
            const token = await user.getIdToken(true);

            const res = await fetch("http://127.0.0.1:5000/api/warden/reject-visitor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    requestId,
                    reason: reason.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setStatusMsg(data.error || "Failed to reject request.");
                return;
            }

            setStatusMsg("Visitor request rejected successfully!");
            // Reload requests
            await loadRequests(user);
        } catch (err) {
            setStatusMsg(err.message);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    if (loading || !profile) {
        return (
            <div className="warden-room-request-page">
                <div className="warden-room-request-container">
                    <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="warden-room-request-page">
            <div className="warden-room-request-container">
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
                            <h2 className="warden-name">{profile.fullName || "Chief Warden"}</h2>
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
                                <span className="stat-value">{occupancy} Students</span>
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

                        <button className="sidebar-button" onClick={() => navigate("/warden-dashboard")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5"></path>
                                <path d="M12 19l-7-7 7-7"></path>
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="warden-main-content">
                        <div className="request-review-header">
                            <div className="review-title-section">
                                <h1>{viewMode === "pending" ? "Visitor Request Management" : "Visitor Request History"}</h1>
                                <p>{viewMode === "pending" ? "Triage pending requests for individual access control." : "View approved and rejected visitor access requests."}</p>
                            </div>
                            <div className="review-controls">
                                <button
                                    className="control-button"
                                    onClick={() => setViewMode(viewMode === "pending" ? "history" : "pending")}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                    {viewMode === "pending" ? "View History" : "View Pending"}
                                </button>
                            </div>
                        </div>

                        {statusMsg && (
                            <div className={`status-message ${statusMsg.includes("success") ? "success" : "error"}`}>
                                {statusMsg}
                            </div>
                        )}

                        <div className="visitor-cards-grid">
                            {requests.length === 0 ? (
                                <div className="no-requests">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                    <p>No {viewMode === "pending" ? "pending" : "historical"} visitor requests found.</p>
                                </div>
                            ) : (
                                requests.map((request) => {
                                    const visitDate = request.visitDate
                                        ? new Date(request.visitDate).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                        : "";

                                    return (
                                        <div key={request.requestId} className="visitor-request-card">
                                            <div className="visitor-card-header">
                                                <div className="visitor-info-section">
                                                    <div className="visitor-avatar">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="12" cy="7" r="4"></circle>
                                                        </svg>
                                                    </div>
                                                    <div className="visitor-details">
                                                        <h3>{request.visitorName || "Visitor"}</h3>
                                                        <p className="visitor-student-name">
                                                            Request by: {request.studentName || "Student"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`status-badge-visitor ${request.status === "approved" ? "approved" : request.status === "rejected" ? "rejected" : "pending"}`}>
                                                    {request.status === "pending_warden" ? "Pending" : (request.status || "Unknown")}
                                                </span>
                                            </div>

                                            <div className="visitor-details-grid">
                                                <div className="visitor-detail-item">
                                                    <label>IC Number</label>
                                                    <div className="visitor-detail-value ic-number">
                                                        {request.visitorIC || "920421-14-5563"}
                                                    </div>
                                                </div>
                                                <div className="visitor-detail-item">
                                                    <label>Relationship</label>
                                                    <div className="visitor-detail-value">
                                                        <span className="relationship-badge">
                                                            {request.relationship || "Sibling (Brother)"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="visitor-detail-item">
                                                    <label>Contact Host</label>
                                                    <div className="visitor-detail-value">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="12" cy="7" r="4"></circle>
                                                        </svg>
                                                        {request.studentName || "Student"}
                                                    </div>
                                                </div>
                                                <div className="visitor-detail-item">
                                                    <label>Requested Host</label>
                                                    <div className="visitor-detail-value">
                                                        <span className="relationship-badge">
                                                            {request.relationship && request.relationship.includes("Parent")
                                                                ? "Parent (Mother)"
                                                                : request.relationship && request.relationship.includes("Aunt")
                                                                    ? "Relative (Aunt)"
                                                                    : request.relationship || "Guest"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="visitor-details-grid">
                                                <div className="visitor-detail-item">
                                                    <label>Visit Schedule</label>
                                                    <div className="visitor-detail-value">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                                        </svg>
                                                        {visitDate}
                                                    </div>
                                                </div>
                                                <div className="visitor-detail-item">
                                                    <label>Time Window</label>
                                                    <div className="visitor-detail-value">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <polyline points="12 6 12 12 16 14"></polyline>
                                                        </svg>
                                                        <span className="time-slot-badge">
                                                            {request.timeIn || "14:00"} - {request.timeOut || "18:00"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="purpose-section">
                                                <label>Purpose of Visit</label>
                                                <p className="purpose-text">{request.purpose || "No purpose specified."}</p>
                                            </div>

                                            {viewMode === "pending" && (
                                                <div className="visitor-actions">
                                                    <button
                                                        className="approve-visitor-btn"
                                                        onClick={() => handleApprove(request.requestId)}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M9 11l3 3L22 4"></path>
                                                        </svg>
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="reject-visitor-btn"
                                                        onClick={() => handleReject(request.requestId)}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <line x1="15" y1="9" x2="9" y2="15"></line>
                                                            <line x1="9" y1="9" x2="15" y2="15"></line>
                                                        </svg>
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                            {viewMode === "history" && (
                                                <div className="visitor-actions">
                                                    {request.status === "approved" && (
                                                        <div style={{ fontSize: '0.9em', color: 'green' }}>
                                                            <strong>Approved by:</strong> {request.approvedByName} <br />
                                                            <strong>Remark:</strong> {request.wardenRemark || "N/A"}
                                                        </div>
                                                    )}
                                                    {request.status === "rejected" && (
                                                        <div style={{ fontSize: '0.9em', color: 'red' }}>
                                                            <strong>Rejected by:</strong> {request.rejectedByName} <br />
                                                            <strong>Reason:</strong> {request.wardenRejectReason || "N/A"}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {requests.length > 0 && (
                            <div className="page-footer-info">
                                Showing {requests.length} of {requests.length} visitor requests
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
