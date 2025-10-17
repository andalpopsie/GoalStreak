// Category Icons Utility - Shared icon mapping for habits
import { Colors } from '../constants/theme';

export const CATEGORY_ICONS: Record<string, string> = {
  // Fitness & Workout - Using verified Ionicons names
  fitness: 'fitness',                   // ✓ Verified - fitness icon
  workout: 'fitness',                   // ✓ Verified - fitness icon
  running: 'walk',                      // ✓ Verified - walking/running figure
  yoga: 'body',                         // ✓ Verified - body silhouette for yoga
  weightlifting: 'barbell',             // ✓ Verified - barbell for weightlifting
  cycling: 'bicycle',                   // ✓ Verified - bicycle
  swimming: 'water',                    // ✓ Verified - water waves for swimming
  pet: 'paw',                           // ✓ Verified - paw print for pets
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
  // 6-category system with updated colors
  fitness: Colors.fitnessOrange,        // 🟣 #B771E5 - Exercise, workouts, running, sports
  wellness: Colors.wellnessTeal,        // 🔷 #48B3AF - Health, meditation, sleep, mindfulness  
  nutrition: Colors.nutritionGreen,     // 🟢 #A7E399 - Food, water, vitamins, diet
  social: Colors.socialPurple,          // ⚫ #3C3D37 - Friends, family, relationships, music
  productivity: Colors.productivityNavy, // 🔷 #003161 - Work, learning, organization, writing
  other: Colors.otherPink,              // 🟠 #FF9013 - Other habits, miscellaneous
  
  // Legacy support for backward compatibility (map to closest category)
  workout: Colors.fitnessOrange,        // Maps to fitness
  running: Colors.fitnessOrange,        // Maps to fitness
  yoga: Colors.wellnessTeal,            // Maps to wellness
  meditation: Colors.wellnessTeal,      // Maps to wellness
  mindfulness: Colors.wellnessTeal,     // Maps to wellness
  health: Colors.wellnessTeal,          // Maps to wellness
  sleep: Colors.wellnessTeal,           // Maps to wellness
  water: Colors.nutritionGreen,         // Maps to nutrition
  diet: Colors.nutritionGreen,          // Maps to nutrition
  vitamins: Colors.nutritionGreen,      // Maps to nutrition
  friends: Colors.socialPurple,         // Maps to social
  family: Colors.socialPurple,          // Maps to social
  music: Colors.socialPurple,           // Maps to social
  learning: Colors.productivityNavy,    // Maps to productivity
  writing: Colors.productivityNavy,     // Maps to productivity
  coding: Colors.productivityNavy,      // Maps to productivity
  
  // Default fallback
  other: Colors.otherPink,              // Pink - other category
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
    'weightlifting': 'barbell',
    'weights': 'barbell',
    'lifting': 'barbell',
    'strength': 'barbell',
    'swimming': 'water',
    'swim': 'water',
    'pool': 'water',
    'pet': 'paw',
    'dog': 'paw',
    'cat': 'paw',
    'animal': 'paw',
    
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
  
  // Direct category mapping - clean and predictable
  if (CATEGORY_COLORS[normalizedCategory]) {
    return CATEGORY_COLORS[normalizedCategory];
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
