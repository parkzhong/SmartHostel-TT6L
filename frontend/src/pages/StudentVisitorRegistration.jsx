import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "./StudentVisitorRegistration.css";
import NotificationBell from "../component/NotificationBell";
import Footer from "../component/Footer";
import StudentHeader from "../component/StudentHeader";

export default function StudentVisitorRegistration() {
    const [profile, setProfile] = useState(null);
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    // Form States
    const [visitorName, setVisitorName] = useState("");
    const [visitorIC, setVisitorIC] = useState("");
    const [relationship, setRelationship] = useState("");
    const [visitDate, setVisitDate] = useState("");
    const [timeIn, setTimeIn] = useState("");
    const [timeOut, setTimeOut] = useState("");
    const [purpose, setPurpose] = useState("");
    const [statusMsg, setStatusMsg] = useState("");

    // Registered visitors
    const [visitors, setVisitors] = useState([]);

    useEffect(() => {
        async function load() {
            setMsg("");
            const user = auth.currentUser;
            if (!user) {
                navigate("/login");
                return;
            }

            const snap = await getDoc(doc(db, "users", user.uid));
            if (!snap.exists()) {
                setMsg("No profile found.");
                return;
            }

            const data = snap.data();
            const status = (data.status || "").toLowerCase();

            if (status !== "active") {
                setMsg("Your account is not active.");
                await signOut(auth);
                navigate("/login");
                return;
            }

            setProfile({
                uid: user.uid,
                email: user.email,
                fullName: data.fullName,
                studentEmail: data.studentEmail,
                status: data.status,
                roomNumber: data.roomNumber || "HB2 • 402",
                checkInDate: data.checkInDate || "Aug 15, 2025",
                leaseEnds: data.leaseEnds || "Jun 30, 2026",
            });

            // Load existing visitor registrations
            await loadVisitors(user);
        }

        const unsub = auth.onAuthStateChanged(load);
        return () => unsub();
    }, [navigate]);

    const loadVisitors = async (user) => {
        try {
            const token = await user.getIdToken();
            const res = await fetch("http://127.0.0.1:5000/api/student/my-visitor-requests", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                // API returns array directly
                setVisitors(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to load visitors:", err);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMsg("");

        if (!visitorName || !visitDate || !timeIn || !timeOut) {
            setStatusMsg("Please fill in all required fields.");
            return;
        }

        try {
            const user = auth.currentUser;
            const token = await user.getIdToken(true);

            const res = await fetch("http://127.0.0.1:5000/api/student/request-visitor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    visitorName,
                    visitorIC,
                    relationship,
                    visitDate,
                    timeIn,
                    timeOut,
                    purpose,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setStatusMsg(data.error || "Failed to register visitor.");
                return;
            }

            setStatusMsg("Visitor registered successfully!");
            // Reset form
            setVisitorName("");
            setVisitorIC("");
            setRelationship("");
            setVisitDate("");
            setTimeIn("");
            setTimeOut("");
            setPurpose("");

            // Reload visitors
            await loadVisitors(user);
        } catch (err) {
            setStatusMsg(err.message);
        }
    };

    if (!profile) {
        return (
            <div className="visitor-registration-page">
                <div className="visitor-registration-container">
                    <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
                </div>
            </div>
        );
    }

    const firstName = profile.fullName ? profile.fullName.split(" ")[0] : "Student";

    return (
        <div className="visitor-registration-page">
            <div className="visitor-registration-container">
                {/* Header */}
                <StudentHeader />

                {/* Content */}
                <div className="visitor-registration-content">
                    {/* Sidebar */}
                    <div className="request-sidebar">
                        <div className="profile-avatar">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <h2 className="profile-name">{firstName}</h2>
                        <p className="profile-email">{profile.studentEmail || profile.email}</p>
                        <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "20px" }}>
                            <div className="status-badge" style={{ margin: 0 }}>
                                <span className="status-dot"></span>
                                Active Resident
                            </div>
                        </div>

                        <div className="profile-details">
                            <div className="detail-item">
                                <span className="detail-label">Block</span>
                                <span className="detail-value">{profile.roomNumber?.includes("•") ? profile.roomNumber.split("•")[0].trim() : "HB2"}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Room Number</span>
                                <span className="detail-value">{profile.roomNumber?.includes("•") ? profile.roomNumber.split("•")[1].trim() : profile.roomNumber}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Check-in Date</span>
                                <span className="detail-value">{profile.checkInDate}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Lease Ends</span>
                                <span className="detail-value">{profile.leaseEnds}</span>
                            </div>
                        </div>

                        <Link to="/student-dashboard" className="back-to-dashboard">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            Back to Dashboard
                        </Link>
                    </div>

                    {/* Main Form */}
                    <div className="visitor-main">
                        <div className="visitor-hub-header">
                            <h1 className="visitor-hub-title">Visitor Registration Hub</h1>
                            <p className="visitor-hub-subtitle">Manage and register guests visiting your residence.</p>
                        </div>

                        {statusMsg && (
                            <div className={`visitor-status-message ${statusMsg.includes("success") ? "success" : "error"}`}>
                                {statusMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Visitor Information */}
                            <div className="form-section">
                                <h2 className="section-title">Visitor Information</h2>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Visitor Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Enter guest's full name"
                                            value={visitorName}
                                            onChange={(e) => setVisitorName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Visitors IC</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Enter guest's IC"
                                            value={visitorIC}
                                            onChange={(e) => setVisitorIC(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label>Visitor Relationship</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter guest's relationship"
                                        value={relationship}
                                        onChange={(e) => setRelationship(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Visit Details */}
                            <div className="form-section">
                                <h2 className="section-title">Visit Details</h2>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Expected Arrival Time</label>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={visitDate}
                                                onChange={(e) => setVisitDate(e.target.value)}
                                                required
                                                style={{ flex: 1 }}
                                            />
                                            <input
                                                type="time"
                                                className="form-input"
                                                value={timeIn}
                                                onChange={(e) => setTimeIn(e.target.value)}
                                                required
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-field">
                                        <label>Expected Leaving Time</label>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={visitDate}
                                                disabled
                                                style={{ flex: 1, backgroundColor: "#f3f4f6" }}
                                            />
                                            <input
                                                type="time"
                                                className="form-input"
                                                value={timeOut}
                                                onChange={(e) => setTimeOut(e.target.value)}
                                                required
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label>Reason for Visit</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Briefly state why the visitor is coming..."
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="submit-button-wrapper">
                                <button type="submit" className="submit-request-btn">
                                    Register Visitor
                                </button>
                            </div>
                        </form>

                        {/* My Registered Visitors */}
                        <div className="registered-visitors">
                            <h3 className="visitors-title">My Registered Visitors</h3>
                            {visitors.length === 0 ? (
                                <div className="no-visitors">
                                    <p>No registered visitors yet.</p>
                                </div>
                            ) : (
                                visitors.map((visitor, index) => {
                                    // Determine icon color based on status
                                    let iconClass = "blue";
                                    if (visitor.status === "approved" || visitor.status === "checked_in") {
                                        iconClass = "green";
                                    } else if (visitor.status === "expected") {
                                        iconClass = "yellow";
                                    }

                                    // Format status display
                                    // Format status display (NEW)
                                    const s = (visitor.status || "").toLowerCase();
                                    let statusDisplay = "Pending";

                                    const getVisitPhase = () => {
                                        if (!visitor.visitDate || !visitor.timeIn || !visitor.timeOut) return "unknown";

                                        const toDateTime = (dateStr, timeStr) => {
                                            const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr; // HH:MM -> HH:MM:SS
                                            return new Date(`${dateStr}T${t}`);
                                        };

                                        const start = toDateTime(visitor.visitDate, visitor.timeIn);
                                        let end = toDateTime(visitor.visitDate, visitor.timeOut);

                                        // If timeOut is past midnight (e.g. 23:00 -> 01:00), end is next day
                                        if (end < start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);

                                        const now = new Date();

                                        if (now < start) return "before";
                                        if (now >= start && now <= end) return "during";
                                        return "after";
                                    };

                                    if (s === "pending_warden") {
                                        statusDisplay = "Pending";
                                    } else if (s === "rejected") {
                                        statusDisplay = "Rejected";
                                    } else if (s === "approved") {
                                        const phase = getVisitPhase();
                                        if (phase === "before") statusDisplay = "Approved";
                                        else if (phase === "during") statusDisplay = "Check-in";
                                        else if (phase === "after") statusDisplay = "Check-out";
                                        else statusDisplay = "Approved";
                                    } else if (s === "checked_in") {
                                        // optional: if you already store checked_in in db
                                        statusDisplay = getVisitPhase() === "after" ? "Check-out" : "Checked In";
                                    }

                                    // Format date and time
                                    const arrivalTime = `${visitor.visitDate || ""} ${visitor.timeIn || ""}`.trim();
                                    const relationship = visitor.relationship ? ` • ${visitor.relationship}` : "";

                                    return (
                                        <div key={index} className="visitor-card">
                                            <div className={`visitor-icon ${iconClass}`}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="9" cy="7" r="4"></circle>
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                </svg>
                                            </div>
                                            <div className="visitor-details">
                                                <p className="visitor-name">{visitor.visitorName || "Visitor"}</p>
                                                <p className="visitor-info">
                                                    {arrivalTime || "Scheduled"}{relationship}
                                                </p>
                                            </div>
                                            <span className={`visitor-status ${statusDisplay.toLowerCase().replace(" ", "-")}`}>
                                                {statusDisplay}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <Footer />
            </div>
        </div>
    );
}
