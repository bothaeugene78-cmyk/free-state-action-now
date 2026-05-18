import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Report, Municipality } from "../api/entities";
import { CategoryBadge, EscalationBadge, StatusBadge, CATEGORY_LABELS } from "../components/Badges";

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recent");

  const filterMuni = searchParams.get("municipality") || "";
  const filterCat = searchParams.get("category") || "";
  const filterStage = searchParams.get("stage") || "";

  useEffect(() => {
    Municipality.list().then(setMunicipalities);
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = {};
    if (filterMuni) query.municipalityId = filterMuni;
    if (filterCat) query.category = filterCat;
    if (filterStage) query.escalationStage = filterStage;

    Promise.all([
      Report.filter({ ...query, status: "approved" }),
      Report.filter({ ...query, status: "escalated" }),
      Report.filter({ ...query, status: "resolved" }),
    ]).then(([a, e, r]) => {
      let all = [...a, ...e, ...r];
      if (sortBy === "recent") all.sort((x, y) => new Date(y.created_date) - new Date(x.created_date));
      if (sortBy === "supported") all.sort((x, y) => (y.voteCount || 0) - (x.voteCount || 0));
      if (sortBy === "comments") all.sort((x, y) => (y.commentCount || 0) - (x.commentCount || 0));
      if (sortBy === "pending") all.sort((x, y) => new Date(x.created_date) - new Date(y.created_date));
      setReports(all);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filterMuni, filterCat, filterStage, sortBy]);

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    setSearchParams(p);
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const d = Math.floor(diff/86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 30) return `${d} days ago`;
    return new Date(date).toLocaleDateString("en-ZA");
  };

  const selectStyle = { background: "#111", color: "#F5F5F0", border: "1px solid #333", borderRadius: "4px", padding: "8px 12px", fontSize: "13px", cursor: "pointer" };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ color: "#F5F5F0", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Reports</h1>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "32px" }}>Community-submitted, curator-verified evidence of service delivery failures.</p>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "28px", padding: "16px", background: "#111", border: "1px solid #222", borderRadius: "6px" }}>
        <select style={selectStyle} value={filterMuni} onChange={e => setFilter("municipality", e.target.value)}>
          <option value="">All Municipalities</option>
          {municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select style={selectStyle} value={filterCat} onChange={e => setFilter("category", e.target.value)}>
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select style={selectStyle} value={filterStage} onChange={e => setFilter("stage", e.target.value)}>
          <option value="">All Stages</option>
          {["notice_drafted","notice_sent","response_received","no_response","mandamus_initiated"].map(s => (
            <option key={s} value={s}>{s.replace(/_/g," ")}</option>
          ))}
        </select>
        <select style={selectStyle} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="recent">Most Recent</option>
          <option value="supported">Most Supported</option>
          <option value="comments">Most Comments</option>
          <option value="pending">Longest Pending</option>
        </select>
        <div style={{ marginLeft: "auto", color: "#555", fontSize: "13px", alignSelf: "center" }}>
          {loading ? "Loading..." : `${reports.length} report${reports.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {loading ? (
        <div style={{ color: "#444", textAlign: "center", padding: "80px" }}>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div style={{ color: "#444", textAlign: "center", padding: "80px", border: "1px dashed #222", borderRadius: "8px" }}>
          No reports found for the selected filters.<br />
          <Link to="/submit" style={{ color: "#E8A838", marginTop: "16px", display: "inline-block" }}>Submit the first one →</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reports.map(r => (
            <Link key={r.id} to={`/reports/${r.id}`} style={{ textDecoration: "none", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "20px 24px", display: "block" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#E8A838"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#222"}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px", alignItems: "center" }}>
                <CategoryBadge category={r.category} small />
                <EscalationBadge stage={r.escalationStage} />
                {r.status === "resolved" && <StatusBadge status="resolved" />}
              </div>
              <div style={{ color: "#F5F5F0", fontSize: "17px", fontWeight: 700, marginBottom: "6px" }}>{r.title}</div>
              <div style={{ color: "#777", fontSize: "12px", marginBottom: "10px" }}>
                {r.authorDisplayName ? `${r.authorDisplayName} · ` : ""}📍 {r.townOrWard}, {r.municipalityName}
              </div>
              <div style={{ color: "#666", fontSize: "13px", lineHeight: 1.6, marginBottom: "14px" }}>
                {r.body?.slice(0, 300)}{r.body?.length > 300 ? "…" : ""}
              </div>
              <div style={{ display: "flex", gap: "16px", color: "#555", fontSize: "12px", flexWrap: "wrap" }}>
                <span>👍 {r.voteCount || 0} support</span>
                <span>💬 {r.commentCount || 0} comments</span>
                <span>📷 {r.evidenceItemCount || 0} evidence items</span>
                <span style={{ marginLeft: "auto", color: "#444" }}>Submitted {timeAgo(r.created_date)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
