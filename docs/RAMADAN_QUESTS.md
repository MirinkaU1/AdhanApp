# Quêtes Ramadan — Référence

> Branche : `feature/ramadan-mode`
> Dernière mise à jour : 2026-04-17

---

## Statut global

| Catégorie | Statut |
|---|---|
| Quêtes hebdomadaires | ✅ Implémentées |
| Quêtes quotidiennes | ⏳ À implémenter |
| Milestones / Spéciales | ⏳ À implémenter |
| Système de lunes | ✅ Implémenté |
| Interface Ramadan (thème) | ⏳ À implémenter |
| Boutique de thèmes | ⏳ À implémenter |

---

## Quêtes hebdomadaires ✅ — `isWeekly: true`, reset chaque lundi (clé ISO semaine)

| ID | Titre | XP | Lunes | Requirement | Détection | Statut |
|---|---|---|---|---|---|---|
| `ramadan_week_perfect` | Semaine parfaite | 200 | 5 | 7 jours 5 prières | `prayerStreak >= 7` | ⏳ détection manquante |
| `ramadan_week_juz` | Juz de la semaine | 150 | 3 | 240 versets | `weeklyVersesRead >= 240` | ✅ actif |
| `ramadan_week_surahs` | Tour du Coran | 100 | 2 | 10 sourates distinctes | `weeklyDistinctSurahs.length >= 10` | ✅ actif |

> **Note `ramadan_week_perfect`** : la détection du streak hebdomadaire de prières n'est pas encore branchée dans `useRamadanQuestTracker`. À implémenter via `usePrayerStore`.

---

## Quêtes quotidiennes ⏳ — `isDaily: true`, reset chaque jour

> Non encore implémentées dans le store. IDs et specs définies, à coder.

| ID | Titre | XP | Requirement | Détection |
|---|---|---|---|---|
| `ramadan_pray_fajr` | Fajr du Ramadan | 50 | 1 prière Fajr | `usePrayerStore.status.fajr` |
| `ramadan_pray_tarawih` | Tarawih | 40 | 1 Tarawih | Champ dédié à créer dans PrayerStore |
| `ramadan_read_quran` | Lecture du jour | 30 | 20 versets | `dailyVersesRead >= 20` |
| `ramadan_tasbih_triple` | Tasbih triple | 25 | 99 dhikrs | Delta journalier `useDhikrStore` |
| `ramadan_pray_5` | 5 prières | 60 | 5 prières | `usePrayerStore` toutes 5 cochées |
| `ramadan_verse_day` | Verset du jour | 20 | 1 lecture | Sourate du verset du jour lue |

---

## Milestones / Quêtes spéciales ⏳ — `isSpecial: true`, pas de reset

| ID | Titre | XP | Requirement | Détection |
|---|---|---|---|---|
| `ramadan_laylat_qadr` | Nuit du Destin | 300 | 5 prières J27 | Date islamique J27 + prières |
| `ramadan_halfway` | Mi-chemin | 150 | 15 jours streak | Streak ≥ 15 |
| `ramadan_khatm` | Khatm du Ramadan | 500 | 114 sourates | `weeklyDistinctSurahs` cumulé = 114 |
| `ramadan_1000_dhikr` | Mille dhikrs | 200 | 1000 dhikrs | Delta mensuel `useDhikrStore` |
| `ramadan_complete` | Ramadan complet | 1000 | 30 jours | Streak 30 jours |

---

## Système de Lunes (Moon Coins) ✅

Monnaie spéciale Ramadan, distincte de l'XP.

### Gain par quête hebdomadaire

| Quête | Lunes |
|---|---|
| Semaine parfaite | 5 |
| Juz de la semaine | 3 |
| Tour du Coran | 2 |

### Affichage ✅
- Badge `nightlight` dans le **header Quêtes** (si `isRamadanMode`)
- Badge dans le **header Dashboard** à gauche, côté localisation (non masqué par le bouton notif absolu)
- Double badge **XP + lunes** sur chaque `RamadanQuestCard`

### Persistance ✅
- Local : `useRamadanStore` → AsyncStorage (`ramadan-storage`)
- Serveur : table Supabase `ramadan_progress` (`user_id`, `moon_coins`, `updated_at`)
  - Sync au `addMoonCoins` / `spendMoonCoins`
  - Chargement au login via `loadMoonCoins()` dans `_layout.tsx`
  - ⚠️ Table à créer dans Supabase : `ramadan_progress (user_id uuid PK, moon_coins int4, updated_at timestamptz)`

### Utilisation (à venir) ⏳
- Acheter des thèmes spéciaux
- Débloquer des badges de profil
- Contenu exclusif (duas, invocations)

---

## Architecture de détection

```
useQuranStore.updateProgress()
       │
       ▼
dailyVersesRead++   weeklyVersesRead++   weeklyDistinctSurahs.add(surahId)
       │
       ▼
useRamadanQuestTracker (hook — monté dans _layout.tsx) ✅
       │
       ├─ weeklyVersesRead >= 240        → ramadan_week_juz     ✅
       ├─ weeklyDistinctSurahs.length    → ramadan_week_surahs  ✅
       └─ prayerStreak (à brancher)      → ramadan_week_perfect ⏳
```

---

## Implémentation — Checklist complète

### Core
- [x] `useRamadanStore` — `isRamadanMode`, `moonCoins`, `addMoonCoins`, `spendMoonCoins`, sync Supabase
- [x] `useQuestStore` — `RamadanQuestId`, `RamadanQuest` (avec `moonReward`), quêtes hebdo, reset hebdo, `claimRamadanQuestReward`, migration `onRehydrateStorage`
- [x] `useQuranStore` — `QuranReadingTracking` (daily/weekly versets, sourates distinctes), anti-doublon
- [x] `useRamadanQuestTracker` — hook de détection Quran → quêtes

### UI
- [x] Page Debug — toggle Ramadan + boutons "Compléter" + Reset quêtes hebdo
- [x] Page Quêtes — onglet "Évènement" conditionnel + `RamadanQuestCard` (couleurs ambre, moonReward)
- [x] `AppTabs` — support badge optionnel par onglet
- [x] Badges par onglet (Quotidien / Succès / Évènement) — comptent les quêtes `"completed"` non réclamées
- [x] `getUnclaimedQuestsCount` — inclut les quêtes Ramadan
- [x] Toast "Prête à réclamer !" au passage en `completed`
- [x] Toast claim — texte "Quête Ramadan accomplie !" (reason `ramadan_quest_*`)

### À faire
- [ ] Quêtes quotidiennes Ramadan — store + détection + UI
- [ ] `ramadan_week_perfect` — brancher détection streak prières
- [ ] Milestones — store + détection + UI
- [ ] Interface Ramadan — thème visuel (couleurs, header spécial)
- [ ] Boutique de thèmes — dépense de lunes, prévisualisation
- [ ] Créer table Supabase `ramadan_progress`
- [ ] Monter `useRamadanQuestTracker` dans `_layout.tsx`
