import { Habit, HabitCategory, HabitFrequency, HabitCompletion, Streak, CreateHabitForm } from '../../types';

// Realistic habit names by category
const HABIT_NAMES_BY_CATEGORY: Record<HabitCategory, string[]> = {
  fitness: ['Morning Workout', 'Evening Run', 'Gym Session', 'Push-ups', 'Yoga Practice'],
  workout: ['Strength Training', 'Cardio Session', 'HIIT Workout', 'Weight Lifting', 'Bodyweight Exercise'],
  running: ['Morning Jog', 'Evening Run', '5K Training', 'Marathon Prep', 'Trail Running'],
  yoga: ['Morning Yoga', 'Evening Stretch', 'Vinyasa Flow', 'Meditation Pose', 'Restorative Yoga'],
  cycling: ['Bike Commute', 'Weekend Ride', 'Indoor Cycling', 'Mountain Biking', 'Road Cycling'],
  swimming: ['Pool Laps', 'Open Water Swim', 'Water Aerobics', 'Swim Training', 'Aqua Fitness'],
  wellness: ['Self Care', 'Wellness Check', 'Health Routine', 'Body Scan', 'Wellness Journal'],
  health: ['Take Vitamins', 'Health Check', 'Blood Pressure', 'Weight Check', 'Health Tracking'],
  sleep: ['Early Bedtime', 'Sleep 8 Hours', 'No Screens Before Bed', 'Sleep Routine', 'Quality Sleep'],
  meditation: ['Morning Meditation', 'Mindfulness Practice', 'Breathing Exercise', 'Zen Moment', 'Inner Peace'],
  breathing: ['Deep Breathing', 'Breath Work', 'Pranayama', 'Calm Breathing', 'Stress Relief'],
  nutrition: ['Healthy Eating', 'Meal Prep', 'Balanced Diet', 'Nutrition Tracking', 'Mindful Eating'],
  water: ['Drink Water', '8 Glasses Daily', 'Hydration Goal', 'Water Intake', 'Stay Hydrated'],
  diet: ['Healthy Diet', 'Portion Control', 'Clean Eating', 'Diet Plan', 'Nutritious Meals'],
  vitamins: ['Daily Vitamins', 'Supplement Routine', 'Vitamin D', 'Multivitamin', 'Health Supplements'],
  productivity: ['Daily Planning', 'Task Management', 'Focus Time', 'Productivity Boost', 'Efficient Work'],
  learning: ['Read 30 Minutes', 'Study Session', 'Learn Something New', 'Skill Development', 'Knowledge Growth'],
  writing: ['Daily Journal', 'Creative Writing', 'Blog Post', 'Writing Practice', 'Story Time'],
  coding: ['Code Practice', 'Programming Study', 'Side Project', 'Algorithm Practice', 'Tech Learning'],
  social: ['Call Family', 'Meet Friends', 'Social Time', 'Community Engagement', 'Relationship Building'],
  family: ['Family Time', 'Quality Moments', 'Family Dinner', 'Family Activity', 'Bonding Time'],
  friends: ['Friend Hangout', 'Social Meetup', 'Catch Up Call', 'Friend Activity', 'Social Connection'],
  creative: ['Creative Project', 'Art Time', 'Creative Expression', 'Artistic Practice', 'Innovation Time'],
  music: ['Practice Instrument', 'Music Listening', 'Sing Along', 'Music Creation', 'Musical Expression'],
  art: ['Drawing Practice', 'Painting Session', 'Art Creation', 'Artistic Expression', 'Creative Art'],
  photography: ['Photo Walk', 'Photography Practice', 'Picture Taking', 'Visual Art', 'Photo Project'],
  hygiene: ['Brush Teeth', 'Shower Daily', 'Personal Care', 'Hygiene Routine', 'Clean Habits'],
  cleaning: ['Tidy Up', 'House Cleaning', 'Organize Space', 'Declutter', 'Clean Environment'],
  skincare: ['Skincare Routine', 'Face Care', 'Moisturize', 'Skin Health', 'Beauty Routine'],
  mindfulness: ['Mindful Moment', 'Present Awareness', 'Mindful Eating', 'Conscious Living', 'Awareness Practice'],
  other: ['Daily Habit', 'Personal Goal', 'Life Improvement', 'Good Habit', 'Positive Change']
};

// Generate unique ID for testing
let idCounter = 1;
const generateId = (prefix: string = 'test'): string => `${prefix}-${idCounter++}-${Date.now()}`;

/**
 * Create a mock habit with realistic data
 */
