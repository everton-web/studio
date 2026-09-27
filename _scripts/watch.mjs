// Watchdog da Agência: mantém o app (Next, porta 3100) no ar.
// Checa a porta a cada 15s e re-sobe se cair. Log em _scripts/app.log
import { spawn } from "node:child_process";
import net from "node:net";
import { appendFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url))); // PROJETO DIGITAL
const APP = join(ROOT, "apps", "plataforma");
const LOG = join(ROOT, "_scripts", "app.log");
const PORT = 3100;
const NODE = process.execPath;
const NEXT = join("node_modules", "next", "dist", "bin", "next");

await mkdir(dirname(LOG), { recursive: true });

function log(msg) {
  const line = `[${new Date().toLocaleString("pt-BR")}] ${msg}\n`;
  appendFile(LOG, line).catch(() => {});
  console.log(line.trim());
}

function isUp() {
  return new Promise((resolve) => {
    const s = net.connect({ port: PORT, host: "127.0.0.1" });
    const done = (v) => { try { s.destroy(); } catch {} resolve(v); };
    s.on("connect", () => done(true));
    s.on("error", () => done(false));
    setTimeout(() => done(false), 1500);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let child = null;
let spawning = false;

async function ensure() {
  if (await isUp() || spawning) return;
  spawning = true;
  log(`porta ${PORT} fora do ar → (re)subindo o app`);
  if (child) { try { child.kill(); } catch {} child = null; }
  child = spawn(NODE, [NEXT, "start", "-p", String(PORT)], { cwd: APP, stdio: "ignore" });
  child.on("exit", (code) => {
    log(`processo do app saiu (code=${code}) — watchdog vai re-subir`);
    child = null;
  });
  for (let i = 0; i < 40; i++) {
    await sleep(2000);
    if (await isUp()) { log("app no ar"); break; }
  }
  spawning = false;
}

log(`watchdog da agência iniciado (porta ${PORT})`);
setInterval(ensure, 15000);
ensure();

// ---------- túnel Cloudflare (app.evertonbrito.com) ----------
import { execFile } from "node:child_process";
const CLOUDFLARED = process.env.CLOUDFLARED || "C:/Program Files (x86)/cloudflared/cloudflared.exe";
const TUNNEL = process.env.TUNNEL_NAME || "agencia";
function tunnelRunning() {
  return new Promise((resolve) => {
    if (process.platform !== "win32") return resolve(true); // na VPS o túnel é serviço do systemd
    execFile("tasklist", ["/FI", "IMAGENAME eq cloudflared.exe", "/NH"], (err, out) => resolve(!err && /cloudflared.exe/i.test(out)));
  });
}
async function ensureTunnel() {
  if (await tunnelRunning()) return;
  log("túnel cloudflared fora do ar → (re)subindo");
  spawn(CLOUDFLARED, ["tunnel", "run", TUNNEL], { stdio: "ignore", detached: true, windowsHide: true }).unref();
}
setInterval(ensureTunnel, 60000);
ensureTunnel();

process.on("SIGINT", () => process.exit(0));