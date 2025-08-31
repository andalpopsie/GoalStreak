# GoalStreak Security Guidelines

## Security Overview
GoalStreak handles sensitive user data including personal habits, social connections, and authentication information. This document outlines security best practices and requirements for maintaining user trust and data protection.

## Authentication Security

### Firebase Authentication Best Practices
```typescript
// Secure authentication implementation
- Use Firebase Auth with proper session management
- Implement secure password requirements (8+ chars, complexity)
- Enable email verification for new accounts
- Use secure password reset flows
- Implement proper logout and session cleanup
```

### Session Management
- Store authentication tokens securely using AsyncStorage
- Implement automatic token refresh
- Clear sensitive data on logout
- Handle authentication state changes properly
- Implement proper deep linking security

## Data Protection Standards

### Personal Information Handling
```typescript
// User data that requires protection
interface SensitiveData {
  email: string;           // PII - encrypt in transit
  displayName: string;     // PII - user controlled
  habitData: Habit[];      // Personal - privacy controls
  socialConnections: Friend[]; // Social graph - restricted access
}
```

### Privacy Controls Implementation
- Default habits to private visibility
- Explicit opt-in for social sharing
- Granular privacy controls per habit
- User-controlled data deletion
- Clear privacy policy compliance

## Firebase Security Rules

### Firestore Security Rules
```javascript
// Users can only access their own data
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - own data only
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Habits collection - own habits only
    match /habits/{habitId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Completions - own completions only
    match /completions/{completionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Friends - bidirectional access for accepted friends
    match /friends/{friendId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.friendId == request.auth.uid);
      allow write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Activities - friends can read public activities
    match /activities/{activityId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.visibility == 'public' ||
         (resource.data.visibility == 'friends' && 
          exists(/databases/$(database)/documents/friends/$(request.auth.uid + '_' + resource.data.userId))));
      allow write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### Storage Security Rules
```javascript
// Firebase Storage security for profile pictures
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/profile/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Input Validation & Sanitization

### Client-Side Validation
```typescript
// Habit creation validation
const validateHabitInput = (habitData: CreateHabitForm): ValidationResult => {
  const errors: string[] = [];
  
  // Name validation
  if (!habitData.name || habitData.name.trim().length < 2) {
    errors.push('Habit name must be at least 2 characters');
  }
  if (habitData.name.length > 50) {
    errors.push('Habit name must be less than 50 characters');
  }
  
  // Sanitize HTML and special characters
  const sanitizedName = habitData.name
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>\"']/g, ''); // Remove dangerous characters
  
  // Category validation
  if (!VALID_CATEGORIES.includes(habitData.category)) {
    errors.push('Invalid habit category');
  }
  
  return { isValid: errors.length === 0, errors, sanitizedData: { ...habitData, name: sanitizedName } };
};
```

### Server-Side Validation (Firebase Functions)
```typescript
// Cloud Function for additional validation
export const validateHabitCreation = functions.firestore
  .document('habits/{habitId}')
  .onCreate(async (snap, context) => {
    const habitData = snap.data();
    
    // Validate user ownership
    if (habitData.userId !== context.auth?.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Invalid user');
    }
    
    // Validate data integrity
    if (!habitData.name || typeof habitData.name !== 'string') {
      await snap.ref.delete();
      throw new functions.https.HttpsError('invalid-argument', 'Invalid habit data');
    }
  });
```

## API Security

### Rate Limiting
```typescript
// Implement rate limiting for sensitive operations
const rateLimiter = {
  friendRequests: new Map<string, number>(), // userId -> count
  habitCreation: new Map<string, number>(),
  
  checkLimit: (userId: string, operation: string, limit: number): boolean => {
    const key = `${userId}_${operation}`;
    const count = rateLimiter[operation].get(userId) || 0;
    
    if (count >= limit) {
      return false; // Rate limit exceeded
    }
    
    rateLimiter[operation].set(userId, count + 1);
    
    // Reset counter after 1 hour
    setTimeout(() => {
      rateLimiter[operation].delete(userId);
    }, 3600000);
    
    return true;
  }
};
```

### Error Handling Security
```typescript
// Secure error handling - don't expose sensitive information
const handleSecureError = (error: any, operation: string): string => {
  // Log detailed error for debugging (server-side only)
  console.error(`Operation ${operation} failed:`, error);
  
  // Return generic user-friendly message
  const userMessages = {
    'auth/user-not-found': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'permission-denied': 'You don\'t have permission to perform this action',
    'not-found': 'The requested resource was not found',
    'default': 'Something went wrong. Please try again.'
  };
  
  return userMessages[error.code] || userMessages.default;
};
```

## Environment Security

