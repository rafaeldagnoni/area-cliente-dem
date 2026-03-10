"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Company = {
  id: string;
  name: string;
  slug: string;
  status?: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId),
    [companies, selectedCompanyId]
  );

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function loadCompanies() {
    const token = await getAccessToken();

    const res = await fetch("/api/admin/companies", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();

    if (json.error) {
      alert(json.error);
      return;
    }

    setCompanies(json.companies || []);
  }

  useEffect(() => {
    const checkAccess = async () => {
      const { data } = await supabase.auth.getUser();
      const email = (data.user?.email || "").toLowerCase();

      const allowedEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (!email || !allowedEmails.includes(email)) {
        router.replace("/dashboard");
        return;
      }

      setIsAllowed(true);
      await loadCompanies();
      setLoading(false);
    };

    checkAccess();
  }, [router]);

  async function handleCreateCompany() {
    if (!companyName || !companySlug) {
      alert("Preencha nome e slug.");
      return;
    }

    const token = await getAccessToken();

    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: companyName, slug: companySlug }),
    });

    const json = await res.json();

    if (json.error) {
      alert(json.error);
      return;
    }

    alert("Empresa criada com sucesso.");
    setCompanyName("");
    setCompanySlug("");
    await loadCompanies();
  }

  async function handleInviteUser() {
    if (!inviteEmail || !selectedCompanyId) {
      alert("Preencha email e selecione a empresa.");
      return;
    }

    const token = await getAccessToken();

    const res = await fetch("/api/admin/invite-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: inviteEmail,
        companyId: selectedCompanyId,
      }),
    });

    const json = await res.json();

    if (json.error) {
      alert(json.error);
      return;
    }

    alert("Convite enviado e usuário vinculado com sucesso.");
    setInviteEmail("");
    setSelectedCompanyId("");
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Carregando...</div>;
  }

  if (!isAllowed) {
    return null;
  }

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 24 }}>Admin D&M</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginBottom: 16 }}>Criar empresa</h2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Nome da empresa"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            style={{ padding: 10, minWidth: 220 }}
          />

          <input
            type="text"
            placeholder="slug (ex: tech4con)"
            value={companySlug}
            onChange={(e) => setCompanySlug(e.target.value)}
            style={{ padding: 10, minWidth: 220 }}
          />

          <button onClick={handleCreateCompany} style={{ padding: "10px 16px" }}>
            Criar
          </button>
        </div>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginBottom: 16 }}>Convidar usuário</h2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            type="email"
            placeholder="email do cliente"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            style={{ padding: 10, minWidth: 260 }}
          />

          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            style={{ padding: 10, minWidth: 220 }}
          >
            <option value="">Selecione a empresa</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} {company.status ? `(${company.status})` : ""}
              </option>
            ))}
          </select>

          <button onClick={handleInviteUser} style={{ padding: "10px 16px" }}>
            Convidar
          </button>
        </div>

        {selectedCompany && (
          <p style={{ marginTop: 12 }}>
            Empresa selecionada: <strong>{selectedCompany.name}</strong>
          </p>
        )}
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 20,
        }}
      >
        <h2 style={{ marginBottom: 16 }}>Empresas cadastradas</h2>

        {companies.length === 0 ? (
          <p>Nenhuma empresa cadastrada.</p>
        ) : (
          <ul style={{ paddingLeft: 20 }}>
            {companies.map((company) => (
              <li key={company.id} style={{ marginBottom: 8 }}>
                <strong>{company.name}</strong> — slug: {company.slug} — status:{" "}
                {company.status || "active"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
