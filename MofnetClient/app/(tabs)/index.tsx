import React, { useCallback, useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  FadeIn,
  FadeInDown,
  SlideInRight,
  Easing,
} from 'react-native-reanimated';
import {
  Sparkles,
  Mic,
  BookOpen,
  HelpCircle,
  Download,
  Bookmark,
  Flame,
  Award,
  ChevronRight,
  Wifi,
  Share2,
  Mountain,
  Clock,
  CheckCircle,
  Bot,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/store/authStore';
import { useMeshStore } from '@/src/store/meshStore';
import { useLibraryStore } from '@/src/store/libraryStore';
import { triggerHaptic } from '@/src/utils/haptics';
import { formatTimeAgo } from '@/src/utils/format';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { HeroCard } from '@/src/components/HeroCard';
import { ProgressRing } from '@/src/components/ProgressRing';
import { AnimatedCard } from '@/src/components/AnimatedCard';
import { StatCard } from '@/src/components/StatCard';
import { mockSubjects, mockActivity, mockBadges, subjectMeta } from '@/src/mocks';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const meshStatus = useMeshStore((s) => s.status);
  const checkBackendConnection = useMeshStore((s) => s.checkBackendConnection);

  const [refreshing, setRefreshing] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Namaste';
    if (hour < 17) return 'Namaste';
    return 'Namaste';
  }, []);

  const connectionConfig = {
    offline: { label: 'Offline', color: theme.colors.warning, icon: <Wifi size={11} color={theme.colors.warning} strokeWidth={2.5} /> },
    online: { label: 'Online', color: theme.colors.success, icon: <Wifi size={11} color={theme.colors.success} strokeWidth={2.5} /> },
    mesh: { label: 'Mesh Connected', color: theme.colors.accent, icon: <Share2 size={11} color={theme.colors.accent} strokeWidth={2.5} /> },
  }[meshStatus];

  const quickActions = [
    { label: 'AI Tutor', icon: Sparkles, color: '#006989', bg: 'rgba(0,105,137,0.10)', href: '/(tabs)/tutor' },
    { label: 'Voice', icon: Mic, color: '#17C3B2', bg: 'rgba(23,193,178,0.10)', href: '/(tabs)/tutor' },
    { label: 'Library', icon: BookOpen, color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', href: '/(tabs)/library' },
    { label: 'Quiz', icon: HelpCircle, color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', href: '/(tabs)/quiz' },
    { label: 'Downloads', icon: Download, color: '#EF4444', bg: 'rgba(239,68,68,0.10)', href: '/(tabs)/library' },
    { label: 'Saved', icon: Bookmark, color: '#06B6D4', bg: 'rgba(6,182,212,0.10)', href: '/(tabs)/library' },
  ];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    triggerHaptic('light');
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        {/* Hero header with mountain background */}
        <HeroHeader
          greeting={greeting}
          userName={user?.name || 'Student'}
          grade={user?.grade || 7}
          connectionConfig={connectionConfig}
          xp={user?.xp || 0}
          streak={user?.streak || 0}
          theme={theme}
        />

        {/* AI Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <HeroCard
            title="Ask MofNet AI"
            subtitle="Your offline AI tutor — curriculum-aware, voice-enabled, always ready."
            progress={0}
            features={['Voice Enabled', 'Curriculum Aware', 'Offline Ready']}
            ctaLabel="Start Learning"
            onCtaPress={() => router.push('/(tabs)/tutor')}
            icon={
              <View style={styles.aiCardIcon}>
                <LinearGradient colors={['#FFFFFF', 'rgba(255,255,255,0.8)']} style={styles.aiCardIconGradient}>
                  <Bot size={20} color="#006989" strokeWidth={2.5} />
                </LinearGradient>
              </View>
            }
          />
        </Animated.View>

        {/* Quick Actions Grid */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <SectionTitle title="Quick Actions" theme={theme} />
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, i) => (
              <Animated.View
                key={action.label}
                entering={FadeInDown.delay(300 + i * 60).duration(500)}
                style={{ flex: 1 }}
              >
                <AnimatedCard
                  onPress={() => {
                    triggerHaptic('light');
                    router.push(action.href as any);
                  }}
                  style={[styles.quickActionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                    <action.icon size={20} color={action.color} strokeWidth={2.3} />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {action.label}
                  </Text>
                </AnimatedCard>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Learning Journey */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <SectionTitle title="Learning Journey" theme={theme} actionLabel="See all" onAction={() => router.push('/(tabs)/library')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 16 }}
          >
            {mockSubjects.map((subject, i) => (
              <Animated.View
                key={subject.subject}
                entering={SlideInRight.delay(400 + i * 80).duration(500)}
              >
                <SubjectProgressCard subject={subject} theme={theme} onPress={() => router.push('/(tabs)/library')} />
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Streak & XP */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <View style={styles.streakRow}>
            <Animated.View entering={FadeInDown.delay(500).duration(500)} style={{ flex: 1 }}>
              <StatCard
                label="Day Streak"
                value={user?.streak || 0}
                icon={<Flame size={18} color="#FFFFFF" strokeWidth={2.3} />}
                gradient={['#FF6B35', '#F59E0B']}
                trend="🔥 Active"
                onPress={() => triggerHaptic('light')}
              />
            </Animated.View>
            <View style={{ width: 12 }} />
            <Animated.View entering={FadeInDown.delay(560).duration(500)} style={{ flex: 1 }}>
              <StatCard
                label="Total XP"
                value={user?.xp || 0}
                icon={<Zap size={18} color="#FFFFFF" strokeWidth={2.3} />}
                gradient={['#006989', '#17C3B2']}
                trend="+50 today"
                onPress={() => triggerHaptic('light')}
              />
            </Animated.View>
          </View>
        </View>

        {/* Badges */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <SectionTitle title="Badges Earned" theme={theme} actionLabel="View all" onAction={() => triggerHaptic('selection')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 16 }}
          >
            {mockBadges.map((badge, i) => (
              <Animated.View
                key={badge.id}
                entering={SlideInRight.delay(600 + i * 60).duration(500)}
              >
                <BadgeCard badge={badge} theme={theme} />
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Motivational Banner */}
        <Animated.View entering={FadeInDown.delay(700).duration(600)} style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <MotivationalBanner theme={theme} streak={user?.streak || 0} />
        </Animated.View>

        {/* Recent Activity */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <SectionTitle title="Recent Activity" theme={theme} />
          <View style={{ gap: 8 }}>
            {mockActivity.map((item, i) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(800 + i * 50).duration(400)}
              >
                <ActivityItemCard item={item} theme={theme} />
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const HeroHeader: React.FC<{
  greeting: string;
  userName: string;
  grade: number;
  connectionConfig: { label: string; color: string; icon: React.ReactNode };
  xp: number;
  streak: number;
  theme: any;
}> = ({ greeting, userName, grade, connectionConfig, xp, streak, theme }) => {
  return (
    <View style={styles.heroHeaderWrap}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroHeader}
      >
        {/* Decorative mountains */}
        <View style={styles.heroMountains}>
          <View style={[styles.heroMountain, styles.heroMountain1]} />
          <View style={[styles.heroMountain, styles.heroMountain2]} />
          <View style={[styles.heroMountain, styles.heroMountain3]} />
        </View>
        <View style={styles.heroOrb} />

        <View style={styles.heroContent}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Animated.Text
                entering={FadeIn.delay(100).duration(600)}
                style={styles.heroGreeting}
              >
                {greeting} 👋
              </Animated.Text>
              <Animated.Text
                entering={FadeIn.delay(200).duration(600)}
                style={styles.heroName}
              >
                {userName}
              </Animated.Text>
            </View>
            <Animated.View entering={FadeIn.delay(300).duration(600)}>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeBadgeText}>Grade {grade}</Text>
              </View>
            </Animated.View>
          </View>

          <Animated.View entering={FadeIn.delay(400).duration(600)} style={styles.heroStatusRow}>
            <View style={styles.aiReadyChip}>
              <View style={styles.aiReadyDot} />
              <Text style={styles.aiReadyText}>Offline AI Ready</Text>
            </View>
            <View style={[styles.connectionChip, { backgroundColor: connectionConfig.color + '25' }]}>
              {connectionConfig.icon}
              <Text style={[styles.connectionText, { color: connectionConfig.color }]}>
                {connectionConfig.label}
              </Text>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
};

const SectionTitle: React.FC<{ title: string; theme: any; actionLabel?: string; onAction?: () => void }> = ({
  title,
  theme,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
      {actionLabel && (
        <Pressable
          onPress={() => {
            triggerHaptic('selection');
            onAction?.();
          }}
          style={styles.sectionAction}
        >
          <Text style={[styles.sectionActionText, { color: theme.colors.accent }]}>{actionLabel}</Text>
          <ChevronRight size={14} color={theme.colors.accent} strokeWidth={2.5} />
        </Pressable>
      )}
    </View>
  );
};

const SubjectProgressCard: React.FC<{ subject: typeof mockSubjects[0]; theme: any; onPress: () => void }> = ({
  subject,
  theme,
  onPress,
}) => {
  const meta = subjectMeta[subject.subject];
  return (
    <AnimatedCard
      onPress={onPress}
      style={[styles.subjectCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <ProgressRing
        progress={subject.progress}
        size={64}
        strokeWidth={6}
        color={subject.color}
      >
        <Text style={[styles.subjectProgressText, { color: theme.colors.textPrimary }]}>
          {subject.progress}%
        </Text>
      </ProgressRing>
      <Text style={[styles.subjectLabel, { color: theme.colors.textPrimary }]} numberOfLines={1}>
        {subject.label}
      </Text>
      <Text style={[styles.subjectMeta, { color: theme.colors.textSecondary }]}>
        {subject.lessonsCompleted}/{subject.totalLessons} lessons
      </Text>
    </AnimatedCard>
  );
};

const BadgeCard: React.FC<{ badge: typeof mockBadges[0]; theme: any }> = ({ badge, theme }) => {
  const earned = badge.earnedAt != null;
  return (
    <View
      style={[
        styles.badgeCard,
        {
          backgroundColor: earned ? theme.colors.accentLight : theme.colors.card,
          borderColor: earned ? theme.colors.accent + '40' : theme.colors.border,
          opacity: earned ? 1 : 0.5,
        },
      ]}
    >
      <View style={[styles.badgeIconWrap, { backgroundColor: earned ? theme.colors.accent : theme.colors.textTertiary }]}>
        <Award size={20} color="#FFFFFF" strokeWidth={2.3} />
      </View>
      <Text style={[styles.badgeName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
        {badge.name}
      </Text>
      <Text style={[styles.badgeDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {badge.description}
      </Text>
    </View>
  );
};

const MotivationalBanner: React.FC<{ theme: any; streak: number }> = ({ theme, streak }) => {
  return (
    <LinearGradient
      colors={['#17C3B2', '#0FA396']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.motivationalBanner}
    >
      <View style={styles.motivationalOrb} />
      <View style={{ flex: 1 }}>
        <Text style={styles.motivationalTitle}>
          {streak > 0 ? `${streak} days strong! Keep going 🔥` : 'Start your streak today!'}
        </Text>
        <Text style={styles.motivationalSubtitle}>
          Learn for 10 minutes daily to build your knowledge and earn XP
        </Text>
      </View>
      <Flame size={32} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />
    </LinearGradient>
  );
};

const ActivityItemCard: React.FC<{ item: typeof mockActivity[0]; theme: any }> = ({ item, theme }) => {
  const iconBg = {
    quiz: 'rgba(245,158,11,0.12)',
    lesson: 'rgba(23,193,178,0.12)',
    chat: 'rgba(0,105,137,0.12)',
    badge: 'rgba(139,92,246,0.12)',
    bookmark: 'rgba(6,182,212,0.12)',
  }[item.type];

  const iconColor = {
    quiz: '#F59E0B',
    lesson: '#17C3B2',
    chat: '#006989',
    badge: '#8B5CF6',
    bookmark: '#06B6D4',
  }[item.type];

  const IconMap: Record<string, any> = {
    'check-circle': CheckCircle,
    'book-open': BookOpen,
    'sparkles': Sparkles,
    'award': Award,
    'bookmark': Bookmark,
  };
  const Icon = IconMap[item.icon] || CheckCircle;

  return (
    <View style={[styles.activityItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={[styles.activityIcon, { backgroundColor: iconBg }]}>
        <Icon size={16} color={iconColor} strokeWidth={2.3} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.activityTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.activitySubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>
      <Text style={[styles.activityTime, { color: theme.colors.textTertiary }]}>
        {formatTimeAgo(item.timestamp)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Hero header
  heroHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: -20,
  },
  heroHeader: {
    borderRadius: 28,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  heroMountains: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  heroMountain: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroMountain1: {
    width: 120,
    height: 70,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  heroMountain2: {
    width: 160,
    height: 110,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    marginLeft: -20,
  },
  heroMountain3: {
    width: 100,
    height: 60,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    marginLeft: -15,
  },
  heroOrb: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroContent: {
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroGreeting: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  gradeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  gradeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroStatusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  aiReadyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  aiReadyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  aiReadyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  connectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // AI Card icon
  aiCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  aiCardIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Section title
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  // Quick actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 32 - 12) / 2,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  // Subject progress
  subjectCard: {
    width: 130,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  subjectProgressText: {
    fontSize: 13,
    fontWeight: '800',
  },
  subjectLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  subjectMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Streak row
  streakRow: {
    flexDirection: 'row',
  },
  // Badges
  badgeCard: {
    width: 130,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeDesc: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  // Motivational banner
  motivationalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  motivationalOrb: {
    position: 'absolute',
    top: -25,
    right: 40,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  motivationalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  motivationalSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 17,
  },
  // Activity
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  activitySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  activityTime: {
    fontSize: 11,
    fontWeight: '600',
  },
});
