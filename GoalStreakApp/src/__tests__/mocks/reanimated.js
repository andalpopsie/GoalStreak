// Mock for React Native Reanimated
const mockReanimated = {
  // Values
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    stopAnimation: jest.fn(),
    resetAnimation: jest.fn(),
    interpolate: jest.fn(),
    animate: jest.fn(),
    stopTracking: jest.fn(),
    track: jest.fn()
  })),

  // Animations
  timing: jest.fn(() => ({
    start: jest.fn()
  })),
  spring: jest.fn(() => ({
    start: jest.fn()
  })),
  decay: jest.fn(() => ({
    start: jest.fn()
  })),

  // Easing
  Easing: {
    linear: jest.fn(),
    ease: jest.fn(),
    quad: jest.fn(),
    cubic: jest.fn(),
    poly: jest.fn(),
    sin: jest.fn(),
    circle: jest.fn(),
    exp: jest.fn(),
    elastic: jest.fn(),
    back: jest.fn(),
    bounce: jest.fn(),
    bezier: jest.fn(),
    in: jest.fn(),
    out: jest.fn(),
    inOut: jest.fn()
  },

  // Interpolation
  interpolate: jest.fn(),
  interpolateColor: jest.fn(),
  Extrapolate: {
    EXTEND: 'extend',
    CLAMP: 'clamp',
    IDENTITY: 'identity'
  },

  // Hooks
  useSharedValue: jest.fn((initial) => ({
    value: initial,
    modify: jest.fn()
  })),
  useAnimatedStyle: jest.fn((callback) => callback()),
  useAnimatedProps: jest.fn((callback) => callback()),
  useDerivedValue: jest.fn((callback) => ({ value: callback() })),
  useAnimatedScrollHandler: jest.fn(() => jest.fn()),
  useAnimatedGestureHandler: jest.fn(() => jest.fn()),
  useWorkletCallback: jest.fn((callback) => callback),
  useAnimatedReaction: jest.fn(),
  useFrameCallback: jest.fn(),

  // Animations (new API)
  withTiming: jest.fn((value) => value),
  withSpring: jest.fn((value) => value),
  withDecay: jest.fn((value) => value),
  withSequence: jest.fn((...values) => values[values.length - 1]),
  withDelay: jest.fn((delay, value) => value),
  withRepeat: jest.fn((value) => value),
  cancelAnimation: jest.fn(),

  // Gesture Handler
  runOnJS: jest.fn((callback) => callback),
  runOnUI: jest.fn((callback) => callback),

  // Layout animations
  Layout: {
    duration: jest.fn(),
    delay: jest.fn(),
    easing: jest.fn(),
    damping: jest.fn(),
    mass: jest.fn(),
    stiffness: jest.fn(),
    overshootClamping: jest.fn(),
    restDisplacementThreshold: jest.fn(),
    restSpeedThreshold: jest.fn()
  },

  // Entering animations
  FadeIn: {
    duration: jest.fn(),
    delay: jest.fn(),
    easing: jest.fn()
  },
  FadeOut: {
    duration: jest.fn(),
    delay: jest.fn(),
    easing: jest.fn()
  },
  SlideInUp: {
    duration: jest.fn(),
    delay: jest.fn(),
    easing: jest.fn()
  },
  SlideOutUp: {
    duration: jest.fn(),
    delay: jest.fn(),
    easing: jest.fn()
  },

  // Components
  View: 'Animated.View',
  Text: 'Animated.Text',
  ScrollView: 'Animated.ScrollView',
  Image: 'Animated.Image',
  
  // Events
  event: jest.fn(),
  
  // Clock and timing
  Clock: jest.fn(),
  clockRunning: jest.fn(),
  startClock: jest.fn(),
  stopClock: jest.fn(),
  
  // Math operations
  add: jest.fn(),
  sub: jest.fn(),
  multiply: jest.fn(),
  divide: jest.fn(),
  pow: jest.fn(),
  sqrt: jest.fn(),
  sin: jest.fn(),
  cos: jest.fn(),
  tan: jest.fn(),
  asin: jest.fn(),
  acos: jest.fn(),
  atan: jest.fn(),
  exp: jest.fn(),
  round: jest.fn(),
  floor: jest.fn(),
  ceil: jest.fn(),
  lessThan: jest.fn(),
  eq: jest.fn(),
  greaterThan: jest.fn(),
  lessOrEq: jest.fn(),
  greaterOrEq: jest.fn(),
  neq: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
  defined: jest.fn(),
  not: jest.fn(),
  set: jest.fn(),
  concat: jest.fn(),
  cond: jest.fn(),
  block: jest.fn(),
  call: jest.fn(),
  debug: jest.fn(),
  onChange: jest.fn(),
  startClock: jest.fn(),
  stopClock: jest.fn(),
  clockRunning: jest.fn(),
  proc: jest.fn(),
  
  // Default export
  default: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    ScrollView: 'Animated.ScrollView',
    Image: 'Animated.Image',
    Value: jest.fn(),
    timing: jest.fn(),
    spring: jest.fn(),
    decay: jest.fn(),
    event: jest.fn(),
    interpolate: jest.fn(),
    Extrapolate: {
      EXTEND: 'extend',
      CLAMP: 'clamp',
      IDENTITY: 'identity'
    },
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn()
    },
    call: jest.fn()
  }
};

module.exports = mockReanimated;