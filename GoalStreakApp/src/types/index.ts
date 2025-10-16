// GoalStreak TypeScript Type Definitions

// Import timer types for use in this file
import { TimerConfig, TimerConfigForm } from './timer';

// Re-export timer types for convenience
export * from './timer';

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
  timer?: TimerConfig; // Optional timer configuration
  reminderTime?: string; // Optional reminder time in HH:MM format (e.g., "09:30")
  reminderEnabled?: boolean; // Whether reminder notifications are enabled
  createdAt: Date;
  updatedAt: Date;
}

export type HabitCategory = 
  // 6-category system with optimized color palette
  | 'fitness'      // 🟣 Purple (#B771E5) - Exercise, workouts, running, sports
  | 'wellness'     // 🔷 Teal (#48B3AF) - Health, meditation, sleep, mindfulness
  | 'nutrition'    // 🟢 Light Green (#A7E399) - Food, water, vitamins, diet
  | 'social'       // ⚫ Dark Charcoal (#3C3D37) - Friends, family, relationships, music
  | 'productivity' // 🔷 Navy (#003161) - Work, learning, organization, writing
  | 'other';       // 🟠 Orange (#FF9013) - Other habits

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';



// Habit Completion Types
export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completedAt: Date;
  value?: number;
  notes?: string;
  timerSession?: {
    sessionId: string;
    duration: number; // Actual duration spent
    targetDuration: number; // Original timer duration
    completedViaTimer: boolean;
  };
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

// Onboarding Types
export interface HabitTemplate {
  id: string;
  name: string;
  category: HabitCategory;
  icon: string; // Ionicons name as string
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  popularity: number;
  tips: string[];
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
  timer?: TimerConfig; // Optional timer configuration
  reminderTime?: string; // Optional reminder time in HH:MM format
  reminderEnabled?: boolean; // Whether reminder notifications are enabled
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
