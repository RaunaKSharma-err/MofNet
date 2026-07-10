import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  Sun,
  Moon,
  Monitor,
  Globe,
  Bell,
  Volume2,
  HardDrive,
  RefreshCw,
  Download,
  Server,
  Info,
  ChevronRight,
  Sparkles,
  Mic,
  Vibrate,
  Eye,
  Languages,
  Trash2,
  LogOut,
  Award,
  Zap,
  Flame,
  BookOpen,
} from 'lucide-react-native';
import { useTheme, type ThemeMode } from '@/src/theme/ThemeProvider';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useAuthStore } from '@/src/store/authStore';
import { triggerHaptic } from '@/src/utils/haptics';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { AppButton } from '@/src/components/AppButton';
import { mockBadges } from '@/src/mocks';

export default function SettingsScreen() {
  const { theme, mode: resolvedMode, setThemeMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const settings = useSettingsStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [storageUsed, setStorageUsed] = useState(124); // MB

  const handleThemeChange = useCallback((newMode: ThemeMode) => {
    triggerHaptic('selection');
    setThemeMode(newMode);
    settings.setThemeMode(newMode);
  }, [setThemeMode, settings]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cache?',
      'This will remove temporary files and cached content. Your lessons and progress will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('warning');
            setStorageUsed(8);
            Alert.alert('Cache Cleared', 'Your cache has been cleared successfully.');
          },
        },
      ]
    );
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <ScreenHeader title="Settings" subtitle="Preferences" large />

        {/* User profile card */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCard}
            >
              <View style={styles.profileOrb} />
              <View style={styles.profileContent}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {(user?.name || 'S')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>{user?.name || 'Student'}</Text>
                  <Text style={styles.profileMeta}>
                    Grade {user?.grade} • {user?.school}
                  </Text>
                  <View style={styles.profileStats}>
                    <View style={styles.profileStat}>
                      <Zap size={11} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.profileStatText}>{user?.xp} XP</Text>
                    </View>
                    <View style={styles.profileStat}>
                      <Flame size={11} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.profileStatText}>{user?.streak} days</Text>
                    </View>
                    <View style={styles.profileStat}>
                      <Award size={11} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.profileStatText}>{user?.badges.length || 0}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* General Section */}
        <SettingsSection title="General" theme={theme}>
          {/* Theme */}
          <View style={[styles.settingRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: theme.colors.primaryLight }]}>
              {resolvedMode === 'dark' ? <Moon size={16} color={theme.colors.primary} strokeWidth={2.3} /> : <Sun size={16} color={theme.colors.primary} strokeWidth={2.3} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Appearance</Text>
              <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>Choose your theme</Text>
            </View>
          </View>
          <View style={[styles.themeSelectorRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <ThemeOption
              icon={<Sun size={15} color={settings.themeMode === 'light' ? '#FFFFFF' : theme.colors.textSecondary} strokeWidth={2.3} />}
              label="Light"
              active={settings.themeMode === 'light'}
              onPress={() => handleThemeChange('light')}
              theme={theme}
            />
            <ThemeOption
              icon={<Moon size={15} color={settings.themeMode === 'dark' ? '#FFFFFF' : theme.colors.textSecondary} strokeWidth={2.3} />}
              label="Dark"
              active={settings.themeMode === 'dark'}
              onPress={() => handleThemeChange('dark')}
              theme={theme}
            />
            <ThemeOption
              icon={<Monitor size={15} color={settings.themeMode === 'system' ? '#FFFFFF' : theme.colors.textSecondary} strokeWidth={2.3} />}
              label="System"
              active={settings.themeMode === 'system'}
              onPress={() => handleThemeChange('system')}
              theme={theme}
            />
          </View>

          {/* Language */}
          <SettingsLinkRow
            icon={<Languages size={16} color={theme.colors.accent} strokeWidth={2.3} />}
            iconBg={theme.colors.accentLight}
            label="Language"
            value={settings.language === 'en' ? 'English' : 'नेपाली'}
            onPress={() => {
              triggerHaptic('selection');
              settings.setLanguage(settings.language === 'en' ? 'ne' : 'en');
            }}
            theme={theme}
          />

          {/* Accessibility */}
          <SettingsToggleRow
            icon={<Eye size={16} color="#8B5CF6" strokeWidth={2.3} />}
            iconBg="rgba(139,92,246,0.12)"
            label="Reduced Motion"
            desc="Minimize animations"
            value={settings.reducedMotion}
            onToggle={() => {
              triggerHaptic('light');
              settings.setReducedMotion(!settings.reducedMotion);
            }}
            theme={theme}
          />
          <SettingsToggleRow
            icon={<Vibrate size={16} color="#F59E0B" strokeWidth={2.3} />}
            iconBg="rgba(245,158,11,0.12)"
            label="Haptic Feedback"
            desc="Vibration on tap"
            value={settings.hapticsEnabled}
            onToggle={() => {
              triggerHaptic('medium');
              settings.setHaptics(!settings.hapticsEnabled);
            }}
            theme={theme}
            last
          />
        </SettingsSection>

        {/* Offline Section */}
        <SettingsSection title="Offline & Storage" theme={theme}>
          <View style={[styles.settingRow, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(6,182,212,0.12)' }]}>
              <HardDrive size={16} color="#06B6D4" strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Storage Usage</Text>
              <View style={styles.storageBar}>
                <View style={[styles.storageBarTrack, { backgroundColor: theme.colors.border }]}>
                  <View style={[styles.storageBarFill, { width: `${(storageUsed / 500) * 100}%`, backgroundColor: theme.colors.accent }]} />
                </View>
                <Text style={[styles.storageText, { color: theme.colors.textSecondary }]}>
                  {storageUsed} MB / 500 MB
                </Text>
              </View>
            </View>
          </View>

          <SettingsLinkRow
            icon={<Trash2 size={16} color={theme.colors.error} strokeWidth={2.3} />}
            iconBg="rgba(239,68,68,0.12)"
            label="Clear Cache"
            value={`${storageUsed} MB`}
            onPress={handleClearCache}
            theme={theme}
          />
          <SettingsToggleRow
            icon={<Download size={16} color={theme.colors.success} strokeWidth={2.3} />}
            iconBg="rgba(76,175,80,0.12)"
            label="Auto-Download"
            desc="Auto-download new lessons"
            value={settings.autoDownload}
            onToggle={() => {
              triggerHaptic('light');
              settings.setAutoDownload(!settings.autoDownload);
            }}
            theme={theme}
            last
          />
        </SettingsSection>

        {/* Connectivity */}
        <SettingsSection title="Connectivity & Sync" theme={theme}>
          <SettingsLinkRow
            icon={<RefreshCw size={16} color={theme.colors.accent} strokeWidth={2.3} />}
            iconBg={theme.colors.accentLight}
            label="Sync Now"
            value="Mesh"
            onPress={() => {
              triggerHaptic('medium');
              Alert.alert('Sync Started', 'Syncing with the mesh network...');
            }}
            theme={theme}
          />
          <SettingsLinkRow
            icon={<Server size={16} color={theme.colors.primary} strokeWidth={2.3} />}
            iconBg={theme.colors.primaryLight}
            label="Model Management"
            value="AI v2.1"
            onPress={() => triggerHaptic('selection')}
            theme={theme}
            last
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" theme={theme}>
          <SettingsToggleRow
            icon={<Bell size={16} color={theme.colors.error} strokeWidth={2.3} />}
            iconBg="rgba(239,68,68,0.12)"
            label="School Notices"
            desc="Emergency alerts & announcements"
            value={settings.notifySchool}
            onToggle={() => {
              triggerHaptic('light');
              settings.setNotifySchool(!settings.notifySchool);
            }}
            theme={theme}
          />
          <SettingsToggleRow
            icon={<BookOpen size={16} color={theme.colors.accent} strokeWidth={2.3} />}
            iconBg={theme.colors.accentLight}
            label="Homework"
            desc="Homework reminders & due dates"
            value={settings.notifyHomework}
            onToggle={() => {
              triggerHaptic('light');
              settings.setNotifyHomework(!settings.notifyHomework);
            }}
            theme={theme}
          />
          <SettingsToggleRow
            icon={<Sparkles size={16} color="#8B5CF6" strokeWidth={2.3} />}
            iconBg="rgba(139,92,246,0.12)"
            label="Learning"
            desc="Daily streak & lesson reminders"
            value={settings.notifyLearning}
            onToggle={() => {
              triggerHaptic('light');
              settings.setNotifyLearning(!settings.notifyLearning);
            }}
            theme={theme}
          />
          <SettingsToggleRow
            icon={<Award size={16} color="#F59E0B" strokeWidth={2.3} />}
            iconBg="rgba(245,158,11,0.12)"
            label="Quiz & Achievements"
            desc="Quiz reminders & badge unlocks"
            value={settings.notifyQuiz}
            onToggle={() => {
              triggerHaptic('light');
              settings.setNotifyQuiz(!settings.notifyQuiz);
            }}
            theme={theme}
            last
          />
        </SettingsSection>

        {/* App Info */}
        <SettingsSection title="App Info" theme={theme}>
          <SettingsLinkRow
            icon={<Info size={16} color={theme.colors.textSecondary} strokeWidth={2.3} />}
            iconBg={theme.colors.borderLight}
            label="About MofNet"
            value="v1.0.0"
            onPress={() => {
              triggerHaptic('selection');
              Alert.alert(
                'MofNet',
                'Intelligence Without Internet\n\nMofNet is an offline-first AI educational mesh network built for remote schools in Nepal.\n\nVersion 1.0.0\nMade with ❤️ for Nepal'
              );
            }}
            theme={theme}
            last
          />
        </SettingsSection>

        {/* Teacher Analytics */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Pressable
              onPress={() => {
                triggerHaptic('medium');
                router.push('/analytics');
              }}
              style={({ pressed }) => [
                styles.analyticsCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.analyticsIcon, { backgroundColor: theme.colors.accentLight }]}>
                <Server size={20} color={theme.colors.accent} strokeWidth={2.3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.analyticsTitle, { color: theme.colors.textPrimary }]}>
                  Teacher Analytics Dashboard
                </Text>
                <Text style={[styles.analyticsDesc, { color: theme.colors.textSecondary }]}>
                  View student engagement, knowledge gaps & performance
                </Text>
              </View>
              <ChevronRight size={18} color={theme.colors.textTertiary} strokeWidth={2.2} />
            </Pressable>
          </Animated.View>
        </View>

        {/* Logout */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <AppButton
            label="Log Out"
            onPress={() => {
              triggerHaptic('warning');
              Alert.alert(
                'Log Out?',
                'You will need to sign in again.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: () => {
                      logout();
                      router.replace('/login');
                    },
                  },
                ]
              );
            }}
            variant="outline"
            fullWidth
            icon={<LogOut size={18} color={theme.colors.error} strokeWidth={2.3} />}
            labelStyle={{ color: theme.colors.error }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const SettingsSection: React.FC<{
  title: string;
  theme: any;
  children: React.ReactNode;
}> = ({ title, theme, children }) => {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {children}
      </View>
    </View>
  );
};

const SettingsLinkRow: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value?: string;
  onPress: () => void;
  theme: any;
  last?: boolean;
}> = ({ icon, iconBg, label, value, onPress, theme, last }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        {
          backgroundColor: theme.colors.card,
          borderColor: last ? 'transparent' : theme.colors.border,
          borderBottomWidth: last ? 0 : 1,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
        {label}
      </Text>
      {value && (
        <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
          {value}
        </Text>
      )}
      <ChevronRight size={16} color={theme.colors.textTertiary} strokeWidth={2.2} />
    </Pressable>
  );
};

const SettingsToggleRow: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  desc?: string;
  value: boolean;
  onToggle: () => void;
  theme: any;
  last?: boolean;
}> = ({ icon, iconBg, label, desc, value, onToggle, theme, last }) => {
  return (
    <View
      style={[
        styles.settingRow,
        {
          backgroundColor: theme.colors.card,
          borderColor: last ? 'transparent' : theme.colors.border,
          borderBottomWidth: last ? 0 : 1,
        },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
          {label}
        </Text>
        {desc && (
          <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
            {desc}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.colors.border}
      />
    </View>
  );
};

const ThemeOption: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
  theme: any;
}> = ({ icon, label, active, onPress, theme }) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.themeOption,
        {
          backgroundColor: active ? theme.colors.accent : 'transparent',
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.themeOptionText,
          { color: active ? '#FFFFFF' : theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Profile
  profileCard: {
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  profileOrb: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  profileMeta: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  profileStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  profileStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileStatText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  // Section
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Theme selector
  themeSelectorRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Storage
  storageBar: {
    marginTop: 8,
    gap: 6,
  },
  storageBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  storageText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Analytics
  analyticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  analyticsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  analyticsDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 17,
  },
});
