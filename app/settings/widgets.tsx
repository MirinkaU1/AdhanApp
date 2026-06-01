import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";
import { format } from "date-fns";

import MaterialIconsRound, {
  type MaterialIconName,
} from "@/components/MaterialIconsRound";
import usePrayerStore, { type PrayerName } from "@/stores/usePrayerStore";
import useThemeStore from "@/stores/useThemeStore";
import useWidgetStore from "@/stores/useWidgetStore";
import { useIsDark } from "@/components/useColorScheme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { APP_THEMES, getThemeById } from "@/constants/appThemes";
import { pinWidget } from "@/lib/widgetBridge";

type WidgetVariant = "next" | "daily" | "hijri";

const PRAYER_META: Record<
  PrayerName,
  { label: string; icon: MaterialIconName; tint: string }
> = {
  fajr: { label: "Fajr", icon: "wb-twilight", tint: "#FB923C" },
  dhuhr: { label: "Dhuhr", icon: "wb-sunny", tint: "#FACC15" },
  asr: { label: "Asr", icon: "wb-cloudy", tint: "#F59E0B" },
  maghrib: { label: "Maghrib", icon: "wb-twilight", tint: "#F97316" },
  isha: { label: "Isha", icon: "nights-stay", tint: "#818CF8" },
};

const ORDER: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const fmt = (d?: Date | null) => (d ? format(d, "HH:mm") : "--:--");

