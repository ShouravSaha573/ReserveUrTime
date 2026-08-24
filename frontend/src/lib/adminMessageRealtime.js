const messageListeners = new Set();
const statusListeners = new Set();
let socket = null;
let retryTimer = null;
let reconnectAttempt = 0;
let manuallyStopped = false;

function socketUrl() {
  const configured = (import.meta.env.VITE_API_URL || "/api").replace(/\/api\/?$/, "");
  const base = configured.startsWith("http") ? new URL(configured) : new URL(window.location.origin);
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = "/ws/admin-messages";
  base.search = "";
  return base.toString();
}
function emitStatus(connected) { statusListeners.forEach((listener) => listener(connected)); }
function connect() {
  if (socket || (!messageListeners.size && !statusListeners.size)) return;
  manuallyStopped = false;
  socket = new WebSocket(socketUrl());
  socket.onopen = () => { reconnectAttempt = 0; emitStatus(true); };
  socket.onmessage = (event) => {
    try { const data = JSON.parse(event.data); if (data.type === "admin_message") messageListeners.forEach((listener) => listener(data.message)); } catch { /* Ignore malformed transport frames. */ }
  };
  socket.onerror = () => socket?.close();
  socket.onclose = () => {
    socket = null;
    emitStatus(false);
    if (manuallyStopped || (!messageListeners.size && !statusListeners.size)) return;
    const delay = Math.min(15000, 1000 * (2 ** reconnectAttempt)) + Math.random() * 350;
    reconnectAttempt = Math.min(reconnectAttempt + 1, 4);
    retryTimer = setTimeout(connect, delay);
  };
}
function maybeStop() {
  if (messageListeners.size || statusListeners.size) return;
  manuallyStopped = true;
  clearTimeout(retryTimer);
  socket?.close();
  socket = null;
}
export function subscribeAdminMessages(listener) { messageListeners.add(listener); connect(); return () => { messageListeners.delete(listener); maybeStop(); }; }
export function subscribeAdminConnection(listener) { statusListeners.add(listener); listener(socket?.readyState === WebSocket.OPEN); connect(); return () => { statusListeners.delete(listener); maybeStop(); }; }