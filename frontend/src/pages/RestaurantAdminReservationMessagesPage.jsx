import { useCallback, useEffect, useState } from "react";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import LottieFlowIcon from "../components/LottieFlowIcon";
import PageMessage from "../components/PageMessage";
import { apiFetch } from "../lib/api";

export default function RestaurantAdminReservationMessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [state, setState] = useState({ loading: true, error: "", busyId: "" });
  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/restaurant-admin/reservation-messages", { retryGet: false });
      setConversations(data.conversations || []);
      setState((current) => ({ ...current, loading: false, error: "", busyId: "" }));
    } catch (error) { setState((current) => ({ ...current, loading: false, error: error.message, busyId: "" })); }
  }, []);

  useEffect(() => {
    window.dispatchEvent(new Event("reservation-messages-read"));
    load();
    const refresh = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, 10000);
    return () => { document.removeEventListener("visibilitychange", refresh); window.clearInterval(timer); };
  }, [load]);

  async function reply(event, conversation) {
    event.preventDefault();
    const message = String(drafts[conversation.orderId] || "").trim();
    if (!message) return;
    setState((current) => ({ ...current, busyId: conversation.orderId, error: "" }));
    try {
      await apiFetch(`/restaurant-admin/reservation-messages/${conversation.orderId}`, { method: "POST", retryGet: false, body: { message } });
      setDrafts((current) => ({ ...current, [conversation.orderId]: "" }));
      await load();
    } catch (error) { setState((current) => ({ ...current, busyId: "", error: error.message })); }
  }

  return (
    <main className="admin-workspace mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Restaurant Admin · Guest care</p>
      <h1 className="mt-5 font-display text-5xl md:text-7xl">Reservation messages</h1>
      <p className="mt-4 max-w-2xl text-white/50">Reply to guests before their reservation time. Conversations become read-only automatically at expiry.</p>
      <RestaurantAdminSectionNav />
      {state.error ? <PageMessage title="Messages unavailable" message={state.error} /> : null}
      {state.loading ? <p className="mt-10 text-white/45">Loading conversations…</p> : null}
      <section className="mt-10 space-y-5">
        {conversations.map((conversation) => (
          <article key={conversation.orderId} className="order-card reservation-admin-thread">
            <header><div><p className="text-xs uppercase tracking-[.18em] text-white/35">{conversation.orderNumber}</p><h2 className="mt-2 font-display text-3xl">{conversation.guestName}</h2></div><span className={conversation.canMessage ? "conversation-open" : "conversation-closed"}>{conversation.canMessage ? "Open" : "Expired"}</span></header>
            <p className="mt-3 text-sm text-white/45">{conversation.reservation?.reservationDate} · {conversation.reservation?.timeSlot}</p>
            <div className="reservation-message-list mt-5">
              {conversation.messages.map((entry) => <div key={entry._id} className={`reservation-message is-${entry.senderRole}`}><strong>{entry.senderRole === "restaurant_admin" ? "Restaurant" : conversation.guestName}</strong><p>{entry.body}</p><time>{new Date(entry.createdAt).toLocaleString()}</time></div>)}
            </div>
            {conversation.canMessage ? (
              <form className="reservation-message-form" onSubmit={(event) => reply(event, conversation)}>
                <label className="sr-only" htmlFor={`admin-message-${conversation.orderId}`}>Reply to guest</label>
                <textarea id={`admin-message-${conversation.orderId}`} rows="3" maxLength={1200} placeholder="Reply to the guest…" value={drafts[conversation.orderId] || ""} onChange={(event) => setDrafts((current) => ({ ...current, [conversation.orderId]: event.target.value }))} />
                <button className="btn-primary" type="submit" disabled={state.busyId === conversation.orderId || !String(drafts[conversation.orderId] || "").trim()}><LottieFlowIcon name="message" /> Reply</button>
              </form>
            ) : null}
          </article>
        ))}
        {!state.loading && !conversations.length ? <PageMessage title="No reservation messages" message="Guest conversations will appear here when a reserved guest sends a message." /> : null}
      </section>
    </main>
  );
}
