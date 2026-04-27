// useGroupDetail Hook - Single group real-time data and actions
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import groupService from '../services/groupService';
import {
  Group,
  GroupActivity,
  GroupProgress,
  TrackedHabit,
  ReactionType,
} from '../types/social';

interface UseGroupDetailReturn {
  // State
  group: Group | null;
  progress: GroupProgress[];
  feed: GroupActivity[];
  trackedHabits: TrackedHabit[];
  completionPercentage: number;

  // Loading states
  isLoading: boolean;
  isLinking: boolean;

  // Actions
  linkHabits: (habits: { id: string; name: string; category: string }[]) => Promise<void>;
  unlinkHabit: (habitId: string) => Promise<void>;
  inviteMember: (friendId: string, friendName: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  leaveGroup: () => Promise<void>;
  endGroup: () => Promise<void>;
  updateGroup: (updates: Partial<Pick<Group, 'name' | 'description' | 'endDate'>>) => Promise<void>;
  addReaction: (activityId: string, reactionType: ReactionType) => Promise<void>;

  // Utility
  isAdmin: boolean;
  error: string | null;
}

export const useGroupDetail = (groupId: string): UseGroupDetailReturn => {
  const { user } = useAuth();

  // State
  const [group, setGroup] = useState<Group | null>(null);
  const [progress, setProgress] = useState<GroupProgress[]>([]);
  const [feed, setFeed] = useState<GroupActivity[]>([]);
  const [trackedHabits, setTrackedHabits] = useState<TrackedHabit[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);

  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription for group document
  useEffect(() => {
    if (!groupId || !user?.id) {
      setGroup(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Fetch group once, then rely on other subscriptions for updates
    // The group document itself changes less frequently than feed/progress
    const fetchGroup = async () => {
      try {
        const groupData = await groupService.getGroup(groupId);
        setGroup(groupData);
      } catch (err: any) {
        console.error('Error fetching group:', err);
        setError('Failed to load group');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroup();

    // Subscribe to user's groups to catch membership/status changes
    const unsubscribe = groupService.subscribeToUserGroups(
      user.id,
      (groups) => {
        const updatedGroup = groups.find(g => g.id === groupId);
        if (updatedGroup) {
          setGroup(updatedGroup);
        }
        // If group disappears from active list (ended or removed), keep last known state
      }
    );

    return unsubscribe;
  }, [groupId, user?.id]);

  // Real-time subscription for group feed
  useEffect(() => {
    if (!groupId) {
      setFeed([]);
      return;
    }

    const unsubscribe = groupService.subscribeToGroupFeed(
      groupId,
      (activities) => {
        setFeed(activities);
      }
    );

    return unsubscribe;
  }, [groupId]);

  // Real-time subscription for group progress (tracked habits + completions)
  useEffect(() => {
    if (!groupId) {
      setProgress([]);
      setTrackedHabits([]);
      return;
    }

    const unsubscribe = groupService.subscribeToGroupProgress(
      groupId,
      (updatedProgress) => {
        setProgress(updatedProgress);
      }
    );

    // Also fetch tracked habits directly for the linking UI
    const fetchTrackedHabits = async () => {
      try {
        const habits = await groupService.getTrackedHabits(groupId);
        setTrackedHabits(habits);
      } catch (err: any) {
        console.warn('Error fetching tracked habits:', err);
      }
    };

    fetchTrackedHabits();

    return unsubscribe;
  }, [groupId]);

  // Compute completion percentage from progress data
  const completionPercentage = useMemo(() => {
    return groupService.calculateCompletionPercentage(progress);
  }, [progress]);

  // Compute isAdmin from current user's role in group members
  const isAdmin = useMemo(() => {
    if (!group || !user?.id) return false;
    return group.adminId === user.id;
  }, [group, user?.id]);

  // ── Actions ──

  const linkHabits = useCallback(async (
    habits: { id: string; name: string; category: string }[]
  ): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    setIsLinking(true);
    setError(null);

    try {
      await groupService.linkHabits(groupId, user.id, habits);
      // Refresh tracked habits after linking
      const updated = await groupService.getTrackedHabits(groupId);
      setTrackedHabits(updated);
    } catch (err: any) {
      console.error('Error linking habits:', err);
      const message = err.message || 'Failed to link habits';
      setError(message);
      throw err;
    } finally {
      setIsLinking(false);
    }
  }, [groupId, user?.id]);

  const unlinkHabit = useCallback(async (habitId: string): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    setError(null);

    try {
      await groupService.unlinkHabit(groupId, user.id, habitId);
      // Refresh tracked habits after unlinking
      const updated = await groupService.getTrackedHabits(groupId);
      setTrackedHabits(updated);
    } catch (err: any) {
      console.error('Error unlinking habit:', err);
      const message = err.message || 'Failed to unlink habit';
      setError(message);
      throw err;
    }
  }, [groupId, user?.id]);

  const inviteMember = useCallback(async (
    friendId: string,
    friendName: string
  ): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    setError(null);

    try {
      await groupService.inviteMember(groupId, user.id, friendId, friendName);
    } catch (err: any) {
      console.error('Error inviting member:', err);
      const message = err.message || 'Failed to invite member';
      setError(message);
      throw err;
    }
  }, [groupId, user?.id]);

  const removeMember = useCallback(async (memberId: string): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    setError(null);

    try {
      await groupService.removeMember(groupId, user.id, memberId);
    } catch (err: any) {
      console.error('Error removing member:', err);
      const message = err.message || 'Failed to remove member';
      setError(message);
      throw err;
    }
  }, [groupId, user?.id]);

  const leaveGroup = useCallback(async (): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    setError(null);

    try {
      await groupService.leaveGroup(groupId, user.id);
    } catch (err: any) {
      console.error('Error leaving group:', err);
      const message = err.message || 'Failed to leave group';
      setError(message);
      throw err;
    }
  }, [groupId, user?.id]);

  const endGroup = useCallback(async (): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    setError(null);

    try {
      await groupService.endGroup(groupId, user.id);
    } catch (err: any) {
      console.error('Error ending group:', err);
      const message = err.message || 'Failed to end group';
      setError(message);
      throw err;
    }
  }, [groupId, user?.id]);

  const updateGroup = useCallback(async (
    updates: Partial<Pick<Group, 'name' | 'description' | 'endDate'>>
  ): Promise<void> => {
    setError(null);

    try {
      await groupService.updateGroup(groupId, updates);
      // Re-fetch group to get updated data
      const updatedGroup = await groupService.getGroup(groupId);
      setGroup(updatedGroup);
    } catch (err: any) {
      console.error('Error updating group:', err);
      const message = err.message || 'Failed to update group';
      setError(message);
      throw err;
    }
  }, [groupId]);

  const addReaction = useCallback(async (
    activityId: string,
    reactionType: ReactionType
  ): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    setError(null);

    try {
      await groupService.addGroupReaction(activityId, user.id, reactionType);
    } catch (err: any) {
      console.error('Error adding reaction:', err);
      const message = err.message || 'Failed to add reaction';
      setError(message);
      throw err;
    }
  }, [user?.id]);

  return {
    // State
    group,
    progress,
    feed,
    trackedHabits,
    completionPercentage,

    // Loading states
    isLoading,
    isLinking,

    // Actions
    linkHabits,
    unlinkHabit,
    inviteMember,
    removeMember,
    leaveGroup,
    endGroup,
    updateGroup,
    addReaction,

    // Utility
    isAdmin,
    error,
  };
};

export default useGroupDetail;
