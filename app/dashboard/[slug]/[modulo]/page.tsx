"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import supabase from "@/lib/supabaseClient";

// ─── FONTES ───────────────────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbx-VAR5oGvAaAeeNS2M3D6X5z88QMnJ-XQE3C-CjghVFRYa8ZJmhib9UNbRwmlPjt4I/exec";

// ─── LOGO DO CLIENTE ──────────────────────────────────────────────────────────
const LOGO_URL = "/logos/tech4con.png";
const LOGO_DM_URL = "/logo-dm.png";

// ─── PALETA TECH4CON ──────────────────────────────────────────────────────────
const C = {
  red:        "#C8102E",
  redDark:    "#9E0B22",
  redLight:   "#FDEAEA",
  redMid:     "#F5C6CB",
  black:      "#0F0F0F",
  dark:       "#1A1A1A",
  gray900:    "#222222",
  gray700:    "#444444",
  gray500:    "#777777",
  gray300:    "#BBBBBB",
  gray100:    "#F0F0F0",
  gray50:     "#F8F8F8",
  white:      "#FFFFFF",
  blue:       "#1B4F8A",
  blueDark:   "#1A3D6F",
  blueLight:  "#EAF0F8",
  green:      "#1A6B3C",
  greenLight: "#E6F4EC",
  gold:       "#8B5E0A",
  goldLight:  "#FDF3E3",
  orange:     "#C4622D",
  orangeLight:"#F7E5DD",
  border:     "#E2E2E2",
  borderDark: "#CCCCCC",
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

// ─── ESTRUTURA DRE ────────────────────────────────────────────────────────────
const DRE_ROWS = [
  { key: "Receita de Vendas", nivel: 0, tipo: "total" },
  { key: "Receita Outros", nivel: 1 },
  { key: "Receita Serviço", nivel: 1 },
  { key: "Receita Venda/Revenda", nivel: 1 },
  { key: "Loja Virtual", nivel: 1 },
  { key: "Deduções de Vendas", nivel: 0, tipo: "subtotal" },
  { key: "Devolução ou Cancelamento NF", nivel: 1 },
  { key: "Impostos (Federais, Estaduais, Municipais)", nivel: 1 },
  { key: "Receita líquida", nivel: 0, tipo: "resultado" },
  { key: "Custo dos Produtos Vendidos", nivel: 0, tipo: "subtotal" },
  { key: "CMV/CPV - Custo Mercadoria Vendida", nivel: 1 },
  { key: "Custos Variáveis de Operação", nivel: 1 },
  { key: "Devolução de Matéria Prima e Insumo", nivel: 1 },
  { key: "Mão de obra terceirizada", nivel: 1 },
  { key: "Margem bruta", nivel: 0, tipo: "resultado" },
  { key: "Despesas Variáveis", nivel: 0, tipo: "subtotal" },
  { key: "Comissões de vendas", nivel: 1 },
  { key: "Fretes e Combustíveis (venda)", nivel: 1 },
  { key: "Gastos com Veículos", nivel: 1 },
  { key: "Manutenção de Equipamentos", nivel: 1 },
  { key: "Outros", nivel: 1 },
  { key: "Taxa de Boletos | Cartão", nivel: 1 },
  { key: "Margem líquida (margem de contribuição)", nivel: 0, tipo: "resultado" },
  { key: "Gastos fixos (custos fixos + despesas fixas)", nivel: 0, tipo: "subtotal" },
  { key: "Gasto com Pessoal - Adm", nivel: 1 },
  { key: "Gasto com pessoal - Prod/Oper", nivel: 1 },
  { key: "Despesas Operacionais", nivel: 1 },
  { key: "Uso e Consumo", nivel: 1 },
  { key: "Viagens e Hospedagens", nivel: 1 },
  { key: "Ebitda", nivel: 0, tipo: "destaque" },
  { key: "Receitas Financeiras", nivel: 0, tipo: "subtotal" },
  { key: "Depósitos Judiciais", nivel: 1 },
  { key: "Outras receitas financeiras", nivel: 1 },
  { key: "Despesas Financeiras", nivel: 0, tipo: "subtotal" },
  { key: "Depreciação", nivel: 1 },
  { key: "Despesas bancárias", nivel: 1 },
  { key: "Juros e multas", nivel: 1 },
  { key: "Outras despesas financeiras", nivel: 1 },
  { key: "Resultado operacional bruto", nivel: 0, tipo: "resultado" },
  { key: "Impostos Sob Lucro", nivel: 0, tipo: "subtotal" },
  { key: "CSLL", nivel: 1 },
  { key: "IRPJ", nivel: 1 },
  { key: "Resultado operacional líquido", nivel: 0, tipo: "resultado" },
  { key: "Distribuição de Lucro", nivel: 0, tipo: "subtotal" },
  { key: "Resultado pós distribuição de lucros", nivel: 0, tipo: "destaque" },
];

// ─── ESTRUTURA DFC ────────────────────────────────────────────────────────────
const DFC_ROWS = [
  { key: "Saldo Inicial", nivel: 0, tipo: "destaque" },
  { key: "Receita de Vendas", nivel: 0, tipo: "total" },
  { key: "Receita Outros", nivel: 1 },
  { key: "Receita Serviço", nivel: 1 },
  { key: "Receita Venda/Revenda", nivel: 1 },
  { key: "Loja Virtual", nivel: 1 },
  { key: "Deduções de Vendas", nivel: 0, tipo: "subtotal" },
  { key: "Comissões de vendas", nivel: 1 },
  { key: "Devolução ou Cancelamento NF", nivel: 1 },
  { key: "Impostos (Federais, Estaduais, Municipais)", nivel: 1 },
  { key: "Receita líquida", nivel: 0, tipo: "resultado" },
  { key: "Custo dos Produtos Vendidos", nivel: 0, tipo: "subtotal" },
  { key: "Compra de Matéria-Prima", nivel: 1 },
  { key: "Custos Variáveis de Operação", nivel: 1 },
  { key: "Devolução de Matéria Prima e Insumo", nivel: 1 },
  { key: "Mão de obra terceirizada", nivel: 1 },
  { key: "Margem bruta", nivel: 0, tipo: "resultado" },
  { key: "Despesas Variáveis", nivel: 0, tipo: "subtotal" },
  { key: "Fretes e Combustíveis (venda)", nivel: 1 },
  { key: "Gastos com Veículos", nivel: 1 },
  { key: "Manutenção de Equipamentos", nivel: 1 },
  { key: "Outros", nivel: 1 },
  { key: "Taxa de Boletos | Cartão", nivel: 1 },
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

// ─── CATEGORIAS PARA OVERVIEW ────────────────────────────────────────────────
const DESPESAS_KEYS = [
  "Comissões de vendas", "CMV/CPV - Custo Mercadoria Vendida", 
  "Custos Variáveis de Operação", "Mão de obra terceirizada",
  "Fretes e Combustíveis (venda)", "Gastos com Veículos",
  "Manutenção de Equipamentos", "Taxa de Boletos | Cartão",
  "Gasto com Pessoal - Adm", "Gasto com pessoal - Prod/Oper",
  "Despesas Operacionais"
];

const RECEITAS_KEYS = [
  "Receita Outros", "Receita Serviço", "Receita Venda/Revenda", 
  "Loja Virtual", "Receitas Financeiras"
];

// ─── COMPONENTES AUXILIARES ──────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.gray100}`, borderTopColor: C.red, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ background: C.redLight, border: `1px solid ${C.red}`, borderRadius: 8, padding: 16, color: C.red, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div><strong>Erro:</strong> {message}</div>
      {onRetry && <button onClick={onRetry} style={{ padding: "4px 12px", background: C.red, color: C.white, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Tentar novamente</button>}
    </div>
  );
}

// ─── KPI CARD ────────────────────────────────────────────────────────────────
function KPICard({ label, valor, percentual, cor, small = false, showDiff = false, subLabel }: { 
  label: string; valor: number; percentual?: number; cor?: string; small?: boolean; showDiff?: boolean; subLabel?: string;
}) {
  return (
    <div style={{ background: cor ? `${cor}11` : C.white, border: `1px solid ${cor || C.border}`, borderRadius: 8, padding: small ? "12px 16px" : "16px 20px", minWidth: small ? 140 : 160, flex: 1 }}>
      <div style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: 0.5, color: cor || C.gray500, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 700, fontSize: small ? 18 : 22, color: C.dark }}>{fmtBRL(valor)}</div>
      {percentual !== undefined && (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: showDiff ? (percentual >= 0 ? C.green : C.red) : C.gray500, marginTop: 4 }}>
          {showDiff && percentual > 0 ? "+" : ""}{percentual.toFixed(2).replace(".",",")}%
        </div>
      )}
      {subLabel && <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 10, color: C.gray500, marginTop: 4 }}>{subLabel}</div>}
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
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: C.dark, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, width: "100%", letterSpacing: 0.5 }}>
        <span style={{ width: 3, height: 14, background: C.red, borderRadius: 2 }}></span>
        {label}
      </div>
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={C.gray100} strokeWidth="16" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 68 28" fill="none" stroke={C.red} strokeWidth="16" opacity="0.3" />
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
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, flex: 1 }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: C.dark, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, letterSpacing: 0.5 }}>
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
  const receitaBrutaPeriodo = getValorPeriodo("Receita de Vendas") || getValorPeriodo("Receitas");
  const receitaLiquidaPeriodo = getValorPeriodo("Receita líquida");
  const getPctPeriodo = (key: string, valor: number): number => {
    if (key === "Ebitda") return receitaLiquidaPeriodo ? (valor / receitaLiquidaPeriodo) * 100 : 0;
    return receitaBrutaPeriodo ? (valor / receitaBrutaPeriodo) * 100 : 0;
  };
  const rowsExistentes = rows.filter(row => dados.contas[row.key] || ["Receita de Vendas","Receita líquida","Margem bruta","Ebitda","Saldo Inicial","Saldo"].includes(row.key));

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Barlow',sans-serif" }}>
        <thead>
          <tr style={{ background: C.dark }}>
            <th style={{ padding: "10px 12px", textAlign: "left", color: C.white, fontWeight: 600, fontSize: 12 }}>{titulo}</th>
            {mostrarAno ? (
              <>
                {MESES_CURTO.map((m, i) => <th key={m} style={{ padding: "10px 8px", textAlign: "right", color: C.white, fontWeight: 500, fontSize: 11, background: (i >= mesInicial && i <= mesFinal) ? C.redDark : C.dark }}>{m}</th>)}
                <th style={{ padding: "10px 8px", textAlign: "right", color: C.red, fontWeight: 700, fontSize: 11 }}>TOTAL</th>
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
            if (isDestaque) bg = C.redLight;
            else if (isResultado) bg = C.blueLight;
            else if (isTotal) bg = C.greenLight;
            const fontWeight = (isDestaque || isResultado || row.tipo === "subtotal" || isTotal) ? 600 : 400;
            const paddingLeft = 12 + (row.nivel || 0) * 16;
            return (
              <tr key={row.key} style={{ background: bg }}>
                <td style={{ padding: `8px 12px 8px ${paddingLeft}px`, fontWeight, color: isDestaque ? C.redDark : C.dark, borderBottom: `1px solid ${C.gray100}` }}>{row.key}</td>
                {mostrarAno ? (
                  <>
                    {MESES_CURTO.map((_, i) => {
                      const val = getValor(row.key, i);
                      return <td key={i} style={{ padding: "8px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: val < 0 ? C.red : C.dark, borderBottom: `1px solid ${C.gray100}`, background: (i >= mesInicial && i <= mesFinal) ? `${C.red}08` : "transparent" }}>{fmtK(val)}</td>;
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

  const receitaBrutaPeriodo = getValorPeriodoDRE("Receita de Vendas");
  const receitaLiquidaPeriodo = getValorPeriodoDRE("Receita líquida");
  const margemBrutaPeriodo = getValorPeriodoDRE("Margem bruta");
  const margemContribPeriodo = getValorPeriodoDRE("Margem líquida (margem de contribuição)");
  const ebitdaPeriodo = getValorPeriodoDRE("Ebitda");
  const gastosFixosPeriodo = getValorPeriodoDRE("Gastos fixos (custos fixos + despesas fixas)");
  const despesasFinanceirasPeriodo = getValorPeriodoDRE("Despesas Financeiras");
  const impostosLucroPeriodo = getValorPeriodoDRE("Impostos Sob Lucro");
  const distribuicaoLucroPeriodo = getValorPeriodoDRE("Distribuição de Lucro");
  const investimentosPeriodo = getValorPeriodoDRE("Investimentos e Financiamentos");
  const lucroLiqPeriodo = getValorPeriodoDRE("Resultado pós distribuição de lucros");

  const pctMargemBruta = receitaBrutaPeriodo ? (margemBrutaPeriodo / receitaBrutaPeriodo) * 100 : 0;
  const pctMargemContrib = receitaBrutaPeriodo ? (margemContribPeriodo / receitaBrutaPeriodo) * 100 : 0;
  const pctEbitda = receitaLiquidaPeriodo ? (ebitdaPeriodo / receitaLiquidaPeriodo) * 100 : 0;
  const pctLucro = receitaBrutaPeriodo ? (lucroLiqPeriodo / receitaBrutaPeriodo) * 100 : 0;

  const margemContribUnitaria = receitaBrutaPeriodo > 0 ? (margemContribPeriodo / receitaBrutaPeriodo) : 0;
  const custosTotaisAlem = Math.abs(gastosFixosPeriodo) + Math.abs(despesasFinanceirasPeriodo) + Math.abs(impostosLucroPeriodo) + Math.abs(distribuicaoLucroPeriodo) + Math.abs(investimentosPeriodo);
  const pontoEquilibrio = margemContribUnitaria > 0 ? (custosTotaisAlem / margemContribUnitaria) : 0;
  const pctPontoEquilibrio = pontoEquilibrio > 0 ? ((receitaBrutaPeriodo - pontoEquilibrio) / pontoEquilibrio) * 100 : 0;

  const mesAtual = mesFinal;
  const mesAnterior = mesAtual > 0 ? mesAtual - 1 : 0;
  const receitaMesAtual = getValor("Receita de Vendas", mesAtual);
  const receitaMesAnterior = getValor("Receita de Vendas", mesAnterior);
  const variacaoMoM = receitaMesAnterior > 0 ? ((receitaMesAtual - receitaMesAnterior) / receitaMesAnterior) * 100 : 0;

  const saldoInicial = dados.dfc?.contas?.["Saldo Inicial"]?.valores?.[mesInicial] || 0;
  const liquidezPeriodo = getValorPeriodoDFC("Liquidez") || 0;
  const saldoFinal = saldoInicial + liquidezPeriodo;

  const top5Despesas = DESPESAS_KEYS.map(key => ({ nome: key, valor: getValorPeriodoDRE(key) })).filter(d => d.valor !== 0).sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor)).slice(0, 5);
  const top5Receitas = RECEITAS_KEYS.map(key => ({ nome: key, valor: getValorPeriodoDRE(key) })).filter(d => d.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 5);

  const chartData = MESES_CURTO.map((m, i) => ({ mes: m, Receita: getValor("Receita de Vendas", i), EBITDA: getValor("Ebitda", i), inRange: i >= mesInicial && i <= mesFinal }));
  const pieData = [
    { name: "Custo Produtos", value: Math.abs(getValorPeriodoDRE("Custo dos Produtos Vendidos")) },
    { name: "Desp. Variáveis", value: Math.abs(getValorPeriodoDRE("Despesas Variáveis")) },
    { name: "Gastos Fixos", value: Math.abs(gastosFixosPeriodo) },
    { name: "Lucro", value: Math.max(0, lucroLiqPeriodo) },
  ].filter(d => d.value > 0);
  const PIE_COLORS = [C.red, C.orange, C.blue, C.green];
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>{payload.map((p: any, i: number) => <div key={i} style={{ color: p.color }}>{p.name}: {fmtBRL(p.value)}</div>)}</div>;
  };
  const periodoLabel = mesInicial === mesFinal ? MESES[mesInicial] : `${MESES_CURTO[mesInicial]} a ${MESES_CURTO[mesFinal]}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Faturamento" valor={receitaBrutaPeriodo} percentual={100} cor={C.red} />
        <KPICard label="Margem Bruta" valor={margemBrutaPeriodo} percentual={pctMargemBruta} cor={C.gold} />
        <KPICard label="Margem Contrib." valor={margemContribPeriodo} percentual={pctMargemContrib} cor={C.orange} />
        <KPICard label="EBITDA" valor={ebitdaPeriodo} percentual={pctEbitda} cor={C.blue} />
        <KPICard label="Lucro Líquido" valor={lucroLiqPeriodo} percentual={pctLucro} cor={C.green} />
        <KPICard label="Ponto Equilíbrio" valor={pontoEquilibrio} percentual={pctPontoEquilibrio} cor={C.gray700} showDiff={true} />
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Variação MoM" valor={receitaMesAtual} percentual={variacaoMoM} cor={variacaoMoM >= 0 ? C.green : C.red} showDiff={true} subLabel={`vs ${MESES_CURTO[mesAnterior]}: ${fmtBRL(receitaMesAnterior)}`} />
        <KPICard label="Saldo Inicial" valor={saldoInicial} cor={C.blue} subLabel={`Em ${MESES_CURTO[mesInicial]}`} />
        <KPICard label="Liquidez Período" valor={liquidezPeriodo} percentual={saldoInicial ? (liquidezPeriodo / saldoInicial) * 100 : 0} cor={liquidezPeriodo >= 0 ? C.green : C.red} showDiff={true} />
        <KPICard label="Saldo Final" valor={saldoFinal} cor={saldoFinal >= 0 ? C.blue : C.red} subLabel={`Projetado em ${MESES_CURTO[mesFinal]}`} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        <GaugeChart value={receitaBrutaPeriodo} max={pontoEquilibrio} label="Faturamento vs Ponto de Equilíbrio" />
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: C.dark, textTransform: "uppercase", marginBottom: 16, letterSpacing: 0.5 }}>Composição — {periodoLabel}</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35} paddingAngle={2}>{pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(v: any) => fmtBRL(v)} /><Legend wrapperStyle={{ fontSize: 10 }} /></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: C.dark, textTransform: "uppercase", marginBottom: 16, letterSpacing: 0.5 }}>Faturamento Mensal</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}><defs><linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.red} stopOpacity={0.3}/><stop offset="95%" stopColor={C.red} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.gray100} /><XAxis dataKey="mes" tick={{ fill: C.gray500, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} tick={{ fill: C.gray500, fontSize: 10 }} axisLine={false} tickLine={false} width={40} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="Receita" stroke={C.red} strokeWidth={2} fill="url(#colorReceita)" /></AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        <Top5List title="Top 5 Despesas" items={top5Despesas} cor={C.red} tipo="despesa" />
        <Top5List title="Top 5 Receitas" items={top5Receitas} cor={C.green} tipo="receita" />
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: C.dark, textTransform: "uppercase", marginBottom: 16, letterSpacing: 0.5 }}>EBITDA Mensal</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke={C.gray100} /><XAxis dataKey="mes" tick={{ fill: C.gray500, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} tick={{ fill: C.gray500, fontSize: 10 }} axisLine={false} tickLine={false} width={40} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="EBITDA" radius={[4, 4, 0, 0]}>{chartData.map((d, i) => <Cell key={i} fill={d.EBITDA < 0 ? C.red : (d.inRange ? C.red : C.gray300)} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── DESPESAS VIEW (CONTAS A PAGAR) ────────────────────────────────────────────
function DespesasView({ ano, apiUrl }: { ano: number; apiUrl: string }) {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "Pendente" | "Liquidado">("todos");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}?tipo=contas_pagar&ano=${ano}`);
        const json = await res.json();
        if (json.success) setLancamentos(json.lancamentos || []);
        else throw new Error(json.error || "Erro ao carregar");
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [ano, apiUrl]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const filtrados = filtroStatus === "todos" ? lancamentos : lancamentos.filter(l => l.status_titulo === filtroStatus);
  const totalPendente = lancamentos.filter(l => l.status_titulo === "Pendente").reduce((acc, l) => acc + (l.valor_documento || 0), 0);
  const totalLiquidado = lancamentos.filter(l => l.status_titulo === "Liquidado").reduce((acc, l) => acc + (l.valor_documento || 0), 0);
  const qtdPendente = lancamentos.filter(l => l.status_titulo === "Pendente").length;
  const qtdLiquidado = lancamentos.filter(l => l.status_titulo === "Liquidado").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Pendente" valor={totalPendente} cor={C.red} subLabel={`${qtdPendente} lançamentos`} />
        <KPICard label="Liquidado" valor={totalLiquidado} cor={C.green} subLabel={`${qtdLiquidado} lançamentos`} />
        <KPICard label="Total Geral" valor={totalPendente + totalLiquidado} cor={C.blue} subLabel={`${lancamentos.length} lançamentos`} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {(["todos", "Pendente", "Liquidado"] as const).map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)} style={{ padding: "6px 16px", borderRadius: 6, border: `1px solid ${filtroStatus === s ? C.red : C.border}`, background: filtroStatus === s ? C.red : C.white, color: filtroStatus === s ? C.white : C.dark, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {s === "todos" ? "Todos" : s}
          </button>
        ))}
      </div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'Barlow',sans-serif" }}>
          <thead>
            <tr style={{ background: C.dark }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: C.white, fontWeight: 600 }}>Categoria</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: C.white, fontWeight: 600 }}>Documento</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: C.white, fontWeight: 600 }}>Emissão</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: C.white, fontWeight: 600 }}>Pagamento</th>
              <th style={{ padding: "10px 12px", textAlign: "right", color: C.white, fontWeight: 600 }}>Valor</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: C.white, fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.slice(0, 50).map((l, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.gray50 }}>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}`, color: C.gray500 }}>{l.categoria_descrição}</td>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{l.numero_documento}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${C.gray100}`, fontSize: 11 }}>{l.data_emissao || "-"}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${C.gray100}`, fontSize: 11 }}>{l.data_pagamento || "-"}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", color: C.red, borderBottom: `1px solid ${C.gray100}`, fontWeight: 500 }}>{fmtBRL(l.valor_documento)}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${C.gray100}` }}>
                  <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: l.status_titulo === "Liquidado" ? C.greenLight : C.redLight, color: l.status_titulo === "Liquidado" ? C.green : C.red }}>{l.status_titulo}</span>
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

