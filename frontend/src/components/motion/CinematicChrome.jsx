import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

function titleForPath(pathname) {
  if (pathname === "/") return "Home";
  if (pathname === "/restaurants") return "Restaurants";
  if (pathname.startsWith("/restaurant-admin")) return "Restaurant Admin";
  if (pathname.startsWith("/platform-admin")) return "Platform Admin";
  if (pathname.startsWith("/dashboard")) return "Customer Dashboard";
  if (pathname.startsWith("/restaurant/")) return "Restaurant Experience";
  if (pathname === "/contact") return "Contact";
  if (pathname.startsWith("/customer/")) return "Customer Account";
  return "ReserveUrTime";
}

export default function CinematicChrome() {
  const location = useLocation();
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001
  });
  const [announcement, setAnnouncement] = useState("");
  const title = useMemo(() => titleForPath(location.pathname), [location.pathname]);

  useEffect(() => {
    setAnnouncement(`${title} page loaded`);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.key, title]);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {!reduced && (
        <motion.div
          className="cinematic-scroll-progress"
          style={{ scaleX }}
          aria-hidden="true"
        />
      )}
      <motion.div
        key={location.key}
        className="cinematic-route-glint"
        aria-hidden="true"
        initial={reduced ? false : { opacity: 0.5, scaleX: 0.15 }}
        animate={{ opacity: 0, scaleX: 1 }}
        transition={{ duration: reduced ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }}
      />
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </>
  );
}
