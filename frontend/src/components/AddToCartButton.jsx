import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import LottieFlowIcon from "./LottieFlowIcon";

export default function AddToCartButton({ menuItemId, compact = false }) {
  const { user } = useAuth();
  const { addItem, isItemBusy, quantityFor } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  if (user && user.role !== "customer") return null;

  const quantity = quantityFor(menuItemId);
  const busy = isItemBusy(menuItemId);

  async function add(replaceExistingRestaurant = false) {
    try {
      await addItem(menuItemId, 1, { replaceExistingRestaurant });
      setMessage("Added");
      window.setTimeout(() => setMessage(""), 1400);
    } catch (error) {
      if (error.status === 409 && !replaceExistingRestaurant) {
        const replace = window.confirm(
          "Your cart contains dishes from another Restaurant. Replace that cart with this Restaurant?"
        );
        if (replace) return add(true);
      }
      setMessage("Try again");
      window.setTimeout(() => setMessage(""), 1800);
    }
  }

  function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(`/customer/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    add(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`cart-add-button ${compact ? "is-compact" : ""}`.trim()}
      aria-label="Add dish to cart"
    >
      <LottieFlowIcon name="cart" />
      {!compact && (
        <span>{busy ? "Updating…" : message || (quantity ? `In cart · ${quantity}` : "Add to cart")}</span>
      )}
    </button>
  );
}
