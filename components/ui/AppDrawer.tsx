import { ReactNode } from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  DimensionValue,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  maxHeight?: DimensionValue;
  showHandle?: boolean;
  showCloseButton?: boolean;
  closeButtonText?: string;
  contentContainerClassName?: string;
  scrollable?: boolean;
}

export default function AppDrawer({
  visible,
  onClose,
  children,
  title,
  subtitle,
  maxHeight = "75%",
  showHandle = true,
  showCloseButton = true,
  closeButtonText = "Fermer",
  contentContainerClassName = "",
  scrollable = true,
}: AppDrawerProps) {
  if (!visible) return null;

  const content = (
    <>
      {/* Handle indicator */}
      {showHandle && (
        <View className="items-center mb-4">
          <View className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-slate-700" />
        </View>
      )}

      {/* Header */}
      {(title || subtitle) && (
        <View className="mb-4">
          {title && (
            <Text className="text-lg font-outfit-bold text-slate-800 dark:text-slate-100">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text className="text-sm font-outfit-regular text-gray-500 dark:text-slate-400 mt-1">
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* Content */}
      {children}

      {/* Close button */}
      {showCloseButton && (
        <Pressable onPress={onClose} className="my-6 items-center">
          <Text className="text-base font-outfit-semibold text-amber-600">
            {closeButtonText}
          </Text>
        </Pressable>
      )}
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={StyleSheet.absoluteFill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={StyleSheet.absoluteFill}>
          {/* Backdrop avec animation */}
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0, 0, 0, 0.5)" },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>

          {/* Drawer animé */}
          <Animated.View
            entering={SlideInDown.duration(300).damping(20)}
            exiting={SlideOutDown.duration(250)}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl"
            style={{ maxHeight, paddingBottom: 0 }}
          >
            {scrollable ? (
              <ScrollView
                className={`px-5 pt-4 ${contentContainerClassName}`}
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                {content}
              </ScrollView>
            ) : (
              <View className={`px-5 pt-4 ${contentContainerClassName}`}>
                {content}
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
