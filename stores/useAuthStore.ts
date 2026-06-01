import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode as atob } from "base-64";
import useQuestStore from "@/stores/useQuestStore";
import usePrayerStore from "@/stores/usePrayerStore";
import { loginRevenueCat, logoutRevenueCat } from "@/lib/revenuecat";

// Convertir YYYY-MM-DD (Supabase) vers JJ-MM-AAAA (affichage)
const formatBirthDateFromDB = (
  date: string | null | undefined,
): string | undefined => {
  if (!date) return undefined;
  const parts = date.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return date;
};

export type UserRole = "user" | "tester" | "dev";
export type UserGender = "male" | "female" | "not_specified";
const VALID_GENDERS: UserGender[] = ["male", "female", "not_specified"];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string; // Legacy - compatibilité
  avatar_id?: string; // ID de l'avatar prédéfini (01-06)
  avatar_url?: string; // URL custom depuis Supabase Storage
  birthDate?: string; // Format: JJ-MM-AAAA (affichage)
  birthDateLocked?: boolean;
  gender?: UserGender;
  genderLocked?: boolean;
  memberSince: string;
  isGuest?: boolean;
  xp?: number;
  level?: number;
  isSupporter?: boolean;
  // Stats de suivi
  totalXpEarned?: number;
  streakCurrent?: number;
  streakBest?: number;
  totalPrayers?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  hasHydrated: boolean;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
  updateXp: (xp: number) => void;
  updateLevel: (level: number) => void;
  setLoading: (loading: boolean) => void;
  setSupporter: (isSupporter: boolean) => void;
  setAvatarLocal: (data: {
    avatar_id?: string | null;
    avatar_url?: string | null;
  }) => void;
  updateProfile: (data: {
    name?: string;
    avatar?: string | null;
    avatar_id?: string | null;
    avatar_url?: string | null;
    birthDate?: string;
    gender?: UserGender;
  }) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (
    imageUri: string,
  ) => Promise<{ success: boolean; url?: string; error?: string }>;

  // Supabase Auth Actions
  signInAnonymously: () => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ success: boolean; error?: string }>;
  linkIdentity: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      hasHydrated: false,

      login: (user) => {
        console.log("[AuthStore] login() called with user:", user.name);
        set({
          user,
          isAuthenticated: true,
          isGuest: user.isGuest ?? !user.email,
        });
      },

      logout: async () => {
        console.log("[AuthStore] logout() called");
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error("Logout error:", error);
        }

        // Désassocier l'utilisateur RevenueCat
        await logoutRevenueCat();

        // Nettoyer les données des autres stores
        const { clearAllData: clearQuestData } =
          await import("@/stores/useQuestStore").then((m) =>
            m.default.getState(),
          );
        const { clearAllData: clearPrayerData } =
          await import("@/stores/usePrayerStore").then((m) =>
            m.default.getState(),
          );
        const { clearAllData: clearCoinsData } =
          await import("@/stores/useCoinsStore").then((m) =>
            m.default.getState(),
          );
        const { clearAllData: clearThemeData } =
          await import("@/stores/useThemeStore").then((m) =>
            m.default.getState(),
          );
        const { clearAllData: clearQuizData } =
          await import("@/stores/useQuizStore").then((m) =>
            m.default.getState(),
          );
        const { clearAllData: clearAvatarData } =
          await import("@/stores/useAvatarStore").then((m) =>
            m.default.getState(),
          );
        const { clearAllData: clearQuranData } =
          await import("@/stores/useQuranStore").then((m) =>
            m.useQuranStore.getState(),
          );
        const { clearAllData: clearRamadanData } =
          await import("@/stores/useRamadanStore").then((m) =>
            m.useRamadanStore.getState(),
          );

        clearQuestData();
        clearPrayerData();
        clearCoinsData();
        clearThemeData();
        clearQuizData();
        clearAvatarData();
        clearQuranData();
        clearRamadanData();

        get().clearAuth();
        console.log("[AuthStore] All user data cleared");
      },

      clearAuth: () => {
        set({ user: null, isAuthenticated: false, isGuest: false });
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),

      updateXp: (xp) =>
        set((state) => ({
          user: state.user ? { ...state.user, xp } : null,
        })),

      updateLevel: (level) =>
        set((state) => ({
          user: state.user ? { ...state.user, level } : null,
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setSupporter: (isSupporter) =>
        set((state) => ({
          user: state.user ? { ...state.user, isSupporter } : null,
        })),

      setAvatarLocal: ({ avatar_id, avatar_url }) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                avatar_id:
                  avatar_id === undefined
                    ? state.user.avatar_id
                    : avatar_id === null
                      ? undefined
                      : avatar_id,
                avatar_url:
                  avatar_url === undefined
                    ? state.user.avatar_url
                    : avatar_url === null
                      ? undefined
                      : avatar_url,
                // Legacy support
                avatar:
                  avatar_url === undefined
                    ? state.user.avatar
                    : avatar_url === null
                      ? undefined
                      : avatar_url,
              }
            : null,
        })),

      // Mettre à jour le profil
      updateProfile: async (data: {
        name?: string;
        avatar?: string | null; // Legacy - compatibilité
        avatar_id?: string | null; // ID de l'avatar prédéfini
        avatar_url?: string | null; // URL custom depuis Supabase Storage
        birthDate?: string;
        gender?: UserGender;
      }) => {
        const currentUser = get().user;
        if (!currentUser) {
          return { success: false, error: "No user logged in" };
        }

        set({ isLoading: true });
        try {
          // Construire l'objet de mise à jour
          const updateData: Record<string, any> = {
            id: currentUser.id, // Requis pour upsert
            updated_at: new Date().toISOString(),
          };

          if (data.name !== undefined) {
            updateData.username = data.name;
          }

          // Gestion hybride des avatars
          if (data.avatar_id !== undefined) {
            // Avatar prédéfini sélectionné
            updateData.avatar_id = data.avatar_id;
            updateData.avatar_url = null; // Supprimer l'URL custom
          } else if (data.avatar_url !== undefined) {
            // Avatar custom uploadé
            updateData.avatar_url = data.avatar_url;
            updateData.avatar_id = null; // Supprimer l'ID prédéfini
          } else if (data.avatar !== undefined) {
            // Legacy support - traiter comme avatar_url
            updateData.avatar_url = data.avatar;
            updateData.avatar_id = null;
          }

          if (data.birthDate !== undefined) {
            // Convertir JJ-MM-AAAA vers YYYY-MM-DD pour Supabase
            const parts = data.birthDate.split("-");
            console.log(
              "[updateProfile] birthDate input:",
              data.birthDate,
              "parts:",
              parts,
            );
            if (parts.length === 3 && parts[0].length === 2) {
              // Format JJ-MM-AAAA → YYYY-MM-DD
              updateData.birth_date = `${parts[2]}-${parts[1]}-${parts[0]}`;
              console.log(
                "[updateProfile] Converted to:",
                updateData.birth_date,
              );
            } else {
              // Déjà au bon format ou format invalide
              updateData.birth_date = data.birthDate;
              console.log(
                "[updateProfile] Keeping as-is:",
                updateData.birth_date,
              );
            }
          }

          if (data.gender !== undefined) {
            if (!VALID_GENDERS.includes(data.gender)) {
              set({ isLoading: false });
              return { success: false, error: "Genre invalide" };
            }

            if (
              currentUser.genderLocked &&
              currentUser.gender !== undefined &&
              data.gender !== currentUser.gender
            ) {
              set({ isLoading: false });
              return {
                success: false,
                error: "Le genre ne peut être modifié qu'une seule fois",
              };
            }

            if (data.gender !== currentUser.gender) {
              updateData.gender = data.gender;
              updateData.gender_locked =
                data.gender === "male" || data.gender === "female";
            }
          }

          console.log("[updateProfile] Updating with data:", updateData);

          // Utiliser upsert pour créer le profil s'il n'existe pas
          const { data: updatedProfile, error } = await supabase
            .from("profiles")
            .upsert(updateData, { onConflict: "id" })
            .select()
            .single();

          if (error) {
            console.error("[updateProfile] Error:", error);
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          console.log("[updateProfile] Success:", updatedProfile);

          // Mettre à jour le state local
          set({
            user: {
              ...currentUser,
              name: data.name ?? currentUser.name,
              avatar_id:
                data.avatar_id !== undefined
                  ? data.avatar_id === null
                    ? undefined
                    : data.avatar_id
                  : currentUser.avatar_id,
              avatar_url:
                data.avatar_url !== undefined
                  ? data.avatar_url === null
                    ? undefined
                    : data.avatar_url
                  : currentUser.avatar_url,
              // Legacy support
              avatar:
                data.avatar !== undefined
                  ? data.avatar === null
                    ? undefined
                    : data.avatar
                  : currentUser.avatar,
              birthDate: data.birthDate ?? currentUser.birthDate,
              gender: data.gender ?? currentUser.gender,
              genderLocked:
                data.gender !== undefined && data.gender !== currentUser.gender
                  ? data.gender === "male" || data.gender === "female"
                  : currentUser.genderLocked,
            },
            isLoading: false,
          });

          return { success: true };
        } catch (error: any) {
          console.error("[updateProfile] Exception:", error);
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Uploader un avatar vers Supabase Storage
      uploadAvatar: async (imageUri) => {
        const currentUser = get().user;
        if (!currentUser) {
          return { success: false, error: "No user logged in" };
        }

        try {
          console.log("🚀 [Upload] Starting upload for URI:", imageUri);

          // 🔍 DÉBOGAGE: Vérifier la session Supabase
          const {
            data: { session },
          } = await supabase.auth.getSession();
          console.log("🔍 [Upload Debug] Current session:", {
            userId: session?.user?.id,
            email: session?.user?.email,
            hasSession: !!session,
          });

          let uploadBody: Blob | Uint8Array;
          let fileExt = "jpg";

          // Déterminer le type de fichier
          const uriMatch = imageUri.match(/\.(png|jpg|jpeg|webp)$/i);
          if (uriMatch) {
            fileExt = uriMatch[1].toLowerCase();
          }

          console.log("📝 [Upload] File extension detected:", fileExt);

          // Gérer les différents formats d'URI
          const isFileUri = imageUri.startsWith("file://");
          const isHttpUri =
            imageUri.startsWith("http://") || imageUri.startsWith("https://");
          const isAssetUri = imageUri.startsWith("asset://");
          const isContentUri = imageUri.startsWith("content://");
          // Les URIs sans protocole des assets en mode production (ex: assets_images_avatars_02)
          const isAssetPath =
            !isFileUri &&
            !isHttpUri &&
            !isAssetUri &&
            !isContentUri &&
            imageUri.includes("assets");
          const isAbsolutePath =
            !isFileUri &&
            !isHttpUri &&
            !isAssetUri &&
            !isContentUri &&
            !isAssetPath &&
            (imageUri.startsWith("/") || /^[A-Za-z]:/.test(imageUri));

          if (
            isFileUri ||
            isAssetUri ||
            isAbsolutePath ||
            isContentUri ||
            isAssetPath
          ) {
            console.log("📁 [Upload] Processing local file...");
            try {
              // Normaliser l'URI pour FileSystem
              let normalizedUri = imageUri;
              if (isAssetUri) {
                // Convertir asset:// en file://
                normalizedUri = imageUri.replace("asset://", "file://");
              } else if (isAssetPath) {
                // URIs sans protocole - essayer comme chemin direct
                console.log(
                  "🔍 [Upload] Asset path detected (no protocol), trying to access directly",
                );
                normalizedUri = imageUri;
              } else if (isAbsolutePath && !imageUri.startsWith("file://")) {
                // Ajouter le préfixe file:// si nécessaire
                normalizedUri = `file://${imageUri}`;
              } else if (isContentUri) {
                // Les content:// URIs Android peuvent être utilisés directement
                normalizedUri = imageUri;
              }

              console.log("🔄 [Upload] Normalized URI:", normalizedUri);

              const base64 = await FileSystem.readAsStringAsync(normalizedUri, {
                encoding: "base64",
              });
              console.log("📦 [Upload] Base64 length:", base64.length);

              const binaryString = atob(base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i += 1) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              uploadBody = bytes;
              console.log(
                "✅ [Upload] Local file converted to bytes:",
                bytes.length,
              );
            } catch (fsError: any) {
              console.error("❌ [Upload] FileSystem error:", fsError);
              return {
                success: false,
                error: `Erreur de lecture du fichier: ${fsError.message}`,
              };
            }
          } else if (
            imageUri.startsWith("http://") ||
            imageUri.startsWith("https://")
          ) {
            console.log("🌐 [Upload] Processing remote file...");
            try {
              // Lire le fichier distant et le convertir en blob
              const response = await fetch(imageUri, {
                method: "GET",
                headers: {
                  Accept: "image/*",
                },
              });

              if (!response.ok) {
                throw new Error(
                  `HTTP ${response.status}: ${response.statusText}`,
                );
              }

              const blob = await response.blob();
              uploadBody = blob;
              console.log(
                "✅ [Upload] Remote file fetched:",
                blob.size,
                "bytes",
              );
            } catch (fetchError: any) {
              console.error("❌ [Upload] Fetch error:", fetchError);
              return {
                success: false,
                error: `Erreur de téléchargement: ${fetchError.message}`,
              };
            }
          } else {
            console.error("❌ [Upload] Unsupported URI format:", imageUri);
            console.error("❌ [Upload] URI details:", {
              startsWithFile: imageUri.startsWith("file://"),
              startsWithHttp:
                imageUri.startsWith("http://") ||
                imageUri.startsWith("https://"),
              startsWithAsset: imageUri.startsWith("asset://"),
              firstChars: imageUri.substring(0, 20),
            });
            return {
              success: false,
              error: `Format d'URI non supporté: ${imageUri.substring(0, 50)}...`,
            };
          }

          // Générer un nom de fichier unique
          const fileName = `${currentUser.id}/avatar.${fileExt}`;

          // 🔍 DÉBOGAGE: Afficher les détails de l'upload
          console.log("🔍 [Upload Debug] Upload details:", {
            bucket: "avatars",
            fileName: fileName,
            userId: currentUser.id,
            fileExtension: fileExt,
            contentType: `image/${fileExt}`,
            bodyType: uploadBody instanceof Uint8Array ? "Uint8Array" : "Blob",
            bodySize:
              uploadBody instanceof Uint8Array ? uploadBody.length : "unknown",
          });

          // Supprimer l'ancien fichier s'il existe (évite UPDATE policy)
          console.log("🔍 [Upload Debug] Deleting old avatar if exists...");
          const { error: deleteError } = await supabase.storage
            .from("avatars")
            .remove([fileName]);

          if (deleteError) {
            console.log(
              "ℹ️ [Upload Debug] Delete returned error (normal if file doesn't exist):",
              deleteError.message,
            );
          } else {
            console.log("✅ [Upload Debug] Old file deleted or didn't exist");
          }

          // Uploader vers Supabase Storage (INSERT seulement, pas UPDATE)
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, uploadBody, {
              upsert: false, // Force INSERT uniquement
              contentType: `image/${fileExt}`,
            });

          if (uploadError) {
            console.error("❌ [Upload Error] Full error:", uploadError);
            console.error("❌ [Upload Error] Error details:", {
              message: uploadError.message,
              name: uploadError.name,
              statusCode: (uploadError as any).statusCode,
            });
            return { success: false, error: uploadError.message };
          }

          // Obtenir l'URL publique avec cache buster
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(fileName);

          // Ajouter un timestamp pour casser le cache
          const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
          console.log(
            "✅ [Upload Debug] Avatar uploaded successfully:",
            cacheBustedUrl,
          );

          // Mettre à jour le profil avec la nouvelle URL
          const updateResult = await get().updateProfile({
            avatar: cacheBustedUrl,
          });

          if (!updateResult.success) {
            return { success: false, error: updateResult.error };
          }

          return { success: true, url: publicUrl };
        } catch (error: any) {
          console.error("Upload avatar error:", error);
          return { success: false, error: error.message };
        }
      },

      // Connexion anonyme (Guest)
      signInAnonymously: async () => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInAnonymously();

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Créer le profil dans la table profiles
            const { error: profileError } = await supabase
              .from("profiles")
              .upsert(
                {
                  id: data.user.id,
                  username: null,
                  is_anonymous: true,
                  xp: 0,
                  level: 1,
                  is_supporter: false,
                  created_at: new Date().toISOString(),
                },
                { onConflict: "id" },
              );

            if (profileError) {
              console.warn("Profile creation warning:", profileError);
            }

            const user: User = {
              id: data.user.id,
              name: "Invité",
              email: "",
              role: "user",
              memberSince: new Date().toISOString().split("T")[0],
              isGuest: true,
              xp: 0,
              level: 1,
              isSupporter: false,
            };

            set({
              user,
              isAuthenticated: true,
              isGuest: true,
              isLoading: false,
            });

            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: "No user returned" };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Connexion avec email/mot de passe
      signInWithEmail: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Récupérer le profil (sans tenter d'insert si absent)
            let { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single();

            console.log("[signInWithEmail] Profile fetched:", profile);

            if (profileError?.code === "PGRST116") {
              // Profil absent : on n'insère pas côté client (RLS)
              console.log(
                "[signInWithEmail] Profile missing; skipping insert due to RLS.",
              );
            } else if (profile?.is_anonymous) {
              // Profil existant mais anonyme : mise à jour uniquement
              console.log("[signInWithEmail] Updating anonymous profile...");
              const profileUpdate = {
                username: data.user.email?.split("@")[0] || "User",
                email: data.user.email,
                is_anonymous: false,
                auth_provider: "email",
                updated_at: new Date().toISOString(),
              };

              const { data: updatedProfile, error: updateError } =
                await supabase
                  .from("profiles")
                  .update(profileUpdate)
                  .eq("id", data.user.id)
                  .select()
                  .single();

              if (!updateError) {
                profile = updatedProfile;
                console.log("[signInWithEmail] Profile updated:", profile);
              } else {
                console.error(
                  "[signInWithEmail] Failed to update profile:",
                  updateError,
                );
              }
            } else if (profileError) {
              console.log("[signInWithEmail] Profile error:", profileError);
            }

            const user: User = {
              id: data.user.id,
              name:
                profile?.username || data.user.email?.split("@")[0] || "User",
              email: data.user.email || "",
              role: (profile?.role as UserRole) || "user",
              avatar: profile?.avatar_url || undefined, // Legacy
              avatar_id: profile?.avatar_id || undefined,
              avatar_url: profile?.avatar_url || undefined,
              birthDate: formatBirthDateFromDB(profile?.birth_date),
              gender:
                (profile?.gender as UserGender | null | undefined) || undefined,
              genderLocked: profile?.gender_locked ?? false,
              memberSince:
                data.user.created_at?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
              isGuest: false,
              xp: profile?.xp || 0,
              level: profile?.level || 1,
              isSupporter: profile?.is_supporter || false,
              // Stats de suivi
              totalXpEarned: profile?.total_xp_earned || 0,
              streakCurrent: profile?.streak_current || 0,
              streakBest: profile?.streak_best || 0,
              totalPrayers: profile?.total_prayers || 0,
            };

            console.log("[signInWithEmail] User constructed:", user);

            // Synchroniser XP/Level/TotalXpEarned avec useQuestStore (prend le max pour ne pas perdre de données)
            useQuestStore
              .getState()
              .syncFromServer(
                user.xp || 0,
                user.level || 1,
                user.totalXpEarned || 0,
              );

            // IMPORTANT: Charger les prières depuis Supabase pour restaurer l'état
            // Cela doit être fait AVANT de set isAuthenticated pour éviter les race conditions
            await usePrayerStore.getState().fetchFromSupabase(user.id);

            // Reconstruire le tracking XP avec les logs du jour pour éviter les doublons
            const todayKey = new Date().toISOString().split("T")[0];
            const todayLogs = usePrayerStore.getState().logs[todayKey];
            if (todayLogs) {
              useQuestStore
                .getState()
                .rebuildDailyXpTrackingFromLogs(todayLogs);
              console.log(
                "[signInWithEmail] Rebuilt XP tracking from today's logs",
              );
            }

            set({
              user,
              isAuthenticated: true,
              isGuest: false,
              isLoading: false,
            });

            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: "No user returned" };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Inscription avec email/mot de passe
      signUpWithEmail: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Créer le profil
            await supabase.from("profiles").upsert(
              {
                id: data.user.id,
                username: name,
                is_anonymous: false,
                xp: 0,
                level: 1,
                is_supporter: false,
                created_at: new Date().toISOString(),
              },
              { onConflict: "id" },
            );

            const user: User = {
              id: data.user.id,
              name,
              email: data.user.email || email,
              role: "user",
              memberSince: new Date().toISOString().split("T")[0],
              isGuest: false,
              xp: 0,
              level: 1,
              isSupporter: false,
            };

            set({
              user,
              isAuthenticated: true,
              isGuest: false,
              isLoading: false,
            });

            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: "No user returned" };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Lier un compte invité à un email (Convert Guest to User)
      linkIdentity: async (email, password) => {
        set({ isLoading: true });
        const currentUser = get().user;

        if (!currentUser?.isGuest) {
          set({ isLoading: false });
          return { success: false, error: "Only guest accounts can be linked" };
        }

        try {
          // Mettre à jour le user avec email et password
          const { data, error } = await supabase.auth.updateUser({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Mettre à jour le profil - l'utilisateur n'est plus anonyme
            const { error: profileError } = await supabase
              .from("profiles")
              .update({
                email: email,
                is_anonymous: false,
                auth_provider: "email",
                updated_at: new Date().toISOString(),
              })
              .eq("id", data.user.id);

            if (profileError) {
              console.error(
                "[linkIdentity] Profile update error:",
                profileError,
              );
            } else {
              console.log(
                "[linkIdentity] Profile updated successfully - user is no longer anonymous",
              );
            }

            // Conserver XP, level et autres données
            const updatedUser: User = {
              ...currentUser,
              email: data.user.email || email,
              isGuest: false,
            };

            set({
              user: updatedUser,
              isGuest: false,
              isLoading: false,
            });

            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: "Failed to link account" };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Changer le mot de passe (pour utilisateurs connectés non-invités)
      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true });
        const currentUser = get().user;

        if (!currentUser || currentUser.isGuest) {
          set({ isLoading: false });
          return {
            success: false,
            error: "User not authenticated or is guest",
          };
        }

        try {
          // Vérifier le mot de passe actuel en tentant une ré-authentification
          const { error: authError } = await supabase.auth.signInWithPassword({
            email: currentUser.email,
            password: currentPassword,
          });

          if (authError) {
            set({ isLoading: false });
            return {
              success: false,
              error: "INVALID_CURRENT_PASSWORD",
            };
          }

          // Mot de passe actuel vérifié, on peut maintenant le changer
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          set({ isLoading: false });
          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Rafraîchir la session au démarrage
      refreshSession: async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            // Lier l'utilisateur RevenueCat dès qu'on retrouve une session
            // (cas de l'app rouverte avec session persistée)
            loginRevenueCat(session.user.id);

            let { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            console.log("[refreshSession] Profile fetched:", profile);

            // Ne pas essayer de créer/mettre à jour le profil dans refreshSession
            // Le profil sera créé/mis à jour lors du login
            if (profileError && profileError.code !== "PGRST116") {
              console.log(
                "[refreshSession] Profile error:",
                profileError.message,
              );
            }

            const isAnonymous =
              session.user.is_anonymous || !session.user.email;

            const user: User = {
              id: session.user.id,
              name:
                profile?.username ||
                (isAnonymous ? "Invité" : session.user.email?.split("@")[0]) ||
                "User",
              email: session.user.email || "",
              avatar: profile?.avatar_url || undefined, // Legacy
              avatar_id: profile?.avatar_id || undefined,
              avatar_url: profile?.avatar_url || undefined,
              birthDate: formatBirthDateFromDB(profile?.birth_date),
              gender:
                (profile?.gender as UserGender | null | undefined) || undefined,
              genderLocked: profile?.gender_locked ?? false,
              memberSince:
                session.user.created_at?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
              isGuest: isAnonymous,
              xp: profile?.xp || 0,
              level: profile?.level || 1,
              isSupporter: profile?.is_supporter || false,
              role: (profile?.role as UserRole) || "user",
              // Stats de suivi
              totalXpEarned: profile?.total_xp_earned || 0,
              streakCurrent: profile?.streak_current || 0,
              streakBest: profile?.streak_best || 0,
              totalPrayers: profile?.total_prayers || 0,
            };

            console.log(
              "[refreshSession] User constructed:",
              user.name,
              "- avatar:",
              user.avatar,
              "- birthDate:",
              user.birthDate,
            );

            // Synchroniser XP/Level/TotalXpEarned avec useQuestStore (prend le max pour ne pas perdre de données)
            useQuestStore
              .getState()
              .syncFromServer(
                user.xp || 0,
                user.level || 1,
                user.totalXpEarned || 0,
              );

            set({
              user,
              isAuthenticated: true,
              isGuest: isAnonymous,
            });
          }
        } catch (error) {
          console.error("Session refresh error:", error);
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as AuthState;
        return {
          ...currentState,
          ...persisted,
          user: currentState.user ?? persisted.user,
          isAuthenticated:
            currentState.isAuthenticated || persisted.isAuthenticated,
          isGuest: currentState.isAuthenticated
            ? currentState.isGuest
            : persisted.isGuest,
        };
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
      }),
    },
  ),
);

export default useAuthStore;
