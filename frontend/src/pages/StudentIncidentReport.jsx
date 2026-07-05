import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "./StudentIncidentReport.css";
// Removed unused import
import Footer from "../component/Footer";
import StudentHeader from "../component/StudentHeader";

export default function StudentIncidentReport() {
    const [profile, setProfile] = useState(null);
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    // Form States
    const [incidentType, setIncidentType] = useState("");
    const [evidence, setEvidence] = useState("");
    const [location, setLocation] = useState("");
    const [incidentDate, setIncidentDate] = useState("");
    const [incidentTime, setIncidentTime] = useState("");
    const [description, setDescription] = useState("");
    const [statusMsg, setStatusMsg] = useState("");

    // Reported incidents
    const [incidents, setIncidents] = useState([]);

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

            // Load existing incident reports
            await loadIncidents(user);
        }

        const unsub = auth.onAuthStateChanged(load);
        return () => unsub();
    }, [navigate]);

    const loadIncidents = async (user) => {
        try {
            const token = await user.getIdToken();
            const res = await fetch("http://127.0.0.1:5000/api/student/my-incident-reports", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                // API returns array directly
                setIncidents(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to load incidents:", err);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMsg("");

        if (!incidentType || !location || !description) {
            setStatusMsg("Please fill in all required fields.");
            return;
        }

        try {
            const user = auth.currentUser;
            const token = await user.getIdToken(true);

            // Combine date and time into description or location
            const dateTimeInfo = incidentDate && incidentTime ? `${incidentDate} ${incidentTime}` : "";
            const fullLocation = dateTimeInfo ? `${location} (${dateTimeInfo})` : location;

            const res = await fetch("http://127.0.0.1:5000/api/student/report-incident", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    category: incidentType,
                    description: description,
                    location: fullLocation,
                    evidenceUrl: evidence,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setStatusMsg(data.error || "Failed to submit incident report.");
                return;
            }

            setStatusMsg("Incident report submitted successfully!");
            // Reset form
            setIncidentType("");
            setEvidence("");
            setLocation("");
            setIncidentDate("");
            setIncidentTime("");
            setDescription("");

            // Reload incidents
            await loadIncidents(user);
        } catch (err) {
            setStatusMsg(err.message);
        }
    };

    if (!profile) {
        return (
            <div className="incident-report-page">
                <div className="incident-report-container">
                    <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
                </div>
            </div>
        );
    }

    const firstName = profile.fullName ? profile.fullName.split(" ")[0] : "Student";

    return (
        <div className="incident-report-page">
            <div className="incident-report-container">
                {/* Header */}
                <StudentHeader />

                {/* Content */}
                <div className="incident-report-content">
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
                    <div className="incident-main">
                        <div className="incident-hub-header">
                            <h1 className="incident-hub-title">Incident Report Page</h1>
                            <p className="incident-hub-subtitle">Report safety concerns, property damage, or other incidents within the hostel.</p>
                        </div>

                        {statusMsg && (
                            <div className={`incident-status-message ${statusMsg.includes("success") ? "success" : "error"}`}>
                                {statusMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Incident Details */}
                            <div className="form-section">
                                <h2 className="section-title">Incident Details</h2>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Incident Type</label>
                                        <select
                                            value={incidentType}
                                            onChange={(e) => setIncidentType(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Noise Complaint">Noise Complaint</option>
                                            <option value="Vandalism">Vandalism</option>
                                            <option value="Theft">Theft</option>
                                            <option value="Safety Concern">Safety Concern</option>
                                            <option value="Property Damage">Property Damage</option>
                                            <option value="Harassment">Harassment</option>
                                            <option value="Smoking">Smoking</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label>Evidence</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Evidence URL (optional) - e.g. Google Drive link"
                                            value={evidence}
                                            onChange={(e) => setEvidence(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Location & Time */}
                            <div className="form-section">
                                <h2 className="section-title">Location & Time</h2>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Incident Location</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g., Common Room, Hallway 3rd Floor"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Incident Date & Time</label>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={incidentDate}
                                                onChange={(e) => setIncidentDate(e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            <input
                                                type="time"
                                                className="form-input"
                                                value={incidentTime}
                                                onChange={(e) => setIncidentTime(e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Incident Description */}
                            <div className="form-section">
                                <h2 className="section-title">Incident Description</h2>
                                <div className="form-field">
                                    <label>Describe the Incident</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Provide a detailed description of what happened..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="submit-button-wrapper">
                                <button type="submit" className="submit-incident-btn">
                                    Submit Report
                                </button>
                            </div>
                        </form>

                        {/* My Reported Incidents */}
                        <div className="reported-incidents">
                            <h3 className="incidents-title">My Reported Incidents</h3>
                            {incidents.length === 0 ? (
                                <div className="no-incidents">
                                    <p>No reported incidents yet.</p>
                                </div>
                            ) : (
                                incidents.map((incident, index) => {
                                    // Determine icon color based on status
                                    let iconClass = "red";
                                    if (incident.status === "resolved") {
                                        iconClass = "green";
                                    } else if (incident.status === "in_progress") {
                                        iconClass = "blue";
                                    } else if (incident.status === "reported") {
                                        iconClass = "yellow";
                                    }

                                    // Format status display
                                    let statusDisplay = incident.status || "Pending Review";
                                    if (incident.status === "reported") statusDisplay = "Pending Review";
                                    if (incident.status === "in_progress") statusDisplay = "In Progress";
                                    if (incident.status === "resolved") statusDisplay = "Resolved";

                                    // Extract date from createdAt
                                    const reportDate = incident.createdAt
                                        ? new Date(incident.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })
                                        : "Today";

                                    // Extract location info
                                    const locationInfo = incident.location || "";

                                    return (
                                        <div key={index} className="incident-card">
                                            <div className={`incident-icon ${iconClass}`}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                                </svg>
                                            </div>
                                            <div className="incident-details">
                                                <p className="incident-name">{incident.category || "Incident"}</p>
                                                <p className="incident-info">
                                                    Reported: {reportDate} • {locationInfo}
                                                </p>
                                            </div>
                                            <span className={`incident-status ${statusDisplay.toLowerCase().replace(" ", "-")}`}>
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
