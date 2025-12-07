// Friend Suggestions Service - Find potential friends based on shared interests
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export interface SuggestedFriend {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  matchReason: string;
  sharedCategories: string[];
  streakRange?: string;
}

export const friendSuggestionsService = {
  /**
   * Get friend suggestions based on shared habits and similar activity
   */
  async getSuggestedFriends(
    userId: string,
    userHabits: any[],
    currentFriendIds: string[],
    maxSuggestions: number = 5
  ): Promise<SuggestedFriend[]> {
    try {
      if (userHabits.length === 0) {
        return []; // No habits to match on
      }

      // Get user's habit categories
      const userCategories = [...new Set(userHabits.map(h => h.category))];
      
      // Calculate user's average streak
      const userStreakAvg = this.calculateAverageStreak(userHabits);
      const userStreakRange = this.getStreakRange(userStreakAvg);

      // Query users with similar habits (public habits only)
      const habitsQuery = query(
        collection(db, 'habits'),
        where('isPublic', '==', true),
        where('category', 'in', userCategories.slice(0, 10)), // Firestore limit
        limit(50)
      );

      const habitsSnapshot = await getDocs(habitsQuery);
      
      // Group habits by user
      const userHabitsMap = new Map<string, any[]>();
      habitsSnapshot.forEach(doc => {
        const habitData = doc.data();
        const habit = { id: doc.id, ...habitData };
        const habitUserId = habitData.userId as string;
        
        // Skip current user and existing friends
        if (habitUserId === userId || currentFriendIds.includes(habitUserId)) {
          return;
        }

        if (!userHabitsMap.has(habitUserId)) {
          userHabitsMap.set(habitUserId, []);
        }
        userHabitsMap.get(habitUserId)!.push(habit);
      });

      // Score and rank potential friends
      const suggestions: SuggestedFriend[] = [];

      for (const [potentialFriendId, theirHabits] of userHabitsMap.entries()) {
        // Get user info
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', potentialFriendId), limit(1))
        );

        if (userDoc.empty) continue;

        const userData = userDoc.docs[0].data();
        
        // Calculate match score
        const sharedCategories = this.findSharedCategories(userCategories, theirHabits);
        const theirStreakAvg = this.calculateAverageStreak(theirHabits);
        const theirStreakRange = this.getStreakRange(theirStreakAvg);
        
        // Generate match reason
        let matchReason = '';
        if (sharedCategories.length > 0) {
          matchReason = `${sharedCategories.length} shared ${sharedCategories.length === 1 ? 'interest' : 'interests'}`;
        }
        if (userStreakRange === theirStreakRange) {
          matchReason += matchReason ? ' • Similar progress' : 'Similar progress';
        }

        suggestions.push({
          id: potentialFriendId,
          name: userData.displayName || 'User',
          email: userData.email || '',
          photoURL: userData.photoURL,
          matchReason: matchReason || 'Active user',
          sharedCategories,
          streakRange: theirStreakRange,
        });
      }

      // Sort by number of shared categories (descending)
      suggestions.sort((a, b) => b.sharedCategories.length - a.sharedCategories.length);

      // Return top suggestions
      return suggestions.slice(0, maxSuggestions);
    } catch (error) {
      console.error('Error getting friend suggestions:', error);
      return [];
    }
  },

  /**
   * Find shared categories between user and potential friend
   */
  findSharedCategories(userCategories: string[], theirHabits: any[]): string[] {
    const theirCategories = [...new Set(theirHabits.map(h => h.category))];
    return userCategories.filter(cat => theirCategories.includes(cat));
  },

  /**
   * Calculate average streak from habits
   */
  calculateAverageStreak(habits: any[]): number {
    if (habits.length === 0) return 0;
    
    // For now, return 0 as we don't have streak data in habits
    // This would need to query streaks collection
    return 0;
  },

  /**
   * Categorize streak into ranges
   */
  getStreakRange(streak: number): string {
    if (streak === 0) return 'beginner';
    if (streak < 7) return 'beginner';
    if (streak < 30) return 'intermediate';
    if (streak < 100) return 'advanced';
    return 'expert';
  },

  /**
   * Format category name for display
   */
  formatCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  },
};
