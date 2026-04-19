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

export const C_MEDIARH = {
  red:        "#1B4965",      // Azul marinho principal
  redDark:    "#0D2E3F",      // Azul marinho escuro
  redLight:   "#E8F4F8",      // Azul marinho claro
  redMid:     "#5A8FA8",      // Azul marinho médio
  black:      "#0A1628",
  dark:       "#0D2E3F",
  gray900:    "#1E3A4C",
  gray700:    "#3D5A6F",
  gray500:    "#5A7A8A",
  gray300:    "#A8C4D4",
  gray100:    "#E8F0F4",
  gray50:     "#F4F8FA",
  white:      "#FFFFFF",
  blue:       "#1B4965",      // Igual ao primary
  blueDark:   "#0D2E3F",
  blueLight:  "#E8F4F8",
  green:      "#14B8A6",      // Teal
  greenLight: "#CCFBF1",      // Teal claro
  gold:       "#5A8FA8",      // Azul médio
  goldLight:  "#E8F4F8",
  orange:     "#5EEAD4",      // Teal médio
  orangeLight:"#CCFBF1",
  border:     "#D1E3EC",
  borderDark: "#A8C4D4",
};

export const C_ESPEL = {
  red:        "#D32F2F",      // Vermelho Espel
  redDark:    "#B71C1C",      // Vermelho escuro
  redLight:   "#FFEBEE",      // Vermelho bem claro
  redMid:     "#EF5350",      // Vermelho médio
  black:      "#1A1A1A",
  dark:       "#2A2A2A",
  gray900:    "#424242",
  gray700:    "#616161",      // Cinza Espel
  gray500:    "#888888",
  gray300:    "#BDBDBD",
  gray100:    "#F5F5F5",
  gray50:     "#FAFAFA",      // Branco/cinza muito claro
  white:      "#FFFFFF",
  blue:       "#1976D2",
  blueDark:   "#1565C0",
  blueLight:  "#E3F2FD",
  green:      "#388E3C",
  greenLight: "#E8F5E9",
  gold:       "#FFA500",
  goldLight:  "#FFF3E0",
  orange:     "#F57C00",
  orangeLight:"#FFE0B2",
  border:     "#E0E0E0",
  borderDark: "#BDBDBD",
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
  paleta: typeof C_TECH4CON | typeof C_LONDON | typeof C_MEDIARH | typeof C_ESPEL;
  modulosDisponiveis?: string[];
  estruturaDados?: string;
  usaCache?: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
  temContasReceber?: boolean;
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
    temContasReceber: false,
  },
  "london-franqueadas": {
    aliases: ["london-franqueadas", "london_franqueadas", "londonfranqueadas", "london-franquias"],
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
    temContasReceber: false,
  },
  mediarh: {
    aliases: ["mediarh", "mediarh-consultoria", "mediarh_consultoria"],
    nome: "Mediarh",
    nomeCompleto: "Mediarh Consultoria de Benefícios",
    cnpj: "10.923.561/0001-16",
    logo: "https://mediarh.com.br/wp-content/uploads/2024/06/Logo-Misto.svg",
    logoDM: LOGO_DM_URL,
    apiUrl: "https://script.google.com/macros/s/AKfycbzrdozCbm1Fkd_oh66iXM1V4zuEjjiFYs9rSWgWQ6M4HDDeRhQXXQljeUrBXatI6Sos/exec",
    apiIdentifier: "mediarh",
    filiais: ["Consolidado"],
    paleta: C_MEDIARH,
    modulosDisponiveis: ["financeiro"],
    estruturaDados: "mediarh",
    usaCache: true,
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_KEY,
    temContasReceber: false,
  },
  "espel-elevadores": {
    aliases: ["espel-elevadores", "espel_elevadores", "espelelevadores", "espel"],
    nome: "Espel Elevadores",
    nomeCompleto: "Espel Elevadores LTDA",
    cnpj: "56.851.769/0001-78",
    logo: "/logos/espel.png",
    logoDM: LOGO_DM_URL,
    apiUrl: "https://script.google.com/macros/s/AKfycbwj13HcTT4el1vTJ-uR7NkBXXLRamoYRfihU0sWTsyMaZTOqKm2yr6nEDCiP237V2eI/exec",
    apiIdentifier: "espel-elevadores",
    filiais: ["Consolidado", "Comércio", "Elevadores", "Fábrica", "Jundiaí", "Serviços"],
    paleta: C_ESPEL,
    modulosDisponiveis: ["financeiro"],
    estruturaDados: "espel",
    usaCache: true,
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_KEY,
    temContasReceber: true,
  },
};

// ─── HELPERS DE NORMALIZAÇÃO E RESOLUÇÃO ──────────────────────────────────────
export function normalizeSlug(slug: string): string {
  return slug?.toLowerCase().trim().replace(/[-_]/g, "") || "";
}

export function resolveEmpresa(slug: string): EmpresaConfig | null {
  const normalizado = normalizeSlug(slug);
  
  for (const [key, config] of Object.entries(EMPRESAS_CONFIG)) {
    if (config.aliases.some((alias: string) => normalizeSlug(alias) === normalizado)) {
      console.log("✅ [EMPRESA RESOLVIDA]", { slug, normalizado, empresa: key, nome: config.nome });
      return config;
    }
  }
  
  console.error("❌ [EMPRESA NÃO ENCONTRADA]", { slug, normalizado });
  return null;
}

export function getApiUrlForEmpresa(slug: string): string {
  const empresa = resolveEmpresa(slug);
  return empresa?.apiUrl || "";
}
