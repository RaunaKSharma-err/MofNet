import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  FadeIn,
  FadeInDown,
  SlideInUp,
  SlideInRight,
  ZoomIn,
  Easing,
  cancelAnimation,
  withRepeat,
} from 'react-native-reanimated';
import {
  HelpCircle,
  Clock,
  ChevronRight,
  Check,
  X,
  Award,
  Flame,
  Zap,
  Trophy,
  RotateCcw,
  Share,
  Target,
  TrendingDown,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useQuizStore } from '@/src/store/quizStore';
import { useAuthStore } from '@/src/store/authStore';
import { triggerHaptic } from '@/src/utils/haptics';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { QuizCard } from '@/src/components/QuizCard';
import { AppButton } from '@/src/components/AppButton';
import { ProgressRing } from '@/src/components/ProgressRing';
import { mockBadges } from '@/src/mocks';
import type { QuizResult } from '@/src/types';

const { width, height } = Dimensions.get('window');

export default function QuizScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'intro' | 'active' | 'results'>('intro');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const questions = useQuizStore((s) => s.questions);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const answers = useQuizStore((s) => s.answers);
  const timeLeft = useQuizStore((s) => s.timeLeft);
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const answer = useQuizStore((s) => s.answer);
  const next = useQuizStore((s) => s.next);
  const prev = useQuizStore((s) => s.prev);
  const reset = useQuizStore((s) => s.reset);
  const finish = useQuizStore((s) => s.finish);
  const setTimeLeft = useQuizStore((s) => s.setTimeLeft);
  const results = useQuizStore((s) => s.results);
  const addXp = useAuthStore((s) => s.addXp);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = answers[currentQuestion?.id];
  const showResult = Boolean(selectedAnswer);

  const prevIndexRef = useRef(currentIndex);
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }, 50);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (phase === 'active' && timeLeft > 0 && !showResult) {
      timerRef.current = setInterval(() => {
        setTimeLeft(Math.max(0, timeLeft - 1));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timeLeft, showResult, setTimeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && phase === 'active') {
      handleFinish();
    }
  }, [timeLeft, phase]);

  const handleStart = useCallback(() => {
    triggerHaptic('medium');
    startQuiz();
    setPhase('active');
  }, [startQuiz]);

  const handleAnswer = useCallback((ans: string) => {
    answer(currentQuestion.id, ans);
    triggerHaptic('selection');
  }, [answer, currentQuestion]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      triggerHaptic('light');
      next();
    } else {
      handleFinish();
    }
  }, [currentIndex, questions.length, next]);

  const handlePrev = useCallback(() => {
    triggerHaptic('light');
    prev();
  }, [prev]);

  const handleFinish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const r = finish();
    setResult(r);
    addXp(r.xpEarned);
    setPhase('results');
    triggerHaptic('success');
    if (r.score === r.total) {
      setShowConfetti(true);
    }
  }, [finish, addXp]);

  const handleRetry = useCallback(() => {
    triggerHaptic('light');
    reset();
    setResult(null);
    setShowConfetti(false);
    setPhase('intro');
  }, [reset]);

  const handleExit = useCallback(() => {
    triggerHaptic('light');
    reset();
    setResult(null);
    setShowConfetti(false);
    setPhase('intro');
  }, [reset]);

  if (phase === 'active') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.activeHeader, { paddingTop: insets.top }]}>
          <Pressable onPress={handleExit} style={styles.exitBtn}>
            <X size={20} color={theme.colors.textPrimary} strokeWidth={2.5} />
          </Pressable>
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressBarTrack, { backgroundColor: theme.colors.border }]}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${((currentIndex + 1) / questions.length) * 100}%`,
                    backgroundColor: theme.colors.accent,
                  },
                ]}
              />
            </View>
          </View>
          <View style={[styles.timerChip, { backgroundColor: timeLeft < 60 ? theme.colors.error + '18' : theme.colors.primaryLight }]}>
            <Clock size={13} color={timeLeft < 60 ? theme.colors.error : theme.colors.primary} strokeWidth={2.5} />
            <Text style={[styles.timerText, { color: timeLeft < 60 ? theme.colors.error : theme.colors.primary }]}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 20, paddingTop: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            key={currentIndex}
            entering={SlideInRight.duration(400).springify().damping(20)}
          >
            <QuizCard
              question={currentQuestion}
              index={currentIndex}
              total={questions.length}
              selectedAnswer={selectedAnswer}
              onAnswer={handleAnswer}
              showResult={showResult}
              timeLeft={timeLeft}
            />
          </Animated.View>

          {showResult && (
            <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.navRow}>
              <Pressable
                onPress={handlePrev}
                disabled={currentIndex === 0}
                style={[
                  styles.navBtn,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    opacity: currentIndex === 0 ? 0.4 : 1,
                  },
                ]}
              >
                <Text style={[styles.navBtnText, { color: theme.colors.textPrimary }]}>Previous</Text>
              </Pressable>
              <Pressable
                onPress={handleNext}
                style={[
                  styles.navBtn,
                  styles.navBtnPrimary,
                  { backgroundColor: theme.colors.accent },
                ]}
              >
                <Text style={styles.navBtnPrimaryText}>
                  {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
                </Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        result={result}
        theme={theme}
        insets={insets}
        onRetry={handleRetry}
        onExit={handleExit}
        showConfetti={showConfetti}
      />
    );
  }

  return <QuizIntroScreen theme={theme} insets={insets} onStart={handleStart} pastResults={results} />;
};

const QuizIntroScreen: React.FC<{
  theme: any;
  insets: any;
  onStart: () => void;
  pastResults: QuizResult[];
}> = ({ theme, insets, onStart, pastResults }) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Quiz" subtitle="Test your knowledge" large />

        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <LinearGradient
              colors={['#006989', '#17C3B2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.introHeroCard}
            >
              <View style={styles.introHeroOrb} />
              <View style={styles.introHeroOrb2} />
              <View style={styles.introHeroContent}>
                <View style={styles.introHeroIconWrap}>
                  <Trophy size={28} color="#FFFFFF" strokeWidth={2} />
                </View>
                <Text style={styles.introHeroTitle}>Challenge yourself</Text>
                <Text style={styles.introHeroSubtitle}>
                  Test your knowledge across all subjects.{'\n'}Earn XP, badges, and climb the ranks!
                </Text>
                <View style={styles.introHeroStats}>
                  <View style={styles.introStat}>
                    <Text style={styles.introStatValue}>8</Text>
                    <Text style={styles.introStatLabel}>Questions</Text>
                  </View>
                  <View style={styles.introStatDivider} />
                  <View style={styles.introStat}>
                    <Text style={styles.introStatValue}>10:00</Text>
                    <Text style={styles.introStatLabel}>Minutes</Text>
                  </View>
                  <View style={styles.introStatDivider} />
                  <View style={styles.introStat}>
                    <Text style={styles.introStatValue}>+120</Text>
                    <Text style={styles.introStatLabel}>Max XP</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Badges */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Available Badges</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 16, marginTop: 12 }}
          >
            {mockBadges.filter((b) => ['explorer', 'scholar', 'master'].includes(b.id)).map((badge, i) => (
              <Animated.View
                key={badge.id}
                entering={SlideInRight.delay(i * 80).duration(500)}
              >
                <View style={[styles.badgeCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <View style={[styles.badgeIconWrap, { backgroundColor: badge.earnedAt ? theme.colors.accent : theme.colors.borderLight }]}>
                    <Award size={24} color={badge.earnedAt ? '#FFFFFF' : theme.colors.textTertiary} strokeWidth={2.2} />
                  </View>
                  <Text style={[styles.badgeName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {badge.name}
                  </Text>
                  <Text style={[styles.badgeDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {badge.description}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Past results */}
        {pastResults.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Results</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              {pastResults.slice(0, 3).map((r, i) => (
                <Animated.View
                  key={r.id}
                  entering={FadeInDown.delay(i * 60).duration(400)}
                >
                  <View style={[styles.pastResultRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <ProgressRing
                      progress={(r.score / r.total) * 100}
                      size={48}
                      strokeWidth={4}
                      color={r.score === r.total ? theme.colors.success : r.score >= r.total * 0.7 ? theme.colors.accent : theme.colors.warning}
                    >
                      <Text style={[styles.pastResultScore, { color: theme.colors.textPrimary }]}>
                        {r.score}/{r.total}
                      </Text>
                    </ProgressRing>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pastResultTitle, { color: theme.colors.textPrimary }]}>
                        {r.title}
                      </Text>
                      <Text style={[styles.pastResultMeta, { color: theme.colors.textSecondary }]}>
                        {r.xpEarned} XP earned
                      </Text>
                    </View>
                    {r.badge && (
                      <View style={[styles.pastBadgeChip, { backgroundColor: theme.colors.accentLight }]}>
                        <Award size={12} color={theme.colors.accent} strokeWidth={2.5} />
                        <Text style={[styles.pastBadgeText, { color: theme.colors.accent }]}>
                          {r.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Start button */}
        <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
          <AppButton
            label="Start Quiz Challenge"
            onPress={onStart}
            fullWidth
            size="lg"
            icon={<Sparkles size={18} color="#FFFFFF" strokeWidth={2.5} />}
            iconPosition="left"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const ResultsScreen: React.FC<{
  result: QuizResult | null;
  theme: any;
  insets: any;
  onRetry: () => void;
  onExit: () => void;
  showConfetti: boolean;
}> = ({ result, theme, insets, onRetry, onExit, showConfetti }) => {
  if (!result) return null;
  const percentage = Math.round((result.score / result.total) * 100);
  const isPerfect = result.score === result.total;
  const isPassing = percentage >= 70;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {showConfetti && <ConfettiBurst />}
      <ScrollView
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={ZoomIn.duration(600)}>
          <View style={styles.resultHeroWrap}>
            <ProgressRing
              progress={percentage}
              size={140}
              strokeWidth={10}
              color={isPerfect ? theme.colors.success : isPassing ? theme.colors.accent : theme.colors.warning}
              showGlow
            >
              <View style={styles.resultScoreInner}>
                <Text style={[styles.resultScore, { color: theme.colors.textPrimary }]}>
                  {result.score}/{result.total}
                </Text>
                <Text style={[styles.resultPercentage, { color: theme.colors.textSecondary }]}>
                  {percentage}%
                </Text>
              </View>
            </ProgressRing>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ alignItems: 'center', marginTop: 20, paddingHorizontal: 32 }}>
          <Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
            {isPerfect ? 'Perfect Score! 🎉' : isPassing ? 'Great job! 👏' : 'Keep practicing 💪'}
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
            {isPerfect
              ? 'You mastered this quiz. You earned the Master badge!'
              : isPassing
              ? 'You\'re doing well. Review the weak topics and try again!'
              : 'You\'re learning. Every attempt makes you stronger.'}
          </Text>
        </Animated.View>

        {/* XP & Badge */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <View style={styles.resultStatsRow}>
            <Animated.View entering={SlideInRight.delay(300).duration(500)} style={{ flex: 1 }}>
              <View style={[styles.resultStatCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={[styles.resultStatIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                  <Zap size={18} color="#F59E0B" strokeWidth={2.3} />
                </View>
                <Text style={[styles.resultStatValue, { color: theme.colors.textPrimary }]}>
                  +{result.xpEarned}
                </Text>
                <Text style={[styles.resultStatLabel, { color: theme.colors.textSecondary }]}>
                  XP Earned
                </Text>
              </View>
            </Animated.View>
            <View style={{ width: 12 }} />
            <Animated.View entering={SlideInRight.delay(400).duration(500)} style={{ flex: 1 }}>
              <View style={[styles.resultStatCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={[styles.resultStatIcon, { backgroundColor: theme.colors.accentLight }]}>
                  <Award size={18} color={theme.colors.accent} strokeWidth={2.3} />
                </View>
                <Text style={[styles.resultStatValue, { color: theme.colors.textPrimary }]}>
                  {result.badge || '—'}
                </Text>
                <Text style={[styles.resultStatLabel, { color: theme.colors.textSecondary }]}>
                  Badge
                </Text>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Weak topics */}
        {result.weakTopics.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
            <View style={styles.weakHeader}>
              <Target size={16} color={theme.colors.warning} strokeWidth={2.5} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Topics to Review
              </Text>
            </View>
            <View style={{ gap: 8, marginTop: 12 }}>
              {result.weakTopics.map((topic, i) => (
                <Animated.View
                  key={`${topic}-${i}`}
                  entering={FadeInDown.delay(500 + i * 60).duration(400)}
                >
                  <View style={[styles.weakTopicRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.weakIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                      <TrendingDown size={14} color={theme.colors.warning} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.weakTopicText, { color: theme.colors.textPrimary }]}>
                      {topic}
                    </Text>
                    <Pressable
                      onPress={() => triggerHaptic('selection')}
                      style={[styles.reviewBtn, { backgroundColor: theme.colors.warning + '18' }]}
                    >
                      <Text style={[styles.reviewBtnText, { color: theme.colors.warning }]}>
                        Review
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={{ paddingHorizontal: 16, marginTop: 32, gap: 10 }}>
          <AppButton
            label="Retry Quiz"
            onPress={onRetry}
            fullWidth
            size="lg"
            variant="accent"
            icon={<RotateCcw size={18} color="#FFFFFF" strokeWidth={2.5} />}
            iconPosition="left"
          />
          <AppButton
            label="Share Achievement"
            onPress={() => triggerHaptic('selection')}
            fullWidth
            variant="outline"
            icon={<Share size={18} color={theme.colors.primary} strokeWidth={2.3} />}
            iconPosition="left"
          />
          <AppButton
            label="Back to Quiz Home"
            onPress={onExit}
            fullWidth
            variant="ghost"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const ConfettiBurst: React.FC = () => {
  const pieces = Array.from({ length: 30 });
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {pieces.map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
};

const ConfettiPiece: React.FC<{ index: number }> = ({ index }) => {
  const translateY = useSharedValue(-100);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const colors = ['#17C3B2', '#006989', '#F59E0B', '#EF4444', '#8B5CF6'];
    const startX = (Math.random() - 0.5) * width;
    translateX.value = startX;
    translateY.value = withDelay(
      Math.random() * 500,
      withTiming(height + 100, { duration: 2500 + Math.random() * 1000, easing: Easing.out(Easing.ease) })
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
    opacity.value = withDelay(2000, withTiming(0, { duration: 500 }));
  }, [index, translateY, translateX, rotate, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const colors = ['#17C3B2', '#006989', '#F59E0B', '#EF4444', '#8B5CF6'];
  const color = colors[index % colors.length];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -20,
          left: width / 2,
          width: 8,
          height: 12,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Active quiz
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  exitBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarWrap: {
    flex: 1,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  navBtnPrimary: {
    borderWidth: 0,
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  navBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Intro
  introHeroCard: {
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  introHeroOrb: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  introHeroOrb2: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  introHeroContent: {
    gap: 12,
  },
  introHeroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introHeroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  introHeroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  introHeroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 12,
  },
  introStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  introStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  introStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  introStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  // Badges
  badgeCard: {
    width: 130,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  badgeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  // Past results
  pastResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  pastResultScore: {
    fontSize: 12,
    fontWeight: '800',
  },
  pastResultTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pastResultMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  pastBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pastBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  // Results
  resultHeroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultScoreInner: {
    alignItems: 'center',
  },
  resultScore: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  resultPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  resultStatsRow: {
    flexDirection: 'row',
  },
  resultStatCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  resultStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultStatValue: {
    fontSize: 20,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  resultStatLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Weak topics
  weakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weakTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  weakIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weakTopicText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  reviewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
