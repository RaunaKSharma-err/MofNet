import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  FadeIn,
  FadeInDown,
  SlideInUp,
  Easing,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Bookmark,
  Download,
  Clock,
  BookOpen,
  Volume2,
  PenLine,
  HelpCircle,
  ChevronRight,
  CheckCircle,
  WifiOff,
  Star,
  TrendingUp,
} from 'lucide-react-native';
import * as ExpoSpeech from 'expo-speech';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useLibraryStore } from '@/src/store/libraryStore';
import { triggerHaptic } from '@/src/utils/haptics';
import { AppButton } from '@/src/components/AppButton';
import { ProgressRing } from '@/src/components/ProgressRing';
import { subjectMeta } from '@/src/mocks';
import { formatDuration } from '@/src/utils/format';

const { width } = Dimensions.get('window');

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

const lessonContent = `Cells are the basic building blocks of all living things. Just like bricks build a house, cells build every plant, animal, and human being.

## What is a Cell?

A cell is the smallest unit of life. Everything that is alive — from the smallest bacteria to the largest whale — is made of cells.

Some living things, like bacteria, are made of just one cell (unicellular). Others, like humans, are made of trillions of cells working together (multicellular).

## Parts of a Cell

### 1. Cell Membrane
The cell membrane is the outer layer of the cell. It acts like a gatekeeper — it controls what enters and leaves the cell. Think of it as the cell's security guard.

### 2. Nucleus
The nucleus is the "brain" of the cell. It contains DNA — the genetic instructions that tell the cell what to do. Without the nucleus, the cell wouldn't know its job.

### 3. Cytoplasm
The cytoplasm is the jelly-like substance that fills the cell. All the other parts of the cell float in this jelly. It's like the water in a swimming pool where all the organelles swim.

### 4. Mitochondria
Mitochondria are the "powerhouses" of the cell. They take in nutrients and produce energy for the cell to use. The more energy a cell needs, the more mitochondria it has.

### 5. Vacuole
Vacuoles are storage sacs. They store water, food, and waste products. In plant cells, the vacuole is very large and helps keep the plant firm.

## Plant Cells vs Animal Cells

Plant cells have some extra parts that animal cells don't have:
- **Cell Wall**: A rigid outer layer that gives the plant cell its shape
- **Chloroplasts**: Where photosynthesis happens (they make food from sunlight!)
- **Large Vacuole**: Much bigger than in animal cells

## Why are Cells Important?

Cells are the foundation of life. Understanding cells helps us understand:
- How our bodies work
- Why we get sick and how to get better
- How plants grow and produce food
- How all living things are connected

Cells were first discovered in 1665 by Robert Hooke, who looked at a piece of cork under a microscope and saw tiny "rooms" — which he called "cells".`;

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isReading, setIsReading] = useState(false);

  const lessons = useLibraryStore((s) => s.lessons);
  const toggleBookmark = useLibraryStore((s) => s.toggleBookmark);
  const toggleDownload = useLibraryStore((s) => s.toggleDownload);
  const setProgress = useLibraryStore((s) => s.setProgress);

  const lesson = lessons.find((l) => l.id === id);
  const meta = lesson ? subjectMeta[lesson.subject] : null;
  const gradient = lesson ? (thumbnailGradients[lesson.thumbnail] || ['#006989', '#17C3B2']) : null;

  const handleReadAloud = useCallback(() => {
    if (!lesson) return;
    triggerHaptic('selection');
    if (isReading) {
      ExpoSpeech.stop();
      setIsReading(false);
      return;
    }
    const content = lessonContent.replace(/[#*]/g, '');
    ExpoSpeech.speak(content, {
      language: 'en',
      rate: 0.95,
      onDone: () => setIsReading(false),
      onStopped: () => setIsReading(false),
    });
    setIsReading(true);
  }, [isReading, lesson]);

  const handleBookmark = useCallback(() => {
    if (!lesson) return;
    triggerHaptic('light');
    toggleBookmark(lesson.id);
  }, [lesson, toggleBookmark]);

  const handleDownload = useCallback(() => {
    if (!lesson) return;
    triggerHaptic('medium');
    toggleDownload(lesson.id);
  }, [lesson, toggleDownload]);

  const handleStartLearning = useCallback(() => {
    if (!lesson) return;
    triggerHaptic('success');
    setProgress(lesson.id, 100);
  }, [lesson, setProgress]);

  if (!lesson) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.textPrimary }}>Lesson not found</Text>
        <AppButton label="Go Back" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero header */}
        <View style={styles.heroWrap}>
