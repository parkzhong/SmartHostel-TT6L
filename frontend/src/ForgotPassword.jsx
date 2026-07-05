import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebaseClient";
import { Link } from "react-router-dom";
import "./Auth.css"; // Reuse the same CSS
import Footer from "./component/Footer";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [logoError, setLogoError] = useState(false);

    async function handleReset(e) {
        e.preventDefault();
        setMsg("");
        setError("");
        setLoading(true);

        try {
            console.log("Attempting to send password reset email to:", email);
            await sendPasswordResetEmail(auth, email);
            console.log("Password reset email sent successfully to:", email);
            setMsg("Password reset email sent! Check your inbox (and spam folder).");
        } catch (err) {
            console.error("Error sending password reset email:", err);
            if (err.code === 'auth/user-not-found') {
                setError("No user found with this email address.");
            } else {
                setError("Failed to send reset email: " + err.message);
            }
        }
        setLoading(false);
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8faff" }}>
            <div className="auth-container" style={{ minHeight: "auto", flex: 1 }}>
                <div className="auth-header">
                    <div className="auth-logo" style={!logoError ? { background: 'transparent' } : {}}>
                        {!logoError ? (
                            <img
                                src="/logo.png"
                                alt="Smart Hostel Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }}
                                onError={() => setLogoError(true)}
                            />
                        ) : (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                        )}
                    </div>
                    <h1 className="auth-title">Smart Hostel</h1>
                </div>

                <div className="auth-card">
                    <h2>Reset Password</h2>
                    <p className="auth-subtitle">Enter your email to receive a password reset link.</p>

                    {msg && <div className="success-message" style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "10px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px", textAlign: "center" }}>{msg}</div>}
                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleReset}>
                        <div className="form-group">
                            <label>Email</label>
                            <div className="input-wrapper">
                                {/* Mail Icon */}
                                <svg className="input-icon" style={{ left: '12px' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="yourname@student.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Remembered your password?
                        <Link to="/login" className="auth-link">Log in</Link>
                    </div>
                </div>
            </div>
            <Footer showLinks={false} />
        </div>
    );
}
