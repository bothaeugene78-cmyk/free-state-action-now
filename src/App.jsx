import { createContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { base44 } from "./api/base44Client";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Reports from "./pages/Reports";
import ReportDetail from "./pages/ReportDetail";
import SubmitReport from "./pages/SubmitReport";
import Directory from "./pages/Directory";
import Newsroom from "./pages/Newsroom";
import LegalWatch from "./pages/LegalWatch";
import Stats from "./pages/Stats";
import About from "./pages/About";
import Moderation from "./pages/admin/Moderation";
import Curation from "./pages/admin/Curation";
import Officials from "./pages/admin/Officials";
import Notices from "./pages/admin/Notices";
import Flags from "./pages/admin/Flags";
import StaticPage from "./pages/StaticPage";

export const UserContext = createContext({ user: null });

function SubmitConfirm() {
  const { id } = { id: window.location.pathname.split("/").pop() };
  return (
    <div style={{ maxWidth: "600px", margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
      <div style={{ fontSize: "56px", marginBottom: "16px" }}>✅</div>
      <h2 style={{ color: "#F5F5F0", fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>Report received</h2>
      <p style={{ color: "#888", fontSize: "15px", lineHeight: 1.7, marginBottom: "28px" }}>Your report has been submitted and is awaiting curator review. You'll receive an email when it's published. Thank you for building the public record.</p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <a href="/reports" style={{ background: "#E8A838", color: "#0A0A0A", textDecoration: "none", padding: "12px 24px", borderRadius: "4px", fontWeight: 700 }}>Browse Reports</a>
        <a href="/submit" style={{ border: "1px solid #444", color: "#F5F5F0", textDecoration: "none", padding: "12px 24px", borderRadius: "4px" }}>Submit Another</a>
      </div>
    </div>
  );
}

function ContactPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ color: "#F5F5F0", fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>Contact</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "16px" }}>
        {[["Information Officer", "[INFORMATION OFFICER EMAIL]", "For POPIA data-subject access requests, corrections, and privacy enquiries."], ["Curator Inbox", "[CURATOR EMAIL]", "To report errors in the directory, raise content concerns, or contact the moderation team."], ["Platform Address", "[REGISTERED ADDRESS]", "Physical address of the operating entity."]].map(([t,v,d]) => (
          <div key={t} style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "20px" }}>
            <div style={{ color: "#E8A838", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "8px" }}>{t.toUpperCase()}</div>
            <div style={{ color: "#F5F5F0", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>{v}</div>
            <div style={{ color: "#555", fontSize: "12px", lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "32px", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "20px" }}>
        <div style={{ color: "#E8A838", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "12px" }}>POPIA DATA-SUBJECT ACCESS REQUEST PROCESS</div>
        <div style={{ color: "#888", fontSize: "13px", lineHeight: 1.8 }}>
          To exercise your rights under the Protection of Personal Information Act 4 of 2013, email the Information Officer at [INFORMATION OFFICER EMAIL] with the subject line "POPIA Data-Subject Access Request". Include your full name, the nature of your request (access, correction, deletion, or objection), and a description of the personal information concerned. We will respond within 30 days as required by POPIA s53.
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthLoading(false); }).catch(() => setAuthLoading(false));
  }, []);

  if (authLoading) {
    return (
      <div style={{ background: "#0A0A0A", color: "#F5F5F0", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#E8A838", fontWeight: 900, fontSize: "24px", letterSpacing: "0.08em" }}>FREE STATE ACTION NOW</div>
          <div style={{ color: "#444", fontSize: "13px", marginTop: "12px" }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/:id" element={<ReportDetail />} />
            <Route path="/submit" element={<SubmitReport />} />
            <Route path="/submit/confirm/:id" element={<SubmitConfirm />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/newsroom" element={<Newsroom />} />
            <Route path="/legal-watch" element={<LegalWatch />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin" element={<Navigate to="/admin/moderation" />} />
            <Route path="/admin/moderation" element={<Moderation />} />
            <Route path="/admin/curation" element={<Curation />} />
            <Route path="/admin/officials" element={<Officials />} />
            <Route path="/admin/notices" element={<Notices />} />
            <Route path="/admin/flags" element={<Flags />} />
            <Route path="/privacy-policy" element={<StaticPage page="privacy" />} />
            <Route path="/terms-of-use" element={<StaticPage page="terms" />} />
            <Route path="/acceptable-use" element={<StaticPage page="acceptable-use" />} />
            <Route path="/cookie-policy" element={<StaticPage page="cookies" />} />
            <Route path="*" element={<div style={{ textAlign:"center", padding:"100px", color:"#444" }}>Page not found. <a href="/" style={{ color:"#E8A838" }}>Go home →</a></div>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </UserContext.Provider>
  );
}
