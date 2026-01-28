import { Pressable, Text, View, ActivityIndicator } from 'react-native';

export type SupportTierCardProps = {
  title: string;
  emoji: string;
  priceLabel: string;
  isLoading?: boolean;
  onPress: () => void;
};

export function SupportTierCard({
  title,
  emoji,
  priceLabel,
  isLoading = false,
  onPress,
}: SupportTierCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      className="flex-row items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900/60"
      accessibilityRole="button"
      accessibilityLabel={`Choisir ${title}`}
    >
      <View className="flex-row items-center gap-3">
        <Text className="text-2xl">{emoji}</Text>
        <View>
          <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">{title}</Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">{priceLabel}</Text>
        </View>
      </View>
      {isLoading ? <ActivityIndicator size="small" color="#10b981" /> : null}
    </Pressable>
  );
}
