import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./AdminStaffDirectory.css";

export default function AdminStaffDirectory() {
    const [profile, setProfile] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        role: "warden"
    });
    const [modalError, setModalError] = useState("");
    const [modalLoading, setModalLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        async function loadData() {
            try {
                const user = auth.currentUser;
                if (!user) {
                    navigate("/login");
                    return;
                }

                // Load Profile
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

                // Load Staff
                await loadStaff();

            } catch (error) {
                console.error("Failed to load data:", error);
            }
        }
        loadData();
    }, [navigate]);

    async function loadStaff() {
        setLoading(true);
        setError("");
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;

            const res = await fetch("http://127.0.0.1:5000/api/admin/all-staff", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to fetch staff");
            }

            const data = await res.json();
            setStaffList(data);
            setFilteredStaff(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredStaff(staffList);
        } else {
            const q = searchQuery.toLowerCase();
            const filtered = staffList.filter(s =>
                (s.fullName || "").toLowerCase().includes(q) ||
                (s.email || "").toLowerCase().includes(q) ||
                (s.role || "").toLowerCase().includes(q) ||
                (s.uid || "").toLowerCase().includes(q)
            );
            setFilteredStaff(filtered);
        }
    }, [searchQuery, staffList]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        setModalError("");
        setModalLoading(true);

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch("http://127.0.0.1:5000/api/admin/create-staff", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create staff");

            setSuccess("Staff member created successfully!");
            setIsModalOpen(false);
            setFormData({ fullName: "", email: "", password: "", role: "warden" });
            loadStaff();
        } catch (err) {
            setModalError(err.message);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteStaff = async (uid) => {
        if (!window.confirm("Are you sure you want to remove this staff member? This cannot be undone.")) return;

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch("http://127.0.0.1:5000/api/admin/delete-staff", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ uid })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete staff");

            setSuccess("Staff member removed successfully.");
            loadStaff();
        } catch (err) {
            setError(err.message);
        }
    };

    if (!profile) return <div className="loading-message">Loading...</div>;

    return (
        <div className="admin-staff-directory-page">
            <div className="admin-staff-directory-container">
                {/* Header */}
                <div className="admin-staff-directory-header">
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
                <div className="admin-staff-directory-content">
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
                                <button className="nav-item active" onClick={() => navigate("/admin-staff-directory")}>
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
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="staff-directory-main-content">
                        <div className="content-header">
                            <div>
                                <h1 className="content-title">Staff Directory</h1>
                                <p className="content-subtitle">Manage administrators, wardens, and maintenance staff.</p>
                            </div>
                            <div className="header-controls">
                                <div className="search-box">
                                    <input
                                        type="text"
                                        placeholder="Search staff..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                                <button className="add-staff-btn" onClick={() => setIsModalOpen(true)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Add Staff
                                </button>
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <div className="staff-table-wrapper">
                            <table className="staff-table">
                                <thead>
                                    <tr>
                                        <th>UID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" style={{ textAlign: "center" }}>Loading...</td></tr>
                                    ) : filteredStaff.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: "center" }}>No staff found</td></tr>
                                    ) : (
                                        filteredStaff.map(staff => (
                                            <tr key={staff.uid}>
                                                <td style={{ fontFamily: "monospace", color: "#6b7280" }}>{staff.uid}</td>
                                                <td>{staff.fullName}</td>
                                                <td>{staff.email}</td>
                                                <td>
                                                    <span className={`role-badge role-${staff.role}`}>{staff.role}</span>
                                                </td>
                                                <td>
                                                    {staff.uid !== profile.uid && (
                                                        <button className="delete-btn" onClick={() => handleDeleteStaff(staff.uid)} title="Delete Staff">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Staff Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">Add New Staff Member</h2>
                            <button className="close-modal" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddStaff}>
                            {modalError && <p className="error-msg">{modalError}</p>}
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    required
                                    placeholder="Set temporary password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select
                                    className="form-select"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="warden">Warden</option>
                                    <option value="maintenance_staff">Maintenance Staff</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="confirm-btn" disabled={modalLoading}>
                                    {modalLoading ? "Creating..." : "Create Staff"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
