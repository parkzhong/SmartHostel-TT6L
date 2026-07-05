import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { auth, db } from "./firebaseClient";

export default function ProtectedRoute({ children, allowedRole }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setAllowed(false);
          setLoading(false);
          return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          setAllowed(false);
          setLoading(false);
          return;
        }

        const data = snap.data();
        const status = (data.status || "").toLowerCase();
        const role = (data.role || "").toLowerCase();

        if (status === "active" && role === allowedRole) {
          setAllowed(true);
        } else {
          setAllowed(false);
        }
        setLoading(false);
      } catch (e) {
        setAllowed(false);
        setLoading(false);
      }
    });

    return () => unsub();
  }, [allowedRole]);

  if (loading) return <p style={{ padding: 20 }}>Checking access...</p>;

  // Not allowed → kick back to home/login page
  if (!allowed) return <Navigate to="/" replace />;

  return children;
}