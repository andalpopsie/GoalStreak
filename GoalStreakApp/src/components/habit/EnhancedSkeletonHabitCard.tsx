import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors, Spacing, Shadows } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');
const cardSize = (screenWidth - (Spacing.md * 3)) / 2; // 2 columns with spacing

export default function EnhancedSkeletonHabitCard() {
  const shimmerAnimation = useSharedValue(0);

  useEffect(() => {
    shimmerAnimation.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedShimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmerAnimation.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3]
    );
    
    return {
      opacity,
    };
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      shimmerAnimation.value,
      [0, 1],
      [0, 360]
    );
    
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Progress Ring Skeleton */}
        <View style={styles.progressContainer}>
          <View style={styles.progressRing}>
            <Animated.View 
              style={[styles.progressFill, animatedProgressStyle]} 
            />
            <View style={styles.innerCircle}>
              <Animated.View 
                style={[styles.iconSkeleton, animatedShimmerStyle]} 
              />
            </View>
          </View>
        </View>

        {/* Text Skeleton */}
        <View style={styles.textContainer}>
          <Animated.View 
            style={[styles.textSkeleton, styles.titleSkeleton, animatedShimmerStyle]} 
          />
          <Animated.View 
            style={[styles.textSkeleton, styles.subtitleSkeleton, animatedShimmerStyle]} 
          />
        </View>

        {/* Streak Skeleton */}
        <View style={styles.streakContainer}>
          <Animated.View 
            style={[styles.streakSkeleton, animatedShimmerStyle]} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardSize,
    aspectRatio: 0.85,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    shadowColor: Colors.primaryText,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: Colors.gray.light,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: 'transparent',
    borderTopColor: Colors.gray.medium,
    borderRightColor: Colors.gray.medium,
  },
  innerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  iconSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray.light,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  textSkeleton: {
    backgroundColor: Colors.gray.light,
    borderRadius: 4,
    marginBottom: Spacing.xs,
  },
  titleSkeleton: {
    width: 80,
    height: 16,
  },
  subtitleSkeleton: {
    width: 60,
    height: 12,
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakSkeleton: {
    width: 40,
    height: 20,
    backgroundColor: Colors.gray.light,
    borderRadius: 10,
  },
});