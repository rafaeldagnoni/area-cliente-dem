"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { logoutUser } from "@/lib/logout";
import Tech4ConDashboard from "@/components/client-dashboards/Tech4ConDashboard";
import MediarhDashboard from "@/components/client-dashboards/MediarhDashboard";

type PageProps = {
  params: {
    slug: string;
  };
};

export default function DynamicDashboardPage({ params }: PageProps) {
  const { slug } = params;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const validateAccess = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const user = sessionData.session.user;

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, slug, name")
        .eq("slug", slug)
        .maybeSingle();

      if (companyError || !company) {
        router.replace("/select-company");
        return;
      }

      const { data: link, error: linkError } = await supabase
        .from("user_companies")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", company.id)
        .maybeSingle();

      if (linkError || !link) {
        router.replace("/select-company");
        return;
      }

      localStorage.setItem("active_company_slug", company.slug);
      localStorage.setItem("active_company_id", company.id);
      localStorage.setItem("active_company_name", company.name);

      setCompanyName(company.name);
      setAuthorized(true);
      setLoading(false);
    };

    validateAccess();
  }, [router, slug]);

  function handleSwitchCompany() {
    localStorage.removeItem("active_company_slug");
    localStorage.removeItem("active_company_id");
    localStorage.removeItem("active_company_name");
    router.push("/select-company");
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Carregando dashboard...</div>;
  }

  if (!authorized) {
    return null;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          borderBottom: "1px solid #ddd",
          background: "#fff",
        }}
      >
        <div>
          <strong>Empresa ativa:</strong> {companyName}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleSwitchCompany}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Trocar empresa
          </button>

          <button
            onClick={logoutUser}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </div>
      </div>

      {slug === "tech4con" && <Tech4ConDashboard />}
      {slug === "mediarh" && <MediarhDashboard />}

      {slug !== "tech4con" && slug !== "mediarh" && (
        <div style={{ padding: 40 }}>
          <h1>Dashboard em construção</h1>
          <p>Empresa: {slug}</p>
          <p>Este dashboard ainda não foi configurado.</p>
        </div>
      )}
    </div>
  );
}
