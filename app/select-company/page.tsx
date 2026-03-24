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
        router.replace("/");
        return;
      }

      const { data, error } = await supabase
        .from("user_companies")
        .select("companies (id, name, slug)")
        .eq("user_id", user.id);

      if (error) {
        setError("Erro ao carregar empresas. Tente novamente.");
        setLoading(false);
        return;
      }

      const list: Company[] =
        (data || [])
          .map((row: any) => row.companies)
          .filter(Boolean)
          .map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })) || [];

      setCompanies(list);

      if (list.length === 1) {
        await setActiveCompany(user.id, list[0]);
        router.replace(`/selecionar-modulo/${list[0].slug}`);
        return;
      }

      setLoading(false);
    };

    run();
  }, [router]);

  const setActiveCompany = async (userId: string, company: Company) => {
    try {
      await supabase
        .from("profiles")
        .update({ active_company_id: company.id })
        .eq("id", userId);
    } catch (e) {
      // ignora
    }

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
      router.replace("/");
      return;
    }

    await setActiveCompany(user.id, company);
    router.replace(`/selecionar-modulo/${company.slug}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  // Loading State
  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner-lg" />
        <p className="loading-text">Carregando suas empresas...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="loading-page">
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'rgba(196, 92, 92, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--dm-error)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '1.5rem', 
            marginBottom: '0.75rem',
            color: 'var(--dm-dark)'
          }}>
            Erro ao carregar
          </h2>
          <p style={{ color: 'var(--dm-mid)', marginBottom: '1.5rem' }}>
            {error}
          </p>
          <button 
            className="btn btn-outline"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--dm-off)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header simples */}
      <header style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--dm-light)'
      }}>
        <img 
          src="/logo-dm.png" 
          alt="D&M Consultoria" 
          style={{ height: '32px' }}
        />
        <button 
          className="btn btn-ghost"
          onClick={handleLogout}
        >
          Sair
        </button>
      </header>

      {/* Conteúdo principal */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ width: '100%', maxWidth: '800px' }}>
          {/* Título */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p className="label" style={{ marginBottom: '1rem' }}>
              Portal do Cliente
            </p>
            <h1 style={{ 
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              color: 'var(--dm-dark)',
              marginBottom: '0.75rem'
            }}>
              Selecione uma empresa
            </h1>
            <p style={{ color: 'var(--dm-mid)', fontSize: '0.95rem' }}>
              Escolha qual dashboard deseja acessar
            </p>
          </div>

          {/* Grid de Empresas */}
          {companies.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <h3 className="empty-state-title">Nenhuma empresa vinculada</h3>
              <p className="empty-state-text">
                Entre em contato com a D&M Consultoria para vincular sua empresa.
              </p>
            </div>
          ) : (
            <div className="company-grid">
              {companies.map((company, index) => (
                <div
                  key={company.id}
                  className="company-card fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleSelect(company)}
                >
                  <div className="company-card-name">{company.name}</div>
                  <div className="company-card-slug">/dashboard/{company.slug}</div>
                  
                  <div className="company-card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer simples */}
      <footer style={{
        padding: '1.5rem 2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--dm-light)'
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--dm-mid)' }}>
          © {new Date().getFullYear()} D&M Consultoria Financeira
        </p>
      </footer>
    </div>
  );
}
