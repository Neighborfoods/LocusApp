import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/useTheme';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@theme/index';
import { AuthStackParams } from '@navigation/AuthNavigator';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: string;
  iconColorKey: string;
  gradientColorKey: string;
  title: string;
  subtitle: string;
  caption: string;
}

function getSlides(): Slide[] {
  return [
    {
      id: '1',
      icon: 'home-heart',
      iconColorKey: 'primary',
      gradientColorKey: 'primaryAlpha',
      title: "You're not alone.",
      subtitle:
        'Life changes. Mortgages rise. People we love leave. And suddenly, the home that was everything becomes a burden impossible to carry alone.',
      caption: 'Locus was built for moments like this.',
    },
    {
      id: '2',
      icon: 'account-group',
      iconColorKey: 'accent',
      gradientColorKey: 'accentAlpha',
      title: 'Pool together.\nThrive together.',
      subtitle:
        'Join a Community. Contribute your property. Move into a shared home. Your freed property earns rent — and you earn your share automatically, by equity.',
      caption: 'Your asset keeps working. You keep living.',
    },
    {
      id: '3',
      icon: 'map-marker-radius-outline',
      iconColorKey: 'gold',
      gradientColorKey: 'goldAlpha',
      title: 'Live anywhere.\nOwn everywhere.',
      subtitle:
        'Move between communities across cities and states. Your equity moves with you. Resort communities. Urban. Suburban. Choose your lifestyle.',
      caption: 'This is what homeownership should feel like.',
    },
  ];
}

function SlideItem({ slide, colors }: { slide: Slide; colors: Record<string, string> }) {
  const iconColor = colors[slide.iconColorKey] as string;
  const gradientColor = colors[slide.gradientColorKey] as string;
  return (
    <View style={[styles.slide, { backgroundColor: colors.bg }]}>
      <View style={[styles.slideGlow, { backgroundColor: gradientColor }]} />

      <View style={[styles.iconContainer, { borderColor: iconColor + '40', backgroundColor: colors.surface }]}>
        <Icon name={slide.icon} size={56} color={iconColor} />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{slide.subtitle}</Text>
        <View style={[styles.captionRow, { borderLeftColor: iconColor }]}>
          <Text style={[styles.caption, { color: iconColor }]}>{slide.caption}</Text>
        </View>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const SLIDES = getSlides();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParams>>();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      navigation.replace('Register', {});
    }
  };

  const handleSkip = () => {
    navigation.replace('Login', {});
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Sign in</Text>
        </TouchableOpacity>
      )}

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => <SlideItem slide={item} colors={colors as unknown as Record<string, string>} />}
      />

      <View style={[styles.bottomControls, { paddingBottom: 48 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [6, 20, 6],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity, backgroundColor: colors.primary }]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          style={[styles.ctaButton, { backgroundColor: colors.primary, borderRadius: BorderRadius.button }]}
        >
          <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Next'}</Text>
          <Icon name={isLast ? 'arrow-right-circle' : 'chevron-right'} size={20} color="#fff" />
        </TouchableOpacity>

        {isLast && (
          <TouchableOpacity onPress={handleSkip} style={styles.signInLink}>
            <Text style={[styles.signInText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
              <Text style={{ color: colors.primary, fontWeight: FontWeight.semibold }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: {
    position: 'absolute',
    top: Spacing['4xl'],
    right: Spacing.xxl,
    zIndex: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['5xl'],
    paddingTop: 96,
  },
  slideGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: Spacing['4xl'],
  },
  textContainer: { gap: Spacing.lg },
  title: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    lineHeight: 44,
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 26,
  },
  captionRow: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.md,
    marginTop: Spacing.sm,
  },
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    fontStyle: 'italic',
  },
  bottomControls: {
    paddingHorizontal: Spacing['5xl'],
    paddingTop: Spacing['4xl'],
    gap: Spacing.xl,
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['3xl'],
    minWidth: 200,
    borderRadius: 14,
  },
  ctaText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  signInLink: { marginTop: Spacing.xs },
  signInText: { fontSize: FontSize.sm },
});
