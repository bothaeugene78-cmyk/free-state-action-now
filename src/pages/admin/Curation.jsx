import { useState, useEffect, useContext } from "react";
import { NewsItem, LegalDevelopment } from "../../api/entities";
import { UserContext } from "../../App";
import AdminLayout from "./AdminLayout";

export default function Curation() {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState("news");
  const [newsItems, setNewsItems] = useState([]);
  const [legalItems, setLegalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    Promise.all([
      NewsItem.filter({ curationStatus: "pending_curation" }),
      LegalDevelopment.filter({ curationStatus: "pending_curation" }),
    ]).then(([news, legal]) => {
      setNewsItems(news.sort((a,b) => new Date(b.created_date) - new Date(a.created_date)));
      setLegalItems(legal.sort((a,b) => new Date(b.documentDate) - new Date(a.documentDate)));
      setLoading(false);
    });
  }, []);

  const curateNews = async (item, status) => {
    setProcessing(p => ({ ...p, [item.id]: true }));
    await NewsItem.update(item.id, { curationStatus: status, curatedByUserId: user.id, curatedAt: new Date().toISOString() });
    setNewsItems(items => items.filter(x => x.id !== item.id));
    setProcessing(p => ({ ...p, [item.id]: false }));
  };

  const curateLegal = async (item, status) => {
    setProcessing(p => ({ ...p, [item.id]: true }));
    await LegalDevelopment.update(item.id, { curationStatus: status, curatedByUserId: user.id, curatedAt: new Date().toISOString() });
    setLegalItems(items => items.filter(x => x.id !== item.id));
    setProcessing(p => ({ ...p, [item.id]: false }));
  };

  const tabBtn = (t) => ({ padding: "8px 16px", border: "none", background: activeTab===t?"#E8A838":"transparent", color: activeTab===t?"#0A0A0A":"#888", fontWeight: activeTab===t?700:400, cursor: "pointer", fontSize: "13px", borderRadius: "4px" });
  const btnStyle = (color) => ({ background: color+"22", color, border: `1px solid ${color}44`, padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: 700 });

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ color: "#F5F5F0", fontSize: "22px", fontWeight: 800, margin: 0 }}>Curation Queue</h1>
        <div style={{ display: "flex", gap: "4px", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "4px" }}>
          <button onClick={() => setActiveTab("news")} style={tabBtn("news")}>News ({newsItems.length})</button>
          <button onClick={() => setActiveTab("legal")} style={tabBtn("legal")}>Legal ({legalItems.length})</button>
        </div>
      </div>

      {loading ? <div style={{ color: "#444", textAlign: "center", padding: "60px" }}>Loading...</div> : (
        <>
          {activeTab === "news" && (
            newsItems.length === 0
              ? <div style={{ color: "#444", textAlign: "center", padding: "60px", border: "1px dashed #222", borderRadius: "8px" }}>No news items pending curation.</div>
              : newsItems.map(item => (
                <div key={item.id} style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "18px 20px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ background: "#1a1a1a", color: "#E8A838", padding: "2px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700 }}>{item.source?.toUpperCase()}</span>
                    <span style={{ color: "#555", fontSize: "11px" }}>{item.publishedDate}</span>
                  </div>
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#F5F5F0", fontWeight: 700, fontSize: "14px", textDecoration: "none", display: "block", marginBottom: "6px" }}>{item.headline}</a>
                  {item.summary && <div style={{ color: "#666", fontSize: "12px", marginBottom: "12px", lineHeight: 1.5 }}>{item.summary.slice(0,300)}...</div>}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => curateNews(item, "featured")} disabled={processing[item.id]} style={btnStyle("#059669")}>⭐ Feature</button>
                    <button onClick={() => curateNews(item, "archived")} disabled={processing[item.id]} style={btnStyle("#6b7280")}>📦 Archive</button>
                    <button onClick={() => curateNews(item, "rejected")} disabled={processing[item.id]} style={btnStyle("#dc2626")}>✗ Reject</button>
                  </div>
                </div>
              ))
          )}
          {activeTab === "legal" && (
            legalItems.length === 0
              ? <div style={{ color: "#444", textAlign: "center", padding: "60px", border: "1px dashed #222", borderRadius: "8px" }}>No legal items pending curation.</div>
              : legalItems.map(item => (
                <div key={item.id} style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "18px 20px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ background: "#1a1a1a", color: "#7c3aed", padding: "2px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700 }}>{item.source}</span>
                    <span style={{ color: "#7c3aed", fontSize: "10px", fontWeight: 600 }}>{item.documentType?.replace(/_/g," ").toUpperCase()}</span>
                    <span style={{ color: "#555", fontSize: "11px" }}>{item.documentDate}</span>
                  </div>
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#F5F5F0", fontWeight: 700, fontSize: "14px", textDecoration: "none", display: "block", marginBottom: "6px" }}>{item.title}</a>
                  {item.summary && <div style={{ color: "#666", fontSize: "12px", marginBottom: "12px", lineHeight: 1.5 }}>{item.summary.slice(0,300)}...</div>}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => curateLegal(item, "featured")} disabled={processing[item.id]} style={btnStyle("#059669")}>⭐ Feature</button>
                    <button onClick={() => curateLegal(item, "archived")} disabled={processing[item.id]} style={btnStyle("#6b7280")}>📦 Archive</button>
                    <button onClick={() => curateLegal(item, "rejected")} disabled={processing[item.id]} style={btnStyle("#dc2626")}>✗ Reject</button>
                  </div>
                </div>
              ))
          )}
        </>
      )}
    </AdminLayout>
  );
}
