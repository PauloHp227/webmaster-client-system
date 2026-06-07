"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type ArquivoBriefing = {
  nome: string;
  tipo: string;
  url: string;
  caminho?: string;
};

type Briefing = {
  id: string;
  empresa: string;
  segmento: string;
  whatsapp: string;
  instagram: string;

  plano_desejado?: string;
  prazo_desejado?: string;
  manutencao?: string;

  objetivo_selecionado?: string;
  objetivo: string;
  servicos: string;
  diferencial: string;

  estilo: string;
  cores?: string;
  referencias?: string;

  possui_logo?: string;
  materiais?: string;

  status: string;
  criado_em: string;

  arquivo_url?: string;
  arquivo_nome?: string;
  arquivo_tipo?: string;

  arquivos?: ArquivoBriefing[];
};

export default function BriefingsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [briefingSelecionado, setBriefingSelecionado] =
    useState<Briefing | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  useEffect(() => {
    carregarBriefings();
  }, []);

  async function carregarBriefings() {
    const { data, error } = await supabase
      .from("briefings")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setBriefings(data || []);
  }

  async function excluirBriefing(id: string) {
    const confirmar = confirm("Tem certeza que deseja excluir este relatório?");
    if (!confirmar) return;

    const { error } = await supabase.from("briefings").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setBriefings((prev) => prev.filter((item) => item.id !== id));
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

    setBriefings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: novoStatus } : item
      )
    );
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

    const link = `${window.location.origin}/contrato/${data.id}`;

    await navigator.clipboard.writeText(link);

    const mensagem = `Olá! Tudo bem? 😊

Segue o contrato referente ao projeto da sua empresa.

Por favor, leia com atenção e, estando tudo certo, preencha seus dados e assine digitalmente pelo link abaixo:

${link}

Após a assinatura, seguimos com o pagamento da entrada e o início do desenvolvimento do projeto.

Qualquer dúvida, fico à disposição.

Atenciosamente,

Webmaster Digital
🌐 Criação de Sites, Lojas Virtuais e Sistemas Web`;

    const telefoneLimpo = briefing.whatsapp?.replace(/\D/g, "") || "";

    if (telefoneLimpo) {
      const linkWhatsApp = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(
        mensagem
      )}`;

      window.open(linkWhatsApp, "_blank");
    }

    alert(`Contrato criado com sucesso!

