import { motion, useReducedMotion } from "motion/react";
import { NavLink } from "react-router-dom";
import AdminMessageBadge from "./AdminMessageBadge";
import ReservationMessageBadge from "./ReservationMessageBadge";

const links = [
  ["Dashboard", "/restaurant-admin/dashboard"],
  ["Profile", "/restaurant-admin/profile"],
  ["Menu", "/restaurant-admin/menu"],
  ["Tables", "/restaurant-admin/tables"],
  ["Orders", "/restaurant-admin/orders"],
  ["Reservations", "/restaurant-admin/reservations"],
  ["Guest Messages", "/restaurant-admin/reservation-messages"],
  ["Admin Messages", "/restaurant-admin/admin-messages"],
  ["Gallery", "/restaurant-admin/gallery"],
  ["Listing Requests", "/restaurant-admin/listing-requests"],
  ["Trash", "/restaurant-admin/trash"]
];

export default function RestaurantAdminSectionNav() {
  const reduced = useReducedMotion();
  return (
    <motion.nav
      className="surface cinematic-section-nav mt-8 flex gap-2 rounded-2xl p-2"
      aria-label="Restaurant Admin sections"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {links.map(([label, to]) => (
        <NavLink key={to} to={to} className={({ isActive }) => `rounded-xl px-4 py-2 text-sm transition ${isActive ? "bg-white text-black" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
          {label}{to.endsWith("admin-messages") ? <AdminMessageBadge /> : null}{to.endsWith("reservation-messages") ? <ReservationMessageBadge /> : null}
        </NavLink>
      ))}
    </motion.nav>
  );
}
