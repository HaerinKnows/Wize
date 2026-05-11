export type ThemeColors = {
  bg: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  primarySoft: string;
  success: string;
  warning: string;
  danger: string;
  chipBlue: string;
  chipMint: string;
  chipRose: string;
  chipAmber: string;
  line: string;
  modalBackdrop: string;
};

export const lightColors: ThemeColors = {
  bg: '#ffffff',
  card: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  primary: '#136281',
  primarySoft: '#dfe7ff',
  success: '#1D9B6C',
  warning: '#F59E0B',
  danger: '#EF4444',
  chipBlue: '#E6EEFF',
  chipMint: '#DCFCE7',
  chipRose: '#FFE4E6',
  chipAmber: '#FEF3C7',
  line: '#888e96',
  modalBackdrop: 'rgba(15,23,42,0.25)'
};

export const darkColors: ThemeColors = {
  bg: '#050428',
  card: '#0D103D',
  textPrimary: '#E5ECFF',
  textSecondary: '#A6B3CF',
  primary: '#5DA7FF',
  primarySoft: '#1A2A4D',
  success: '#33C28A',
  warning: '#FBBF24',
  danger: '#F87171',
  chipBlue: '#1A2A4D',
  chipMint: '#15322A',
  chipRose: '#3A1C27',
  chipAmber: '#3F3112',
  line: '#1E294B',
  modalBackdrop: 'rgba(2,6,23,0.85)'
};

export const goldColors: ThemeColors = {
  bg: '#0F0F0F',
  card: '#1A1A1A',
  textPrimary: '#F2E2C4',
  textSecondary: '#A69B85',
  primary: '#D4AF37', // Gold
  primarySoft: '#2D281E',
  success: '#C5A059',
  warning: '#E6C685',
  danger: '#A63F3F',
  chipBlue: '#1F1C16',
  chipMint: '#1D241F',
  chipRose: '#2D1F21',
  chipAmber: '#2D281E',
  line: '#332D21',
  modalBackdrop: 'rgba(0,0,0,0.9)'
};

export const midnightColors: ThemeColors = {
  bg: '#000000',
  card: '#0A0A0A',
  textPrimary: '#FFFFFF',
  textSecondary: '#666666',
  primary: '#FFFFFF',
  primarySoft: '#1A1A1A',
  success: '#00FF94',
  warning: '#FFF500',
  danger: '#FF3D00',
  chipBlue: '#1A1A1A',
  chipMint: '#002616',
  chipRose: '#260000',
  chipAmber: '#262400',
  line: '#1A1A1A',
  modalBackdrop: 'rgba(0,0,0,0.95)'
};

export const glassColors: ThemeColors = {
  bg: '#0F0C29', // Deep space background
  card: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  primary: '#7BB6FF',
  primarySoft: 'rgba(123, 182, 255, 0.15)',
  success: '#00F5A0',
  warning: '#FFD700',
  danger: '#FF6B6B',
  chipBlue: 'rgba(255, 255, 255, 0.1)',
  chipMint: 'rgba(0, 245, 160, 0.1)',
  chipRose: 'rgba(255, 107, 107, 0.1)',
  chipAmber: 'rgba(255, 215, 0, 0.1)',
  line: 'rgba(255, 255, 255, 0.12)',
  modalBackdrop: 'rgba(0,0,0,0.7)'
};

// Static fallback for files not yet theme-aware.
export const colors = lightColors;

export const radius = {
  card: 12,
  pill: 12,
  input: 16
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 3
  }
};

export const spacing = {
  xs: 4,
  sm: 12,
  md: 20,
  lg: 24,
  xl: 32
};

export const fontFamily = {
  base: 'Raleway',
  italic: 'RalewayItalic',
  regular: 'RalewayRegular',
  variable: 'RalewayVariable',
  italicVariable: 'RalewayItalicVariable',
  thin: 'RalewayThin',
  thinItalic: 'RalewayThinItalic',
  extraLight: 'RalewayExtraLight',
  extraLightItalic: 'RalewayExtraLightItalic',
  light: 'RalewayLight',
  lightItalic: 'RalewayLightItalic',
  regularItalic: 'RalewayRegularItalic',
  medium: 'RalewayMedium',
  mediumItalic: 'RalewayMediumItalic',
  semibold: 'RalewaySemiBold',
  semiboldItalic: 'RalewaySemiBoldItalic',
  bold: 'RalewayBold',
  boldItalic: 'RalewayBoldItalic',
  extraBold: 'RalewayExtraBold',
  extraBoldItalic: 'RalewayExtraBoldItalic',
  black: 'RalewayBlack',
  blackItalic: 'RalewayBlackItalic'
};

export const typography = {
  h1: { fontFamily: fontFamily.bold, fontSize: 40, lineHeight: 46},
  h2: { fontFamily: fontFamily.medium, fontSize: 26, lineHeight: 32},
  h3: { fontFamily: fontFamily.medium, fontSize: 20, lineHeight: 26},
  body: { fontFamily: fontFamily.medium, fontSize: 18, lineHeight: 24},
  caption: { fontFamily: fontFamily.medium, fontSize: 15, lineHeight: 20}
};
