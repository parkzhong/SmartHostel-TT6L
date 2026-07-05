import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./AdminServerLogs.css";

export default function AdminServerLogs() {
    const [profile, setProfile] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, error, warning, info
    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
            try {
                const user = auth.currentUser;
                if (!user) {
                    navigate("/login");
                    return;
                }

                // Load admin profile
                const snap = await getDoc(doc(db, "users", user.uid));
                if (!snap.exists()) {
                    await signOut(auth);
                    navigate("/login");
                    return;
                }

                const data = snap.data();
                if (data.role !== "admin" || data.status?.toLowerCase() !== "active") {
                    await signOut(auth);
                    navigate("/login");
                    return;
                }

                setProfile({
                    uid: user.uid,
                    email: user.email,
                    fullName: data.fullName || "Administrator",
                });

                // Fetch server logs
                await fetchServerLogs(user);
            } catch (err) {
                console.error("Load error:", err);
            } finally {
                setLoading(false);
            }
        }

        const unsub = auth.onAuthStateChanged(load);
        return () => unsub();
    }, [navigate]);

    const fetchServerLogs = async (user) => {
        try {
            const token = await user.getIdToken();
            const res = await fetch("http://127.0.0.1:5000/api/admin/server-logs", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            } else {
                console.error("Failed to fetch server logs");
                setLogs([]);
            }
        } catch (err) {
            console.error("Failed to fetch server logs:", err);
            setLogs([]);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const filteredLogs = filter === "all"
        ? logs
        : logs.filter(log => log.type === filter);

    if (loading || !profile) {
        return (
            <div className="admin-server-logs-page">
                <div className="admin-server-logs-container">
                    <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-server-logs-page">
            <div className="admin-server-logs-container">
                {/* Header */}
                <div className="admin-server-logs-header">
                    <div className="header-logo">
                        <div className="logo-icon">
                            <img src="/logo.png" alt="Smart Hostel Logo" />
                        </div>
                        <div className="logo-text">
                            <h1>Smart Hostel</h1>
                            <p>Admin Dashboard</p>
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
                <div className="admin-server-logs-content">
                    {/* Main Content */}
                    <div className="logs-main-content">
                        <div className="logs-header">
                            <div>
                                <h1 className="logs-title">Server Logs</h1>
                                <p className="logs-subtitle">Monitor system activity and troubleshoot issues</p>
                            </div>
                            <button className="back-btn" onClick={() => navigate("/admin-dashboard")}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5"></path>
                                    <path d="M12 19l-7-7 7-7"></path>
                                </svg>
                                Back to Dashboard
                            </button>
                        </div>

                        {/* Filter Tabs */}
                        <div className="logs-filters">
                            <button
                                className={`filter-btn ${filter === "all" ? "active" : ""}`}
                                onClick={() => setFilter("all")}
                            >
                                All Logs ({logs.length})
                            </button>
                            <button
                                className={`filter-btn ${filter === "info" ? "active" : ""}`}
                                onClick={() => setFilter("info")}
                            >
                                <span className="filter-dot info"></span>
                                Info ({logs.filter(l => l.type === "info").length})
                            </button>
                            <button
                                className={`filter-btn ${filter === "warning" ? "active" : ""}`}
                                onClick={() => setFilter("warning")}
                            >
                                <span className="filter-dot warning"></span>
                                Warning ({logs.filter(l => l.type === "warning").length})
                            </button>
                            <button
                                className={`filter-btn ${filter === "error" ? "active" : ""}`}
                                onClick={() => setFilter("error")}
                            >
                                <span className="filter-dot error"></span>
                                Error ({logs.filter(l => l.type === "error").length})
                            </button>
                        </div>

                        {/* Logs Table */}
                        <div className="logs-table-container">
                            <table className="logs-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Type</th>
                                        <th>Source</th>
                                        <th>Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: "center", padding: "40px" }}>
                                                No logs found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <tr key={log.id}>
                                                <td className="log-timestamp">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td>
                                                    <span className={`log-badge ${log.type}`}>
                                                        {log.type.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="log-source">{log.source}</td>
                                                <td className="log-message">{log.message}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
