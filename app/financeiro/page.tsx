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

  return Number(
    valor
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim()
  );
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function FinanceiroPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
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

  const receitaTotal = contratos.reduce(
    (total, item) => total + converterValor(item.valor_total),
    0
  );

  const entradas = contratos.reduce(
    (total, item) => total + converterValor(item.entrada),
    0
  );

  const restante = contratos.reduce(
    (total, item) => total + converterValor(item.restante),
    0
  );

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
          <h3>Entrada</h3>
          <strong>{carregando ? "..." : formatarMoeda(entradas)}</strong>
          <p>Valor inicial previsto</p>
        </div>

        <div className="card">
          <div className="card-icon">⏳</div>
          <h3>Restante</h3>
          <strong>{carregando ? "..." : formatarMoeda(restante)}</strong>
          <p>Valor a receber</p>
        </div>

        <div className="card">
          <div className="card-icon">📄</div>
          <h3>Contratos</h3>
          <strong>{carregando ? "..." : contratos.length}</strong>
          <p>Total registrados</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Controle financeiro</h2>
          <span>{contratos.length} contrato(s)</span>
        </div>

        {contratos.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum contrato encontrado</h3>
            <p>Quando um contrato for criado, os valores aparecerão aqui.</p>
          </div>
        ) : (
          <div className="table-list">
            {contratos.map((contrato) => (
              <div className="table-item" key={contrato.id}>
                <div>
                  <strong>{contrato.empresa || "Empresa não informada"}</strong>
                  <br />
                  <span>Status: {contrato.status || "Pendente"}</span>
                </div>

                <span>Total: {contrato.valor_total || "R$ 0,00"}</span>

                <span>Entrada: {contrato.entrada || "R$ 0,00"}</span>

                <span>Restante: {contrato.restante || "R$ 0,00"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}