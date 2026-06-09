"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Prospect = {
  id: number;
  empresa: string;
  responsavel: string;
  whatsapp: string;
  instagram: string;
  tipo_site: string;
  valor_provavel: string;
  status: string;
  data_retorno?: string;
  observacoes: string;
  criado_em: string;
};

const statusOptions = [
  "Novo lead",
  "Conversando",
  "Interessado",
  "Retornar depois",
  "Proposta enviada",
  "Fechado",
  "Perdido",
];

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [carregando, setCarregando] = useState(true);
  const [prospectSelecionado, setProspectSelecionado] =
    useState<Prospect | null>(null);

  const [form, setForm] = useState({
    empresa: "",
    responsavel: "",
    whatsapp: "",
    instagram: "",
    tipo_site: "",
    valor_provavel: "",
    status: "Novo lead",
    data_retorno: "",
    observacoes: "",
  });

  useEffect(() => {
    carregarProspects();
  }, []);

  async function carregarProspects() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("prospects")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      alert(error.message);
      setCarregando(false);
      return;
    }

    setProspects(data || []);
    setCarregando(false);
  }

  async function salvarProspect(e: React.FormEvent) {
    e.preventDefault();

    if (!form.empresa || !form.whatsapp) {
      alert("Preencha pelo menos empresa e WhatsApp.");
      return;
    }

    const { error } = await supabase.from("prospects").insert([
      {
        empresa: form.empresa,
        responsavel: form.responsavel,
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        tipo_site: form.tipo_site,
        valor_provavel: form.valor_provavel,
        status: form.status,
        data_retorno: form.data_retorno || null,
        observacoes: form.observacoes,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setForm({
      empresa: "",
      responsavel: "",
      whatsapp: "",
      instagram: "",
      tipo_site: "",
      valor_provavel: "",
      status: "Novo lead",
      data_retorno: "",
      observacoes: "",
    });

    carregarProspects();
    alert("Prospect cadastrado com sucesso!");
  }

  async function alterarStatus(id: number, novoStatus: string) {
    const { error } = await supabase
      .from("prospects")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setProspects((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: novoStatus } : item
      )
    );

    if (prospectSelecionado?.id === id) {
      setProspectSelecionado((prev) =>
        prev ? { ...prev, status: novoStatus } : prev
      );
    }
  }

  async function atualizarProspect() {
    if (!prospectSelecionado) return;

    const { error } = await supabase
      .from("prospects")
      .update({
        empresa: prospectSelecionado.empresa,
        responsavel: prospectSelecionado.responsavel,
        whatsapp: prospectSelecionado.whatsapp,
        instagram: prospectSelecionado.instagram,
        tipo_site: prospectSelecionado.tipo_site,
        valor_provavel: prospectSelecionado.valor_provavel,
        status: prospectSelecionado.status,
        data_retorno: prospectSelecionado.data_retorno || null,
        observacoes: prospectSelecionado.observacoes,
      })
      .eq("id", prospectSelecionado.id);

    if (error) {
      alert(error.message);
      return;
    }

    setProspects((prev) =>
      prev.map((item) =>
        item.id === prospectSelecionado.id ? prospectSelecionado : item
      )
    );

    alert("Prospect atualizado com sucesso!");
  }

  async function excluirProspect(id: number) {
    const confirmar = confirm("Tem certeza que deseja excluir este prospect?");
    if (!confirmar) return;

    const { error } = await supabase.from("prospects").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setProspects((prev) => prev.filter((item) => item.id !== id));
    setProspectSelecionado(null);

    alert("Prospect excluído com sucesso.");
  }

  function abrirWhatsApp(whatsapp?: string) {
    const telefone = whatsapp?.replace(/\D/g, "");

    if (!telefone) {
      alert("WhatsApp não informado.");
      return;
    }

    window.open(`https://wa.me/55${telefone}`, "_blank");
  }

  function formatarData(data?: string) {
    if (!data) return "Não definida";

    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function precisaRetorno(data?: string) {
    if (!data) return false;

    const hoje = new Date();
    const retorno = new Date(`${data}T23:59:59`);

    hoje.setHours(0, 0, 0, 0);

    return retorno.getTime() <= hoje.getTime();
  }

  const prospectsFiltrados = prospects.filter((item) => {
    const texto = busca.toLowerCase();

    const combinaBusca =
      item.empresa?.toLowerCase().includes(texto) ||
      item.responsavel?.toLowerCase().includes(texto) ||
      item.whatsapp?.toLowerCase().includes(texto) ||
      item.instagram?.toLowerCase().includes(texto) ||
      item.tipo_site?.toLowerCase().includes(texto);

    const combinaStatus =
      filtroStatus === "Todos" || item.status === filtroStatus;

    return combinaBusca && combinaStatus;
  });

  const retornosHoje = prospects.filter(
    (item) =>
      item.status !== "Fechado" &&
      item.status !== "Perdido" &&
      precisaRetorno(item.data_retorno)
  );

  const emNegociacao = prospects.filter(
    (item) =>
      item.status === "Conversando" ||
      item.status === "Interessado" ||
      item.status === "Proposta enviada"
  );

  const fechados = prospects.filter((item) => item.status === "Fechado");

  const perdidos = prospects.filter((item) => item.status === "Perdido");

  return (
    <AppShell
      title="Prospects"
      subtitle="Controle possíveis clientes, retornos e oportunidades comerciais"
    >
      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">👀</div>
          <h3>Prospects</h3>
          <strong>{carregando ? "..." : prospects.length}</strong>
          <p>Total cadastrados</p>
        </div>

        <div className="card">
          <div className="card-icon">🔥</div>
          <h3>Em negociação</h3>
          <strong>{carregando ? "..." : emNegociacao.length}</strong>
          <p>Conversando ou interessados</p>
        </div>

        <div className="card">
          <div className="card-icon">📞</div>
          <h3>Retornos</h3>
          <strong>{carregando ? "..." : retornosHoje.length}</strong>
          <p>Para chamar hoje ou atrasados</p>
        </div>

        <div className="card">
          <div className="card-icon">✅</div>
          <h3>Fechados</h3>
          <strong>{carregando ? "..." : fechados.length}</strong>
          <p>Viraram cliente</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Novo prospect</h2>
          <span>Cadastro rápido</span>
        </div>

        <form className="form-grid" onSubmit={salvarProspect}>
          <div className="form-group">
            <label>Empresa</label>
            <input
              placeholder="Ex: AKM Perfumes"
              value={form.empresa}
              onChange={(e) => setForm({ ...form, empresa: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Responsável</label>
            <input
              placeholder="Nome da pessoa"
              value={form.responsavel}
              onChange={(e) =>
                setForm({ ...form, responsavel: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>WhatsApp</label>
            <input
              placeholder="(11) 99999-9999"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Instagram</label>
            <input
              placeholder="@empresa"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Tipo de site</label>
            <input
              placeholder="Catálogo, loja virtual, institucional..."
              value={form.tipo_site}
              onChange={(e) => setForm({ ...form, tipo_site: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Valor provável</label>
            <input
              placeholder="Ex: R$ 700,00"
              value={form.valor_provavel}
              onChange={(e) =>
                setForm({ ...form, valor_provavel: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Data para retorno</label>
            <input
              type="date"
              value={form.data_retorno}
              onChange={(e) =>
                setForm({ ...form, data_retorno: e.target.value })
              }
            />
          </div>

          <div className="form-group full">
            <label>Observações</label>
            <textarea
              placeholder="Ex: Pediu para retornar no fim do mês. Gostou do plano de R$700, mas quer esperar melhorar as vendas."
              value={form.observacoes}
              onChange={(e) =>
                setForm({ ...form, observacoes: e.target.value })
              }
            />
          </div>

          <div className="form-actions">
            <button className="btn-primary" type="submit">
              Cadastrar prospect
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Retornos importantes</h2>
          <span>{retornosHoje.length} retorno(s)</span>
        </div>

        {retornosHoje.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum retorno pendente</h3>
            <p>Quando chegar a data de retorno, o prospect aparecerá aqui.</p>
          </div>
        ) : (
          <div className="table-list">
            {retornosHoje.map((item) => (
              <div className="table-item" key={item.id}>
                <div>
                  <strong>{item.empresa}</strong>
                  <br />
                  <span>{item.observacoes || "Sem observações"}</span>
                </div>

                <span>{item.status}</span>

                <span>Retorno: {formatarData(item.data_retorno)}</span>

                <button
                  className="btn-primary"
                  onClick={() => abrirWhatsApp(item.whatsapp)}
                >
                  WhatsApp
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Lista de prospects</h2>
          <button
            className="btn-dark"
            onClick={carregarProspects}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        <div className="filters-row">
          <input
            className="search-input"
            placeholder="Buscar por empresa, responsável, WhatsApp, Instagram ou tipo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="status-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option>Todos</option>
            {statusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>

        {prospectsFiltrados.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum prospect encontrado</h3>
            <p>Cadastre possíveis clientes para acompanhar oportunidades.</p>
          </div>
        ) : (
          <div className="table-list">
            {prospectsFiltrados.map((item) => (
              <div className="table-item" key={item.id}>
                <div>
                  <strong>{item.empresa || "Empresa não informada"}</strong>
                  <br />
                  <span>{item.responsavel || "Responsável não informado"}</span>
                  <br />
                  <small>{item.tipo_site || "Tipo de site não informado"}</small>
                </div>

                <select
                  className="status-select"
                  value={item.status || "Novo lead"}
                  onChange={(e) => alterarStatus(item.id, e.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>

                <div>
                  <span>{item.valor_provavel || "Valor não informado"}</span>
                  <br />
                  <small>Retorno: {formatarData(item.data_retorno)}</small>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    className="btn-primary"
                    onClick={() => abrirWhatsApp(item.whatsapp)}
                  >
                    WhatsApp
                  </button>

                  <button
                    className="btn-dark"
                    onClick={() => setProspectSelecionado(item)}
                  >
                    Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {prospectSelecionado && (
        <div className="modal-overlay">
          <div className="report-modal">
            <div className="report-header">
              <div>
                <span>Prospect</span>
                <h2>
                  {prospectSelecionado.empresa || "Empresa não informada"}
                </h2>
                <p>Status: {prospectSelecionado.status}</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setProspectSelecionado(null)}
              >
                ✕
              </button>
            </div>

            <div className="report-section">
              <h3>Dados do prospect</h3>

              <div className="form-grid">
                <div className="form-group">
                  <label>Empresa</label>
                  <input
                    value={prospectSelecionado.empresa || ""}
                    onChange={(e) =>
                      setProspectSelecionado((prev) =>
                        prev ? { ...prev, empresa: e.target.value } : prev
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Responsável</label>
                  <input
                    value={prospectSelecionado.responsavel || ""}
                    onChange={(e) =>
                      setProspectSelecionado((prev) =>
                        prev ? { ...prev, responsavel: e.target.value } : prev
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label>WhatsApp</label>
                  <input
                    value={prospectSelecionado.whatsapp || ""}
                    onChange={(e) =>
                      setProspectSelecionado((prev) =>
                        prev ? { ...prev, whatsapp: e.target.value } : prev
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Instagram</label>
                  <input
                    value={prospectSelecionado.instagram || ""}
                    onChange={(e) =>
                      setProspectSelecionado((prev) =>
                        prev ? { ...prev, instagram: e.target.value } : prev
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de site</label>
                  <input
                    value={prospectSelecionado.tipo_site || ""}
                    onChange={(e) =>
                      setProspectSelecionado((prev) =>
                        prev ? { ...prev, tipo_site: e.target.value } : prev
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Valor provável</label>
                  <input
                    value={prospectSelecionado.valor_provavel || ""}
                    onChange={(e) =>
                      setProspectSelecionado((prev) =>
                        prev
                          ? { ...prev, valor_provavel: e.target.value }
                          : prev
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={prospectSelecionado.status || "Novo lead"}
                    onChange={(e) =>
                      setProspectSelecionado((prev) =>
                        prev ? { ...prev, status: e.target.value } : prev
                      )
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Data para retorno</label>
                  <input
                    type="date"
                    value={prospectSelecionado.data_retorno || ""}
                    onChange={(e) =>
                      setProspectSelecionado((prev) =>
                        prev ? { ...prev, data_retorno: e.target.value } : prev
                      )
                    }
                  />
                </div>

                <div className="form-group full">
                  <label>Observações</label>
                  <textarea
                    value={prospectSelecionado.observacoes || ""}
                    onChange={(e) =>
                      setProspectSelecionado((prev) =>
                        prev ? { ...prev, observacoes: e.target.value } : prev
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="report-actions">
              <button
                className="btn-primary"
                onClick={() => abrirWhatsApp(prospectSelecionado.whatsapp)}
              >
                Abrir WhatsApp
              </button>

              <button className="btn-primary" onClick={atualizarProspect}>
                Salvar alterações
              </button>

              <button
                className="btn-danger"
                onClick={() => excluirProspect(prospectSelecionado.id)}
              >
                Excluir
              </button>

              <button
                className="btn-dark"
                onClick={() => setProspectSelecionado(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}