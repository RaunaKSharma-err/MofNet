import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Circle, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { splashStatusMessages } from '@/src/mocks';

const { width } = Dimensions.get('window');

const nodes = [
  { id: 'n1', x: width * 0.2, y: 120 },
  { id: 'n2', x: width * 0.8, y: 100 },
  { id: 'n3', x: width * 0.5, y: 200 },
  { id: 'n4', x: width * 0.15, y: 280 },
  { id: 'n5', x: width * 0.85, y: 260 },
  { id: 'n6', x: width * 0.35, y: 360 },
  { id: 'n7', x: width * 0.65, y: 340 },
  { id: 'n8', x: width * 0.5, y: 420 },
];

const links: Array<[number, number]> = [
  [0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 7], [5, 7], [6, 7], [2, 6], [5, 6],
];

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 2400 }) => {
  const [statusIndex, setStatusIndex] = useState(0);
  const progress = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);

  useEffect(() => {
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    logoScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 200 }));

    progress.value = withTiming(1, { duration, easing: Easing.inOut(Easing.ease) });

    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev < splashStatusMessages.length - 1 ? prev + 1 : prev));
    }, duration / splashStatusMessages.length);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration + 200);

    return () => {
      clearInterval(statusInterval);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete, progress, logoOpacity, logoScale]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A1014', '#0E1F26', '#0A1014']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated mesh network */}
      <View style={StyleSheet.absoluteFillObject}>
        <Svg width={width} height={500}>
          {links.map(([a, b], i) => (
            <AnimatedLine
              key={`link-${i}`}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              delay={i * 80}
            />
          ))}
          {nodes.map((n, i) => (
            <AnimatedNode key={`node-${i}`} cx={n.x} cy={n.y} delay={i * 100} />
          ))}
        </Svg>
      </View>

      {/* Mountain silhouette */}
      <View style={styles.mountainWrap}>
        <Svg width={width} height={180} viewBox={`0 0 ${width} 180`}>
          <Path
            d={`M0,180 L${width * 0.15},100 L${width * 0.3},140 L${width * 0.42},60 L${width * 0.5},110 L${width * 0.58},40 L${width * 0.68},90 L${width * 0.78},70 L${width * 0.9},130 L${width},90 L${width},180 Z`}
            fill="rgba(23,193,178,0.06)"
          />
          <Path
            d={`M0,180 L${width * 0.1},130 L${width * 0.25},90 L${width * 0.38},50 L${width * 0.48},100 L${width * 0.55},70 L${width * 0.65},30 L${width * 0.75},80 L${width * 0.85},50 L${width},110 L${width},180 Z`}
            fill="rgba(23,193,178,0.10)"
          />
          <Path
            d={`M0,180 L${width * 0.18},120 L${width * 0.3},80 L${width * 0.4},120 L${width * 0.5},70 L${width * 0.6},110 L${width * 0.7},60 L${width * 0.82},100 L${width * 0.92},80 L${width},120 L${width},180 Z`}
            fill="rgba(0,105,137,0.35)"
          />
        </Svg>
      </View>

      {/* Center logo and content */}
      <View style={styles.content}>
        <Animated.View style={[styles.logoWrap, logoAnimatedStyle]}>
          <View style={styles.logoOrb}>
            <LinearGradient
              colors={['#17C3B2', '#006989']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Text style={styles.logoLetter}>M</Text>
            </LinearGradient>
            <View style={styles.logoRing} />
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(400).duration(600)}
          style={styles.appName}
        >
          MofNet
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(600).duration(600)}
          style={styles.tagline}
        >
          Intelligence Without Internet
        </Animated.Text>

        <Animated.View
          entering={SlideInDown.delay(900).duration(500)}
          style={styles.statusWrap}
        >
          <Text style={styles.statusText}>{splashStatusMessages[statusIndex]}</Text>
        </Animated.View>

        <Animated.View style={styles.progressTrack}>
          <ProgressBar progress={progress} />
        </Animated.View>
      </View>
    </View>
  );
};

const ProgressBar: React.FC<{ progress: ReturnType<typeof useSharedValue<number>> }> = ({ progress }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.progressBarTrack}>
      <Animated.View style={[styles.progressBarFill, animatedStyle]} />
    </View>
  );
};

const AnimatedLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
}> = ({ x1, y1, x2, y2, delay }) => {
  const opacity = useSharedValue(0);
  const strokeDash = useSharedValue(200);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.4, { duration: 500 }));
    strokeDash.value = withDelay(delay, withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }));
  }, [delay, opacity, strokeDash]);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
    strokeDashoffset: strokeDash.value,
  }));

  return (
    <AnimatedLineSVG
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="#17C3B2"
      strokeWidth={1}
      animatedProps={animatedProps}
      strokeDasharray={200}
    />
  );
};

// Custom animated line component
const AnimatedLineSVG: React.FC<any> = (props) => {
  const AnimatedLineComponent = React.useMemo(
    () => Animated.createAnimatedComponent(Line),
    []
  );
  return <AnimatedLineComponent {...props} />;
};

const AnimatedNode: React.FC<{ cx: number; cy: number; delay: number }> = ({ cx, cy, delay }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 10, stiffness: 200 }));
    glowOpacity.value = withDelay(
      delay + 400,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [delay, opacity, scale, glowOpacity]);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
    transform: [{ scaleX: scale.value }, { scaleY: scale.value }],
  }));

  const glowAnimatedProps = useAnimatedProps(() => ({
    opacity: glowOpacity.value,
  }));

  const AnimatedCircle = React.useMemo(() => Animated.createAnimatedComponent(Circle), []);

  return (
    <>
      <AnimatedCircle
        cx={cx}
        cy={cy}
        r={14}
        fill="#17C3B2"
        animatedProps={glowAnimatedProps}
        opacity={0.3}
      />
      <AnimatedCircle
        cx={cx}
        cy={cy}
        r={4}
        fill="#17C3B2"
        animatedProps={animatedProps}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1014',
  },
  mountainWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoWrap: {
    marginBottom: 20,
  },
  logoOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  logoRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(23,193,178,0.3)',
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  statusWrap: {
    marginTop: 60,
    alignItems: 'center',
  },
  statusText: {
    color: '#17C3B2',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  progressTrack: {
    marginTop: 16,
    width: width * 0.5,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#17C3B2',
    borderRadius: 1.5,
  },
});
