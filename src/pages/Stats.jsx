import { useState, useEffect } from "react";
import { Report, Municipality, LegalNotice, EscalationEvent } from "../api/entities";
import { CATEGORY_LABELS } from "../components/Badges";

export default function Stats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      Report.filter({ status: "approved" }),
      Report.filter({ status: "escalated" }),
      Report.filter({ status: "resolved" }),
      Municipality.list(),
      LegalNotice.list(),
    ]).then(([approved, escalated, resolved, munis, notices]) => {
      const all = [...approved, ...escalated, ...resolved];

      // By municipality
      const muniCounts = {};
      all.forEach(r => { muniCounts[r.municipalityName] = (muniCounts[r.municipalityName] || 0) + 1; });
      const muniLeaderboard = Object.entries(muniCounts).sort((a,b) => b[1]-a[1]);

      // By category
      const catCounts = {};
      all.forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });
      const catBreakdown = Object.entries(catCounts).sort((a,b) => b[1]-a[1]);

      // Notices
      const noticesSent = notices.filter(n => n.status === "sent" || n.sentAt).length;
      const responsesReceived = notices.filter(n => n.responseReceived).length;

      // Response rate by muni
      const muniNotices = {};
      const muniResponses = {};
      notices.forEach(n => {
        const name = n.addressedToName?.split(",").slice(-1)[0]?.trim() || "Unknown";
        muniNotices[name] = (muniNotices[name] || 0) + 1;
        if (n.responseReceived) muniResponses[name] = (muniResponses[name] || 0) + 1;
      });

      const responseRates = Object.entries(muniNotices).map(([name, sent]) => ({
        name, sent, responses: muniResponses[name] || 0,
        rate: Math.round(((muniResponses[name] || 0) / sent) * 100),
      })).sort((a,b) => a.rate - b.rate); // worst first

      // Median response time
      let medianDays = null;
      const responseTimes = [];
      // Would need EscalationEvent data for precise calculation — placeholder
      
      setData({ all, muniLeaderboard, catBreakdown, noticesSent, responsesReceived, responseRates, totalMunis: munis.length, noticeDrafts: notices.filter(n=>n.status==="draft").length });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "#444", textAlign: "center", padding: "100px" }}>Loading stats...</div>;

  const maxMuni = data.muniLeaderboard[0]?.[1] || 1;
  const maxCat = data.catBreakdown[0]?.[1] || 1;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ color: "#F5F5F0", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Stats Dashboard</h1>
      <p style={{ color: "#666", fontSize: "13px", marginBottom: "40px" }}>Live data from the platform. Updated as reports are submitted and processed.</p>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "12px", marginBottom: "48px" }}>
        {[
          { label: "Total Reports", value: data.all.length, color: "#F5F5F0" },
          { label: "Municipalities Covered", value: data.totalMunis, color: "#F5F5F0" },
          { label: "Notices Issued", value: data.noticesSent, color: "#E8A838" },
          { label: "Responses Received", value: data.responsesReceived, color: "#059669" },
          { label: "Notice Drafts Pending", value: data.noticeDrafts, color: "#d97706" },
          { label: "Resolved Reports", value: data.all.filter(r=>r.status==="resolved").length, color: "#10b981" },
        ].map(s => (
          <div key={s.label} style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: "#555", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "6px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Reports by Municipality */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "20px", borderLeft: "3px solid #E8A838", paddingLeft: "10px" }}>Reports by Municipality</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.muniLeaderboard.map(([name, count]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "200px", color: "#888", fontSize: "12px", textAlign: "right", flexShrink: 0 }}>{name}</div>
              <div style={{ flex: 1, background: "#1a1a1a", borderRadius: "3px", height: "24px", overflow: "hidden" }}>
                <div style={{ width: `${(count/maxMuni)*100}%`, height: "100%", background: "#E8A838", borderRadius: "3px", minWidth: "4px", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "8px", boxSizing: "border-box" }}>
                  <span style={{ color: "#0A0A0A", fontSize: "11px", fontWeight: 700 }}>{count}</span>
                </div>
              </div>
            </div>
          ))}
          {data.muniLeaderboard.length === 0 && <div style={{ color: "#444", fontSize: "13px" }}>No approved reports yet.</div>}
        </div>
      </section>

      {/* Reports by Category */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "20px", borderLeft: "3px solid #E8A838", paddingLeft: "10px" }}>Reports by Category</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.catBreakdown.map(([cat, count]) => (
            <div key={cat} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "200px", color: "#888", fontSize: "12px", textAlign: "right", flexShrink: 0 }}>{CATEGORY_LABELS[cat] || cat}</div>
              <div style={{ flex: 1, background: "#1a1a1a", borderRadius: "3px", height: "24px", overflow: "hidden" }}>
                <div style={{ width: `${(count/maxCat)*100}%`, height: "100%", background: "#7c3aed", borderRadius: "3px", minWidth: "4px", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "8px", boxSizing: "border-box" }}>
                  <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>{count}</span>
                </div>
              </div>
            </div>
          ))}
          {data.catBreakdown.length === 0 && <div style={{ color: "#444", fontSize: "13px" }}>No approved reports yet.</div>}
        </div>
      </section>

      {/* Notice response rate */}
      {data.responseRates.length > 0 && (
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px", borderLeft: "3px solid #dc2626", paddingLeft: "10px" }}>
            Municipal Response Rate (Worst First)
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.responseRates.map(r => (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: "12px", background: "#111", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "10px 14px" }}>
                <div style={{ flex: 1, color: "#F5F5F0", fontSize: "13px" }}>{r.name}</div>
                <div style={{ color: "#555", fontSize: "12px" }}>{r.responses}/{r.sent} responses</div>
                <div style={{ width: "60px", textAlign: "right", fontWeight: 700, color: r.rate >= 50 ? "#059669" : r.rate > 0 ? "#d97706" : "#dc2626", fontSize: "14px" }}>{r.rate}%</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
