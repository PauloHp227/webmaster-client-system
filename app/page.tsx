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
};

type Contrato = {
  id: string;
  empresa: string;
  status: string;
  valor_total: string;
  criado_em: string;
};

export default function Home() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
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

  const totalBriefings = briefings.length;

  const projetosEmAndamento = briefings.filter(
    (item) =>
      item.status === "Em desenvolvimento" ||
      item.status === "Pagamento entrada" ||
      item.status === "Contrato assinado" ||
      item.status === "Aguardando aprovação"
  ).length;

  const contratosAssinados = contratos.filter(
    (item) => item.status === "Assinado"
  ).length;

  const clientesUnicos = new Set([
    ...briefings.map((item) => item.empresa),
    ...contratos.map((item) => item.empresa),
  ]).size;

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
    .slice(0, 5);

  return (
    <AppShell
      title="Dashboard"
      subtitle="Controle seus clientes, projetos, briefings e contratos em um só lugar."
    >
      <section className="hero-panel">
        <div>
          <span>Webmaster Digital CRM</span>
          <h2>Gestão profissional para seus projetos de sites</h2>
          <p>
            Organize clientes, gere links de briefing, acompanhe projetos,
            contratos, acessos e financeiro com mais profissionalismo.
          </p>
        </div>

        <button className="btn-primary">Novo Cliente</button>
      </section>

      <section className="cards-grid">
        <div className="card">
          <div className="card-icon">👥</div>
          <h3>Clientes</h3>
          <strong>{carregando ? "..." : clientesUnicos}</strong>
          <p>Total cadastrados</p>
        </div>

        <div className="card">
          <div className="card-icon">💻</div>
          <h3>Projetos</h3>
          <strong>{carregando ? "..." : projetosEmAndamento}</strong>
          <p>Em andamento</p>
        </div>

        <div className="card">
          <div className="card-icon">📝</div>
          <h3>Briefings</h3>
          <strong>{carregando ? "..." : totalBriefings}</strong>
          <p>Recebidos</p>
        </div>

        <div className="card">
          <div className="card-icon">📄</div>
          <h3>Contratos</h3>
          <strong>{carregando ? "..." : contratosAssinados}</strong>
          <p>Assinados</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Últimas atividades</h2>
          <button className="btn-dark">Ver tudo</button>
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