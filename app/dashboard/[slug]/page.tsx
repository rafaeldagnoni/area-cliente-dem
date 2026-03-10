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
        router.replace("/");
        return;
      }

      const user = sessionData.session.user;

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, slug, name, status")
        .eq("slug", slug)
        .maybeSingle();

      if (companyError || !company) {
        router.replace("/select-company");
        return;
      }

      if (company.status !== "active") {
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

  // Loading State
  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner-lg" />
        <p className="loading-text">Carregando dashboard...</p>
      </div>
    );
  }

  // Not Authorized (já redireciona, mas por segurança)
  if (!authorized) {
    return null;
  }

  // Renderiza o dashboard específico ou o placeholder
  const renderDashboardContent = () => {
    switch (slug) {
      case "tech4con":
        return <Tech4ConDashboard />;
      case "mediarh":
        return <MediarhDashboard />;
      default:
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: 'calc(100vh - 64px - 2rem)',
            padding: '2rem'
          }}>
            <div style={{ textAlign: 'center', maxWidth: '500px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 1.5rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--dm-verde2), var(--dm-verde))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M3 3v18h18"/>
                  <path d="M18 17V9"/>
                  <path d="M13 17V5"/>
                  <path d="M8 17v-3"/>
                </svg>
              </div>
              
              <h2 style={{ 
                fontFamily: 'var(--font-serif)',
                fontSize: '1.75rem',
                color: 'var(--dm-dark)',
                marginBottom: '0.75rem'
              }}>
                Dashboard em construção
              </h2>
              
              <p style={{ 
                color: 'var(--dm-mid)', 
                fontSize: '0.95rem',
                lineHeight: 1.7,
                marginBottom: '2rem'
              }}>
                O dashboard de <strong style={{ color: 'var(--dm-dark)' }}>{companyName}</strong> está 
                sendo preparado pela equipe D&M. Em breve você terá acesso aos seus indicadores financeiros.
              </p>

              <div style={{ 
                background: 'var(--dm-white)',
                border: '1px solid var(--dm-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                textAlign: 'left'
              }}>
                <p className="label" style={{ marginBottom: '1rem' }}>
                  Enquanto isso
                </p>
                <ul style={{ 
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <li style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.75rem',
                    fontSize: '0.9rem',
                    color: 'var(--dm-dark)'
                  }}>
                    <span style={{ color: 'var(--dm-gold)' }}>→</span>
                    Envie seus dados financeiros atualizados
                  </li>
                  <li style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.75rem',
                    fontSize: '0.9rem',
                    color: 'var(--dm-dark)'
                  }}>
                    <span style={{ color: 'var(--dm-gold)' }}>→</span>
                    Agende uma reunião de alinhamento
                  </li>
                  <li style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.75rem',
                    fontSize: '0.9rem',
                    color: 'var(--dm-dark)'
                  }}>
                    <span style={{ color: 'var(--dm-gold)' }}>→</span>
                    Defina os indicadores prioritários
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Header do Dashboard */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          {/* Logo */}
          <img 
            src="/logo-dm.png" 
            alt="D&M Consultoria" 
            className="dashboard-logo"
          />

          {/* Divider + Nome da Empresa */}
          <div className="dashboard-company">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dm-mid)" strokeWidth="2">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <span className="dashboard-company-name">{companyName}</span>
            <span className="badge badge-success">Ativo</span>
          </div>
        </div>

        <div className="dashboard-header-right">
          <button
            onClick={handleSwitchCompany}
            className="btn btn-ghost"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3h5v5"/>
              <path d="M4 20L21 3"/>
              <path d="M21 16v5h-5"/>
              <path d="M15 15l6 6"/>
              <path d="M4 4l5 5"/>
            </svg>
            Trocar empresa
          </button>

          <button
            onClick={logoutUser}
            className="btn btn-outline"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo do Dashboard */}
      <main className="dashboard-content">
        {renderDashboardContent()}
      </main>
    </div>
  );
}
