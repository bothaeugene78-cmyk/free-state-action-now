import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { Report, EscalationEvent, EvidenceItem } from "../../api/entities";
import { CategoryBadge } from "../../components/Badges";
import { UserContext } from "../../App";
import AdminLayout from "./AdminLayout";

export default function Moderation() {
  const { user } = useContext(UserContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [processing, setProcessing] = useState({});
  const [expandedEvidence, setExpandedEvidence] = useState({});
  const [evidence, setEvidence] = useState({});

  useEffect(() => {
    Report.filter({ status: "pending_review" }).then(r => {
      setReports(r.sort((a,b) => new Date(a.created_date) - new Date(b.created_date)));
      setLoading(false);
    });
  }, []);

  const loadEvidence = async (reportId) => {
    if (evidence[reportId]) { setExpandedEvidence(e => ({ ...e, [reportId]: !e[reportId] })); return; }
    const items = await EvidenceItem.filter({ reportId });
    setEvidence(e => ({ ...e, [reportId]: items }));
    setExpandedEvidence(e => ({ ...e, [reportId]: true }));
  };

  const moderate = async (report, action) => {
    setProcessing(p => ({ ...p, [report.id]: true }));
    try {
      const newStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "duplicate";
      const eventType = action === "approve" ? "approved" : action === "reject" ? "rejected" : "rejected";
      await Report.update(report.id, { status: newStatus, moderatedByUserId: user.id, moderatedAt: new Date().toISOString(), moderatorNotes: notes[report.id] || "" });
      await EscalationEvent.create({ reportId: report.id, eventType, eventDate: new Date().toISOString(), actorUserId: user.id, actorName: user.full_name || user.email, description: notes[report.id] || `Report ${action}d by curator.` });
      setReports(r => r.filter(x => x.id !== report.id));
    } catch (e) { alert("Error: " + e.message); }
    setProcessing(p => ({ ...p, [report.id]: false }));
  };

  const btnStyle = (color) => ({ background: color+"22", color, border: `1px solid ${color}44`, padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em" });

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ color: "#F5F5F0", fontSize: "22px", fontWeight: 800, margin: 0 }}>Moderation Queue</h1>
          <p style={{ color: "#555", fontSize: "13px", marginTop: "4px" }}>Reports awaiting review — oldest first</p>
        </div>
        <div style={{ background: "#E8A83822", color: "#E8A838", border: "1px solid #E8A83844", padding: "6px 16px", borderRadius: "4px", fontWeight: 700, fontSize: "14px" }}>
          {reports.length} pending
        </div>
      </div>

      {loading ? <div style={{ color: "#444", textAlign: "center", padding: "60px" }}>Loading queue...</div>
      : reports.length === 0 ? <div style={{ color: "#444", textAlign: "center", padding: "60px", border: "1px dashed #222", borderRadius: "8px" }}>Queue is empty. All reports reviewed. ✓</div>
      : reports.map(r => (
        <div key={r.id} style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", marginBottom: "16px", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <CategoryBadge category={r.category} small />
              <span style={{ color: "#555", fontSize: "11px" }}>Submitted {new Date(r.created_date).toLocaleString("en-ZA")}</span>
              <span style={{ marginLeft: "auto" }}><Link to={`/reports/${r.id}`} target="_blank" style={{ color: "#E8A838", fontSize: "11px" }}>View public page →</Link></span>
            </div>
            <div style={{ color: "#F5F5F0", fontWeight: 700, fontSize: "16px", marginBottom: "6px" }}>{r.title}</div>
            <div style={{ color: "#666", fontSize: "12px", marginBottom: "12px" }}>📍 {r.townOrWard}, {r.municipalityName} · 📅 Incident: {r.incidentDate}</div>
            <div style={{ color: "#888", fontSize: "13px", lineHeight: 1.6, background: "#0A0A0A", borderRadius: "4px", padding: "12px", marginBottom: "14px" }}>{r.body}</div>

            {/* Evidence toggle */}
            <button onClick={() => loadEvidence(r.id)} style={{ background: "transparent", color: "#E8A838", border: "1px solid #E8A83844", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", marginBottom: "14px" }}>
              📷 {r.evidenceItemCount || 0} evidence item(s) {expandedEvidence[r.id] ? "▲" : "▼"}
            </button>
            {expandedEvidence[r.id] && evidence[r.id] && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                {evidence[r.id].map(ev => (
                  <div key={ev.id} style={{ background: "#0A0A0A", border: "1px solid #1a1a1a", borderRadius: "4px", overflow: "hidden", width: "140px" }}>
                    {ev.fileType === "photo" && ev.fileUrl && <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer"><img src={ev.fileUrl} alt="Evidence" style={{ width: "100%", height: "90px", objectFit: "cover", display: "block" }} /></a>}
                    <div style={{ padding: "6px 8px", fontSize: "10px", color: "#555" }}>
                      {ev.exifGpsLatitude ? "✓ GPS" : "✗ No GPS"} · {ev.sha256Hash ? "✓ Hashed" : "⚠ No hash"}
                      {ev.locationDiscrepancy && <div style={{ color: "#dc2626", fontWeight: 700 }}>⚠ GPS mismatch!</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Consent checks */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
              {[["Is 18+", r.submitterIs18], ["Firsthand", r.confirmedFirsthand], ["POPIA consent", r.consentToProcess], ["Agreed to terms", r.submitterAgreedToTerms]].map(([label, val]) => (
                <span key={label} style={{ fontSize: "11px", color: val ? "#059669" : "#dc2626" }}>{val ? "✓" : "✗"} {label}</span>
              ))}
            </div>

            {/* Moderator notes */}
            <textarea value={notes[r.id] || ""} onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))} placeholder="Moderation notes (required for rejection)..." style={{ width: "100%", background: "#0A0A0A", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "10px", fontSize: "13px", minHeight: "60px", resize: "vertical", boxSizing: "border-box", marginBottom: "14px" }} />

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={() => moderate(r, "approve")} disabled={processing[r.id]} style={btnStyle("#059669")}>✓ Approve</button>
              <button onClick={() => moderate(r, "reject")} disabled={processing[r.id] || !notes[r.id]} style={btnStyle("#dc2626")}>✗ Reject</button>
              <button onClick={() => moderate(r, "duplicate")} disabled={processing[r.id]} style={btnStyle("#6b7280")}>⊙ Duplicate</button>
              {processing[r.id] && <span style={{ color: "#555", fontSize: "12px", alignSelf: "center" }}>Processing...</span>}
            </div>
          </div>
        </div>
      ))}
    </AdminLayout>
  );
}
