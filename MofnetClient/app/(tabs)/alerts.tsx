import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  SlideInRight,
} from "react-native-reanimated";
import {
  Bell,
  AlertTriangle,
  FileText,
  BookOpen,
  Calendar,
  Pin,
  Paperclip,
  X,
  Filter,
  CheckCheck,
  Settings,
} from "lucide-react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useAnnouncementStore } from "@/src/store/announcementStore";
import { triggerHaptic } from "@/src/utils/haptics";
import { SearchBar } from "@/src/components/SearchBar";
import { AnnouncementCard } from "@/src/components/AnnouncementCard";
import { EmptyState } from "@/src/components/EmptyState";
import type { Announcement } from "@/src/types";

const categoryChips: Array<{
  key: "all" | Announcement["category"];
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "emergency", label: "Emergency" },
  { key: "exam", label: "Exams" },
  { key: "homework", label: "Homework" },
  { key: "event", label: "Events" },
  { key: "announcement", label: "Notices" },
];

export default function AlertsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Announcement | null>(null);

  const announcements = useAnnouncementStore((s) => s.announcements);
  const searchQuery = useAnnouncementStore((s) => s.searchQuery);
  const activeCategory = useAnnouncementStore((s) => s.activeCategory);
  const setSearch = useAnnouncementStore((s) => s.setSearch);
  const setCategory = useAnnouncementStore((s) => s.setCategory);
  const getFiltered = useAnnouncementStore((s) => s.getFiltered);
  const markRead = useAnnouncementStore((s) => s.markRead);
  const togglePin = useAnnouncementStore((s) => s.togglePin);
  const markAllRead = useAnnouncementStore((s) => s.markAllRead);

  const filtered = useMemo(
    () => getFiltered(),
    [getFiltered, announcements, searchQuery, activeCategory],
  );
  const unreadCount = announcements.filter((a) => !a.read).length;
  const pinnedCount = announcements.filter((a) => a.pinned).length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    triggerHaptic("light");
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleAlertPress = useCallback(
    (alert: Announcement) => {
      triggerHaptic("light");
      if (!alert.read) markRead(alert.id);
      setSelectedAlert(alert);
    },
    [markRead],
  );

  const handleMarkAllRead = useCallback(() => {
    triggerHaptic("success");
    markAllRead();
  }, [markAllRead]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Alerts</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>School</Text>
          </View>
          <Pressable
            onPress={handleMarkAllRead}
            style={[
              styles.markAllBtn,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <CheckCheck
              size={16}
              color={theme.colors.accent}
              strokeWidth={2.3}
            />
            <Text style={[styles.markAllText, { color: theme.colors.accent }]}>
              Read all
            </Text>
          </Pressable>
        </View>

        {/* Stats summary */}
        <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statPill,
                { backgroundColor: theme.colors.error + "15" },
              ]}
            >
              <Text
                style={[styles.statPillValue, { color: theme.colors.error }]}
              >
                {unreadCount}
              </Text>
              <Text
                style={[styles.statPillLabel, { color: theme.colors.error }]}
              >
                Unread
              </Text>
            </View>
            <View
              style={[
                styles.statPill,
                { backgroundColor: theme.colors.accent + "15" },
              ]}
            >
              <Pin size={14} color={theme.colors.accent} strokeWidth={2.5} />
              <Text
                style={[styles.statPillValue, { color: theme.colors.accent }]}
              >
                {pinnedCount}
              </Text>
              <Text
                style={[styles.statPillLabel, { color: theme.colors.accent }]}
              >
                Pinned
              </Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearch}
            placeholder="Search alerts..."
          />
        </View>

        {/* Category chips */}
        <View style={{ marginTop: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          >
            {categoryChips.map((chip) => (
              <CategoryChip
                key={chip.key}
                label={chip.label}
                active={activeCategory === chip.key}
                onPress={() => {
                  triggerHaptic("selection");
                  setCategory(chip.key);
                }}
                theme={theme}
              />
            ))}
          </ScrollView>
        </View>

        {/* Alerts list */}
        <View style={{ paddingHorizontal: 16, marginTop: 20, gap: 10 }}>
          {filtered.length > 0 ? (
            filtered.map((alert, i) => (
              <Animated.View
                key={alert.id}
                entering={FadeInDown.delay(i * 60).duration(400)}
              >
                <AnnouncementCard
                  announcement={alert}
                  onPress={() => handleAlertPress(alert)}
                />
              </Animated.View>
            ))
          ) : (
            <EmptyState
              icon={
                <Bell
                  size={28}
                  color={theme.colors.textSecondary}
                  strokeWidth={2}
                />
              }
              title="No alerts found"
              description="Try a different category or search term"
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const CategoryChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  theme: any;
}> = ({ label, active, onPress, theme }) => {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    onPress();
  }, [onPress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.categoryChip,
        {
          backgroundColor: active ? theme.colors.accent : theme.colors.card,
          borderColor: active ? theme.colors.accent : theme.colors.border,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.categoryChipText,
          { color: active ? "#FFFFFF" : theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
