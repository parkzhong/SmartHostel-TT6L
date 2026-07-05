import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./AdminPaymentHistory.css";
import "./AdminDashboard.css";
import NotificationBell from "../component/NotificationBell";

export default function AdminPaymentHistory() {
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [err, setErr] = useState("");
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
          setProfile({
            uid: user.uid,
            email: user.email,
            fullName: data.fullName || "Admin",
            role: data.role || "admin"
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    }

    loadProfile();
    load();
  }, [navigate]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("http://127.0.0.1:5000/api/admin/all-payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load payments");

      setPayments(Array.isArray(data) ? data : []);
      setFilteredPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPayments(payments);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = payments.filter(p =>
        (p.studentName || "").toLowerCase().includes(query) ||
        (p.referenceNo || "").toLowerCase().includes(query) ||
        (p.itemTitle || "").toLowerCase().includes(query)
      );
      setFilteredPayments(filtered);
    }
  }, [searchQuery, payments]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      { bg: "#dbeafe", text: "#1e40af" }, // blue
      { bg: "#fed7aa", text: "#92400e" }, // orange
      { bg: "#fae8ff", text: "#86198f" }, // purple
      { bg: "#fef3c7", text: "#92400e" }, // yellow
      { bg: "#d1fae5", text: "#065f46" }, // green
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  const generateReceipt = (payment) => {
    const receiptContent = `OFFICIAL RECEIPT
Smart Hostel System

Receipt ID: ${payment.paymentId}
Date: ${formatDate(payment.paidAt || payment.createdAt)}

Student Name: ${payment.studentName}
Payment For: ${payment.itemTitle}
Amount: RM ${formatAmount(payment.amount)}
Payment Method: ${payment.method || "Online"}
Reference No: ${payment.referenceNo || "N/A"}

----------------------------------------
Thank you for your payment.
`;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Receipt_${payment.paymentId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const displayedCount = filteredPayments.length;
  const totalCount = payments.length;

  if (!profile) {
    return (
      <div className="admin-payment-history-page">
        <div className="admin-payment-history-container">
          <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-payment-history-page">
      <div className="admin-payment-history-container">
        {/* Header */}
        <div className="admin-dashboard-header">
          <div className="header-logo">
            <div className="logo-icon">
              <img src="/logo.png" alt="Smart Hostel Logo" />
            </div>
            <div className="logo-text">
              <h1>Smart Hostel</h1>
              <p>Admin</p>
            </div>
          </div>
          <div className="header-actions">
            <NotificationBell />
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
        <div className="admin-payment-history-content">
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
              <button className="view-logs-btn" onClick={() => navigate("/admin-server-logs")}>
                View Server Logs
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="payment-history-main-content">
            <div className="content-header">
              <div>
                <h1 className="content-title">Payment History</h1>
                <p className="content-subtitle">Review and manage detailed student transaction logs.</p>
              </div>
              <div className="header-controls">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search by name or ref..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>

              </div>
            </div>

            {err && <div className="error-message">{err}</div>}
            {loading && <div className="loading-message">Loading...</div>}

            {!loading && filteredPayments.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <p>No payment records found.</p>
              </div>
            ) : (
              <>
                <div className="payment-cards-container">
                  {filteredPayments.map((payment) => {
                    const avatarColor = getAvatarColor(payment.studentName);
                    return (
                      <div key={payment.paymentId} className="payment-card">
                        <div className="payment-card-header">
                          <div className="student-info">
                            <div
                              className="student-avatar"
                              style={{
                                backgroundColor: avatarColor.bg,
                                color: avatarColor.text
                              }}
                            >
                              {getInitials(payment.studentName)}
                            </div>
                            <div className="student-details">
                              <h4 className="student-name-label">Student Name</h4>
                              <p className="student-name">{payment.studentName || "Unknown Student"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="payment-card-body">
                          <div className="payment-detail-row">
                            <div className="payment-detail">
                              <span className="detail-label">Payment For</span>
                              <span className="detail-value">{payment.itemTitle || "-"}</span>
                            </div>
                            <div className="payment-detail">
                              <span className="detail-label">Amount & Method</span>
                              <span className="detail-value amount">
                                {formatAmount(payment.amount)}
                                <span className="method-badge">{payment.method || "N/A"}</span>
                              </span>
                            </div>
                          </div>

                          <div className="payment-detail-row">
                            <div className="payment-detail full-width">
                              <span className="detail-label">Reference & Date</span>
                              <span className="detail-value reference">
                                {payment.referenceNo || "#N/A"}
                                <span className="date-separator">•</span>
                                {formatDate(payment.paidAt || payment.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="payment-card-footer">
                          <button
                            className="receipt-btn"
                            onClick={() => generateReceipt(payment)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            Receipt
                          </button>

                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="table-footer">
                  <p className="showing-text">
                    Showing 1 to {displayedCount} of {totalCount} entries
                  </p>
                  <div className="pagination">
                    <button className="pagination-btn active">1</button>
                    <button className="pagination-btn">2</button>
                    <button className="pagination-btn disabled">...</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}