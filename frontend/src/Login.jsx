import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseClient";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css"; // Import the custom CSS
import Footer from "./component/Footer";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");

    try {
      // 1) Firebase Auth login
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      await userCred.user.reload();

      // 2) Check Firestore status
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        await signOut(auth);
        setMsg("No user profile found. Please register first.");
        return;
      }

      const profile = snap.data();
      const status = (profile.status || "").toLowerCase();
      const role = (profile.role || "").toLowerCase();

      console.log("Login Role:", role, "Status:", status, "Email Verified:", userCred.user.emailVerified);

      if (role === "student" && !userCred.user.emailVerified) {
        await signOut(auth);
        setMsg("Please verify your email before logging in.");
        return;
      }

      if (status !== "active") {
        await signOut(auth);

        if (status === "pending") setMsg("Your account is waiting for admin approval.");
        else if (status === "rejected") setMsg("Your registration was rejected by admin. Please contact admin.");
        else if (status === "email_failed") setMsg("Activation email failed. Admin will resend the email.");
        else if (status === "approving") setMsg("Your approval is processing. Please wait.");
        else setMsg("Your account is not active.");

        return;
      }

      // 3) Token for backend later
      // const token = await userCred.user.getIdToken(true);

      // setMsg("Login successful (active user). Go to dashboard.");
      // alert("Login success: " + userCred.user.email);
      setEmail("");
      setPassword("");

      if (role === "student")
        navigate("/student-dashboard");
      else if (role === "warden")
        navigate("/warden-dashboard");
      else if (role === "admin")
        navigate("/admin");
      else if (role === "maintenance_staff")
        navigate("/maintenance-staff-dashboard");
      else {
        await signOut(auth);
        setMsg("Unknown role. Access denied.");
        return;
      }
    } catch (err) {
      setMsg(err.message);
      // alert(err.message);
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
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Please enter your details to sign in to your account.</p>

          {msg && <div className="error-message">{msg}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                {/* Mail Icon */}
                <svg className="input-icon" style={{ left: '12px' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  className="input-field"
                  placeholder="yourname@student.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                {/* Lock Icon */}
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
              <label className="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
            </div>

            <button type="submit" className="auth-button">Login</button>
          </form>

          <div className="auth-footer">
            Don't have an account?
            <Link to="/register" className="auth-link">Sign up here</Link>
          </div>
        </div>

      </div>
      <Footer showLinks={false} />
    </div>

  );
}