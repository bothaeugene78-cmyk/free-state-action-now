import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Municipality, OfficialContact, ProvincialContact, EmergencyContact } from "../api/entities";
import { AuditBadge, Section139Badge } from "../components/Badges";

export default function Directory() {
  const [tab, setTab] = useState("municipalities");
  const [municipalities, setMunicipalities] = useState([]);
  const [officials, setOfficials] = useState([]);
  const [provincial, setProvincial] = useState([]);
  const [emergency, setEmergency] = useState([]);
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const muniParam = searchParams.get("muni");
    if (muniParam) setExpanded({ [muniParam]: true });

    Promise.all([
      Municipality.list(),
      OfficialContact.filter({ isCurrent: true }),
      ProvincialContact.filter({ isCurrent: true }),
      EmergencyContact.list(),
    ]).then(([m, o, p, e]) => {
      setMunicipalities(m.sort((a,b) => a.name.localeCompare(b.name)));
      setOfficials(o);
      setProvincial(p.sort((a,b) => (a.orderIndex||0)-(b.orderIndex||0)));
      setEmergency(e.sort((a,b) => (a.orderIndex||0)-(b.orderIndex||0)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const districts = [...new Set(municipalities.map(m => m.district))].sort();

  const filteredMunis = municipalities.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.towns?.toLowerCase().includes(q);
    const matchDistrict = !districtFilter || m.district === districtFilter;
    return matchSearch && matchDistrict;
  });

  const tabStyle = (t) => ({
    padding: "10px 20px", border: "none", background: tab === t ? "#E8A838" : "transparent",
    color: tab === t ? "#0A0A0A" : "#888", fontWeight: tab === t ? 700 : 400,
    cursor: "pointer", fontSize: "13px", borderRadius: "4px", letterSpacing: "0.04em",
  });

  const roleLabel = { mayor:"Mayor", municipal_manager:"Municipal Manager", cfo:"CFO", speaker:"Speaker", chief_whip:"Chief Whip", ward_councillor:"Ward Councillor", accounting_officer:"Accounting Officer", other:"Official" };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ color: "#F5F5F0", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Directory</h1>
      <p style={{ color: "#555", fontSize: "12px", marginBottom: "24px", background: "#111", border: "1px solid #222", borderRadius: "4px", padding: "10px 14px" }}>
        ℹ Contact details are curated from publicly-available sources and verified on the dates shown. If you find an error, please <a href="/contact" style={{ color: "#E8A838" }}>flag it via the contact form</a>.
      </p>

      <div style={{ display: "flex", gap: "4px", marginBottom: "28px", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "4px", width: "fit-content" }}>
        <button onClick={() => setTab("municipalities")} style={tabStyle("municipalities")}>Municipalities</button>
        <button onClick={() => setTab("provincial")} style={tabStyle("provincial")}>Provincial & National</button>
        <button onClick={() => setTab("emergency")} style={tabStyle("emergency")}>Emergency</button>
      </div>

      {/* Municipalities Tab */}
      {tab === "municipalities" && (
        <div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search municipality or town..." style={{ flex: 1, minWidth: "200px", background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "10px 14px", fontSize: "14px" }} />
            <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} style={{ background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "10px 14px", fontSize: "13px" }}>
              <option value="">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {loading ? <div style={{ color: "#444", padding: "60px", textAlign: "center" }}>Loading...</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredMunis.map(m => {
                const muniOfficials = officials.filter(o => o.municipalityId === m.id);
                const isOpen = expanded[m.id];
                return (
                  <div key={m.id} style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", overflow: "hidden" }}>
                    <div onClick={() => setExpanded(e => ({ ...e, [m.id]: !e[m.id] }))} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "6px" }}>
                          <span style={{ color: "#F5F5F0", fontWeight: 700, fontSize: "15px" }}>{m.name}</span>
                          <span style={{ color: "#555", fontSize: "11px", background: "#1a1a1a", padding: "1px 6px", borderRadius: "3px" }}>{m.code}</span>
                          <AuditBadge outcome={m.currentAuditOutcome} />
                          <Section139Badge status={m.section139Status} />
                        </div>
                        <div style={{ color: "#666", fontSize: "12px" }}>{m.district} · {m.towns}</div>
                      </div>
                      <span style={{ color: "#E8A838", fontSize: "16px", marginLeft: "16px" }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: "1px solid #1a1a1a", padding: "16px 20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "8px", marginBottom: "16px" }}>
                          {m.mainOfficeAddress && <InfoRow label="Address" value={m.mainOfficeAddress} />}
                          {m.generalPhone && <InfoRow label="Phone" value={m.generalPhone} isPhone />}
                          {m.generalEmail && <InfoRow label="Email" value={m.generalEmail} isEmail />}
                          {m.website && <InfoRow label="Website" value={m.website} isLink />}
                          {m.paiaManualUrl && <InfoRow label="PAIA Manual" value="Download" isLink href={m.paiaManualUrl} />}
                          {m.eskomDebtRands && <InfoRow label="Eskom Debt" value={`R${(m.eskomDebtRands/1e9).toFixed(1)}bn`} warn />}
                          {m.waterBoardDebtRands && <InfoRow label="Water Board Debt" value={`R${(m.waterBoardDebtRands/1e6).toFixed(0)}m`} warn />}
                        </div>
                        {muniOfficials.length > 0 ? (
                          <div>
                            <div style={{ color: "#666", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Verified Officials</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "8px" }}>
                              {muniOfficials.map(o => (
                                <div key={o.id} style={{ background: "#0A0A0A", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "12px" }}>
                                  <div style={{ color: "#E8A838", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em" }}>{roleLabel[o.role] || o.role}</div>
                                  <div style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 600, marginTop: "4px" }}>{o.title ? `${o.title} ` : ""}{o.fullName}</div>
                                  {o.directPhone && <div style={{ color: "#666", fontSize: "11px", marginTop: "4px" }}>📞 {o.directPhone}</div>}
                                  {o.directEmail && <div style={{ color: "#666", fontSize: "11px" }}>✉ {o.directEmail}</div>}
                                  {o.sourceUrl && <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#444", fontSize: "10px", display: "block", marginTop: "6px" }}>Source verified {o.sourceDate} →</a>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: "#444", fontSize: "12px", fontStyle: "italic" }}>No verified officials on file yet. Officials must be sourced and verified by curators.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Provincial Tab */}
      {tab === "provincial" && (
        <div>
          {["premier","mec","oversight_constitutional","oversight_national","oversight_provincial_department"].map(cat => {
            const items = provincial.filter(p => p.category === cat);
            if (!items.length) return null;
            const catLabel = { premier:"Premier", mec:"MECs", oversight_constitutional:"Constitutional Oversight", oversight_national:"National Departments", oversight_provincial_department:"Provincial Departments" }[cat];
            return (
              <div key={cat} style={{ marginBottom: "32px" }}>
                <h3 style={{ color: "#E8A838", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px", borderLeft: "3px solid #E8A838", paddingLeft: "10px" }}>{catLabel}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "10px" }}>
                  {items.map(p => (
                    <div key={p.id} style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "16px" }}>
                      <div style={{ color: "#E8A838", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>{p.portfolio}</div>
                      <div style={{ color: "#F5F5F0", fontWeight: 700, fontSize: "14px" }}>{p.title ? `${p.title} ` : ""}{p.fullName}</div>
                      {p.phone && <div style={{ color: "#666", fontSize: "12px", marginTop: "6px" }}>📞 {p.phone}</div>}
                      {p.email && <div style={{ color: "#666", fontSize: "12px" }}>✉ {p.email}</div>}
                      {p.address && <div style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>📍 {p.address}</div>}
                      {p.website && <a href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noopener noreferrer" style={{ color: "#444", fontSize: "11px", display: "block", marginTop: "6px" }}>🌐 {p.website}</a>}
                      {p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#333", fontSize: "10px", display: "block", marginTop: "8px" }}>Source verified {p.sourceDate} →</a>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {provincial.length === 0 && !loading && (
            <div style={{ color: "#444", textAlign: "center", padding: "60px", border: "1px dashed #222", borderRadius: "8px" }}>Provincial contacts pending curation from freestate.gov.za</div>
          )}
        </div>
      )}

      {/* Emergency Tab */}
      {tab === "emergency" && (
        <div>
          {["emergency","helpline","anti_corruption","station"].map(cat => {
            const items = emergency.filter(e => e.category === cat);
            if (!items.length) return null;
            const catLabel = { emergency:"🚨 Emergency Numbers", helpline:"📞 Helplines", anti_corruption:"🛡 Anti-Corruption", station:"🏛 Police Stations" }[cat];
            return (
              <div key={cat} style={{ marginBottom: "32px" }}>
                <h3 style={{ color: "#F5F5F0", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "12px" }}>{catLabel}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "8px" }}>
                  {items.map(e => (
                    <div key={e.id} style={{ background: "#111", border: cat==="emergency" ? "1px solid #dc262644" : "1px solid #222", borderRadius: "6px", padding: "14px 16px", display: "flex", gap: "14px", alignItems: "center" }}>
                      <a href={`tel:${e.number.replace(/\s/g,"")}`} style={{ textDecoration: "none" }}>
                        <div style={{ color: cat==="emergency" ? "#dc2626" : "#E8A838", fontWeight: 900, fontSize: "22px", minWidth: "80px" }}>{e.number}</div>
                      </a>
                      <div>
                        <div style={{ color: "#F5F5F0", fontWeight: 600, fontSize: "13px" }}>{e.service}</div>
                        <div style={{ color: "#555", fontSize: "11px", marginTop: "2px", lineHeight: 1.4 }}>{e.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, isPhone, isEmail, isLink, href, warn }) {
  return (
    <div style={{ fontSize: "12px" }}>
      <span style={{ color: "#555", fontWeight: 600 }}>{label}: </span>
      {isPhone ? <a href={`tel:${value.replace(/\s/g,"")}`} style={{ color: "#E8A838", textDecoration: "none" }}>{value}</a>
       : isEmail ? <a href={`mailto:${value}`} style={{ color: "#E8A838", textDecoration: "none" }}>{value}</a>
       : isLink ? <a href={href || (value.startsWith("http") ? value : `https://${value}`)} target="_blank" rel="noopener noreferrer" style={{ color: "#E8A838", textDecoration: "none" }}>{value}</a>
       : <span style={{ color: warn ? "#d97706" : "#888" }}>{value}</span>}
    </div>
  );
}
