import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import NotificationBell from "../component/NotificationBell";

export default function AdminDashboard() {
    const [profile, setProfile] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        async function loadData() {
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

                // Load pending students count
                await loadPendingCount();
            } catch (error) {
                console.error("Failed to load data:", error);
            }
        }

        loadData();
    }, [navigate]);

    async function loadPendingCount() {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;

            const res = await fetch("http://127.0.0.1:5000/api/admin/pending-students", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setPendingCount(Array.isArray(data) ? data.length : 0);
            }
        } catch (error) {
            console.error("Failed to load pending count:", error);
        }
    }

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    if (!profile) {
        return (
            <div className="admin-dashboard-page">
                <div className="admin-dashboard-container">
                    <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-page">
            <div className="admin-dashboard-container">
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
                <div className="admin-dashboard-content">
                    {/* Sidebar */}
                    <div className="admin-sidebar">
                        <div className="sidebar-section">
                            <h3 className="sidebar-title">Admin Quick Actions</h3>
                            <nav className="sidebar-nav">
                                <button className="nav-item active" onClick={() => navigate("/admin-dashboard")}>
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

                    {/* Main Content */}
                    <div className="admin-main-content">
                        <div className="content-header">
                            <h1 className="content-title">Daily Operations Overview</h1>
                            <p className="content-subtitle">Monitor requests, manage approvals, and handle financial transactions.</p>
                        </div>

                        {/* Action Cards Grid */}
                        <div className="action-cards-grid">
                            {/* Student Approvals Card */}
                            <div className="action-card student-approvals" onClick={() => navigate("/admin-approve")}>
                                <div className="card-icon blue">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="8.5" cy="7" r="4"></circle>
                                        <polyline points="17 11 19 13 23 9"></polyline>
                                    </svg>
                                </div>
                                {pendingCount > 0 && (
                                    <span className="pending-badge">{pendingCount} PENDING</span>
                                )}
                                <h3 className="card-title">Student Approvals</h3>
                                <p className="card-description">
                                    Review and authorize new student registrations and profile updates across all blocks.
                                </p>
                                <button className="card-action">
                                    Review Now
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </button>
                            </div>

                            {/* Manage Students Card */}
                            <div className="action-card manage-students" onClick={() => navigate("/admin-manage-students")}>
                                <div className="card-icon teal">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                    </svg>
                                </div>
                                <h3 className="card-title">Manage Students</h3>
                                <p className="card-description">
                                    Assign rooms, set check-in dates, and manage student accommodation details.
                                </p>
                                <button className="card-action">
                                    Manage Now
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </button>
                            </div>

                            {/* Create New Payment Card */}
                            <div className="action-card create-payment" onClick={() => navigate("/admin-payment-items")}>
                                <div className="card-icon green">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                        <line x1="1" y1="10" x2="23" y2="10"></line>
                                    </svg>
                                </div>
                                <h3 className="card-title">Create New Payment</h3>
                                <p className="card-description">
                                    Generate new invoices for rent, utilities, or maintenance fees for specific student accounts.
                                </p>
                                <button className="card-action">
                                    Quick Form
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </button>
                            </div>

                            {/* Payment History Card */}
                            <div className="action-card payment-history" onClick={() => navigate("/admin-payment-history")}>
                                <div className="card-icon purple">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="1" x2="12" y2="23"></line>
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                    </svg>
                                </div>
                                <h3 className="card-title">Payment History</h3>
                                <p className="card-description">
                                    Access comprehensive transaction records with advanced search and filtering tools.
                                </p>
                                <button className="card-action">
                                    Search Records
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6"></polyline>
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
