/**
 * Prayer Engine - Hybrid calculation (Offline + Online)
 *
 * STEP A: Local calculation using adhan library (instant, offline)
 * STEP B: API sync using aladhan for Hijri dates (async, online)
 */

import {
  CalculationMethod,
  Coordinates,
  Madhab,
  Prayer,
  PrayerTimes,
  Qibla,
} from "adhan";
import { differenceInMinutes } from "date-fns";
import {
  CalculationMethodName,
  PrayerName,
  PrayerTimes as StoreTimes,
  NextPrayerInfo,
} from "@/stores/usePrayerStore";

// =====================================================
// TYPES
// =====================================================

export type CoordinatesInput = {
  latitude: number;
  longitude: number;
};

export type HijriDate = {
  day: number;
  month: string;
  monthNumber: number;
  year: number;
  formatted: string;
};

export type PrayerCalculationResult = {
  times: StoreTimes;
  nextPrayer: NextPrayerInfo | null;
  qiblaBearing: number;
};

export type AladhanResponse = {
  hijriDate: HijriDate;
  timings?: {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
  };
};

// =====================================================
// CALCULATION METHOD MAPPING
// =====================================================

const methodFactory: Record<
  CalculationMethodName,
  () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>
> = {
  muslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  egyptian: CalculationMethod.Egyptian,
  karachi: CalculationMethod.Karachi,
  northAmerica: CalculationMethod.NorthAmerica,
  ummAlQura: CalculationMethod.UmmAlQura,
  qatar: CalculationMethod.Qatar,
  kuwait: CalculationMethod.Kuwait,
  dubai: CalculationMethod.Dubai,
  singapore: CalculationMethod.Singapore,
  tehran: CalculationMethod.Tehran,
  turkey: CalculationMethod.Turkey,
  moonsightingCommittee: CalculationMethod.MoonsightingCommittee,
};

// Aladhan API method IDs
export const methodIdMap: Record<CalculationMethodName, number> = {
  muslimWorldLeague: 3,
  egyptian: 5,
  karachi: 1,
  northAmerica: 2,
  ummAlQura: 4,
  qatar: 8,
  kuwait: 7,
  dubai: 12,
  singapore: 9,
  tehran: 10,
  turkey: 11,
  moonsightingCommittee: 0,
};

// =====================================================
// STEP A: LOCAL CALCULATION (adhan library)
// =====================================================

/**
 * Calculate prayer times locally using adhan library
 * This is instant and works offline
 */
export function calculatePrayerTimes(
  coords: CoordinatesInput,
  date: Date = new Date(),
  method: CalculationMethodName = "muslimWorldLeague",
  madhab: "shafi" | "hanafi" = "shafi",
): PrayerCalculationResult {
  const params = methodFactory[method]();
  params.madhab = madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;

  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  const prayerTimes = new PrayerTimes(coordinates, date, params);

  const times: StoreTimes = {
    fajr: prayerTimes.fajr,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
  };

  // Calculate next prayer
  const nextPrayer = getNextPrayer(times, date);

  // Calculate Qibla bearing
  const qiblaBearing = Qibla(coordinates);

  return { times, nextPrayer, qiblaBearing };
}

/**
 * Get the next prayer from calculated times
 */
function getNextPrayer(
  times: StoreTimes,
  now: Date = new Date(),
): NextPrayerInfo | null {
  const prayerOrder: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

  for (const name of prayerOrder) {
    const time = times[name];
    if (time > now) {
      const remainingMinutes = differenceInMinutes(time, now);
      return { name, time, remainingMinutes };
    }
  }

  // All prayers passed, next is Fajr tomorrow (approximate)
  const tomorrowFajr = new Date(times.fajr);
  tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
  const remainingMinutes = differenceInMinutes(tomorrowFajr, now);

  return { name: "fajr", time: tomorrowFajr, remainingMinutes };
}

/**
 * Get local Hijri date using Intl API
 */
