import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeIn,
  SlideInRight,
  SlideInLeft,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Mountain,
  GraduationCap,
  Languages,
  Sparkles,
  Mic,
  Bell,
  HardDrive,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/store/authStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { triggerHaptic } from '@/src/utils/haptics';
import { AppButton } from '@/src/components/AppButton';
import type { Grade, Language } from '@/src/types';

const { width } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [permissions, setPermissions] = useState({ mic: false, notifications: false, storage: false });

  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const setLanguageStore = useSettingsStore((s) => s.setLanguage);

  const scrollRef = useRef<ScrollView>(null);
  const progressAnim = useSharedValue(0);

  const totalSteps = 5;

  const goToStep = useCallback((index: number) => {
    triggerHaptic('selection');
    setStep(index);
    progressAnim.value = withTiming(index / (totalSteps - 1), { duration: 400 });
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  }, [progressAnim]);

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) {
      goToStep(step + 1);
    } else {
      const finalName = name.trim() || 'Student';
      const finalGrade = grade || 7;
      setOnboardingComplete(finalGrade, language, finalName);
      setLanguageStore(language);
      triggerHaptic('success');
      onComplete();
    }
  }, [step, name, grade, language, setOnboardingComplete, setLanguageStore, onComplete, goToStep]);

  const handleBack = useCallback(() => {
    if (step > 0) goToStep(step - 1);
  }, [step, goToStep]);

  const canProceed = (() => {
    if (step === 0) return true;
    if (step === 1) return grade !== null;
    if (step === 2) return language !== null;
    if (step === 3) return true;
    if (step === 4) return true;
    return true;
  })();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Progress dots */}
      <View style={[styles.progressContainer, { paddingTop: insets.top + 12 }]}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <ProgressDot key={i} active={i === step} index={i} />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* Step 1: Welcome */}
        <View style={{ width }}>
          <Step1Welcome theme={theme} />
        </View>

        {/* Step 2: Grade Selection */}
        <View style={{ width }}>
          <Step2Grade theme={theme} grade={grade} setGrade={setGrade} />
        </View>

        {/* Step 3: Language */}
        <View style={{ width }}>
          <Step3Language theme={theme} language={language} setLanguage={setLanguage} />
        </View>

        {/* Step 4: Offline AI */}
        <View style={{ width }}>
          <Step4OfflineAI theme={theme} />
        </View>

        {/* Step 5: Permissions */}
        <View style={{ width }}>
          <Step5Permissions theme={theme} permissions={permissions} setPermissions={setPermissions} />
        </View>
      </ScrollView>

      {/* Navigation buttons */}
      <View style={[styles.navContainer, { paddingBottom: insets.bottom + 16 }]}>
        {step > 0 && (
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <ArrowLeft size={18} color={theme.colors.textSecondary} strokeWidth={2.5} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <AppButton
            label={step === totalSteps - 1 ? 'Start Learning' : 'Continue'}
            onPress={handleNext}
            disabled={!canProceed}
            fullWidth
            size="lg"
            icon={step === totalSteps - 1 ? <Check size={18} color="#FFFFFF" strokeWidth={3} /> : <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />}
            iconPosition="right"
          />
        </View>
      </View>
    </View>
  );
};

const ProgressDot: React.FC<{ active: boolean; index: number }> = ({ active, index }) => {
  const { theme } = useTheme();
  const width = useSharedValue(active ? 24 : 8);

  React.useEffect(() => {
    width.value = withSpring(active ? 24 : 8, { damping: 15, stiffness: 300 });
  }, [active, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: active ? theme.colors.accent : theme.colors.border },
        animatedStyle,
      ]}
    />
  );
};

/* ============ STEP 1: Welcome ============ */
const Step1Welcome: React.FC<{ theme: any }> = ({ theme }) => {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.illustrationWrap}>
        <LinearGradient
          colors={['#0A1014', '#0E2A33', '#0A1014']}
          style={styles.illustrationGradient}
        >
          {/* Mountain scene with mesh nodes */}
          <MountainSceneIllustration />
        </LinearGradient>
      </View>

      <View style={styles.textWrap}>
        <Animated.Text
          entering={FadeIn.delay(200).duration(600)}
          style={[styles.stepTitle, { color: theme.colors.textPrimary }]}
        >
          Your AI teacher works
          {'\n'}even without internet
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(400).duration(600)}
          style={[styles.stepDescription, { color: theme.colors.textSecondary }]}
        >
          MofNet brings intelligent learning to your village. Connect to your school&apos;s Edge AI hub and access curriculum-aware tutoring, voice lessons, and quizzes — all offline.
        </Animated.Text>
      </View>
    </View>
  );
};

