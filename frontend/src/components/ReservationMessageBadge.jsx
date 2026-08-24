import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export default function ReservationMessageBadge() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try { const data = await apiFetch("/restaurant-admin/reservation-messages/unread-count", { retryGet: false }); if (active) setUnread(data.unreadCount || 0); } catch { /* Keep navigation available. */ }
    };
    refresh();
    const timer = window.setInterval(refresh, 10000);
    const visible = () => refresh();
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("reservation-messages-read", refresh);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); window.removeEventListener("reservation-messages-read", refresh); };
  }, []);
  return unread ? <span className="admin-message-nav-dot" aria-label={`${unread} unread guest message${unread === 1 ? "" : "s"}`} title={`${unread} unread guest messages`}><span>{unread > 9 ? "9+" : unread}</span></span> : null;
}