export function getLocalHijriDate(
  date: Date = new Date(),
  offset: number = 0,
): HijriDate {
  const adjustedDate = new Date(date);
  adjustedDate.setDate(adjustedDate.getDate() + offset);

  const formatterLong = new Intl.DateTimeFormat("fr-FR-u-ca-islamic", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formatterNumeric = new Intl.DateTimeFormat("fr-FR-u-ca-islamic", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  const partsNumeric = formatterNumeric.formatToParts(adjustedDate);
  const partsLong = formatterLong.formatToParts(adjustedDate);

  const day = Number(
    partsNumeric.find((part) => part.type === "day")?.value ?? "0",
  );
  const monthNumber = Number(
    partsNumeric.find((part) => part.type === "month")?.value ?? "0",
  );
  const year = Number(
    partsNumeric.find((part) => part.type === "year")?.value ?? "0",
  );
  const month = partsLong.find((part) => part.type === "month")?.value ?? "";

  return {
    day,
    month,
    monthNumber,
    year,
    formatted: formatterLong.format(adjustedDate),
  };
}

// =====================================================
// STEP B: API SYNC (aladhan)
// =====================================================

/**
 * Fetch prayer times and Hijri date from Aladhan API
 * Use this to get accurate Hijri dates and validate local calculations
 */
export async function fetchAladhanData(
  coords: CoordinatesInput,
  method: CalculationMethodName = "muslimWorldLeague",
  signal?: AbortSignal,
): Promise<AladhanResponse | null> {
  try {
    const url = new URL("https://api.aladhan.com/v1/timings");
    url.searchParams.set("latitude", coords.latitude.toString());
    url.searchParams.set("longitude", coords.longitude.toString());
    url.searchParams.set("method", methodIdMap[method].toString());

    const response = await fetch(url.toString(), { signal });

    if (!response.ok) {
      console.warn("[PrayerEngine] Aladhan API error:", response.status);
      return null;
    }

    const json = await response.json();
    const data = json?.data;

    if (!data) {
      return null;
    }

    // Parse Hijri date
    const hijriData = data.date?.hijri;
    const hijriDate: HijriDate = {
      day: Number(hijriData?.day ?? 0),
      month: hijriData?.month?.en ?? hijriData?.month?.ar ?? "",
      monthNumber: Number(hijriData?.month?.number ?? 0),
      year: Number(hijriData?.year ?? 0),
      formatted: `${hijriData?.day} ${hijriData?.month?.en ?? ""} ${hijriData?.year}`,
    };

    // Parse timings (optional, for comparison)
    const timings = data.timings;

    return { hijriDate, timings };
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      console.warn("[PrayerEngine] Failed to fetch Aladhan data:", err);
    }
    return null;
  }
}

/**
 * Calculate suggested Hijri offset based on API response
 */
export function calculateHijriOffset(
  localHijri: HijriDate,
  remoteHijri: HijriDate,
  currentOffset: number,
): number | null {
  // Only compare if same month/year
  if (
    localHijri.year !== remoteHijri.year ||
    localHijri.monthNumber !== remoteHijri.monthNumber
  ) {
    return null;
  }

  const diff = remoteHijri.day - localHijri.day;
  if (diff === 0) {
    return null; // No adjustment needed
  }

  return currentOffset + diff;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get prayer name in French
 */
export function getPrayerLabel(
  name: PrayerName,
  locale: "fr" | "en" = "fr",
): string {
  const labels: Record<PrayerName, { fr: string; en: string }> = {
    fajr: { fr: "Fajr", en: "Fajr" },
    dhuhr: { fr: "Dhuhr", en: "Dhuhr" },
    asr: { fr: "Asr", en: "Asr" },
    maghrib: { fr: "Maghrib", en: "Maghrib" },
    isha: { fr: "Isha", en: "Isha" },
  };
  return labels[name][locale];
}

/**
 * Format remaining time in a human-readable way
 */
export function formatRemainingTime(
  minutes: number,
  locale: "fr" | "en" = "fr",
): string {
  if (minutes < 0) {
    return locale === "fr" ? "Maintenant" : "Now";
  }

  if (minutes < 60) {
    return locale === "fr" ? `${minutes} min` : `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return locale === "fr" ? `${hours}h` : `${hours}h`;
  }

  return locale === "fr" ? `${hours}h ${mins}min` : `${hours}h ${mins}min`;
}
