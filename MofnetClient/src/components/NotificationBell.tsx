import React, { useCallback } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useNotificationStore } from '@/src/store/notificationStore';
import { triggerHaptic } from '@/src/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const NotificationBell: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    triggerHaptic('light');
    scale.value = withSequence(
      withSpring(0.85, { damping: 12, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    router.push('/notifications');
  }, [router, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.container, animatedStyle, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
    >
      <Bell size={20} color={theme.colors.textPrimary} strokeWidth={2.2} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
