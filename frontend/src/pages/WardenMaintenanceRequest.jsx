import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "./WardenMaintenanceRequest.css";
import NotificationBell from "../component/NotificationBell";
import "./WardenDashboard.css";

export default function WardenMaintenanceRequest() {
    const [profile, setProfile] = useState(null);
    const [occupancy, setOccupancy] = useState(0);
    const [requests, setRequests] = useState([]);
    const [maintenanceStaff, setMaintenanceStaff] = useState([]);
    const [statusMsg, setStatusMsg] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [showFilterMenu, setShowFilterMenu] = useState(false);
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

                // Load data
                await loadRequests(user);
                await loadMaintenanceStaff(user);
                // Load stats
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
            const res = await fetch("http://127.0.0.1:5000/api/warden/pending-maintenance-requests", {
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

    const loadMaintenanceStaff = async (user) => {
        try {
            const token = await user.getIdToken();
            const res = await fetch("http://127.0.0.1:5000/api/warden/maintenance-staff", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setMaintenanceStaff(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to load staff:", err);
        }
    };

    const handleAssignTask = async (requestId) => {
        if (maintenanceStaff.length === 0) {
            alert("No maintenance staff available. Please add staff members first.");
            return;
        }

        // Create staff selection prompt
        const staffList = maintenanceStaff.map((s, i) => `${i + 1}. ${s.fullName} (${s.email})`).join("\n");
        const selection = prompt(`Select maintenance staff by number:\n\n${staffList}\n\nEnter number:`);

        if (!selection) return;

        const index = parseInt(selection) - 1;
        if (isNaN(index) || index < 0 || index >= maintenanceStaff.length) {
            alert("Invalid selection.");
            return;
        }

        const selectedStaff = maintenanceStaff[index];
        const remark = prompt("Enter remark (optional):") || "";

        try {
            const user = auth.currentUser;
            const token = await user.getIdToken(true);

            const res = await fetch("http://127.0.0.1:5000/api/warden/assign-maintenance-request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    requestId,
                    staffUid: selectedStaff.uid,
                    remark: remark.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setStatusMsg(data.error || "Failed to assign task.");
                return;
            }

            setStatusMsg(`Task assigned to ${selectedStaff.fullName} successfully!`);
            // Reload requests
            await loadRequests(user);
        } catch (err) {
            setStatusMsg(err.message);
        }
    };

    const handleViewDetails = (request) => {
        const details = `
Request ID: ${request.requestId}
Student: ${request.studentName}
Category: ${request.category}
Location: ${request.location}
Priority: ${request.priority}
Description: ${request.description}
Created: ${new Date(request.createdAt).toLocaleString()}
    `.trim();

        alert(details);
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const getCategoryClass = (category) => {
        const lowerCategory = (category || "").toLowerCase();
        if (lowerCategory.includes("plumbing")) return "plumbing";
        if (lowerCategory.includes("electrical")) return "electrical";
        if (lowerCategory.includes("hvac") || lowerCategory.includes("air")) return "hvac";
        if (lowerCategory.includes("appliance")) return "appliances";
        return "general";
    };

    const getStatusClass = (status) => {
        const lowerStatus = (status || "").toLowerCase();
        if (lowerStatus === "pending_warden" || lowerStatus === "new") return "new";
        if (lowerStatus === "assigned") return "assigned";
        if (lowerStatus === "completed" || lowerStatus === "done") return "done";
        return "pending";
    };

    const getStatusLabel = (status) => {
        const lowerStatus = (status || "").toLowerCase();
        if (lowerStatus === "pending_warden") return "New";
        if (lowerStatus === "assigned") return "Pending";
        if (lowerStatus === "completed") return "Done";
        return status;
    };

    const filteredRequests = requests.filter((req) => {
        // Filter by Category
        if (filterCategory !== "All") {
            const cat = (req.category || "General").toLowerCase();
            const filter = filterCategory.toLowerCase();
            if (filter === "general" && !["plumbing", "electrical", "hvac", "appliances"].includes(cat)) {
                // Match general or unclassified
            } else if (!cat.includes(filter)) {
                return false;
            }
        }

        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            req.requestId?.toLowerCase().includes(search) ||
            req.studentName?.toLowerCase().includes(search) ||
            req.location?.toLowerCase().includes(search) ||
            req.category?.toLowerCase().includes(search) ||
            req.description?.toLowerCase().includes(search)
        );
    });

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
                                    <h2>Maintenance Management</h2>
                                    <p>High-volume triage for property maintenance and repairs.</p>
                                </div>
                                <div className="table-controls">
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Search Request, Room, Student..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            className="filters-button"
                                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="4" y1="6" x2="20" y2="6"></line>
                                                <line x1="4" y1="12" x2="20" y2="12"></line>
                                                <line x1="4" y1="18" x2="14" y2="18"></line>
                                            </svg>
                                            Filters {filterCategory !== "All" && `(${filterCategory})`}
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
                                                    Filter by Category
                                                </div>
                                                {["All", "Plumbing", "Electrical", "HVAC", "Appliances", "General"].map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => { setFilterCategory(opt); setShowFilterMenu(false); }}
                                                        style={{
                                                            display: 'block',
                                                            width: '100%',
                                                            textAlign: 'left',
                                                            padding: '8px 16px',
                                                            background: filterCategory === opt ? '#f3f4f6' : 'white',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontSize: '0.875rem',
                                                            color: filterCategory === opt ? '#2563eb' : '#374151'
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

                            {filteredRequests.length === 0 ? (
                                <div className="empty-table-state">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <p>No maintenance requests found.</p>
                                </div>
                            ) : (
                                <>
                                    <table className="maintenance-table">
                                        <thead>
                                            <tr>
                                                <th>Request ID</th>
                                                <th>Student</th>
                                                <th>Category</th>
                                                <th>Location</th>
                                                <th>Status</th>
                                                <th>Urgency</th>
                                                <th>Description</th>
                                                <th>Reported</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRequests.map((request) => {
                                                const reportedDate = request.createdAt
                                                    ? new Date(request.createdAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })
                                                    : "";

                                                return (
                                                    <tr key={request.requestId}>
                                                        <td className="request-id-cell">#{request.requestId?.substring(0, 8) || "N/A"}</td>
                                                        <td className="student-name-cell">{request.studentName || "Unknown"}</td>
                                                        <td>
                                                            <span className={`category-badge ${getCategoryClass(request.category)}`}>
                                                                {request.category || "General"}
                                                            </span>
                                                        </td>
                                                        <td className="location-cell">{request.location || "N/A"}</td>
                                                        <td>
                                                            <span className={`status-badge-table ${getStatusClass(request.status)}`}>
                                                                <span className="status-dot"></span>
                                                                {getStatusLabel(request.status)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`urgency-badge ${request.priority || "normal"}`}>
                                                                {request.priority || "Normal"}
                                                            </span>
                                                        </td>
                                                        <td className="description-cell" title={request.description}>
                                                            {request.description || "No description"}
                                                        </td>
                                                        <td className="reported-cell">{reportedDate}</td>
                                                        <td>
                                                            <div className="action-buttons-cell">
                                                                <button
                                                                    className="assign-task-btn"
                                                                    onClick={() => handleAssignTask(request.requestId)}
                                                                >
                                                                    Assign Task
                                                                </button>
                                                                <button
                                                                    className="view-details-btn"
                                                                    onClick={() => handleViewDetails(request)}
                                                                >
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    <div className="table-footer">
                                        <div className="table-info">
                                            Showing {filteredRequests.length} of {requests.length} maintenance requests
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
