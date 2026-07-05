import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./StudentProfileSettings.css";
// Removed unused import
import Footer from "../component/Footer";
import StudentHeader from "../component/StudentHeader";

export default function StudentProfileSettings() {
    const [profile, setProfile] = useState(null);
    const [fullName, setFullName] = useState("");
    const [personalEmail, setPersonalEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");
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
                    setProfile(data);
                    setFullName(data.fullName || "");
                    setPersonalEmail(data.personalEmail || "");
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
            }
        }

        loadProfile();
    }, [navigate]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setErr("");
        setSuccess("");
        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in");

            // Update Firestore
            await updateDoc(doc(db, "users", user.uid), {
                fullName,
                personalEmail,
            });

            // Update Firebase Auth display name
            await updateProfile(user, {
                displayName: fullName,
            });

            setProfile({ ...profile, fullName, personalEmail });
            setSuccess("Profile updated successfully!");
        } catch (error) {
            setErr(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setErr("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setErr("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setErr("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not logged in");

            await updatePassword(user, newPassword);

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setSuccess("Password changed successfully!");
        } catch (error) {
            if (error.code === "auth/requires-recent-login") {
                setErr("Please log out and log in again before changing your password");
            } else {
                setErr(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const firstName = profile?.fullName ? profile.fullName.split(" ")[0] : "Student";

    if (!profile) {
        return (
            <div className="student-profile-settings-page">
                <div className="student-profile-settings-container">
                    <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="student-profile-settings-page">
            <div className="student-profile-settings-container">
                {/* Header */}
                <StudentHeader />

                {/* Content */}

                {/* Content */}
                <div className="student-profile-settings-content">
                    {/* Sidebar */}
                    <div className="profile-sidebar">
                        <div className="profile-avatar">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <h2 className="profile-name">{fullName ? fullName.split(" ")[0] : firstName}</h2>
                        <p className="profile-email">{profile.studentEmail || profile.email}</p>
                        <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "20px" }}>
                            <div className="status-badge" style={{ margin: 0 }}>
                                <span className="status-dot"></span>
                                Active Resident
                            </div>
                        </div>

                        <button className="back-to-dashboard" onClick={() => navigate("/student-dashboard")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="settings-main-content">
                        <div className="content-header">
                            <h1 className="content-title">Profile Settings</h1>
                            <p className="content-subtitle">Manage your account information and preferences</p>
                        </div>

                        {err && <div className="error-message">{err}</div>}
                        {success && <div className="success-message">{success}</div>}

                        {/* Profile Information Form */}
                        <div className="settings-section">
                            <h3 className="section-title">Personal Information</h3>
                            <form className="settings-form" onSubmit={handleUpdateProfile}>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Student Email (Read-Only)</label>
                                        <input
                                            type="email"
                                            value={profile.studentEmail || profile.email}
                                            disabled
                                            className="readonly-field"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Personal Email</label>
                                        <input
                                            type="email"
                                            value={personalEmail}
                                            onChange={(e) => setPersonalEmail(e.target.value)}
                                            placeholder="Enter your personal email"
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Student ID (Read-Only)</label>
                                        <input
                                            type="text"
                                            value={auth.currentUser?.uid || "N/A"}
                                            disabled
                                            className="readonly-field"
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="save-button" disabled={loading}>
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </form>
                        </div>

                        {/* Change Password Form */}
                        <div className="settings-section">
                            <h3 className="section-title">Change Password</h3>
                            <form className="settings-form" onSubmit={handleChangePassword}>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            minLength="6"
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            minLength="6"
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="save-button password-btn" disabled={loading || !newPassword}>
                                    {loading ? "Changing..." : "Change Password"}
                                </button>
                            </form>
                        </div>

                        {/* Account Information */}
                        <div className="settings-section">
                            <h3 className="section-title">Account Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Role</span>
                                    <span className="info-value">
                                        {(profile.role || "Student").charAt(0).toUpperCase() + (profile.role || "student").slice(1)}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Status</span>
                                    <span className="info-value status-active">
                                        <span className="status-indicator"></span>
                                        Active
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Block</span>
                                    <span className="info-value">{profile.block || "Not Assigned"}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Room</span>
                                    <span className="info-value">{profile.roomNumber || "Not Assigned"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
