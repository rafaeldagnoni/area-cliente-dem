import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ─── FONTES ───────────────────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbzrdozCbm1Fkd_oh66iXM1V4zuEjjiFYs9rSWgWQ6M4HDDeRhQXXQljeUrBXatI6Sos/exec";

// ─── LOGO DO CLIENTE ──────────────────────────────────────────────────────────
const LOGO_URL = "https://mediarh.com.br/wp-content/uploads/2024/06/Logo-Misto.svg";

// ─── PALETA MEDIARH ──────────────────────────────────────────────────────────
const C = {
  primary: "#1B4965", primaryDark: "#0D2E3F", primaryLight: "#E8F4F8", primaryMid: "#5A8FA8",
  teal: "#14B8A6", tealDark: "#0D9488", tealLight: "#CCFBF1", tealMid: "#5EEAD4",
  black: "#0A1628", dark: "#0D2E3F",
  gray900: "#1E3A4C", gray700: "#3D5A6F", gray500: "#5A7A8A", gray300: "#A8C4D4", gray100: "#E8F0F4", gray50: "#F4F8FA", white: "#FFFFFF",
  green: "#059669", greenLight: "#ECFDF5", gold: "#D97706", goldLight: "#FEF3C7",
  orange: "#EA580C", orangeLight: "#FFF7ED", red: "#DC2626", redLight: "#FEF2F2",
  border: "#D1E3EC", borderDark: "#A8C4D4",
};

// ─── FORMATADORES ─────────────────────────────────────────────────────────────
const fmtBRL = (v: number | null | undefined): string => {
  if (v === 0 || v === null || v === undefined) return "R$ -";
  const abs = Math.abs(v);
  const s = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(abs);
  return v < 0 ? `-R$ ${s}` : `R$ ${s}`;
};
const fmtK = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1000000) return `R$ ${(v/1000000).toFixed(1)}M`;
  if (abs >= 1000) return `R$ ${(v/1000).toFixed(0)}k`;
  return fmtBRL(v);
};
const fmtData = (d: string): string => {
  if (!d) return "-";
  try {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR");
  } catch { return d; }
};

// ─── MESES ────────────────────────────────────────────────────────────────────
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MESES_CURTO = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ─── ESTRUTURA DRE ─────────────────────────────────────────────────────────
const DRE_ROWS = [
  { key: "Receita Bruta", nivel: 0, tipo: "total" },
  { key: "Receita Outros", nivel: 1 },
  { key: "Receita Serviço", nivel: 1 },
  { key: "Receita de Vendas", nivel: 1 },
  { key: "Receita de Vendas - Recorrência", nivel: 1 },
  { key: "Deduções de Vendas", nivel: 0, tipo: "subtotal" },
  { key: "Receita líquida", nivel: 0, tipo: "resultado" },
  { key: "Custo dos Produtos Vendidos", nivel: 0, tipo: "subtotal" },
  { key: "Margem bruta", nivel: 0, tipo: "resultado" },
  { key: "Despesas Variáveis", nivel: 0, tipo: "subtotal" },
  { key: "Margem líquida (margem de contribuição)", nivel: 0, tipo: "resultado" },
  { key: "Gastos fixos (custos fixos + despesas fixas)", nivel: 0, tipo: "subtotal" },
  { key: "Gasto com Pessoal - Adm", nivel: 1 },
  { key: "Gasto com pessoal - Prod/Oper", nivel: 1 },
  { key: "Despesas Operacionais", nivel: 1 },
  { key: "Ebitda", nivel: 0, tipo: "destaque" },
  { key: "Receitas Financeiras", nivel: 0, tipo: "subtotal" },
  { key: "Despesas Financeiras", nivel: 0, tipo: "subtotal" },
  { key: "Resultado operacional bruto", nivel: 0, tipo: "resultado" },
  { key: "Impostos Sob Lucro", nivel: 0, tipo: "subtotal" },
  { key: "Resultado operacional líquido", nivel: 0, tipo: "resultado" },
  { key: "Distribuição de Lucro", nivel: 0, tipo: "subtotal" },
  { key: "Resultado pós distribuição de lucros", nivel: 0, tipo: "destaque" },
];

