// Terminal real (PTY) dentro da pasta PROJETO DIGITAL — conclui a instalação
// do AIOX respondendo os prompts automaticamente (inquirer precisa de TTY).
import { createRequire } from "node:module";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { appendFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const LOG = join(HERE, "aiox-install.log");
const NODEPTY = require(resolve(ROOT, "apps", "plataforma", "node_modules", "node-pty"));

let buf = "";
let lastAnswer = 0;
let finalOK = false;

function log(t) { appendFileSync(LOG, t + "\n"); }

// autopilot: quando aparecer prompt (?), aceita o default; y/n → y
function pulse() {
  const tail = buf.slice(-900);
  const now = Date.now();
  if (now - lastAnswer < 900) return;
  if (/\?/.test(tail) && /[(]\w[/)]\s*$|arrow|select|choose|confir|continue|\[y[/]N\]|\[Y[/]n\]|Yes|yes|OK/.test(tail) === false) {
    // cifrão genérico
  }
  if (/\[y\/N\]|\[Y\/n\]|y\/n|(Yes|yes|Continue|install|later)/i.test(tail) && /^\s*(y|n)/mi.test(tail) === false) {
    c.write("y\r"); lastAnswer = now; log(`[auto] sim → ${tail.slice(-40).replace(/\s+/g, " ")}`); return;
  }
  if (/\?\s*\(/.test(tail)) {
    c.write("\r"); lastAnswer = now; log(`[auto] enter (default)`); return;
  }
  if (/\?\s*$/.test(tail) || /:>?\s*$/.test(tail)) {
    c.write("\r"); lastAnswer = now; log(`[auto] enter`);
  }
}

const c = NODEPTY.spawn("cmd.exe", ["/c", "npx -y aiox-core@latest install"], { cwd: ROOT, name: "xterm-color", cols: 130, rows: 46 });
log("== instalação iniciada ==");
c.onData((d) => {
  buf += d; buf = buf.slice(-6000);
  process.stdout.write(d);
  pulse();
});
c.onExit(({ exitCode }) => { log(`== encerrou (exit ${exitCode}) ==`); finalOK = true; process.exit(exitCode || 0); });
setTimeout(() => { if (!finalOK) { log("== timeout 420s =="); c.kill(); } }, 420000);