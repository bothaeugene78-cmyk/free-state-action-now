import { useState, useEffect, useContext } from "react";
import { LegalNotice, Report, TemplateApproval, EscalationEvent } from "../../api/entities";
import { UserContext } from "../../App";
import AdminLayout from "./AdminLayout";

export default function Notices() {
  const { user } = useContext(UserContext);
  const [notices, setNotices] = useState([]);
  const [templateApproval, setTemplateApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [reviewNotes, setReviewNotes] = useState({});
  const [processing, setProcessing] = useState({});
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalForm, setApprovalForm] = useState({});

  useEffect(() => {
    Promise.all([
      LegalNotice.list(),
      TemplateApproval.filter({ templateName: "demand_v1_section73_msa" }),
    ]).then(([n, a]) => {
      setNotices(n.sort((x,y) => new Date(y.created_date) - new Date(x.created_date)));
      const valid = a.find(ap => !ap.expiresAt || new Date(ap.expiresAt) > new Date());
      setTemplateApproval(valid || null);
      setLoading(false);
    });
  }, []);

  const markReviewed = async (notice) => {
    if (!reviewNotes[notice.id]) return alert("Attorney review notes are required.");
    setProcessing(p => ({ ...p, [notice.id]: true }));
    await LegalNotice.update(notice.id, { status: "attorney_reviewed", attorneyReviewerUserId: user.id, attorneyReviewerName: user.full_name || user.email, attorneyReviewDate: new Date().toISOString().split("T")[0], attorneyReviewNotes: reviewNotes[notice.id] });
    setNotices(n => n.map(x => x.id === notice.id ? { ...x, status: "attorney_reviewed", attorneyReviewNotes: reviewNotes[notice.id] } : x));
    setProcessing(p => ({ ...p, [notice.id]: false }));
  };

  const markSent = async (notice) => {
    if (!templateApproval) return alert("No valid template approval on file. Cannot send.");
    if (notice.status !== "attorney_reviewed") return alert("Notice must be attorney-reviewed before sending.");
    setProcessing(p => ({ ...p, [notice.id]: true }));
    const sentAt = new Date().toISOString();
    await LegalNotice.update(notice.id, { status: "sent", sentAt, deliveryMethod: "email" });
    await EscalationEvent.create({ reportId: notice.reportId, eventType: "notice_sent", eventDate: sentAt, actorUserId: user.id, actorName: user.full_name || user.email, description: `Notice sent to ${notice.addressedToName}. CC: ${notice.ccList}`, recipientEmail: notice.addressedToName });
    await Report.update(notice.reportId, { escalationStage: "notice_sent", status: "escalated" });
    setNotices(n => n.map(x => x.id === notice.id ? { ...x, status: "sent", sentAt } : x));
    setProcessing(p => ({ ...p, [notice.id]: false }));
  };

  const saveApproval = async () => {
    if (!approvalForm.approvedBy || !approvalForm.approvalDocumentUrl) return alert("All fields required.");
    await TemplateApproval.create({ templateName: "demand_v1_section73_msa", approvedBy: approvalForm.approvedBy, approvedAt: new Date().toISOString().split("T")[0], approvalDocumentUrl: approvalForm.approvalDocumentUrl, expiresAt: approvalForm.expiresAt || undefined, notes: approvalForm.notes || "" });
    const updated = await TemplateApproval.filter({ templateName: "demand_v1_section73_msa" });
    const valid = updated.find(ap => !ap.expiresAt || new Date(ap.expiresAt) > new Date());
    setTemplateApproval(valid || null);
    setShowApprovalForm(false);
  };

  const statusColor = { draft: "#d97706", attorney_reviewed: "#059669", sent: "#E8A838", responded: "#10b981", no_response: "#dc2626" };
  const inputStyle = { width: "100%", background: "#0A0A0A", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "10px", fontSize: "13px", boxSizing: "border-box" };

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h1 style={{ color: "#F5F5F0", fontSize: "22px", fontWeight: 800, margin: 0 }}>Legal Notices</h1>
      </div>

      {/* Template Approval Status */}
      <div style={{ background: "#111", border: `1px solid ${templateApproval ? "#05996944" : "#dc262644"}`, borderRadius: "6px", padding: "14px 18px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: templateApproval ? "#059669" : "#dc2626", fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>
            {templateApproval ? "✓ Template Approval Active" : "⚠ No Template Approval — Sending Blocked"}
          </div>
          {templateApproval
            ? <div style={{ color: "#666", fontSize: "12px" }}>Approved by {templateApproval.approvedBy} on {templateApproval.approvedAt}{templateApproval.expiresAt ? ` · Expires ${templateApproval.expiresAt}` : ""}</div>
            : <div style={{ color: "#888", fontSize: "12px" }}>An admitted attorney must review the notice template and upload a signed sign-off before notices can be sent.</div>}
        </div>
        {user.role === "admin" && <button onClick={() => setShowApprovalForm(true)} style={{ background: "#E8A838", color: "#0A0A0A", border: "none", padding: "8px 16px", borderRadius: "4px", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}>Upload Approval</button>}
      </div>

      {loading ? <div style={{ color: "#444", textAlign: "center", padding: "60px" }}>Loading notices...</div>
      : notices.length === 0 ? <div style={{ color: "#444", textAlign: "center", padding: "60px", border: "1px dashed #222", borderRadius: "8px" }}>No notices yet. Generate one from an approved report.</div>
      : notices.map(notice => (
        <div key={notice.id} style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", marginBottom: "12px", overflow: "hidden" }}>
          <div onClick={() => setExpanded(e => ({ ...e, [notice.id]: !e[notice.id] }))} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "center" }}>
                <span style={{ background: statusColor[notice.status]+"22", color: statusColor[notice.status], border: `1px solid ${statusColor[notice.status]}44`, padding: "2px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>{notice.status?.replace(/_/g," ")}</span>
                <span style={{ color: "#555", fontSize: "11px" }}>{new Date(notice.created_date).toLocaleDateString("en-ZA")}</span>
              </div>
              <div style={{ color: "#F5F5F0", fontWeight: 700, fontSize: "14px" }}>{notice.subject?.slice(0,80)}...</div>
              <div style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>To: {notice.addressedToName}</div>
            </div>
            <span style={{ color: "#E8A838", marginLeft: "16px" }}>{expanded[notice.id] ? "▲" : "▼"}</span>
          </div>
          {expanded[notice.id] && (
            <div style={{ borderTop: "1px solid #1a1a1a", padding: "16px 20px" }}>
              <pre style={{ color: "#888", fontSize: "11px", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#0A0A0A", borderRadius: "4px", padding: "16px", maxHeight: "400px", overflow: "auto" }}>{notice.body}</pre>

              {["attorney_reviewer","admin"].includes(user.role) && notice.status === "draft" && (
                <div style={{ marginTop: "16px" }}>
                  <textarea value={reviewNotes[notice.id]||""} onChange={e => setReviewNotes(n=>({...n,[notice.id]:e.target.value}))} placeholder="Attorney review notes (required before approval)..." style={{ ...inputStyle, minHeight: "60px", resize: "vertical", marginBottom: "10px" }} />
                  <button onClick={() => markReviewed(notice)} disabled={processing[notice.id] || !reviewNotes[notice.id]} style={{ background: "#05996922", color: "#059669", border: "1px solid #05996944", padding: "8px 16px", borderRadius: "4px", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}>✓ Mark Attorney Reviewed</button>
                </div>
              )}

              {["attorney_reviewer","admin"].includes(user.role) && notice.status === "attorney_reviewed" && (
                <div style={{ marginTop: "12px" }}>
                  {notice.attorneyReviewNotes && <div style={{ color: "#059669", fontSize: "12px", marginBottom: "10px" }}>Attorney notes: {notice.attorneyReviewNotes}</div>}
                  <button onClick={() => markSent(notice)} disabled={processing[notice.id] || !templateApproval} title={!templateApproval ? "Template approval required" : ""} style={{ background: templateApproval ? "#E8A83822" : "#33333322", color: templateApproval ? "#E8A838" : "#444", border: `1px solid ${templateApproval?"#E8A83844":"#33333344"}`, padding: "8px 20px", borderRadius: "4px", fontWeight: 700, cursor: templateApproval ? "pointer" : "not-allowed", fontSize: "12px" }}>
                    📨 {processing[notice.id] ? "Sending..." : "Send Notice"}
                  </button>
                  {!templateApproval && <div style={{ color: "#dc2626", fontSize: "11px", marginTop: "6px" }}>Upload a template approval document first.</div>}
                </div>
              )}

              {notice.status === "sent" && <div style={{ color: "#E8A838", fontSize: "12px", marginTop: "10px" }}>✓ Sent {notice.sentAt ? new Date(notice.sentAt).toLocaleDateString("en-ZA") : ""}</div>}
            </div>
          )}
        </div>
      ))}

      {/* Approval Upload Modal */}
      {showApprovalForm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "32px", width: "90%", maxWidth: "480px" }}>
            <h3 style={{ color: "#F5F5F0", marginBottom: "20px" }}>Upload Template Approval</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div><label style={{ color: "#666", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Attorney Name & Admission Number *</label><input value={approvalForm.approvedBy||""} onChange={e => setApprovalForm(f=>({...f,approvedBy:e.target.value}))} style={inputStyle} /></div>
              <div><label style={{ color: "#666", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Signed Document URL *</label><input value={approvalForm.approvalDocumentUrl||""} onChange={e => setApprovalForm(f=>({...f,approvalDocumentUrl:e.target.value}))} placeholder="https://..." style={inputStyle} /></div>
              <div><label style={{ color: "#666", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Expires (optional)</label><input type="date" value={approvalForm.expiresAt||""} onChange={e => setApprovalForm(f=>({...f,expiresAt:e.target.value}))} style={inputStyle} /></div>
              <div><label style={{ color: "#666", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>Notes</label><textarea value={approvalForm.notes||""} onChange={e => setApprovalForm(f=>({...f,notes:e.target.value}))} style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} /></div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={saveApproval} style={{ background: "#E8A838", color: "#0A0A0A", border: "none", padding: "10px 24px", borderRadius: "4px", fontWeight: 700, cursor: "pointer", flex: 1 }}>Save</button>
              <button onClick={() => setShowApprovalForm(false)} style={{ background: "#1a1a1a", color: "#F5F5F0", border: "1px solid #333", padding: "10px 24px", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