// ─── ESTRUTURA DFC ──────────────────────────────────────────────────────────
const DFC_ROWS = [
  { key: "Saldo Inicial", nivel: 0, tipo: "destaque" },
  { key: "Receitas", nivel: 0, tipo: "total" },
  { key: "Deduções de Vendas", nivel: 0, tipo: "subtotal" },
  { key: "Custo dos Produtos Vendidos", nivel: 0, tipo: "subtotal" },
  { key: "Margem bruta", nivel: 0, tipo: "resultado" },
  { key: "Despesas Variáveis", nivel: 0, tipo: "subtotal" },
  { key: "Margem líquida (margem de contribuição)", nivel: 0, tipo: "resultado" },
  { key: "Gastos fixos (custos fixos + despesas fixas)", nivel: 0, tipo: "subtotal" },
  { key: "Ebitda", nivel: 0, tipo: "destaque" },
  { key: "Resultado pós distribuição de lucros", nivel: 0, tipo: "destaque" },
  { key: "Liquidez", nivel: 0, tipo: "resultado" },
  { key: "Saldo", nivel: 0, tipo: "destaque" },
];

// ─── DESPESAS E RECEITAS KEYS ─────────────────────────────────────────
const DESPESAS_KEYS = [
  "Comissões de vendas", "Simples Nacional", "ICMS", "Pis", "Cofins", "Iss",
  "CMV/CPV - Custo Mercadoria Vendida", "Custos Variáveis de Operação", 
  "Mão de obra terceirizada", "Fretes e Combustíveis (venda)", "Gastos com Veículos",
  "Manutenção de Equipamentos", "Taxa de Boletos | Cartão",
  "Gasto com Pessoal - Adm", "Gasto com pessoal - Prod/Oper", "Despesas Operacionais"
];
const RECEITAS_KEYS = [
  "Receita Outros", "Receita Serviço", "Receita de Vendas", 
  "Receita de Vendas - Recorrência", "Receitas Financeiras"
];

// ─── COMPONENTES AUXILIARES ──────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.gray100}`, borderTopColor: C.primary, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorMessage({ msg }: { msg: string }) {
  return (
    <div style={{ background: C.redLight, border: `1px solid ${C.red}`, borderRadius: 8, padding: 16, color: C.red, fontSize: 14 }}>
      <strong>Erro:</strong> {msg}
    </div>
  );
}

// ─── KPI CARD ────────────────────────────────────────────────────────────────
function KPICard({ label, valor, percentual, cor, small = false, showDiff = false, subLabel }: { 
  label: string; valor: number; percentual?: number; cor?: string; small?: boolean; showDiff?: boolean; subLabel?: string;
}) {
  return (
    <div style={{ background: cor ? `${cor}11` : C.white, border: `1px solid ${cor || C.border}`, borderRadius: 10, padding: small ? "12px 16px" : "16px 20px", minWidth: small ? 140 : 160, flex: 1 }}>
      <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: 0.5, color: cor || C.gray500, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: small ? 18 : 22, color: C.dark }}>{fmtBRL(valor)}</div>
      {percentual !== undefined && (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: showDiff ? (percentual >= 0 ? C.green : C.red) : C.gray500, marginTop: 4 }}>
          {showDiff && percentual > 0 ? "+" : ""}{percentual.toFixed(2).replace(".",",")}%
        </div>
      )}
      {subLabel && <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: C.gray500, marginTop: 4 }}>{subLabel}</div>}
    </div>
  );
}

