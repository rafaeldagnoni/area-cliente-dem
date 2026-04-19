"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import supabase from "@/lib/supabaseClient";
import { resolveEmpresa, getApiUrlForEmpresa } from "@/lib/empresasConfig";

// ─── FONTES ───────────────────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap";

// ─── FORMATADORES ─────────────────────────────────────────────────────────────
const fmtBRL = (v: number | null | undefined): string => {
  if (v === 0 || v === null || v === undefined) return "R$ -";
  const abs = Math.abs(v);
  const s = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(abs);
  return v < 0 ? `-R$ ${s}` : `R$ ${s}`;
};

const fmtK = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
  return fmtBRL(v);
};

const fmtData = (d: string): string => {
  if (!d) return "-";
  try {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
};

// ─── MESES ────────────────────────────────────────────────────────────────────
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MESES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ─── HELPERS DE NORMALIZAÇÃO E RECÁLCULO ─────────────────────────────────────
type ContaValores = { valores: number[] };
type ContasMap = Record<string, ContaValores>;

const normalizeKey = (value: string = ""): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\|/g, " ")
    .replace(/[()]/g, " ")
    .replace(/\//g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const getArray12 = (arr?: number[]): number[] => {
  return Array.from({ length: 12 }, (_, i) => Number(arr?.[i] || 0));
};

const addArrays = (...arrays: number[][]): number[] => {
  const out = Array(12).fill(0);
  for (const arr of arrays) {
    const safe = getArray12(arr);
    for (let i = 0; i < 12; i++) {
      out[i] += Number(safe[i] || 0);
    }
  }
  return out;
};

const subtractArrays = (base: number[], ...arraysToSubtract: number[][]): number[] => {
  const out = getArray12(base);
  for (const arr of arraysToSubtract) {
    const safe = getArray12(arr);
    for (let i = 0; i < 12; i++) {
      out[i] -= Number(safe[i] || 0);
    }
  }
  return out;
};

const hasAnyNonZero = (arr?: number[]) => getArray12(arr).some(v => Number(v || 0) !== 0);

const preferOriginalOrCalculated = (original: number[], calculated: number[]) => {
  return hasAnyNonZero(original) ? getArray12(original) : getArray12(calculated);
};

const cloneContas = (contas?: ContasMap): ContasMap => {
  const out: ContasMap = {};
  Object.entries(contas || {}).forEach(([k, v]) => {
    out[k] = { valores: getArray12(v?.valores) };
  });
  return out;
};

const findContaKey = (contas: ContasMap, target: string, aliases: string[] = []): string | null => {
  const targets = [target, ...aliases].map(normalizeKey);
  const entries = Object.keys(contas || {});
  for (const key of entries) {
    const nk = normalizeKey(key);
    if (targets.includes(nk)) return key;
  }
  return null;
};

const getContaValores = (contas: ContasMap, target: string, aliases: string[] = []): number[] => {
  const found = findContaKey(contas, target, aliases);
  return found ? getArray12(contas[found]?.valores) : Array(12).fill(0);
};

const setConta = (contas: ContasMap, key: string, valores: number[]) => {
  contas[key] = { valores: getArray12(valores) };
};

// ─── NORMALIZAR DADOS DO CACHE (linhas -> contas) ────────────────────────────
// Transforma a estrutura de Espel (linhas) para a estrutura universal (contas)
// Detecta automaticamente e só transforma se necessário
// SEGURO para London, Mediarh, Tech4Con (eles já têm 'contas')
const normalizarDadosCache = (cacheData: any) => {
  // Se JÁ tem 'contas', retorna como está (London, Mediarh, Tech4Con)
  if (cacheData?.contas) {
    return cacheData;
  }

  // Se tem 'linhas', transforma em 'contas' (Espel)
  if (cacheData?.linhas) {
    const contas: ContasMap = {};
    const MESES_ORDEM = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];

    for (let i = 0; i < cacheData.linhas.length; i++) {
      const linha = cacheData.linhas[i];
      
      // Extrair chave: usar descricao (se for significativa) ou codigo
      let chave = (linha.descricao && linha.descricao.trim()) || (linha.codigo && linha.codigo.trim());
      
      // Se não temos chave boa, usar um índice
      if (!chave) {
        chave = `Linha ${i}`;
      }

      // Transformar valores de objeto { "JANEIRO": 123, "FEVEREIRO": 456 } em array [123, 456, ...]
      const valores = MESES_ORDEM.map(mes => {
        const valor = linha.valores?.[mes];
        return typeof valor === 'number' ? valor : (typeof valor === 'string' ? parseFloat(valor) || 0 : 0);
      });

      contas[chave] = { valores };
    }

    return { ...cacheData, contas };
  }

  // Se não temos nada, retorna vazio
  return { contas: {} };
};

