import { motion, useReducedMotion } from "motion/react";
import { NavLink } from "react-router-dom";

const links = [
  ["/dashboard/orders", "Orders"],
  ["/dashboard/profile", "Profile"]
];

export default function CustomerDashboardNav() {
  const reduced = useReducedMotion();
  return (
    <motion.nav
      className="customer-dashboard-nav cinematic-section-nav"
      aria-label="Customer dashboard"
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {links.map(([to, label]) => (
        <NavLink key={to} to={to} end={to === "/dashboard"} className={({ isActive }) => (isActive ? "is-active" : "")}>
          {label}
        </NavLink>
      ))}
    </motion.nav>
  );
}
