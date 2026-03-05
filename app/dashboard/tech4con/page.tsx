"use client";
import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ─── FONTES ───────────────────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap";

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
  stripe:  "#F5F5F5",
  gray400: "#999999",
  gray600: "#666666",
  gray50:     "#F8F8F8",
  white:      "#FFFFFF",
  blue:       "#1B4F8A",
  blueLight:  "#EAF0F8",
  green:      "#1A6B3C",
  greenLight: "#E6F4EC",
  gold:       "#8B5E0A",
  goldLight:  "#FDF3E3",
  orange:     "#C4622D",
  border:     "#E2E2E2",
  borderDark: "#CCCCCC",
};

// ─── FORMATADORES ─────────────────────────────────────────────────────────────
const fmtBRL = (v) => {
  if (v === 0 || v === null || v === undefined) return "R$ -";
  const abs = Math.abs(v);
  const s = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(abs);
  return v < 0 ? `-R$ ${s}` : `R$ ${s}`;
};
const fmtK = (v) => {
  const abs = Math.abs(v);
  if (abs >= 1000000) return `R$ ${(v/1000000).toFixed(1)}M`;
  if (abs >= 1000) return `R$ ${(v/1000).toFixed(0)}k`;
  return fmtBRL(v);
};
const fmtPct = (v, base) => {
  if (!base || base === 0) return "0,00%";
  return ((v / Math.abs(base)) * 100).toFixed(2).replace(".",",") + "%";
};

