# GoalStreak Firebase Patterns

## Firestore Collections Reference

### Core Collections

```
users/{userId}
├── email: string
├── displayName: string
├── profilePicture?: string
├── createdAt: Timestamp
└── updatedAt: Timestamp

habits/{habitId}
├── userId: string
├── name: string
├── category: string
├── frequency: 'daily' | 'weekly' | 'monthly'
├── icon?: string
├── isPublic: boolean
├── timer?: { enabled, durationMinutes, autoComplete }
├── reminderEnabled?: boolean
├── reminderTime?: string
├── createdAt: Timestamp
└── updatedAt: Timestamp

completions/{completionId}
├── habitId: string
├── userId: string
├── completedAt: Timestamp
├── value?: number
├── notes?: string
└── timerSessionId?: string

streaks/{habitId}
├── habitId: string
├── currentStreak: number
├── longestStreak: number
└── lastCompletedDate: Timestamp | null
```

### Social Collections

```
friends/{friendshipId}
├── userId: string
├── friendId: string
├── friendEmail: string
├── friendName: string
├── status: 'accepted'
├── createdAt: Timestamp
└── updatedAt: Timestamp

friendRequests/{requestId}
├── fromUserId: string
├── fromUserEmail: string
├── fromUserName: string
├── toUserId: string
├── toUserEmail: string
├── status: 'pending' | 'accepted' | 'declined'
├── message?: string
└── createdAt: Timestamp

activities/{activityId}
├── userId: string
├── userName: string
├── type: 'habit_completed' | 'streak_milestone' | 'new_habit'
├── habitId: string
├── habitName: string
├── habitCategory: string
├── visibility: 'public' | 'friends' | 'private'
├── reactions?: { [userId]: ReactionType[] }
├── streakCount?: number
├── timestamp: Timestamp
└── updatedAt?: Timestamp

userProfiles/{userId}
├── email: string
├── name: string
├── totalHabits: number
├── totalCompletions: number
├── longestStreak: number
├── joinedAt: Timestamp
└── isPublic: boolean

socialSettings/{userId}
├── userId: string
├── defaultVisibility: 'public' | 'friends' | 'private'
├── allowFriendRequests: boolean
├── shareStreakMilestones: boolean
├── shareHabitCompletions: boolean
├── shareNewHabits: boolean
├── notifyOnFriendActivity: boolean
└── updatedAt: Timestamp
```

### Timer Collections

```
timerSessions/{sessionId}
├── habitId: string
├── userId: string
├── startTime: Timestamp
├── endTime?: Timestamp
├── targetDuration: number
├── actualDuration?: number
├── completed: boolean
├── completionMethod?: 'timer' | 'manual'
└── createdAt: Timestamp

timerStates/{stateId}
├── userId: string
├── habitId: string
├── isActive: boolean
├── isPaused: boolean
├── startTime?: Timestamp
└── updatedAt: Timestamp
```

## Common Query Patterns

### Get User's Habits
```
Collection: habits
Filter: userId == {userId}
Sort: createdAt DESC (done in JS to avoid index)
```

### Get Today's Completions
```
Collection: completions
Filter: userId == {userId}, habitId == {habitId}
Then filter in JS: completedAt >= today && completedAt < tomorrow
```

### Get Friend's Activities
```
Collection: activities
Filter: userId IN [friendIds], visibility IN ['public', 'friends']
Sort: timestamp DESC
Limit: 20
```

### Check Pending Friend Requests
```
Collection: friendRequests
Filter: toUserId == {userId}, status == 'pending'
Sort: createdAt DESC
```

## Security Rules Patterns

### User Data Access
- Users can only read/write their own data
- Friends can read shared activities (visibility != 'private')
- Profile photos are publicly readable

### Validation Rules
- Habit names: required, non-empty string
- Categories: must be valid category enum
- Timestamps: server-generated for createdAt

## Firebase Project Info

- **Project ID**: goalstreak-app2
- **Storage Bucket**: goalstreak-app2.appspot.com
- **Bundle ID**: com.goalstreak.app
