// GoalStreak Design System Constants

export const Colors = {
  // Primary Colors - New Sophisticated Palette
  primaryText: '#154D71',      // New dark blue for text and icons
  background: '#FEF9E1',       // New warm cream background
  accent1: '#FF894F',          // New warm orange (was #FF7F3E)
  accent2: '#154D71',          // Dark blue for secondary accents
  accent3: '#4A90A4',          // Complementary teal for completed states
  
  // Additional Colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    light: '#E8E8E8',          // Slightly adjusted for new background
    medium: '#CCCCCC',
    dark: '#666666',
  },
  
  // Semantic Colors
  success: '#4A90A4',          // Updated teal
  warning: '#FF894F',          // New warm orange
  error: '#FF4444',
  info: '#154D71',             // Dark blue
} as const;

export const Typography = {
  // Font Family - Montserrat (free alternative to Proxima Nova)
  fontFamily: {
    regular: 'Montserrat_400Regular',
    medium: 'Montserrat_500Medium', 
    semibold: 'Montserrat_600SemiBold',
    bold: 'Montserrat_700Bold',
    heavy: 'Montserrat_800ExtraBold',    // For design inspiration match
    black: 'Montserrat_900Black',        // For design inspiration match
    
    // Fallbacks
    fallback: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Font Weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',        // Added for design inspiration
    black: '900',        // Added for design inspiration
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const Spacing = {
  // Base spacing unit (4px)
  unit: 4,
  
  // Spacing scale
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export const Layout = {
  // Screen padding
  screenPadding: Spacing.md,
  
  // Component spacing
  componentSpacing: Spacing.md,
  
  // Header height
  headerHeight: 60,
  
  // Tab bar height
  tabBarHeight: 80,
  
  // Button heights
  buttonHeight: {
    sm: 36,
    md: 44,
    lg: 52,
  },
} as const;

// Theme object combining all constants
export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  layout: Layout,
} as const;

export default Theme;
