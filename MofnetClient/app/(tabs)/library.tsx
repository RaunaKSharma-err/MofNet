import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  SlideInRight,
  Easing,
} from 'react-native-reanimated';
import {
  Search as SearchIcon,
  Filter,
  Download,
  Bookmark,
  TrendingUp,
  Clock,
  Flame,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useLibraryStore } from '@/src/store/libraryStore';
import { triggerHaptic } from '@/src/utils/haptics';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SearchBar } from '@/src/components/SearchBar';
import { LessonCard } from '@/src/components/LessonCard';
import { EmptyState } from '@/src/components/EmptyState';
import { LessonCardSkeleton } from '@/src/components/SkeletonLoader';
import { subjectMeta } from '@/src/mocks';
import type { SubjectKey } from '@/src/types';

const { width } = Dimensions.get('window');

const filterChips: Array<{ key: 'all' | SubjectKey | 'downloaded' | 'bookmarked'; label: string; icon?: string }> = [
  { key: 'all', label: 'All' },
  { key: 'science', label: 'Science' },
  { key: 'math', label: 'Math' },
  { key: 'social', label: 'Social' },
  { key: 'english', label: 'English' },
  { key: 'computer', label: 'Computer' },
  { key: 'downloaded', label: 'Downloaded' },
  { key: 'bookmarked', label: 'Saved' },
];

