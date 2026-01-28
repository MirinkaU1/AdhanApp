import React from "react";
import { View } from "react-native";
import { cn } from "@/lib/utils"; // Helper pour merger les classes (optionnel)

interface AppCardProps {
  children: React.ReactNode;
  /** Additional Tailwind classes */
  className?: string;
  /** Variant du card */
  variant?: "default" | "elevated" | "outlined";
}

/**
 * AppCard - Carte standard pour conteneurs
 * Utilise NativeWind v4 pour le styling
 */
export default function AppCard({
  children,
  className = "",
  variant = "default",
}: AppCardProps) {
  // Classes de base
  const baseClasses = "bg-white dark:bg-slate-800 rounded-2xl p-4";

  // Classes selon le variant
  const variantClasses = {
    default: "border border-border-light dark:border-border-dark",
    elevated: "shadow-sm", // Nécessite shadow support in NativeWind
    outlined: "border-2 border-accent",
  };

  return (
    <View className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </View>
  );
}
