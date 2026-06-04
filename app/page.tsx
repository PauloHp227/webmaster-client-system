import AppShell from "@/components/AppShell";

export default function Home() {
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
          <strong>0</strong>
          <p>Total cadastrados</p>
        </div>

        <div className="card">
          <div className="card-icon">💻</div>
          <h3>Projetos</h3>
          <strong>0</strong>
          <p>Em andamento</p>
        </div>

        <div className="card">
          <div className="card-icon">📝</div>
          <h3>Briefings</h3>
          <strong>0</strong>
          <p>Recebidos</p>
        </div>

        <div className="card">
          <div className="card-icon">💰</div>
          <h3>Financeiro</h3>
          <strong>R$ 0</strong>
          <p>Receita registrada</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Últimas atividades</h2>
          <button className="btn-dark">Ver tudo</button>
        </div>

        <div className="empty-state">
          <h3>Nenhuma atividade ainda</h3>
          <p>Quando você cadastrar clientes e projetos, eles aparecerão aqui.</p>
        </div>
      </section>
    </AppShell>
  );
}