"use client";

import { useEffect, useState } from "react";
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
  const [companies, setCompanies] = useState<Company[]>([]);

  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function loadCompanies() {
    const token = await getAccessToken();

    const res = await fetch("/api/admin/company-users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const json = await res.json();

    setCompanies(json.companies || []);
  }

  async function reloadData() {
    await loadCompanies();
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/admin/login");
        return;
      }

      await loadCompanies();
      setLoading(false);
    };

    init();
  }, []);

  async function handleCreateCompany() {
    const token = await getAccessToken();

    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: companyName,
        slug: companySlug,
      }),
    });

    if (res.ok) {
      setCompanyName("");
      setCompanySlug("");
      await reloadData();
    }
  }

  async function handleInviteUser() {
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

    if (res.ok) {
      setInviteEmail("");
      await reloadData();
    }
  }

  async function handleRemoveUser(company: Company, user: CompanyUser) {
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

    if (res.ok) {
      await reloadData();
    }
  }

  async function handleEditCompany(company: Company) {
    const name = prompt("Novo nome", company.name);
    const slug = prompt("Novo slug", company.slug);

    if (!name || !slug) return;

    const token = await getAccessToken();

    const res = await fetch("/api/admin/companies", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        companyId: company.id,
        name,
        slug,
      }),
    });

    if (res.ok) {
      await reloadData();
    }
  }

  async function handleToggleStatus(company: Company) {
    const token = await getAccessToken();

    const res = await fetch("/api/admin/companies", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        companyId: company.id,
        status: company.status === "inactive" ? "active" : "inactive",
      }),
    });

    if (res.ok) {
      await reloadData();
    }
  }

  if (loading) return <div style={{ padding: 40 }}>Carregando...</div>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin D&M</h1>

      <h2>Criar empresa</h2>

      <input
        placeholder="Nome"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
      />

      <input
        placeholder="Slug"
        value={companySlug}
        onChange={(e) => setCompanySlug(e.target.value)}
      />

      <button onClick={handleCreateCompany}>Criar</button>

      <h2>Convidar usuário</h2>

      <input
        placeholder="Email"
        value={inviteEmail}
        onChange={(e) => setInviteEmail(e.target.value)}
      />

      <select
        value={selectedCompanyId}
        onChange={(e) => setSelectedCompanyId(e.target.value)}
      >
        <option value="">Empresa</option>

        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <button onClick={handleInviteUser}>Convidar</button>

      <h2>Empresas</h2>

      {companies.map((company) => (
        <div key={company.id} style={{ marginBottom: 20 }}>
          <strong>
            {company.name} ({company.slug})
          </strong>

          <button onClick={() => handleEditCompany(company)}>Editar</button>

          <button onClick={() => handleToggleStatus(company)}>
            {company.status === "inactive" ? "Ativar" : "Inativar"}
          </button>

          <div style={{ marginTop: 10 }}>
            <strong>Usuários:</strong>

            {company.users?.map((user) => (
              <div key={user.id}>
                {user.email}

                <button
                  onClick={() => handleRemoveUser(company, user)}
                  style={{ marginLeft: 10 }}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
