import React, { useCallback, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import {
  Volume2,
  Languages,
  Lightbulb,
  HelpCircle,
  Bookmark,
  Copy,
  Share,
  BookOpen,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeProvider";
import { triggerHaptic } from "@/src/utils/haptics";
import type { ChatMessage } from "@/src/types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CYCLE_DURATION = 2400;

const STATUS_PHRASES = [
  "Reasoning...",
  "Thinking...",
  "Fetching data...",
  "Composing answer...",
];

const StreamingStatus: React.FC<{ theme: any }> = ({ theme }) => {
  const dot1 = useSharedValue(0.5);
  const dot2 = useSharedValue(0.5);
  const dot3 = useSharedValue(0.5);
  const dot4 = useSharedValue(0.5);
  const dot5 = useSharedValue(0.5);
  const textOpacity = useSharedValue(1);
  const slideY = useSharedValue(0);
  const textIndex = useSharedValue(0);

  useEffect(() => {
    textOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );

    slideY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    const dots = [dot1, dot2, dot3, dot4, dot5];
    dots.forEach((dot, i) => {
      dot.value = withDelay(
        i * 100,
        withRepeat(
          withSequence(
            withTiming(2, { duration: 320, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.5, { duration: 320, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        ),
      );
    });

    textIndex.value = withRepeat(
      withTiming(STATUS_PHRASES.length, {
        duration: CYCLE_DURATION * STATUS_PHRASES.length,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: slideY.value }],
  }));

  const dotStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: dot1.value }],
  }));
  const dotStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: dot2.value }],
  }));
  const dotStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: dot3.value }],
  }));
  const dotStyle4 = useAnimatedStyle(() => ({
    transform: [{ scale: dot4.value }],
  }));
  const dotStyle5 = useAnimatedStyle(() => ({
    transform: [{ scale: dot5.value }],
  }));

  const wordIndex = Math.floor(textIndex.value) % STATUS_PHRASES.length;

  return (
    <Animated.View style={[styles.streamingStatus]}>
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.streamingDot, { backgroundColor: theme.colors.accent + "40" }, dotStyle1]} />
        <Animated.View style={[styles.streamingDot, { backgroundColor: theme.colors.accent + "60" }, dotStyle2]} />
        <Animated.View style={[styles.streamingDot, { backgroundColor: theme.colors.accent }, dotStyle3]} />
        <Animated.View style={[styles.streamingDot, { backgroundColor: theme.colors.accent + "60" }, dotStyle4]} />
        <Animated.View style={[styles.streamingDot, { backgroundColor: theme.colors.accent + "40" }, dotStyle5]} />
      </View>
      <Animated.View style={animatedTextStyle}>
        <Text style={[styles.streamingText, { color: theme.colors.accent }]}>
          {STATUS_PHRASES[wordIndex]}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

interface AIMessageBubbleProps {
  message: ChatMessage;
  onReadAloud?: (text: string) => void;
  onTranslate?: (message: ChatMessage) => void;
  onExplainSimpler?: (message: ChatMessage) => void;
  onGenerateQuiz?: (message: ChatMessage) => void;
  onBookmark?: (message: ChatMessage) => void;
  onCopy?: (text: string) => void;
  onShare?: (text: string) => void;
  isStreaming?: boolean;
}

