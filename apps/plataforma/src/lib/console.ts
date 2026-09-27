import { spawn, type IPty } from "node-pty";
import { randomUUID } from "node:crypto";

const CLI = process.env.PI_CLI || "C:/Users/evert/AppData/Roaming/npm/node_modules/@earendil-works/pi-coding-agent/dist/cli.js";
const CWD = process.env.AGENCIA_CWD || "D:/studio";
const MAX_BUFFER = 256 * 1024; // ~256KB de histórico da tela (para re-anexação)

type Session = {
  id: string;
  pty: IPty;
  listeners: Set<(d: string) => void>;
  buffer: string[];
  buffered: number;
};

let current: Session | null = null;

function spawnSession(): Session {
  const id = randomUUID();
  const pty = spawn(process.execPath, [CLI], {
    cols: 110,
    rows: 32,
    name: "xterm-256color",
    cwd: CWD,
  });
  const s: Session = { id, pty, listeners: new Set(), buffer: [], buffered: 0 };
  pty.onData((d) => {
    s.buffer.push(d);
    s.buffered += d.length;
    while (s.buffered > MAX_BUFFER && s.buffer.length > 1) {
      const f = s.buffer.shift()!;
      s.buffered -= f.length;
    }
    for (const l of [...s.listeners]) l(d);
  });
  pty.onExit(() => {
    if (current?.id === id) current = null;
  });
  return s;
}

// UM agente vivo compartilhado: anexa, não cria novo
export function getOrCreateSession() {
  if (!current) current = spawnSession();
  return current;
}

export function getSession(id: string) {
  return current && current.id === id ? current : undefined;
}

export function killSession(id: string) {
  if (current?.id === id) {
    try { current.pty.kill(); } catch { /* já morreu */ }
    current = null;
  }
}

export function writeSession(id: string, data: string) {
  if (current?.id === id) current.pty.write(data);
}

export function resizeSession(id: string, cols: number, rows: number) {
  if (current?.id === id) {
    try { current.pty.resize(cols, rows); } catch { /* ok */ }
  }
}

export function addListener(id: string, cb: (d: string) => void) {
  const s = current;
  if (!s || s.id !== id) return () => {};
  s.listeners.add(cb);
  return () => { s.listeners.delete(cb); };
}

// histórico da tela para re-anexação
export function replayBuffer(id: string) {
  const s = current;
  if (!s || s.id !== id) return "";
  return s.buffer.join("");
}