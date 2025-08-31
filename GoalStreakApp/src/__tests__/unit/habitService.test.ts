// Mock Firebase functions before importing anything else
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockOnSnapshot = jest.fn();
const mockWriteBatch = jest.fn();

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  getDocs: mockGetDocs,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  onSnapshot: mockOnSnapshot,
  writeBatch: mockWriteBatch,
  Timestamp: {
    now: () => ({ toDate: () => new Date() })
  }
}));

// Mock Firebase service
jest.mock('../../services/firebase', () => ({
  db: 'mock-db',
  auth: { currentUser: { uid: 'test-user-123' } }
}));

// Mock retry service
jest.mock('../../services/retryService', () => ({
  withRetry: jest.fn((fn) => fn()),
  RETRY_CONFIGS: {
    habitCreation: { maxAttempts: 3, delay: 1000 }
  }
}));

import { habitService, completionService, streakService } from '../../services/habitService';
import { createMockHabit, createMockCreateHabitForm } from '../factories/habitFactory';
import { Habit, CreateHabitForm } from '../../types';

describe('habitService', () => {
  const testUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockCollection.mockReturnValue('mock-collection-ref');
    mockDoc.mockReturnValue({
      id: 'mock-doc-id',
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ id: 'mock-doc-id' }),
        id: 'mock-doc-id'
      })
    });
    
    mockAddDoc.mockResolvedValue({ id: 'new-habit-id' });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);
    
    mockGetDocs.mockResolvedValue({
      docs: [],
      forEach: jest.fn()
    });
    
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => null,
      id: 'mock-doc-id'
    });
    
    mockQuery.mockReturnValue('mock-query');
    mockWhere.mockReturnValue('mock-where-query');
    mockOrderBy.mockReturnValue('mock-orderby-query');
    mockOnSnapshot.mockReturnValue(() => {});
    
    mockWriteBatch.mockReturnValue({
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined)
    });
  });

  describe('createHabit', () => {
    it('should create a habit with valid data', async () => {
      const habitData = createMockCreateHabitForm({
        name: 'Morning Workout',
        category: 'fitness',
        frequency: 'daily',
        isPublic: false
      });

      const habitId = await habitService.createHabit(testUserId, habitData);

      expect(habitId).toBe('new-habit-id');
      expect(mockCollection).toHaveBeenCalledWith('mock-db', 'habits');
      expect(mockAddDoc).toHaveBeenCalled();
      
      // Verify habit data structure
      const addedData = mockAddDoc.mock.calls[0][1];
      expect(addedData.userId).toBe(testUserId);
      expect(addedData.name).toBe('Morning Workout');
      expect(addedData.category).toBe('fitness');
      expect(addedData.frequency).toBe('daily');
      expect(addedData.isPublic).toBe(false);
      expect(addedData.createdAt).toBeInstanceOf(Date);
      expect(addedData.updatedAt).toBeInstanceOf(Date);
    });

    it('should create habit with optional fields', async () => {
      const habitData = createMockCreateHabitForm({
        name: 'Read Books',
        category: 'learning',
        frequency: 'weekly',
        targetValue: 3,
        unit: 'books',
        icon: 'book-outline',
        isPublic: true
      });

      await habitService.createHabit(testUserId, habitData);

      const addedData = mockAddDoc.mock.calls[0][1];
      expect(addedData.targetValue).toBe(3);
      expect(addedData.unit).toBe('books');
      expect(addedData.icon).toBe('book-outline');
      expect(addedData.isPublic).toBe(true);
    });

    it('should trim whitespace from habit name', async () => {
      const habitData = createMockCreateHabitForm({
        name: '  Morning Meditation  ',
        category: 'meditation'
      });

      await habitService.createHabit(testUserId, habitData);

      const addedData = mockAddDoc.mock.calls[0][1];
      expect(addedData.name).toBe('Morning Meditation');
    });

    it('should handle undefined optional fields correctly', async () => {
      const habitData = createMockCreateHabitForm({
        name: 'Simple Habit',
        category: 'other',
        targetValue: undefined,
        unit: undefined,
        icon: undefined
      });

      await habitService.createHabit(testUserId, habitData);

      const addedData = mockAddDoc.mock.calls[0][1];
      expect(addedData.targetValue).toBeUndefined();
      expect(addedData.unit).toBeUndefined();
      expect(addedData.icon).toBeUndefined();
    });

    it('should initialize streak after creating habit', async () => {
      const habitData = createMockCreateHabitForm();

      await habitService.createHabit(testUserId, habitData);

      // Verify streak initialization was called
      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'streaks', 'new-habit-id');
      expect(mockSetDoc).toHaveBeenCalled();
      
      const streakData = mockSetDoc.mock.calls[0][1];
      expect(streakData.habitId).toBe('new-habit-id');
      expect(streakData.currentStreak).toBe(0);
      expect(streakData.longestStreak).toBe(0);
      expect(streakData.lastCompletedDate).toBeNull();
    });

    it('should handle creation errors', async () => {
      const habitData = createMockCreateHabitForm();
      mockAddDoc.mockRejectedValue(new Error('Creation failed'));

      await expect(habitService.createHabit(testUserId, habitData))
        .rejects.toThrow('Creation failed');
    });
  });

  describe('getUserHabits', () => {
    it('should return user habits sorted by creation date', async () => {
      const mockHabits = [
        {
          id: 'habit-1',
          userId: testUserId,
          name: 'Habit 1',
          createdAt: { toDate: () => new Date('2025-01-01') },
          updatedAt: { toDate: () => new Date('2025-01-01') }
        },
        {
          id: 'habit-2',
          userId: testUserId,
          name: 'Habit 2',
          createdAt: { toDate: () => new Date('2025-01-02') },
          updatedAt: { toDate: () => new Date('2025-01-02') }
        }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockHabits.map(habit => ({
          id: habit.id,
          data: () => habit
        })),
        forEach: jest.fn()
      });

      const habits = await habitService.getUserHabits(testUserId);

      expect(habits).toHaveLength(2);
      expect(habits[0].name).toBe('Habit 2'); // Newer first
      expect(habits[1].name).toBe('Habit 1');
      expect(mockCollection).toHaveBeenCalledWith('mock-db', 'habits');
      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', testUserId);
    });

    it('should return empty array when user has no habits', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        forEach: jest.fn()
      });

      const habits = await habitService.getUserHabits(testUserId);

      expect(habits).toEqual([]);
    });

    it('should handle Firebase errors gracefully', async () => {
      mockGetDocs.mockRejectedValue(new Error('Network error'));

      await expect(habitService.getUserHabits(testUserId))
        .rejects.toThrow('Failed to fetch habits');
    });
  });

  describe('updateHabit', () => {
    it('should update habit with valid data', async () => {
      const habitId = 'test-habit-id';
      const updates = {
        name: 'Updated Habit Name',
        isPublic: true
      };

      await habitService.updateHabit(habitId, updates);

      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'habits', habitId);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updates,
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should handle update errors', async () => {
      const habitId = 'test-habit-id';
      const updates = { name: 'Updated Name' };
      mockUpdateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(habitService.updateHabit(habitId, updates))
        .rejects.toThrow('Failed to update habit');
    });
  });

  describe('deleteHabit', () => {
    it('should delete habit and associated data using batch', async () => {
      const habitId = 'test-habit-id';
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      };
      mockWriteBatch.mockReturnValue(mockBatch);

      // Mock completions query
      mockGetDocs.mockResolvedValue({
        docs: [
          { ref: 'completion-ref-1' },
          { ref: 'completion-ref-2' }
        ],
        forEach: jest.fn()
      });

      await habitService.deleteHabit(habitId);

      expect(mockWriteBatch).toHaveBeenCalledWith('mock-db');
      expect(mockBatch.delete).toHaveBeenCalledTimes(4); // habit + 2 completions + streak
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      const habitId = 'test-habit-id';
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockRejectedValue(new Error('Delete failed'))
      };
      mockWriteBatch.mockReturnValue(mockBatch);

      await expect(habitService.deleteHabit(habitId))
        .rejects.toThrow('Failed to delete habit');
    });
  });

  describe('subscribeToUserHabits', () => {
    it('should set up real-time subscription', () => {
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = habitService.subscribeToUserHabits(testUserId, callback);

      expect(mockCollection).toHaveBeenCalledWith('mock-db', 'habits');
      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', testUserId);
      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('initializeStreak', () => {
    it('should create initial streak data', async () => {
      const habitId = 'test-habit-id';

      await habitService.initializeStreak(habitId);

      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'streaks', habitId);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          habitId,
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null
        }
      );
    });

    it('should handle initialization errors', async () => {
      const habitId = 'test-habit-id';
      mockSetDoc.mockRejectedValue(new Error('Set failed'));

      await expect(habitService.initializeStreak(habitId))
        .rejects.toThrow('Set failed');
    });
  });

  describe('updateStreak', () => {
    it('should calculate and update streak correctly', async () => {
      const habitId = 'test-habit-id';
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Mock completions data
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            data: () => ({
              completedAt: { toDate: () => today }
            })
          }
        ],
        forEach: jest.fn()
      });

      await habitService.updateStreak(habitId);

      expect(mockCollection).toHaveBeenCalledWith('mock-db', 'completions');
      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('habitId', '==', habitId);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should handle streak calculation errors', async () => {
      const habitId = 'test-habit-id';
      mockGetDocs.mockRejectedValue(new Error('Query failed'));

      await expect(habitService.updateStreak(habitId))
        .rejects.toThrow('Failed to update streak');
    });
  });

  describe('clearAllHabits', () => {
    it('should delete all user habits', async () => {
      const mockHabits = [
        { id: 'habit-1', name: 'Habit 1' },
        { id: 'habit-2', name: 'Habit 2' }
      ];

      // Mock getUserHabits
      jest.spyOn(habitService, 'getUserHabits').mockResolvedValue(mockHabits as Habit[]);
      
      // Mock deleteHabit
      const deleteHabitSpy = jest.spyOn(habitService, 'deleteHabit').mockResolvedValue();

      await habitService.clearAllHabits(testUserId);

      expect(deleteHabitSpy).toHaveBeenCalledTimes(2);
      expect(deleteHabitSpy).toHaveBeenCalledWith('habit-1');
      expect(deleteHabitSpy).toHaveBeenCalledWith('habit-2');

      deleteHabitSpy.mockRestore();
    });

    it('should handle errors during clearing', async () => {
      jest.spyOn(habitService, 'getUserHabits').mockRejectedValue(new Error('Fetch failed'));

      await expect(habitService.clearAllHabits(testUserId))
        .rejects.toThrow('Failed to clear all habits');
    });
  });
});

