// Analytics Service - Habit insights and trend analysis
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  startAfter,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Habit, HabitCompletion, Streak } from '../types';

export interface HabitAnalytics {
  habitId: string;
  habitName: string;
  category: string;
  totalCompletions: number;
  completionRate: number; // Percentage
  currentStreak: number;
  longestStreak: number;
  averageCompletionsPerWeek: number;
  lastCompleted?: Date;
  createdAt: Date;
}

export interface PeriodAnalytics {
  period: 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  totalCompletions: number;
  uniqueHabitsCompleted: number;
  completionRate: number;
  streakMilestones: number;
  mostActiveDay: string;
  topCategories: { category: string; completions: number }[];
}

export interface TrendData {
  date: Date;
  completions: number;
  habits: string[];
}

export interface InsightData {
  type: 'achievement' | 'improvement' | 'streak' | 'consistency';
  title: string;
  description: string;
  value?: number;
  trend?: 'up' | 'down' | 'stable';
  habitId?: string;
}

class AnalyticsService {
  private habitsCollection = collection(db, 'habits');
  private completionsCollection = collection(db, 'completions');
  private streaksCollection = collection(db, 'streaks');

  // Get comprehensive analytics for a user's habits
  async getHabitAnalytics(userId: string): Promise<HabitAnalytics[]> {
    try {
      // Get all user habits
      const habitsQuery = query(
        this.habitsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const habitsSnapshot = await getDocs(habitsQuery);
      const habits = habitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Habit[];

      // Get all completions for analysis
      const completionsQuery = query(
        this.completionsCollection,
        where('userId', '==', userId),
        orderBy('completedAt', 'desc')
      );
      const completionsSnapshot = await getDocs(completionsQuery);
      const completions = completionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HabitCompletion[];

      // Get all streaks
      const streaksQuery = query(
        this.streaksCollection,
        where('userId', '==', userId)
      );
      const streaksSnapshot = await getDocs(streaksQuery);
      const streaks = streaksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Streak[];

      // Calculate analytics for each habit
      const analytics: HabitAnalytics[] = habits.map(habit => {
        const habitCompletions = completions.filter(c => c.habitId === habit.id);
        const habitStreak = streaks.find(s => s.habitId === habit.id);
        
        // Calculate days since creation
        const daysSinceCreation = Math.max(1, 
          Math.floor((Date.now() - habit.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        );
        
        // Calculate completion rate
        const completionRate = (habitCompletions.length / daysSinceCreation) * 100;
        
        // Calculate average completions per week
        const weeksSinceCreation = Math.max(1, daysSinceCreation / 7);
        const averageCompletionsPerWeek = habitCompletions.length / weeksSinceCreation;
        
        // Find last completion
        const lastCompletion = habitCompletions.length > 0 ? 
          habitCompletions[0].completedAt : undefined;

        return {
          habitId: habit.id,
          habitName: habit.name,
          category: habit.category,
          totalCompletions: habitCompletions.length,
          completionRate: Math.round(completionRate * 100) / 100,
          currentStreak: habitStreak?.currentStreak || 0,
          longestStreak: habitStreak?.longestStreak || 0,
          averageCompletionsPerWeek: Math.round(averageCompletionsPerWeek * 100) / 100,
          lastCompleted: lastCompletion,
          createdAt: habit.createdAt
        };
      });

      return analytics.sort((a, b) => b.totalCompletions - a.totalCompletions);
    } catch (error) {
      console.error('Error getting habit analytics:', error);
      throw error;
    }
  }

  // Get analytics for a specific time period
  async getPeriodAnalytics(
    userId: string, 
    period: 'week' | 'month' | 'year'
  ): Promise<PeriodAnalytics> {
    try {
      const now = new Date();
      let startDate: Date;
      let endDate = now;

      // Calculate period dates
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      // Get completions in period
      const completionsQuery = query(
        this.completionsCollection,
        where('userId', '==', userId),
        where('completedAt', '>=', Timestamp.fromDate(startDate)),
        where('completedAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('completedAt', 'desc')
      );
      const completionsSnapshot = await getDocs(completionsQuery);
      const completions = completionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HabitCompletion[];

      // Get habits for category analysis
      const habitsQuery = query(
        this.habitsCollection,
        where('userId', '==', userId)
      );
      const habitsSnapshot = await getDocs(habitsQuery);
      const habits = habitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Habit[];

      // Calculate metrics
      const totalCompletions = completions.length;
      const uniqueHabitsCompleted = new Set(completions.map(c => c.habitId)).size;
      const totalPossibleCompletions = habits.length * this.getDaysInPeriod(startDate, endDate);
      const completionRate = totalPossibleCompletions > 0 ? 
        (totalCompletions / totalPossibleCompletions) * 100 : 0;

      // Find most active day
      const dayCompletions: Record<string, number> = {};
      completions.forEach(completion => {
        const day = completion.completedAt.toLocaleDateString('en-US', { weekday: 'long' });
        dayCompletions[day] = (dayCompletions[day] || 0) + 1;
      });
      const mostActiveDay = Object.entries(dayCompletions)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data';

      // Calculate top categories
      const categoryCompletions: Record<string, number> = {};
      completions.forEach(completion => {
        const habit = habits.find(h => h.id === completion.habitId);
        if (habit) {
          categoryCompletions[habit.category] = (categoryCompletions[habit.category] || 0) + 1;
        }
      });
      const topCategories = Object.entries(categoryCompletions)
        .map(([category, completions]) => ({ category, completions }))
        .sort((a, b) => b.completions - a.completions)
        .slice(0, 5);

      // Count streak milestones (streaks of 7, 30, 100+ days achieved in period)
      const streakMilestones = 0; // This would require more complex streak tracking

      return {
        period,
        startDate,
        endDate,
        totalCompletions,
        uniqueHabitsCompleted,
        completionRate: Math.round(completionRate * 100) / 100,
        streakMilestones,
        mostActiveDay,
        topCategories
      };
    } catch (error) {
      console.error('Error getting period analytics:', error);
      throw error;
    }
  }

  // Get trend data for charts
  async getTrendData(
    userId: string, 
    days: number = 30
  ): Promise<TrendData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const completionsQuery = query(
        this.completionsCollection,
        where('userId', '==', userId),
        where('completedAt', '>=', Timestamp.fromDate(startDate)),
        where('completedAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('completedAt', 'asc')
      );
      const completionsSnapshot = await getDocs(completionsQuery);
      const completions = completionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HabitCompletion[];

      // Group completions by date
      const dailyData: Record<string, { completions: number; habits: Set<string> }> = {};
      
      // Initialize all days with zero completions
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        dailyData[dateKey] = { completions: 0, habits: new Set() };
      }

      // Fill in actual completion data
      completions.forEach(completion => {
        const dateKey = completion.completedAt.toISOString().split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].completions++;
          dailyData[dateKey].habits.add(completion.habitId);
        }
      });

      // Convert to array format
      return Object.entries(dailyData).map(([dateStr, data]) => ({
        date: new Date(dateStr),
        completions: data.completions,
        habits: Array.from(data.habits)
      }));
    } catch (error) {
      console.error('Error getting trend data:', error);
      throw error;
    }
  }

