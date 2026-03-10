"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
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
        .select("id, slug")
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
