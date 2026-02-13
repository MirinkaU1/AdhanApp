import { useRef } from "react";
import { Pressable, View, FlatList, Dimensions, Text } from "react-native";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppText } from "@/components/ui";
import { DHIKR_OPTIONS, DhikrType } from "@/stores/useDhikrStore";

const { width } = Dimensions.get("window");
const CARD_WIDTH = 100;

interface DhikrCarouselProps {
  currentDhikr: string;
  setDhikr: (d: DhikrType) => void;
  isDark: boolean;
}

export default function DhikrCarousel({
  currentDhikr,
  setDhikr,
  isDark,
}: DhikrCarouselProps) {
  const flatListRef = useRef<FlatList>(null);
  const { t } = useTranslation();

  const currentIndex = DHIKR_OPTIONS.findIndex((d) => d.value === currentDhikr);

  return (
    <View>
      <AppText
        variant="body"
        className="text-text-secondary-light dark:text-text-secondary-dark mb-3 ml-1"
      >
        {t("dhikr.selectDhikr")}
      </AppText>
      <View className="flex-row items-center">
        <Pressable
          onPress={() => {
            const newIndex =
              currentIndex > 0 ? currentIndex - 1 : DHIKR_OPTIONS.length - 1;
            setDhikr(DHIKR_OPTIONS[newIndex].value);
          }}
          className="w-10 h-10 rounded-full bg-card-light dark:bg-card-dark items-center justify-center"
        >
          <MaterialIconsRound
            name="chevron-left"
            size={24}
            color={isDark ? "#94A3B8" : "#64748B"}
          />
        </Pressable>

        <FlatList
          ref={flatListRef}
          data={DHIKR_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 12}
          snapToAlignment="center"
          decelerationRate="fast"
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ paddingHorizontal: 8 }}
          style={{ width: width - 100, marginHorizontal: 8 }}
          renderItem={({ item }) => {
            const isSelected = item.value === currentDhikr;
            return (
              <Pressable
                onPress={() => setDhikr(item.value)}
                style={{
                  width: CARD_WIDTH,
                  marginHorizontal: 6,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  borderRadius: 16,
                  backgroundColor: isSelected ? "#115E59" : "transparent",
                  borderWidth: isSelected ? 0 : 1,
                  borderColor: isDark ? "#334155" : "#E2E8F0",
                  alignItems: "center",
                }}
              >
                <Text
                  className={`text-xl mb-1 ${isSelected ? "text-white" : "text-text-primary-light dark:text-text-primary-dark"}`}
                  style={{ fontFamily: "Amiri_400Regular" }}
                >
                  {item.arabic}
                </Text>
                <AppText
                  variant="caption"
                  className={
                    isSelected
                      ? "text-white"
                      : "text-text-secondary-light dark:text-text-secondary-dark"
                  }
                  style={{ textAlign: "center" }}
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          }}
        />

        <Pressable
          onPress={() => {
            const newIndex =
              currentIndex < DHIKR_OPTIONS.length - 1 ? currentIndex + 1 : 0;
            setDhikr(DHIKR_OPTIONS[newIndex].value);
          }}
          className="w-10 h-10 rounded-full bg-card-light dark:bg-card-dark items-center justify-center"
        >
          <MaterialIconsRound
            name="chevron-right"
            size={24}
            color={isDark ? "#94A3B8" : "#64748B"}
          />
        </Pressable>
      </View>
    </View>
  );
}
