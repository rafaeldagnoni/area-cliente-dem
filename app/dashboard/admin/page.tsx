"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");

  async function loadCompanies() {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    setCompanies(data || []);
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  async function createCompany() {
    const res = await fetch("/api/admin/create-company", {
      method: "POST",
      body: JSON.stringify({ name, slug }),
    });

    const json = await res.json();

    if (json.error) {
      alert(json.error);
      return;
    }

    setName("");
    setSlug("");

    loadCompanies();
  }

  async function inviteUser() {
    const res = await fetch("/api/admin/invite-user", {
      method: "POST",
      body: JSON.stringify({
        email,
        company_id: companyId,
      }),
    });

    const json = await res.json();

    if (json.error) {
      alert(json.error);
      return;
    }

    alert("Convite enviado!");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin D&M</h1>

      <h2>Criar empresa</h2>

      <input
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      <button onClick={createCompany}>Criar</button>

      <h2>Convidar usuário</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <select
        value={companyId}
        onChange={(e) => setCompanyId(e.target.value)}
      >
        <option value="">Selecione empresa</option>

        {companies.map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <button onClick={inviteUser}>Convidar</button>
    </div>
  );
}
