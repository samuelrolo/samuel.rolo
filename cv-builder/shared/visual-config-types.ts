/**
 * Tipos para configuração visual e personalização do currículo
 */

export type LayoutType = "single-column" | "two-column" | "sidebar";

export type ColorScheme = 
  | "black-white"
  | "blue-professional"
  | "green-business"
  | "purple-creative"
  | "orange-energy"
  | "gray-minimal"
  | "custom";

export type Typography = 
  | "arial"
  | "times-new-roman"
  | "roboto"
  | "montserrat"
  | "open-sans";

export type IconStyle = 
  | "outline"
  | "solid"
  | "duotone"
  | "rounded"
  | "sharp"
  | "minimal";

export type GeometricStyle = 
  | "none"
  | "rectangular" // Linhas retas, retângulos, quadrados
  | "circular" // Círculos, elipses, formas orgânicas
  | "hybrid"; // Misto de formas retas e circulares

export type DesignPack = 
  | "classic"
  | "modern"
  | "creative"
  | "minimalist"
  | "custom";

export type PhotoShape = 
  | "none"
  | "circle"
  | "square"
  | "rectangle-vertical"
  | "rectangle-horizontal"
  | "hexagon"
  | "rounded-square";

export type PhotoSize = "small" | "medium" | "large" | "extra-large";

export type BorderWidth = "none" | "thin" | "medium" | "thick";

export type PhotoPosition = 
  | "top-center"
  | "top-left"
  | "sidebar-top"
  | "beside-name";

export interface PhotoConfig {
  shape: PhotoShape;
  size: PhotoSize;
  borderWidth: BorderWidth;
  borderColor: string;
  position: PhotoPosition;
}

export interface ColorConfig {
  primary: string;
  secondary: string;
  text: string;
  background: string;
  accent: string;
}

export type BackgroundType = "none" | "watermark" | "pattern" | "gradient";

export type BackgroundPosition = "center" | "top-right" | "bottom-left" | "repeat";

export type BackgroundSize = "small" | "medium" | "large";

export interface BackgroundConfig {
  type: BackgroundType;
  imageUrl?: string;
  opacity: number; // 5-30
  position: BackgroundPosition;
  size: BackgroundSize;
}

export interface VisualElements {
  showPhoto: boolean;
  showSkillBars: boolean;
  showContactIcons: boolean;
  showSectionDividers: boolean;
  showGeometricShapes: boolean;
  geometricStyle: GeometricStyle;
  showBackground: boolean;
}

export interface VisualConfig {
  layout: LayoutType;
  colorScheme: ColorScheme;
  customColors?: ColorConfig;
  typography: Typography;
  iconStyle: IconStyle;
  geometricStyle: GeometricStyle;
  designPack: DesignPack;
  photoConfig: PhotoConfig;
  backgroundConfig: BackgroundConfig;
  visualElements: VisualElements;
}

/**
 * Configuração visual padrão
 */
export const DEFAULT_VISUAL_CONFIG: VisualConfig = {
  layout: "two-column",
  colorScheme: "black-white",
  typography: "arial",
  iconStyle: "outline",
  geometricStyle: "none",
  designPack: "custom",
  photoConfig: {
    shape: "circle",
    size: "medium",
    borderWidth: "thin",
    borderColor: "#000000",
    position: "top-center",
  },
  backgroundConfig: {
    type: "none",
    opacity: 10,
    position: "center",
    size: "large",
  },
  visualElements: {
    showPhoto: true,
    showSkillBars: true,
    showContactIcons: true,
    showSectionDividers: true,
    showGeometricShapes: false,
    geometricStyle: "none",
    showBackground: false,
  },
};

/**
 * Esquemas de cores predefinidos
 */
