import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./AdminManageStudents.css";

export default function AdminManageStudents() {
    const [profile, setProfile] = useState(null);
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [formData, setFormData] = useState({
        block: "",
        roomNumber: "",
        checkInDate: "",
        leaseEnds: ""
    });
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
        loadStudents();
    }, [navigate]);

    async function loadStudents() {
        setErr("");
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken(true);

            const res = await fetch("http://127.0.0.1:5000/api/admin/all-students", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch students");
            }

            setStudents(data);
            setFilteredStudents(data);
        } catch (error) {
            setErr(error.message);
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
                (s.studentEmail || s.email || "").toLowerCase().includes(query) ||
                (s.roomNumber || "").toLowerCase().includes(query) ||
                (s.block || "").toLowerCase().includes(query)
            );
            setFilteredStudents(filtered);
        }
    }, [searchQuery, students]);

    const handleEditClick = (student) => {
        setEditingStudent(student.uid);
        setFormData({
            block: student.block || "",
            roomNumber: student.roomNumber || "",
            checkInDate: student.checkInDate || "",
            leaseEnds: student.leaseEnds || ""
        });
        setErr("");
        setSuccess("");
    };

    const handleSaveClick = async (studentUid) => {
        setErr("");
        setSuccess("");
        setLoading(true);

        try {
            const user = auth.currentUser;
            const token = await user.getIdToken(true);

            const res = await fetch("http://127.0.0.1:5000/api/admin/update-student-room", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    uid: studentUid,
                    block: formData.block,
                    roomNumber: formData.roomNumber,
                    checkInDate: formData.checkInDate,
                    leaseEnds: formData.leaseEnds
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to update student");
            }

            setSuccess("Student information updated successfully!");
            setEditingStudent(null);
            loadStudents();
        } catch (error) {
            setErr(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = () => {
        setEditingStudent(null);
        setFormData({
            block: "",
            roomNumber: "",
            checkInDate: "",
            leaseEnds: ""
        });
        setErr("");
        setSuccess("");
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    if (!profile) {
        return (
            <div className="admin-manage-students-page">
                <div className="admin-manage-students-container">
                    <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-manage-students-page">
            <div className="admin-manage-students-container">
                {/* Header */}
                <div className="admin-manage-students-header">
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
                <div className="admin-manage-students-content">
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
                                <button className="nav-item active" onClick={() => navigate("/admin-manage-students")}>
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
                            <button className="view-logs-btn">
                                View Server Logs
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="manage-students-main-content">
                        <div className="content-header">
                            <div>
                                <h1 className="content-title">Manage Students</h1>
                                <p className="content-subtitle">Assign rooms and manage student accommodations.</p>
                            </div>
                            <div className="header-controls">
                                <div className="search-box">
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or room..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                </div>

                            </div>
                        </div>

                        {err && <div className="error-message">{err}</div>}
                        {success && <div className="success-message">{success}</div>}
                        {loading && <div className="loading-message">Loading...</div>}

                        {!loading && filteredStudents.length === 0 ? (
                            <div className="empty-state">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                <p>No students found.</p>
                            </div>
                        ) : (
                            <div className="students-table-wrapper">
                                <table className="students-table">
                                    <thead>
                                        <tr>
                                            <th>UID</th>
                                            <th>Student Name</th>
                                            <th>Email</th>
                                            <th>Block</th>
                                            <th>Room Number</th>
                                            <th>Check-in Date</th>
                                            <th>Lease Ends</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((student) => (
                                            <tr key={student.uid}>
                                                <td className="data-value" style={{ fontFamily: "monospace", fontSize: "12px", color: "#6b7280" }}>{student.uid}</td>
                                                <td className="name-cell">{student.fullName || "N/A"}</td>
                                                <td className="email-cell">{student.studentEmail || student.email || "N/A"}</td>
                                                <td>
                                                    {editingStudent === student.uid ? (
                                                        <input
                                                            type="text"
                                                            className="edit-input"
                                                            value={formData.block}
                                                            onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                                                            placeholder="e.g., HB2"
                                                        />
                                                    ) : (
                                                        <span className="data-value">{student.block || "--"}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {editingStudent === student.uid ? (
                                                        <input
                                                            type="text"
                                                            className="edit-input"
                                                            value={formData.roomNumber}
                                                            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                                            placeholder="e.g., 402"
                                                        />
                                                    ) : (
                                                        <span className="data-value">{student.roomNumber || "--"}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {editingStudent === student.uid ? (
                                                        <input
                                                            type="date"
                                                            className="edit-input"
                                                            value={formData.checkInDate}
                                                            onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                                                        />
                                                    ) : (
                                                        <span className="data-value">{student.checkInDate || "--"}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {editingStudent === student.uid ? (
                                                        <input
                                                            type="date"
                                                            className="edit-input"
                                                            value={formData.leaseEnds}
                                                            onChange={(e) => setFormData({ ...formData, leaseEnds: e.target.value })}
                                                        />
                                                    ) : (
                                                        <span className="data-value">{student.leaseEnds || "--"}</span>
                                                    )}
                                                </td>
                                                <td className="action-cell">
                                                    {editingStudent === student.uid ? (
                                                        <div className="action-buttons">
                                                            <button className="save-btn" onClick={() => handleSaveClick(student.uid)}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                                </svg>
                                                            </button>
                                                            <button className="cancel-btn" onClick={handleCancelClick}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button className="edit-btn" onClick={() => handleEditClick(student)}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="table-footer">
                            <p className="showing-text">
                                Showing {filteredStudents.length} of {students.length} students
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
