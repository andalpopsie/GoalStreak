// useAnalytics Hook - Analytics state management with real data
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useHabits } from './useHabits';
import { 
  getAllHabitAnalytics,
  getPeriodAnalytics,
  getTrendData,
  generateInsights,
  HabitAnalytics,
  PeriodAnalytics,
  TrendData,
  InsightData,
} from '../services/analyticsService';
import { logInfo, logError } from '../services/smartLoggingService';

// Re-export types for convenience
export type { HabitAnalytics, PeriodAnalytics, TrendData, InsightData };

interface UseAnalyticsReturn {
  // Data
  habitAnalytics: HabitAnalytics[];
  weekAnalytics: PeriodAnalytics | null;
  monthAnalytics: PeriodAnalytics | null;
  yearAnalytics: PeriodAnalytics | null;
  trendData: TrendData[];
  insights: InsightData[];
  
  // Loading states
  isLoadingAnalytics: boolean;
  isLoadingTrends: boolean;
  isLoadingInsights: boolean;
  
  // Actions
  refreshAnalytics: () => Promise<void>;
  refreshTrends: (days?: number) => Promise<void>;
  refreshInsights: () => Promise<void>;
  
  // Utility
  selectedPeriod: 'week' | 'month' | 'year';
  setSelectedPeriod: (period: 'week' | 'month' | 'year') => void;
  getCurrentPeriodAnalytics: () => PeriodAnalytics | null;
  error: string | null;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const { user } = useAuth();
  const { habits } = useHabits();
  
  // State
  const [habitAnalytics, setHabitAnalytics] = useState<HabitAnalytics[]>([]);
  const [weekAnalytics, setWeekAnalytics] = useState<PeriodAnalytics | null>(null);
  const [monthAnalytics, setMonthAnalytics] = useState<PeriodAnalytics | null>(null);
  const [yearAnalytics, setYearAnalytics] = useState<PeriodAnalytics | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [insights, setInsights] = useState<InsightData[]>([]);
  
  // Loading states
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  // UI state
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [error, setError] = useState<string | null>(null);

