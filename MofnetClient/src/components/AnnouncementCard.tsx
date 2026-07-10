import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { AnimatedCard } from './AnimatedCard';
import { Pin, Paperclip, AlertTriangle, BookOpen, FileText, Calendar, Bell } from 'lucide-react-native';
import { formatTimeAgo } from '@/src/utils/format';
import type { Announcement } from '@/src/types';

interface AnnouncementCardProps {
  announcement: Announcement;
  onPress?: () => void;
}

const categoryConfig = {
  emergency: { icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.10)', label: 'EMERGENCY' },
  exam: { icon: FileText, color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', label: 'EXAM' },
  homework: { icon: BookOpen, color: '#006989', bg: 'rgba(0,105,137,0.10)', label: 'HOMEWORK' },
  event: { icon: Calendar, color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', label: 'EVENT' },
  announcement: { icon: Bell, color: '#17C3B2', bg: 'rgba(23,193,178,0.10)', label: 'NOTICE' },
};

const priorityConfig = {
  high: { color: '#EF4444', label: 'HIGH' },
  medium: { color: '#F59E0B', label: 'MED' },
  low: { color: '#6B7280', label: 'LOW' },
};

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, onPress }) => {
  const { theme } = useTheme();
  const cat = categoryConfig[announcement.category];
  const pri = priorityConfig[announcement.priority];
  const CatIcon = cat.icon;

  return (
    <AnimatedCard
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: announcement.read ? theme.colors.card : theme.colors.card,
          borderColor: announcement.pinned ? cat.color + '40' : theme.colors.border,
          borderWidth: 1,
        },
        !announcement.read && { borderLeftWidth: 3, borderLeftColor: cat.color },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
          <CatIcon size={16} color={cat.color} strokeWidth={2.3} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.tagRow}>
            <Text style={[styles.categoryLabel, { color: cat.color }]}>{cat.label}</Text>
            <View style={[styles.priorityChip, { backgroundColor: pri.color + '18' }]}>
              <Text style={[styles.priorityText, { color: pri.color }]}>{pri.label}</Text>
            </View>
            {announcement.pinned && (
              <Pin size={11} color={cat.color} strokeWidth={2.5} fill={cat.color} />
            )}
          </View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {announcement.title}
          </Text>
        </View>
      </View>

      <Text style={[styles.body, { color: theme.colors.textSecondary }]} numberOfLines={3}>
        {announcement.body}
      </Text>

      <View style={styles.footerRow}>
        <Text style={[styles.author, { color: theme.colors.textTertiary }]} numberOfLines={1}>
          {announcement.author}
        </Text>
        <View style={styles.footerRight}>
          {announcement.attachments != null && announcement.attachments > 0 && (
            <View style={styles.attachmentChip}>
              <Paperclip size={10} color={theme.colors.textTertiary} strokeWidth={2.2} />
              <Text style={[styles.attachmentText, { color: theme.colors.textTertiary }]}>
                {announcement.attachments}
              </Text>
            </View>
          )}
          <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>
            {formatTimeAgo(announcement.createdAt)}
          </Text>
        </View>
      </View>
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  priorityChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 20,
    marginTop: 2,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  author: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  attachmentText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
  },
});