// ─── RECEITAS VIEW (CONTAS A RECEBER) ──────────────────────────────────────────
function ReceitasView({ ano, apiUrl }: { ano: number; apiUrl: string }) {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "Pendente" | "Liquidado">("todos");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}?tipo=contas_receber&ano=${ano}`);
        const json = await res.json();
        if (json.success) setLancamentos(json.lancamentos || []);
        else throw new Error(json.error || "Erro ao carregar");
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [ano, apiUrl]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const filtrados = filtroStatus === "todos" ? lancamentos : lancamentos.filter(l => l.status_titulo === filtroStatus);
  const totalPendente = lancamentos.filter(l => l.status_titulo === "Pendente").reduce((acc, l) => acc + (l.valor_documento || 0), 0);
  const totalLiquidado = lancamentos.filter(l => l.status_titulo === "Liquidado").reduce((acc, l) => acc + (l.valor_documento || 0), 0);
  const qtdPendente = lancamentos.filter(l => l.status_titulo === "Pendente").length;
  const qtdLiquidado = lancamentos.filter(l => l.status_titulo === "Liquidado").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Pendente" valor={totalPendente} cor={C.red} subLabel={`${qtdPendente} lançamentos`} />
        <KPICard label="Liquidado" valor={totalLiquidado} cor={C.green} subLabel={`${qtdLiquidado} lançamentos`} />
        <KPICard label="Total Geral" valor={totalPendente + totalLiquidado} cor={C.blue} subLabel={`${lancamentos.length} lançamentos`} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {(["todos", "Pendente", "Liquidado"] as const).map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)} style={{ padding: "6px 16px", borderRadius: 6, border: `1px solid ${filtroStatus === s ? C.green : C.border}`, background: filtroStatus === s ? C.green : C.white, color: filtroStatus === s ? C.white : C.dark, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {s === "todos" ? "Todos" : s}
          </button>
        ))}
      </div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'Barlow',sans-serif" }}>
          <thead>
            <tr style={{ background: C.dark }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: C.white, fontWeight: 600 }}>Categoria</th>
              <th style={{ padding: "10px 12px", textAlign: "left", color: C.white, fontWeight: 600 }}>Documento</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: C.white, fontWeight: 600 }}>Emissão</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: C.white, fontWeight: 600 }}>Recebimento</th>
              <th style={{ padding: "10px 12px", textAlign: "right", color: C.white, fontWeight: 600 }}>Valor</th>
              <th style={{ padding: "10px 12px", textAlign: "center", color: C.white, fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.slice(0, 50).map((l, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.gray50 }}>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}`, color: C.gray500 }}>{l.categoria_descrição}</td>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{l.numero_documento}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${C.gray100}`, fontSize: 11 }}>{l.data_emissao || "-"}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${C.gray100}`, fontSize: 11 }}>{l.data_recebimento || "-"}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", color: C.green, borderBottom: `1px solid ${C.gray100}`, fontWeight: 500 }}>{fmtBRL(l.valor_documento)}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${C.gray100}` }}>
                  <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: l.status_titulo === "Liquidado" ? C.greenLight : C.redLight, color: l.status_titulo === "Liquidado" ? C.green : C.red }}>{l.status_titulo}</span>
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