<LinearGradient
             colors={gradient!}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
             style={{ paddingTop: insets.top + 12, paddingBottom: 20, paddingHorizontal: 16, position: 'relative', overflow: 'hidden' }}
           >
            <View style={styles.heroOrb1} />
            <View style={styles.heroOrb2} />

            {/* Top nav */}
            <View style={styles.heroNav}>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  router.back();
                }}
                style={styles.heroNavBtn}
              >
                <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
              <View style={styles.heroNavActions}>
                <Pressable
                  onPress={handleDownload}
                  style={[styles.heroNavBtn, lesson.downloaded && { backgroundColor: 'rgba(255,255,255,0.25)' }]}
                >
                  <Download size={18} color="#FFFFFF" strokeWidth={2.3} fill={lesson.downloaded ? '#FFFFFF' : 'transparent'} />
                </Pressable>
                <Pressable
                  onPress={handleBookmark}
                  style={[styles.heroNavBtn, lesson.bookmarked && { backgroundColor: 'rgba(255,255,255,0.25)' }]}
                >
                  <Bookmark size={18} color="#FFFFFF" strokeWidth={2.3} fill={lesson.bookmarked ? '#FFFFFF' : 'transparent'} />
                </Pressable>
              </View>
            </View>

            {/* Subject badge */}
            <View style={styles.subjectBadgeRow}>
{meta && (
               <View style={styles.subjectBadge}>
                 <Text style={styles.subjectBadgeText}>{meta.label}</Text>
               </View>
             )}
              {lesson.downloaded && (
                <View style={styles.offlineBadge}>
                  <WifiOff size={10} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.offlineBadgeText}>Available Offline</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.lessonTitle}>
              {lesson.title}
            </Text>
            <Text style={styles.lessonDescription}>
              {lesson.description}
            </Text>

            {/* Meta */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <BookOpen size={12} color="rgba(255,255,255,0.8)" strokeWidth={2.3} />
                <Text style={styles.metaText}>Ch. {lesson.chapter}: {lesson.chapterTitle}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={12} color="rgba(255,255,255,0.8)" strokeWidth={2.3} />
                <Text style={styles.metaText}>{formatDuration(lesson.duration)}</Text>
              </View>
              <View style={styles.metaItem}>
                <TrendingUp size={12} color="rgba(255,255,255,0.8)" strokeWidth={2.3} />
                <Text style={styles.metaText}>{lesson.popularity}% popular</Text>
              </View>
            </View>

            {/* Progress */}
            {lesson.progress > 0 && (
              <View style={styles.progressWrap}>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${lesson.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{lesson.progress}% complete</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActionsRow}>
          <QuickAction
            icon={<Volume2 size={18} color={isReading ? theme.colors.accent : theme.colors.primary} strokeWidth={2.3} />}
            label={isReading ? 'Stop' : 'Read Aloud'}
            onPress={handleReadAloud}
            theme={theme}
            active={isReading}
          />
          <QuickAction
            icon={<PenLine size={18} color={theme.colors.primary} strokeWidth={2.3} />}
            label="Take Notes"
            onPress={() => triggerHaptic('selection')}
            theme={theme}
          />
          <QuickAction
            icon={<HelpCircle size={18} color={theme.colors.primary} strokeWidth={2.3} />}
            label="Generate Quiz"
            onPress={() => {
              triggerHaptic('medium');
              router.push('/(tabs)/quiz');
            }}
            theme={theme}
          />
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Text style={[styles.contentSectionTitle, { color: theme.colors.textPrimary }]}>
            Lesson Content
          </Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            {lessonContent.split('\n\n').map((para, i) => {
              if (para.startsWith('## ')) {
                return (
                  <Animated.View key={i} entering={FadeInDown.delay(i * 40).duration(400)}>
                    <Text style={[styles.contentHeading, { color: theme.colors.textPrimary }]}>
                      {para.replace('## ', '')}
                    </Text>
                  </Animated.View>
                );
              }
              if (para.startsWith('### ')) {
                return (
                  <Animated.View key={i} entering={FadeInDown.delay(i * 40).duration(400)}>
                    <Text style={[styles.contentSubHeading, { color: theme.colors.accent }]}>
                      {para.replace('### ', '')}
                    </Text>
                  </Animated.View>
                );
              }
              return (
                <Animated.View key={i} entering={FadeInDown.delay(i * 40).duration(400)}>
                  <Text style={[styles.contentText, { color: theme.colors.textPrimary }]}>
                    {para.replace(/\*\*/g, '').replace(/\*/g, '')}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Tags */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View style={styles.tagsRow}>
            {lesson.tags.map((tag) => (
              <View key={tag} style={[styles.tagChip, { backgroundColor: theme.colors.accentLight }]}>
                <Text style={[styles.tagText, { color: theme.colors.accent }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 16, marginTop: 32, gap: 10 }}>
          <AppButton
            label={lesson.progress === 100 ? 'Completed ✓' : 'Mark as Complete'}
            onPress={handleStartLearning}
            fullWidth
            size="lg"
            variant={lesson.progress === 100 ? 'outline' : 'accent'}
            icon={lesson.progress === 100 ? <CheckCircle size={18} color={theme.colors.success} strokeWidth={2.3} /> : undefined}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const QuickAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  theme: any;
  active?: boolean;
}> = ({ icon, label, onPress, theme, active }) => {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.93, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    onPress();
  }, [onPress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.quickAction,
        animatedStyle,
        {
          backgroundColor: active ? theme.colors.accent + '15' : theme.colors.card,
          borderColor: active ? theme.colors.accent + '40' : theme.colors.border,
        },
      ]}
    >
      {icon}
      <Text style={[styles.quickActionLabel, { color: active ? theme.colors.accent : theme.colors.textPrimary }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  // Hero
  heroWrap: {
    position: 'relative',
  },
  heroOrb1: {
    position: 'absolute',
    top: 20,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroOrb2: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNavActions: {
    flexDirection: 'row',
    gap: 8,
  },
  subjectBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  subjectBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  offlineBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  lessonTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  lessonDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  progressWrap: {
    marginTop: 14,
    gap: 6,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '700',
  },
  // Quick actions
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Content
  contentSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  contentHeading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 24,
    marginTop: 8,
  },
  contentSubHeading: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 21,
    marginTop: 4,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
