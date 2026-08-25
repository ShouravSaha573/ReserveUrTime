import { useEffect, useState } from "react";
import LottieFlowIcon from "./LottieFlowIcon";
import { apiFetch } from "../lib/api";

export default function ReservationConversation({ order, unreadCount = 0, onRead }) {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState(null);
  const [message, setMessage] = useState("");
  const [state, setState] = useState({ loading: false, sending: false, error: "" });
  const expiresAt = new Date(`${order.reservationSnapshot.reservationDate}T${order.reservationSnapshot.timeSlot}:00+06:00`);
  const locallyOpen = expiresAt.getTime() > Date.now() && order.status !== "cancelled";

  async function load() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await apiFetch(`/customer/orders/${order._id}/messages`, { retryGet: false });
      setThread(data);
      setState((current) => ({ ...current, loading: false }));
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }

  useEffect(() => {
    if (!open) return undefined;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const data = await apiFetch(`/customer/orders/${order._id}/messages`, { retryGet: false });
        setThread(data);
        setState((current) => ({ ...current, error: "" }));
      } catch (error) {
        setState((current) => ({ ...current, error: error.message }));
      }
    };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(refresh, 10000);
    return () => { document.removeEventListener("visibilitychange", onVisible); window.clearInterval(timer); };
  }, [open, order._id]);

  // Keep this return below every hook. The same keyed component can change
  // from an active to a cancelled Order in place; returning before useEffect
  // on that render would violate React's hook ordering and blank the page.
  if (!locallyOpen) return null;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      onRead?.(order._id);
      if (!thread && !state.loading) await load();
    }
  }

  async function send(event) {
    event.preventDefault();
    const body = message.trim();
    if (!body) return;
    setState((current) => ({ ...current, sending: true, error: "" }));
    try {
      await apiFetch(`/customer/orders/${order._id}/messages`, { method: "POST", retryGet: false, body: { message: body } });
      setMessage("");
      await load();
    } catch (error) {
      setState((current) => ({ ...current, sending: false, error: error.message }));
    } finally {
      setState((current) => ({ ...current, sending: false }));
    }
  }

  return (
    <section className="reservation-conversation">
      <button type="button" className="reservation-conversation-toggle" onClick={toggle} aria-expanded={open}>
        <span><LottieFlowIcon name="message" /> Message restaurant{unreadCount ? <i className="reservation-unread-dot" aria-label={`${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`} /> : null}</span>
        <small>Available until {expiresAt.toLocaleString()}</small>
      </button>
      {open ? (
        <div className="reservation-conversation-panel">
          {state.loading && !thread ? <p className="text-sm text-white/45">Loading conversation…</p> : null}
          <div className="reservation-message-list" aria-live="polite">
            {(thread?.messages || []).map((entry) => (
              <div key={entry._id} className={`reservation-message is-${entry.senderRole}`}>
                <strong>{entry.senderRole === "customer" ? "You" : "Restaurant"}</strong>
                <p>{entry.body}</p>
                <time>{new Date(entry.createdAt).toLocaleString()}</time>
              </div>
            ))}
            {thread && thread.messages.length === 0 ? <p className="text-sm text-white/40">Start a conversation about this reservation.</p> : null}
          </div>
          {state.error ? <p className="mt-3 text-sm text-red-200">{state.error}</p> : null}
          {thread?.canMessage !== false ? (
            <form className="reservation-message-form" onSubmit={send}>
              <label className="sr-only" htmlFor={`reservation-message-${order._id}`}>Message restaurant</label>
              <textarea id={`reservation-message-${order._id}`} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1200} placeholder="Write a message to the restaurant…" rows="3" />
              <button type="submit" className="btn-primary" disabled={state.sending || !message.trim()}>{state.sending ? "Sending…" : "Send message"}</button>
            </form>
          ) : <p className="mt-4 text-sm text-white/45">This conversation closed when the reservation time expired.</p>}
        </div>
      ) : null}
    </section>
  );
}
