import React, { useCallback } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import { triggerHaptic } from '@/src/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
  disabled?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  onPress,
  style,
  scaleTo = 0.97,
  haptic = true,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const elevation = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(scaleTo, { damping: 18, stiffness: 400 });
  }, [scale, scaleTo]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (haptic) triggerHaptic('light');
    onPress?.();
  }, [haptic, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (disabled) {
    return <Animated.View style={[style]}>{children}</Animated.View>;
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
};