  // Load habit analytics with real data
  const loadHabitAnalytics = useCallback(async () => {
    if (!user?.id || habits.length === 0) {
      setHabitAnalytics([]);
      return;
    }
    
    setIsLoadingAnalytics(true);
    setError(null);
    
    try {
      logInfo('analytics', 'Loading habit analytics', { userId: user.id, habitCount: habits.length });
      
      const analytics = await getAllHabitAnalytics(user.id, habits);
      setHabitAnalytics(analytics);
      
      logInfo('analytics', 'Habit analytics loaded successfully', { count: analytics.length });
    } catch (err) {
      logError('analytics', 'Error loading habit analytics', { error: err });
      setError('Failed to load habit analytics. Please try again.');
      setHabitAnalytics([]);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [user?.id, habits]);

  // Load period analytics with real data
  const loadPeriodAnalytics = useCallback(async () => {
    if (!user?.id) {
      setWeekAnalytics(null);
      setMonthAnalytics(null);
      setYearAnalytics(null);
      return;
    }
    
    try {
      logInfo('analytics', 'Loading period analytics', { userId: user.id });
      
      const [week, month, year] = await Promise.all([
        getPeriodAnalytics(user.id, 'week'),
        getPeriodAnalytics(user.id, 'month'),
        getPeriodAnalytics(user.id, 'year'),
      ]);
      
      setWeekAnalytics(week);
      setMonthAnalytics(month);
      setYearAnalytics(year);
      
      logInfo('analytics', 'Period analytics loaded successfully');
    } catch (err) {
      logError('analytics', 'Error loading period analytics', { error: err });
      setError('Failed to load period analytics. Please try again.');
      setWeekAnalytics(null);
      setMonthAnalytics(null);
      setYearAnalytics(null);
    }
  }, [user?.id]);

  // Load trend data with real data
  const loadTrendData = useCallback(async (days: number = 30) => {
    if (!user?.id) {
      setTrendData([]);
      return;
    }
    
    setIsLoadingTrends(true);
    setError(null);
    
    try {
      logInfo('analytics', 'Loading trend data', { userId: user.id, days });
      
      const trends = await getTrendData(user.id, days);
      setTrendData(trends);
      
      logInfo('analytics', 'Trend data loaded successfully', { dataPoints: trends.length });
    } catch (err) {
      logError('analytics', 'Error loading trend data', { error: err });
      setError('Failed to load trend data. Please try again.');
      setTrendData([]);
    } finally {
      setIsLoadingTrends(false);
    }
  }, [user?.id]);

  // Load insights with real data
  const loadInsights = useCallback(async () => {
    if (!user?.id || habitAnalytics.length === 0) {
      setInsights([]);
      return;
    }
    
    setIsLoadingInsights(true);
    setError(null);
    
    try {
      logInfo('analytics', 'Generating insights', { userId: user.id });
      
      const currentPeriodAnalytics = selectedPeriod === 'week' ? weekAnalytics 
        : selectedPeriod === 'month' ? monthAnalytics 
        : yearAnalytics;
      
      if (!currentPeriodAnalytics) {
        setInsights([]);
        return;
      }
      
      const generatedInsights = await generateInsights(
        user.id,
        habitAnalytics,
        currentPeriodAnalytics
      );
      
      setInsights(generatedInsights);
      
      logInfo('analytics', 'Insights generated successfully', { count: generatedInsights.length });
    } catch (err) {
      logError('analytics', 'Error generating insights', { error: err });
      setError('Failed to generate insights. Please try again.');
      setInsights([]);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [user?.id, habitAnalytics, selectedPeriod, weekAnalytics, monthAnalytics, yearAnalytics]);

  // Refresh functions
  const refreshAnalytics = useCallback(async () => {
    // Clear any previous errors when refreshing
    setError(null);
    
    await Promise.all([
      loadHabitAnalytics(),
      loadPeriodAnalytics()
    ]);
  }, [loadHabitAnalytics, loadPeriodAnalytics]);

  const refreshTrends = useCallback(async (days?: number) => {
    // Clear any previous errors when refreshing
    setError(null);
    await loadTrendData(days);
  }, [loadTrendData]);

  const refreshInsights = useCallback(async () => {
    // Clear any previous errors when refreshing
    setError(null);
    await loadInsights();
  }, [loadInsights]);

  // Get current period analytics
  const getCurrentPeriodAnalytics = useCallback(() => {
    switch (selectedPeriod) {
      case 'week':
        return weekAnalytics;
      case 'month':
        return monthAnalytics;
      case 'year':
        return yearAnalytics;
      default:
        return weekAnalytics;
    }
  }, [selectedPeriod, weekAnalytics, monthAnalytics, yearAnalytics]);

  // Initialize data on mount and when habits change
  useEffect(() => {
    if (user?.id && habits.length > 0) {
      refreshAnalytics();
      loadTrendData();
    }
  }, [user?.id, habits.length]); // Simplified dependencies to avoid infinite loops

  // Load insights when analytics data is ready
  useEffect(() => {
    if (habitAnalytics.length > 0 && (weekAnalytics || monthAnalytics || yearAnalytics)) {
      loadInsights();
    }
  }, [habitAnalytics.length, weekAnalytics, monthAnalytics, yearAnalytics, selectedPeriod]);

  return {
    // Data
    habitAnalytics,
    weekAnalytics,
    monthAnalytics,
    yearAnalytics,
    trendData,
    insights,
    
    // Loading states
    isLoadingAnalytics,
    isLoadingTrends,
    isLoadingInsights,
    
    // Actions
    refreshAnalytics,
    refreshTrends,
    refreshInsights,
    
    // Utility
    selectedPeriod,
    setSelectedPeriod,
    getCurrentPeriodAnalytics,
    error
  };
};

export default useAnalytics;
