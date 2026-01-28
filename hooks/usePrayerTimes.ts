import { useMemo } from "react";
import {
  CalculationMethod,
  Coordinates,
  Madhab,
  Prayer,
  PrayerTimes,
} from "adhan";

export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type PrayerTimesMap = Record<PrayerName, Date>;

export type CalculationMethodName =
  | "muslimWorldLeague"
  | "egyptian"
  | "karachi"
  | "northAmerica"
  | "ummAlQura"
  | "qatar"
  | "kuwait"
  | "dubai"
  | "singapore"
  | "tehran"
  | "turkey"
  | "moonsightingCommittee";

export type MadhabName = "shafi" | "hanafi";

type UsePrayerTimesOptions = {
  method?: CalculationMethodName;
  madhab?: MadhabName;
};

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

const prayerNameByAdhan = (
  prayer: (typeof Prayer)[keyof typeof Prayer],
): PrayerName | null => {
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

export type PrayerTimesResult = {
  date: Date;
  times: PrayerTimesMap;
  nextPrayer: PrayerName | null;
  nextPrayerTime: Date | null;
};

export function usePrayerTimes(
  coords: { latitude: number; longitude: number } | null,
  options: UsePrayerTimesOptions = {},
): PrayerTimesResult | null {
  return useMemo(() => {
    if (!coords) {
      return null;
    }

    const date = new Date();
    const paramsFactory = methodFactory[options.method ?? "muslimWorldLeague"];
    const params = paramsFactory();
    params.madhab = options.madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;

    const coordinates = new Coordinates(coords.latitude, coords.longitude);
    const prayerTimes = new PrayerTimes(coordinates, date, params);
    const nextPrayer = prayerTimes.nextPrayer();
    const nextPrayerName = prayerNameByAdhan(nextPrayer);

    return {
      date,
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
  }, [coords?.latitude, coords?.longitude, options.method, options.madhab]);
}
