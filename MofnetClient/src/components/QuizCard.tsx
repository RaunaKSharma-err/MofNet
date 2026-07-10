import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Check, X, Clock } from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { TextInput } from 'react-native';
import { triggerHaptic } from '@/src/utils/haptics';
import type { QuizQuestion } from '@/src/types';

interface QuizCardProps {
  question: QuizQuestion;
  index: number;
  total: number;
  selectedAnswer?: string;
  onAnswer: (answer: string) => void;
  showResult?: boolean;
  timeLeft?: number;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  index,
  total,
  selectedAnswer,
  onAnswer,
  showResult = false,
  timeLeft,
}) => {
  const { theme } = useTheme();
  const cardKey = `${question.id}-${index}`;

  const handleSelect = (answer: string) => {
    triggerHaptic('selection');
    onAnswer(answer);
  };

  const isCorrect = (answer: string) =>
    answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

  return (
    <View key={cardKey} style={styles.container}>
      <View style={styles.topRow}>
        <View style={[styles.progressChip, { backgroundColor: theme.colors.primaryLight }]}>
          <Text style={[styles.progressText, { color: theme.colors.primary }]}>
            Question {index + 1} / {total}
          </Text>
        </View>
        {timeLeft != null && (
          <View style={[styles.timerChip, { backgroundColor: theme.colors.warning + '18' }]}>
            <Clock size={12} color={theme.colors.warning} strokeWidth={2.5} />
            <Text style={[styles.timerText, { color: theme.colors.warning }]}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.topic, { color: theme.colors.textTertiary }]}>
        {question.topic}
      </Text>
      <Text style={[styles.question, { color: theme.colors.textPrimary }]}>
        {question.question}
      </Text>

      {question.type === 'fill' ? (
        <FillInput
          value={selectedAnswer || ''}
          onSubmit={handleSelect}
          showResult={showResult}
          correctAnswer={question.correctAnswer}
          theme={theme}
        />
      ) : (
        <View style={styles.optionsWrap}>
          {(question.options || []).map((opt, i) => {
            const selected = selectedAnswer === opt;
            const correct = isCorrect(opt);
            const showCorrect = showResult && correct;
            const showWrong = showResult && selected && !correct;

            return (
              <Pressable
                key={i}
                onPress={() => !showResult && handleSelect(opt)}
                disabled={showResult}
                style={[
                  styles.option,
                  {
                    backgroundColor: showCorrect
                      ? theme.colors.success + '15'
                      : showWrong
                      ? theme.colors.error + '15'
                      : selected
                      ? theme.colors.primary + '10'
                      : theme.colors.card,
                    borderColor: showCorrect
                      ? theme.colors.success
                      : showWrong
                      ? theme.colors.error
                      : selected
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionIndicator,
                    {
                      backgroundColor: showCorrect
                        ? theme.colors.success
                        : showWrong
                        ? theme.colors.error
                        : selected
                        ? theme.colors.primary
                        : 'transparent',
                      borderColor: showCorrect
                        ? theme.colors.success
                        : showWrong
                        ? theme.colors.error
                        : selected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={styles.optionLetter}>{String.fromCharCode(65 + i)}</Text>
                </View>
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: showCorrect
                        ? theme.colors.success
                        : showWrong
                        ? theme.colors.error
                        : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {opt}
                </Text>
                {showCorrect && <Check size={16} color={theme.colors.success} strokeWidth={3} />}
                {showWrong && <X size={16} color={theme.colors.error} strokeWidth={3} />}
              </Pressable>
            );
          })}
        </View>
      )}

      {showResult && (
        <View style={[styles.explanation, { backgroundColor: theme.colors.primaryLight }]}>
          <Text style={[styles.explanationLabel, { color: theme.colors.primary }]}>EXPLANATION</Text>
          <Text style={[styles.explanationText, { color: theme.colors.textPrimary }]}>
            {question.explanation}
          </Text>
        </View>
      )}
    </View>
  );
};

const FillInput: React.FC<{
  value: string;
  onSubmit: (v: string) => void;
  showResult: boolean;
  correctAnswer: string;
  theme: any;
}> = ({ value, onSubmit, showResult, correctAnswer, theme }) => {
  const [input, setInput] = React.useState(value);
  return (
    <View>
      <View
        style={[
          styles.fillInputWrap,
          {
            backgroundColor: theme.colors.card,
            borderColor: showResult
              ? input.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
                ? theme.colors.success
                : theme.colors.error
              : theme.colors.border,
          },
        ]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type your answer..."
          placeholderTextColor={theme.colors.textTertiary}
          style={[styles.fillInput, { color: theme.colors.textPrimary }]}
          editable={!showResult}
        />
        {!showResult && (
          <Pressable
            onPress={() => onSubmit(input)}
            style={[styles.fillSubmit, { backgroundColor: theme.colors.primary }]}
          >
            <Check size={16} color="#FFFFFF" strokeWidth={3} />
          </Pressable>
        )}
      </View>
      {showResult && (
        <Text style={[styles.fillAnswer, { color: theme.colors.textSecondary }]}>
          Correct answer: <Text style={{ fontWeight: '700', color: theme.colors.success }}>{correctAnswer}</Text>
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  topic: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  question: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  optionsWrap: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  optionLetter: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  explanation: {
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  explanationLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 19,
  },
  fillInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 10,
  },
  fillInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  fillSubmit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillAnswer: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
});
