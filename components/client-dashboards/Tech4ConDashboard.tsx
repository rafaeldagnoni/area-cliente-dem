import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ─── FONTES ───────────────────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap";

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbx-VAR5oGvAaAeeNS2M3D6X5z88QMnJ-XQE3C-CjghVFRYa8ZJmhib9UNbRwmlPjt4I/exec";

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
  { key: "Ebitda", nivel: 0, tipo: "destaque" },
  { key: "Receitas Financeiras", nivel: 1 },
  { key: "Despesas Financeiras", nivel: 1 },
  { key: "Resultado operacional bruto", nivel: 0, tipo: "resultado" },
  { key: "Impostos Sob Lucro", nivel: 1 },
  { key: "Resultado operacional líquido", nivel: 0, tipo: "resultado" },
  { key: "Distribuição de Lucro", nivel: 1 },
  { key: "Resultado pós distribuição de lucros", nivel: 0, tipo: "destaque" },
  { key: "Investimentos e Financiamentos", nivel: 0, tipo: "subtotal" },
  { key: "Resultado após Capex", nivel: 0, tipo: "destaque" },
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
  { key: "Receitas Financeiras", nivel: 1 },
  { key: "Despesas Financeiras", nivel: 1 },
  { key: "Resultado operacional bruto", nivel: 0, tipo: "resultado" },
  { key: "Impostos Sob Lucro", nivel: 1 },
  { key: "Resultado operacional líquido", nivel: 0, tipo: "resultado" },
  { key: "Distribuição de Lucro", nivel: 1 },
  { key: "Resultado pós distribuição de lucros", nivel: 0, tipo: "destaque" },
  { key: "Investimentos e Financiamentos", nivel: 0, tipo: "subtotal" },
  { key: "Compra de Ativo Imobilizado", nivel: 1 },
  { key: "Empréstimos e Financiamentos (Saída)", nivel: 1 },
  { key: "Resultado após Capex", nivel: 0, tipo: "destaque" },
];

// ─── COMPONENTES ──────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <svg width="32" height="32" viewBox="0 0 100 100">
        <polygon points="25,15 50,85 40,85 15,15" fill={C.red}/>
        <polygon points="35,15 60,85 50,85 25,15" fill={C.redDark} fillOpacity="0.7"/>
        <rect x="55" y="15" width="12" height="70" fill={C.black}/>
        <rect x="72" y="15" width="12" height="70" fill={C.black}/>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", lineHeight:1 }}>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:18, color:C.black, letterSpacing:2 }}>TECH</span>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:18, color:C.red, letterSpacing:2 }}>4CON</span>
      </div>
    </div>
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