  // Generate personalized insights
  async getInsights(userId: string): Promise<InsightData[]> {
    try {
      const analytics = await this.getHabitAnalytics(userId);
      const weekAnalytics = await this.getPeriodAnalytics(userId, 'week');
      const monthAnalytics = await this.getPeriodAnalytics(userId, 'month');
      
      const insights: InsightData[] = [];

      // Achievement insights
      const topHabit = analytics[0];
      if (topHabit && topHabit.totalCompletions > 0) {
        insights.push({
          type: 'achievement',
          title: 'Top Performer',
          description: `${topHabit.habitName} is your most completed habit with ${topHabit.totalCompletions} completions!`,
          value: topHabit.totalCompletions,
          habitId: topHabit.habitId
        });
      }

      // Streak insights
      const bestStreak = analytics.reduce((best, current) => 
        current.currentStreak > best.currentStreak ? current : best, analytics[0]);
      
      if (bestStreak && bestStreak.currentStreak > 0) {
        insights.push({
          type: 'streak',
          title: 'Current Streak Champion',
          description: `You're on a ${bestStreak.currentStreak} day streak with ${bestStreak.habitName}!`,
          value: bestStreak.currentStreak,
          habitId: bestStreak.habitId
        });
      }

      // Consistency insights
      const consistentHabits = analytics.filter(h => h.completionRate > 80);
      if (consistentHabits.length > 0) {
        insights.push({
          type: 'consistency',
          title: 'Consistency Master',
          description: `You have ${consistentHabits.length} habit${consistentHabits.length > 1 ? 's' : ''} with over 80% completion rate!`,
          value: consistentHabits.length
        });
      }

      // Improvement insights
      if (weekAnalytics.completionRate > monthAnalytics.completionRate) {
        insights.push({
          type: 'improvement',
          title: 'Weekly Improvement',
          description: `Your completion rate this week (${weekAnalytics.completionRate.toFixed(1)}%) is higher than your monthly average!`,
          trend: 'up',
          value: weekAnalytics.completionRate
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  // Helper method to calculate days in period
  private getDaysInPeriod(startDate: Date, endDate: Date): number {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
