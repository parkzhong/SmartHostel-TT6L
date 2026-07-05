import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
// Removed unused import
import Footer from "../component/Footer";
import "./StudentPaymentHub.css";
import StudentHeader from "../component/StudentHeader";

export default function StudentPaymentHub() {
    const [profile, setProfile] = useState(null);
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    // Form States
    const [paymentType, setPaymentType] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [statusMsg, setStatusMsg] = useState("");

    // Payment items and history
    const [paymentItems, setPaymentItems] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);

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

            // Load payment data
            await loadPaymentData(user);
        }

        const unsub = auth.onAuthStateChanged(load);
        return () => unsub();
    }, [navigate]);

    const loadPaymentData = async (user) => {
        try {
            const token = await user.getIdToken();

            // Load active payment items
            const itemsRes = await fetch("http://127.0.0.1:5000/api/student/active-payment-items", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (itemsRes.ok) {
                const itemsData = await itemsRes.json();
                setPaymentItems(Array.isArray(itemsData) ? itemsData : []);

                // Set first item as default
                if (itemsData.length > 0) {
                    setPaymentType(itemsData[0].itemId);
                    setPaymentAmount(itemsData[0].amount);
                }
            }

            // Load payment history
            const historyRes = await fetch("http://127.0.0.1:5000/api/student/my-payments", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setPaymentHistory(Array.isArray(historyData) ? historyData : []);
            }
        } catch (err) {
            console.error("Failed to load payment data:", err);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const handlePaymentTypeChange = (e) => {
        const itemId = e.target.value;
        setPaymentType(itemId);

        // Update amount based on selected item
        const item = paymentItems.find(i => i.itemId === itemId);
        if (item) {
            setPaymentAmount(item.amount);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMsg("");

        if (!paymentType || !paymentMethod) {
            setStatusMsg("Please select payment type and method.");
            return;
        }

        try {
            const user = auth.currentUser;
            const token = await user.getIdToken(true);

            const res = await fetch("http://127.0.0.1:5000/api/student/pay-payment-item", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    itemId: paymentType,
                    method: paymentMethod,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setStatusMsg(data.error || "Failed to process payment.");
                return;
            }

            setStatusMsg("Payment submitted successfully!");
            // Reset form
            setPaymentMethod("");

            // Reload payment data
            await loadPaymentData(user);
        } catch (err) {
            setStatusMsg(err.message);
        }
    };

    if (!profile) {
        return (
            <div className="payment-hub-page">
                <div className="payment-hub-container">
                    <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>
                </div>
            </div>
        );
    }

    const firstName = profile.fullName ? profile.fullName.split(" ")[0] : "Student";

    const generateReceipt = (payment) => {
        const receiptContent = `OFFICIAL RECEIPT
Smart Hostel System

Receipt ID: ${payment.paymentId}
Date: ${payment.submittedAt || payment.createdAt || new Date().toLocaleString()}

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
        <div className="payment-hub-page">
            <div className="payment-hub-container">
                {/* Header */}
                <StudentHeader />

                {/* Content */}
                <div className="payment-hub-content">
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
                                <span className="detail-value">{profile.roomNumber?.includes("•") ? profile.roomNumber.split("•")[1].trim() : (profile.roomNumber || "--")}</span>
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
                    <div className="payment-main">
                        <div className="payment-main-header">
                            <h1 className="payment-main-title">Payment Hub</h1>
                            <p className="payment-main-subtitle">Manage your hostel fees, utilities, and view your transaction history.</p>
                        </div>

                        {statusMsg && (
                            <div className={`payment-status-message ${statusMsg.includes("success") ? "success" : "error"}`}>
                                {statusMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Payment Information */}
                            <div className="form-section">
                                <h2 className="section-title">Payment Information</h2>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Payment Type</label>
                                        <select
                                            value={paymentType}
                                            onChange={handlePaymentTypeChange}
                                            required
                                        >
                                            <option value="">Select Payment Type</option>
                                            {paymentItems.map((item) => (
                                                <option key={item.itemId} value={item.itemId}>
                                                    {item.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label>Payment Amount</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={paymentAmount}
                                            disabled
                                            style={{ backgroundColor: "#f3f4f6" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="form-section">
                                <h2 className="section-title">Payment Method</h2>
                                <div className="form-field">
                                    <label>Payment Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Payment Method</option>
                                        <option value="Online Banking">Online Banking</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="Debit Card">Debit Card</option>
                                        <option value="E-Wallet">E-Wallet</option>
                                        <option value="Cash">Cash</option>
                                    </select>
                                </div>
                            </div>

                            <div className="submit-button-wrapper">
                                <button type="submit" className="pay-now-btn">
                                    Pay Now
                                </button>
                            </div>
                        </form>

                        {/* Payment History */}
                        <div className="payment-history">
                            <h3 className="payment-history-title">Payment History</h3>
                            {paymentHistory.length === 0 ? (
                                <div className="no-payments">
                                    <p>No payment history yet.</p>
                                </div>
                            ) : (
                                paymentHistory.map((payment, index) => {
                                    // Determine icon color based on status
                                    let iconClass = "blue";
                                    if (payment.status === "successful" || payment.status === "completed") {
                                        iconClass = "green";
                                    } else if (payment.status === "failed" || payment.status === "rejected") {
                                        iconClass = "red";
                                    } else if (payment.status === "pending_warden" || payment.status === "pending") {
                                        iconClass = "blue";
                                    }

                                    // Format status display
                                    let statusDisplay = payment.status || "Pending";
                                    if (payment.status === "pending_warden") statusDisplay = "Successful";
                                    if (payment.status === "completed") statusDisplay = "Successful";
                                    if (payment.status === "successful") statusDisplay = "Successful";
                                    if (payment.status === "failed") statusDisplay = "Failed";

                                    // Format date
                                    const paymentDate = payment.submittedAt || payment.createdAt
                                        ? new Date(payment.submittedAt || payment.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric"
                                        })
                                        : "";

                                    // Format amount
                                    const amount = payment.amount ? `RM${payment.amount.toFixed(2)}` : "";
                                    const method = payment.method || "";

                                    return (
                                        <div key={index} className="payment-card">
                                            <div className={`payment-icon ${iconClass}`}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                                </svg>
                                            </div>
                                            <div className="payment-details">
                                                <p className="payment-name">{payment.itemTitle || "Payment"}</p>
                                                <p className="payment-info">
                                                    {paymentDate} • {amount} • {method}
                                                </p>
                                            </div>
                                            <span className={`payment-status ${statusDisplay.toLowerCase().replace(" ", "-")}`}>
                                                {statusDisplay}
                                            </span>
                                            <button
                                                onClick={() => generateReceipt(payment)}
                                                className="receipt-btn-compact"
                                                style={{
                                                    marginLeft: "8px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    background: "none",
                                                    border: "1px solid #2563eb",
                                                    color: "#2563eb",
                                                    borderRadius: "4px",
                                                    padding: "4px 8px",
                                                    cursor: "pointer",
                                                    fontSize: "11px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                                    <polyline points="10 9 9 9 8 9"></polyline>
                                                </svg>
                                                Receipt
                                            </button>
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
