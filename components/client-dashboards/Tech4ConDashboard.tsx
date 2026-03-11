import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ─── FONTES ───────────────────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbx-VAR5oGvAaAeeNS2M3D6X5z88QMnJ-XQE3C-CjghVFRYa8ZJmhib9UNbRwmlPjt4I/exec";

// ─── LOGO DO CLIENTE ──────────────────────────────────────────────────────────
const LOGO_URL = "/logos/tech4con.png";

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

// ─── MESES ────────────────────────────────────────────────────────────────────
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MESES_CURTO = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ─── ESTRUTURA DRE (ATUALIZADA COM TODAS AS CONTAS) ──────────────────────────
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
  // ─── RECEITAS FINANCEIRAS ───
  { key: "Receitas Financeiras", nivel: 0, tipo: "subtotal" },
  { key: "Depósitos Judiciais", nivel: 1 },
  { key: "Outras receitas financeiras", nivel: 1 },
  { key: "Receita sob mudança cambio", nivel: 1 },
  { key: "Receita sobre Aplicações (Fundos de Recebiveis e Inve", nivel: 1 },
  { key: "Receita sobre Aplicações (Renda Fixa)", nivel: 1 },
  { key: "Valorização ativo", nivel: 1 },
  { key: "Ganho de Capital - Imobilizado", nivel: 1 },
  // ─── DESPESAS FINANCEIRAS ───
  { key: "Despesas Financeiras", nivel: 0, tipo: "subtotal" },
  { key: "Depreciação", nivel: 1 },
  { key: "Despesas bancárias", nivel: 1 },
  { key: "Despesas sob mudança cambio", nivel: 1 },
  { key: "IR sobre aplicações - Renda Fixa", nivel: 1 },
  { key: "IR sobre aplicações - Renda Variável", nivel: 1 },
  { key: "Juros e multas", nivel: 1 },
  { key: "Outras despesas financeiras", nivel: 1 },
  { key: "Prejuízo sobre Aplicações (Fundos de Recebiveis e Inve", nivel: 1 },
  { key: "Título de Capitalização", nivel: 1 },
  // ─── RESULTADOS FINAIS ───
  { key: "Resultado operacional bruto", nivel: 0, tipo: "resultado" },
  { key: "Impostos Sob Lucro", nivel: 0, tipo: "subtotal" },
  { key: "CSLL", nivel: 1 },
  { key: "IRPJ", nivel: 1 },
  { key: "Resultado operacional líquido", nivel: 0, tipo: "resultado" },
  { key: "Distribuição de Lucro", nivel: 0, tipo: "subtotal" },
  { key: "Distribuição de lucro", nivel: 1 },
  { key: "Gratificações a funcionários", nivel: 1 },
  { key: "Resultado pós distribuição de lucros", nivel: 0, tipo: "destaque" },
  { key: "Investimentos e Financiamentos", nivel: 0, tipo: "subtotal" },
  { key: "Compra de Ativo Imobilizado", nivel: 1 },
  { key: "Empréstimos e Financiamentos (Saída)", nivel: 1 },
  { key: "Resultado após Capex & Endividamento", nivel: 0, tipo: "destaque" },
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
  { key: "Investimentos e Financiamentos", nivel: 0, tipo: "subtotal" },
  { key: "Compra de Ativo Imobilizado", nivel: 1 },
  { key: "Empréstimos e Financiamentos (Saída)", nivel: 1 },
  { key: "Resultado após Capex & Endividamento", nivel: 0, tipo: "destaque" },
];

// ─── COMPONENTES ──────────────────────────────────────────────────────────────

function Logo() {
  return (
    <img 
      src={LOGO_URL} 
      alt="Tech4Con" 
      style={{ 
        height: 40, 
        maxWidth: 150, 
        objectFit: "contain" 
      }} 
    />
  );
}

function LoadingSpinner() {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center", 
      justifyContent: "center", 
      padding: "60px 20px",
      gap: 16
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: `3px solid ${C.gray100}`,
        borderTopColor: C.red,
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />
      <span style={{ color: C.gray500, fontSize: 14, fontFamily: "'Barlow', sans-serif" }}>
        Carregando dados...
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center", 
      justifyContent: "center", 
      padding: "60px 20px",
      gap: 16
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: C.redLight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <span style={{ color: C.red, fontSize: 24 }}>!</span>
      </div>
      <span style={{ color: C.gray700, fontSize: 14, fontFamily: "'Barlow', sans-serif", textAlign: "center" }}>
        {message}
      </span>
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            background: C.red,
            color: C.white,
            border: "none",
            borderRadius: 4,
            padding: "8px 20px",
            cursor: "pointer",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: 13
          }}
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

