import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedCard } from './AnimatedCard';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  gradient?: [string, string];
  trend?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  gradient = ['#006989', '#17C3B2'],
  trend,
  style,
  onPress,
}) => {
  const { theme } = useTheme();

  return (
    <AnimatedCard
      onPress={onPress}
      style={[
        {
          borderRadius: 20,
          overflow: 'hidden',
          ...theme.getShadow('sm'),
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 14, position: 'relative' }}
      >
        <View style={styles.orb} />
        <View style={styles.headerRow}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          {trend && (
            <View style={styles.trendChip}>
              <Text style={styles.trendText}>{trend}</Text>
            </View>
          )}
        </View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    top: -20,
    right: -15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconWrap: {},
  trendChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  trendText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  value: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
