// useAnalytics Hook - Analytics state management
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import analyticsService, { 
  HabitAnalytics, 
  PeriodAnalytics, 
  TrendData, 
  InsightData 
} from '../services/analyticsService';

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

  // Load habit analytics
  const loadHabitAnalytics = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingAnalytics(true);
    
    try {
      const analytics = await analyticsService.getHabitAnalytics(user.id);
      setHabitAnalytics(analytics);
    } catch (err) {
      console.error('Error loading habit analytics:', err);
      setError('Failed to load habit analytics');
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [user?.id]);

  // Load period analytics
  const loadPeriodAnalytics = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const [week, month, year] = await Promise.all([
        analyticsService.getPeriodAnalytics(user.id, 'week'),
        analyticsService.getPeriodAnalytics(user.id, 'month'),
        analyticsService.getPeriodAnalytics(user.id, 'year')
      ]);
      
      setWeekAnalytics(week);
      setMonthAnalytics(month);
      setYearAnalytics(year);
    } catch (err) {
      console.error('Error loading period analytics:', err);
      setError('Failed to load period analytics');
    }
  }, [user?.id]);

  // Load trend data
  const loadTrendData = useCallback(async (days: number = 30) => {
    if (!user?.id) return;
    
    setIsLoadingTrends(true);
    
    try {
      const trends = await analyticsService.getTrendData(user.id, days);
      setTrendData(trends);
    } catch (err) {
      console.error('Error loading trend data:', err);
      setError('Failed to load trend data');
    } finally {
      setIsLoadingTrends(false);
    }
  }, [user?.id]);

  // Load insights
  const loadInsights = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingInsights(true);
    
    try {
      const insightsData = await analyticsService.getInsights(user.id);
      setInsights(insightsData);
    } catch (err) {
      console.error('Error loading insights:', err);
      setError('Failed to load insights');
    } finally {
      setIsLoadingInsights(false);
    }
  }, [user?.id]);

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

  // Initialize data on mount
  useEffect(() => {
    if (user?.id) {
      refreshAnalytics();
      loadTrendData();
      loadInsights();
    }
  }, [user?.id, refreshAnalytics, loadTrendData, loadInsights]);

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
