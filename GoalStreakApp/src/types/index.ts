// GoalStreak TypeScript Type Definitions

// User Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Habit Types
export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  targetValue?: number;
  unit?: string;
  icon?: string; // User-selected icon name
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type HabitCategory = 
  // Fitness & Workout
  | 'fitness'
  | 'workout'
  | 'running'
  | 'yoga'
  | 'cycling'
  | 'swimming'
  
  // Health & Wellness
  | 'wellness'
  | 'health'
  | 'sleep'
  | 'meditation'
  | 'breathing'
  
  // Nutrition
  | 'nutrition'
  | 'water'
  | 'diet'
  | 'vitamins'
  
  // Productivity & Learning
  | 'productivity'
  | 'learning'
  | 'writing'
  | 'coding'
  
  // Social & Personal
  | 'social'
  | 'family'
  | 'friends'
  
  // Creative & Hobbies
  | 'creative'
  | 'music'
  | 'art'
  | 'photography'
  
  // Daily Habits
  | 'hygiene'
  | 'cleaning'
  | 'skincare'
  
  // Legacy (for backward compatibility)
  | 'mindfulness'
  
  // Default
  | 'other';

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

// Habit Completion Types
export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completedAt: Date;
  value?: number;
  notes?: string;
}

// Streak Types
export interface Streak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: Date;
}

// Friend Types
export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: FriendStatus;
  createdAt: Date;
}

export type FriendStatus = 'pending' | 'accepted' | 'blocked';

// Activity Feed Types
export interface ActivityFeedItem {
  id: string;
  userId: string;
  habitId: string;
  type: ActivityType;
  data: ActivityData;
  createdAt: Date;
}

export type ActivityType = 
  | 'habit_completed'
  | 'streak_milestone'
  | 'habit_created'
  | 'friend_added';

export interface ActivityData {
  habitName: string;
  streakCount?: number;
  value?: number;
  unit?: string;
}

// Reaction Types
export interface Reaction {
  id: string;
  activityId: string;
  userId: string;
  type: ReactionType;
  createdAt: Date;
}

export type ReactionType = '👏' | '🔥' | '💪' | '❤️';

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  CreateHabit: undefined;
  MainTabs: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Habits: undefined;
  Feed: undefined;
  Social: undefined;
  Analytics: undefined;
  Profile: undefined;
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export interface CreateHabitForm {
  name: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  targetValue?: number;
  unit?: string;
  icon?: string; // User-selected icon name
  isPublic: boolean;
}

// Component Props Types
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  disabled?: boolean;
}

// State Management Types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface HabitsState {
  habits: Habit[];
  completions: HabitCompletion[];
  streaks: Record<string, Streak>;
  isLoading: boolean;
}

export interface FriendsState {
  friends: Friend[];
  activityFeed: ActivityFeedItem[];
  reactions: Reaction[];
  isLoading: boolean;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
