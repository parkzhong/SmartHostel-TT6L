import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "./StudentMaintenanceRequest.css";
import NotificationBell from "../component/NotificationBell";
import Footer from "../component/Footer";
import StudentHeader from "../component/StudentHeader";

export default function StudentMaintenanceRequest() {
    const [profile, setProfile] = useState(null);
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    // Form States
    const [category, setCategory] = useState("");
    const [urgency, setUrgency] = useState("normal");
    const [room, setRoom] = useState("");
    const [description, setDescription] = useState("");
    const [statusMsg, setStatusMsg] = useState("");

    // Maintenance history
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

            // Set default room
            setRoom(data.roomNumber || "HB2 • 402");

            // Load existing requests
            await loadRequests(user);
        }

        const unsub = auth.onAuthStateChanged(load);
        return () => unsub();
    }, [navigate]);

    const loadRequests = async (user) => {
        try {
            const token = await user.getIdToken();
            const res = await fetch("http://127.0.0.1:5000/api/student/my-maintenance-requests", {
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

        if (!category || !room || !description) {
            setStatusMsg("Please fill in all required fields.");
            return;
        }

        try {
            const user = auth.currentUser;
            const token = await user.getIdToken(true);

            const res = await fetch("http://127.0.0.1:5000/api/student/request-maintenance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    category: category,
                    location: room,
                    priority: urgency,
                    description: description,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setStatusMsg(data.error || "Failed to submit request.");
                return;
            }

            setStatusMsg("Maintenance request submitted successfully!");
            // Reset form
            setCategory("");
            setUrgency("normal");
            setDescription("");

            // Reload requests
            await loadRequests(user);
        } catch (err) {
            setStatusMsg(err.message);
        }
    };

    if (!profile) {
        return (
            <div className="maintenance-request-page">
                <div className="maintenance-request-container">
                    <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
                </div>
            </div>
        );
    }

    const firstName = profile.fullName ? profile.fullName.split(" ")[0] : "Student";

    return (
        <div className="maintenance-request-page">
            <div className="maintenance-request-container">
                {/* Header */}
                <StudentHeader />

                {/* Content */}
                <div className="maintenance-request-content">
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
                    <div className="maintenance-main">
                        <div className="maintenance-hub-header">
                            <h1 className="maintenance-hub-title">Maintenance Request Hub</h1>
                            <p className="maintenance-hub-subtitle">Submit and track your property maintenance issues.</p>
                        </div>

                        {statusMsg && (
                            <div className={`maintenance-status-message ${statusMsg.includes("success") ? "success" : "error"}`}>
                                {statusMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Request Information */}
                            <div className="form-section">
                                <h2 className="section-title">Request Information</h2>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Category of Issue</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Electrical">Electrical</option>
                                            <option value="Plumbing">Plumbing</option>
                                            <option value="HVAC">HVAC</option>
                                            <option value="Furniture">Furniture</option>
                                            <option value="Appliances">Appliances</option>
                                            <option value="Lights">Lights</option>
                                            <option value="Internet">Internet</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label>Urgency Level</label>
                                        <select
                                            value={urgency}
                                            onChange={(e) => setUrgency(e.target.value)}
                                            required
                                        >
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Specific Location */}
                            <div className="form-section">
                                <h2 className="section-title">Specific Location</h2>
                                <div className="form-field">
                                    <label>Room</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., HB2 • 402"
                                        value={room}
                                        onChange={(e) => setRoom(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Describe the Issue */}
                            <div className="form-section">
                                <h2 className="section-title">Describe the Issue</h2>
                                <div className="form-field">
                                    <label>Detailed Description</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Please provide as much detail as possible about the maintenance problem..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
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

                        {/* My Maintenance History */}
                        <div className="maintenance-history">
                            <h3 className="history-title">My Maintenance History</h3>
                            {requests.length === 0 ? (
                                <div className="no-history">
                                    <p>No maintenance requests yet.</p>
                                </div>
                            ) : (
                                requests.map((request, index) => {
                                    // Determine icon type based on category
                                    let iconClass = "blue";
                                    if (request.status === "completed" || request.status === "resolved") {
                                        iconClass = "green";
                                    } else if (request.status === "assigned" || request.status === "in_progress") {
                                        iconClass = "yellow";
                                    }

                                    return (
                                        <div key={index} className="history-card">
                                            <div className={`history-icon ${iconClass}`}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                                </svg>
                                            </div>
                                            <div className="history-details">
                                                <p className="history-name">
                                                    {request.category || "Maintenance Request"}
                                                </p>
                                                <p className="history-info">
                                                    Submitted on {new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {request.location}
                                                </p>
                                            </div>
                                            <span className={`history-status ${(request.status || "pending").toLowerCase().replace("_", "-")}`}>
                                                {request.status === "pending_warden" ? "Pending" :
                                                    request.status === "in_progress" ? "In Progress" :
                                                        request.status === "completed" ? "Resolved" :
                                                            request.status || "Pending"}
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
