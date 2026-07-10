import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
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
import { AppButton } from '@/src/components/AppButton';
import type { Grade } from '@/src/types';
import {
  GraduationCap,
  Users,
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  User,
  ArrowLeft,
} from 'lucide-react-native';

export default function SignupScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [loading, setLoading] = useState(false);

  const grades: Grade[] = [6, 7, 8, 9, 10];

  const handleSignup = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (role === 'student' && !grade) return;
    triggerHaptic('medium');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setOnboardingComplete(grade || 7, 'en', name.trim());
    setLoading(false);
    router.replace('/(tabs)');
  }, [name, email, password, role, grade, setOnboardingComplete, router]);

  const navigateToLogin = useCallback(() => {
    triggerHaptic('light');
    router.back();
  }, [router]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View entering={FadeInDown.duration(600)} style={styles.headerContent}>
            <Pressable onPress={navigateToLogin} style={styles.backBtn}>
              <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
            <View style={styles.logoWrap}>
              <Sparkles size={28} color="#FFFFFF" strokeWidth={2} />
            </View>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Join MofNet and start learning</Text>
          </Animated.View>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInUp.delay(200).duration(500)}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                I am a...
              </Text>
              <View style={styles.roleRow}>
                <Pressable
                  onPress={() => {
                    triggerHaptic('selection');
                    setRole('student');
                  }}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: role === 'student' ? theme.colors.accent + '15' : theme.colors.card,
                      borderColor: role === 'student' ? theme.colors.accent : theme.colors.border,
                    },
                  ]}
                >
                  <GraduationCap size={24} color={role === 'student' ? theme.colors.accent : theme.colors.textSecondary} strokeWidth={2.3} />
                  <Text style={[styles.roleLabel, { color: role === 'student' ? theme.colors.accent : theme.colors.textPrimary }]}>
                    Student
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    triggerHaptic('selection');
                    setRole('teacher');
                  }}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: role === 'teacher' ? theme.colors.accent + '15' : theme.colors.card,
                      borderColor: role === 'teacher' ? theme.colors.accent : theme.colors.border,
                    },
                  ]}
                >
                  <Users size={24} color={role === 'teacher' ? theme.colors.accent : theme.colors.textSecondary} strokeWidth={2.3} />
                  <Text style={[styles.roleLabel, { color: role === 'teacher' ? theme.colors.accent : theme.colors.textPrimary }]}>
                    Teacher
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ marginTop: 28 }}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Full Name</Text>
              <View style={[styles.inputWrap, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <User size={18} color={theme.colors.textTertiary} strokeWidth={2.2} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.colors.textTertiary}
                  autoCapitalize="words"
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(400).duration(500)} style={{ marginTop: 20 }}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
              <View style={[styles.inputWrap, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Mail size={18} color={theme.colors.textTertiary} strokeWidth={2.2} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500).duration(500)} style={{ marginTop: 20 }}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Lock size={18} color={theme.colors.textTertiary} strokeWidth={2.2} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor={theme.colors.textTertiary}
                  secureTextEntry
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                />
              </View>
            </Animated.View>

            {role === 'student' && (
              <Animated.View entering={FadeInUp.delay(550).duration(500)} style={{ marginTop: 20 }}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Select Grade</Text>
                <View style={styles.gradeRow}>
                  {grades.map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => {
                        triggerHaptic('selection');
                        setGrade(g);
                      }}
                      style={[
                        styles.gradeChip,
                        {
                          backgroundColor: grade === g ? theme.colors.accent : theme.colors.card,
                          borderColor: grade === g ? theme.colors.accent : theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.gradeLabel,
                          { color: grade === g ? '#FFFFFF' : theme.colors.textPrimary },
                        ]}
                      >
                        {g}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}

            <Animated.View entering={FadeInUp.delay(600).duration(500)} style={{ marginTop: 32 }}>
              <AppButton
                label="Create Account"
                onPress={handleSignup}
                loading={loading}
                disabled={!name.trim() || !email.trim() || !password.trim() || (role === 'student' && !grade)}
                fullWidth
                size="lg"
                icon={<ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />}
                iconPosition="right"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(700).duration(500)} style={{ marginTop: 20, alignItems: 'center' }}>
              <Pressable onPress={navigateToLogin}>
                <Text style={[styles.switchText, { color: theme.colors.accent }]}>
                  Already have an account? <Text style={{ fontWeight: '700' }}>Sign In</Text>
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  gradeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gradeChip: {
    width: 56,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  gradeLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
