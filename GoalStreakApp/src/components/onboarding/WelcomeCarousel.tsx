import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate responsive sizes as percentages of screen dimensions
const getResponsiveIconSize = () => {
  // Icon size scales between 60-80px based on screen height
  const baseSize = 80;
  const scale = Math.min(1, Math.max(0.75, screenHeight / 900));
  return Math.round(baseSize * scale);
};

const getResponsiveFontSize = (baseSize: number) => {
  // Font sizes scale proportionally with screen height
  const scale = Math.min(1.1, Math.max(0.85, screenHeight / 850));
  return Math.round(baseSize * scale);
};

const getResponsiveSpacing = (baseSpacing: number) => {
  // Spacing scales with screen height, always rounds to nearest 4px
  const scale = Math.min(1.1, Math.max(0.85, screenHeight / 850));
  const scaled = baseSpacing * scale;
  return Math.round(scaled / 4) * 4; // Round to nearest 4px for grid consistency
};

interface WelcomeSlide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  benefits: string[];
  color: string;
}

const welcomeSlides: WelcomeSlide[] = [
  {
    id: 'habits',
    title: 'Build Lasting Habits',
    description:
      'Transform your daily routines into powerful habits with beautiful progress tracking',
    icon: 'checkmark-circle',
    benefits: ['Visual progress tracking', 'Streak celebrations', '39+ categories'],
    color: Colors.accent1,
  },
  {
    id: 'social',
    title: 'Stay Accountable with Friends',
    description:
      'Connect with friends and family to stay motivated and celebrate achievements together',
    icon: 'people',
    benefits: ['Friend accountability', 'Real-time reactions', 'Shared progress'],
    color: Colors.accent2,
  },
  {
    id: 'groups',
    title: 'Accountability Groups & Chat',
    description:
      'Form small groups around shared goals, track progress together, and chat in real time',
    icon: 'chatbubbles',
    benefits: ['Group challenges', 'Live group chat', 'Shared habit tracking'],
    color: Colors.accent3,
  },
  {
    id: 'analytics',
    title: 'Track Your Progress',
    description: 'Get insights into your habits with comprehensive analytics and trend analysis',
    icon: 'analytics',
    benefits: ['Progress charts', 'Streak insights', 'Personal records'],
    color: Colors.accent1,
  },
];

interface WelcomeCarouselProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function WelcomeCarousel({ onComplete, onSkip }: WelcomeCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Memoized dynamic calculations based on safe area and screen size
  // Following 4px base grid: 8, 16, 24, 32
  const skipButtonTop = useMemo(
    () => Math.max(getResponsiveSpacing(16), insets.top + 8), // 16px base
    [insets.top]
  );

  const slideTopPadding = useMemo(
    () => Math.max(getResponsiveSpacing(64), insets.top + getResponsiveSpacing(48)), // 64px = 8*8
    [insets.top]
  );

  const footerBottomPadding = useMemo(() => {
    const baseFooterPadding = getResponsiveSpacing(24); // 24px = comfortable
    return insets.bottom > 0
      ? Math.max(baseFooterPadding, insets.bottom + getResponsiveSpacing(16)) // 16px = base
      : baseFooterPadding;
  }, [insets.bottom]);

  const slideBottomPadding = useMemo(
    () => getResponsiveSpacing(200), // 200px = 8*25 (ensures footer clearance)
    []
  );
  const handleNext = () => {
    if (currentSlide < welcomeSlides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * screenWidth,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentSlide(slideIndex);
  };

  const renderSlide = useCallback(
    (slide: WelcomeSlide) => (
      <ScrollView
        key={slide.id}
        style={styles.slideScrollView}
        contentContainerStyle={[
          styles.slide,
          {
            paddingTop: slideTopPadding,
            paddingBottom: slideBottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={[styles.iconContainer, { backgroundColor: slide.color + '15' }]}
        >
          <Ionicons name={slide.icon} size={getResponsiveIconSize()} color={slide.color} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.content}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>

          <View style={styles.benefitsContainer}>
            {slide.benefits.map((benefit, benefitIndex) => (
              <Animated.View
                key={benefit}
                entering={FadeInUp.delay(600 + benefitIndex * 100)}
                style={styles.benefitItem}
              >
                <Ionicons name="checkmark-circle" size={20} color={slide.color} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    ),
    [slideTopPadding, slideBottomPadding]
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.skipButton, { top: skipButtonTop }]} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {welcomeSlides.map(renderSlide)}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
        <View style={styles.pagination}>
          {welcomeSlides.map((_, index) => (
            <View
              key={index}
              style={[styles.paginationDot, index === currentSlide && styles.paginationDotActive]}
            />
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(800)}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentSlide === welcomeSlides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons
              name={currentSlide === welcomeSlides.length - 1 ? 'rocket' : 'arrow-forward'}
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  skipButton: {
    position: 'absolute',
    // top is set dynamically via inline style
    right: 16, // 16px = base spacing
    zIndex: 1,
    paddingHorizontal: 16, // 16px = base
    paddingVertical: 8, // 8px = tight
    backgroundColor: Colors.white + '90',
    borderRadius: 20, // 20px = 5*4 (grid aligned)
  },
  skipText: {
    ...Typography.body,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryText,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slideScrollView: {
    width: screenWidth,
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 24, // 24px = comfortable spacing
    // paddingTop and paddingBottom are set dynamically via inline style
  },
  iconContainer: {
    width: getResponsiveSpacing(160), // 160px = 8*20
    height: getResponsiveSpacing(160),
    borderRadius: getResponsiveSpacing(80), // 80px = 8*10
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSpacing(24), // 24px = comfortable spacing
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: getResponsiveFontSize(32), // Fully dynamic font size
    fontWeight: '700',
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(16), // Reduced spacing
    lineHeight: getResponsiveFontSize(38),
  },
  description: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: getResponsiveFontSize(18), // Fully dynamic font size
    color: Colors.primaryText,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(26),
    marginBottom: getResponsiveSpacing(32), // Reduced spacing
    opacity: 0.8,
  },
  benefitsContainer: {
    alignSelf: 'stretch',
    backgroundColor: Colors.background,
    borderRadius: 16, // 16px = 4*4
    padding: 16, // 16px = base spacing (card padding)
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // 8px = tight spacing (related items)
    paddingVertical: 4, // 4px = base unit
  },
  benefitText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 16, // 16px = body text
    color: Colors.primaryText,
    marginLeft: 8, // 8px = tight (icon-text pair)
    flex: 1,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24, // 24px = comfortable spacing
    paddingTop: 8, // 8px = tight spacing
    // paddingBottom is set dynamically via inline style
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light + '40',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 8, // 8px = tight spacing
  },
  paginationDot: {
    width: 8, // 8px = base unit
    height: 8,
    borderRadius: 4, // 4px = base unit
    backgroundColor: Colors.gray.light,
    marginHorizontal: 4, // 4px = base unit
  },
  paginationDotActive: {
    backgroundColor: Colors.accent1,
    width: 24, // 24px = 6*4
  },
  nextButton: {
    backgroundColor: Colors.accent1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32, // 32px = loose spacing
    paddingVertical: 16, // 16px = base spacing
    borderRadius: 16, // 16px = 4*4
    minWidth: 160, // 160px = 8*20
    minHeight: 56, // 56px = 8*7 (touch target)
    justifyContent: 'center',
    shadowColor: Colors.accent1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16, // body
    fontWeight: '600',
    color: Colors.white,
    marginRight: 8, // 8px = tight spacing (icon-text)
  },
});
