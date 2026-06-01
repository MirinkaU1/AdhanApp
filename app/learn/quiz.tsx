import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useIsDark } from "@/components/useColorScheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText } from "@/components/ui";
import { AppCard } from "@/components/ui";
import useQuizStore, {
  QuizQuestion,
  COINS_PER_CORRECT,
} from "@/stores/useQuizStore";
import useCoinsStore from "@/stores/useCoinsStore";
import quizData from "@/assets/data/quizQuestions.json";

// =====================================================
// CONSTANTS
// =====================================================

const TIMER_SECONDS = 15;
const QUESTIONS_PER_QUIZ = 10;

// =====================================================
// HELPERS
// =====================================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getQuestionsForCategory(categoryId: string): QuizQuestion[] {
  const pool =
    categoryId === "random"
      ? (quizData.questions as QuizQuestion[])
      : (quizData.questions as QuizQuestion[]).filter(
          (q) => q.category === categoryId,
        );

  return shuffleArray(pool)
    .slice(0, QUESTIONS_PER_QUIZ)
    .map((question) => {
      const optionsWithOriginalIndex = question.options.map((label, index) => ({
        label,
        originalIndex: index,
      }));
      const shuffledOptions = shuffleArray(optionsWithOriginalIndex);

      return {
        ...question,
        options: shuffledOptions.map((option) => option.label),
        correctIndex: shuffledOptions.findIndex(
          (option) => option.originalIndex === question.correctIndex,
        ),
      };
    });
}

function getCategoryMeta(categoryId: string) {
  if (categoryId === "random") {
    return { color: "#7C3AED", gradient: ["#7C3AED", "#2563EB"] };
  }
  const cat = quizData.categories.find((c) => c.id === categoryId);
  return cat
    ? { color: cat.color, gradient: cat.gradient }
    : { color: "#7C3AED", gradient: ["#7C3AED", "#5B21B6"] };
}

function getScoreMessage(score: number, total: number, t: Function): string {
  const ratio = score / total;
  if (ratio >= 0.9) return t("quiz.results.excellent");
  if (ratio >= 0.7) return t("quiz.results.great");
  if (ratio >= 0.5) return t("quiz.results.good");
  return t("quiz.results.tryAgain");
}

