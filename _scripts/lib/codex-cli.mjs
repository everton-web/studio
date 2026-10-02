// Localiza o codex.exe do app Codex (Microsoft Store). O caminho muda a cada atualização do app
// (OpenAI.Codex_<versão>_x64__...), então nunca fixe a versão: pergunte ao Windows onde ele está.
// CODEX_CLI no ambiente tem prioridade.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

let cache = "";

export function codexCli() {
  if (cache) return cache;
  if (process.env.CODEX_CLI && existsSync(process.env.CODEX_CLI)) return (cache = process.env.CODEX_CLI);
  try {
    const raiz = execFileSync("powershell", ["-NoProfile", "-Command", "(Get-AppxPackage OpenAI.Codex).InstallLocation"], { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/).pop();
    const exe = join(raiz, "app", "resources", "codex.exe");
    if (existsSync(exe)) return (cache = exe);
  } catch { /* sem app instalado */ }
  throw new Error("codex.exe não encontrado: instale o app Codex ou defina CODEX_CLI");
}
