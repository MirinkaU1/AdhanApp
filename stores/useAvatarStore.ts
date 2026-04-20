import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FREE_AVATAR_IDS } from "@/lib/avatarService";
import useCoinsStore from "@/stores/useCoinsStore";

interface AvatarState {
  unlockedAvatarIds: string[];
  isAvatarUnlocked: (id: string) => boolean;
  unlockAvatar: (id: string) => void;
  purchaseAvatar: (id: string, price: number) => boolean;
  clearAllData: () => void;
}

const useAvatarStore = create<AvatarState>()(
  persist(
    (set, get) => ({
      unlockedAvatarIds: [...FREE_AVATAR_IDS],

      isAvatarUnlocked: (id) => get().unlockedAvatarIds.includes(id),

      unlockAvatar: (id) => {
        if (!get().unlockedAvatarIds.includes(id)) {
          set((state) => ({
            unlockedAvatarIds: [...state.unlockedAvatarIds, id],
          }));
        }
      },

      purchaseAvatar: (id, price) => {
        if (get().isAvatarUnlocked(id)) return false;

        const spent = useCoinsStore.getState().spendCoins(price);
        if (!spent) return false;

        set((state) => ({
          unlockedAvatarIds: Array.from(
            new Set([...state.unlockedAvatarIds, id]),
          ),
        }));
        return true;
      },

      clearAllData: () =>
        set({ unlockedAvatarIds: [...FREE_AVATAR_IDS] }),
    }),
    {
      name: "avatar-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // S'assurer que les avatars gratuits sont toujours débloqués
        if (state) {
          const missing = FREE_AVATAR_IDS.filter(
            (id) => !state.unlockedAvatarIds.includes(id),
          );
          if (missing.length > 0) {
            missing.forEach((id) => state.unlockAvatar(id));
          }
        }
      },
    },
  ),
);

export default useAvatarStore;