const enrichDRE = (dre: any) => {
  const contas = cloneContas(dre?.contas);

  const receitaOutros = getContaValores(contas, "Receita Outros");
  const receitaServico = getContaValores(contas, "Receita Serviço");
  const receitaVendaRevenda = getContaValores(contas, "Receita Venda/Revenda", ["Receita Venda Revenda"]);
  const lojaVirtual = getContaValores(contas, "Loja Virtual");

  const devolucaoNF = getContaValores(contas, "Devolução ou Cancelamento NF", ["Devolucao ou Cancelamento NF"]);
  const impostosVendasDetalhe = getContaValores(contas, "Impostos (Federais, Estaduais, Municipais)", [
    "Impostos Federais Estaduais Municipais",
  ]);

  const cmv = getContaValores(contas, "CMV/CPV - Custo Mercadoria Vendida", [
    "CMV CPV Custo Mercadoria Vendida",
  ]);
  const custosVarOper = getContaValores(contas, "Custos Variáveis de Operação", [
    "Custos Variaveis de Operacao",
  ]);
  const devolucaoMP = getContaValores(contas, "Devolução de Matéria Prima e Insumo", [
    "Devolucao de Materia Prima e Insumo",
  ]);
  const maoObraTerceirizada = getContaValores(contas, "Mão de obra terceirizada", [
    "Mao de obra terceirizada",
  ]);

  const comissoes = getContaValores(contas, "Comissões de vendas", ["Comissoes de vendas"]);
  const fretes = getContaValores(contas, "Fretes e Combustíveis (venda)", [
    "Fretes e Combustiveis venda",
  ]);
  const gastosVeiculos = getContaValores(contas, "Gastos com Veículos", ["Gastos com Veiculos"]);
  const manutencaoEquip = getContaValores(contas, "Manutenção de Equipamentos", [
    "Manutencao de Equipamentos",
  ]);
  const outrosVar = getContaValores(contas, "Outros");
  const taxaBoletos = getContaValores(contas, "Taxa de Boletos | Cartão", [
    "Taxa de Boletos Cartao",
  ]);

  const gastoPessoalAdm = getContaValores(contas, "Gasto com Pessoal - Adm");
  const gastoPessoalProd = getContaValores(contas, "Gasto com pessoal - Prod/Oper", [
    "Gasto com pessoal Prod Oper",
  ]);
  const despesasOper = getContaValores(contas, "Despesas Operacionais");
  const usoConsumo = getContaValores(contas, "Uso e Consumo");
  const viagens = getContaValores(contas, "Viagens e Hospedagens");

  const outrasReceitasFinanceiras = getContaValores(contas, "Outras receitas financeiras");
  const despesasBancarias = getContaValores(contas, "Despesas bancárias", ["Despesas bancarias"]);
  const jurosMultas = getContaValores(contas, "Juros e multas");
  const outrasDespesasFinanceiras = getContaValores(contas, "Outras despesas financeiras");

  const csll = getContaValores(contas, "CSLL");
  const irpj = getContaValores(contas, "IRPJ");
  const distribuicaoLucroDetalhe = getContaValores(contas, "Distribuição de Lucro", ["Distribuicao de Lucro"]);

  const receitaVendasOriginal = getContaValores(contas, "Receita de Vendas");
  const deducoesOriginal = getContaValores(contas, "Deduções de Vendas");
  const cpvOriginal = getContaValores(contas, "Custo dos Produtos Vendidos");
  const despesasVariaveisOriginal = getContaValores(contas, "Despesas Variáveis");
  const gastosFixosOriginal = getContaValores(contas, "Gastos fixos (custos fixos + despesas fixas)");
  const receitasFinanceirasOriginal = getContaValores(contas, "Receitas Financeiras");
  const despesasFinanceirasOriginal = getContaValores(contas, "Despesas Financeiras");
  const impostosSobLucroOriginal = getContaValores(contas, "Impostos Sob Lucro");
  const distribuicaoLucroOriginal = getContaValores(contas, "Distribuição de Lucro");

  const receitaVendasCalculada = addArrays(receitaOutros, receitaServico, receitaVendaRevenda, lojaVirtual);
  const receitaVendas = preferOriginalOrCalculated(receitaVendasOriginal, receitaVendasCalculada);

  const deducoesCalculadas = addArrays(devolucaoNF, impostosVendasDetalhe);
  const deducoesVendas = preferOriginalOrCalculated(deducoesOriginal, deducoesCalculadas);

  const custoProdutosVendidosCalculado = addArrays(cmv, custosVarOper, devolucaoMP, maoObraTerceirizada);
  const custoProdutosVendidos = preferOriginalOrCalculated(cpvOriginal, custoProdutosVendidosCalculado);

  const despesasVariaveisCalculadas = addArrays(comissoes, fretes, gastosVeiculos, manutencaoEquip, outrosVar, taxaBoletos);
  const despesasVariaveis = preferOriginalOrCalculated(despesasVariaveisOriginal, despesasVariaveisCalculadas);

  const gastosFixosCalculados = addArrays(gastoPessoalAdm, gastoPessoalProd, despesasOper, usoConsumo, viagens);
  const gastosFixos = preferOriginalOrCalculated(gastosFixosOriginal, gastosFixosCalculados);

  const receitasFinanceirasCalculadas = addArrays(outrasReceitasFinanceiras);
  const receitasFinanceiras = preferOriginalOrCalculated(receitasFinanceirasOriginal, receitasFinanceirasCalculadas);

  const despesasFinanceirasCalculadas = addArrays(despesasBancarias, jurosMultas, outrasDespesasFinanceiras);
  const despesasFinanceiras = preferOriginalOrCalculated(despesasFinanceirasOriginal, despesasFinanceirasCalculadas);

  const impostosSobLucroCalculados = addArrays(csll, irpj);
  const impostosSobLucro = preferOriginalOrCalculated(impostosSobLucroOriginal, impostosSobLucroCalculados);

  const distribuicaoLucro = preferOriginalOrCalculated(distribuicaoLucroOriginal, distribuicaoLucroDetalhe);

  const receitaLiquida = subtractArrays(receitaVendas, deducoesVendas);
  const margemBruta = subtractArrays(receitaLiquida, custoProdutosVendidos);
  const margemContribuicao = subtractArrays(margemBruta, despesasVariaveis);
  const ebitda = subtractArrays(margemContribuicao, gastosFixos);
  const resultadoOperacionalBruto = subtractArrays(addArrays(ebitda, receitasFinanceiras), despesasFinanceiras);
  const resultadoOperacionalLiquido = subtractArrays(resultadoOperacionalBruto, impostosSobLucro);
  const resultadoPosDistribuicao = subtractArrays(resultadoOperacionalLiquido, distribuicaoLucro);

  setConta(contas, "Receita de Vendas", receitaVendas);
  setConta(contas, "Deduções de Vendas", deducoesVendas);
  setConta(contas, "Receita líquida", receitaLiquida);
  setConta(contas, "Custo dos Produtos Vendidos", custoProdutosVendidos);
  setConta(contas, "Margem bruta", margemBruta);
  setConta(contas, "Despesas Variáveis", despesasVariaveis);
  setConta(contas, "Margem líquida (margem de contribuição)", margemContribuicao);
  setConta(contas, "Gastos fixos (custos fixos + despesas fixas)", gastosFixos);
  setConta(contas, "Receitas Financeiras", receitasFinanceiras);
  setConta(contas, "Despesas Financeiras", despesasFinanceiras);
  setConta(contas, "Impostos Sob Lucro", impostosSobLucro);
  setConta(contas, "Distribuição de Lucro", distribuicaoLucro);
  setConta(contas, "Ebitda", ebitda);
  setConta(contas, "Resultado operacional bruto", resultadoOperacionalBruto);
  setConta(contas, "Resultado operacional líquido", resultadoOperacionalLiquido);
  setConta(contas, "Resultado pós distribuição de lucros", resultadoPosDistribuicao);

  return {
    ...dre,
    contas,
  };
};

const enrichDFC = (dfc: any) => {
  const contas = cloneContas(dfc?.contas);
  return {
    ...dfc,
    contas,
  };
};

