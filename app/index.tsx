import { useEffect } from "react";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import useAuthStore from "@/stores/useAuthStore";
import { AppLoader } from "@/components/ui";

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

  return <AppLoader variant="fullscreen" />;
}
