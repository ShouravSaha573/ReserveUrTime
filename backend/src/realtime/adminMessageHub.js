import jwt from "jsonwebtoken";
import { WebSocketServer, WebSocket } from "ws";
import { User } from "../models/User.js";
import { COOKIE_NAME } from "../utils/authCookie.js";
import { getAllowedClientOrigins } from "../config/runtimeSecurity.js";

const clients = new Set();
const cookieValue = (header = "", name) => header.split(";").map((part) => part.trim()).find((part) => part.startsWith(name + "="))?.slice(name.length + 1);

export function publishAdminMessage(message) {
  const payload = JSON.stringify({ type: "admin_message", message });
  for (const client of clients) {
    const allowed = client.user.role === "platform_admin" || String(client.user.restaurantId) === String(message.restaurantId);
    if (allowed && client.socket.readyState === WebSocket.OPEN) client.socket.send(payload);
  }
}

export function attachAdminMessageWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  const allowedOrigins = new Set(getAllowedClientOrigins());

  server.on("upgrade", async (request, socket, head) => {
    socket.on("error", () => { /* Peer disconnects during authorization are expected. */ });
    try {
      const url = new URL(request.url, "http://localhost");
      if (url.pathname !== "/ws/admin-messages") {
        socket.end("HTTP/1.1 404 Not Found\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
        return;
      }
      if (request.headers.origin && !allowedOrigins.has(request.headers.origin)) throw new Error("Origin rejected");
      const token = decodeURIComponent(cookieValue(request.headers.cookie, COOKIE_NAME) || "");
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select("_id role restaurantId isActive +authVersion").lean();
      if (!user?.isActive || !["restaurant_admin", "platform_admin"].includes(user.role) || Number(payload.ver) !== Number(user.authVersion || 0)) throw new Error("Unauthorized");
      wss.handleUpgrade(request, socket, head, (ws) => wss.emit("connection", ws, request, user));
    } catch {
      // Finish the HTTP upgrade request cleanly. Destroying the socket
      // immediately after write() can discard the buffered 401 response and
      // makes Vite's WebSocket proxy report a misleading ECONNABORTED error.
      socket.end(
        "HTTP/1.1 401 Unauthorized\r\n" +
        "Connection: close\r\n" +
        "Content-Length: 0\r\n" +
        "\r\n"
      );
    }
  });

  wss.on("connection", (socket, request, user) => {
    const client = { socket, user, alive: true };
    clients.add(client);
    socket.on("pong", () => { client.alive = true; });
    socket.on("error", () => clients.delete(client));
    socket.on("close", () => clients.delete(client));
    socket.send(JSON.stringify({ type: "connected" }));
  });

  const heartbeat = setInterval(() => {
    for (const client of clients) {
      if (client.socket.readyState !== WebSocket.OPEN) { clients.delete(client); continue; }
      if (!client.alive) { client.socket.terminate(); clients.delete(client); continue; }
      client.alive = false;
      client.socket.ping();
    }
  }, 30000);
  wss.on("close", () => clearInterval(heartbeat));
  return wss;
}
