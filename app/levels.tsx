/**
 * Levels Page - Page des niveaux et récompenses (style Battle Pass)
 */

import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";
import useQuestStore, { getLevelName } from "@/stores/useQuestStore";

// =====================================================
// TYPES
// =====================================================

interface LevelReward {
  level: number;
  name: string;
  icon: MaterialIconName;
  description: string;
  type: "milestone" | "regular";
  unlocked: boolean;
}

// =====================================================
// COMPONENTS
// =====================================================

/**
 * Carte de niveau/récompense
 */
function LevelCard({
  reward,
  isCurrentLevel,
  isLast,
  progressPercent,
}: {
  reward: LevelReward;
  isCurrentLevel: boolean;
  isLast: boolean;
  progressPercent: number; // 0-100, progression vers le niveau suivant
}) {
  const { t } = useTranslation();
  const isDark = useIsDark();

  const isMilestone = reward.type === "milestone";

  return (
    <View className="flex-row items-stretch">
      {/* Level indicator with continuous line */}
      <View className="items-center mr-4" style={{ width: 50 }}>
        {/* Top connection line (invisible for first level) */}
        <View
          className={`w-1 h-4 ${
            reward.level > 1
              ? reward.unlocked
                ? "bg-primary"
                : "bg-slate-300 dark:bg-slate-700"
              : "bg-transparent"
          }`}
        />
        {/* Circle */}
        <View
          className={`w-12 h-12 rounded-full items-center justify-center ${
            reward.unlocked
              ? isMilestone
                ? "bg-amber-500"
                : "bg-primary"
              : "bg-slate-300 dark:bg-slate-700"
          } ${isCurrentLevel ? "border-4 border-green-500" : ""}`}
        >
          <Text
            className={`font-outfit-bold text-lg ${
              reward.unlocked
                ? "text-white"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {reward.level}
          </Text>
        </View>
        {/* Bottom connection line with progress */}
        {!isLast && (
          <View className="w-1 flex-1 bg-slate-300 dark:bg-slate-700 overflow-hidden">
            {/* Filled portion based on progress */}
            {reward.unlocked && !isCurrentLevel && (
              <View className="w-full h-full bg-primary" />
            )}
            {isCurrentLevel && (
              <View
                className="w-full bg-primary"
                style={{ height: `${progressPercent}%` }}
              />
            )}
          </View>
        )}
      </View>

      {/* Card content */}
      <View
        className={`flex-1 rounded-2xl p-4 mb-4 ${
          reward.unlocked
            ? isMilestone
              ? "bg-amber-50 dark:bg-amber-900/20"
              : "bg-purple-50 dark:bg-purple-900/20"
            : "bg-slate-100 dark:bg-slate-800"
        }`}
        style={{
          borderWidth: isCurrentLevel ? 2 : 1,
          borderColor: isCurrentLevel
            ? "#22C55E"
            : reward.unlocked
              ? isMilestone
                ? "#F59E0B"
                : "#7C3AED"
              : isDark
                ? "#334155"
                : "#E2E8F0",
        }}
      >
        <View className="flex-row items-center gap-3">
          {/* Icon */}
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center ${
              reward.unlocked
                ? isMilestone
                  ? "bg-amber-500"
                  : "bg-primary"
                : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            {reward.unlocked ? (
              <MaterialIconsRound name={reward.icon} size={22} color="#fff" />
            ) : (
              <MaterialIconsRound name="lock" size={22} color="#94A3B8" />
            )}
          </View>

          {/* Text */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                className={`font-outfit-bold text-base ${
                  reward.unlocked
                    ? "text-text-primary-light dark:text-text-primary-dark"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {reward.name}
              </Text>
              {isCurrentLevel && (
                <View className="bg-green-500 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-xs font-outfit-bold">
                    {t("levels.current")}
                  </Text>
                </View>
              )}
            </View>
            <Text
              className={`font-outfit-regular text-sm mt-0.5 ${
                reward.unlocked
                  ? "text-text-secondary-light dark:text-text-secondary-dark"
                  : "text-slate-400 dark:text-slate-600"
              }`}
            >
              {reward.description}
            </Text>
          </View>

          {/* Checkmark for completed levels (not current) */}
          {reward.unlocked && !isCurrentLevel && (
            <MaterialIconsRound
              name="check-circle"
              size={24}
              color={isMilestone ? "#F59E0B" : "#7C3AED"}
            />
          )}
        </View>
      </View>
    </View>
  );
}

// =====================================================
// MAIN SCREEN
// =====================================================

export default function LevelsScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const { level, xp, xpToNextLevel, totalXpEarned, getLevelFromXp } =
    useQuestStore();
  const { xpInLevel } = getLevelFromXp(xp);
  const progressPercent = (xpInLevel / xpToNextLevel) * 100;

  // Generate level rewards
  const levelRewards: LevelReward[] = [
    {
      level: 1,
      name: getLevelName(1),
      icon: "emoji-people",
      description: t("levels.desc.beginner"),
      type: "regular",
      unlocked: level >= 1,
    },
    {
      level: 2,
      name: getLevelName(2),
      icon: "school",
      description: t("levels.desc.apprentice"),
      type: "regular",
      unlocked: level >= 2,
    },
    {
      level: 3,
      name: getLevelName(3),
      icon: "mosque",
      description: t("levels.desc.practitioner"),
      type: "regular",
      unlocked: level >= 3,
    },
    {
      level: 4,
      name: getLevelName(4),
      icon: "favorite",
      description: t("levels.desc.dedicated"),
      type: "regular",
      unlocked: level >= 4,
    },
    {
      level: 5,
      name: getLevelName(5),
      icon: "star",
      description: t("levels.desc.devoted"),
      type: "milestone",
      unlocked: level >= 5,
    },
    {
      level: 6,
      name: getLevelName(6),
      icon: "self-improvement",
      description: t("levels.desc.pious"),
      type: "regular",
      unlocked: level >= 6,
    },
    {
      level: 7,
      name: getLevelName(7),
      icon: "psychology",
      description: t("levels.desc.virtuous"),
      type: "regular",
      unlocked: level >= 7,
    },
    {
      level: 8,
      name: getLevelName(8),
      icon: "workspace-premium",
      description: t("levels.desc.exemplary"),
      type: "regular",
      unlocked: level >= 8,
    },
    {
      level: 9,
      name: getLevelName(9),
      icon: "auto-stories",
      description: t("levels.desc.wise"),
      type: "regular",
      unlocked: level >= 9,
    },
    {
      level: 10,
      name: getLevelName(10),
      icon: "emoji-events",
      description: t("levels.desc.master"),
      type: "milestone",
      unlocked: level >= 10,
    },
    {
      level: 11,
      name: getLevelName(11),
      icon: "menu-book",
      description: t("levels.desc.scholar"),
      type: "regular",
      unlocked: level >= 11,
    },
    {
      level: 12,
      name: getLevelName(12),
      icon: "explore",
      description: t("levels.desc.guide"),
      type: "regular",
      unlocked: level >= 12,
    },
    {
      level: 13,
      name: getLevelName(13),
      icon: "wb-sunny",
      description: t("levels.desc.light"),
      type: "regular",
      unlocked: level >= 13,
    },
    {
      level: 14,
      name: getLevelName(14),
      icon: "grade",
      description: t("levels.desc.star"),
      type: "regular",
      unlocked: level >= 14,
    },
    {
      level: 15,
      name: getLevelName(15),
      icon: "military-tech",
      description: t("levels.desc.legend"),
      type: "milestone",
      unlocked: level >= 15,
    },
  ];

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
                {t("levels.title")}
              </Text>
              <Text
                className="text-white/70 font-outfit-regular"
                style={{ fontSize: 14 }}
              >
                {t("levels.subtitle")}
              </Text>
            </View>
          </View>

          {/* Current Level */}
          <View className="mt-6 bg-white/10 rounded-2xl p-4">
            <View className="flex-row items-center gap-4">
              <View className="w-16 h-16 rounded-full bg-amber-500 items-center justify-center">
                <Text className="text-white font-outfit-bold text-2xl">
                  {level}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-white/70 font-outfit-regular text-sm">
                  {t("levels.currentLevel")}
                </Text>
                <Text className="text-white font-outfit-bold text-xl">
                  {getLevelName(level)}
                </Text>
                <View className="flex-row items-center gap-2 mt-1">
                  <Text className="text-white/60 font-outfit-regular text-sm">
                    {xpInLevel}/{xpToNextLevel} XP
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress bar */}
            <View className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            <Text className="text-white/60 font-outfit-regular text-xs text-center mt-2">
              {xpToNextLevel - xpInLevel} XP {t("levels.toNextLevel")}
            </Text>
          </View>

          {/* Stats */}
          <View className="flex-row items-center justify-center mt-4 gap-6">
            <View className="items-center">
              <Text className="text-white/60 font-outfit-regular text-xs">
                {t("levels.totalXp")}
              </Text>
              <Text className="text-white font-outfit-bold text-xl">
                {totalXpEarned}
              </Text>
            </View>
            <View className="w-px h-8 bg-white/20" />
            <View className="items-center">
              <Text className="text-white/60 font-outfit-regular text-xs">
                {t("levels.unlockedLevels")}
              </Text>
              <Text className="text-white font-outfit-bold text-xl">
                {level}/15
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Level Path */}
        <View className="px-4 pt-6">
          <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-lg mb-4">
            {t("levels.path")}
          </Text>

          {levelRewards.map((reward, index) => (
            <LevelCard
              key={reward.level}
              reward={reward}
              isCurrentLevel={reward.level === level}
              isLast={index === levelRewards.length - 1}
              progressPercent={reward.level === level ? progressPercent : 0}
            />
          ))}
        </View>

        {/* Info */}
        <View className="mx-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 flex-row items-start gap-3">
          <MaterialIconsRound
            name="info"
            size={20}
            color={isDark ? "#A78BFA" : "#7C3AED"}
          />
          <Text className="flex-1 text-purple-700 dark:text-purple-300 font-outfit-regular text-sm">
            {t("levels.info")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