const MountainSceneIllustration: React.FC = () => {
  const orbScale = useSharedValue(0);
  const orbOpacity = useSharedValue(0);

  React.useEffect(() => {
    orbScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 150 }));
    orbOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
  }, [orbScale, orbOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbOpacity.value,
  }));

  return (
    <View style={styles.mountainScene}>
      {/* Mountains */}
      <View style={styles.mountainsRow}>
        <View style={[styles.mountain, styles.mountain1]} />
        <View style={[styles.mountain, styles.mountain2]} />
        <View style={[styles.mountain, styles.mountain3]} />
      </View>

      {/* AI orb */}
      <Animated.View style={[styles.aiOrb, animatedStyle]}>
        <LinearGradient
          colors={['#17C3B2', '#006989']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiOrbGradient}
        >
          <Sparkles size={24} color="#FFFFFF" strokeWidth={2.5} />
        </LinearGradient>
        <View style={styles.aiOrbRing} />
      </Animated.View>

      {/* Connection lines (decorative) */}
      <View style={styles.connectionLine1} />
      <View style={styles.connectionLine2} />
      <View style={styles.connectionLine3} />

      {/* Student figure (abstract) */}
      <View style={styles.studentFigure}>
        <View style={styles.studentHead} />
        <View style={styles.studentBody} />
      </View>
    </View>
  );
};

/* ============ STEP 2: Grade Selection ============ */
const Step2Grade: React.FC<{
  theme: any;
  grade: Grade | null;
  setGrade: (g: Grade) => void;
}> = ({ theme, grade, setGrade }) => {
  const grades: Grade[] = [6, 7, 8, 9, 10];

  return (
    <View style={styles.stepContainer}>
      <View style={[styles.stepHeader, { marginTop: 20 }]}>
        <View style={[styles.stepIconWrap, { backgroundColor: theme.colors.primaryLight }]}>
          <GraduationCap size={28} color={theme.colors.primary} strokeWidth={2.2} />
        </View>
        <Text style={[styles.stepTitle, { color: theme.colors.textPrimary, fontSize: 24 }]}>
          Select your grade
        </Text>
        <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
          We&apos;ll personalize your curriculum accordingly
        </Text>
      </View>

      <View style={styles.gradeGrid}>
        {grades.map((g, i) => (
          <GradeCard
            key={g}
            grade={g}
            selected={grade === g}
            onSelect={() => {
              triggerHaptic('medium');
              setGrade(g);
            }}
            theme={theme}
            index={i}
          />
        ))}
      </View>
    </View>
  );
};

const GradeCard: React.FC<{
  grade: Grade;
  selected: boolean;
  onSelect: () => void;
  theme: any;
  index: number;
}> = ({ grade, selected, onSelect, theme, index }) => {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    onSelect();
  }, [onSelect, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 80).springify().damping(15)}
      style={[{ flex: 1 }]}
    >
      <AnimatedPressable
        onPress={handlePress}
        style={[
          styles.gradeCard,
          animatedStyle,
          {
            backgroundColor: selected ? theme.colors.accent : theme.colors.card,
            borderColor: selected ? theme.colors.accent : theme.colors.border,
            borderWidth: 1.5,
          },
        ]}
      >
        <Text
          style={[
            styles.gradeNumber,
            { color: selected ? '#FFFFFF' : theme.colors.textPrimary },
          ]}
        >
          {grade}
        </Text>
        <Text
          style={[
            styles.gradeLabel,
            { color: selected ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary },
          ]}
        >
          Grade
        </Text>
        {selected && (
          <View style={styles.gradeCheck}>
            <Check size={14} color={theme.colors.accent} strokeWidth={3} />
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
};

/* ============ STEP 3: Language ============ */
const Step3Language: React.FC<{
  theme: any;
  language: Language;
  setLanguage: (l: Language) => void;
}> = ({ theme, language, setLanguage }) => {
  const langs: Array<{ code: Language; label: string; native: string; flag: string }> = [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'ne', label: 'Nepali', native: 'नेपाली', flag: '🇳🇵' },
  ];

  return (
    <View style={styles.stepContainer}>
      <View style={[styles.stepHeader, { marginTop: 20 }]}>
        <View style={[styles.stepIconWrap, { backgroundColor: theme.colors.accentLight }]}>
          <Languages size={28} color={theme.colors.accent} strokeWidth={2.2} />
        </View>
        <Text style={[styles.stepTitle, { color: theme.colors.textPrimary, fontSize: 24 }]}>
          Choose your language
        </Text>
        <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
          MofNet speaks your language — for voice and text
        </Text>
      </View>

      <View style={styles.languageList}>
        {langs.map((l, i) => (
          <LanguageCard
            key={l.code}
            lang={l}
            selected={language === l.code}
            onSelect={() => {
              triggerHaptic('medium');
              setLanguage(l.code);
            }}
            theme={theme}
            index={i}
          />
        ))}
      </View>
    </View>
  );
};

