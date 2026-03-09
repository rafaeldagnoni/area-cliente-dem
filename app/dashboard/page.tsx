"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const activeCompanySlug = localStorage.getItem("active_company_slug");

    if (activeCompanySlug) {
      router.replace(`/dashboard/${activeCompanySlug}`);
      return;
    }

    router.replace("/select-company");
  }, [router]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <p>Redirecionando...</p>
    </div>
  );
}
