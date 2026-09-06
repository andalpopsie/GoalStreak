// useGroups Hook - Accountability Groups real-time data and actions
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import groupService from '../services/groupService';
import { Group, GroupInvitation, CreateGroupForm } from '../types/social';

interface UseGroupsReturn {
  // State
  groups: Group[];
  recentlyEndedGroups: Group[];
  pendingInvitations: GroupInvitation[];

  // Loading states
  isLoadingGroups: boolean;
  isCreating: boolean;
  isProcessingInvitation: boolean;

  // Actions
  createGroup: (form: CreateGroupForm) => Promise<string>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  refreshGroups: () => Promise<void>;

  // Utility
  pendingInvitationCount: number;
  error: string | null;
}

export const useGroups = (): UseGroupsReturn => {
  const { user } = useAuth();

  // State
  const [groups, setGroups] = useState<Group[]>([]);
  const [recentlyEndedGroups, setRecentlyEndedGroups] = useState<Group[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<GroupInvitation[]>([]);

  // Loading states
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessingInvitation, setIsProcessingInvitation] = useState(false);

  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Track whether we've already checked for expired groups this session
  const hasCheckedExpired = useRef(false);

  // Real-time subscription for user's active groups
  useEffect(() => {
    if (!user?.id) {
      setGroups([]);
      setRecentlyEndedGroups([]);
      setIsLoadingGroups(false);
      hasCheckedExpired.current = false;
      return;
    }

    setIsLoadingGroups(true);

    const unsubscribe = groupService.subscribeToUserGroups(user.id, async (updatedGroups) => {
      // On first load, check for expired groups and auto-end them (Req 7.4)
      if (!hasCheckedExpired.current) {
        hasCheckedExpired.current = true;
        try {
          const endedIds = await groupService.checkAndEndExpiredGroups(updatedGroups);
          if (endedIds.length > 0) {
            // Filter out the just-ended groups from the active list;
            // the subscription will fire again with the updated data
            updatedGroups = updatedGroups.filter((g) => !endedIds.includes(g.id));
          }
        } catch (err) {
          console.warn('Error checking expired groups:', err);
        }
      }

      setGroups(updatedGroups);
      setIsLoadingGroups(false);
    });

    return unsubscribe;
  }, [user?.id]);

  // Fetch recently ended groups for 30-day data retention (Req 7.6)
  useEffect(() => {
    if (!user?.id) {
      setRecentlyEndedGroups([]);
      return;
    }

    const fetchRecentlyEnded = async () => {
      try {
        const ended = await groupService.getRecentlyEndedGroups(user.id);
        setRecentlyEndedGroups(ended);
      } catch (err) {
        console.warn('Error fetching recently ended groups:', err);
      }
    };

    fetchRecentlyEnded();
  }, [user?.id, groups]); // Re-fetch when active groups change (a group may have just ended)

  // Real-time subscription for pending group invitations
  useEffect(() => {
    if (!user?.id) {
      setPendingInvitations([]);
      return;
    }

    const unsubscribe = groupService.subscribeToGroupInvitations(user.id, (invitations) => {
      setPendingInvitations(invitations);
    });

    return unsubscribe;
  }, [user?.id]);

  // Create a new accountability group
  const createGroup = useCallback(
    async (form: CreateGroupForm): Promise<string> => {
      if (!user?.id) throw new Error('User not authenticated');

      setIsCreating(true);
      setError(null);

      try {
        const groupId = await groupService.createGroup(user.id, form);
        return groupId;
      } catch (err: any) {
        console.error('Error creating group:', err);
        const message = err.message || 'Failed to create group';
        setError(message);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [user?.id]
  );

  // Accept a pending group invitation
  const acceptInvitation = useCallback(
    async (invitationId: string): Promise<void> => {
      if (!user?.id) throw new Error('User not authenticated');

      setIsProcessingInvitation(true);
      setError(null);

      try {
        await groupService.acceptInvitation(invitationId, user.id);
      } catch (err: any) {
        console.error('Error accepting invitation:', err);
        const message = err.message || 'Failed to accept invitation';
        setError(message);
        throw err;
      } finally {
        setIsProcessingInvitation(false);
      }
    },
    [user?.id]
  );

  // Decline a pending group invitation
  const declineInvitation = useCallback(
    async (invitationId: string): Promise<void> => {
      if (!user?.id) throw new Error('User not authenticated');

      setIsProcessingInvitation(true);
      setError(null);

      try {
        await groupService.declineInvitation(invitationId);
      } catch (err: any) {
        console.error('Error declining invitation:', err);
        const message = err.message || 'Failed to decline invitation';
        setError(message);
        throw err;
      } finally {
        setIsProcessingInvitation(false);
      }
    },
    [user?.id]
  );

  // Manual refresh — re-fetches groups via one-shot query
  const refreshGroups = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    setIsLoadingGroups(true);
    setError(null);

    try {
      const [updatedGroups, updatedInvitations, endedGroups] = await Promise.all([
        groupService.getUserGroups(user.id),
        groupService.getPendingInvitations(user.id),
        groupService.getRecentlyEndedGroups(user.id),
      ]);
      setGroups(updatedGroups);
      setPendingInvitations(updatedInvitations);
      setRecentlyEndedGroups(endedGroups);
    } catch (err: any) {
      console.error('Error refreshing groups:', err);
      setError('Failed to refresh groups');
    } finally {
      setIsLoadingGroups(false);
    }
  }, [user?.id]);

  return {
    // State
    groups,
    recentlyEndedGroups,
    pendingInvitations,

    // Loading states
    isLoadingGroups,
    isCreating,
    isProcessingInvitation,

    // Actions
    createGroup,
    acceptInvitation,
    declineInvitation,
    refreshGroups,

    // Utility
    pendingInvitationCount: pendingInvitations.length,
    error,
  };
};

export default useGroups;
