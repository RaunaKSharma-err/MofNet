import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import {
  Home,
  Library,
  Sparkles,
  HelpCircle,
  Share2,
  Bell,
  Settings,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeProvider';
import { triggerHaptic } from '@/src/utils/haptics';
import { useNotificationStore } from '@/src/store/notificationStore';
import { useAnnouncementStore } from '@/src/store/announcementStore';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const springConfig = { damping: 15, stiffness: 350 };

const tabsConfig = [
  { name: 'index', label: 'Home', icon: Home, href: '/' },
  { name: 'library', label: 'Library', icon: Library, href: '/library' },
  { name: 'tutor', label: 'AI Tutor', icon: Sparkles, href: '/tutor' },
  { name: 'quiz', label: 'Quiz', icon: HelpCircle, href: '/quiz' },
  { name: 'mesh', label: 'Mesh', icon: Share2, href: '/mesh' },
  { name: 'alerts', label: 'Alerts', icon: Bell, href: '/alerts' },
  { name: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export const FloatingTabBar: React.FC<TabBarProps> = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const notifUnread = useNotificationStore((s) => s.unreadCount());
  const announceUnread = useAnnouncementStore((s) => s.unreadCount());

  const badgeMap: Record<string, number | undefined> = {
    alerts: announceUnread,
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.barWrap, { borderColor: theme.colors.glassBorder }]}>
        {Platform.OS !== 'web' && (
          <BlurView
            intensity={70}
            tint={theme.mode === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <View
          style={[
            styles.bar,
            {
              backgroundColor: Platform.OS === 'web' ? theme.colors.card : theme.colors.glassLight,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {tabsConfig.map((tab, index) => {
            const isFocused = state.index === index;

            const onPress = () => {
              triggerHaptic('selection');
              const event = navigation.emit({
                type: 'tabPress',
                target: state.routes[index].key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(state.routes[index].name as any);
              }
            };

            return (
              <TabItem
                key={tab.name}
                label={tab.label}
                icon={tab.icon}
                active={isFocused}
                onPress={onPress}
                theme={theme}
                badgeCount={badgeMap[tab.name]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const TabItem: React.FC<{
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  active: boolean;
  onPress: () => void;
  theme: any;
  badgeCount?: number;
}> = ({ label, icon: Icon, active, onPress, theme, badgeCount }) => {
  const scale = useSharedValue(active ? 1.1 : 1);
  const iconColor = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(active ? 1.15 : 1, springConfig);
    iconColor.value = withTiming(active ? 1 : 0, { duration: 200 });
  }, [active, scale, iconColor]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(iconColor.value, [0, 1], [theme.colors.textTertiary, theme.colors.accent]),
  }));

  const iconColorStr = active ? theme.colors.accent : theme.colors.textTertiary;

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.tabItem, active && styles.tabItemActive]}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          active && { backgroundColor: theme.colors.accent + '15' },
          animatedIconStyle,
        ]}
      >
        <Icon size={20} color={iconColorStr} strokeWidth={active ? 2.5 : 2.2} />
        {badgeCount != null && badgeCount > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        )}
      </Animated.View>
      <Animated.Text
        style={[styles.label, active && { color: theme.colors.accent, fontWeight: '700' }, animatedColorStyle]}
      >
        {label}
      </Animated.Text>
      {active && (
        <Animated.View
          style={[styles.activeDot, { backgroundColor: theme.colors.accent }]}
        />
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  barWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#0A1014',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 28,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    borderRadius: 20,
    position: 'relative',
  },
  tabItemActive: {},
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
