# Ajouts effectués

## Checklist des fonctionnalités (MVP)

- [x] Dashboard : ville, date, compte à rebours, liste des 5 prières
- [x] Calcul des horaires via `adhan`
- [x] Toggle des prières (état local persistant)
- [x] Localisation (GPS + reverse geocode)
- [x] Onglets Accueil / Historique (placeholder)
- [x] Écran Paramètres (accès au soutien)
- [x] Écran "Soutenir le développeur"
- [x] Cartes de dons (3 paliers)
- [x] Achat via RevenueCat + états de chargement
- [x] Confettis après succès
- [x] Marquage supporter dans Supabase (si configuré)
- [x] Notifications locales par prière
- [x] Gestion activation/désactivation notifications
- [x] Historique calendrier/semaine (7 jours)
- [x] Streaks calculés
- [x] Offline-first + sync Supabase
- [x] Auth Supabase + profils
- [x] Logique hybride (adhan local + enrichissement aladhan)
- [x] Date Hijri locale + ajustement
- [x] Calibrage (méthode, Hijri, synchro auto)

## Nouveaux dossiers

- [hooks](../hooks) : hooks métier (adhan, location, notifications).
- [stores](../stores) : état local (Zustand) et persistance.
- [types](../types) : déclarations TypeScript locales.
- [docs](../docs) : documentation interne du projet.

## Nouveaux fichiers

- [components/PrayerCard.tsx](../components/PrayerCard.tsx) : carte de prière minimaliste (nom, heure, checkbox).
- [components/SupportTierCard.tsx](../components/SupportTierCard.tsx) : carte de don réutilisable.
- [stores/usePrayerStore.ts](../stores/usePrayerStore.ts) : store Zustand (toggle, reset quotidien, persistance).
- [stores/useNotificationStore.ts](../stores/useNotificationStore.ts) : préférences notifications par prière.
- [hooks/usePrayerTimes.ts](../hooks/usePrayerTimes.ts) : hook de calcul des horaires via `adhan`.
- [hooks/usePrayerEngine.ts](../hooks/usePrayerEngine.ts) : moteur hybride (adhan + aladhan + Hijri).
- [hooks/useCurrentLocation.ts](../hooks/useCurrentLocation.ts) : récupération GPS + reverse geocode de la ville.
- [hooks/usePrayerNotifications.ts](../hooks/usePrayerNotifications.ts) : planification des notifications locales.
- [hooks/useSyncDailyLogs.ts](../hooks/useSyncDailyLogs.ts) : sync offline-first vers Supabase.
- [hooks/useSupabaseSession.ts](../hooks/useSupabaseSession.ts) : état de session Supabase.
- [lib/revenuecat.ts](../lib/revenuecat.ts) : initialisation RevenueCat.
- [lib/supabase.ts](../lib/supabase.ts) : client Supabase (env).
- [app/auth.tsx](../app/auth.tsx) : écran de connexion (OTP email).
- [app/support.tsx](../app/support.tsx) : écran de dons + achat + confettis.
- [app/(tabs)/settings.tsx](<../app/(tabs)/settings.tsx>) : écran Paramètres.
- [.env.example](../.env.example) : variables d'environnement.
- [nativewind-env.d.ts](../nativewind-env.d.ts) : types NativeWind pour `className`.
- [types/lucide-react-native.d.ts](../types/lucide-react-native.d.ts) : types locaux pour l’icône `Check`.

## Dépendances ajoutées

- [package.json](../package.json) :
  - `@react-native-async-storage/async-storage`
  - `@react-native-community/netinfo`
  - `lucide-react-native`

## Config mise à jour

- [tsconfig.json](../tsconfig.json) :
  - ajout explicite de `jsx`
  - ajout de `baseUrl`
  - alias `@/hooks/*`
  - alias pour `lucide-react-native`
- [app.json](../app.json) :
  - permissions localisation iOS/Android
  - permissions notifications iOS/Android

## Écrans mis à jour

- [app/(tabs)/index.tsx](<../app/(tabs)/index.tsx>) : dashboard (ville, date, compte à rebours, liste des prières).
- [app/(tabs)/two.tsx](<../app/(tabs)/two.tsx>) : historique 7 jours + streak.
- [app/(tabs)/\_layout.tsx](<../app/(tabs)/_layout.tsx>) : titres d’onglets et icônes.

## Notes techniques

- `usePrayerStore` persiste uniquement `dateKey` et `status` pour rester léger.
- `usePrayerTimes` expose `nextPrayer` et `nextPrayerTime` pour le compte à rebours.
- Les notifications prière utilisent des `identifier` dédiés pour annulation ciblée.
