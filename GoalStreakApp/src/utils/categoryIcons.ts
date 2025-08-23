// Category Icons Utility - Shared icon mapping for habits
import { Colors } from '../constants/theme';

export const CATEGORY_ICONS: Record<string, string> = {
  // Fitness & Workout - More specific and aesthetic
  fitness: 'barbell-outline',           // Weightlifting/strength training
  workout: 'fitness-outline',           // General workout
  running: 'walk-outline',              // Running/cardio
  yoga: 'flower-outline',               // Yoga/stretching
  cycling: 'bicycle-outline',           // Cycling
  swimming: 'water-outline',            // Swimming
  
  // Health & Wellness - Beautiful and clear
  wellness: 'heart-outline',            // General wellness
  health: 'medical-outline',            // Health tracking
  sleep: 'moon-outline',                // Sleep habits
  meditation: 'leaf-outline',           // Meditation/mindfulness
  breathing: 'sunny-outline',           // Breathing exercises
  
  // Nutrition - Food and drink related
  nutrition: 'nutrition-outline',       // General nutrition
  water: 'water-outline',               // Water intake
  diet: 'restaurant-outline',           // Diet/eating habits
  vitamins: 'medical-outline',          // Supplements/vitamins
  
  // Productivity & Learning - Clean and professional
  productivity: 'briefcase-outline',    // Work/productivity
  learning: 'library-outline',          // Learning/reading
  writing: 'create-outline',            // Writing/journaling
  coding: 'code-slash-outline',         // Programming
  
  // Social & Personal - Warm and inviting
  social: 'people-outline',             // Social activities
  family: 'home-outline',               // Family time
  friends: 'happy-outline',             // Friends/social
  
  // Creative & Hobbies - Artistic and fun
  creative: 'color-palette-outline',    // Creative activities
  music: 'musical-notes-outline',       // Music practice
  art: 'brush-outline',                 // Art/drawing
  photography: 'camera-outline',        // Photography
  
  // Daily Habits - Essential and clear
  hygiene: 'water-outline',             // Personal hygiene
  cleaning: 'home-outline',             // Cleaning/organizing
  skincare: 'flower-outline',           // Skincare routine
  
  // Default
  other: 'ellipse-outline',             // Other/miscellaneous
};

export const CATEGORY_COLORS: Record<string, string> = {
  // Fitness & Workout - Energetic colors
  fitness: Colors.accent1,              // Warm orange
  workout: Colors.accent1,              // Warm orange
  running: Colors.accent1,              // Warm orange
  yoga: Colors.accent3,                 // Teal for calm
  cycling: Colors.accent1,              // Warm orange
  swimming: Colors.accent3,             // Teal for water
  
  // Health & Wellness - Calming colors
  wellness: Colors.accent3,             // Teal
  health: Colors.accent3,               // Teal
  sleep: Colors.primaryText,            // Dark blue for night
  meditation: Colors.accent3,           // Teal for peace
  breathing: Colors.accent3,            // Teal for calm
  
  // Nutrition - Natural colors
  nutrition: Colors.accent3,            // Teal for health
  water: Colors.accent3,                // Teal for water
  diet: Colors.accent3,                 // Teal for health
  vitamins: Colors.accent3,             // Teal for health
  
  // Productivity & Learning - Professional colors
  productivity: Colors.primaryText,     // Dark blue
  learning: Colors.primaryText,         // Dark blue
  writing: Colors.primaryText,          // Dark blue
  coding: Colors.primaryText,           // Dark blue
  
  // Social & Personal - Warm colors
  social: Colors.accent1,               // Warm orange
  family: Colors.accent1,               // Warm orange
  friends: Colors.accent1,              // Warm orange
  
  // Creative & Hobbies - Vibrant colors
  creative: Colors.accent1,             // Warm orange
  music: Colors.accent1,                // Warm orange
  art: Colors.accent1,                  // Warm orange
  photography: Colors.accent1,          // Warm orange
  
  // Daily Habits - Neutral colors
  hygiene: Colors.accent3,              // Teal for cleanliness
  cleaning: Colors.accent3,             // Teal for cleanliness
  skincare: Colors.accent3,             // Teal for care
  
  // Default
  other: Colors.primaryText,            // Dark blue
};

/**
 * Get the appropriate icon for a habit category
 * @param category - The habit category
 * @returns The icon name for the category
 */
export const getCategoryIcon = (category: string): string => {
  const normalizedCategory = category?.toLowerCase()?.trim() || 'other';
  return CATEGORY_ICONS[normalizedCategory] || CATEGORY_ICONS.other;
};

/**
 * Get the appropriate color for a habit category
 * @param category - The habit category
 * @returns The color for the category
 */
export const getCategoryColor = (category: string): string => {
  const normalizedCategory = category?.toLowerCase()?.trim() || 'other';
  return CATEGORY_COLORS[normalizedCategory] || CATEGORY_COLORS.other;
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
