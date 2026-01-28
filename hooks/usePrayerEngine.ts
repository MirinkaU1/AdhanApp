import { useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import {
  CalculationMethod,
  Coordinates,
  Madhab,
  Prayer,
  PrayerTimes,
} from "adhan";
import { useNetInfo } from "@react-native-community/netinfo";

import { useCurrentLocation, LocationData } from "@/hooks/useCurrentLocation";
import usePrayerStore, {
  CalculationMethodName,
  PrayerName,
  PrayerTimes as StoreTimes,
} from "@/stores/usePrayerStore";

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

const methodIdMap: Record<CalculationMethodName, number> = {
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

type HijriDate = {
  day: number;
  month: string;
  monthNumber: number;
  year: number;
  formatted: string;
};

type PrayerValue = (typeof Prayer)[keyof typeof Prayer];

type PrayerEngineResult = {
  location: LocationData | null;
  isLoadingLocation: boolean;
  locationError: string | null;
  hasPermission: boolean;
  isUsingDefaultLocation: boolean;
  times: StoreTimes | null;
  nextPrayer: PrayerName | null;
  nextPrayerTime: Date | null;
  hijriLocal: HijriDate | null;
  hijriRemote: HijriDate | null;
  hijriOffsetSuggestion: number | null;
  isOnline: boolean;
  refreshLocation: () => Promise<void>;
};

const getHijriDate = (date: Date): HijriDate => {
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

  const partsNumeric = formatterNumeric.formatToParts(date);
  const partsLong = formatterLong.formatToParts(date);

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
    formatted: formatterLong.format(date),
  };
};

const getPrayerName = (prayer: PrayerValue): PrayerName | null => {
  switch (prayer) {
    case Prayer.Fajr:
      return "fajr";
    case Prayer.Dhuhr:
      return "dhuhr";
    case Prayer.Asr:
      return "asr";
    case Prayer.Maghrib:
      return "maghrib";
    case Prayer.Isha:
      return "isha";
    default:
      return null;
  }
};

const parseHijriRemote = (payload: any): HijriDate | null => {
  const date = payload?.date?.hijri;
  const day = Number(date?.day ?? 0);
  const monthNumber = Number(date?.month?.number ?? 0);
  const month = date?.month?.en ?? date?.month?.ar ?? "";
  const year = Number(date?.year ?? 0);

  if (!day || !monthNumber || !year) {
    return null;
  }

  return {
    day,
    month,
    monthNumber,
    year,
    formatted: `${day} ${month} ${year}`,
  };
};

export const usePrayerEngine = (): PrayerEngineResult => {
  const {
    calculationMethod,
    hijriOffset,
    autoLocation,
    autoHijriSync,
    setHijriOffset,
  } = usePrayerStore();
  const netInfo = useNetInfo();
  const { location, isLoading, error, hasPermission, isUsingDefault, refresh } =
    useCurrentLocation({ enabled: autoLocation });
  const [remoteHijri, setRemoteHijri] = useState<HijriDate | null>(null);

  // Extraire les coords pour les calculs
  const coords = location?.coords ?? null;

  const timesResult = useMemo(() => {
    if (!coords) {
      return null;
    }

    const date = new Date();
    const params = methodFactory[calculationMethod]();
    params.madhab = Madhab.Shafi;

    const coordinates = new Coordinates(coords.latitude, coords.longitude);
    const prayerTimes = new PrayerTimes(coordinates, date, params);
    const nextPrayer = prayerTimes.nextPrayer();
    const nextPrayerName = getPrayerName(nextPrayer);

    return {
      times: {
        fajr: prayerTimes.fajr,
        dhuhr: prayerTimes.dhuhr,
        asr: prayerTimes.asr,
        maghrib: prayerTimes.maghrib,
        isha: prayerTimes.isha,
      },
      nextPrayer: nextPrayerName,
      nextPrayerTime: nextPrayerName
        ? prayerTimes.timeForPrayer(nextPrayer)
        : null,
    };
  }, [coords, calculationMethod]);

  const hijriLocal = useMemo(() => {
    const date = addDays(new Date(), hijriOffset);
    return getHijriDate(date);
  }, [hijriOffset]);

  const isOnline = Boolean(
    netInfo.isConnected && netInfo.isInternetReachable !== false,
  );

  useEffect(() => {
    if (!coords || !isOnline) {
      return;
    }

    const controller = new AbortController();
    const fetchRemote = async () => {
      try {
        const url = new URL("http://api.aladhan.com/v1/timings");
        url.searchParams.set("latitude", coords.latitude.toString());
        url.searchParams.set("longitude", coords.longitude.toString());
        url.searchParams.set(
          "method",
          methodIdMap[calculationMethod].toString(),
        );

        const response = await fetch(url.toString(), {
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }
        const json = await response.json();
        const hijri = parseHijriRemote(json?.data);
        setRemoteHijri(hijri);
      } catch (err) {
        if (!controller.signal.aborted) {
          setRemoteHijri(null);
        }
      }
    };

    fetchRemote();

    return () => controller.abort();
  }, [coords, isOnline, calculationMethod]);

  const hijriOffsetSuggestion = useMemo(() => {
    if (!hijriLocal || !remoteHijri) {
      return null;
    }

    if (
      hijriLocal.year !== remoteHijri.year ||
      hijriLocal.monthNumber !== remoteHijri.monthNumber
    ) {
      return null;
    }

    const diff = remoteHijri.day - hijriLocal.day;
    if (!diff) {
      return null;
    }

    return hijriOffset + diff;
  }, [hijriLocal, remoteHijri, hijriOffset]);

  useEffect(() => {
    if (autoHijriSync && hijriOffsetSuggestion !== null) {
      setHijriOffset(hijriOffsetSuggestion);
    }
  }, [autoHijriSync, hijriOffsetSuggestion, setHijriOffset]);

  return {
    location,
    isLoadingLocation: isLoading,
    locationError: error,
    hasPermission,
    isUsingDefaultLocation: isUsingDefault,
    times: timesResult?.times ?? null,
    nextPrayer: timesResult?.nextPrayer ?? null,
    nextPrayerTime: timesResult?.nextPrayerTime ?? null,
    hijriLocal,
    hijriRemote: remoteHijri,
    hijriOffsetSuggestion,
    isOnline,
    refreshLocation: refresh,
  };
};
