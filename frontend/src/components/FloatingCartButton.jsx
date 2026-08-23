import { motion, useReducedMotion } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import LottieFlowIcon from "./LottieFlowIcon";

export default function FloatingCartButton() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const { pathname } = useLocation();
  const reduced = useReducedMotion();

  if (user?.role !== "customer" || pathname === "/dashboard/cart") return null;

  const label = itemCount ? `Open cart with ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Open cart";

  return (
    <motion.div className="floating-cart-wrap" initial={reduced ? false : { opacity: 0, scale: 0.72, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}>
      <Link to="/dashboard/cart" className="floating-cart-orb" aria-label={label} title={label}>
        <span className="floating-cart-shine" aria-hidden="true" />
        <LottieFlowIcon name="cart" className="floating-cart-lottie" loop />
        {itemCount > 0 && <span className="floating-cart-count">{itemCount > 99 ? "99+" : itemCount}</span>}
      </Link>
    </motion.div>
  );
}
