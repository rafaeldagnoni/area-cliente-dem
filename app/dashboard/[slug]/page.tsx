"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Tech4ConDashboard from "../tech4con/page";
import MediarhDashboard from "../mediarh/page";

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

  useEffect(() => {
    const validateAccess = async () => {
      // 1) Verifica sessão
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const user = sessionData.session.user;

      // 2) Verifica empresa ativa
      const activeCompanySlug = localStorage.getItem("active_company_slug");

      if (!activeCompanySlug) {
        router.replace("/select-company");
        return;
      }

      // Se slug da URL não bater com a empresa ativa, redireciona
      if (activeCompanySlug !== slug) {
        router.replace(`/dashboard/${activeCompanySlug}`);
        return;
      }

      // 3) Busca empresa pelo slug
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, slug")
        .eq("slug", slug)
        .maybeSingle();

      if (companyError || !company) {
        router.replace("/select-company");
        return;
      }

      // 4) Verifica vínculo do usuário com a empresa
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

      setAuthorized(true);
      setLoading(false);
    };

    validateAccess();
  }, [router, slug]);

  if (loading) {
    return <div style={{ padding: 40 }}>Carregando dashboard...</div>;
  }

  if (!authorized) {
    return null;
  }

  if (slug === "tech4con") {
    return <Tech4ConDashboard />;
  }

  if (slug === "mediarh") {
    return <MediarhDashboard />;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard em construção</h1>
      <p>Empresa: {slug}</p>
      <p>Este dashboard ainda não foi configurado.</p>
    </div>
  );
}
