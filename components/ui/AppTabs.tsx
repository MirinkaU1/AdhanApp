import { useRef, useEffect, useState } from "react";
import { Pressable, View, Text, LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

export interface TabOption<T extends string = string> {
  key: T;
  label: string;
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
      className={`flex-row bg-gray-100 dark:bg-slate-800 rounded-2xl p-1 relative ${containerClassName}`}
    >
      {/* Animated indicator */}
      <Animated.View
        className="absolute top-1 bottom-1 bg-white dark:bg-slate-900 rounded-xl"
        style={[indicatorStyle, { left: containerPadding }]}
      />

      {/* Tabs */}
      {tabs.map((tab, index) => (
        <Pressable
          key={tab.key}
          onPress={() => onTabChange(tab.key)}
          onLayout={(e) => handleTabLayout(index, e)}
          className="flex-1 py-2 rounded-xl z-10"
        >
          <Text
            className={`text-center font-outfit-semibold ${
              activeTab === tab.key
                ? "text-slate-900 dark:text-slate-100"
                : "text-gray-500 dark:text-slate-400"
            }`}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
