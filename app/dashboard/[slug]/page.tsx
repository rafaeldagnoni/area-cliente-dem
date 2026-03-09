"use client";

import Tech4ConDashboard from "../tech4con/page";

type PageProps = {
  params: {
    slug: string;
  };
};

export default function DynamicDashboardPage({ params }: PageProps) {
  const { slug } = params;

  if (slug === "tech4con") {
    return <Tech4ConDashboard />;
  }

  if (slug === "mediarh") {
    return (
      <div style={{ padding: 40 }}>
        <h1>Dashboard Mediarh</h1>
        <p>Em construção.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard em construção</h1>
      <p>Empresa: {slug}</p>
      <p>Este dashboard ainda não foi configurado.</p>
    </div>
  );
}
