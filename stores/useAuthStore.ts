import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode as atob } from "base-64";

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

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  birthDate?: string; // Format: JJ-MM-AAAA (affichage)
  memberSince: string;
  isGuest?: boolean;
  xp?: number;
  level?: number;
  isSupporter?: boolean;
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
  updateProfile: (data: {
    name?: string;
    avatar?: string | null;
    birthDate?: string;
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
        console.trace("[AuthStore] Logout stack trace");
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error("Logout error:", error);
        }
        get().clearAuth();
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

      // Mettre à jour le profil
      updateProfile: async (data: {
        name?: string;
        avatar?: string | null;
        birthDate?: string;
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
          if (data.avatar !== undefined) {
            updateData.avatar_url = data.avatar;
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
              avatar:
                data.avatar === null
                  ? undefined
                  : (data.avatar ?? currentUser.avatar),
              birthDate: data.birthDate ?? currentUser.birthDate,
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

          if (imageUri.startsWith("file://")) {
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
              encoding: "base64",
            });
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i += 1) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            uploadBody = bytes;
          } else {
            // Lire le fichier distant et le convertir en blob
            const response = await fetch(imageUri);
            const blob = await response.blob();
            uploadBody = blob;
          }

          // Générer un nom de fichier unique
          const fileExt = imageUri.split(".").pop() || "jpg";
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
              avatar: profile?.avatar_url || undefined,
              birthDate: formatBirthDateFromDB(profile?.birth_date),
              memberSince:
                data.user.created_at?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
              isGuest: false,
              xp: profile?.xp || 0,
              level: profile?.level || 1,
              isSupporter: profile?.is_supporter || false,
            };

            console.log("[signInWithEmail] User constructed:", user);

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
            await supabase
              .from("profiles")
              .update({
                is_anonymous: false,
                updated_at: new Date().toISOString(),
              })
              .eq("id", data.user.id);

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

      // Rafraîchir la session au démarrage
      refreshSession: async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
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
              avatar: profile?.avatar_url || undefined,
              birthDate: formatBirthDateFromDB(profile?.birth_date),
              memberSince:
                session.user.created_at?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
              isGuest: isAnonymous,
              xp: profile?.xp || 0,
              level: profile?.level || 1,
              isSupporter: profile?.is_supporter || false,
            };

            console.log(
              "[refreshSession] User constructed:",
              user.name,
              "- avatar:",
              user.avatar,
              "- birthDate:",
              user.birthDate,
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