export const COLOR_SCHEMES: Record<ColorScheme, ColorConfig> = {
  "black-white": {
    primary: "#000000",
    secondary: "#D3D3D3",
    text: "#000000",
    background: "#FFFFFF",
    accent: "#4A4A4A",
  },
  "blue-professional": {
    primary: "#1E3A8A",
    secondary: "#3B82F6",
    text: "#1F2937",
    background: "#FFFFFF",
    accent: "#60A5FA",
  },
  "green-business": {
    primary: "#065F46",
    secondary: "#10B981",
    text: "#1F2937",
    background: "#FFFFFF",
    accent: "#34D399",
  },
  "purple-creative": {
    primary: "#5B21B6",
    secondary: "#8B5CF6",
    text: "#1F2937",
    background: "#FFFFFF",
    accent: "#A78BFA",
  },
  "orange-energy": {
    primary: "#C2410C",
    secondary: "#F97316",
    text: "#1F2937",
    background: "#FFFFFF",
    accent: "#FB923C",
  },
  "gray-minimal": {
    primary: "#374151",
    secondary: "#6B7280",
    text: "#1F2937",
    background: "#FFFFFF",
    accent: "#9CA3AF",
  },
  custom: {
    primary: "#000000",
    secondary: "#808080",
    text: "#000000",
    background: "#FFFFFF",
    accent: "#404040",
  },
};

/**
 * Mapeamento de tipografias para fontes CSS
 */
export const TYPOGRAPHY_FONTS: Record<Typography, string> = {
  arial: "'Arial', sans-serif",
  "times-new-roman": "'Times New Roman', serif",
  roboto: "'Roboto', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  "open-sans": "'Open Sans', sans-serif",
};

/**
 * Tamanhos de foto em pixels
 */
export const PHOTO_SIZES: Record<PhotoSize, number> = {
  small: 80,
  medium: 120,
  large: 160,
  "extra-large": 200,
};

/**
 * Larguras de borda em pixels
 */
export const BORDER_WIDTHS: Record<BorderWidth, number> = {
  none: 0,
  thin: 2,
  medium: 4,
  thick: 6,
};

/**
 * Packs de design pré-configurados
 */
export interface DesignPackConfig {
  name: string;
  description: string;
  colorScheme: ColorScheme;
  typography: Typography;
  iconStyle: IconStyle;
  layout: LayoutType;
}

export const DESIGN_PACKS: Record<Exclude<DesignPack, "custom">, DesignPackConfig> = {
  classic: {
    name: "Pack Clássico",
    description: "Design tradicional e profissional para ambientes corporativos",
    colorScheme: "black-white",
    typography: "times-new-roman",
    iconStyle: "solid",
    layout: "single-column",
  },
  modern: {
    name: "Pack Moderno",
    description: "Design contemporâneo com cores vibrantes e tipografia clean",
    colorScheme: "blue-professional",
    typography: "roboto",
    iconStyle: "rounded",
    layout: "two-column",
  },
  creative: {
    name: "Pack Criativo",
    description: "Design ousado para profissionais de áreas criativas",
    colorScheme: "purple-creative",
    typography: "montserrat",
    iconStyle: "duotone",
    layout: "sidebar",
  },
  minimalist: {
    name: "Pack Minimalista",
    description: "Design limpo e minimalista com foco no conteúdo",
    colorScheme: "gray-minimal",
    typography: "open-sans",
    iconStyle: "outline",
    layout: "single-column",
  },
};

/**
 * Descrições dos estilos de ícones
 */
export const ICON_STYLE_LABELS: Record<IconStyle, string> = {
  outline: "Contorno",
  solid: "Preenchido",
  duotone: "Duas Cores",
  rounded: "Arredondado",
  sharp: "Angular",
  minimal: "Minimalista",
};

/**
 * Descrições das tipografias
 */
export const TYPOGRAPHY_LABELS: Record<Typography, string> = {
  arial: "Arial - Clean e Profissional",
  "times-new-roman": "Times New Roman - Tradicional",
  roboto: "Roboto - Moderno",
  montserrat: "Montserrat - Bold",
  "open-sans": "Open Sans - Amigável",
};

/**
 * Descrições dos esquemas de cores
 */
export const COLOR_SCHEME_LABELS: Record<ColorScheme, string> = {
  "black-white": "Preto e Branco - Clássico",
  "blue-professional": "Azul Profissional",
  "green-business": "Verde Negócios",
  "purple-creative": "Roxo Criativo",
  "orange-energy": "Laranja Energia",
  "gray-minimal": "Cinza Minimalista",
  custom: "Personalizado",
};

/**
 * Descrições dos estilos geométricos
 */
export const GEOMETRIC_STYLE_LABELS: Record<GeometricStyle, string> = {
  none: "Sem Formas Decorativas",
  rectangular: "Linhas Retas - Retângulos e Quadrados",
  circular: "Formas Circulares - Círculos e Elipses",
  hybrid: "Híbrido - Misto de Formas",
};
