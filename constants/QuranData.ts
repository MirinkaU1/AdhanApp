// Local Quran Data for MaPrière App
// 100% Offline - No external APIs

export interface DailyVerse {
  id: string;
  surahName: string;
  surahNumber: number;
  surahId: string;
  ayahNumber: number;
  arabicText: string;
  frenchText: string;
  theme: string;
}

export interface Verse {
  number: number;
  textAr: string;
  textFr: string;
}

export interface EssentialSurah {
  id: string;
  nameAr: string;
  nameFr: string;
  surahNumber: number;
  verses: Verse[];
}

// Daily Verses - Short inspiring verses for the home screen
export const DAILY_VERSES: DailyVerse[] = [
  {
    id: "1",
    surahName: "Al-Baqarah",
    surahNumber: 2,
    surahId: "baqarah",
    ayahNumber: 45,
    arabicText: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ",
    frenchText: "Cherchez secours dans la patience et la prière. C'est une chose difficile, mais pas pour les humbles.",
    theme: "Patience & Prière",
  },
  {
    id: "2",
    surahName: "Al-Baqarah",
    surahNumber: 2,
    surahId: "baqarah",
    ayahNumber: 152,
    arabicText: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
    frenchText: "Rappelez-vous de Moi, Je me rappellerai de vous. Soyez reconnaissants envers Moi et ne M'infidélisez pas.",
    theme: "Gratitude & Souvenir",
  },
  {
    id: "3",
    surahName: "Al-Isra",
    surahNumber: 17,
    surahId: "isra",
    ayahNumber: 80,
    arabicText: "وَقُلْ جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ ۚ إِنَّ الْبَاطِلَ كَانَ زَهُوقًا",
    frenchText: "Dis: 'La vérité est venue et l'erreur a disparu. En vérité, l'erreur est destinée à disparaître.'",
    theme: "Vérité & Justice",
  },
  {
    id: "4",
    surahName: "Al-Furqan",
    surahNumber: 25,
    surahId: "furqan",
    ayahNumber: 70,
    arabicText: "إِلَّا مَن تَابَ وَآمَنَ وَعَمِلَ عَمَلًا صَالِحًا فَأُولَٰئِكَ يُبَدِّلُ اللَّهُ سَيِّئَاتِهِمْ حَسَنَاتٍ",
    frenchText: "Mais quiconque se repentit, croit et fit œuvre de bien, Allah changera ses mauvaises actions en bonnes.",
    theme: "Repentir & Pardon",
  },
  {
    id: "5",
    surahName: "Al-Sharh",
    surahNumber: 94,
    surahId: "sharh",
    ayahNumber: 5,
    arabicText: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    frenchText: "Car certes, avec la difficulté vient le soulagement.",
    theme: "Espoir & Soulagement",
  },
];