function ErrorMessage({ message, onRetry }) {
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

function KPICard({ label, valor, percentual, cor, small }) {
  return (
    <div style={{
      background: cor ? `${cor}11` : C.white,
      border: `1px solid ${cor || C.border}`,
      borderRadius: 8,
      padding: small ? "12px 16px" : "16px 20px",
      minWidth: small ? 140 : 160
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

function TabelaFinanceira({ rows, dados, mesSel, titulo, mostrarAno }) {
  if (!dados || !dados.contas) return <LoadingSpinner />;

  const getValor = (key, mesIdx) => {
    const conta = dados.contas[key];
    if (!conta || !conta.valores) return 0;
    return conta.valores[mesIdx] || 0;
  };

  const getPct = (key, mesIdx) => {
    const conta = dados.contas[key];
    if (!conta || !conta.percentuais) return 0;
    return conta.percentuais[mesIdx] || 0;
  };

  const getAnual = (key) => {
    const conta = dados.contas[key];
    if (!conta || !conta.valores) return 0;
    return conta.valores.reduce((a, b) => a + b, 0);
  };

  const receita = getValor("Receita de Vendas", mesSel);

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
                {MESES_CURTO.map(m => (
                  <th key={m} style={{ padding: "10px 8px", textAlign: "right", color: C.white, fontWeight: 600, fontSize: 11 }}>{m}</th>
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
          {rows.map((row, idx) => {
            const valor = getValor(row.key, mesSel);
            const pct = getPct(row.key, mesSel);
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
                    {MESES_CURTO.map((_, i) => (
                      <td key={i} style={{ 
                        padding: "8px", 
                        textAlign: "right", 
                        fontFamily: "'JetBrains Mono',monospace", 
                        fontSize: 11,
                        color: getValor(row.key, i) < 0 ? C.red : C.dark,
                        borderBottom: `1px solid ${C.gray100}`
                      }}>
                        {fmtK(getValor(row.key, i))}
                      </td>
                    ))}
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
                      color: valor < 0 ? C.red : C.dark,
                      fontWeight,
                      borderBottom: `1px solid ${C.gray100}`
                    }}>
                      {fmtBRL(valor)}
                    </td>
                    <td style={{ 
                      padding: "8px 12px", 
                      textAlign: "right", 
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 12,
                      color: C.gray500,
                      borderBottom: `1px solid ${C.gray100}`
                    }}>
                      {pct.toFixed(2).replace(".",",")}%
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

function OverviewView({ dados, mesSel }) {
  if (!dados || !dados.dre || !dados.dre.contas) return <LoadingSpinner />;

  const getValor = (key, idx) => {
    const conta = dados.dre.contas[key];
    if (!conta || !conta.valores) return 0;
    return conta.valores[idx] || 0;
  };

  const receitaAtual = getValor("Receita de Vendas", mesSel);
  const margemBruta = getValor("Margem bruta", mesSel);
  const margemContrib = getValor("Margem líquida (margem de contribuição)", mesSel);
  const ebitda = getValor("Ebitda", mesSel);
  const lucroLiq = getValor("Resultado operacional líquido", mesSel);

  const pctMargemBruta = receitaAtual ? (margemBruta / receitaAtual) * 100 : 0;
  const pctMargemContrib = receitaAtual ? (margemContrib / receitaAtual) * 100 : 0;
  const pctEbitda = receitaAtual ? (ebitda / receitaAtual) * 100 : 0;
  const pctLucro = receitaAtual ? (lucroLiq / receitaAtual) * 100 : 0;

  // Ponto de equilíbrio
  const gastosFixos = getValor("Gastos fixos (custos fixos + despesas fixas)", mesSel);
  const pontoEquilibrio = pctMargemContrib > 0 ? (gastosFixos / (pctMargemContrib / 100)) : 0;

  // Dados para gráficos
  const chartData = MESES_CURTO.map((m, i) => ({
    mes: m,
    Receita: getValor("Receita de Vendas", i),
    EBITDA: getValor("Ebitda", i),
    MargemBruta: getValor("Margem bruta", i),
  }));

  const pieData = [
    { name: "Custo Produtos", value: Math.abs(getValor("Custo dos Produtos Vendidos", mesSel)) },
    { name: "Despesas Variáveis", value: Math.abs(getValor("Despesas Variáveis", mesSel)) },
    { name: "Gastos Fixos", value: Math.abs(gastosFixos) },
    { name: "Lucro", value: Math.max(0, lucroLiq) },
  ].filter(d => d.value > 0);

  const PIE_COLORS = [C.red, C.orange, C.blue, C.green];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: {fmtBRL(p.value)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="Faturamento" valor={receitaAtual} percentual={100} cor={C.blue} small={false} />
        <KPICard label="Margem Bruta" valor={margemBruta} percentual={pctMargemBruta} cor={C.gold} small={false} />
        <KPICard label="Margem Contrib." valor={margemContrib} percentual={pctMargemContrib} cor={C.orange} small={false} />
        <KPICard label="EBITDA" valor={ebitda} percentual={pctEbitda} cor={C.red} small={false} />
        <KPICard label="Lucro Líquido" valor={lucroLiq} percentual={pctLucro} cor={C.green} small={false} />
        <KPICard label="Ponto Equilíbrio" valor={pontoEquilibrio} percentual={(pontoEquilibrio/receitaAtual)*100 || 0} cor={C.gray700} small={false} />
      </div>

      {/* Gráficos */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, color: C.dark, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 14, background: C.blue, borderRadius: 2, display: "inline-block" }}></span>
            Faturamento Mensal
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
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fill: C.gray500, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Receita" stroke={C.blue} strokeWidth={2} fill="url(#colorReceita)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, color: C.dark, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 14, background: C.gold, borderRadius: 2, display: "inline-block" }}></span>
            Composição {MESES[mesSel]}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={45} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmtBRL(v)} contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }} />
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
            <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fill: C.gray500, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="EBITDA" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => <Cell key={i} fill={d.EBITDA < 0 ? C.red : C.blue} />)}
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
  const [mesSel, setMesSel] = useState(0);
  const [filial, setFilial] = useState("Consolidado");
  const [ano, setAno] = useState(2026);
  const [modoAnual, setModoAnual] = useState(false);

  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

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
    } catch (err) {
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

  // Ajustar mês selecionado se necessário
  useEffect(() => {
    if (mesesDisponiveis.length > 0 && !mesesDisponiveis.find(m => m.idx === mesSel)) {
      setMesSel(mesesDisponiveis[0].idx);
    }
  }, [mesesDisponiveis, mesSel]);

  const TABS = [
    { id: "overview", label: "Visão Geral" },
    { id: "dre", label: "DRE" },
    { id: "dfc", label: "DFC" },
  ];

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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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

            {/* Mês */}
            <select value={mesSel} onChange={e => setMesSel(Number(e.target.value))} disabled={mesesDisponiveis.length === 0} style={{
              border: `1px solid ${C.border}`, borderRadius: 4, padding: "5px 10px",
              fontFamily: "'Barlow',sans-serif", fontSize: 12, color: C.dark, background: C.white, cursor: "pointer",
              opacity: mesesDisponiveis.length === 0 ? 0.5 : 1
            }}>
              {mesesDisponiveis.length > 0 ? (
                mesesDisponiveis.map(m => <option key={m.idx} value={m.idx}>{m.label}</option>)
              ) : (
                <option>-</option>
              )}
            </select>

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
          {mesesDisponiveis.length > 0 ? MESES[mesSel].toUpperCase() : "-"}
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
            {tab === "overview" && <OverviewView dados={dados} mesSel={mesSel} />}

            {tab === "dre" && (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <TabelaFinanceira
                  rows={DRE_ROWS}
                  dados={dados?.dre}
                  mesSel={mesSel}
                  titulo={`DRE — ${ano}`}
                  mostrarAno={modoAnual}
                />
              </div>
            )}

            {tab === "dfc" && (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <TabelaFinanceira
                  rows={DFC_ROWS}
                  dados={dados?.dfc}
                  mesSel={mesSel}
                  titulo={`DFC — ${ano}`}
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
