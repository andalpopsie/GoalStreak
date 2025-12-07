// Achievements Service - Track and manage user achievements
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACHIEVEMENTS_KEY = '@goalstreak_achievements';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: Date;
  isUnlocked: boolean;
  category: 'streak' | 'completion' | 'social' | 'special';
}

// Define all available achievements
export const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt' | 'isUnlocked'>[] = [
  // Streak Achievements
  {
    id: 'first_streak',
    title: '🔥 First Flame',
    description: 'Complete a habit 3 days in a row',
    icon: 'flame',
    color: '#FF6B6B',
    category: 'streak',
  },
  {
    id: 'week_warrior',
    title: '⭐ Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'star',
    color: '#FFD700',
    category: 'streak',
  },
  {
    id: 'month_master',
    title: '🏅 Month Master',
    description: 'Achieve a 30-day streak',
    icon: 'medal',
    color: '#4A90A4',
    category: 'streak',
  },
  {
    id: 'century_club',
    title: '💯 Century Club',
    description: 'Reach a 100-day streak',
    icon: 'trophy',
    color: '#B771E5',
    category: 'streak',
  },
  
  // Completion Achievements
  {
    id: 'first_step',
    title: '👣 First Step',
    description: 'Complete your first habit',
    icon: 'footsteps',
    color: '#4A90A4',
    category: 'completion',
  },
  {
    id: 'perfect_week',
    title: '✨ Perfect Week',
    description: 'Complete all habits for 7 days straight',
    icon: 'sparkles',
    color: '#FFD700',
    category: 'completion',
  },
  {
    id: 'habit_collector',
    title: '📚 Habit Collector',
    description: 'Create 5 different habits',
    icon: 'albums',
    color: '#B771E5',
    category: 'completion',
  },
  
  // Social Achievements
  {
    id: 'social_butterfly',
    title: '🦋 Social Butterfly',
    description: 'Add your first friend',
    icon: 'people',
    color: '#FF69B4',
    category: 'social',
  },
  {
    id: 'cheerleader',
    title: '📣 Cheerleader',
    description: 'React to 10 friend activities',
    icon: 'heart',
    color: '#FF6B6B',
    category: 'social',
  },
  {
    id: 'conversation_starter',
    title: '💬 Conversation Starter',
    description: 'Leave 5 comments',
    icon: 'chatbubbles',
    color: '#4A90A4',
    category: 'social',
  },
  
  // Special Achievements
  {
    id: 'early_bird',
    title: '🌅 Early Bird',
    description: 'Complete a habit before 8 AM',
    icon: 'sunny',
    color: '#FFD700',
    category: 'special',
  },
  {
    id: 'night_owl',
    title: '🦉 Night Owl',
    description: 'Complete a habit after 10 PM',
    icon: 'moon',
    color: '#B771E5',
    category: 'special',
  },
  {
    id: 'comeback_kid',
    title: '💪 Comeback Kid',
    description: 'Restart a habit after breaking a streak',
    icon: 'refresh',
    color: '#4A90A4',
    category: 'special',
  },
  {
    id: 'weekend_warrior',
    title: '🎉 Weekend Warrior',
    description: 'Complete habits on Saturday and Sunday',
    icon: 'calendar',
    color: '#FF69B4',
    category: 'special',
  },
];

export const achievementsService = {
  /**
   * Get all achievements with unlock status
   */
  async getAchievements(): Promise<Achievement[]> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      const unlockedIds = stored ? JSON.parse(stored) : {};

      return ALL_ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        isUnlocked: !!unlockedIds[achievement.id],
        unlockedAt: unlockedIds[achievement.id] ? new Date(unlockedIds[achievement.id]) : undefined,
      }));
    } catch (error) {
      console.error('Error getting achievements:', error);
      return ALL_ACHIEVEMENTS.map(a => ({ ...a, isUnlocked: false }));
    }
  },

  /**
   * Unlock an achievement
   */
  async unlockAchievement(achievementId: string): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      const unlockedIds = stored ? JSON.parse(stored) : {};

      // Check if already unlocked
      if (unlockedIds[achievementId]) {
        return false; // Already unlocked
      }

      // Unlock it
      unlockedIds[achievementId] = new Date().toISOString();
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlockedIds));
      
      console.log('🏆 Achievement unlocked:', achievementId);
      return true; // Newly unlocked
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
  },

  /**
   * Check if achievement is unlocked
   */
  async isUnlocked(achievementId: string): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      const unlockedIds = stored ? JSON.parse(stored) : {};
      return !!unlockedIds[achievementId];
    } catch (error) {
      console.error('Error checking achievement:', error);
      return false;
    }
  },

  /**
   * Get unlocked achievements count
   */
  async getUnlockedCount(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      const unlockedIds = stored ? JSON.parse(stored) : {};
      return Object.keys(unlockedIds).length;
    } catch (error) {
      console.error('Error getting unlocked count:', error);
      return 0;
    }
  },

  /**
   * Get top 3 most recent achievements
   */
  async getTopAchievements(): Promise<Achievement[]> {
    try {
      const achievements = await this.getAchievements();
      const unlocked = achievements
        .filter(a => a.isUnlocked)
        .sort((a, b) => {
          if (!a.unlockedAt || !b.unlockedAt) return 0;
          return b.unlockedAt.getTime() - a.unlockedAt.getTime();
        });
      
      return unlocked.slice(0, 3);
    } catch (error) {
      console.error('Error getting top achievements:', error);
      return [];
    }
  },

  /**
   * Reset all achievements (for testing)
   */
  async resetAchievements(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACHIEVEMENTS_KEY);
      console.log('🔄 Achievements reset');
    } catch (error) {
      console.error('Error resetting achievements:', error);
    }
  },
};
