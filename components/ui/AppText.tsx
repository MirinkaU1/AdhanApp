import React from "react";
import { Text, TextProps } from "react-native";

type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodyMedium"
  | "caption"
  | "label";

interface AppTextProps extends TextProps {
  /** Text variant for predefined styles */
  variant?: TextVariant;
  /** Additional Tailwind classes */
  className?: string;
  children: React.ReactNode;
}

/**
 * AppText - Composant texte avec variantes prédéfinies
 * Applique automatiquement les polices Outfit et les tailles
 */
export default function AppText({
  variant = "body",
  className = "",
  children,
  ...props
}: AppTextProps) {
  // Map des variantes vers les classes Tailwind
  const variantClasses: Record<TextVariant, string> = {
    h1: "text-3xl font-outfit-bold text-text-primary-light dark:text-text-primary-dark",
    h2: "text-2xl font-outfit-bold text-text-primary-light dark:text-text-primary-dark",
    h3: "text-xl font-outfit-semibold text-text-primary-light dark:text-text-primary-dark",
    body: "text-base font-outfit-regular text-text-primary-light dark:text-text-primary-dark",
    bodyMedium:
      "text-base font-outfit-medium text-text-primary-light dark:text-text-primary-dark",
    caption:
      "text-sm font-outfit-regular text-text-secondary-light dark:text-text-secondary-dark",
    label:
      "text-xs font-outfit-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider",
  };

  return (
    <Text className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </Text>
  );
}
