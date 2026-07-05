import React, { useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import TopRightMenu from "../component/TopRightMenu";

export default function AdminPaymentRecords() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("http://127.0.0.1:5000/api/admin/payment-records", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load payment records");
      setRows(data || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Admin - Payment Records</h2>
        <TopRightMenu onRefresh={load} />
      </div>

      {loading && <div style={{ marginTop: 10 }}>Loading...</div>}
      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}

      {rows.length === 0 ? (
        <p style={{ marginTop: 12 }}>No payment records yet.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", marginTop: 12 }}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Item</th>
              <th>Amount</th>
              <th>Receipt</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.paymentId}>
                <td>{p.studentName || p.studentEmail || p.studentId || "-"}</td>
                <td>{p.itemTitle || p.itemId || "-"}</td>
                <td>{p.amount != null ? `RM ${p.amount}` : "-"}</td>
                <td>
                  {p.receiptUrl ? (
                    <a href={p.receiptUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td><b>{p.status || "submitted"}</b></td>
                <td>{p.createdAt || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button onClick={() => (window.location.href = "/admin-dashboard")} style={{ marginTop: 12 }}>
        Back
      </button>
    </div>
  );
}