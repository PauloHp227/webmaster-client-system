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
  plano_desejado?: string;
  prazo_desejado?: string;
  manutencao?: string;
  status: string;
  criado_em: string;
  link_site?: string;
  progresso?: number;
};

type Contrato = {
  id: number;
  empresa: string;
  servico: string;
  valor_total: string;
  entrada: string;
  restante: string;
  status: string;
  criado_em: string;
};

type TarefaProjeto = {
  id: number;
  empresa: string;
  tarefa: string;
  concluida: boolean;
};

type ClienteUnico = {
  empresa: string;
  briefing?: Briefing;
  contrato?: Contrato;
  tarefas: TarefaProjeto[];
};

function normalizarEmpresa(nome?: string) {
  return nome?.toLowerCase().trim() || "";
}

export default function ClientesPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [tarefas, setTarefas] = useState<TarefaProjeto[]>([]);
  const [clienteSelecionado, setClienteSelecionado] =
    useState<ClienteUnico | null>(null);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    const { data: briefingsData, error: briefingsError } = await supabase
      .from("briefings")
      .select("*")
      .order("criado_em", { ascending: false });

    if (briefingsError) {
      alert(briefingsError.message);
      return;
    }

    const { data: contratosData, error: contratosError } = await supabase
      .from("contratos")
      .select("*")
      .order("criado_em", { ascending: false });

    if (contratosError) {
      alert(contratosError.message);
      return;
    }

    const { data: tarefasData, error: tarefasError } = await supabase
      .from("tarefas_projeto")
      .select("*")
      .order("id", { ascending: true });

    if (tarefasError) {
      alert(tarefasError.message);
      return;
    }

    setBriefings(briefingsData || []);
    setContratos(contratosData || []);
    setTarefas(tarefasData || []);
    setCarregando(false);
  }

  function montarClientes() {
    const mapa = new Map<string, ClienteUnico>();

    briefings.forEach((briefing) => {
      const chave = normalizarEmpresa(briefing.empresa);

      if (!chave) return;

      mapa.set(chave, {
        empresa: briefing.empresa,
        briefing,
        contrato: contratos.find(
          (contrato) =>
            normalizarEmpresa(contrato.empresa) === normalizarEmpresa(briefing.empresa)
        ),
        tarefas: tarefas.filter(
          (tarefa) =>
            normalizarEmpresa(tarefa.empresa) === normalizarEmpresa(briefing.empresa)
        ),
      });
    });

    contratos.forEach((contrato) => {
      const chave = normalizarEmpresa(contrato.empresa);

      if (!chave) return;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          empresa: contrato.empresa,
          contrato,
          tarefas: tarefas.filter(
            (tarefa) =>
              normalizarEmpresa(tarefa.empresa) === normalizarEmpresa(contrato.empresa)
          ),
        });
      }
    });

    return Array.from(mapa.values());
  }

  function calcularProgresso(cliente: ClienteUnico) {
    if (cliente.tarefas.length > 0) {
      const concluidas = cliente.tarefas.filter((tarefa) => tarefa.concluida).length;
      return Math.round((concluidas / cliente.tarefas.length) * 100);
    }

    return cliente.briefing?.progresso || 0;
  }

  function formatarData(data?: string) {
    if (!data) return "Data não informada";

    return new Date(data).toLocaleDateString("pt-BR");
  }

  function abrirWhatsApp(whatsapp?: string) {
    const telefone = whatsapp?.replace(/\D/g, "");

    if (!telefone) {
      alert("WhatsApp não informado.");
      return;
    }

    window.open(`https://wa.me/55${telefone}`, "_blank");
  }

  function copiarContrato(id?: number) {
    if (!id) {
      alert("Contrato não encontrado.");
      return;
    }

    const link = `${window.location.origin}/contrato/${id}`;
    navigator.clipboard.writeText(link);
    alert(`Link do contrato copiado:\n${link}`);
  }

  const clientes = montarClientes();

  const clientesFiltrados = clientes.filter((cliente) => {
    const textoBusca = busca.toLowerCase();

    return (
      cliente.empresa?.toLowerCase().includes(textoBusca) ||
      cliente.briefing?.whatsapp?.toLowerCase().includes(textoBusca) ||
      cliente.briefing?.instagram?.toLowerCase().includes(textoBusca) ||
      cliente.briefing?.plano_desejado?.toLowerCase().includes(textoBusca) ||
      cliente.contrato?.status?.toLowerCase().includes(textoBusca)
    );
  });

  if (carregando) {
    return (
      <AppShell
        title="Clientes"
        subtitle="Centralize briefings, contratos, projetos e financeiro"
      >
        <section className="panel">
          <h2>Carregando clientes...</h2>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Clientes"
      subtitle="Centralize briefings, contratos, projetos e financeiro"
    >
      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">👥</div>
          <h3>Clientes</h3>
          <strong>{clientes.length}</strong>
          <p>Total encontrado</p>
        </div>

        <div className="card">
          <div className="card-icon">📄</div>
          <h3>Com contrato</h3>
          <strong>{clientes.filter((cliente) => cliente.contrato).length}</strong>
          <p>Contratos vinculados</p>
        </div>

        <div className="card">
          <div className="card-icon">🟢</div>
          <h3>Assinados</h3>
          <strong>
            {clientes.filter((cliente) => cliente.contrato?.status === "Assinado").length}
          </strong>
          <p>Contratos assinados</p>
        </div>

        <div className="card">
          <div className="card-icon">💻</div>
          <h3>Em projeto</h3>
          <strong>
            {
              clientes.filter(
                (cliente) =>
                  cliente.briefing?.status === "Em desenvolvimento" ||
                  cliente.briefing?.status === "Aguardando aprovação"
              ).length
            }
          </strong>
          <p>Projetos ativos</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Clientes cadastrados</h2>
          <span>{clientesFiltrados.length} cliente(s)</span>
        </div>

        <div className="filters-row">
          <input
            className="search-input"
            placeholder="Buscar por empresa, WhatsApp, Instagram, plano ou status..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <button className="btn-dark" onClick={carregarClientes}>
            Atualizar
          </button>
        </div>

        {clientesFiltrados.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum cliente encontrado</h3>
            <p>Quando houver briefings ou contratos, os clientes aparecerão aqui.</p>
          </div>
        ) : (
          <div className="table-list">
            {clientesFiltrados.map((cliente) => {
              const progresso = calcularProgresso(cliente);

              return (
                <div className="table-item" key={cliente.empresa}>
                  <div>
                    <strong>{cliente.empresa || "Empresa não informada"}</strong>
                    <br />
                    <span>
                      {cliente.briefing?.plano_desejado ||
                        cliente.contrato?.servico ||
                        "Plano não informado"}
                    </span>
                    <br />
                    <small>
                      Criado em{" "}
                      {formatarData(
                        cliente.briefing?.criado_em || cliente.contrato?.criado_em
                      )}
                    </small>
                  </div>

                  <div>
                    <span>
                      Contrato: {cliente.contrato?.status || "Sem contrato"}
                    </span>
                    <br />
                    <small>
                      Projeto: {cliente.briefing?.status || "Sem projeto"}
                    </small>
                  </div>

                  <div style={{ minWidth: "170px" }}>
                    <small>Progresso: {progresso}%</small>
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
                          width: `${progresso}%`,
                          height: "100%",
                          background: "#111",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={() => setClienteSelecionado(cliente)}
                  >
                    Visualizar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {clienteSelecionado && (
        <div className="modal-overlay">
          <div className="report-modal">
            <div className="report-header">
              <div>
                <span>Ficha do cliente</span>
                <h2>{clienteSelecionado.empresa}</h2>
                <p>
                  Status do contrato:{" "}
                  {clienteSelecionado.contrato?.status || "Sem contrato"}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setClienteSelecionado(null)}
              >
                ✕
              </button>
            </div>

            <div className="report-section">
              <h3>Dados principais</h3>

              <div className="report-grid">
                <div>
                  <small>Empresa</small>
                  <strong>{clienteSelecionado.empresa}</strong>
                </div>

                <div>
                  <small>WhatsApp</small>
                  <strong>
                    {clienteSelecionado.briefing?.whatsapp || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Instagram</small>
                  <strong>
                    {clienteSelecionado.briefing?.instagram || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Plano</small>
                  <strong>
                    {clienteSelecionado.briefing?.plano_desejado ||
                      clienteSelecionado.contrato?.servico ||
                      "Não informado"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Contrato e financeiro</h3>

              <div className="report-grid">
                <div>
                  <small>Status do contrato</small>
                  <strong>
                    {clienteSelecionado.contrato?.status || "Sem contrato"}
                  </strong>
                </div>

                <div>
                  <small>Valor total</small>
                  <strong>
                    {clienteSelecionado.contrato?.valor_total || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Entrada</small>
                  <strong>
                    {clienteSelecionado.contrato?.entrada || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Restante</small>
                  <strong>
                    {clienteSelecionado.contrato?.restante || "Não informado"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Projeto</h3>

              <div className="report-grid">
                <div>
                  <small>Status do projeto</small>
                  <strong>
                    {clienteSelecionado.briefing?.status || "Sem projeto"}
                  </strong>
                </div>

                <div>
                  <small>Prazo desejado</small>
                  <strong>
                    {clienteSelecionado.briefing?.prazo_desejado ||
                      "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Progresso</small>
                  <strong>{calcularProgresso(clienteSelecionado)}%</strong>
                </div>

                <div>
                  <small>Link do site</small>
                  <strong>
                    {clienteSelecionado.briefing?.link_site || "Não informado"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Checklist</h3>

              {clienteSelecionado.tarefas.length === 0 ? (
                <p>Nenhuma tarefa criada para este cliente.</p>
              ) : (
                <div className="table-list">
                  {clienteSelecionado.tarefas.map((tarefa) => (
                    <div className="file-selected-box" key={tarefa.id}>
                      <div>
                        <strong>{tarefa.tarefa}</strong>
                        <span>
                          {tarefa.concluida ? "Concluída" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="report-actions">
              <button
                className="btn-primary"
                onClick={() => abrirWhatsApp(clienteSelecionado.briefing?.whatsapp)}
              >
                Abrir WhatsApp
              </button>

              <button
                className="btn-primary"
                onClick={() => copiarContrato(clienteSelecionado.contrato?.id)}
              >
                Copiar contrato
              </button>

              {clienteSelecionado.briefing?.link_site && (
                <a
                  className="btn-primary"
                  href={clienteSelecionado.briefing.link_site}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir site
                </a>
              )}

              <button
                className="btn-dark"
                onClick={() => setClienteSelecionado(null)}
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