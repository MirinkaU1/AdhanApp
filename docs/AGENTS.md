# AGENTS.md - Suivi des demandes et tâches MaPrière

## À propos
Ce document sert de suivi pour toutes les demandes et améliorations demandées sur le projet MaPrière. Il est mis à jour au fur et à mesure de l'avancement.

## Tâches en cours

### Quran Engine Implementation
- [x] Installation et configuration police Amiri (@expo-google-fonts/amiri)
- [x] Création du fichier constants/QuranData.ts avec DAILY_VERSES et ESSENTIAL_SURAHS
- [x] Mise à jour tailwind.config.js pour les classes font-amiri
- [x] Mise à jour app/_layout.tsx pour charger la police Amiri
- [x] Création composant DailyVerseCard.tsx
- [x] Création composant SurahReaderModal.tsx
- [x] Création page quran.tsx avec grid d'activités
- [x] Uniformisation des designs avec AppCard, AppText
- [x] Création composant HadithCard.tsx
- [x] Création composant ContinueReadingCard.tsx
- [x] Remplacement DailyWisdomCard par ContinueReadingCard dans quran.tsx
- [x] Création nouvelle page /app/quran/index.tsx (liste des sourates)
- [x] Navigation "Lire le Coran" → page liste des sourates
- [x] Click sur sourate dans la liste → ouvre dans drawer
- [x] Traductions i18n pour tous les textes Quran (FR/EN)
- [x] Application des traductions dans quran.tsx
- [x] Application des traductions dans quran/index.tsx
- [x] Application des traductions dans les composants (ContinueReadingCard, DailyWisdomCard, SurahReaderDrawer)
- [x] Structure de données Quran avec index.json dans en/ et fr/
- [x] Service quranLoader.ts pour charger dynamiquement les sourates
- [x] Intégration des 114 sourates via index.json
- [x] Adaptation SurahReaderDrawer pour utiliser les nouveaux fichiers JSON
- [x] Création app/quran/_layout.tsx (headerShown: false)
- [x] Page quran/index.tsx affiche les 114 sourates depuis index.json
- [x] Navigation complète vers toutes les sourates du Coran

### Corrections et Améliorations
- [x] Refactoring DailyVerseCard avec design gradient (comme HadithCard)
- [x] Alternance Verset/Hadith dans une seule card (DailyWisdomCard)
- [x] Refaire header quran.tsx avec rounded-b-4xl comme index.tsx
- [x] Corriger grid d'activités avec AppCard
- [x] Corriger hauteurs égales des cards dans la grid
- [x] Ajout propriété surahId aux versets dans QuranData
- [x] Création SurahReaderDrawer avec AppDrawer et scroll
- [x] Navigation intelligente vers la sourate du verset
- [x] Scroll automatique avec animation jusqu'au verset
- [x] Highlight visuel du verset cible
- [x] Intégration Al-Sharh (sourate 94) dans ESSENTIAL_SURAHS
- [x] Amélioration drawer avec gestes interactifs
- [x] Correction du scroll dans le drawer (geste uniquement sur la poignée)

## TODO / Futures améliorations

### Quran Features
- [ ] Ajouter plus de sourates à ESSENTIAL_SURAHS
- [ ] Implémenter feature Hadiths dédiée
- [ ] Implémenter feature Dhikr
- [ ] Ajouter audio des sourates (si possible offline)
- [ ] Mode nuit pour lecture confortable
- [ ] Signets versets favoris

### Gamification Quran
- [ ] Quêtes de lecture quotidienne
- [ ] Progression mémorisation versets
- [ ] Badges sourates complétées
- [ ] Streak de lecture

### Corrections techniques
- [ ] Optimiser performances rendu longues listes versets
- [ ] Améliorer estimation position scroll versets

## Modifications AppDrawer (31 Jan 2026)

### Améliorations apportées à AppDrawer
- [x] Ajout gestes de swipe pour fermer (uniquement sur la poignée)
- [x] Position fixe en bas de l'écran (bottom: 0)
- [x] Retrait animation de rebond (bounces={false}, overScrollMode="never")
- [x] Détection intelligente du scroll (ne ferme pas si on scrolle vers le haut)
- [x] Backdrop cliquable pour fermer
- [x] Support enableSwipeToClose optionnel
- [x] Animations fluides avec react-native-reanimated
- [x] Ajout traduction i18n pour le bouton "Fermer/Close"

