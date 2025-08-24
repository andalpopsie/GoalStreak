// Category Icons Utility - Shared icon mapping for habits
import { Colors } from '../constants/theme';

export const CATEGORY_ICONS: Record<string, string> = {
  // Fitness & Workout - Using verified Ionicons names
  fitness: 'fitness',                   // ✓ Verified - fitness icon
  workout: 'fitness',                   // ✓ Verified - fitness icon
  running: 'walk',                      // ✓ Verified - walking/running figure
  yoga: 'body',                         // ✓ Verified - body silhouette
  cycling: 'bicycle',                   // ✓ Verified - bicycle
  swimming: 'water',                    // ✓ Verified - water waves
  cardio: 'heart',                      // ✓ Verified - heart for cardio
  strength: 'fitness',                  // ✓ Verified - fitness for strength
  
  // Health & Wellness - Using verified Ionicons names
  wellness: 'heart',                    // ✓ Verified - solid heart
  health: 'medical',                    // ✓ Verified - medical cross
  sleep: 'moon',                        // ✓ Verified - moon icon for sleep
  meditation: 'leaf',                   // ✓ Verified - leaf for mindfulness
  breathing: 'partly-sunny',            // ✓ Verified - sun with clouds
  mindfulness: 'flower',                // ✓ Verified - flower for beauty
  
  // Nutrition - Using verified Ionicons names
  nutrition: 'nutrition',               // ✓ Verified - nutrition icon
  water: 'water',                       // ✓ Verified - water drop
  diet: 'fast-food',                    // ✓ Verified - food icon
  vitamins: 'medical',                  // ✓ Verified - medical cross
  healthy_eating: 'leaf',               // ✓ Verified - leaf for healthy
  
  // Productivity & Learning - Using verified Ionicons names
  productivity: 'briefcase',            // ✓ Verified - briefcase
  learning: 'school',                   // ✓ Verified - school building
  reading: 'book',                      // ✓ Verified - book
  writing: 'pencil',                    // ✓ Verified - pencil
  journaling: 'journal',                // ✓ Verified - journal
  coding: 'code-slash',                 // ✓ Verified - code brackets
  studying: 'library',                  // ✓ Verified - library
  
  // Social & Personal - Using verified Ionicons names
  social: 'people',                     // ✓ Verified - people group
  family: 'home',                       // ✓ Verified - home
  friends: 'happy',                     // ✓ Verified - happy face
  relationships: 'heart-circle',        // ✓ Verified - heart in circle
  communication: 'chatbubbles',         // ✓ Verified - chat bubbles
  
  // Creative & Hobbies - Using verified Ionicons names
  creative: 'color-palette',            // ✓ Verified - color palette
  music: 'musical-notes',               // ✓ Verified - musical notes
  art: 'brush',                         // ✓ Verified - paint brush
  photography: 'camera',                // ✓ Verified - camera
  crafts: 'construct',                  // ✓ Verified - construction tools
  
  // Daily Habits - Using verified Ionicons names
  hygiene: 'water',                     // ✓ Verified - water for cleanliness
  cleaning: 'home',                     // ✓ Verified - home organization
  skincare: 'rose',                     // ✓ Verified - rose for beauty
  grooming: 'cut',                      // ✓ Verified - scissors
  organization: 'file-tray-stacked',    // ✓ Verified - organized files
  
  // Mental Health & Self-Care - Using verified Ionicons names
  self_care: 'heart-circle',            // ✓ Verified - heart in circle
  therapy: 'chatbubble-ellipses',       // ✓ Verified - chat with dots
  gratitude: 'star',                    // ✓ Verified - star
  reflection: 'bulb',                   // ✓ Verified - light bulb
  
  // Financial & Career - Using verified Ionicons names
  finance: 'card',                      // ✓ Verified - credit card
  career: 'trending-up',                // ✓ Verified - upward trend
  networking: 'people-circle',          // ✓ Verified - people in circle
  
  // Spiritual & Personal Growth - Using verified Ionicons names
  spiritual: 'sunny',                   // ✓ Verified - sun
  prayer: 'rose',                       // ✓ Verified - rose
  personal_growth: 'trending-up',       // ✓ Verified - upward trend
  
  // Default
  other: 'checkmark-circle',            // ✓ Verified - checkmark
};