// ─── DADOS DEMO ───────────────────────────────────────────────────────────────
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const VALORES = {
  // RECEITAS
  "Receita de Vendas":            [522645,428959,489200,512000,0,0,0,0,0,0,0,0],
  "Receita Outros":               [0,0,0,0,0,0,0,0,0,0,0,0],
  "Receita Serviço":              [0,0,0,0,0,0,0,0,0,0,0,0],
  "Receita Venda/Revenda":        [522645,428959,489200,512000,0,0,0,0,0,0,0,0],
  "Loja Virtual":                 [0,0,0,0,0,0,0,0,0,0,0,0],
  "Deduções de Vendas":           [136306,100804,118500,124000,0,0,0,0,0,0,0,0],
  "Comissões de vendas":          [46594,46594,52000,55000,0,0,0,0,0,0,0,0],
  "Devolução ou Cancelamento NF": [0,0,0,0,0,0,0,0,0,0,0,0],
  "Impostos (Federais, Estaduais, Municipais)":[89712,54210,66500,69000,0,0,0,0,0,0,0,0],
  "Receita líquida":              [386339,328155,370700,388000,0,0,0,0,0,0,0,0],
  // CPV
  "Custo dos Produtos Vendidos":  [366807,100652,320000,335000,0,0,0,0,0,0,0,0],
  "CMV/CPV - Custo Mercadoria Vendida":[368617,100652,320000,335000,0,0,0,0,0,0,0,0],
  "Custos Variáveis de Operação": [0,0,0,0,0,0,0,0,0,0,0,0],
  "Devolução de Matéria Prima e Insumo":[1810,0,0,0,0,0,0,0,0,0,0,0],
  "Mão de obra terceirizada":     [0,0,0,0,0,0,0,0,0,0,0,0],
  "Margem bruta":                 [19532,227503,50700,53000,0,0,0,0,0,0,0,0],
  // DESP VARIÁVEIS
  "Despesas Variáveis":           [0,0,0,0,0,0,0,0,0,0,0,0],
  "Fretes e Combustíveis (venda)":[0,0,0,0,0,0,0,0,0,0,0,0],
  "Gastos com Veículos":          [0,0,0,0,0,0,0,0,0,0,0,0],
  "Manutenção de Equipamentos":   [0,0,0,0,0,0,0,0,0,0,0,0],
  "Outros":                       [0,0,0,0,0,0,0,0,0,0,0,0],
  "Taxa de Boletos | Cartão":     [0,0,0,0,0,0,0,0,0,0,0,0],
  "Margem líquida (margem de contribuição)":[19532,227503,50700,53000,0,0,0,0,0,0,0,0],
  // GASTOS FIXOS
  "Gastos fixos (custos fixos + despesas fixas)":[49880,75504,58200,61000,0,0,0,0,0,0,0,0],
  "Gasto com Pessoal - Adm":      [32581,37956,35000,37000,0,0,0,0,0,0,0,0],
  "13° Salário - Adm":            [0,0,0,0,0,0,0,0,0,0,0,0],
  "Assistência Médica":           [0,0,0,0,0,0,0,0,0,0,0,0],
  "Bonificações - Adm":           [0,0,0,0,0,0,0,0,0,0,0,0],
  "Férias - Adm":                 [0,0,0,0,0,0,0,0,0,0,0,0],
  "FGTS - Adm":                   [4746,4746,4900,5100,0,0,0,0,0,0,0,0],
  "INSS - Adm":                   [7998,7998,8200,8500,0,0,0,0,0,0,0,0],
  "IRRF - Adm":                   [0,0,0,0,0,0,0,0,0,0,0,0],
  "Multa Rescisória - Adm":       [0,0,0,0,0,0,0,0,0,0,0,0],
  "Outros Benefícios - Adm":      [0,0,0,0,0,0,0,0,0,0,0,0],
  "Outros Folha - Adm":           [357,357,357,357,0,0,0,0,0,0,0,0],
  "Pesão Alimentícia - Adm":      [0,0,0,0,0,0,0,0,0,0,0,0],
  "Salário (s/ encargos) - Adm":  [19480,19480,19480,19480,0,0,0,0,0,0,0,0],
  "Seguro de Vida - Adm":         [0,0,0,0,0,0,0,0,0,0,0,0],
  "Vale Refeição - Adm":          [3760,3760,3760,3760,0,0,0,0,0,0,0,0],
  "Vale Transporte - Adm":        [0,0,0,0,0,0,0,0,0,0,0,0],
  "Gasto com pessoal - Prod/Oper":[0,0,0,0,0,0,0,0,0,0,0,0],
  "13° Salário - Prod/Oper":      [0,0,0,0,0,0,0,0,0,0,0,0],
  "Benefícios - Prod/Oper":       [0,0,0,0,0,0,0,0,0,0,0,0],
  "Refeições - Colaboradores":    [0,0,0,0,0,0,0,0,0,0,0,0],
  "Convênio Médico - Prod/Oper":  [0,0,0,0,0,0,0,0,0,0,0,0],
  "Férias - Prod/Oper":           [0,0,0,0,0,0,0,0,0,0,0,0],
  "FGTS - Prod/Oper":             [0,0,0,0,0,0,0,0,0,0,0,0],
  "INSS - Prod/Oper":             [0,0,0,0,0,0,0,0,0,0,0,0],
  "IRRF - Prod/Oper":             [0,0,0,0,0,0,0,0,0,0,0,0],
  "Multa Rescisória - Prod/Oper": [0,0,0,0,0,0,0,0,0,0,0,0],
  "Outros Folha Prod/Oper":       [0,0,0,0,0,0,0,0,0,0,0,0],
  "Salário (s/ encargos) - Prod/Oper":[0,0,0,0,0,0,0,0,0,0,0,0],
  // DESP OPERACIONAIS
  "Despesas Operacionais":        [17299,37548,22000,24000,0,0,0,0,0,0,0,0],
  "Aluguel de Máquinas e Equipamentos":[0,0,0,0,0,0,0,0,0,0,0,0],
  "Consertos e reparos - Adm":    [58,0,172,0,0,0,0,0,0,0,0,0],
  "Contabilidade, Jurídico, Consultoria":[10269,10269,10269,10269,0,0,0,0,0,0,0,0],
  "Estrutural (energia, água, seguro)":[0,0,0,0,0,0,0,0,0,0,0,0],
  "Materiais de Limpeza e Conservação":[0,0,0,0,0,0,0,0,0,0,0,0],
  "Material de escritório":       [0,0,0,0,0,0,0,0,0,0,0,0],
  "Festas e Confraternizações":   [0,0,0,0,0,0,0,0,0,0,0,0],
  "Pró-labore":                   [3036,3036,3036,3036,0,0,0,0,0,0,0,0],
  "Propaganda e publicidade":     [0,6264,4000,4500,0,0,0,0,0,0,0,0],
  "Assessoria em MKT":            [0,0,0,0,0,0,0,0,0,0,0,0],
  "Serviços gráficos":            [0,0,0,0,0,0,0,0,0,0,0,0],
  "Serviços Prestados (PJ)":      [1410,1410,689,1500,0,0,0,0,0,0,0,0],
  "TI (software, internet, telefone)":[744,744,535,850,0,0,0,0,0,0,0,0],
  "Uso e Consumo":                [0,0,0,0,0,0,0,0,0,0,0,0],
  "Viagens e Hospedagens":        [1781,1781,2202,900,0,0,0,0,0,0,0,0],
  // EBITDA EM DIANTE
  "Ebitda":                       [-30348,151999,28700,28000,0,0,0,0,0,0,0,0],
  "Receitas Financeiras":         [0,0,10,0,0,0,0,0,0,0,0,0],
  "Depósitos Judiciais":          [0,0,0,0,0,0,0,0,0,0,0,0],
  "Outras receitas financeiras":  [0,0,10,0,0,0,0,0,0,0,0,0],
  "Receita sob mudança cambio":   [0,0,0,0,0,0,0,0,0,0,0,0],
  "Receita sobre Aplicações (Renda Fixa)":[0,0,0,0,0,0,0,0,0,0,0,0],
  "Valorização ativo":            [0,0,0,0,0,0,0,0,0,0,0,0],
  "Ganho de Capital - Imobilizado":[0,0,0,0,0,0,0,0,0,0,0,0],
  "Despesas Financeiras":         [0,419,0,500,0,0,0,0,0,0,0,0],
  "Depreciação":                  [0,0,0,0,0,0,0,0,0,0,0,0],
  "Despesas bancárias":           [0,0,0,0,0,0,0,0,0,0,0,0],
  "Despesas sob mudança cambio":  [0,0,0,0,0,0,0,0,0,0,0,0],
  "IR sobre aplicações - Renda Fixa":[0,0,0,0,0,0,0,0,0,0,0,0],
  "IR sobre aplicações - Renda Variável":[0,0,0,0,0,0,0,0,0,0,0,0],
  "Juros e multas":               [0,0,0,0,0,0,0,0,0,0,0,0],
  "Outras despesas financeiras":  [0,0,0,0,0,0,0,0,0,0,0,0],
  "Título de Capitalização":      [0,0,0,0,0,0,0,0,0,0,0,0],
  "Resultado operacional bruto":  [-30348,151580,28710,27500,0,0,0,0,0,0,0,0],
  "Impostos Sob Lucro":           [30011,28671,30011,14500,0,0,0,0,0,0,0,0],
  "CSLL":                         [12637,12637,12637,6200,0,0,0,0,0,0,0,0],
  "IRPJ":                         [17373,17373,17373,8300,0,0,0,0,0,0,0,0],
  "Resultado operacional líquido":[-60358,122910,610046,13000,0,0,0,0,0,0,0,0],
  "Distribuição de Lucro":        [63482,87115,96964,22000,0,0,0,0,0,0,0,0],
  "Distribuição de lucro":        [63482,87115,96964,22000,0,0,0,0,0,0,0,0],
  "Gratificações a funcionários": [0,0,0,0,0,0,0,0,0,0,0,0],
  "Resultado pós distribuição de lucros":[-123840,35795,513082,-9000,0,0,0,0,0,0,0,0],
  "Investimentos e Financiamentos":[38261,6495,21440,8000,0,0,0,0,0,0,0,0],
  "Compra de Ativo Imobilizado":  [0,0,15880,0,0,0,0,0,0,0,0,0],
  "Empréstimos e Financiamentos (Saída)":[38261,6495,5561,8000,0,0,0,0,0,0,0,0],
  "Resultado após Capex":         [-162101,29300,-13800,-17000,0,0,0,0,0,0,0,0],
  // DFC extras
  "Saldo Inicial":                [59492,551133,537333,523533,0,0,0,0,0,0,0,0],
  "Compra de Matéria-Prima":      [0,0,0,0,0,0,0,0,0,0,0,0],
  "Saldo Final":                  [551133,537333,523533,506533,0,0,0,0,0,0,0,0],
};

