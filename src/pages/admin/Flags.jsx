import { useState, useEffect, useContext } from "react";
import { ModerationFlag } from "../../api/entities";
import { UserContext } from "../../App";
import AdminLayout from "./AdminLayout";

const RESOLUTIONS = ["no_action","content_hidden","content_removed","user_warned","user_banned"];

export default function Flags() {
  const { user } = useContext(UserContext);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState({});
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    ModerationFlag.filter({ resolved: false }).then(f => {
      setFlags(f.sort((a,b) => new Date(a.created_date) - new Date(b.created_date)));
      setLoading(false);
    });
  }, []);

  const resolve = async (flag) => {
    if (!resolution[flag.id]) return alert("Select a resolution.");
    setProcessing(p => ({ ...p, [flag.id]: true }));
    await ModerationFlag.update(flag.id, { resolved: true, resolvedByUserId: user.id, resolvedAt: new Date().toISOString(), resolution: resolution[flag.id] });
    setFlags(f => f.filter(x => x.id !== flag.id));
    setProcessing(p => ({ ...p, [flag.id]: false }));
  };

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ color: "#F5F5F0", fontSize: "22px", fontWeight: 800, margin: 0 }}>Moderation Flags</h1>
        <div style={{ background: "#dc262222", color: "#dc2626", border: "1px solid #dc262244", padding: "6px 16px", borderRadius: "4px", fontWeight: 700, fontSize: "14px" }}>{flags.length} open</div>
      </div>

      {loading ? <div style={{ color: "#444", textAlign: "center", padding: "60px" }}>Loading...</div>
      : flags.length === 0 ? <div style={{ color: "#444", textAlign: "center", padding: "60px", border: "1px dashed #222", borderRadius: "8px" }}>No open flags. ✓</div>
      : flags.map(f => (
        <div key={f.id} style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "16px 20px", marginBottom: "10px" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "center" }}>
            <span style={{ background: "#dc262222", color: "#dc2626", border: "1px solid #dc262244", padding: "2px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700 }}>{f.targetType?.toUpperCase()}</span>
            <span style={{ background: "#d9770622", color: "#d97706", border: "1px solid #d9770644", padding: "2px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 700 }}>{f.reason?.replace(/_/g," ").toUpperCase()}</span>
            <span style={{ color: "#444", fontSize: "11px", marginLeft: "auto" }}>{new Date(f.created_date).toLocaleDateString("en-ZA")}</span>
          </div>
          <div style={{ color: "#888", fontSize: "12px", marginBottom: "10px" }}>Target ID: <span style={{ fontFamily: "monospace", color: "#666" }}>{f.targetId}</span></div>
          {f.notes && <div style={{ color: "#666", fontSize: "12px", marginBottom: "10px" }}>{f.notes}</div>}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select value={resolution[f.id]||""} onChange={e => setResolution(r=>({...r,[f.id]:e.target.value}))} style={{ background: "#0A0A0A", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "7px 10px", fontSize: "12px" }}>
              <option value="">Select resolution...</option>
              {RESOLUTIONS.map(r => <option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
            </select>
            <button onClick={() => resolve(f)} disabled={processing[f.id] || !resolution[f.id]} style={{ background: "#05996922", color: "#059669", border: "1px solid #05996944", padding: "7px 14px", borderRadius: "4px", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}>Resolve</button>
          </div>
        </div>
      ))}
    </AdminLayout>
  );
}