O link foi copiado e o WhatsApp foi aberto automaticamente.`);
  }

  function salvarComoPDF() {
    window.print();
  }

  const briefingsFiltrados = briefings.filter((briefing) => {
    const textoBusca = busca.toLowerCase();

    const combinaBusca =
      briefing.empresa?.toLowerCase().includes(textoBusca) ||
      briefing.segmento?.toLowerCase().includes(textoBusca) ||
      briefing.whatsapp?.toLowerCase().includes(textoBusca) ||
      briefing.instagram?.toLowerCase().includes(textoBusca);

    const combinaStatus =
      filtroStatus === "Todos" || briefing.status === filtroStatus;

    return combinaBusca && combinaStatus;
  });

  return (
    <AppShell title="Briefings" subtitle="Formulários enviados pelos clientes">
      <section className="panel no-print">
        <div className="panel-header">
          <h2>Briefings recebidos</h2>
          <span>{briefingsFiltrados.length} encontrado(s)</span>
        </div>

        <div className="filters-row">
          <input
            className="search-input"
            placeholder="Buscar por empresa, segmento, WhatsApp ou Instagram..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="status-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option>Todos</option>
            <option>Novo</option>
            <option>Em análise</option>
            <option>Em desenvolvimento</option>
            <option>Finalizado</option>
          </select>
        </div>

        {briefingsFiltrados.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum briefing encontrado</h3>
            <p>Quando um cliente preencher o formulário, aparecerá aqui.</p>
          </div>
        ) : (
          <div className="table-list">
            {briefingsFiltrados.map((briefing) => (
              <div className="table-item" key={briefing.id}>
                <div>
                  <strong>{briefing.empresa || "Empresa não informada"}</strong>
                  <br />
                  <span>{briefing.segmento || "Segmento não informado"}</span>
                </div>

                <span>{briefing.whatsapp || "WhatsApp não informado"}</span>

                <select
                  className="status-select"
                  value={briefing.status || "Novo"}
                  onChange={(e) => alterarStatus(briefing.id, e.target.value)}
                >
                  <option>Novo</option>
                  <option>Em análise</option>
                  <option>Em desenvolvimento</option>
                  <option>Finalizado</option>
                </select>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    className="btn-primary"
                    onClick={() => setBriefingSelecionado(briefing)}
                  >
                    Visualizar
                  </button>

                  <button
                    className="btn-danger"
                    onClick={() => excluirBriefing(briefing.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {briefingSelecionado && (
        <div className="modal-overlay">
          <div className="report-modal printable-report">
            <div className="report-header">
              <div>
                <span>Relatório de briefing</span>
                <h2>
                  {briefingSelecionado.empresa || "Empresa não informada"}
                </h2>
                <p>
                  Recebido em{" "}
                  {briefingSelecionado.criado_em
                    ? new Date(
                        briefingSelecionado.criado_em
                      ).toLocaleDateString("pt-BR")
                    : "Data não informada"}
                </p>
                <p>Status: {briefingSelecionado.status || "Novo"}</p>
              </div>

              <button
                className="modal-close no-print"
                onClick={() => setBriefingSelecionado(null)}
              >
                ✕
              </button>
            </div>

            <div className="report-section">
              <h3>Dados da empresa</h3>

              <div className="report-grid">
                <div>
                  <small>Empresa</small>
                  <strong>
                    {briefingSelecionado.empresa || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Segmento</small>
                  <strong>
                    {briefingSelecionado.segmento || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>WhatsApp</small>
                  <strong>
                    {briefingSelecionado.whatsapp || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Instagram</small>
                  <strong>
                    {briefingSelecionado.instagram || "Não informado"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Plano e condições</h3>

              <div className="report-grid">
                <div>
                  <small>Plano escolhido</small>
                  <strong>
                    {briefingSelecionado.plano_desejado || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Prazo desejado</small>
                  <strong>
                    {briefingSelecionado.prazo_desejado || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Interesse em manutenção</small>
                  <strong>
                    {briefingSelecionado.manutencao || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Status</small>
                  <strong>{briefingSelecionado.status || "Novo"}</strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Sobre o projeto</h3>

              <div className="report-grid">
                <div>
                  <small>Objetivo selecionado</small>
                  <strong>
                    {briefingSelecionado.objetivo_selecionado ||
                      "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Estilo visual</small>
                  <strong>
                    {briefingSelecionado.estilo || "Não informado"}
                  </strong>
                </div>

                <div>
                  <small>Cores desejadas</small>
                  <strong>{briefingSelecionado.cores || "Não informado"}</strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Respostas detalhadas</h3>

              <div className="report-text">
                <small>Objetivo do site</small>
                <p>{briefingSelecionado.objetivo || "Não informado"}</p>
              </div>

              <div className="report-text">
                <small>Serviços ou produtos</small>
                <p>{briefingSelecionado.servicos || "Não informado"}</p>
              </div>

              <div className="report-text">
                <small>Diferenciais da empresa</small>
                <p>{briefingSelecionado.diferencial || "Não informado"}</p>
              </div>

              <div className="report-text">
                <small>Sites de referência</small>
                <p>{briefingSelecionado.referencias || "Não informado"}</p>
              </div>

              <div className="report-text">
                <small>Possui logo?</small>
                <p>{briefingSelecionado.possui_logo || "Não informado"}</p>
              </div>

              <div className="report-text">
                <small>Materiais disponíveis</small>
                <p>{briefingSelecionado.materiais || "Não informado"}</p>
              </div>
            </div>

            <div className="report-section">
              <h3>Arquivos enviados</h3>

              {briefingSelecionado.arquivos &&
              briefingSelecionado.arquivos.length > 0 ? (
                <div className="file-preview">
                  {briefingSelecionado.arquivos.map((arquivo, index) => (
                    <div key={index} className="file-selected-box">
                      <div>
                        <strong>{arquivo.nome || `Arquivo ${index + 1}`}</strong>
                        <br />
                        <span>{arquivo.tipo || "Tipo não informado"}</span>
                      </div>

                      {arquivo.tipo?.startsWith("image/") && (
                        <img
                          src={arquivo.url}
                          alt={arquivo.nome || "Imagem enviada"}
                        />
                      )}

                      {arquivo.tipo === "application/pdf" && (
                        <iframe
                          src={arquivo.url}
                          title={arquivo.nome || "PDF enviado"}
                        />
                      )}

                      {arquivo.tipo === "video/mp4" && (
                        <video src={arquivo.url} controls />
                      )}

                      <a
                        href={arquivo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary no-print"
                      >
                        Abrir arquivo
                      </a>
                    </div>
                  ))}
                </div>
              ) : briefingSelecionado.arquivo_url ? (
                <div className="file-preview">
                  <strong>{briefingSelecionado.arquivo_nome || "Arquivo"}</strong>

                  {briefingSelecionado.arquivo_tipo?.startsWith("image/") && (
                    <img
                      src={briefingSelecionado.arquivo_url}
                      alt="Arquivo enviado pelo cliente"
                    />
                  )}

                  {briefingSelecionado.arquivo_tipo === "application/pdf" && (
                    <iframe
                      src={briefingSelecionado.arquivo_url}
                      title="PDF enviado"
                    />
                  )}

                  <a
                    href={briefingSelecionado.arquivo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary no-print"
                  >
                    Abrir arquivo
                  </a>
                </div>
              ) : (
                <p>Nenhum arquivo enviado.</p>
              )}
            </div>

            <div className="report-actions no-print">
              <button
                className="btn-primary"
                onClick={() => gerarContrato(briefingSelecionado)}
              >
                📄 Gerar Contrato
              </button>

              <button className="btn-primary" onClick={salvarComoPDF}>
                Salvar relatório em PDF
              </button>

              <button
                className="btn-dark"
                onClick={() => setBriefingSelecionado(null)}
              >
                Fechar relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}