"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Briefing = {
  id: string;
  empresa: string;
  segmento: string;
  whatsapp: string;
  instagram: string;
  objetivo: string;
  servicos: string;
  status: string;
  criado_em: string;
};

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Briefing[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarProjetos();
  }, []);

  async function carregarProjetos() {
    const { data, error } = await supabase
      .from("briefings")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setProjetos(data || []);
  }

  async function alterarStatus(id: string, novoStatus: string) {
    const { error } = await supabase
      .from("briefings")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setProjetos((prev) =>
      prev.map((projeto) =>
        projeto.id === id ? { ...projeto, status: novoStatus } : projeto
      )
    );
  }

  const projetosFiltrados = projetos.filter((projeto) => {
    const textoBusca = busca.toLowerCase();

    return (
      projeto.empresa?.toLowerCase().includes(textoBusca) ||
      projeto.segmento?.toLowerCase().includes(textoBusca) ||
      projeto.whatsapp?.toLowerCase().includes(textoBusca)
    );
  });

  return (
    <AppShell title="Projetos" subtitle="Gerencie os projetos dos clientes">
      <section className="panel">
        <div className="panel-header">
          <h2>Projetos em andamento</h2>
          <span>{projetosFiltrados.length} projeto(s)</span>
        </div>

        <div className="filters-row">
          <input
            className="search-input"
            placeholder="Buscar por empresa, segmento ou WhatsApp..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {projetosFiltrados.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum projeto encontrado</h3>
            <p>Quando um briefing for enviado, ele aparecerá aqui.</p>
          </div>
        ) : (
          <div className="table-list">
            {projetosFiltrados.map((projeto) => (
              <div className="table-item" key={projeto.id}>
                <div>
                  <strong>{projeto.empresa || "Empresa não informada"}</strong>
                  <br />
                  <span>{projeto.segmento || "Segmento não informado"}</span>
                </div>

                <span>{projeto.whatsapp || "WhatsApp não informado"}</span>

                <select
                  className="status-select"
                  value={projeto.status || "Novo"}
                  onChange={(e) => alterarStatus(projeto.id, e.target.value)}
                >
                  <option>Novo</option>
                  <option>Em análise</option>
                  <option>Contrato enviado</option>
                  <option>Contrato assinado</option>
                  <option>Pagamento entrada</option>
                  <option>Em desenvolvimento</option>
                  <option>Aguardando aprovação</option>
                  <option>Finalizado</option>
                </select>

                <small>
                  Recebido em{" "}
                  {projeto.criado_em
                    ? new Date(projeto.criado_em).toLocaleDateString("pt-BR")
                    : "Data não informada"}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}