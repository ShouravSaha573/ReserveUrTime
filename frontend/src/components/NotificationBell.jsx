import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import LottieFlowIcon from "./LottieFlowIcon";

const baseByRole = { customer: "/customer", restaurant_admin: "/restaurant-admin", platform_admin: "/platform-admin" };

export default function NotificationBell() {
  const { user } = useAuth();
  const base = baseByRole[user?.role];
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });

  useEffect(() => {
    if (!base) return undefined;
    let active = true;
    async function load() {
      try {
        const next = await apiFetch(`${base}/notifications`, { retryGet: false });
        if (active) setData(next);
      } catch { /* Navbar remains usable if notifications are unavailable. */ }
    }
    load();
    const timer = window.setInterval(load, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [base]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  if (!base) return null;

  async function markRead(notification) {
    if (!notification.isRead) {
      await apiFetch(`${base}/notifications/${notification._id}/read`, { method: "PATCH", retryGet: false });
      setData((current) => ({
        unreadCount: Math.max(0, current.unreadCount - 1),
        notifications: current.notifications.map((item) => item._id === notification._id ? { ...item, isRead: true } : item)
      }));
    }
    setOpen(false);
  }

  async function markAllRead() {
    setData(await apiFetch(`${base}/notifications/read-all`, { method: "PATCH", retryGet: false }));
  }

  return (
    <div className="notification-center" ref={rootRef}>
      <button type="button" className="premium-notification-bell" aria-label={`${data.unreadCount} unread notifications`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="notification-shine" aria-hidden="true" />
        <LottieFlowIcon name="notification" />
        {data.unreadCount > 0 ? <span className="notification-count">{Math.min(99, data.unreadCount)}</span> : null}
      </button>
      {open ? (
        <div className="notification-popover">
          <header><div><p className="premium-food-eyebrow">Updates</p><h2>Notifications</h2></div>{data.unreadCount ? <button type="button" onClick={markAllRead}>Mark all read</button> : null}</header>
          <div className="notification-list">
            {data.notifications.length ? data.notifications.slice(0, 12).map((notification) => (
              <Link key={notification._id} to={notification.href || "#"} className={notification.isRead ? "" : "is-unread"} onClick={() => markRead(notification)}>
                <span className="notification-item-icon"><LottieFlowIcon name="notification" /></span>
                <span><strong>{notification.title}</strong><small>{notification.message}</small><time>{new Date(notification.createdAt).toLocaleString()}</time></span>
              </Link>
            )) : <p className="notification-empty">You’re all caught up.</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
