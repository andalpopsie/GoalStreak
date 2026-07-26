// useModeration Hook - Loads and maintains the current user's moderation state
// (bidirectional block set + reported-content set) and exposes block/report actions.
//
// The hook subscribes to friendService.subscribeBlockSet and
// friendService.subscribeReportedContent on mount and merges both live sets into a
// single ModerationState. Consumers gate rendering on `ready`, which only becomes
// true AFTER the first block-set snapshot arrives — this is a fail-closed guarantee
// so a blocked user is never briefly visible on cold start (design: Error Handling,
// "Cold-start fail-closed").
//
// _Requirements: 2.7, 2.8, 5.1, 5.2_
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import friendService from '../services/friendService';
import { useAuth } from './useAuth';
import { ModerationState, ReportContentType, ReportReason } from '../types/social';

export interface UseModerationReturn {
  state: ModerationState;
  ready: boolean;
  blockUser: (blockedUserId: string) => Promise<void>;
  unblockUser: (blockedUserId: string) => Promise<void>;
  reportContent: (params: {
    reportedUserId: string;
    contentType: ReportContentType;
    contentId: string;
    reason: ReportReason;
  }) => Promise<void>;
}

const EMPTY_STATE: ModerationState = {
  blockedUserIds: new Set<string>(),
  reportedContentIds: new Set<string>(),
};

export function useModeration(): UseModerationReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [reportedContentIds, setReportedContentIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  // Guard against setState-after-unmount for the async action handlers.
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // No authenticated user — reset to a closed, not-ready state.
    if (!userId) {
      setBlockedUserIds(new Set());
      setReportedContentIds(new Set());
      setReady(false);
      return () => {
        isMountedRef.current = false;
      };
    }

    const unsubscribeBlocks = friendService.subscribeBlockSet(userId, (ids) => {
      if (!isMountedRef.current) return;
      setBlockedUserIds(ids);
      // ready flips true only after the first block-set snapshot (fail-closed).
      setReady(true);
    });

    const unsubscribeReports = friendService.subscribeReportedContent(userId, (ids) => {
      if (!isMountedRef.current) return;
      setReportedContentIds(ids);
    });

    return () => {
      isMountedRef.current = false;
      unsubscribeBlocks();
      unsubscribeReports();
    };
  }, [userId]);

  const state = useMemo<ModerationState>(
    () => ({ blockedUserIds, reportedContentIds }),
    [blockedUserIds, reportedContentIds]
  );

  const blockUser = useCallback(
    async (blockedUserId: string): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      // Optimistic local add — hide the target immediately; the subscription
      // reconciles the authoritative state afterward.
      if (isMountedRef.current) {
        setBlockedUserIds((prev) => {
          const next = new Set(prev);
          next.add(blockedUserId);
          return next;
        });
      }
      await friendService.blockUser(userId, blockedUserId);
    },
    [userId]
  );

  const unblockUser = useCallback(
    async (blockedUserId: string): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      await friendService.unblockUser(userId, blockedUserId);
    },
    [userId]
  );

  const reportContent = useCallback(
    async (params: {
      reportedUserId: string;
      contentType: ReportContentType;
      contentId: string;
      reason: ReportReason;
    }): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      await friendService.reportContent({
        reporterId: userId,
        reportedUserId: params.reportedUserId,
        contentType: params.contentType,
        contentId: params.contentId,
        reason: params.reason,
      });
    },
    [userId]
  );

  return { state, ready, blockUser, unblockUser, reportContent };
}

export default useModeration;

// Re-exported so consumers can reference the empty baseline state if needed.
export { EMPTY_STATE as EMPTY_MODERATION_STATE };
