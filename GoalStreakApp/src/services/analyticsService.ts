// Analytics Service - Comprehensive habit analytics and insights
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Habit, HabitCompletion, HabitCategory } from '../types';
import { logInfo, logError } from './smartLoggingService';

// Analytics Types
export interface HabitAnalytics {
  habitId: string;
  habitName: string;
  category: HabitCategory;
  totalCompletions: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  lastCompleted?: Date;
  averageCompletionsPerWeek: number;
}

export interface PeriodAnalytics {
  period: 'week' | 'month' | 'year';
  totalCompletions: number;
  uniqueHabitsCompleted: number;
  completionRate: number;
  mostActiveDay: string;
  topCategories: Array<{
    category: HabitCategory;
    completions: number;
  }>;
}

export interface TrendData {
  date: string;
  completions: number;
  habits: number;
}

export interface InsightData {
  type: 'streak' | 'category' | 'time' | 'improvement';
  title: string;
  description: string;
  value?: number;
  icon: string;
}

// Helper function to get date range
const getDateRange = (period: 'week' | 'month' | 'year'): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setDate(end.getDate() - 30);
      break;
    case 'year':
      start.setDate(end.getDate() - 365);
      break;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// Calculate streak from completions
const calculateStreak = (completions: HabitCompletion[]): { current: number; longest: number } => {
  if (completions.length === 0) return { current: 0, longest: 0 };

  // Sort by date descending
  const sorted = [...completions].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  const lastDate = sorted[0].completedAt;

  // Check if most recent completion was today or yesterday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastCompletionDate = new Date(lastDate);
  lastCompletionDate.setHours(0, 0, 0, 0);

  if (lastCompletionDate >= yesterday) {
    currentStreak = 1;

    // Count consecutive days
    for (let i = 1; i < sorted.length; i++) {
      const currentDate = new Date(sorted[i].completedAt);
      currentDate.setHours(0, 0, 0, 0);

      const prevDate = new Date(sorted[i - 1].completedAt);
      prevDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor(
        (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        currentStreak++;
        tempStreak++;
      } else if (dayDiff === 0) {
        // Same day, don't break streak
        continue;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  tempStreak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const currentDate = new Date(sorted[i].completedAt);
    currentDate.setHours(0, 0, 0, 0);

    const prevDate = new Date(sorted[i - 1].completedAt);
    prevDate.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor(
      (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else if (dayDiff === 0) {
      // Same day, continue
      continue;
    } else {
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
};

// Get habit analytics for a specific habit
export const getHabitAnalytics = async (
  userId: string,
  habitId: string,
  habit: Habit
): Promise<HabitAnalytics> => {
  try {
    // Get all completions for this habit
    const completionsRef = collection(db, 'completions');
    const q = query(
      completionsRef,
      where('userId', '==', userId),
      where('habitId', '==', habitId),
      orderBy('completedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const completions: HabitCompletion[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate() || new Date(),
    })) as HabitCompletion[];

    // Calculate streaks
    const { current, longest } = calculateStreak(completions);

    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCompletions = completions.filter((c) => c.completedAt >= thirtyDaysAgo);

    const completionRate = (recentCompletions.length / 30) * 100;

    // Calculate average completions per week
    const weeklyAverage =
      completions.length > 0
        ? completions.length /
          Math.max(
            1,
            Math.ceil((Date.now() - habit.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000))
          )
        : 0;

    return {
      habitId,
      habitName: habit.name,
      category: habit.category,
      totalCompletions: completions.length,
      completionRate: Math.min(100, completionRate),
      currentStreak: current,
      longestStreak: longest,
      lastCompleted: completions.length > 0 ? completions[0].completedAt : undefined,
      averageCompletionsPerWeek: Math.round(weeklyAverage * 10) / 10,
    };
  } catch (error) {
    logError('analytics', 'Error getting habit analytics', { habitId, error });
    throw error;
  }
};

// Get all habit analytics for a user
export const getAllHabitAnalytics = async (
  userId: string,
  habits: Habit[]
): Promise<HabitAnalytics[]> => {
  try {
    logInfo('analytics', 'Loading analytics for all habits', { userId, habitCount: habits.length });

    const analyticsPromises = habits.map((habit) => getHabitAnalytics(userId, habit.id, habit));

    const analytics = await Promise.all(analyticsPromises);

    // Sort by total completions descending
    return analytics.sort((a, b) => b.totalCompletions - a.totalCompletions);
  } catch (error) {
    logError('analytics', 'Error getting all habit analytics', { userId, error });
    throw error;
  }
};

// Get period analytics
export const getPeriodAnalytics = async (
  userId: string,
  period: 'week' | 'month' | 'year'
): Promise<PeriodAnalytics> => {
  try {
    const { start, end } = getDateRange(period);

    // Get completions in period
    const completionsRef = collection(db, 'completions');
    const q = query(
      completionsRef,
      where('userId', '==', userId),
      where('completedAt', '>=', Timestamp.fromDate(start)),
      where('completedAt', '<=', Timestamp.fromDate(end))
    );

    const snapshot = await getDocs(q);
    const completions: HabitCompletion[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate() || new Date(),
    })) as HabitCompletion[];

    // Get habits to map categories
    const habitsRef = collection(db, 'habits');
    const habitsQuery = query(habitsRef, where('userId', '==', userId));
    const habitsSnapshot = await getDocs(habitsQuery);
    const habits: Habit[] = habitsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Habit[];

    const habitMap = new Map(habits.map((h) => [h.id, h]));

    // Calculate unique habits completed
    const uniqueHabits = new Set(completions.map((c) => c.habitId));

    // Calculate most active day
    const dayCount: Record<string, number> = {};
    completions.forEach((c) => {
      const day = c.completedAt.toLocaleDateString('en-US', { weekday: 'short' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Calculate top categories
    const categoryCount: Record<string, number> = {};
    completions.forEach((c) => {
      const habit = habitMap.get(c.habitId);
      if (habit) {
        categoryCount[habit.category] = (categoryCount[habit.category] || 0) + 1;
      }
    });

    const topCategories = Object.entries(categoryCount)
      .map(([category, completions]) => ({
        category: category as HabitCategory,
        completions,
      }))
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 5);

    // Calculate completion rate
    const daysInPeriod = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const expectedCompletions = uniqueHabits.size * daysInPeriod;
    const completionRate =
      expectedCompletions > 0 ? (completions.length / expectedCompletions) * 100 : 0;

    return {
      period,
      totalCompletions: completions.length,
      uniqueHabitsCompleted: uniqueHabits.size,
      completionRate: Math.min(100, completionRate),
      mostActiveDay,
      topCategories,
    };
  } catch (error) {
    logError('analytics', 'Error getting period analytics', { userId, period, error });
    throw error;
  }
};

// Get trend data for charts
export const getTrendData = async (userId: string, days: number = 30): Promise<TrendData[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get completions in range
    const completionsRef = collection(db, 'completions');
    const q = query(
      completionsRef,
      where('userId', '==', userId),
      where('completedAt', '>=', Timestamp.fromDate(startDate)),
      where('completedAt', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(q);
    const completions: HabitCompletion[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate() || new Date(),
    })) as HabitCompletion[];

    // Group by date
    const dateMap: Record<string, { completions: number; habits: Set<string> }> = {};

    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap[dateStr] = { completions: 0, habits: new Set() };
    }

    // Fill in completion data
    completions.forEach((c) => {
      const dateStr = c.completedAt.toISOString().split('T')[0];
      if (dateMap[dateStr]) {
        dateMap[dateStr].completions++;
        dateMap[dateStr].habits.add(c.habitId);
      }
    });

    // Convert to array
    return Object.entries(dateMap)
      .map(([date, data]) => ({
        date,
        completions: data.completions,
        habits: data.habits.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    logError('analytics', 'Error getting trend data', { userId, days, error });
    throw error;
  }
};

// Generate insights based on analytics
export const generateInsights = async (
  userId: string,
  habitAnalytics: HabitAnalytics[],
  periodAnalytics: PeriodAnalytics
): Promise<InsightData[]> => {
  try {
    const insights: InsightData[] = [];

    // Streak insights
    const bestStreak = habitAnalytics.reduce(
      (max, h) => (h.currentStreak > max.currentStreak ? h : max),
      habitAnalytics[0]
    );

    if (bestStreak && bestStreak.currentStreak >= 7) {
      insights.push({
        type: 'streak',
        title: `${bestStreak.currentStreak}-Day Streak! 🔥`,
        description: `You're on fire with "${bestStreak.habitName}"! Keep it going!`,
        value: bestStreak.currentStreak,
        icon: 'flame',
      });
    }

    // Category insights
    if (periodAnalytics.topCategories.length > 0) {
      const topCategory = periodAnalytics.topCategories[0];
      insights.push({
        type: 'category',
        title: `${topCategory.category.charAt(0).toUpperCase() + topCategory.category.slice(1)} Champion`,
        description: `You completed ${topCategory.completions} ${topCategory.category} habits this ${periodAnalytics.period}!`,
        value: topCategory.completions,
        icon: 'trophy',
      });
    }

    // Improvement insights
    const improvingHabits = habitAnalytics.filter(
      (h) => h.currentStreak > 0 && h.completionRate > 70
    );

    if (improvingHabits.length > 0) {
      insights.push({
        type: 'improvement',
        title: 'Strong Performance! 💪',
        description: `${improvingHabits.length} habit${improvingHabits.length > 1 ? 's are' : ' is'} showing great consistency!`,
        value: improvingHabits.length,
        icon: 'trending-up',
      });
    }

    // Time insights
    if (periodAnalytics.mostActiveDay !== 'N/A') {
      insights.push({
        type: 'time',
        title: `${periodAnalytics.mostActiveDay} is Your Day!`,
        description: `You're most productive on ${periodAnalytics.mostActiveDay}s. Schedule important habits then!`,
        icon: 'calendar',
      });
    }

    // Completion rate insight
    if (periodAnalytics.completionRate >= 80) {
      insights.push({
        type: 'improvement',
        title: 'Excellent Consistency! ⭐',
        description: `${Math.round(periodAnalytics.completionRate)}% completion rate this ${periodAnalytics.period}. You're crushing it!`,
        value: Math.round(periodAnalytics.completionRate),
        icon: 'star',
      });
    }

    return insights;
  } catch (error) {
    logError('analytics', 'Error generating insights', { userId, error });
    return [];
  }
};

// Export analytics service
export const analyticsService = {
  getHabitAnalytics,
  getAllHabitAnalytics,
  getPeriodAnalytics,
  getTrendData,
  generateInsights,
};

export default analyticsService;
