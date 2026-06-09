"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Briefing = {
  id: string;
  empresa: string;
  segmento: string;
  status: string;
  criado_em: string;
  plano_desejado?: string;
  progresso?: number;
};

type Contrato = {
  id: string;
  empresa: string;
  status: string;
  valor_total: string;
  entrada?: string;
  restante?: string;
  servico?: string;
  criado_em: string;
  entrada_paga?: boolean;
  restante_pago?: boolean;
};

type Notificacao = {
  tipo: string;
  mensagem: string;
};

export default function Home() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
    setCarregando(true);

    const { data: briefingsData, error: briefingsError } = await supabase
      .from("briefings")
      .select("*")
      .order("criado_em", { ascending: false });

    if (briefingsError) {
      alert(briefingsError.message);
      setCarregando(false);
      return;
    }

    const { data: contratosData, error: contratosError } = await supabase
      .from("contratos")
      .select("*")
      .order("criado_em", { ascending: false });

    if (contratosError) {
      alert(contratosError.message);
      setCarregando(false);
      return;
    }

    setBriefings(briefingsData || []);
    setContratos(contratosData || []);
    setCarregando(false);
  }

  function converterValor(valor?: string) {
    if (!valor) return 0;

    const numero = Number(
      String(valor)
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    );

    return isNaN(numero) ? 0 : numero;
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function estaNoMesAtual(data?: string) {
    if (!data) return false;

    const hoje = new Date();
    const dataItem = new Date(data);

    return (
      dataItem.getMonth() === hoje.getMonth() &&
      dataItem.getFullYear() === hoje.getFullYear()
    );
  }

  function nomeMesAtual() {
    return new Date().toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }

  function diasDesdeCriacao(data?: string) {
    if (!data) return 0;

    const hoje = new Date();
    const criado = new Date(data);

    return Math.floor(
      (hoje.getTime() - criado.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  const totalBriefings = briefings.length;

  const projetosEmAndamento = briefings.filter(
    (item) =>
      item.status === "Em desenvolvimento" ||
      item.status === "Pagamento entrada" ||
      item.status === "Contrato assinado" ||
      item.status === "Aguardando aprovação"
  ).length;

  const projetosFinalizados = briefings.filter(
    (item) => item.status === "Finalizado"
  ).length;

  const contratosAssinados = contratos.filter(
    (item) => item.status === "Assinado"
  ).length;

  const contratosPendentes = contratos.filter(
    (item) => item.status !== "Assinado"
  ).length;

  const clientesUnicos = new Set([
    ...briefings.map((item) => item.empresa).filter(Boolean),
    ...contratos.map((item) => item.empresa).filter(Boolean),
  ]).size;

  const receitaTotal = contratos.reduce((total, contrato) => {
    return total + converterValor(contrato.valor_total);
  }, 0);

  const receitaMes = contratos
    .filter((contrato) => estaNoMesAtual(contrato.criado_em))
    .reduce((total, contrato) => {
      return total + converterValor(contrato.valor_total);
    }, 0);

  const valorRecebido = contratos.reduce((total, contrato) => {
    let recebido = 0;

    if (contrato.entrada_paga) {
      recebido += converterValor(contrato.entrada);
    }

    if (contrato.restante_pago) {
      recebido += converterValor(contrato.restante);
    }

    return total + recebido;
  }, 0);

  const valorPendente = contratos.reduce((total, contrato) => {
    let pendente = 0;

    if (!contrato.entrada_paga) {
      pendente += converterValor(contrato.entrada);
    }

    if (!contrato.restante_pago) {
      pendente += converterValor(contrato.restante);
    }

    return total + pendente;
  }, 0);

  const entradaPrevista = contratos.reduce((total, contrato) => {
    return total + converterValor(contrato.entrada);
  }, 0);

  const restantePrevisto = contratos.reduce((total, contrato) => {
    return total + converterValor(contrato.restante);
  }, 0);

  const ticketMedio = contratos.length > 0 ? receitaTotal / contratos.length : 0;

  const contratosAssinadosMes = contratos.filter(
    (contrato) =>
      contrato.status === "Assinado" && estaNoMesAtual(contrato.criado_em)
  ).length;

  const projetosFinalizadosMes = briefings.filter(
    (briefing) =>
      briefing.status === "Finalizado" && estaNoMesAtual(briefing.criado_em)
  ).length;

  const planosVendidos = [
    {
      nome: "Site Básico - R$300",
      quantidade: contratos.filter(
        (contrato) =>
          contrato.valor_total === "R$ 300,00" ||
          contrato.servico?.toLowerCase().includes("básico") ||
          contrato.servico?.toLowerCase().includes("basico")
      ).length,
    },
    {
      nome: "Catálogo Online - R$400",
      quantidade: contratos.filter(
        (contrato) =>
          contrato.valor_total === "R$ 400,00" ||
          contrato.servico?.toLowerCase().includes("catálogo") ||
          contrato.servico?.toLowerCase().includes("catalogo")
      ).length,
    },
    {
      nome: "Loja Virtual Completa - R$700",
      quantidade: contratos.filter(
        (contrato) =>
          contrato.valor_total === "R$ 700,00" ||
          contrato.servico?.toLowerCase().includes("loja")
      ).length,
    },
  ];

  const planoMaisVendido =
    [...planosVendidos].sort((a, b) => b.quantidade - a.quantidade)[0];

  const notificacoes: Notificacao[] = [];

  contratos
    .filter((contrato) => contrato.status !== "Assinado")
    .forEach((contrato) => {
      notificacoes.push({
        tipo: "contrato",
        mensagem: `📄 ${contrato.empresa} ainda não assinou o contrato`,
      });
    });

  contratos
    .filter((contrato) => contrato.status === "Assinado" && !contrato.entrada_paga)
    .forEach((contrato) => {
      notificacoes.push({
        tipo: "pagamento",
        mensagem: `💰 ${contrato.empresa} assinou, mas a entrada ainda não foi marcada como recebida`,
      });
    });

  contratos
    .filter(
      (contrato) =>
        contrato.status === "Assinado" &&
        contrato.entrada_paga &&
        !contrato.restante_pago
    )
    .forEach((contrato) => {
      notificacoes.push({
        tipo: "pagamento",
        mensagem: `⏳ ${contrato.empresa} ainda possui pagamento restante pendente`,
      });
    });

  briefings
    .filter((projeto) => projeto.status === "Aguardando aprovação")
    .forEach((projeto) => {
      notificacoes.push({
        tipo: "aprovacao",
        mensagem: `🟡 ${projeto.empresa} está aguardando aprovação`,
      });
    });

  briefings
    .filter((projeto) => (projeto.progresso || 0) >= 80)
    .forEach((projeto) => {
      notificacoes.push({
        tipo: "finalizacao",
        mensagem: `🚀 ${projeto.empresa} está com ${projeto.progresso}% concluído`,
      });
    });

  briefings
    .filter(
      (projeto) =>
        projeto.status !== "Finalizado" &&
        diasDesdeCriacao(projeto.criado_em) > 15
    )
    .forEach((projeto) => {
      notificacoes.push({
        tipo: "atraso",
        mensagem: `🔴 ${projeto.empresa} está há mais de 15 dias em andamento`,
      });
    });

  const ultimasAtividades = [
    ...briefings.map((item) => ({
      id: `briefing-${item.id}`,
      tipo: "Briefing recebido",
      empresa: item.empresa,
      status: item.status,
      data: item.criado_em,
    })),
    ...contratos.map((item) => ({
      id: `contrato-${item.id}`,
      tipo: "Contrato",
      empresa: item.empresa,
      status: item.status,
      data: item.criado_em,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.data || "").getTime() - new Date(a.data || "").getTime()
    )
    .slice(0, 6);

  const ultimosClientes = Array.from(
    new Map(
      [...briefings, ...contratos].map((item) => [
        item.empresa,
        {
          empresa: item.empresa,
          status: "status" in item ? item.status : "Sem status",
          data: item.criado_em,
        },
      ])
    ).values()
  )
    .filter((item) => item.empresa)
    .sort(
      (a, b) =>
        new Date(b.data || "").getTime() - new Date(a.data || "").getTime()
    )
    .slice(0, 5);

  return (
    <AppShell
      title="Dashboard"
      subtitle="Visão empresarial da Webmaster Digital"
    >
      <section className="hero-panel">
        <div>
          <span>Webmaster Digital CRM</span>
          <h2>Gestão premium para clientes, projetos e contratos</h2>
          <p>
            Acompanhe receita, contratos, briefings, projetos em andamento,
            clientes recentes e desempenho comercial em um só painel.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={carregarDashboard}
          disabled={carregando}
        >
          {carregando ? "Atualizando..." : "Atualizar dados"}
        </button>
      </section>

      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">💰</div>
          <h3>Receita total</h3>
          <strong>{carregando ? "..." : formatarMoeda(receitaTotal)}</strong>
          <p>Valor total em contratos</p>
        </div>

        <div className="card">
          <div className="card-icon">✅</div>
          <h3>Recebido</h3>
          <strong>{carregando ? "..." : formatarMoeda(valorRecebido)}</strong>
          <p>Somente pagamentos marcados como pagos</p>
        </div>

        <div className="card">
          <div className="card-icon">⏳</div>
          <h3>Pendente</h3>
          <strong>{carregando ? "..." : formatarMoeda(valorPendente)}</strong>
          <p>Valor ainda não recebido</p>
        </div>

        <div className="card">
          <div className="card-icon">📆</div>
          <h3>Receita do mês</h3>
          <strong>{carregando ? "..." : formatarMoeda(receitaMes)}</strong>
          <p>{nomeMesAtual()}</p>
        </div>
      </section>

      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">📈</div>
          <h3>Ticket médio</h3>
          <strong>{carregando ? "..." : formatarMoeda(ticketMedio)}</strong>
          <p>Média por contrato</p>
        </div>

        <div className="card">
          <div className="card-icon">🏆</div>
          <h3>Plano mais vendido</h3>
          <strong>{carregando ? "..." : planoMaisVendido.quantidade}</strong>
          <p>{planoMaisVendido.nome}</p>
        </div>

        <div className="card">
          <div className="card-icon">👥</div>
          <h3>Clientes</h3>
          <strong>{carregando ? "..." : clientesUnicos}</strong>
          <p>Total cadastrados</p>
        </div>

        <div className="card">
          <div className="card-icon">💻</div>
          <h3>Projetos ativos</h3>
          <strong>{carregando ? "..." : projetosEmAndamento}</strong>
          <p>Em desenvolvimento ou aprovação</p>
        </div>
      </section>

      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">✅</div>
          <h3>Projetos finalizados</h3>
          <strong>{carregando ? "..." : projetosFinalizados}</strong>
          <p>{projetosFinalizadosMes} finalizado(s) este mês</p>
        </div>

        <div className="card">
          <div className="card-icon">📄</div>
          <h3>Contratos</h3>
          <strong>{carregando ? "..." : contratosAssinados}</strong>
          <p>{contratosPendentes} pendente(s)</p>
        </div>

        <div className="card">
          <div className="card-icon">📝</div>
          <h3>Briefings</h3>
          <strong>{carregando ? "..." : totalBriefings}</strong>
          <p>Formulários recebidos</p>
        </div>

        <div className="card">
          <div className="card-icon">🟢</div>
          <h3>Assinados no mês</h3>
          <strong>{carregando ? "..." : contratosAssinadosMes}</strong>
          <p>Contratos assinados este mês</p>
        </div>
      </section>

      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">💵</div>
          <h3>Entrada prevista</h3>
          <strong>{carregando ? "..." : formatarMoeda(entradaPrevista)}</strong>
          <p>Soma das entradas dos contratos</p>
        </div>

        <div className="card">
          <div className="card-icon">📌</div>
          <h3>Saldo previsto</h3>
          <strong>{carregando ? "..." : formatarMoeda(restantePrevisto)}</strong>
          <p>Soma dos valores restantes</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Central de Notificações</h2>
          <span>{notificacoes.length} alerta(s)</span>
        </div>

        {notificacoes.length === 0 ? (
          <div className="empty-state">
            <h3>Tudo em ordem</h3>
            <p>Nenhuma notificação encontrada.</p>
          </div>
        ) : (
          <div className="table-list">
            {notificacoes.map((item, index) => (
              <div className="table-item" key={index}>
                <div>
                  <strong>{item.mensagem}</strong>
                  <br />
                  <span>Tipo: {item.tipo}</span>
                </div>

                <small>CRM Monitor</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Desempenho comercial</h2>
          <span>Planos vendidos</span>
        </div>

        <div className="table-list">
          {planosVendidos.map((plano) => {
            const maiorQuantidade = Math.max(
              ...planosVendidos.map((item) => item.quantidade),
              1
            );

            const porcentagem = Math.round(
              (plano.quantidade / maiorQuantidade) * 100
            );

            return (
              <div className="table-item" key={plano.nome}>
                <div>
                  <strong>{plano.nome}</strong>
                  <br />
                  <span>{plano.quantidade} contrato(s)</span>
                </div>

                <div style={{ minWidth: "180px" }}>
                  <small>Participação</small>
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
                        width: `${porcentagem}%`,
                        height: "100%",
                        background: "#111",
                      }}
                    />
                  </div>
                </div>

                <span>{porcentagem}%</span>

                <small>Plano comercial</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Últimos clientes</h2>
          <span>Atualizados recentemente</span>
        </div>

        {ultimosClientes.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum cliente ainda</h3>
            <p>Quando houver briefings ou contratos, eles aparecerão aqui.</p>
          </div>
        ) : (
          <div className="table-list">
            {ultimosClientes.map((cliente) => (
              <div className="table-item" key={cliente.empresa}>
                <div>
                  <strong>{cliente.empresa}</strong>
                  <br />
                  <span>{cliente.status || "Sem status"}</span>
                </div>

                <span>
                  {cliente.data
                    ? new Date(cliente.data).toLocaleDateString("pt-BR")
                    : "Data não informada"}
                </span>

                <small>Cliente</small>

                <small>CRM</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Últimas atividades</h2>
          <button
            className="btn-dark"
            onClick={carregarDashboard}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {ultimasAtividades.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhuma atividade ainda</h3>
            <p>
              Quando você receber briefings e contratos assinados, eles
              aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="table-list">
            {ultimasAtividades.map((item) => (
              <div className="table-item" key={item.id}>
                <div>
                  <strong>{item.empresa || "Empresa não informada"}</strong>
                  <br />
                  <span>{item.tipo}</span>
                </div>

                <span>{item.status || "Sem status"}</span>

                <small>
                  {item.data
                    ? new Date(item.data).toLocaleDateString("pt-BR")
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