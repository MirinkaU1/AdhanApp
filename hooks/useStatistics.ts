/**
 * useStatistics - Hook pour calculer les statistiques de prière
 *
 * Calcule les statistiques à partir des logs persistés dans le store :
 * - Série actuelle (streak)
 * - Meilleure série (best streak)
 * - Total des prières
 * - Taux de complétion
 * - Données hebdomadaires pour graphiques
 * - Données mensuelles pour calendrier
 */

import { useMemo } from "react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isFuture,
  getDay,
} from "date-fns";
import { fr, enUS } from "date-fns/locale";
import usePrayerStore, {
  PrayerStatus,
  PrayerName,
} from "@/stores/usePrayerStore";
import { useTranslation } from "react-i18next";

// =====================================================
// TYPES
// =====================================================

export interface DayStats {
  date: Date;
  dateKey: string;
  completed: number;
  total: number;
  isComplete: boolean;
  isToday: boolean;
  isFuture: boolean;
  prayers: PrayerStatus;
}

export interface WeekData {
  dayLabel: string;
  dayNumber: number;
  completed: number;
  total: number;
  isToday: boolean;
  percentage: number;
}

export interface MonthData {
  dayNum: number;
  isToday: boolean;
  isComplete: boolean;
  completed: number;
  isFuture: boolean;
  isCurrentMonth: boolean;
}

export interface PrayerBreakdown {
  name: PrayerName;
  completed: number;
  total: number;
  percentage: number;
}

export interface Statistics {
  // Core stats
  currentStreak: number;
  bestStreak: number;
  totalPrayers: number;
  totalDays: number;
  averagePerDay: number;
  completionRate: number;

  // Weekly data (last 7 days)
  weekData: WeekData[];
  weekTotal: number;
  weekCompleted: number;
  weekPercentage: number;

  // Monthly data (current month)
  monthData: MonthData[][];
  monthName: string;
  monthYear: number;
  monthTotal: number;
  monthCompleted: number;
  monthPercentage: number;

  // Prayer breakdown (which prayers are most/least completed)
  prayerBreakdown: PrayerBreakdown[];

  // Trends
  thisWeekVsLastWeek: number; // Positive = improvement, negative = decline
  perfectDaysThisMonth: number;
}

// =====================================================
// HELPERS
// =====================================================

const getDateKey = (date: Date): string => format(date, "yyyy-MM-dd");

const countCompleted = (status: PrayerStatus | undefined): number => {
  if (!status) return 0;
  return Object.values(status).filter(Boolean).length;
};

const isComplete = (status: PrayerStatus | undefined): boolean => {
  if (!status) return false;
  return Object.values(status).every(Boolean);
};

// =====================================================
// HOOK
// =====================================================

