import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Report, NewsItem, LegalDevelopment, Municipality } from "../api/entities";
import { CategoryBadge, EscalationBadge, CATEGORY_LABELS, CATEGORY_ICONS } from "../components/Badges";

export default function Home() {
  const [stats, setStats] = useState({ reports: 0, municipalities: 0, notices: 0, responses: 0 });
  const [latestReports, setLatestReports] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [featuredLegal, setFeaturedLegal] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      Report.filter({ status: "approved" }),
      Report.filter({ status: "escalated" }),
      Report.filter({ status: "resolved" }),
      NewsItem.filter({ curationStatus: "featured" }),
      LegalDevelopment.filter({ curationStatus: "featured" }),
      Municipality.list(),
    ]).then(([approved, escalated, resolved, news, legal, munis]) => {
      const allPublic = [...approved, ...escalated, ...resolved];
      const notices = allPublic.filter(r => r.escalationStage !== "none").length;
      const responses = allPublic.filter(r => r.escalationStage === "response_received").length;
      setStats({ reports: allPublic.length, municipalities: munis.length, notices, responses });

      const counts = {};
      allPublic.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
      setCategoryCounts(counts);

      const sorted = [...approved, ...escalated].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10);
      setLatestReports(sorted);
      setFeaturedNews(news.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate)).slice(0, 3));
      setFeaturedLegal(legal.sort((a, b) => new Date(b.documentDate) - new Date(a.documentDate)).slice(0, 3));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categories = ["roads_transport","water_sanitation","electricity","waste_refuse","housing","health_clinics","safety_policing","tourism_heritage_impact"];

  return (
    <div>
      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg, #111 0%, #0A0A0A 100%)", borderBottom: "1px solid #222", padding: "100px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, #E8A83811 0%, transparent 70%)", pointerEvents: "none" }} />
        <h1 style={{ fontSize: "clamp(36px,7vw,80px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 16px" }}>
          <span style={{ display: "block", color: "#F5F5F0" }}>YOUR TOWN.</span>
          <span style={{ display: "block", color: "#E8A838" }}>YOUR VOICE.</span>
          <span style={{ display: "block", color: "#F5F5F0" }}>YOUR EVIDENCE.</span>
        </h1>
        <p style={{ color: "#888", fontSize: "clamp(14px,2vw,18px)", maxWidth: "620px", margin: "0 auto 40px", lineHeight: 1.7 }}>
          An evidence platform for Free State residents. Document infrastructure failures with photos, GPS, and timestamps. Build a public record that municipalities cannot ignore.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/submit" style={{ background: "#E8A838", color: "#0A0A0A", textDecoration: "none", padding: "14px 32px", fontWeight: 800, fontSize: "15px", letterSpacing: "0.06em", borderRadius: "4px", textTransform: "uppercase" }}>
            Share Your Report
          </Link>
          <Link to="/reports" style={{ border: "1px solid #444", color: "#F5F5F0", textDecoration: "none", padding: "14px 32px", fontWeight: 600, fontSize: "15px", borderRadius: "4px" }}>
            Browse Reports
          </Link>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: "#111", borderBottom: "1px solid #222", padding: "32px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "24px" }}>
          {[
            { label: "Reports Published", value: stats.reports },
            { label: "Municipalities Covered", value: stats.municipalities },
            { label: "Legal Notices Issued", value: stats.notices },
            { label: "Responses Received", value: stats.responses },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", fontWeight: 900, color: "#E8A838", lineHeight: 1 }}>{loading ? "—" : s.value}</div>
              <div style={{ color: "#666", fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "6px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Grid */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 24px 0" }}>
        <h2 style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "24px", borderLeft: "3px solid #E8A838", paddingLeft: "12px" }}>
          Browse by Category
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "12px" }}>
          {categories.map(cat => (
            <Link key={cat} to={`/reports?category=${cat}`} style={{ textDecoration: "none", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "20px 16px", display: "flex", alignItems: "center", gap: "12px", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#E8A838"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#222"}>
              <span style={{ fontSize: "24px" }}>{CATEGORY_ICONS[cat]}</span>
              <div>
                <div style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 600 }}>{CATEGORY_LABELS[cat]}</div>
                <div style={{ color: "#666", fontSize: "11px", marginTop: "2px" }}>{categoryCounts[cat] || 0} reports</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Reports */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderLeft: "3px solid #E8A838", paddingLeft: "12px", margin: 0 }}>
            Latest Reports
          </h2>
          <Link to="/reports" style={{ color: "#E8A838", textDecoration: "none", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em" }}>VIEW ALL →</Link>
        </div>
        {loading ? (
          <div style={{ color: "#444", textAlign: "center", padding: "60px" }}>Loading reports...</div>
        ) : latestReports.length === 0 ? (
          <div style={{ color: "#444", textAlign: "center", padding: "60px", border: "1px dashed #222", borderRadius: "8px" }}>
            No approved reports yet. Be the first to <Link to="/submit" style={{ color: "#E8A838" }}>submit one</Link>.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {latestReports.map(r => <ReportCard key={r.id} report={r} />)}
          </div>
        )}
      </section>

      {/* Featured News */}
      {featuredNews.length > 0 && (
        <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 24px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderLeft: "3px solid #E8A838", paddingLeft: "12px", margin: 0 }}>Newsroom</h2>
            <Link to="/newsroom" style={{ color: "#E8A838", textDecoration: "none", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em" }}>VIEW ALL →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "12px" }}>
            {featuredNews.map(n => (
              <a key={n.id} href={n.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "20px" }}>
                <div style={{ color: "#E8A838", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "8px" }}>{n.source?.toUpperCase()} · {n.publishedDate}</div>
                <div style={{ color: "#F5F5F0", fontSize: "14px", fontWeight: 600, lineHeight: 1.4, marginBottom: "8px" }}>{n.headline}</div>
                <div style={{ color: "#666", fontSize: "12px", lineHeight: 1.5 }}>{n.summary?.slice(0,150)}{n.summary?.length > 150 ? "…" : ""}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Featured Legal */}
      {featuredLegal.length > 0 && (
        <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 24px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", borderLeft: "3px solid #E8A838", paddingLeft: "12px", margin: 0 }}>Legal Watch</h2>
            <Link to="/legal-watch" style={{ color: "#E8A838", textDecoration: "none", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em" }}>VIEW ALL →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "12px" }}>
            {featuredLegal.map(l => (
              <a key={l.id} href={l.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "20px" }}>
                <div style={{ color: "#E8A838", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "8px" }}>{l.source} · {l.documentDate}</div>
                <div style={{ color: "#F5F5F0", fontSize: "14px", fontWeight: 600, lineHeight: 1.4, marginBottom: "8px" }}>{l.title}</div>
                <div style={{ color: "#666", fontSize: "12px", lineHeight: 1.5 }}>{l.summary?.slice(0,150)}{l.summary?.length > 150 ? "…" : ""}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      <div style={{ height: "80px" }} />
    </div>
  );
}

function ReportCard({ report }) {
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const d = Math.floor(diff/86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 30) return `${d} days ago`;
    return new Date(date).toLocaleDateString("en-ZA");
  };

  return (
    <Link to={`/reports/${report.id}`} style={{ textDecoration: "none", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "20px", display: "block" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#E8A838"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#222"}>
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "10px" }}>
        <CategoryBadge category={report.category} small />
        <EscalationBadge stage={report.escalationStage} />
      </div>
      <div style={{ color: "#F5F5F0", fontSize: "16px", fontWeight: 700, marginBottom: "6px", lineHeight: 1.3 }}>{report.title}</div>
      <div style={{ color: "#888", fontSize: "12px", marginBottom: "10px" }}>
        📍 {report.townOrWard}, {report.municipalityName}
      </div>
      <div style={{ color: "#666", fontSize: "13px", lineHeight: 1.5, marginBottom: "14px" }}>
        {report.body?.slice(0, 200)}{report.body?.length > 200 ? "…" : ""}
      </div>
      <div style={{ display: "flex", gap: "16px", color: "#555", fontSize: "12px" }}>
        <span>👍 {report.voteCount || 0}</span>
        <span>💬 {report.commentCount || 0}</span>
        <span>📷 {report.evidenceItemCount || 0}</span>
        <span style={{ marginLeft: "auto" }}>{timeAgo(report.created_date)}</span>
      </div>
    </Link>
  );
}