function KPICard({ label, valor, percentual, cor, small = false }: { 
  label: string; 
  valor: number; 
  percentual?: number; 
  cor?: string; 
  small?: boolean 
}) {
  return (
    <div style={{
      background: cor ? `${cor}11` : C.white,
      border: `1px solid ${cor || C.border}`,
      borderRadius: 8,
      padding: small ? "12px 16px" : "16px 20px",
      minWidth: small ? 140 : 160,
      flex: 1
    }}>
      <div style={{
        fontFamily: "'Barlow Condensed',sans-serif",
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: 1,
        color: cor || C.gray500,
        textTransform: "uppercase",
        marginBottom: 6
      }}>{label}</div>
      <div style={{
        fontFamily: "'Barlow',sans-serif",
        fontWeight: 700,
        fontSize: small ? 18 : 22,
        color: C.dark
      }}>{fmtBRL(valor)}</div>
      {percentual !== undefined && (
        <div style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 11,
          color: C.gray500,
          marginTop: 4
        }}>{percentual.toFixed(2).replace(".",",")}%</div>
      )}
    </div>
  );
}

function TabelaFinanceira({ rows, dados, mesInicial, mesFinal, titulo, mostrarAno }: {
  rows: Array<{ key: string; nivel: number; tipo?: string }>;
  dados: any;
  mesInicial: number;
  mesFinal: number;
  titulo: string;
  mostrarAno: boolean;
}) {
  if (!dados || !dados.contas) return <LoadingSpinner />;

  const getValor = (key: string, mesIdx: number): number => {
    const conta = dados.contas[key];
    if (!conta || !conta.valores) return 0;
    return conta.valores[mesIdx] || 0;
  };

  const getValorPeriodo = (key: string): number => {
    const conta = dados.contas[key];
    if (!conta || !conta.valores) return 0;
    let soma = 0;
    for (let i = mesInicial; i <= mesFinal; i++) {
      soma += conta.valores[i] || 0;
    }
    return soma;
  };

  const getAnual = (key: string): number => {
    const conta = dados.contas[key];
    if (!conta || !conta.valores) return 0;
    return conta.valores.reduce((a: number, b: number) => a + b, 0);
  };

  // Calcular percentual do período
  const receitaPeriodo = getValorPeriodo("Receita de Vendas");
  const getPctPeriodo = (valor: number): number => {
    if (!receitaPeriodo) return 0;
    return (valor / receitaPeriodo) * 100;
  };

  // Filtrar rows que existem nos dados (para não mostrar linhas vazias que não existem na planilha)
  const rowsExistentes = rows.filter(row => {
    const conta = dados.contas[row.key];
    // Mostrar se a conta existe OU se é um totalizador importante
    if (conta) return true;
    // Sempre mostrar totalizadores principais mesmo sem dados
    const totalizadores = [
      "Receita de Vendas", "Receita líquida", "Margem bruta", 
      "Margem líquida (margem de contribuição)", "Ebitda",
      "Resultado operacional bruto", "Resultado operacional líquido",
      "Resultado pós distribuição de lucros", "Resultado após Capex"
    ];
    return totalizadores.includes(row.key);
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Barlow',sans-serif" }}>
        <thead>
          <tr style={{ background: C.dark }}>
            <th style={{ padding: "10px 12px", textAlign: "left", color: C.white, fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>
              {titulo}
            </th>
            {mostrarAno ? (
              <>
                {MESES_CURTO.map((m, i) => (
                  <th key={m} style={{ 
                    padding: "10px 8px", 
                    textAlign: "right", 
                    color: C.white, 
                    fontWeight: 600, 
                    fontSize: 11,
                    background: (i >= mesInicial && i <= mesFinal) ? C.redDark : C.dark
                  }}>{m}</th>
                ))}
                <th style={{ padding: "10px 8px", textAlign: "right", color: C.red, fontWeight: 700, fontSize: 11 }}>TOTAL</th>
              </>
            ) : (
              <>
                <th style={{ padding: "10px 12px", textAlign: "right", color: C.white, fontWeight: 600, fontSize: 11, minWidth: 100 }}>VALOR</th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: C.white, fontWeight: 600, fontSize: 11, minWidth: 70 }}>%</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rowsExistentes.map((row, idx) => {
            const valorPeriodo = getValorPeriodo(row.key);
            const pctPeriodo = getPctPeriodo(valorPeriodo);
            const isDestaque = row.tipo === "destaque";
            const isResultado = row.tipo === "resultado";
            const isSubtotal = row.tipo === "subtotal";
            const isTotal = row.tipo === "total";

            let bg = idx % 2 === 0 ? C.white : C.gray50;
            if (isDestaque) bg = C.redLight;
            else if (isResultado) bg = C.blueLight;
            else if (isTotal) bg = C.greenLight;

            const fontWeight = (isDestaque || isResultado || isSubtotal || isTotal) ? 700 : 400;
            const paddingLeft = 12 + (row.nivel || 0) * 16;

            return (
              <tr key={row.key} style={{ background: bg }}>
                <td style={{ 
                  padding: `8px 12px 8px ${paddingLeft}px`, 
                  fontWeight, 
                  color: isDestaque ? C.redDark : C.dark,
                  borderBottom: `1px solid ${C.gray100}`
                }}>
                  {row.key}
                </td>
                {mostrarAno ? (
                  <>
                    {MESES_CURTO.map((_, i) => {
                      const val = getValor(row.key, i);
                      return (
                        <td key={i} style={{ 
                          padding: "8px", 
                          textAlign: "right", 
                          fontFamily: "'JetBrains Mono',monospace", 
                          fontSize: 11,
                          color: val < 0 ? C.red : C.dark,
                          borderBottom: `1px solid ${C.gray100}`,
                          background: (i >= mesInicial && i <= mesFinal) ? `${C.red}08` : "transparent"
                        }}>
                          {fmtK(val)}
                        </td>
                      );
                    })}
                    <td style={{ 
                      padding: "8px", 
                      textAlign: "right", 
                      fontFamily: "'JetBrains Mono',monospace", 
                      fontSize: 11,
                      fontWeight: 700,
                      color: getAnual(row.key) < 0 ? C.red : C.dark,
                      borderBottom: `1px solid ${C.gray100}`
                    }}>
                      {fmtK(getAnual(row.key))}
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ 
                      padding: "8px 12px", 
                      textAlign: "right", 
                      fontFamily: "'JetBrains Mono',monospace",
                      color: valorPeriodo < 0 ? C.red : C.dark,
                      fontWeight,
                      borderBottom: `1px solid ${C.gray100}`
                    }}>
                      {fmtBRL(valorPeriodo)}
                    </td>
                    <td style={{ 
                      padding: "8px 12px", 
                      textAlign: "right", 
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 12,
                      color: C.gray500,
                      borderBottom: `1px solid ${C.gray100}`
                    }}>
                      {pctPeriodo.toFixed(2).replace(".",",")}%
                    </td>
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

function OverviewView({ dados, mesInicial, mesFinal }: { dados: any; mesInicial: number; mesFinal: number }) {
  if (!dados || !dados.dre || !dados.dre.contas) return <LoadingSpinner />;

  // Soma valores do período selecionado
  const getValorPeriodo = (key: string): number => {
    const conta = dados.dre.contas[key];
    if (!conta || !conta.valores) return 0;
    let soma = 0;
    for (let i = mesInicial; i <= mesFinal; i++) {
      soma += conta.valores[i] || 0;
    }
    return soma;
  };

  const getValor = (key: string, idx: number): number => {
    const conta = dados.dre.contas[key];
    if (!conta || !conta.valores) return 0;
    return conta.valores[idx] || 0;
  };

  // KPIs do período
  const receitaPeriodo = getValorPeriodo("Receita de Vendas");
  const margemBrutaPeriodo = getValorPeriodo("Margem bruta");
  const margemContribPeriodo = getValorPeriodo("Margem líquida (margem de contribuição)");
  const ebitdaPeriodo = getValorPeriodo("Ebitda");
  const gastosFixosPeriodo = getValorPeriodo("Gastos fixos (custos fixos + despesas fixas)");
  
  // Lucro Líquido = Resultado operacional líquido (agora vem da API)
  const lucroLiqPeriodo = getValorPeriodo("Resultado operacional líquido");

  const pctMargemBruta = receitaPeriodo ? (margemBrutaPeriodo / receitaPeriodo) * 100 : 0;
  const pctMargemContrib = receitaPeriodo ? (margemContribPeriodo / receitaPeriodo) * 100 : 0;
  const pctEbitda = receitaPeriodo ? (ebitdaPeriodo / receitaPeriodo) * 100 : 0;
  const pctLucro = receitaPeriodo ? (lucroLiqPeriodo / receitaPeriodo) * 100 : 0;

  // Ponto de equilíbrio
  const pontoEquilibrio = pctMargemContrib > 0 ? (Math.abs(gastosFixosPeriodo) / (pctMargemContrib / 100)) : 0;

  // Dados para gráficos (todos os meses)
  const chartData = MESES_CURTO.map((m, i) => ({
    mes: m,
    Receita: getValor("Receita de Vendas", i),
    EBITDA: getValor("Ebitda", i),
    MargemBruta: getValor("Margem bruta", i),
    inRange: i >= mesInicial && i <= mesFinal
  }));

  // Dados do pie apenas do período
  const pieData = [
    { name: "Custo Produtos", value: Math.abs(getValorPeriodo("Custo dos Produtos Vendidos")) },
    { name: "Despesas Variáveis", value: Math.abs(getValorPeriodo("Despesas Variáveis")) },
    { name: "Gastos Fixos", value: Math.abs(gastosFixosPeriodo) },
    { name: "Lucro", value: Math.max(0, lucroLiqPeriodo) },
  ].filter(d => d.value > 0);

  const PIE_COLORS = [C.red, C.orange, C.blue, C.green];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: {fmtBRL(p.value)}
          </div>
        ))}
      </div>
    );
  };

  // Label do período
  const periodoLabel = mesInicial === mesFinal 
    ? MESES[mesInicial] 
    : `${MESES_CURTO[mesInicial]} a ${MESES_CURTO[mesFinal]}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Faturamento" valor={receitaPeriodo} percentual={100} cor={C.blue} small={false} />
        <KPICard label="Margem Bruta" valor={margemBrutaPeriodo} percentual={pctMargemBruta} cor={C.gold} small={false} />
        <KPICard label="Margem Contrib." valor={margemContribPeriodo} percentual={pctMargemContrib} cor={C.orange} small={false} />
        <KPICard label="EBITDA" valor={ebitdaPeriodo} percentual={pctEbitda} cor={C.red} small={false} />
        <KPICard label="Lucro Líquido" valor={lucroLiqPeriodo} percentual={pctLucro} cor={C.green} small={false} />
        <KPICard label="Ponto Equilíbrio" valor={pontoEquilibrio} percentual={receitaPeriodo ? (pontoEquilibrio/receitaPeriodo)*100 : 0} cor={C.gray700} small={false} />
      </div>

      {/* Gráficos */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, color: C.dark, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 14, background: C.blue, borderRadius: 2, display: "inline-block" }}></span>
            Faturamento Mensal
            <span style={{ marginLeft: "auto", fontSize: 10, color: C.gray500, fontWeight: 400 }}>
              Período selecionado em destaque
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.gray100} />
              <XAxis dataKey="mes" tick={{ fill: C.gray500, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} tick={{ fill: C.gray500, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Receita" stroke={C.blue} strokeWidth={2} fill="url(#colorReceita)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, color: C.dark, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 14, background: C.gold, borderRadius: 2, display: "inline-block" }}></span>
            Composição — {periodoLabel}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={45} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => fmtBRL(v)} contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Barlow',sans-serif" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, color: C.dark, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 3, height: 14, background: C.red, borderRadius: 2, display: "inline-block" }}></span>
          EBITDA Mensal
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.gray100} />
            <XAxis dataKey="mes" tick={{ fill: C.gray500, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} tick={{ fill: C.gray500, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="EBITDA" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell 
                  key={i} 
                  fill={d.EBITDA < 0 ? C.red : (d.inRange ? C.blue : C.gray300)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("overview");
  const [mesInicial, setMesInicial] = useState(0);
  const [mesFinal, setMesFinal] = useState(0);
  const [filial, setFilial] = useState("Consolidado");
  const [ano, setAno] = useState(2026);
  const [modoAnual, setModoAnual] = useState(false);

  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  // Carregar fonte
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = FONT_URL;
    document.head.appendChild(l);
  }, []);

  // Buscar dados da API
  const fetchDados = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_URL}?ano=${ano}&filial=${encodeURIComponent(filial)}`;
      const response = await fetch(url);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || "Erro ao carregar dados");
      }

      setDados(json);
      setUltimaAtualizacao(new Date(json.atualizadoEm));
    } catch (err: any) {
      setError(err.message || "Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, [ano, filial]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  // Meses disponíveis (com dados)
  const mesesDisponiveis = MESES.map((m, i) => ({ label: m, idx: i })).filter(m => {
    if (!dados || !dados.dre || !dados.dre.contas) return false;
    const receita = dados.dre.contas["Receita de Vendas"];
    return receita && receita.valores && receita.valores[m.idx] > 0;
  });

  // Ajustar meses selecionados quando dados carregam
  useEffect(() => {
    if (mesesDisponiveis.length > 0) {
      // Se mesInicial não está disponível, ajusta pro primeiro disponível
      if (!mesesDisponiveis.find(m => m.idx === mesInicial)) {
        setMesInicial(mesesDisponiveis[0].idx);
      }
      // Se mesFinal não está disponível ou é menor que mesInicial, ajusta pro último disponível
      if (!mesesDisponiveis.find(m => m.idx === mesFinal) || mesFinal < mesInicial) {
        setMesFinal(mesesDisponiveis[mesesDisponiveis.length - 1].idx);
      }
    }
  }, [mesesDisponiveis]);

  // Garantir que mesFinal >= mesInicial
  useEffect(() => {
    if (mesFinal < mesInicial) {
      setMesFinal(mesInicial);
    }
  }, [mesInicial, mesFinal]);

  const TABS = [
    { id: "overview", label: "Visão Geral" },
    { id: "dre", label: "DRE" },
    { id: "dfc", label: "DFC" },
  ];

  // Label do período para o breadcrumb
  const periodoLabel = mesInicial === mesFinal 
    ? MESES[mesInicial]?.toUpperCase() || "-"
    : `${MESES_CURTO[mesInicial]?.toUpperCase() || "-"} A ${MESES_CURTO[mesFinal]?.toUpperCase() || "-"}`;

  return (
    <div style={{ background: C.gray50, minHeight: "100vh", fontFamily: "'Barlow',sans-serif" }}>
      {/* HEADER */}
      <div style={{ background: C.white, borderBottom: `2px solid ${C.red}`, padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <Logo />

          {/* TABS */}
          <div style={{ display: "flex", gap: 2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? C.red : "transparent",
                color: tab === t.id ? C.white : C.gray500,
                border: "none", borderRadius: 4,
                padding: "6px 18px", cursor: "pointer",
                fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1,
                textTransform: "uppercase", transition: "all 0.15s"
              }}>{t.label}</button>
            ))}
          </div>

          {/* CONTROLES */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Ano */}
            <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{
              border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 10px",
              fontFamily: "'Barlow',sans-serif", fontSize: 12, color: C.dark, background: C.white, cursor: "pointer"
            }}>
              {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            {/* Filial */}
            <select value={filial} onChange={e => setFilial(e.target.value)} style={{
              border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 10px",
              fontFamily: "'Barlow',sans-serif", fontSize: 12, color: C.dark, background: C.white, cursor: "pointer"
            }}>
              {["Consolidado", "Fibra", "Químicos"].map(f => <option key={f}>{f}</option>)}
            </select>

            {/* Separador */}
            <span style={{ color: C.gray300, fontSize: 12 }}>|</span>

            {/* Mês Inicial */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: C.gray500, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}>DE</span>
              <select 
                value={mesInicial} 
                onChange={e => setMesInicial(Number(e.target.value))} 
                disabled={mesesDisponiveis.length === 0} 
                style={{
                  border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 8px",
                  fontFamily: "'Barlow',sans-serif", fontSize: 12, color: C.dark, background: C.white, cursor: "pointer",
                  opacity: mesesDisponiveis.length === 0 ? 0.5 : 1
                }}
              >
                {mesesDisponiveis.length > 0 ? (
                  mesesDisponiveis.map(m => <option key={m.idx} value={m.idx}>{m.label}</option>)
                ) : (
                  <option>-</option>
                )}
              </select>
            </div>

            {/* Mês Final */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: C.gray500, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}>ATÉ</span>
              <select 
                value={mesFinal} 
                onChange={e => setMesFinal(Number(e.target.value))} 
                disabled={mesesDisponiveis.length === 0} 
                style={{
                  border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 8px",
                  fontFamily: "'Barlow',sans-serif", fontSize: 12, color: C.dark, background: C.white, cursor: "pointer",
                  opacity: mesesDisponiveis.length === 0 ? 0.5 : 1
                }}
              >
                {mesesDisponiveis.length > 0 ? (
                  mesesDisponiveis.filter(m => m.idx >= mesInicial).map(m => <option key={m.idx} value={m.idx}>{m.label}</option>)
                ) : (
                  <option>-</option>
                )}
              </select>
            </div>

            {/* Toggle anual (só DRE/DFC) */}
            {(tab === "dre" || tab === "dfc") && (
              <button onClick={() => setModoAnual(!modoAnual)} style={{
                background: modoAnual ? C.dark : C.white,
                color: modoAnual ? C.white : C.gray500,
                border: `1px solid ${C.border}`, borderRadius: 4,
                padding: "5px 12px", cursor: "pointer",
                fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1
              }}>
                {modoAnual ? "▤ ANUAL" : "▤ MENSAL"}
              </button>
            )}

            {/* Botão atualizar */}
            <button onClick={fetchDados} disabled={loading} style={{
              background: C.white,
              color: loading ? C.gray300 : C.gray500,
              border: `1px solid ${C.border}`, borderRadius: 4,
              padding: "5px 10px", cursor: loading ? "default" : "pointer",
              fontFamily: "'Barlow',sans-serif", fontSize: 12
            }}>
              {loading ? "..." : "↻"}
            </button>
          </div>
        </div>
      </div>

      {/* BREADCRUMB */}
      <div style={{ background: C.dark, padding: "6px 28px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: C.gray300, fontSize: 11, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}>{ano}</span>
        <span style={{ color: C.gray500, fontSize: 11 }}>›</span>
        <span style={{ color: C.gray300, fontSize: 11, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}>{filial.toUpperCase()}</span>
        <span style={{ color: C.gray500, fontSize: 11 }}>›</span>
        <span style={{ color: C.red, fontSize: 11, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 1 }}>
          {periodoLabel}
        </span>
        <span style={{ marginLeft: "auto", color: C.gray500, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
          {loading ? "Carregando..." : (
            ultimaAtualizacao ? `Atualizado: ${ultimaAtualizacao.toLocaleTimeString("pt-BR")}` : ""
          )}
        </span>
      </div>

      {/* CONTEÚDO */}
      <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
        {error ? (
          <ErrorMessage message={error} onRetry={fetchDados} />
        ) : loading && !dados ? (
          <LoadingSpinner />
        ) : (
          <>
            {tab === "overview" && <OverviewView dados={dados} mesInicial={mesInicial} mesFinal={mesFinal} />}

            {tab === "dre" && (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <TabelaFinanceira
                  rows={DRE_ROWS}
                  dados={dados?.dre}
                  mesInicial={mesInicial}
                  mesFinal={mesFinal}
                  titulo={`DRE — ${ano} — ${periodoLabel}`}
                  mostrarAno={modoAnual}
                />
              </div>
            )}

            {tab === "dfc" && (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <TabelaFinanceira
                  rows={DFC_ROWS}
                  dados={dados?.dfc}
                  mesInicial={mesInicial}
                  mesFinal={mesFinal}
                  titulo={`DFC — ${ano} — ${periodoLabel}`}
                  mostrarAno={modoAnual}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 28px", display: "flex", justifyContent: "space-between", background: C.white }}>
        <span style={{ fontSize: 11, color: C.gray500, fontFamily: "'Barlow',sans-serif" }}>
          Tech4Con Produtos para Construção Civil LTDA · CNPJ 33.577.286/0001-21
        </span>
        <span style={{ fontSize: 11, color: C.gray500, fontFamily: "'JetBrains Mono',monospace" }}>
          Fonte: Omie API via Google Sheets
        </span>
      </div>
    </div>
  );
}
