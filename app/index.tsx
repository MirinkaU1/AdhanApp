import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import useAuthStore from "@/stores/useAuthStore";

/**
 * Page d'entrée de l'app - Redirige vers la bonne destination
 * - Si authentifié → (tabs)
 * - Sinon → auth/welcome
 */
export default function IndexScreen() {
  useEffect(() => {
    checkAndRedirect();
  }, []);

  const checkAndRedirect = async () => {
    try {
      const { isAuthenticated } = useAuthStore.getState();

      // Vérifier aussi la session Supabase
      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && isAuthenticated) {
          router.replace("/(tabs)");
          return;
        }
      } else if (isAuthenticated) {
        router.replace("/(tabs)");
        return;
      }

      // Non authentifié → page de bienvenue
      router.replace("/auth/welcome");
    } catch (error) {
      console.error("Erreur redirection:", error);
      router.replace("/auth/welcome");
    }
  };

  // Afficher un loader pendant la vérification
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <LinearGradient
        colors={["#115E59", "#0d4542"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}
