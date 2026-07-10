import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BookOpen, Layers } from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { ChatSource } from '@/src/types';

interface SourceCardProps {
  source: ChatSource;
  confidence?: number;
  timestamp?: number;
  compact?: boolean;
}

export const SourceCard: React.FC<SourceCardProps> = ({
  source,
  confidence = 94,
  timestamp,
  compact = false,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.mode === 'dark' ? 'rgba(23,193,178,0.08)' : theme.colors.accentLight,
          borderColor: theme.colors.accent + '30',
        },
        compact && { paddingVertical: 8, paddingHorizontal: 10 },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.accent + '20' }]}>
          <BookOpen size={12} color={theme.colors.accent} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sourceLabel, { color: theme.colors.accent }]}>
            SOURCE
          </Text>
          <Text style={[styles.sourceTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {source.grade} {source.subject}
          </Text>
          <Text style={[styles.sourceChapter, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            Chapter {source.chapterNumber}: {source.chapter}
          </Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.metaRow}>
          <View style={styles.confidenceWrap}>
            <Layers size={11} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
              Confidence
            </Text>
            <View style={[styles.confidenceBar, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: `${confidence}%`,
                    backgroundColor:
                      confidence >= 90 ? theme.colors.success : confidence >= 70 ? theme.colors.warning : theme.colors.error,
                  },
                ]}
              />
            </View>
            <Text style={[styles.confidenceValue, { color: theme.colors.textPrimary }]}>
              {confidence}%
            </Text>
          </View>
          {timestamp && (
            <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 1,
  },
  sourceTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  sourceChapter: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  confidenceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '600',
  },
  confidenceBar: {
    flex: 1,
    maxWidth: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '500',
  },
});