### Environment Variables
```typescript
// Use environment variables for sensitive configuration
// .env.production
FIREBASE_API_KEY=your_production_api_key
FIREBASE_AUTH_DOMAIN=your_production_domain
FIREBASE_PROJECT_ID=your_production_project

// .env.development  
FIREBASE_API_KEY=your_development_api_key
FIREBASE_AUTH_DOMAIN=your_development_domain
FIREBASE_PROJECT_ID=your_development_project
```

### Secure Configuration Management
```typescript
// config/firebase.ts
import { initializeApp } from 'firebase/app';

const getFirebaseConfig = () => {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  
  // Validate all required config values are present
  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Missing required Firebase config: ${key}`);
    }
  });
  
  return config;
};
```

## Social Features Security

### Friend Request Security
```typescript
// Secure friend request handling
const sendFriendRequest = async (fromUserId: string, toEmail: string) => {
  // Rate limiting
  if (!rateLimiter.checkLimit(fromUserId, 'friendRequests', 10)) {
    throw new Error('Too many friend requests. Please try again later.');
  }
  
  // Email validation
  if (!isValidEmail(toEmail)) {
    throw new Error('Invalid email address');
  }
  
  // Prevent self-friending
  const fromUser = await getUser(fromUserId);
  if (fromUser.email === toEmail.toLowerCase()) {
    throw new Error('Cannot send friend request to yourself');
  }
  
  // Check for existing relationship
  const existingFriendship = await checkExistingFriendship(fromUserId, toEmail);
  if (existingFriendship) {
    throw new Error('Friend request already exists or users are already friends');
  }
  
  // Proceed with secure friend request creation
};
```

### Activity Feed Security
```typescript
// Secure activity feed with privacy controls
const getActivityFeed = async (userId: string): Promise<SocialActivity[]> => {
  // Get user's friends
  const friends = await getUserFriends(userId);
  const friendIds = friends.map(f => f.friendId);
  
  // Query activities with privacy filtering
  const activities = await db.collection('activities')
    .where('userId', 'in', [...friendIds, userId])
    .where('visibility', 'in', ['public', 'friends'])
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();
  
  // Additional privacy filtering
  return activities.docs
    .map(doc => doc.data() as SocialActivity)
    .filter(activity => {
      // User can see their own activities
      if (activity.userId === userId) return true;
      
      // Public activities are visible to all
      if (activity.visibility === 'public') return true;
      
      // Friends-only activities require friendship
      if (activity.visibility === 'friends') {
        return friendIds.includes(activity.userId);
      }
      
      return false;
    });
};
```

## Monitoring & Incident Response

### Security Monitoring
```typescript
// Security event logging
const logSecurityEvent = (event: SecurityEvent) => {
  const securityLog = {
    timestamp: new Date(),
    userId: event.userId,
    action: event.action,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    success: event.success,
    details: event.details
  };
  
  // Log to secure monitoring service
  console.log('SECURITY_EVENT:', JSON.stringify(securityLog));
  
  // Alert on suspicious activity
  if (event.action === 'failed_login' && event.attempts > 5) {
    alertSecurityTeam('Multiple failed login attempts', securityLog);
  }
};
```

### Incident Response Plan
1. **Detection**: Monitor for unusual activity patterns
2. **Assessment**: Evaluate severity and scope of security incident
3. **Containment**: Implement immediate protective measures
4. **Investigation**: Analyze logs and determine root cause
5. **Recovery**: Restore normal operations securely
6. **Lessons Learned**: Update security measures based on findings

## Compliance & Privacy

### GDPR Compliance
- Implement user data export functionality
- Provide clear data deletion options
- Maintain audit logs for data access
- Ensure explicit consent for data processing
- Implement data minimization principles

### Privacy Policy Requirements
- Clear explanation of data collection
- Purpose limitation for data use
- User rights and control mechanisms
- Data retention policies
- Third-party data sharing disclosure

## Security Testing

### Regular Security Audits
- Penetration testing for authentication flows
- Input validation testing
- Firebase Security Rules testing
- Social engineering vulnerability assessment
- Code review for security vulnerabilities

### Automated Security Scanning
- Dependency vulnerability scanning
- Static code analysis for security issues
- Runtime security monitoring
- Automated security testing in CI/CD pipeline

## Emergency Procedures

### Security Incident Response
1. **Immediate Actions**:
   - Isolate affected systems
   - Preserve evidence
   - Notify stakeholders
   
2. **Investigation**:
   - Analyze security logs
   - Determine scope of breach
   - Identify root cause
   
3. **Recovery**:
   - Implement security patches
   - Reset compromised credentials
   - Restore secure operations
   
4. **Communication**:
   - Notify affected users
   - Report to authorities if required
   - Update security documentation

### Contact Information
- Security Team: security@goalstreak.com
- Emergency Response: +1-XXX-XXX-XXXX
- Legal Team: legal@goalstreak.com

Remember: Security is not a one-time implementation but an ongoing process that requires constant vigilance and updates.