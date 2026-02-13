import { Stack } from "expo-router";

export default function QuranLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dhikr" />
      <Stack.Screen name="favorites" />
    </Stack>
  );
}
