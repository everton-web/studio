// Espelho de apps/plataforma/src/lib/cofre.ts. Mantenha em sincronia.
// Nunca loga senha nem chave. A chave vem só de AGENCIA_COFRE_KEY.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Deriva uma chave de 32 bytes a partir de AGENCIA_COFRE_KEY.
function derivarChave() {
  const chave = process.env.AGENCIA_COFRE_KEY;
  if (!chave) throw new Error("AGENCIA_COFRE_KEY ausente no ambiente");
  return createHash("sha256").update(chave).digest();
}

// Cifra um texto com AES-256-GCM. O iv é sorteado a cada gravação.
export function cifrar(plain) {
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
export function decifrar(cifrado, iv, tag) {
  const decipher = createDecipheriv("aes-256-gcm", derivarChave(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(cifrado, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
