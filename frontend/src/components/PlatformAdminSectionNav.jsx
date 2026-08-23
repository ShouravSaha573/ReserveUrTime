import { NavLink } from "react-router-dom";

const links = [
  ["Overview", "/platform-admin/dashboard"],
  ["Homepage", "/platform-admin/homepage"],
  ["Listing requests", "/platform-admin/change-requests"]
];

export default function PlatformAdminSectionNav() {
  return (
    <nav className="admin-section-nav" aria-label="Platform Admin sections">
      {links.map(([label, to]) => (
        <NavLink key={to} to={to} end={to.endsWith("dashboard")} className={({ isActive }) => isActive ? "is-active" : ""}>
          {label}
        </NavLink>
      ))}
      <a href="/" target="_blank" rel="noreferrer" className="admin-preview-link">View site ↗</a>
    </nav>
  );
}
