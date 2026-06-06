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
  objetivo?: string;
  servicos?: string;
  status?: string;
  criado_em?: string;
};

type Contrato = {
  id: number;
  empresa: string;
  servico: string;
  valor_total: string;
  entrada: string;
  restante: string;
  prazo: string;
  status: string;
  criado_em: string;
};

export default function ContratosPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: briefingsData } = await supabase
      .from("briefings")
      .select("*")
      .order("criado_em", { ascending: false });

    const { data: contratosData } = await supabase
      .from("contratos")
      .select("*")
      .order("criado_em", { ascending: false });

    setBriefings(briefingsData || []);
    setContratos(contratosData || []);
    setCarregando(false);
  }

  function dadosDoPlano(plano?: string) {
    if (plano === "Site Básico - R$300") {
      return {
        servico: "Site Básico institucional",
        valor: "R$ 300,00",
        entrada: "R$ 150,00",
        restante: "R$ 150,00",
        garantia: "Este plano não inclui 1 mês de garantia.",
        manutencaoValor: "R$ 50,00/mês",
      };
    }

    if (plano === "Catálogo Online - R$400") {
      return {
        servico: "Catálogo Online profissional",
        valor: "R$ 400,00",
        entrada: "R$ 200,00",
        restante: "R$ 200,00",
        garantia: "Este plano inclui 1 mês de garantia após a entrega.",
        manutencaoValor: "R$ 65,00/mês",
      };
    }

    if (plano === "Loja Virtual Completa - R$700") {
      return {
        servico: "Loja Virtual Completa com catálogo, carrinho e vendas online",
        valor: "R$ 700,00",
        entrada: "R$ 350,00",
        restante: "R$ 350,00",
        garantia: "Este plano inclui 1 mês de garantia após a entrega.",
        manutencaoValor: "R$ 80,00/mês",
      };
    }

    return {
      servico: "Projeto personalizado de site",
      valor: "A definir",
      entrada: "A definir",
      restante: "A definir",
      garantia: "Garantia definida conforme o plano aprovado.",
      manutencaoValor: "A definir",
    };
  }

  async function gerarContrato(briefing: Briefing) {
    const plano = dadosDoPlano(briefing.plano_desejado);

    const observacoes = `
Plano escolhido: ${briefing.plano_desejado || "Não informado"}.

Prazo desejado pelo cliente: ${briefing.prazo_desejado || "Não informado"}.

Interesse em manutenção: ${briefing.manutencao || "Não informado"}.

Garantia: ${plano.garantia}

Manutenção opcional: ${plano.manutencaoValor}.

Objetivo informado: ${briefing.objetivo || "Não informado"}.

Serviços/produtos informados: ${briefing.servicos || "Não informado"}.
`;

    const { data, error } = await supabase
      .from("contratos")
      .insert([
        {
          empresa: briefing.empresa,
          responsavel: "",
          cpf_cnpj: "",
          email: "",
          telefone: "",
          servico: plano.servico,
          valor_total: plano.valor,
          forma_pagamento: "50% na entrada e 50% na entrega",
          entrada: plano.entrada,
          restante: plano.restante,
          prazo:
            briefing.prazo_desejado ||
            "Prazo definido após envio das informações necessárias",
          observacoes,
          assinatura: null,
          aceitou_termos: false,
          status: "Pendente",
          data_assinatura: null,
        },
      ])
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    await carregarDados();

    const link = `${window.location.origin}/contrato/${data.id}`;

    await navigator.clipboard.writeText(link);

    alert(`Contrato criado com sucesso!\n\nLink copiado:\n${link}`);
  }

  function contratoJaExiste(empresa: string) {
    return contratos.some(
      (contrato) =>
        contrato.empresa?.toLowerCase().trim() ===
        empresa?.toLowerCase().trim()
    );
  }

  if (carregando) {
    return (
      <AppShell
        title="Contratos"
        subtitle="Gere contratos automaticamente a partir dos briefings"
      >
        <section className="panel">
          <h2>Carregando contratos...</h2>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Contratos"
      subtitle="Gere contratos automaticamente a partir dos briefings"
    >
      <section className="panel">
        <div className="panel-header">
          <h2>Gerar contrato pelo briefing</h2>
          <span>{briefings.length} briefing(s)</span>
        </div>

        {briefings.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum briefing encontrado</h3>
            <p>Quando um cliente preencher o formulário, aparecerá aqui.</p>
          </div>
        ) : (
          <div className="table-list">
            {briefings.map((briefing) => {
              const plano = dadosDoPlano(briefing.plano_desejado);
              const jaExiste = contratoJaExiste(briefing.empresa);

              return (
                <div className="table-item" key={briefing.id}>
                  <div>
                    <strong>
                      {briefing.empresa || "Empresa não informada"}
                    </strong>
                    <br />
                    <span>{briefing.plano_desejado || "Plano não informado"}</span>
                    <br />
                    <small>
                      {plano.valor} • Entrada {plano.entrada}
                    </small>
                  </div>

                  <div>
                    <span>{briefing.prazo_desejado || "Prazo não informado"}</span>
                    <br />
                    <small>
                      Manutenção: {briefing.manutencao || "Não informado"}
                    </small>
                  </div>

                  {jaExiste ? (
                    <button className="btn-dark" disabled>
                      Contrato já criado
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => gerarContrato(briefing)}
                    >
                      Gerar contrato
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Contratos criados</h2>
          <span>{contratos.length} contrato(s)</span>
        </div>

        {contratos.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum contrato criado</h3>
            <p>Os contratos gerados aparecerão aqui.</p>
          </div>
        ) : (
          <div className="table-list">
            {contratos.map((contrato) => (
              <div className="table-item" key={contrato.id}>
                <div>
                  <strong>{contrato.empresa || "Empresa não informada"}</strong>
                  <br />
                  <span>{contrato.servico || "Serviço não informado"}</span>
                </div>

                <span>{contrato.valor_total || "Valor não informado"}</span>

                <span>{contrato.status || "Pendente"}</span>

                <button
                  className="btn-primary"
                  onClick={() => {
                    const link = `${window.location.origin}/contrato/${contrato.id}`;
                    navigator.clipboard.writeText(link);
                    alert(`Link copiado:\n${link}`);
                  }}
                >
                  Copiar link
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}