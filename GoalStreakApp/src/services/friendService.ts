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
  writeBatch,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './firebase';
import { resolveUserDisplayName } from '../utils/usernameUtils';
import { achievementsService } from './achievementsService';
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
  Reactions,
  Block,
  Report,
  ReportContentType,
  ReportReason,
} from '../types/social';
import { buildReport, selectOutgoingBlocks } from './moderationTransitions';

class FriendService {
  // Auth and Collections
  private auth = getAuth();
  private friendsCollection = collection(db, 'friends');
  private friendRequestsCollection = collection(db, 'friendRequests');
  private activitiesCollection = collection(db, 'activities');
  private socialSettingsCollection = collection(db, 'socialSettings');
  private userProfilesCollection = collection(db, 'userProfiles');
  private usersCollection = collection(db, 'users');
  private blocksCollection = collection(db, 'blocks');
  private reportsCollection = collection(db, 'reports');

  // Friend Management
  async sendFriendRequest(
    fromUserId: string,
    toUserEmail: string,
    message?: string
  ): Promise<string> {
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

      // Get sender info. Older accounts (created before social profiles
      // existed) may not have a userProfiles doc yet — backfill it from the
      // authenticated user so sending a request never crashes on undefined data.
      const senderDoc = await getDoc(doc(this.userProfilesCollection, fromUserId));
      let senderData = senderDoc.data() as UserProfile | undefined;
      if (!senderData) {
        const current = this.auth.currentUser;
        const email = (current?.email || '').toLowerCase();
        const name = current?.displayName || email.split('@')[0] || 'User';
        await this.createUserProfile(fromUserId, email, name);
        senderData = { email, name } as UserProfile;
      }

      // Create friend request
      const friendRequest: Omit<FriendRequest, 'id'> = {
        fromUserId,
        fromUserEmail: senderData.email,
        fromUserName: senderData.name,
        toUserId,
        toUserEmail: toUserData.email,
        status: 'pending',
        createdAt: new Date(),
        ...(message && { message }),
      };

      const docRef = await addDoc(this.friendRequestsCollection, {
        ...friendRequest,
        createdAt: serverTimestamp(),
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

      // Check if friendship already exists (prevent duplicates)
      const existingFriendship = await getDocs(
        query(
          this.friendsCollection,
          where('userId', '==', request.fromUserId),
          where('friendId', '==', request.toUserId)
        )
      );

      if (!existingFriendship.empty) {
        // Friendship already exists — just mark the request as accepted
        batch.update(doc(this.friendRequestsCollection, requestId), {
          status: 'accepted',
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
        return;
      }

      // Get user profiles for proper names
      const fromUserDoc = await getDoc(doc(this.userProfilesCollection, request.fromUserId));
      const toUserDoc = await getDoc(doc(this.userProfilesCollection, request.toUserId));

      // Profiles may be missing for older accounts; the request already
      // carries names/emails, so fall back to those instead of crashing.
      const fromUserData = fromUserDoc.data() as UserProfile | undefined;
      const toUserData = toUserDoc.data() as UserProfile | undefined;

      // Create friendship records for both users
      const friend1: Omit<Friend, 'id'> = {
        userId: request.fromUserId,
        friendId: request.toUserId,
        friendEmail: request.toUserEmail,
        friendName: toUserData?.name || request.toUserEmail?.split('@')[0] || 'User',
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const friend2: Omit<Friend, 'id'> = {
        userId: request.toUserId,
        friendId: request.fromUserId,
        friendEmail: request.fromUserEmail,
        friendName: fromUserData?.name || request.fromUserName || 'User',
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add both friendship records
      const friend1Ref = doc(this.friendsCollection);
      const friend2Ref = doc(this.friendsCollection);

      batch.set(friend1Ref, {
        ...friend1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(friend2Ref, {
        ...friend2,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update the friend request status
      batch.update(doc(this.friendRequestsCollection, requestId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      // Check for social butterfly achievement (first friend)
      const friendsData = await this.getFriends(request.toUserId);
      if (friendsData.friends.length === 1) {
        await achievementsService.unlockAchievement('social_butterfly');
      }

      // Also check for the person who sent the request
      const senderFriendsData = await this.getFriends(request.fromUserId);
      if (senderFriendsData.friends.length === 1) {
        await achievementsService.unlockAchievement('social_butterfly');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  async declineFriendRequest(requestId: string): Promise<void> {
    try {
      await updateDoc(doc(this.friendRequestsCollection, requestId), {
        status: 'declined',
        updatedAt: serverTimestamp(),
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

      friendship1Snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      friendship2Snapshot.forEach((doc) => {
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
      const friends = friendsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Friend[];

      // Get pending requests (received)
      const pendingQuery = query(
        this.friendRequestsCollection,
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingRequests = pendingSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FriendRequest[];

      // Get sent requests
      const sentQuery = query(
        this.friendRequestsCollection,
        where('fromUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const sentSnapshot = await getDocs(sentQuery);
      const sentRequests = sentSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FriendRequest[];

      return {
        friends,
        pendingRequests,
        sentRequests,
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
    additionalData?: {
      streakCount?: number;
      completionCount?: number;
      milestone?: string;
      photoUrl?: string;
      caption?: string;
    }
  ): Promise<string> {
    try {
      // Resolve the display name across both profile collections + auth so we
      // never bake "Unknown User" into the feed when the real name exists.
      const userName = await resolveUserDisplayName(userId);

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
        ...additionalData,
      };

      // Strip undefined values — Firestore rejects them
      const cleanActivity = Object.fromEntries(
        Object.entries(activity).filter(([_, v]) => v !== undefined)
      );

      const docRef = await addDoc(this.activitiesCollection, {
        ...cleanActivity,
        timestamp: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  async getActivityFeed(
    userId: string,
    lastActivityId?: string,
    limitCount: number = 20
  ): Promise<ActivityFeedResponse> {
    try {
      // Get user's friends to filter activities
      const friendsData = await this.getFriends(userId);
      const friendIds = friendsData.friends.map((friend) => friend.friendId);
      friendIds.push(userId); // Include user's own activities

      if (friendIds.length === 0) {
        return { activities: [], hasMore: false };
      }

      // Build query for activities from friends
      const activitiesQuery = query(
        this.activitiesCollection,
        where('userId', 'in', friendIds.slice(0, 10)), // Firestore 'in' limit is 10
        where('visibility', 'in', ['public', 'friends']),
        orderBy('timestamp', 'desc'),
        limit(limitCount + 1) // Get one extra to check if there are more
      );

      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activities = activitiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SocialActivity[];

      const hasMore = activities.length > limitCount;
      if (hasMore) {
        activities.pop(); // Remove the extra item
      }

      return {
        activities,
        hasMore,
        lastActivityId: activities.length > 0 ? activities[activities.length - 1].id : undefined,
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
        isPublic: true,
      };

      await setDoc(doc(this.userProfilesCollection, userId), {
        ...profile,
        joinedAt: serverTimestamp(),
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
          updatedAt: new Date(),
        };

        // Use setDoc instead of updateDoc for new documents
        await setDoc(doc(this.socialSettingsCollection, userId), {
          userId,
          ...defaultSettings,
          updatedAt: serverTimestamp(),
        });

        return { userId, ...defaultSettings };
      }

      return {
        userId,
        ...settingsDoc.data(),
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
        updatedAt: serverTimestamp(),
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

  subscribeActivityFeed(
    userId: string,
    callback: (activities: SocialActivity[]) => void
  ): () => void {
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

  // Real-time activity feed subscription (cross-device optimized)
  subscribeToActivityFeed(
    userId: string,
    callback: (activities: SocialActivity[]) => void,
    errorCallback?: (error: any) => void
  ): () => void {
    // Listen to all activities collection changes to catch reaction updates across devices
    const activitiesQuery = query(
      this.activitiesCollection,
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(
      activitiesQuery,
      async (snapshot) => {
        try {
          // Check if any document changed (including reactions from other devices)
          const changes = snapshot.docChanges();
          if (changes.length > 0) {
            const feedData = await this.getActivityFeed(userId);
            callback(feedData.activities);
          }
        } catch (error) {
          console.error('Error in cross-device activity feed sync:', error);
          if (errorCallback) errorCallback(error);
        }
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        if (errorCallback) errorCallback(error);
      }
    );
  }

  // Add reaction to activity (optimized for cross-device sync)
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

      // Update with server timestamp for cross-device sync
      await updateDoc(activityRef, {
        reactions,
        updatedAt: serverTimestamp(),
        lastReactionAt: serverTimestamp(),
      });

      // Check for cheerleader achievement (10 reactions)
      await this.checkReactionAchievements(userId);
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Check for reaction-related achievements
  async checkReactionAchievements(userId: string): Promise<void> {
    try {
      // Count total reactions given by user across all activities
      const activitiesQuery = query(this.activitiesCollection);
      const activitiesSnapshot = await getDocs(activitiesQuery);

      let totalReactions = 0;
      activitiesSnapshot.forEach((doc) => {
        const activity = doc.data() as SocialActivity;
        if (activity.reactions && activity.reactions[userId]) {
          totalReactions += activity.reactions[userId].length;
        }
      });

      if (totalReactions >= 10) {
        await achievementsService.unlockAchievement('cheerleader');
      }
    } catch (error) {
      console.error('Error checking reaction achievements:', error);
      // Don't throw - achievement checking shouldn't break reactions
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

  // ── Moderation: Block Operations (Report & Block) ──

  /**
   * Block a user. Runs a single atomic writeBatch that creates the block record
   * and tears down any friendship/friend-request relationship between the two
   * users in either direction.
   *
   * - Idempotent: if a block already exists in this direction, returns success
   *   without a second write (R1.5).
   * - Atomic: the block create + all teardown deletes commit together; on commit
   *   failure the error is rethrown so nothing persists (R1.4, R1.7, R1.8, R1.9).
   */
  async blockUser(blockerId: string, blockedUserId: string): Promise<void> {
    try {
      // Idempotent pre-check — a repeat block leaves the Block_List unchanged (R1.5)
      const existingBlockQuery = query(
        this.blocksCollection,
        where('blockerId', '==', blockerId),
        where('blockedUserId', '==', blockedUserId)
      );
      const existingBlockSnapshot = await getDocs(existingBlockQuery);
      if (!existingBlockSnapshot.empty) {
        return;
      }

      // Gather friendship + friend-request records linking the pair in either
      // direction. The friendship queries reuse the removeFriend query shape;
      // together these cover the selectTeardownRecords "either-direction" semantics.
      const friendship1Query = query(
        this.friendsCollection,
        where('userId', '==', blockerId),
        where('friendId', '==', blockedUserId)
      );
      const friendship2Query = query(
        this.friendsCollection,
        where('userId', '==', blockedUserId),
        where('friendId', '==', blockerId)
      );
      const request1Query = query(
        this.friendRequestsCollection,
        where('fromUserId', '==', blockerId),
        where('toUserId', '==', blockedUserId)
      );
      const request2Query = query(
        this.friendRequestsCollection,
        where('fromUserId', '==', blockedUserId),
        where('toUserId', '==', blockerId)
      );

      const [friendship1Snapshot, friendship2Snapshot, request1Snapshot, request2Snapshot] =
        await Promise.all([
          getDocs(friendship1Query),
          getDocs(friendship2Query),
          getDocs(request1Query),
          getDocs(request2Query),
        ]);

      const batch = writeBatch(db);

      // Create the block record (R1.4)
      const blockRef = doc(this.blocksCollection);
      batch.set(blockRef, {
        blockerId,
        blockedUserId,
        createdAt: serverTimestamp(),
      });

      // Delete both friendship docs (R1.8) and any pending friend requests in
      // either direction (R1.9)
      [friendship1Snapshot, friendship2Snapshot, request1Snapshot, request2Snapshot].forEach(
        (snapshot) => {
          snapshot.forEach((docSnap) => batch.delete(docSnap.ref));
        }
      );

      // Rethrow on commit failure so nothing persists (R1.7)
      await batch.commit();
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  /**
   * Unblock a user by deleting the caller's own block record
   * (`blockerId == uid && blockedUserId == target`). Records in the opposite
   * direction, or belonging to other blockers, are untouched (R3.3).
   */
  async unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
    try {
      const blockQuery = query(
        this.blocksCollection,
        where('blockerId', '==', blockerId),
        where('blockedUserId', '==', blockedUserId)
      );
      const snapshot = await getDocs(blockQuery);
      if (snapshot.empty) {
        return;
      }

      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  /**
   * Return the current user's Block_List — the block records where the user is
   * the `blockerId` (R3.2).
   */
  async getBlockedUsers(userId: string): Promise<Block[]> {
    try {
      const blocksQuery = query(this.blocksCollection, where('blockerId', '==', userId));
      const snapshot = await getDocs(blocksQuery);
      const blocks = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Block[];

      // selectOutgoingBlocks re-asserts the blockerId == userId invariant.
      return selectOutgoingBlocks(blocks, userId);
    } catch (error) {
      console.error('Error getting blocked users:', error);
      throw error;
    }
  }

  /**
   * Whether a Block_Relationship exists between two users in EITHER direction.
   */
  async isBlocked(userAId: string, userBId: string): Promise<boolean> {
    try {
      const forwardQuery = query(
        this.blocksCollection,
        where('blockerId', '==', userAId),
        where('blockedUserId', '==', userBId)
      );
      const reverseQuery = query(
        this.blocksCollection,
        where('blockerId', '==', userBId),
        where('blockedUserId', '==', userAId)
      );
      const [forwardSnapshot, reverseSnapshot] = await Promise.all([
        getDocs(forwardQuery),
        getDocs(reverseQuery),
      ]);
      return !forwardSnapshot.empty || !reverseSnapshot.empty;
    } catch (error) {
      console.error('Error checking block status:', error);
      throw error;
    }
  }

  /**
   * Subscribe to the current user's bidirectional block set. Attaches two
   * onSnapshot listeners — one for outgoing blocks (`blockerId == uid`) and one
   * for incoming blocks (`blockedUserId == uid`) — and unions the OTHER party's
   * id from each doc into a single Set, invoking the callback on every update.
   * On a transient subscription error the last-known set is retained (the
   * failing listener simply keeps its previous ids). Returns an unsubscribe that
   * detaches both listeners (R2.7, R2.8, R3.2).
   */
  subscribeBlockSet(userId: string, callback: (ids: Set<string>) => void): () => void {
    const outgoingQuery = query(this.blocksCollection, where('blockerId', '==', userId));
    const incomingQuery = query(this.blocksCollection, where('blockedUserId', '==', userId));

    let outgoingIds = new Set<string>();
    let incomingIds = new Set<string>();

    const emit = () => {
      const union = new Set<string>();
      outgoingIds.forEach((id) => union.add(id));
      incomingIds.forEach((id) => union.add(id));
      callback(union);
    };

    const unsubscribeOutgoing = onSnapshot(
      outgoingQuery,
      (snapshot) => {
        outgoingIds = new Set(
          snapshot.docs.map((docSnap) => (docSnap.data() as Block).blockedUserId)
        );
        emit();
      },
      (error) => {
        // Retain last-known set on transient errors (mirror subscribeToActivityFeed)
        console.error('Error in block set (outgoing) subscription:', error);
      }
    );

    const unsubscribeIncoming = onSnapshot(
      incomingQuery,
      (snapshot) => {
        incomingIds = new Set(snapshot.docs.map((docSnap) => (docSnap.data() as Block).blockerId));
        emit();
      },
      (error) => {
        console.error('Error in block set (incoming) subscription:', error);
      }
    );

    return () => {
      unsubscribeOutgoing();
      unsubscribeIncoming();
    };
  }

  // ── Moderation: Report Operations (Report & Block) ──

  /**
   * Create an immutable report record. The record persists with
   * `status: 'pending'` and a server timestamp. Reports are append-only and
   * repeatable — no uniqueness check is enforced, so a duplicate report simply
   * creates another record and resolves successfully (R4.5, R4.8, R4.9).
   */
  async reportContent(params: {
    reporterId: string;
    reportedUserId: string;
    contentType: ReportContentType;
    contentId: string;
    reason: ReportReason;
  }): Promise<void> {
    try {
      // buildReport maps the fields and enforces contentId == reportedUserId for
      // the 'user' content type (R4.9). The placeholder Date is overridden with a
      // server timestamp on write (matching the createActivity pattern, R4.5).
      const report = buildReport(
        {
          reporterId: params.reporterId,
          reportedUserId: params.reportedUserId,
          contentType: params.contentType,
          contentId: params.contentId,
          reason: params.reason,
        },
        new Date()
      );

      await addDoc(this.reportsCollection, {
        ...report,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error reporting content:', error);
      throw error;
    }
  }

  /**
   * Convenience wrapper that reports a user profile (R4.1). Sets
   * `contentType: 'user'` and `contentId` equal to the reported user id (R4.9).
   */
  async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: ReportReason
  ): Promise<void> {
    return this.reportContent({
      reporterId,
      reportedUserId,
      contentType: 'user',
      contentId: reportedUserId,
      reason,
    });
  }

  /**
   * Return the set of content ids the user has reported (`reporterId == uid`),
   * used to auto-hide reported content from the reporter's own view (R5.1, R5.2).
   */
  async getReportedContentIds(userId: string): Promise<Set<string>> {
    try {
      const reportsQuery = query(this.reportsCollection, where('reporterId', '==', userId));
      const snapshot = await getDocs(reportsQuery);
      return new Set(snapshot.docs.map((docSnap) => (docSnap.data() as Report).contentId));
    } catch (error) {
      console.error('Error getting reported content ids:', error);
      throw error;
    }
  }

  /**
   * Subscribe to the live set of content ids the user has reported. Retains the
   * last-known set on transient errors and returns an unsubscribe function
   * (R5.1, R5.2).
   */
  subscribeReportedContent(userId: string, callback: (ids: Set<string>) => void): () => void {
    const reportsQuery = query(this.reportsCollection, where('reporterId', '==', userId));

    return onSnapshot(
      reportsQuery,
      (snapshot) => {
        const ids = new Set(snapshot.docs.map((docSnap) => (docSnap.data() as Report).contentId));
        callback(ids);
      },
      (error) => {
        // Retain last-known set on transient errors (mirror subscribeToActivityFeed)
        console.error('Error in reported content subscription:', error);
      }
    );
  }

  // Search for users by name or email
  async searchUsers(searchQuery: string): Promise<UserSearchResult[]> {
    try {
      const currentUserId = this.auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      const results: UserSearchResult[] = [];
      const userIds = new Set<string>(); // Track unique users

      // Get current user's friends and pending requests (simplified)
      const friendsQuery = query(this.friendsCollection, where('userId', '==', currentUserId));
      const friendsSnapshot = await getDocs(friendsQuery);
      const friendIds = new Set(friendsSnapshot.docs.map((doc) => doc.data().friendId));

      const sentRequestsQuery = query(
        this.friendRequestsCollection,
        where('fromUserId', '==', currentUserId),
        where('status', '==', 'pending')
      );
      const sentRequestsSnapshot = await getDocs(sentRequestsQuery);
      const sentRequestIds = new Set(sentRequestsSnapshot.docs.map((doc) => doc.data().toUserId));

      const receivedRequestsQuery = query(
        this.friendRequestsCollection,
        where('toUserId', '==', currentUserId),
        where('status', '==', 'pending')
      );
      const receivedRequestsSnapshot = await getDocs(receivedRequestsQuery);
      const receivedRequestIds = new Set(
        receivedRequestsSnapshot.docs.map((doc) => doc.data().fromUserId)
      );

      // Helper function to add user to results
      const addUserToResults = (doc: any) => {
        const userData = doc.data();
        const userId = doc.id;

        // Skip current user and duplicates
        if (userId === currentUserId || userIds.has(userId)) return;

        userIds.add(userId);
        results.push({
          id: userId,
          name: userData.name || userData.displayName || userData.firstName || '',
          email: userData.email || '',
          avatar: userData.avatar || userData.profilePhoto || undefined,
          mutualFriends: 0,
          isFriend: friendIds.has(userId),
          hasPendingRequest: sentRequestIds.has(userId) || receivedRequestIds.has(userId),
        });
      };

      // Search by email
      const emailQuery = query(
        this.usersCollection,
        where('email', '>=', searchQuery.toLowerCase()),
        where('email', '<=', searchQuery.toLowerCase() + '\uf8ff'),
        limit(10)
      );
      const emailSnapshot = await getDocs(emailQuery);
      emailSnapshot.forEach(addUserToResults);

      // Search by name (always search, not just when no @)
      const nameQuery = query(
        this.usersCollection,
        where('name', '>=', searchQuery),
        where('name', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );
      const nameSnapshot = await getDocs(nameQuery);
      nameSnapshot.forEach(addUserToResults);

      // Also search by displayName if different from name
      const displayNameQuery = query(
        this.usersCollection,
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );
      const displayNameSnapshot = await getDocs(displayNameQuery);
      displayNameSnapshot.forEach(addUserToResults);

      // Search by username (strip @ prefix if present)
      const usernameSearch = searchQuery.startsWith('@')
        ? searchQuery.slice(1).toLowerCase()
        : searchQuery.toLowerCase();
      if (usernameSearch.length >= 2) {
        const usernameQuery = query(
          this.usersCollection,
          where('username', '>=', usernameSearch),
          where('username', '<=', usernameSearch + '\uf8ff'),
          limit(10)
        );
        const usernameSnapshot = await getDocs(usernameQuery);
        usernameSnapshot.forEach(addUserToResults);
      }

      return results;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
}

export const friendService = new FriendService();
export default friendService;
