import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { SurahIndexInfo } from "@/utils/quranLoader";
import { AppCard, AppText } from "@/components/ui";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useTranslation } from "react-i18next";
import { useQuranStore } from "@/stores/useQuranStore";

interface SurahCardProps {
  surah: SurahIndexInfo;
  onPress: (id: number) => void;
}

const SurahCardComponent = ({ surah, onPress }: SurahCardProps) => {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const appTheme = useAppTheme();
  const progress = useQuranStore((state) => state.progress[surah.id]);

  const percentage = progress?.percentage || 0;
  const versesRead = progress?.versesRead?.length || 0;

  return (
    <Pressable
      onPress={() => onPress(surah.id)}
      className="active:scale-[0.98] transition-transform mx-4 mb-3"
    >
      <AppCard className="flex-row items-center p-4">
        <View
          className="w-10 h-10 rounded-lg items-center justify-center mr-3"
          style={{
            backgroundColor: isDark
              ? "rgba(17, 94, 89, 0.2)"
              : "rgba(17, 94, 89, 0.1)",
          }}
        >
          <Text
            className="text-sm font-outfit-bold"
            style={{ color: isDark ? "#5EEAD4" : appTheme.primary }}
          >
            {surah.id}
          </Text>
        </View>

        <View className="flex-1">
          <AppText
            variant="bodyMedium"
            className="font-outfit-semibold text-text-primary-light dark:text-text-primary-dark"
          >
            {surah.transliteration}
          </AppText>
          <AppText
            variant="caption"
            className="mt-0.5 text-text-secondary-light dark:text-text-secondary-dark"
          >
            {surah.translation}
          </AppText>
          {percentage > 0 && (
            <View className="flex-row items-center mt-1.5 gap-2">
              <View className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                <View
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${percentage}%` }}
                />
              </View>
              <Text className="text-[10px] font-outfit-medium text-accent w-9 text-right">
                {percentage}%
              </Text>
            </View>
          )}
        </View>

        <View className="items-end">
          <View
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: isDark
                ? "rgba(217, 119, 6, 0.15)"
                : "rgba(217, 119, 6, 0.1)",
            }}
          >
            <Text
              className="text-xs font-outfit-medium"
              style={{ color: isDark ? "#FBBF24" : "#D97706" }}
            >
              {surah.total_verses} {t("quran.versets")}
            </Text>
          </View>
          {percentage > 0 && (
            <Text className="text-[10px] mt-4 font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark  text-right">
              {versesRead}/{surah.total_verses}
            </Text>
          )}
        </View>
      </AppCard>
    </Pressable>
  );
};

export const SurahCard = memo(SurahCardComponent);
