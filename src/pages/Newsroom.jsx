import { useState, useEffect } from "react";
import { NewsItem, Municipality } from "../api/entities";

export default function Newsroom() {
  const [items, setItems] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [filterSource, setFilterSource] = useState("");
  const [filterMuni, setFilterMuni] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      NewsItem.filter({ curationStatus: "featured" }),
      Municipality.list(),
    ]).then(([news, munis]) => {
      setItems(news.sort((a,b) => new Date(b.publishedDate) - new Date(a.publishedDate)));
      setMunicipalities(munis);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sources = [...new Set(items.map(i => i.source))].sort();

  const filtered = items.filter(i => {
    const matchSource = !filterSource || i.source === filterSource;
    const matchMuni = !filterMuni || (i.relatedMunicipalities && i.relatedMunicipalities.includes(filterMuni));
    return matchSource && matchMuni;
  });

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ color: "#F5F5F0", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Newsroom</h1>
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: "4px", padding: "10px 14px", fontSize: "12px", color: "#555", marginBottom: "28px", lineHeight: 1.6 }}>
        ℹ News items are aggregated from public-source RSS feeds and external publications. Free State Action Now does not produce this content and is not responsible for its accuracy. Click through to the original publisher for full articles.
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "8px 12px", fontSize: "13px" }}>
          <option value="">All Sources</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterMuni} onChange={e => setFilterMuni(e.target.value)} style={{ background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "8px 12px", fontSize: "13px" }}>
          <option value="">All Municipalities</option>
          {municipalities.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
        </select>
        <div style={{ marginLeft: "auto", color: "#555", fontSize: "13px", alignSelf: "center" }}>{filtered.length} article{filtered.length !== 1 ? "s" : ""}</div>
      </div>

      {loading ? (
        <div style={{ color: "#444", textAlign: "center", padding: "80px" }}>Loading news...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#444", textAlign: "center", padding: "80px", border: "1px dashed #222", borderRadius: "8px" }}>
          No featured news items yet. The monitor runs every 4 hours — check back soon.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#222", borderRadius: "6px", overflow: "hidden" }}>
          {filtered.map(n => (
            <a key={n.id} href={n.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", background: "#111", padding: "20px 24px", display: "block" }}
              onMouseEnter={e => e.currentTarget.style.background = "#141414"}
              onMouseLeave={e => e.currentTarget.style.background = "#111"}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
                <span style={{ background: "#1a1a1a", color: "#E8A838", padding: "2px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em" }}>{n.source?.toUpperCase()}</span>
                <span style={{ color: "#444", fontSize: "11px" }}>{n.publishedDate}</span>
                {n.relatedMunicipalities && JSON.parse(n.relatedMunicipalities || "[]").map && (
                  JSON.parse(n.relatedMunicipalities).slice(0,3).map(code => (
                    <span key={code} style={{ background: "#1a1a1a", color: "#666", padding: "1px 6px", borderRadius: "3px", fontSize: "10px" }}>{code}</span>
                  ))
                )}
              </div>
              <div style={{ color: "#F5F5F0", fontWeight: 600, fontSize: "15px", lineHeight: 1.4, marginBottom: "8px" }}>{n.headline}</div>
              {n.summary && <div style={{ color: "#666", fontSize: "13px", lineHeight: 1.5 }}>{n.summary.slice(0,200)}{n.summary.length > 200 ? "…" : ""}</div>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
