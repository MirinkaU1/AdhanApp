import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useNavigation } from "expo-router";
import { useState } from "react";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppInput, AppButton, ErrorMessage } from "@/components/ui";
import useThemeColors from "@/hooks/useThemeColors";
import { fonts, fontSizes, spacing, borderRadius } from "@/constants/theme";
import useAuthStore from "@/stores/useAuthStore";

export default function LoginScreen() {
  const colors = useThemeColors();
  const { signInWithEmail, isLoading } = useAuthStore();
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Vérifier si on peut revenir en arrière (vient de settings)
  const canGoBack = navigation.canGoBack();

  const handleLogin = async () => {
    setErrorMessage("");

    // Validations
    if (!email.trim()) {
      setErrorMessage("Veuillez entrer votre email");
      return;
    }
    if (!password) {
      setErrorMessage("Veuillez entrer votre mot de passe");
      return;
    }

    // Connexion via Supabase
    const result = await signInWithEmail(email.trim(), password);

    if (result.success) {
      router.replace("/(tabs)");
    } else {
      // Traduire les erreurs Supabase courantes
      let errorMsg = result.error || "Une erreur est survenue";
      if (errorMsg.includes("Invalid login credentials")) {
        errorMsg = "Email ou mot de passe incorrect";
      } else if (errorMsg.includes("Email not confirmed")) {
        errorMsg = "Veuillez confirmer votre email d'abord";
      } else if (errorMsg.includes("invalid email")) {
        errorMsg = "Format d'email invalide";
      }
      setErrorMessage(errorMsg);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header avec logo */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            height: "45%",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Bouton retour (seulement si on vient de settings) */}
          {canGoBack && (
            <Pressable
              onPress={() => router.back()}
              style={{
                position: "absolute",
                top: 50,
                left: spacing.base,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.1)",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
            </Pressable>
          )}

          {/* Pattern islamique */}
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdQO7DmBVbuu03IH4BocFKDFkHmlUe2HE1SMJ8hEEP0N9z-aKcbbSzlGU3DVcXn-D1v-uxMZ2Q_WWZudOeijOi0hrg4Jk0GT83F2Mo31sUwByC3xc1deVXN2ubGgZVyVREHzB26yPLeEwviGWxhQcpIR25bjDWHkZbfz8f7Mbm_HNa368vc9k55RodXtXsFNZZm_u91vUH82knn_hPTGfdAi0dWm0qcPJBjs1uyWZUCGthXhCIpJKfERne5HKVvMzjBkZIEfHly_w",
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.08,
            }}
            resizeMode="cover"
          />

          {/* Logo mosquée */}
          <View
            style={{
              width: 96,
              height: 96,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: borderRadius.xl,
              transform: [{ rotate: "45deg" }],
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            <View style={{ transform: [{ rotate: "-45deg" }] }}>
              <MaterialIconsRound name="mosque" size={48} color="#FCD34D" />
            </View>
          </View>

          <Text
            style={{
              fontSize: fontSizes["5xl"],
              fontFamily: fonts.bold,
              color: "#fff",
              marginTop: spacing.lg,
            }}
          >
            MaPrière
          </Text>
          <Text
            style={{
              fontSize: fontSizes.md,
              fontFamily: fonts.regular,
              color: "rgba(255,255,255,0.7)",
              marginTop: spacing.xs,
            }}
          >
            Suivez votre chemin spirituel
          </Text>
        </LinearGradient>

        {/* Formulaire */}
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            borderTopLeftRadius: borderRadius["3xl"],
            borderTopRightRadius: borderRadius["3xl"],
            marginTop: -30,
          }}
          contentContainerStyle={{
            padding: spacing["3xl"],
            paddingBottom: 50,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              fontSize: fontSizes["4xl"],
              fontFamily: fonts.bold,
              color: colors.textPrimary,
              marginBottom: spacing.sm,
            }}
          >
            Bon retour
          </Text>
          <Text
            style={{
              fontSize: fontSizes.lg,
              fontFamily: fonts.regular,
              color: colors.textSecondary,
              marginBottom: spacing["3xl"],
            }}
          >
            Veuillez entrer vos coordonnées.
          </Text>

          {/* Email */}
          <AppInput
            label="Email"
            icon="mail"
            placeholder="votre@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={{ marginBottom: spacing.lg }}
          />

          {/* Mot de passe */}
          <AppInput
            label="Mot de passe"
            icon="lock"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            containerStyle={{ marginBottom: spacing.md }}
          />

          {/* Mot de passe oublié */}
          <Pressable
            style={{ alignSelf: "flex-end", marginBottom: spacing.xl }}
          >
            <Text
              style={{
                fontSize: fontSizes.md,
                fontFamily: fonts.semiBold,
                color: colors.primary,
              }}
            >
              Mot de passe oublié ?
            </Text>
          </Pressable>

          {/* Message d'erreur */}
          {errorMessage ? (
            <ErrorMessage
              message={errorMessage}
              style={{ marginBottom: spacing.base }}
            />
          ) : null}

          {/* Bouton connexion */}
          <AppButton
            title="Se connecter"
            onPress={handleLogin}
            variant="secondary"
            loading={isLoading}
          />

          {/* Lien inscription */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginTop: spacing["3xl"],
            }}
          >
            <Text
              style={{
                fontSize: fontSizes.md,
                fontFamily: fonts.medium,
                color: colors.textSecondary,
              }}
            >
              Vous n'avez pas de compte ?
            </Text>
            <Pressable onPress={() => router.push("/auth/register")}>
              <Text
                style={{
                  fontSize: fontSizes.md,
                  fontFamily: fonts.bold,
                  color: colors.accent,
                  marginLeft: spacing.sm,
                }}
              >
                S'inscrire
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
