import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// Approximate pixel length of each line segment in the viewBox (10,62)→(40,40) and (40,40)→(70,18)
// sqrt((40-10)² + (40-62)²) = sqrt(900+484) ≈ 37.2 → rounded up to 38
const DASH_LENGTH = 38;
const DOT_RADIUS = 9;
const SPRING = { damping: 10, stiffness: 300 };

interface Props {
  onComplete: () => void;
}

export function AnimatedSplashScreen({ onComplete }: Props) {
  // Dot radii (0 → DOT_RADIUS with spring overshoot)
  const d1r = useSharedValue(0);
  const d2r = useSharedValue(0);
  const d3r = useSharedValue(0);

  // Line stroke-dashoffset (DASH_LENGTH → 0 reveals the line)
  const l1Offset = useSharedValue(DASH_LENGTH);
  const l2Offset = useSharedValue(DASH_LENGTH);

  // "Goalfer" slide-up
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(9);

  // Tagline fade
  const taglineOpacity = useSharedValue(0);

  // Whole-screen fade-out
  const containerOpacity = useSharedValue(1);

  const d1Props = useAnimatedProps(() => ({ r: d1r.value * DOT_RADIUS }));
  const d2Props = useAnimatedProps(() => ({ r: d2r.value * DOT_RADIUS }));
  const d3Props = useAnimatedProps(() => ({ r: d3r.value * DOT_RADIUS }));
  const l1Props = useAnimatedProps(() => ({ strokeDashoffset: l1Offset.value }));
  const l2Props = useAnimatedProps(() => ({ strokeDashoffset: l2Offset.value }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  useEffect(() => {
    // --- Animation sequence (mirrors the HTML prototype) ---
    // 0ms    bottom dot pops
    d1r.value = withSpring(1, SPRING);
    // 250ms  line 1 draws up
    l1Offset.value = withDelay(250, withTiming(0, { duration: 300 }));
    // 500ms  middle dot pops
    d2r.value = withDelay(500, withSpring(1, SPRING));
    // 750ms  line 2 draws up
    l2Offset.value = withDelay(750, withTiming(0, { duration: 300 }));
    // 1000ms top dot pops
    d3r.value = withDelay(1000, withSpring(1, SPRING));
    // 1400ms "Goalfer" slides in
    titleOpacity.value = withDelay(1400, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(1400, withTiming(0, { duration: 500 }));
    // 1850ms tagline fades in
    taglineOpacity.value = withDelay(1850, withTiming(0.7, { duration: 450 }));

    // 2800ms hold ends → fade out (400ms) → notify parent
    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(onComplete)();
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Svg viewBox="0 0 80 80" width={120} height={120}>
        {/* Lines drawn behind dots */}
        <AnimatedLine
          animatedProps={l1Props}
          x1={10} y1={62} x2={40} y2={40}
          stroke="white"
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeDasharray={DASH_LENGTH}
        />
        <AnimatedLine
          animatedProps={l2Props}
          x1={40} y1={40} x2={70} y2={18}
          stroke="white"
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeDasharray={DASH_LENGTH}
        />
        {/* Dots on top */}
        <AnimatedCircle animatedProps={d1Props} cx={10} cy={62} fill="white" />
        <AnimatedCircle animatedProps={d2Props} cx={40} cy={40} fill="white" />
        <AnimatedCircle animatedProps={d3Props} cx={70} cy={18} fill="white" />
      </Svg>

      <Animated.Text style={[styles.title, titleStyle]}>Goalfer</Animated.Text>
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Your goals. Your squad.
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#534AB7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  // NOTE: The splash renders at launch IN PARALLEL with font loading (see
  // App.tsx — it shows while `!splashDone`, before `fontsLoaded`). Referencing a
  // not-yet-loaded custom font (Montserrat) here mis-measures the text box on
  // iOS and clips it (e.g. "Goalfer" → "Goalf"). So the splash intentionally
  // uses the always-available system font; this is the one screen that must not
  // depend on the bundled fonts.
  title: {
    fontSize: 38,
    fontWeight: '500',
    color: 'white',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
});
