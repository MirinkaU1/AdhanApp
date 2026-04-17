import { useRef, useEffect, useState } from "react";
import { Pressable, View, Text, LayoutChangeEvent } from "react-native";
import { useIsDark } from "@/components/useColorScheme";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

export interface TabOption<T extends string = string> {
  key: T;
  label: string;
  badge?: number;
}

interface AppTabsProps<T extends string = string> {
  tabs: TabOption<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  containerClassName?: string;
}

// Custom easing: cubic-bezier(0.85, 0, 0.15, 1)
const customEasing = Easing.bezier(0.85, 0, 0.15, 1);

export default function AppTabs<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  containerClassName = "",
}: AppTabsProps<T>) {
  const isDark = useIsDark();
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const [containerPadding] = useState(4); // p-1 = 4px

  // Animation values
  const translateX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  // Get current tab index
  const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);

  // Handle tab layout measurement
  const handleTabLayout = (index: number, event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTabWidths((prev) => {
      const newWidths = [...prev];
      newWidths[index] = width;
      return newWidths;
    });
  };

  // Update animation when active tab changes
  useEffect(() => {
    if (tabWidths.length === tabs.length && activeIndex >= 0) {
      // Calculate X position
      let xPos = 0;
      for (let i = 0; i < activeIndex; i++) {
        xPos += tabWidths[i] || 0;
      }

      translateX.value = withTiming(xPos, {
        duration: 300,
        easing: customEasing,
      });

      indicatorWidth.value = withTiming(tabWidths[activeIndex] || 0, {
        duration: 300,
        easing: customEasing,
      });
    }
  }, [activeIndex, tabWidths, tabs.length]);

  // Animated style for indicator
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: indicatorWidth.value,
  }));

  return (
    <View
      className={`flex-row rounded-2xl p-1 relative ${containerClassName}`}
      style={{
        backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
      }}
    >
      {/* Animated indicator */}
      <Animated.View
        className="absolute top-1 bottom-1 rounded-xl"
        style={[
          indicatorStyle,
          {
            left: containerPadding,
            backgroundColor: isDark ? "#334155" : "#FFFFFF",
          },
        ]}
      />

      {/* Tabs */}
      {tabs.map((tab, index) => (
        <Pressable
          key={tab.key}
          onPress={() => onTabChange(tab.key)}
          onLayout={(e) => handleTabLayout(index, e)}
          className="flex-1 py-2 rounded-xl z-10 flex-row items-center justify-center gap-1.5"
        >
          <Text
            style={{
              fontFamily: "Outfit_600SemiBold",
              fontSize: 14,
              color:
                activeTab === tab.key
                  ? isDark ? "#F1F5F9" : "#0F172A"
                  : isDark ? "#94A3B8" : "#64748B",
            }}
          >
            {tab.label}
          </Text>
          {!!tab.badge && tab.badge > 0 && (
            <View
              style={{
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                paddingHorizontal: 4,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#F97316",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "Outfit_700Bold",
                  color: "#FFFFFF",
                  lineHeight: 13,
                }}
              >
                {tab.badge > 9 ? "9+" : tab.badge}
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}
