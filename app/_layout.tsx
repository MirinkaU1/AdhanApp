import "../global.css";
import "@/lib/i18n"; // Initialiser i18n
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { useColorScheme as useSystemColorScheme, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import { Amiri_400Regular, Amiri_700Bold } from "@expo-google-fonts/amiri";
import { loadSavedLanguage } from "@/lib/i18n";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";
import useAuthStore from "@/stores/useAuthStore";
import useThemeStore from "@/stores/useThemeStore";
import { loginRevenueCat } from "@/lib/revenuecat";
import XpToast from "@/components/XpToast";
import LevelUpToast from "@/components/LevelUpToast";
import NotificationProvider from "@/components/NotificationProvider";
import SyncProvider from "@/components/SyncProvider";
import { subscribeWidgetToPrayerStore } from "@/lib/widgetBridge";
// Import statique (module scope) : enregistre la TaskManager.defineTask des
// actions de notification dès l'évaluation du bundle, y compris en lancement
// headless quand l'app est tuée. Le module est garde-fou pour Expo Go.
import { registerNotificationActionTask } from "@/utils/notificationActions";

import { useColorScheme } from "nativewind";
import { useQuranStore } from "@/stores/useQuranStore";
import useRamadanStore from "@/stores/useRamadanStore";
import useQuizStore from "@/stores/useQuizStore";

const isExpoGo = Constants.appOwnership === "expo";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Amiri_400Regular,
    Amiri_700Bold,
    ...MaterialIcons.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      loadSavedLanguage();
      import("@/utils/quranLoader").then(({ preloadQuranToStorage }) => {
        preloadQuranToStorage().catch(console.error);
      });
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const systemColorScheme = useSystemColorScheme();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { mode: themeMode, _hasHydrated } = useThemeStore();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, hasHydrated, isGuest } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // Synchroniser le thème du store avec NativeWind (seulement après hydratation)
  useEffect(() => {
    if (!_hasHydrated) return;

    if (themeMode === "system") {
      setColorScheme(systemColorScheme ?? "light");
    } else {
      setColorScheme(themeMode);
    }
  }, [themeMode, systemColorScheme, setColorScheme, _hasHydrated]);

  // Enregistrer la tâche de rappel quotidien en arrière-plan
  useEffect(() => {
    if (isExpoGo) return;

    const initBackgroundTasks = async () => {
      try {
        const { registerDailyReminderTask, scheduleEveningReminder } =
          await import("@/utils/backgroundTasks");
        await registerDailyReminderTask();
        await scheduleEveningReminder();

        // Traitement des boutons de notification quand l'app est tuée
        await registerNotificationActionTask();
      } catch (error) {
        console.error("Erreur initialisation tâches arrière-plan:", error);
      }
    };

    initBackgroundTasks();
  }, []);

  // Pousser les horaires de prière vers les widgets home-screen Android
  useEffect(() => {
    if (isExpoGo) return;
    return subscribeWidgetToPrayerStore();
  }, []);

  // Vérifier l'état d'authentification au démarrage
  useEffect(() => {
    if (!hasHydrated) return;

    const checkAuth = async () => {
      try {
        // Rafraîchir la session depuis Supabase et le store
        await useAuthStore.getState().refreshSession();
      } catch (error) {
        console.error("Erreur vérification auth:", error);
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();

    // Écouter les changements d'auth Supabase
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT") {
          // Éviter la boucle: on nettoie localement sans rappeler signOut
          useAuthStore.getState().clearAuth();
        } else if (event === "SIGNED_IN" && session?.user) {
          // Lier l'utilisateur RevenueCat à l'UUID Supabase pour que les
          // achats arrivent au bon user dans le webhook serveur.
          loginRevenueCat(session.user.id);
          // Rafraîchir la session après connexion
          await useAuthStore.getState().refreshSession();
          // Charger la progression Quran depuis Supabase
          await useQuranStore.getState().loadFromSupabase();
          // Charger la progression Quiz depuis Supabase
          await useQuizStore.getState().loadFromSupabase();
          // Charger les lunes Ramadan depuis Supabase
          await useRamadanStore.getState().loadMoonCoins();
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [hasHydrated]);

  // Redirection basée sur l'authentification
  useEffect(() => {
    if (!hasHydrated || !isReady) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const inAuth = segments[0] === "auth";
    const inIndex = segments[0] === undefined;

    // Exception: les invités (isGuest) peuvent accéder aux pages auth pour lier leur compte ou se connecter
    const isGuestAccessingAuth = isGuest && inAuth;

    console.log("[Navigation] Auth state:", {
      isAuthenticated,
      isGuest,
      segments,
      inAuthGroup,
      inAuth,
      inIndex,
    });

    if (isAuthenticated && (inAuth || inIndex) && !isGuestAccessingAuth) {
      // Utilisateur connecté (non-invité) sur auth ou index -> rediriger vers l'app
      console.log("[Navigation] Redirecting to /(tabs)");
      router.replace("/(tabs)");
    } else if (!isAuthenticated && inAuthGroup) {
      // Utilisateur non connecté dans l'app -> rediriger vers welcome
      console.log("[Navigation] Redirecting to /auth/welcome");
      router.replace("/auth/welcome");
    }
  }, [isAuthenticated, segments, isReady, hasHydrated]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="support" options={{ headerShown: false }} />
          <Stack.Screen name="quests" options={{ headerShown: false }} />
          <Stack.Screen name="levels" options={{ headerShown: false }} />
          <Stack.Screen name="themes" options={{ headerShown: false }} />
          <Stack.Screen name="quran" options={{ headerShown: false }} />
          <Stack.Screen
            name="quran/reader/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="learn" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", headerShown: false }}
          />
        </Stack>
        {/* Toast XP global */}
        <XpToast />
        {/* Toast Level Up */}
        <LevelUpToast />
        {/* Provider de notifications */}
        <NotificationProvider />
        {/* Provider de synchronisation Supabase */}
        <SyncProvider />
      </View>
    </ThemeProvider>
  );
}
