import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSiteContent } from "../context/SiteContentContext";
import LottieFlowIcon from "./LottieFlowIcon";

function navClass({ isActive }) {
  return `cinematic-nav-link text-sm ${
    isActive ? "is-active text-[#f3efe6]" : "text-white/55"
  }`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { content } = useSiteContent();
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/");
  }

  const mobileLinks = [
    ["/", content.brand.homeLabel],
    ["/restaurants", content.brand.restaurantsLabel],
    ["/contact", "Contact"]
  ];

  if (user?.role === "customer") {
    mobileLinks.push(["/dashboard/orders", "Dashboard"]);
  }
  if (user?.role === "platform_admin") mobileLinks.push(["/platform-admin/dashboard", "Platform Admin"]);
  if (user?.role === "restaurant_admin") mobileLinks.push(["/restaurant-admin/dashboard", "Restaurant Admin"]);

  return (
    <header className={`cinematic-navbar sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl ${location.pathname === "/" ? "home-hero-nav bg-[#050505]/35" : "bg-[#050505]/75"}`}>
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
        <motion.div whileHover={reduced ? undefined : { scale: 1.015 }} whileTap={reduced ? undefined : { scale: 0.99 }}>
          <Link to="/" className="brand-glow font-display text-xl tracking-[.12em]">
            {content.brand.name}
          </Link>
        </motion.div>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          <NavLink to="/" className={navClass}>{content.brand.homeLabel}</NavLink>
          <NavLink to="/restaurants" className={navClass}>{content.brand.restaurantsLabel}</NavLink>
          <NavLink to="/contact" className={navClass}>Contact</NavLink>
          {user?.role === "customer" && <NavLink to="/dashboard/orders" className={navClass}>Dashboard</NavLink>}
          {user?.role === "platform_admin" && <NavLink to="/platform-admin/dashboard" className={navClass}>Platform Admin</NavLink>}
          {user?.role === "restaurant_admin" && <NavLink to="/restaurant-admin/dashboard" className={navClass}>Restaurant Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="mobile-menu-toggle md:hidden"
            aria-expanded={open}
            aria-controls="mobile-primary-navigation"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span aria-hidden="true" className={open ? "is-open" : ""}><i /><i /></span>
          </button>

          <div className="hidden items-center gap-2 md:flex">
            {!user ? (
              <>
                <Link to="/customer/login" className="btn-secondary text-sm">{content.brand.customerLoginLabel}</Link>
                <Link to="/customer/register" className="btn-primary text-sm">{content.brand.customerRegisterLabel}</Link>
              </>
            ) : (
              <>
                <span className="hidden text-sm text-white/55 lg:inline">{user.name}</span>
                <button onClick={handleLogout} className="btn-secondary text-sm">Logout</button>
              </>
            )}
          </div>

        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-primary-navigation"
            className="mobile-nav-panel md:hidden"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            <motion.nav
              className="mobile-nav-sheet"
              aria-label="Mobile navigation"
              initial={reduced ? false : { y: -18, opacity: 0, filter: "blur(8px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mobile-nav-links">
                {mobileLinks.map(([to, label], index) => (
                  <motion.div
                    key={`${to}-${label}`}
                    initial={reduced ? false : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduced ? 0 : index * 0.035, duration: 0.3 }}
                  >
                    <NavLink to={to} end={to === "/"} className={({ isActive }) => `mobile-nav-link ${isActive ? "is-active" : ""}`}>
                      <span>{label}</span><LottieFlowIcon name="arrow" className="rotate-[135deg]" />
                    </NavLink>
                  </motion.div>
                ))}
              </div>

              <div className="mobile-nav-actions">
                {!user ? (
                  <>
                    <Link to="/customer/login" className="btn-secondary">{content.brand.customerLoginLabel}</Link>
                    <Link to="/customer/register" className="btn-primary">{content.brand.customerRegisterLabel}</Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-white/45">Signed in as <strong className="text-white/80">{user.name}</strong></p>
                    <button type="button" onClick={handleLogout} className="btn-secondary">Logout</button>
                  </>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
