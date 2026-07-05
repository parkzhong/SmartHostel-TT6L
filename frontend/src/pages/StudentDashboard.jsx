import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import NotificationBell from "../component/NotificationBell";
import Footer from "../component/Footer";
import StudentHeader from "../component/StudentHeader";

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [msg, setMsg] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  // Room Request States
  const [roomType, setRoomType] = useState("");
  const [reason, setReason] = useState("");
  const [roomMsg, setRoomMsg] = useState("");

  // Maintenance States
  const [mCategory, setMCategory] = useState("");
  const [mLocation, setMLocation] = useState("");
  const [mPriority, setMPriority] = useState("normal");
  const [mDescription, setMDescription] = useState("");
  const [mMsg, setMMsg] = useState("");

  // Visitor States
  const [vName, setVName] = useState("");
  const [vIC, setVIC] = useState("");
  const [vRelationship, setVRelationship] = useState("");
  const [vDate, setVDate] = useState("");
  const [vTimeIn, setVTimeIn] = useState("");
  const [vTimeOut, setVTimeOut] = useState("");
  const [vPurpose, setVPurpose] = useState("");
  const [vMsg, setVMsg] = useState("");

  // Incident States
  const [iCategory, setICategory] = useState("");
  const [iLocation, setILocation] = useState("");
  const [iDescription, setIDescription] = useState("");
  const [iEvidenceUrl, setIEvidenceUrl] = useState("");
  const [iMsg, setIMsg] = useState("");

  useEffect(() => {
    async function load() {
      setMsg("");
      const user = auth.currentUser;
      if (!user) {
        setMsg("Not logged in.");
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
        setMsg("Your account is not active. Please wait for admin approval.");
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
        role: data.role,
        roomNumber: data.roomNumber,
        block: data.block,
        checkInDate: data.checkInDate,
        leaseEnds: data.leaseEnds,
      });
    }

    const unsub = auth.onAuthStateChanged(load);
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const closeModal = () => {
    setActiveModal(null);
    setRoomType("");
    setReason("");
    setMCategory("");
    setMLocation("");
    setMPriority("normal");
    setMDescription("");
    setVName("");
    setVIC("");
    setVRelationship("");
    setVDate("");
    setVTimeIn("");
    setVTimeOut("");
    setVPurpose("");
    setICategory("");
    setILocation("");
    setIDescription("");
    setIEvidenceUrl("");
    setRoomMsg("");
    setMMsg("");
    setVMsg("");
    setIMsg("");
  };

  const submitRoomRequest = async (e) => {
    e.preventDefault();
    setRoomMsg("");

    if (!roomType) {
      setRoomMsg("Please select a room type.");
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
        body: JSON.stringify({ roomType, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRoomMsg(data.error || "Failed to submit request.");
        return;
      }

      setRoomMsg("Room request submitted successfully!");
      setTimeout(closeModal, 2000);
    } catch (err) {
      setRoomMsg(err.message);
    }
  };

  const submitMaintenanceRequest = async (e) => {
    e.preventDefault();
    setMMsg("");

    if (!mCategory || !mLocation || !mDescription) {
      setMMsg("Please fill in all required fields.");
      return;
    }

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const res = await fetch("http://127.0.0.1:5000/api/student/request-maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: mCategory,
          location: mLocation,
          priority: mPriority,
          description: mDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMMsg(data.error || "Failed to submit maintenance request.");
        return;
      }

      setMMsg("Maintenance request submitted successfully!");
      setTimeout(closeModal, 2000);
    } catch (err) {
      setMMsg(err.message);
    }
  };

  const submitVisitorRequest = async (e) => {
    e.preventDefault();
    setVMsg("");

    if (!vName || !vDate || !vTimeIn || !vTimeOut) {
      setVMsg("Please fill in all required fields.");
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
          visitorName: vName,
          visitorIC: vIC,
          relationship: vRelationship,
          visitDate: vDate,
          timeIn: vTimeIn,
          timeOut: vTimeOut,
          purpose: vPurpose,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVMsg(data.error || "Failed to submit visitor request.");
        return;
      }

      setVMsg("Visitor request submitted successfully!");
      setTimeout(closeModal, 2000);
    } catch (err) {
      setVMsg(err.message);
    }
  };

  const submitIncidentReport = async (e) => {
    e.preventDefault();
    setIMsg("");

    if (!iCategory || !iLocation || !iDescription) {
      setIMsg("Please fill in all required fields.");
      return;
    }

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken(true);

      const res = await fetch("http://127.0.0.1:5000/api/student/report-incident", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: iCategory,
          location: iLocation,
          description: iDescription,
          evidenceUrl: iEvidenceUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIMsg(data.error || "Failed to submit incident report.");
        return;
      }

      setIMsg("Incident report submitted successfully!");
      setTimeout(closeModal, 2000);
    } catch (err) {
      setIMsg(err.message);
    }
  };

  if (!profile) {
    return (
      <div className="student-dashboard">
        <div className="dashboard-container">
          <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const firstName = profile.fullName ? profile.fullName.split(" ")[0] : "Student";

  return (
    <div className="student-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        {/* Header */}
        <StudentHeader />

        {/* Main Content */}
        <div className="dashboard-content">
          {/* Sidebar */}
          <div className="profile-sidebar">
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
                <span className="detail-label">Role</span>
                <span className="detail-value">
                  {(profile.role || "student").charAt(0).toUpperCase() + (profile.role || "student").slice(1)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Block</span>
                <span className="detail-value">
                  {profile.block || (profile.roomNumber?.includes("•") ? profile.roomNumber.split("•")[0].trim() : "--")}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Room Number</span>
                <span className="detail-value">
                  {profile.roomNumber?.includes("•") ? profile.roomNumber.split("•")[1].trim() : (profile.roomNumber || "--")}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Check-in Date</span>
                <span className="detail-value">{profile.checkInDate || "--"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Lease Ends</span>
                <span className="detail-value">{profile.leaseEnds || "--"}</span>
              </div>
            </div>


          </div>

          {/* Main Content */}
          <div className="main-content">
            <div className="welcome-section">
              <h1 className="welcome-title">Welcome back, {firstName}</h1>
              <p className="welcome-subtitle">Manage your stay and stay updated with hostel activities.</p>
            </div>

            <div className="services-grid">
              {/* Request Room */}
              <div className="service-card" onClick={() => navigate("/student-room-request")}>
                <div className="service-icon purple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <h3 className="service-title">Request Room</h3>
                <p className="service-description">
                  Apply for room changes, extensions, or new room assignments for the next semester.
                </p>
                <a className="service-action">
                  View Now
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>
              </div>

              {/* Request Maintenance */}
              <div className="service-card" onClick={() => navigate("/student-maintenance-request")}>
                <div className="service-icon orange">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                </div>
                <h3 className="service-title">Request Maintenance</h3>
                <p className="service-description">
                  Submit requests for repairs, laundry issues, or technical assistance in your room.
                </p>
                <a className="service-action">
                  Submit
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>
              </div>

              {/* Visitor Registration */}
              <div className="service-card" onClick={() => navigate("/student-visitor-registration")}>
                <div className="service-icon blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3 className="service-title">Visitor Registration</h3>
                <p className="service-description">
                  Pre-register your guests and manage visitor permissions for secure entry to the hostel.
                </p>
                <a className="service-action">
                  Register
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>
              </div>

              {/* Incident Reports */}
              <div className="service-card" onClick={() => navigate("/student-incident-report")}>
                <div className="service-icon red">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <h3 className="service-title">Incident Reports</h3>
                <p className="service-description">
                  Report safety concerns, noise complaints, or security issues directly to the administration.
                </p>
                <a className="service-action">
                  Submit
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>
              </div>

              {/* Payments */}
              <div className="service-card" onClick={() => navigate("/student-payment")}>
                <div className="service-icon green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </div>
                <h3 className="service-title">Payments</h3>
                <p className="service-description">
                  View your billing history, check pending dues, and make online rental payments securely.
                </p>
                <a className="service-action">
                  Pay Now
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Modals */}
      {activeModal === "room" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Request Room</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            {roomMsg && (
              <div className={`status-message ${roomMsg.includes("success") ? "success" : "error"}`}>
                {roomMsg}
              </div>
            )}

            <form onSubmit={submitRoomRequest}>
              <div className="form-group">
                <label>Room Type *</label>
                <select
                  className="form-select"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  required
                >
                  <option value="">Select room type</option>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="quad">Quad</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reason (Optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Explain why you need this room change..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "maintenance" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Request Maintenance</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            {mMsg && (
              <div className={`status-message ${mMsg.includes("success") ? "success" : "error"}`}>
                {mMsg}
              </div>
            )}

            <form onSubmit={submitMaintenanceRequest}>
              <div className="form-group">
                <label>Category *</label>
                <select
                  className="form-select"
                  value={mCategory}
                  onChange={(e) => setMCategory(e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Internet">Internet</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  className="form-input"
                  placeholder="e.g., Block A - Room 203"
                  value={mLocation}
                  onChange={(e) => setMLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  className="form-select"
                  value={mPriority}
                  onChange={(e) => setMPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the issue in detail..."
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "visitor" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Register Visitor</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            {vMsg && (
              <div className={`status-message ${vMsg.includes("success") ? "success" : "error"}`}>
                {vMsg}
              </div>
            )}

            <form onSubmit={submitVisitorRequest}>
              <div className="form-group">
                <label>Visitor Name *</label>
                <input
                  className="form-input"
                  placeholder="Enter visitor's full name"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>IC Number (Optional)</label>
                <input
                  className="form-input"
                  placeholder="Enter IC number"
                  value={vIC}
                  onChange={(e) => setVIC(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Relationship (Optional)</label>
                <input
                  className="form-input"
                  placeholder="e.g., Parent, Friend, Sibling"
                  value={vRelationship}
                  onChange={(e) => setVRelationship(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Visit Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={vDate}
                  onChange={(e) => setVDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time In *</label>
                <input
                  type="time"
                  className="form-input"
                  value={vTimeIn}
                  onChange={(e) => setVTimeIn(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time Out *</label>
                <input
                  type="time"
                  className="form-input"
                  value={vTimeOut}
                  onChange={(e) => setVTimeOut(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Purpose (Optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Purpose of visit..."
                  value={vPurpose}
                  onChange={(e) => setVPurpose(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Visitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "incident" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Report Incident</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            {iMsg && (
              <div className={`status-message ${iMsg.includes("success") ? "success" : "error"}`}>
                {iMsg}
              </div>
            )}

            <form onSubmit={submitIncidentReport}>
              <div className="form-group">
                <label>Category *</label>
                <select
                  className="form-select"
                  value={iCategory}
                  onChange={(e) => setICategory(e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Noise">Noise</option>
                  <option value="Vandalism">Vandalism</option>
                  <option value="Smoking">Smoking</option>
                  <option value="Fighting">Fighting</option>
                  <option value="Unauthorized Visitor">Unauthorized Visitor</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  className="form-input"
                  placeholder="e.g., Block B - Room 105"
                  value={iLocation}
                  onChange={(e) => setILocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe what happened..."
                  value={iDescription}
                  onChange={(e) => setIDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Evidence URL (Optional)</label>
                <input
                  className="form-input"
                  placeholder="e.g., Google Drive link"
                  value={iEvidenceUrl}
                  onChange={(e) => setIEvidenceUrl(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}