// Friend Service - Social Features for GoalStreak
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Friend, 
  FriendRequest, 
  FriendStatus, 
  SocialActivity, 
  ActivityType, 
  ActivityVisibility,
  SocialSettings,
  UserProfile,
  FriendsResponse,
  ActivityFeedResponse,
  UserSearchResult,
  ReactionType,
  Reactions
} from '../types/social';

class FriendService {
  // Collections
  private friendsCollection = collection(db, 'friends');
  private friendRequestsCollection = collection(db, 'friendRequests');
  private activitiesCollection = collection(db, 'activities');
  private socialSettingsCollection = collection(db, 'socialSettings');
  private userProfilesCollection = collection(db, 'userProfiles');

  // Friend Management
  async sendFriendRequest(fromUserId: string, toUserEmail: string, message?: string): Promise<string> {
    try {
      // First, find the user by email
      const userQuery = query(
        this.userProfilesCollection,
        where('email', '==', toUserEmail.toLowerCase())
      );
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        throw new Error('User not found with that email address');
      }

      const toUser = userSnapshot.docs[0];
      const toUserId = toUser.id;
      const toUserData = toUser.data() as UserProfile;

      // Check if already friends or request exists
      const existingFriendQuery = query(
        this.friendsCollection,
        where('userId', '==', fromUserId),
        where('friendId', '==', toUserId)
      );
      const existingFriend = await getDocs(existingFriendQuery);

      if (!existingFriend.empty) {
        throw new Error('Already friends with this user');
      }

      const existingRequestQuery = query(
        this.friendRequestsCollection,
        where('fromUserId', '==', fromUserId),
        where('toUserId', '==', toUserId),
        where('status', '==', 'pending')
      );
      const existingRequest = await getDocs(existingRequestQuery);

      if (!existingRequest.empty) {
        throw new Error('Friend request already sent');
      }

      // Get sender info
      const senderDoc = await getDoc(doc(this.userProfilesCollection, fromUserId));
      const senderData = senderDoc.data() as UserProfile;

      // Create friend request
      const friendRequest: Omit<FriendRequest, 'id'> = {
        fromUserId,
        fromUserEmail: senderData.email,
        fromUserName: senderData.name,
        toUserId,
        toUserEmail: toUserData.email,
        status: 'pending',
        createdAt: new Date(),
        ...(message && { message })
      };

      const docRef = await addDoc(this.friendRequestsCollection, {
        ...friendRequest,
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Get the friend request
      const requestDoc = await getDoc(doc(this.friendRequestsCollection, requestId));
      if (!requestDoc.exists()) {
        throw new Error('Friend request not found');
      }

      const request = requestDoc.data() as FriendRequest;

      // Get user profiles for proper names
      const fromUserDoc = await getDoc(doc(this.userProfilesCollection, request.fromUserId));
      const toUserDoc = await getDoc(doc(this.userProfilesCollection, request.toUserId));
      
      const fromUserData = fromUserDoc.data() as UserProfile;
      const toUserData = toUserDoc.data() as UserProfile;

      // Create friendship records for both users
      const friend1: Omit<Friend, 'id'> = {
        userId: request.fromUserId,
        friendId: request.toUserId,
        friendEmail: request.toUserEmail,
        friendName: toUserData.name,
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const friend2: Omit<Friend, 'id'> = {
        userId: request.toUserId,
        friendId: request.fromUserId,
        friendEmail: request.fromUserEmail,
        friendName: fromUserData.name,
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add both friendship records
      const friend1Ref = doc(this.friendsCollection);
      const friend2Ref = doc(this.friendsCollection);
      
      batch.set(friend1Ref, {
        ...friend1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      batch.set(friend2Ref, {
        ...friend2,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update the friend request status
      batch.update(doc(this.friendRequestsCollection, requestId), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  async declineFriendRequest(requestId: string): Promise<void> {
    try {
      await updateDoc(doc(this.friendRequestsCollection, requestId), {
        status: 'declined',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Find and delete both friendship records
      const friendship1Query = query(
        this.friendsCollection,
        where('userId', '==', userId),
        where('friendId', '==', friendId)
      );
      const friendship1Snapshot = await getDocs(friendship1Query);

      const friendship2Query = query(
        this.friendsCollection,
        where('userId', '==', friendId),
        where('friendId', '==', userId)
      );
      const friendship2Snapshot = await getDocs(friendship2Query);

      friendship1Snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      friendship2Snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }

  // Data Retrieval
  async getFriends(userId: string): Promise<FriendsResponse> {
    try {
      // Get friends
      const friendsQuery = query(
        this.friendsCollection,
        where('userId', '==', userId),
        where('status', '==', 'accepted'),
        orderBy('createdAt', 'desc')
      );
      const friendsSnapshot = await getDocs(friendsQuery);
      const friends = friendsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Friend[];

      // Get pending requests (received)
      const pendingQuery = query(
        this.friendRequestsCollection,
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingRequests = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FriendRequest[];

      // Get sent requests
      const sentQuery = query(
        this.friendRequestsCollection,
        where('fromUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const sentSnapshot = await getDocs(sentQuery);
      const sentRequests = sentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FriendRequest[];

      return {
        friends,
        pendingRequests,
        sentRequests
      };
    } catch (error) {
      console.error('Error getting friends:', error);
      throw error;
    }
  }

  // Activity Feed
  async createActivity(
    userId: string,
    type: ActivityType,
    habitId: string,
    habitName: string,
    habitCategory: string,
    visibility: ActivityVisibility = 'friends',
    additionalData?: { streakCount?: number; completionCount?: number; milestone?: string }
  ): Promise<string> {
    try {
      // Get user profile for name with fallback
      let userName = 'Unknown User';
      try {
        const userDoc = await getDoc(doc(this.userProfilesCollection, userId));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          userName = userData?.name || userData?.email || 'Unknown User';
        }
      } catch (profileError) {
        console.log('Could not fetch user profile, using fallback name');
      }

      // Validate required parameters
      if (!habitName || typeof habitName !== 'string') {
        throw new Error('Invalid habit name provided');
      }

      if (!habitCategory || typeof habitCategory !== 'string') {
        throw new Error('Invalid habit category provided');
      }

      const activity: Omit<SocialActivity, 'id'> = {
        userId,
        userName,
        type,
        habitId,
        habitName,
        habitCategory,
        timestamp: new Date(),
        visibility,
        ...additionalData
      };

      const docRef = await addDoc(this.activitiesCollection, {
        ...activity,
        timestamp: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  async getActivityFeed(userId: string, lastActivityId?: string, limitCount: number = 20): Promise<ActivityFeedResponse> {
    try {
      // Get user's friends to filter activities
      const friendsData = await this.getFriends(userId);
      const friendIds = friendsData.friends.map(friend => friend.friendId);
      friendIds.push(userId); // Include user's own activities

      if (friendIds.length === 0) {
        return { activities: [], hasMore: false };
      }

      // Build query for activities from friends
      let activitiesQuery = query(
        this.activitiesCollection,
        where('userId', 'in', friendIds.slice(0, 10)), // Firestore 'in' limit is 10
        where('visibility', 'in', ['public', 'friends']),
        orderBy('timestamp', 'desc'),
        limit(limitCount + 1) // Get one extra to check if there are more
      );

      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activities = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SocialActivity[];

      const hasMore = activities.length > limitCount;
      if (hasMore) {
        activities.pop(); // Remove the extra item
      }

      return {
        activities,
        hasMore,
        lastActivityId: activities.length > 0 ? activities[activities.length - 1].id : undefined
      };
    } catch (error) {
      console.error('Error getting activity feed:', error);
      throw error;
    }
  }

  // User Profile Management
  async createUserProfile(userId: string, email: string, name: string): Promise<void> {
    try {
      const profile: Omit<UserProfile, 'id'> = {
        email: email.toLowerCase(),
        name,
        totalHabits: 0,
        totalCompletions: 0,
        longestStreak: 0,
        joinedAt: new Date(),
        isPublic: true
      };

      await setDoc(doc(this.userProfilesCollection, userId), {
        ...profile,
        joinedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(this.userProfilesCollection, userId), updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Social Settings
  async getSocialSettings(userId: string): Promise<SocialSettings> {
    try {
      const settingsDoc = await getDoc(doc(this.socialSettingsCollection, userId));
      
      if (!settingsDoc.exists()) {
        // Create default settings
        const defaultSettings: Omit<SocialSettings, 'userId'> = {
          defaultVisibility: 'friends',
          allowFriendRequests: true,
          shareStreakMilestones: true,
          shareHabitCompletions: true,
          shareNewHabits: false,
          notifyOnFriendActivity: true,
          updatedAt: new Date()
        };

        // Use setDoc instead of updateDoc for new documents
        await setDoc(doc(this.socialSettingsCollection, userId), {
          userId,
          ...defaultSettings,
          updatedAt: serverTimestamp()
        });

        return { userId, ...defaultSettings };
      }

      return {
        userId,
        ...settingsDoc.data()
      } as SocialSettings;
    } catch (error) {
      console.error('Error getting social settings:', error);
      throw error;
    }
  }

  async updateSocialSettings(userId: string, settings: Partial<SocialSettings>): Promise<void> {
    try {
      await updateDoc(doc(this.socialSettingsCollection, userId), {
        ...settings,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating social settings:', error);
      throw error;
    }
  }

  // Real-time Subscriptions
  subscribeFriends(userId: string, callback: (friends: FriendsResponse) => void): () => void {
    const friendsQuery = query(
      this.friendsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(friendsQuery, async () => {
      try {
        const friendsData = await this.getFriends(userId);
        callback(friendsData);
      } catch (error) {
        console.error('Error in friends subscription:', error);
      }
    });
  }

  subscribeActivityFeed(userId: string, callback: (activities: SocialActivity[]) => void): () => void {
    // This is a simplified version - in production, you'd want more sophisticated real-time updates
    const activitiesQuery = query(
      this.activitiesCollection,
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(activitiesQuery, async () => {
      try {
        const feedData = await this.getActivityFeed(userId);
        callback(feedData.activities);
      } catch (error) {
        console.error('Error in activity feed subscription:', error);
      }
    });
  }

  // Real-time activity feed subscription
  subscribeToActivityFeed(
    userId: string, 
    callback: (activities: SocialActivity[]) => void,
    errorCallback?: (error: any) => void
  ): () => void {
    const activitiesQuery = query(
      this.activitiesCollection,
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(
      activitiesQuery, 
      async () => {
        try {
          const feedData = await this.getActivityFeed(userId);
          callback(feedData.activities);
        } catch (error) {
          console.error('Error in activity feed subscription:', error);
          if (errorCallback) errorCallback(error);
        }
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        if (errorCallback) errorCallback(error);
      }
    );
  }

  // Add reaction to activity (optimized)
  async addReaction(activityId: string, userId: string, reactionType: ReactionType): Promise<void> {
    if (!activityId || !userId || !reactionType) {
      throw new Error('Invalid parameters for adding reaction');
    }

    try {
      const activityRef = doc(this.activitiesCollection, activityId);
      const activityDoc = await getDoc(activityRef);
      
      if (!activityDoc.exists()) {
        throw new Error('Activity not found');
      }

      const activityData = activityDoc.data();
      const reactions: Reactions = activityData.reactions || {};
      const userReactions = reactions[userId] || [];

      // Toggle reaction - remove if exists, add if doesn't
      const reactionIndex = userReactions.indexOf(reactionType);
      if (reactionIndex > -1) {
        userReactions.splice(reactionIndex, 1);
      } else {
        userReactions.push(reactionType);
      }

      // Clean up empty arrays
      if (userReactions.length === 0) {
        delete reactions[userId];
      } else {
        reactions[userId] = userReactions;
      }

      await updateDoc(activityRef, {
        reactions,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Get reaction counts for activity (optimized)
  getReactionCounts(reactions?: Reactions): Record<ReactionType, number> {
    const counts: Record<ReactionType, number> = { heart: 0, flame: 0, medal: 0 };
    
    if (!reactions) return counts;

    Object.values(reactions).forEach((userReactions) => {
      userReactions.forEach((reaction) => {
        if (reaction in counts) {
          counts[reaction]++;
        }
      });
    });

    return counts;
  }

  // Check if user has reacted with specific type (optimized)
  hasUserReacted(reactions?: Reactions, userId?: string, reactionType?: ReactionType): boolean {
    if (!reactions || !userId || !reactionType) return false;
    return reactions[userId]?.includes(reactionType) ?? false;
  }
}

export const friendService = new FriendService();
export default friendService;
