import React, { useState, useRef, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseClient";
import { useNavigate } from "react-router-dom";

export default function TopRightMenu({ onRefresh }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await signOut(auth);
    navigate("/", { replace: true });
  }

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      {/* Vertical ellipsis */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          fontSize: 20,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px"
        }}
      >
        ⋮
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 4,
            minWidth: 140,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 100
          }}
        >
          <div
            onClick={() => {
              setOpen(false);
              onRefresh();
            }}
            style={menuItem}
          >
            Refresh
          </div>

          <div
            onClick={handleLogout}
            style={{ ...menuItem, color: "crimson" }}
          >
            Sign out
          </div>
        </div>
      )}
    </div>
  );
}

const menuItem = {
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: 14,
  borderBottom: "1px solid #eee"
};