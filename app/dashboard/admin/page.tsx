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
  const [errorMessage, setErrorMessage] = useState("");

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

    if (!token) {
      router.replace("/");
      return false;
    }

    const res = await fetch("/api/admin/companies", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 403) {
        setErrorMessage("Acesso não autorizado.");
        setIsAllowed(false);
        return false;
      }

      setErrorMessage(json.error || "Erro ao carregar empresas.");
      setIsAllowed(false);
      return false;
    }

    setCompanies(json.companies || []);
    setIsAllowed(true);
    return true;
  }

  useEffect(() => {
    const checkAccess = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/");
        return;
      }

      const ok = await loadCompanies();
      setLoading(false);

      if (!ok) {
        return;
      }
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

    if (!res.ok) {
      alert(json.error || "Erro ao criar empresa.");
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

    if (!res.ok) {
      alert(json.error || "Erro ao convidar usuário.");
      return;
    }

    alert("Convite enviado e usuário vinculado com sucesso.");
    setInviteEmail("");
    setSelectedCompanyId("");
  }

  async function handleToggleStatus(company: Company) {
    const token = await getAccessToken();
    const newStatus = company.status === "inactive" ? "active" : "inactive";

    const res = await fetch("/api/admin/companies", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        companyId: company.id,
        status: newStatus,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "Erro ao alterar status.");
      return;
    }

    alert(
      `Empresa ${company.name} ${
        newStatus === "active" ? "ativada" : "inativada"
      } com sucesso.`
    );

    await loadCompanies();
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Carregando...</div>;
  }

  if (!isAllowed) {
    return (
      <div style={{ padding: 40, maxWidth: 700 }}>
        <h1 style={{ marginBottom: 16 }}>403 - Acesso não autorizado</h1>
        <p>{errorMessage || "Você não tem permissão para acessar esta área."}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 1000 }}>
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
                {company.name}
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
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {companies.map((company) => (
              <li
                key={company.id}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>{company.name}</strong> — slug: {company.slug}
                </div>

                <button
                  onClick={() => handleToggleStatus(company)}
                  style={{ padding: "8px 14px" }}
                >
                  Inativar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
