import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseClient";
import NotificationBell from "./NotificationBell";
import "./StudentHeader.css"; // Header styles

export default function StudentHeader() {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    return (
        <div className="dashboard-header">
            <div className="header-logo" onClick={() => navigate("/student-dashboard")} style={{ cursor: "pointer" }}>
                <div className="logo-icon">
                    <img src="/logo.png" alt="Smart Hostel Logo" />
                </div>
                <div className="logo-text">
                    <h1>Smart Hostel</h1>
                    <p>Student Portal</p>
                </div>
            </div>
            <div className="header-actions">
                <NotificationBell />
                <div className="user-menu-container">
                    <button className="icon-button" onClick={() => setShowUserMenu(!showUserMenu)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </button>
                    {showUserMenu && (
                        <div className="user-menu-dropdown">
                            <button className="menu-item" onClick={() => { navigate("/student-settings"); setShowUserMenu(false); }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M12 1v6m0 6v6"></path>
                                    <path d="M21 12h-6m-6 0H3"></path>
                                </svg>
                                Profile Settings
                            </button>
                            <button className="menu-item logout" onClick={handleLogout}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