const LanguageCard: React.FC<{
  lang: { code: Language; label: string; native: string; flag: string };
  selected: boolean;
  onSelect: () => void;
  theme: any;
  index: number;
}> = ({ lang, selected, onSelect, theme, index }) => {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    onSelect();
  }, [onSelect, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 100).springify().damping(15)}
    >
      <AnimatedPressable
        onPress={handlePress}
        style={[
          styles.languageCard,
          animatedStyle,
          {
            backgroundColor: selected ? theme.colors.accent + '12' : theme.colors.card,
            borderColor: selected ? theme.colors.accent : theme.colors.border,
          },
        ]}
      >
        <Text style={styles.languageFlag}>{lang.flag}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.languageLabel, { color: theme.colors.textPrimary }]}>
            {lang.label}
          </Text>
          <Text style={[styles.languageNative, { color: theme.colors.textSecondary }]}>
            {lang.native}
          </Text>
        </View>
        <View
          style={[
            styles.radioOuter,
            { borderColor: selected ? theme.colors.accent : theme.colors.border },
          ]}
        >
          {selected && <View style={[styles.radioInner, { backgroundColor: theme.colors.accent }]} />}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

/* ============ STEP 4: Offline AI ============ */
const Step4OfflineAI: React.FC<{ theme: any }> = ({ theme }) => {
  const features = [
    { icon: Sparkles, title: 'Curriculum-Aware', desc: 'Knows your textbook chapters' },
    { icon: Mic, title: 'Voice Learning', desc: 'Ask questions by speaking' },
    { icon: Mountain, title: 'Works Offline', desc: 'No internet needed — ever' },
  ];

  return (
    <View style={styles.stepContainer}>
      <View style={styles.offlineIllustration}>
        <LinearGradient
          colors={['#006989', '#17C3B2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.offlineGradient}
        >
          <View style={styles.offlineOrb1} />
          <View style={styles.offlineOrb2} />
          <Sparkles size={56} color="#FFFFFF" strokeWidth={1.8} />
        </LinearGradient>
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>
          Meet your offline
          {'\n'}AI tutor
        </Text>
        <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
          MofNet runs a real AI model on your school&apos;s Edge AI server. Ask questions, get explanations, and learn — all without the internet.
        </Text>
      </View>

      <View style={styles.featureList}>
        {features.map((f, i) => (
          <Animated.View
            key={f.title}
            entering={SlideInRight.delay(i * 120).springify().damping(15)}
            style={[styles.featureItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={[styles.featureIconWrap, { backgroundColor: theme.colors.accentLight }]}>
              <f.icon size={18} color={theme.colors.accent} strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
                {f.title}
              </Text>
              <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>
                {f.desc}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

/* ============ STEP 5: Permissions ============ */
const Step5Permissions: React.FC<{
  theme: any;
  permissions: { mic: boolean; notifications: boolean; storage: boolean };
  setPermissions: React.Dispatch<React.SetStateAction<{ mic: boolean; notifications: boolean; storage: boolean }>>;
}> = ({ theme, permissions, setPermissions }) => {
  const perms = [
    { key: 'mic' as const, icon: Mic, title: 'Microphone', desc: 'For voice questions and learning' },
    { key: 'notifications' as const, icon: Bell, title: 'Notifications', desc: 'School alerts and reminders' },
    { key: 'storage' as const, icon: HardDrive, title: 'Local Storage', desc: 'Save lessons for offline use' },
  ];

  const togglePerm = (key: 'mic' | 'notifications' | 'storage') => {
    triggerHaptic('light');
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.stepContainer}>
      <View style={[styles.stepHeader, { marginTop: 20 }]}>
        <View style={[styles.stepIconWrap, { backgroundColor: theme.colors.primaryLight }]}>
          <Check size={28} color={theme.colors.primary} strokeWidth={2.2} />
        </View>
        <Text style={[styles.stepTitle, { color: theme.colors.textPrimary, fontSize: 24 }]}>
          Enable permissions
        </Text>
        <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
          Allow these to get the full MofNet experience
        </Text>
      </View>

      <View style={styles.permList}>
        {perms.map((p, i) => (
          <Animated.View
            key={p.key}
            entering={SlideInRight.delay(i * 100).springify().damping(15)}
          >
            <Pressable
              onPress={() => togglePerm(p.key)}
              style={[
                styles.permItem,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: permissions[p.key] ? theme.colors.accent + '40' : theme.colors.border,
                },
              ]}
            >
              <View style={[styles.permIconWrap, { backgroundColor: theme.colors.accentLight }]}>
                <p.icon size={18} color={theme.colors.accent} strokeWidth={2.3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.permTitle, { color: theme.colors.textPrimary }]}>
                  {p.title}
                </Text>
                <Text style={[styles.permDesc, { color: theme.colors.textSecondary }]}>
                  {p.desc}
                </Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  { backgroundColor: permissions[p.key] ? theme.colors.accent : theme.colors.border },
                ]}
              >
                <Animated.View
                  style={[
                    styles.toggleKnob,
                    {
                      backgroundColor: '#FFFFFF',
                      transform: [{ translateX: permissions[p.key] ? 20 : 2 }],
                    },
                  ]}
                />
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  stepHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  stepIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    lineHeight: 32,
  },
  stepDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  illustrationWrap: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 24,
    maxHeight: 320,
  },
  illustrationGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    gap: 12,
    marginBottom: 24,
  },
  // Mountain scene
  mountainScene: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  mountainsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 0,
  },
  mountain: {
    width: 80,
    height: 100,
    backgroundColor: 'rgba(23,193,178,0.15)',
    borderRightWidth: 0,
  },
  mountain1: {
    height: 80,
    backgroundColor: 'rgba(0,105,137,0.25)',
    transform: [{ rotate: '-5deg' }],
  },
  mountain2: {
    height: 130,
    backgroundColor: 'rgba(23,193,178,0.20)',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    width: 120,
  },
  mountain3: {
    height: 90,
    backgroundColor: 'rgba(0,105,137,0.3)',
    transform: [{ rotate: '5deg' }],
  },
  aiOrb: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiOrbGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiOrbRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(23,193,178,0.4)',
  },
  connectionLine1: {
    position: 'absolute',
    top: 90,
    left: '20%',
    width: 60,
    height: 1,
    backgroundColor: 'rgba(23,193,178,0.3)',
    transform: [{ rotate: '20deg' }],
  },
  connectionLine2: {
    position: 'absolute',
    top: 90,
    right: '20%',
    width: 60,
    height: 1,
    backgroundColor: 'rgba(23,193,178,0.3)',
    transform: [{ rotate: '-20deg' }],
  },
  connectionLine3: {
    position: 'absolute',
    top: 130,
    left: '40%',
    width: 80,
    height: 1,
    backgroundColor: 'rgba(23,193,178,0.2)',
  },
  studentFigure: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    alignItems: 'center',
  },
  studentHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  studentBody: {
    width: 24,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginTop: -2,
  },
  // Grade
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  gradeCard: {
    width: 100,
    height: 120,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gradeNumber: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  gradeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  gradeCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Language
  languageList: {
    gap: 12,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  languageFlag: {
    fontSize: 36,
  },
  languageLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  languageNative: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Offline AI
  offlineIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  offlineOrb1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  offlineOrb2: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  featureList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  featureDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  // Permissions
  permList: {
    gap: 12,
  },
  permItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  permIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  permDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  // Nav
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
