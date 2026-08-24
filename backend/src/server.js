import "dotenv/config";
import { createServer } from "node:http";
import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { validateRuntimeSecurityConfig } from "./config/runtimeSecurity.js";
import { attachAdminMessageWebSocket } from "./realtime/adminMessageHub.js";

const port = Number(process.env.PORT || 5000);

async function start() {
  try {
    validateRuntimeSecurityConfig();
    await connectDB();

    const server = createServer(app);
    attachAdminMessageWebSocket(server);
    server.listen(port, () => {
      console.log(`API running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

start();
