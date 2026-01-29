import { lazy, Suspense } from "react";
import Constants from "expo-constants";

// Détecter si on est dans Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Lazy load le composant qui utilise les notifications
const NotificationManager = lazy(() => import("./NotificationManager"));

/**
 * Composant qui gère les notifications de prière globalement.
 * Doit être placé dans le layout principal.
 * Ne charge pas les notifications dans Expo Go pour éviter les erreurs.
 */
export default function NotificationProvider() {
  // Dans Expo Go, ne rien faire
  if (isExpoGo) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <NotificationManager />
    </Suspense>
  );
}
