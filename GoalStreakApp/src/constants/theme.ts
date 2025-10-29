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
    heavy: 'Montserrat_800ExtraBold',
    black: 'Montserrat_900Black',
    fallback: 'System',
  },
  
  // Simplified Font Scale (Industry Standard - 5 sizes)
  // Use weight and color for hierarchy, not more sizes
  fontSize: {
    // Primary scale (use these)
    heading: 24,      // H1 - Screen titles, primary headers
    subheading: 20,   // H2 - Section headers, card titles
    body: 16,         // Body - All standard readable content
    caption: 14,      // Caption - Secondary info, labels
    small: 12,        // Small - Disclaimers only (use sparingly)
    
    // Legacy support (map to new scale)
    xs: 12,           // → small
    sm: 14,           // → caption
    base: 16,         // → body
    md: 16,           // → body
    lg: 20,           // → subheading
    xl: 24,           // → heading
    '2xl': 24,        // → heading
    '3xl': 24,        // → heading (avoid, use weight instead)
    '4xl': 24,        // → heading (avoid, use weight instead)
  },
  
  // Typography Styles (Semantic)
  h1: {
    fontSize: 24,     // heading
    fontWeight: '700', // bold
    lineHeight: 1.2,
  },
  h2: {
    fontSize: 20,     // subheading
    fontWeight: '600', // semibold
    lineHeight: 1.3,
  },
  body: {
    fontSize: 16,     // body
    fontWeight: '400', // regular
    lineHeight: 1.5,
  },
  caption: {
    fontSize: 14,     // caption
    fontWeight: '400', // regular
    lineHeight: 1.4,
  },
  small: {
    fontSize: 12,     // small
    fontWeight: '400', // regular
    lineHeight: 1.3,
  },
  
  // Font Weights (Use these for hierarchy)
  fontWeight: {
    regular: '400',   // Body text
    medium: '500',    // Subtle emphasis
    semibold: '600',  // Section headers
    bold: '700',      // Primary headers, CTAs
    heavy: '800',     // Rare, special emphasis
    black: '900',     // Rare, hero text
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,       // Headers
    normal: 1.5,      // Body text (increased for readability)
    relaxed: 1.6,     // Long-form content
  },
} as const;

export const Spacing = {
  // 8pt Grid System (Industry Standard)
  // All spacing should be multiples of 8px
  unit: 8,              // Base unit
  
  // Primary spacing scale (use these)
  tight: 8,             // Icon-text pairs, closely related elements
  base: 16,             // Between related content sections (most common)
  comfortable: 24,      // Separating major content groups
  loose: 32,            // Clear visual breaks between sections
  spacious: 48,         // Major page sections, screen padding
  
  // Legacy support (map to 8pt grid)
  xs: 8,                // → tight
  sm: 8,                // → tight
  md: 16,               // → base
  lg: 24,               // → comfortable
  xl: 32,               // → loose
  '2xl': 48,            // → spacious
  '3xl': 64,            // → avoid, use spacious instead
  
  // Screen margins (space between content and edges)
  screenMargin: 16,     // Standard mobile margin
  screenMarginLarge: 24, // Larger screens
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
  // Screen padding (8pt grid)
  screenPadding: 16,        // Standard mobile padding
  screenPaddingLarge: 24,   // Larger screens
  
  // Component spacing (8pt grid)
  componentSpacing: 16,     // Between components
  sectionSpacing: 24,       // Between sections
  
  // Header height (8pt grid)
  headerHeight: 64,         // 8 * 8
  
  // Tab bar height (8pt grid)
  tabBarHeight: 80,         // 8 * 10
  
  // Button heights (8pt grid)
  buttonHeight: {
    sm: 40,                 // 8 * 5
    md: 48,                 // 8 * 6 (recommended touch target)
    lg: 56,                 // 8 * 7
  },
  
  // Touch targets (minimum 44px for accessibility)
  minTouchTarget: 48,       // 8 * 6 (iOS/Android recommendation)
  
  // Card padding
  cardPadding: 16,          // Internal card padding
  cardMargin: 16,           // Between cards
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
