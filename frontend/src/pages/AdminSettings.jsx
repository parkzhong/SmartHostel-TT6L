import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./AdminSettings.css";

export default function AdminSettings() {
    const [user, setUser] = useState(null);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            navigate("/login");
            return;
        }

        setUser(currentUser);
        setEmail(currentUser.email);
        setFullName(currentUser.displayName || "");

        // Fetch Firestore data to sync
        const loadProfile = async () => {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            if (snap.exists()) {
                setFullName(snap.data().fullName || currentUser.displayName);
            }
        };
        loadProfile();

    }, [navigate]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            await updateProfile(user, { displayName: fullName });
            await updateDoc(doc(db, "users", user.uid), { fullName });
            setMessage({ type: "success", text: "Profile updated successfully." });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) return;
        setLoading(true);
        setMessage(null);
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage({ type: "success", text: "Password reset email sent to " + email });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    if (!user) return <div style={{ padding: "20px" }}>Loading...</div>;

    return (
        <div className="admin-settings-page">
            <div className="admin-settings-container">
                {/* Header */}
                <div className="admin-settings-header">
                    <div className="header-logo">
                        <div className="logo-icon">
                            <img src="/logo.png" alt="Logo" />
                        </div>
                        <div className="logo-text">
                            <h1>Smart Hostel</h1>
                            <p>Admin</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="header-btn" onClick={() => navigate("/admin-settings")} style={{ background: '#f9fafb', borderColor: '#d1d5db', color: '#111827' }}>
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

                <div className="admin-settings-content">
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
                                {/* Settings Removed */}
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
                    <div style={{ padding: "24px" }}>
                        <div className="settings-main-wrapper">
                            <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>Admin Settings</h1>
                            <p style={{ color: "#6b7280", marginBottom: "24px" }}>Manage your account preferences.</p>

                            {message && <div className={`message ${message.type}`}>{message.text}</div>}
                            {error && <div className="message error">{error}</div>}

                            <form onSubmit={handleUpdateProfile}>
                                <div className="settings-section">
                                    <h2>Basic Information</h2>
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={email}
                                            disabled={true}
                                        />
                                        <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                                            Email cannot be changed directly.
                                        </span>
                                    </div>
                                    <button type="submit" className="settings-save-btn" disabled={loading}>
                                        {loading ? "Updating..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>

                            <div className="settings-section">
                                <h2>Security</h2>
                                <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "16px" }}>
                                    Need to update your password? Simple click below to receive a password reset link at <strong>{email}</strong>.
                                </p>
                                <button className="action-btn" onClick={handlePasswordReset} disabled={loading}>
                                    Send Password Reset Email
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
