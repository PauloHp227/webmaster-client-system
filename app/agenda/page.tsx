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

export default function AgendaPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

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

  const diasDoMes = Array.from({ length: 31 }, (_, index) => index + 1);

  const hoje = new Date();
  const mesAtual = hoje.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  function projetosNoDia(dia: number) {
    return projetos.filter((projeto) => {
      if (!projeto.data_entrega) return false;

      const data = new Date(`${projeto.data_entrega}T00:00:00`);

      return (
        data.getDate() === dia &&
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
      );
    });
  }

  return (
    <AppShell
      title="Agenda"
      subtitle="Acompanhe prazos, entregas e projetos do mês"
    >
      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">📅</div>
          <h3>Com entrega</h3>
          <strong>{carregando ? "..." : projetosComEntrega.length}</strong>
          <p>Projetos com data definida</p>
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
          <span>{mesAtual}</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "12px",
          }}
        >
          {diasDoMes.map((dia) => {
            const itens = projetosNoDia(dia);

            return (
              <div
                key={dia}
                style={{
                  minHeight: "120px",
                  padding: "14px",
                  borderRadius: "18px",
                  background: "rgba(255,255,255,0.055)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <strong>{dia}</strong>

                <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
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
                        }}
                      >
                        <span>
                          {entrega.emoji} {projeto.empresa}
                        </span>
                      </div>
                    );
                  })}
                </div>
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