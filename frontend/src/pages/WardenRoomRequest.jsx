import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "./WardenRoomRequest.css";
import "./WardenDashboard.css";
import NotificationBell from "../component/NotificationBell";

export default function WardenRoomRequest() {
    const [profile, setProfile] = useState(null);
    const [occupancy, setOccupancy] = useState(0);
    const [requests, setRequests] = useState([]);
    const [statusMsg, setStatusMsg] = useState("");
    const [loading, setLoading] = useState(true);

    // Filter & Sort State
    const [filterType, setFilterType] = useState("All");
    const [sortType, setSortType] = useState("Newest");
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

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

                // Load pending requests
                await loadRequests(user);
                // Load data
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
            const res = await fetch("http://127.0.0.1:5000/api/warden/pending-room-requests", {
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
        const allocation = prompt("Enter room allocation (e.g., Block A - Room 203):");
        if (!allocation || allocation.trim() === "") return;

        const remark = prompt("Enter remark (optional):") || "";

        try {
            const user = auth.currentUser;
            const token = await user.getIdToken(true);

            const res = await fetch("http://127.0.0.1:5000/api/warden/approve-room-request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    requestId,
                    allocation: allocation.trim(),
                    remark: remark.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setStatusMsg(data.error || "Failed to approve request.");
                return;
            }

            setStatusMsg("Request approved successfully!");
            // Reload requests
            await loadRequests(user);
        } catch (err) {
            setStatusMsg(err.message);
        }
    };

    const handleDecline = async (requestId) => {
        const reason = prompt("Enter rejection reason (optional):") || "Rejected by warden";

        try {
            const user = auth.currentUser;
            const token = await user.getIdToken(true);

            const res = await fetch("http://127.0.0.1:5000/api/warden/reject-room-request", {
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

            setStatusMsg("Request rejected successfully!");
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

    const getInitials = (name) => {
        if (!name) return "S";
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarVariant = (index) => {
        const variants = ["variant-1", "variant-2", "variant-3", "variant-4"];
        return variants[index % variants.length];
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
                                <h1>Focused Request Review</h1>
                                <p>Pending Room Allocation Applications ({requests.length} Items)</p>
                            </div>
                            <div className="review-controls">
                                <div style={{ position: 'relative' }}>
                                    <button
                                        className="control-button"
                                        onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="4" y1="6" x2="20" y2="6"></line>
                                            <line x1="4" y1="12" x2="20" y2="12"></line>
                                            <line x1="4" y1="18" x2="14" y2="18"></line>
                                        </svg>
                                        Filter {filterType !== "All" && `(${filterType})`}
                                    </button>

                                    {showFilterMenu && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '8px',
                                            background: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            zIndex: 20,
                                            minWidth: '200px',
                                            padding: '8px 0'
                                        }}>
                                            <div style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                                                Filter by Room Type
                                            </div>
                                            {["All", "Single", "Double Sharing", "Triple Sharing", "Quad Sharing"].map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => { setFilterType(opt); setShowFilterMenu(false); }}
                                                    style={{
                                                        display: 'block',
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        padding: '8px 16px',
                                                        background: filterType === opt ? '#f3f4f6' : 'white',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                        color: filterType === opt ? '#2563eb' : '#374151'
                                                    }}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <button
                                        className="control-button"
                                        onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 6h18M7 12h10M10 18h4"></path>
                                        </svg>
                                        Sort {sortType !== "Newest" && `(${sortType})`}
                                    </button>

                                    {showSortMenu && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '8px',
                                            background: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            zIndex: 20,
                                            minWidth: '200px',
                                            padding: '8px 0'
                                        }}>
                                            <div style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                                                Sort by
                                            </div>
                                            {["Newest", "Oldest", "Name A-Z", "Name Z-A"].map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => { setSortType(opt); setShowSortMenu(false); }}
                                                    style={{
                                                        display: 'block',
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        padding: '8px 16px',
                                                        background: sortType === opt ? '#f3f4f6' : 'white',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                        color: sortType === opt ? '#2563eb' : '#374151'
                                                    }}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {statusMsg && (
                            <div className={`status-message ${statusMsg.includes("success") ? "success" : "error"}`}>
                                {statusMsg}
                            </div>
                        )}

                        <div className="requests-grid">
                            {/* Filter & Sort Logic */}
                            {(() => {
                                let processedRequests = [...requests];

                                // Filter
                                if (filterType !== "All") {
                                    processedRequests = processedRequests.filter(r =>
                                        (r.roomType || "").toLowerCase().includes(filterType.toLowerCase())
                                    );
                                }

                                // Sort
                                processedRequests.sort((a, b) => {
                                    if (sortType === "Newest") {
                                        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                                    } else if (sortType === "Oldest") {
                                        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                                    } else if (sortType === "Name A-Z") {
                                        return (a.studentName || "").localeCompare(b.studentName || "");
                                    } else if (sortType === "Name Z-A") {
                                        return (b.studentName || "").localeCompare(a.studentName || "");
                                    }
                                    return 0;
                                });

                                if (processedRequests.length === 0) {
                                    return (
                                        <div className="no-requests">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            <p>No requests match your filter.</p>
                                        </div>
                                    );
                                }

                                return processedRequests.map((request, index) => (
                                    <div key={request.requestId} className="request-card">
                                        <div className="request-card-header">
                                            <div className={`student-avatar ${getAvatarVariant(index)}`}>
                                                {getInitials(request.studentName)}
                                            </div>
                                            <div className="student-info">
                                                <h3>{request.studentName || "Student"}</h3>
                                                <p className="student-id">ID: {request.studentUid?.substring(0, 10) || "N/A"}</p>
                                                <p className="student-date" style={{ fontSize: '0.8em', color: '#666' }}>
                                                    {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="room-info">
                                            <div className="room-field">
                                                <label>Current Room</label>
                                                <div className="room-badge current">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                                    </svg>
                                                    {request.currentRoom || "Triple Sharing"}
                                                </div>
                                            </div>
                                            <div className="room-field">
                                                <label>Requested Room</label>
                                                <div className="room-badge requested">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                                    </svg>
                                                    {request.roomType || "Double Sharing"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="reason-section">
                                            <label>Reason for Request</label>
                                            <p className="reason-text">
                                                {request.reason || "No reason provided."}
                                            </p>
                                        </div>

                                        <div className="request-actions">
                                            <button
                                                className="approve-btn"
                                                onClick={() => handleApprove(request.requestId)}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 11l3 3L22 4"></path>
                                                </svg>
                                                Approve Application
                                            </button>
                                            <button
                                                className="decline-btn"
                                                onClick={() => handleDecline(request.requestId)}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                                </svg>
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
