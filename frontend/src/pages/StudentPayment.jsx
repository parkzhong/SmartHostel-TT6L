import React, { useEffect, useState, useMemo } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
// Removed unused imports
import Footer from "../component/Footer";
import { Link, useNavigate } from "react-router-dom";
import "./StudentPayment.css";
import StudentHeader from "../component/StudentHeader";

export default function StudentPayment() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  const paidItemIds = useMemo(() => {
    const s = new Set();
    for (const p of history) {
      if (p.itemId) s.add(p.itemId);
    }
    return s;
  }, [history]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      // Load Profile
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            fullName: data.fullName,
            studentEmail: data.studentEmail || data.email,
            roomNumber: data.roomNumber || "HB2 • 402",
            checkInDate: data.checkInDate || "Aug 15, 2025",
            leaseEnds: data.leaseEnds || "Jun 30, 2026",
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }

      await loadData(user);
      setLoading(false);
    }

    init();
  }, [navigate]);

  async function loadData(user) {
    setErr("");
    try {
      const token = await user.getIdToken();

      // active items
      const r1 = await fetch("http://127.0.0.1:5000/api/student/active-payment-items", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d1 = await r1.json();
      if (!r1.ok) throw new Error(d1.error || "Failed to load payment items");
      setItems(Array.isArray(d1) ? d1 : []);

      // history
      const r2 = await fetch("http://127.0.0.1:5000/api/student/my-payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d2 = await r2.json();
      if (!r2.ok) throw new Error(d2.error || "Failed to load payment history");
      setHistory(Array.isArray(d2) ? d2 : []);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function pay(item) {
    setErr("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");

      const token = await user.getIdToken(true);

      const method = (prompt("Payment method? (Online/Cash/etc)", "Online") || "Online").trim();
      const referenceNo = (prompt("Reference number (optional):", "") || "").trim();
      const receiptUrl = (prompt("Receipt URL (optional):", "") || "").trim();

      const res = await fetch("http://127.0.0.1:5000/api/student/pay-payment-item", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          itemId: item.itemId,
          method,
          referenceNo,
          receiptUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      alert("Payment recorded!");
      await loadData(user);
    } catch (e) {
      setErr(e.message);
    }
  }

  const firstName = profile?.fullName ? profile.fullName.split(" ")[0] : "Student";

  const generateReceipt = (payment) => {
    const receiptContent = `OFFICIAL RECEIPT
Smart Hostel System

Receipt ID: ${payment.paymentId}
Date: ${payment.paidAt || payment.createdAt || new Date().toLocaleString()}

Student Name: ${profile?.fullName || "Student"}
Payment For: ${payment.itemTitle}
Amount: RM ${payment.amount}
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

  return (
    <div className="payment-page">
      <div className="payment-container">
        {/* Header */}
        <StudentHeader />

        {/* Content */}
        <div className="payment-content">
          {/* Sidebar */}
          <div className="request-sidebar">
            <div className="profile-avatar">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h2 className="profile-name">{firstName}</h2>
            <p className="profile-email">{profile?.studentEmail}</p>

            <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "20px" }}>
              <div className="status-badge" style={{ margin: 0 }}>
                <span className="status-dot"></span>
                Active Resident
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-item">
                <span className="detail-label">Block</span>
                <span className="detail-value">{profile?.roomNumber?.includes("•") ? profile.roomNumber.split("•")[0].trim() : "HB2"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Room Number</span>
                <span className="detail-value">{profile?.roomNumber?.includes("•") ? profile.roomNumber.split("•")[1].trim() : (profile?.roomNumber || "--")}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Check-in Date</span>
                <span className="detail-value">{profile?.checkInDate || "--"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Lease Ends</span>
                <span className="detail-value">{profile?.leaseEnds || "--"}</span>
              </div>
            </div>

            <Link to="/student-dashboard" className="back-to-dashboard">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Main Payment Content */}
          <div className="payment-main">
            <div className="payment-hub-header">
              <h1 className="payment-hub-title">Payment Hub</h1>
              <p className="payment-hub-subtitle">Manage your payments and view history.</p>
            </div>

            {err && <div style={{ color: "crimson", marginBottom: 16 }}>{err}</div>}
            {loading && <div style={{ marginBottom: 16 }}>Loading...</div>}

            <h3 style={{ marginTop: 16, fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>Active Payment Items</h3>
            {items.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No active payment items.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table border="0" cellPadding="12" style={{ borderCollapse: "separate", width: "100%", background: "#f9fafb", borderRadius: "8px", borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#6b7280", fontSize: "12px", textTransform: "uppercase" }}>
                      <th style={{ borderBottom: "1px solid #e5e7eb" }}>Title</th>
                      <th style={{ borderBottom: "1px solid #e5e7eb" }}>Amount</th>
                      <th style={{ borderBottom: "1px solid #e5e7eb" }}>Description</th>
                      <th style={{ borderBottom: "1px solid #e5e7eb" }}>Status</th>
                      <th style={{ borderBottom: "1px solid #e5e7eb" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => {
                      const isPaid = paidItemIds.has(it.itemId);
                      return (
                        <tr key={it.itemId} style={{ background: "white" }}>
                          <td style={{ borderBottom: "1px solid #f3f4f6" }}>{it.title}</td>
                          <td style={{ borderBottom: "1px solid #f3f4f6", fontWeight: "600" }}>RM {it.amount}</td>
                          <td style={{ borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>{it.description || "-"}</td>
                          <td style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <span style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              background: isPaid ? "#d1fae5" : "#fee2e2",
                              color: isPaid ? "#065f46" : "#991b1b",
                              fontSize: "12px",
                              fontWeight: "500"
                            }}>
                              {isPaid ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                          <td style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <button
                              disabled={isPaid}
                              onClick={() => pay(it)}
                              style={{
                                padding: "6px 12px",
                                background: isPaid ? "#9ca3af" : "#2563eb",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: isPaid ? "not-allowed" : "pointer",
                                fontSize: "12px"
                              }}
                            >
                              {isPaid ? "Paid" : "Pay"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <h3 style={{ marginTop: 32, fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>Payment History</h3>
            {history.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No payment records yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table border="0" cellPadding="12" style={{ borderCollapse: "separate", width: "100%", background: "#f9fafb", borderRadius: "8px", borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#6b7280", fontSize: "12px", textTransform: "uppercase" }}>
                      <th style={{ borderBottom: "1px solid #e5e7eb" }}>Item</th>
                      <th style={{ borderBottom: "1px solid #e5e7eb" }}>Amount</th>
                      <th style={{ borderBottom: "1px solid #e5e7eb" }}>Method</th>
                      <th style={{ borderBottom: "1px solid #e5e7eb" }}>Ref</th>
                      <th style={{ borderBottom: "1px solid #e5e7eb" }}>Receipt</th>
                      <th style={{ borderBottom: "1px solid #e5e7eb" }}>Paid At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((p) => (
                      <tr key={p.paymentId} style={{ background: "white" }}>
                        <td style={{ borderBottom: "1px solid #f3f4f6" }}>{p.itemTitle}</td>
                        <td style={{ borderBottom: "1px solid #f3f4f6" }}>RM {p.amount}</td>
                        <td style={{ borderBottom: "1px solid #f3f4f6" }}>{p.method || "-"}</td>
                        <td style={{ borderBottom: "1px solid #f3f4f6" }}>{p.referenceNo || "-"}</td>
                        <td style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <button
                            onClick={() => generateReceipt(p)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "none",
                              border: "1px solid #2563eb",
                              color: "#2563eb",
                              borderRadius: "4px",
                              padding: "6px 12px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "500"
                            }}
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
                        </td>
                        <td style={{ borderBottom: "1px solid #f3f4f6", fontSize: "12px", color: "#6b7280" }}>{p.paidAt || p.createdAt || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}