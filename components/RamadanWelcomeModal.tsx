import { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { useTranslation } from "react-i18next";
import useRamadanStore from "@/stores/useRamadanStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 380);

interface RamadanWelcomeModalProps {
  visible: boolean;
  onClose: () => void;
}

const FEATURES = [
  { icon: "nights-stay" as const, key: "feature1" },
  { icon: "menu-book" as const, key: "feature2" },
  { icon: "emoji-events" as const, key: "feature3" },
] as const;

const COINS_USES = [
  { key: "coinsUse1", icon: "palette" as const },
  { key: "coinsUse2", icon: "card-giftcard" as const },
  { key: "coinsUse3", icon: "auto-awesome" as const },
] as const;

export default function RamadanWelcomeModal({
  visible,
  onClose,
}: RamadanWelcomeModalProps) {
  const { t } = useTranslation();
  const { moonCoins } = useRamadanStore();
  const [showCoinsInfo, setShowCoinsInfo] = useState(false);

  return (
    <>
      {/* ── Modal principal ── */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={[styles.card, { width: CARD_WIDTH }]}>
            <LinearGradient
              colors={["#1C0A00", "#3D1A00", "#5C2D00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={["rgba(217,119,6,0.35)", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.topArc}
            />

            {/* Étoiles */}
            <View
              className="flex-row items-center gap-1.5 mb-4"
              pointerEvents="none"
            >
              {["✦", "★", "✦", "★", "✦", "★", "✦"].map((s, i) => (
                <Text
                  key={i}
                  style={{
                    color: "#FCD34D",
                    fontSize: i === 3 ? 18 : 12,
                    opacity: i % 2 === 0 ? 0.55 : 0.3,
                  }}
                >
                  {s}
                </Text>
              ))}
            </View>

            {/* Lune */}
            <View className="items-center justify-center mb-4">
              <View style={styles.moonGlow3} />
              <View style={styles.moonGlow2} />
              <View style={styles.moonGlow1} />
              <View
                className="w-[72px] h-[72px] rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(217,119,6,0.28)",
                  borderWidth: 1.5,
                  borderColor: "rgba(252,211,77,0.4)",
                }}
              >
                <MaterialIconsRound
                  name="nights-stay"
                  size={40}
                  color="#FCD34D"
                />
              </View>
            </View>

            {/* Titre */}
            <Text
              className="font-outfit-bold text-center text-yellow-300 mb-2"
              style={{ fontSize: 26, letterSpacing: 0.5 }}
            >
              Ramadan Mubarak
            </Text>

            {/* Ornement */}
            <View
              className="flex-row items-center gap-2 mb-3"
              style={{ width: "70%" }}
            >
              <View
                className="flex-1"
                style={{ height: 1, backgroundColor: "rgba(252,211,77,0.3)" }}
              />
              <Text style={{ color: "#FCD34D", fontSize: 10, opacity: 0.7 }}>
                ✦
              </Text>
              <View
                className="flex-1"
                style={{ height: 1, backgroundColor: "rgba(252,211,77,0.3)" }}
              />
            </View>

            {/* Sous-titre */}
            <Text
              className="font-outfit-regular text-[13px] text-center mb-4 px-2"
              style={{ color: "rgba(253,230,138,0.75)", lineHeight: 20 }}
            >
              {t("ramadan.welcome.subtitle")}
            </Text>

            {/* Features */}
            <View className="w-full gap-2 mb-4">
              {FEATURES.map((f) => (
                <View
                  key={f.key}
                  className="flex-row items-center gap-3 rounded-2xl py-2.5 px-3.5"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(217,119,6,0.2)",
                  }}
                >
                  <View
                    className="w-8 h-8 rounded-xl items-center justify-center"
                    style={{ backgroundColor: "rgba(217,119,6,0.25)" }}
                  >
                    <MaterialIconsRound
                      name={f.icon}
                      size={17}
                      color="#FCD34D"
                    />
                  </View>
                  <Text
                    className="font-outfit-medium text-[13px] flex-1"
                    style={{ color: "rgba(255,255,255,0.88)" }}
                  >
                    {t(`ramadan.welcome.${f.key}`)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Lien "Plus d'infos sur les lunes" */}
            <Pressable
              className="flex-row items-center gap-1.5 mb-4 active:opacity-70"
              onPress={() => setShowCoinsInfo(true)}
            >
              <MaterialIconsRound name="nightlight" size={14} color="#FCD34D" />
              <Text
                className="font-outfit-medium text-[13px] text-yellow-300"
                style={{ textDecorationLine: "underline" }}
              >
                {t("ramadan.welcome.moreInfo")}
              </Text>
              <MaterialIconsRound
                name="open-in-new"
                size={13}
                color="rgba(252,211,77,0.6)"
              />
            </Pressable>

            {/* Bouton CTA */}
            <Pressable
              className="w-full rounded-2xl overflow-hidden mb-3 active:opacity-85"
              onPress={onClose}
            >
              <LinearGradient
                colors={["#D97706", "#B45309"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                }}
              >
                <MaterialIconsRound name="nights-stay" size={18} color="#fff" />
                <Text
                  className="font-outfit-bold text-base text-white"
                  style={{ letterSpacing: 0.3 }}
                >
                  {t("ramadan.welcome.start")}
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Note */}
            <Text
              className="font-outfit-regular text-[11px] text-center"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {t("ramadan.welcome.bottomNote")}
            </Text>
          </View>
        </View>
      </Modal>

      {/* ── Modal "À quoi servent les lunes ?" ── */}
      <Modal
        visible={showCoinsInfo}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowCoinsInfo(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setShowCoinsInfo(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[styles.coinsCard, { width: CARD_WIDTH }]}>
              <LinearGradient
                colors={["#1C0A00", "#3D1A00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {/* En-tête */}
              <View className="flex-row items-center gap-3 mb-5">
                <View
                  className="w-11 h-11 rounded-2xl items-center justify-center"
                  style={{
                    backgroundColor: "rgba(217,119,6,0.3)",
                    borderWidth: 1,
                    borderColor: "rgba(252,211,77,0.3)",
                  }}
                >
                  <MaterialIconsRound
                    name="nightlight"
                    size={22}
                    color="#FCD34D"
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="font-outfit-bold text-yellow-300"
                    style={{ fontSize: 17 }}
                  >
                    {t("ramadan.welcome.coinsTitle")}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <MaterialIconsRound
                      name="nightlight"
                      size={12}
                      color="#FCD34D"
                    />
                    <Text className="font-outfit-semibold text-xs text-yellow-300">
                      {t("ramadan.welcome.coinsInfo", { count: moonCoins })}
                    </Text>
                  </View>
                </View>
                <Pressable
                  className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                  onPress={() => setShowCoinsInfo(false)}
                >
                  <MaterialIconsRound
                    name="close"
                    size={18}
                    color="rgba(255,255,255,0.6)"
                  />
                </Pressable>
              </View>

              {/* Usages */}
              <View className="gap-3 mb-5">
                {COINS_USES.map((item, i) => (
                  <View
                    key={item.key}
                    className="flex-row items-center gap-3 rounded-2xl p-3.5"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor:
                        i === COINS_USES.length - 1
                          ? "rgba(217,119,6,0.12)"
                          : "rgba(217,119,6,0.22)",
                    }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: "rgba(217,119,6,0.25)" }}
                    >
                      <MaterialIconsRound
                        name={item.icon}
                        size={20}
                        color="#FCD34D"
                      />
                    </View>
                    <Text
                      className="font-outfit-medium text-[13px] flex-1"
                      style={{
                        color:
                          i === COINS_USES.length - 1
                            ? "rgba(253,230,138,0.5)"
                            : "rgba(255,255,255,0.85)",
                        fontStyle:
                          i === COINS_USES.length - 1 ? "italic" : "normal",
                      }}
                    >
                      {t(`ramadan.welcome.${item.key}`)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Bouton fermer */}
              <Pressable
                className="w-full rounded-2xl overflow-hidden active:opacity-85"
                onPress={() => setShowCoinsInfo(false)}
              >
                <LinearGradient
                  colors={["#D97706", "#B45309"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 13, alignItems: "center" }}
                >
                  <Text className="font-outfit-bold text-base text-white">
                    {t("common.close")}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(217,119,6,0.4)",
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  coinsCard: {
    borderRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(217,119,6,0.4)",
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 14,
  },
  topArc: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 130,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  moonGlow3: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(217,119,6,0.08)",
  },
  moonGlow2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(217,119,6,0.14)",
  },
  moonGlow1: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(217,119,6,0.22)",
  },
});
