import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
  SlideInRight,
  SlideInUp,
  Easing,
} from "react-native-reanimated";
import {
  ArrowLeft,
  Server,
  Users,
  Sparkles,
  Target,
  TrendingDown,
  Activity,
  Award,
  Zap,
  BarChart3,
  Flame,
} from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { triggerHaptic } from "@/src/utils/haptics";
import { mockTeacherAnalytics, subjectMeta } from "@/src/mocks";

const { width } = Dimensions.get("window");

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const data = mockTeacherAnalytics;

  const handleClose = useCallback(() => {
    triggerHaptic("light");
    router.back();
  }, [router]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={handleClose} style={styles.backBtn}>
            <ArrowLeft
              size={22}
              color={theme.colors.textPrimary}
              strokeWidth={2.5}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
            >
              Teacher Dashboard
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Analytics & insights
            </Text>
          </View>
        </View>

        {/* Top stats */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <View style={styles.topStatsRow}>
            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              style={{ flex: 1 }}
            >
              <StatCardBig
                icon={<Users size={18} color="#FFFFFF" strokeWidth={2.3} />}
                label="Total Students"
                value={data.totalStudents}
                gradient={["#006989", "#004F66"]}
                theme={theme}
              />
            </Animated.View>
            <View style={{ width: 10 }} />
            <Animated.View
              entering={FadeInDown.delay(160).duration(500)}
              style={{ flex: 1 }}
            >
              <StatCardBig
                icon={<Activity size={18} color="#FFFFFF" strokeWidth={2.3} />}
                label="Active Today"
                value={data.activeToday}
                gradient={["#17C3B2", "#0FA396"]}
                theme={theme}
              />
            </Animated.View>
            <View style={{ width: 10 }} />
            <Animated.View
              entering={FadeInDown.delay(220).duration(500)}
              style={{ flex: 1 }}
            >
              <StatCardBig
                icon={<Sparkles size={18} color="#FFFFFF" strokeWidth={2.3} />}
                label="Questions"
                value={data.totalQuestions}
                gradient={["#8B5CF6", "#6D28D9"]}
                theme={theme}
              />
            </Animated.View>
          </View>
        </View>

        {/* Engagement chart */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <BarChart3
                    size={16}
                    color={theme.colors.accent}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Weekly Engagement
                  </Text>
                </View>
                <View
                  style={[
                    styles.cardBadge,
                    { backgroundColor: theme.colors.accentLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.cardBadgeText,
                      { color: theme.colors.accent },
                    ]}
                  >
                    +18%
                  </Text>
                </View>
              </View>
              <BarChart data={data.engagementByDay} theme={theme} />
            </View>
          </Animated.View>
        </View>

        {/* Top questions */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Sparkles
                    size={16}
                    color={theme.colors.primary}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Most Asked Questions
                  </Text>
                </View>
              </View>
              <View style={{ gap: 10 }}>
                {data.topQuestions.map((q, i) => (
                  <Animated.View
                    key={q.question}
                    entering={SlideInRight.delay(450 + i * 60).duration(400)}
                    style={styles.questionRow}
                  >
                    <View
                      style={[
                        styles.questionRank,
                        { backgroundColor: theme.colors.primaryLight },
                      ]}
                    >
                      <Text
                        style={[
                          styles.questionRankText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {i + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text
                        style={[
                          styles.questionText,
                          { color: theme.colors.textPrimary },
                        ]}
                        numberOfLines={2}
                      >
                        {q.question}
                      </Text>
                      <View style={styles.questionMetaRow}>
                        <View
                          style={[
                            styles.subjectMiniChip,
                            {
                              backgroundColor:
                                subjectMeta[q.subject].color + "18",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.subjectMiniText,
                              { color: subjectMeta[q.subject].color },
                            ]}
                          >
                            {subjectMeta[q.subject].label}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.questionCount,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {q.count} questions
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Weak topics */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Animated.View entering={FadeInDown.delay(500).duration(500)}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <TrendingDown
                    size={16}
                    color={theme.colors.warning}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Knowledge Gaps
                  </Text>
                </View>
              </View>
              <View style={{ gap: 12 }}>
                {data.weakTopics.map((topic, i) => (
                  <Animated.View
                    key={topic.topic}
                    entering={SlideInRight.delay(550 + i * 60).duration(400)}
                  >
                    <View style={styles.weakTopicRow}>
                      <View style={{ flex: 1, gap: 6 }}>
                        <View style={styles.weakTopicHeader}>
                          <Text
                            style={[
                              styles.weakTopicName,
                              { color: theme.colors.textPrimary },
                            ]}
                            numberOfLines={1}
                          >
                            {topic.topic}
                          </Text>
                          <Text
                            style={[
                              styles.weakTopicAccuracy,
                              {
                                color:
                                  topic.accuracy < 50
                                    ? theme.colors.error
                                    : theme.colors.warning,
                              },
                            ]}
                          >
                            {topic.accuracy}%
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.weakTopicBar,
                            { backgroundColor: theme.colors.border },
                          ]}
                        >
                          <View
                            style={[
                              styles.weakTopicFill,
                              {
                                width: `${topic.accuracy}%`,
                                backgroundColor:
                                  topic.accuracy < 50
                                    ? theme.colors.error
                                    : theme.colors.warning,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Subject performance */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Animated.View entering={FadeInDown.delay(600).duration(500)}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Award
                    size={16}
                    color={theme.colors.accent}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Subject Performance
                  </Text>
                </View>
              </View>
              <View style={{ gap: 12 }}>
                {data.subjectPerformance.map((subj, i) => (
                  <Animated.View
                    key={subj.subject}
                    entering={SlideInRight.delay(650 + i * 60).duration(400)}
                  >
                    <View style={styles.subjectPerfRow}>
                      <View
                        style={[
                          styles.subjectPerfDot,
                          { backgroundColor: subj.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.subjectPerfName,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {subj.subject}
                      </Text>
                      <View
                        style={[
                          styles.subjectPerfBar,
                          { backgroundColor: theme.colors.border },
                        ]}
                      >
                        <View
                          style={[
                            styles.subjectPerfFill,
                            {
                              width: `${subj.score}%`,
                              backgroundColor: subj.color,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.subjectPerfScore,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {subj.score}%
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Learning heatmap */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Animated.View entering={FadeInDown.delay(700).duration(500)}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Flame size={16} color="#FF6B35" strokeWidth={2.5} />
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Learning Heatmap
                  </Text>
                </View>
              </View>
              <Heatmap data={data.heatmap} theme={theme} />
              <View style={styles.heatLegend}>
                <Text
                  style={[
                    styles.heatLegendText,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Less
                </Text>
                <View style={styles.heatLegendGradient}>
                  {[0.2, 0.4, 0.6, 0.8, 1].map((o, i) => (
                    <View
                      key={i}
                      style={[
                        styles.heatLegendBox,
                        { backgroundColor: theme.colors.accent, opacity: o },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={[
                    styles.heatLegendText,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  More
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const StatCardBig: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  gradient: [string, string];
  theme: any;
}> = ({ icon, label, value, gradient, theme }) => {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statCardBig}
    >
      <View style={styles.statCardOrb} />
      <View style={styles.statCardIconWrap}>{icon}</View>
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={styles.statCardLabel}>{label}</Text>
    </LinearGradient>
  );
};

const BarChart: React.FC<{
  data: Array<{ day: string; value: number }>;
  theme: any;
}> = ({ data, theme }) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  return (
    <View style={styles.barChartWrap}>
      {data.map((d, i) => {
        const heightPct = (d.value / maxValue) * 100;
        return (
          <View key={d.day} style={styles.barChartCol}>
            <Animated.View
              entering={SlideInUp.delay(i * 80).duration(500)}
              style={[
                styles.barChartBar,
                {
                  height: `${heightPct}%`,
                  backgroundColor:
                    i === 2
                      ? theme.colors.accent
                      : i === 4
                        ? theme.colors.warning + "60"
                        : theme.colors.primary + "40",
                },
              ]}
            />
            <Text
              style={[
                styles.barChartLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              {d.day}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const Heatmap: React.FC<{
  data: Array<{ hour: number; day: number; value: number }>;
  theme: any;
}> = ({ data, theme }) => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <View style={styles.heatmapWrap}>
      <View style={styles.heatmapGrid}>
        {data.slice(0, 7 * 12).map((cell, i) => (
          <View
            key={i}
            style={[
              styles.heatmapCell,
              {
                backgroundColor:
                  cell.value > 0
                    ? theme.colors.accent
                    : theme.colors.borderLight,
                opacity:
                  cell.value > 0 ? Math.max(0.15, cell.value / 100) : 0.3,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.heatmapDays}>
        {days.map((d, i) => (
          <Text
            key={i}
            style={[styles.heatmapDay, { color: theme.colors.textTertiary }]}
          >
            {d}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 1,
  },
  // Top stats
  topStatsRow: {
    flexDirection: "row",
  },
  statCardBig: {
    borderRadius: 20,
    padding: 14,
    overflow: "hidden",
    position: "relative",
  },
  statCardOrb: {
    position: "absolute",
    top: -15,
    right: -10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statCardIconWrap: {
    marginBottom: 8,
  },
  statCardValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  statCardLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  // Card
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  // Bar chart
  barChartWrap: {
    flexDirection: "row",
    gap: 8,
    height: 120,
    alignItems: "flex-end",
  },
  barChartCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    height: "100%",
    justifyContent: "flex-end",
  },
  barChartBar: {
    width: "100%",
    borderRadius: 6,
    minHeight: 8,
  },
  barChartLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Questions
  questionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  questionRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  questionRankText: {
    fontSize: 13,
    fontWeight: "800",
  },
  questionText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  questionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subjectMiniChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  subjectMiniText: {
    fontSize: 9,
    fontWeight: "700",
  },
  questionCount: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Weak topics
  weakTopicRow: {},
  weakTopicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weakTopicName: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  weakTopicAccuracy: {
    fontSize: 14,
    fontWeight: "800",
  },
  weakTopicBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  weakTopicFill: {
    height: "100%",
    borderRadius: 3,
  },
  // Subject performance
  subjectPerfRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  subjectPerfDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  subjectPerfName: {
    fontSize: 13,
    fontWeight: "600",
    width: 70,
  },
  subjectPerfBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  subjectPerfFill: {
    height: "100%",
    borderRadius: 4,
  },
  subjectPerfScore: {
    fontSize: 13,
    fontWeight: "800",
    width: 40,
    textAlign: "right",
  },
  // Heatmap
  heatmapWrap: {
    gap: 6,
  },
  heatmapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  heatmapCell: {
    width: (width - 80) / 12 - 3,
    height: 18,
    borderRadius: 3,
  },
  heatmapDays: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  heatmapDay: {
    fontSize: 10,
    fontWeight: "700",
  },
  heatLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 12,
  },
  heatLegendText: {
    fontSize: 10,
    fontWeight: "600",
  },
  heatLegendGradient: {
    flexDirection: "row",
    gap: 2,
  },
  heatLegendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
