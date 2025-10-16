// GoalStreak Design System Constants

export const Colors = {
  // Primary Colors - New Sophisticated Palette
  primaryText: '#154D71',      // New dark blue for text and icons
  background: '#FDFDFD',       // New light gray background
  accent1: '#B771E5',          // New purple primary accent (was #FF894F)
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
  
  // Legacy color names for backward compatibility
  primary: '#154D71',          // Same as primaryText
  secondaryText: '#666666',    // Same as gray.dark
  border: '#E8E8E8',          // Same as gray.light
  surface: '#FFFFFF',         // Same as white
  
  // Semantic Colors
  success: '#4A90A4',          // Updated teal
  warning: '#B771E5',          // New purple (was orange)
  error: '#FF4444',
  info: '#154D71',             // Dark blue
  
  // Category Colors - 6-category system (Final Perfect Palette)
  fitnessOrange: '#B771E5',    // Fitness category - Purple
  wellnessTeal: '#48B3AF',     // Wellness category - Teal
  nutritionGreen: '#A7E399',   // Nutrition category - Light Green
  socialPurple: '#3C3D37',     // Social category - Dark Charcoal
  productivityNavy: '#003161', // Productivity category - Navy
  otherPink: '#FF9013',        // Other category - Orange
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
    md: 16,              // Added for backward compatibility
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Typography styles for backward compatibility
  h1: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 1.2,
  },
  h2: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 1.2,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 1.3,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 1.3,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 1.4,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 1.4,
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

// 6-Category Color Mapping
export const CategoryColors = {
  // 6 main categories with perfect color palette
  fitness: Colors.fitnessOrange,        // 🟣 #B771E5 - Exercise, workouts, running
  wellness: Colors.wellnessTeal,        // 🔷 #48B3AF - Health, meditation, sleep
  nutrition: Colors.nutritionGreen,     // 🟢 #A7E399 - Food, water, vitamins
  social: Colors.socialPurple,          // ⚫ #3C3D37 - Friends, family, music
  productivity: Colors.productivityNavy, // 🔷 #003161 - Work, learning, writing
  other: Colors.otherPink,              // 🟠 #FF9013 - Other habits
} as const;

// Helper function to get category color
export const getCategoryColor = (category: string): string => {
  return CategoryColors[category as keyof typeof CategoryColors] || CategoryColors.other;
};

// Helper function to get category background color (lighter version)
export const getCategoryBackgroundColor = (category: string): string => {
  const color = getCategoryColor(category);
  // Return a lighter version for backgrounds
  switch (color) {
    case Colors.fitnessOrange: return '#F5F0FD';   // Very light purple (#B771E5)
    case Colors.wellnessTeal: return '#E8F5F4';    // Very light teal (#48B3AF)
    case Colors.nutritionGreen: return '#F0FBE8';  // Very light green (#A7E399)
    case Colors.socialPurple: return '#F5F5F4';    // Very light gray (#3C3D37)
    case Colors.productivityNavy: return '#E8EBF0'; // Very light navy (#003161)
    case Colors.otherPink: return '#FFF4E8';       // Very light orange (#FF9013)
    default: return Colors.gray.light;
  }
};

export default Theme;