// ─── GAUGE CHART ─────────────────────────────────────────────────────────────
function GaugeChart({ value, max, label }: { value: number; max: number; label: string }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 150);
  const angle = (percentage / 150) * 180 - 90;
  const getColor = (pct: number) => pct < 80 ? C.red : pct < 100 ? C.gold : C.green;
  const currentColor = getColor(percentage);
  const displayPct = ((value / max) * 100);
  
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13, color: C.dark, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
        <span style={{ width: 3, height: 14, background: C.teal, borderRadius: 2 }}></span>
        {label}
      </div>
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={C.gray100} strokeWidth="16" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 68 28" fill="none" stroke={C.red} strokeWidth="16" strokeLinecap="round" opacity="0.3" />
        <path d="M 68 28 A 80 80 0 0 1 100 20" fill="none" stroke={C.gold} strokeWidth="16" opacity="0.3" />
        <path d="M 100 20 A 80 80 0 0 1 180 100" fill="none" stroke={C.green} strokeWidth="16" strokeLinecap="round" opacity="0.3" />
        <g transform={`rotate(${angle}, 100, 100)`}>
          <line x1="100" y1="100" x2="100" y2="35" stroke={currentColor} strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="100" r="8" fill={currentColor} />
          <circle cx="100" cy="100" r="4" fill={C.white} />
        </g>
        <text x="20" y="115" fontSize="10" fill={C.gray500} textAnchor="middle">0%</text>
        <text x="100" y="18" fontSize="10" fill={C.gray500} textAnchor="middle">100%</text>
        <text x="180" y="115" fontSize="10" fill={C.gray500} textAnchor="middle">150%</text>
      </svg>
      <div style={{ marginTop: -20, textAlign: "center" }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: currentColor }}>{displayPct.toFixed(1).replace(".",",")}%</div>
        <div style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>{fmtBRL(value)} / {fmtBRL(max)}</div>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red }}></span>Risco</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }}></span>Atenção</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }}></span>Saudável</span>
      </div>
    </div>
  );
}

