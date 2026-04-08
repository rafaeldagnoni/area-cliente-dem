export interface EmpresaConfig {
  // Identificadores
  aliases: string[];                    // ["tech4con", "tech4-con", "tech4_con"]
  nome: string;                         // "Tech4Con"
  nomeCompleto: string;                 // "Tech4Con Produtos para Construção Civil LTDA"
  cnpj: string;                         // "33.577.286/0001-21"

  // Branding
  logo: string;                         // "/logos/tech4con.png"
  logoDM: string;                       // "/logo-dm.png"

  // API - CRÍTICO: CADA EMPRESA TEM SUA API
  apiUrl: string;                       // "https://script.google.com/macros/s/AKfycbwimbVcQAuVg6aJQxULDQ_CrCRhetqgzM_ehG-SPIH_NbKSwxzN7e8c3jCj9aVYdYVc/exec"
  apiIdentifier: string;                // "tech4con" (usado se backend precisar de fallback)

  // Configuração de Dados
  filiais: string[];                    // ["Consolidado", "Fibra", "Químicos"]
  
  // Tema
  paleta: {
    red: string;
    redDark: string;
    redLight: string;
    redMid: string;
    black: string;
    dark: string;
    gray900: string;
    gray700: string;
    gray500: string;
    gray300: string;
    gray100: string;
    gray50: string;
    white: string;
    blue: string;
    blueDark: string;
    blueLight: string;
    green: string;
    greenLight: string;
    gold: string;
    goldLight: string;
    orange: string;
    orangeLight: string;
    border: string;
    borderDark: string;
  };

  // Metadados
  modulosDisponiveis?: string[];        // ["financeiro", "comercial", "operações"]
  estruturaDados?: "tech4con" | "london" | "custom";  // tipo de payload esperado
}

// ═══════════════════════════════════════════════════════════════════════════════
// PALETAS DE CORES
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO CENTRAL POR EMPRESA
// ═══════════════════════════════════════════════════════════════════════════════

export const EMPRESAS_CONFIG: { [key: string]: EmpresaConfig } = {
  tech4con: {
    aliases: ["tech4con", "tech4-con", "tech4_con"],
    nome: "Tech4Con",
    nomeCompleto: "Tech4Con Produtos para Construção Civil LTDA",
    cnpj: "33.577.286/0001-21",
    logo: "/logos/tech4con.png",
    logoDM: "/logo-dm.png",

    // ✅ API PRÓPRIA DA TECH4CON
    apiUrl: "https://script.google.com/macros/s/AKfycbx-VAR5oGvAaAeeNS2M3D6X5z88QMnJ-XQE3C-CjghVFRYa8ZJmhib9UNbRwmlPjt4I/exec",
    apiIdentifier: "tech4con",

    filiais: ["Consolidado", "Fibra", "Químicos"],
    paleta: C_TECH4CON,
    modulosDisponiveis: ["financeiro", "comercial"],
    estruturaDados: "tech4con",
  },

  london: {
    aliases: ["london", "london-cosmeticos", "london_cosmeticos", "londoncosmeticos"],
    nome: "London",
    nomeCompleto: "London Cosméticos LTDA",
    cnpj: "[CNPJ A CONFIRMAR]",
    logo: "/logos/london.png",
    logoDM: "/logo-dm.png",

    // ✅ API PRÓPRIA DA LONDON
    // IMPORTANTE: Substitua este ID pelo Google Apps Script ID da planilha da London
    apiUrl: "https://script.google.com/macros/s/AKfycbwimbVcQAuVg6aJQxULDQ_CrCRhetqgzM_ehG-SPIH_NbKSwxzN7e8c3jCj9aVYdYVc/exec",
    apiIdentifier: "london",

    filiais: ["Consolidado"],  // Ou as filiais específicas da London
    paleta: C_LONDON,
    modulosDisponiveis: ["financeiro"],
    estruturaDados: "london",
  },

  // Template para novo cliente:
  // novo_cliente: {
  //   aliases: ["novo", "novo-cliente"],
  //   nome: "Novo Cliente",
  //   nomeCompleto: "Novo Cliente Ltda",
  //   cnpj: "XX.XXX.XXX/XXXX-XX",
  //   logo: "/logos/novo.png",
  //   logoDM: "/logo-dm.png",
  //   apiUrl: "https://script.google.com/macros/s/[ID_APPS_SCRIPT]/exec",
  //   apiIdentifier: "novo",
  //   filiais: ["Consolidado"],
  //   paleta: C_NOVO,  // Defina paleta específica
  //   modulosDisponiveis: ["financeiro"],
  //   estruturaDados: "novo",
  // },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normaliza slug removendo hífens, underscores e espaços
 * "london-cosmeticos" → "londoncosmeticos"
 * "tech4_con" → "tech4con"
 */
export function normalizeSlug(slug: string): string {
  return slug?.toLowerCase().trim().replace(/[-_\s]/g, "") || "";
}

/**
 * Resolve a empresa baseado no slug
 * Suporta aliases e normalização
 * Retorna config da empresa ou fallback controlado
 */
export function resolveEmpresa(slug: string): EmpresaConfig {
  const normalizado = normalizeSlug(slug);
  
  for (const [key, config] of Object.entries(EMPRESAS_CONFIG)) {
    if (config.aliases.some(alias => normalizeSlug(alias) === normalizado)) {
      console.log("✅ [EMPRESA RESOLVIDA]", {
        slug,
        normalizado,
        empresa: key,
        nome: config.nome,
        apiUrl: config.apiUrl,
      });
      return config;
    }
  }
  
  // Se não encontrar, log de erro e fallback
  console.warn("⚠️ [EMPRESA NÃO ENCONTRADA]", {
    slug,
    normalizado,
    fallback: "tech4con",
  });
  
  return EMPRESAS_CONFIG.tech4con;
}

/**
 * Obtém a API URL correta para uma empresa
 * CRÍTICO: cada empresa tem sua própria API
 */
export function getApiUrlForEmpresa(slug: string): string {
  const empresa = resolveEmpresa(slug);
  return empresa.apiUrl;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Valida se uma empresa é válida
 */
export function isValidEmpresa(slug: string): boolean {
  const normalizado = normalizeSlug(slug);
  
  for (const config of Object.values(EMPRESAS_CONFIG)) {
    if (config.aliases.some(alias => normalizeSlug(alias) === normalizado)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Retorna lista de empresas disponíveis (para seletor)
 */
export function getAvailableEmpresas(): Array<{ slug: string; nome: string }> {
  return Object.entries(EMPRESAS_CONFIG).map(([slug, config]) => ({
    slug,
    nome: config.nome,
  }));
}
