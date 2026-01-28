import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Vérification des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "⚠️ SUPABASE CONFIG ERROR:\n" +
      "Missing environment variables!\n" +
      `- EXPO_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗ MISSING"}\n` +
      `- EXPO_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✓" : "✗ MISSING"}\n\n` +
      "Please check your .env file and ensure these variables are set correctly.\n" +
      "Then restart the Expo server with: npx expo start --clear",
  );
}

// Storage adapter compatible avec web et mobile
const getStorageAdapter = () => {
  // Sur le web (SSR), utiliser un storage en mémoire temporaire
  if (Platform.OS === "web" && typeof window === "undefined") {
    // SSR: storage en mémoire
    const memoryStorage: Record<string, string> = {};
    return {
      getItem: (key: string) => Promise.resolve(memoryStorage[key] ?? null),
      setItem: (key: string, value: string) => {
        memoryStorage[key] = value;
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        delete memoryStorage[key];
        return Promise.resolve();
      },
    };
  }

  // Sur le web côté client, utiliser localStorage
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return {
      getItem: (key: string) =>
        Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key: string, value: string) => {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }

  // Sur mobile, utiliser AsyncStorage
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    storage: getStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
