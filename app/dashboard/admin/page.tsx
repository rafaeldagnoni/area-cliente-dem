"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type CompanyUser = {
  id: string;
  email: string;
};

type Company = {
  id: string;
  name: string;
  slug: string;
  status?: string;
  users?: CompanyUser[];
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
      router.replace("/admin/login");
      return false;
    }

    const res = await fetch("/api/admin/company-users", {
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
        router.replace("/admin/login");
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
    await loadCompanies();
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

  async function handleRemoveUser(company: Company, user: CompanyUser) {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover o acesso de ${user.email} da empresa ${company.name}?`
    );

    if (!confirmed) {
      return;
    }

    const token = await getAccessToken();

    const res = await fetch("/api/admin/remove-company-user", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: user.id,
        companyId: company.id,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "Erro ao remover acesso.");
      return;
    }

    alert("Acesso removido com sucesso.");
    await loadCompanies();
  }

  async function handleEditCompany(company: Company) {
    const newName = window.prompt("Novo nome da empresa:", company.name);
    if (!newName) {
      return;
    }

    const newSlug = window.prompt("Novo slug da empresa:", company.slug);
    if (!newSlug) {
      return;
    }

    const token = await getAccessToken();

    const res = await fetch("/api/admin/companies", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        companyId: company.id,
        name: newName,
        slug: newSlug,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "Erro ao editar empresa.");
      return;
    }

    alert("Empresa atualizada com sucesso.");
    await loadCompanies();
  }

  async function handleAdminLogout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>Admin D&M</h1>

        <button onClick={handleAdminLogout} style={{ padding: "10px 16px" }}>
          Sair do admin
        </button>
      </div>

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
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>{company.name}</strong> — slug: {company.slug} — status:{" "}
                    {company.status || "active"}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleEditCompany(company)}
                      style={{ padding: "8px 14px" }}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleToggleStatus(company)}
                      style={{ padding: "8px 14px" }}
                    >
                      {company.status === "inactive" ? "Ativar" : "Inativar"}
                    </button>
                  </div>
                </div>

                <div>
                  <strong>Usuários vinculados:</strong>
                  {company.users && company.users.length > 0 ? (
                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                      {company.users.map((user) => (
                        <li
                          key={`${company.id}-${user.id}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            flexWrap: "wrap",
                            marginBottom: 8,
                          }}
                        >
                          <span>{user.email}</span>

                          <button
                            onClick={() => handleRemoveUser(company, user)}
                            style={{ padding: "6px 12px" }}
                          >
                            Remover acesso
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ marginTop: 8 }}>Nenhum usuário vinculado.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
