// Group Service - Accountability Groups for GoalStreak
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './firebase';
import { resolveUserDisplayName } from '../utils/usernameUtils';
import { friendService } from './friendService';
import { notificationService } from './notificationService';
import {
  Group,
  GroupMember,
  GroupInvitation,
  GroupInvitationStatus,
  GroupStatus,
  GroupRole,
  GroupActivityType,
  GroupActivity,
  GroupProgress,
  TrackedHabit,
  CreateGroupForm,
  Friend,
  Reactions,
  ReactionType,
  SocialSettings,
} from '../types/social';

class GroupService {
  // Firestore collections
  private groupsCollection = collection(db, 'groups');
  private groupInvitationsCollection = collection(db, 'groupInvitations');
  private trackedHabitsCollection = collection(db, 'trackedHabits');
  private groupActivitiesCollection = collection(db, 'groupActivities');

  // ── Validation (pure functions) ──

  validateGroupName(name: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 50) {
      return { valid: false, error: 'Group name must be between 3 and 50 characters' };
    }
    return { valid: true };
  }

  validateGroupDescription(description: string): { valid: boolean; error?: string } {
    if (description.length > 200) {
      return { valid: false, error: 'Description must be 200 characters or less' };
    }
    return { valid: true };
  }

  validateEndDate(endDate: Date): { valid: boolean; error?: string } {
    const now = new Date();
    // Set both to start of day for calendar-day comparison
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDateStart = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    // End date must be at least 1 calendar day in the future
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (endDateStart.getTime() - todayStart.getTime() < oneDayMs) {
      return { valid: false, error: 'End date must be at least 1 day from now' };
    }
    return { valid: true };
  }

  calculateCompletionPercentage(progress: GroupProgress[]): number {
    let totalTracked = 0;
    let totalCompleted = 0;

    for (const member of progress) {
      for (const habit of member.habits) {
        totalTracked++;
        if (habit.completedToday) {
          totalCompleted++;
        }
      }
    }

    if (totalTracked === 0) return 0;
    return Math.round((totalCompleted / totalTracked) * 100);
  }

  // ── Group CRUD ──

  async createGroup(userId: string, form: CreateGroupForm): Promise<string> {
    try {
      // Validate inputs
      const nameValidation = this.validateGroupName(form.name);
      if (!nameValidation.valid) {
        throw new Error(nameValidation.error);
      }

      const descValidation = this.validateGroupDescription(form.description);
      if (!descValidation.valid) {
        throw new Error(descValidation.error);
      }

      if (form.endDate) {
        const endDateValidation = this.validateEndDate(form.endDate);
        if (!endDateValidation.valid) {
          throw new Error(endDateValidation.error);
        }
      }

      // Check 5-group limit
      const groupCount = await this.getUserGroupCount(userId);
      if (groupCount >= 5) {
        throw new Error('You can be in up to 5 groups at a time');
      }

      // Resolve display name across profile collections + auth.
      const userName = await resolveUserDisplayName(userId);

      const batch = writeBatch(db);

      const groupRef = doc(this.groupsCollection);
      const now = serverTimestamp();

      const adminMember: GroupMember = {
        userId,
        userName,
        role: 'admin',
        joinedAt: new Date(),
      };

      const groupData = {
        name: form.name.trim(),
        description: form.description,
        category: form.category,
        adminId: userId,
        members: [{ ...adminMember, joinedAt: Timestamp.now() }],
        memberIds: [userId],
        status: 'active' as GroupStatus,
        createdAt: now,
        updatedAt: now,
        ...(form.endDate && { endDate: Timestamp.fromDate(form.endDate) }),
      };

      batch.set(groupRef, groupData);
      await batch.commit();

      return groupRef.id;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async getGroup(groupId: string): Promise<Group> {
    try {
      const groupDoc = await getDoc(doc(this.groupsCollection, groupId));
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      return this.mapGroupDoc(groupDoc);
    } catch (error) {
      console.error('Error getting group:', error);
      throw error;
    }
  }

  async updateGroup(
    groupId: string,
    updates: Partial<Pick<Group, 'name' | 'description' | 'endDate'>>
  ): Promise<void> {
    try {
      if (updates.name !== undefined) {
        const nameValidation = this.validateGroupName(updates.name);
        if (!nameValidation.valid) {
          throw new Error(nameValidation.error);
        }
        updates.name = updates.name.trim();
      }

      if (updates.description !== undefined) {
        const descValidation = this.validateGroupDescription(updates.description);
        if (!descValidation.valid) {
          throw new Error(descValidation.error);
        }
      }

      if (updates.endDate) {
        const endDateValidation = this.validateEndDate(updates.endDate);
        if (!endDateValidation.valid) {
          throw new Error(endDateValidation.error);
        }
      }

      const updateData: Record<string, any> = { updatedAt: serverTimestamp() };
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.endDate) updateData.endDate = Timestamp.fromDate(updates.endDate);

      await updateDoc(doc(this.groupsCollection, groupId), updateData);
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  async endGroup(groupId: string, adminId: string): Promise<void> {
    try {
      const group = await this.getGroup(groupId);
      if (group.status === 'ended') {
        throw new Error('This group has ended');
      }

      await updateDoc(doc(this.groupsCollection, groupId), {
        status: 'ended' as GroupStatus,
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error ending group:', error);
      throw error;
    }
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    try {
      const q = query(
        this.groupsCollection,
        where('memberIds', 'array-contains', userId),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => this.mapGroupDoc(doc));
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw error;
    }
  }

  async getUserGroupCount(userId: string): Promise<number> {
    try {
      const groups = await this.getUserGroups(userId);
      return groups.length;
    } catch (error) {
      console.error('Error getting user group count:', error);
      throw error;
    }
  }

  /**
   * Check all active groups for the user and auto-end any that have passed their endDate.
   * Called on group load to enforce Requirement 7.4.
   */
  async checkAndEndExpiredGroups(groups: Group[]): Promise<string[]> {
    const endedGroupIds: string[] = [];
    const now = new Date();

    for (const group of groups) {
      if (group.status === 'active' && group.endDate) {
        // Compare end-of-day for the endDate against current time
        const endDateEnd = new Date(group.endDate);
        endDateEnd.setHours(23, 59, 59, 999);

        if (now > endDateEnd) {
          try {
            await updateDoc(doc(this.groupsCollection, group.id), {
              status: 'ended' as GroupStatus,
              endedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            endedGroupIds.push(group.id);
          } catch (error) {
            console.warn(`Error auto-ending expired group ${group.id}:`, error);
          }
        }
      }
    }

    return endedGroupIds;
  }

  /**
   * Get groups that ended within the last 30 days for data retention viewing.
   * Requirement 7.6: Ended group data remains accessible for 30 days.
   */
  async getRecentlyEndedGroups(userId: string): Promise<Group[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const q = query(
        this.groupsCollection,
        where('memberIds', 'array-contains', userId),
        where('status', '==', 'ended')
      );
      const snapshot = await getDocs(q);
      const endedGroups = snapshot.docs.map((doc) => this.mapGroupDoc(doc));

      // Filter client-side: only include groups ended within the last 30 days
      return endedGroups.filter((group) => {
        if (!group.endedAt) return false;
        return group.endedAt.getTime() >= thirtyDaysAgo.getTime();
      });
    } catch (error) {
      console.error('Error getting recently ended groups:', error);
      throw error;
    }
  }

  // ── Invitations ──

  async inviteMember(
    groupId: string,
    adminId: string,
    friendId: string,
    friendName: string
  ): Promise<string> {
    try {
      const group = await this.getGroup(groupId);

      if (group.status === 'ended') {
        throw new Error('This group has ended');
      }

      // Check 10-member limit
      if (group.members.length >= 10) {
        throw new Error('This group is full (maximum 10 members)');
      }

      // Duplicate check via query (rule-safe). A direct getDoc on a
      // not-yet-existing invitation is denied, because the read rule references
      // resource.data on a null document — so use a query, which returns empty.
      const duplicateQuery = query(
        this.groupInvitationsCollection,
        where('groupId', '==', groupId),
        where('fromUserId', '==', adminId),
        where('toUserId', '==', friendId),
        where('status', '==', 'pending')
      );
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        throw new Error('An invitation has already been sent to this user');
      }

      // Invitations use a deterministic id "{groupId}_{friendId}" so the
      // Firestore rules can verify a pending invite when the invitee joins.
      const invitationId = `${groupId}_${friendId}`;
      const invitationRef = doc(this.groupInvitationsCollection, invitationId);

      // Get admin name
      const adminMember = group.members.find((m) => m.userId === adminId);
      const adminName = adminMember?.userName || 'Unknown';

      const invitationData = {
        groupId,
        groupName: group.name,
        groupDescription: group.description,
        fromUserId: adminId,
        fromUserName: adminName,
        toUserId: friendId,
        toUserName: friendName,
        status: 'pending' as GroupInvitationStatus,
        memberCount: group.members.length,
        createdAt: serverTimestamp(),
      };

      // setDoc (not addDoc) to honor the deterministic id; overwrites any prior
      // declined/expired invite for the same group+user with a fresh pending one.
      await setDoc(invitationRef, invitationData);
      const docRef = invitationRef;

      // Trigger notification
      try {
        await notificationService.scheduleHabitReminder({
          id: `group-invite-${docRef.id}`,
          name: `${adminName} invited you to join "${group.name}"`,
          reminderEnabled: false,
        });
      } catch (notifError) {
        // Don't fail the invitation if notification fails
        console.warn('Failed to send invitation notification:', notifError);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error inviting member:', error);
      throw error;
    }
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      const invitationDoc = await getDoc(doc(this.groupInvitationsCollection, invitationId));
      if (!invitationDoc.exists()) {
        throw new Error('Invitation not found');
      }

      const invitation = { id: invitationDoc.id, ...invitationDoc.data() } as GroupInvitation;

      if (invitation.status !== 'pending') {
        throw new Error('This invitation is no longer pending');
      }

      // Re-check group status and member limit (race condition protection)
      const group = await this.getGroup(invitation.groupId);

      if (group.status === 'ended') {
        // Mark invitation as expired
        await updateDoc(doc(this.groupInvitationsCollection, invitationId), {
          status: 'expired' as GroupInvitationStatus,
          updatedAt: serverTimestamp(),
        });
        throw new Error('This group has ended');
      }

      if (group.members.length >= 10) {
        await updateDoc(doc(this.groupInvitationsCollection, invitationId), {
          status: 'expired' as GroupInvitationStatus,
          updatedAt: serverTimestamp(),
        });
        throw new Error('This group is full (maximum 10 members)');
      }

      // Re-check 5-group limit for the accepting user
      const userGroupCount = await this.getUserGroupCount(userId);
      if (userGroupCount >= 5) {
        throw new Error('You can be in up to 5 groups at a time');
      }

      // Resolve display name across profile collections + auth.
      const userName = await resolveUserDisplayName(userId);

      const batch = writeBatch(db);

      // Update invitation status
      batch.update(doc(this.groupInvitationsCollection, invitationId), {
        status: 'accepted' as GroupInvitationStatus,
        updatedAt: serverTimestamp(),
      });

      // Add member to group
      const newMember: GroupMember = {
        userId,
        userName,
        role: 'member',
        joinedAt: new Date(),
      };

      const updatedMembers = [...group.members, { ...newMember, joinedAt: Timestamp.now() }];
      const updatedMemberIds = [...group.memberIds, userId];

      batch.update(doc(this.groupsCollection, invitation.groupId), {
        members: updatedMembers,
        memberIds: updatedMemberIds,
        updatedAt: serverTimestamp(),
      });

      // Post member_joined activity
      const activityRef = doc(this.groupActivitiesCollection);
      batch.set(activityRef, {
        groupId: invitation.groupId,
        userId,
        userName,
        type: 'member_joined' as GroupActivityType,
        timestamp: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  async declineInvitation(invitationId: string): Promise<void> {
    try {
      await updateDoc(doc(this.groupInvitationsCollection, invitationId), {
        status: 'declined' as GroupInvitationStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  }

  async getPendingInvitations(userId: string): Promise<GroupInvitation[]> {
    try {
      const q = query(
        this.groupInvitationsCollection,
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || undefined,
      })) as GroupInvitation[];
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      throw error;
    }
  }

  async getGroupInvitableFriends(groupId: string, inviterId?: string): Promise<Friend[]> {
    try {
      const group = await this.getGroup(groupId);
      const existingMemberIds = new Set(group.memberIds);

      // Invitations are drawn from the current user's own friend list — that's
      // who is inviting, and security rules only allow reading your own friends.
      // Fall back to the passed id, then the authenticated user.
      const userId = inviterId || getAuth().currentUser?.uid || '';
      if (!userId) return [];

      const friendsData = await friendService.getFriends(userId);

      // Filter out users already in the group
      return friendsData.friends.filter((friend) => !existingMemberIds.has(friend.friendId));
    } catch (error) {
      console.error('Error getting invitable friends:', error);
      throw error;
    }
  }

  // ── Members ──

  async removeMember(groupId: string, adminId: string, memberId: string): Promise<void> {
    try {
      const group = await this.getGroup(groupId);

      if (group.status === 'ended') {
        throw new Error('This group has ended');
      }

      const batch = writeBatch(db);

      // Remove member from group
      const updatedMembers = group.members.filter((m) => m.userId !== memberId);
      const updatedMemberIds = group.memberIds.filter((id) => id !== memberId);

      batch.update(doc(this.groupsCollection, groupId), {
        members: updatedMembers,
        memberIds: updatedMemberIds,
        updatedAt: serverTimestamp(),
      });

      // Delete member's tracked habits for this group
      const trackedHabitsQuery = query(
        this.trackedHabitsCollection,
        where('groupId', '==', groupId),
        where('userId', '==', memberId)
      );
      const trackedHabitsSnapshot = await getDocs(trackedHabitsQuery);
      trackedHabitsSnapshot.docs.forEach((thDoc) => {
        batch.delete(thDoc.ref);
      });

      // Get removed member's name for the activity
      const removedMember = group.members.find((m) => m.userId === memberId);
      const removedName = removedMember?.userName || 'Unknown User';

      // Post system event to group activities
      const activityRef = doc(this.groupActivitiesCollection);
      batch.set(activityRef, {
        groupId,
        userId: memberId,
        userName: removedName,
        type: 'member_left' as GroupActivityType,
        timestamp: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    try {
      const group = await this.getGroup(groupId);

      if (group.status === 'ended') {
        throw new Error('This group has ended');
      }

      // If admin leaves or is last member, end the group
      const isAdmin = group.adminId === userId;
      const isLastMember = group.members.length <= 1;

      if (isAdmin || isLastMember) {
        // End the group first
        await this.endGroup(groupId, userId);

        // Still clean up the member's tracked habits
        const trackedHabitsQuery = query(
          this.trackedHabitsCollection,
          where('groupId', '==', groupId),
          where('userId', '==', userId)
        );
        const trackedHabitsSnapshot = await getDocs(trackedHabitsQuery);
        const batch = writeBatch(db);
        trackedHabitsSnapshot.docs.forEach((thDoc) => {
          batch.delete(thDoc.ref);
        });

        // Post member_left activity
        const leavingMember = group.members.find((m) => m.userId === userId);
        const activityRef = doc(this.groupActivitiesCollection);
        batch.set(activityRef, {
          groupId,
          userId,
          userName: leavingMember?.userName || 'Unknown User',
          type: 'member_left' as GroupActivityType,
          timestamp: serverTimestamp(),
        });

        await batch.commit();
        return;
      }

      // Regular member leaving — use removeMember logic
      await this.removeMember(groupId, userId, userId);
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }

  // ── Tracked Habits ──

  async linkHabits(
    groupId: string,
    userId: string,
    habits: { id: string; name: string; category: string }[]
  ): Promise<void> {
    try {
      const group = await this.getGroup(groupId);

      if (group.status === 'ended') {
        throw new Error('This group has ended');
      }

      // Validate user is a member
      if (!group.memberIds.includes(userId)) {
        throw new Error('You are not a member of this group');
      }

      // Validate ownership — check each habit belongs to the user
      const habitsCollection = collection(db, 'habits');
      for (const habit of habits) {
        const habitDoc = await getDoc(doc(habitsCollection, habit.id));
        if (!habitDoc.exists() || habitDoc.data().userId !== userId) {
          throw new Error('You can only link your own habits');
        }
      }

      // Check 1–6 habit limit per member per group
      const existingTracked = await this.getUserTrackedHabits(groupId, userId);
      const totalAfterLink = existingTracked.length + habits.length;
      if (totalAfterLink > 6) {
        throw new Error('You can link up to 6 habits per group');
      }
      if (habits.length === 0 && existingTracked.length === 0) {
        throw new Error('You must link at least 1 habit per group');
      }

      // Create TrackedHabit documents
      const batch = writeBatch(db);
      for (const habit of habits) {
        const trackedRef = doc(this.trackedHabitsCollection);
        batch.set(trackedRef, {
          groupId,
          userId,
          habitId: habit.id,
          habitName: habit.name,
          habitCategory: habit.category,
          linkedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error linking habits:', error);
      throw error;
    }
  }

  async unlinkHabit(groupId: string, userId: string, habitId: string): Promise<void> {
    try {
      const q = query(
        this.trackedHabitsCollection,
        where('groupId', '==', groupId),
        where('userId', '==', userId),
        where('habitId', '==', habitId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Tracked habit not found');
      }

      // Delete the tracked habit document
      await deleteDoc(snapshot.docs[0].ref);
    } catch (error) {
      console.error('Error unlinking habit:', error);
      throw error;
    }
  }

  async getTrackedHabits(groupId: string): Promise<TrackedHabit[]> {
    try {
      const q = query(this.trackedHabitsCollection, where('groupId', '==', groupId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        linkedAt: doc.data().linkedAt?.toDate?.() || new Date(),
      })) as TrackedHabit[];
    } catch (error) {
      console.error('Error getting tracked habits:', error);
      throw error;
    }
  }

  async getUserTrackedHabits(groupId: string, userId: string): Promise<TrackedHabit[]> {
    try {
      const q = query(
        this.trackedHabitsCollection,
        where('groupId', '==', groupId),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        linkedAt: doc.data().linkedAt?.toDate?.() || new Date(),
      })) as TrackedHabit[];
    } catch (error) {
      console.error('Error getting user tracked habits:', error);
      throw error;
    }
  }

  async getTrackedHabitsByHabitId(habitId: string, userId: string): Promise<TrackedHabit[]> {
    try {
      const q = query(
        this.trackedHabitsCollection,
        where('habitId', '==', habitId),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        linkedAt: doc.data().linkedAt?.toDate?.() || new Date(),
      })) as TrackedHabit[];
    } catch (error) {
      console.error('Error getting tracked habits by habit ID:', error);
      throw error;
    }
  }

  // ── Group Feed & Progress ──

  async createGroupActivity(
    groupId: string,
    userId: string,
    type: GroupActivityType,
    habitData?: {
      habitId?: string;
      habitName?: string;
      habitCategory?: string;
      streakCount?: number;
    }
  ): Promise<string> {
    try {
      // Check group status
      const group = await this.getGroup(groupId);
      if (group.status === 'ended') {
        throw new Error('This group has ended');
      }

      // Resolve the name fresh rather than trusting the (possibly stale)
      // denormalized member record, so feed entries never show 'Unknown User'
      // when the real name is available.
      const member = group.members.find((m) => m.userId === userId);
      const userName =
        member?.userName && member.userName !== 'Unknown User'
          ? member.userName
          : await resolveUserDisplayName(userId);

      const activityData: Record<string, any> = {
        groupId,
        userId,
        userName,
        type,
        timestamp: serverTimestamp(),
      };

      if (habitData) {
        if (habitData.habitId) activityData.habitId = habitData.habitId;
        if (habitData.habitName) activityData.habitName = habitData.habitName;
        if (habitData.habitCategory) activityData.habitCategory = habitData.habitCategory;
        if (habitData.streakCount !== undefined) activityData.streakCount = habitData.streakCount;
      }

      const docRef = await addDoc(this.groupActivitiesCollection, activityData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating group activity:', error);
      throw error;
    }
  }

  async getGroupFeed(groupId: string, limitCount: number = 20): Promise<GroupActivity[]> {
    try {
      const q = query(
        this.groupActivitiesCollection,
        where('groupId', '==', groupId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      })) as GroupActivity[];
    } catch (error) {
      console.error('Error getting group feed:', error);
      throw error;
    }
  }

  async addGroupReaction(
    activityId: string,
    userId: string,
    reactionType: ReactionType
  ): Promise<void> {
    try {
      if (!activityId || !userId || !reactionType) {
        throw new Error('Invalid parameters for adding reaction');
      }

      const activityRef = doc(this.groupActivitiesCollection, activityId);
      const activityDoc = await getDoc(activityRef);

      if (!activityDoc.exists()) {
        throw new Error('Activity not found');
      }

      const activityData = activityDoc.data();
      const reactions: Reactions = activityData.reactions || {};
      const userReactions = reactions[userId] || [];

      // Toggle reaction — remove if exists, add if doesn't
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
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding group reaction:', error);
      throw error;
    }
  }

  async getGroupProgress(groupId: string): Promise<GroupProgress[]> {
    try {
      const group = await this.getGroup(groupId);
      const trackedHabits = await this.getTrackedHabits(groupId);

      // Get today's date for completion check
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const progressByUser: Record<string, GroupProgress> = {};

      // Initialize progress for each member
      for (const member of group.members) {
        progressByUser[member.userId] = {
          userId: member.userId,
          userName: member.userName,
          habits: [],
        };
      }

      // For each tracked habit, check completion status and streak
      for (const tracked of trackedHabits) {
        if (!progressByUser[tracked.userId]) continue;

        // Check if habit was completed today
        let completedToday = false;
        try {
          const completionsQuery = query(
            collection(db, 'completions'),
            where('habitId', '==', tracked.habitId),
            where('userId', '==', tracked.userId)
          );
          const completionsSnapshot = await getDocs(completionsQuery);

          for (const compDoc of completionsSnapshot.docs) {
            const completedAt = compDoc.data().completedAt?.toDate?.();
            if (completedAt) {
              const compDate = new Date(completedAt);
              compDate.setHours(0, 0, 0, 0);
              if (compDate.getTime() === today.getTime()) {
                completedToday = true;
                break;
              }
            }
          }
        } catch (compError) {
          console.warn('Error checking completion for habit:', tracked.habitId, compError);
        }

        // Get current streak
        let currentStreak = 0;
        try {
          const streakDoc = await getDoc(doc(collection(db, 'streaks'), tracked.habitId));
          if (streakDoc.exists()) {
            currentStreak = streakDoc.data().currentStreak || 0;
          }
        } catch (streakError) {
          console.warn('Error getting streak for habit:', tracked.habitId, streakError);
        }

        progressByUser[tracked.userId].habits.push({
          habitId: tracked.habitId,
          habitName: tracked.habitName,
          habitCategory: tracked.habitCategory,
          completedToday,
          currentStreak,
        });
      }

      return Object.values(progressByUser);
    } catch (error) {
      console.error('Error getting group progress:', error);
      throw error;
    }
  }

  async getGroupCompletionPercentage(groupId: string): Promise<number> {
    try {
      const progress = await this.getGroupProgress(groupId);
      return this.calculateCompletionPercentage(progress);
    } catch (error) {
      console.error('Error getting group completion percentage:', error);
      throw error;
    }
  }

  // ── Real-time Subscriptions ──

  subscribeToUserGroups(userId: string, callback: (groups: Group[]) => void): () => void {
    const q = query(
      this.groupsCollection,
      where('memberIds', 'array-contains', userId),
      where('status', '==', 'active')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        try {
          const groups = snapshot.docs.map((doc) => this.mapGroupDoc(doc));
          callback(groups);
        } catch (error) {
          console.error('Error in user groups subscription:', error);
        }
      },
      (error) => {
        console.error('Firestore user groups subscription error:', error);
      }
    );
  }

  subscribeToGroupInvitations(
    userId: string,
    callback: (invitations: GroupInvitation[]) => void
  ): () => void {
    const q = query(
      this.groupInvitationsCollection,
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        try {
          const invitations = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || undefined,
          })) as GroupInvitation[];
          callback(invitations);
        } catch (error) {
          console.error('Error in group invitations subscription:', error);
        }
      },
      (error) => {
        console.error('Firestore group invitations subscription error:', error);
      }
    );
  }

  subscribeToGroupFeed(
    groupId: string,
    callback: (activities: GroupActivity[]) => void
  ): () => void {
    const q = query(
      this.groupActivitiesCollection,
      where('groupId', '==', groupId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        try {
          const activities = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || new Date(),
          })) as GroupActivity[];
          callback(activities);
        } catch (error) {
          console.error('Error in group feed subscription:', error);
        }
      },
      (error) => {
        console.error('Firestore group feed subscription error:', error);
      }
    );
  }

  subscribeToGroupProgress(
    groupId: string,
    callback: (progress: GroupProgress[]) => void
  ): () => void {
    // Listen to tracked habits changes for this group
    const q = query(this.trackedHabitsCollection, where('groupId', '==', groupId));

    return onSnapshot(
      q,
      async () => {
        try {
          const progress = await this.getGroupProgress(groupId);
          callback(progress);
        } catch (error) {
          console.error('Error in group progress subscription:', error);
        }
      },
      (error) => {
        console.error('Firestore group progress subscription error:', error);
      }
    );
  }

  // ── Group Notifications ──

  private notificationCountCache: Record<string, { count: number; date: string }> = {};

  private getNotificationCacheKey(groupId: string): string {
    return `group_notif_${groupId}`;
  }

  private getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private getNotificationCount(groupId: string): number {
    const key = this.getNotificationCacheKey(groupId);
    const cached = this.notificationCountCache[key];
    const today = this.getTodayString();

    if (cached && cached.date === today) {
      return cached.count;
    }

    // Reset for new day
    this.notificationCountCache[key] = { count: 0, date: today };
    return 0;
  }

  private incrementNotificationCount(groupId: string): void {
    const key = this.getNotificationCacheKey(groupId);
    const today = this.getTodayString();
    const current = this.getNotificationCount(groupId);
    this.notificationCountCache[key] = { count: current + 1, date: today };
  }

  private canSendGroupNotification(groupId: string): boolean {
    return this.getNotificationCount(groupId) < 3;
  }

  private async isUserNotificationsEnabled(userId: string): Promise<boolean> {
    try {
      const settingsDoc = await getDoc(doc(collection(db, 'socialSettings'), userId));
      if (!settingsDoc.exists()) {
        return true; // Default to enabled
      }
      const settings = settingsDoc.data() as SocialSettings;
      return settings.notifyOnFriendActivity !== false;
    } catch (error) {
      console.warn('Error checking notification settings:', error);
      return true; // Default to enabled on error
    }
  }

  async sendDailyReminderNotification(
    groupId: string,
    userId: string,
    groupName: string,
    incompleteHabitNames: string[]
  ): Promise<void> {
    try {
      if (!this.canSendGroupNotification(groupId)) return;

      const enabled = await this.isUserNotificationsEnabled(userId);
      if (!enabled) return;

      const habitList = incompleteHabitNames.slice(0, 3).join(', ');
      const suffix =
        incompleteHabitNames.length > 3 ? ` and ${incompleteHabitNames.length - 3} more` : '';

      await notificationService.scheduleHabitReminder({
        id: `group-reminder-${groupId}-${userId}-${this.getTodayString()}`,
        name: `${groupName}: ${habitList}${suffix} still to do`,
        reminderEnabled: false,
      });

      this.incrementNotificationCount(groupId);
    } catch (error) {
      console.warn('Error sending daily reminder notification:', error);
    }
  }

  async sendCelebrationNotification(
    groupId: string,
    groupName: string,
    memberIds: string[]
  ): Promise<void> {
    try {
      if (!this.canSendGroupNotification(groupId)) return;

      for (const memberId of memberIds) {
        const enabled = await this.isUserNotificationsEnabled(memberId);
        if (!enabled) continue;

        await notificationService.scheduleHabitReminder({
          id: `group-celebration-${groupId}-${this.getTodayString()}`,
          name: `🎉 Everyone in "${groupName}" completed their habits today!`,
          reminderEnabled: false,
        });
      }

      this.incrementNotificationCount(groupId);
    } catch (error) {
      console.warn('Error sending celebration notification:', error);
    }
  }

  async sendNewMemberNotification(
    groupId: string,
    groupName: string,
    newMemberName: string,
    existingMemberIds: string[]
  ): Promise<void> {
    try {
      if (!this.canSendGroupNotification(groupId)) return;

      for (const memberId of existingMemberIds) {
        const enabled = await this.isUserNotificationsEnabled(memberId);
        if (!enabled) continue;

        await notificationService.scheduleHabitReminder({
          id: `group-newmember-${groupId}-${newMemberName}-${this.getTodayString()}`,
          name: `${newMemberName} joined "${groupName}"`,
          reminderEnabled: false,
        });
      }

      this.incrementNotificationCount(groupId);
    } catch (error) {
      console.warn('Error sending new member notification:', error);
    }
  }

  // ── Helpers ──

  private mapGroupDoc(docSnapshot: any): Group {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      name: data.name,
      description: data.description,
      category: data.category,
      adminId: data.adminId,
      members: (data.members || []).map((m: any) => ({
        ...m,
        joinedAt: m.joinedAt?.toDate?.() || new Date(),
      })),
      memberIds: data.memberIds || [],
      status: data.status,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
      ...(data.endDate && { endDate: data.endDate.toDate?.() || data.endDate }),
      ...(data.endedAt && { endedAt: data.endedAt.toDate?.() || data.endedAt }),
    } as Group;
  }

  // ── Group Chat Methods ──

  /**
   * Send a message to a group chat.
   */
  async sendMessage(
    groupId: string,
    userId: string,
    userName: string,
    text: string
  ): Promise<string> {
    if (!text.trim()) throw new Error('Message cannot be empty');
    if (text.length > 500) throw new Error('Message too long (max 500 characters)');

    const messagesRef = collection(db, 'groups', groupId, 'messages');
    const docRef = await addDoc(messagesRef, {
      groupId,
      userId,
      userName,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * Subscribe to real-time group chat messages.
   * Returns an unsubscribe function.
   */
  subscribeToMessages(
    groupId: string,
    callback: (messages: any[]) => void,
    messageLimit: number = 50
  ): () => void {
    const messagesRef = collection(db, 'groups', groupId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(messageLimit));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }));
        callback(messages);
      },
      (error) => {
        console.error('Error in group chat subscription:', error);
      }
    );
  }
}

export const groupService = new GroupService();
export default groupService;
