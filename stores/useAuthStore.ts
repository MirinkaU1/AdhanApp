import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
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
  }) => Promise<{ success: boolean; error?: string }>;

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
          // Mettre à jour dans Supabase
          const { error } = await supabase
            .from("profiles")
            .update({
              username: data.name,
              updated_at: new Date().toISOString(),
            })
            .eq("id", currentUser.id);

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          // Mettre à jour le state local
          set({
            user: {
              ...currentUser,
              name: data.name ?? currentUser.name,
            },
            isLoading: false,
          });

          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
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
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single();

            const user: User = {
              id: data.user.id,
              name:
                profile?.username || data.user.email?.split("@")[0] || "User",
              email: data.user.email || "",
              memberSince:
                data.user.created_at?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
              isGuest: false,
              xp: profile?.xp || 0,
              level: profile?.level || 1,
              isSupporter: profile?.is_supporter || false,
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
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            const isAnonymous =
              session.user.is_anonymous || !session.user.email;

            const user: User = {
              id: session.user.id,
              name:
                profile?.username ||
                (isAnonymous ? "Invité" : session.user.email?.split("@")[0]) ||
                "User",
              email: session.user.email || "",
              memberSince:
                session.user.created_at?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
              isGuest: isAnonymous,
              xp: profile?.xp || 0,
              level: profile?.level || 1,
              isSupporter: profile?.is_supporter || false,
            };

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
