export interface AppTheme {
  id: string;
  name: string;
  isDark: boolean;
  colors: {
    background: string;       // Screen main background
    cardBackground: string;   // Card backgrounds
    cardBorder: string;       // Card border color
    textPrimary: string;      // Main heading/body text
    textSecondary: string;    // Muted/subtext
    accent: string;           // Principal spiritual accent (e.g. Saffron/Green/Violet)
    accentLight: string;      // Lighter accent shade
    accentDark: string;       // Darker accent shade
    beadBgStart: string;      // Bead gradient start
    beadBgMiddle: string;     // Bead gradient middle
    beadBgEnd: string;        // Bead gradient end
    beadBorder: string;       // Outer ring color of bead
    beadContainerBg: string;  // Bead container background
    shadowColor: string;      // Neumorphic shadow color
    highlightColor: string;   // Neumorphic highlight color
    ringColor1: string;       // Progress ring gradient start
    ringColor2: string;       // Progress ring gradient end
  };
}

export const THEMES: Record<string, AppTheme> = {
  'saffron-divine': {
    id: 'saffron-divine',
    name: 'Saffron Divine',
    isDark: true,
    colors: {
      background: '#1C1714',
      cardBackground: '#261F1B',
      cardBorder: 'rgba(255, 255, 255, 0.03)',
      textPrimary: '#FDFBF7',
      textSecondary: '#8A7F75',
      accent: '#EA580C',
      accentLight: '#F97316',
      accentDark: '#7C2D12',
      beadBgStart: '#F97316',
      beadBgMiddle: '#EA580C',
      beadBgEnd: '#7C2D12',
      beadBorder: '#3A2E28',
      beadContainerBg: '#261F1B',
      shadowColor: '#000000',
      highlightColor: 'rgba(255, 255, 255, 0.04)',
      ringColor1: '#EA580C',
      ringColor2: '#F59E0B',
    },
  },
  'saffron-light': {
    id: 'saffron-light',
    name: 'Saffron Light',
    isDark: false,
    colors: {
      background: '#FDFBF7',
      cardBackground: '#FAF6F0',
      cardBorder: '#F5EFEB',
      textPrimary: '#2D2622',
      textSecondary: '#786E64',
      accent: '#EA580C',
      accentLight: '#F97316',
      accentDark: '#C2410C',
      beadBgStart: '#F97316',
      beadBgMiddle: '#EA580C',
      beadBgEnd: '#9A3412',
      beadBorder: '#FFFFFF',
      beadContainerBg: '#FAF6F0',
      shadowColor: '#DDD5C7',
      highlightColor: '#FFFFFF',
      ringColor1: '#EA580C',
      ringColor2: '#F59E0B',
    },
  },
  'krishna-peacock': {
    id: 'krishna-peacock',
    name: 'Krishna Peacock',
    isDark: true,
    colors: {
      background: '#0A1128',
      cardBackground: '#001F54',
      cardBorder: 'rgba(255, 255, 255, 0.04)',
      textPrimary: '#E2E8F0',
      textSecondary: '#94A3B8',
      accent: '#0D9488',
      accentLight: '#2DD4BF',
      accentDark: '#115E59',
      beadBgStart: '#10B981',
      beadBgMiddle: '#059669',
      beadBgEnd: '#047857',
      beadBorder: '#1E293B',
      beadContainerBg: '#0F172A',
      shadowColor: '#020617',
      highlightColor: 'rgba(255, 255, 255, 0.03)',
      ringColor1: '#0D9488',
      ringColor2: '#10B981',
    },
  },
  'shiva-cosmic': {
    id: 'shiva-cosmic',
    name: 'Shiva Cosmic',
    isDark: true,
    colors: {
      background: '#0F0F1E',
      cardBackground: '#1E1B4B',
      cardBorder: 'rgba(255, 255, 255, 0.03)',
      textPrimary: '#F1F5F9',
      textSecondary: '#94A3B8',
      accent: '#6366F1',
      accentLight: '#818CF8',
      accentDark: '#312E81',
      beadBgStart: '#8B5CF6',
      beadBgMiddle: '#7C3AED',
      beadBgEnd: '#4C1D95',
      beadBorder: '#1F1A3A',
      beadContainerBg: '#13112E',
      shadowColor: '#03020A',
      highlightColor: 'rgba(255, 255, 255, 0.04)',
      ringColor1: '#6366F1',
      ringColor2: '#EC4899',
    },
  },
  'devi-lotus': {
    id: 'devi-lotus',
    name: 'Devi Lotus',
    isDark: true,
    colors: {
      background: '#270F1A',
      cardBackground: '#3B132B',
      cardBorder: 'rgba(255, 255, 255, 0.03)',
      textPrimary: '#FFF1F2',
      textSecondary: '#FDA4AF',
      accent: '#E11D48',
      accentLight: '#F43F5E',
      accentDark: '#881337',
      beadBgStart: '#FB7185',
      beadBgMiddle: '#E11D48',
      beadBgEnd: '#4C0519',
      beadBorder: '#4C163C',
      beadContainerBg: '#2D1324',
      shadowColor: '#12020A',
      highlightColor: 'rgba(255, 255, 255, 0.04)',
      ringColor1: '#E11D48',
      ringColor2: '#F472B6',
    },
  },
  'minimal-charcoal': {
    id: 'minimal-charcoal',
    name: 'Minimal Charcoal',
    isDark: true,
    colors: {
      background: '#121212',
      cardBackground: '#1E1E1E',
      cardBorder: 'rgba(255, 255, 255, 0.04)',
      textPrimary: '#E0E0E0',
      textSecondary: '#888888',
      accent: '#D4AF37',
      accentLight: '#F3E5AB',
      accentDark: '#996515',
      beadBgStart: '#424242',
      beadBgMiddle: '#212121',
      beadBgEnd: '#111111',
      beadBorder: '#2A2A2A',
      beadContainerBg: '#1A1A1A',
      shadowColor: '#050505',
      highlightColor: 'rgba(255, 255, 255, 0.03)',
      ringColor1: '#D4AF37',
      ringColor2: '#F59E0B',
    },
  },
  'radha-rani-premium': {
    id: 'radha-rani-premium',
    name: 'Radha Rani Premium',
    isDark: true,
    colors: {
      background: '#1A031D',
      cardBackground: '#2E0632',
      cardBorder: 'rgba(236, 72, 153, 0.15)',
      textPrimary: '#FFF5F7',
      textSecondary: '#F472B6',
      accent: '#EC4899',
      accentLight: '#F472B6',
      accentDark: '#9D174D',
      beadBgStart: '#F472B6',
      beadBgMiddle: '#EC4899',
      beadBgEnd: '#9D174D',
      beadBorder: '#4D0F44',
      beadContainerBg: '#2A082C',
      shadowColor: '#0F0210',
      highlightColor: 'rgba(236, 72, 153, 0.08)',
      ringColor1: '#EC4899',
      ringColor2: '#F43F5E',
    },
  },
};

export const DEFAULT_THEME_ID = 'saffron-divine';
