import { cp, readdir, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Gera out/ pronto para o public_html da Hostinger (Apache/LiteSpeed + PHP).
const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(appDir, "out");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const build = spawnSync(npmCommand, ["run", "build"], {
  cwd: appDir,
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status ?? 1);

await cp(join(appDir, "send-form.php"), join(outDir, "send-form.php"));

// Cache longo só onde o nome do arquivo tem hash (todo _next/static do export,
// inclusive o do protótipo publicado dentro de relatorio/).
const immutable = `<IfModule mod_headers.c>
  Header set Cache-Control "public, max-age=31536000, immutable"
</IfModule>
`;

async function staticDirs(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (entry.name === "_next") {
      const st = join(full, "static");
      if (await stat(st).catch(() => null)) found.push(st);
      continue;
    }
    found.push(...(await staticDirs(full)));
  }
  return found;
}

for (const dir of await staticDirs(outDir)) {
  await writeFile(join(dir, ".htaccess"), immutable);
}

for (const required of [".htaccess", "404.html", "index.html", "send-form.php"]) {
  if (!(await stat(join(outDir, required)).catch(() => null))) {
    console.error(`Faltou ${required} em out/.`);
    process.exit(1);
  }
}

console.log("Export pronto em out/ (com send-form.php e .htaccess).");
