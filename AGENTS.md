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

### Composants utilisant AppDrawer
- SurahReaderDrawer - Lecteur de sourates avec scroll vers le verset cible
- Tous les autres drawers de l'app bénéficient maintenant des gestes

### Breaking changes
Aucun - l'API reste compatible, seulement des ajouts optionnels

## Notes techniques

### Dépendances ajoutées
- @expo-google-fonts/amiri: ^0.4.1
- react-native-gesture-handler: ^2.30.0 (pour les gestes du drawer)

### Composants clés créés
1. **DailyWisdomCard** - Card unique qui alterne entre verset et hadith selon le jour
2. **SurahReaderDrawer** - Drawer interactif avec scroll et gestes
3. **QuranData.ts** - Structure de données locale pour le Quran

### Design System utilisé
- NativeWind pour le styling
- AppCard, AppText comme composants de base
- Thème Teal (#115E59) et Amber (#D97706)
- Police Amiri pour le texte arabe
- Police Outfit pour le texte français

## Historique des modifications

### 30 Jan 2026
- Création initiale du Quran Engine
- Implémentation complète des composants Quran
- Intégration dans les pages index.tsx et quran.tsx
- Corrections bugs et améliorations UX

---
Dernière mise à jour: 30 Jan 2026
