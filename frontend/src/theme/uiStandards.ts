import { Theme } from '@mui/material/styles';

// UI/UX Standards for School Management System
export const UIStandards = {
  // Spacing System (8px base unit)
  spacing: {
    xs: 4,    // 4px
    sm: 8,    // 8px
    md: 16,   // 16px
    lg: 24,   // 24px
    xl: 32,   // 32px
    xxl: 48,  // 48px
  },

  // Typography Scale
  typography: {
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.6 },
    caption: { fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.5 },
    button: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none' },
  },

  // Border Radius System
  borderRadius: {
    xs: 4,    // 4px
    sm: 8,    // 8px
    md: 12,   // 12px
    lg: 16,   // 16px
    xl: 20,   // 20px
    xxl: 24,  // 24px
  },

  // Shadow System
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.1)',
    md: '0 4px 20px rgba(0,0,0,0.08)',
    lg: '0 8px 40px rgba(0,0,0,0.12)',
    xl: '0 12px 60px rgba(0,0,0,0.15)',
  },

  // Animation Durations
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },

  // Z-Index Scale
  zIndex: {
    drawer: 1200,
    appBar: 1100,
    modal: 1300,
    tooltip: 1400,
    snackbar: 1500,
  },
};

// Component-specific styling standards
export const ComponentStandards = {
  // Card Standards
  card: {
    borderRadius: UIStandards.borderRadius.lg,
    boxShadow: UIStandards.shadows.md,
    padding: UIStandards.spacing.lg,
    hover: {
      transform: 'translateY(-4px)',
      boxShadow: UIStandards.shadows.lg,
      transition: UIStandards.transitions.normal,
    },
  },

  // Button Standards
  button: {
    borderRadius: UIStandards.borderRadius.md,
    padding: `${UIStandards.spacing.sm}px ${UIStandards.spacing.lg}px`,
    fontWeight: 600,
    textTransform: 'none',
    hover: {
      transform: 'translateY(-1px)',
      boxShadow: UIStandards.shadows.md,
      transition: UIStandards.transitions.fast,
    },
  },

  // Dialog Standards
  dialog: {
    borderRadius: UIStandards.borderRadius.xl,
    padding: UIStandards.spacing.lg,
    maxWidth: '600px',
    fullWidth: true,
  },

  // Form Standards
  form: {
    fieldSpacing: UIStandards.spacing.md,
    labelWeight: 600,
    inputBorderRadius: UIStandards.borderRadius.md,
    errorColor: '#d32f2f',
  },

  // Table Standards
  table: {
    headerBackground: 'primary.main',
    headerColor: 'primary.contrastText',
    rowHover: 'action.hover',
    borderColor: 'divider',
    cellPadding: UIStandards.spacing.md,
  },

  // Navigation Standards
  navigation: {
    itemBorderRadius: UIStandards.borderRadius.md,
    itemPadding: `${UIStandards.spacing.sm}px ${UIStandards.spacing.md}px`,
    selectedBackground: 'primary.main',
    selectedColor: 'primary.contrastText',
    hoverBackground: 'action.hover',
  },
};

// Responsive breakpoint standards
export const ResponsiveStandards = {
  mobile: {
    maxWidth: 600,
    padding: UIStandards.spacing.md,
    gridColumns: 1,
    cardPadding: UIStandards.spacing.md,
  },
  tablet: {
    minWidth: 600,
    maxWidth: 900,
    padding: UIStandards.spacing.lg,
    gridColumns: 2,
    cardPadding: UIStandards.spacing.lg,
  },
  desktop: {
    minWidth: 900,
    padding: UIStandards.spacing.xl,
    gridColumns: 3,
    cardPadding: UIStandards.spacing.xl,
  },
  largeScreen: {
    minWidth: 1200,
    padding: UIStandards.spacing.xxl,
    gridColumns: 4,
    cardPadding: UIStandards.spacing.xxl,
  },
};

// Color standards for consistent theming
export const ColorStandards = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrast: '#ffffff',
  },
  secondary: {
    main: '#dc004e',
    light: '#ff5983',
    dark: '#9a0036',
    contrast: '#ffffff',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
    contrast: '#ffffff',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
    contrast: '#ffffff',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
    contrast: '#ffffff',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
    contrast: '#ffffff',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

// Layout standards for consistent page structure
export const LayoutStandards = {
  page: {
    padding: {
      xs: UIStandards.spacing.md,
      sm: UIStandards.spacing.lg,
      md: UIStandards.spacing.xl,
    },
    maxWidth: '1200px',
    margin: '0 auto',
  },
  section: {
    marginBottom: UIStandards.spacing.xl,
    padding: UIStandards.spacing.lg,
  },
  grid: {
    spacing: UIStandards.spacing.md,
    containerPadding: UIStandards.spacing.md,
  },
  header: {
    marginBottom: UIStandards.spacing.xl,
    textAlign: 'center',
  },
};

// Animation standards for consistent motion
export const AnimationStandards = {
  fadeIn: {
    duration: 300,
    easing: 'ease-in-out',
  },
  slideUp: {
    duration: 250,
    easing: 'ease-out',
  },
  scale: {
    duration: 200,
    easing: 'ease-in-out',
  },
  hover: {
    duration: 150,
    easing: 'ease-in-out',
  },
};

// Export all standards
export default {
  UIStandards,
  ComponentStandards,
  ResponsiveStandards,
  ColorStandards,
  LayoutStandards,
  AnimationStandards,
};