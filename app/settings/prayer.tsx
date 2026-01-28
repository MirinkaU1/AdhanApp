import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIconsRound, {
  MaterialIconName,
} from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";
import usePrayerStore, {
  CalculationMethodName,
  MadhabName,
} from "@/stores/usePrayerStore";

// =====================================================
// TYPES
// =====================================================

interface CalculationMethodOption {
  id: CalculationMethodName;
  nameKey: string;
  descriptionKey: string;
}

interface MadhabOption {
  id: MadhabName;
  nameKey: string;
  descriptionKey: string;
}

// =====================================================
// DATA
// =====================================================

const CALCULATION_METHODS: CalculationMethodOption[] = [
  {
    id: "muslimWorldLeague",
    nameKey: "prayerSettings.methods.muslimWorldLeague",
    descriptionKey: "prayerSettings.methods.muslimWorldLeagueDesc",
  },
  {
    id: "egyptian",
    nameKey: "prayerSettings.methods.egyptian",
    descriptionKey: "prayerSettings.methods.egyptianDesc",
  },
  {
    id: "karachi",
    nameKey: "prayerSettings.methods.karachi",
    descriptionKey: "prayerSettings.methods.karachiDesc",
  },
  {
    id: "northAmerica",
    nameKey: "prayerSettings.methods.northAmerica",
    descriptionKey: "prayerSettings.methods.northAmericaDesc",
  },
  {
    id: "ummAlQura",
    nameKey: "prayerSettings.methods.ummAlQura",
    descriptionKey: "prayerSettings.methods.ummAlQuraDesc",
  },
  {
    id: "qatar",
    nameKey: "prayerSettings.methods.qatar",
    descriptionKey: "prayerSettings.methods.qatarDesc",
  },
  {
    id: "kuwait",
    nameKey: "prayerSettings.methods.kuwait",
    descriptionKey: "prayerSettings.methods.kuwaitDesc",
  },
  {
    id: "dubai",
    nameKey: "prayerSettings.methods.dubai",
    descriptionKey: "prayerSettings.methods.dubaiDesc",
  },
  {
    id: "singapore",
    nameKey: "prayerSettings.methods.singapore",
    descriptionKey: "prayerSettings.methods.singaporeDesc",
  },
  {
    id: "tehran",
    nameKey: "prayerSettings.methods.tehran",
    descriptionKey: "prayerSettings.methods.tehranDesc",
  },
  {
    id: "turkey",
    nameKey: "prayerSettings.methods.turkey",
    descriptionKey: "prayerSettings.methods.turkeyDesc",
  },
  {
    id: "moonsightingCommittee",
    nameKey: "prayerSettings.methods.moonsightingCommittee",
    descriptionKey: "prayerSettings.methods.moonsightingCommitteeDesc",
  },
];

const MADHAB_OPTIONS: MadhabOption[] = [
  {
    id: "shafi",
    nameKey: "prayerSettings.madhab.shafi",
    descriptionKey: "prayerSettings.madhab.shafiDesc",
  },
  {
    id: "hanafi",
    nameKey: "prayerSettings.madhab.hanafi",
    descriptionKey: "prayerSettings.madhab.hanafiDesc",
  },
];

// =====================================================
// COMPONENTS
// =====================================================

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      className="text-text-primary-light dark:text-text-primary-dark font-outfit-bold mt-6 mb-3"
      style={{ fontSize: 18 }}
    >
      {children}
    </Text>
  );
}

