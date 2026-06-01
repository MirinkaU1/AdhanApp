import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  Platform,
  StyleSheet,
  Modal,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useIsDark } from "@/components/useColorScheme";
import { useTranslation } from "react-i18next";
import MaterialIconsRound from "@/components/MaterialIconsRound";

interface AppDatePickerProps {
  label?: string;
  value?: string;
  placeholder?: string;
  error?: string;
  warning?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange: (date: string | null) => void;
  containerClassName?: string;
}

export default function AppDatePicker({
  label,
  value,
  placeholder,
  error,
  warning,
  minimumDate,
  maximumDate,
  onChange,
  containerClassName = "",
}: AppDatePickerProps) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const { width } = useWindowDimensions();

  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const isSmallScreen = width < 360;
  const isLargeScreen = width >= 414;

  const labelSize = isSmallScreen ? 11 : isLargeScreen ? 14 : 12;
  const inputFontSize = isSmallScreen ? 14 : isLargeScreen ? 18 : 16;
  const errorSize = isSmallScreen ? 10 : isLargeScreen ? 13 : 11;
  const iconSize = isSmallScreen ? 20 : isLargeScreen ? 26 : 24;
  const inputHeight = isSmallScreen ? 52 : isLargeScreen ? 64 : 56;
  const horizontalPadding = isSmallScreen ? 14 : isLargeScreen ? 20 : 16;

  const placeholderColor = isDark ? "#64748B" : "#94A3B8";
  const iconColor = isDark ? "#64748B" : "#94A3B8";
  const textColor = isDark ? "#F8FAFC" : "#1E293B";
  const valueColor = value ? textColor : placeholderColor;

  const hasError = !!error;
  const hasWarning = !!warning && !hasError;
  const hasValue = !!value;

  // Convertit JJ/MM/AAAA vers Date
  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.length !== 10) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return new Date(year, month - 1, day);
  };

  // Convertit Date vers JJ/MM/AAAA
  const formatDateToString = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePress = () => {
    if (value) {
      setTempDate(parseDateString(value));
    } else {
      setTempDate(new Date());
    }
    setShowPicker(true);
  };

  const handleConfirm = () => {
    if (tempDate) {
      const formatted = formatDateToString(tempDate);
      onChange(formatted);
    }
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        onChange(formatDateToString(selectedDate));
      }
      setShowPicker(false);
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  return (
    <View className={containerClassName}>
      {label && (
        <Text
          className="font-outfit-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest mb-2 ml-1"
          style={{ fontSize: labelSize }}
        >
          {label}
        </Text>
      )}
      <Pressable
        onPress={handlePress}
        className={`flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-2xl border ${
          hasError
            ? "border-red-500"
            : hasWarning
              ? "border-amber-400"
              : "border-border-light dark:border-border-dark"
        }`}
        style={{ height: inputHeight, paddingHorizontal: horizontalPadding }}
      >
        <MaterialIconsRound name="cake" size={iconSize} color={iconColor} />
        <Text
          className={`flex-1 font-outfit-medium text-text-primary-light dark:text-text-primary-dark px-3`}
          style={{ color: valueColor, fontSize: inputFontSize }}
        >
          {value || placeholder}
        </Text>
        {hasValue && (
          <View className="w-6 h-6 rounded-full items-center justify-center bg-amber-600">
            <MaterialIconsRound name="edit" size={14} color="#fff" />
          </View>
        )}
      </Pressable>
      {hasError && (
        <Text
          className="font-outfit-medium text-red-500 mt-1 ml-1"
          style={{ fontSize: errorSize }}
        >
          {error}
        </Text>
      )}
      {hasWarning && (
        <Text
          className="font-outfit-medium text-amber-500 mt-1 ml-1"
          style={{ fontSize: errorSize }}
        >
          {warning}
        </Text>
      )}

      {/* iOS Wheel Picker Modal */}
      {Platform.OS === "ios" && showPicker && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={StyleSheet.absoluteFill}>
            {/* Backdrop */}
            <Pressable
              style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]}
              onPress={handleCancel}
            />

            {/* Picker Container */}
            <View className="absolute bottom-0 left-0 right-0">
              <View
                className={`rounded-t-3xl pt-4 pb-8 ${
                  isDark ? "bg-slate-800" : "bg-white"
                }`}
                style={{ paddingBottom: Platform.OS === "ios" ? 34 : 20 }}
              >
                {/* Header */}
                <View className="flex-row justify-between items-center px-6 mb-4">
                  <Pressable onPress={handleCancel}>
                    <Text
                      className="font-outfit-medium text-lg"
                      style={{ color: "#64748B" }}
                    >
                      {t("common.cancel")}
                    </Text>
                  </Pressable>
                  <Text
                    className="font-outfit-bold text-lg"
                    style={{ color: textColor }}
                  >
                    {label || t("settings.birthDate")}
                  </Text>
                  <Pressable onPress={handleConfirm}>
                    <Text
                      className="font-outfit-bold text-lg"
                      style={{ color: "#115E59" }}
                    >
                      {t("common.confirm")}
                    </Text>
                  </Pressable>
                </View>

                {/* Wheel Picker */}
                <DateTimePicker
                  value={tempDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleChange}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  style={{ height: 200 }}
                  textColor={textColor}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android Picker */}
      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={tempDate || new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}