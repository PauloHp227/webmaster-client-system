"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type ArquivoFormulario = {
  nome: string;
  tipo: string;
  base64: string;
};

type BriefingForm = {
  empresa: string;
  segmento: string;
  whatsapp: string;
  instagram: string;
  objetivoSelecionado: string;
  objetivo: string;
  servicos: string;
  diferencial: string;
  estilo: string;
  cores: string;
  referencias: string;
  possuiLogo: string;
  materiais: string;
  arquivos: ArquivoFormulario[];
};

export default function FormularioClientePage() {
  const [step, setStep] = useState(1);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState<BriefingForm>({
    empresa: "",
    segmento: "",
    whatsapp: "",
    instagram: "",
    objetivoSelecionado: "",
    objetivo: "",
    servicos: "",
    diferencial: "",
    estilo: "",
    cores: "",
    referencias: "",
    possuiLogo: "",
    materiais: "",
    arquivos: [],
  });

  const next = () => setStep((prev) => Math.min(prev + 1, 5));
  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  function atualizarCampo(campo: keyof BriefingForm, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function limparNomeEmpresa(nome: string) {
    return (
      nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "cliente"
    );
  }

  function salvarArquivos(listaArquivos: FileList | null) {
    if (!listaArquivos) return;

    const arquivosArray = Array.from(listaArquivos);

    if (form.arquivos.length + arquivosArray.length > 20) {
      alert("Você pode enviar no máximo 20 arquivos.");
      return;
    }

    arquivosArray.forEach((arquivo) => {
      const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "application/pdf",
        "video/mp4",
      ];

      if (!tiposPermitidos.includes(arquivo.type)) {
        alert(`Arquivo não permitido: ${arquivo.name}`);
        return;
      }

      if (arquivo.size > 50 * 1024 * 1024) {
        alert(`${arquivo.name} ultrapassa o limite de 50MB.`);
        return;
      }

      const leitor = new FileReader();

      leitor.onload = () => {
        setForm((prev) => ({
          ...prev,
          arquivos: [
            ...prev.arquivos,
            {
              nome: arquivo.name,
              tipo: arquivo.type,
              base64: String(leitor.result),
            },
          ],
        }));
      };

      leitor.readAsDataURL(arquivo);
    });
  }

  function removerArquivo(index: number) {
    setForm((prev) => ({
      ...prev,
      arquivos: prev.arquivos.filter((_, i) => i !== index),
    }));
  }

  async function enviarBriefing() {
    try {
      setEnviando(true);

      const empresaLimpa = limparNomeEmpresa(form.empresa);

      const arquivosEnviados = [];

      for (const arquivo of form.arquivos) {
        const response = await fetch(arquivo.base64);
        const blob = await response.blob();

        const caminhoArquivo = `${empresaLimpa}/${Date.now()}-${arquivo.nome}`;

        const { error: uploadError } = await supabase.storage
          .from("briefings")
          .upload(caminhoArquivo, blob, {
            contentType: arquivo.tipo,
          });

        if (uploadError) {
          alert(uploadError.message);
          setEnviando(false);
          return;
        }

        const { data } = supabase.storage
          .from("briefings")
          .getPublicUrl(caminhoArquivo);

        arquivosEnviados.push({
          nome: arquivo.nome,
          tipo: arquivo.tipo,
          url: data.publicUrl,
          caminho: caminhoArquivo,
        });
      }

      const primeiroArquivo = arquivosEnviados[0];

      const { error } = await supabase.from("briefings").insert([
        {
          empresa: form.empresa,
          segmento: form.segmento,
          whatsapp: form.whatsapp,
          instagram: form.instagram,
          objetivo: form.objetivo,
          servicos: form.servicos,
          diferencial: form.diferencial,
          estilo: form.estilo,
          status: "Novo",
          criado_em: new Date().toISOString(),
          arquivo_url: primeiroArquivo?.url || "",
          arquivo_nome: primeiroArquivo?.nome || "",
          arquivo_tipo: primeiroArquivo?.tipo || "",
          arquivos: arquivosEnviados,
        },
      ]);

      setEnviando(false);

      if (error) {
        alert(error.message);
        return;
      }

      setEnviado(true);
    } catch (erro) {
      console.error(erro);
      setEnviando(false);
      alert("Erro ao enviar briefing.");
    }
  }

  if (enviado) {
    return (
      <main className="briefing-page">
        <section className="briefing-card success-card">
          <div className="briefing-brand">
            <img src="/logo.png" alt="Webmaster Digital" />
          </div>

          <div className="success-icon">✅</div>

          <h1>Briefing enviado com sucesso!</h1>

          <p>
            Recebemos as informações do seu projeto. A equipe da Webmaster
            Digital irá analisar tudo e dar continuidade ao desenvolvimento.
          </p>
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

        <div className="briefing-progress">
          <span>Passo {step} de 5</span>
          <div>
            <div style={{ width: `${step * 20}%` }} />
          </div>
        </div>

        {step === 1 && (
          <div className="briefing-step">
            <h1>Dados da empresa</h1>
            <p>Vamos começar com as informações principais do seu negócio.</p>

            <div className="briefing-grid">
              <input
                placeholder="Nome da empresa"
                value={form.empresa}
                onChange={(e) => atualizarCampo("empresa", e.target.value)}
              />

              <input
                placeholder="Segmento da empresa"
                value={form.segmento}
                onChange={(e) => atualizarCampo("segmento", e.target.value)}
              />

              <input
                placeholder="WhatsApp para contato"
                value={form.whatsapp}
                onChange={(e) => atualizarCampo("whatsapp", e.target.value)}
              />

              <input
                placeholder="Instagram da empresa"
                value={form.instagram}
                onChange={(e) => atualizarCampo("instagram", e.target.value)}
              />
            </div>

            <div className="tip-box">
              💡 Exemplo: nome da empresa, área de atuação, telefone de contato
              e rede social principal.
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="briefing-step">
            <h1>Sobre o projeto</h1>

            <p>
              Quanto mais detalhes você fornecer, melhor conseguiremos criar um
              site alinhado ao seu negócio.
            </p>

            <div className="tip-box">
              💡 Dica: não precisa responder perfeitamente. Escreva da forma que
              achar melhor.
            </div>

            <label className="field-title">
              Qual o principal objetivo do seu site?
            </label>

            <div className="choice-grid">
              {[
                "Receber contatos",
                "Apresentar minha empresa",
                "Vender produtos online",
                "Captar orçamentos",
              ].map((objetivo) => (
                <button
                  key={objetivo}
                  type="button"
                  className={`choice-card ${
                    form.objetivoSelecionado === objetivo ? "selected" : ""
                  }`}
                  onClick={() =>
                    atualizarCampo("objetivoSelecionado", objetivo)
                  }
                >
                  {objetivo}
                </button>
              ))}
            </div>

            <div className="example-box">
              Exemplos:
              <ul>
                <li>Apresentar minha empresa na internet</li>
                <li>Receber mais contatos e orçamentos</li>
                <li>Divulgar meus serviços</li>
                <li>Mostrar meu portfólio</li>
                <li>Vender produtos online</li>
              </ul>
            </div>

            <textarea
              placeholder="Ex: Quero apresentar minha empresa e receber mais contatos pelo WhatsApp."
              value={form.objetivo}
              onChange={(e) => atualizarCampo("objetivo", e.target.value)}
            />

            <label className="field-title">
              Quais serviços ou produtos deseja destacar?
            </label>

            <div className="example-box">
              Exemplos:
              <ul>
                <li>Consultorias</li>
                <li>Serviços especializados</li>
                <li>Produtos físicos</li>
                <li>Atendimentos personalizados</li>
                <li>Cursos e treinamentos</li>
              </ul>
            </div>

            <textarea
              placeholder="Ex: Quero destacar meus principais serviços, produtos e formas de atendimento."
              value={form.servicos}
              onChange={(e) => atualizarCampo("servicos", e.target.value)}
            />

            <label className="field-title">
              O que diferencia sua empresa dos concorrentes?
            </label>

            <div className="example-box">
              Exemplos:
              <ul>
                <li>Atendimento personalizado</li>
                <li>Experiência no mercado</li>
                <li>Equipe qualificada</li>
                <li>Rapidez no atendimento</li>
                <li>Qualidade dos serviços</li>
              </ul>
            </div>

            <textarea
              placeholder="Ex: Minha empresa se diferencia pelo atendimento, qualidade e experiência."
              value={form.diferencial}
              onChange={(e) => atualizarCampo("diferencial", e.target.value)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="briefing-step">
            <h1>Visual e referências</h1>

            <p>
              Agora queremos entender o estilo visual que combina com sua
              empresa.
            </p>

            <label className="field-title">Qual estilo você prefere?</label>

            <div className="choice-grid">
              {[
                "Moderno",
                "Premium / Luxuoso",
                "Corporativo",
                "Minimalista",
              ].map((estilo) => (
                <button
                  key={estilo}
                  type="button"
                  className={`choice-card ${
                    form.estilo === estilo ? "selected" : ""
                  }`}
                  onClick={() => atualizarCampo("estilo", estilo)}
                >
                  {estilo}
                </button>
              ))}
            </div>

            <label className="field-title">Cores desejadas</label>

            <div className="example-box">
              Exemplos:
              <ul>
                <li>Azul e branco</li>
                <li>Preto e dourado</li>
                <li>Vermelho e preto</li>
                <li>Verde e branco</li>
                <li>Utilizar as cores da logo</li>
              </ul>
            </div>

            <input
              placeholder="Ex: Quero usar as cores da minha logo."
              value={form.cores}
              onChange={(e) => atualizarCampo("cores", e.target.value)}
            />

            <label className="field-title">Sites de referência</label>

            <div className="tip-box">
              💡 Você pode enviar sites que gosta pelo visual, organização ou
              estilo. Não precisam ser do mesmo segmento da sua empresa.
            </div>

            <textarea
              placeholder="Cole links de sites que você gosta ou descreva o estilo desejado."
              value={form.referencias}
              onChange={(e) => atualizarCampo("referencias", e.target.value)}
            />
          </div>
        )}

        {step === 4 && (
          <div className="briefing-step">
            <h1>Materiais do projeto</h1>

            <p>
              Informe quais materiais você já possui para usarmos no
              desenvolvimento.
            </p>

            <label className="field-title">Você já possui logo?</label>

            <div className="choice-grid">
              {["Sim, já tenho logo", "Ainda não tenho logo"].map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  className={`choice-card ${
                    form.possuiLogo === opcao ? "selected" : ""
                  }`}
                  onClick={() => atualizarCampo("possuiLogo", opcao)}
                >
                  {opcao}
                </button>
              ))}
            </div>

            <label className="field-title">Enviar arquivos</label>

            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.mp4"
              onChange={(e) => salvarArquivos(e.target.files)}
            />

            <div className="tip-box">
              Você pode enviar até 20 arquivos: imagens, PDFs ou vídeos MP4.
              Tamanho máximo: 50MB por arquivo.
            </div>

            {form.arquivos.length > 0 && (
              <div className="file-list">
                {form.arquivos.map((arquivo, index) => (
                  <div key={index} className="file-selected-box">
                    <div>
                      <strong>📎 {arquivo.nome}</strong>
                      <span>{arquivo.tipo}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removerArquivo(index)}
                      className="btn-danger"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="field-title">Materiais disponíveis</label>

            <div className="example-box">
              Exemplos:
              <ul>
                <li>Logo da empresa</li>
                <li>Fotos dos serviços</li>
                <li>Fotos dos produtos</li>
                <li>Textos institucionais</li>
                <li>Catálogo ou apresentação</li>
                <li>Vídeo institucional</li>
              </ul>
            </div>

            <textarea
              placeholder="Ex: Tenho logo, algumas fotos, vídeos e materiais da empresa."
              value={form.materiais}
              onChange={(e) => atualizarCampo("materiais", e.target.value)}
            />
          </div>
        )}

        {step === 5 && (
          <div className="briefing-step">
            <h1>Confirmação e assinatura</h1>

            <p>
              Confirme as informações enviadas. Em breve esta etapa terá
              assinatura digital e geração automática de PDF.
            </p>

            <div className="signature-box">Área futura para assinatura digital</div>

            <label className="check-line">
              <input type="checkbox" />
              Confirmo que as informações enviadas estão corretas.
            </label>

            <div className="tip-box">
              Após o envio, a Webmaster Digital analisará as informações e dará
              continuidade ao projeto.
            </div>
          </div>
        )}

        <div className="briefing-actions">
          {step > 1 && (
            <button onClick={back} className="btn-back">
              Voltar
            </button>
          )}

          {step < 5 ? (
            <button onClick={next} className="btn-next">
              Próximo
            </button>
          ) : (
            <button
              onClick={enviarBriefing}
              className="btn-next"
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Enviar Briefing"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}