// ─── TOP 5 LIST ──────────────────────────────────────────────────────────────
function Top5List({ title, items, cor, tipo }: { title: string; items: Array<{ nome: string; valor: number }>; cor: string; tipo: "despesa" | "receita"; }) {
  const total = items.reduce((acc, i) => acc + Math.abs(i.valor), 0);
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, flex: 1 }}>
      <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13, color: C.dark, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 3, height: 14, background: cor, borderRadius: 2 }}></span>
        {title}
      </div>
      {items.length === 0 ? (
        <div style={{ color: C.gray500, fontSize: 12, textAlign: "center", padding: 20 }}>Sem dados no período</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.slice(0, 5).map((item, i) => {
            const pct = total > 0 ? (Math.abs(item.valor) / total) * 100 : 0;
            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.dark, fontWeight: 500 }}>{i + 1}. {item.nome}</span>
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: tipo === "despesa" ? C.red : C.green }}>
                    {tipo === "despesa" ? "-" : "+"}{fmtBRL(Math.abs(item.valor))}
                  </span>
                </div>
                <div style={{ background: C.gray100, borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ background: cor, height: "100%", width: `${pct}%`, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TABELA FINANCEIRA ───────────────────────────────────────────────────────
function TabelaFinanceira({ rows, dados, mesInicial, mesFinal, titulo, mostrarAno }: {
  rows: Array<{ key: string; nivel: number; tipo?: string }>; dados: any; mesInicial: number; mesFinal: number; titulo: string; mostrarAno: boolean;
}) {
  if (!dados || !dados.contas) return <LoadingSpinner />;
  const getValor = (key: string, mesIdx: number): number => dados.contas[key]?.valores?.[mesIdx] || 0;
  const getValorPeriodo = (key: string): number => {
    const conta = dados.contas[key];
    if (!conta?.valores) return 0;
    let soma = 0;
    for (let i = mesInicial; i <= mesFinal; i++) soma += conta.valores[i] || 0;
    return soma;
  };
  const getAnual = (key: string): number => dados.contas[key]?.valores?.reduce((a: number, b: number) => a + b, 0) || 0;
  const receitaBrutaPeriodo = getValorPeriodo("Receita Bruta") || getValorPeriodo("Receitas");
  const receitaLiquidaPeriodo = getValorPeriodo("Receita líquida");
  const getPctPeriodo = (key: string, valor: number): number => {
    if (key === "Ebitda") return receitaLiquidaPeriodo ? (valor / receitaLiquidaPeriodo) * 100 : 0;
    return receitaBrutaPeriodo ? (valor / receitaBrutaPeriodo) * 100 : 0;
  };
  const rowsExistentes = rows.filter(row => dados.contas[row.key] || ["Receita Bruta","Receita líquida","Margem bruta","Ebitda","Saldo Inicial","Saldo"].includes(row.key));

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
        <thead>
          <tr style={{ background: C.dark }}>
            <th style={{ padding: "10px 12px", textAlign: "left", color: C.white, fontWeight: 600, fontSize: 12 }}>{titulo}</th>
            {mostrarAno ? (
              <>
                {MESES_CURTO.map((m, i) => <th key={m} style={{ padding: "10px 8px", textAlign: "right", color: C.white, fontWeight: 500, fontSize: 11, background: (i >= mesInicial && i <= mesFinal) ? C.primaryDark : C.dark }}>{m}</th>)}
                <th style={{ padding: "10px 8px", textAlign: "right", color: C.primary, fontWeight: 700, fontSize: 11 }}>TOTAL</th>
              </>
            ) : (
              <>
                <th style={{ padding: "10px 12px", textAlign: "right", color: C.white, fontWeight: 500, fontSize: 11, minWidth: 100 }}>VALOR</th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: C.white, fontWeight: 500, fontSize: 11, minWidth: 70 }}>%</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rowsExistentes.map((row, idx) => {
            const valorPeriodo = getValorPeriodo(row.key);
            const pctPeriodo = getPctPeriodo(row.key, valorPeriodo);
            const isDestaque = row.tipo === "destaque";
            const isResultado = row.tipo === "resultado";
            const isTotal = row.tipo === "total";
            let bg = idx % 2 === 0 ? C.white : C.gray50;
            if (isDestaque) bg = C.primaryLight;
            else if (isResultado) bg = C.tealLight;
            else if (isTotal) bg = C.greenLight;
            const fontWeight = (isDestaque || isResultado || row.tipo === "subtotal" || isTotal) ? 600 : 400;
            const paddingLeft = 12 + (row.nivel || 0) * 16;
            return (
              <tr key={row.key} style={{ background: bg }}>
                <td style={{ padding: `8px 12px 8px ${paddingLeft}px`, fontWeight, color: isDestaque ? C.primaryDark : C.dark, borderBottom: `1px solid ${C.gray100}` }}>{row.key}</td>
                {mostrarAno ? (
                  <>
                    {MESES_CURTO.map((_, i) => {
                      const val = getValor(row.key, i);
                      return <td key={i} style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: val < 0 ? C.red : C.dark, borderBottom: `1px solid ${C.gray100}`, background: (i >= mesInicial && i <= mesFinal) ? `${C.primary}08` : "transparent" }}>{fmtK(val)}</td>;
                    })}
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, color: getAnual(row.key) < 0 ? C.red : C.dark, borderBottom: `1px solid ${C.gray100}` }}>{fmtK(getAnual(row.key))}</td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", color: valorPeriodo < 0 ? C.red : C.dark, fontWeight, borderBottom: `1px solid ${C.gray100}` }}>{fmtBRL(valorPeriodo)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.gray500, borderBottom: `1px solid ${C.gray100}` }}>{pctPeriodo.toFixed(2).replace(".",",")}%</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── OVERVIEW VIEW ───────────────────────────────────────────────────────────
function OverviewView({ dados, mesInicial, mesFinal }: { dados: any; mesInicial: number; mesFinal: number }) {
  if (!dados || !dados.dre || !dados.dre.contas) return <LoadingSpinner />;
  
  const getValorPeriodoDRE = (key: string): number => {
    const conta = dados.dre.contas[key];
    if (!conta?.valores) return 0;
    let soma = 0;
    for (let i = mesInicial; i <= mesFinal; i++) soma += conta.valores[i] || 0;
    return soma;
  };
  const getValorPeriodoDFC = (key: string): number => {
    const conta = dados.dfc?.contas?.[key];
    if (!conta?.valores) return 0;
    let soma = 0;
    for (let i = mesInicial; i <= mesFinal; i++) soma += conta.valores[i] || 0;
    return soma;
  };
  const getValor = (key: string, idx: number): number => dados.dre.contas[key]?.valores?.[idx] || 0;

  const receitaBrutaPeriodo = getValorPeriodoDRE("Receita Bruta");
  const receitaLiquidaPeriodo = getValorPeriodoDRE("Receita líquida");
  const margemBrutaPeriodo = getValorPeriodoDRE("Margem bruta");
  const margemContribPeriodo = getValorPeriodoDRE("Margem líquida (margem de contribuição)");
  const ebitdaPeriodo = getValorPeriodoDRE("Ebitda");
  const gastosFixosPeriodo = getValorPeriodoDRE("Gastos fixos (custos fixos + despesas fixas)");
  const lucroLiqPeriodo = getValorPeriodoDRE("Resultado pós distribuição de lucros");

  const pctMargemBruta = receitaBrutaPeriodo ? (margemBrutaPeriodo / receitaBrutaPeriodo) * 100 : 0;
  const pctMargemContrib = receitaBrutaPeriodo ? (margemContribPeriodo / receitaBrutaPeriodo) * 100 : 0;
  const pctEbitda = receitaLiquidaPeriodo ? (ebitdaPeriodo / receitaLiquidaPeriodo) * 100 : 0;
  const pctLucro = receitaBrutaPeriodo ? (lucroLiqPeriodo / receitaBrutaPeriodo) * 100 : 0;

  const pontoEquilibrio = pctMargemContrib > 0 ? (Math.abs(gastosFixosPeriodo) / (pctMargemContrib / 100)) : 0;
  const pctPontoEquilibrio = pontoEquilibrio > 0 ? ((receitaBrutaPeriodo - pontoEquilibrio) / pontoEquilibrio) * 100 : 0;

  const mesAtual = mesFinal;
  const mesAnterior = mesAtual > 0 ? mesAtual - 1 : 0;
  const receitaMesAtual = getValor("Receita Bruta", mesAtual);
  const receitaMesAnterior = getValor("Receita Bruta", mesAnterior);
  const variacaoMoM = receitaMesAnterior > 0 ? ((receitaMesAtual - receitaMesAnterior) / receitaMesAnterior) * 100 : 0;

  const saldoInicial = dados.dfc?.contas?.["Saldo Inicial"]?.valores?.[mesInicial] || 0;
  const liquidezPeriodo = getValorPeriodoDFC("Liquidez");
  const saldoFinal = saldoInicial + liquidezPeriodo;

  const top5Despesas = DESPESAS_KEYS.map(key => ({ nome: key, valor: getValorPeriodoDRE(key) })).filter(d => d.valor !== 0).sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor)).slice(0, 5);
  const top5Receitas = RECEITAS_KEYS.map(key => ({ nome: key, valor: getValorPeriodoDRE(key) })).filter(d => d.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 5);

  const chartData = MESES_CURTO.map((m, i) => ({ mes: m, Receita: getValor("Receita Bruta", i), EBITDA: getValor("Ebitda", i), inRange: i >= mesInicial && i <= mesFinal }));
  const pieData = [
    { name: "Custo Produtos", value: Math.abs(getValorPeriodoDRE("Custo dos Produtos Vendidos")) },
    { name: "Desp. Variáveis", value: Math.abs(getValorPeriodoDRE("Despesas Variáveis")) },
    { name: "Gastos Fixos", value: Math.abs(gastosFixosPeriodo) },
    { name: "Lucro", value: Math.max(0, lucroLiqPeriodo) },
  ].filter(d => d.value > 0);
  const PIE_COLORS = [C.primary, C.orange, C.teal, C.green];
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>{payload.map((p: any, i: number) => <div key={i} style={{ color: p.color }}>{p.name}: {fmtBRL(p.value)}</div>)}</div>;
  };
  const periodoLabel = mesInicial === mesFinal ? MESES[mesInicial] : `${MESES_CURTO[mesInicial]} a ${MESES_CURTO[mesFinal]}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Faturamento" valor={receitaBrutaPeriodo} percentual={100} cor={C.primary} />
        <KPICard label="Margem Bruta" valor={margemBrutaPeriodo} percentual={pctMargemBruta} cor={C.gold} />
        <KPICard label="Margem Contrib." valor={margemContribPeriodo} percentual={pctMargemContrib} cor={C.orange} />
        <KPICard label="EBITDA" valor={ebitdaPeriodo} percentual={pctEbitda} cor={C.teal} />
        <KPICard label="Lucro Líquido" valor={lucroLiqPeriodo} percentual={pctLucro} cor={C.green} />
        <KPICard label="Ponto Equilíbrio" valor={pontoEquilibrio} percentual={pctPontoEquilibrio} cor={C.gray700} showDiff={true} />
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Variação MoM" valor={receitaMesAtual} percentual={variacaoMoM} cor={variacaoMoM >= 0 ? C.green : C.red} showDiff={true} subLabel={`vs ${MESES_CURTO[mesAnterior]}: ${fmtBRL(receitaMesAnterior)}`} />
        <KPICard label="Saldo Inicial" valor={saldoInicial} cor={C.primaryMid} subLabel={`Em ${MESES_CURTO[mesInicial]}`} />
        <KPICard label="Liquidez Período" valor={liquidezPeriodo} percentual={saldoInicial ? (liquidezPeriodo / saldoInicial) * 100 : 0} cor={liquidezPeriodo >= 0 ? C.green : C.red} showDiff={true} />
        <KPICard label="Saldo Final" valor={saldoFinal} cor={saldoFinal >= 0 ? C.tealDark : C.red} subLabel={`Projetado em ${MESES_CURTO[mesFinal]}`} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        <GaugeChart value={receitaBrutaPeriodo} max={pontoEquilibrio} label="Faturamento vs Ponto de Equilíbrio" />
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13, color: C.dark, textTransform: "uppercase", marginBottom: 16 }}>Composição — {periodoLabel}</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35} paddingAngle={2}>{pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(v: any) => fmtBRL(v)} /><Legend wrapperStyle={{ fontSize: 10 }} /></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13, color: C.dark, textTransform: "uppercase", marginBottom: 16 }}>Faturamento Mensal</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}><defs><linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.3}/><stop offset="95%" stopColor={C.primary} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.gray100} /><XAxis dataKey="mes" tick={{ fill: C.gray500, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} tick={{ fill: C.gray500, fontSize: 10 }} axisLine={false} tickLine={false} width={40} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="Receita" stroke={C.primary} strokeWidth={2} fill="url(#colorReceita)" /></AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        <Top5List title="Top 5 Despesas" items={top5Despesas} cor={C.red} tipo="despesa" />
        <Top5List title="Top 5 Receitas" items={top5Receitas} cor={C.green} tipo="receita" />
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13, color: C.dark, textTransform: "uppercase", marginBottom: 16 }}>EBITDA Mensal</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke={C.gray100} /><XAxis dataKey="mes" tick={{ fill: C.gray500, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} tick={{ fill: C.gray500, fontSize: 10 }} axisLine={false} tickLine={false} width={40} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="EBITDA" radius={[4, 4, 0, 0]}>{chartData.map((d, i) => <Cell key={i} fill={d.EBITDA < 0 ? C.red : (d.inRange ? C.primary : C.gray300)} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── CONTAS A PAGAR VIEW ─────────────────────────────────────────────────────
function ContasPagarView({ ano, apiUrl }: { ano: number; apiUrl: string }) {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "Pendente" | "Pago">("todos");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}?tipo=pagar&ano=${ano}`);
        const json = await res.json();
        if (json.success) setLancamentos(json.lancamentos || []);
        else throw new Error(json.error || "Erro ao carregar");
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [ano, apiUrl]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage msg={error} />;

  const filtrados = filtroStatus === "todos" ? lancamentos : lancamentos.filter(l => l.status === filtroStatus);
  const totalPendente = lancamentos.filter(l => l.status === "Pendente").reduce((acc, l) => acc + l.valor, 0);
  const totalPago = lancamentos.filter(l => l.status === "Pago").reduce((acc, l) => acc + l.valor, 0);
  const qtdPendente = lancamentos.filter(l => l.status === "Pendente").length;
  const qtdPago = lancamentos.filter(l => l.status === "Pago").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Total Pendente" valor={totalPendente} cor={C.red} subLabel={`${qtdPendente} lançamentos`} />
        <KPICard label="Total Pago" valor={totalPago} cor={C.green} subLabel={`${qtdPago} lançamentos`} />
        <KPICard label="Total Geral" valor={totalPendente + totalPago} cor={C.primary} subLabel={`${lancamentos.length} lançamentos`} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {(["todos", "Pendente", "Pago"] as const).map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)} style={{ padding: "6px 16px", borderRadius: 6, border: `1px solid ${filtroStatus === s ? C.primary : C.border}`, background: filtroStatus === s ? C.primary : C.white, color: filtroStatus === s ? C.white : C.dark, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {s === "todos" ? "Todos" : s}
          </button>
        ))}
      </div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'Inter',sans-serif" }}>
          <thead>
            <tr style={{ background: C.dark }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: C.white, fontWeight: 600 }}>Fornecedor</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: C.white, fontWeight: 600 }}>Categoria</th>
              <th style={{ padding: "10px 12px", textAlign: "right", color: C.white, fontWeight: 600 }}>Valor</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: C.white, fontWeight: 600 }}>Vencimento</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: C.white, fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.slice(0, 50).map((l, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.gray50 }}>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}` }}>{l.fornecedor}</td>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}`, color: C.gray500 }}>{l.categoria}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", color: C.red, borderBottom: `1px solid ${C.gray100}` }}>{fmtBRL(l.valor)}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${C.gray100}` }}>{fmtData(l.dataVencimento)}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${C.gray100}` }}>
                  <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: l.status === "Pago" ? C.greenLight : C.redLight, color: l.status === "Pago" ? C.green : C.red }}>{l.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length > 50 && <div style={{ padding: 12, textAlign: "center", color: C.gray500, fontSize: 12 }}>Mostrando 50 de {filtrados.length} lançamentos</div>}
        {filtrados.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.gray500 }}>Nenhum lançamento encontrado</div>}
      </div>
    </div>
  );
}

