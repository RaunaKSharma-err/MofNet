import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Wifi, WifiOff, Share2 } from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useMeshStore } from '@/src/store/meshStore';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export const OfflineBanner: React.FC = () => {
  const { theme } = useTheme();
  const status = useMeshStore((s) => s.status);
  const opacity = useSharedValue(1);

  opacity.value = withRepeat(
    withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
    -1,
    true
  );

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const config = (() => {
    if (status === 'online') {
      return {
        bg: theme.colors.success,
        icon: <Wifi size={14} color="#FFFFFF" strokeWidth={2.5} />,
        text: 'Online — Connected to MofNet AI',
      };
    }
    if (status === 'mesh') {
      return {
        bg: theme.colors.accent,
        icon: <Share2 size={14} color="#FFFFFF" strokeWidth={2.5} />,
        text: 'Mesh Connected — Sharing knowledge offline',
      };
    }
    return {
      bg: theme.colors.warning,
      icon: <WifiOff size={14} color="#FFFFFF" strokeWidth={2.5} />,
      text: 'Offline Mode Active — AI still works',
    };
  })();

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      {config.icon}
      <Text style={styles.text}>{config.text}</Text>
      <Animated.View style={[styles.pulseDot, dotAnimatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});
