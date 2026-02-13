# 🕌 AdhanApp - Application de Prières Islamiques avec Gamification

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-brightgreen.svg)
![Expo](https://img.shields.io/badge/Expo-~54.0-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

Une application mobile moderne pour accompagner les musulmans dans leur pratique quotidienne avec un système de gamification innovant.

[Fonctionnalités](#-fonctionnalités) • [Stack Technique](#-stack-technique) • [Installation](#-installation) • [Architecture](#-architecture)

</div>

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Stack Technique](#-stack-technique)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Structure du projet](#-structure-du-projet)
- [Stores et State Management](#-stores-et-state-management)
- [Services Backend](#-services-backend)

---

## 🌟 Vue d'ensemble

**AdhanApp** est une application mobile cross-platform (iOS/Android) qui combine :
- 📿 **Suivi des prières** avec horaires précis basés sur la géolocalisation
- 🎮 **Système de gamification** (XP, niveaux, quêtes journalières)
- 📖 **Lecteur Coran** avec traductions et récitations audio
- 🎯 **Système de quêtes** pour encourager la régularité
- 🧭 **Boussole Qibla** pour trouver la direction de la Mecque
- 📊 **Statistiques détaillées** et système de streaks
- 🌍 **Support multilingue** (i18n)

---

## ✨ Fonctionnalités

### 🕌 Gestion des Prières

- ✅ **Calcul automatique** des 5 horaires de prières via la bibliothèque `adhan`
- 📍 **Géolocalisation** avec reverse geocoding pour afficher la ville
- 🔔 **Notifications intelligentes** pour chaque prière
- ✔️ **Système de toggle** pour marquer les prières accomplies
- 📅 **Historique calendrier** avec vue mensuelle et hebdomadaire
- 🔥 **Streaks** pour suivre la régularité
- 🌙 **Date Hijri** avec ajustement manuel
- ⚙️ **Calibrage** : méthodes de calcul, ajustements personnalisés

### 🎮 Système de Gamification

- 🏆 **Système XP** avec progression par niveaux
- 🎯 **Quêtes journalières** variées :
  - Accomplir des prières
  - Réciter le Coran (ayahs/pages)
  - Faire des dhikrs
  - Chercher la Qibla
  - Participer au système de dons
- 🎁 **Récompenses** sous forme d'XP et de badges
- 📊 **Statistiques détaillées** de progression
- 🎨 **Système d'avatars** (prédéfinis et personnalisés)

### 📖 Lecteur Coran

- 📚 **Texte arabe complet** avec diacritiques
- 🌐 **Traductions** multilingues
- 🔊 **Récitations audio** de différents récitants
- 🔖 **Système de marque-pages**
- 📄 **Navigation** par sourates, juz, pages
- 🔍 **Recherche** dans le texte

### 🧭 Autres Fonctionnalités

- 🧭 **Boussole Qibla 3D** interactive avec capteurs
- 📿 **Compteur de dhikrs** avec présets
- 💰 **Système de dons** via RevenueCat
- 🌓 **Mode sombre/clair** adaptatif
- 🔄 **Synchronisation cloud** via Supabase
- 📴 **Mode offline-first** avec sync automatique
- 🔐 **Authentification sécurisée** avec Supabase Auth (OTP email)

---

## 🛠 Stack Technique

### Frontend

<table>
<tr>
<td width="50%">

**Framework & Core**
- ⚛️ React Native `0.81.5`
- 📦 Expo SDK `~54.0`
- 🧭 Expo Router `6.0` (file-based routing)
- 📘 TypeScript `5.9.2`
- 🎨 NativeWind `4.2.1` (Tailwind CSS)

**UI & Styling**
- 🎨 Tailwind CSS (via NativeWind)
- 💫 React Native Reanimated `4.1.1`
- 👆 React Native Gesture Handler `2.30.0`
- 🎭 Lucide React Native (icônes)
- 🌈 Expo Linear Gradient
- 🌫️ Expo Blur

</td>
<td width="50%">

**State Management**
- 🐻 Zustand `5.0.10` (global state)
- 💾 AsyncStorage (persistance locale)

**3D & Graphics**
- 🎨 React Three Fiber `9.5.0`
- 🌟 React Three Drei `10.7.7`
- 📐 Three.js `0.166.1`
- 🎮 Expo Three `8.0.0`

**Internationalisation**
- 🌍 i18next `25.8.0`
- 🔤 react-i18next `16.5.3`

</td>
</tr>
</table>

### Backend & Services

<table>
<tr>
<td width="50%">

**BaaS & Auth**
- 🔐 Supabase `2.91.1`
  - Auth (OTP email)
  - PostgreSQL Database
  - Storage (avatars)
  - Real-time subscriptions

**APIs & Data**
- 🕌 `adhan` `4.4.3` (calcul des prières)
- 📍 Expo Location
- 📡 NetInfo (statut réseau)

</td>
<td width="50%">

**Notifications & Background**
- 🔔 Expo Notifications
- ⏰ Expo Background Fetch
- 📋 Expo Task Manager

**Monétisation**
- 💳 RevenueCat `9.7.1` (IAP)
- 💰 RevenueCat UI `9.7.1`

**Utilitaires**
- 📅 date-fns `4.1.0`
- 🔐 base-64 `1.0.0`
- 🎉 React Native Confetti Cannon

</td>
</tr>
</table>

### DevOps & Tooling

- 🏗️ Metro Bundler (custom config)
- 📱 Expo Application Services (EAS)
- 🧪 Jest + React Test Renderer
- 🐙 Git + GitHub

---

## 🏗 Architecture

### Pattern Architectural

L'application suit une architecture **modulaire et évolutive** :

```
┌─────────────────────────────────────────────────┐
│              Expo Router (Navigation)            │
└─────────────────┬───────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────┐               ┌──────▼──────┐
│ Screens│               │  Components │
└───┬────┘               └──────┬──────┘
    │                           │
    └─────────┬─────────────────┘
              │
    ┌─────────▼─────────┐
    │   Hooks (Logic)   │
    └─────────┬─────────┘
              │
    ┌─────────▼─────────┐
    │  Stores (Zustand) │
    └─────────┬─────────┘
              │
    ┌─────────▼─────────────────────┐
    │  Services (Supabase, adhan)   │
    └───────────────────────────────┘
```

### Principes clés

- ✅ **Offline-first** : toutes les données critiques sont stockées localement
- ✅ **Separation of Concerns** : hooks métier, stores dédiés, services isolés
- ✅ **Type-safety** : TypeScript strict sur tout le projet
- ✅ **Reactive** : Zustand pour un state management prévisible
- ✅ **Composants réutilisables** : UI components avec Shadcn UI + Lucide

---

## 📦 Installation

### Prérequis

- Node.js `18.x` ou supérieur
- npm ou yarn
- Expo CLI `npm install -g expo-cli`
- Un compte Expo (pour EAS Build)

### Étapes

1. **Cloner le repository**
```bash
git clone https://github.com/MirinkaU1/PrayerApp.git
cd PrayerApp
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Configurer les variables d'environnement**

Créer un fichier `.env` à la racine :
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_rc_android_key
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_rc_ios_key
```

4. **Lancer l'application**

```bash
# Mode développement
npm start

# iOS
npm run ios

# Android
npm run android

# Web (preview)
npm run web
```

---

## ⚙️ Configuration

### Méthodes de calcul des prières

Par défaut, l'app utilise la méthode **Muslim World League**. Configurable dans l'écran Paramètres :
- Muslim World League
- ISNA (Islamic Society of North America)
- Egyptian General Authority of Survey
- Umm al-Qura University, Makkah
- University of Islamic Sciences, Karachi

### Notifications

Les notifications sont configurables par prière (Fajr, Dhuhr, Asr, Maghrib, Isha).

Permissions requises :
- iOS : `NSUserNotificationUsageDescription`
- Android : `POST_NOTIFICATIONS`

### Géolocalisation

Permissions requises :
- iOS : `NSLocationWhenInUseUsageDescription`
- Android : `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`

---

## 📁 Structure du projet

```
PrayerApp/
├── app/                      # Screens (Expo Router file-based routing)
│   ├── (tabs)/              # Navigation par onglets
│   │   ├── index.tsx        # 🏠 Accueil (Dashboard prières)
│   │   ├── qibla.tsx        # 🧭 Boussole Qibla
│   │   ├── quran.tsx        # 📖 Lecteur Coran
│   │   ├── two.tsx          # 📊 Historique/Statistiques
│   │   └── settings.tsx     # ⚙️ Paramètres
│   ├── auth/                # Authentification
│   │   ├── welcome.tsx      # Page d'accueil
│   │   └── login.tsx        # Connexion OTP
│   ├── settings/            # Sous-pages paramètres
│   ├── quran/               # Sous-pages Coran
│   ├── index.tsx            # Point d'entrée (redirection)
│   ├── quests.tsx           # Modal des quêtes
│   ├── levels.tsx           # Modal niveaux/badges
│   └── support.tsx          # Écran de dons
│
├── components/              # Composants réutilisables
│   ├── ui/                  # Composants UI (Shadcn-style)
│   ├── quran/               # Composants spécifiques Coran
│   ├── PrayerCard.tsx       # Carte de prière
│   ├── SupportTierCard.tsx  # Carte de don
│   ├── LevelUpToast.tsx     # Toast de level up
│   ├── XpToast.tsx          # Toast d'XP
│   └── NotificationManager.tsx
│
├── hooks/                   # Custom hooks (logique métier)
│   ├── usePrayerEngine.ts   # 🕌 Moteur hybride adhan + API
│   ├── usePrayerTimes.ts    # ⏰ Calcul des horaires
│   ├── usePrayerLocation.ts # 📍 Géolocalisation
│   ├── usePrayerNotifications.ts # 🔔 Notifications
│   ├── useQibla.ts          # 🧭 Direction Qibla
│   ├── useGamification.ts   # 🎮 Logique de gamification
│   ├── useSyncData.ts       # 🔄 Synchronisation cloud
│   └── useStatistics.ts     # 📊 Calcul des statistiques
│
├── stores/                  # State management (Zustand)
│   ├── usePrayerStore.ts    # État des prières
│   ├── useAuthStore.ts      # Authentification et profil
│   ├── useQuestStore.ts     # Quêtes et gamification
│   ├── useQuranStore.ts     # Lecteur Coran
│   ├── useDhikrStore.ts     # Compteur de dhikrs
│   ├── useNotificationStore.ts # Préférences notifications
│   └── useThemeStore.ts     # Thème (dark/light)
│
├── lib/                     # Services et utilitaires
│   ├── supabase.ts          # Client Supabase
│   ├── revenuecat.ts        # Configuration RevenueCat
│   ├── avatarService.ts     # Service de gestion avatars
│   ├── utils.ts             # Fonctions utilitaires
│   └── i18n/                # Configuration i18n
│
├── constants/               # Constantes globales
│   ├── Colors.ts            # Palette de couleurs
│   ├── QuranData.ts         # Données du Coran
│   └── theme.ts             # Configuration thème
│
├── assets/                  # Ressources statiques
│   ├── audio/               # Sons et récitations
│   ├── data/                # Fichiers JSON (Coran)
│   ├── fonts/               # Polices custom
│   ├── images/              # Images et icônes
│   └── quran/               # Assets Coran
│
├── types/                   # Types TypeScript
├── docs/                    # Documentation
├── supabase/                # Migrations et schémas DB
│   └── migrations/
│
└── android/ & ios/          # Dossiers natifs
```

---

## 🐻 Stores et State Management

L'application utilise **Zustand** avec persistance AsyncStorage pour un state management simple et performant.

### Stores principaux

| Store | Responsabilité | Persisté |
|-------|----------------|----------|
| `usePrayerStore` | État des prières, toggles, historique, streaks | ✅ |
| `useAuthStore` | Session, profil utilisateur, avatar, XP | ✅ |
| `useQuestStore` | Quêtes actives, progression, récompenses | ✅ |
| `useQuranStore` | Marque-pages, dernière lecture, settings | ✅ |
| `useDhikrStore` | Compteurs de dhikrs, présets | ✅ |
| `useNotificationStore` | Préférences de notifications | ✅ |
| `useThemeStore` | Thème actif (dark/light) | ✅ |

### Exemple d'utilisation

```typescript
import usePrayerStore from '@/stores/usePrayerStore';

function PrayerComponent() {
  const { prayers, togglePrayer, resetDaily } = usePrayerStore();
  
  return (
    <View>
      {prayers.map(prayer => (
        <PrayerCard 
          key={prayer.name}
          prayer={prayer}
          onToggle={() => togglePrayer(prayer.name)}
        />
      ))}
    </View>
  );
}
```

---

## 🗄️ Services Backend

### Supabase

#### Base de données PostgreSQL

Tables principales :
- `profiles` : profils utilisateurs (avatar, XP, level, stats)
- `daily_logs` : historique quotidien des prières
- `quest_logs` : progression des quêtes
- `donations` : historique des dons

#### Authentification

- Connexion par **OTP email** (magic link)
- Session management avec refresh tokens
- Auto-refresh de session

#### Storage

- **Avatars personnalisés** : bucket `avatars/`
- Row-Level Security (RLS) activé

### RevenueCat

Configuration pour les achats in-app :
- 3 paliers de dons : Bronze, Silver, Gold
- Gestion multi-plateformes (iOS/Android)
- Webhooks pour sync avec Supabase

---

## 🔐 Sécurité

- ✅ Variables d'environnement pour les clés sensibles
- ✅ Row-Level Security (RLS) sur Supabase
- ✅ Validation des données côté serveur
- ✅ Authentification sécurisée (OTP)
- ✅ Pas de clés API exposées dans le code

---

## 🌍 Internationalisation

Support multilingue via `i18next` :
- 🇫🇷 Français (par défaut)
- 🇬🇧 Anglais
- 🇸🇦 Arabe (à venir)

Fichiers de traduction dans `lib/i18n/`.

---

## 📱 Compatibilité

| Platform | Minimum Version | Status |
|----------|----------------|---------|
| iOS | iOS 13.4+ | ✅ Supporté |
| Android | Android 6.0+ (API 23) | ✅ Supporté |
| Web | Navigateurs modernes | 🟡 Preview seulement |

---

## 🚀 Déploiement

### Build de production

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### Configuration EAS

Voir [eas.json](eas.json) pour les profils de build.

---

## 🤝 Contribution

Ce projet est actuellement privé. Pour toute question ou suggestion :
- Ouvrir une **Issue**
- Contacter le propriétaire du repository

---

## 📄 Licence

**Private** - Tous droits réservés.

---

## 🙏 Remerciements

- **Adhan.js** pour les calculs précis des horaires de prières
- **Supabase** pour le backend-as-a-service
- **Expo** pour le framework React Native
- **RevenueCat** pour la gestion des IAP
- La communauté open-source

---

<div align="center">

**Fait avec ❤️ pour la communauté musulmane**

[⬆ Retour en haut](#-adhanapp---application-de-prières-islamiques-avec-gamification)

</div>
