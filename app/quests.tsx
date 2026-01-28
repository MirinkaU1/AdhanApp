/**
 * Quests Modal - Page des quêtes journalières
 */

import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";
import useQuestStore, {
  Quest,
  QuestId,
  QuestStatus,
} from "@/stores/useQuestStore";
import { useEffect, useState, useCallback } from "react";

// =====================================================
// COMPONENTS
// =====================================================

/**
 * Barre de progression XP
 */
function XpProgressBar() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const { xp, level, xpToNextLevel, getLevelFromXp } = useQuestStore();
  const { xpInLevel } = getLevelFromXp(xp);
  const progressPercent = (xpInLevel / xpToNextLevel) * 100;

  return (
    <View className="bg-white/10 rounded-2xl p-4 mt-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-amber-500 items-center justify-center">
            <Text className="text-white font-outfit-bold text-sm">{level}</Text>
          </View>
          <Text className="text-white font-outfit-semibold">
            {t("quests.level")} {level}
          </Text>
        </View>
        <Text className="text-white/70 font-outfit-regular text-sm">
          {xpInLevel} / {xpToNextLevel} XP
        </Text>
      </View>
      <View className="h-3 bg-white/20 rounded-full overflow-hidden">
        <View
          className="h-full bg-amber-400 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </View>
    </View>
  );
}

/**
 * Carte de quête
 */
