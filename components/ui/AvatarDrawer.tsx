import { useState, useMemo } from "react";
import {
  Pressable,
  View,
  Text,
  Image,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import AppDrawer from "./AppDrawer";
import AppTabs, { TabOption } from "./AppTabs";
import AlertDialog from "./AlertDialog";
import type { PresetAvatar } from "@/lib/avatarService";

interface AvatarDrawerProps {
  visible: boolean;
  onClose: () => void;
  onPickImage: () => void;
  avatarOptions: PresetAvatar[];
  /** IDs des avatars débloqués */
  unlockedAvatarIds: string[];
  /** Solde de pièces actuel */
  coins: number;
  /** Appelé quand l'utilisateur sélectionne un avatar débloqué */
  onSelectAvatar: (avatarId: string) => void;
  /** Appelé quand l'utilisateur achète un avatar verrouillé (coins) */
  onPurchaseAvatar: (avatarId: string, price: number) => boolean;
  /** Appelé quand l'utilisateur veut supprimer son avatar */
  onRemoveAvatar?: () => void;
  isLoading?: boolean;
}

export default function AvatarDrawer({
  visible,
  onClose,
  onPickImage,
  avatarOptions = [],
  unlockedAvatarIds,
  coins,
  onSelectAvatar,
  onPurchaseAvatar,
  onRemoveAvatar,
  isLoading = false,
}: AvatarDrawerProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"avatars" | "gallery">("avatars");

  // Confirmation d'achat
  const [pendingAvatar, setPendingAvatar] = useState<PresetAvatar | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [insufficientVisible, setInsufficientVisible] = useState(false);

  const tabs: TabOption<"avatars" | "gallery">[] = useMemo(
    () => [
      { key: "avatars", label: t("settings.tabAvatars", "Avatars") },
      { key: "gallery", label: t("settings.tabGallery", "Galerie") },
    ],
    [t],
  );

  if (!visible) return null;

  const handleAvatarPress = (avatar: PresetAvatar) => {
    const isUnlocked = unlockedAvatarIds.includes(avatar.id);

    if (isUnlocked) {
      onSelectAvatar(avatar.id);
      return;
    }

    // Avatar verrouillé
    if (avatar.unlock.type === "coins") {
      setPendingAvatar(avatar);
      if (coins < avatar.unlock.price) {
        setInsufficientVisible(true);
      } else {
        setConfirmVisible(true);
      }
    }
    // Avatar par niveau → juste informatif, pas achetable
  };

  const handleConfirmPurchase = () => {
    if (!pendingAvatar || pendingAvatar.unlock.type !== "coins") return;
    const price = (pendingAvatar.unlock as { type: "coins"; price: number }).price;
    const success = onPurchaseAvatar(pendingAvatar.id, price);
    setConfirmVisible(false);
    if (success) {
      onSelectAvatar(pendingAvatar.id);
    }
    setPendingAvatar(null);
  };

  const pendingPrice =
    pendingAvatar?.unlock.type === "coins"
      ? (pendingAvatar.unlock as { type: "coins"; price: number }).price
      : 0;

  return (
    <>
      <AppDrawer
        visible={visible}
        onClose={onClose}
        title={t("settings.chooseAvatar")}
        subtitle={t("settings.avatarDrawerSubtitle", "Personnalise ton profil")}
        closeButtonText={t("common.close", "Fermer")}
      >
        {/* Tabs */}
        <AppTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "gallery" ? (
          <View className="mt-4">
            <Pressable
              onPress={onPickImage}
              className="flex-row items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-800"
              disabled={isLoading}
            >
              <MaterialIconsRound
                name="photo-library"
                size={22}
                color="#0F766E"
              />
              <Text className="font-outfit-medium text-slate-800 dark:text-slate-100">
                {t("settings.chooseFromGallery")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="mt-4 mb-4">
            <Text className="text-sm font-outfit-semibold uppercase text-gray-500 dark:text-slate-400 mb-3">
              {t("settings.avatars")}
            </Text>

            {avatarOptions.length === 0 ? (
              <Text className="text-sm text-gray-500 dark:text-slate-400">
                {t("settings.noAvatars")}
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20, gap: 12 }}
              >
                {avatarOptions.map((avatar) => {
                  const isUnlocked = unlockedAvatarIds.includes(avatar.id);
                  const isLevel = avatar.unlock.type === "level";
                  const price =
                    avatar.unlock.type === "coins"
                      ? (avatar.unlock as { type: "coins"; price: number }).price
                      : null;
                  const levelRequired =
                    avatar.unlock.type === "level"
                      ? (avatar.unlock as { type: "level"; level: number }).level
                      : null;

                  return (
                    <Pressable
                      key={avatar.id}
                      onPress={() => handleAvatarPress(avatar)}
                      disabled={isLoading || isLevel}
                      className="items-center"
                      style={{ gap: 4 }}
                    >
                      {/* Image de l'avatar */}
                      <View
                        className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-800 border-2"
                        style={{
                          borderColor: isUnlocked ? "#0F766E" : "#CBD5E1",
                          opacity: isLevel ? 0.5 : 1,
                        }}
                      >
                        <Image
                          source={avatar.source}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />

                        {/* Overlay cadenas sur les avatars verrouillés */}
                        {!isUnlocked && (
                          <View
                            className="absolute inset-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                          >
                            <MaterialIconsRound
                              name="lock"
                              size={22}
                              color="#FFFFFF"
                            />
                          </View>
                        )}
                      </View>

                      {/* Badge prix / niveau */}
                      {!isUnlocked && (
                        <View
                          className="flex-row items-center rounded-full px-1.5 py-0.5"
                          style={{
                            gap: 2,
                            backgroundColor: isLevel
                              ? "rgba(99,102,241,0.15)"
                              : "rgba(217,119,6,0.15)",
                          }}
                        >
                          <MaterialIconsRound
                            name={isLevel ? "military-tech" : "toll"}
                            size={11}
                            color={isLevel ? "#818CF8" : "#D97706"}
                          />
                          <Text
                            className="font-outfit-bold text-xs"
                            style={{ color: isLevel ? "#818CF8" : "#D97706" }}
                          >
                            {isLevel ? `Niv. ${levelRequired}` : `${price}`}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {onRemoveAvatar ? (
          <Pressable
            onPress={onRemoveAvatar}
            className="mt-5 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10"
            disabled={isLoading}
          >
            <MaterialIconsRound name="delete-outline" size={20} color="#EF4444" />
            <Text className="font-outfit-semibold text-red-500">
              {t("settings.removeAvatar", "Supprimer l'avatar")}
            </Text>
          </Pressable>
        ) : null}
      </AppDrawer>

      {/* Dialog de confirmation d'achat */}
      <AlertDialog
        visible={confirmVisible}
        title={t("avatars.confirmPurchase", "Acheter l'avatar")}
        message={t("avatars.confirmPurchaseDesc", {
          price: pendingPrice,
          defaultValue: `Acheter cet avatar pour ${pendingPrice} pièces ?`,
        })}
        icon="toll"
        iconColor="#D97706"
        buttons={[
          {
            text: t("common.cancel", "Annuler"),
            style: "default",
            onPress: () => {
              setConfirmVisible(false);
              setPendingAvatar(null);
            },
          },
          {
            text: t("avatars.buy", "Acheter"),
            style: "primary",
            onPress: handleConfirmPurchase,
          },
        ]}
        onDismiss={() => {
          setConfirmVisible(false);
          setPendingAvatar(null);
        }}
      />

      {/* Dialog pièces insuffisantes */}
      <AlertDialog
        visible={insufficientVisible}
        title={t("themes.notEnoughCoins", "Pièces insuffisantes")}
        message={t("avatars.notEnoughCoinsDesc", {
          need: pendingPrice - coins,
          defaultValue: `Il vous manque ${pendingPrice - coins} pièce(s). Accomplissez des quêtes pour en gagner.`,
        })}
        icon="toll"
        iconColor="#EF4444"
        buttons={[
          {
            text: t("common.ok", "OK"),
            style: "default",
            onPress: () => {
              setInsufficientVisible(false);
              setPendingAvatar(null);
            },
          },
        ]}
        onDismiss={() => {
          setInsufficientVisible(false);
          setPendingAvatar(null);
        }}
      />
    </>
  );
}
