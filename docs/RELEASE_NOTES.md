# 🚀 Release v0.1.0 - Première version beta

## 📅 Date de sortie

13 février 2026

## 🎯 Vue d'ensemble

Première version beta d'AdhanApp, une application mobile de prières islamiques avec système de gamification.

---

## ✨ Fonctionnalités principales

### 🕌 Système de prières

- ✅ Calcul automatique des 5 horaires de prières basé sur la position GPS
- ✅ Support de plusieurs méthodes de calcul (Muslim World League, ISNA, Egyptian, etc.)
- ✅ Affichage de la ville via géolocalisation
- ✅ Compte à rebours en temps réel jusqu'à la prochaine prière
- ✅ Toggle pour marquer les prières accomplies
- ✅ Reset automatique quotidien à minuit
- ✅ Date Hijri avec possibilité d'ajustement manuel

### 🔔 Notifications

- ✅ Notifications locales pour chaque prière
- ✅ Configuration individuelle par prière (activé/désactivé)
- ✅ Planification automatique des notifications
- ✅ Gestion des permissions iOS et Android

### 📊 Historique et statistiques

- ✅ Calendrier mensuel avec indicateurs de prières accomplies
- ✅ Vue hebdomadaire (7 derniers jours)
- ✅ Calcul des streaks (séries de jours consécutifs)
- ✅ Pourcentages de régularité par prière
- ✅ Synchronisation cloud via Supabase

### 🎮 Système de gamification

- ✅ Système d'XP et de niveaux (1-100)
- ✅ Quêtes journalières variées :
  - Accomplir des prières spécifiques
  - Lire le Coran (ayahs/pages)
  - Faire des dhikrs
  - Utiliser la boussole Qibla
  - Soutenir le projet
- ✅ Récompenses XP pour chaque quête
- ✅ Toast animé à chaque gain d'XP
- ✅ Animation de level up avec confettis
- ✅ Reset automatique des quêtes à minuit

### 📖 Lecteur Coran

- ✅ Texte arabe complet du Coran
- ✅ Traductions multilingues (français, anglais)
- ✅ Récitations audio de différents récitants
- ✅ Navigation par sourates, juz et pages
- ✅ Système de marque-pages
- ✅ Lecture automatique continue
- ✅ Sauvegarde de la position de lecture

### 🧭 Boussole Qibla

- ✅ Boussole 3D interactive avec rendu Three.js
- ✅ Calcul précis de la direction de la Mecque
- ✅ Utilisation des capteurs du téléphone (magnétomètre)
- ✅ Interface visuelle intuitive
- ✅ Indication de la distance jusqu'à la Mecque

### 📿 Compteur de dhikrs

- ✅ Compteur avec haptic feedback
- ✅ Dhikrs prédéfinis (Subhanallah, Alhamdulillah, etc.)
- ✅ Historique des dhikrs
- ✅ Possibilité de réinitialiser le compteur
- ✅ Sauvegarde automatique

### 🔐 Authentification et profil

- ✅ Connexion par OTP email (magic link)
- ✅ Gestion de profil utilisateur
- ✅ Avatars prédéfinis (6 choix)
- ✅ Upload d'avatar personnalisé via Supabase Storage
- ✅ Affichage du niveau et de l'XP
- ✅ Statistiques personnelles

### 💰 Système de dons

- ✅ 3 paliers de dons (Bronze, Silver, Gold)
- ✅ Intégration RevenueCat pour les achats in-app
- ✅ Animation de confettis après achat
- ✅ Badge "supporter" dans le profil
- ✅ Synchronisation avec Supabase

### 🎨 Interface et UX

- ✅ Design moderne avec NativeWind (Tailwind CSS)
- ✅ Mode sombre et clair automatique
- ✅ Animations fluides avec Reanimated
- ✅ Icônes Lucide cohérentes
- ✅ Dégradés et effets de blur
- ✅ Interface responsive
- ✅ Haptic feedback sur les interactions

### 🌍 Internationalisation

- ✅ Support multilingue (i18next)
- ✅ Français (par défaut)
- ✅ Anglais
- ✅ Détection automatique de la langue système

### 🔄 Synchronisation et offline

- ✅ Mode offline-first
- ✅ Synchronisation automatique avec Supabase
- ✅ Détection de la connexion réseau
- ✅ Queue de synchronisation pour les actions hors ligne
- ✅ Persistance locale avec AsyncStorage

---

## 🛠 Technologies utilisées

- **React Native** 0.81.5
- **Expo SDK** 54.0
- **TypeScript** 5.9.2
- **Zustand** (state management)
- **Supabase** (backend, auth, storage)
- **RevenueCat** (IAP)
- **Adhan.js** (calcul des prières)
- **React Three Fiber** (rendu 3D)
- **NativeWind** (styling)

---

## 📱 Compatibilité

- ✅ iOS 13.4+
- ✅ Android 6.0+ (API 23)

---

## 🐛 Problèmes connus

- La synchronisation peut prendre quelques secondes à la première connexion
- Les notifications peuvent nécessiter un redémarrage de l'app après activation

---

## 🔜 Prochaines étapes (v0.2.0)

- [ ] Ajout de widgets iOS/Android
- [ ] Support de l'arabe (interface)
- [ ] Amélioration des statistiques avec graphiques
- [ ] Ajout de rappels personnalisés
- [ ] Export des données personnelles
- [ ] Mode Ramadan avec fonctionnalités spécifiques

---

## 🙏 Remerciements

Merci à tous les testeurs beta pour leur patience et leurs retours précieux !

---

**Fait avec ❤️ pour la communauté musulmane**
