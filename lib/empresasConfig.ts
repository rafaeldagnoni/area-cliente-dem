// ─── LOGO DM (COMPARTILHADO) ──────────────────────────────────────────────────
const LOGO_DM_URL = "/logo-dm.png";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://qzqaagsbjfsdoxcvhqpc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cWFhZ3NiamZzZG94Y3ZocXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTg2NTIsImV4cCI6MjA4ODEzNDY1Mn0.S-UZlehMcEbTt2hGXa9T6MHnAhHzX2Y9I6DD0q9G9Nw";

// ─── PALETAS DE CORES ─────────────────────────────────────────────────────────
export const C_TECH4CON = {
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

export const C_LONDON = {
  red:        "#4A4A4A",
  redDark:    "#333333",
  redLight:   "#F5F5F5",
  redMid:     "#E8E8E8",
  black:      "#1A1A1A",
  dark:       "#2A2A2A",
  gray900:    "#3F3F3F",
  gray700:    "#666666",
  gray500:    "#888888",
  gray300:    "#CCCCCC",
  gray100:    "#F5F5F5",
  gray50:     "#FAFAFA",
  white:      "#FFFFFF",
  blue:       "#5B7C99",
  blueDark:   "#3D5271",
  blueLight:  "#E8EEF5",
  green:      "#5B7C99",
  greenLight: "#E8EEF5",
  gold:       "#D4D4D4",
  goldLight:  "#F8F8F8",
  orange:     "#808080",
  orangeLight:"#F0F0F0",
  border:     "#D8D8D8",
  borderDark: "#CCCCCC",
};

// ─── TIPO PARA CONFIGURAÇÃO DE EMPRESA ────────────────────────────────────────
export interface EmpresaConfig {
  aliases: string[];
  nome: string;
  nomeCompleto: string;
  cnpj: string;
  logo: string;
  logoDM: string;
  apiUrl: string;
  apiIdentifier: string;
  filiais: string[];
  paleta: typeof C_TECH4CON | typeof C_LONDON;
  modulosDisponiveis?: string[];
  estruturaDados?: string;
  usaCache?: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
}

// ─── CONFIGURAÇÃO CENTRAL DE EMPRESAS ──────────────────────────────────────────
export const EMPRESAS_CONFIG: { [key: string]: EmpresaConfig } = {
  tech4con: {
    aliases: ["tech4con", "tech4-con", "tech4_con"],
    nome: "Tech4Con",
    nomeCompleto: "Tech4Con Produtos para Construção Civil LTDA",
    cnpj: "33.577.286/0001-21",
    logo: "/logos/tech4con.png",
    logoDM: LOGO_DM_URL,
    apiUrl: "https://script.google.com/macros/s/AKfycbx-VAR5oGvAaAeeNS2M3D6X5z88QMnJ-XQE3C-CjghVFRYa8ZJmhib9UNbRwmlPjt4I/exec",
    apiIdentifier: "tech4con",
    filiais: ["Consolidado", "Fibra", "Químicos"],
    paleta: C_TECH4CON,
    usaCache: false,
  },
  "london-franqueadas": {
  aliases: ["london-franqueadas", "london_franqueadas", "londonfranqueadas", "london-franquias"],
    nome: "London Marca",
    nomeCompleto: "London Marca",
    cnpj: "[CNPJ a confirmar]",
    logo: "/logos/london.png",
    logoDM: LOGO_DM_URL,
    apiUrl: "PENDENTE_API_LONDON_MARCA",
    apiIdentifier: "london-marca",
    filiais: ["Consolidado"],
    paleta: C_LONDON,
    modulosDisponiveis: ["financeiro"],
    estruturaDados: "london",
    usaCache: false,
  },
  "london-franqueadas": {
    aliases: ["london-franqueadas", "london_franqueadas", "londonfranqueadas"],
    nome: "London Franqueadas",
    nomeCompleto: "London Franqueadas",
    cnpj: "[CNPJ a confirmar]",
    logo: "/logos/london.png",
    logoDM: LOGO_DM_URL,
    apiUrl: "https://script.google.com/macros/s/AKfycbyO1UDvK0G5kQLTRd8aUm2dxa92CKh4X5TGCZlOmyd0dq8wN8zdWljiNh2t7eMV2huJ/exec",
    apiIdentifier: "london-franqueadas",
    filiais: ["Consolidado", "INC RS", "INC SP"],
    paleta: C_LONDON,
    modulosDisponiveis: ["financeiro"],
    estruturaDados: "london",
    usaCache: true,
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_KEY,
  },
};

// ─── HELPERS DE NORMALIZAÇÃO E RESOLUÇÃO ──────────────────────────────────────
export function normalizeSlug(slug: string): string {
  return slug?.toLowerCase().trim().replace(/[-_]/g, "") || "";
}

export function resolveEmpresa(slug: string): EmpresaConfig {
  const normalizado = normalizeSlug(slug);
  
  for (const [key, config] of Object.entries(EMPRESAS_CONFIG)) {
    if (config.aliases.some((alias: string) => normalizeSlug(alias) === normalizado)) {
      console.log("✅ [EMPRESA RESOLVIDA]", { slug, normalizado, empresa: key, nome: config.nome });
      return config;
    }
  }
  
  console.warn("⚠️ [EMPRESA NÃO ENCONTRADA]", { slug, normalizado, fallback: "tech4con" });
  return EMPRESAS_CONFIG.tech4con;
}

export function getApiUrlForEmpresa(slug: string): string {
  const empresa = resolveEmpresa(slug);
  return empresa.apiUrl;
}
