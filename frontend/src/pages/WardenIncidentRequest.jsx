import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "./WardenIncidentRequest.css";
import "./WardenMaintenanceRequest.css";
import "./WardenDashboard.css";
import NotificationBell from "../component/NotificationBell";

export default function WardenIncidentRequest() {
    const [profile, setProfile] = useState(null);
    const [occupancy, setOccupancy] = useState(0);
    const [reports, setReports] = useState([]);
    const [statusMsg, setStatusMsg] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
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

                // Load pending reports
                await loadReports(user);
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

    const loadReports = async (user) => {
        try {
            const token = await user.getIdToken();
            const res = await fetch("http://127.0.0.1:5000/api/warden/pending-incident-reports", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setReports(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to load reports:", err);
        }
    };

    const handleViewDetails = async (reportId, currentStatus) => {
        const statusNow = (currentStatus || "").toLowerCase();

        // Flow:
        // pending_warden -> in_review -> resolved
        // pending_warden -> rejected
        // in_review -> rejected

        let actions = [];
        if (statusNow === "pending_warden") actions = ["1. Mark as In Review", "2. Reject", "3. Cancel"];
        else if (statusNow === "in_review") actions = ["1. Resolve", "2. Reject", "3. Cancel"];
        else actions = ["1. Cancel"];

        const choice = prompt(`Select action:\n\n${actions.join("\n")}\n\nEnter number:`);
        if (!choice || choice === "3" || actions.length === 1) return;

        let newStatus = "";
        if (statusNow === "pending_warden") {
            if (choice === "1") newStatus = "in_review";
            else if (choice === "2") newStatus = "rejected";
            else return alert("Invalid selection.");
        } else if (statusNow === "in_review") {
            if (choice === "1") newStatus = "resolved";
            else if (choice === "2") newStatus = "rejected";
            else return alert("Invalid selection.");
        }

        const wardenRemark = (prompt("Warden remark (optional):") || "").trim();

        let resolution = "";
        let rejectReason = "";

        if (newStatus === "resolved") {
            resolution = (prompt("Resolution (required):") || "").trim();
            if (!resolution) return alert("Resolution is required to resolve.");
        }

        if (newStatus === "rejected") {
            rejectReason = (prompt("Reject reason (required):") || "").trim();
            if (!rejectReason) return alert("Reject reason is required to reject.");
        }

        try {
            const user = auth.currentUser;
            const token = await user.getIdToken(true);

            const res = await fetch("http://127.0.0.1:5000/api/warden/update-incident", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    reportId,
                    status: newStatus,
                    wardenRemark,
                    resolution,
                    rejectReason,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setStatusMsg(data.error || "Failed to update incident.");
                return;
            }

            setStatusMsg(`Incident updated → ${newStatus}`);
            await loadReports(user);
        } catch (err) {
            console.error(err);
            setStatusMsg(err.message);
        }
    };


    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const getCategoryClass = (category) => {
        const lowerCategory = (category || "").toLowerCase();
        if (lowerCategory.includes("smoking")) return "smoking";
        if (lowerCategory.includes("noise")) return "noise";
        if (lowerCategory.includes("vandalism")) return "vandalism";
        if (lowerCategory.includes("theft")) return "theft";
        if (lowerCategory.includes("safety")) return "safety";
        return "general";
    };

    const getStatusClass = (status) => {
        const s = (status || "").toLowerCase();
        if (s === "pending_warden") return "pending";
        if (s === "in_review") return "in-review";
        if (s === "resolved") return "resolved";
        if (s === "rejected") return "rejected";
        return "pending";
    };


    const getStatusLabel = (status) => {
        const s = (status || "").toLowerCase();
        if (s === "pending_warden") return "Pending";
        if (s === "in_review") return "In Review";
        if (s === "resolved") return "Resolved";
        if (s === "rejected") return "Rejected";
        return status;
    };


    const filteredReports = reports.filter((report) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            report.reportId?.toLowerCase().includes(search) ||
            report.studentName?.toLowerCase().includes(search) ||
            report.location?.toLowerCase().includes(search) ||
            report.category?.toLowerCase().includes(search) ||
            report.description?.toLowerCase().includes(search)
        );
    });

    // Calculate stats
    const stats = {
        total: filteredReports.length,
        smoking: filteredReports.filter(r => r.category?.toLowerCase().includes("smoking")).length,
        noise: filteredReports.filter(r => r.category?.toLowerCase().includes("noise")).length,
        pending: filteredReports.filter(r => r.status?.toLowerCase() === "pending_warden").length,
        resolved: filteredReports.filter(r => r.status?.toLowerCase() === "resolved").length,
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

                    {/* Main Content with Table */}
                    <div className="warden-main-content">
                        <div className="maintenance-table-container">
                            <div className="table-header">
                                <div className="table-title-section">
                                    <h2>Incident Reports Management</h2>
                                    <p>Detailed log of all reported safety and security incidents.</p>
                                </div>
                                <div className="table-controls">
                                    <div className="incident-stats-banner">
                                        <div className="stat-pill">
                                            <span className="stat-number">{stats.total}</span>
                                            <span>Reports</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="table-header" style={{ marginTop: "16px" }}>
                                <div className="table-controls" style={{ width: "100%" }}>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Search Name, Category, Location..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {statusMsg && (
                                <div className={`status-message ${statusMsg.includes("success") ? "success" : "error"}`}>
                                    {statusMsg}
                                </div>
                            )}

                            {filteredReports.length === 0 ? (
                                <div className="empty-table-state">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                    <p>No incident reports found.</p>
                                </div>
                            ) : (
                                <>
                                    <table className="maintenance-table">
                                        <thead>
                                            <tr>
                                                <th>#ID</th>
                                                <th>Reporter Name</th>
                                                <th>Category</th>
                                                <th>Location</th>
                                                <th>Description</th>
                                                <th>Evidence</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReports.map((report) => {
                                                return (
                                                    <tr key={report.reportId}>
                                                        <td className="request-id-cell">#{report.reportId?.substring(0, 4) || "N/A"}</td>
                                                        <td className="student-name-cell">{report.studentName || "Anonymous"}</td>
                                                        <td>
                                                            <span className={`category-badge ${getCategoryClass(report.category)}`}>
                                                                {report.category || "General"}
                                                            </span>
                                                        </td>
                                                        <td className="location-cell">{report.location || "N/A"}</td>
                                                        <td className="description-cell" title={report.description}>
                                                            {report.description || "No description"}
                                                        </td>
                                                        <td>
                                                            {report.evidenceUrl ? (
                                                                <a
                                                                    href={report.evidenceUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ color: "#3b82f6", textDecoration: "none" }}
                                                                >
                                                                    <svg
                                                                        width="16"
                                                                        height="16"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        style={{ display: "inline" }}
                                                                    >
                                                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                                                    </svg>
                                                                </a>
                                                            ) : (
                                                                <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge-table ${getStatusClass(report.status)}`}>
                                                                <span className="status-dot"></span>
                                                                {getStatusLabel(report.status)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="view-details-btn"
                                                                onClick={() => handleViewDetails(report.reportId, report.status)}
                                                            >
                                                                View Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    <div className="table-footer">
                                        <div className="table-info">
                                            Showing {filteredReports.length} of {reports.length} incident reports
                                        </div>
                                        <div className="pagination">
                                            <button className="pagination-btn active">1</button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
