import { useState, useEffect } from "react";
import { OfficialContact, ProvincialContact, Municipality } from "../../api/entities";
import AdminLayout from "./AdminLayout";

const ROLES = ["mayor","municipal_manager","cfo","speaker","chief_whip","ward_councillor","accounting_officer","other"];
const ROLE_LABELS = { mayor:"Mayor", municipal_manager:"Municipal Manager", cfo:"CFO", speaker:"Speaker", chief_whip:"Chief Whip", ward_councillor:"Ward Councillor", accounting_officer:"Accounting Officer", other:"Other" };

export default function Officials() {
  const [tab, setTab] = useState("municipal");
  const [officials, setOfficials] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([OfficialContact.list(), Municipality.list()]).then(([o, m]) => {
      setOfficials(o.sort((a,b) => a.municipalityName?.localeCompare(b.municipalityName||"")));
      setMunicipalities(m.sort((a,b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });
  }, []);

  const openNew = () => { setForm({ isCurrent: true }); setEditItem(null); setShowForm(true); };
  const openEdit = (o) => { setForm({ ...o }); setEditItem(o); setShowForm(true); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.municipalityId || !form.role || !form.fullName || !form.sourceUrl || !form.sourceDate) return alert("All required fields must be filled.");
    setSaving(true);
    try {
      const muni = municipalities.find(m => m.id === form.municipalityId);
      const data = { ...form, municipalityName: muni?.name || "" };
      if (editItem) {
        await OfficialContact.update(editItem.id, data);
        setOfficials(o => o.map(x => x.id === editItem.id ? { ...x, ...data } : x));
      } else {
        const created = await OfficialContact.create(data);
        setOfficials(o => [...o, created]);
      }
      setShowForm(false);
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const supersede = async (o) => {
    await OfficialContact.update(o.id, { isCurrent: false });
    setOfficials(prev => prev.map(x => x.id === o.id ? { ...x, isCurrent: false } : x));
  };

  const inputStyle = { width: "100%", background: "#0A0A0A", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "10px", fontSize: "13px", boxSizing: "border-box" };
  const labelStyle = { color: "#666", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "4px" };

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ color: "#F5F5F0", fontSize: "22px", fontWeight: 800, margin: 0 }}>Officials Directory</h1>
        <button onClick={openNew} style={{ background: "#E8A838", color: "#0A0A0A", border: "none", padding: "10px 20px", borderRadius: "4px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>+ Add Official</button>
      </div>

      <div style={{ color: "#555", fontSize: "12px", background: "#111", border: "1px solid #dc262644", borderRadius: "4px", padding: "10px 14px", marginBottom: "20px" }}>
        ⚠ Every entry requires a verified public source URL and verification date. No entry without a source. Accuracy is this platform's credibility.
      </div>

      {loading ? <div style={{ color: "#444", textAlign: "center", padding: "60px" }}>Loading...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {officials.map(o => (
            <div key={o.id} style={{ background: "#111", border: o.isCurrent ? "1px solid #222" : "1px solid #1a1a1a", borderRadius: "6px", padding: "14px 18px", opacity: o.isCurrent ? 1 : 0.5, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ color: "#E8A838", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em" }}>{ROLE_LABELS[o.role] || o.role}</span>
                  {!o.isCurrent && <span style={{ background: "#dc262622", color: "#dc2626", fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px" }}>SUPERSEDED</span>}
                </div>
                <div style={{ color: "#F5F5F0", fontWeight: 700, fontSize: "14px" }}>{o.title ? `${o.title} ` : ""}{o.fullName}</div>
                <div style={{ color: "#666", fontSize: "12px", marginTop: "2px" }}>{o.municipalityName}</div>
                {o.directPhone && <div style={{ color: "#555", fontSize: "11px" }}>📞 {o.directPhone}</div>}
                {o.directEmail && <div style={{ color: "#555", fontSize: "11px" }}>✉ {o.directEmail}</div>}
                {o.sourceUrl && <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#333", fontSize: "10px" }}>Source: {o.sourceDate}</a>}
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button onClick={() => openEdit(o)} style={{ background: "#1a1a1a", color: "#888", border: "1px solid #222", padding: "5px 10px", borderRadius: "3px", cursor: "pointer", fontSize: "11px" }}>Edit</button>
                {o.isCurrent && <button onClick={() => supersede(o)} style={{ background: "#dc262222", color: "#dc2626", border: "1px solid #dc262244", padding: "5px 10px", borderRadius: "3px", cursor: "pointer", fontSize: "11px" }}>Supersede</button>}
              </div>
            </div>
          ))}
          {officials.length === 0 && <div style={{ color: "#444", textAlign: "center", padding: "60px", border: "1px dashed #222", borderRadius: "8px" }}>No officials yet. Add the first entry above.</div>}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, overflow: "auto" }}>
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: "8px", padding: "32px", width: "90%", maxWidth: "560px", maxHeight: "90vh", overflow: "auto" }}>
            <h3 style={{ color: "#F5F5F0", marginBottom: "24px" }}>{editItem ? "Edit Official" : "Add Official"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Municipality *</label>
                <select value={form.municipalityId||""} onChange={e => set("municipalityId", e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  {municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Role *</label>
                <select value={form.role||""} onChange={e => set("role", e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              {[["fullName","Full Name *"],["title","Title (e.g. Mr, Ms, Cllr)"],["directPhone","Direct Phone"],["directEmail","Direct Email"],["office","Office / Physical Location"]].map(([k,l]) => (
                <div key={k}><label style={labelStyle}>{l}</label><input value={form[k]||""} onChange={e => set(k, e.target.value)} style={inputStyle} /></div>
              ))}
              <div>
                <label style={labelStyle}>Source URL * (public source confirming this appointment)</label>
                <input value={form.sourceUrl||""} onChange={e => set("sourceUrl", e.target.value)} placeholder="https://..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Source Verification Date *</label>
                <input type="date" value={form.sourceDate||""} onChange={e => set("sourceDate", e.target.value)} style={inputStyle} />
              </div>
              <label style={{ display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isCurrent !== false} onChange={e => set("isCurrent", e.target.checked)} style={{ accentColor: "#E8A838" }} />
                <span style={{ color: "#CCC", fontSize: "13px" }}>Currently in this role</span>
              </label>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button onClick={save} disabled={saving} style={{ background: "#E8A838", color: "#0A0A0A", border: "none", padding: "10px 24px", borderRadius: "4px", fontWeight: 700, cursor: "pointer", flex: 1 }}>{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => setShowForm(false)} style={{ background: "#1a1a1a", color: "#F5F5F0", border: "1px solid #333", padding: "10px 24px", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