// ─── ESTRUTURAS HIERÁRQUICAS ──────────────────────────────────────────────────
const DRE_ROWS = [
  { key:"Receita de Vendas",     nivel:0, tipo:"grupo",    pref:"(+)", sinal:1,
    filhos:["Receita Outros","Receita Serviço","Receita Venda/Revenda","Loja Virtual"] },
  { key:"Receita Outros",            nivel:1, tipo:"item", pref:"(+)", sinal:1 },
  { key:"Receita Serviço",           nivel:1, tipo:"item", pref:"(+)", sinal:1 },
  { key:"Receita Venda/Revenda",     nivel:1, tipo:"item", pref:"(+)", sinal:1 },
  { key:"Loja Virtual",              nivel:1, tipo:"item", pref:"(+)", sinal:1 },
  { key:"Deduções de Vendas",    nivel:0, tipo:"grupo",    pref:"(-)", sinal:-1,
    filhos:["Comissões de vendas","Devolução ou Cancelamento NF","Impostos (Federais, Estaduais, Municipais)"] },
  { key:"Comissões de vendas",       nivel:1, tipo:"item", pref:"(-)", sinal:-1 },
  { key:"Devolução ou Cancelamento NF",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Impostos (Federais, Estaduais, Municipais)",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Receita líquida",       nivel:0, tipo:"resultado", pref:"(=)", cor:"blue" },
  { key:"Custo dos Produtos Vendidos",nivel:0,tipo:"grupo",pref:"(-)",sinal:-1,
    filhos:["CMV/CPV - Custo Mercadoria Vendida","Custos Variáveis de Operação","Devolução de Matéria Prima e Insumo","Mão de obra terceirizada"] },
  { key:"CMV/CPV - Custo Mercadoria Vendida",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Custos Variáveis de Operação",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Devolução de Matéria Prima e Insumo",nivel:1,tipo:"item",pref:"(+)",sinal:1 },
  { key:"Mão de obra terceirizada",  nivel:1, tipo:"item", pref:"(-)", sinal:-1 },
  { key:"Margem bruta",          nivel:0, tipo:"resultado", pref:"(=)", cor:"blue" },
  { key:"Despesas Variáveis",    nivel:0, tipo:"grupo",    pref:"(-)", sinal:-1,
    filhos:["Fretes e Combustíveis (venda)","Gastos com Veículos","Manutenção de Equipamentos","Outros","Taxa de Boletos | Cartão"] },
  { key:"Fretes e Combustíveis (venda)",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Gastos com Veículos",        nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Manutenção de Equipamentos", nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Outros",                     nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Taxa de Boletos | Cartão",   nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Margem líquida (margem de contribuição)",nivel:0,tipo:"resultado",pref:"(=)",cor:"blue" },
  { key:"Gastos fixos (custos fixos + despesas fixas)",nivel:0,tipo:"grupo",pref:"(-)",sinal:-1,
    filhos:["Gasto com Pessoal - Adm","Gasto com pessoal - Prod/Oper","Despesas Operacionais"] },
  { key:"Gasto com Pessoal - Adm",nivel:1,tipo:"subgrupo",pref:"(-)",sinal:-1,
    filhos:["13° Salário - Adm","Assistência Médica","Bonificações - Adm","Férias - Adm","FGTS - Adm","INSS - Adm","IRRF - Adm","Multa Rescisória - Adm","Outros Benefícios - Adm","Outros Folha - Adm","Pesão Alimentícia - Adm","Salário (s/ encargos) - Adm","Seguro de Vida - Adm","Vale Refeição - Adm","Vale Transporte - Adm"] },
  { key:"13° Salário - Adm",      nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Assistência Médica",     nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Bonificações - Adm",     nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Férias - Adm",           nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"FGTS - Adm",             nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"INSS - Adm",             nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"IRRF - Adm",             nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Multa Rescisória - Adm", nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Outros Benefícios - Adm",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Outros Folha - Adm",     nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Pesão Alimentícia - Adm",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Salário (s/ encargos) - Adm",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Seguro de Vida - Adm",   nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Vale Refeição - Adm",    nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Vale Transporte - Adm",  nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Gasto com pessoal - Prod/Oper",nivel:1,tipo:"subgrupo",pref:"(-)",sinal:-1,
    filhos:["13° Salário - Prod/Oper","Benefícios - Prod/Oper","Refeições - Colaboradores","Convênio Médico - Prod/Oper","Férias - Prod/Oper","FGTS - Prod/Oper","INSS - Prod/Oper","IRRF - Prod/Oper","Multa Rescisória - Prod/Oper","Outros Folha Prod/Oper","Salário (s/ encargos) - Prod/Oper"] },
  { key:"13° Salário - Prod/Oper",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Benefícios - Prod/Oper", nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Refeições - Colaboradores",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Convênio Médico - Prod/Oper",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Férias - Prod/Oper",     nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"FGTS - Prod/Oper",       nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"INSS - Prod/Oper",       nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"IRRF - Prod/Oper",       nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Multa Rescisória - Prod/Oper",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Outros Folha Prod/Oper", nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Salário (s/ encargos) - Prod/Oper",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Despesas Operacionais",  nivel:1,tipo:"subgrupo",pref:"(-)",sinal:-1,
    filhos:["Aluguel de Máquinas e Equipamentos","Consertos e reparos - Adm","Contabilidade, Jurídico, Consultoria","Estrutural (energia, água, seguro)","Materiais de Limpeza e Conservação","Material de escritório","Festas e Confraternizações","Pró-labore","Propaganda e publicidade","Assessoria em MKT","Serviços gráficos","Serviços Prestados (PJ)","TI (software, internet, telefone)","Uso e Consumo","Viagens e Hospedagens"] },
  { key:"Aluguel de Máquinas e Equipamentos",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Consertos e reparos - Adm",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Contabilidade, Jurídico, Consultoria",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Estrutural (energia, água, seguro)",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Materiais de Limpeza e Conservação",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Material de escritório",  nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Festas e Confraternizações",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Pró-labore",              nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Propaganda e publicidade",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Assessoria em MKT",       nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Serviços gráficos",       nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Serviços Prestados (PJ)", nivel:2,tipo:"item",pref:"(-)",sinal:-1,destaque:true },
  { key:"TI (software, internet, telefone)",nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Uso e Consumo",           nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Viagens e Hospedagens",   nivel:2,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Ebitda",                nivel:0,tipo:"resultado",pref:"(=)",cor:"blue" },
  { key:"Receitas Financeiras",  nivel:0,tipo:"grupo",   pref:"(+)",sinal:1,
    filhos:["Depósitos Judiciais","Outras receitas financeiras","Receita sob mudança cambio","Receita sobre Aplicações (Renda Fixa)","Valorização ativo","Ganho de Capital - Imobilizado"] },
  { key:"Depósitos Judiciais",    nivel:1,tipo:"item",pref:"(+)",sinal:1 },
  { key:"Outras receitas financeiras",nivel:1,tipo:"item",pref:"(+)",sinal:1 },
  { key:"Receita sob mudança cambio",nivel:1,tipo:"item",pref:"(+)",sinal:1 },
  { key:"Receita sobre Aplicações (Renda Fixa)",nivel:1,tipo:"item",pref:"(+)",sinal:1 },
  { key:"Valorização ativo",      nivel:1,tipo:"item",pref:"(+)",sinal:1 },
  { key:"Ganho de Capital - Imobilizado",nivel:1,tipo:"item",pref:"(+)",sinal:1 },
  { key:"Despesas Financeiras",  nivel:0,tipo:"grupo",   pref:"(-)",sinal:-1,
    filhos:["Depreciação","Despesas bancárias","Despesas sob mudança cambio","IR sobre aplicações - Renda Fixa","IR sobre aplicações - Renda Variável","Juros e multas","Outras despesas financeiras","Título de Capitalização"] },
  { key:"Depreciação",            nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Despesas bancárias",     nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Despesas sob mudança cambio",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"IR sobre aplicações - Renda Fixa",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"IR sobre aplicações - Renda Variável",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Juros e multas",         nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Outras despesas financeiras",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Título de Capitalização",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Resultado operacional bruto",nivel:0,tipo:"resultado",pref:"(=)",cor:"blue" },
  { key:"Impostos Sob Lucro",    nivel:0,tipo:"grupo",   pref:"(-)",sinal:-1,
    filhos:["CSLL","IRPJ"] },
  { key:"CSLL",                   nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"IRPJ",                   nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Resultado operacional líquido",nivel:0,tipo:"resultado",pref:"(=)",cor:"blue" },
  { key:"Distribuição de Lucro", nivel:0,tipo:"grupo",   pref:"(-)",sinal:-1,
    filhos:["Distribuição de lucro","Gratificações a funcionários"] },
  { key:"Distribuição de lucro",  nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Gratificações a funcionários",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Resultado pós distribuição de lucros",nivel:0,tipo:"resultado",pref:"(=)",cor:"gold" },
  { key:"Investimentos e Financiamentos",nivel:0,tipo:"grupo",pref:"(-)",sinal:-1,
    filhos:["Compra de Ativo Imobilizado","Empréstimos e Financiamentos (Saída)"] },
  { key:"Compra de Ativo Imobilizado",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Empréstimos e Financiamentos (Saída)",nivel:1,tipo:"item",pref:"(-)",sinal:-1 },
  { key:"Resultado após Capex",  nivel:0,tipo:"resultado",pref:"(=)",cor:"gold" },
];

// DFC = DRE + Saldo Inicial/Final
const DFC_ROWS = [
  { key:"Saldo Inicial", nivel:0, tipo:"saldo", pref:"(=)", cor:"green" },
  ...DRE_ROWS,
  { key:"Saldo Final",   nivel:0, tipo:"saldo", pref:"(=)", cor:"green" },
];

// ─── COMPONENTES INTERNOS ─────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{
        background: C.red, width:36, height:36, borderRadius:6,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:C.white, letterSpacing:-1
      }}>T4</div>
      <div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, color:C.black, letterSpacing:1, lineHeight:1 }}>TECH4CON</div>
        <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:10, color:C.gray500, letterSpacing:1 }}>PAINEL FINANCEIRO</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:6, padding:"10px 14px", boxShadow:"0 4px 16px rgba(0,0,0,0.12)", fontSize:12, fontFamily:"'Barlow',sans-serif" }}>
      <div style={{ color:C.gray500, marginBottom:6, fontWeight:600 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, marginBottom:2 }}>
          {p.name}: <strong>{fmtBRL(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

// ─── TABELA DRE / DFC ─────────────────────────────────────────────────────────
function TabelaFinanceira({ rows, mesSel, titulo, mostrarAno }) {
  const [expandidos, setExpandidos] = useState({});
  const toggleExpand = (key) => setExpandidos(prev => ({ ...prev, [key]: !prev[key] }));

  const receitaBase = VALORES["Receita de Vendas"]?.[mesSel] || 1;

  // controla visibilidade: item só aparece se pai estiver expandido
  const isVisible = (row) => {
    if (row.nivel === 0) return true;
    // percorrer hierarquia: encontrar pai
    const parentKey = findParent(rows, row.key);
    if (!parentKey) return true;
    if (!expandidos[parentKey]) return false;
    // nível 2: verificar avô
    if (row.nivel === 2) {
      const grandKey = findParent(rows, parentKey);
      if (grandKey && !expandidos[grandKey]) return false;
    }
    return true;
  };

  const findParent = (rows, childKey) => {
    for (const r of rows) {
      if (r.filhos && r.filhos.includes(childKey)) return r.key;
    }
    return null;
  };

  const rowColor = (tipo, cor) => {
    if (tipo === "saldo") return { bg: C.greenLight, text: C.green, bold: true };
    if (tipo === "resultado") {
      if (cor === "blue")  return { bg: C.blueLight, text: C.blue, bold: true };
      if (cor === "gold")  return { bg: C.goldLight, text: C.gold, bold: true };
      if (cor === "green") return { bg: C.greenLight, text: C.green, bold: true };
    }
    if (tipo === "grupo")    return { bg: "#F5F5F5", text: C.dark, bold: true };
    if (tipo === "subgrupo") return { bg: "#FAFAFA", text: C.gray700, bold: true };
    return { bg: C.white, text: C.gray700, bold: false };
  };

  const mesesExibidos = mostrarAno
    ? MESES.map((m,i) => ({ label: m, idx: i })).filter(m => VALORES["Receita de Vendas"][m.idx] > 0)
    : [{ label: MESES[mesSel], idx: mesSel }];

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5, fontFamily:"'Barlow',sans-serif" }}>
        <thead>
          <tr style={{ background: C.dark }}>
            <th style={{ padding:"10px 14px", textAlign:"left", color:C.white, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1, width:"40%" }}>{titulo}</th>
            {mesesExibidos.map(m => (
              <th key={m.idx} colSpan={2} style={{ padding:"10px 8px", textAlign:"center", color:C.white, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, letterSpacing:1, borderLeft:`1px solid ${C.gray700}` }}>
                {m.label.toUpperCase()}
              </th>
            ))}
          </tr>
          <tr style={{ background: C.gray900, borderBottom:`2px solid ${C.red}` }}>
            <th style={{ padding:"6px 14px", textAlign:"left", color:C.gray300, fontSize:10, letterSpacing:1 }}></th>
            {mesesExibidos.map(m => (
              <>
                <th key={`v${m.idx}`} style={{ padding:"6px 8px", textAlign:"right", color:C.gray300, fontSize:10, borderLeft:`1px solid ${C.gray700}` }}>R$ TOTAL</th>
                <th key={`p${m.idx}`} style={{ padding:"6px 8px", textAlign:"right", color:C.gray300, fontSize:10 }}>%</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            if (!isVisible(row)) return null;
            const colors = rowColor(row.tipo, row.cor);
            const hasChildren = row.filhos && row.filhos.length > 0;
            const isOpen = expandidos[row.key];
            const indent = row.nivel * 18;

            return (
              <tr
                key={row.key}
                onClick={hasChildren ? () => toggleExpand(row.key) : undefined}
                style={{
                  background: i % 2 === 0 && row.tipo === "item" ? C.stripe : colors.bg,
                  borderBottom: `1px solid ${row.tipo === "resultado" || row.tipo === "saldo" ? C.borderDark : C.border}`,
                  cursor: hasChildren ? "pointer" : "default",
                }}
                onMouseEnter={e => hasChildren && (e.currentTarget.style.filter = "brightness(0.97)")}
                onMouseLeave={e => hasChildren && (e.currentTarget.style.filter = "none")}
              >
                <td style={{
                  padding: `${row.tipo === "resultado" || row.tipo === "saldo" ? 9 : 7}px 14px`,
                  paddingLeft: 14 + indent,
                  color: row.destaque ? C.red : colors.text,
                  fontWeight: colors.bold ? 700 : 400,
                  fontFamily: colors.bold ? "'Barlow Condensed',sans-serif" : "'Barlow',sans-serif",
                  fontSize: row.tipo === "resultado" || row.tipo === "saldo" ? 13 : row.tipo === "grupo" || row.tipo === "subgrupo" ? 12.5 : 12,
                  letterSpacing: colors.bold ? 0.3 : 0,
                  display:"flex", alignItems:"center", gap:8
                }}>
                  <span style={{ color: C.gray400, fontSize:10, fontFamily:"'JetBrains Mono',monospace", minWidth:28 }}>{row.pref}</span>
                  <span style={{ flex:1 }}>{row.key}</span>
                  {hasChildren && (
                    <span style={{ color: C.gray500, fontSize:10, marginLeft:4 }}>{isOpen ? "▲" : "▼"}</span>
                  )}
                </td>
                {mesesExibidos.map(m => {
                  const v = VALORES[row.key]?.[m.idx] ?? 0;
                  const pct = row.tipo === "item" || row.tipo === "grupo" || row.tipo === "subgrupo"
                    ? fmtPct(v, receitaBase) : fmtPct(v, receitaBase);
                  const isNeg = v < 0;
                  return (
                    <>
                      <td key={`v${m.idx}`} style={{
                        padding:"7px 8px", textAlign:"right",
                        fontFamily:"'JetBrains Mono',monospace", fontSize:12,
                        color: row.tipo === "resultado" || row.tipo === "saldo" ? colors.text : isNeg ? C.red : v === 0 ? C.gray300 : C.dark,
                        fontWeight: colors.bold ? 700 : 400,
                        borderLeft:`1px solid ${C.border}`,
                      }}>
                        {fmtBRL(v)}
                      </td>
                      <td key={`p${m.idx}`} style={{
                        padding:"7px 8px 7px 4px", textAlign:"right",
                        fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                        color: v === 0 ? C.gray300 : isNeg ? C.red : colors.bold ? colors.text : C.gray500,
                      }}>
                        {pct}
                      </td>
                    </>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── VIEW OVERVIEW ────────────────────────────────────────────────────────────
function OverviewView({ mesSel }) {
  const fatAtual = VALORES["Receita de Vendas"][mesSel] || 0;
  const fatAnt   = mesSel > 0 ? (VALORES["Receita de Vendas"][mesSel-1] || 0) : fatAtual;
  const ebitda   = VALORES["Ebitda"][mesSel] || 0;
  const saldoFin = VALORES["Saldo Final"]?.[mesSel] || 0;
  const margem   = fatAtual ? ((ebitda / fatAtual)*100).toFixed(1) : "0";
  const var1 = fatAnt ? (((fatAtual-fatAnt)/Math.abs(fatAnt))*100).toFixed(1) : "0";

  const chartData = MESES.map((m,i) => ({
    mes: m,
    Receita: VALORES["Receita de Vendas"][i] || 0,
    "Rec. Líquida": VALORES["Receita líquida"][i] || 0,
    EBITDA: VALORES["Ebitda"][i] || 0,
  })).filter(d => d.Receita > 0);

  const pieData = [
    { name: "CMV/CPV", value: VALORES["CMV/CPV - Custo Mercadoria Vendida"][mesSel] || 0 },
    { name: "Pessoal Adm", value: VALORES["Gasto com Pessoal - Adm"][mesSel] || 0 },
    { name: "Desp. Operacionais", value: VALORES["Despesas Operacionais"][mesSel] || 0 },
    { name: "Impostos", value: VALORES["Deduções de Vendas"][mesSel] || 0 },
    { name: "Dist. Lucro", value: VALORES["Distribuição de Lucro"][mesSel] || 0 },
  ].filter(d => d.value > 0);
  const PIE_COLORS = [C.red, C.blue, C.orange, C.gold, C.green];

  const KPI = ({ label, value, sub, trend, color }) => (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:"18px 20px", borderTop:`3px solid ${color||C.red}` }}>
      <div style={{ color:C.gray500, fontSize:10, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      <div style={{ color:C.dark, fontSize:24, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ color:C.gray500, fontSize:11, marginTop:4 }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ marginTop:8, fontSize:11, color: parseFloat(trend) >= 0 ? C.green : C.red, fontWeight:600 }}>
          {parseFloat(trend) >= 0 ? "▲" : "▼"} {Math.abs(parseFloat(trend))}% vs mês ant.
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        <KPI label="Receita de Vendas" value={fmtK(fatAtual)} trend={var1} color={C.red} />
        <KPI label="EBITDA" value={fmtK(ebitda)} sub={`Margem: ${margem}%`} color={C.blue} />
        <KPI label="Saldo Final de Caixa" value={fmtK(saldoFin)} color={C.green} />
        <KPI label="Margem Bruta" value={fmtPct(VALORES["Margem bruta"][mesSel]||0, fatAtual)} sub={fmtBRL(VALORES["Margem bruta"][mesSel]||0)} color={C.orange} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:20 }}>
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:20 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1, color:C.dark, textTransform:"uppercase", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:3, height:14, background:C.red, borderRadius:2, display:"inline-block" }}></span>
            Evolução de Resultados
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="10%" stopColor={C.red} stopOpacity={0.2}/>
                  <stop offset="90%" stopColor={C.red} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gLiq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="10%" stopColor={C.blue} stopOpacity={0.2}/>
                  <stop offset="90%" stopColor={C.blue} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.gray100} />
              <XAxis dataKey="mes" tick={{ fill:C.gray500, fontSize:11, fontFamily:"'Barlow',sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fill:C.gray500, fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12, fontFamily:"'Barlow',sans-serif" }} />
              <Area type="monotone" dataKey="Receita" stroke={C.red} fill="url(#gRec)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Rec. Líquida" stroke={C.blue} fill="url(#gLiq)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:20 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1, color:C.dark, textTransform:"uppercase", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:3, height:14, background:C.red, borderRadius:2, display:"inline-block" }}></span>
            Composição de Custos
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={2}>
                {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmtBRL(v)} contentStyle={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:6, fontSize:12 }} />
              <Legend wrapperStyle={{ fontSize:11, fontFamily:"'Barlow',sans-serif" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:20 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1, color:C.dark, textTransform:"uppercase", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:3, height:14, background:C.red, borderRadius:2, display:"inline-block" }}></span>
          EBITDA Mensal
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.gray100} />
            <XAxis dataKey="mes" tick={{ fill:C.gray500, fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fill:C.gray500, fontSize:11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="EBITDA" radius={[4,4,0,0]}>
              {chartData.map((d,i) => <Cell key={i} fill={d.EBITDA < 0 ? C.red : C.blue} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function Tech4ConDashboard() {
  const [tab, setTab] = useState("overview");
  const [mesSel, setMesSel] = useState(0);
  const [filial, setFilial] = useState("Consolidado");
  const [modoAnual, setModoAnual] = useState(false);

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = FONT_URL;
    document.head.appendChild(l);
  }, []);

  const mesesDisponiveis = MESES.map((m,i) => ({ label:m, idx:i })).filter(m => (VALORES["Receita de Vendas"][m.idx]||0) > 0);

  const TABS = [
    { id:"overview", label:"Visão Geral" },
    { id:"dre",      label:"DRE" },
    { id:"dfc",      label:"DFC" },
  ];

  return (
    <div style={{ background:C.gray50, minHeight:"100vh", fontFamily:"'Barlow',sans-serif" }}>
      {/* HEADER */}
      <div style={{ background:C.white, borderBottom:`2px solid ${C.red}`, padding:"0 28px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:56 }}>
          <Logo />

          {/* TABS */}
          <div style={{ display:"flex", gap:2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? C.red : "transparent",
                color: tab === t.id ? C.white : C.gray500,
                border:"none", borderRadius:4,
                padding:"6px 18px", cursor:"pointer",
                fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1,
                textTransform:"uppercase", transition:"all 0.15s"
              }}>{t.label}</button>
            ))}
          </div>

          {/* CONTROLES */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Filial */}
            <select value={filial} onChange={e => setFilial(e.target.value)} style={{
              border:`1px solid ${C.border}`, borderRadius:4, padding:"5px 10px",
              fontFamily:"'Barlow',sans-serif", fontSize:12, color:C.dark, background:C.white, cursor:"pointer"
            }}>
              {["Consolidado","Fibra","Químicos"].map(f => <option key={f}>{f}</option>)}
            </select>

            {/* Mês */}
            <select value={mesSel} onChange={e => setMesSel(Number(e.target.value))} style={{
              border:`1px solid ${C.border}`, borderRadius:4, padding:"5px 10px",
              fontFamily:"'Barlow',sans-serif", fontSize:12, color:C.dark, background:C.white, cursor:"pointer"
            }}>
              {mesesDisponiveis.map(m => <option key={m.idx} value={m.idx}>{m.label}/2025</option>)}
            </select>

            {/* Toggle anual (só DRE/DFC) */}
            {(tab === "dre" || tab === "dfc") && (
              <button onClick={() => setModoAnual(!modoAnual)} style={{
                background: modoAnual ? C.dark : C.white,
                color: modoAnual ? C.white : C.gray500,
                border:`1px solid ${C.border}`, borderRadius:4,
                padding:"5px 12px", cursor:"pointer",
                fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, letterSpacing:1
              }}>
                {modoAnual ? "▤ ANUAL" : "▤ MENSAL"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BREADCRUMB */}
      <div style={{ background:C.dark, padding:"6px 28px", display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ color:C.gray300, fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1 }}>2025</span>
        <span style={{ color:C.gray500, fontSize:11 }}>›</span>
        <span style={{ color:C.gray300, fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1 }}>{filial.toUpperCase()}</span>
        <span style={{ color:C.gray500, fontSize:11 }}>›</span>
        <span style={{ color:C.red, fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:1 }}>{MESES[mesSel].toUpperCase()}</span>
        <span style={{ marginLeft:"auto", color:C.gray600, fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>
          🔴 DEMO — substituir por fetch ao Web App
        </span>
      </div>

      {/* CONTEÚDO */}
      <div style={{ padding:"24px 28px", maxWidth:1280, margin:"0 auto" }}>
        {tab === "overview" && <OverviewView mesSel={mesSel} />}

        {tab === "dre" && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
            <TabelaFinanceira
              rows={DRE_ROWS}
              mesSel={mesSel}
              titulo="DRE — 2025"
              mostrarAno={modoAnual}
            />
          </div>
        )}

        {tab === "dfc" && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
            <TabelaFinanceira
              rows={DFC_ROWS}
              mesSel={mesSel}
              titulo="DFC — 2025"
              mostrarAno={modoAnual}
            />
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ borderTop:`1px solid ${C.border}`, padding:"12px 28px", display:"flex", justifyContent:"space-between", background:C.white }}>
        <span style={{ fontSize:11, color:C.gray500, fontFamily:"'Barlow',sans-serif" }}>Tech4Con Produtos para Construção Civil LTDA · CNPJ 33.577.286/0001-21</span>
        <span style={{ fontSize:11, color:C.gray500, fontFamily:"'JetBrains Mono',monospace" }}>Fonte: Omie API via Google App Script</span>
      </div>
    </div>
  );
}
