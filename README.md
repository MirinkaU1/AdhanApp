# 🕌 AdhanApp - Application de Prières Islamiques

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-brightgreen.svg)
![Expo](https://img.shields.io/badge/Expo-~54.0-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

Application mobile moderne pour accompagner les musulmans dans leur pratique quotidienne.

[Fonctionnalités](#-fonctionnalités) • [Technologies](#-technologies) • [APIs Utilisées](#-apis-et-services)

</div>

---

## 🌟 Vue d'ensemble

**AdhanApp** est une application mobile cross-platform (iOS/Android) qui offre :

- 📿 Calcul automatique des horaires de prières
- 🎮 Système de gamification pour encourager la régularité
- 📖 Lecteur Coran avec traductions et audio
- 🧭 Boussole Qibla interactive
- 📊 Suivi des statistiques personnelles
- 🌍 Support multilingue

---

## ✨ Fonctionnalités

### 🕌 Prières

- Calcul automatique des 5 horaires de prières basé sur la géolocalisation
- Notifications intelligentes pour chaque prière
- Historique et statistiques de régularité
- Système de streaks pour suivre la constance
- Date Hijri avec ajustement manuel

### 🎮 Gamification

- Système d'XP et de niveaux
- Quêtes journalières variées
- Récompenses et badges
- Avatars personnalisables

### 📖 Coran

- Texte arabe complet avec traductions
- Récitations audio de différents récitants
- Système de marque-pages
- Navigation par sourates, juz et pages

### 🧭 Autres

- Boussole Qibla 3D interactive
- Compteur de dhikrs
- Mode sombre/clair
- Synchronisation cloud
- Mode hors ligne

---

## 🛠 Technologies

### Framework

- **React Native** `0.81.5` - Framework mobile cross-platform
- **Expo** `~54.0` - Plateforme de développement et déploiement
- **TypeScript** `5.9.2` - Typage statique
- **Expo Router** - Navigation file-based

### UI/UX

- **NativeWind** - Tailwind CSS pour React Native
- **React Native Reanimated** - Animations fluides
- **Lucide React Native** - Bibliothèque d'icônes
- **React Three Fiber** - Rendu 3D (Qibla compass)

### State Management

- **Zustand** - Gestion d'état global
- **AsyncStorage** - Persistance locale

### Internationalisation

- **i18next** - Support multilingue
- **react-i18next** - Intégration React

---

## 🔌 APIs et Services

### Services Backend

- **Supabase** - Backend-as-a-Service
  - Authentification (OTP email)
  - Base de données PostgreSQL
  - Storage (avatars)
  - Real-time subscriptions

### APIs Externes

- **Adhan.js** `4.4.3` - Calcul précis des horaires de prières islamiques
- **Expo Location** - Géolocalisation et reverse geocoding
- **RevenueCat** - Gestion des achats in-app (dons)

### Notifications

- **Expo Notifications** - Notifications locales et push
- **Expo Background Fetch** - Tâches en arrière-plan
- **Expo Task Manager** - Gestion des tâches asynchrones

---

## 📱 Compatibilité

| Platform | Version minimale |
| -------- | ---------------- |
| iOS      | 13.4+            |
| Android  | 6.0+ (API 23)    |

---

## 🔐 Sécurité

- Variables d'environnement pour les clés sensibles
- Row-Level Security (RLS) sur Supabase
- Authentification sécurisée par OTP
- Pas de clés API exposées dans le code

---

## 📄 Licence

**Private** - Tous droits réservés.

---

## 🙏 Remerciements

- **Adhan.js** pour les calculs des horaires de prières
- **Supabase** pour le backend-as-a-service
- **Expo** pour le framework React Native
- **RevenueCat** pour la gestion des IAP

---

<div align="center">

**Fait avec ❤️ pour la communauté musulmane**

[⬆ Retour en haut](#-adhanapp---application-de-prières-islamiques)

</div>
