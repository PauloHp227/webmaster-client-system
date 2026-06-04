"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Contrato = {
  id: number;
  empresa: string;
  responsavel: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  servico: string;
  valor_total: string;
  forma_pagamento: string;
  entrada: string;
  restante: string;
  prazo: string;
  observacoes: string;
  assinatura: string;
  aceitou_termos: boolean;
  status: string;
  data_assinatura: string;
};

export default function ContratoPage() {
  const params = useParams();
  const id = params.id as string;

  const contratoRef = useRef<HTMLDivElement>(null);

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [assinatura, setAssinatura] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [aceitou, setAceitou] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [assinado, setAssinado] = useState(false);

  useEffect(() => {
    if (id) buscarContrato();
  }, [id]);

  async function buscarContrato() {
    const { data, error } = await supabase
      .from("contratos")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error) {
      console.error("Erro ao buscar contrato:", error);
      setCarregando(false);
      return;
    }

    setContrato(data);
    setAssinatura(data.assinatura || "");
    setEmail(data.email || "");
    setTelefone(data.telefone || "");
    setCpfCnpj(data.cpf_cnpj || "");
    setAssinado(data.status === "Assinado");
    setCarregando(false);
  }

  async function assinarContrato() {
    if (!assinatura.trim()) {
      alert("Digite seu nome.");
      return;
    }

    if (!email.trim()) {
      alert("Digite seu e-mail.");
      return;
    }

    if (!telefone.trim()) {
      alert("Digite seu telefone.");
      return;
    }

    if (!aceitou) {
      alert("Você precisa aceitar os termos do contrato.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("contratos")
      .update({
        assinatura,
        email,
        telefone,
        cpf_cnpj: cpfCnpj,
        aceitou_termos: true,
        status: "Assinado",
        data_assinatura: new Date().toISOString(),
      })
      .eq("id", Number(id));

    setSalvando(false);

    if (error) {
      console.error("Erro ao assinar contrato:", error);
      alert("Erro ao assinar contrato.");
      return;
    }

    setAssinado(true);
  }

  async function baixarPDF() {
    if (!contratoRef.current) return;

    const canvas = await html2canvas(contratoRef.current, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const nomeEmpresa =
      contrato?.empresa
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "cliente";

    pdf.save(`contrato-${nomeEmpresa}.pdf`);
  }

  if (carregando) {
    return (
      <main className="briefing-page">
        <section className="briefing-card">
          <h1>Carregando contrato...</h1>
        </section>
      </main>
    );
  }

  if (!contrato) {
    return (
      <main className="briefing-page">
        <section className="briefing-card">
          <h1>Contrato não encontrado</h1>
        </section>
      </main>
    );
  }

  if (assinado) {
    return (
      <main className="briefing-page">
        <section className="briefing-card success-card" ref={contratoRef}>
          <div className="briefing-brand">
            <img src="/logo.png" alt="Webmaster Digital" />
          </div>

          <div className="success-icon">✅</div>

          <h1>Contrato assinado com sucesso!</h1>

          <p>
            Obrigado, {assinatura || contrato.responsavel || contrato.empresa}. A
            Webmaster Digital recebeu sua assinatura e dará continuidade ao
            projeto.
          </p>

          <div className="report-section">
            <h3>Resumo do contrato</h3>

            <div className="report-grid">
              <div>
                <small>Empresa</small>
                <strong>{contrato.empresa}</strong>
              </div>

              <div>
                <small>Responsável</small>
                <strong>{assinatura}</strong>
              </div>

              <div>
                <small>E-mail</small>
                <strong>{email}</strong>
              </div>

              <div>
                <small>Telefone</small>
                <strong>{telefone}</strong>
              </div>

              <div>
                <small>CPF/CNPJ</small>
                <strong>{cpfCnpj || "Não informado"}</strong>
              </div>

              <div>
                <small>Status</small>
                <strong>Assinado</strong>
              </div>
            </div>
          </div>

          <button className="btn-next" onClick={baixarPDF}>
            Baixar PDF do contrato
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="briefing-page">
      <section className="briefing-card" ref={contratoRef}>
        <div className="briefing-brand">
          <img src="/logo.png" alt="Webmaster Digital" />
        </div>

        <div className="briefing-step">
          <h1>Contrato de Prestação de Serviços</h1>
          <p>Webmaster Digital — Criação de Sites & Design</p>

          <div className="report-section">
            <h3>Dados do contrato</h3>

            <div className="report-grid">
              <div>
                <small>Empresa</small>
                <strong>{contrato.empresa || "Não informado"}</strong>
              </div>

              <div>
                <small>Responsável</small>
                <strong>{assinatura || contrato.responsavel || "A preencher"}</strong>
              </div>

              <div>
                <small>CPF/CNPJ</small>
                <strong>{cpfCnpj || "Opcional"}</strong>
              </div>

              <div>
                <small>Contato</small>
                <strong>{telefone || email || "A preencher"}</strong>
              </div>
            </div>
          </div>

          <div className="report-section">
            <h3>Serviço contratado</h3>

            <p>
              A Webmaster Digital prestará o serviço de{" "}
              <strong>{contrato.servico}</strong> para a empresa{" "}
              <strong>{contrato.empresa}</strong>, conforme informações
              fornecidas pelo contratante e escopo acordado entre as partes.
            </p>

            <div className="report-grid">
              <div>
                <small>Valor total</small>
                <strong>{contrato.valor_total}</strong>
              </div>

              <div>
                <small>Entrada</small>
                <strong>{contrato.entrada}</strong>
              </div>

              <div>
                <small>Restante</small>
                <strong>{contrato.restante}</strong>
              </div>

              <div>
                <small>Prazo</small>
                <strong>{contrato.prazo}</strong>
              </div>
            </div>

            <p>
              Forma de pagamento: <strong>{contrato.forma_pagamento}</strong>
            </p>
          </div>

          <div className="report-section">
            <h3>Domínio, hospedagem e acessos</h3>

            <p>
              A Webmaster Digital realizará a configuração inicial do domínio,
              hospedagem e serviços necessários para o funcionamento do site,
              conforme acordado. Sempre que possível, os serviços serão
              cadastrados utilizando os dados do cliente.
            </p>

            <p>
              Após o período inicial incluído no projeto, custos de renovação de
              domínio, hospedagem, e-mails profissionais ou plataformas de
              terceiros serão de responsabilidade do contratante.
            </p>

            <p>
              A Webmaster Digital poderá manter acesso administrativo durante o
              desenvolvimento e suporte, exclusivamente para manutenção,
              configuração e acompanhamento técnico.
            </p>
          </div>

          <div className="report-section">
            <h3>Garantia e manutenção</h3>

            <p>
              O projeto contará com 30 dias de garantia após a entrega para
              correções relacionadas ao desenvolvimento. Alterações de conteúdo,
              novas páginas, novas funcionalidades ou mudanças fora do escopo
              inicial poderão ser cobradas separadamente.
            </p>

            <p>
              A manutenção mensal é opcional e poderá ser contratada
              posteriormente mediante valor acordado entre as partes.
            </p>
          </div>

          <div className="report-section">
            <h3>Cancelamento e reembolso</h3>

            <p>
              O contratante poderá solicitar cancelamento em até 2 dias corridos
              após a confirmação do pagamento da entrada, desde que o
              desenvolvimento ainda não tenha sido iniciado.
            </p>

            <p>
              Após esse período, ou após o início do desenvolvimento,
              planejamento, briefing, configuração de domínio, hospedagem ou
              qualquer atividade relacionada ao projeto, os valores pagos como
              entrada não serão reembolsáveis.
            </p>

            <p>
              A publicação definitiva do projeto e a entrega final ocorrerão
              após a confirmação do pagamento integral do valor contratado.
            </p>
          </div>

          {contrato.observacoes && (
            <div className="report-section">
              <h3>Observações</h3>
              <p>{contrato.observacoes}</p>
            </div>
          )}

          <div className="report-section">
            <h3>Assinatura digital</h3>

            <label className="field-title">Nome do responsável *</label>
            <input
              placeholder="Digite seu nome"
              value={assinatura}
              onChange={(e) => setAssinatura(e.target.value)}
            />

            <label className="field-title">E-mail *</label>
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="field-title">Telefone *</label>
            <input
              placeholder="Digite seu telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />

            <label className="field-title">CPF/CNPJ (opcional)</label>
            <input
              placeholder="Digite seu CPF ou CNPJ"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
            />

            <label className="check-line">
              <input
                type="checkbox"
                checked={aceitou}
                onChange={(e) => setAceitou(e.target.checked)}
              />
              Li e concordo com os termos deste contrato.
            </label>

            <button
              className="btn-next"
              onClick={assinarContrato}
              disabled={salvando}
            >
              {salvando ? "Assinando..." : "Assinar contrato"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}