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
  bg: '#0B1220',
  card: '#111A2E',
  textPrimary: '#E5ECFF',
  textSecondary: '#A6B3CF',
  primary: '#4cff88',
  primarySoft: '#1d5224',
  success: '#33C28A',
  warning: '#FBBF24',
  danger: '#F87171',
  chipBlue: '#1A2A4D',
  chipMint: '#15322A',
  chipRose: '#3A1C27',
  chipAmber: '#3F3112',
  line: '#26324A',
  modalBackdrop: 'rgba(2,6,23,0.72)'
};

// Static fallback for files not yet theme-aware.
export const colors = lightColors;

export const radius = {
  card: 10,
  pill: 10,
  input: 14
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 3
  }
};

export const spacing = {
  xs: 30,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28
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
  h1: { fontFamily: fontFamily.bold, fontSize: 35, lineHeight: 36},
  h2: { fontFamily: fontFamily.medium, fontSize: 22, lineHeight: 28},
  body: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 22},
  caption: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18}
};
