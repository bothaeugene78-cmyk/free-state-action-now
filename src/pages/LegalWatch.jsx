import { useState, useEffect } from "react";
import { LegalDevelopment } from "../api/entities";

const DOC_TYPE_LABELS = {
  court_judgment: "Court Judgment",
  statute: "Statute",
  regulation: "Regulation",
  ag_report: "AG Report",
  treasury_circular: "Treasury Circular",
  parliamentary_committee_report: "Parliamentary Report",
  ministerial_directive: "Ministerial Directive",
};

const DOC_TYPE_COLORS = {
  court_judgment: "#7c3aed",
  statute: "#1d4ed8",
  regulation: "#0891b2",
  ag_report: "#dc2626",
  treasury_circular: "#d97706",
  parliamentary_committee_report: "#059669",
  ministerial_directive: "#E8A838",
};

export default function LegalWatch() {
  const [items, setItems] = useState([]);
  const [filterSource, setFilterSource] = useState("");
  const [filterType, setFilterType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LegalDevelopment.filter({ curationStatus: "featured" }).then(data => {
      setItems(data.sort((a,b) => new Date(b.documentDate) - new Date(a.documentDate)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = items.filter(i => {
    const matchSource = !filterSource || i.source === filterSource;
    const matchType = !filterType || i.documentType === filterType;
    const matchDate = !dateFrom || i.documentDate >= dateFrom;
    return matchSource && matchType && matchDate;
  });

  const grouped = {};
  filtered.forEach(item => {
    const k = item.documentType || "other";
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(item);
  });

  const sources = [...new Set(items.map(i => i.source))].sort();

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ color: "#F5F5F0", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Legal Watch</h1>
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: "4px", padding: "10px 14px", fontSize: "12px", color: "#555", marginBottom: "28px", lineHeight: 1.6 }}>
        ℹ Legal Watch curates publicly-published court judgments, statutes, regulations, and oversight reports relevant to Free State municipal accountability. Items are not legal advice. Consult an admitted attorney for case-specific guidance.
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "8px 12px", fontSize: "13px" }}>
          <option value="">All Sources</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "8px 12px", fontSize: "13px" }}>
          <option value="">All Document Types</option>
          {Object.entries(DOC_TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "8px 12px", fontSize: "13px" }} />
        <div style={{ marginLeft: "auto", color: "#555", fontSize: "13px", alignSelf: "center" }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</div>
      </div>

      {loading ? (
        <div style={{ color: "#444", textAlign: "center", padding: "80px" }}>Loading legal developments...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#444", textAlign: "center", padding: "80px", border: "1px dashed #222", borderRadius: "8px" }}>
          No featured legal items yet. The SAFLII monitor runs daily at 06:00.
        </div>
      ) : (
        Object.entries(grouped).map(([type, typeItems]) => (
          <div key={type} style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px", borderLeft: `3px solid ${DOC_TYPE_COLORS[type] || "#E8A838"}`, paddingLeft: "10px" }}>
              {DOC_TYPE_LABELS[type] || type.replace(/_/g," ")} ({typeItems.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {typeItems.map(item => (
                <div key={item.id} style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "20px 24px" }}>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ background: DOC_TYPE_COLORS[item.documentType]+"22", color: DOC_TYPE_COLORS[item.documentType] || "#888", border: `1px solid ${DOC_TYPE_COLORS[item.documentType]||"#888"}44`, padding: "2px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em" }}>
                      {item.source}
                    </span>
                    <span style={{ color: "#555", fontSize: "11px" }}>{item.documentDate}</span>
                    {item.applicableStatutes && <span style={{ color: "#444", fontSize: "11px" }}>📋 {item.applicableStatutes}</span>}
                  </div>
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{ color: "#F5F5F0", fontWeight: 700, fontSize: "15px", lineHeight: 1.4, marginBottom: "10px" }}>{item.title}</div>
                  </a>
                  {item.summary && <div style={{ color: "#777", fontSize: "13px", lineHeight: 1.6, marginBottom: "10px" }}>{item.summary}</div>}
                  {item.keyHoldings && (
                    <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "10px", marginTop: "10px" }}>
                      <div style={{ color: "#555", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "6px" }}>KEY HOLDINGS</div>
                      <div style={{ color: "#666", fontSize: "12px", lineHeight: 1.6 }}>{item.keyHoldings}</div>
                    </div>
                  )}
                  {item.relevanceToFreeState && (
                    <div style={{ background: "#E8A83811", border: "1px solid #E8A83833", borderRadius: "4px", padding: "8px 12px", marginTop: "10px" }}>
                      <div style={{ color: "#E8A838", fontSize: "11px", fontWeight: 700, marginBottom: "2px" }}>FREE STATE RELEVANCE</div>
                      <div style={{ color: "#888", fontSize: "12px" }}>{item.relevanceToFreeState}</div>
                    </div>
                  )}
                  <div style={{ marginTop: "12px" }}>
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#E8A838", fontSize: "12px", fontWeight: 600 }}>Read full document →</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
