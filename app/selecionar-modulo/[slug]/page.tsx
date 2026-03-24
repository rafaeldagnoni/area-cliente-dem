"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";

type Modulo = {
  id: string;
  nome: string;
  slug: string;
};

export default function SelecionarModuloPage() {
  const router = useRouter();
  const params = useParams();
  const slugEmpresa = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [nomeEmpresa, setNomeEmpresa] = useState("");
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

      const { data: empresa, error: erroEmpresa } = await supabase
        .from("companies")
        .select("id, name")
        .eq("slug", slugEmpresa)
        .single();

      if (erroEmpresa || !empresa) {
        setError("Empresa não encontrada.");
        setLoading(false);
        return;
      }

      setNomeEmpresa(empresa.name);

      const { data: todosModulos, error: erroModulos } = await supabase
        .from("modulos")
        .select("id, slug, nome")
        .eq("company_id", empresa.id);

      if (erroModulos) {
        setError("Erro ao carregar módulos.");
        setLoading(false);
        return;
      }

      const { data: permissoes } = await supabase
        .from("user_module_access")
        .select("modulo_id")
        .eq("user_id", user.id)
        .eq("pode_visualizar", true);

      const idsComPermissao = permissoes?.map((p: any) => p.modulo_id) || [];

      const modulosPermitidos = (todosModulos || []).filter((m: any) =>
        idsComPermissao.includes(m.id)
      );

      setModulos(modulosPermitidos);
      setLoading(false);
    };

    run();
  }, [slugEmpresa, router]);

  const handleSelect = (modulo: Modulo) => {
    router.push(`/dashboard/${slugEmpresa}/${modulo.slug}`);
  };

  const handleVoltarParaEmpresas = () => {
    router.push("/select-company");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const getIconeModulo = (slug: string) => {
    switch (slug) {
      case "financeiro":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6h1.5zm0 0h3V9h-3z" />
            <path d="M7 12h10M12 7v10" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      case "comercial":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
            <path d="M9 14h2m-2 4h2m4-4h2m-2 4h2M3 14l3 3-3 3" />
          </svg>
        );
      case "operacoes":
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="1" />
            <path d="M12 3v2m0 12v2M4.22 4.22l1.41 1.41m8.34 8.34l1.41 1.41M3 12h2m12 0h2M4.22 19.78l1.41-1.41m8.34-8.34l1.41-1.41" />
            <path d="M9 5h6v14H9z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getCorModulo = (slug: string) => {
    switch (slug) {
      case "financeiro":
        return "#2563eb"; // Azul
      case "comercial":
        return "#10b981"; // Verde
      case "operacoes":
        return "#f59e0b"; // Âmbar
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner-lg" />
        <p className="loading-text">Carregando módulos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-page">
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 1.5rem",
              borderRadius: "50%",
              background: "rgba(196, 92, 92, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--dm-error)"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.5rem",
              marginBottom: "0.75rem",
              color: "var(--dm-dark)",
            }}
          >
            Erro ao carregar
          </h2>
          <p style={{ color: "var(--dm-mid)", marginBottom: "1.5rem" }}>
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
    <div
      style={{
        minHeight: "100vh",
        background: "var(--dm-off)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--dm-light)",
        }}
      >
        <img
          src="/logo-dm.png"
          alt="D&M Consultoria"
          style={{ height: "32px" }}
        />
        <button className="btn btn-ghost" onClick={handleLogout}>
          Sair
        </button>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: "800px" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p className="label" style={{ marginBottom: "1rem" }}>
              {nomeEmpresa}
            </p>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                color: "var(--dm-dark)",
                marginBottom: "0.75rem",
              }}
            >
              Selecione um módulo
            </h1>
            <p style={{ color: "var(--dm-mid)", fontSize: "0.95rem" }}>
              Escolha qual módulo deseja acessar
            </p>
          </div>

          {modulos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 6v12m6-6H6" />
                </svg>
              </div>
              <h3 className="empty-state-title">
                Nenhum módulo disponível
              </h3>
              <p className="empty-state-text">
                Você não tem acesso a nenhum módulo nessa empresa.
              </p>
            </div>
          ) : (
            <div className="company-grid">
              {modulos.map((modulo, index) => {
                const cor = getCorModulo(modulo.slug);
                return (
                  <div
                    key={modulo.id}
                    className="company-card fade-in-up"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onClick={() => handleSelect(modulo)}
                  >
                    {/* Fundo colorido no topo do card */}
                    <div
                      style={{
                        width: "100%",
                        height: "100px",
                        background: `linear-gradient(135deg, ${cor}20, ${cor}10)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "1rem",
                        borderRadius: "8px 8px 0 0",
                      }}
                    >
                      <div
                        style={{
                          color: cor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {getIconeModulo(modulo.slug)}
                      </div>
                    </div>

                    {/* Texto do módulo */}
                    <div className="company-card-name">{modulo.nome}</div>
                    <div className="company-card-slug">/módulo/{modulo.slug}</div>

                    {/* Seta */}
                    <div className="company-card-arrow">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {modulos.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <button
                className="btn btn-outline"
                onClick={handleVoltarParaEmpresas}
              >
                ← Voltar para empresas
              </button>
            </div>
          )}
        </div>
      </main>

      <footer
        style={{
          padding: "1.5rem 2rem",
          textAlign: "center",
          borderTop: "1px solid var(--dm-light)",
        }}
      >
        <p style={{ fontSize: "0.75rem", color: "var(--dm-mid)" }}>
          © {new Date().getFullYear()} D&M Consultoria Financeira
        </p>
      </footer>
    </div>
  );
}
