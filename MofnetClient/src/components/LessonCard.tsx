import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedCard } from './AnimatedCard';
import { ProgressRing } from './ProgressRing';
import { Download, Bookmark, BookOpen } from 'lucide-react-native';
import { subjectMeta } from '@/src/mocks';
import { formatDuration } from '@/src/utils/format';
import type { Lesson } from '@/src/types';

interface LessonCardProps {
  lesson: Lesson;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'large' | 'compact';
}

const thumbnailGradients: Record<string, [string, string]> = {
  cells: ['#17C3B2', '#0FA396'],
  photosynthesis: ['#22C55E', '#15803D'],
  fractions: ['#006989', '#004F66'],
  equations: ['#8B5CF6', '#6D28D9'],
  himalaya: ['#F59E0B', '#D97706'],
  democracy: ['#EF4444', '#DC2626'],
  grammar: ['#8B5CF6', '#7C3AED'],
  computer: ['#06B6D4', '#0891B2'],
  electricity: ['#FBBF24', '#F59E0B'],
  graphs: ['#006989', '#17C3B2'],
};

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  onPress,
  style,
  variant = 'large',
}) => {
  const { theme } = useTheme();
  const meta = subjectMeta[lesson.subject];
  const gradient = thumbnailGradients[lesson.thumbnail] || ['#006989', '#17C3B2'];
  const isLarge = variant === 'large';

  return (
    <AnimatedCard
      onPress={onPress}
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          ...theme.getShadow('sm'),
        },
        style,
      ]}
    >
      <View style={{ position: 'relative' }}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: isLarge ? 120 : 80, justifyContent: 'flex-end', padding: 12 }}
        >
          <View style={styles.thumbnailOrb1} />
          <View style={styles.thumbnailOrb2} />
          <View style={styles.thumbnailBadgeRow}>
            <View style={styles.subjectChip}>
              <Text style={styles.subjectChipText}>{meta.label}</Text>
            </View>
            {lesson.downloaded && (
              <View style={styles.offlineChip}>
                <Download size={10} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.offlineChipText}>Offline</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {lesson.progress > 0 && (
          <View style={styles.progressRingWrap}>
            <ProgressRing
              progress={lesson.progress}
              size={isLarge ? 52 : 40}
              strokeWidth={4}
              color="#FFFFFF"
              trackColor="rgba(255,255,255,0.25)"
            >
              <Text style={styles.progressText}>{lesson.progress}%</Text>
            </ProgressRing>
          </View>
        )}
      </View>

      <View style={{ padding: isLarge ? 14 : 12, gap: 6 }}>
        <Text
          style={[styles.title, { color: theme.colors.textPrimary }]}
          numberOfLines={isLarge ? 2 : 1}
        >
          {lesson.title}
        </Text>
        <Text
          style={[styles.description, { color: theme.colors.textSecondary }]}
          numberOfLines={isLarge ? 2 : 1}
        >
          {lesson.description}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <BookOpen size={12} color={theme.colors.textTertiary} strokeWidth={2} />
            <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
              Ch. {lesson.chapter}
            </Text>
          </View>
          <Text style={[styles.metaText, { color: theme.colors.textTertiary }]}>
            {formatDuration(lesson.duration)}
          </Text>
          {lesson.bookmarked && (
            <Bookmark size={12} color={theme.colors.accent} strokeWidth={2.5} fill={theme.colors.accent} />
          )}
        </View>
      </View>
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  thumbnailOrb1: {
    position: 'absolute',
    top: -20,
    right: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  thumbnailOrb2: {
    position: 'absolute',
    bottom: -30,
    left: -15,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  thumbnailBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  subjectChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  subjectChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  offlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  offlineChipText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  progressRingWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