// ─── MENU DROPDOWN ────────────────────────────────────────────────────────────
function MenuDropdown({ tab, loading }: any) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [usuarioModalAberto, setUsuarioModalAberto] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  const router = useRouter();

  const tabs = [
    { id: "overview", label: "Visão Geral" },
    { id: "dre", label: "DRE" },
    { id: "dfc", label: "DFC" },
    { id: "despesas", label: "Despesas" },
    { id: "receitas", label: "Receitas" },
  ];

  useEffect(() => {
    const carregarUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUsuario({ 
          email: user.email, 
          name: user.user_metadata?.name || "Usuário" 
        });
      }
    };
    carregarUsuario();
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
    setMenuAberto(false);
  };

  const handleGerarPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const elemento = document.querySelector('[style*="padding: 24px"]');
      
      if (!elemento) {
        alert('Erro: Conteúdo não encontrado na página');
        return;
      }

      const nomePagina = tabs.find(t => t.id === tab)?.label || 'Dashboard';
      const opcoes = {
        margin: 10,
        filename: `Tech4Con_${nomePagina}_${new Date().toLocaleDateString('pt-BR')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      };

      html2pdf().set(opcoes).from(elemento).save();
      setMenuAberto(false);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF');
    }
  };

  const handleSair = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleRedefinirSenha = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(usuario?.email);
      if (error) throw error;
      alert('Email de redefinição enviado com sucesso!');
      setUsuarioModalAberto(false);
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  return (
    <>
      <div style={{ position: "relative" }}>
        <button 
          onClick={() => setMenuAberto(!menuAberto)} 
          style={{ 
            background: C.white, 
            color: C.dark, 
            border: "none", 
            borderRadius: 4, 
            padding: "6px 12px", 
            cursor: "pointer", 
            fontFamily: "'Barlow',sans-serif", 
            fontWeight: 700, 
            fontSize: 16,
            transition: "all 0.15s"
          }}
        >
          ⋯
        </button>

        {menuAberto && (
          <div style={{ 
            position: "absolute", 
            top: 45, 
            right: 0, 
            background: C.white, 
            border: `1px solid ${C.border}`, 
            borderRadius: 8, 
            minWidth: 220, 
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", 
            zIndex: 1000 
          }}>
            <button 
              onClick={() => { router.push('/select-company'); setMenuAberto(false); }} 
              style={{ 
                width: "100%", 
                textAlign: "left", 
                padding: "12px 16px", 
                border: "none", 
                background: "none", 
                cursor: "pointer", 
                fontSize: 13, 
                color: C.dark, 
                borderBottom: `1px solid ${C.gray100}`,
                fontFamily: "'Barlow',sans-serif",
                transition: "background 0.15s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = C.gray50)}
              onMouseOut={(e) => (e.currentTarget.style.background = "none")}
            >
              🏢 Selecionar Empresa
            </button>

            <button 
              onClick={() => { window.history.back(); setMenuAberto(false); }} 
              style={{ 
                width: "100%", 
                textAlign: "left", 
                padding: "12px 16px", 
                border: "none", 
                background: "none", 
                cursor: "pointer", 
                fontSize: 13, 
                color: C.dark, 
                borderBottom: `1px solid ${C.gray100}`,
                fontFamily: "'Barlow',sans-serif",
                transition: "background 0.15s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = C.gray50)}
              onMouseOut={(e) => (e.currentTarget.style.background = "none")}
            >
              📊 Selecionar Módulo
            </button>

            <button 
              onClick={() => setUsuarioModalAberto(true)} 
              style={{ 
                width: "100%", 
                textAlign: "left", 
                padding: "12px 16px", 
                border: "none", 
                background: "none", 
                cursor: "pointer", 
                fontSize: 13, 
                color: C.dark, 
                borderBottom: `1px solid ${C.gray100}`,
                fontFamily: "'Barlow',sans-serif",
                transition: "background 0.15s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = C.gray50)}
              onMouseOut={(e) => (e.currentTarget.style.background = "none")}
            >
              👤 Meu Usuário
            </button>

            <button 
              onClick={handleFullscreen} 
              style={{ 
                width: "100%", 
                textAlign: "left", 
                padding: "12px 16px", 
                border: "none", 
                background: "none", 
                cursor: "pointer", 
                fontSize: 13, 
                color: C.dark, 
                borderBottom: `1px solid ${C.gray100}`,
                fontFamily: "'Barlow',sans-serif",
                transition: "background 0.15s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = C.gray50)}
              onMouseOut={(e) => (e.currentTarget.style.background = "none")}
            >
              🖥️ Tela Cheia
            </button>

            <button 
              onClick={handleGerarPDF} 
              disabled={loading} 
              style={{ 
                width: "100%", 
                textAlign: "left", 
                padding: "12px 16px", 
                border: "none", 
                background: "none", 
                cursor: loading ? "default" : "pointer", 
                fontSize: 13, 
                color: loading ? C.gray300 : C.dark, 
                borderBottom: `1px solid ${C.gray100}`,
                opacity: loading ? 0.5 : 1,
                fontFamily: "'Barlow',sans-serif",
                transition: "background 0.15s"
              }}
              onMouseOver={(e) => { if (!loading) (e.currentTarget.style.background = C.gray50); }}
              onMouseOut={(e) => (e.currentTarget.style.background = "none")}
            >
              🖨️ Gerar PDF
            </button>

            <button 
              onClick={handleSair} 
              style={{ 
                width: "100%", 
                textAlign: "left", 
                padding: "12px 16px", 
                border: "none", 
                background: "none", 
                cursor: "pointer", 
                fontSize: 13, 
                color: C.red,
                fontFamily: "'Barlow',sans-serif",
                transition: "background 0.15s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = C.redLight)}
              onMouseOut={(e) => (e.currentTarget.style.background = "none")}
            >
              🚪 Sair
            </button>
          </div>
        )}
      </div>

      {usuarioModalAberto && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 2000 
        }}>
          <div style={{ 
            background: C.white, 
            borderRadius: 12, 
            padding: 32, 
            maxWidth: 400, 
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)" 
          }}>
            <h2 style={{ fontFamily: "'Barlow',sans-serif", marginTop: 0 }}>Meu Usuário</h2>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: C.gray500, fontWeight: 600, textTransform: "uppercase" }}>Nome</label>
              <p style={{ margin: "8px 0 0 0", fontSize: 14, color: C.dark }}>{usuario?.name}</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: C.gray500, fontWeight: 600, textTransform: "uppercase" }}>Email</label>
              <p style={{ margin: "8px 0 0 0", fontSize: 14, color: C.dark }}>{usuario?.email}</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: C.gray500, fontWeight: 600, textTransform: "uppercase" }}>Módulos Disponíveis</label>
              <p style={{ margin: "8px 0 0 0", fontSize: 13, color: C.dark }}>Financeiro, Comercial, Operações</p>
            </div>

            <button 
              onClick={handleRedefinirSenha} 
              style={{ 
                width: "100%", 
                padding: "10px 16px", 
                background: C.red, 
                color: C.white, 
                border: "none", 
                borderRadius: 6, 
                cursor: "pointer", 
                fontWeight: 600, 
                marginBottom: 12,
                fontFamily: "'Barlow',sans-serif",
                transition: "opacity 0.15s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Redefinir Senha
            </button>

            <button 
              onClick={() => setUsuarioModalAberto(false)} 
              style={{ 
                width: "100%", 
                padding: "10px 16px", 
                background: C.gray100, 
                color: C.dark, 
                border: "none", 
                borderRadius: 6, 
                cursor: "pointer", 
                fontWeight: 600,
                fontFamily: "'Barlow',sans-serif",
                transition: "background 0.15s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = C.gray300)}
              onMouseOut={(e) => (e.currentTarget.style.background = C.gray100)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function Tech4ConDashboard() {
  const [ano, setAno] = useState(2026);
  const [filial, setFilial] = useState("Consolidado");
  const [mesInicial, setMesInicial] = useState(0);
  const [mesFinal, setMesFinal] = useState(0);
  const [modoAnual, setModoAnual] = useState(false);
  const [tab, setTab] = useState<"overview" | "dre" | "dfc" | "despesas" | "receitas">("overview");
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<Array<{ idx: number; label: string }>>([]);

  const fetchDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}?ano=${ano}&filial=${filial}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erro desconhecido");
      setDados(json);
      setUltimaAtualizacao(new Date());
      
      if (json.dre?.contas?.["Receita de Vendas"]?.valores) {
        const meses = json.dre.contas["Receita de Vendas"].valores
          .map((v: number, i: number) => v !== 0 ? { idx: i, label: MESES[i] } : null)
          .filter((m: any) => m !== null);
        setMesesDisponiveis(meses);
        if ((mesInicial === 0 && mesFinal === 0) && meses.length > 0) {
          setMesInicial(meses[0].idx);
          setMesFinal(meses[meses.length - 1].idx);
        }
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [ano, filial, mesInicial, mesFinal]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  const periodoLabel = mesInicial === mesFinal ? MESES[mesInicial] : `${MESES_CURTO[mesInicial]} a ${MESES_CURTO[mesFinal]}`;
  const tabs = [
    { id: "overview", label: "Visão Geral" },
    { id: "dre", label: "DRE" },
    { id: "dfc", label: "DFC" },
    { id: "despesas", label: "Despesas" },
    { id: "receitas", label: "Receitas" },
  ];

  return (
    <>
      <link href={FONT_URL} rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: C.gray50, fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {/* ─── HEADER PRINCIPAL ─── */}
        <div style={{ background: C.red, padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          {/* Logos */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={LOGO_DM_URL} alt="D&M Consultoria" style={{ height: 40 }} />
            <div style={{ width: 1, height: 40, background: C.white, opacity: 0.3 }}></div>
            <img src={LOGO_URL} alt="Tech4Con" style={{ height: 36 }} />
          </div>
          
          {/* Abas */}
          <div style={{ display: "flex", gap: 2, flex: 1 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)} style={{ background: tab === t.id ? C.white : "transparent", color: tab === t.id ? C.red : C.white, border: "none", borderRadius: 4, padding: "8px 16px", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", transition: "all 0.15s" }}>{t.label}</button>
            ))}
          </div>

          {/* Menu Dropdown */}
          <MenuDropdown tab={tab} loading={loading} />
        </div>

        {/* ─── BARRA DE CONTEXTO ─── */}
        <div style={{ background: C.redLight, padding: "8px 28px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.border}` }}>
          <span style={{ color: C.red, fontSize: 11, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 0.5, fontWeight: 700 }}>CONTEXTO:</span>
          <span style={{ color: C.dark, fontSize: 11, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600 }}>Ano {ano}</span>
          <span style={{ color: C.gray300, fontSize: 11 }}>•</span>
          <span style={{ color: C.dark, fontSize: 11, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600 }}>{filial}</span>
          <span style={{ color: C.gray300, fontSize: 11 }}>•</span>
          <span style={{ color: C.red, fontSize: 11, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>{periodoLabel}</span>
          <span style={{ marginLeft: "auto", color: C.gray500, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
            {loading ? "Carregando..." : (ultimaAtualizacao ? `Atualizado: ${ultimaAtualizacao.toLocaleTimeString("pt-BR")}` : "")}
          </span>
        </div>

        {/* ─── BARRA DE CONTROLES ─── */}
        <div style={{ background: C.white, padding: "12px 28px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: `1px solid ${C.border}` }}>
          {/* Ano */}
          <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{ border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 12px", fontFamily: "'Barlow',sans-serif", fontSize: 13, color: C.dark, background: C.white, cursor: "pointer", fontWeight: 600, transition: "all 0.15s" }} onMouseOver={(e) => (e.currentTarget.style.borderColor = C.red)} onMouseOut={(e) => (e.currentTarget.style.borderColor = C.border)}>
            {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          
          {/* Filial */}
          <select value={filial} onChange={e => setFilial(e.target.value)} style={{ border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 12px", fontFamily: "'Barlow',sans-serif", fontSize: 13, color: C.dark, background: C.white, cursor: "pointer", fontWeight: 600, transition: "all 0.15s" }} onMouseOver={(e) => (e.currentTarget.style.borderColor = C.red)} onMouseOut={(e) => (e.currentTarget.style.borderColor = C.border)}>
            {["Consolidado", "Fibra", "Químicos"].map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
            <span style={{ fontSize: 11, color: C.gray500, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, fontWeight: 600 }}>PERÍODO:</span>
            
            {/* Mês Inicial */}
            <select value={mesInicial} onChange={e => setMesInicial(Number(e.target.value))} disabled={mesesDisponiveis.length === 0} style={{ border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 10px", fontFamily: "'Barlow',sans-serif", fontSize: 13, color: C.dark, background: C.white, cursor: "pointer", opacity: mesesDisponiveis.length === 0 ? 0.5 : 1, fontWeight: 600, transition: "all 0.15s" }} onMouseOver={(e) => { if (!disabled) e.currentTarget.style.borderColor = C.red; }} onMouseOut={(e) => (e.currentTarget.style.borderColor = C.border)}>
              {mesesDisponiveis.length > 0 ? mesesDisponiveis.map(m => <option key={m.idx} value={m.idx}>{m.label}</option>) : <option>-</option>}
            </select>

            <span style={{ fontSize: 11, color: C.gray500, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600 }}>até</span>

            {/* Mês Final */}
            <select value={mesFinal} onChange={e => setMesFinal(Number(e.target.value))} disabled={mesesDisponiveis.length === 0} style={{ border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 10px", fontFamily: "'Barlow',sans-serif", fontSize: 13, color: C.dark, background: C.white, cursor: "pointer", opacity: mesesDisponiveis.length === 0 ? 0.5 : 1, fontWeight: 600, transition: "all 0.15s" }} onMouseOver={(e) => { if (!disabled) e.currentTarget.style.borderColor = C.red; }} onMouseOut={(e) => (e.currentTarget.style.borderColor = C.border)}>
              {mesesDisponiveis.length > 0 ? mesesDisponiveis.filter(m => m.idx >= mesInicial).map(m => <option key={m.idx} value={m.idx}>{m.label}</option>) : <option>-</option>}
            </select>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {(tab === "dre" || tab === "dfc") && (
              <button 
                onClick={() => setModoAnual(!modoAnual)} 
                style={{ 
                  background: modoAnual ? C.red : C.white, 
                  color: modoAnual ? C.white : C.dark, 
                  border: `1px solid ${modoAnual ? C.red : C.border}`, 
                  borderRadius: 4, 
                  padding: "8px 14px", 
                  cursor: "pointer", 
                  fontFamily: "'Barlow Condensed',sans-serif", 
                  fontWeight: 700, 
                  fontSize: 12, 
                  letterSpacing: 1,
                  transition: "all 0.15s"
                }}
                onMouseOver={(e) => { if (!modoAnual) { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.background = C.redLight; } }}
                onMouseOut={(e) => { if (!modoAnual) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.white; } }}
              >
                {modoAnual ? "ANUAL" : "MENSAL"}
              </button>
            )}
            
            <button 
              onClick={fetchDados} 
              disabled={loading} 
              style={{ 
                background: loading ? C.gray100 : C.white, 
                color: loading ? C.gray300 : C.red, 
                border: `1px solid ${loading ? C.gray100 : C.border}`, 
                borderRadius: 4, 
                padding: "8px 12px", 
                cursor: loading ? "default" : "pointer", 
                fontFamily: "'Barlow',sans-serif", 
                fontSize: 13, 
                fontWeight: 600,
                transition: "all 0.15s"
              }}
              onMouseOver={(e) => { if (!loading) { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.background = C.redLight; } }}
              onMouseOut={(e) => { if (!loading) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.white; } }}
            >
              {loading ? "..." : "↻ Atualizar"}
            </button>
          </div>
        </div>

        <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
          {error && tab !== "despesas" && tab !== "receitas" && <ErrorMessage message={error} onRetry={fetchDados} />}
          {loading && tab !== "despesas" && tab !== "receitas" && !dados && <LoadingSpinner />}
          {!loading && !error && !dados && tab !== "despesas" && tab !== "receitas" && <ErrorMessage message="Nenhum dado disponível" />}
          {!loading && !error && dados && tab === "overview" && <OverviewView dados={dados} mesInicial={mesInicial} mesFinal={mesFinal} />}
          {!loading && !error && dados && tab === "dre" && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}><TabelaFinanceira rows={DRE_ROWS} dados={dados?.dre} mesInicial={mesInicial} mesFinal={mesFinal} titulo={`DRE — 2026 — ${periodoLabel}`} mostrarAno={modoAnual} /></div>}
          {!loading && !error && dados && tab === "dfc" && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}><TabelaFinanceira rows={DFC_ROWS} dados={dados?.dfc} mesInicial={mesInicial} mesFinal={mesFinal} titulo={`DFC — 2026 — ${periodoLabel}`} mostrarAno={modoAnual} /></div>}
          {tab === "despesas" && <DespesasView ano={ano} apiUrl={API_URL} />}
          {tab === "receitas" && <ReceitasView ano={ano} apiUrl={API_URL} />}
        </div>
      </div>
      
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 28px", display: "flex", justifyContent: "space-between", background: C.white }}>
        <span style={{ fontSize: 11, color: C.gray500, fontFamily: "'Barlow',sans-serif" }}>Tech4Con Produtos para Construção Civil LTDA · CNPJ 33.577.286/0001-21</span>
        <span style={{ fontSize: 11, color: C.gray500, fontFamily: "'JetBrains Mono',monospace" }}>Fonte: Omie API via Google Sheets</span>
      </div>
    </>
  );
}
