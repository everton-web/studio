// Driver de instalação AIOX via stdin-pipe (sem PTY): autopilot responde
// ENTER nos defaults e "y" nos confirma. Mantém stdin aberto.
import { spawn } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { appendFileSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const LOG = join(HERE, "aiox-install.log");

let buf = "";
let lastSend = 0;
let sent = 0;
let done = false;

const c = spawn("npx -y aiox-core@latest install", { cwd: ROOT, shell: true, stdio: ["pipe", "pipe", "pipe"] });
appendFileSync(LOG, "== inicio pipe-auto ==\n");
function log(t) { appendFileSync(LOG, t + "\n"); process.stderr.write(t + "\n"); }

function send(s) {
  if (done) return;
  c.stdin.write(s);
  lastSend = Date.now(); sent++;
  log(`[envio ${sent}] ${JSON.stringify(s)}`);
}

function pulse() {
  if (done || Date.now() - lastSend < 1000) return;
  const tail = buf.slice(-1200);
  if (/\[y[/]N\]|\([Yy]\/[Nn]\)|Continue|continuar\?\s*\(/i.test(tail)) { send("y\n"); return; }
  if (/\?\s*\(/.test(tail) || /^\s*\?\s*$/m.test(tail) || /\?\s*$/.test(tail) || /:\s*$/.test(tail) || /Enter para confirmar|Enter para confirm/.test(tail)) {
    send("\n"); return;
  }
  if (/Selecione IDE|selecionar, Enter para confir|espaço para selecionar/i.test(tail)) { send("\n"); return; }
}

c.stdout.on("data", (d) => { buf += d; process.stdout.write(d); pulse(); });
c.stderr.on("data", (d) => { process.stdout.write(d); });
c.on("close", (code) => { done = true; log(`== fechou (${code}) ==`); process.exit(0); });
const to = setTimeout(() => { done = true; log("== timeout =="); c.kill(); }, 480000); to.unref();