import { User, Habit, HabitCompletion, Streak } from '../../types';
import { Friend, SocialActivity } from '../../types/social';

// Mock data store for realistic behavior
interface MockDataStore {
  users: Record<string, any>;
  habits: Record<string, any>;
  completions: Record<string, any>;
  streaks: Record<string, any>;
  friends: Record<string, any>;
  friendRequests: Record<string, any>;
  activities: Record<string, any>;
  userProfiles: Record<string, any>;
  socialSettings: Record<string, any>;
}

const mockDataStore: MockDataStore = {
  users: {},
  habits: {},
  completions: {},
  streaks: {},
  friends: {},
  friendRequests: {},
  activities: {},
  userProfiles: {},
  socialSettings: {}
};

// Helper functions for realistic mock behavior
const generateMockId = (): string => `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createMockTimestamp = (date?: Date): any => ({
  toDate: () => date || new Date(),
  seconds: Math.floor((date || new Date()).getTime() / 1000),
  nanoseconds: 0
});

// Mock user for authentication
let mockCurrentUser: any = null;

// Firebase Auth Mock with realistic behavior
export const mockAuth = {
  currentUser: mockCurrentUser,
  
  signInWithEmailAndPassword: jest.fn((email: string, password: string) => {
    if (email === 'test@example.com' && password === 'password123') {
      mockCurrentUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true
      };
      mockAuth.currentUser = mockCurrentUser;
      return Promise.resolve({ user: mockCurrentUser });
    }
    return Promise.reject(new Error('auth/invalid-credential'));
  }),
  
  createUserWithEmailAndPassword: jest.fn((email: string, password: string) => {
    const userId = generateMockId();
    mockCurrentUser = {
      uid: userId,
      email,
      displayName: null,
      emailVerified: false
    };
    mockAuth.currentUser = mockCurrentUser;
    
    // Store user in mock data store
    mockDataStore.users[userId] = {
      id: userId,
      email,
      displayName: email.split('@')[0],
      createdAt: createMockTimestamp(),
      updatedAt: createMockTimestamp()
    };
    
    return Promise.resolve({ user: mockCurrentUser });
  }),
  
  signOut: jest.fn(() => {
    mockCurrentUser = null;
    mockAuth.currentUser = null;
    return Promise.resolve();
  }),
  
  onAuthStateChanged: jest.fn((callback: (user: any) => void) => {
    // Simulate auth state change
    if (typeof callback === 'function') {
      setTimeout(() => callback(mockCurrentUser), 0);
    }
    return jest.fn(); // Unsubscribe function
  }),
  
  sendPasswordResetEmail: jest.fn((email: string) => {
    if (email.includes('@')) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('auth/invalid-email'));
  }),
  
  updateProfile: jest.fn((updates: any) => {
    if (mockCurrentUser) {
      Object.assign(mockCurrentUser, updates);
    }
    return Promise.resolve();
  })
};

// Mock document reference with realistic behavior
const createMockDocRef = (collection: string, id: string): any => ({
  id,
  path: `${collection}/${id}`,
  
  set: jest.fn((data: any, options?: any) => {
    const timestamp = createMockTimestamp();
    const docData = {
      ...data,
      id,
      createdAt: data.createdAt || timestamp,
      updatedAt: timestamp
    };
    
    if (options?.merge) {
      mockDataStore[collection as keyof MockDataStore][id] = {
        ...mockDataStore[collection as keyof MockDataStore][id],
        ...docData
      };
    } else {
      mockDataStore[collection as keyof MockDataStore][id] = docData;
    }
    
    return Promise.resolve();
  }),
  
  get: jest.fn(() => {
    const data = mockDataStore[collection as keyof MockDataStore][id];
    return Promise.resolve({
      exists: !!data,
      id,
      data: () => data || null,
      ref: createMockDocRef(collection, id)
    });
  }),
  
  update: jest.fn((updates: any) => {
    const existing = mockDataStore[collection as keyof MockDataStore][id];
    if (existing) {
      mockDataStore[collection as keyof MockDataStore][id] = {
        ...existing,
        ...updates,
        updatedAt: createMockTimestamp()
      };
    }
    return Promise.resolve();
  }),
  
  delete: jest.fn(() => {
    delete mockDataStore[collection as keyof MockDataStore][id];
    return Promise.resolve();
  }),
  
  onSnapshot: jest.fn((callback) => {
    const data = mockDataStore[collection as keyof MockDataStore][id];
    setTimeout(() => {
      callback({
        exists: !!data,
        id,
        data: () => data || null,
        ref: createMockDocRef(collection, id)
      });
    }, 0);
    return jest.fn(); // Unsubscribe function
  })
});

// Mock collection reference with realistic behavior
const createMockCollectionRef = (collectionName: string): any => ({
  path: collectionName,
  
  doc: jest.fn((id?: string) => {
    const docId = id || generateMockId();
    return createMockDocRef(collectionName, docId);
  }),
  
  add: jest.fn((data: any) => {
    const id = generateMockId();
    const docRef = createMockDocRef(collectionName, id);
    docRef.set(data);
    return Promise.resolve(docRef);
  }),
  
  where: jest.fn((field: string, operator: string, value: any) => {
    const query = createMockQuery(collectionName, [{ field, operator, value }]);
    return query;
  }),
  
  orderBy: jest.fn((field: string, direction?: 'asc' | 'desc') => {
    const query = createMockQuery(collectionName, [], [{ field, direction: direction || 'asc' }]);
    return query;
  }),
  
  limit: jest.fn((limitCount: number) => {
    const query = createMockQuery(collectionName, [], [], limitCount);
    return query;
  }),
  
  get: jest.fn(() => {
    const allDocs = Object.entries(mockDataStore[collectionName as keyof MockDataStore] || {});
    const docs = allDocs.map(([id, data]) => ({
      id,
      data: () => data,
      ref: createMockDocRef(collectionName, id)
    }));
    
    return Promise.resolve({
      docs,
      empty: docs.length === 0,
      size: docs.length,
      forEach: (callback: (doc: any) => void) => docs.forEach(callback)
    });
  }),
  
  onSnapshot: jest.fn((callback) => {
    const allDocs = Object.entries(mockDataStore[collectionName as keyof MockDataStore] || {});
    const docs = allDocs.map(([id, data]) => ({
      id,
      data: () => data,
      ref: createMockDocRef(collectionName, id)
    }));
    
    setTimeout(() => {
      callback({
        docs,
        empty: docs.length === 0,
        size: docs.length,
        forEach: (callback: (doc: any) => void) => docs.forEach(callback)
      });
    }, 0);
    
    return jest.fn(); // Unsubscribe function
  })
});

// Mock query with realistic filtering
const createMockQuery = (
  collectionName: string, 
  whereConditions: Array<{ field: string; operator: string; value: any }> = [],
  orderByConditions: Array<{ field: string; direction: 'asc' | 'desc' }> = [],
  limitCount?: number
): any => ({
  where: jest.fn((field: string, operator: string, value: any) => {
    return createMockQuery(collectionName, [...whereConditions, { field, operator, value }], orderByConditions, limitCount);
  }),
  
  orderBy: jest.fn((field: string, direction?: 'asc' | 'desc') => {
    return createMockQuery(collectionName, whereConditions, [...orderByConditions, { field, direction: direction || 'asc' }], limitCount);
  }),
  
  limit: jest.fn((count: number) => {
    return createMockQuery(collectionName, whereConditions, orderByConditions, count);
  }),
  
  get: jest.fn(() => {
    let allDocs = Object.entries(mockDataStore[collectionName as keyof MockDataStore] || {});
    
    // Apply where conditions
    whereConditions.forEach(({ field, operator, value }) => {
      allDocs = allDocs.filter(([id, data]) => {
        const fieldValue = (data as any)[field];
        switch (operator) {
          case '==':
            return fieldValue === value;
          case '!=':
            return fieldValue !== value;
          case '>':
            return fieldValue > value;
          case '>=':
            return fieldValue >= value;
          case '<':
            return fieldValue < value;
          case '<=':
            return fieldValue <= value;
          case 'in':
            return Array.isArray(value) && value.includes(fieldValue);
          case 'array-contains':
            return Array.isArray(fieldValue) && fieldValue.includes(value);
          default:
            return true;
        }
      });
    });
    
    // Apply ordering
    orderByConditions.forEach(({ field, direction }) => {
      allDocs.sort(([, a], [, b]) => {
        const aVal = (a as any)[field];
        const bVal = (b as any)[field];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'desc' ? -comparison : comparison;
      });
    });
    
    // Apply limit
    if (limitCount) {
      allDocs = allDocs.slice(0, limitCount);
    }
    
    const docs = allDocs.map(([id, data]) => ({
      id,
      data: () => data,
      ref: createMockDocRef(collectionName, id)
    }));
    
    return Promise.resolve({
      docs,
      empty: docs.length === 0,
      size: docs.length,
      forEach: (callback: (doc: any) => void) => docs.forEach(callback)
    });
  }),
  
  onSnapshot: jest.fn((callback) => {
    // Use the same logic as get() but call callback
    const query = createMockQuery(collectionName, whereConditions, orderByConditions, limitCount);
    query.get().then(callback);
    return jest.fn(); // Unsubscribe function
  })
});

// Firestore Mock with realistic behavior
export const mockFirestore = {
  collection: jest.fn((name: string) => createMockCollectionRef(name)),
  
  doc: jest.fn((path: string) => {
    const [collection, id] = path.split('/');
    return createMockDocRef(collection, id);
  }),
  
  batch: jest.fn(() => {
    const operations: Array<() => void> = [];
    
    return {
      set: jest.fn((ref: any, data: any, options?: any) => {
        operations.push(() => ref.set(data, options));
      }),
      
      update: jest.fn((ref: any, updates: any) => {
        operations.push(() => ref.update(updates));
      }),
      
      delete: jest.fn((ref: any) => {
        operations.push(() => ref.delete());
      }),
      
      commit: jest.fn(() => {
        operations.forEach(op => op());
        return Promise.resolve();
      })
    };
  }),
  
  runTransaction: jest.fn((callback) => {
    const transaction = {
      get: jest.fn((ref: any) => ref.get()),
      set: jest.fn((ref: any, data: any) => ref.set(data)),
      update: jest.fn((ref: any, updates: any) => ref.update(updates)),
      delete: jest.fn((ref: any) => ref.delete())
    };
    return Promise.resolve(callback(transaction));
  }),
  
  // Utility methods for testing
  clearAll: jest.fn(() => {
    Object.keys(mockDataStore).forEach(key => {
      mockDataStore[key as keyof MockDataStore] = {};
    });
  }),
  
  // Get mock data for testing
  getMockData: (collection: string) => mockDataStore[collection as keyof MockDataStore],
  
  // Set mock data for testing
  setMockData: (collection: string, data: any) => {
    mockDataStore[collection as keyof MockDataStore] = data;
  }
};

// Firebase Storage Mock with realistic behavior
const createMockStorageRef = (path: string): any => ({
  fullPath: path,
  name: path.split('/').pop() || '',
  bucket: 'mock-bucket',
  
  child: jest.fn((childPath: string) => {
    return createMockStorageRef(`${path}/${childPath}`);
  }),
  
  put: jest.fn((data: any, metadata?: any) => {
    return Promise.resolve({
      ref: createMockStorageRef(path),
      metadata: {
        name: path.split('/').pop() || '',
        bucket: 'mock-bucket',
        fullPath: path,
        size: 1024,
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString(),
        contentType: metadata?.contentType || 'application/octet-stream',
        ...metadata
      },
      task: {
        snapshot: {
          bytesTransferred: 1024,
          totalBytes: 1024,
          state: 'success'
        }
      }
    });
  }),
  
  putString: jest.fn((data: string, format?: string, metadata?: any) => {
    return Promise.resolve({
      ref: createMockStorageRef(path),
      metadata: {
        name: path.split('/').pop() || '',
        bucket: 'mock-bucket',
        fullPath: path,
        size: data.length,
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString(),
        contentType: metadata?.contentType || 'text/plain',
        ...metadata
      },
      task: {
        snapshot: {
          bytesTransferred: data.length,
          totalBytes: data.length,
          state: 'success'
        }
      }
    });
  }),
  
  getDownloadURL: jest.fn(() => {
    return Promise.resolve(`https://mock-storage.com/${path}?token=mock-token`);
  }),
  
  delete: jest.fn(() => Promise.resolve()),
  
  getMetadata: jest.fn(() => {
    return Promise.resolve({
      name: path.split('/').pop() || '',
      bucket: 'mock-bucket',
      fullPath: path,
      size: 1024,
      timeCreated: new Date().toISOString(),
      updated: new Date().toISOString(),
      contentType: 'application/octet-stream'
    });
  }),
  
  updateMetadata: jest.fn((metadata: any) => {
    return Promise.resolve({
      name: path.split('/').pop() || '',
      bucket: 'mock-bucket',
      fullPath: path,
      size: 1024,
      timeCreated: new Date().toISOString(),
      updated: new Date().toISOString(),
      contentType: 'application/octet-stream',
      ...metadata
    });
  })
});

export const mockStorage = {
  ref: jest.fn((path?: string) => createMockStorageRef(path || ''))
};

// Firebase App Mock
export const mockFirebaseApp = {
  name: 'mock-app',
  options: {},
  automaticDataCollectionEnabled: false
};

// Complete Firebase Mock
export const mockFirebase = {
  auth: mockAuth,
  firestore: mockFirestore,
  storage: mockStorage,
  app: mockFirebaseApp,
  initializeApp: jest.fn(() => mockFirebaseApp),
  getAuth: jest.fn(() => mockAuth),
  getFirestore: jest.fn(() => mockFirestore),
  getStorage: jest.fn(() => mockStorage)
};

// Export individual mocks for specific use cases
export default mockFirebase;