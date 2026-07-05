import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./AdminPaymentItems.css";
import "./AdminDashboard.css";
import NotificationBell from "../component/NotificationBell";

export default function AdminPaymentItems() {
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
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
      const res = await fetch("http://127.0.0.1:5000/api/admin/payment-items", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load payments");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createItem(e) {
    e.preventDefault();
    setErr("");

    if (!title || !amount) {
      setErr("Title and amount are required.");
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken(true);
      const res = await fetch("http://127.0.0.1:5000/api/admin/create-payment-item", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, amount: parseFloat(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");

      setTitle("");
      setDescription("");
      setAmount("");
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function toggleActive(itemId, active) {
    setErr("");
    try {
      const token = await auth.currentUser?.getIdToken(true);
      const res = await fetch("http://127.0.0.1:5000/api/admin/set-payment-item-active", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId, active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update active failed");
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
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

  if (!profile) {
    return (
      <div className="admin-payment-items-page">
        <div className="admin-payment-items-container">
          <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-payment-items-page">
      <div className="admin-payment-items-container">
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
        <div className="admin-payment-items-content">
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
          <div className="payment-items-main-content">
            <div className="content-header">
              <h1 className="content-title">Create New Payment</h1>
              <p className="content-subtitle">Set up a new payment requirement for students.</p>
            </div>

            {err && <div className="error-message">{err}</div>}

            {/* Create Payment Form */}
            <form className="payment-form" onSubmit={createItem}>
              <h3 className="form-section-title">Payment Details</h3>

              <div className="form-row">
                <div className="form-field">
                  <label>Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Monthly Hostel Fee - October"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any additional details about this payment..."
                  rows={4}
                />
              </div>

              <button type="submit" className="create-payment-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Create Payment
              </button>
            </form>

            {/* Payment Items Table */}
            {loading ? (
              <div className="loading-message">Loading payment items...</div>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <p>No payment items created yet.</p>
              </div>
            ) : (
              <div className="payment-items-table-wrapper">
                <table className="payment-items-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.itemId}>
                        <td className="title-cell">{item.title}</td>
                        <td className="amount-cell">{parseFloat(item.amount).toFixed(2)}</td>
                        <td>
                          <span className={`status-badge ${item.active ? 'active' : 'inactive'}`}>
                            {item.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="date-cell">{formatDate(item.createdAt)}</td>
                        <td className="action-cell">
                          <button
                            className="toggle-btn"
                            onClick={() => toggleActive(item.itemId, !item.active)}
                            title={item.active ? 'Deactivate' : 'Activate'}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}