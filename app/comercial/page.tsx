"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Lead = {
  id: string;
  empresa: string;
  segmento: string;
  whatsapp: string;
  instagram: string;
  plano_desejado?: string;
  status: string;
  criado_em: string;
};

const colunas = [
  "Novo",
  "Em análise",
  "Contrato enviado",
  "Contrato assinado",
  "Pagamento entrada",
  "Em desenvolvimento",
  "Aguardando aprovação",
  "Finalizado",
];

export default function ComercialPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarLeads();
  }, []);

  async function carregarLeads() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("briefings")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      alert(error.message);
      setCarregando(false);
      return;
    }

    setLeads(data || []);
    setCarregando(false);
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

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id ? { ...lead, status: novoStatus } : lead
      )
    );
  }

  function abrirWhatsApp(whatsapp?: string) {
    const telefone = whatsapp?.replace(/\D/g, "");

    if (!telefone) {
      alert("WhatsApp não informado.");
      return;
    }

    window.open(`https://wa.me/55${telefone}`, "_blank");
  }

  const leadsFiltrados = leads.filter((lead) => {
    const texto = busca.toLowerCase();

    return (
      lead.empresa?.toLowerCase().includes(texto) ||
      lead.segmento?.toLowerCase().includes(texto) ||
      lead.whatsapp?.toLowerCase().includes(texto) ||
      lead.plano_desejado?.toLowerCase().includes(texto)
    );
  });

  return (
    <AppShell
      title="Pipeline Comercial"
      subtitle="Acompanhe clientes desde o briefing até a entrega final"
    >
      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">📥</div>
          <h3>Novos</h3>
          <strong>
            {carregando
              ? "..."
              : leads.filter((lead) => lead.status === "Novo").length}
          </strong>
          <p>Briefings recebidos</p>
        </div>

        <div className="card">
          <div className="card-icon">📄</div>
          <h3>Contratos enviados</h3>
          <strong>
            {carregando
              ? "..."
              : leads.filter((lead) => lead.status === "Contrato enviado")
                  .length}
          </strong>
          <p>Aguardando assinatura</p>
        </div>

        <div className="card">
          <div className="card-icon">💰</div>
          <h3>Pagamento entrada</h3>
          <strong>
            {carregando
              ? "..."
              : leads.filter((lead) => lead.status === "Pagamento entrada")
                  .length}
          </strong>
          <p>Clientes na etapa financeira</p>
        </div>

        <div className="card">
          <div className="card-icon">🚀</div>
          <h3>Em desenvolvimento</h3>
          <strong>
            {carregando
              ? "..."
              : leads.filter((lead) => lead.status === "Em desenvolvimento")
                  .length}
          </strong>
          <p>Projetos ativos</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Funil de vendas</h2>
          <button
            className="btn-dark"
            onClick={carregarLeads}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        <div className="filters-row">
          <input
            className="search-input"
            placeholder="Buscar por empresa, segmento, WhatsApp ou plano..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(260px, 1fr))",
            gap: "18px",
            overflowX: "auto",
            paddingBottom: "8px",
          }}
        >
          {colunas.map((coluna) => {
            const itens = leadsFiltrados.filter(
              (lead) => (lead.status || "Novo") === coluna
            );

            return (
              <div
                key={coluna}
                style={{
                  background: "rgba(255,255,255,0.055)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "24px",
                  padding: "16px",
                  minHeight: "420px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                  }}
                >
                  <strong>{coluna}</strong>
                  <span style={{ color: "#d6b56d" }}>{itens.length}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {itens.length === 0 ? (
                    <div className="empty-state" style={{ padding: "20px" }}>
                      <p>Nenhum cliente nesta etapa.</p>
                    </div>
                  ) : (
                    itens.map((lead) => (
                      <div
                        key={lead.id}
                        style={{
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: "18px",
                          padding: "15px",
                        }}
                      >
                        <strong>{lead.empresa || "Empresa não informada"}</strong>
                        <br />
                        <span style={{ color: "#b8b8b8", fontSize: "14px" }}>
                          {lead.plano_desejado || lead.segmento || "Plano não informado"}
                        </span>

                        <div style={{ marginTop: "12px" }}>
                          <select
                            className="status-select"
                            value={lead.status || "Novo"}
                            onChange={(e) =>
                              alterarStatus(lead.id, e.target.value)
                            }
                            style={{ width: "100%" }}
                          >
                            {colunas.map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginTop: "12px",
                          }}
                        >
                          <button
                            className="btn-primary"
                            onClick={() => abrirWhatsApp(lead.whatsapp)}
                          >
                            WhatsApp
                          </button>

                          <a href="/briefings" className="btn-dark">
                            Briefing
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}