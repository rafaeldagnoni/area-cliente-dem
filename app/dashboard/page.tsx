"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function DashboardIndexPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Carregando...");

  useEffect(() => {
    const run = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      // 1) tenta pegar do localStorage (rápido)
      const slugLocal = localStorage.getItem("active_company_slug");
      if (slugLocal) {
        router.replace(`/dashboard/${slugLocal}`);
        return;
      }

      // 2) tenta pegar do profiles.active_company_id
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("active_company_id")
        .eq("id", user.id)
        .single();

      if (pErr) {
        setMsg("Não consegui carregar sua empresa ativa. Vá em Trocar empresa.");
        return;
      }

      const activeCompanyId = profile?.active_company_id;
      if (!activeCompanyId) {
        router.replace("/select-company");
        return;
      }

      // 3) busca o slug da empresa ativa e redireciona
      const { data: company, error: cErr } = await supabase
        .from("companies")
        .select("slug")
        .eq("id", activeCompanyId)
        .single();

      if (cErr || !company?.slug) {
        router.replace("/select-company");
        return;
      }

      localStorage.setItem("active_company_slug", company.slug);
      router.replace(`/dashboard/${company.slug}`);
    };

    run();
  }, [router]);

  // fallback simples
  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <p>{msg}</p>
    </div>
  );
}
