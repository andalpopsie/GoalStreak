/**
 * useFoundingMember
 *
 * Subscribes to `userProfiles/{uid}` via Firestore onSnapshot and surfaces the
 * founding member fields. Completely independent of `useSubscription` / `isPro`
 * — badge visibility and founding number are derived solely from the
 * `foundingMember` flag and `foundingRecord.number` stored by the server-side
 * Cloud Function (R7.4, R8.4, R14.1–R14.3).
 */
import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { FoundingRecord } from '../types';

export interface FoundingMemberState {
  /** True when this user holds a founding slot (foundingMember flag on profile). */
  isFoundingMember: boolean;
  /** 1–100 if the user is a founding member; null if unavailable or non-member. */
  foundingNumber: number | null;
  /** True while the initial snapshot has not yet resolved. */
  loading: boolean;
}

/**
 * Subscribes to the `userProfiles/{uid}` document and returns the founding
 * member state. The hook:
 * - starts in the `loading` state until the first snapshot arrives.
 * - derives `isFoundingMember` from the boolean `foundingMember` field only.
 * - exposes `foundingNumber` from `foundingRecord.number` (null when absent).
 * - cleans up the listener on unmount.
 * - never references `useSubscription`, `isPro`, or RevenueCat.
 */
export function useFoundingMember(uid: string): FoundingMemberState {
  const [state, setState] = useState<FoundingMemberState>({
    isFoundingMember: false,
    foundingNumber: null,
    loading: true,
  });

  // Guard against setState after unmount.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!uid) {
      // No UID provided — reset to default non-loading state.
      if (isMountedRef.current) {
        setState({ isFoundingMember: false, foundingNumber: null, loading: false });
      }
      return;
    }

    const profileRef = doc(db, 'userProfiles', uid);

    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        if (!isMountedRef.current) return;

        if (!snapshot.exists()) {
          setState({ isFoundingMember: false, foundingNumber: null, loading: false });
          return;
        }

        const data = snapshot.data();

        // Derive founding state purely from the server-written fields.
        // `foundingMember` is the authoritative boolean flag (R7.4, R8.4).
        const isFoundingMember: boolean = data?.foundingMember === true;

        // `foundingRecord.number` carries the permanent 1–100 slot number.
        // Return null (not 0) when absent so callers can distinguish
        // "member with number" from "number not yet available" (R8.5, R14.3).
        const record = data?.foundingRecord as FoundingRecord | undefined;
        const foundingNumber: number | null =
          isFoundingMember && typeof record?.number === 'number' && record.number > 0
            ? record.number
            : null;

        setState({ isFoundingMember, foundingNumber, loading: false });
      },
      (error) => {
        // On a read error, leave the user as non-founding rather than
        // incorrectly granting or denying founding state.
        console.error('[useFoundingMember] onSnapshot error:', error);
        if (isMountedRef.current) {
          setState({ isFoundingMember: false, foundingNumber: null, loading: false });
        }
      }
    );

    return unsubscribe;
  }, [uid]);

  return state;
}

export default useFoundingMember;