export default function LibraryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const lessons = useLibraryStore((s) => s.lessons);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const activeFilter = useLibraryStore((s) => s.activeFilter);
  const setSearch = useLibraryStore((s) => s.setSearch);
  const setFilter = useLibraryStore((s) => s.setFilter);
  const getFiltered = useLibraryStore((s) => s.getFiltered);

  const filteredLessons = useMemo(() => getFiltered(), [getFiltered, lessons, searchQuery, activeFilter]);

  const continueLearning = useMemo(
    () => lessons.filter((l) => l.progress > 0 && l.progress < 100).slice(0, 4),
    [lessons]
  );
  const downloaded = useMemo(() => lessons.filter((l) => l.downloaded).slice(0, 4), [lessons]);
  const recommended = useMemo(
    () => [...lessons].sort((a, b) => b.popularity - a.popularity).slice(0, 4),
    [lessons]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    triggerHaptic('light');
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleLessonClick = useCallback((id: string) => {
    triggerHaptic('light');
    router.push(`/lesson/${id}`);
  }, [router]);

  const isFiltered = activeFilter !== 'all' || searchQuery.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        <ScreenHeader title="Library" subtitle="Explore" large showBell />

        {/* Search */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearch}
            placeholder="Search lessons, topics..."
          />
        </View>

        {/* Filter chips */}
        <View style={{ marginTop: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          >
            {filterChips.map((chip) => (
              <FilterChip
                key={chip.key}
                label={chip.label}
                active={activeFilter === chip.key}
                onPress={() => {
                  triggerHaptic('selection');
                  setFilter(chip.key);
                }}
                theme={theme}
              />
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        {isFiltered ? (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            {filteredLessons.length > 0 ? (
              <View style={styles.filteredGrid}>
                {filteredLessons.map((lesson, i) => (
                  <Animated.View
                    key={lesson.id}
                    entering={FadeInDown.delay(i * 60).duration(400)}
                    style={{ flex: 1 }}
                  >
                    <LessonCard
                      lesson={lesson}
                      variant="compact"
                      onPress={() => handleLessonClick(lesson.id)}
                    />
                  </Animated.View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon={<SearchIcon size={28} color={theme.colors.textSecondary} strokeWidth={2} />}
                title="No lessons found"
                description="Try a different search or filter"
              />
            )}
          </View>
        ) : (
          <View style={{ marginTop: 20 }}>
            {/* Continue Learning */}
            {continueLearning.length > 0 && (
              <Section
                title="Continue Learning"
                icon={<Clock size={16} color={theme.colors.accent} strokeWidth={2.5} />}
                theme={theme}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
                >
                  {continueLearning.map((lesson, i) => (
                    <Animated.View
                      key={lesson.id}
                      entering={SlideInRight.delay(i * 80).duration(500)}
                      style={{ width: 240 }}
                    >
                      <LessonCard
                        lesson={lesson}
                        onPress={() => handleLessonClick(lesson.id)}
                      />
                    </Animated.View>
                  ))}
                </ScrollView>
              </Section>
            )}

            {/* Downloaded Lessons */}
            {downloaded.length > 0 && (
              <Section
                title="Downloaded Lessons"
                icon={<Download size={16} color={theme.colors.success} strokeWidth={2.5} />}
                theme={theme}
                actionLabel="See all"
                onAction={() => setFilter('downloaded')}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
                >
                  {downloaded.map((lesson, i) => (
                    <Animated.View
                      key={lesson.id}
                      entering={SlideInRight.delay(i * 80).duration(500)}
                      style={{ width: 240 }}
                    >
                      <LessonCard
                        lesson={lesson}
                        onPress={() => handleLessonClick(lesson.id)}
                      />
                    </Animated.View>
                  ))}
                </ScrollView>
              </Section>
            )}

            {/* Recommended */}
            <Section
              title="Recommended"
              icon={<TrendingUp size={16} color="#8B5CF6" strokeWidth={2.5} />}
              theme={theme}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
              >
                {recommended.map((lesson, i) => (
                  <Animated.View
                    key={lesson.id}
                    entering={SlideInRight.delay(i * 80).duration(500)}
                    style={{ width: 240 }}
                  >
                    <LessonCard
                      lesson={lesson}
                      onPress={() => handleLessonClick(lesson.id)}
                    />
                  </Animated.View>
                ))}
              </ScrollView>
            </Section>

            {/* Popular in School */}
            <Section
              title="Popular in School"
              icon={<Flame size={16} color="#FF6B35" strokeWidth={2.5} />}
              theme={theme}
            >
              <View style={{ paddingHorizontal: 16, gap: 12 }}>
                {recommended.slice(0, 3).map((lesson, i) => (
                  <Animated.View
                    key={lesson.id}
                    entering={FadeInDown.delay(i * 80).duration(400)}
                  >
                    <PopularLessonRow
                      lesson={lesson}
                      rank={i + 1}
                      theme={theme}
                      onPress={() => handleLessonClick(lesson.id)}
                    />
                  </Animated.View>
                ))}
              </View>
            </Section>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  theme: any;
}> = ({ label, active, onPress, theme }) => {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    onPress();
  }, [onPress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? theme.colors.accent : theme.colors.card,
          borderColor: active ? theme.colors.accent : theme.colors.border,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: active ? '#FFFFFF' : theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  theme: any;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}> = ({ title, icon, theme, actionLabel, onAction, children }) => {
  return (
    <View style={{ marginTop: 24 }}>
      <View style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
        <View style={styles.sectionTitleRow}>
          {icon}
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {title}
          </Text>
        </View>
        {actionLabel && (
          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              onAction?.();
            }}
            style={styles.sectionAction}
          >
            <Text style={[styles.sectionActionText, { color: theme.colors.accent }]}>
              {actionLabel}
            </Text>
            <ChevronRight size={14} color={theme.colors.accent} strokeWidth={2.5} />
          </Pressable>
        )}
      </View>
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
};

const PopularLessonRow: React.FC<{
  lesson: any;
  rank: number;
  theme: any;
  onPress: () => void;
}> = ({ lesson, rank, theme, onPress }) => {
  const meta = subjectMeta[lesson.subject];
  return (
    <Pressable
      onPress={onPress}
      style={[styles.popularRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <View style={[styles.rankBadge, { backgroundColor: theme.colors.primaryLight }]}>
        <Text style={[styles.rankText, { color: theme.colors.primary }]}>#{rank}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.popularTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {lesson.title}
        </Text>
        <View style={styles.popularMetaRow}>
          <Text style={[styles.popularMeta, { color: theme.colors.accent }]}>
            {meta.label}
          </Text>
          <Text style={[styles.popularMeta, { color: theme.colors.textTertiary }]}>
            • {lesson.duration} min
          </Text>
          <View style={styles.popularityChip}>
            <Flame size={9} color="#FF6B35" strokeWidth={2.5} />
            <Text style={[styles.popularityText, { color: '#FF6B35' }]}>
              {lesson.popularity}
            </Text>
          </View>
        </View>
      </View>
      <ChevronRight size={18} color={theme.colors.textTertiary} strokeWidth={2.2} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filteredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  popularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  popularMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  popularMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  popularityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 4,
  },
  popularityText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
