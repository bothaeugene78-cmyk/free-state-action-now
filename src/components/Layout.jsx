import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../App";

export default function Layout({ children }) {
  const location = useLocation();
  const { user } = useContext(UserContext);

  const navLinks = [
    { to: "/reports", label: "Reports" },
    { to: "/directory", label: "Directory" },
    { to: "/newsroom", label: "Newsroom" },
    { to: "/legal-watch", label: "Legal Watch" },
    { to: "/stats", label: "Stats" },
    { to: "/about", label: "About" },
  ];

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "#F5F5F0", fontFamily: "'Inter', sans-serif" }}>
      {/* Independence Banner */}
      <div style={{ background: "#1a1a1a", borderBottom: "1px solid #E8A838", padding: "8px 20px", textAlign: "center", fontSize: "12px", color: "#E8A838", letterSpacing: "0.05em" }}>
        ⚠ INDEPENDENT COMMUNITY PLATFORM — NOT AFFILIATED WITH ANY GOVERNMENT DEPARTMENT
      </div>

      {/* Navbar */}
      <nav style={{ background: "#111", borderBottom: "1px solid #222", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", position: "sticky", top: 0, zIndex: 100 }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#E8A838", fontWeight: 800, fontSize: "18px", letterSpacing: "0.08em" }}>FS</span>
          <span style={{ color: "#F5F5F0", fontWeight: 700, fontSize: "15px", letterSpacing: "0.04em" }}>FREE STATE ACTION NOW</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} style={{
              color: location.pathname.startsWith(l.to) ? "#E8A838" : "#999",
              textDecoration: "none", padding: "6px 10px", fontSize: "13px",
              fontWeight: location.pathname.startsWith(l.to) ? 600 : 400,
              borderBottom: location.pathname.startsWith(l.to) ? "2px solid #E8A838" : "2px solid transparent"
            }}>{l.label}</Link>
          ))}
          {user && ["admin","curator","attorney_reviewer"].includes(user.role) && (
            <Link to="/admin" style={{ color: "#E8A838", textDecoration: "none", padding: "6px 10px", fontSize: "13px", fontWeight: 600, border: "1px solid #E8A838", borderRadius: "4px", marginLeft: "8px" }}>Admin</Link>
          )}
          <Link to="/submit" style={{ background: "#E8A838", color: "#0A0A0A", textDecoration: "none", padding: "7px 16px", fontSize: "13px", fontWeight: 700, borderRadius: "4px", marginLeft: "8px", letterSpacing: "0.04em" }}>SHARE YOUR REPORT</Link>
        </div>
      </nav>

      {/* Main */}
      <main>{children}</main>

      {/* Footer */}
      <footer style={{ background: "#111", borderTop: "1px solid #222", padding: "40px 24px 24px", marginTop: "80px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", marginBottom: "32px" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ color: "#E8A838", fontWeight: 800, fontSize: "16px", marginBottom: "8px" }}>FREE STATE ACTION NOW</div>
              <div style={{ color: "#666", fontSize: "12px", lineHeight: "1.6" }}>An independent civic-evidence platform for Free State residents. Building the public record that municipalities cannot ignore.</div>
            </div>
            <div>
              <div style={{ color: "#999", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "12px" }}>PLATFORM</div>
              {[["About & Methodology","/about"],["Stats Dashboard","/stats"],["Contact","/contact"]].map(([l,h]) => (
                <div key={h}><Link to={h} style={{ color: "#666", textDecoration: "none", fontSize: "13px", display: "block", marginBottom: "6px" }}>{l}</Link></div>
              ))}
            </div>
            <div>
              <div style={{ color: "#999", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "12px" }}>LEGAL</div>
              {[["Privacy Policy","/privacy-policy"],["Terms of Use","/terms-of-use"],["Acceptable Use","/acceptable-use"],["Cookie Policy","/cookie-policy"]].map(([l,h]) => (
                <div key={h}><Link to={h} style={{ color: "#666", textDecoration: "none", fontSize: "13px", display: "block", marginBottom: "6px" }}>{l}</Link></div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #222", paddingTop: "20px", color: "#444", fontSize: "11px", lineHeight: "1.8" }}>
            Free State Action Now is an independent civil-society platform. Content is community-submitted and curator-moderated. Reports are not official complaints to government and do not by themselves trigger statutory remedies. For urgent service-delivery emergencies, contact the relevant authority directly using the Directory.<br/>
            <span style={{ color: "#E8A838", fontWeight: 600 }}>⚠ If you are experiencing a service-delivery emergency, do not use this platform. Contact the relevant emergency number from the Directory.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
