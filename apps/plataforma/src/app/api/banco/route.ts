import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listarEmpresas } from "@/lib/empresas";

// Leitura autenticada do banco da plataforma. Somente leitura,
// nunca expõe credenciais nem senha.
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const db = getDb();
  const empresas = listarEmpresas();

  const totalEmpresas = Number(
    (db.prepare("SELECT COUNT(*) AS total FROM empresa").get()?.total as number) ?? 0,
  );

  const porEstagio: Record<string, number> = { lead: 0, oportunidade: 0, cliente: 0 };
  for (const linha of db
    .prepare("SELECT estagio_crm, COUNT(*) AS total FROM empresa GROUP BY estagio_crm")
    .all()) {
    const chave = String(linha.estagio_crm);
    if (chave in porEstagio) porEstagio[chave] = Number(linha.total);
  }

  const porOrigem: Record<string, number> = {};
  for (const linha of db
    .prepare("SELECT origem, COUNT(*) AS total FROM empresa GROUP BY origem")
    .all()) {
    const chave = linha.origem == null ? "sem origem" : String(linha.origem);
    porOrigem[chave] = Number(linha.total);
  }

  return NextResponse.json({
    ok: true,
    empresas,
    contagens: { empresas: totalEmpresas, porEstagio, porOrigem },
  });
}
