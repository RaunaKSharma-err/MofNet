import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/theme/ThemeProvider';
import { ProgressRing } from './ProgressRing';
import { AnimatedCard } from './AnimatedCard';

interface HeroCardProps {
  title: string;
  subtitle: string;
  progress?: number;
  features?: string[];
  ctaLabel?: string;
  onCtaPress?: () => void;
  gradientColors?: [string, string];
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  title,
  subtitle,
  progress = 0,
  features = [],
  ctaLabel,
  onCtaPress,
  gradientColors,
  icon,
  style,
}) => {
  const { theme } = useTheme();
  const colors = gradientColors || [theme.colors.primary, theme.colors.accent];

  return (
    <AnimatedCard
      onPress={onCtaPress}
      style={[
        {
          borderRadius: theme.radius.xl,
          overflow: 'hidden',
          ...theme.getShadow('primaryGlow'),
        },
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20, position: 'relative' }}
      >
        {/* Decorative orbs */}
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            {icon && <View style={{ marginBottom: 8 }}>{icon}</View>}
            <Text style={[styles.title, { color: '#FFFFFF' }]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
          {progress > 0 && (
            <ProgressRing
              progress={progress}
              size={64}
              strokeWidth={5}
              color="#FFFFFF"
              trackColor="rgba(255,255,255,0.2)"
            >
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </ProgressRing>
          )}
        </View>

        {features.length > 0 && (
          <View style={styles.featuresRow}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureChip}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {ctaLabel && (
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </View>
        )}
      </LinearGradient>
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 20,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  ctaButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#006989',
    fontSize: 15,
    fontWeight: '700',
  },
  orb1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  orb2: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
