import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  FadeIn,
  FadeInDown,
  SlideInUp,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import {
  Send,
  Mic,
  Paperclip,
  Sparkles,
  ArrowLeft,
  X,
  Volume2,
  Square,
  Trash2,
  Plus,
} from "lucide-react-native";
import * as ExpoSpeech from "expo-speech";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useChatStore, generateId } from "@/src/store/chatStore";
import { useAuthStore } from "@/src/store/authStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { useMeshStore } from "@/src/store/meshStore";
import { triggerHaptic } from "@/src/utils/haptics";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { AIMessageBubble } from "@/src/components/AIMessageBubble";
import { EmptyState } from "@/src/components/EmptyState";
import { AppButton } from "@/src/components/AppButton";
import {
  createUserMessage,
  createAssistantMessage,
  streamAIResponse,
} from "@/src/services/aiService";
import type { ChatMessage } from "@/src/types";

const { width, height } = Dimensions.get("window");

const suggestedQuestions = [
  "How do plants make food?",
  "What is photosynthesis?",
  "Explain fractions and decimals",
  "How were the Himalayas formed?",
  "What are verb tenses?",
  "How does electricity work?",
];

export default function TutorScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const createSession = useChatStore((s) => s.createSession);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const toggleBookmark = useChatStore((s) => s.toggleBookmark);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const setVoiceModeStore = useChatStore((s) => s.setVoiceMode);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const user = useAuthStore((s) => s.user);
  const language = useSettingsStore((s) => s.language);
  const meshStatus = useMeshStore((s) => s.status);

  const scrollViewRef = useRef<ScrollView>(null);
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  useEffect(() => {
    if (!activeSessionId && sessions.length === 0) {
      // Don't auto-create — let user start fresh
    }
  }, [activeSessionId, sessions.length]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length, isStreaming]);

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text || input).trim();
      if (!content || isStreaming) return;

      Keyboard.dismiss();
      triggerHaptic("light");

      let sessionId = activeSessionId;
      if (!sessionId) {
        sessionId = createSession();
      }

      const userMsg = createUserMessage(content);
      addMessage(sessionId, userMsg);
      setInput("");

      const assistantMsg = createAssistantMessage();
      addMessage(sessionId, assistantMsg);
      setStreaming(true);

      await streamAIResponse(
        content,
        (chunk) => {
          updateMessage(sessionId!, assistantMsg.id, {
            content:
              (useChatStore
                .getState()
                .sessions.find((s) => s.id === sessionId)
                ?.messages.find((m) => m.id === assistantMsg.id)?.content ||
                "") + chunk,
          });
        },
        (response) => {
          updateMessage(sessionId!, assistantMsg.id, {
            content: response.content,
            source: response.source,
            confidence: response.confidence,
            status: "sent",
          });
          setStreaming(false);
          triggerHaptic("success");
        },
        {
          grade: user?.grade,
          language,
        },
      );
    },
    [
      input,
      isStreaming,
      activeSessionId,
      createSession,
      addMessage,
      updateMessage,
      setStreaming,
      user?.grade,
      language,
    ],
  );

  const handleReadAloud = useCallback(
    (text: string) => {
      triggerHaptic("selection");
      if (speakingId) {
        ExpoSpeech.stop();
        setSpeakingId(null);
        return;
      }
      const cleanText = text.replace(/\*/g, "").replace(/▋/g, "");
      ExpoSpeech.speak(cleanText, {
        language: "en",
        rate: 0.95,
        pitch: 1.0,
        onDone: () => setSpeakingId(null),
      });
      setSpeakingId("speaking");
    },
    [speakingId],
  );

  const handleTranslate = useCallback(
    (message: ChatMessage) => {
      triggerHaptic("selection");
      const translated = message.content.includes("नमस्ते")
        ? message.content
        : "[Translated to Nepali]\n\n" +
          message.content.slice(0, 100) +
          "...\n\nपूर्ण अनुवाद को लागि, कृपया डाउनलोड गरिएको नेपाली मोडेल सिंक गर्नुहोस्।";
      updateMessage(activeSessionId!, message.id, { translated });
    },
    [activeSessionId, updateMessage],
  );

  const handleExplainSimpler = useCallback(
    (message: ChatMessage) => {
      triggerHaptic("selection");
      if (!activeSessionId) return;
      const simplerMsg = createAssistantMessage({
        content:
          "Let me explain this more simply:\n\n" +
          message.content.slice(0, 200) +
          "...\n\n**In simple words:** Think of it like a recipe — you need the right ingredients and steps to get the result. 📚",
        source: message.source,
        confidence: 88,
        status: "sent",
      });
      addMessage(activeSessionId, simplerMsg);
    },
    [activeSessionId, addMessage],
  );

  const handleGenerateQuiz = useCallback(
    (message: ChatMessage) => {
      triggerHaptic("medium");
      router.push("/(tabs)/quiz");
    },
    [router],
  );

  const handleBookmark = useCallback(
    (message: ChatMessage) => {
      if (!activeSessionId) return;
      toggleBookmark(activeSessionId, message.id);
      triggerHaptic("light");
    },
    [activeSessionId, toggleBookmark],
  );

  const handleCopy = useCallback((text: string) => {
    triggerHaptic("selection");
  }, []);

  const handleShare = useCallback((text: string) => {
    triggerHaptic("selection");
  }, []);

  const handleVoiceMode = useCallback(() => {
    triggerHaptic("medium");
    setVoiceMode(true);
    setVoiceModeStore(true);
    setIsListening(true);
  }, [setVoiceModeStore]);

  const handleExitVoiceMode = useCallback(() => {
    triggerHaptic("light");
    setVoiceMode(false);
    setVoiceModeStore(false);
    setIsListening(false);
    ExpoSpeech.stop();
  }, [setVoiceModeStore]);

  const handleVoiceSend = useCallback(() => {
    handleVoiceMode();
  }, [handleVoiceMode]);

  // Voice mode overlay
  if (voiceMode) {
    return <VoiceModeOverlay onClose={handleExitVoiceMode} theme={theme} />;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <View style={styles.headerRow}>
            {activeSession ? (
              <Pressable
                onPress={() => {
                  setActiveSession("");
                  triggerHaptic("light");
                }}
                style={styles.headerBtn}
              >
                <Plus
                  size={20}
                  color={theme.colors.textPrimary}
                  strokeWidth={2.3}
                />
              </Pressable>
            ) : (
              <View
                style={[
                  styles.headerAiIcon,
                  { backgroundColor: theme.colors.accent },
                ]}
              >
                <Sparkles size={16} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {activeSession?.title || "MofNet AI Tutor"}
              </Text>
              <View style={styles.headerStatusRow}>
                <View style={styles.headerStatusDot} />
                <Text
                  style={[
                    styles.headerStatus,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {meshStatus === "online"
                     ? "Connected to MofNet AI"
                     : "Offline AI • Ready"}
                </Text>
              </View>
            </View>
            {activeSession && (
              <Pressable
                onPress={() => {
                  if (activeSessionId) {
                    deleteSession(activeSessionId);
                    triggerHaptic("warning");
                  }
                }}
                style={styles.headerBtn}
              >
                <Trash2
                  size={18}
                  color={theme.colors.error}
                  strokeWidth={2.2}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Messages */}
        {messages.length === 0 ? (
          <EmptyChatState theme={theme} onSuggestion={(q) => handleSend(q)} />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 4 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg, i) => (
              <Animated.View
                key={msg.id}
                entering={FadeInDown.delay(i * 50).duration(400)}
              >
                <AIMessageBubble
                  message={msg}
                  isStreaming={
                    isStreaming &&
                    i === messages.length - 1 &&
                    msg.role === "assistant"
                  }
                  onReadAloud={handleReadAloud}
                  onTranslate={handleTranslate}
                  onExplainSimpler={handleExplainSimpler}
                  onGenerateQuiz={handleGenerateQuiz}
                  onBookmark={handleBookmark}
                  onCopy={handleCopy}
                  onShare={handleShare}
                />
                {msg.translated && (
                  <View
                    style={[
                      styles.translatedBox,
                      {
                        backgroundColor: theme.colors.primaryLight,
                        borderColor: theme.colors.primary + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.translatedText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {msg.translated}
                    </Text>
                  </View>
                )}
              </Animated.View>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              paddingBottom: insets.bottom + 96,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Pressable style={styles.attachBtn}>
              <Paperclip
                size={20}
                color={theme.colors.textTertiary}
                strokeWidth={2.2}
              />
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything... your AI tutor listens"
              placeholderTextColor={theme.colors.textTertiary}
              style={[styles.input, { color: theme.colors.textPrimary }]}
              multiline
              maxLength={500}
              editable={!isStreaming}
            />
            <Pressable
              onPress={handleVoiceMode}
              style={[
                styles.micBtn,
                {
                  backgroundColor: isListening
                    ? theme.colors.error + "20"
                    : theme.colors.accent + "15",
                },
              ]}
            >
              <Mic
                size={18}
                color={isListening ? theme.colors.error : theme.colors.accent}
                strokeWidth={2.3}
              />
            </Pressable>
            <Pressable
              onPress={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              style={[
                styles.sendBtn,
                {
                  backgroundColor:
                    !input.trim() || isStreaming
                      ? theme.colors.textTertiary
                      : theme.colors.accent,
                },
              ]}
            >
              <Send size={16} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const EmptyChatState: React.FC<{
  theme: any;
  onSuggestion: (q: string) => void;
}> = ({ theme, onSuggestion }) => {
  return (
    <View style={styles.emptyContainer}>
      <Animated.View
        entering={FadeIn.delay(100).duration(600)}
        style={styles.emptyIconWrap}
      >
        <LinearGradient
          colors={["#006989", "#17C3B2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyIconGradient}
        >
          <Sparkles size={32} color="#FFFFFF" strokeWidth={2} />
        </LinearGradient>
        <View style={styles.emptyIconRing} />
      </Animated.View>

      <Animated.Text
        entering={FadeIn.delay(200).duration(600)}
        style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}
      >
        Ask MofNet AI
      </Animated.Text>
      <Animated.Text
        entering={FadeIn.delay(300).duration(600)}
        style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}
      >
        Your offline AI tutor knows your curriculum.{"\n"}Ask about Science,
        Math, Social, English & more.
      </Animated.Text>

      <View style={styles.suggestionsWrap}>
        <Text
          style={[
            styles.suggestionsLabel,
            { color: theme.colors.textTertiary },
          ]}
        >
          SUGGESTED QUESTIONS
        </Text>
        <View style={styles.suggestionsList}>
          {suggestedQuestions.map((q, i) => (
            <Animated.View
              key={q}
              entering={FadeInDown.delay(400 + i * 60).duration(500)}
            >
              <Pressable
                onPress={() => {
                  triggerHaptic("light");
                  onSuggestion(q);
                }}
                style={[
                  styles.suggestionChip,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Sparkles
                  size={13}
                  color={theme.colors.accent}
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.suggestionText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {q}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
};

const VoiceModeOverlay: React.FC<{ onClose: () => void; theme: any }> = ({
  onClose,
  theme,
}) => {
  const orbScale = useSharedValue(1);
  const orbOpacity = useSharedValue(0.8);
  const waveScale = useSharedValue(1);

  useEffect(() => {
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    orbOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    waveScale.value = withRepeat(
      withTiming(1.5, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [orbScale, orbOpacity, waveScale]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbOpacity.value,
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale.value }],
    opacity: 0.3,
  }));

  return (
    <View style={styles.voiceOverlay}>
      <LinearGradient
        colors={["#0A1014", "#0E2A33", "#0A1014"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.voiceContainer}>
        <Pressable onPress={onClose} style={styles.voiceCloseBtn}>
          <X size={24} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>

        <View style={styles.voiceContent}>
          <Text style={styles.voiceLabel}>Listening...</Text>
          <Text style={styles.voiceSubLabel}>Tap close when done</Text>

          <View style={styles.voiceOrbWrap}>
            <Animated.View style={[styles.voiceWave1, waveStyle]} />
            <Animated.View style={[styles.voiceOrb, orbStyle]}>
              <LinearGradient
                colors={["#17C3B2", "#006989"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.voiceOrbGradient}
              >
                <Mic size={48} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Waveform */}
          <View style={styles.waveformWrap}>
            {Array.from({ length: 28 }).map((_, i) => (
              <WaveformBar key={i} index={i} />
            ))}
          </View>

          <Text style={styles.voiceHint}>Speak in English or Nepali</Text>
        </View>
      </View>
    </View>
  );
};

const WaveformBar: React.FC<{ index: number }> = ({ index }) => {
  const height = useSharedValue(4 + Math.random() * 20);

  useEffect(() => {
    const interval = setInterval(
      () => {
        height.value = withTiming(4 + Math.random() * 40, {
          duration: 200 + Math.random() * 200,
          easing: Easing.inOut(Easing.ease),
        });
      },
      150 + index * 20,
    );
    return () => clearInterval(interval);
  }, [index, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.waveformBar, animatedStyle]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  headerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  headerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  headerStatus: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconRing: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "rgba(23,193,178,0.3)",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  suggestionsWrap: {
    width: "100%",
    gap: 12,
  },
  suggestionsLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
  },
  suggestionsList: {
    gap: 8,
    width: "100%",
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  // Input bar
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 56,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    padding: 0,
    maxHeight: 100,
    minHeight: 24,
    paddingTop: 8,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  // Translated
  translatedBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 40,
  },
  translatedText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
  },
  // Voice overlay
  voiceOverlay: {
    flex: 1,
    backgroundColor: "#0A1014",
  },
  voiceContainer: {
    flex: 1,
    position: "relative",
  },
  voiceCloseBtn: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  voiceContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  voiceLabel: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  voiceSubLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "500",
  },
  voiceOrbWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
    position: "relative",
  },
  voiceWave1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#17C3B2",
  },
  voiceOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
  },
  voiceOrbGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  waveformWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: 50,
    marginTop: 20,
  },
  waveformBar: {
    width: 3,
    backgroundColor: "#17C3B2",
    borderRadius: 1.5,
  },
  voiceHint: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "500",
  },
});
