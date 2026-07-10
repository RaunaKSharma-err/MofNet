import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/store/authStore';
import { triggerHaptic } from '@/src/utils/haptics';
import { mockTeacherAnalytics, subjectMeta } from '@/src/mocks';
import {
  Users,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Award,
  ArrowLeft,
  Sparkles,
  Clock,
  Target,
  BarChart3,
} from 'lucide-react-native';
import { ProgressRing } from '@/src/components/ProgressRing';
import { AppButton } from '@/src/components/AppButton';

const { width } = Dimensions.get('window');

export default function TeacherDashboardScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const data = mockTeacherAnalytics;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Animated.View entering={FadeInDown.duration(500)}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2.5} />
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100).duration(500)} style={{ marginTop: 16 }}>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}
            </Text>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              {user?.name || 'Teacher'} Dashboard
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Monitor class progress and student engagement
            </Text>
          </Animated.View>
        </View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(0,105,137,0.12)' }]}>
                <Users size={20} color="#006989" strokeWidth={2.3} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {data.totalStudents}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Total Students
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(23,193,178,0.12)' }]}>
                <TrendingUp size={20} color="#17C3B2" strokeWidth={2.3} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {data.activeToday}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Active Today
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                <MessageSquare size={20} color="#F59E0B" strokeWidth={2.3} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {data.totalQuestions}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Questions Asked
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
                <Award size={20} color="#8B5CF6" strokeWidth={2.3} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {data.avgQuizScore}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Avg Quiz Score
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => triggerHaptic('light')}
              style={[styles.actionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <BookOpen size={22} color="#006989" strokeWidth={2.3} />
              <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>Assign Lesson</Text>
            </Pressable>
            <Pressable
              onPress={() => triggerHaptic('light')}
              style={[styles.actionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <BarChart3 size={22} color="#17C3B2" strokeWidth={2.3} />
              <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>View Reports</Text>
            </Pressable>
            <Pressable
              onPress={() => triggerHaptic('light')}
              style={[styles.actionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <Target size={22} color="#F59E0B" strokeWidth={2.3} />
              <Text style={[styles.actionLabel, { color: theme.colors.textPrimary }]}>Create Quiz</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Weak Topics */}
        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View style={styles.sectionHeader}>
            <Target size={18} color={theme.colors.warning} strokeWidth={2.5} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Topics to Review</Text>
          </View>
          <View style={{ gap: 10 }}>
            {data.weakTopics.map((topic, i) => (
              <View
                key={topic.topic}
                style={[styles.weakTopicRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.weakTopicName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {topic.topic}
                  </Text>
                  <Text style={[styles.weakTopicAccuracy, { color: theme.colors.warning }]}>
                    {topic.accuracy}% accuracy
                  </Text>
                </View>
                <View style={[styles.accuracyBadge, { backgroundColor: theme.colors.warning + '18' }]}>
                  <Text style={[styles.accuracyText, { color: theme.colors.warning }]}>
                    {topic.accuracy}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Subject Performance */}
        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Subject Performance</Text>
          <View style={{ gap: 12 }}>
            {data.subjectPerformance.map((subj) => (
              <View
                key={subj.subject}
                style={[styles.subjectRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              >
                <View style={[styles.subjectIcon, { backgroundColor: subj.color + '20' }]}>
                  <Sparkles size={16} color={subj.color} strokeWidth={2.3} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subjectName, { color: theme.colors.textPrimary }]}>
                    {subj.subject}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${subj.score}%`, backgroundColor: subj.color },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.subjectScore, { color: theme.colors.textPrimary }]}>
                  {subj.score}%
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Engagement Chart (simple bar chart) */}
        <Animated.View entering={FadeInUp.delay(600).duration(500)} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={18} color={theme.colors.accent} strokeWidth={2.5} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Weekly Engagement</Text>
          </View>
          <View style={[styles.chartCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.chartBars}>
              {data.engagementByDay.map((day, i) => {
                const maxVal = Math.max(...data.engagementByDay.map((d) => d.value));
                const heightPercent = maxVal > 0 ? (day.value / maxVal) * 100 : 0;
                return (
                  <View key={day.day} style={styles.chartBarCol}>
                    <Text style={[styles.chartValue, { color: theme.colors.textSecondary }]}>
                      {day.value}
                    </Text>
                    <View style={[styles.chartBarTrack, { backgroundColor: theme.colors.border + '40' }]}>
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor: theme.colors.accent,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartLabel, { color: theme.colors.textTertiary }]}>
                      {day.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  weakTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  weakTopicName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  weakTopicAccuracy: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  accuracyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  subjectIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectScore: {
    fontSize: 15,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'right',
  },
  chartCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    gap: 8,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartValue: {
    fontSize: 10,
    fontWeight: '700',
  },
  chartBarTrack: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
