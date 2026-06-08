"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Contrato = {
  id: string;
  empresa: string;
  valor_total: string;
  entrada: string;
  restante: string;
  status: string;
  criado_em: string;
};

function converterValor(valor: string) {
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

export default function FinanceiroPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarFinanceiro();
  }, []);

  async function carregarFinanceiro() {
    const { data, error } = await supabase
      .from("contratos")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setContratos(data || []);
    setCarregando(false);
  }

  const contratosFiltrados = contratos.filter((contrato) => {
    const textoBusca = busca.toLowerCase();

    const combinaBusca =
      contrato.empresa?.toLowerCase().includes(textoBusca) ||
      contrato.status?.toLowerCase().includes(textoBusca);

    const combinaStatus =
      filtroStatus === "Todos" || contrato.status === filtroStatus;

    return combinaBusca && combinaStatus;
  });

  const receitaTotal = contratos.reduce(
    (total, item) => total + converterValor(item.valor_total),
    0
  );

  const entradasPrevistas = contratos.reduce(
    (total, item) => total + converterValor(item.entrada),
    0
  );

  const restantePrevisto = contratos.reduce(
    (total, item) => total + converterValor(item.restante),
    0
  );

  const contratosAssinados = contratos.filter(
    (item) => item.status === "Assinado"
  );

  const recebidoEstimado = contratosAssinados.reduce(
    (total, item) => total + converterValor(item.entrada),
    0
  );

  const aReceberEstimado = contratos.reduce((total, item) => {
    if (item.status === "Assinado") {
      return total + converterValor(item.restante);
    }

    return total + converterValor(item.valor_total);
  }, 0);

  const contratosPendentes = contratos.filter(
    (item) => item.status !== "Assinado"
  ).length;

  const ticketMedio =
    contratos.length > 0 ? receitaTotal / contratos.length : 0;

  return (
    <AppShell
      title="Financeiro"
      subtitle="Acompanhe valores, entradas e pagamentos dos projetos"
    >
      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">💰</div>
          <h3>Receita total</h3>
          <strong>{carregando ? "..." : formatarMoeda(receitaTotal)}</strong>
          <p>Total contratado</p>
        </div>

        <div className="card">
          <div className="card-icon">✅</div>
          <h3>Recebido estimado</h3>
          <strong>{carregando ? "..." : formatarMoeda(recebidoEstimado)}</strong>
          <p>Entradas de contratos assinados</p>
        </div>

        <div className="card">
          <div className="card-icon">⏳</div>
          <h3>A receber</h3>
          <strong>{carregando ? "..." : formatarMoeda(aReceberEstimado)}</strong>
          <p>Valores pendentes</p>
        </div>

        <div className="card">
          <div className="card-icon">📈</div>
          <h3>Ticket médio</h3>
          <strong>{carregando ? "..." : formatarMoeda(ticketMedio)}</strong>
          <p>Média por contrato</p>
        </div>
      </section>

      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">📄</div>
          <h3>Contratos</h3>
          <strong>{carregando ? "..." : contratos.length}</strong>
          <p>Total registrados</p>
        </div>

        <div className="card">
          <div className="card-icon">🟢</div>
          <h3>Assinados</h3>
          <strong>{carregando ? "..." : contratosAssinados.length}</strong>
          <p>Contratos concluídos</p>
        </div>

        <div className="card">
          <div className="card-icon">🟡</div>
          <h3>Pendentes</h3>
          <strong>{carregando ? "..." : contratosPendentes}</strong>
          <p>Aguardando assinatura</p>
        </div>

        <div className="card">
          <div className="card-icon">📊</div>
          <h3>Entrada prevista</h3>
          <strong>{carregando ? "..." : formatarMoeda(entradasPrevistas)}</strong>
          <p>Soma das entradas</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Controle financeiro</h2>
          <span>{contratosFiltrados.length} contrato(s)</span>
        </div>

        <div className="filters-row">
          <input
            className="search-input"
            placeholder="Buscar por empresa ou status..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="status-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option>Todos</option>
            <option>Pendente</option>
            <option>Assinado</option>
          </select>
        </div>

        {contratosFiltrados.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum contrato encontrado</h3>
            <p>Quando um contrato for criado, os valores aparecerão aqui.</p>
          </div>
        ) : (
          <div className="table-list">
            {contratosFiltrados.map((contrato) => {
              const total = converterValor(contrato.valor_total);
              const entrada = converterValor(contrato.entrada);
              const restante = converterValor(contrato.restante);

              const entradaStatus =
                contrato.status === "Assinado"
                  ? "Entrada provável recebida"
                  : "Aguardando assinatura";

              const restanteStatus =
                contrato.status === "Assinado"
                  ? "Restante pendente"
                  : "Contrato ainda pendente";

              return (
                <div className="table-item" key={contrato.id}>
                  <div>
                    <strong>{contrato.empresa || "Empresa não informada"}</strong>
                    <br />
                    <span>Status: {contrato.status || "Pendente"}</span>
                    <br />
                    <small>
                      Criado em{" "}
                      {contrato.criado_em
                        ? new Date(contrato.criado_em).toLocaleDateString(
                            "pt-BR"
                          )
                        : "Data não informada"}
                    </small>
                  </div>

                  <div>
                    <strong>{formatarMoeda(total)}</strong>
                    <br />
                    <span>Valor total</span>
                  </div>

                  <div>
                    <strong>{formatarMoeda(entrada)}</strong>
                    <br />
                    <span>{entradaStatus}</span>
                  </div>

                  <div>
                    <strong>{formatarMoeda(restante)}</strong>
                    <br />
                    <span>{restanteStatus}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Resumo operacional</h2>
          <span>Visão rápida</span>
        </div>

        <div className="table-list">
          <div className="table-item">
            <div>
              <strong>Total contratado</strong>
              <br />
              <span>Soma de todos os contratos criados</span>
            </div>

            <span>{formatarMoeda(receitaTotal)}</span>

            <span>{contratos.length} contrato(s)</span>

            <small>Atualizado automaticamente</small>
          </div>

          <div className="table-item">
            <div>
              <strong>Entradas previstas</strong>
              <br />
              <span>Valor inicial dos projetos</span>
            </div>

            <span>{formatarMoeda(entradasPrevistas)}</span>

            <span>{formatarMoeda(restantePrevisto)} restante</span>

            <small>Controle de recebíveis</small>
          </div>
        </div>
      </section>
    </AppShell>
  );
}