// Essential Surahs for Quests/Gamification
export const ESSENTIAL_SURAHS: EssentialSurah[] = [
  {
    id: "mulk",
    nameAr: "سورة الملك",
    nameFr: "Al-Mulk (La Royauté)",
    surahNumber: 67,
    verses: [
      {
        number: 1,
        textAr: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
        textFr: "Béni soit Celui dans la main de Qui est la royauté, et Qui est Omnipotent sur toute chose.",
      },
      {
        number: 2,
        textAr: "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ",
        textFr: "C'est Lui Qui a créé la mort et la vie pour vous éprouver afin de voir lequel de vous est le meilleur en actions. Et c'est Lui le Puissant, le Pardonneur.",
      },
      {
        number: 3,
        textAr: "الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ",
        textFr: "C'est Lui Qui a créé sept cieux superposés. Tu ne vois point de disproportion ni d'irrégularité dans la création du Tout Miséricordieux. Reporte ton regard. Y vois-tu une brèche quelconque ?",
      },
      {
        number: 4,
        textAr: "ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ",
        textFr: "Puis, reporte ton regard à deux reprises: le regard te reviendra déconfit et accablé.",
      },
      {
        number: 5,
        textAr: "وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِّلشَّيَاطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ",
        textFr: "Nous avons certes embelli le ciel le plus proche avec des lampes, et Nous en avons fait des projectiles contre les diables. Et Nous avons préparé pour eux le châtiment de la fournaise.",
      },
    ],
  },
  {
    id: "kahf",
    nameAr: "سورة الكهف",
    nameFr: "Al-Kahf (La Caverne)",
    surahNumber: 18,
    verses: [
      {
        number: 1,
        textAr: "الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا ۜ",
        textFr: "Louange à Allah Qui a fait descendre sur Son serviteur le Livre, et n'y a point mis de tortuosité.",
      },
      {
        number: 2,
        textAr: "قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا",
        textFr: "Droit, pour avertir d'une terrible punition venant de Lui, et pour annoncer aux croyants qui accomplissent les bonnes œuvres, qu'il y aura pour eut une belle récompense.",
      },
      {
        number: 3,
        textAr: "مَّاكِثِينَ فِيهِ أَبَدًا",
        textFr: "Ils y demeureront éternellement.",
      },
      {
        number: 4,
        textAr: "وَيُنذِرَ الَّذِينَ قَالُوا اتَّخَذَ اللَّهُ وَلَدًا",
        textFr: "Et pour avertir ceux qui disent: 'Allah S'est donné un enfant'.",
      },
      {
        number: 5,
        textAr: "مَّا لَهُم بِهِ مِنْ عِلْمٍ وَلَا لِآبَائِهِمْ ۚ كَبُرَتْ كَلِمَةً تَخْرُجُ مِنْ أَفْوَاهِهِمْ ۖ إِن يَقُولُونَ إِلَّا كَذِبًا",
        textFr: "Ils n'ont sur ce point aucune connaissance, eux ni leurs ancêtres. Quelle parole affreuse sort de leurs bouches ! Ils ne disent que mensonge.",
      },
    ],
  },
  {
    id: "sharh",
    nameAr: "سورة الشرح",
    nameFr: "Al-Sharh (Le Déblocage)",
    surahNumber: 94,
    verses: [
      {
        number: 1,
        textAr: "أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ",
        textFr: "N'avons-Nous pas ouvert pour toi ta poitrine ?",
      },
      {
        number: 2,
        textAr: "وَوَضَعْنَا عَنكَ وِزْرَكَ",
        textFr: "Et ne t'avons-Nous pas allégé ton fardeau",
      },
      {
        number: 3,
        textAr: "الَّذِي أَنقَضَ ظَهْرَكَ",
        textFr: "qui accablait ton dos ?",
      },
      {
        number: 4,
        textAr: "وَرَفَعْنَا لَكَ ذِكْرَكَ",
        textFr: "Et Nous avons élevé ton renom.",
      },
      {
        number: 5,
        textAr: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
        textFr: "Car certes, avec la difficulté vient le soulagement.",
      },
      {
        number: 6,
        textAr: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
        textFr: "Oui, certes, avec la difficulté vient le soulagement.",
      },
      {
        number: 7,
        textAr: "فَإِذَا فَرَغْتَ فَانصَبْ",
        textFr: "Quand tu seras dégagé, consacre-toi à l'œuvre",
      },
      {
        number: 8,
        textAr: "وَإِلَىٰ رَبِّكَ فَارْغَب",
        textFr: "Et tourne-toi avec amour vers ton Seigneur.",
      },
    ],
  },
];

// Helper function to get a daily verse based on the day of the year
export function getDailyVerseByDay(): DailyVerse {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % DAILY_VERSES.length;
  return DAILY_VERSES[index];
}

// Helper function to get a random daily verse
export function getRandomDailyVerse(): DailyVerse {
  const randomIndex = Math.floor(Math.random() * DAILY_VERSES.length);
  return DAILY_VERSES[randomIndex];
}

// Helper function to get a surah by ID
export function getSurahById(id: string): EssentialSurah | undefined {
  return ESSENTIAL_SURAHS.find((surah) => surah.id === id);
}
