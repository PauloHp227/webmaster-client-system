"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Projeto = {
  id: string;
  empresa: string;
  segmento: string;
  status: string;
  criado_em: string;
  plano_desejado?: string;
  data_inicio?: string;
  data_entrega?: string;
};

type DiaCalendario = {
  dia: number | null;
  dataCompleta: Date | null;
};

export default function AgendaPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [dataBase, setDataBase] = useState(new Date());

  useEffect(() => {
    carregarAgenda();
  }, []);

  async function carregarAgenda() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("briefings")
      .select("*")
      .order("data_entrega", { ascending: true });

    if (error) {
      alert(error.message);
      setCarregando(false);
      return;
    }

    setProjetos(data || []);
    setCarregando(false);
  }

  function formatarData(data?: string) {
    if (!data) return "Não definida";

    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function diasRestantes(dataEntrega?: string) {
    if (!dataEntrega) return null;

    const hoje = new Date();
    const entrega = new Date(`${dataEntrega}T23:59:59`);

    hoje.setHours(0, 0, 0, 0);

    const diferenca = entrega.getTime() - hoje.getTime();

    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  }

  function statusEntrega(dataEntrega?: string) {
    const dias = diasRestantes(dataEntrega);

    if (dias === null) {
      return {
        emoji: "⚪",
        texto: "Sem prazo",
        detalhe: "Defina uma data de entrega",
      };
    }

    if (dias < 0) {
      return {
        emoji: "🔴",
        texto: "Atrasado",
        detalhe: `${Math.abs(dias)} dia(s) de atraso`,
      };
    }

    if (dias <= 3) {
      return {
        emoji: "🟡",
        texto: "Vence em breve",
        detalhe: `${dias} dia(s) restante(s)`,
      };
    }

    return {
      emoji: "🟢",
      texto: "Dentro do prazo",
      detalhe: `${dias} dia(s) restante(s)`,
    };
  }

  function mesmoDia(dataA: Date, dataB: Date) {
    return (
      dataA.getDate() === dataB.getDate() &&
      dataA.getMonth() === dataB.getMonth() &&
      dataA.getFullYear() === dataB.getFullYear()
    );
  }

  function montarCalendario() {
    const ano = dataBase.getFullYear();
    const mes = dataBase.getMonth();

    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    const totalDias = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();

    const dias: DiaCalendario[] = [];

    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push({
        dia: null,
        dataCompleta: null,
      });
    }

    for (let dia = 1; dia <= totalDias; dia++) {
      dias.push({
        dia,
        dataCompleta: new Date(ano, mes, dia),
      });
    }

    while (dias.length % 7 !== 0) {
      dias.push({
        dia: null,
        dataCompleta: null,
      });
    }

    return dias;
  }

  function mudarMes(valor: number) {
    setDataBase((prev) => {
      return new Date(prev.getFullYear(), prev.getMonth() + valor, 1);
    });
  }

  function voltarMesAtual() {
    setDataBase(new Date());
  }

  function projetosNoDia(dataCompleta: Date | null) {
    if (!dataCompleta) return [];

    return projetos.filter((projeto) => {
      if (!projeto.data_entrega) return false;

      const data = new Date(`${projeto.data_entrega}T00:00:00`);

      return mesmoDia(data, dataCompleta);
    });
  }

  const hoje = new Date();

  const mesAtual = dataBase.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const diasCalendario = montarCalendario();

  const projetosComEntrega = projetos.filter((projeto) => projeto.data_entrega);

  const atrasados = projetosComEntrega.filter(
    (projeto) =>
      projeto.status !== "Finalizado" &&
      (diasRestantes(projeto.data_entrega) ?? 0) < 0
  );

  const vencendo = projetosComEntrega.filter((projeto) => {
    const dias = diasRestantes(projeto.data_entrega);

    return projeto.status !== "Finalizado" && dias !== null && dias >= 0 && dias <= 3;
  });

  const dentroDoPrazo = projetosComEntrega.filter((projeto) => {
    const dias = diasRestantes(projeto.data_entrega);

    return projeto.status !== "Finalizado" && dias !== null && dias > 3;
  });

  const finalizados = projetos.filter((projeto) => projeto.status === "Finalizado");

  const projetosFiltrados = projetos
    .filter((projeto) => {
      const texto = busca.toLowerCase();

      return (
        projeto.empresa?.toLowerCase().includes(texto) ||
        projeto.segmento?.toLowerCase().includes(texto) ||
        projeto.plano_desejado?.toLowerCase().includes(texto) ||
        projeto.status?.toLowerCase().includes(texto)
      );
    })
    .sort((a, b) => {
      const diasA = diasRestantes(a.data_entrega);
      const diasB = diasRestantes(b.data_entrega);

      if (diasA === null && diasB === null) return 0;
      if (diasA === null) return 1;
      if (diasB === null) return -1;

      return diasA - diasB;
    });

  const entregasDoMes = projetosComEntrega.filter((projeto) => {
    if (!projeto.data_entrega) return false;

    const data = new Date(`${projeto.data_entrega}T00:00:00`);

    return (
      data.getMonth() === dataBase.getMonth() &&
      data.getFullYear() === dataBase.getFullYear()
    );
  });

  return (
    <AppShell
      title="Agenda"
      subtitle="Acompanhe prazos, entregas e projetos do mês"
    >
      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">📅</div>
          <h3>Entregas no mês</h3>
          <strong>{carregando ? "..." : entregasDoMes.length}</strong>
          <p>{mesAtual}</p>
        </div>

        <div className="card">
          <div className="card-icon">🔴</div>
          <h3>Atrasados</h3>
          <strong>{carregando ? "..." : atrasados.length}</strong>
          <p>Precisam de atenção</p>
        </div>

        <div className="card">
          <div className="card-icon">🟡</div>
          <h3>Vencendo</h3>
          <strong>{carregando ? "..." : vencendo.length}</strong>
          <p>Até 3 dias</p>
        </div>

        <div className="card">
          <div className="card-icon">🟢</div>
          <h3>No prazo</h3>
          <strong>{carregando ? "..." : dentroDoPrazo.length}</strong>
          <p>Projetos saudáveis</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Calendário de entregas</h2>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button className="btn-dark" onClick={() => mudarMes(-1)}>
              ← Mês anterior
            </button>

            <button className="btn-primary" onClick={voltarMesAtual}>
              Hoje
            </button>

            <button className="btn-dark" onClick={() => mudarMes(1)}>
              Próximo mês →
            </button>
          </div>
        </div>

        <div
          style={{
            marginBottom: "18px",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <span className="page-label">Mês selecionado</span>
            <h2 style={{ marginTop: "6px", textTransform: "capitalize" }}>
              {mesAtual}
            </h2>
          </div>

          <div style={{ color: "#b8b8b8", fontSize: "14px" }}>
            Hoje: {hoje.toLocaleDateString("pt-BR")}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          {diasSemana.map((dia) => (
            <div
              key={dia}
              style={{
                padding: "10px",
                textAlign: "center",
                color: "#d6b56d",
                fontWeight: "bold",
                borderRadius: "12px",
                background: "rgba(214,181,109,0.08)",
                border: "1px solid rgba(214,181,109,0.18)",
              }}
            >
              {dia}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "10px",
          }}
        >
          {diasCalendario.map((item, index) => {
            const itens = projetosNoDia(item.dataCompleta);
            const hojeAtivo =
              item.dataCompleta !== null && mesmoDia(item.dataCompleta, hoje);

            return (
              <div
                key={index}
                style={{
                  minHeight: "135px",
                  padding: "13px",
                  borderRadius: "18px",
                  background: hojeAtivo
                    ? "linear-gradient(135deg, rgba(214,181,109,0.22), rgba(179,0,0,0.18))"
                    : item.dia
                    ? "rgba(255,255,255,0.055)"
                    : "rgba(255,255,255,0.025)",
                  border: hojeAtivo
                    ? "1px solid rgba(214,181,109,0.65)"
                    : "1px solid rgba(255,255,255,0.12)",
                  boxShadow: hojeAtivo
                    ? "0 18px 40px rgba(214,181,109,0.12)"
                    : "none",
                  opacity: item.dia ? 1 : 0.45,
                }}
              >
                {item.dia ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <strong>{item.dia}</strong>

                      {hojeAtivo && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#d6b56d",
                            fontWeight: "bold",
                          }}
                        >
                          Hoje
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        display: "grid",
                        gap: "8px",
                      }}
                    >
                      {itens.map((projeto) => {
                        const entrega = statusEntrega(projeto.data_entrega);

                        return (
                          <div
                            key={projeto.id}
                            style={{
                              fontSize: "12px",
                              padding: "8px",
                              borderRadius: "12px",
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            <span>
                              {entrega.emoji} {projeto.empresa}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <span style={{ color: "#555" }}>—</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Lista de entregas</h2>
          <button
            className="btn-dark"
            onClick={carregarAgenda}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        <div className="filters-row">
          <input
            className="search-input"
            placeholder="Buscar por empresa, plano, segmento ou status..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {projetosFiltrados.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum projeto encontrado</h3>
            <p>Defina datas de entrega nos projetos para aparecer aqui.</p>
          </div>
        ) : (
          <div className="table-list">
            {projetosFiltrados.map((projeto) => {
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
          <h2>Projetos finalizados</h2>
          <span>{finalizados.length} finalizado(s)</span>
        </div>

        {finalizados.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum projeto finalizado</h3>
            <p>Quando finalizar um projeto, ele aparecerá aqui.</p>
          </div>
        ) : (
          <div className="table-list">
            {finalizados.map((projeto) => (
              <div className="table-item" key={projeto.id}>
                <div>
                  <strong>{projeto.empresa}</strong>
                  <br />
                  <span>{projeto.plano_desejado || "Plano não informado"}</span>
                </div>

                <span>✅ Finalizado</span>

                <small>Entrega: {formatarData(projeto.data_entrega)}</small>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}