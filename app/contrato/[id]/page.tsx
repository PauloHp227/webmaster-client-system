"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
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

  async function imagemParaBase64(url: string) {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise<string>((resolve) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(reader.result as string);
      };

      reader.readAsDataURL(blob);
    });
  }

  async function baixarPDF() {
    if (!contrato) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let y = 18;
    let logoBase64 = "";

    try {
      logoBase64 = await imagemParaBase64("/logo.png");
    } catch (error) {
      console.error("Erro ao carregar logo:", error);
    }

    function fundo() {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
    }

    function rodape() {
      pdf.setDrawColor(220, 220, 220);
      pdf.line(15, pageHeight - 23, pageWidth - 15, pageHeight - 23);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(90, 90, 90);

      pdf.text(
        "Webmaster Digital | webmaster.digital.br@gmail.com | WhatsApp: (11) 99480-8549 | Instagram: @web.masterdigital_",
        pageWidth / 2,
        pageHeight - 15,
        { align: "center" }
      );

      pdf.text(
        `Contrato #${contrato.id} - Documento assinado digitalmente`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    function cabecalho() {
      fundo();

      if (logoBase64) {
        pdf.addImage(logoBase64, "PNG", 15, 10, 38, 28);
      } else {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(170, 0, 0);
        pdf.text("WEBMASTER DIGITAL", 15, 22);
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(25, 25, 25);
      pdf.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", pageWidth - 15, 18, {
        align: "right",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(90, 90, 90);
      pdf.text("Criação de Sites • Landing Pages • Sistemas Web", pageWidth - 15, 25, {
        align: "right",
      });

      pdf.setDrawColor(190, 25, 25);
      pdf.setLineWidth(0.8);
      pdf.line(15, 43, pageWidth - 15, 43);

      y = 54;
    }

    function novaPagina() {
      rodape();
      pdf.addPage();
      cabecalho();
    }

    function verificarEspaco(altura = 12) {
      if (y + altura > pageHeight - 32) {
        novaPagina();
      }
    }

    function titulo(textoTitulo: string) {
      verificarEspaco(14);

      pdf.setTextColor(170, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(textoTitulo, 15, y);

      y += 7;
    }

    function texto(conteudo: string) {
      if (!conteudo) return;

      pdf.setTextColor(35, 35, 35);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      const linhas = pdf.splitTextToSize(conteudo, 180);

      linhas.forEach((linha: string) => {
        verificarEspaco(7);
        pdf.text(linha, 15, y);
        y += 5.3;
      });

      y += 4;
    }

    function campo(label: string, valor: string) {
      verificarEspaco(8);

      pdf.setTextColor(170, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(label, 15, y);

      pdf.setTextColor(25, 25, 25);
      pdf.setFont("helvetica", "normal");

      const linhas = pdf.splitTextToSize(valor || "Não informado", 130);
      pdf.text(linhas, 58, y);

      y += linhas.length * 5.5 + 2;
    }

    function linha() {
      verificarEspaco(8);
      pdf.setDrawColor(230, 230, 230);
      pdf.line(15, y, pageWidth - 15, y);
      y += 8;
    }

    cabecalho();

    titulo("Dados do contrato");
    campo("Empresa:", contrato.empresa);
    campo("Responsável:", assinatura || contrato.responsavel);
    campo("E-mail:", email);
    campo("Telefone:", telefone);
    campo("CPF/CNPJ:", cpfCnpj || "Não informado");
    campo("Status:", "Assinado digitalmente");

    linha();

    titulo("Serviço contratado");
    texto(
      `A Webmaster Digital prestará o serviço de ${contrato.servico} para a empresa ${contrato.empresa}, conforme informações fornecidas pelo contratante e escopo acordado entre as partes.`
    );

    campo("Valor total:", contrato.valor_total);
    campo("Entrada:", contrato.entrada);
    campo("Restante:", contrato.restante);
    campo("Forma de pagamento:", contrato.forma_pagamento);
    campo("Prazo:", contrato.prazo);

    linha();

    titulo("Domínio, hospedagem e acessos");
    texto(
      "A Webmaster Digital realizará a configuração inicial do domínio, hospedagem e serviços necessários para o funcionamento do site, conforme acordado. Sempre que possível, os serviços serão cadastrados utilizando os dados do cliente."
    );

    texto(
      "Após o período inicial incluído no projeto, custos de renovação de domínio, hospedagem, e-mails profissionais ou plataformas de terceiros serão de responsabilidade do contratante."
    );

    texto(
      "A Webmaster Digital poderá manter acesso administrativo durante o desenvolvimento e suporte, exclusivamente para manutenção, configuração e acompanhamento técnico."
    );

    titulo("Garantia e manutenção");
    texto(
      "O projeto contará com 30 dias de garantia após a entrega para correções relacionadas ao desenvolvimento. Alterações de conteúdo, novas páginas, novas funcionalidades ou mudanças fora do escopo inicial poderão ser cobradas separadamente."
    );

    texto(
      "A manutenção mensal é opcional e poderá ser contratada posteriormente mediante valor acordado entre as partes."
    );

    titulo("Cancelamento e reembolso");
    texto(
      "O contratante poderá solicitar cancelamento em até 2 dias corridos após a confirmação do pagamento da entrada, desde que o desenvolvimento ainda não tenha sido iniciado."
    );

    texto(
      "Após esse período, ou após o início do desenvolvimento, planejamento, briefing, configuração de domínio, hospedagem ou qualquer atividade relacionada ao projeto, os valores pagos como entrada não serão reembolsáveis."
    );

    texto(
      "A publicação definitiva do projeto e a entrega final ocorrerão após a confirmação do pagamento integral do valor contratado."
    );

    if (contrato.observacoes) {
      titulo("Observações");
      texto(contrato.observacoes);
    }

    titulo("Assinatura digital");
    campo("Assinado por:", assinatura);
    campo(
      "Data:",
      new Date().toLocaleDateString("pt-BR") +
        " às " +
        new Date().toLocaleTimeString("pt-BR")
    );

    texto(
      "Ao assinar digitalmente este contrato, o contratante declara que leu, compreendeu e concorda com todos os termos descritos neste documento."
    );

    linha();

    titulo("Contato da Webmaster Digital");
    campo("E-mail:", "webmaster.digital.br@gmail.com");
    campo("WhatsApp:", "(11) 99480-8549");
    campo("Instagram:", "@web.masterdigital_");

    rodape();

    const nomeEmpresa =
      contrato.empresa
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
        <section className="briefing-card success-card">
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
      <section className="briefing-card">
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
                <strong>
                  {assinatura || contrato.responsavel || "A preencher"}
                </strong>
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