export const createMockHabit = (overrides: Partial<Habit> = {}): Habit => {
  const category = (overrides.category || 'fitness') as HabitCategory;
  const habitNames = HABIT_NAMES_BY_CATEGORY[category] || HABIT_NAMES_BY_CATEGORY.other;
  const randomName = habitNames[Math.floor(Math.random() * habitNames.length)];
  
  return {
    id: generateId('habit'),
    userId: 'test-user-123',
    name: randomName,
    category,
    frequency: 'daily' as HabitFrequency,
    isPublic: false,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides
  };
};

/**
 * Create multiple mock habits with variety
 */
export const createMockHabits = (count: number, userId = 'test-user-123'): Habit[] => {
  const habits: Habit[] = [];
  const categories: HabitCategory[] = ['fitness', 'wellness', 'productivity', 'learning', 'social'];
  const frequencies: HabitFrequency[] = ['daily', 'weekly', 'monthly'];
  
  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const frequency = frequencies[i % frequencies.length];
    const createdDate = new Date('2025-01-01T00:00:00Z');
    createdDate.setDate(createdDate.getDate() + i);
    
    habits.push(createMockHabit({
      id: generateId('habit'),
      userId,
      category,
      frequency,
      isPublic: i % 3 === 0, // Every third habit is public
      targetValue: frequency === 'daily' ? undefined : Math.floor(Math.random() * 5) + 1,
      unit: frequency !== 'daily' ? 'times' : undefined,
      createdAt: createdDate,
      updatedAt: createdDate
    }));
  }
  
  return habits;
};

/**
 * Create a mock habit completion
 */
export const createMockHabitCompletion = (overrides: Partial<HabitCompletion> = {}): HabitCompletion => ({
  id: generateId('completion'),
  habitId: 'test-habit-123',
  userId: 'test-user-123',
  completedAt: new Date('2025-01-01T10:00:00Z'),
  value: 1,
  ...overrides
});

/**
 * Create multiple habit completions for a date range
 */
export const createMockHabitCompletions = (
  habitId: string,
  userId: string,
  days: number = 7
): HabitCompletion[] => {
  const completions: HabitCompletion[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const completionDate = new Date(today);
    completionDate.setDate(completionDate.getDate() - i);
    completionDate.setHours(10, 0, 0, 0); // Consistent time
    
    completions.push(createMockHabitCompletion({
      id: generateId('completion'),
      habitId,
      userId,
      completedAt: completionDate,
      value: Math.floor(Math.random() * 3) + 1 // 1-3 value
    }));
  }
  
  return completions;
};

/**
 * Create a mock streak
 */
export const createMockStreak = (overrides: Partial<Streak> = {}): Streak => ({
  habitId: 'test-habit-123',
  currentStreak: 5,
  longestStreak: 10,
  lastCompletedDate: new Date('2025-01-01T00:00:00Z'),
  ...overrides
});

/**
 * Create realistic streak data based on completions
 */
export const createMockStreakFromCompletions = (
  habitId: string,
  completions: HabitCompletion[]
): Streak => {
  if (completions.length === 0) {
    return createMockStreak({
      habitId,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: undefined
    });
  }
  
  // Sort completions by date (newest first)
  const sortedCompletions = [...completions].sort(
    (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
  );
  
  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const completion of sortedCompletions) {
    const completionDate = new Date(completion.completedAt);
    completionDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - currentStreak);
    
    if (completionDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Calculate longest streak (simplified)
  const longestStreak = Math.max(currentStreak, Math.floor(completions.length * 0.7));
  
  return createMockStreak({
    habitId,
    currentStreak,
    longestStreak,
    lastCompletedDate: sortedCompletions[0]?.completedAt
  });
};

/**
 * Create a mock CreateHabitForm
 */
export const createMockCreateHabitForm = (overrides: Partial<CreateHabitForm> = {}): CreateHabitForm => {
  const category = (overrides.category || 'fitness') as HabitCategory;
  const habitNames = HABIT_NAMES_BY_CATEGORY[category] || HABIT_NAMES_BY_CATEGORY.other;
  const randomName = habitNames[Math.floor(Math.random() * habitNames.length)];
  
  return {
    name: randomName,
    category,
    frequency: 'daily' as HabitFrequency,
    isPublic: false,
    ...overrides
  };
};

/**
 * Create habit with complete data (habit + completions + streak)
 */
export const createMockHabitWithData = (
  overrides: Partial<Habit> = {},
  completionDays: number = 7
): {
  habit: Habit;
  completions: HabitCompletion[];
  streak: Streak;
} => {
  const habit = createMockHabit(overrides);
  const completions = createMockHabitCompletions(habit.id, habit.userId, completionDays);
  const streak = createMockStreakFromCompletions(habit.id, completions);
  
  return { habit, completions, streak };
};

/**
 * Reset ID counter for consistent testing
 */
export const resetHabitFactoryIds = (): void => {
  idCounter = 1;
};