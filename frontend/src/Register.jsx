import { useState } from "react";
import { createUserWithEmailAndPassword, deleteUser, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "./firebaseClient";
import { Link } from "react-router-dom";
import "./Auth.css";
import Footer from "./component/Footer";


export default function Register() {
  const [fullName, setFullName] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [logoError, setLogoError] = useState(false); // New state

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");
    setIsSuccess(false);
    let createdUser = null;

    if (!fullName || !personalEmail || !password) {
      setMsg("Please fill in all fields.");
      return;
    }

    try {
      // 1 ) Create Firebase Auth user
      const userCred = await createUserWithEmailAndPassword(auth, personalEmail, password);
      createdUser = userCred.user;

      // send email vertification
      await sendEmailVerification(userCred.user);

      // get token to call backend
      const token = await userCred.user.getIdToken(true);

      // create Firestore profile (pending)
      const res = await fetch("http://127.0.0.1:5000/api/student/register-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          personalEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'register profile failed');

      //   alert("Register success: " + userCred.user.email + "  ! Waiting for profile approval and verify your email.");
      setIsSuccess(true);
      setMsg("Register success! Please check your email for verification. Account pending approval.");

      // Clear form
      setFullName("");
      setPersonalEmail("");
      setPassword("");

    } catch (err) {
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (deleteErr) {
          console.error("Failed to clean up incomplete registration:", deleteErr);
          await signOut(auth);
        }
      }

      const message =
        err.message === "Failed to fetch"
          ? "Could not connect to the backend. Please make sure the backend is running and try again."
          : err.message;
      setMsg(message);
    }
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
          <h2>Create your account</h2>
          <p className="auth-subtitle">Please enter your details to create a new account.</p>

          {msg && (
            <div className={isSuccess ? "success-message" : "error-message"} style={isSuccess ? { backgroundColor: '#d1fae5', color: '#065f46', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' } : {}}>
              {msg}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <svg className="input-icon" style={{ left: '12px' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  className="input-field"
                  placeholder="Your Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Personal Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" style={{ left: '12px' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  className="input-field"
                  placeholder="yourname@example.com"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password (min 6 char)</label>
              <div className="input-wrapper">
                <svg className="input-icon" style={{ left: '12px' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  className="input-field"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="auth-options">
              <label className="remember-me" style={{ fontSize: '14px' }}>
                <input type="checkbox" required /> I agree to the Terms & Conditions
              </label>
            </div>

            <button type="submit" className="auth-button">Sign Up</button>
          </form>

          <div className="auth-footer">
            Already have an account?
            <Link to="/login" className="auth-link">Log in here</Link>
          </div>
        </div>

      </div>
      <Footer showLinks={false} />
    </div>
  );
}
