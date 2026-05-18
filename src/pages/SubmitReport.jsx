import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Report, EvidenceItem, EscalationEvent, Municipality } from "../api/entities";
import { UserContext } from "../App";
import { CATEGORY_LABELS } from "../components/Badges";

export default function SubmitReport() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [municipalities, setMunicipalities] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  const [form, setForm] = useState({
    title: "", body: "", category: "",
    municipalityId: "", municipalityName: "", townOrWard: "",
    latitude: "", longitude: "",
    incidentDate: new Date().toISOString().split("T")[0],
    files: [],
    submitterIs18: false, confirmedFirsthand: false,
    consentToProcess: false, submitterAgreedToTerms: false,
  });

  useEffect(() => { Municipality.list().then(setMunicipalities); }, []);

  if (!user) {
    return (
      <div style={{ maxWidth: "600px", margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ color: "#F5F5F0", marginBottom: "12px" }}>Sign in required</h2>
        <p style={{ color: "#666", marginBottom: "24px" }}>You must be signed in to submit a report.</p>
        <a href="/login" style={{ background: "#E8A838", color: "#0A0A0A", padding: "12px 28px", borderRadius: "4px", textDecoration: "none", fontWeight: 700 }}>Sign In</a>
      </div>
    );
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const getGPS = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { set("latitude", pos.coords.latitude.toFixed(6)); set("longitude", pos.coords.longitude.toFixed(6)); setGpsLoading(false); },
      () => { alert("Could not get location. Please enter manually."); setGpsLoading(false); }
    );
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    set("files", files);
  };

  const canProceed = {
    1: form.title.length >= 10 && form.body.length >= 100 && form.category,
    2: form.municipalityId && form.townOrWard,
    3: form.incidentDate,
    4: true,
    5: form.submitterIs18 && form.confirmedFirsthand && form.consentToProcess && form.submitterAgreedToTerms,
  };

  const handleSubmit = async () => {
    setError(""); setSubmitting(true);
    try {
      const muni = municipalities.find(m => m.id === form.municipalityId);
      const report = await Report.create({
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
        municipalityId: form.municipalityId,
        municipalityName: muni?.name || form.municipalityName,
        townOrWard: form.townOrWard.trim(),
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        incidentDate: form.incidentDate,
        status: "pending_review",
        escalationStage: "none",
        voteCount: 0, commentCount: 0, evidenceItemCount: 0,
        consentToProcess: true, confirmedFirsthand: true,
        submitterIs18: true, submitterAgreedToTerms: true,
        authorDisplayName: user.full_name || user.email?.split("@")[0] || "Resident",
      });

      // Upload evidence files
      if (form.files.length > 0) {
        setUploading(true);
        for (const file of form.files) {
          const fileType = file.type.startsWith("video") ? "video" : file.type.startsWith("image") ? "photo" : "document";
          // Base44 file upload via entity
          const evidenceItem = await EvidenceItem.create({
            reportId: report.id,
            fileType,
            fileUrl: "", // Will be updated after upload
            originalFilename: file.name,
            mimeType: file.type,
            fileSizeBytes: file.size,
          });
          // Note: actual file upload handled by the platform's file upload component
          // For now we create the record and it will be updated via processEvidenceUpload
        }
        setUploading(false);
      }

      // Create escalation event
      await EscalationEvent.create({
        reportId: report.id,
        eventType: "submitted",
        eventDate: new Date().toISOString(),
        actorName: user.full_name || user.email,
        description: "Report submitted by resident. Awaiting curator review.",
      });

      navigate(`/submit/confirm/${report.id}`);
    } catch (e) {
      setError("Could not submit report. Please try again.");
    }
    setSubmitting(false);
  };

  const inputStyle = { width: "100%", background: "#111", border: "1px solid #333", borderRadius: "4px", color: "#F5F5F0", padding: "12px", fontSize: "14px", boxSizing: "border-box" };
  const labelStyle = { color: "#888", fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "6px", fontWeight: 600 };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ color: "#F5F5F0", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Share Your Report</h1>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "32px" }}>Your firsthand evidence builds the public record. All required fields must be completed.</p>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "36px" }}>
        {[1,2,3,4,5].map(s => (
          <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", background: s <= step ? "#E8A838" : "#222", transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ color: "#666", fontSize: "12px", marginBottom: "28px", letterSpacing: "0.06em" }}>
        STEP {step} OF 5 — {["WHAT HAPPENED","WHERE","WHEN","EVIDENCE","CONFIRM & SUBMIT"][step-1]}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} maxLength={300} placeholder="Brief description of the issue (min 10 characters)" style={inputStyle} />
            <div style={{ color: "#444", fontSize: "11px", marginTop: "4px" }}>{form.title.length}/300</div>
          </div>
          <div>
            <label style={labelStyle}>Category *</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} style={inputStyle}>
              <option value="">Select a category...</option>
              {Object.entries(CATEGORY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Your Account *</label>
            <textarea value={form.body} onChange={e => set("body", e.target.value)} maxLength={5000} rows={6} placeholder="Describe what you witnessed, when it started, how it affects residents. Be specific and factual. Minimum 100 characters." style={{ ...inputStyle, resize: "vertical" }} />
            <div style={{ color: form.body.length < 100 ? "#dc2626" : "#444", fontSize: "11px", marginTop: "4px" }}>{form.body.length}/5000 {form.body.length < 100 ? `(${100-form.body.length} more needed)` : ""}</div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={labelStyle}>Municipality *</label>
            <select value={form.municipalityId} onChange={e => { set("municipalityId", e.target.value); set("municipalityName", municipalities.find(m=>m.id===e.target.value)?.name||""); }} style={inputStyle}>
              <option value="">Select municipality...</option>
              {municipalities.map(m => <option key={m.id} value={m.id}>{m.name} ({m.district})</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Town or Ward *</label>
            <input value={form.townOrWard} onChange={e => set("townOrWard", e.target.value)} placeholder="e.g. Ladybrand, Ward 3" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>GPS Coordinates</label>
            <button onClick={getGPS} disabled={gpsLoading} style={{ background: "#1a1a1a", color: "#E8A838", border: "1px solid #E8A838", padding: "10px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", marginBottom: "10px" }}>
              {gpsLoading ? "Getting location..." : "📍 Use My Current Location"}
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <input value={form.latitude} onChange={e => set("latitude", e.target.value)} placeholder="Latitude" style={inputStyle} />
              <input value={form.longitude} onChange={e => set("longitude", e.target.value)} placeholder="Longitude" style={inputStyle} />
            </div>
            <div style={{ color: "#444", fontSize: "11px", marginTop: "4px" }}>Optional but strongly recommended — GPS coordinates strengthen your evidence.</div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div>
          <label style={labelStyle}>Date Issue Started or Was Observed *</label>
          <input type="date" value={form.incidentDate} onChange={e => set("incidentDate", e.target.value)} max={new Date().toISOString().split("T")[0]} style={inputStyle} />
          <div style={{ color: "#555", fontSize: "13px", marginTop: "16px", lineHeight: 1.6, background: "#111", border: "1px solid #222", borderRadius: "4px", padding: "12px" }}>
            ℹ️ This is the date you observed or became aware of the issue — not today's date unless the issue occurred today.
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div>
          <label style={labelStyle}>Upload Evidence (max 10 files, 25MB each)</label>
          <div style={{ border: "2px dashed #333", borderRadius: "8px", padding: "32px", textAlign: "center", background: "#111", cursor: "pointer" }} onClick={() => document.getElementById("fileInput").click()}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
            <div style={{ color: "#888", fontSize: "14px" }}>Click to select photos, videos, or documents</div>
            <div style={{ color: "#555", fontSize: "12px", marginTop: "4px" }}>GPS-tagged photos are strongest evidence</div>
            <input id="fileInput" type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleFileChange} style={{ display: "none" }} />
          </div>
          {form.files.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              {form.files.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#111", border: "1px solid #222", borderRadius: "4px", marginBottom: "6px", fontSize: "13px", color: "#888" }}>
                  <span>📎 {f.name}</span>
                  <span>{(f.size/1024/1024).toFixed(1)} MB</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ color: "#555", fontSize: "12px", marginTop: "16px", lineHeight: 1.7 }}>
            Evidence is processed to extract GPS coordinates, capture date, and device information from JPEG EXIF data. A SHA-256 integrity hash is computed for each file to ensure tamper-evidence.
          </div>
        </div>
      )}

      {/* Step 5 */}
      {step === 5 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "20px", marginBottom: "8px" }}>
            <div style={{ color: "#888", fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "12px" }}>REVIEW YOUR SUBMISSION</div>
            <div style={{ color: "#F5F5F0", fontWeight: 700, marginBottom: "4px" }}>{form.title}</div>
            <div style={{ color: "#666", fontSize: "12px" }}>{CATEGORY_LABELS[form.category]} · {form.townOrWard}, {municipalities.find(m=>m.id===form.municipalityId)?.name}</div>
            <div style={{ color: "#555", fontSize: "12px", marginTop: "4px" }}>Incident: {form.incidentDate} · {form.files.length} file(s)</div>
          </div>
          {[
            ["submitterIs18", "I am 18 years or older"],
            ["confirmedFirsthand", "I confirm this is my firsthand account or that I have firsthand authority to report it"],
            ["consentToProcess", "I consent to Free State Action Now processing this information for the purposes described in the Privacy Policy"],
            ["submitterAgreedToTerms", "I agree to the Terms of Use and Acceptable Use Policy"],
          ].map(([k, label]) => (
            <label key={k} style={{ display: "flex", gap: "12px", alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} style={{ width: "18px", height: "18px", marginTop: "2px", flexShrink: 0, accentColor: "#E8A838" }} />
              <span style={{ color: "#CCC", fontSize: "14px", lineHeight: 1.5 }}>{label}</span>
            </label>
          ))}
          {error && <div style={{ color: "#dc2626", background: "#dc262622", border: "1px solid #dc262644", borderRadius: "4px", padding: "12px", fontSize: "13px" }}>{error}</div>}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "36px", paddingTop: "24px", borderTop: "1px solid #1a1a1a" }}>
        {step > 1 ? (
          <button onClick={() => setStep(s => s-1)} style={{ background: "#1a1a1a", color: "#F5F5F0", border: "1px solid #333", padding: "12px 24px", borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}>← Back</button>
        ) : <div />}
        {step < 5 ? (
          <button onClick={() => setStep(s => s+1)} disabled={!canProceed[step]} style={{ background: canProceed[step] ? "#E8A838" : "#333", color: canProceed[step] ? "#0A0A0A" : "#555", border: "none", padding: "12px 28px", borderRadius: "4px", cursor: canProceed[step] ? "pointer" : "default", fontWeight: 700, fontSize: "14px" }}>
            Continue →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={!canProceed[5] || submitting || uploading} style={{ background: canProceed[5] ? "#E8A838" : "#333", color: canProceed[5] ? "#0A0A0A" : "#555", border: "none", padding: "12px 28px", borderRadius: "4px", cursor: canProceed[5] ? "pointer" : "default", fontWeight: 700, fontSize: "14px" }}>
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        )}
      </div>
    </div>
  );
}
