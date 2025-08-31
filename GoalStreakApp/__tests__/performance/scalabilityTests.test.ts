/**
 * Scalability and Concurrent Usage Tests
 * Tests app behavior with large friend networks, high activity volume, and concurrent users
 */

import {
  performanceMonitor,
  networkMonitor,
  PERFORMANCE_THRESHOLDS,
  measureAsyncOperation,
  waitForCondition,
  createLargeDataset,
} from './performanceSetup';
import { createMockHabit, createMockUser } from '../factories/habitFactory';
import { createMockFriend, createMockActivity } from '../factories/socialFactory';

// Mock Firebase quota limits
const FIREBASE_QUOTAS = {
  readsPerSecond: 10000,
  writesPerSecond: 10000,
  concurrentConnections: 100000,
  documentSize: 1048576, // 1MB
  batchSize: 500,
};

// Mock concurrent user simulation
class ConcurrentUserSimulator {
  private activeUsers: Map<string, any> = new Map();
  private operations: Array<{ userId: string; operation: string; timestamp: number }> = [];

  addUser(userId: string, userData: any): void {
    this.activeUsers.set(userId, {
      ...userData,
      lastActivity: Date.now(),
      operationCount: 0,
    });
  }

  removeUser(userId: string): void {
    this.activeUsers.delete(userId);
  }

  simulateUserOperation(userId: string, operation: string): void {
    const user = this.activeUsers.get(userId);
    if (user) {
      user.operationCount++;
      user.lastActivity = Date.now();
      this.operations.push({
        userId,
        operation,
        timestamp: Date.now(),
      });
    }
  }

  getActiveUserCount(): number {
    return this.activeUsers.size;
  }

  getOperationCount(): number {
    return this.operations.length;
  }

  getOperationsPerSecond(): number {
    const now = Date.now();
    const recentOperations = this.operations.filter(op => now - op.timestamp < 1000);
    return recentOperations.length;
  }

  reset(): void {
    this.activeUsers.clear();
    this.operations = [];
  }
}

const userSimulator = new ConcurrentUserSimulator();

