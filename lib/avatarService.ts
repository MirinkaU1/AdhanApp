import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode as atob } from "base-64";

/**
 * Service pour gérer les avatars (prédéfinis et custom)
 */

// Avatars prédéfinis disponibles
export const PRESET_AVATARS = [
  { id: "01", source: require("@/assets/images/avatars/01.png") },
  { id: "02", source: require("@/assets/images/avatars/02.png") },
  { id: "03", source: require("@/assets/images/avatars/03.png") },
  { id: "04", source: require("@/assets/images/avatars/04.png") },
  { id: "05", source: require("@/assets/images/avatars/05.png") },
  { id: "06", source: require("@/assets/images/avatars/06.png") },
];

/**
 * Sélectionner un avatar prédéfini
 */
export const selectPresetAvatar = async (userId: string, avatarId: string) => {
  try {
    console.log(`🎨 [Avatar] Selecting preset ${avatarId} for user ${userId}`);

    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_id: avatarId,
        avatar_url: null, // Effacer l'URL custom si elle existe
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;

    console.log(`✅ [Avatar] Preset ${avatarId} selected`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ [Avatar] Error selecting preset:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Uploader un avatar custom vers Supabase Storage
 */
export const uploadCustomAvatar = async (imageUri: string, userId: string) => {
  try {
    console.log(`📤 [Avatar] Uploading custom avatar for user ${userId}`);

    let uploadBody: Uint8Array;
    let fileExt = "jpg";

    // Déterminer l'extension
    const uriMatch = imageUri.match(/\.(png|jpg|jpeg|webp)$/i);
    if (uriMatch) {
      fileExt = uriMatch[1].toLowerCase();
    }

    // Convertir l'image en Uint8Array
    if (imageUri.startsWith("file://") || imageUri.startsWith("/")) {
      const normalizedUri = imageUri.startsWith("file://")
        ? imageUri
        : `file://${imageUri}`;
      const base64 = await FileSystem.readAsStringAsync(normalizedUri, {
        encoding: "base64",
      });
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      uploadBody = bytes;
    } else if (
      imageUri.startsWith("http://") ||
      imageUri.startsWith("https://")
    ) {
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      uploadBody = new Uint8Array(arrayBuffer);
    } else {
      throw new Error("Format d'URI non supporté");
    }

    // Nom de fichier unique
    const fileName = `${userId}/avatar-custom.${fileExt}`;

    // Upload
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, uploadBody, {
        contentType: `image/${fileExt}`,
        upsert: true, // Remplacer l'ancien si existe
      });

    if (uploadError) throw uploadError;

    // Obtenir l'URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName);

    const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

    // Sauvegarder dans le profil
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: cacheBustedUrl,
        avatar_id: null, // Effacer l'ID prédéfini
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    console.log(`✅ [Avatar] Custom avatar uploaded: ${cacheBustedUrl}`);
    return { success: true, url: cacheBustedUrl };
  } catch (error: any) {
    console.error("❌ [Avatar] Upload error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Supprimer l'avatar (revenir à aucun avatar)
 */
export const removeAvatar = async (userId: string) => {
  try {
    console.log(`🗑️ [Avatar] Removing avatar for user ${userId}`);

    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_id: null,
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;

    console.log(`✅ [Avatar] Avatar removed`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ [Avatar] Remove error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtenir l'URL d'un avatar (prédéfini ou custom)
 * Retourne null si pas d'avatar
 */
export const getAvatarUrl = (
  avatarId: string | null | undefined,
  avatarUrl: string | null | undefined,
): string | null => {
  // Priorité: URL custom > ID prédéfini
  if (avatarUrl) {
    return avatarUrl;
  }
  if (avatarId) {
    // Pour les prédéfinis, on utilisera le composant Image avec require()
    return `preset://${avatarId}`;
  }
  return null;
};

/**
 * Obtenir la source Image pour React Native
 */
export const getAvatarSource = (
  avatarId: string | null | undefined,
  avatarUrl: string | null | undefined,
): { uri: string } | number | null => {
  if (avatarUrl) {
    return { uri: avatarUrl };
  }
  if (avatarId) {
    const preset = PRESET_AVATARS.find((a) => a.id === avatarId);
    return preset?.source ?? null;
  }
  return null;
};
