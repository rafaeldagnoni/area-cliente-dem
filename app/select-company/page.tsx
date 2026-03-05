"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

type Company = {
  id: string;
  name: string;
  slug: string;
};

export default function SelectCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      // Busca empresas do usuário (ajuste de acordo com seu schema)
      // Esperado:
      // - user_companies: user_id, company_id
      // - companies: id, name, slug
      const { data, error } = await supabase
        .from("user_companies")
        .select("companies (id, name, slug)")
        .eq("user_id", user.id);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const list: Company[] =
        (data || [])
          .map((row: any) => row.companies)
          .filter(Boolean)
          .map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })) || [];

      setCompanies(list);

      // Se só tem 1 empresa, já entra direto no dashboard dela
      if (list.length === 1) {
        await setActiveCompany(user.id, list[0]);
        router.replace(`/dashboard/${list[0].slug}`);
        return;
      }

      setLoading(false);
    };

    run();
  }, [router]);

  const setActiveCompany = async (userId: string, company: Company) => {
    // Preferência: salvar a empresa ativa no profile do usuário (persistente)
    // Se você já tem essa coluna, ótimo: profiles.active_company_id
    // Se não tiver, dá pra manter apenas localStorage.
    try {
      await supabase
        .from("profiles")
        .update({ active_company_id: company.id })
        .eq("id", userId);
    } catch (e) {
      // ignora
    }

    // Fallback / reforço: também salva local
    localStorage.setItem("active_company_id", company.id);
    localStorage.setItem("active_company_slug", company.slug);
    localStorage.setItem("active_company_name", company.name);
  };

  const handleSelect = async (company: Company) => {
    setLoading(true);
    setError(null);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      router.replace("/login");
      return;
    }

    await setActiveCompany(user.id, company);

    // ✅ aqui é o ponto principal: mandar pra rota do dashboard da empresa
    router.replace(`/dashboard/${company.slug}`);
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Selecionar empresa</h2>
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Selecionar empresa</h2>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Selecionar empresa</h2>

      {companies.length === 0 ? (
        <p>Nenhuma empresa vinculada a este usuário.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelect(c)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #ddd",
                cursor: "pointer",
                textAlign: "left",
                background: "white",
              }}
            >
              <strong>{c.name}</strong>
              <div style={{ fontSize: 12, opacity: 0.7 }}>/dashboard/{c.slug}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
