"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Projeto = {
  id: string;
  empresa: string;
  segmento: string;
  whatsapp: string;
  instagram: string;

  plano_desejado?: string;
  prazo_desejado?: string;
  manutencao?: string;

  objetivo: string;
  servicos: string;
  status: string;
  criado_em: string;

  link_site?: string;
  observacoes_projeto?: string;
  progresso?: number;
};

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState<Projeto | null>(
    null
  );
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

  function calcularProgresso(status: string) {
    if (status === "Novo") return 5;
    if (status === "Em análise") return 10;
    if (status === "Contrato enviado") return 20;
    if (status === "Contrato assinado") return 30;
    if (status === "Pagamento entrada") return 40;
    if (status === "Em desenvolvimento") return 60;
    if (status === "Aguardando aprovação") return 85;
    if (status === "Finalizado") return 100;
    return 0;
  }

  async function alterarStatus(id: string, novoStatus: string) {
    const progresso = calcularProgresso(novoStatus);

    const { error } = await supabase
      .from("briefings")
      .update({
        status: novoStatus,
        progresso,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setProjetos((prev) =>
      prev.map((projeto) =>
        projeto.id === id ? { ...projeto, status: novoStatus, progresso } : projeto
      )
    );

    if (projetoSelecionado?.id === id) {
      setProjetoSelecionado((prev) =>
        prev ? { ...prev, status: novoStatus, progresso } : prev
      );
    }
  }

  async function salvarDetalhesProjeto() {
    if (!projetoSelecionado) return;

    const { error } = await supabase
      .from("briefings")
      .update({
        link_site: projetoSelecionado.link_site || "",
        observacoes_projeto: projetoSelecionado.observacoes_projeto || "",
        progresso: projetoSelecionado.progresso || calcularProgresso(projetoSelecionado.status),
      })
      .eq("id", projetoSelecionado.id);

    if (error) {
      alert(error.message);
      return;
    }

    setProjetos((prev) =>
      prev.map((projeto) =>
        projeto.id === projetoSelecionado.id ? projetoSelecionado : projeto
      )
    );

    alert("Projeto atualizado com sucesso!");
  }

  const projetosFiltrados = projetos.filter((projeto) => {
    const textoBusca = busca.toLowerCase();

    return (
      projeto.empresa?.toLowerCase().includes(textoBusca) ||
      projeto.segmento?.toLowerCase().includes(textoBusca) ||
      projeto.whatsapp?.toLowerCase().includes(textoBusca) ||
      projeto.plano_desejado?.toLowerCase().includes(textoBusca)
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
            placeholder="Buscar por empresa, segmento, WhatsApp ou plano..."
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
            {projetosFiltrados.map((projeto) => {
              const progressoAtual =
                projeto.progresso ?? calcularProgresso(projeto.status || "Novo");

              return (
                <div className="table-item" key={projeto.id}>
                  <div>
                    <strong>{projeto.empresa || "Empresa não informada"}</strong>
                    <br />
                    <span>{projeto.plano_desejado || projeto.segmento || "Plano não informado"}</span>
                    <br />
                    <small>{projeto.prazo_desejado || "Prazo não informado"}</small>
                  </div>

                  <div style={{ minWidth: "180px" }}>
                    <small>Progresso: {progressoAtual}%</small>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "#e5e5e5",
                        borderRadius: "999px",
                        overflow: "hidden",
                        marginTop: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: `${progressoAtual}%`,
                          height: "100%",
                          background: "#111",
                        }}
                      />
                    </div>
                  </div>

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

                  <button
                    className="btn-primary"
                    onClick={() =>
                      setProjetoSelecionado({
                        ...projeto,
                        progresso: progressoAtual,
                      })
                    }
                  >
                    Visualizar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {projetoSelecionado && (
        <div className="modal-overlay">
          <div className="report-modal">
            <div className="report-header">
              <div>
                <span>Projeto</span>
                <h2>{projetoSelecionado.empresa || "Empresa não informada"}</h2>
                <p>Status: {projetoSelecionado.status || "Novo"}</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setProjetoSelecionado(null)}
              >
                ✕
              </button>
            </div>

            <div className="report-section">
              <h3>Resumo do projeto</h3>

              <div className="report-grid">
                <div>
                  <small>Empresa</small>
                  <strong>{projetoSelecionado.empresa || "Não informado"}</strong>
                </div>

                <div>
                  <small>Plano</small>
                  <strong>
                    {projetoSelecionado.plano_desejado || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Prazo desejado</small>
                  <strong>
                    {projetoSelecionado.prazo_desejado || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Manutenção</small>
                  <strong>{projetoSelecionado.manutencao || "Não informado"}</strong>
                </div>

                <div>
                  <small>WhatsApp</small>
                  <strong>{projetoSelecionado.whatsapp || "Não informado"}</strong>
                </div>

                <div>
                  <small>Instagram</small>
                  <strong>{projetoSelecionado.instagram || "Não informado"}</strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Progresso</h3>

              <input
                type="number"
                min="0"
                max="100"
                value={projetoSelecionado.progresso || 0}
                onChange={(e) =>
                  setProjetoSelecionado((prev) =>
                    prev
                      ? {
                          ...prev,
                          progresso: Number(e.target.value),
                        }
                      : prev
                  )
                }
              />

              <div
                style={{
                  width: "100%",
                  height: "10px",
                  background: "#e5e5e5",
                  borderRadius: "999px",
                  overflow: "hidden",
                  marginTop: "10px",
                }}
              >
                <div
                  style={{
                    width: `${projetoSelecionado.progresso || 0}%`,
                    height: "100%",
                    background: "#111",
                  }}
                />
              </div>
            </div>

            <div className="report-section">
              <h3>Link do site</h3>

              <input
                placeholder="https://site-do-cliente.com"
                value={projetoSelecionado.link_site || ""}
                onChange={(e) =>
                  setProjetoSelecionado((prev) =>
                    prev
                      ? {
                          ...prev,
                          link_site: e.target.value,
                        }
                      : prev
                  )
                }
              />

              {projetoSelecionado.link_site && (
                <a
                  href={projetoSelecionado.link_site}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ display: "inline-block", marginTop: "10px" }}
                >
                  Abrir site
                </a>
              )}
            </div>

            <div className="report-section">
              <h3>Observações internas</h3>

              <textarea
                placeholder="Ex: Aguardando fotos dos produtos, ajustar cores, revisar página inicial..."
                value={projetoSelecionado.observacoes_projeto || ""}
                onChange={(e) =>
                  setProjetoSelecionado((prev) =>
                    prev
                      ? {
                          ...prev,
                          observacoes_projeto: e.target.value,
                        }
                      : prev
                  )
                }
              />
            </div>

            <div className="report-section">
              <h3>Informações do briefing</h3>

              <div className="report-text">
                <small>Objetivo</small>
                <p>{projetoSelecionado.objetivo || "Não informado"}</p>
              </div>

              <div className="report-text">
                <small>Serviços/produtos</small>
                <p>{projetoSelecionado.servicos || "Não informado"}</p>
              </div>
            </div>

            <div className="report-actions">
              <button className="btn-primary" onClick={salvarDetalhesProjeto}>
                Salvar alterações
              </button>

              <button
                className="btn-dark"
                onClick={() => setProjetoSelecionado(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}