import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PlatformAdminSectionNav from "../components/PlatformAdminSectionNav";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import LottieFlowIcon from "../components/LottieFlowIcon";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { subscribeAdminConnection, subscribeAdminMessages } from "../lib/adminMessageRealtime";

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const platform = user?.role === "platform_admin";
  const [params, setParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState(params.get("restaurantId") || "");
  const [conversation, setConversation] = useState(null);
  const [body, setBody] = useState("");
  const [state, setState] = useState({ loading: true, sending: false, error: "", connected: false });
  const endRef = useRef(null);

  const loadThreads = useCallback(async () => {
    if (!platform) return;
    const data = await apiFetch("/platform-admin/admin-messages", { retryGet: false });
    setThreads(data.threads || []);
    setSelectedId((current) => current || data.threads?.[0]?.restaurant?._id || "");
  }, [platform]);

  const loadConversation = useCallback(async () => {
    if (platform && !selectedId) { setConversation(null); setState((value) => ({ ...value, loading: false })); return; }
    try {
      const path = platform ? `/platform-admin/admin-messages/${selectedId}` : "/restaurant-admin/admin-messages";
      const nextConversation = await apiFetch(path, { retryGet: false });
      setConversation(nextConversation);
      if (platform) {
        setThreads((current) => current.map((thread) => String(thread.restaurant._id) === String(selectedId) ? { ...thread, unreadCount: 0 } : thread));
      }
      window.dispatchEvent(new Event("admin-messages-read"));
      setState((value) => ({ ...value, loading: false, error: "" }));
    } catch (error) { setState((value) => ({ ...value, loading: false, error: error.message })); }
  }, [platform, selectedId]);

  useEffect(() => { loadThreads().catch((error) => setState((value) => ({ ...value, loading: false, error: error.message }))); }, [loadThreads]);
  useEffect(() => { loadConversation(); if (platform && selectedId) setParams({ restaurantId: selectedId }, { replace: true }); }, [loadConversation, platform, selectedId, setParams]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation?.messages?.length]);

  useEffect(() => {
    const unsubscribeMessages = subscribeAdminMessages(async (message) => {
      if (String(message.restaurantId) === String(conversation?.restaurant?._id)) {
        setConversation((current) => current && current.messages.some((item) => item._id === message._id) ? current : { ...current, messages: [...current.messages, message] });
        if (platform) setThreads((current) => current.map((thread) => String(thread.restaurant._id) === String(message.restaurantId) ? { ...thread, unreadCount: 0 } : thread));
        await loadConversation().catch(() => {});
      }
      if (platform) await loadThreads().catch(() => {});
    });
    const unsubscribeStatus = subscribeAdminConnection((connected) => setState((value) => ({ ...value, connected })));
    const fallback = setInterval(() => { if (document.visibilityState === "visible") loadConversation(); }, 30000);
    return () => { unsubscribeMessages(); unsubscribeStatus(); clearInterval(fallback); };
  }, [conversation?.restaurant?._id, loadConversation, loadThreads, platform]);
  async function send(event) {
    event.preventDefault();
    const text = body.trim();
    if (!text || state.sending) return;
    setState((value) => ({ ...value, sending: true, error: "" }));
    try {
      const path = platform ? `/platform-admin/admin-messages/${selectedId}` : "/restaurant-admin/admin-messages";
      const data = await apiFetch(path, { method: "POST", body: { body: text }, retryGet: false });
      setBody("");
      setConversation((current) => current && current.messages.some((item) => item._id === data.message._id) ? current : { ...current, messages: [...current.messages, data.message] });
      if (platform) await loadThreads();
    } catch (error) { setState((value) => ({ ...value, error: error.message })); }
    finally { setState((value) => ({ ...value, sending: false })); }
  }

  return (
    <main className="admin-workspace admin-chat-page py-12 md:py-16">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Admin communication</p>
      <div className="admin-chat-title"><div><h1 className="mt-4 font-display text-5xl md:text-7xl">Admin messages</h1><p>Private operational conversation between Restaurant Admins and the Platform Admin team.</p></div><span className={state.connected ? "is-online" : ""}>{state.connected ? "Live connection" : "Reconnecting"}</span></div>
      {platform ? <PlatformAdminSectionNav /> : <RestaurantAdminSectionNav />}
      {state.error && <p className="mt-6 text-red-200">{state.error}</p>}
      <section className={`admin-chat-shell ${platform ? "has-inbox" : ""}`}>
        {platform && <aside className="admin-chat-inbox"><header><small>Restaurant conversations</small><strong>{threads.length}</strong></header>{threads.length ? threads.map((thread) => <button key={thread.restaurant._id} className={selectedId === thread.restaurant._id ? "is-selected" : ""} onClick={() => setSelectedId(thread.restaurant._id)}><span><strong>{thread.restaurant.name}</strong><small>{thread.lastBody}</small></span>{thread.unreadCount ? <b>{thread.unreadCount}</b> : null}</button>) : <p>No restaurant has started a conversation yet.</p>}</aside>}
        <div className="admin-chat-conversation">
          {conversation ? <><header><div><small>Conversation with</small><h2>{platform ? conversation.restaurant.name : "Platform Admin"}</h2></div><span>Private admin channel</span></header><div className="admin-chat-messages" aria-live="polite">{conversation.messages.length ? conversation.messages.map((message) => { const own = message.senderRole === user.role; return <article key={message._id} className={own ? "is-own" : ""}><small>{own ? "You" : message.senderName}</small><p>{message.body}</p><time>{new Date(message.createdAt).toLocaleString()}</time></article>; }) : <div className="admin-chat-empty"><LottieFlowIcon name="message"/><h3>Start the conversation</h3><p>Use this private channel for approvals, operational questions, account support, or platform assistance.</p></div>}<div ref={endRef}/></div><form onSubmit={send}><textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength="2000" placeholder="Write a private admin message…" rows="2"/><button className="btn-primary" disabled={!body.trim() || state.sending}><LottieFlowIcon name="message"/>{state.sending ? "Sending…" : "Send"}</button></form></> : <div className="admin-chat-empty"><LottieFlowIcon name="message"/><h3>{state.loading ? "Loading conversations…" : "Select a restaurant"}</h3><p>{state.loading ? "Connecting to the secure admin channel." : "Choose a restaurant conversation from the inbox."}</p></div>}
        </div>
      </section>
    </main>
  );
}