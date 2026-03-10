"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setError("Email ou senha inválidos.");
      setLoading(false);
      return;
    }

    const allowedEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin = allowedEmails.includes(
      (data.user.email || "").toLowerCase()
    );

    if (!isAdmin) {
      await supabase.auth.signOut();
      setError("Acesso administrativo não autorizado.");
      setLoading(false);
      return;
    }

    router.push("/dashboard/admin");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: 320,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h1>Admin D&M</h1>

        <input
          type="email"
          placeholder="Email admin"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10 }}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10 }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ padding: 12 }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {error && (
          <div style={{ color: "red", fontSize: 14 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
