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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
  SlideInRight,
} from "react-native-reanimated";
import {
  X,
  Bell,
  BookOpen,
  Sparkles,
  HelpCircle,
  Award,
  GraduationCap,
  CheckCheck,
  Trash2,
} from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useNotificationStore } from "@/src/store/notificationStore";
import { triggerHaptic } from "@/src/utils/haptics";
import { formatTimeAgo } from "@/src/utils/format";
import { EmptyState } from "@/src/components/EmptyState";
import type { AppNotification } from "@/src/types";

const notifTypeConfig: Record<
  AppNotification["type"],
  { icon: any; color: string; bg: string }
> = {
  school: { icon: Bell, color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  homework: { icon: BookOpen, color: "#17C3B2", bg: "rgba(23,193,178,0.12)" },
  learning: { icon: Sparkles, color: "#006989", bg: "rgba(0,105,137,0.12)" },
  quiz: { icon: HelpCircle, color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  achievement: { icon: Award, color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  announcement: {
    icon: GraduationCap,
    color: "#06B6D4",
    bg: "rgba(6,182,212,0.12)",
  },
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clearAll = useNotificationStore((s) => s.clearAll);

  const handleClose = useCallback(() => {
    triggerHaptic("light");
    router.back();
  }, [router]);

  const handleMarkAllRead = useCallback(() => {
    triggerHaptic("success");
    markAllRead();
  }, [markAllRead]);

  const handleClearAll = useCallback(() => {
    triggerHaptic("warning");
    clearAll();
  }, [clearAll]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <X size={22} color={theme.colors.textPrimary} strokeWidth={2.5} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
          >
            Notifications
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {notifications.filter((n) => !n.read).length} unread
          </Text>
        </View>
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleMarkAllRead}
              style={[
                styles.headerBtn,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <CheckCheck
                size={14}
                color={theme.colors.accent}
                strokeWidth={2.3}
              />
            </Pressable>
            <Pressable
              onPress={handleClearAll}
              style={[
                styles.headerBtn,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Trash2 size={14} color={theme.colors.error} strokeWidth={2.3} />
            </Pressable>
          </View>
        )}
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length > 0 ? (
          notifications.map((notif, i) => {
            const config = notifTypeConfig[notif.type];
            const Icon = config.icon;
            return (
              <Animated.View
                key={notif.id}
                entering={SlideInRight.delay(i * 60).duration(400)}
              >
                <Pressable
                  onPress={() => {
                    triggerHaptic("light");
                    markRead(notif.id);
                  }}
                  style={[
                    styles.notifCard,
                    {
                      backgroundColor: notif.read
                        ? theme.colors.card
                        : theme.colors.card,
                      borderColor: notif.read
                        ? theme.colors.border
                        : config.color + "40",
                    },
                    !notif.read && {
                      borderLeftWidth: 3,
                      borderLeftColor: config.color,
                    },
                  ]}
                >
                  <View
                    style={[styles.notifIcon, { backgroundColor: config.bg }]}
                  >
                    <Icon size={18} color={config.color} strokeWidth={2.3} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={styles.notifTitleRow}>
                      <Text
                        style={[
                          styles.notifTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {notif.title}
                      </Text>
                      {!notif.read && (
                        <View
                          style={[
                            styles.unreadDot,
                            { backgroundColor: config.color },
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.notifBody,
                        { color: theme.colors.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {notif.body}
                    </Text>
                    <View style={styles.notifFooter}>
                      <Text
                        style={[
                          styles.notifTime,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        {formatTimeAgo(notif.createdAt)}
                      </Text>
                      {notif.action && (
                        <Text
                          style={[styles.notifAction, { color: config.color }]}
                        >
                          {notif.action}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })
        ) : (
          <EmptyState
            icon={
              <Bell
                size={28}
                color={theme.colors.textSecondary}
                strokeWidth={2}
              />
            }
            title="No notifications"
            description="You're all caught up! New notifications will appear here."
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  // Notification card
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notifTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  notifFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  notifTime: {
    fontSize: 11,
    fontWeight: "600",
  },
  notifAction: {
    fontSize: 11,
    fontWeight: "700",
  },
});
