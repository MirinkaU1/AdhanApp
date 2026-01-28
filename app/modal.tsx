import { StatusBar } from "expo-status-bar";
import { Platform, Pressable, ScrollView, View, Text } from "react-native";
import { router } from "expo-router";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { useIsDark } from "@/components/useColorScheme";

export default function ModalScreen() {
  const isDark = useIsDark();

  const colors = {
    bg: isDark ? "#0F172A" : "#FFFFFF",
    card: isDark ? "#1E293B" : "#F8FAFC",
    textPrimary: isDark ? "#F8FAFC" : "#1E293B",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    tealDark: "#115E59",
    accent: "#D97706",
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: Platform.OS === "ios" ? 16 : 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontFamily: "Outfit_700Bold",
            color: colors.textPrimary,
          }}
        >
          Informations
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIconsRound
            name="close"
            size={22}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: colors.tealDark,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIconsRound name="info" size={24} color="#fff" />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Outfit_700Bold",
                color: colors.textPrimary,
              }}
            >
              À propos de Adhan
            </Text>
          </View>
          <Text
            style={{
              fontSize: 15,
              fontFamily: "Outfit_400Regular",
              color: colors.textSecondary,
              lineHeight: 22,
            }}
          >
            Adhan est votre compagnon spirituel quotidien. Suivez vos prières,
            recevez des rappels et progressez dans votre pratique religieuse.
          </Text>
        </View>

        {/* Version */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: "Outfit_500Medium",
              color: colors.textSecondary,
            }}
          >
            Version
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: "Outfit_600SemiBold",
              color: colors.textPrimary,
            }}
          >
            1.0.0
          </Text>
        </View>
      </ScrollView>

      <StatusBar style={isDark ? "light" : "dark"} />
    </View>
  );
}
