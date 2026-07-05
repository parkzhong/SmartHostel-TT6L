import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseClient";
import { useNavigate } from "react-router-dom";

export default function LogoutButton({ label = "Logout" }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleLogout} disabled={loading}>
      {loading ? "Logging out..." : label}
    </button>
  );
}