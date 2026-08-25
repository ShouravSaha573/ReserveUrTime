const messageListeners = new Set();
const statusListeners = new Set();
let socket = null;
let retryTimer = null;
let reconnectAttempt = 0;
let manuallyStopped = false;

function socketUrl() {
  const configuredSocket = import.meta.env.VITE_WS_URL;
  const configuredApi = (import.meta.env.VITE_API_URL || "/api").replace(/\/api\/?$/, "");
  // In development, connect straight to the API server. Proxying a long-lived
  // WebSocket through Vite produces ECONNABORTED noise during backend reloads.
  const developmentBackend = `${window.location.protocol}//${window.location.hostname}:5000`;
  const endpoint = configuredSocket || (import.meta.env.DEV && !configuredApi.startsWith("http")
    ? developmentBackend
    : configuredApi);
  const base = endpoint.startsWith("http") || endpoint.startsWith("ws")
    ? new URL(endpoint)
    : new URL(window.location.origin);
  if (base.protocol === "https:") base.protocol = "wss:";
  if (base.protocol === "http:") base.protocol = "ws:";
  base.pathname = "/ws/admin-messages";
  base.search = "";
  return base.toString();
}
function emitStatus(connected) { statusListeners.forEach((listener) => listener(connected)); }
function connect() {
  if (socket || (!messageListeners.size && !statusListeners.size)) return;
  manuallyStopped = false;
  const currentSocket = new WebSocket(socketUrl());
  socket = currentSocket;
  currentSocket.onopen = () => { reconnectAttempt = 0; emitStatus(true); };
  currentSocket.onmessage = (event) => {
    try { const data = JSON.parse(event.data); if (data.type === "admin_message") messageListeners.forEach((listener) => listener(data.message)); } catch { /* Ignore malformed transport frames. */ }
  };
  currentSocket.onerror = () => currentSocket.close();
  currentSocket.onclose = () => {
    if (socket !== currentSocket) return;
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
  if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, "No active subscribers");
  socket = null;
}
export function subscribeAdminMessages(listener) { messageListeners.add(listener); connect(); return () => { messageListeners.delete(listener); maybeStop(); }; }
export function subscribeAdminConnection(listener) { statusListeners.add(listener); listener(socket?.readyState === WebSocket.OPEN); connect(); return () => { statusListeners.delete(listener); maybeStop(); }; }
