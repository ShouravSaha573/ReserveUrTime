import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { subscribeAdminConnection, subscribeAdminMessages } from "../lib/adminMessageRealtime";

export default function AdminMessageBadge() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);
  const connected = useRef(false);
  const base = user?.role === "platform_admin" ? "/platform-admin" : "/restaurant-admin";
  const messagePath = `${base}/admin-messages`;
  const refresh = useCallback(async () => {
    if (!user || !["platform_admin", "restaurant_admin"].includes(user.role)) return;
    try { const data = await apiFetch(`${base}/admin-messages/unread-count`, { retryGet: false }); setUnread(data.unreadCount || 0); } catch { /* Navigation remains usable offline. */ }
  }, [base, user]);

  useEffect(() => {
    refresh();
    const unsubscribeMessages = subscribeAdminMessages(() => refresh());
    const unsubscribeStatus = subscribeAdminConnection((value) => { connected.current = value; if (value) refresh(); });
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    const onRead = () => refresh();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("admin-messages-read", onRead);
    const fallback = setInterval(() => { if (!connected.current && document.visibilityState === "visible") refresh(); }, 20000);
    return () => { unsubscribeMessages(); unsubscribeStatus(); clearInterval(fallback); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("admin-messages-read", onRead); };
  }, [refresh]);

  useEffect(() => { if (pathname === messagePath) { setUnread(0); window.dispatchEvent(new Event("admin-messages-read")); } }, [pathname, messagePath]);
  return unread > 0 ? <span className="admin-message-nav-dot" title={`${unread} unread admin message${unread === 1 ? "" : "s"}`} aria-label={`${unread} unread`}><span>{unread > 9 ? "9+" : unread}</span></span> : null;
}