describe('completionService', () => {
  const testUserId = 'test-user-123';
  const testHabitId = 'test-habit-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockCollection.mockReturnValue('mock-collection-ref');
    mockAddDoc.mockResolvedValue({ id: 'new-completion-id' });
    mockDeleteDoc.mockResolvedValue(undefined);
    
    mockGetDocs.mockResolvedValue({
      docs: [],
      forEach: jest.fn()
    });
    
    // Mock updateStreak
    jest.spyOn(habitService, 'updateStreak').mockResolvedValue();
  });

  describe('completeHabit', () => {
    it('should complete habit successfully', async () => {
      // Mock getTodayCompletion to return null (no existing completion)
      jest.spyOn(completionService, 'getTodayCompletion').mockResolvedValue(null);

      await completionService.completeHabit(testHabitId, testUserId);

      expect(mockCollection).toHaveBeenCalledWith('mock-db', 'completions');
      expect(mockAddDoc).toHaveBeenCalled();
      
      const completionData = mockAddDoc.mock.calls[0][1];
      expect(completionData.habitId).toBe(testHabitId);
      expect(completionData.userId).toBe(testUserId);
      expect(completionData.completedAt).toBeInstanceOf(Date);
    });

    it('should complete habit with value and notes', async () => {
      jest.spyOn(completionService, 'getTodayCompletion').mockResolvedValue(null);
      
      const value = 5;
      const notes = 'Great workout today!';

      await completionService.completeHabit(testHabitId, testUserId, value, notes);

      const completionData = mockAddDoc.mock.calls[0][1];
      expect(completionData.value).toBe(value);
      expect(completionData.notes).toBe(notes);
    });

    it('should not include undefined optional fields', async () => {
      jest.spyOn(completionService, 'getTodayCompletion').mockResolvedValue(null);

      await completionService.completeHabit(testHabitId, testUserId, undefined, undefined);

      const completionData = mockAddDoc.mock.calls[0][1];
      expect(completionData).not.toHaveProperty('value');
      expect(completionData).not.toHaveProperty('notes');
    });

    it('should trim notes whitespace', async () => {
      jest.spyOn(completionService, 'getTodayCompletion').mockResolvedValue(null);
      
      const notes = '  Great workout!  ';

      await completionService.completeHabit(testHabitId, testUserId, undefined, notes);

      const completionData = mockAddDoc.mock.calls[0][1];
      expect(completionData.notes).toBe('Great workout!');
    });

    it('should not include empty notes', async () => {
      jest.spyOn(completionService, 'getTodayCompletion').mockResolvedValue(null);

      await completionService.completeHabit(testHabitId, testUserId, undefined, '   ');

      const completionData = mockAddDoc.mock.calls[0][1];
      expect(completionData).not.toHaveProperty('notes');
    });

    it('should throw error if habit already completed today', async () => {
      // Mock existing completion
      jest.spyOn(completionService, 'getTodayCompletion').mockResolvedValue({
        id: 'existing-completion',
        habitId: testHabitId,
        userId: testUserId,
        completedAt: new Date()
      });

      await expect(completionService.completeHabit(testHabitId, testUserId))
        .rejects.toThrow('Habit already completed today');
    });

    it('should update streak after completion', async () => {
      jest.spyOn(completionService, 'getTodayCompletion').mockResolvedValue(null);
      const updateStreakSpy = jest.spyOn(habitService, 'updateStreak');

      await completionService.completeHabit(testHabitId, testUserId);

      expect(updateStreakSpy).toHaveBeenCalledWith(testHabitId);
    });

    it('should handle completion errors', async () => {
      jest.spyOn(completionService, 'getTodayCompletion').mockResolvedValue(null);
      mockAddDoc.mockRejectedValue(new Error('Add failed'));

      await expect(completionService.completeHabit(testHabitId, testUserId))
        .rejects.toThrow('Add failed');
    });
  });

  describe('uncompleteHabit', () => {
    it('should uncomplete habit successfully', async () => {
      const mockCompletion = {
        id: 'completion-id',
        habitId: testHabitId,
        userId: testUserId,
        completedAt: new Date()
      };
      
      jest.spyOn(completionService, 'getTodayCompletion').mockResolvedValue(mockCompletion);

      await completionService.uncompleteHabit(testHabitId, testUserId);

      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'completions', 'completion-id');
      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should handle no completion gracefully', async () => {
      jest.spyOn(completionService, 'getTodayCompletion').mockResolvedValue(null);

      await expect(completionService.uncompleteHabit(testHabitId, testUserId))
        .resolves.not.toThrow();
    });

    it('should update streak after uncompletion', async () => {
      const mockCompletion = {
        id: 'completion-id',
        habitId: testHabitId,
        userId: testUserId,
        completedAt: new Date()
      };
      
      jest.spyOn(completionService, 'getTodayCompletion').mockResolvedValue(mockCompletion);
      const updateStreakSpy = jest.spyOn(habitService, 'updateStreak');

      await completionService.uncompleteHabit(testHabitId, testUserId);

      expect(updateStreakSpy).toHaveBeenCalledWith(testHabitId);
    });

    it('should handle uncompletion errors', async () => {
      const mockCompletion = {
        id: 'completion-id',
        habitId: testHabitId,
        userId: testUserId,
        completedAt: new Date()
      };
      
      jest.spyOn(completionService, 'getTodayCompletion').mockResolvedValue(mockCompletion);
      mockDeleteDoc.mockRejectedValue(new Error('Delete failed'));

      await expect(completionService.uncompleteHabit(testHabitId, testUserId))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('getTodayCompletion', () => {
    it('should return today\'s completion when it exists', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);
      
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'completion-id',
            data: () => ({
              habitId: testHabitId,
              userId: testUserId,
              completedAt: { toDate: () => today },
              value: 3,
              notes: 'Good job'
            })
          }
        ]
      });

      const completion = await completionService.getTodayCompletion(testHabitId, testUserId);

      expect(completion).toBeDefined();
      expect(completion?.id).toBe('completion-id');
      expect(completion?.habitId).toBe(testHabitId);
      expect(completion?.userId).toBe(testUserId);
      expect(completion?.value).toBe(3);
      expect(completion?.notes).toBe('Good job');
    });

    it('should return null when no completion today', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      const completion = await completionService.getTodayCompletion(testHabitId, testUserId);

      expect(completion).toBeNull();
    });

    it('should not return yesterday\'s completion', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(10, 0, 0, 0);

      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'completion-id',
            data: () => ({
              habitId: testHabitId,
              userId: testUserId,
              completedAt: { toDate: () => yesterday }
            })
          }
        ]
      });

      const completion = await completionService.getTodayCompletion(testHabitId, testUserId);

      expect(completion).toBeNull();
    });

    it('should handle query errors gracefully', async () => {
      mockGetDocs.mockRejectedValue(new Error('Query failed'));

      const completion = await completionService.getTodayCompletion(testHabitId, testUserId);

      expect(completion).toBeNull();
    });
  });

  describe('getHabitCompletions', () => {
    it('should return completions within date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-03');
      
      const completion1Date = new Date('2025-01-01T10:00:00Z');
      const completion2Date = new Date('2025-01-02T10:00:00Z');
      const completion3Date = new Date('2025-01-04T10:00:00Z'); // Outside range

      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'completion-1',
            data: () => ({
              habitId: testHabitId,
              userId: testUserId,
              completedAt: { toDate: () => completion1Date },
              value: 1
            })
          },
          {
            id: 'completion-2',
            data: () => ({
              habitId: testHabitId,
              userId: testUserId,
              completedAt: { toDate: () => completion2Date },
              value: 2
            })
          },
          {
            id: 'completion-3',
            data: () => ({
              habitId: testHabitId,
              userId: testUserId,
              completedAt: { toDate: () => completion3Date },
              value: 3
            })
          }
        ]
      });

      const completions = await completionService.getHabitCompletions(testHabitId, startDate, endDate);

      expect(completions).toHaveLength(2);
      expect(completions[0].value).toBe(2); // Sorted by date descending
      expect(completions[1].value).toBe(1);
    });

    it('should return empty array when no completions in range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-03');
      
      mockGetDocs.mockResolvedValue({ docs: [] });

      const completions = await completionService.getHabitCompletions(testHabitId, startDate, endDate);

      expect(completions).toEqual([]);
    });

    it('should handle query errors', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-03');
      
      mockGetDocs.mockRejectedValue(new Error('Query failed'));

      await expect(completionService.getHabitCompletions(testHabitId, startDate, endDate))
        .rejects.toThrow('Failed to fetch completions');
    });
  });
});

