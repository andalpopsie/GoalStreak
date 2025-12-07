// Friend Suggestions Service - Suggest active users on the platform
// 
// PRIVACY MODEL:
// - Shows random active users who aren't already friends
// - No habit data exposed until they become friends
// - Simple discovery without requiring permissions
//
import { collection, query, getDocs, limit } from 'firebase/firestore';
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
   * Get friend suggestions from existing users on the platform
   */
  async getSuggestedFriends(
    userId: string,
    userHabits: any[],
    currentFriendIds: string[],
    maxSuggestions: number = 5
  ): Promise<SuggestedFriend[]> {
    try {
      console.log('🔍 Finding suggested friends from platform users...');

      // Query random users (limit to 20, then filter and randomize)
      const usersQuery = query(
        collection(db, 'users'),
        limit(20)
      );

      const usersSnapshot = await getDocs(usersQuery);
      const suggestions: SuggestedFriend[] = [];

      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const suggestedUserId = doc.id;

        // Skip current user and existing friends
        if (suggestedUserId === userId || currentFriendIds.includes(suggestedUserId)) {
          return;
        }

        suggestions.push({
          id: suggestedUserId,
          name: userData.displayName || 'User',
          email: userData.email || '',
          photoURL: userData.photoURL,
          matchReason: 'Active on GoalStreak',
          sharedCategories: [],
        });
      });

      // Shuffle suggestions for variety
      const shuffled = suggestions.sort(() => Math.random() - 0.5);

      console.log(`✅ Found ${shuffled.length} suggested friends`);
      return shuffled.slice(0, 3); // Show 3 suggestions by default
    } catch (error) {
      console.error('❌ Error getting friend suggestions:', error);
      return [];
    }
  },
};
