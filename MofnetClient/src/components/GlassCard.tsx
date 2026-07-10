import React from 'react';
import { StyleSheet, View, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/src/theme/ThemeProvider';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
  padding?: number;
  borderColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 60,
  borderRadius = 24,
  padding = 16,
  borderColor,
}) => {
  const { theme } = useTheme();

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          {
            backgroundColor: theme.colors.glassLight,
            borderRadius,
            padding,
            borderWidth: 1,
            borderColor: borderColor || theme.colors.glassBorder,
          },
          Platform.OS === 'web'
            ? ({ backdropFilter: 'blur(20px)' } as ViewStyle)
            : null,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[{ borderRadius, overflow: 'hidden' }, style]}>
      <BlurView
        intensity={intensity}
        tint={theme.mode === 'dark' ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFillObject]}
      />
      <View
        style={[
          {
            padding,
            borderWidth: 1,
            borderColor: borderColor || theme.colors.glassBorder,
            borderRadius,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};
