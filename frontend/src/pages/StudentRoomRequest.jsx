import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "./StudentRoomRequest.css";
import NotificationBell from "../component/NotificationBell";
import Footer from "../component/Footer";
import StudentHeader from "../component/StudentHeader";

export default function StudentRoomRequest() {
    const [profile, setProfile] = useState(null);
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    // Form States
    const [preferredBlock, setPreferredBlock] = useState("HB 2");
    const [roomCategory, setRoomCategory] = useState("Double Sharing");
    const [moveInDate, setMoveInDate] = useState("");
    const [reason, setReason] = useState("");
    const [statusMsg, setStatusMsg] = useState("");

    // Active requests
    const [requests, setRequests] = useState([]);

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

            // Load existing requests
            await loadRequests(user);
        }

        const unsub = auth.onAuthStateChanged(load);
        return () => unsub();
    }, [navigate]);

    const loadRequests = async (user) => {
        try {
            const token = await user.getIdToken();
            const res = await fetch("http://127.0.0.1:5000/api/student/my-room-requests", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                // API returns array directly
                setRequests(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to load requests:", err);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMsg("");

        if (!roomCategory || !reason) {
            setStatusMsg("Please fill in all required fields.");
            return;
        }

        try {
            const user = auth.currentUser;
            const token = await user.getIdToken(true);

            const res = await fetch("http://127.0.0.1:5000/api/student/request-room", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    roomType: roomCategory,
                    reason: reason,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setStatusMsg(data.error || "Failed to submit request.");
                return;
            }

            setStatusMsg("Room request submitted successfully!");
            // Reset form
            setRoomCategory("Double Sharing");
            setReason("");

            // Reload requests
            await loadRequests(user);
        } catch (err) {
            setStatusMsg(err.message);
        }
    };

    if (!profile) {
        return (
            <div className="room-request-page">
                <div className="room-request-container">
                    <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
                </div>
            </div>
        );
    }

    const firstName = profile.fullName ? profile.fullName.split(" ")[0] : "Student";

    return (
        <div className="room-request-page">
            <div className="room-request-container">
                {/* Header */}
                <StudentHeader />

                {/* Content */}
                <div className="room-request-content">
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
                    <div className="request-main">
                        <div className="request-hub-header">
                            <h1 className="request-hub-title">Room Request Hub</h1>
                            <p className="request-hub-subtitle">Submit and track your room-related applications.</p>
                        </div>

                        {statusMsg && (
                            <div className={`request-status-message ${statusMsg.includes("success") ? "success" : "error"}`}>
                                {statusMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Room Preferences */}
                            <div className="form-section">
                                <h2 className="section-title">Room Preferences</h2>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Preferred Block</label>
                                        <select
                                            value={preferredBlock}
                                            onChange={(e) => setPreferredBlock(e.target.value)}
                                            required
                                        >
                                            <option value="HB 1">HB 1</option>
                                            <option value="HB 2">HB 2</option>
                                            <option value="HB 3">HB 3</option>
                                            <option value="HB 4">HB 4</option>
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label>Room Category</label>
                                        <select
                                            value={roomCategory}
                                            onChange={(e) => setRoomCategory(e.target.value)}
                                            required
                                        >
                                            <option value="Single">Single</option>
                                            <option value="Double Sharing">Double Sharing</option>
                                            <option value="Triple Sharing">Triple Sharing</option>
                                            <option value="Quad Sharing">Quad Sharing</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Request Information */}
                            <div className="form-section">
                                <h2 className="section-title">Request Information</h2>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Preferred Move-in Date</label>
                                        <input
                                            type="date"
                                            value={moveInDate}
                                            onChange={(e) => setMoveInDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label>Reason for Request</label>
                                    <textarea
                                        placeholder="Please explain why you are making this request..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="submit-button-wrapper">
                                <button type="submit" className="submit-request-btn">
                                    Submit Request
                                </button>
                            </div>
                        </form>

                        {/* Active Applications */}
                        <div className="active-applications">
                            <h3 className="applications-title">Active Applications</h3>
                            {requests.length === 0 ? (
                                <div className="no-applications">
                                    <p>No active applications yet.</p>
                                </div>
                            ) : (
                                requests.map((request, index) => (
                                    <div key={index} className="application-card">
                                        <div className="application-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                <circle cx="12" cy="10" r="3"></circle>
                                            </svg>
                                        </div>
                                        <div className="application-details">
                                            <p className="application-name">
                                                {request.type || `Room Change (${request.currentRoom || "Current"} to ${request.roomType || "Requested"})`}
                                            </p>
                                            <p className="application-date">
                                                Submitted on {request.submittedDate || new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </p>
                                        </div>
                                        <span className={`application-status ${request.status === "pending_warden" ? "pending" : (request.status || "pending").toLowerCase()}`}>
                                            {request.status === "pending_warden" ? "Pending Review" : (request.status || "Pending")}
                                        </span>
                                    </div>
                                ))
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
