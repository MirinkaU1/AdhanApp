# Quêtes Ramadan — Référence

> Branche : `feature/ramadan-mode`
> Statut : 🚧 En cours d'implémentation

---

## Quêtes quotidiennes (`isDaily: true`, reset chaque jour)

| ID | Titre | Description | Icône | Requirement | XP | Détection |
|---|---|---|---|---|---|---|
| `ramadan_pray_fajr` | Fajr du Ramadan | Prier Fajr à l'heure | `dark-mode` | 1 prière | 50 | `usePrayerStore.status.fajr` |
| `ramadan_pray_tarawih` | Tarawih | Marquer Tarawih comme accomplie | `nights-stay` | 1 | 40 | Champ dédié dans PrayerStore |
| `ramadan_read_quran` | Lecture du jour | Lire au moins 20 versets | `menu-book` | 20 versets | 30 | `useQuranStore.dailyVersesRead >= 20` |
| `ramadan_tasbih_triple` | Tasbih triple | 33 SubhanAllah + 33 Alhamdulillah + 33 AllahuAkbar | `self-improvement` | 99 dhikrs | 25 | `useDhikrStore.totalLifetimeCount` (daily delta) |
| `ramadan_pray_5` | 5 prières | Accomplir les 5 prières dans la journée | `star` | 5 | 60 | `usePrayerStore` — toutes 5 cochées |
| `ramadan_verse_day` | Verset du jour | Lire le verset du jour | `auto-stories` | 1 | 20 | Lecture du surah du verset du jour |

---

## Quêtes hebdomadaires (`isWeekly: true`, reset chaque lundi)

| ID | Titre | Description | Icône | Requirement | XP | Détection |
|---|---|---|---|---|---|---|
| `ramadan_week_perfect` | Semaine parfaite | 5 prières/jour pendant 7 jours consécutifs | `emoji-events` | 7 jours | 200 | `prayerStreak >= 7` dans PrayerStore |
| `ramadan_week_juz` | Juz de la semaine | Lire au moins 240 versets dans la semaine | `import-contacts` | 240 versets | 150 | `useQuranStore.weeklyVersesRead >= 240` |
| `ramadan_week_surahs` | Tour du Coran | Lire 10 sourates différentes dans la semaine | `library-books` | 10 sourates | 100 | `useQuranStore.weeklyDistinctSurahs.length >= 10` |

---

## Milestones / Quêtes spéciales (`isSpecial: true`, pas de reset)

| ID | Titre | Description | Icône | Requirement | XP | Détection |
|---|---|---|---|---|---|---|
| `ramadan_laylat_qadr` | Nuit du Destin | Accomplir toutes les prières le 27 Ramadan | `star` | 5 prières J27 | 300 | Date islamique J27 + 5 prières |
| `ramadan_halfway` | Mi-chemin | Arriver au 15ème jour avec streak intact | `trending-up` | 15 jours | 150 | Streak ≥ 15 jours |
| `ramadan_khatm` | Khatm du Ramadan | Lire les 114 sourates pendant le mois | `menu-book` | 114 sourates | 500 | `weeklyDistinctSurahs` cumulé = 114 |
| `ramadan_1000_dhikr` | Mille dhikrs | Atteindre 1000 dhikrs cumulés sur le mois | `self-improvement` | 1000 | 200 | `useDhikrStore.totalLifetimeCount` (delta mensuel) |
| `ramadan_complete` | Ramadan complet | 30 jours avec les 5 prières accomplies | `workspace-premium` | 30 jours | 1000 | Streak 30 jours |

---

## Architecture de détection

```
useQuranStore.updateProgress()
       │
       ▼
dailyVersesRead++   weeklyVersesRead++   weeklyDistinctSurahs.add(surahId)
       │
       ▼
useRamadanQuestTracker (hook)
       │
       ├─ dailyVersesRead >= 20  → updateQuestProgress('ramadan_read_quran', 20)
       ├─ weeklyVersesRead >= 240 → updateQuestProgress('ramadan_week_juz', 240)
       └─ weeklyDistinctSurahs.length >= 10 → updateQuestProgress('ramadan_week_surahs', count)
```

---

## Implémentation — État

- [x] Documentation créée
- [ ] `useQuestStore` — ajout types et quêtes hebdomadaires
- [ ] `useQuranStore` — tracking `dailyVersesRead` / `weeklyVersesRead` / `weeklyDistinctSurahs`
- [ ] `useRamadanQuestTracker` — hook de détection
- [ ] Interface Ramadan (thème spécial)
