import { View, Text } from "react-native";
import MaterialIconsRound from "@/components/MaterialIconsRound";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export default function ErrorMessage({
  message,
  className = "",
}: ErrorMessageProps) {
  if (!message) return null;

  return (
    <View
      className={`bg-red-100 dark:bg-red-900/30 rounded-lg py-3 px-4 flex-row items-center gap-2 ${className}`}
    >
      <MaterialIconsRound name="error" size={20} color="#EF4444" />
      <Text className="flex-1 text-base font-outfit-medium text-red-600 dark:text-red-400">
        {message}
      </Text>
    </View>
  );
}
