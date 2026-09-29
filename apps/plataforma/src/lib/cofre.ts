import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { getDb } from "./db";

// Deriva uma chave de 32 bytes a partir de AGENCIA_COFRE_KEY.
function derivarChave(): Buffer {
  const chave = process.env.AGENCIA_COFRE_KEY;
  if (!chave) throw new Error("AGENCIA_COFRE_KEY ausente no ambiente");
  return createHash("sha256").update(chave).digest();
}

export interface DadosCredencial {
  label: string;
  url?: string | null;
  usuario?: string | null;
  senha: string;
  notas?: string | null;
}

export interface CredencialCifrada {
  cifrado: string;
  iv: string;
  tag: string;
}

export interface CredencialLida {
  id: string;
  empresa_id: string;
  label: string;
  url: string | null;
  usuario: string | null;
  senha: string;
  notas: string | null;
}

export interface CredencialResumo {
  id: string;
  empresa_id: string;
  label: string;
  url: string | null;
  usuario: string | null;
  notas: string | null;
}

// Cifra um texto com AES-256-GCM. O iv é sorteado a cada gravação.
export function cifrar(plain: string): CredencialCifrada {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derivarChave(), iv);
  const cifrado = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    cifrado: cifrado.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

// Decifra um texto gravado com cifrar. Erro de tag de autenticação propaga.
export function decifrar(cifrado: string, iv: string, tag: string): string {
  const decipher = createDecipheriv("aes-256-gcm", derivarChave(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(cifrado, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

// Grava uma credencial cifrando a senha. A senha em claro nunca chega ao banco.
export function gravarCredencial(empresa_id: string, dados: DadosCredencial): { id: string } {
  const db = getDb();
  const id = randomUUID();
  const { cifrado, iv, tag } = cifrar(dados.senha);
  const agora = new Date().toISOString();
  db.prepare(
    `INSERT INTO credencial
       (id, empresa_id, label, url, usuario, senha_cifrada, iv, tag, notas, criado_em, atualizado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    empresa_id,
    dados.label,
    dados.url ?? null,
    dados.usuario ?? null,
    cifrado,
    iv,
    tag,
    dados.notas ?? null,
    agora,
    agora,
  );
  return { id };
}

// Lê uma credencial pelo id e devolve a senha já decifrada.
export function lerCredencial(id: string): CredencialLida | null {
  const db = getDb();
  const linha = db
    .prepare(
      `SELECT id, empresa_id, label, url, usuario, senha_cifrada, iv, tag, notas
       FROM credencial WHERE id = ?`,
    )
    .get(id);
  if (!linha) return null;
  const senha = decifrar(String(linha.senha_cifrada), String(linha.iv), String(linha.tag));
  return {
    id: String(linha.id),
    empresa_id: String(linha.empresa_id),
    label: String(linha.label),
    url: linha.url == null ? null : String(linha.url),
    usuario: linha.usuario == null ? null : String(linha.usuario),
    senha,
    notas: linha.notas == null ? null : String(linha.notas),
  };
}

// Lista credenciais sem a senha. Sem registro, devolve [].
export function listarCredenciais(empresa_id?: string): CredencialResumo[] {
  const db = getDb();
  const sql = `SELECT id, empresa_id, label, url, usuario, notas FROM credencial`;
  const linhas = empresa_id
    ? db.prepare(`${sql} WHERE empresa_id = ? ORDER BY label`).all(empresa_id)
    : db.prepare(`${sql} ORDER BY label`).all();
  return linhas.map((linha) => ({
    id: String(linha.id),
    empresa_id: String(linha.empresa_id),
    label: String(linha.label),
    url: linha.url == null ? null : String(linha.url),
    usuario: linha.usuario == null ? null : String(linha.usuario),
    notas: linha.notas == null ? null : String(linha.notas),
  }));
}
