import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";
import { AppTabs, TabOption } from "@/components/ui";
import useQuestStore, {
  Quest,
  QuestId,
  QuestStatus,
  RamadanQuest,
  RamadanQuestId,
} from "@/stores/useQuestStore";
import useRamadanStore from "@/stores/useRamadanStore";
import useCoinsStore from "@/stores/useCoinsStore";
import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = "daily" | "achievements" | "event";

// ─── XpProgressBar ────────────────────────────────────────────────────────────

function XpProgressBar() {
  const { t } = useTranslation();
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

// ─── QuestCard ────────────────────────────────────────────────────────────────

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

  const handleClaim = useCallback(() => {
    if (isClaiming) return;
    setIsClaiming(true);
    const success = onClaim(quest.id);
    if (!success) setTimeout(() => setIsClaiming(false), 500);
  }, [isClaiming, onClaim, quest.id]);

  return (
    <View
      style={{
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
        backgroundColor: isCompleted
          ? isDark
            ? "#14532D"
            : "#F0FDF4"
          : isClaimed
            ? isDark
              ? "#1E293B"
              : "#F8FAFC"
            : isDark
              ? "#1E293B"
              : "#FFFFFF",
        borderWidth: 1.5,
        borderColor: isCompleted
          ? isDark
            ? "#16A34A"
            : "#86EFAC"
          : isDark
            ? "#334155"
            : "#E2E8F0",
        opacity: isLocked ? 0.5 : 1,
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{
            backgroundColor: isClaimed
              ? isDark
                ? "#334155"
                : "#E2E8F0"
              : isCompleted
                ? isDark
                  ? "#166534"
                  : "#DCFCE7"
                : isDark
                  ? "rgba(17,94,89,0.25)"
                  : "rgba(17,94,89,0.1)",
          }}
        >
          {isClaimed ? (
            <MaterialIconsRound
              name="check"
              size={22}
              color={isDark ? "#64748B" : "#94A3B8"}
            />
          ) : isLocked ? (
            <MaterialIconsRound
              name="lock"
              size={22}
              color={isDark ? "#64748B" : "#94A3B8"}
            />
          ) : (
            <MaterialIconsRound
              name={quest.icon as MaterialIconName}
              size={22}
              color={
                isCompleted
                  ? isDark
                    ? "#4ADE80"
                    : "#16A34A"
                  : isDark
                    ? "#5EEAD4"
                    : "#115E59"
              }
            />
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text
              className={`font-outfit-semibold text-base flex-1 ${
                isClaimed
                  ? "text-slate-400 dark:text-slate-500 line-through"
                  : "text-text-primary-light dark:text-text-primary-dark"
              }`}
            >
              {t(quest.titleKey)}
            </Text>
            <View className="flex-row items-center gap-1.5">
              {/* Badge XP */}
              <View
                className="flex-row items-center gap-1 px-2 py-1 rounded-full"
                style={{
                  backgroundColor: isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7",
                }}
              >
                <MaterialIconsRound name="star" size={12} color="#F59E0B" />
                <Text className="text-amber-600 dark:text-amber-400 font-outfit-bold text-xs">
                  +{quest.xpReward}
                </Text>
              </View>
              {/* Badge pièces */}
              {quest.coinReward > 0 && (
                <View
                  className="flex-row items-center gap-1 px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: isDark ? "rgba(217,119,6,0.18)" : "#FEF9C3",
                  }}
                >
                  <MaterialIconsRound name="toll" size={12} color="#D97706" />
                  <Text
                    className="font-outfit-bold text-xs"
                    style={{ color: isDark ? "#FCD34D" : "#92400E" }}
                  >
                    +{quest.coinReward}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text className="font-outfit-regular text-sm mt-1 text-text-secondary-light dark:text-text-secondary-dark">
            {t(quest.descriptionKey)}
          </Text>

          {!isClaimed && !isLocked && (
            <View className="mt-3">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs font-outfit-medium text-text-secondary-light dark:text-text-secondary-dark">
                  {quest.progress}/{quest.requirement}
                </Text>
                <Text className="text-xs font-outfit-medium text-text-secondary-light dark:text-text-secondary-dark">
                  {Math.round(progressPercent)}%
                </Text>
              </View>
              <View
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: isDark ? "#334155" : "#E2E8F0" }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: isCompleted
                      ? isDark
                        ? "#4ADE80"
                        : "#22C55E"
                      : isDark
                        ? "#5EEAD4"
                        : "#115E59",
                  }}
                />
              </View>
            </View>
          )}

          {isCompleted && !isClaiming && (
            <Pressable
              onPress={handleClaim}
              className="mt-3 rounded-2xl py-2.5 items-center"
              style={{ backgroundColor: isDark ? "#166534" : "#22C55E" }}
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

// ─── RamadanQuestCard ─────────────────────────────────────────────────────────

function RamadanQuestCard({
  quest,
  onClaim,
}: {
  quest: RamadanQuest;
  onClaim: (id: RamadanQuestId) => boolean;
}) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const [isClaiming, setIsClaiming] = useState(false);

  const progressPercent = Math.min(
    (quest.progress / quest.requirement) * 100,
    100,
  );
  const isCompleted = quest.status === "completed";
  const isClaimed = quest.status === "claimed";

  const handleClaim = useCallback(() => {
    if (isClaiming) return;
    setIsClaiming(true);
    const success = onClaim(quest.id);
    if (!success) setTimeout(() => setIsClaiming(false), 500);
  }, [isClaiming, onClaim, quest.id]);

  return (
    <View
      style={{
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
        backgroundColor: isCompleted
          ? isDark
            ? "rgba(120,53,15,0.35)"
            : "#FFFBEB"
          : isClaimed
            ? isDark
              ? "#1E293B"
              : "#F8FAFC"
            : isDark
              ? "#1E293B"
              : "#FFFFFF",
        borderWidth: 1.5,
        borderColor: isCompleted
          ? isDark
            ? "#B45309"
            : "#FCD34D"
          : isDark
            ? "#334155"
            : "#E2E8F0",
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{
            backgroundColor: isClaimed
              ? isDark
                ? "#334155"
                : "#E2E8F0"
              : isCompleted
                ? isDark
                  ? "rgba(180,83,9,0.3)"
                  : "#FEF3C7"
                : isDark
                  ? "rgba(217,119,6,0.2)"
                  : "#FEF9C3",
          }}
        >
          {isClaimed ? (
            <MaterialIconsRound
              name="check"
              size={22}
              color={isDark ? "#64748B" : "#94A3B8"}
            />
          ) : (
            <MaterialIconsRound
              name={quest.icon as MaterialIconName}
              size={22}
              color={
                isCompleted
                  ? isDark
                    ? "#FCD34D"
                    : "#D97706"
                  : isDark
                    ? "#FBBF24"
                    : "#B45309"
              }
            />
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text
              className={`font-outfit-semibold text-base flex-1 ${
                isClaimed
                  ? "text-slate-400 dark:text-slate-500 line-through"
                  : "text-text-primary-light dark:text-text-primary-dark"
              }`}
            >
              {t(quest.titleKey)}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <View
                className="flex-row items-center gap-1 px-2 py-1 rounded-full"
                style={{
                  backgroundColor: isDark ? "rgba(217,119,6,0.2)" : "#FEF3C7",
                }}
              >
                <MaterialIconsRound
                  name="star"
                  size={12}
                  color={isDark ? "#FBBF24" : "#D97706"}
                />
                <Text
                  className="font-outfit-bold text-xs"
                  style={{ color: isDark ? "#FBBF24" : "#D97706" }}
                >
                  +{quest.xpReward}
                </Text>
              </View>
              <View
                className="flex-row items-center gap-1 px-2 py-1 rounded-full"
                style={{
                  backgroundColor: isDark ? "rgba(252,211,77,0.15)" : "#FEFCE8",
                }}
              >
                <MaterialIconsRound
                  name="nightlight"
                  size={12}
                  color="#FCD34D"
                />
                <Text
                  className="font-outfit-bold text-xs"
                  style={{ color: isDark ? "#FCD34D" : "#92400E" }}
                >
                  +{quest.moonReward ?? "?"}
                </Text>
              </View>
            </View>
          </View>

          <Text className="font-outfit-regular text-sm mt-1 text-text-secondary-light dark:text-text-secondary-dark">
            {t(quest.descriptionKey)}
          </Text>

          {!isClaimed && (
            <View className="mt-3">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs font-outfit-medium text-text-secondary-light dark:text-text-secondary-dark">
                  {quest.progress}/{quest.requirement}
                </Text>
                <Text className="text-xs font-outfit-medium text-text-secondary-light dark:text-text-secondary-dark">
                  {Math.round(progressPercent)}%
                </Text>
              </View>
              <View
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: isDark ? "#334155" : "#E2E8F0" }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: isCompleted
                      ? isDark
                        ? "#FBBF24"
                        : "#D97706"
                      : isDark
                        ? "#F59E0B"
                        : "#FBBF24",
                  }}
                />
              </View>
            </View>
          )}

          {isCompleted && !isClaiming && (
            <Pressable
              onPress={handleClaim}
              className="mt-3 rounded-2xl py-2.5 items-center"
              style={{ backgroundColor: isDark ? "#B45309" : "#D97706" }}
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function QuestsScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const {
    dailyQuests,
    xp,
    totalXpEarned,
    getLevelFromXp,
    claimQuestReward,
    checkAndResetDailyQuests,
    ramadanWeeklyQuests,
    claimRamadanQuestReward,
    checkAndResetWeeklyQuests,
  } = useQuestStore();
  const { isRamadanMode, moonCoins } = useRamadanStore();
  const { coins } = useCoinsStore();

  const { xpInLevel } = getLevelFromXp(xp);

  const [activeTab, setActiveTab] = useState<TabKey>(
    isRamadanMode ? "event" : "daily",
  );

  useEffect(() => {
    checkAndResetDailyQuests();
    checkAndResetWeeklyQuests();
  }, []);

  // Si l'évènement Ramadan est désactivé mais qu'on est sur l'onglet event → revenir
  useEffect(() => {
    if (!isRamadanMode && activeTab === "event") setActiveTab("daily");
    if (isRamadanMode) setActiveTab("event");
  }, [isRamadanMode]);

  const dailyList = Object.values(dailyQuests).filter((q: Quest) => q.isDaily);
  const achievementList = Object.values(dailyQuests).filter(
    (q: Quest) => !q.isDaily,
  );
  const ramadanList = Object.values(ramadanWeeklyQuests);

  const completedDaily = dailyList.filter(
    (q: Quest) => q.status === "completed" || q.status === "claimed",
  ).length;

  const dailyBadge = dailyList.filter(
    (q: Quest) => q.status === "completed",
  ).length;
  const achievementBadge = achievementList.filter(
    (q: Quest) => q.status === "completed",
  ).length;
  const ramadanBadge = ramadanList.filter(
    (q) => q.status === "completed",
  ).length;

  const tabs: TabOption<TabKey>[] = [
    ...(isRamadanMode
      ? [{ key: "event" as TabKey, label: "Évènement", badge: ramadanBadge }]
      : []),
    { key: "daily", label: "Quotidien", badge: dailyBadge },
    { key: "achievements", label: "Succès", badge: achievementBadge },
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

          <XpProgressBar />

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
                {completedDaily}/{dailyList.length}
              </Text>
            </View>
            <View className="w-px h-8 bg-white/20" />
            {/* Pièces */}
            <View className="items-center">
              <Text className="text-white/60 font-outfit-regular text-xs">
                {t("quests.coins")}
              </Text>
              <View className="flex-row items-center gap-1">
                <MaterialIconsRound name="toll" size={16} color="#FCD34D" />
                <Text className="text-white font-outfit-bold text-xl">
                  {coins}
                </Text>
              </View>
            </View>
            {isRamadanMode && (
              <>
                <View className="w-px h-8 bg-white/20" />
                <View className="items-center">
                  <Text className="text-white/60 font-outfit-regular text-xs">
                    Lunes
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <MaterialIconsRound
                      name="nightlight"
                      size={16}
                      color="#FCD34D"
                    />
                    <Text className="text-white font-outfit-bold text-xl">
                      {moonCoins}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </LinearGradient>

        <View className="px-4 pt-6">
          {/* Onglets */}
          <AppTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            containerClassName="mb-5"
          />

          {/* Contenu selon l'onglet actif */}
          {activeTab === "daily" && (
            <>
              {dailyList.map((quest: Quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onClaim={claimQuestReward}
                />
              ))}
            </>
          )}

          {activeTab === "achievements" && (
            <>
              {achievementList.map((quest: Quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onClaim={claimQuestReward}
                />
              ))}
            </>
          )}

          {activeTab === "event" && isRamadanMode && (
            <>
              {/* Bannière Ramadan */}
              <LinearGradient
                colors={
                  isDark ? ["#78350F", "#451A03"] : ["#B45309", "#92400E"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 24,
                  padding: 16,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <MaterialIconsRound
                    name="nights-stay"
                    size={26}
                    color="#FDE68A"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-outfit-bold text-base">
                    Ramadan Mubarak
                  </Text>
                  <Text
                    className="font-outfit-regular text-sm"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {ramadanList.filter((q) => q.status === "claimed").length}/
                    {ramadanList.length} quêtes accomplies cette semaine
                  </Text>
                </View>
                <View
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <Text className="text-white font-outfit-bold text-xs">
                    Hebdo
                  </Text>
                </View>
              </LinearGradient>

              {ramadanList.map((quest) => (
                <RamadanQuestCard
                  key={quest.id}
                  quest={quest}
                  onClaim={claimRamadanQuestReward}
                />
              ))}
            </>
          )}

          {/* Info */}
          <View
            className="rounded-2xl p-4 mt-2 flex-row items-start gap-3"
            style={{
              backgroundColor: isDark ? "rgba(124,58,237,0.15)" : "#F5F3FF",
            }}
          >
            <MaterialIconsRound
              name="info"
              size={20}
              color={isDark ? "#A78BFA" : "#7C3AED"}
            />
            <Text
              className="flex-1 font-outfit-regular text-sm"
              style={{ color: isDark ? "#C4B5FD" : "#5B21B6" }}
            >
              {t("quests.info")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
