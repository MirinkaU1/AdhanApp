import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

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

  // Actions
  login: (user: User) => void;
  logout: () => void;
  updateXp: (xp: number) => void;
  updateLevel: (level: number) => void;
  setLoading: (loading: boolean) => void;
  setSupporter: (isSupporter: boolean) => void;
  updateProfile: (data: {
    name?: string;
    avatar?: string;
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

      login: (user) =>
        set({
          user,
          isAuthenticated: true,
          isGuest: user.isGuest ?? !user.email,
        }),

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error("Logout error:", error);
        }
        set({ user: null, isAuthenticated: false, isGuest: false });
      },

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
      updateProfile: async (data) => {
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
              avatar: data.avatar ?? currentUser.avatar,
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
          // Lire le fichier et le convertir en blob
          const response = await fetch(imageUri);
          const blob = await response.blob();

          // Générer un nom de fichier unique
          const fileExt = imageUri.split(".").pop() || "jpg";
          const fileName = `${currentUser.id}/avatar.${fileExt}`;

          // Uploader vers Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, blob, {
              upsert: true,
              contentType: `image/${fileExt}`,
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            return { success: false, error: uploadError.message };
          }

          // Obtenir l'URL publique
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(fileName);

          // Mettre à jour le profil avec la nouvelle URL
          const updateResult = await get().updateProfile({ avatar: publicUrl });

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
            // Récupérer le profil
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single();

            console.log("[signInWithEmail] Profile fetched:", profile);
            if (profileError) {
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
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            console.log("[refreshSession] Profile fetched:", profile);
            if (profileError) {
              console.log(
                "[refreshSession] Profile error (may be normal if no profile yet):",
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
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
      }),
    },
  ),
);

export default useAuthStore;
