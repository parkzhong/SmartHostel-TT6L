import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./WardenSettings.css";
import "./MaintenanceStaffDashboard.css";

export default function MaintenanceSettings() {
    const [user, setUser] = useState(null);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Maintenance");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const load = async (currentUser) => {
            if (!currentUser) {
                navigate("/login");
                return;
            }

            setUser(currentUser);
            setEmail(currentUser.email);
            setFullName(currentUser.displayName || "");

            const loadProfileData = async () => {
                const snap = await getDoc(doc(db, "users", currentUser.uid));
                if (snap.exists()) {
                    const data = snap.data();
                    setFullName(data.fullName || currentUser.displayName);
                    setRole(data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : "Maintenance");
                }
            };
            loadProfileData();
        };

        const unsub = auth.onAuthStateChanged(load);
        return () => unsub();
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
        <div className="warden-settings-page">
            <div className="warden-settings-container">
                {/* Header */}
                <div className="warden-settings-header">
                    <div className="header-logo">
                        <div className="logo-icon">
                            <img src="/logo.png" alt="Logo" />
                        </div>
                        <div className="logo-text">
                            <h1>Smart Hostel</h1>
                            <p>Maintenance Dept.</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="header-btn" onClick={() => navigate("/maintenance-settings")} style={{ background: '#f9fafb', borderColor: '#d1d5db', color: '#111827' }}>
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

                <div className="warden-settings-content">
                    {/* Sidebar */}
                    <div className="warden-sidebar">
                        <div className="warden-profile">
                            <div className="warden-avatar">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <h2 className="warden-name">{role}</h2>
                            <p className="warden-email">{email}</p>
                            <div className="available-badge">
                                <span className="available-dot"></span>
                                Available
                            </div>
                        </div>

                        <button className="sidebar-button" onClick={() => navigate("/maintenance-staff-dashboard") }>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5"></path>
                                <path d="M12 19l-7-7 7-7"></path>
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="settings-main-wrapper">
                        <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>Maintenance Settings</h1>
                        <p style={{ color: "#6b7280", marginBottom: "24px" }}>Manage your maintenance account preferences.</p>

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
                                <button type="submit" className="warden-save-btn" disabled={loading}>
                                    {loading ? "Updating..." : "Save Changes"}
                                </button>
                            </div>
                        </form>

                        <div className="settings-section">
                            <h2>Security</h2>
                            <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "16px" }}>
                                Need to update your password? Simply click below to receive a password reset link at <strong>{email}</strong>.
                            </p>
                            <button className="action-btn" onClick={handlePasswordReset} disabled={loading}>
                                Send Password Reset Email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
