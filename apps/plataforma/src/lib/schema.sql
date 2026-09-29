PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS empresa (
  id            TEXT PRIMARY KEY,
  nome          TEXT NOT NULL,
  segmento      TEXT,
  cidade        TEXT,
  site          TEXT,
  nota_google   REAL,
  avaliacoes    INTEGER,
  categoria     TEXT,
  estagio_crm   TEXT NOT NULL CHECK (estagio_crm IN ('lead','oportunidade','cliente')),
  estagio_funil INTEGER,
  status        TEXT,
  origem        TEXT,
  criado_em     TEXT,
  atualizado_em TEXT
);

CREATE TABLE IF NOT EXISTS contato (
  id         TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  nome       TEXT,
  whatsapp   TEXT,
  email      TEXT,
  criado_em  TEXT
);
CREATE INDEX IF NOT EXISTS ix_contato_empresa ON contato(empresa_id);

CREATE TABLE IF NOT EXISTS oportunidade (
  id            TEXT PRIMARY KEY,
  empresa_id    TEXT NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  valor         REAL,
  probabilidade INTEGER,
  data_prevista TEXT,
  dono          TEXT,
  criado_em     TEXT
);
CREATE INDEX IF NOT EXISTS ix_oportunidade_empresa ON oportunidade(empresa_id);

CREATE TABLE IF NOT EXISTS projeto (
  id           TEXT PRIMARY KEY,
  empresa_id   TEXT REFERENCES empresa(id) ON DELETE SET NULL,
  nome         TEXT NOT NULL,
  interno      INTEGER NOT NULL DEFAULT 0,
  etapa        TEXT,
  status       TEXT,
  data_entrega TEXT,
  url_producao TEXT,
  url_staging  TEXT,
  repositorio  TEXT,
  checklist_qa TEXT,
  criado_em    TEXT
);
CREATE INDEX IF NOT EXISTS ix_projeto_empresa ON projeto(empresa_id);

CREATE TABLE IF NOT EXISTS contrato (
  id             TEXT PRIMARY KEY,
  empresa_id     TEXT NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  valor          REAL,
  tipo_pagamento TEXT,
  parcelas       INTEGER,
  inicio         TEXT,
  duracao_meses  INTEGER,
  arquivo        TEXT,
  criado_em      TEXT
);
CREATE INDEX IF NOT EXISTS ix_contrato_empresa ON contrato(empresa_id);

CREATE TABLE IF NOT EXISTS credencial (
  id            TEXT PRIMARY KEY,
  empresa_id    TEXT NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  url           TEXT,
  usuario       TEXT,
  senha_cifrada TEXT,
  iv            TEXT,
  tag           TEXT,
  notas         TEXT,
  criado_em     TEXT,
  atualizado_em TEXT
);
CREATE INDEX IF NOT EXISTS ix_credencial_empresa ON credencial(empresa_id);

CREATE TABLE IF NOT EXISTS briefing (
  id          TEXT PRIMARY KEY,
  empresa_id  TEXT REFERENCES empresa(id) ON DELETE SET NULL,
  token       TEXT UNIQUE,
  tipo_pagina TEXT,
  respostas   TEXT,
  enviado_em  TEXT,
  criado_em   TEXT
);

CREATE TABLE IF NOT EXISTS relatorio (
  id         TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  mes        TEXT NOT NULL,
  conteudo   TEXT,
  link_token TEXT UNIQUE,
  gerado_em  TEXT,
  UNIQUE (empresa_id, mes)
);