describe('streakService', () => {
  const testHabitId = 'test-habit-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStreak', () => {
    it('should return streak data when it exists', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          habitId: testHabitId,
          currentStreak: 5,
          longestStreak: 10,
          lastCompletedDate: { toDate: () => new Date('2025-01-01') }
        }),
        id: testHabitId
      });

      const streak = await streakService.getStreak(testHabitId);

      expect(streak).toBeDefined();
      expect(streak?.habitId).toBe(testHabitId);
      expect(streak?.currentStreak).toBe(5);
      expect(streak?.longestStreak).toBe(10);
      expect(streak?.lastCompletedDate).toBeInstanceOf(Date);
      expect(mockDoc).toHaveBeenCalledWith('mock-db', 'streaks', testHabitId);
    });

    it('should return null when streak does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
        id: testHabitId
      });

      const streak = await streakService.getStreak(testHabitId);

      expect(streak).toBeNull();
    });

    it('should handle null lastCompletedDate', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          habitId: testHabitId,
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null
        }),
        id: testHabitId
      });

      const streak = await streakService.getStreak(testHabitId);

      expect(streak).toBeDefined();
      expect(streak?.lastCompletedDate).toBeUndefined();
    });

    it('should handle query errors gracefully', async () => {
      mockGetDoc.mockRejectedValue(new Error('Get failed'));

      const streak = await streakService.getStreak(testHabitId);

      expect(streak).toBeNull();
    });
  });
});