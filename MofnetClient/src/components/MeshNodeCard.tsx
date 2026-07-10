import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { AnimatedCard } from './AnimatedCard';
import { Wifi, WifiOff, Share2, School, User, GraduationCap, Server } from 'lucide-react-native';
import { formatTimeAgo } from '@/src/utils/format';
import type { MeshNode } from '@/src/types';

interface MeshNodeCardProps {
  node: MeshNode;
  onPress?: () => void;
  selected?: boolean;
}

export const MeshNodeCard: React.FC<MeshNodeCardProps> = ({ node, onPress, selected = false }) => {
  const { theme } = useTheme();

  const statusConfig = {
    connected: { color: theme.colors.success, label: 'Connected', icon: <Wifi size={12} color={theme.colors.success} strokeWidth={2.5} /> },
    weak: { color: theme.colors.warning, label: 'Weak Signal', icon: <Share2 size={12} color={theme.colors.warning} strokeWidth={2.5} /> },
    offline: { color: theme.colors.textTertiary, label: 'Offline', icon: <WifiOff size={12} color={theme.colors.textTertiary} strokeWidth={2.5} /> },
  }[node.status];

  const typeIcon = {
    school: <School size={18} color={theme.colors.primary} strokeWidth={2.2} />,
    student: <User size={18} color={theme.colors.accent} strokeWidth={2.2} />,
    teacher: <GraduationCap size={18} color="#8B5CF6" strokeWidth={2.2} />,
    hub: <Server size={18} color={theme.colors.accent} strokeWidth={2.2} />,
  }[node.type];

  return (
    <AnimatedCard
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
          borderWidth: selected ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryLight }]}>
          {typeIcon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {node.name}
          </Text>
          {node.device && (
            <Text style={[styles.device, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {node.device}
            </Text>
          )}
        </View>
        <View style={[styles.statusChip, { backgroundColor: statusConfig.color + '18' }]}>
          {statusConfig.icon}
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: theme.colors.textTertiary }]}>Sync</Text>
          <Text style={[styles.metaValue, { color: theme.colors.textSecondary }]}>
            {formatTimeAgo(node.lastSync)}
          </Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: theme.colors.textTertiary }]}>Content</Text>
          <Text style={[styles.metaValue, { color: theme.colors.textSecondary }]}>
            {node.contentSynced}%
          </Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: theme.colors.textTertiary }]}>Links</Text>
          <Text style={[styles.metaValue, { color: theme.colors.textSecondary }]}>
            {node.connections.length}
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
    borderWidth: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  device: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  metaDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(120,130,140,0.15)',
  },
});
