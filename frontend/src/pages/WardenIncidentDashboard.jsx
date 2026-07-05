import React, { useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import TopRightMenu from "../component/TopRightMenu";

export default function WardenIncidentDashboard() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("http://127.0.0.1:5000/api/warden/pending-incident-reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch incident reports");
      setItems(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function update(reportId, currentStatus) {
    setErr("");
    try {
      const token = await auth.currentUser?.getIdToken(true);

      const status = (
        prompt("Status: in_review / resolved / rejected", "in_review") || ""
      )
        .trim()
        .toLowerCase();

      if (!["in_review", "resolved", "rejected"].includes(status)) return;

      const wardenRemark = prompt("Warden remark (optional):") || "";
      let resolution = "";
      let rejectReason = "";

      // visualize the flow:
      // pending_warden -> in_review -> resolved
      // pending_warden -> rejected
      // in_review -> resolved / rejected


      if (status === "resolved") {
        resolution = prompt("Resolution (required):") || "";
        if (!resolution.trim()) return;
      }

      if (status === "rejected") {
        rejectReason = prompt("Reject reason (required):") || "";
        if (!rejectReason.trim()) return;
      }

      const res = await fetch("http://127.0.0.1:5000/api/warden/update-incident", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId, status, wardenRemark, resolution, rejectReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      alert("Updated!");
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Warden - Incident Reports</h2>
        <TopRightMenu onRefresh={load} />
      </div>

      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}
      {err && <div style={{ color: "red", marginTop: 10 }}>{err}</div>}

      {items.length === 0 ? (
        <p style={{ marginTop: 12 }}>No incident reports to review.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", marginTop: 12 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Student</th>
              <th>Category</th>
              <th>Location</th>
              <th>Description</th>
              <th>Evidence</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.reportId}>
                <td style={{ maxWidth: 220, wordBreak: "break-all" }}>{r.reportId}</td>
                <td>{r.studentName || "-"}</td>
                <td>{r.category || "-"}</td>
                <td>{ r.location || "-"}</td>
                <td style={{ maxWidth: 360, wordBreak: "break-word" }}>{r.description || "-"}</td>
                <td>{ r.evidenceUrl ? (
                  <a href={r.evidenceUrl} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : (
                  "-"
                )} </td>
                <td><b>{r.status}</b></td>
                <td>{r.createdAt || "-"}</td>
                <td>
                  <button onClick={() => update(r.reportId, r.status)}>Update</button>
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