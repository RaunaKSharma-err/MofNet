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
import {
  GraduationCap,
  Users,
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react-native';

export default function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.setUser);
  const setOnboarded = useAuthStore((s) => s.setOnboarded);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) return;
    triggerHaptic('medium');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    login({
      id: role === 'teacher' ? 't_001' : 'u_001',
      name: email.split('@')[0] || (role === 'teacher' ? 'Teacher' : 'Student'),
      grade: role === 'student' ? 7 : 7,
      language: 'en',
      school: 'Shree Saraswati Secondary School',
      role,
      xp: role === 'teacher' ? 0 : 1240,
      streak: role === 'teacher' ? 0 : 5,
      badges: role === 'teacher' ? [] : ['explorer', 'scholar'],
      joinedAt: Date.now(),
    });
    setOnboarded(true);
    setLoading(false);
    router.replace('/(tabs)');
  }, [email, password, role, login, setOnboarded, router]);

  const navigateToSignup = useCallback(() => {
    triggerHaptic('light');
    router.push('/signup');
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
            <View style={styles.logoWrap}>
              <Sparkles size={32} color="#FFFFFF" strokeWidth={2} />
            </View>
            <Text style={styles.headerTitle}>MofNet</Text>
            <Text style={styles.headerSubtitle}>Welcome back! Sign in to continue</Text>
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

            <Animated.View entering={FadeInUp.delay(400).duration(500)} style={{ marginTop: 20 }}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Lock size={18} color={theme.colors.textTertiary} strokeWidth={2.2} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.textTertiary}
                  secureTextEntry={!showPassword}
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={18} color={theme.colors.textTertiary} strokeWidth={2.2} />
                  ) : (
                    <Eye size={18} color={theme.colors.textTertiary} strokeWidth={2.2} />
                  )}
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500).duration(500)} style={{ marginTop: 32 }}>
              <AppButton
                label="Sign In"
                onPress={handleLogin}
                loading={loading}
                disabled={!email.trim() || !password.trim()}
                fullWidth
                size="lg"
                icon={<ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />}
                iconPosition="right"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(600).duration(500)} style={{ marginTop: 20, alignItems: 'center' }}>
              <Pressable onPress={navigateToSignup}>
                <Text style={[styles.switchText, { color: theme.colors.accent }]}>
                  Don&apos;t have an account? <Text style={{ fontWeight: '700' }}>Sign Up</Text>
                </Text>
              </Pressable>
            </Animated.View>

            {role === 'teacher' && (
              <Animated.View entering={FadeInUp.delay(650).duration(500)} style={{ marginTop: 16, alignItems: 'center' }}>
                <Pressable onPress={() => router.push('/teacher-dashboard')}>
                  <Text style={[styles.switchText, { color: theme.colors.accent }]}>
                    View Teacher Dashboard
                  </Text>
                </Pressable>
              </Animated.View>
            )}
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
  switchText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
