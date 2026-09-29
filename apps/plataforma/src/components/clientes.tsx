"use client";

import { useCallback, useEffect, useState } from "react";

type Cliente = { id: string; nome: string; status: string; segmento: string };

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregado, setCarregado] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/clientes");
      if (r.status === 401) {
        location.href = "/login";
        return;
      }
      const j = await r.json();
      setClientes(Array.isArray(j.clientes) ? j.clientes : []);
    } catch {
      /* offline */
    } finally {
      setCarregado(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!carregado) {
    return <div className="text-[.85rem] text-[#8a8a85]">carregando clientes…</div>;
  }

  if (clientes.length === 0) {
    return (
      <div className="card p-8 text-center text-[.84rem] text-[#6b6b66] text-balance">
        Nenhum cliente cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {clientes.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--line)] last:border-0"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[.88rem] font-medium truncate">{c.nome}</div>
            {c.segmento && (
              <div className="mono mt-0.5" style={{ fontSize: "0.62rem" }}>
                {c.segmento}
              </div>
            )}
          </div>
          {c.status && <span className="chip shrink-0">{c.status}</span>}
        </div>
      ))}
    </div>
  );
}