function QuestCard({
  quest,
  onClaim,
}: {
  quest: Quest;
  onClaim: (id: QuestId) => boolean;
}) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const [isClaiming, setIsClaiming] = useState(false);

  const progressPercent = (quest.progress / quest.requirement) * 100;
  const isCompleted = quest.status === "completed";
  const isClaimed = quest.status === "claimed";
  const isLocked = quest.status === "locked";

  // Handler anti-double clic
  const handleClaim = useCallback(() => {
    if (isClaiming) return;
    setIsClaiming(true);
    const success = onClaim(quest.id);
    // Reset après un délai si échec
    if (!success) {
      setTimeout(() => setIsClaiming(false), 500);
    }
  }, [isClaiming, onClaim, quest.id]);

  const statusColors: Record<QuestStatus, string> = {
    active: isDark ? "#1E293B" : "#FFFFFF",
    completed: isDark ? "#14532D" : "#DCFCE7",
    claimed: isDark ? "#1E293B" : "#F1F5F9",
    locked: isDark ? "#0F172A" : "#E2E8F0",
  };

  const borderColors: Record<QuestStatus, string> = {
    active: isDark ? "#334155" : "#E2E8F0",
    completed: "#22C55E",
    claimed: isDark ? "#334155" : "#CBD5E1",
    locked: isDark ? "#1E293B" : "#CBD5E1",
  };

  return (
    <View
      className="rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: statusColors[quest.status],
        borderWidth: 2,
        borderColor: borderColors[quest.status],
        opacity: isLocked ? 0.5 : 1,
      }}
    >
      <View className="flex-row items-start gap-3">
        {/* Icon */}
        <View
          className={`w-12 h-12 rounded-xl items-center justify-center ${
            isCompleted
              ? "bg-green-500"
              : isClaimed
                ? "bg-slate-400"
                : isLocked
                  ? "bg-slate-500"
                  : "bg-primary"
          }`}
        >
          {isClaimed ? (
            <MaterialIconsRound name="check" size={24} color="#fff" />
          ) : isLocked ? (
            <MaterialIconsRound name="lock" size={24} color="#fff" />
          ) : (
            <MaterialIconsRound
              name={quest.icon as MaterialIconName}
              size={24}
              color="#fff"
            />
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={`font-outfit-semibold text-base ${
                isClaimed
                  ? "text-slate-400 dark:text-slate-500 line-through"
                  : "text-text-primary-light dark:text-text-primary-dark"
              }`}
            >
              {t(quest.titleKey)}
            </Text>
            <View className="flex-row items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
              <MaterialIconsRound name="star" size={14} color="#F59E0B" />
              <Text className="text-amber-600 dark:text-amber-400 font-outfit-bold text-xs">
                +{quest.xpReward}
              </Text>
            </View>
          </View>

          <Text
            className={`font-outfit-regular text-sm mt-1 ${
              isClaimed
                ? "text-slate-400 dark:text-slate-600"
                : "text-text-secondary-light dark:text-text-secondary-dark"
            }`}
          >
            {t(quest.descriptionKey)}
          </Text>

          {/* Progress bar */}
          {!isClaimed && !isLocked && (
            <View className="mt-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-outfit-medium text-text-secondary-light dark:text-text-secondary-dark">
                  {quest.progress}/{quest.requirement}
                </Text>
                <Text className="text-xs font-outfit-medium text-text-secondary-light dark:text-text-secondary-dark">
                  {Math.round(progressPercent)}%
                </Text>
              </View>
              <View className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${
                    isCompleted ? "bg-green-500" : "bg-primary"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
            </View>
          )}

          {/* Claim button */}
          {isCompleted && !isClaiming && (
            <Pressable
              onPress={handleClaim}
              className="mt-3 bg-green-500 rounded-xl py-2.5 items-center"
            >
              <Text className="text-white font-outfit-bold text-sm">
                {t("quests.claim")}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

// =====================================================
// MAIN SCREEN
// =====================================================

export default function QuestsScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const {
    dailyQuests,
    xp,
    level,
    xpToNextLevel,
    totalXpEarned,
    getLevelFromXp,
    claimQuestReward,
    checkAndResetDailyQuests,
  } = useQuestStore();

  // XP dans le niveau actuel
  const { xpInLevel } = getLevelFromXp(xp);

  // Check and reset daily quests on mount
  useEffect(() => {
    checkAndResetDailyQuests();
  }, []);

  // Separate daily and achievement quests
  const dailyQuestsList = Object.values(dailyQuests).filter(
    (q: Quest) => q.isDaily,
  );
  const achievementQuests = Object.values(dailyQuests).filter(
    (q: Quest) => !q.isDaily,
  );

  // Count completed/claimed quests
  const completedDaily = dailyQuestsList.filter(
    (q: Quest) => q.status === "completed" || q.status === "claimed",
  ).length;

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={["#7C3AED", "#5B21B6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 48,
            paddingBottom: 24,
            paddingHorizontal: 16,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <View className="flex-1">
              <Text
                className="text-white font-outfit-bold"
                style={{ fontSize: 24 }}
              >
                {t("quests.title")}
              </Text>
              <Text
                className="text-white/70 font-outfit-regular"
                style={{ fontSize: 14 }}
              >
                {t("quests.subtitle")}
              </Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-amber-500/20 items-center justify-center">
              <MaterialIconsRound
                name="emoji-events"
                size={26}
                color="#FBBF24"
              />
            </View>
          </View>

          {/* XP Progress */}
          <XpProgressBar />

          {/* XP du niveau */}
          <View className="flex-row items-center justify-center mt-4 gap-6">
            <View className="items-center">
              <Text className="text-white/60 font-outfit-regular text-xs">
                {t("quests.totalXp")}
              </Text>
              <Text className="text-white font-outfit-bold text-xl">
                {totalXpEarned}
              </Text>
            </View>
            <View className="w-px h-8 bg-white/20" />
            <View className="items-center">
              <Text className="text-white/60 font-outfit-regular text-xs">
                {t("quests.todayProgress")}
              </Text>
              <Text className="text-white font-outfit-bold text-xl">
                {completedDaily}/{dailyQuestsList.length}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View className="px-4 pt-6">
          {/* Daily Quests */}
          <View className="flex-row items-center gap-2 mb-4">
            <MaterialIconsRound
              name="wb-sunny"
              size={20}
              color={isDark ? "#FBBF24" : "#F59E0B"}
            />
            <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-lg">
              {t("quests.dailyQuests")}
            </Text>
          </View>

          {dailyQuestsList.map((quest: Quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClaim={claimQuestReward}
            />
          ))}

          {/* Achievement Quests */}
          <View className="flex-row items-center gap-2 mb-4 mt-6">
            <MaterialIconsRound
              name="emoji-events"
              size={20}
              color={isDark ? "#A78BFA" : "#7C3AED"}
            />
            <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-lg">
              {t("quests.achievements")}
            </Text>
          </View>

          {achievementQuests.map((quest: Quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClaim={claimQuestReward}
            />
          ))}

          {/* Info */}
          <View className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 mt-4 flex-row items-start gap-3">
            <MaterialIconsRound
              name="info"
              size={20}
              color={isDark ? "#A78BFA" : "#7C3AED"}
            />
            <Text className="flex-1 text-purple-700 dark:text-purple-300 font-outfit-regular text-sm">
              {t("quests.info")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