export const CATEGORY_COLORS: Record<string, string> = {
  // Fitness & Workout - Energetic and motivating colors
  fitness: Colors.accent1,              // Warm orange - energy and strength
  workout: Colors.accent1,              // Warm orange - active energy
  running: Colors.accent1,              // Warm orange - dynamic movement
  yoga: Colors.accent3,                 // Teal - calm and centered
  cycling: Colors.accent1,              // Warm orange - active energy
  swimming: Colors.accent3,             // Teal - water association
  cardio: '#FF6B6B',                    // Red-orange - heart/cardio
  strength: Colors.accent1,             // Warm orange - power
  
  // Health & Wellness - Calming and nurturing colors
  wellness: Colors.accent3,             // Teal - health and balance
  health: Colors.accent3,               // Teal - medical/health
  sleep: '#6C5CE7',                     // Purple - night and rest
  meditation: Colors.accent3,           // Teal - peace and mindfulness
  breathing: '#74B9FF',                 // Light blue - air and breath
  mindfulness: Colors.accent3,          // Teal - inner peace
  
  // Nutrition - Natural and healthy colors
  nutrition: '#00B894',                 // Green - health and nature
  water: Colors.accent3,                // Teal - water and hydration
  diet: '#00B894',                      // Green - healthy eating
  vitamins: Colors.accent3,             // Teal - health supplements
  healthy_eating: '#00B894',            // Green - natural and healthy
  
  // Productivity & Learning - Professional and focused colors
  productivity: Colors.primaryText,     // Dark blue - professional focus
  learning: '#6C5CE7',                  // Purple - knowledge and wisdom
  reading: '#6C5CE7',                   // Purple - intellectual growth
  writing: Colors.primaryText,          // Dark blue - communication
  journaling: '#A29BFE',                // Light purple - personal reflection
  coding: Colors.primaryText,           // Dark blue - technical focus
  studying: '#6C5CE7',                  // Purple - academic pursuit
  
  // Social & Personal - Warm and connecting colors
  social: Colors.accent1,               // Warm orange - social warmth
  family: '#FF7675',                    // Warm red - love and family
  friends: Colors.accent1,              // Warm orange - friendship joy
  relationships: '#FF7675',             // Warm red - love and connection
  communication: Colors.accent1,        // Warm orange - social interaction
  
  // Creative & Hobbies - Vibrant and inspiring colors
  creative: '#FD79A8',                  // Pink - creativity and imagination
  music: '#FDCB6E',                     // Yellow - joy and harmony
  art: '#FD79A8',                       // Pink - artistic expression
  photography: '#74B9FF',               // Light blue - visual arts
  crafts: Colors.accent1,               // Warm orange - hands-on creativity
  
  // Daily Habits - Clean and organized colors
  hygiene: Colors.accent3,              // Teal - cleanliness and care
  cleaning: Colors.accent3,             // Teal - organization and order
  skincare: '#FD79A8',                  // Pink - beauty and self-care
  grooming: Colors.accent3,             // Teal - personal care
  organization: Colors.primaryText,     // Dark blue - structure and order
  
  // Mental Health & Self-Care - Nurturing and supportive colors
  self_care: '#FF7675',                 // Warm red - self-love
  therapy: '#A29BFE',                   // Light purple - healing and growth
  gratitude: '#FDCB6E',                 // Yellow - positivity and appreciation
  reflection: '#6C5CE7',                // Purple - introspection and wisdom
  
  // Financial & Career - Success and growth colors
  finance: '#00B894',                   // Green - money and prosperity
  career: Colors.primaryText,           // Dark blue - professional growth
  networking: Colors.accent1,           // Warm orange - social connections
  
  // Spiritual & Personal Growth - Enlightening colors
  spiritual: '#FDCB6E',                 // Yellow - enlightenment and wisdom
  prayer: '#A29BFE',                    // Light purple - spiritual connection
  personal_growth: '#6C5CE7',           // Purple - transformation and growth
  
  // Default
  other: Colors.primaryText,            // Dark blue - neutral and reliable
};

/**
 * Get the appropriate icon for a habit category
 * @param category - The habit category
 * @returns The icon name for the category
 */
export const getCategoryIcon = (category: string, habitName?: string, selectedIcon?: string): string => {
  // If user has selected a specific icon, use that first
  if (selectedIcon) {
    return selectedIcon;
  }
  
  const normalizedCategory = category?.toLowerCase()?.trim() || 'other';
  const normalizedName = habitName?.toLowerCase()?.trim() || '';
  
  // First check habit name for specific keywords (this takes priority)
  const nameKeywordMappings: Record<string, string> = {
    // Sleep related
    'sleep': 'moon',
    'bedtime': 'moon',
    'rest': 'moon',
    'nap': 'moon',
    
    // Exercise/Movement
    'walk': 'walk',
    'walking': 'walk',
    'run': 'walk',
    'running': 'walk',
    'jog': 'walk',
    'jogging': 'walk',
    'exercise': 'fitness',
    'workout': 'fitness',
    'gym': 'fitness',
    'yoga': 'body',
    'stretch': 'body',
    'stretching': 'body',
    
    // Meditation/Mindfulness
    'meditate': 'flower',
    'meditation': 'flower',
    'mindfulness': 'flower',
    'breathe': 'partly-sunny',
    'breathing': 'partly-sunny',
    
    // Health
    'medicine': 'medical',
    'vitamin': 'medical',
    'supplement': 'medical',
    
    // Water/Hydration
    'water': 'water',
    'hydrate': 'water',
    'drink': 'water',
    
    // Nutrition
    'eat': 'nutrition',
    'food': 'nutrition',
    'meal': 'nutrition',
    'diet': 'fast-food',
    
    // Reading/Learning
    'read': 'book',
    'reading': 'book',
    'book': 'book',
    'study': 'school',
    'learn': 'school',
    'learning': 'school',
    
    // Social
    'friend': 'happy',
    'family': 'home',
    'call': 'chatbubbles',
    'text': 'chatbubbles',
    
    // Work/Productivity
    'work': 'briefcase',
    'job': 'briefcase',
    'write': 'pencil',
    'writing': 'pencil',
    'journal': 'journal',
    
    // Creative
    'art': 'brush',
    'draw': 'brush',
    'music': 'musical-notes',
    'photo': 'camera',
    
    // Self-care
    'skincare': 'rose',
    'clean': 'home',
    'organize': 'file-tray-stacked',
  };
  
  // Check habit name first (higher priority)
  for (const [keyword, icon] of Object.entries(nameKeywordMappings)) {
    if (normalizedName.includes(keyword)) {
      return icon;
    }
  }
  
  // Then try exact category match
  if (CATEGORY_ICONS[normalizedCategory]) {
    return CATEGORY_ICONS[normalizedCategory];
  }
  
  // Then check category for keywords
  for (const [keyword, icon] of Object.entries(nameKeywordMappings)) {
    if (normalizedCategory.includes(keyword)) {
      return icon;
    }
  }
  
  // Final fallback
  return CATEGORY_ICONS.other;
};

