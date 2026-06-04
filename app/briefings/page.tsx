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
  diferencial: string;
  estilo: string;
  status: string;
  criado_em: string;
  arquivo_url?: string;
  arquivo_nome?: string;
  arquivo_tipo?: string;
};

export default function BriefingsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [briefingSelecionado, setBriefingSelecionado] = useState<Briefing | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  useEffect(() => {
    carregarBriefings();
  }, []);

  async function carregarBriefings() {
    const { data, error } = await supabase
      .from("briefings")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setBriefings(data || []);
  }

  async function excluirBriefing(id: string) {
    const confirmar = confirm("Tem certeza que deseja excluir este relatório?");
    if (!confirmar) return;

    const { error } = await supabase.from("briefings").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setBriefings((prev) => prev.filter((item) => item.id !== id));
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

    setBriefings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: novoStatus } : item
      )
    );
  }

  function salvarComoPDF() {
    window.print();
  }

  const briefingsFiltrados = briefings.filter((briefing) => {
    const textoBusca = busca.toLowerCase();

    const combinaBusca =
      briefing.empresa?.toLowerCase().includes(textoBusca) ||
      briefing.segmento?.toLowerCase().includes(textoBusca) ||
      briefing.whatsapp?.toLowerCase().includes(textoBusca);

    const combinaStatus =
      filtroStatus === "Todos" || briefing.status === filtroStatus;

    return combinaBusca && combinaStatus;
  });

  return (
    <AppShell title="Briefings" subtitle="Formulários enviados pelos clientes">
      <section className="panel no-print">
        <div className="panel-header">
          <h2>Briefings recebidos</h2>
          <span>{briefingsFiltrados.length} encontrado(s)</span>
        </div>

        <div className="filters-row">
          <input
            className="search-input"
            placeholder="Buscar por empresa, segmento ou WhatsApp..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="status-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option>Todos</option>
            <option>Novo</option>
            <option>Em análise</option>
            <option>Em desenvolvimento</option>
            <option>Finalizado</option>
          </select>
        </div>

        {briefingsFiltrados.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum briefing encontrado</h3>
            <p>Quando um cliente preencher o formulário, aparecerá aqui.</p>
          </div>
        ) : (
          <div className="table-list">
            {briefingsFiltrados.map((briefing) => (
              <div className="table-item" key={briefing.id}>
                <div>
                  <strong>{briefing.empresa || "Empresa não informada"}</strong>
                  <br />
                  <span>{briefing.segmento || "Segmento não informado"}</span>
                </div>

                <span>{briefing.whatsapp || "WhatsApp não informado"}</span>

                <select
                  className="status-select"
                  value={briefing.status || "Novo"}
                  onChange={(e) => alterarStatus(briefing.id, e.target.value)}
                >
                  <option>Novo</option>
                  <option>Em análise</option>
                  <option>Em desenvolvimento</option>
                  <option>Finalizado</option>
                </select>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    className="btn-primary"
                    onClick={() => setBriefingSelecionado(briefing)}
                  >
                    Visualizar
                  </button>

                  <button
                    className="btn-danger"
                    onClick={() => excluirBriefing(briefing.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {briefingSelecionado && (
        <div className="modal-overlay">
          <div className="report-modal printable-report">
            <div className="report-header">
              <div>
                <span>Relatório de briefing</span>
                <h2>{briefingSelecionado.empresa || "Empresa não informada"}</h2>
                <p>
                  Recebido em{" "}
                  {new Date(briefingSelecionado.criado_em).toLocaleDateString("pt-BR")}
                </p>
                <p>Status: {briefingSelecionado.status || "Novo"}</p>
              </div>

              <button
                className="modal-close no-print"
                onClick={() => setBriefingSelecionado(null)}
              >
                ✕
              </button>
            </div>

            <div className="report-section">
              <h3>Dados da empresa</h3>

              <div className="report-grid">
                <div>
                  <small>Empresa</small>
                  <strong>{briefingSelecionado.empresa || "Não informado"}</strong>
                </div>

                <div>
                  <small>Segmento</small>
                  <strong>{briefingSelecionado.segmento || "Não informado"}</strong>
                </div>

                <div>
                  <small>WhatsApp</small>
                  <strong>{briefingSelecionado.whatsapp || "Não informado"}</strong>
                </div>

                <div>
                  <small>Instagram</small>
                  <strong>{briefingSelecionado.instagram || "Não informado"}</strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Sobre o projeto</h3>

              <div className="report-grid">
                <div>
                  <small>Estilo visual</small>
                  <strong>{briefingSelecionado.estilo || "Não informado"}</strong>
                </div>

                <div>
                  <small>Status</small>
                  <strong>{briefingSelecionado.status || "Novo"}</strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Respostas detalhadas</h3>

              <div className="report-text">
                <small>Objetivo do site</small>
                <p>{briefingSelecionado.objetivo || "Não informado"}</p>
              </div>

              <div className="report-text">
                <small>Serviços ou produtos</small>
                <p>{briefingSelecionado.servicos || "Não informado"}</p>
              </div>

              <div className="report-text">
                <small>Diferenciais da empresa</small>
                <p>{briefingSelecionado.diferencial || "Não informado"}</p>
              </div>
            </div>

            <div className="report-section">
              <h3>Arquivo enviado</h3>

              {briefingSelecionado.arquivo_url ? (
                <div className="file-preview">
                  <strong>{briefingSelecionado.arquivo_nome || "Arquivo"}</strong>

                  {briefingSelecionado.arquivo_tipo?.startsWith("image/") && (
                    <img
                      src={briefingSelecionado.arquivo_url}
                      alt="Arquivo enviado pelo cliente"
                    />
                  )}

                  {briefingSelecionado.arquivo_tipo === "application/pdf" && (
                    <iframe
                      src={briefingSelecionado.arquivo_url}
                      title="PDF enviado"
                    />
                  )}

                  <a
                    href={briefingSelecionado.arquivo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary no-print"
                  >
                    Abrir arquivo
                  </a>
                </div>
              ) : (
                <p>Nenhum arquivo enviado.</p>
              )}
            </div>

            <div className="report-actions no-print">
              <button className="btn-primary" onClick={salvarComoPDF}>
                Salvar relatório em PDF
              </button>

              <button
                className="btn-dark"
                onClick={() => setBriefingSelecionado(null)}
              >
                Fechar relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}