### Composants utilisant AppDrawer
- SurahReaderDrawer - Lecteur de sourates avec scroll vers le verset cible
- Tous les autres drawers de l'app bénéficient maintenant des gestes

### Breaking changes
Aucun - l'API reste compatible, seulement des ajouts optionnels

## Performances et Optimisations (31 Jan 2026)

### Améliorations de navigation
- [x] Splash screen non bloqué par le préchargement Quran
- [x] Pré-chargement des routes avec router.prefetch()
- [x] Rendu virtualisé avec FlatList (au lieu de ScrollView + map)
- [x] Composants SurahCard optimisés avec React.memo
- [x] Configuration optimisée FlatList: initialNumToRender, removeClippedSubviews

### Header quran/index.tsx
- [x] Design avec gradient teal (#115E59 → #0d4542)
- [x] Coins arrondis (rounded-b-4xl)
- [x] Bouton favoris avec badge (en haut à droite)
- [x] Barre de progression intégrée au header du lecteur

## Système de Favoris (31 Jan 2026)

### Store useQuranStore
- [x] Interface FavoriteVerse ajoutée
- [x] Actions: addToFavorites, removeFromFavorites, isFavorite, getAllFavorites
- [x] Action: unmarkVerse pour retirer marquage "lu"
- [x] Synchronisation Supabase avec favorite_verses

### Composants Favoris
- [x] VerseOptionsDrawer - ajout/retrait favoris avec toggle
- [x] Page /app/quran/favorites.tsx - liste des versets favoris
- [x] Groupement des favoris par sourate
- [x] Toast de confirmation lors de la suppression
- [x] Navigation vers le lecteur au clic sur un favori

### Bouton Favoris
- [x] Badge dans header quran/index (en haut à droite de l'icône)
- [x] Format compact avec nombre (cappé à "99+")
- [x] Accès rapide à la page favoris

## Page quran.tsx - Réorganisation (31 Jan 2026)

### Changements effectués
- [x] Section "Sourates Essentielles" retirée
- [x] Grid d'activités restructurée avec 5 items:
  - Lire le Coran (menu-book, teal)
  - Hadiths (format-quote, amber)
  - Dhikr (self-improvement, emerald)
  - Apprendre (school, violet) → vers /learn
  - Quêtes (military-tech, orange) → vers /quests

### Traductions ajoutées
- learnQuran: "Le Coran en profondeur" / "Deepen your knowledge"
- quests: "Quêtes" / "Quests"
- dailyQuests: "Quêtes quotidiennes" / "Daily quests"

## Migration Supabase (31 Jan 2026)

### Table quran_progress
Emplacement: supabase/migrations/20260131_create_quran_progress.sql

Colonnes:
- id (BIGSERIAL, PK)
- user_id (UUID, FK vers auth.users)
- progress (JSONB)
- stats (JSONB)
- last_position (JSONB)
- favorite_verses (JSONB)
- updated_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)

Politiques RLS:
- SELECT: auth.uid() = user_id
- UPDATE: auth.uid() = user_id
- INSERT: auth.uid() = user_id

## Composants Clés Créés

### SurahCard.tsx
- Card de sourate avec progression
- Barre de progression visuelle
- Affichage du percentage et versets lus
- Design cohérent avec le reste de l'app

### VerseOptionsDrawer.tsx
- Options pour chaque verset
- Marquer comme lu/non lu
- Ajouter/retirer des favoris
- Partager et copier
- Intégration i18n complète

### favorites.tsx
- Page dédiée aux versets favoris
- Groupement par sourate
- Cards avec texte arabe et traduction
- Bouton suppression avec confirmation toast

### Nouvelles traductions
- common.close: "Fermer" / "Close"
- quran.favorites: "Favoris" / "Favorites"
- quran.addToFavorites / removeFromFavorites / removedFromFavorites
- quran.noFavorites / noFavoritesHint
- quran.verseSaved / versesSaved / allFavorites
- quran.learnQuran / quests / dailyQuests

---
Dernière mise à jour: 31 Jan 2026
