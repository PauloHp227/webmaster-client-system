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

  data_inicio?: string;
  data_entrega?: string;
};

type TarefaProjeto = {
  id: number;
  empresa: string;
  tarefa: string;
  concluida: boolean;
};

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [tarefas, setTarefas] = useState<TarefaProjeto[]>([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState<Projeto | null>(
    null
  );
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarProjetos();
  }, []);

  async function carregarProjetos() {
    const { data: projetosData, error: projetosError } = await supabase
      .from("briefings")
      .select("*")
      .order("criado_em", { ascending: false });

    if (projetosError) {
      alert(projetosError.message);
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

    setProjetos(projetosData || []);
    setTarefas(tarefasData || []);
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

  function tarefasDoProjeto(empresa?: string) {
    if (!empresa) return [];

    return tarefas.filter(
      (item) =>
        item.empresa?.toLowerCase().trim() === empresa.toLowerCase().trim()
    );
  }

  function progressoPorTarefas(empresa?: string) {
    const lista = tarefasDoProjeto(empresa);

    if (lista.length === 0) return null;

    const concluidas = lista.filter((item) => item.concluida).length;

    return Math.round((concluidas / lista.length) * 100);
  }

  function calcularDiasRestantes(dataEntrega?: string) {
    if (!dataEntrega) return null;

    const hoje = new Date();
    const entrega = new Date(`${dataEntrega}T23:59:59`);

    hoje.setHours(0, 0, 0, 0);

    const diferenca = entrega.getTime() - hoje.getTime();

    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  }

  function statusEntrega(dataEntrega?: string) {
    const dias = calcularDiasRestantes(dataEntrega);

    if (dias === null) {
      return {
        texto: "Sem data definida",
        detalhe: "Defina uma data de entrega",
        emoji: "⚪",
      };
    }

    if (dias < 0) {
      return {
        texto: "Atrasado",
        detalhe: `${Math.abs(dias)} dia(s) de atraso`,
        emoji: "🔴",
      };
    }

    if (dias <= 3) {
      return {
        texto: "Vence em breve",
        detalhe: `${dias} dia(s) restante(s)`,
        emoji: "🟡",
      };
    }

    return {
      texto: "Dentro do prazo",
      detalhe: `${dias} dia(s) restante(s)`,
      emoji: "🟢",
    };
  }

  function formatarData(data?: string) {
    if (!data) return "Não definida";

    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function abrirWhatsApp(whatsapp?: string) {
    const telefone = whatsapp?.replace(/\D/g, "");

    if (!telefone) {
      alert("WhatsApp não informado.");
      return;
    }

    window.open(`https://wa.me/55${telefone}`, "_blank");
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
        projeto.id === id
          ? { ...projeto, status: novoStatus, progresso }
          : projeto
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

    const progressoTarefas = progressoPorTarefas(projetoSelecionado.empresa);

    const progressoFinal =
      progressoTarefas !== null
        ? progressoTarefas
        : projetoSelecionado.progresso ||
          calcularProgresso(projetoSelecionado.status);

    const { error } = await supabase
      .from("briefings")
      .update({
        link_site: projetoSelecionado.link_site || "",
        observacoes_projeto: projetoSelecionado.observacoes_projeto || "",
        progresso: progressoFinal,
        data_inicio: projetoSelecionado.data_inicio || null,
        data_entrega: projetoSelecionado.data_entrega || null,
      })
      .eq("id", projetoSelecionado.id);

    if (error) {
      alert(error.message);
      return;
    }

    setProjetos((prev) =>
      prev.map((projeto) =>
        projeto.id === projetoSelecionado.id
          ? { ...projetoSelecionado, progresso: progressoFinal }
          : projeto
      )
    );

    setProjetoSelecionado((prev) =>
      prev ? { ...prev, progresso: progressoFinal } : prev
    );

    alert("Projeto atualizado com sucesso!");
  }

  async function criarTarefasPadrao(empresa: string) {
    if (!empresa) {
      alert("Empresa não informada.");
      return;
    }

    const existentes = tarefasDoProjeto(empresa);

    if (existentes.length > 0) {
      alert("As tarefas deste projeto já foram criadas.");
      return;
    }

    const tarefasPadrao = [
      "Briefing recebido",
      "Contrato assinado",
      "Entrada recebida",
      "Layout criado",
      "Desenvolvimento",
      "Responsivo",
      "Integração WhatsApp",
      "Publicação",
      "Entrega final",
    ];

    const registros = tarefasPadrao.map((tarefa) => ({
      empresa,
      tarefa,
      concluida: false,
    }));

    const { error } = await supabase.from("tarefas_projeto").insert(registros);

    if (error) {
      alert(error.message);
      return;
    }

    await carregarProjetos();

    alert("Checklist do projeto criado com sucesso!");
  }

  async function alterarTarefa(id: number, concluida: boolean) {
    const { error } = await supabase
      .from("tarefas_projeto")
      .update({ concluida })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setTarefas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, concluida } : item))
    );
  }

  const alertasProjetos = projetos
    .filter((projeto) => projeto.status !== "Finalizado")
    .map((projeto) => {
      const entrega = statusEntrega(projeto.data_entrega);
      const progresso =
        progressoPorTarefas(projeto.empresa) ??
        projeto.progresso ??
        calcularProgresso(projeto.status || "Novo");

      if (entrega.texto === "Atrasado") {
        return {
          empresa: projeto.empresa,
          mensagem: `🔴 ${projeto.empresa} está atrasado: ${entrega.detalhe}`,
          detalhe: "Prioridade alta",
        };
      }

      if (entrega.texto === "Vence em breve") {
        return {
          empresa: projeto.empresa,
          mensagem: `🟡 ${projeto.empresa} vence em breve: ${entrega.detalhe}`,
          detalhe: "Acompanhar entrega",
        };
      }

      if (progresso >= 80 && projeto.status !== "Finalizado") {
        return {
          empresa: projeto.empresa,
          mensagem: `🚀 ${projeto.empresa} está com ${progresso}% concluído`,
          detalhe: "Perto da entrega final",
        };
      }

      if (tarefasDoProjeto(projeto.empresa).length === 0) {
        return {
          empresa: projeto.empresa,
          mensagem: `📋 ${projeto.empresa} ainda não possui checklist criado`,
          detalhe: "Criar tarefas do projeto",
        };
      }

      return null;
    })
    .filter(Boolean) as {
    empresa: string;
    mensagem: string;
    detalhe: string;
  }[];

  const projetosFiltrados = projetos
    .filter((projeto) => {
      const textoBusca = busca.toLowerCase();

      return (
        projeto.empresa?.toLowerCase().includes(textoBusca) ||
        projeto.segmento?.toLowerCase().includes(textoBusca) ||
        projeto.whatsapp?.toLowerCase().includes(textoBusca) ||
        projeto.plano_desejado?.toLowerCase().includes(textoBusca)
      );
    })
    .sort((a, b) => {
      const diasA = calcularDiasRestantes(a.data_entrega);
      const diasB = calcularDiasRestantes(b.data_entrega);

      if (diasA === null && diasB === null) return 0;
      if (diasA === null) return 1;
      if (diasB === null) return -1;

      return diasA - diasB;
    });

  const entregasProximas = projetos
    .filter((projeto) => projeto.status !== "Finalizado")
    .filter((projeto) => calcularDiasRestantes(projeto.data_entrega) !== null)
    .sort((a, b) => {
      const diasA = calcularDiasRestantes(a.data_entrega) || 0;
      const diasB = calcularDiasRestantes(b.data_entrega) || 0;

      return diasA - diasB;
    })
    .slice(0, 3);

  return (
    <AppShell title="Projetos" subtitle="Gerencie os projetos dos clientes">
      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">💻</div>
          <h3>Total de projetos</h3>
          <strong>{projetos.length}</strong>
          <p>Projetos registrados</p>
        </div>

        <div className="card">
          <div className="card-icon">🟢</div>
          <h3>Dentro do prazo</h3>
          <strong>
            {
              projetos.filter(
                (projeto) =>
                  statusEntrega(projeto.data_entrega).texto ===
                  "Dentro do prazo"
              ).length
            }
          </strong>
          <p>Projetos saudáveis</p>
        </div>

        <div className="card">
          <div className="card-icon">🟡</div>
          <h3>Vencendo</h3>
          <strong>
            {
              projetos.filter(
                (projeto) =>
                  statusEntrega(projeto.data_entrega).texto ===
                  "Vence em breve"
              ).length
            }
          </strong>
          <p>Entrega próxima</p>
        </div>

        <div className="card">
          <div className="card-icon">🔴</div>
          <h3>Atrasados</h3>
          <strong>
            {
              projetos.filter(
                (projeto) =>
                  statusEntrega(projeto.data_entrega).texto === "Atrasado"
              ).length
            }
          </strong>
          <p>Precisam de atenção</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Alertas do Projeto</h2>
          <span>{alertasProjetos.length} alerta(s)</span>
        </div>

        {alertasProjetos.length === 0 ? (
          <div className="empty-state">
            <h3>Tudo em ordem</h3>
            <p>Nenhum alerta crítico encontrado nos projetos.</p>
          </div>
        ) : (
          <div className="table-list">
            {alertasProjetos.map((alerta, index) => (
              <div className="table-item" key={index}>
                <div>
                  <strong>{alerta.mensagem}</strong>
                  <br />
                  <span>{alerta.detalhe}</span>
                </div>

                <small>CRM Monitor</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Entregas próximas</h2>
          <span>{entregasProximas.length} entrega(s)</span>
        </div>

        {entregasProximas.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma entrega próxima</h3>
            <p>Defina datas de entrega nos projetos para acompanhar prazos.</p>
          </div>
        ) : (
          <div className="table-list">
            {entregasProximas.map((projeto) => {
              const entrega = statusEntrega(projeto.data_entrega);

              return (
                <div className="table-item" key={projeto.id}>
                  <div>
                    <strong>{projeto.empresa || "Empresa não informada"}</strong>
                    <br />
                    <span>{projeto.plano_desejado || "Plano não informado"}</span>
                  </div>

                  <span>
                    {entrega.emoji} {entrega.texto}
                  </span>

                  <span>{entrega.detalhe}</span>

                  <small>Entrega: {formatarData(projeto.data_entrega)}</small>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
              const progressoTarefas = progressoPorTarefas(projeto.empresa);

              const progressoAtual =
                progressoTarefas ??
                projeto.progresso ??
                calcularProgresso(projeto.status || "Novo");

              const entrega = statusEntrega(projeto.data_entrega);

              return (
                <div className="table-item" key={projeto.id}>
                  <div>
                    <strong>{projeto.empresa || "Empresa não informada"}</strong>
                    <br />
                    <span>
                      {projeto.plano_desejado ||
                        projeto.segmento ||
                        "Plano não informado"}
                    </span>
                    <br />
                    <small>
                      Entrega: {formatarData(projeto.data_entrega)}
                    </small>
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

                  <div>
                    <span>
                      {entrega.emoji} {entrega.texto}
                    </span>
                    <br />
                    <small>{entrega.detalhe}</small>
                  </div>

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
                  <strong>
                    {projetoSelecionado.empresa || "Não informado"}
                  </strong>
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
                  <strong>
                    {projetoSelecionado.manutencao || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>WhatsApp</small>
                  <strong>
                    {projetoSelecionado.whatsapp || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Instagram</small>
                  <strong>
                    {projetoSelecionado.instagram || "Não informado"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Prazo e entrega</h3>

              <div className="report-grid">
                <div>
                  <small>Data de início</small>
                  <input
                    type="date"
                    value={projetoSelecionado.data_inicio || ""}
                    onChange={(e) =>
                      setProjetoSelecionado((prev) =>
                        prev
                          ? {
                              ...prev,
                              data_inicio: e.target.value,
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div>
                  <small>Data prevista de entrega</small>
                  <input
                    type="date"
                    value={projetoSelecionado.data_entrega || ""}
                    onChange={(e) =>
                      setProjetoSelecionado((prev) =>
                        prev
                          ? {
                              ...prev,
                              data_entrega: e.target.value,
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div>
                  <small>Status da entrega</small>
                  <strong>
                    {statusEntrega(projetoSelecionado.data_entrega).emoji}{" "}
                    {statusEntrega(projetoSelecionado.data_entrega).texto}
                  </strong>
                </div>

                <div>
                  <small>Dias restantes</small>
                  <strong>
                    {statusEntrega(projetoSelecionado.data_entrega).detalhe}
                  </strong>
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
              <h3>Checklist do projeto</h3>

              {tarefasDoProjeto(projetoSelecionado.empresa).length === 0 ? (
                <div>
                  <p style={{ marginBottom: "15px", color: "#b8b8b8" }}>
                    Nenhuma tarefa criada para este projeto.
                  </p>

                  <button
                    className="btn-primary"
                    onClick={() =>
                      criarTarefasPadrao(projetoSelecionado.empresa)
                    }
                  >
                    Criar checklist padrão
                  </button>
                </div>
              ) : (
                <div className="table-list">
                  {tarefasDoProjeto(projetoSelecionado.empresa).map((tarefa) => (
                    <label
                      key={tarefa.id}
                      className="file-selected-box"
                      style={{ cursor: "pointer" }}
                    >
                      <div>
                        <strong>{tarefa.tarefa}</strong>
                        <span>
                          {tarefa.concluida ? "Concluída" : "Pendente"}
                        </span>
                      </div>

                      <input
                        type="checkbox"
                        checked={tarefa.concluida}
                        onChange={(e) =>
                          alterarTarefa(tarefa.id, e.target.checked)
                        }
                        style={{
                          width: "22px",
                          height: "22px",
                          cursor: "pointer",
                        }}
                      />
                    </label>
                  ))}
                </div>
              )}
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
              <button
                className="btn-primary"
                onClick={() => abrirWhatsApp(projetoSelecionado.whatsapp)}
              >
                Abrir WhatsApp
              </button>

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