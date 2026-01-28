import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { format } from "date-fns";

export type PrayerCardProps = {
  name: string;
  time: Date;
  checked: boolean;
  onToggle: () => void;
  isPast?: boolean;
};

export function PrayerCard({
  name,
  time,
  checked,
  onToggle,
  isPast = false,
}: PrayerCardProps) {
  const containerClassName = [
    "flex-row items-center justify-between rounded-2xl border px-4 py-3",
    "border-neutral-200 bg-white/90",
    "dark:border-neutral-800 dark:bg-neutral-900/60",
    isPast ? "opacity-60" : "opacity-100",
  ].join(" ");

  const checkboxClassName = [
    "h-6 w-6 items-center justify-center rounded-full border",
    checked
      ? "border-emerald-500 bg-emerald-500"
      : "border-neutral-300 dark:border-neutral-700",
  ].join(" ");

  return (
    <Pressable
      onPress={onToggle}
      className={containerClassName}
      accessibilityRole="button"
      accessibilityLabel={`Marquer ${name} comme ${checked ? "complétée" : "non complétée"}`}
      accessibilityState={{ checked }}
    >
      <View className="flex-1">
        <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
          {name}
        </Text>
        <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {format(time, "HH:mm")}
        </Text>
      </View>
      <View className={checkboxClassName}>
        {checked ? <Check size={14} color="#ffffff" strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}
