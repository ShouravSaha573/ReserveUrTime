import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendRoot = path.resolve(frontendRoot, "../backend");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = new Set();
let stopping = false;

function run(args, cwd) {
  // Recent Node versions on Windows reject direct spawning of .cmd files.
  const command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : npmCommand;
  const commandArgs = process.platform === "win32"
    ? ["/d", "/s", "/c", npmCommand, ...args]
    : args;
  const child = spawn(command, commandArgs, { cwd, stdio: "inherit" });
  children.add(child);
  child.once("exit", () => children.delete(child));
  return child;
}

async function backendIsHealthy() {
  try {
    const response = await fetch("http://localhost:5000/api/health", {
      signal: AbortSignal.timeout(1_000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = exitCode;
}

async function waitForBackend(child) {
  const deadline = Date.now() + 75_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error("Backend stopped before it became ready. Check the error above.");
    }
    if (await backendIsHealthy()) return;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error("Backend did not become ready within 75 seconds. Check MongoDB/network access and backend/.env.");
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

try {
  let backend = null;
  if (!(await backendIsHealthy())) {
    console.log("Starting ReserveUrTime backend and waiting for port 5000...");
    backend = run(["run", "dev"], backendRoot);
    await waitForBackend(backend);
  } else {
    console.log("Using the backend already running on http://localhost:5000.");
  }

  console.log("Backend is ready. Starting Vite...");
  const frontend = run(["run", "dev:frontend"], frontendRoot);
  frontend.once("exit", (code) => stop(code || 0));
  backend?.once("exit", (code) => {
    if (!stopping) {
      console.error("Backend stopped; closing Vite to avoid proxy connection errors.");
      stop(code || 1);
    }
  });
} catch (error) {
  console.error(`Development startup failed: ${error.message}`);
  stop(1);
}