export const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({
  message,
  onReadAloud,
  onTranslate,
  onExplainSimpler,
  onGenerateQuiz,
  onBookmark,
  onCopy,
  onShare,
  isStreaming = false,
}) => {
  const { theme } = useTheme();
  const isUser = message.role === "user";

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  useEffect(() => {
    if (!isStreaming) return;
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  const formattedContent = useMemo(
    () => parseSimpleMarkdown(message.content),
    [message.content],
  );

  const showLoader = isStreaming && !message.content.trim();

  if (isUser) {
    return (
      <View style={styles.userWrap}>
        <View
          style={[
            styles.userBubble,
            {
              backgroundColor: theme.colors.primary,
            },
          ]}
        >
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiWrap}>
      <View style={styles.aiAvatar}>
        {isStreaming && (
          <Animated.View
            style={[
              styles.avatarGlow,
              { backgroundColor: theme.colors.accent },
              glowAnimatedStyle,
            ]}
          />
        )}
        <Animated.View style={[styles.aiAvatarInner, { backgroundColor: theme.colors.accent }, avatarAnimatedStyle]}>
          <Text style={styles.aiAvatarText}>M</Text>
        </Animated.View>
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={[
            styles.aiBubble,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
            isStreaming && showLoader && { borderColor: theme.colors.accent + "50" },
          ]}
        >
          {showLoader ? (
            <StreamingStatus theme={theme} />
          ) : (
            formattedContent.map((block, index) => (
              <Text key={index} style={[styles.aiText, { color: theme.colors.textPrimary }, block.style]}>
                {block.boldSegments ? renderBoldSegments(block.boldSegments, theme) : block.text}
                {isStreaming && index === formattedContent.length - 1 && (
                  <Text style={{ color: theme.colors.accent }}>▋</Text>
                )}
              </Text>
            ))
          )}
        </View>

        {message.source && !isStreaming && (
          <View style={{ marginTop: 8 }}>
            <ModeBadge mode={message.mode} theme={theme} />
            <SourceCardInline
              source={message.source}
              confidence={message.confidence}
              timestamp={message.createdAt}
            />
          </View>
        )}

        {!isStreaming && message.content && (
          <View style={styles.actionsRow}>
            <ActionChip
              icon={
                <Volume2
                  size={13}
                  color={theme.colors.textSecondary}
                  strokeWidth={2.2}
                />
              }
              label="Read"
              onPress={() => onReadAloud?.(message.content)}
              theme={theme}
            />
            <ActionChip
              icon={
                <Languages
                  size={13}
                  color={theme.colors.textSecondary}
                  strokeWidth={2.2}
                />
              }
              label="Translate"
              onPress={() => onTranslate?.(message)}
              theme={theme}
            />
            <ActionChip
              icon={
                <Lightbulb
                  size={13}
                  color={theme.colors.textSecondary}
                  strokeWidth={2.2}
                />
              }
              label="Simpler"
              onPress={() => onExplainSimpler?.(message)}
              theme={theme}
            />
            <ActionChip
              icon={
                <HelpCircle
                  size={13}
                  color={theme.colors.textSecondary}
                  strokeWidth={2.2}
                />
              }
              label="Quiz"
              onPress={() => onGenerateQuiz?.(message)}
              theme={theme}
            />
            <ActionChip
              icon={
                <Bookmark
                  size={13}
                  color={
                    message.bookmarked
                      ? theme.colors.accent
                      : theme.colors.textSecondary
                  }
                  strokeWidth={2.2}
                  fill={
                    message.bookmarked ? theme.colors.accent : "transparent"
                  }
                />
              }
              label="Save"
              onPress={() => onBookmark?.(message)}
              theme={theme}
              active={message.bookmarked}
            />
            <ActionChip
              icon={
                <Copy
                  size={13}
                  color={theme.colors.textSecondary}
                  strokeWidth={2.2}
                />
              }
              label="Copy"
              onPress={() => onCopy?.(message.content)}
              theme={theme}
            />
            <ActionChip
              icon={
                <Share
                  size={13}
                  color={theme.colors.textSecondary}
                  strokeWidth={2.2}
                />
              }
              label="Share"
              onPress={() => onShare?.(message.content)}
              theme={theme}
            />
          </View>
        )}
      </View>
    </View>
  );
};

function parseSimpleMarkdown(text: string) {
  const lines = text.split("\n");
  const blocks: { text: string; style?: any; boldSegments?: { text: string; bold: boolean }[] }[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      blocks.push({ text: "\n" });
      continue;
    }

    const listMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    const bulletMatch = trimmed.match(/^[•\-]\s+(.*)/);

    if (listMatch) {
      blocks.push({
        text: `${listMatch[1]}. ${listMatch[2]}\n`,
        style: styles.listItem,
        boldSegments: extractBoldSegments(listMatch[2]),
      });
    } else if (bulletMatch) {
      blocks.push({
        text: `• ${bulletMatch[1]}\n`,
        style: styles.listItem,
        boldSegments: extractBoldSegments(bulletMatch[1]),
      });
    } else if (trimmed.endsWith(":")) {
      blocks.push({
        text: `${trimmed}\n`,
        style: styles.headerText,
        boldSegments: extractBoldSegments(trimmed),
      });
    } else {
      blocks.push({
        text: trimmed + "\n",
        boldSegments: extractBoldSegments(trimmed),
      });
    }
  }

  return blocks;
}

function extractBoldSegments(text: string) {
  const segments: { text: string; bold: boolean }[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  return segments;
}

function renderBoldSegments(
  segments: { text: string; bold: boolean }[],
  theme: any,
) {
  return segments.map((segment, idx) => {
    if (segment.bold) {
      return (
        <Text key={idx} style={[styles.boldText, { color: theme.colors.textPrimary }]}>
          {segment.text}
        </Text>
      );
    }
    return <Text key={idx}>{segment.text}</Text>;
  });
}

const ActionChip: React.FC<{
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  theme: any;
  active?: boolean;
}> = ({ icon, label, onPress, theme, active }) => {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    triggerHaptic("selection");
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 }, () => {
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
        styles.actionChip,
        animatedStyle,
        {
          backgroundColor: active
            ? theme.colors.accent + "15"
            : theme.colors.card,
          borderColor: active
            ? theme.colors.accent + "40"
            : theme.colors.border,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.actionText,
          { color: active ? theme.colors.accent : theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const ModeBadge: React.FC<{
  mode?: 'curriculum' | 'general' | 'safety';
  theme: any;
}> = ({ mode, theme }) => {
  if (!mode) return null;

  const config = {
    curriculum: { label: "📚 Curriculum", color: theme.colors.accent },
    general: { label: "🌐 General Knowledge", color: theme.colors.textSecondary },
    safety: { label: "⚠️ Safety", color: theme.colors.error },
  };

  const { label, color } = config[mode] || config.general;

  return (
    <View
      style={[
        styles.modeBadge,
        { backgroundColor: color + "15", borderColor: color + "40" },
      ]}
    >
      <Text style={[styles.modeBadgeText, { color }]}>
        {label}
      </Text>
    </View>
  );
};

const SourceCardInline: React.FC<{
  source: any;
  confidence?: number;
  timestamp?: number;
}> = ({ source, confidence, timestamp }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.sourceInline,
        {
          backgroundColor:
            theme.mode === "dark"
              ? "rgba(23,193,178,0.08)"
              : theme.colors.accentLight,
          borderColor: theme.colors.accent + "30",
        },
      ]}
    >
      <View style={styles.sourceHeader}>
        <View
          style={[
            styles.sourceIcon,
            { backgroundColor: theme.colors.accent + "20" },
          ]}
        >
          <BookOpen size={11} color={theme.colors.accent} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sourceLabel, { color: theme.colors.accent }]}>
            SOURCE
          </Text>
          <Text
            style={[styles.sourceTitle, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {source.grade} {source.subject}
          </Text>
          <Text
            style={[
              styles.sourceChapter,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            Ch. {source.chapterNumber}: {source.chapter}
          </Text>
        </View>
        {confidence != null && (
          <View style={styles.confidenceWrap}>
            <Text
              style={[
                styles.confidenceLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Confidence
            </Text>
            <Text
              style={[
                styles.confidenceVal,
                {
                  color:
                    confidence >= 90
                      ? theme.colors.success
                      : theme.colors.warning,
                },
              ]}
            >
              {confidence}%
            </Text>
          </View>
        )}
      </View>
      {timestamp && (
        <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>
          {new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  userWrap: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 6,
  },
  userBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  userText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  aiWrap: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 6,
  },
  aiAvatar: {
    paddingTop: 2,
    position: "relative",
  },
  avatarGlow: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    opacity: 0.5,
  },
  aiAvatarInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  aiAvatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  aiBubble: {
    maxWidth: "88%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    minHeight: 56,
    justifyContent: "center",
  },
  aiText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  boldText: {
    fontWeight: "700",
  },
  headerText: {
    fontWeight: "700",
    marginTop: 4,
  },
  listItem: {
    marginLeft: 8,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  sourceInline: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    maxWidth: "88%",
  },
  modeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 6,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  sourceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  sourceIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceLabel: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  sourceTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  sourceChapter: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  confidenceWrap: {
    alignItems: "flex-end",
  },
  confidenceLabel: {
    fontSize: 9,
    fontWeight: "600",
  },
  confidenceVal: {
    fontSize: 13,
    fontWeight: "800",
  },
  timestamp: {
    fontSize: 9,
    fontWeight: "500",
    marginTop: 6,
    textAlign: "right",
  },
  streamingStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  streamingDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  streamingText: {
    fontSize: 13,
    fontWeight: "700",
  },
});

export default AIMessageBubble;
