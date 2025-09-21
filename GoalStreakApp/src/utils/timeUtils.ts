/**
 * Utility functions for time formatting and manipulation
 */

/**
 * Formats a timestamp to a relative time string (e.g., "2m", "1h", "3d")
 * Handles Firestore Timestamp objects, Date objects, strings, and numbers
 */
export const formatRelativeTime = (timestamp: any): string => {
  if (!timestamp) return 'now';
  
  try {
    let date: Date;
    
    // Handle different timestamp formats
    if (timestamp && typeof timestamp.toDate === 'function') {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // JavaScript Date
      date = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      // String or number timestamp
      date = new Date(timestamp);
    } else {
      return 'now';
    }
    
    if (isNaN(date.getTime())) return 'now';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w`;
    
    // For older posts, show date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return 'now';
  }
};
