import { Link, useLocation, Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../App";

export default function AdminLayout({ children }) {
  const { user } = useContext(UserContext);
  const location = useLocation();

  if (!user) return <Navigate to="/login" />;
  if (!["admin","curator","attorney_reviewer"].includes(user.role)) {
    return <div style={{ color: "#dc2626", padding: "60px", textAlign: "center" }}>Access denied. Admin, curator, or attorney_reviewer role required.</div>;
  }

  const links = [
    { to: "/admin/moderation", label: "Moderation Queue", icon: "🔍" },
    { to: "/admin/curation", label: "Curation Queue", icon: "📰" },
    { to: "/admin/officials", label: "Officials", icon: "👤" },
    { to: "/admin/notices", label: "Legal Notices", icon: "📋" },
    { to: "/admin/flags", label: "Flags", icon: "🚩" },
  ];
  if (user.role === "admin") links.push({ to: "/admin/users", label: "Users", icon: "👥" });

  const lStyle = (path) => ({
    display: "flex", alignItems: "center", gap: "8px",
    textDecoration: "none", padding: "10px 14px", borderRadius: "4px",
    color: location.pathname === path ? "#E8A838" : "#888",
    background: location.pathname === path ? "#E8A83811" : "transparent",
    fontSize: "13px", fontWeight: location.pathname === path ? 700 : 400,
  });

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 90px)" }}>
      {/* Sidebar */}
      <aside style={{ width: "200px", background: "#111", borderRight: "1px solid #1a1a1a", padding: "24px 12px", flexShrink: 0 }}>
        <div style={{ color: "#555", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 14px", marginBottom: "12px" }}>Admin Panel</div>
        {links.map(l => (
          <Link key={l.to} to={l.to} style={lStyle(l.to)}>{l.icon} {l.label}</Link>
        ))}
        <div style={{ borderTop: "1px solid #1a1a1a", marginTop: "16px", paddingTop: "16px" }}>
          <div style={{ color: "#555", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 14px", marginBottom: "8px" }}>Signed in as</div>
          <div style={{ color: "#666", fontSize: "11px", padding: "0 14px" }}>{user.email}</div>
          <div style={{ color: "#E8A838", fontSize: "10px", padding: "2px 14px", fontWeight: 700, textTransform: "uppercase" }}>{user.role}</div>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "32px", background: "#0A0A0A", overflow: "auto" }}>{children}</main>
    </div>
  );
}