const enrichFinancePayload = (payload: any) => {
  if (!payload) return payload;
  
  // Normalizar AMBOS os dados (detecta automaticamente se precisa transformar)
  const dre = normalizarDadosCache(payload.dre);
  const dfc = normalizarDadosCache(payload.dfc);

  return {
    ...payload,
    dre: dre ? enrichDRE(dre) : dre,
    dfc: dfc ? enrichDFC(dfc) : dfc,
  };
};

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
  { key: "Outras receitas financeiras", nivel: 1 },
  { key: "Despesas Financeiras", nivel: 0, tipo: "subtotal" },
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
  { key: "Custo dos Produtos Vendidos", nivel: 0, tipo: "subtotal" },
  { key: "Compra de Matéria-Prima", nivel: 1 },
  { key: "Custos Variáveis de Operação", nivel: 1 },
  { key: "Devolução de Matéria Prima e Insumo", nivel: 1 },
  { key: "Mão de obra terceirizada", nivel: 1 },
  { key: "Despesas Variáveis", nivel: 0, tipo: "subtotal" },
  { key: "Fretes e Combustíveis (venda)", nivel: 1 },
  { key: "Gastos com Veículos", nivel: 1 },
  { key: "Manutenção de Equipamentos", nivel: 1 },
  { key: "Outros", nivel: 1 },
  { key: "Taxa de Boletos | Cartão", nivel: 1 },
  { key: "Gastos fixos (custos fixos + despesas fixas)", nivel: 0, tipo: "subtotal" },
  { key: "Gasto com Pessoal - Adm", nivel: 1 },
  { key: "Gasto com pessoal - Prod/Oper", nivel: 1 },
  { key: "Despesas Operacionais", nivel: 1 },
  { key: "Receitas Financeiras", nivel: 0, tipo: "subtotal" },
  { key: "Despesas Financeiras", nivel: 0, tipo: "subtotal" },
  { key: "Impostos Sob Lucro", nivel: 0, tipo: "subtotal" },
  { key: "Distribuição de Lucro", nivel: 0, tipo: "subtotal" },
  { key: "Saldo Final", nivel: 0, tipo: "destaque" },
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
function LoadingSpinner({ C }: { C: any }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.gray100}`, borderTopColor: C.red, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorMessage({ message, onRetry, C }: { message: string; onRetry?: () => void; C: any }) {
  return (
    <div style={{ background: C.redLight, border: `1px solid ${C.red}`, borderRadius: 8, padding: 16, color: C.red, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div><strong>Erro:</strong> {message}</div>
      {onRetry && <button onClick={onRetry} style={{ padding: "4px 12px", background: C.red, color: C.white, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Tentar novamente</button>}
    </div>
  );
}

// ─── KPI CARD ────────────────────────────────────────────────────────────────
function KPICard({ label, valor, percentual, cor, small = false, showDiff = false, subLabel, C }: {
  label: string; valor: number; percentual?: number; cor?: string; small?: boolean; showDiff?: boolean; subLabel?: string; C: any;
}) {
  return (
    <div style={{ background: cor ? `${cor}11` : C.white, border: `1px solid ${cor || C.border}`, borderRadius: 8, padding: small ? "12px 16px" : "16px 20px", minWidth: small ? 140 : 160, flex: 1 }}>
      <div style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: 0.5, color: cor || C.gray500, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 700, fontSize: small ? 18 : 22, color: C.dark }}>{fmtBRL(valor)}</div>
      {percentual !== undefined && (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: showDiff ? (percentual >= 0 ? C.green : C.red) : C.gray500, marginTop: 4 }}>
          {showDiff && percentual > 0 ? "+" : ""}{percentual.toFixed(2).replace(".", ",")}%
        </div>
      )}
      {subLabel && <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 10, color: C.gray500, marginTop: 4 }}>{subLabel}</div>}
    </div>
  );
}

// ─── GAUGE CHART ─────────────────────────────────────────────────────────────
function GaugeChart({ value, max, label, C }: { value: number; max: number; label: string; C: any }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 150);
  const angle = (percentage / 150) * 180 - 90;
  const getColor = (pct: number) => pct < 80 ? C.red : pct < 100 ? C.gold : C.green;
  const currentColor = getColor(percentage);
  const displayPct = ((value / max) * 100);

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 340 }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: C.dark, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, width: "100%", letterSpacing: 0.5 }}>
        <span style={{ width: 3, height: 14, background: C.red, borderRadius: 2 }}></span>
        {label}
      </div>
      <svg width="260" height="160" viewBox="0 0 260 160" style={{ marginBottom: 8 }}>
        <path d="M 50 135 A 80 80 0 0 1 90 65" fill="none" stroke={C.red} strokeWidth="18" opacity="0.25" strokeLinecap="round" />
        <path d="M 90 65 A 80 80 0 0 1 170 65" fill="none" stroke={C.gold} strokeWidth="18" opacity="0.25" strokeLinecap="round" />
        <path d="M 170 65 A 80 80 0 0 1 210 135" fill="none" stroke={C.green} strokeWidth="18" opacity="0.25" strokeLinecap="round" />
        <g transform={`rotate(${angle}, 130, 140)`}>
          <line x1="130" y1="140" x2="130" y2="40" stroke={currentColor} strokeWidth="6" strokeLinecap="round" />
          <circle cx="130" cy="140" r="11" fill={currentColor} />
          <circle cx="130" cy="140" r="6" fill={C.white} />
        </g>
        <text x="50" y="158" fontSize="12" fontWeight="600" fill={C.gray500} textAnchor="middle">0%</text>
        <text x="130" y="12" fontSize="12" fontWeight="600" fill={C.gray500} textAnchor="middle">100%</text>
        <text x="210" y="158" fontSize="12" fontWeight="600" fill={C.gray500} textAnchor="middle">150%</text>
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 36, fontWeight: 900, color: currentColor, letterSpacing: -1 }}>{displayPct.toFixed(1).replace(".", ",")}<span style={{ fontSize: 24, opacity: 0.8 }}>%</span></div>
        <div style={{ fontSize: 12, color: C.gray700, marginTop: 6, fontWeight: 500 }}>{fmtK(value)} / {fmtK(max)}</div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 14, fontSize: 11, justifyContent: "center", flexWrap: "wrap", borderTop: `1px solid ${C.gray100}`, paddingTop: 12, width: "100%" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: C.red }}></span>Risco</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: C.gold }}></span>Atenção</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: C.green }}></span>Saudável</span>
      </div>
    </div>
  );
}

// ─── TOP 5 LIST ──────────────────────────────────────────────────────────────
function Top5List({ title, items, cor, tipo, C }: { title: string; items: Array<{ nome: string; valor: number }>; cor: string; tipo: "despesa" | "receita"; C: any }) {
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
function TabelaFinanceira({ rows, dados, mesInicial, mesFinal, titulo, mostrarAno, C }: {
  rows: Array<{ key: string; nivel: number; tipo?: string }>; dados: any; mesInicial: number; mesFinal: number; titulo: string; mostrarAno: boolean; C: any;
}) {
  if (!dados || !dados.contas) return <LoadingSpinner C={C} />;

  const getValor = (key: string, mesIdx: number): number => dados.contas[key]?.valores?.[mesIdx] || 0;
  const getValorPeriodo = (key: string): number => {
    // Saldo Inicial: sempre pega o primeiro mês do período
    if (key === "Saldo Inicial") {
      return dados.contas[key]?.valores?.[mesInicial] || 0;
    }
    // Saldo Final: sempre pega o último mês do período
    if (key === "Saldo Final") {
      return dados.contas[key]?.valores?.[mesFinal] || 0;
    }
    
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
    if (["Margem bruta", "Despesas Variáveis", "Margem líquida (margem de contribuição)", "Gastos fixos (custos fixos + despesas fixas)", "Ebitda", "Receitas Financeiras", "Despesas Financeiras", "Resultado operacional bruto", "Impostos Sob Lucro", "Resultado operacional líquido", "Distribuição de Lucro", "Resultado pós distribuição de lucros"].includes(key)) {
      return receitaLiquidaPeriodo ? (valor / receitaLiquidaPeriodo) * 100 : 0;
    }
    return receitaBrutaPeriodo ? (valor / receitaBrutaPeriodo) * 100 : 0;
  };
  const rowsExistentes = rows.filter(row => dados.contas[row.key] || ["Receita de Vendas", "Receita líquida", "Margem bruta", "Ebitda", "Saldo Inicial", "Saldo"].includes(row.key));

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
                    <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.gray500, borderBottom: `1px solid ${C.gray100}` }}>{pctPeriodo.toFixed(2).replace(".", ",")}%</td>
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
function OverviewView({ dados, mesInicial, mesFinal, C }: { dados: any; mesInicial: number; mesFinal: number; C: any }) {
  if (!dados || !dados.dre || !dados.dre.contas) return <LoadingSpinner C={C} />;

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
  const lucroLiqPeriodo = getValorPeriodoDRE("Resultado pós distribuição de lucros");

  const pctMargemBruta = receitaLiquidaPeriodo ? (margemBrutaPeriodo / receitaLiquidaPeriodo) * 100 : 0;
  const pctMargemContrib = receitaLiquidaPeriodo ? (margemContribPeriodo / receitaLiquidaPeriodo) * 100 : 0;
  const pctEbitda = receitaLiquidaPeriodo ? (ebitdaPeriodo / receitaLiquidaPeriodo) * 100 : 0;
  const pctLucro = receitaLiquidaPeriodo ? (lucroLiqPeriodo / receitaLiquidaPeriodo) * 100 : 0;

  const margemContribUnitaria = receitaBrutaPeriodo > 0 ? (margemContribPeriodo / receitaBrutaPeriodo) : 0;
  const custosTotaisAlem = Math.abs(gastosFixosPeriodo) + Math.abs(despesasFinanceirasPeriodo) + Math.abs(impostosLucroPeriodo) + Math.abs(distribuicaoLucroPeriodo);
  const pontoEquilibrio = margemContribUnitaria > 0 ? (custosTotaisAlem / margemContribUnitaria) : 0;
  const pctPontoEquilibrio = pontoEquilibrio > 0 ? ((receitaBrutaPeriodo - pontoEquilibrio) / pontoEquilibrio) * 100 : 0;

  const mesAtual = mesFinal;
  const mesAnterior = mesAtual > 0 ? mesAtual - 1 : 0;
  const receitaMesAtual = getValor("Receita de Vendas", mesAtual);
  const receitaMesAnterior = getValor("Receita de Vendas", mesAnterior);
  const variacaoMoM = receitaMesAnterior > 0 ? ((receitaMesAtual - receitaMesAnterior) / receitaMesAnterior) * 100 : 0;

  const saldoInicial = dados.dfc?.contas?.["Saldo Inicial"]?.valores?.[mesInicial] || 0;
  const saldoFinal = dados.dfc?.contas?.["Saldo Final"]?.valores?.[mesFinal] || 0;
  const liquidezPeriodo = saldoFinal - saldoInicial;

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
        <KPICard label="Faturamento" valor={receitaBrutaPeriodo} percentual={100} cor={C.red} C={C} />
        <KPICard label="Margem Bruta" valor={margemBrutaPeriodo} percentual={pctMargemBruta} cor={C.gold} C={C} />
        <KPICard label="Margem Contrib." valor={margemContribPeriodo} percentual={pctMargemContrib} cor={C.orange} C={C} />
        <KPICard label="EBITDA" valor={ebitdaPeriodo} percentual={pctEbitda} cor={C.blue} C={C} />
        <KPICard label="Lucro Líquido" valor={lucroLiqPeriodo} percentual={pctLucro} cor={C.green} C={C} />
        <KPICard label="Ponto Equilíbrio" valor={pontoEquilibrio} percentual={pctPontoEquilibrio} cor={C.gray700} showDiff={true} C={C} />
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Variação MoM" valor={receitaMesAtual} percentual={variacaoMoM} cor={variacaoMoM >= 0 ? C.green : C.red} showDiff={true} subLabel={`vs ${MESES_CURTO[mesAnterior]}: ${fmtBRL(receitaMesAnterior)}`} C={C} />
        <KPICard label="Saldo Inicial" valor={saldoInicial} cor={C.blue} subLabel={`Em ${MESES_CURTO[mesInicial]}`} C={C} />
        <KPICard label="Liquidez Período" valor={liquidezPeriodo} percentual={saldoInicial ? (liquidezPeriodo / saldoInicial) * 100 : 0} cor={liquidezPeriodo >= 0 ? C.green : C.red} showDiff={true} C={C} />
        <KPICard label="Saldo Final" valor={saldoFinal} cor={saldoFinal >= 0 ? C.blue : C.red} subLabel={`Projetado em ${MESES_CURTO[mesFinal]}`} C={C} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        <GaugeChart value={receitaBrutaPeriodo} max={pontoEquilibrio} label="Faturamento vs Ponto de Equilíbrio" C={C} />
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: C.dark, textTransform: "uppercase", marginBottom: 16, letterSpacing: 0.5 }}>Composição — {periodoLabel}</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={2}>{pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(v: any) => fmtBRL(v)} /><Legend wrapperStyle={{ fontSize: 10 }} /></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: C.dark, textTransform: "uppercase", marginBottom: 16, letterSpacing: 0.5 }}>Faturamento Mensal</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}><defs><linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.red} stopOpacity={0.3}/><stop offset="95%" stopColor={C.red} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.gray100} /><XAxis dataKey="mes" tick={{ fill: C.gray500, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} tick={{ fill: C.gray500, fontSize: 10 }} axisLine={false} tickLine={false} width={40} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="Receita" stroke={C.red} strokeWidth={2} fill="url(#colorReceita)" /></AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        <Top5List title="Top 5 Despesas" items={top5Despesas} cor={C.red} tipo="despesa" C={C} />
        <Top5List title="Top 5 Receitas" items={top5Receitas} cor={C.green} tipo="receita" C={C} />
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: C.dark, textTransform: "uppercase", marginBottom: 16, letterSpacing: 0.5 }}>EBITDA Mensal</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke={C.gray100} /><XAxis dataKey="mes" tick={{ fill: C.gray500, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} tick={{ fill: C.gray500, fontSize: 10 }} axisLine={false} tickLine={false} width={40} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="EBITDA" radius={[4, 4, 0, 0]}>{chartData.map((d, i) => <Cell key={i} fill={d.EBITDA < 0 ? C.red : (d.inRange ? C.red : C.gray300)} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── DEBUG FINANCEIRO ────────────────────────────────────────────────────────
function DebugFinanceiroView({ dados, mesInicial, mesFinal, C }: { dados: any; mesInicial: number; mesFinal: number; C: any }) {
  if (!dados?.dre?.contas) return null;

  const getValorPeriodo = (key: string): number => {
    const conta = dados.dre.contas[key];
    if (!conta?.valores) return 0;
    let soma = 0;
    for (let i = mesInicial; i <= mesFinal; i++) soma += Number(conta.valores[i] || 0);
    return soma;
  };

  const linhasPrincipais = [
    "Receita de Vendas",
    "Deduções de Vendas",
    "Receita líquida",
    "Custo dos Produtos Vendidos",
    "Margem bruta",
    "Despesas Variáveis",
    "Margem líquida (margem de contribuição)",
    "Gastos fixos (custos fixos + despesas fixas)",
    "Ebitda",
    "Receitas Financeiras",
    "Despesas Financeiras",
    "Resultado operacional bruto",
    "Impostos Sob Lucro",
    "Resultado operacional líquido",
    "Distribuição de Lucro",
    "Resultado pós distribuição de lucros",
  ];

  const blocosAnaliticos = [
    {
      titulo: "Componentes de Gastos Fixos",
      linhas: [
        "Gasto com Pessoal - Adm",
        "Gasto com pessoal - Prod/Oper",
        "Despesas Operacionais",
        "Uso e Consumo",
        "Viagens e Hospedagens",
      ],
      subtotal: "Gastos fixos (custos fixos + despesas fixas)",
    },
    {
      titulo: "Componentes de Despesas Variáveis",
      linhas: [
        "Comissões de vendas",
        "Fretes e Combustíveis (venda)",
        "Gastos com Veículos",
        "Manutenção de Equipamentos",
        "Outros",
        "Taxa de Boletos | Cartão",
      ],
      subtotal: "Despesas Variáveis",
    },
    {
      titulo: "Componentes de Despesas Financeiras",
      linhas: [
        "Despesas bancárias",
        "Juros e multas",
        "Outras despesas financeiras",
      ],
      subtotal: "Despesas Financeiras",
    },
    {
      titulo: "Componentes de Impostos Sobre Lucro",
      linhas: [
        "CSLL",
        "IRPJ",
      ],
      subtotal: "Impostos Sob Lucro",
    },
  ];

  const fmtLinha = (v: number) => {
    const abs = Math.abs(v);
    const s = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(abs);
    return v < 0 ? `-R$ ${s}` : `R$ ${s}`;
  };

  return (
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          background: C.blueLight,
          border: `1px solid ${C.blue}`,
          borderRadius: 8,
          padding: 16,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, color: C.blue, marginBottom: 6 }}>
          DEBUG FINANCEIRO — LONDON
        </div>
        <div style={{ fontSize: 12, color: C.dark }}>
          Este painel mostra os valores efetivamente usados no cálculo do dashboard para o período selecionado.
        </div>
      </div>

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.dark }}>
              <th style={{ padding: "10px 12px", textAlign: "left", color: C.white }}>Linha DRE</th>
              <th style={{ padding: "10px 12px", textAlign: "right", color: C.white }}>Valor no período</th>
            </tr>
          </thead>
          <tbody>
            {linhasPrincipais.map((linha, idx) => {
              const valor = getValorPeriodo(linha);
              return (
                <tr key={linha} style={{ background: idx % 2 === 0 ? C.white : C.gray50 }}>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}` }}>{linha}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: `1px solid ${C.gray100}`, fontFamily: "'JetBrains Mono',monospace", color: valor < 0 ? C.red : C.dark }}>
                    {fmtLinha(valor)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {blocosAnaliticos.map((bloco) => {
        const subtotal = getValorPeriodo(bloco.subtotal);
        const somaFilhos = bloco.linhas.reduce((acc, linha) => acc + getValorPeriodo(linha), 0);
        const diferenca = subtotal - somaFilhos;

        return (
          <div key={bloco.titulo} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", fontWeight: 700, fontSize: 12, borderBottom: `1px solid ${C.gray100}`, background: C.gray50 }}>
              {bloco.titulo}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.dark }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: C.white }}>Linha</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", color: C.white }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {bloco.linhas.map((linha, idx) => {
                  const valor = getValorPeriodo(linha);
                  return (
                    <tr key={linha} style={{ background: idx % 2 === 0 ? C.white : C.gray50 }}>
                      <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}` }}>{linha}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: `1px solid ${C.gray100}`, fontFamily: "'JetBrains Mono',monospace" }}>
                        {fmtLinha(valor)}
                      </td>
                    </tr>
                  );
                })}

                <tr style={{ background: C.blueLight }}>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}`, fontWeight: 700 }}>Soma dos filhos</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: `1px solid ${C.gray100}`, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                    {fmtLinha(somaFilhos)}
                  </td>
                </tr>

                <tr style={{ background: C.greenLight }}>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}`, fontWeight: 700 }}>Subtotal usado no dashboard</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: `1px solid ${C.gray100}`, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                    {fmtLinha(subtotal)}
                  </td>
                </tr>

                <tr style={{ background: Math.abs(diferenca) > 0.009 ? C.redLight : C.gray50 }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>Diferença subtotal - soma filhos</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: Math.abs(diferenca) > 0.009 ? C.red : C.dark }}>
                    {fmtLinha(diferenca)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ─── DESPESAS VIEW (CONTAS A PAGAR) ────────────────────────────────────────────
function DespesasView({ ano, apiUrl, empresaConfig, C }: { ano: number; apiUrl: string; empresaConfig: any; C: any }) {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "Pendente" | "Liquidado">("todos");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}?tipo=contas_pagar&ano=${ano}&empresa=${empresaConfig.apiIdentifier}`);
        const json = await res.json();
        if (json.success) setLancamentos(json.lancamentos || []);
        else throw new Error(json.error || "Erro ao carregar");
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [ano, apiUrl, empresaConfig.apiIdentifier]);

  if (loading) return <LoadingSpinner C={C} />;
  if (error) return <ErrorMessage message={error} C={C} />;

  const filtrados = filtroStatus === "todos" ? lancamentos : lancamentos.filter(l => l.status_titulo === filtroStatus);
  const totalPendente = lancamentos.filter(l => l.status_titulo === "Pendente").reduce((acc, l) => acc + (l.valor_documento || 0), 0);
  const totalLiquidado = lancamentos.filter(l => l.status_titulo === "Liquidado").reduce((acc, l) => acc + (l.valor_documento || 0), 0);
  const qtdPendente = lancamentos.filter(l => l.status_titulo === "Pendente").length;
  const qtdLiquidado = lancamentos.filter(l => l.status_titulo === "Liquidado").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Pendente" valor={totalPendente} cor={C.red} subLabel={`${qtdPendente} lançamentos`} C={C} />
        <KPICard label="Liquidado" valor={totalLiquidado} cor={C.green} subLabel={`${qtdLiquidado} lançamentos`} C={C} />
        <KPICard label="Total Geral" valor={totalPendente + totalLiquidado} cor={C.blue} subLabel={`${lancamentos.length} lançamentos`} C={C} />
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
function ReceitasView({ ano, apiUrl, empresaConfig, C }: { ano: number; apiUrl: string; empresaConfig: any; C: any }) {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "Pendente" | "Liquidado">("todos");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}?tipo=contas_receber&ano=${ano}&empresa=${empresaConfig.apiIdentifier}`);
        const json = await res.json();
        if (json.success) setLancamentos(json.lancamentos || []);
        else throw new Error(json.error || "Erro ao carregar");
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [ano, apiUrl, empresaConfig.apiIdentifier]);

  if (loading) return <LoadingSpinner C={C} />;
  if (error) return <ErrorMessage message={error} C={C} />;

  const filtrados = filtroStatus === "todos" ? lancamentos : lancamentos.filter(l => l.status_titulo === filtroStatus);
  const totalPendente = lancamentos.filter(l => l.status_titulo === "Pendente").reduce((acc, l) => acc + (l.valor_documento || 0), 0);
  const totalLiquidado = lancamentos.filter(l => l.status_titulo === "Liquidado").reduce((acc, l) => acc + (l.valor_documento || 0), 0);
  const qtdPendente = lancamentos.filter(l => l.status_titulo === "Pendente").length;
  const qtdLiquidado = lancamentos.filter(l => l.status_titulo === "Liquidado").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Pendente" valor={totalPendente} cor={C.red} subLabel={`${qtdPendente} lançamentos`} C={C} />
        <KPICard label="Liquidado" valor={totalLiquidado} cor={C.green} subLabel={`${qtdLiquidado} lançamentos`} C={C} />
        <KPICard label="Total Geral" valor={totalPendente + totalLiquidado} cor={C.blue} subLabel={`${lancamentos.length} lançamentos`} C={C} />
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

// ─── ORÇADO VS REALIZADO VIEW ─────────────────────────────────────────────────
function OrcadoRealizadoView({ ano, mesInicial, mesFinal, C }: { ano: number; mesInicial: number; mesFinal: number; C: any }) {
  const periodoLabel = mesInicial === mesFinal ? MESES[mesInicial] : `${MESES_CURTO[mesInicial]} a ${MESES_CURTO[mesFinal]}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: C.blueLight, border: `1px solid ${C.blue}`, borderRadius: 8, padding: 20, color: C.blue }}>
        <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🔄 Orçado vs Realizado</div>
        <div style={{ fontSize: 13 }}>
          Período: <strong>{periodoLabel} / {ano}</strong>
        </div>
        <div style={{ fontSize: 12, marginTop: 8, opacity: 0.8 }}>
          Este dashboard será preenchido com dados de orçamento vs realizado após você fornecer a fonte dos dados.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: C.white, border: `2px dashed ${C.blue}`, borderRadius: 8, padding: 24, textAlign: "center", color: C.gray500, minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Orçamento vs Realizado</div>
          <div style={{ fontSize: 11, marginTop: 8, maxWidth: 200 }}>Gráfico comparativo será exibido aqui</div>
        </div>

        <div style={{ background: C.white, border: `2px dashed ${C.blue}`, borderRadius: 8, padding: 24, textAlign: "center", color: C.gray500, minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📈</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Variação Mensal</div>
          <div style={{ fontSize: 11, marginTop: 8, maxWidth: 200 }}>% de desvio orçamento vs realizado</div>
        </div>
      </div>

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: C.dark, textTransform: "uppercase", marginBottom: 16, letterSpacing: 0.5 }}>KPI's — Desvio Orçado vs Realizado</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <div style={{ background: C.blueLight, border: `1px solid ${C.blue}`, borderRadius: 6, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.blue, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>Receita</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.blue }}>-</div>
          </div>
          <div style={{ background: C.orangeLight, border: `1px solid ${C.orange}`, borderRadius: 6, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.orange, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>Custos</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.orange }}>-</div>
          </div>
          <div style={{ background: C.goldLight, border: `1px solid ${C.gold}`, borderRadius: 6, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.gold, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>Despesas</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>-</div>
          </div>
          <div style={{ background: C.greenLight, border: `1px solid ${C.green}`, borderRadius: 6, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.green, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>Resultado</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>-</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MENU DROPDOWN ────────────────────────────────────────────────────────────
function MenuDropdown({ tab, loading, empresaConfig, C }: any) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [usuarioModalAberto, setUsuarioModalAberto] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: "overview", label: "Visão Geral" },
    { id: "dre", label: "DRE" },
    { id: "dfc", label: "DFC" },
    { id: "receitas", label: "Receitas" },
    { id: "despesas", label: "Despesas" },
    { id: "orcado-realizado", label: "Orçado vs Realizado" },
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

  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false);
      }
    };

    if (menuAberto) {
      document.addEventListener('mousedown', handleClickFora);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, [menuAberto]);

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
      const elemento = document.querySelector('div[style*="display: flex"][style*="flexDirection: column"]') || document.querySelector('div[style*="flex-direction: column"]') || document.body;

      if (!elemento || elemento === document.body) {
        alert('Erro: Conteúdo não encontrado na página');
        return;
      }

      const nomePagina = tabs.find(t => t.id === tab)?.label || 'Dashboard';
      const opcoes = {
        margin: 10,
        filename: `${empresaConfig.nome}_${nomePagina}_${new Date().toLocaleDateString('pt-BR')}.pdf`,
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
      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          style={{
            background: C.red,
            color: C.white,
            border: "none",
            borderRadius: 4,
            padding: "8px 12px",
            cursor: "pointer",
            fontFamily: "'Barlow',sans-serif",
            fontWeight: 700,
            fontSize: 18,
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
export default function Dashboard({ params }: { params: { slug: string; modulo: string } }) {
  const slug = params.slug;
  const empresaConfig = resolveEmpresa(slug);

  if (!empresaConfig) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        flexDirection: "column",
        background: "#F8F8F8",
        fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E2E2",
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
          maxWidth: 400,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h1 style={{ margin: "0 0 12px 0", fontSize: 24, color: "#1A1A1A", fontWeight: 700 }}>
            Empresa não encontrada
          </h1>
          <p style={{ margin: "0 0 24px 0", fontSize: 14, color: "#666666", lineHeight: 1.6 }}>
            O dashboard para "<strong style={{ color: "#333333" }}>{slug}</strong>" não existe no sistema.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#999999" }}>
            Verifique a URL e tente novamente.
          </p>
        </div>
      </div>
    );
  }

  const C = empresaConfig.paleta;
  const apiUrl = getApiUrlForEmpresa(slug);

  console.log("🚀 [DASHBOARD INICIADO]", {
    slug,
    empresa: empresaConfig.nome,
    corPrimaria: C.red
  });

  const [ano, setAno] = useState(2026);
  const [filial, setFilial] = useState("Consolidado");
  const [mesInicial, setMesInicial] = useState(0);
  const [mesFinal, setMesFinal] = useState(0);
  const [modoAnual, setModoAnual] = useState(false);
  const [tab, setTab] = useState<"overview" | "dre" | "dfc" | "receitas" | "despesas" | "orcado-realizado">("overview");
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarDebug, setMostrarDebug] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<Array<{ idx: number; label: string }>>([]);

  const buscarDoCache = async (tipo: string, ano: number, filial: string) => {
    const { data, error } = await supabase
      .from("cache_financeiro")
      .select("*")
      .eq("empresa_slug", empresaConfig.apiIdentifier)
      .eq("filial", filial)
      .eq("ano", ano)
      .eq("tipo", tipo)
      .single();

    if (error) {
      console.error(`Erro ao buscar ${tipo}:`, error);
      return null;
    }

    return data;
  };

  const fetchDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("🔄 FETCHDADOS CHAMADO", { ano, filial });
    try {
      const dre = await buscarDoCache("dre", ano, filial);
      const dfc = await buscarDoCache("dfc", ano, filial);
      console.log("📊 DADOS DO CACHE", { dreEncontrada: !!dre, dfcEncontrada: !!dfc, ano, filial });

      if (!dre || !dfc) {
        throw new Error("Dados não encontrados no cache");
      }

      const json = enrichFinancePayload({
        success: true,
        dre: dre.dados,
        dfc: dfc.dados
      });

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
    } catch (e: any) {
      setError(e.message);
      console.error("❌ ERRO AO BUSCAR DO CACHE:", e.message);
    }
    finally { setLoading(false); }
  }, [ano, filial, empresaConfig.apiIdentifier]);

  useEffect(() => {
    console.log("📅 EFEITO DE ANO DISPARADO", { ano, filial });
    fetchDados();
  }, [ano, filial]);

  const periodoLabel = mesInicial === mesFinal ? MESES[mesInicial] : `${MESES_CURTO[mesInicial]} a ${MESES_CURTO[mesFinal]}`;
  const tabs = [
    { id: "overview", label: "Visão Geral" },
    { id: "dre", label: "DRE" },
    { id: "dfc", label: "DFC" },
    { id: "receitas", label: "Receitas" },
    { id: "despesas", label: "Despesas" },
    { id: "orcado-realizado", label: "Orçado vs Realizado" },
  ];

  return (
    <>
      <link href={FONT_URL} rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: C.gray50, fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <div style={{
          background: C.white,
          padding: "8px 28px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderBottom: `2px solid ${C.red}`,
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: 56
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 10, borderRight: `1px solid ${C.border}` }}>
            <img src={empresaConfig.logoDM} alt="D&M Consultoria" style={{ height: 36 }} />
            <img src={empresaConfig.logo} alt={empresaConfig.nome} style={{ height: 32 }} />
          </div>

          <div style={{ display: "flex", gap: 1 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)} style={{ background: tab === t.id ? C.red : "transparent", color: tab === t.id ? C.white : C.dark, border: "none", borderRadius: 3, padding: "3px 8px", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 0.2, textTransform: "uppercase", transition: "all 0.15s", whiteSpace: "nowrap" }}>{t.label}</button>
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: C.border, margin: "0 2px" }}></div>

          <select value={ano} onChange={e => { const novoAno = Number(e.target.value); console.log("✏️ ANO ALTERADO", { anoAnterior: ano, novoAno }); setAno(novoAno); }} style={{ border: `1px solid ${C.border}`, borderRadius: 3, padding: "4px 8px", fontFamily: "'Barlow',sans-serif", fontSize: 11, color: C.dark, background: C.white, cursor: "pointer", fontWeight: 600, height: 32 }}>
            {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select value={filial} onChange={e => setFilial(e.target.value)} style={{ border: `1px solid ${C.border}`, borderRadius: 3, padding: "4px 8px", fontFamily: "'Barlow',sans-serif", fontSize: 11, color: C.dark, background: C.white, cursor: "pointer", fontWeight: 600, height: 32 }}>
            {empresaConfig.filiais.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <span style={{ fontSize: 9, color: C.gray500, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 0.3, fontWeight: 600, textTransform: "uppercase" }}>Período:</span>

          <select value={mesInicial} onChange={e => setMesInicial(Number(e.target.value))} disabled={mesesDisponiveis.length === 0} style={{ border: `1px solid ${C.border}`, borderRadius: 3, padding: "4px 8px", fontFamily: "'Barlow',sans-serif", fontSize: 11, color: C.dark, background: C.white, cursor: "pointer", opacity: mesesDisponiveis.length === 0 ? 0.5 : 1, fontWeight: 600, height: 32 }}>
            {mesesDisponiveis.length > 0 ? mesesDisponiveis.map(m => <option key={m.idx} value={m.idx}>{m.label}</option>) : <option>-</option>}
          </select>

          <span style={{ fontSize: 9, color: C.gray500, fontFamily: "'Barlow',sans-serif", fontWeight: 600 }}>–</span>

          <select value={mesFinal} onChange={e => setMesFinal(Number(e.target.value))} disabled={mesesDisponiveis.length === 0} style={{ border: `1px solid ${C.border}`, borderRadius: 3, padding: "4px 8px", fontFamily: "'Barlow',sans-serif", fontSize: 11, color: C.dark, background: C.white, cursor: "pointer", opacity: mesesDisponiveis.length === 0 ? 0.5 : 1, fontWeight: 600, height: 32 }}>
            {mesesDisponiveis.length > 0 ? mesesDisponiveis.filter(m => m.idx >= mesInicial).map(m => <option key={m.idx} value={m.idx}>{m.label}</option>) : <option>-</option>}
          </select>

          <div style={{ flex: 1 }}></div>

          {(tab === "dre" || tab === "dfc") && (
            <button
              onClick={() => setModoAnual(!modoAnual)}
              style={{
                background: modoAnual ? C.red : C.white,
                color: modoAnual ? C.white : C.dark,
                border: `1px solid ${modoAnual ? C.red : C.border}`,
                borderRadius: 3,
                padding: "4px 10px",
                cursor: "pointer",
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                height: 32,
                transition: "all 0.15s"
              }}
            >
              {modoAnual ? "Anual" : "Mensal"}
            </button>
          )}

          <button
            onClick={async () => {
              setLoading(true);
              try {
                const response = await fetch(`${apiUrl}?atualizar_cache=true`);
                if (response.ok) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  fetchDados();
                }
              } catch (e) {
                console.error("Erro ao atualizar cache:", e);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            title="Atualizar cache manualmente"
            style={{
              background: loading ? C.gray100 : C.white,
              color: loading ? C.gray300 : C.red,
              border: `1px solid ${loading ? C.gray100 : C.border}`,
              borderRadius: 3,
              padding: "4px 10px",
              cursor: loading ? "default" : "pointer",
              fontFamily: "'Barlow',sans-serif",
              fontSize: 11,
              fontWeight: 600,
              height: 32,
              transition: "all 0.15s"
            }}
          >
            {loading ? "Atualizando..." : "🔄"}
          </button>

          <button
            onClick={() => setMostrarDebug(v => !v)}
            style={{
              background: mostrarDebug ? C.blue : C.white,
              color: mostrarDebug ? C.white : C.blue,
              border: `1px solid ${mostrarDebug ? C.blue : C.border}`,
              borderRadius: 3,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'Barlow',sans-serif",
              fontSize: 11,
              fontWeight: 600,
              height: 32,
              transition: "all 0.15s"
            }}
          >
            {mostrarDebug ? "Debug ON" : "Debug"}
          </button>

          <MenuDropdown tab={tab} loading={loading} empresaConfig={empresaConfig} C={C} />
        </div>

        <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
          {error && tab !== "despesas" && tab !== "receitas" && <ErrorMessage message={error} onRetry={fetchDados} C={C} />}
          {loading && tab !== "despesas" && tab !== "receitas" && !dados && <LoadingSpinner C={C} />}
          {!loading && !error && !dados && tab !== "despesas" && tab !== "receitas" && <ErrorMessage message="Nenhum dado disponível" C={C} />}
          {!loading && !error && dados && tab === "overview" && (
            <>
              <OverviewView dados={dados} mesInicial={mesInicial} mesFinal={mesFinal} C={C} />
              {mostrarDebug && <DebugFinanceiroView dados={dados} mesInicial={mesInicial} mesFinal={mesFinal} C={C} />}
            </>
          )}
          {!loading && !error && dados && tab === "dre" && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}><TabelaFinanceira rows={DRE_ROWS} dados={dados?.dre} mesInicial={mesInicial} mesFinal={mesFinal} titulo={`DRE — 2026 — ${periodoLabel}`} mostrarAno={modoAnual} C={C} /></div>}
          {!loading && !error && dados && tab === "dfc" && <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}><TabelaFinanceira rows={DFC_ROWS} dados={dados?.dfc} mesInicial={mesInicial} mesFinal={mesFinal} titulo={`DFC — 2026 — ${periodoLabel}`} mostrarAno={modoAnual} C={C} /></div>}
          {tab === "despesas" && <DespesasView ano={ano} apiUrl={apiUrl} empresaConfig={empresaConfig} C={C} />}
          {tab === "receitas" && <ReceitasView ano={ano} apiUrl={apiUrl} empresaConfig={empresaConfig} C={C} />}
          {!loading && !error && tab === "orcado-realizado" && <OrcadoRealizadoView ano={ano} mesInicial={mesInicial} mesFinal={mesFinal} C={C} />}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", background: C.white }}>
        <span style={{ fontSize: 11, color: C.gray500, fontFamily: "'Barlow',sans-serif" }}>{empresaConfig.nomeCompleto} · CNPJ {empresaConfig.cnpj}</span>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.gray500, fontFamily: "'JetBrains Mono',monospace" }}>
            {loading ? "Carregando..." : (ultimaAtualizacao ? `Atualizado: ${ultimaAtualizacao.toLocaleTimeString("pt-BR")}` : "")}
          </span>
          <span style={{ fontSize: 11, color: C.gray500, fontFamily: "'JetBrains Mono',monospace" }}>Fonte: Supabase Cache</span>
        </div>
      </div>
    </>
  );
}
