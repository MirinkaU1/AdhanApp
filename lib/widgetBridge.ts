import { NativeModules, Platform } from "react-native";
import { format } from "date-fns";
import usePrayerStore, {
  type PrayerTimes,
  type NextPrayerInfo,
  type LocationInfo,
} from "@/stores/usePrayerStore";
import useThemeStore from "@/stores/useThemeStore";
import useWidgetStore from "@/stores/useWidgetStore";
import { getThemeById, type AppTheme } from "@/constants/appThemes";

type WidgetPinType = "next" | "daily" | "hijri";

type NativeWidgetBridge = {
  updatePrayerData: (json: string) => Promise<boolean>;
  requestPinWidget?: (widgetType: WidgetPinType) => Promise<boolean>;
};

const nativeBridge: NativeWidgetBridge | undefined =
  Platform.OS === "android" ? NativeModules.WidgetBridge : undefined;

const isAvailable = !!nativeBridge;

type WidgetPayload = {
  nextPrayerName: string;
  nextPrayerTime: string;
  nextPrayerEpoch: number;
  fajrTime: string;
  dhuhrTime: string;
  asrTime: string;
  maghribTime: string;
  ishaTime: string;
  hijriDate: string;
  city: string;
  bgColor: string;
  bgSubtleColor: string;
  primaryColor: string;
  accentColor: string;
};

const fmt = (date: Date | undefined | null) =>
  date ? format(date, "HH:mm") : "--:--";

const buildPayload = (
  times: PrayerTimes | null,
  next: NextPrayerInfo | null,
  hijri: string,
  location: LocationInfo | null,
  theme: AppTheme,
): WidgetPayload => ({
  nextPrayerName: next?.name ?? "",
  nextPrayerTime: fmt(next?.time),
  nextPrayerEpoch: next?.time ? next.time.getTime() : 0,
  fajrTime: fmt(times?.fajr),
  dhuhrTime: fmt(times?.dhuhr),
  asrTime: fmt(times?.asr),
  maghribTime: fmt(times?.maghrib),
  ishaTime: fmt(times?.isha),
  hijriDate: hijri,
  city: location?.city ?? "",
  bgColor: theme.headerGradient[0],
  bgSubtleColor: theme.headerGradient[1],
  primaryColor: theme.primary,
  accentColor: theme.accent,
});

/** Thème appliqué aux widgets : choix explicite, sinon thème actif de l'app. */
const resolveWidgetTheme = (): AppTheme => {
  const { widgetThemeId } = useWidgetStore.getState();
  const { activeThemeId } = useThemeStore.getState();
  return getThemeById(widgetThemeId ?? activeThemeId);
};

export async function pushWidgetUpdate(): Promise<void> {
  if (!isAvailable) return;
  const { times, nextPrayer, hijriDate, location } = usePrayerStore.getState();
  const theme = resolveWidgetTheme();
  const payload = buildPayload(times, nextPrayer, hijriDate, location, theme);
  try {
    await nativeBridge!.updatePrayerData(JSON.stringify(payload));
  } catch (err) {
    if (__DEV__) console.warn("[widgetBridge] update failed:", err);
  }
}

export function subscribeWidgetToPrayerStore(): () => void {
  if (!isAvailable) return () => {};

  pushWidgetUpdate();

  const unsubPrayer = usePrayerStore.subscribe((state, prev) => {
    if (
      state.times !== prev.times ||
      state.nextPrayer !== prev.nextPrayer ||
      state.hijriDate !== prev.hijriDate ||
      state.location !== prev.location
    ) {
      pushWidgetUpdate();
    }
  });

  const unsubTheme = useThemeStore.subscribe((state, prev) => {
    if (state.activeThemeId !== prev.activeThemeId) {
      pushWidgetUpdate();
    }
  });

  const unsubWidget = useWidgetStore.subscribe((state, prev) => {
    if (state.widgetThemeId !== prev.widgetThemeId) {
      pushWidgetUpdate();
    }
  });

  return () => {
    unsubPrayer();
    unsubTheme();
    unsubWidget();
  };
}

/** Demande au launcher d'épingler un widget. Retourne false si non supporté. */
export async function pinWidget(type: WidgetPinType): Promise<boolean> {
  if (!nativeBridge?.requestPinWidget) return false;
  try {
    return await nativeBridge.requestPinWidget(type);
  } catch (err) {
    if (__DEV__) console.warn("[widgetBridge] pin failed:", err);
    return false;
  }
}
