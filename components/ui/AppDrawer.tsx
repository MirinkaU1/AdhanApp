import React, { ReactNode, useRef, useCallback } from "react";
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
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useIsDark } from "@/components/useColorScheme";
import { useTranslation } from "react-i18next";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CLOSE_THRESHOLD = 100;

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
  enableSwipeToClose?: boolean;
  /** Utilise height fixe au lieu de maxHeight — requis quand le contenu est une FlatList */
  fillHeight?: boolean;
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
  closeButtonText,
  contentContainerClassName = "",
  scrollable = true,
  enableSwipeToClose = true,
  fillHeight = false,
}: AppDrawerProps) {
  const { t } = useTranslation();
  const scrollOffset = useRef(0);
  const isScrolling = useRef(false);
  const isDark = useIsDark();

  // Convertir maxHeight en nombre si c'est un pourcentage
  const maxHeightValue =
    typeof maxHeight === "string" && maxHeight.includes("%")
      ? SCREEN_HEIGHT * (parseInt(maxHeight) / 100)
      : typeof maxHeight === "number"
        ? maxHeight
        : SCREEN_HEIGHT * 0.75;

  const translateY = useSharedValue(maxHeightValue);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [visible, translateY, backdropOpacity, maxHeightValue]);

  const closeDrawer = useCallback(() => {
    translateY.value = withTiming(maxHeightValue, { duration: 250 }, () => {
      runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [translateY, backdropOpacity, maxHeightValue, onClose]);

  // Gesture handler pour le swipe vers le bas (uniquement sur la poignée)
  const handleGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Si on scrolle dans la ScrollView, ne pas fermer
      if (isScrolling.current || scrollOffset.current > 0) {
        return;
      }

      const newTranslateY = Math.max(0, event.translationY);
      translateY.value = newTranslateY;

      backdropOpacity.value = interpolate(
        newTranslateY,
        [0, maxHeightValue],
        [1, 0],
      );
    })
    .onEnd((event) => {
      if (isScrolling.current) return;

      if (event.translationY > CLOSE_THRESHOLD || event.velocityY > 500) {
        runOnJS(closeDrawer)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
        backdropOpacity.value = withTiming(1, { duration: 200 });
      }
    });

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleScrollBegin = () => {
    isScrolling.current = true;
  };

  const handleScrollEnd = () => {
    isScrolling.current = false;
  };

  const handleScroll = (event: any) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
  };

  if (!visible) return null;

  const content = (
    <>
      {/* Handle indicator avec gesture */}
      {showHandle && enableSwipeToClose && (
        <GestureDetector gesture={handleGesture}>
          <View className="items-center mb-4 pt-2">
            <View className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-slate-700" />
          </View>
        </GestureDetector>
      )}

      {/* Handle sans gesture */}
      {showHandle && !enableSwipeToClose && (
        <View className="items-center mb-4 pt-2">
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
      {scrollable ? (
        <ScrollView
          className={contentContainerClassName}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={true}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBegin}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollBegin={handleScrollBegin}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          bounces={false}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className={contentContainerClassName} style={{ flex: 1 }}>
          {children}
        </View>
      )}

      {/* Close button */}
      {showCloseButton && (
        <Pressable onPress={closeDrawer} className="my-6 items-center">
          <Text className="text-base font-outfit-semibold text-amber-600">
            {closeButtonText || t("common.close")}
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
      onRequestClose={closeDrawer}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        {/* Backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0, 0, 0, 0.5)" },
            backdropStyle,
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
        </Animated.View>

        {/* Drawer */}
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              ...(fillHeight ? { height: maxHeightValue } : { maxHeight: maxHeightValue }),
              backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Platform.OS === "ios" ? 34 : 20,
            },
            drawerStyle,
          ]}
        >
          {content}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
