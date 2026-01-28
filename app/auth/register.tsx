import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import MaterialIconsRound from "@/components/MaterialIconsRound";
import { AppInput, AppButton, ErrorMessage } from "@/components/ui";
import useThemeColors from "@/hooks/useThemeColors";
import { fonts, fontSizes, spacing, borderRadius } from "@/constants/theme";
import useAuthStore from "@/stores/useAuthStore";

export default function RegisterScreen() {
  const colors = useThemeColors();
  const { signUpWithEmail, isLoading } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async () => {
    setErrorMessage("");

    // Validations
    if (!name.trim()) {
      setErrorMessage("Veuillez entrer votre nom");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Veuillez entrer votre email");
      return;
    }
    if (!password) {
      setErrorMessage("Veuillez entrer un mot de passe");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas");
      return;
    }
    if (!acceptTerms) {
      setErrorMessage("Veuillez accepter les conditions d'utilisation");
      return;
    }

    // Inscription via Supabase
    const result = await signUpWithEmail(email.trim(), password, name.trim());

    if (result.success) {
      Alert.alert(
        "Compte créé ! 🎉",
        "Vérifiez votre email pour confirmer votre inscription.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }],
      );
    } else {
      // Traduire les erreurs Supabase courantes
      let errorMsg = result.error || "Une erreur est survenue";
      if (errorMsg.includes("already registered")) {
        errorMsg = "Cet email est déjà utilisé";
      } else if (errorMsg.includes("invalid email")) {
        errorMsg = "Format d'email invalide";
      } else if (errorMsg.includes("weak password")) {
        errorMsg = "Mot de passe trop faible";
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
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            paddingTop: spacing["5xl"],
            paddingBottom: spacing["4xl"],
            paddingHorizontal: spacing.xl,
            position: "relative",
          }}
        >
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

          {/* Bouton retour */}
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.xl,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing.lg,
            }}
          >
            <MaterialIconsRound name="arrow-back" size={24} color="#fff" />
          </Pressable>

          <Text
            style={{
              fontSize: fontSizes["5xl"],
              fontFamily: fonts.bold,
              color: "#fff",
            }}
          >
            Créer un compte
          </Text>
          <Text
            style={{
              fontSize: fontSizes.md,
              fontFamily: fonts.regular,
              color: "rgba(255,255,255,0.7)",
              marginTop: spacing.xs,
            }}
          >
            Commencez votre voyage spirituel
          </Text>
        </LinearGradient>

        {/* Formulaire */}
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            borderTopLeftRadius: borderRadius["3xl"],
            borderTopRightRadius: borderRadius["3xl"],
            marginTop: -20,
          }}
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: 50,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nom complet */}
          <AppInput
            label="Nom complet"
            icon="person"
            placeholder="Entrez votre nom"
            value={name}
            onChangeText={setName}
            containerStyle={{ marginBottom: spacing.base }}
          />

          {/* Email */}
          <AppInput
            label="Email"
            icon="mail"
            placeholder="exemple@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={{ marginBottom: spacing.base }}
          />

          {/* Mot de passe */}
          <AppInput
            label="Mot de passe"
            icon="lock"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            containerStyle={{ marginBottom: spacing.base }}
          />

          {/* Confirmer mot de passe */}
          <AppInput
            label="Confirmer mot de passe"
            icon="verified-user"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            containerStyle={{ marginBottom: spacing.lg }}
          />

          {/* Conditions */}
          <Pressable
            onPress={() => setAcceptTerms(!acceptTerms)}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: spacing.xl,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: borderRadius.sm,
                borderWidth: 2,
                borderColor: acceptTerms ? colors.primary : colors.inputBorder,
                backgroundColor: acceptTerms ? colors.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
                marginRight: spacing.md,
                marginTop: 2,
              }}
            >
              {acceptTerms && (
                <MaterialIconsRound name="check" size={16} color="#fff" />
              )}
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: fontSizes.md,
                fontFamily: fonts.medium,
                color: colors.textSecondary,
                lineHeight: 20,
              }}
            >
              J'accepte les{" "}
              <Text
                style={{
                  color: colors.primary,
                  fontFamily: fonts.bold,
                  textDecorationLine: "underline",
                }}
              >
                conditions d'utilisation
              </Text>{" "}
              et la politique de confidentialité.
            </Text>
          </Pressable>

          {/* Message d'erreur */}
          {errorMessage ? (
            <ErrorMessage
              message={errorMessage}
              style={{ marginBottom: spacing.base }}
            />
          ) : null}

          {/* Bouton inscription */}
          <AppButton
            title="S'inscrire"
            onPress={handleRegister}
            variant="secondary"
            icon="arrow-forward"
            iconPosition="right"
            loading={isLoading}
          />

          {/* Lien connexion */}
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
              Déjà un compte ?
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text
                style={{
                  fontSize: fontSizes.md,
                  fontFamily: fonts.bold,
                  color: colors.primary,
                  marginLeft: spacing.sm,
                }}
              >
                Se connecter
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