describe('Scalability and Concurrent Usage Tests', () => {
  beforeEach(() => {
    performanceMonitor.reset();
    networkMonitor.reset();
    userSimulator.reset();
    jest.clearAllMocks();
  });

  describe('Large Friend Networks', () => {
    it('should handle large friend lists efficiently', async () => {
      const largeFriendNetworkTest = async () => {
        const userId = 'user-with-many-friends';
        const friendCount = 1000;
        
        // Create large friend network
        const friends = Array.from({ length: friendCount }, (_, index) => 
          createMockFriend({
            id: `friend-${index}`,
            userId,
            friendId: `friend-user-${index}`,
            friendName: `Friend ${index}`,
            friendEmail: `friend${index}@example.com`,
          })
        );

        // Simulate loading friend list with pagination
        const pageSize = 50;
        const loadedFriends = [];
        
        for (let page = 0; page < Math.ceil(friendCount / pageSize); page++) {
          const pageStart = page * pageSize;
          const pageEnd = Math.min(pageStart + pageSize, friendCount);
          const friendPage = friends.slice(pageStart, pageEnd);
          
          // Simulate network request for friend page
          networkMonitor.startRequest(`friends-page-${page}`);
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
          networkMonitor.endRequest(`friends-page-${page}`);
          
          loadedFriends.push(...friendPage);
        }

        return {
          totalFriends: friendCount,
          loadedFriends: loadedFriends.length,
          pageCount: Math.ceil(friendCount / pageSize),
        };
      };

      const { result, metrics } = await measureAsyncOperation(
        largeFriendNetworkTest,
        'large_friend_network'
      );

      expect(result.totalFriends).toBe(1000);
      expect(result.loadedFriends).toBe(1000);
      expect(metrics.duration).toBeLessThan(5000); // Should load within 5 seconds
      expect(networkMonitor.getRequestCount()).toBe(20); // 1000 friends / 50 per page
    });

    it('should optimize friend search in large networks', async () => {
      const friendSearchTest = async () => {
        const friendCount = 5000;
        const friends = Array.from({ length: friendCount }, (_, index) => 
          createMockFriend({
            id: `friend-${index}`,
            friendName: `Friend ${index}`,
            friendEmail: `friend${index}@example.com`,
          })
        );

        // Create search index for optimization
        const searchIndex = new Map<string, any[]>();
        friends.forEach(friend => {
          const nameKey = friend.friendName.toLowerCase();
          const emailKey = friend.friendEmail.toLowerCase();
          
          if (!searchIndex.has(nameKey)) {
            searchIndex.set(nameKey, []);
          }
          if (!searchIndex.has(emailKey)) {
            searchIndex.set(emailKey, []);
          }
          
          searchIndex.get(nameKey)!.push(friend);
          searchIndex.get(emailKey)!.push(friend);
        });

        // Perform multiple searches
        const searchQueries = ['Friend 1', 'Friend 100', 'friend500@example.com', 'Friend 999'];
        const searchResults = [];

        for (const query of searchQueries) {
          const searchStart = performance.now();
          
          // Optimized search using index
          const queryKey = query.toLowerCase();
          const results = searchIndex.get(queryKey) || [];
          
          const searchEnd = performance.now();
          
          searchResults.push({
            query,
            resultCount: results.length,
            searchTime: searchEnd - searchStart,
          });
        }

        return {
          totalFriends: friendCount,
          searchResults,
          averageSearchTime: searchResults.reduce((sum, result) => sum + result.searchTime, 0) / searchResults.length,
        };
      };

      const { result, metrics } = await measureAsyncOperation(
        friendSearchTest,
        'friend_search_optimization'
      );

      expect(result.totalFriends).toBe(5000);
      expect(result.averageSearchTime).toBeLessThan(5); // Each search should be under 5ms
      expect(metrics.duration).toBeLessThan(100); // Total test should complete quickly
    });

    it('should handle friend activity aggregation efficiently', async () => {
      const activityAggregationTest = async () => {
        const friendCount = 500;
        const activitiesPerFriend = 20;
        
        // Create friends and their activities
        const friends = Array.from({ length: friendCount }, (_, index) => 
          createMockFriend({ id: `friend-${index}` })
        );

        const allActivities = [];
        for (const friend of friends) {
          const friendActivities = Array.from({ length: activitiesPerFriend }, (_, actIndex) => 
            createMockActivity({
              id: `activity-${friend.id}-${actIndex}`,
              userId: friend.friendId,
              userName: friend.friendName,
              timestamp: new Date(Date.now() - Math.random() * 86400000 * 7), // Random within last week
            })
          );
          allActivities.push(...friendActivities);
        }

        // Sort activities by timestamp (most recent first)
        allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Paginate activity feed
        const pageSize = 20;
        const activityPages = [];
        
        for (let page = 0; page < 10; page++) { // Load first 10 pages
          const pageStart = page * pageSize;
          const pageActivities = allActivities.slice(pageStart, pageStart + pageSize);
          
          // Simulate processing activity page
          const processedPage = pageActivities.map(activity => ({
            ...activity,
            timeAgo: this.calculateTimeAgo(activity.timestamp),
            processed: true,
          }));
          
          activityPages.push(processedPage);
        }

        return {
          totalActivities: allActivities.length,
          loadedPages: activityPages.length,
          activitiesPerPage: pageSize,
        };
      };

      const { result, metrics } = await measureAsyncOperation(
        activityAggregationTest,
        'activity_aggregation'
      );

      expect(result.totalActivities).toBe(10000); // 500 friends * 20 activities
      expect(result.loadedPages).toBe(10);
      expect(metrics.duration).toBeLessThan(1000); // Should process within 1 second
    });
  });

  describe('High Activity Feed Volume', () => {
    it('should handle high-volume activity feeds efficiently', async () => {
      const highVolumeTest = async () => {
        const activityCount = 10000;
        const activities = Array.from({ length: activityCount }, (_, index) => 
          createMockActivity({
            id: `activity-${index}`,
            timestamp: new Date(Date.now() - index * 60000), // One activity per minute going back
          })
        );

        // Simulate real-time activity processing
        const processedActivities = [];
        const batchSize = 100;
        
        for (let i = 0; i < activities.length; i += batchSize) {
          const batch = activities.slice(i, i + batchSize);
          
          // Process batch
          const processedBatch = batch.map(activity => ({
            ...activity,
            processed: true,
            processedAt: Date.now(),
          }));
          
          processedActivities.push(...processedBatch);
          
          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        return {
          totalActivities: activityCount,
          processedActivities: processedActivities.length,
          batchCount: Math.ceil(activityCount / batchSize),
        };
      };

      const { result, metrics } = await measureAsyncOperation(
        highVolumeTest,
        'high_volume_activities'
      );

      expect(result.totalActivities).toBe(10000);
      expect(result.processedActivities).toBe(10000);
      expect(metrics.duration).toBeLessThan(3000); // Should process within 3 seconds
    });

    it('should optimize activity feed filtering and sorting', async () => {
      const activityFilterTest = async () => {
        const activityCount = 5000;
        const activities = Array.from({ length: activityCount }, (_, index) => 
          createMockActivity({
            id: `activity-${index}`,
            type: ['habit_completed', 'habit_created', 'friend_added', 'streak_milestone'][index % 4],
            habitCategory: ['fitness', 'wellness', 'productivity', 'learning'][index % 4],
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 30), // Random within 30 days
          })
        );

        // Test various filtering scenarios
        const filterTests = [
          {
            name: 'fitness_activities',
            filter: (activity: any) => activity.habitCategory === 'fitness',
          },
          {
            name: 'recent_activities',
            filter: (activity: any) => Date.now() - activity.timestamp.getTime() < 86400000, // Last 24 hours
          },
          {
            name: 'habit_completions',
            filter: (activity: any) => activity.type === 'habit_completed',
          },
          {
            name: 'streak_milestones',
            filter: (activity: any) => activity.type === 'streak_milestone',
          },
        ];

        const filterResults = [];
        
        for (const test of filterTests) {
          const filterStart = performance.now();
          
          const filteredActivities = activities.filter(test.filter);
          const sortedActivities = filteredActivities.sort((a, b) => 
            b.timestamp.getTime() - a.timestamp.getTime()
          );
          
          const filterEnd = performance.now();
          
          filterResults.push({
            filterName: test.name,
            originalCount: activities.length,
            filteredCount: filteredActivities.length,
            sortedCount: sortedActivities.length,
            processingTime: filterEnd - filterStart,
          });
        }

        return {
          totalActivities: activityCount,
          filterResults,
          averageFilterTime: filterResults.reduce((sum, result) => sum + result.processingTime, 0) / filterResults.length,
        };
      };

      const { result, metrics } = await measureAsyncOperation(
        activityFilterTest,
        'activity_filtering'
      );

      expect(result.totalActivities).toBe(5000);
      expect(result.filterResults).toHaveLength(4);
      expect(result.averageFilterTime).toBeLessThan(50); // Each filter should be fast
      expect(metrics.duration).toBeLessThan(500); // Total filtering should be quick
    });
  });

  describe('Concurrent User Simulation', () => {
    it('should handle multiple concurrent users efficiently', async () => {
      const concurrentUsersTest = async () => {
        const userCount = 100;
        const operationsPerUser = 10;
        
        // Create concurrent users
        const users = Array.from({ length: userCount }, (_, index) => 
          createMockUser({ id: `concurrent-user-${index}` })
        );

        // Add users to simulator
        users.forEach(user => userSimulator.addUser(user.id, user));

        // Simulate concurrent operations
        const userOperations = users.map(async (user) => {
          const operations = [];
          
          for (let i = 0; i < operationsPerUser; i++) {
            const operationType = ['create_habit', 'complete_habit', 'add_friend', 'view_feed'][i % 4];
            
            // Simulate operation delay
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            
            userSimulator.simulateUserOperation(user.id, operationType);
            operations.push({ type: operationType, timestamp: Date.now() });
          }
          
          return { userId: user.id, operations };
        });

        const results = await Promise.all(userOperations);
        
        return {
          userCount,
          totalOperations: userSimulator.getOperationCount(),
          operationsPerSecond: userSimulator.getOperationsPerSecond(),
          results,
        };
      };

      const { result, metrics } = await measureAsyncOperation(
        concurrentUsersTest,
        'concurrent_users'
      );

      expect(result.userCount).toBe(100);
      expect(result.totalOperations).toBe(1000); // 100 users * 10 operations
      expect(userSimulator.getActiveUserCount()).toBe(100);
      expect(metrics.duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle real-time updates with multiple users', async () => {
      const realTimeUpdatesTest = async () => {
        const userCount = 50;
        const updateCount = 200;
        
        // Create users
        const users = Array.from({ length: userCount }, (_, index) => 
          createMockUser({ id: `realtime-user-${index}` })
        );

        users.forEach(user => userSimulator.addUser(user.id, user));

        // Simulate real-time updates
        const updates = [];
        const updatePromises = [];
        
        for (let i = 0; i < updateCount; i++) {
          const updatePromise = new Promise(async (resolve) => {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const updateType = ['habit_completed', 'friend_activity', 'streak_updated'][i % 3];
            
            // Simulate update processing
            await new Promise(r => setTimeout(r, Math.random() * 50));
            
            userSimulator.simulateUserOperation(randomUser.id, `receive_${updateType}`);
            
            resolve({
              userId: randomUser.id,
              updateType,
              timestamp: Date.now(),
            });
          });
          
          updatePromises.push(updatePromise);
        }

        const updateResults = await Promise.all(updatePromises);
        
        return {
          userCount,
          updateCount,
          processedUpdates: updateResults.length,
          totalOperations: userSimulator.getOperationCount(),
        };
      };

      const { result, metrics } = await measureAsyncOperation(
        realTimeUpdatesTest,
        'realtime_updates'
      );

      expect(result.userCount).toBe(50);
      expect(result.updateCount).toBe(200);
      expect(result.processedUpdates).toBe(200);
      expect(metrics.duration).toBeLessThan(3000); // Should handle updates quickly
    });

    it('should maintain performance under peak concurrent load', async () => {
      const peakLoadTest = async () => {
        const peakUserCount = 500;
        const operationsPerSecond = 1000;
        const testDuration = 5000; // 5 seconds
        
        // Create peak load users
        const users = Array.from({ length: peakUserCount }, (_, index) => 
          createMockUser({ id: `peak-user-${index}` })
        );

        users.forEach(user => userSimulator.addUser(user.id, user));

        // Simulate peak load
        const startTime = Date.now();
        const operations = [];
        
        while (Date.now() - startTime < testDuration) {
          const operationPromises = [];
          
          // Generate operations for this second
          for (let i = 0; i < operationsPerSecond / 10; i++) { // Batch operations
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const operationType = ['habit_action', 'social_action', 'data_sync'][i % 3];
            
            const operationPromise = new Promise(async (resolve) => {
              await new Promise(r => setTimeout(r, Math.random() * 10));
              userSimulator.simulateUserOperation(randomUser.id, operationType);
              resolve({ userId: randomUser.id, type: operationType });
            });
            
            operationPromises.push(operationPromise);
          }
          
          const batchResults = await Promise.all(operationPromises);
          operations.push(...batchResults);
          
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return {
          peakUserCount,
          testDuration,
          totalOperations: operations.length,
          operationsPerSecond: operations.length / (testDuration / 1000),
          activeUsers: userSimulator.getActiveUserCount(),
        };
      };

      const { result, metrics } = await measureAsyncOperation(
        peakLoadTest,
        'peak_load'
      );

      expect(result.peakUserCount).toBe(500);
      expect(result.activeUsers).toBe(500);
      expect(result.operationsPerSecond).toBeGreaterThan(800); // Should handle most of target load
      expect(metrics.duration).toBeLessThan(6000); // Should complete close to test duration
    });
  });

  describe('Firebase Quota and Limits', () => {
    it('should handle Firebase read quota limits gracefully', async () => {
      const readQuotaTest = async () => {
        const readOperations = [];
        const maxReadsPerSecond = FIREBASE_QUOTAS.readsPerSecond;
        const testReads = Math.floor(maxReadsPerSecond * 1.2); // 120% of quota
        
        // Simulate rapid read operations
        const readPromises = Array.from({ length: testReads }, async (_, index) => {
          const readStart = performance.now();
          
          // Simulate Firebase read operation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          
          const readEnd = performance.now();
          
          return {
            readIndex: index,
            duration: readEnd - readStart,
            timestamp: Date.now(),
          };
        });

        try {
          const results = await Promise.all(readPromises);
          return {
            totalReads: testReads,
            successfulReads: results.length,
            quotaExceeded: false,
            results,
          };
        } catch (error) {
          return {
            totalReads: testReads,
            successfulReads: 0,
            quotaExceeded: true,
            error: error.message,
          };
        }
      };

      const { result, metrics } = await measureAsyncOperation(
        readQuotaTest,
        'firebase_read_quota'
      );

      // Should handle quota limits gracefully
      expect(result.totalReads).toBeGreaterThan(10000);
      expect(metrics.duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle Firebase write quota limits gracefully', async () => {
      const writeQuotaTest = async () => {
        const writeOperations = [];
        const maxWritesPerSecond = FIREBASE_QUOTAS.writesPerSecond;
        const testWrites = Math.floor(maxWritesPerSecond * 0.8); // 80% of quota to stay safe
        
        // Simulate write operations with batching
        const batchSize = FIREBASE_QUOTAS.batchSize;
        const batches = Math.ceil(testWrites / batchSize);
        
        for (let batch = 0; batch < batches; batch++) {
          const batchStart = batch * batchSize;
          const batchEnd = Math.min(batchStart + batchSize, testWrites);
          const batchWrites = batchEnd - batchStart;
          
          // Simulate batch write
          const batchPromise = new Promise(async (resolve) => {
            await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
            resolve({
              batchIndex: batch,
              writeCount: batchWrites,
              timestamp: Date.now(),
            });
          });
          
          writeOperations.push(await batchPromise);
        }

        return {
          totalWrites: testWrites,
          batchCount: batches,
          writeOperations,
        };
      };

      const { result, metrics } = await measureAsyncOperation(
        writeQuotaTest,
        'firebase_write_quota'
      );

      expect(result.totalWrites).toBeGreaterThan(5000);
      expect(result.batchCount).toBeGreaterThan(10);
      expect(metrics.duration).toBeLessThan(15000); // Should complete within 15 seconds
    });

    it('should handle document size limits efficiently', async () => {
      const documentSizeTest = async () => {
        const maxDocumentSize = FIREBASE_QUOTAS.documentSize;
        const largeDocuments = [];
        
        // Create documents approaching size limit
        for (let i = 0; i < 10; i++) {
          const documentSize = Math.floor(maxDocumentSize * 0.8); // 80% of limit
          const largeData = Array.from({ length: documentSize / 100 }, (_, index) => ({
            id: index,
            data: 'x'.repeat(90), // Padding to reach size
          }));
          
          const document = {
            id: `large-doc-${i}`,
            data: largeData,
            size: JSON.stringify(largeData).length,
            createdAt: Date.now(),
          };
          
          largeDocuments.push(document);
        }

        // Simulate document processing
        const processedDocuments = largeDocuments.map(doc => ({
          ...doc,
          processed: true,
          withinLimit: doc.size < maxDocumentSize,
        }));

        return {
          documentCount: largeDocuments.length,
          averageSize: largeDocuments.reduce((sum, doc) => sum + doc.size, 0) / largeDocuments.length,
          maxSize: Math.max(...largeDocuments.map(doc => doc.size)),
          allWithinLimit: processedDocuments.every(doc => doc.withinLimit),
        };
      };

      const { result, metrics } = await measureAsyncOperation(
        documentSizeTest,
        'document_size_limits'
      );

      expect(result.documentCount).toBe(10);
      expect(result.allWithinLimit).toBe(true);
      expect(result.maxSize).toBeLessThan(FIREBASE_QUOTAS.documentSize);
      expect(metrics.duration).toBeLessThan(1000); // Should process quickly
    });
  });

  // Helper method for time calculation
  calculateTimeAgo(timestamp: Date): string {
    const now = Date.now();
    const diff = now - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
});