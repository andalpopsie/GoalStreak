/**
 * Unit tests for `habitService.createHabit` tier-based limit enforcement.
 *
 * Validates the behaviors required by Pro Subscription task 7.3:
 *  - Free user with 6 habits → throws `HabitLimitError` with `isPro: false`
 *    and `limit: 6`.
 *  - Pro user with 15 habits → throws `HabitLimitError` with `isPro: true`
 *    and `limit: 15`.
 *  - Free user with 5 habits → succeeds and creates the habit.
 *  - Pro user with 14 habits → succeeds and creates the habit.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

// ── Module-level mocks (hoisted by Jest) ────────────────────────────────────

// Override the global firebase/firestore mock from `src/__tests__/setup.ts`
// so this file controls every Firestore primitive `habitService.createHabit`
// touches: `query`, `where`, `getDocs` (for the limit count), `collection`,
// `addDoc` (for the actual write), and `doc` + `setDoc` (for streak init).
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ __collection: true })),
  doc: jest.fn(() => ({ __doc: true })),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
  query: jest.fn(() => ({ __query: true })),
  where: jest.fn(() => ({ __where: true })),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: { fromDate: jest.fn((d: Date) => d) },
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(),
}));

// `habitService` imports `db` from `./firebase`; tests don't need a real
// instance.
jest.mock('../firebase', () => ({
  db: { __mock: 'db' },
}));

// `withRetry` wraps `createHabit`; in tests we want the operation to run
// exactly once with no backoff so we can inspect the underlying behavior
// directly without dealing with timer-based retries.
jest.mock('../retryService', () => ({
  withRetry: jest.fn((op: () => Promise<unknown>) => op()),
  RETRY_CONFIGS: {
    habitCompletion: {},
    habitCreation: {},
  },
}));

// Stub the side-effect services so they don't reach into AsyncStorage or
// Expo notifications during the test.
jest.mock('../notificationService', () => ({
  notificationService: {
    scheduleHabitReminder: jest.fn().mockResolvedValue('notification-id'),
  },
}));

jest.mock('../achievementsService', () => ({
  achievementsService: {
    unlockAchievement: jest.fn().mockResolvedValue(true),
  },
}));

// `subscriptionService.getProStatus` is the entitlement source of truth that
// `createHabit` consults to choose the applicable limit. Each test overrides
// the resolved value to exercise free vs. Pro tiers.
jest.mock('../subscriptionService', () => ({
  subscriptionService: {
    getProStatus: jest.fn(),
  },
}));

// ── Imports (resolved against the mocks above) ──────────────────────────────

import { addDoc, getDocs } from 'firebase/firestore';
import { habitService } from '../habitService';
import { subscriptionService } from '../subscriptionService';
import { HabitLimitError } from '../../types/subscription';
import { LIMITS } from '../../constants/limits';
import { CreateHabitForm } from '../../types';

// ── Helpers ─────────────────────────────────────────────────────────────────

const TEST_USER_ID = 'test-user-1';

/**
 * Build a minimal valid `CreateHabitForm` payload. Tests don't care about the
 * exact field values — the limit check fires before any of them are read.
 */
function makeForm(overrides: Partial<CreateHabitForm> = {}): CreateHabitForm {
  return {
    name: 'Drink water',
    category: 'wellness',
    frequency: 'daily',
    isPublic: false,
    ...overrides,
  } as CreateHabitForm;
}

/**
 * Build a Firestore querySnapshot-shaped object with `count` habit documents.
 * `createHabit` only reads `querySnapshot.forEach` and the resulting array's
 * `.length`, so the document payload can be minimal.
 */
function makeHabitsSnapshot(count: number) {
  const now = new Date();
  const docs = Array.from({ length: count }, (_, i) => ({
    id: `habit-${i}`,
    data: () => ({
      userId: TEST_USER_ID,
      name: `Habit ${i}`,
      category: 'wellness',
      frequency: 'daily',
      isPublic: false,
      createdAt: { toDate: () => now },
      updatedAt: { toDate: () => now },
    }),
  }));
  return {
    forEach: (cb: (doc: (typeof docs)[number]) => void) => docs.forEach(cb),
    docs,
    size: docs.length,
  };
}

// ── Test setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Default: `addDoc` returns a stable doc reference so the post-creation
  // streak/achievement path doesn't throw. Tests asserting on creation also
  // rely on this returning a known id.
  (addDoc as jest.Mock).mockResolvedValue({ id: 'new-habit-id' });
});

// ── Limit enforcement: Free tier ────────────────────────────────────────────

describe('habitService.createHabit — Free tier limit enforcement', () => {
  it('throws HabitLimitError with isPro: false and limit: 6 when a free user already has 6 habits', async () => {
    (subscriptionService.getProStatus as jest.Mock).mockResolvedValue(false);
    (getDocs as jest.Mock).mockResolvedValue(makeHabitsSnapshot(6));

    await expect(
      habitService.createHabit(TEST_USER_ID, makeForm())
    ).rejects.toMatchObject({
      name: 'HabitLimitError',
      isPro: false,
      limit: LIMITS.MAX_HABITS_FREE,
    });

    // The thrown error should be the typed class so screens can branch on
    // `instanceof HabitLimitError`.
    await expect(
      habitService.createHabit(TEST_USER_ID, makeForm())
    ).rejects.toBeInstanceOf(HabitLimitError);

    // No write should occur once the limit is hit.
    expect(addDoc).not.toHaveBeenCalled();
  });

  it('creates the habit when a free user has 5 habits', async () => {
    (subscriptionService.getProStatus as jest.Mock).mockResolvedValue(false);
    // First `getUserHabits` call returns 5 (the limit check); the second call
    // (for the habit-collector achievement) reads the post-write count.
    (getDocs as jest.Mock)
      .mockResolvedValueOnce(makeHabitsSnapshot(5))
      .mockResolvedValueOnce(makeHabitsSnapshot(6));

    const habitId = await habitService.createHabit(TEST_USER_ID, makeForm());

    expect(habitId).toBe('new-habit-id');
    expect(addDoc).toHaveBeenCalledTimes(1);
  });
});

// ── Limit enforcement: Pro tier ─────────────────────────────────────────────

describe('habitService.createHabit — Pro tier limit enforcement', () => {
  it('throws HabitLimitError with isPro: true and limit: 15 when a Pro user already has 15 habits', async () => {
    (subscriptionService.getProStatus as jest.Mock).mockResolvedValue(true);
    (getDocs as jest.Mock).mockResolvedValue(makeHabitsSnapshot(15));

    await expect(
      habitService.createHabit(TEST_USER_ID, makeForm())
    ).rejects.toMatchObject({
      name: 'HabitLimitError',
      isPro: true,
      limit: LIMITS.MAX_HABITS_PRO,
    });

    await expect(
      habitService.createHabit(TEST_USER_ID, makeForm())
    ).rejects.toBeInstanceOf(HabitLimitError);

    expect(addDoc).not.toHaveBeenCalled();
  });

  it('creates the habit when a Pro user has 14 habits', async () => {
    (subscriptionService.getProStatus as jest.Mock).mockResolvedValue(true);
    (getDocs as jest.Mock)
      .mockResolvedValueOnce(makeHabitsSnapshot(14))
      .mockResolvedValueOnce(makeHabitsSnapshot(15));

    const habitId = await habitService.createHabit(TEST_USER_ID, makeForm());

    expect(habitId).toBe('new-habit-id');
    expect(addDoc).toHaveBeenCalledTimes(1);
  });
});
