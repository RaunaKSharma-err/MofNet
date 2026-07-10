import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.mode === 'dark' ? '#1E2A36' : '#E5E9F0',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <ShimmerEffect />
    </View>
  );
};

const ShimmerEffect: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: theme.mode === 'dark' ? '#243240' : '#F0F3F8',
          opacity: 0.6,
        },
      ]}
    />
  );
};

export const LessonCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.lessonSkeleton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <SkeletonLoader width="100%" height={120} borderRadius={16} />
      <View style={{ padding: 14, gap: 8 }}>
        <SkeletonLoader width="60%" height={16} />
        <SkeletonLoader width="90%" height={12} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <SkeletonLoader width={60} height={24} borderRadius={12} />
          <SkeletonLoader width={60} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
};

export const ChatSkeleton: React.FC = () => {
  return (
    <View style={{ gap: 16, padding: 16 }}>
      <SkeletonLoader width="70%" height={48} borderRadius={16} />
      <SkeletonLoader width="85%" height={64} borderRadius={16} style={{ alignSelf: 'flex-end' }} />
      <SkeletonLoader width="60%" height={40} borderRadius={16} />
    </View>
  );
};

const styles = StyleSheet.create({
  lessonSkeleton: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
