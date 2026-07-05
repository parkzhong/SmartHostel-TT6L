import React, { useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import TopRightMenu from "../component/TopRightMenu";

export default function WardenMaintenanceDashboard() {
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Not logged in");

      const [rRes, sRes] = await Promise.all([
        fetch("http://127.0.0.1:5000/api/warden/pending-maintenance-requests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://127.0.0.1:5000/api/warden/maintenance-staff", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const rData = await rRes.json();
      const sData = await sRes.json();

      if (!rRes.ok) throw new Error(rData.error || "Failed to fetch maintenance requests");
      if (!sRes.ok) throw new Error(sData.error || "Failed to fetch maintenance staff");

      setRequests(rData);
      setStaff(sData);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function assign(requestId) {
    setErr("");
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Not logged in");

      if (staff.length === 0) {
        throw new Error("No maintenance staff found. Create a staff user in Firestore first.");
      }

      // simple picker
      const choices = staff.map((x, i) => `${i + 1}) ${x.fullName || x.uid}`).join("\n");
      const pick = prompt(`Assign to which staff?\n\n${choices}\n\nEnter number:`);

      const idx = Number(pick) - 1;
      if (Number.isNaN(idx) || idx < 0 || idx >= staff.length) return;

      const remark = prompt("Remark (optional):") || "";

      const res = await fetch("http://127.0.0.1:5000/api/warden/assign-maintenance-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, staffUid: staff[idx].uid, remark }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assign failed");

      alert("Assigned!");
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function reject(requestId) {
    setErr("");
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Not logged in");

      const reason = prompt("Reject reason (optional):") || "Rejected by warden";

      const res = await fetch("http://127.0.0.1:5000/api/warden/reject-maintenance-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, reason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reject failed");

      alert("Rejected!");
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Warden Dashboard - Maintenance Requests</h2>
        <TopRightMenu onRefresh={load} />
      </div>

      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}
      {err && <div style={{ color: "red", marginTop: 10 }}>{err}</div>}

      <div style={{ marginTop: 12, marginBottom: 10 }}>
        <b>Available Maintenance Staff:</b>{" "}
        {staff.length === 0 ? "None" : staff.map((s) => s.fullName || s.uid).join(", ")}
      </div>

      {requests.length === 0 ? (
        <p>No pending maintenance requests.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Student</th>
              <th>Category</th>
              <th>Location</th>
              <th>Priority</th>
              <th>Description</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.requestId}>
                <td style={{ maxWidth: 220, wordBreak: "break-all" }}>{r.requestId}</td>
                <td>{r.studentName || "-"}</td>
                <td>{r.category || "-"}</td>
                <td>{r.location || "-"}</td>
                <td>{r.priority || "-"}</td>
                <td style={{ maxWidth: 320, wordBreak: "break-word" }}>{r.description || "-"}</td>
                <td>{r.createdAt || "-"}</td>
                <td>
                  <button onClick={() => assign(r.requestId)}>Approve & Assign</button>{" "}
                  <button onClick={() => reject(r.requestId)}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button
        onClick={() => (window.location.href = "/warden-dashboard")}
        style = {{marginTop: 12}}
        >
            Back to Room Requests
        </button>
    </div>
  );
}