function OptionCard<T extends string>({
  option,
  isSelected,
  onSelect,
  isDark,
  t,
  showDescription = true,
}: {
  option: { id: T; nameKey: string; descriptionKey: string };
  isSelected: boolean;
  onSelect: (id: T) => void;
  isDark: boolean;
  t: (key: string) => string;
  showDescription?: boolean;
}) {
  return (
    <Pressable
      onPress={() => onSelect(option.id)}
      className="flex-row items-center justify-between p-4"
      style={{
        backgroundColor: isSelected
          ? isDark
            ? "#14453d"
            : "#D1FAE5"
          : "transparent",
      }}
    >
      <View className="flex-1 pr-4">
        <Text
          className="text-text-primary-light dark:text-text-primary-dark font-outfit-semibold"
          style={{ fontSize: 15 }}
        >
          {t(option.nameKey)}
        </Text>
        {showDescription && (
          <Text
            className="text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular mt-0.5"
            style={{ fontSize: 13 }}
          >
            {t(option.descriptionKey)}
          </Text>
        )}
      </View>

      {isSelected && (
        <View className="w-7 h-7 rounded-full bg-primary items-center justify-center">
          <MaterialIconsRound name="check" size={18} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

// =====================================================
// MAIN SCREEN
// =====================================================

export default function PrayerSettingsScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const { calculationMethod, madhab, setCalculationMethod, setMadhab } =
    usePrayerStore();

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <LinearGradient
        colors={["#115E59", "#0d4542"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
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
              {t("prayerSettings.title")}
            </Text>
            <Text
              className="text-white/70 font-outfit-regular"
              style={{ fontSize: 14 }}
            >
              {t("prayerSettings.subtitle")}
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(16, 185, 129, 0.2)" }}
          >
            <MaterialIconsRound name="calculate" size={26} color="#10B981" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingVertical: 16,
          paddingHorizontal: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info card */}
        <View className="bg-primary/10 dark:bg-primary/20 rounded-2xl p-4 flex-row items-start gap-3">
          <MaterialIconsRound
            name="info"
            size={22}
            color={isDark ? "#5EEAD4" : "#0D9488"}
          />
          <Text
            className="flex-1 text-primary dark:text-teal-300 font-outfit-regular"
            style={{ fontSize: 14, lineHeight: 20 }}
          >
            {t("prayerSettings.info")}
          </Text>
        </View>

        {/* Madhab Section */}
        <SectionTitle>{t("prayerSettings.madhabSection")}</SectionTitle>
        <View className="bg-card-light dark:bg-card-dark rounded-3xl overflow-hidden border border-border-light dark:border-border-dark">
          {MADHAB_OPTIONS.map((option, index) => (
            <View key={option.id}>
              <OptionCard
                option={option}
                isSelected={madhab === option.id}
                onSelect={setMadhab}
                isDark={isDark}
                t={t}
              />
              {index < MADHAB_OPTIONS.length - 1 && (
                <View
                  className="h-px mx-4"
                  style={{ backgroundColor: isDark ? "#334155" : "#F1F5F9" }}
                />
              )}
            </View>
          ))}
        </View>

        {/* Calculation Method Section */}
        <SectionTitle>{t("prayerSettings.methodSection")}</SectionTitle>
        <View className="bg-card-light dark:bg-card-dark rounded-3xl overflow-hidden border border-border-light dark:border-border-dark">
          {CALCULATION_METHODS.map((method, index) => (
            <View key={method.id}>
              <OptionCard
                option={method}
                isSelected={calculationMethod === method.id}
                onSelect={setCalculationMethod}
                isDark={isDark}
                t={t}
              />
              {index < CALCULATION_METHODS.length - 1 && (
                <View
                  className="h-px mx-4"
                  style={{ backgroundColor: isDark ? "#334155" : "#F1F5F9" }}
                />
              )}
            </View>
          ))}
        </View>

        {/* Note about Asr time */}
        <View className="mt-6 bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 flex-row items-start gap-3">
          <MaterialIconsRound
            name="schedule"
            size={22}
            color={isDark ? "#FCD34D" : "#D97706"}
          />
          <Text
            className="flex-1 text-amber-700 dark:text-amber-300 font-outfit-regular"
            style={{ fontSize: 13, lineHeight: 19 }}
          >
            {t("prayerSettings.asrNote")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
