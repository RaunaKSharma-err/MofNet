import React, { useCallback } from 'react';
import {
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import { triggerHaptic } from '@/src/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'accent' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  haptic?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  labelStyle,
  haptic = true,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 13 },
    md: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 16 },
    lg: { paddingVertical: 18, paddingHorizontal: 28, fontSize: 17 },
  }[size];

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.85, { duration: 100 });
  }, [scale, opacity]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 150 });
  }, [scale, opacity]);

  const handlePress = useCallback(() => {
    if (haptic) triggerHaptic('light');
    onPress?.();
  }, [haptic, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(opacity.value, [0.85, 1], [0.85, 1]),
  }));

  const isDisabled = disabled || loading;

  const getGradientColors = (): [string, string] => {
    if (isDisabled) return [theme.colors.textTertiary, theme.colors.textTertiary];
    switch (variant) {
      case 'primary':
        return [theme.colors.primary, theme.colors.primaryDark];
      case 'accent':
        return [theme.colors.accent, theme.colors.accentDark];
      case 'danger':
        return [theme.colors.error, '#DC2626'];
      default:
        return ['transparent', 'transparent'];
    }
  };

  const isGradient = variant === 'primary' || variant === 'accent' || variant === 'danger';

  const containerStyle: ViewStyle = {
    borderRadius: theme.radius.lg,
    paddingVertical: sizeStyles.paddingVertical,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...(fullWidth ? { width: '100%' } : {}),
    ...style,
  };

  const textColor = (() => {
    if (variant === 'ghost' || variant === 'outline') {
      return isDisabled ? theme.colors.textTertiary : theme.colors.primary;
    }
    return '#FFFFFF';
  })();

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Animated.Text
            style={[
              { color: textColor, fontSize: sizeStyles.fontSize, fontWeight: '600' },
              labelStyle,
            ]}
          >
            {label}
          </Animated.Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </>
  );

  if (variant === 'ghost' || variant === 'outline') {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={isDisabled}
        style={[
          animatedStyle,
          containerStyle,
          variant === 'outline' && {
            borderWidth: 1.5,
            borderColor: isDisabled ? theme.colors.border : theme.colors.primary,
          },
        ]}
      >
        {renderContent()}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isDisabled}
      style={[animatedStyle, containerStyle]}
    >
      {isGradient ? (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: getGradientColors()[0] }]} />
      )}
      <View style={{ borderRadius: theme.radius.lg, overflow: 'hidden' }}>
        {renderContent()}
      </View>
    </AnimatedPressable>
  );
};
