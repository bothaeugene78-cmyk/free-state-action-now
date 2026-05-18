import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { Report, EvidenceItem, EscalationEvent, Comment, Vote, ModerationFlag } from "../api/entities";
import { CategoryBadge, StatusBadge, EscalationBadge } from "../components/Badges";
import { UserContext } from "../App";

export default function ReportDetail() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const [report, setReport] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [events, setEvents] = useState([]);
  const [comments, setComments] = useState([]);
  const [userVote, setUserVote] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      Report.get(id),
      EvidenceItem.filter({ reportId: id }),
      EscalationEvent.filter({ reportId: id }),
      Comment.filter({ reportId: id, status: "active" }),
    ]).then(([r, ev, esc, com]) => {
      setReport(r);
      setEvidence(ev);
      setEvents(esc.sort((a, b) => new Date(a.eventDate || a.created_date) - new Date(b.eventDate || b.created_date)));
      setComments(com.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      setLoading(false);
    }).catch(() => setLoading(false));

    if (user) {
      Vote.filter({ reportId: id }).then(votes => {
        const mine = votes.find(v => v.created_by === user.id);
        setUserVote(mine || null);
      });
    }
  }, [id, user]);

  const handleVote = async () => {
    if (!user) return alert("Please sign in to vote.");
    if (userVote) return;
    try {
      await Vote.create({ reportId: id, voteType: "support" });
      await Report.update(id, { voteCount: (report.voteCount || 0) + 1 });
      setUserVote(true);
      setReport(r => ({ ...r, voteCount: (r.voteCount || 0) + 1 }));
    } catch (e) { alert("Could not record vote."); }
  };

  const handleComment = async () => {
    if (!user) return alert("Please sign in to comment.");
    if (!newComment.trim() || newComment.length < 5) return;
    setSubmitting(true);
    try {
      const c = await Comment.create({ reportId: id, body: newComment.trim(), authorDisplayName: user.full_name || user.email?.split("@")[0] || "Resident", status: "active" });
      setComments(prev => [...prev, c]);
      await Report.update(id, { commentCount: (report.commentCount || 0) + 1 });
      setReport(r => ({ ...r, commentCount: (r.commentCount || 0) + 1 }));
      setNewComment("");
    } catch (e) { alert("Could not post comment."); }
    setSubmitting(false);
  };

  const handleFlag = async () => {
    if (!user || !flagReason) return;
    try {
      await ModerationFlag.create({ targetType: "report", targetId: id, reason: flagReason, notes: "" });
      setShowFlagModal(false);
      alert("Report flagged for curator review.");
    } catch (e) { alert("Could not submit flag."); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={{ color: "#444", textAlign: "center", padding: "100px", background: "#0A0A0A", minHeight: "60vh" }}>Loading report...</div>;
  if (!report) return <div style={{ color: "#dc2626", textAlign: "center", padding: "100px", background: "#0A0A0A", minHeight: "60vh" }}>Report not found.</div>;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Breadcrumb */}
      <div style={{ color: "#555", fontSize: "13px", marginBottom: "24px" }}>
        <Link to="/reports" style={{ color: "#555", textDecoration: "none" }}>Reports</Link> <span style={{ color: "#333" }}>›</span> {report.title?.slice(0, 40)}...
      </div>

      {/* Header */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
        <CategoryBadge category={report.category} />
        <StatusBadge status={report.status} />
        <EscalationBadge stage={report.escalationStage} />
      </div>

      <h1 style={{ color: "#F5F5F0", fontSize: "28px", fontWeight: 800, lineHeight: 1.3, marginBottom: "12px" }}>{report.title}</h1>

      <div style={{ display: "flex", gap: "20px", color: "#555", fontSize: "13px", marginBottom: "28px", flexWrap: "wrap" }}>
        <span>📍 {report.townOrWard}, <Link to={`/directory?muni=${report.municipalityId}`} style={{ color: "#E8A838", textDecoration: "none" }}>{report.municipalityName}</Link></span>
        <span>📅 Incident: {report.incidentDate}</span>
        <span>🕐 Submitted: {new Date(report.created_date).toLocaleDateString("en-ZA")}</span>
        {report.authorDisplayName && <span>👤 {report.authorDisplayName}</span>}
      </div>

      {report.latitude && report.longitude && (
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "12px 16px", marginBottom: "20px", fontSize: "12px", color: "#666" }}>
          🗺️ GPS: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
          <a href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}&zoom=15`} target="_blank" rel="noopener noreferrer" style={{ color: "#E8A838", marginLeft: "12px" }}>View on map →</a>
        </div>
      )}

      {/* Body */}
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "24px", marginBottom: "28px" }}>
        <div style={{ color: "#F5F5F0", fontSize: "15px", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{report.body}</div>
      </div>

      {/* Evidence */}
      {evidence.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px", borderLeft: "3px solid #E8A838", paddingLeft: "10px" }}>
            Evidence ({evidence.length} item{evidence.length !== 1 ? "s" : ""})
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "12px" }}>
            {evidence.map(ev => (
              <div key={ev.id} style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", overflow: "hidden" }}>
                {ev.fileType === "photo" && ev.fileUrl && (
                  <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer">
                    <img src={ev.fileUrl} alt="Evidence" style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
                  </a>
                )}
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ color: "#888", fontSize: "10px", lineHeight: 1.7 }}>
                    {ev.exifCaptureDateTime && <div>📷 {ev.exifCaptureDateTime}</div>}
                    {ev.exifDeviceMake && <div>📱 {ev.exifDeviceMake} {ev.exifDeviceModel}</div>}
                    {ev.exifGpsLatitude && <div>🗺️ {ev.exifGpsLatitude?.toFixed(4)}, {ev.exifGpsLongitude?.toFixed(4)}</div>}
                    {ev.locationDiscrepancy && <div style={{ color: "#dc2626", fontWeight: 600 }}>⚠ GPS discrepancy flagged</div>}
                  </div>
                  {ev.sha256Hash && (
                    <div style={{ marginTop: "8px", borderTop: "1px solid #1a1a1a", paddingTop: "8px" }}>
                      <div style={{ color: "#444", fontSize: "9px", letterSpacing: "0.06em", marginBottom: "2px" }}>SHA-256 INTEGRITY HASH</div>
                      <div style={{ color: "#555", fontSize: "9px", fontFamily: "monospace", wordBreak: "break-all" }}>{ev.sha256Hash}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escalation Log */}
      {events.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px", borderLeft: "3px solid #E8A838", paddingLeft: "10px" }}>
            Escalation Log
          </h2>
          <div style={{ position: "relative", paddingLeft: "20px", borderLeft: "2px solid #222" }}>
            {events.map(ev => (
              <div key={ev.id} style={{ marginBottom: "20px", position: "relative" }}>
                <div style={{ position: "absolute", left: "-25px", top: "4px", width: "8px", height: "8px", borderRadius: "50%", background: "#E8A838" }} />
                <div style={{ color: "#E8A838", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em" }}>
                  {ev.eventType?.replace(/_/g," ").toUpperCase()}
                  <span style={{ color: "#444", fontWeight: 400, marginLeft: "10px" }}>{new Date(ev.eventDate || ev.created_date).toLocaleDateString("en-ZA")}</span>
                </div>
                {ev.description && <div style={{ color: "#888", fontSize: "13px", marginTop: "4px", lineHeight: 1.5 }}>{ev.description}</div>}
                {ev.actorName && <div style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>By: {ev.actorName}</div>}
                {ev.responseDeadline && <div style={{ color: "#d97706", fontSize: "11px", marginTop: "4px" }}>Response deadline: {ev.responseDeadline}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vote + Share */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "28px", padding: "16px", background: "#111", border: "1px solid #222", borderRadius: "6px", flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={handleVote} disabled={!!userVote} style={{ background: userVote ? "#1a2a1a" : "#E8A838", color: userVote ? "#059669" : "#0A0A0A", border: "none", padding: "10px 20px", borderRadius: "4px", fontWeight: 700, fontSize: "13px", cursor: userVote ? "default" : "pointer" }}>
          {userVote ? "✓ Supported" : `👍 Support This Report (${report.voteCount || 0})`}
        </button>
        <button onClick={copyLink} style={{ background: "#1a1a1a", color: copied ? "#059669" : "#F5F5F0", border: "1px solid #333", padding: "10px 16px", borderRadius: "4px", fontSize: "13px", cursor: "pointer" }}>
          {copied ? "✓ Copied!" : "🔗 Copy Link"}
        </button>
        <button onClick={() => setShowFlagModal(true)} style={{ background: "transparent", color: "#555", border: "1px solid #222", padding: "10px 16px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", marginLeft: "auto" }}>
          🚩 Flag this report
        </button>
      </div>

      {/* Comments */}
      <div>
        <h2 style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px", borderLeft: "3px solid #E8A838", paddingLeft: "10px" }}>
          Comments ({comments.length})
        </h2>
        {comments.map(c => (
          <div key={c.id} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "14px 16px", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#E8A838", fontSize: "12px", fontWeight: 600 }}>{c.authorDisplayName || "Resident"}</span>
              <span style={{ color: "#444", fontSize: "11px" }}>{new Date(c.created_date).toLocaleDateString("en-ZA")}</span>
            </div>
            <div style={{ color: "#CCC", fontSize: "14px", lineHeight: 1.6 }}>{c.body}</div>
          </div>
        ))}
        {user ? (
          <div style={{ marginTop: "20px" }}>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment... (min 5 characters)"
              style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "12px", fontSize: "14px", minHeight: "80px", resize: "vertical", boxSizing: "border-box" }}
            />
            <button onClick={handleComment} disabled={submitting || newComment.length < 5} style={{ marginTop: "8px", background: newComment.length >= 5 ? "#E8A838" : "#333", color: newComment.length >= 5 ? "#0A0A0A" : "#555", border: "none", padding: "10px 20px", borderRadius: "4px", fontWeight: 700, fontSize: "13px", cursor: newComment.length >= 5 ? "pointer" : "default" }}>
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        ) : (
          <div style={{ color: "#555", fontSize: "13px", padding: "16px", border: "1px dashed #222", borderRadius: "6px", textAlign: "center" }}>
            <Link to="/login" style={{ color: "#E8A838" }}>Sign in</Link> to comment.
          </div>
        )}
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "32px", maxWidth: "400px", width: "90%" }}>
            <h3 style={{ color: "#F5F5F0", marginBottom: "16px" }}>Flag this report</h3>
            <select value={flagReason} onChange={e => setFlagReason(e.target.value)} style={{ width: "100%", background: "#0A0A0A", color: "#F5F5F0", border: "1px solid #333", borderRadius: "4px", padding: "10px", marginBottom: "16px" }}>
              <option value="">Select reason...</option>
              {["spam","defamation","personal_info","off_topic","duplicate","other"].map(r => (
                <option key={r} value={r}>{r.replace(/_/g," ")}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleFlag} disabled={!flagReason} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "4px", fontWeight: 700, cursor: flagReason ? "pointer" : "default", flex: 1 }}>Submit Flag</button>
              <button onClick={() => setShowFlagModal(false)} style={{ background: "#222", color: "#F5F5F0", border: "none", padding: "10px 20px", borderRadius: "4px", cursor: "pointer", flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