const formatRemaining = (minutes?: number) => {
  if (minutes == null || minutes < 0) return "--";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

// ─────────────────────────────────────────────
// Aperçu d'un widget (mime le rendu natif)
// ─────────────────────────────────────────────

function WidgetPreview({
  variant,
  colors,
}: {
  variant: WidgetVariant;
  colors: { gradient: [string, string]; accent: string };
}) {
  const times = usePrayerStore((s) => s.times);
  const next = usePrayerStore((s) => s.nextPrayer);
  const hijriDate = usePrayerStore((s) => s.hijriDate);

  const nextName = (next?.name ?? "dhuhr") as PrayerName;
  const meta = PRAYER_META[nextName] ?? PRAYER_META.dhuhr;
  const onBg = "#FFFFFF";
  const muted = "rgba(255,255,255,0.72)";

  const IconBadge = () => (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: `${meta.tint}47`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MaterialIconsRound name={meta.icon} size={19} color={meta.tint} />
    </View>
  );

  const Pill = ({ text }: { text: string }) => (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 5,
        alignSelf: variant === "hijri" ? "flex-start" : "center",
      }}
    >
      <Text style={{ color: "#111827", fontSize: 13, fontWeight: "700" }}>
        {text}
      </Text>
    </View>
  );

  // Arche en watermark
  const Arch = () => (
    <View
      style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 110 }}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
        <Path
          d="M200,18 C252,34 390,70 400,108 L400,200 L0,200 L0,108 C10,70 148,34 200,18 Z"
          fill="rgba(255,255,255,0.12)"
        />
      </Svg>
    </View>
  );

  const parseHijri = () => {
    const tokens = hijriDate.trim().split(" ").filter(Boolean);
    const day = tokens.find((tk) => /^\d+$/.test(tk)) ?? "-";
    const year = tokens.find((tk) => /^\d{3,4}$/.test(tk) && tk !== day) ?? "";
    const month = tokens
      .filter((tk) => tk !== day && tk !== year && tk.toUpperCase() !== "AH")
      .join(" ");
    return { day, month, year: year ? `${year} AH` : "" };
  };

  return (
    <LinearGradient
      colors={colors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        height: variant === "daily" ? 150 : 160,
        borderRadius: 24,
        padding: 16,
        overflow: "hidden",
        justifyContent: "space-between",
      }}
    >
      <Arch />

      {variant === "next" && (
        <>
          <View className="flex-row items-start justify-between">
            <View>
              <Text style={{ color: onBg, fontSize: 20, fontWeight: "700" }}>
                {meta.label}
              </Text>
              <Text style={{ color: muted, fontSize: 11, fontWeight: "500" }}>
                Commence à {fmt(next?.time)}
              </Text>
            </View>
            <IconBadge />
          </View>
          <Pill text={`${formatRemaining(next?.remainingMinutes)} restant`} />
          <Text style={{ color: muted, fontSize: 10, fontWeight: "500" }}>
            {hijriDate || ""}
          </Text>
        </>
      )}

      {variant === "daily" && (
        <>
          <View className="flex-row items-start justify-between">
            <View>
              <Text style={{ color: onBg, fontSize: 20, fontWeight: "700" }}>
                {meta.label}
              </Text>
              <Text style={{ color: muted, fontSize: 11, fontWeight: "500" }}>
                Commence à {fmt(next?.time)}
              </Text>
            </View>
            <IconBadge />
          </View>
          <Pill text={`${meta.label} dans ${formatRemaining(next?.remainingMinutes)}`} />
          <View className="flex-row justify-between">
            {ORDER.map((key) => {
              const isNext = key === nextName;
              return (
                <View key={key} style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ color: muted, fontSize: 10, fontWeight: "500" }}>
                    {PRAYER_META[key].label}
                  </Text>
                  <View
                    style={{
                      marginTop: 2,
                      backgroundColor: isNext
                        ? "rgba(255,255,255,0.95)"
                        : "transparent",
                      borderRadius: 8,
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: isNext ? "#111827" : onBg,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {fmt(times?.[key])}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {variant === "hijri" &&
        (() => {
          const { day, month, year } = parseHijri();
          return (
            <>
              <View className="flex-row items-center justify-between">
                <Text style={{ color: muted, fontSize: 10, fontWeight: "700" }}>
                  HIJRI
                </Text>
                <IconBadge />
              </View>
              <View className="flex-row items-end">
                <Text style={{ color: onBg, fontSize: 44, fontWeight: "700" }}>
                  {day}
                </Text>
                <View style={{ marginLeft: 10, marginBottom: 6 }}>
                  <Text style={{ color: onBg, fontSize: 13, fontWeight: "700" }}>
                    {month}
                  </Text>
                  {!!year && (
                    <Text style={{ color: muted, fontSize: 10 }}>{year}</Text>
                  )}
                </View>
              </View>
              <Pill text={`${meta.label} · ${fmt(next?.time)}`} />
            </>
          );
        })()}
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────
// Carte widget : aperçu + bouton d'ajout
// ─────────────────────────────────────────────

function WidgetCard({
  variant,
  titleKey,
  colors,
  width,
}: {
  variant: WidgetVariant;
  titleKey: string;
  colors: { gradient: [string, string]; accent: string };
  width: number;
}) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const [status, setStatus] = useState<"idle" | "ok" | "unsupported">("idle");

  const onAdd = async () => {
    const ok = await pinWidget(variant);
    setStatus(ok ? "ok" : "unsupported");
    setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <View style={{ width }}>
      <Text className="font-outfit-semibold text-text-primary-light dark:text-text-primary-dark text-sm mb-2">
        {t(titleKey)}
      </Text>
      <WidgetPreview variant={variant} colors={colors} />
      <Pressable
        onPress={onAdd}
        className="mt-2.5 flex-row items-center justify-center gap-2 rounded-2xl py-3 active:opacity-80"
        style={{ backgroundColor: isDark ? "#1E293B" : "#FFFFFF", borderWidth: 1, borderColor: colors.accent }}
      >
        <MaterialIconsRound
          name={status === "ok" ? "check-circle" : "add-to-home-screen"}
          size={18}
          color={colors.accent}
        />
        <Text className="font-outfit-bold text-sm" style={{ color: colors.accent }}>
          {status === "ok"
            ? t("widgets.added")
            : status === "unsupported"
              ? t("widgets.unsupported")
              : t("widgets.addToHome")}
        </Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────
// Écran principal
// ─────────────────────────────────────────────

export default function WidgetsScreen() {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const appTheme = useAppTheme();
  const { activeThemeId, isThemeUnlocked } = useThemeStore();
  const { widgetThemeId, setWidgetThemeId } = useWidgetStore();
  const { width: screenWidth } = useWindowDimensions();

  // Largeur d'une "page" du carrousel d'aperçus (peek du suivant)
  const SIDE_PADDING = 16;
  const PEEK = 28;
  const pageWidth = screenWidth - SIDE_PADDING * 2 - PEEK;
  const CARD_GAP = 12;

  // Thème effectif des widgets (choix explicite sinon thème de l'app)
  const effectiveTheme = getThemeById(widgetThemeId ?? activeThemeId);
  const colors = {
    gradient: effectiveTheme.headerGradient,
    accent: effectiveTheme.accent,
  };

  const ownedThemes = APP_THEMES.filter((th) => isThemeUnlocked(th.id));

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <LinearGradient
        colors={appTheme.headerGradient}
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
            <Text className="text-white font-outfit-bold" style={{ fontSize: 24 }}>
              {t("widgets.title")}
            </Text>
            <Text className="text-white/70 font-outfit-regular" style={{ fontSize: 14 }}>
              {t("widgets.subtitle")}
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(245, 158, 11, 0.2)" }}
          >
            <MaterialIconsRound name="widgets" size={26} color="#F59E0B" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Sélecteur de thème ── */}
        <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base mb-1">
          {t("widgets.themeTitle")}
        </Text>
        <Text className="font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark text-xs mb-3">
          {t("widgets.themeSubtitle")}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          style={{ marginBottom: 24, marginHorizontal: -16, paddingHorizontal: 16 }}
        >
          {/* Option : suivre l'app */}
          <Pressable
            onPress={() => setWidgetThemeId(null)}
            className="active:opacity-80"
            style={{
              width: 84,
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: widgetThemeId === null ? 2 : 1,
              borderColor:
                widgetThemeId === null
                  ? appTheme.accent
                  : isDark
                    ? "#334155"
                    : "#E2E8F0",
            }}
          >
            <View
              style={{
                height: 54,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
              }}
            >
              <MaterialIconsRound
                name="sync"
                size={22}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </View>
            <Text
              className="font-outfit-medium text-center py-1"
              style={{ fontSize: 10, color: isDark ? "#CBD5E1" : "#475569" }}
              numberOfLines={1}
            >
              {t("widgets.followApp")}
            </Text>
          </Pressable>

          {ownedThemes.map((th) => {
            const selected = widgetThemeId === th.id;
            return (
              <Pressable
                key={th.id}
                onPress={() => setWidgetThemeId(th.id)}
                className="active:opacity-80"
                style={{
                  width: 84,
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected
                    ? th.accent
                    : isDark
                      ? "#334155"
                      : "#E2E8F0",
                }}
              >
                <LinearGradient
                  colors={th.headerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ height: 54, alignItems: "center", justifyContent: "center" }}
                >
                  {selected && (
                    <MaterialIconsRound name="check-circle" size={20} color="#fff" />
                  )}
                </LinearGradient>
                <Text
                  className="font-outfit-medium text-center py-1 text-text-primary-light dark:text-text-primary-dark"
                  style={{ fontSize: 10 }}
                  numberOfLines={1}
                >
                  {t(th.nameKey)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Aperçus + ajout (carrousel horizontal) ── */}
        <Text className="font-outfit-bold text-text-primary-light dark:text-text-primary-dark text-base mb-3">
          {t("widgets.previewTitle")}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={pageWidth + CARD_GAP}
          snapToAlignment="start"
          contentContainerStyle={{ gap: CARD_GAP, paddingRight: 16 }}
          style={{ marginHorizontal: -16, paddingHorizontal: 16 }}
        >
          <WidgetCard
            variant="next"
            titleKey="widgets.nextPrayer"
            colors={colors}
            width={pageWidth}
          />
          <WidgetCard
            variant="daily"
            titleKey="widgets.dailyPrayers"
            colors={colors}
            width={pageWidth}
          />
          <WidgetCard
            variant="hijri"
            titleKey="widgets.hijri"
            colors={colors}
            width={pageWidth}
          />
        </ScrollView>
      </ScrollView>
    </View>
  );
}
