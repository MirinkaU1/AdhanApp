import React from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useIsDark } from "@/components/useColorScheme";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import {
  EssentialSurah,
  getSurahById,
  ESSENTIAL_SURAHS,
} from "@/constants/QuranData";

interface SurahReaderModalProps {
  isVisible: boolean;
  onClose: () => void;
  surahId?: string;
}

export function SurahReaderModal({
  isVisible,
  onClose,
  surahId = "mulk",
}: SurahReaderModalProps) {
  const surah = getSurahById(surahId) || ESSENTIAL_SURAHS[0];
  const isDark = useIsDark();

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-bg-light dark:bg-bg-dark">
        {/* Header */}
        <View className="border-b border-border-light bg-card-light px-4 py-4 dark:border-border-dark dark:bg-card-dark">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={onClose}
              className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
              style={{
                backgroundColor: isDark ? "#334155" : "#F1F5F9",
              }}
              accessibilityLabel="Fermer"
            >
              <MaterialIconsRound
                name="close"
                size={22}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </Pressable>

            <View className="flex-1 items-center px-4">
              <Text
                className="mb-1 text-xl text-text-primary-light dark:text-text-primary-dark"
                style={{ fontFamily: "Amiri_700Bold" }}
              >
                {surah.nameAr}
              </Text>
              <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-outfit-medium">
                {surah.nameFr}
              </Text>
            </View>

            {/* Spacer for centering */}
            <View className="w-10" />
          </View>
        </View>

        {/* Verses List */}
        <ScrollView
          className="flex-1 px-4 py-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Bismillah */}
          <LinearGradient
            colors={isDark ? ["#1f2937", "#111827"] : ["#f0fdfa", "#ffffff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              marginBottom: 32,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#ccfbf1",
            }}
          >
            <Text
              className="text-center text-3xl text-text-primary-light dark:text-text-primary-dark"
              style={{ fontFamily: "Amiri_400Regular" }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
            <Text className="mt-3 text-center text-sm italic text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular">
              Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux
            </Text>
          </LinearGradient>

          {/* Verses */}
          {surah.verses.map((verse, index) => (
            <View
              key={verse.number}
              className="mb-6 pb-6"
              style={{
                borderBottomWidth: index === surah.verses.length - 1 ? 0 : 1,
                borderBottomColor: isDark ? "#334155" : "#E2E8F0",
              }}
            >
              {/* Verse Row */}
              <View className="flex-row items-start gap-4">
                {/* Verse Number Circle */}
                <View className="mt-1 flex-shrink-0">
                  <View
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(217, 119, 6, 0.2)"
                        : "rgba(217, 119, 6, 0.1)",
                    }}
                  >
                    <Text
                      className="text-sm font-outfit-bold"
                      style={{ color: isDark ? "#FBBF24" : "#D97706" }}
                    >
                      {verse.number}
                    </Text>
                  </View>
                </View>

                {/* Arabic Text - Right aligned */}
                <View className="flex-1">
                  <Text
                    className="text-right text-2xl leading-loose text-text-primary-light dark:text-text-primary-dark"
                    style={{
                      fontFamily: "Amiri_400Regular",
                      writingDirection: "rtl",
                    }}
                  >
                    {verse.textAr}
                  </Text>
                </View>
              </View>

              {/* French Translation - Below */}
              <View className="mt-4 pl-14">
                <Text className="text-sm leading-relaxed text-text-secondary-light dark:text-text-secondary-dark font-outfit-regular">
                  {verse.textFr}
                </Text>
              </View>
            </View>
          ))}

          {/* Bottom Padding */}
          <View className="h-8" />
        </ScrollView>

        {/* Bottom Progress Indicator */}
        <View className="border-t border-border-light bg-card-light px-4 py-3 dark:border-border-dark dark:bg-card-dark">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-outfit-medium">
              Sourate {surah.surahNumber}
            </Text>
            <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-outfit-medium">
              {surah.verses.length} versets
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default SurahReaderModal;