// ─── CONTAS A RECEBER VIEW ───────────────────────────────────────────────────
function ContasReceberView({ ano, apiUrl }: { ano: number; apiUrl: string }) {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "Pendente" | "Recebido">("todos");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}?tipo=receber&ano=${ano}`);
        const json = await res.json();
        if (json.success) setLancamentos(json.lancamentos || []);
        else throw new Error(json.error || "Erro ao carregar");
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [ano, apiUrl]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage msg={error} />;

  const filtrados = filtroStatus === "todos" ? lancamentos : lancamentos.filter(l => l.status === filtroStatus);
  const totalPendente = lancamentos.filter(l => l.status === "Pendente").reduce((acc, l) => acc + l.valor, 0);
  const totalRecebido = lancamentos.filter(l => l.status === "Recebido").reduce((acc, l) => acc + l.valor, 0);
  const qtdPendente = lancamentos.filter(l => l.status === "Pendente").length;
  const qtdRecebido = lancamentos.filter(l => l.status === "Recebido").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Total Pendente" valor={totalPendente} cor={C.gold} subLabel={`${qtdPendente} lançamentos`} />
        <KPICard label="Total Recebido" valor={totalRecebido} cor={C.green} subLabel={`${qtdRecebido} lançamentos`} />
        <KPICard label="Total Geral" valor={totalPendente + totalRecebido} cor={C.primary} subLabel={`${lancamentos.length} lançamentos`} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {(["todos", "Pendente", "Recebido"] as const).map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)} style={{ padding: "6px 16px", borderRadius: 6, border: `1px solid ${filtroStatus === s ? C.primary : C.border}`, background: filtroStatus === s ? C.primary : C.white, color: filtroStatus === s ? C.white : C.dark, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {s === "todos" ? "Todos" : s}
          </button>
        ))}
      </div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'Inter',sans-serif" }}>
          <thead>
            <tr style={{ background: C.dark }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: C.white, fontWeight: 600 }}>Cliente</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: C.white, fontWeight: 600 }}>Categoria</th>
              <th style={{ padding: "10px 12px", textAlign: "right", color: C.white, fontWeight: 600 }}>Valor</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: C.white, fontWeight: 600 }}>Vencimento</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: C.white, fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.slice(0, 50).map((l, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.gray50 }}>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}` }}>{l.cliente}</td>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}`, color: C.gray500 }}>{l.categoria}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", color: C.green, borderBottom: `1px solid ${C.gray100}` }}>{fmtBRL(l.valor)}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${C.gray100}` }}>{fmtData(l.dataVencimento)}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${C.gray100}` }}>
                  <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: l.status === "Recebido" ? C.greenLight : C.goldLight, color: l.status === "Recebido" ? C.green : C.gold }}>{l.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length > 50 && <div style={{ padding: 12, textAlign: "center", color: C.gray500, fontSize: 12 }}>Mostrando 50 de {filtrados.length} lançamentos</div>}
        {filtrados.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.gray500 }}>Nenhum lançamento encontrado</div>}
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function MediarhDashboard() {
  const [ano, setAno] = useState(2026);
  const [mesInicial, setMesInicial] = useState(0);
  const [mesFinal, setMesFinal] = useState(0);
  const [modoAnual, setModoAnual] = useState(false);
  const [tab, setTab] = useState<"overview" | "dre" | "dfc" | "pagar" | "receber">("overview");
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}?ano=${ano}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erro desconhecido");
      setDados(json);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [ano]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  const periodoLabel = mesInicial === mesFinal ? MESES[mesInicial] : `${MESES_CURTO[mesInicial]} a ${MESES_CURTO[mesFinal]}`;
  const tabs = [
    { id: "overview", label: "Visão Geral" },
    { id: "dre", label: "DRE" },
    { id: "dfc", label: "DFC" },
    { id: "pagar", label: "A Pagar" },
    { id: "receber", label: "A Receber" },
  ];

  return (
    <>
      <link href={FONT_URL} rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: C.gray50, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {/* Header */}
        <header style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.tealDark} 100%)`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
          <img src={LOGO_URL} alt="Mediarh" style={{ height: 36 }} />
          <div style={{ display: "flex", gap: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: tab === t.id ? C.white : "transparent", color: tab === t.id ? C.primary : C.white, fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>{t.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.white}40`, background: "transparent", color: C.white, fontSize: 13, cursor: "pointer" }}>
              {[2024, 2025, 2026].map(a => <option key={a} value={a} style={{ color: C.dark }}>{a}</option>)}
            </select>
            <span style={{ color: C.white, fontSize: 12 }}>DE</span>
            <select value={mesInicial} onChange={e => { setMesInicial(Number(e.target.value)); if (Number(e.target.value) > mesFinal) setMesFinal(Number(e.target.value)); }} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.white}40`, background: "transparent", color: C.white, fontSize: 13, cursor: "pointer" }}>
              {MESES.map((m, i) => <option key={i} value={i} style={{ color: C.dark }}>{m}</option>)}
            </select>
            <span style={{ color: C.white, fontSize: 12 }}>ATÉ</span>
            <select value={mesFinal} onChange={e => setMesFinal(Number(e.target.value))} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.white}40`, background: "transparent", color: C.white, fontSize: 13, cursor: "pointer" }}>
              {MESES.map((m, i) => <option key={i} value={i} disabled={i < mesInicial} style={{ color: C.dark }}>{m}</option>)}
            </select>
            <button onClick={() => setModoAnual(!modoAnual)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.white}40`, background: modoAnual ? C.white : "transparent", color: modoAnual ? C.primary : C.white, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>☰ MENSAL</button>
            <button onClick={fetchDados} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: C.teal, color: C.white, fontSize: 14, cursor: "pointer" }}>↻</button>
          </div>
        </header>

        {/* Subheader */}
        <div style={{ background: C.primary, padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.white, fontSize: 13, fontWeight: 500 }}>{ano} › {periodoLabel}</span>
          {dados?.atualizadoEm && <span style={{ color: C.gray300, fontSize: 11 }}>Atualizado: {new Date(dados.atualizadoEm).toLocaleString("pt-BR")}</span>}
        </div>

        {/* Content */}
        <main style={{ padding: 24 }}>
          {loading && tab !== "pagar" && tab !== "receber" && <LoadingSpinner />}
          {error && tab !== "pagar" && tab !== "receber" && <ErrorMessage msg={error} />}
          {!loading && !error && tab === "overview" && <OverviewView dados={dados} mesInicial={mesInicial} mesFinal={mesFinal} />}
          {!loading && !error && tab === "dre" && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <TabelaFinanceira rows={DRE_ROWS} dados={dados?.dre} mesInicial={mesInicial} mesFinal={mesFinal} titulo={`DRE — ${ano} — ${periodoLabel}`} mostrarAno={modoAnual} />
            </div>
          )}
          {!loading && !error && tab === "dfc" && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <TabelaFinanceira rows={DFC_ROWS} dados={dados?.dfc} mesInicial={mesInicial} mesFinal={mesFinal} titulo={`DFC — ${ano} — ${periodoLabel}`} mostrarAno={modoAnual} />
            </div>
          )}
          {tab === "pagar" && <ContasPagarView ano={ano} apiUrl={API_URL} />}
          {tab === "receber" && <ContasReceberView ano={ano} apiUrl={API_URL} />}
        </main>
      </div>
    </>
  );
}
