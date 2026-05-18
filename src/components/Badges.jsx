export const CATEGORY_LABELS = {
  roads_transport: "Roads & Transport",
  water_sanitation: "Water & Sanitation",
  electricity: "Electricity",
  waste_refuse: "Waste & Refuse",
  housing: "Housing",
  health_clinics: "Health & Clinics",
  education_schools: "Education",
  safety_policing: "Safety & Policing",
  internet_connectivity: "Internet",
  tourism_heritage_impact: "Tourism & Heritage",
  other: "Other",
};

export const CATEGORY_ICONS = {
  roads_transport: "🛣️",
  water_sanitation: "💧",
  electricity: "⚡",
  waste_refuse: "🗑️",
  housing: "🏠",
  health_clinics: "🏥",
  education_schools: "🏫",
  safety_policing: "🚔",
  internet_connectivity: "📡",
  tourism_heritage_impact: "🏛️",
  other: "📋",
};

export const CATEGORY_COLORS = {
  roads_transport: "#b45309",
  water_sanitation: "#1d4ed8",
  electricity: "#d97706",
  waste_refuse: "#059669",
  housing: "#7c3aed",
  health_clinics: "#dc2626",
  education_schools: "#0891b2",
  safety_policing: "#374151",
  internet_connectivity: "#6366f1",
  tourism_heritage_impact: "#92400e",
  other: "#6b7280",
};

export const STATUS_COLORS = {
  pending_review: "#d97706",
  approved: "#059669",
  rejected: "#dc2626",
  duplicate: "#6b7280",
  escalated: "#E8A838",
  resolved: "#10b981",
};

export const ESCALATION_COLORS = {
  none: "#374151",
  notice_drafted: "#d97706",
  notice_sent: "#E8A838",
  response_received: "#059669",
  no_response: "#dc2626",
  mandamus_initiated: "#7c3aed",
};

export function CategoryBadge({ category, small }) {
  return (
    <span style={{
      background: CATEGORY_COLORS[category] + "22",
      color: CATEGORY_COLORS[category] || "#6b7280",
      border: `1px solid ${CATEGORY_COLORS[category] || "#6b7280"}44`,
      padding: small ? "2px 6px" : "3px 10px",
      borderRadius: "4px",
      fontSize: small ? "10px" : "11px",
      fontWeight: 600,
      letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>
      {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category] || category}
    </span>
  );
}

export function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "#6b7280";
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600,
      letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      {status?.replace(/_/g," ")}
    </span>
  );
}

export function EscalationBadge({ stage }) {
  const color = ESCALATION_COLORS[stage] || "#374151";
  if (!stage || stage === "none") return null;
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600,
      letterSpacing: "0.04em",
    }}>
      {stage?.replace(/_/g," ").toUpperCase()}
    </span>
  );
}

export function AuditBadge({ outcome }) {
  const map = {
    unqualified: ["#059669","CLEAN AUDIT"],
    unqualified_with_findings: ["#d97706","UNQUALIFIED + FINDINGS"],
    qualified: ["#f59e0b","QUALIFIED"],
    adverse: ["#dc2626","ADVERSE"],
    disclaimer: ["#7c3aed","DISCLAIMER"],
    outstanding: ["#6b7280","OUTSTANDING"],
  };
  const [color, label] = map[outcome] || ["#6b7280", outcome?.replace(/_/g," ").toUpperCase()];
  if (!outcome) return null;
  return (
    <span style={{ background: color+"22", color, border:`1px solid ${color}44`, padding:"2px 8px", borderRadius:"4px", fontSize:"10px", fontWeight:700, letterSpacing:"0.06em" }}>
      {label}
    </span>
  );
}

export function Section139Badge({ status }) {
  if (!status || status === "none") return null;
  return (
    <span style={{ background:"#dc262622", color:"#dc2626", border:"1px solid #dc262644", padding:"2px 8px", borderRadius:"4px", fontSize:"10px", fontWeight:700, letterSpacing:"0.06em" }}>
      S139 {status}
    </span>
  );
}
