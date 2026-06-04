"use client";

import AppShell from "@/components/AppShell";
import { useState } from "react";

type Cliente = {
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  briefingLink: string;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState({
    nome: "",
    empresa: "",
    email: "",
    telefone: "",
  });

  function gerarToken() {
    return Math.random().toString(36).substring(2, 10);
  }

  function adicionarCliente(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nome || !form.empresa || !form.email || !form.telefone) {
      alert("Preencha todos os campos.");
      return;
    }

    const token = gerarToken();

    const novoCliente: Cliente = {
      ...form,
      briefingLink: `http://localhost:3000/formulario/${token}`,
    };

    setClientes([novoCliente, ...clientes]);

    setForm({
      nome: "",
      empresa: "",
      email: "",
      telefone: "",
    });
  }

  return (
    <AppShell title="Clientes" subtitle="Cadastre clientes e gere links de briefing">
      <section className="panel">
        <div className="panel-header">
          <h2>Novo Cliente</h2>
        </div>

        <form onSubmit={adicionarCliente} className="form-grid">
          <div className="form-group">
            <label>Nome do responsável</label>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="form-group">
            <label>Empresa</label>
            <input
              value={form.empresa}
              onChange={(e) => setForm({ ...form, empresa: e.target.value })}
              placeholder="Ex: FF Blindagens"
            />
          </div>

          <div className="form-group">
            <label>E-mail</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </div>

          <div className="form-group">
            <label>Telefone / WhatsApp</label>
            <input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="form-actions">
            <button className="btn-primary" type="submit">
              Cadastrar Cliente
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Clientes cadastrados</h2>
          <span>{clientes.length} cliente(s)</span>
        </div>

        {clientes.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum cliente cadastrado</h3>
            <p>Cadastre seu primeiro cliente para gerar o link de briefing.</p>
          </div>
        ) : (
          <div className="table-list">
            {clientes.map((cliente, index) => (
              <div className="table-item" key={index}>
                <div>
                  <strong>{cliente.empresa}</strong>
                  <br />
                  <span>{cliente.nome}</span>
                </div>

                <span>{cliente.email}</span>
                <span>{cliente.telefone}</span>

                <button
                  className="btn-dark"
                  onClick={() => navigator.clipboard.writeText(cliente.briefingLink)}
                >
                  Copiar Link
                </button>

                <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                  <span>
                    <strong>Link:</strong> {cliente.briefingLink}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}