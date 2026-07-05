import React, { useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import TopRightMenu from "../component/TopRightMenu";

export default function WardenVisitorDashboard() {
  const [requests, setRequests] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not logged in");

      const res = await fetch("http://127.0.0.1:5000/api/warden/pending-visitor-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch visitor requests");
      setRequests(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(requestId) {
    setErr("");
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("Not logged in");

      const remark = prompt("Remark (optional):") || "";

      const res = await fetch("http://127.0.0.1:5000/api/warden/approve-visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId, remark }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approve failed");
      alert("Approved!");
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

      const res = await fetch("http://127.0.0.1:5000/api/warden/reject-visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Warden - Visitor Requests</h2>
        <TopRightMenu onRefresh={load} />
      </div>

      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}
      {err && <div style={{ color: "red", marginTop: 10 }}>{err}</div>}

      {requests.length === 0 ? (
        <p style={{ marginTop: 12 }}>No pending visitor requests.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", marginTop: 12 }}>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Student</th>
              <th>Visitor Name</th>
              <th>IC</th>
              <th>Relationship</th>
              <th>Date</th>
              <th>Time</th>
              <th>Purpose</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.requestId}>
                <td style={{ maxWidth: 220, wordBreak: "break-all" }}>{r.requestId}</td>
                <td>{r.studentName || "-"}</td>
                <td>{r.visitorName || "-"}</td>
                <td>{r.visitorIC || "-"}</td>
                <td>{r.relationship || "-"}</td>
                <td>{r.visitDate || "-"}</td>
                <td>{(r.timeIn || "-") + " - " + (r.timeOut || "-")}</td>
                <td style={{ maxWidth: 300, wordBreak: "break-word" }}>{r.purpose || "-"}</td>
                <td>{r.createdAt || "-"}</td>
                <td>
                  <button onClick={() => approve(r.requestId)}>Approve</button>{" "}
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