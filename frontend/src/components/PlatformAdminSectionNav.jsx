import { NavLink } from "react-router-dom";
import AdminMessageBadge from "./AdminMessageBadge";

const links = [
  ["Overview", "/platform-admin/dashboard"],
  ["Homepage", "/platform-admin/homepage"],
  ["Listing requests", "/platform-admin/change-requests"],
  ["Messages", "/platform-admin/admin-messages"]
];

export default function PlatformAdminSectionNav() {
  return (
    <nav className="admin-section-nav" aria-label="Platform Admin sections">
      {links.map(([label, to]) => (
        <NavLink key={to} to={to} end={to.endsWith("dashboard")} className={({ isActive }) => isActive ? "is-active" : ""}>
          {label}{to.endsWith("admin-messages") ? <AdminMessageBadge /> : null}
        </NavLink>
      ))}
      <a href="/" target="_blank" rel="noreferrer" className="admin-preview-link">View site ↗</a>
    </nav>
  );
}
