import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LottieFlowIcon from "./LottieFlowIcon";
import { useFavorites } from "../context/FavoritesContext";

export default function FavouriteButton({
  targetType,
  targetId,
  compact = false,
  className = ""
}) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, isBusy } = useFavorites();
  const location = useLocation();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  if (user && user.role !== "customer") return null;

  const saved = isFavorite(targetType, targetId);
  const busy = isBusy(targetType, targetId);
  const noun = targetType === "restaurant" ? "restaurant" : "dish";

  async function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    setFailed(false);

    if (!user) {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(`/customer/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    try {
      await toggleFavorite(targetType, targetId);
    } catch {
      setFailed(true);
      window.setTimeout(() => setFailed(false), 2200);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${noun} from favourites` : `Save ${noun} to favourites`}
      className={`favourite-button ${saved ? "is-saved" : ""} ${failed ? "has-failed" : ""} ${compact ? "is-compact" : ""} ${className}`.trim()}
    >
      <LottieFlowIcon name="favourite" />
      {!compact && <span>{busy ? "Saving…" : failed ? "Try again" : saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