/**
 * Get the appropriate color for a habit category
 * @param category - The habit category
 * @returns The color for the category
 */
export const getCategoryColor = (category: string): string => {
  const normalizedCategory = category?.toLowerCase()?.trim() || 'other';
  
  // First try exact category match
  if (CATEGORY_COLORS[normalizedCategory]) {
    return CATEGORY_COLORS[normalizedCategory];
  }
  
  // If no exact match, try to match by habit name/keywords
  const keywordColorMappings: Record<string, string> = {
    // Sleep related - Purple/Dark colors
    'sleep': '#6C5CE7',
    'bedtime': '#6C5CE7',
    'rest': '#6C5CE7',
    'nap': '#6C5CE7',
    
    // Exercise/Movement - Orange/Red colors
    'walk': Colors.accent1,
    'walking': Colors.accent1,
    'run': Colors.accent1,
    'running': Colors.accent1,
    'jog': Colors.accent1,
    'jogging': Colors.accent1,
    'exercise': Colors.accent1,
    'workout': Colors.accent1,
    'gym': Colors.accent1,
    'fitness': Colors.accent1,
    'yoga': Colors.accent3,
    'stretch': Colors.accent3,
    'stretching': Colors.accent3,
    
    // Meditation/Mindfulness - Teal/Green colors
    'meditate': Colors.accent3,
    'meditation': Colors.accent3,
    'mindfulness': Colors.accent3,
    'breathe': '#74B9FF',
    'breathing': '#74B9FF',
    
    // Health - Teal colors
    'health': Colors.accent3,
    'medicine': Colors.accent3,
    'vitamin': Colors.accent3,
    'supplement': Colors.accent3,
    
    // Water/Hydration - Blue colors
    'water': Colors.accent3,
    'hydrate': Colors.accent3,
    'drink': Colors.accent3,
    
    // Nutrition - Green colors
    'eat': '#00B894',
    'food': '#00B894',
    'meal': '#00B894',
    'nutrition': '#00B894',
    'diet': '#00B894',
    
    // Reading/Learning - Purple colors
    'read': '#6C5CE7',
    'reading': '#6C5CE7',
    'book': '#6C5CE7',
    'study': '#6C5CE7',
    'learn': '#6C5CE7',
    'learning': '#6C5CE7',
    
    // Social - Orange colors
    'social': Colors.accent1,
    'friend': Colors.accent1,
    'family': '#FF7675',
    'call': Colors.accent1,
    'text': Colors.accent1,
    
    // Work/Productivity - Dark blue colors
    'work': Colors.primaryText,
    'job': Colors.primaryText,
    'productivity': Colors.primaryText,
    'write': Colors.primaryText,
    'writing': Colors.primaryText,
    'journal': '#A29BFE',
    
    // Creative - Pink colors
    'art': '#FD79A8',
    'draw': '#FD79A8',
    'music': '#FDCB6E',
    'photo': '#74B9FF',
    'creative': '#FD79A8',
    
    // Self-care - Pink/Teal colors
    'skincare': '#FD79A8',
    'hygiene': Colors.accent3,
    'clean': Colors.accent3,
    'organize': Colors.primaryText,
  };
  
  // Check if the category contains any keywords
  for (const [keyword, color] of Object.entries(keywordColorMappings)) {
    if (normalizedCategory.includes(keyword)) {
      return color;
    }
  }
  
  // Final fallback
  return CATEGORY_COLORS.other;
};

/**
 * Get a formatted display name for a category
 * @param category - The habit category
 * @returns The formatted category name
 */
export const getCategoryDisplayName = (category: string): string => {
  if (!category) return 'Other';
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};
