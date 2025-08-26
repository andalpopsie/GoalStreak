// App limits and constraints
export const LIMITS = {
  // Maximum number of habits a user can create (for initial launch)
  MAX_HABITS: 6,
  
  // Reasoning: 6 habits allows users to focus on what matters most
  // while preventing overwhelm. Research shows people can effectively
  // maintain 3-7 habits simultaneously.
} as const;

export default LIMITS;
