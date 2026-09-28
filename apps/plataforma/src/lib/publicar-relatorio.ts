// Publicação do relatório público do lead — após exportar o JSON, commita e empurra
// nos dois repositórios git (o monorepo Studio e o espelho que a Hostinger publica).
// Segurança máxima: nunca usa shell, nunca faz `git add .`, só adiciona o arquivo do
// slug e aborta se o índice já tiver QUALQUER outro arquivo staged.
import { execFile } from "node:child_process";
import { join } from "node:path";

// Fila em memória para serializar publicações: dois cliques seguidos não brigam no git.
let fila: Promise<unknown> = Promise.resolve();

function exec(args: string[], envExtra?: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { timeout: 60000, env: { ...process.env, ...envExtra } }, (err, stdout, stderr) => {
      if (err) {
        const msg = String(stderr || err.message || "").trim();
        reject(new Error(msg || "erro ao executar git"));
      } else {
        resolve(String(stdout));
      }
    });
  });
}

async function publicar(slug: string, empresa: string): Promise<{ publicado: boolean }> {
  const root = join(process.cwd(), "..", "..");
  const rel = "apps/site/src/data/relatorios/" + slug + ".json";

  // ----- REPO 1: monorepo Studio -----
  await exec(["-C", root, "add", rel]);
  const staged = (await exec(["-C", root, "diff", "--cached", "--name-only"]))
    .split("\n").map((s) => s.trim()).filter(Boolean);
  const extra = staged.filter((f) => f !== rel);
  if (extra.length > 0) {
    await exec(["-C", root, "restore", "--staged", rel]);
    throw new Error("publicação abortada: commit incluiria outros arquivos: " + staged.join(", "));
  }
  if (staged.length > 0) {
    await exec(["-C", root, "commit", "-m", "relatorio: " + empresa], { AIOX_ACTIVE_AGENT: "devops" });
    await exec(["-C", root, "push"], { AIOX_ACTIVE_AGENT: "devops" });
  }

  // ----- REPO 2: espelho que a Hostinger publica -----
  const gitDir = join(root, "archive", "git-historico", "site.git");
  const workTree = join(root, "apps", "site");
  const relSite = "src/data/relatorios/" + slug + ".json";
  const gd = ["--git-dir=" + gitDir, "--work-tree=" + workTree];

  await exec([...gd, "add", relSite]);
  const staged2 = (await exec([...gd, "diff", "--cached", "--name-only"]))
    .split("\n").map((s) => s.trim()).filter(Boolean);
  const extra2 = staged2.filter((f) => f !== relSite);
  if (extra2.length > 0) {
    await exec([...gd, "restore", "--staged", relSite]);
    throw new Error("publicação abortada: commit incluiria outros arquivos: " + staged2.join(", "));
  }
  if (staged2.length > 0) {
    await exec([...gd, "commit", "-m", "relatorio: " + empresa], { AIOX_ACTIVE_AGENT: "devops" });
    await exec([...gd, "push", "origin", "main"], { AIOX_ACTIVE_AGENT: "devops" });
  }

  return { publicado: true };
}

export function publicarRelatorio(slug: string, empresa: string): Promise<{ publicado: boolean }> {
  const run = fila.then(() => publicar(slug, empresa));
  fila = run.catch(() => {});
  return run;
}