export function useStatistics(): Statistics {
  const { i18n } = useTranslation();
  const locale = i18n.language === "fr" ? fr : enUS;
  const logs = usePrayerStore((state) => state.logs);

  return useMemo(() => {
    const today = new Date();

    // =====================================================
    // CURRENT STREAK
    // =====================================================
    let currentStreak = 0;
    let cursor = new Date(today);

    // Start from yesterday if today is not complete yet
    const todayStatus = logs[getDateKey(today)];
    if (!isComplete(todayStatus)) {
      cursor = subDays(cursor, 1);
    }

    while (true) {
      const key = getDateKey(cursor);
      const status = logs[key];
      if (!isComplete(status)) break;
      currentStreak++;
      cursor = subDays(cursor, 1);
    }

    // =====================================================
    // BEST STREAK (scan all logs)
    // =====================================================
    let bestStreak = 0;
    let tempStreak = 0;

    // Sort dates and iterate
    const sortedDates = Object.keys(logs).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      const status = logs[sortedDates[i]];
      if (isComplete(status)) {
        tempStreak++;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    // Include current streak if it's the best
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }

    // =====================================================
    // TOTAL PRAYERS & DAYS
    // =====================================================
    let totalPrayers = 0;
    const totalDays = Object.keys(logs).length;

    Object.values(logs).forEach((status) => {
      totalPrayers += countCompleted(status);
    });

    const averagePerDay = totalDays > 0 ? totalPrayers / totalDays : 0;
    const completionRate =
      totalDays > 0 ? (totalPrayers / (totalDays * 5)) * 100 : 0;

    // =====================================================
    // WEEKLY DATA (last 7 days)
    // =====================================================
    const weekStart = subDays(today, 6);
    const weekDays = eachDayOfInterval({ start: weekStart, end: today });

    const weekData: WeekData[] = weekDays.map((day) => {
      const key = getDateKey(day);
      const status = logs[key];
      const completed = countCompleted(status);
      const dayOfWeek = getDay(day);
      const dayLabels =
        locale === fr
          ? ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
          : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      return {
        dayLabel: dayLabels[dayOfWeek],
        dayNumber: day.getDate(),
        completed,
        total: 5,
        isToday: isToday(day),
        percentage: (completed / 5) * 100,
      };
    });

    const weekCompleted = weekData.reduce((sum, d) => sum + d.completed, 0);
    const weekTotal = weekData.length * 5;
    const weekPercentage = (weekCompleted / weekTotal) * 100;

    // =====================================================
    // LAST WEEK DATA (for comparison)
    // =====================================================
    const lastWeekStart = subDays(weekStart, 7);
    const lastWeekEnd = subDays(weekStart, 1);
    const lastWeekDays = eachDayOfInterval({
      start: lastWeekStart,
      end: lastWeekEnd,
    });

    let lastWeekCompleted = 0;
    lastWeekDays.forEach((day) => {
      const key = getDateKey(day);
      lastWeekCompleted += countCompleted(logs[key]);
    });

    const thisWeekVsLastWeek =
      lastWeekCompleted > 0
        ? ((weekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100
        : weekCompleted > 0
          ? 100
          : 0;

    // =====================================================
    // MONTHLY DATA (current month)
    // =====================================================
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get the day of week for the first day of month (0 = Sunday, 1 = Monday, ...)
    const firstDayOfMonth = getDay(monthStart);
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    // Build calendar grid (6 weeks max)
    const monthGrid: MonthData[][] = [];
    let dayIndex = 0;

    for (let week = 0; week < 6; week++) {
      const weekRow: MonthData[] = [];

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const cellIndex = week * 7 + dayOfWeek;
        const dayNum = cellIndex - startOffset + 1;

        if (dayNum < 1 || dayNum > monthDays.length) {
          weekRow.push({
            dayNum: 0,
            isToday: false,
            isComplete: false,
            completed: 0,
            isFuture: false,
            isCurrentMonth: false,
          });
        } else {
          const date = monthDays[dayNum - 1];
          const key = getDateKey(date);
          const status = logs[key];

          weekRow.push({
            dayNum,
            isToday: isToday(date),
            isComplete: isComplete(status),
            completed: countCompleted(status),
            isFuture: isFuture(date),
            isCurrentMonth: true,
          });
        }
      }

      // Only add the week if it has at least one day from current month
      if (weekRow.some((d) => d.isCurrentMonth)) {
        monthGrid.push(weekRow);
      }
    }

    const monthName = format(today, "MMMM", { locale });
    const monthYear = today.getFullYear();

    let monthCompleted = 0;
    let perfectDaysThisMonth = 0;
    let daysWithData = 0;

    monthDays.forEach((day) => {
      if (!isFuture(day)) {
        const key = getDateKey(day);
        const status = logs[key];
        const completed = countCompleted(status);
        monthCompleted += completed;
        daysWithData++;
        if (isComplete(status)) {
          perfectDaysThisMonth++;
        }
      }
    });

    const monthTotal = daysWithData * 5;
    const monthPercentage =
      monthTotal > 0 ? (monthCompleted / monthTotal) * 100 : 0;

    // =====================================================
    // PRAYER BREAKDOWN
    // =====================================================
    const prayerCounts: Record<PrayerName, number> = {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    };

    Object.values(logs).forEach((status) => {
      if (status.fajr) prayerCounts.fajr++;
      if (status.dhuhr) prayerCounts.dhuhr++;
      if (status.asr) prayerCounts.asr++;
      if (status.maghrib) prayerCounts.maghrib++;
      if (status.isha) prayerCounts.isha++;
    });

    const prayerBreakdown: PrayerBreakdown[] = (
      ["fajr", "dhuhr", "asr", "maghrib", "isha"] as PrayerName[]
    ).map((name) => ({
      name,
      completed: prayerCounts[name],
      total: totalDays,
      percentage: totalDays > 0 ? (prayerCounts[name] / totalDays) * 100 : 0,
    }));

    return {
      currentStreak,
      bestStreak,
      totalPrayers,
      totalDays,
      averagePerDay,
      completionRate,
      weekData,
      weekTotal,
      weekCompleted,
      weekPercentage,
      monthData: monthGrid,
      monthName,
      monthYear,
      monthTotal,
      monthCompleted,
      monthPercentage,
      prayerBreakdown,
      thisWeekVsLastWeek,
      perfectDaysThisMonth,
    };
  }, [logs, locale]);
}

export default useStatistics;