function getStarCount(score: number, total: number): number {
  const ratio = score / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

// =====================================================
// ANSWER BUTTON
// =====================================================

interface AnswerButtonProps {
  label: string;
  index: number;
  letter: string;
  selectedAnswer: number | null;
  correctIndex: number;
  answered: boolean;
  onPress: (index: number) => void;
  isDark: boolean;
}

function AnswerButton({
  label,
  index,
  letter,
  selectedAnswer,
  correctIndex,
  answered,
  onPress,
  isDark,
}: AnswerButtonProps) {
  const isSelected = selectedAnswer === index;
  const isCorrect = index === correctIndex;

  let bgColor: string;
  let borderColor: string;
  let textColor: string;
  let letterBg: string;

  if (!answered) {
    bgColor = isDark ? "#1E293B" : "#FFFFFF";
    borderColor = isDark ? "#334155" : "#E2E8F0";
    textColor = isDark ? "#F1F5F9" : "#1E293B";
    letterBg = isDark ? "#334155" : "#F1F5F9";
  } else if (isCorrect) {
    bgColor = "#DCFCE7";
    borderColor = "#22C55E";
    textColor = "#15803D";
    letterBg = "#22C55E";
  } else if (isSelected && !isCorrect) {
    bgColor = "#FEF2F2";
    borderColor = "#EF4444";
    textColor = "#B91C1C";
    letterBg = "#EF4444";
  } else {
    bgColor = isDark ? "#1E293B" : "#F8FAFC";
    borderColor = isDark ? "#1E293B" : "#E2E8F0";
    textColor = isDark ? "#64748B" : "#94A3B8";
    letterBg = isDark ? "#0F172A" : "#E2E8F0";
  }

  return (
    <Pressable
      onPress={() => !answered && onPress(index)}
      disabled={answered}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: bgColor,
        borderWidth: 1.5,
        borderColor,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: letterBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppText
          variant="bodyMedium"
          style={{
            color: answered && (isCorrect || isSelected) ? "#fff" : textColor,
            fontWeight: "700",
            fontSize: 14,
          }}
        >
          {letter}
        </AppText>
      </View>

      <AppText
        variant="body"
        style={{
          flex: 1,
          color: textColor,
          fontWeight: answered && isCorrect ? "600" : "400",
        }}
      >
        {label}
      </AppText>

      {answered && isCorrect && (
        <MaterialIconsRound name="check-circle" size={20} color="#22C55E" />
      )}
      {answered && isSelected && !isCorrect && (
        <MaterialIconsRound name="cancel" size={20} color="#EF4444" />
      )}
    </Pressable>
  );
}

// =====================================================
// RESULTS SCREEN
// =====================================================

interface ResultsProps {
  score: number;
  total: number;
  coinsEarned: number;
  categoryColor: string;
  categoryGradient: string[];
  onReplay: () => void;
  onBack: () => void;
  t: Function;
}

function ResultsView({
  score,
  total,
  coinsEarned,
  categoryColor,
  categoryGradient,
  onReplay,
  onBack,
  t,
}: ResultsProps) {
  const isDark = useIsDark();
  const stars = getStarCount(score, total);
  const message = getScoreMessage(score, total, t);
  const percent = Math.round((score / total) * 100);

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stars */}
        <View className="flex-row gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <MaterialIconsRound
              key={i}
              name={i <= stars ? "star" : "star-border"}
              size={48}
              color={i <= stars ? "#F59E0B" : isDark ? "#334155" : "#CBD5E1"}
            />
          ))}
        </View>

        {/* Score circle */}
        <View
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            borderWidth: 6,
            borderColor: categoryColor,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            backgroundColor: categoryColor + "12",
          }}
        >
          <AppText
            variant="h1"
            style={{ color: categoryColor, fontSize: 42, fontWeight: "700" }}
          >
            {score}
          </AppText>
          <AppText variant="label" style={{ color: categoryColor + "99" }}>
            / {total}
          </AppText>
        </View>

        {/* Message */}
        <AppText variant="h2" className="text-center mb-1">
          {message}
        </AppText>
        <AppText
          variant="body"
          className="text-center mb-6"
          style={{ opacity: 0.6 }}
        >
          {t("quiz.results.scorePercent", { percent })}
        </AppText>

        {/* Coins earned banner */}
        {coinsEarned > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: "#FEF3C7",
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 14,
              marginBottom: 28,
              borderWidth: 1,
              borderColor: "#FCD34D",
              width: "100%",
              justifyContent: "center",
            }}
          >
            <AppText style={{ fontSize: 24 }}>🪙</AppText>
            <AppText
              variant="bodyMedium"
              style={{ color: "#92400E", fontWeight: "700", fontSize: 18 }}
            >
              +{coinsEarned}
            </AppText>
            <AppText variant="body" style={{ color: "#92400E" }}>
              {t("quiz.results.coinsEarned")}
            </AppText>
          </View>
        )}

        {/* Actions */}
        <View style={{ width: "100%", gap: 12 }}>
          <Pressable
            onPress={onReplay}
            style={{ borderRadius: 16, overflow: "hidden" }}
          >
            <LinearGradient
              colors={categoryGradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 56,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <MaterialIconsRound name="replay" size={20} color="#fff" />
              <AppText
                variant="bodyMedium"
                style={{ color: "#fff", fontWeight: "600" }}
              >
                {t("quiz.results.replay")}
              </AppText>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={onBack}
            style={{
              height: 56,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: isDark ? "#334155" : "#E2E8F0",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <MaterialIconsRound
              name="arrow-back"
              size={18}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
            <AppText variant="bodyMedium" style={{ opacity: 0.7 }}>
              {t("quiz.results.backToCategories")}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// =====================================================
// MAIN QUIZ SCREEN
// =====================================================

export default function QuizScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isDark = useIsDark();
  const { category } = useLocalSearchParams<{ category: string }>();

  const { session, startSession, recordAnswer, nextQuestion, resetSession } =
    useQuizStore();
  const addCoins = useCoinsStore((s) => s.addCoins);

  // Local UI state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answeredQuestionId, setAnsweredQuestionId] = useState<string | null>(
    null,
  );
  const [timeExpiredQuestionId, setTimeExpiredQuestionId] = useState<
    string | null
  >(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [coinsAwarded, setCoinsAwarded] = useState(false);
  const answeredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerAnim = useRef(new Animated.Value(1)).current;

  const categoryMeta = getCategoryMeta(category || "random");
  const categoryColor = categoryMeta.color;
  const categoryGradient = categoryMeta.gradient;

  // =====================================================
  // INITIALIZE SESSION
  // =====================================================
  useEffect(() => {
    if (!category) return;
    const questions = getQuestionsForCategory(category);
    startSession(category, questions);
    setCoinsAwarded(false);
    return () => {
      resetSession();
    };
  }, [category]);

  // =====================================================
  // AWARD COINS WHEN SESSION COMPLETES
  // =====================================================
  useEffect(() => {
    if (!session?.isComplete || coinsAwarded || session.coinsEarned <= 0)
      return;
    setCoinsAwarded(true);

    addCoins(session.coinsEarned, {
      reason: "quiz_correct_answer",
      referenceKey: `quiz_${category}_${session.startedAt}`,
    });
  }, [session?.isComplete]);

  // =====================================================
  // TIMER LOGIC
  // =====================================================
  useLayoutEffect(() => {
    if (!session || session.isComplete) return;
    const currentQuestionId = session.questions[session.currentIndex]?.id;

    setSelectedAnswer(null);
    setAnsweredQuestionId(null);
    setTimeExpiredQuestionId(null);
    setTimeLeft(TIMER_SECONDS);
    answeredRef.current = false;

    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: TIMER_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!answeredRef.current) {
            answeredRef.current = true;
            recordAnswer(null);
            setAnsweredQuestionId(currentQuestionId ?? null);
            setTimeExpiredQuestionId(currentQuestionId ?? null);
          }
          if (timerRef.current) clearInterval(timerRef.current);
          timerAnim.stopAnimation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerAnim.stopAnimation();
    };
  }, [session?.currentIndex]);

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleSelectAnswer = useCallback(
    (index: number) => {
      const currentQuestionId = session?.questions[session.currentIndex]?.id;
      if (!currentQuestionId) return;
      if (answeredRef.current) return;
      answeredRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timerAnim.stopAnimation();
      setSelectedAnswer(index);
      setAnsweredQuestionId(currentQuestionId);
      setTimeExpiredQuestionId(null);
      recordAnswer(index);
    },
    [session, recordAnswer],
  );

  const handleNext = useCallback(() => {
    nextQuestion();
  }, [nextQuestion]);

  const handleReplay = useCallback(() => {
    if (!category) return;
    const questions = getQuestionsForCategory(category);
    startSession(category, questions);
    setCoinsAwarded(false);
  }, [category]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // =====================================================
  // GUARDS
  // =====================================================
  if (!session || !category) {
    return (
      <View className="flex-1 bg-bg-light dark:bg-bg-dark items-center justify-center">
        <AppText variant="body">{t("common.loading")}</AppText>
      </View>
    );
  }

  // =====================================================
  // RESULTS VIEW
  // =====================================================
  if (session.isComplete) {
    return (
      <ResultsView
        score={session.score}
        total={session.questions.length}
        coinsEarned={session.coinsEarned}
        categoryColor={categoryColor}
        categoryGradient={categoryGradient}
        onReplay={handleReplay}
        onBack={handleBack}
        t={t}
      />
    );
  }

  // =====================================================
  // QUIZ VIEW
  // =====================================================
  const currentQ = session.questions[session.currentIndex];
  const total = session.questions.length;
  const progress = (session.currentIndex + 1) / total;
  const letters = ["A", "B", "C", "D"];
  const answered = answeredQuestionId === currentQ.id;
  const timeExpired = timeExpiredQuestionId === currentQ.id;
  const currentSelectedAnswer = answered ? selectedAnswer : null;
  const isCorrectAnswer =
    currentSelectedAnswer !== null &&
    currentSelectedAnswer === currentQ.correctIndex;
  const isLastQuestion = session.currentIndex === total - 1;

  const timerColor = timerAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 1],
    outputRange: ["#EF4444", "#F59E0B", "#F59E0B", "#22C55E"],
  });

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <LinearGradient
        colors={categoryGradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={handleBack}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRound name="close" size={20} color="#fff" />
          </Pressable>

          <AppText
            variant="bodyMedium"
            style={{ color: "#fff", fontWeight: "600" }}
          >
            {t(`quiz.categories.${category}`)}
          </AppText>

          {/* Score + coins */}
          <View className="flex-row items-center gap-2">
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <AppText
                variant="caption"
                style={{ color: "#fff", fontWeight: "700" }}
              >
                {session.score} ✓
              </AppText>
            </View>
            {session.coinsEarned > 0 && (
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <AppText style={{ fontSize: 12 }}>🪙</AppText>
                <AppText
                  variant="caption"
                  style={{ color: "#fff", fontWeight: "700" }}
                >
                  {session.coinsEarned}
                </AppText>
              </View>
            )}
          </View>
        </View>

        {/* Progress bar */}
        <View
          className="mt-4 rounded-full overflow-hidden"
          style={{ height: 4, backgroundColor: "rgba(255,255,255,0.25)" }}
        >
          <View
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              backgroundColor: "#fff",
              borderRadius: 999,
            }}
          />
        </View>

        <View className="flex-row justify-between mt-1.5">
          <AppText
            variant="label"
            style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}
          >
            {t("quiz.question")} {session.currentIndex + 1} / {total}
          </AppText>
          <AppText
            variant="label"
            style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}
          >
            {timeLeft}s
          </AppText>
        </View>
      </LinearGradient>

      {/* Timer bar */}
      <View
        style={{ height: 4, backgroundColor: isDark ? "#1E293B" : "#E2E8F0" }}
      >
        <Animated.View
          style={{
            height: "100%",
            borderRadius: 999,
            backgroundColor: timerColor,
            width: timerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          }}
        />
      </View>

      {/* Content */}
      <ScrollView
        key={currentQ.id}
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View key={currentQ.id}>
          {/* Question card */}
          <AppCard className="p-5 mb-5">
            <AppText
              variant="body"
              className="leading-7"
              style={{ fontSize: 17, fontWeight: "500" }}
            >
              {currentQ.question}
            </AppText>
          </AppCard>

          {/* Answer options */}
          <View>
            {currentQ.options.map((option, index) => (
              <AnswerButton
                key={`${currentQ.id}-${index}`}
                label={option}
                index={index}
                letter={letters[index]}
                selectedAnswer={currentSelectedAnswer}
                correctIndex={currentQ.correctIndex}
                answered={answered}
                onPress={handleSelectAnswer}
                isDark={isDark}
              />
            ))}
          </View>
        </View>

        {/* Feedback + anecdote */}
        {answered && (
          <View style={{ marginTop: 4 }}>
            {/* Result label */}
            <View
              className="flex-row items-center gap-2 mb-3"
              style={{
                backgroundColor: isCorrectAnswer ? "#DCFCE7" : "#FEF2F2",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <MaterialIconsRound
                name={isCorrectAnswer ? "check-circle" : "cancel"}
                size={20}
                color={isCorrectAnswer ? "#22C55E" : "#EF4444"}
              />
              <AppText
                variant="bodyMedium"
                style={{
                  color: isCorrectAnswer ? "#15803D" : "#B91C1C",
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                {timeExpired
                  ? t("quiz.timeUp")
                  : isCorrectAnswer
                    ? t("quiz.correct")
                    : t("quiz.incorrect", {
                        answer: currentQ.options[currentQ.correctIndex],
                      })}
              </AppText>

              {/* +2 coins badge on correct answer */}
              {isCorrectAnswer && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                    backgroundColor: "#FEF3C7",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#FCD34D",
                  }}
                >
                  <AppText style={{ fontSize: 13 }}>🪙</AppText>
                  <AppText
                    variant="caption"
                    style={{ color: "#92400E", fontWeight: "700" }}
                  >
                    +{COINS_PER_CORRECT}
                  </AppText>
                </View>
              )}
            </View>

            {/* Anecdote card */}
            <View
              style={{
                backgroundColor: categoryColor + "12",
                borderRadius: 16,
                padding: 16,
                borderLeftWidth: 3,
                borderLeftColor: categoryColor,
                marginBottom: 16,
              }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <MaterialIconsRound
                  name="auto-awesome"
                  size={16}
                  color={categoryColor}
                />
                <AppText
                  variant="caption"
                  style={{ color: categoryColor, fontWeight: "600" }}
                >
                  {t("quiz.didYouKnow")}
                </AppText>
              </View>
              <AppText
                variant="body"
                className="leading-6"
                style={{ fontSize: 14 }}
              >
                {currentQ.anecdote}
              </AppText>
            </View>

            {/* Next button */}
            <Pressable
              onPress={handleNext}
              style={{ borderRadius: 16, overflow: "hidden" }}
            >
              <LinearGradient
                colors={categoryGradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 56,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <AppText
                  variant="bodyMedium"
                  style={{ color: "#fff", fontWeight: "600" }}
                >
                  {isLastQuestion
                    ? t("quiz.seeResults")
                    : t("quiz.nextQuestion")}
                </AppText>
                <MaterialIconsRound
                  name={isLastQuestion ? "emoji-events" : "arrow-forward"}
                  size={20}
                  color="#fff"
                />
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
