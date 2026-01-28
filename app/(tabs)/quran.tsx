import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import useThemeStore from '@/stores/useThemeStore';

const SURAHS = [
  { number: 1, name: 'Al-Fatiha', arabicName: 'الفاتحة', verses: 7 },
  { number: 2, name: 'Al-Baqarah', arabicName: 'البقرة', verses: 286 },
  { number: 3, name: 'Ali \'Imran', arabicName: 'آل عمران', verses: 200 },
  { number: 36, name: 'Ya-Sin', arabicName: 'يس', verses: 83 },
  { number: 55, name: 'Ar-Rahman', arabicName: 'الرحمن', verses: 78 },
  { number: 67, name: 'Al-Mulk', arabicName: 'الملك', verses: 30 },
  { number: 112, name: 'Al-Ikhlas', arabicName: 'الإخلاص', verses: 4 },
  { number: 113, name: 'Al-Falaq', arabicName: 'الفلق', verses: 5 },
  { number: 114, name: 'An-Nas', arabicName: 'الناس', verses: 6 },
];

export default function QuranScreen() {
  const systemColorScheme = useColorScheme();
  const { mode: themeMode } = useThemeStore();
  
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  const bgColor = isDark ? '#0f172a' : '#f1f5f9';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textPrimary = isDark ? '#f8fafc' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={{ fontSize: 28, fontWeight: '700', color: textPrimary }}>
          Al-Quran
        </Text>
        <Text style={{ fontSize: 14, color: textSecondary, marginTop: 8 }}>
          Lisez et méditez le Saint Coran
        </Text>

        {/* Continuer la lecture */}
        <View style={{ marginTop: 24, backgroundColor: '#0f766e', borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
            <Ionicons name="book" size={120} color="#ffffff" />
          </View>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Continuer la lecture
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#ffffff', marginTop: 8 }}>
            Sourate Al-Baqarah
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            Verset 142 sur 286
          </Text>
          <Pressable style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="play" size={16} color="#ffffff" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>Reprendre</Text>
          </Pressable>
        </View>

        {/* Sourates populaires */}
        <Text style={{ fontSize: 18, fontWeight: '600', color: textPrimary, marginTop: 32, marginBottom: 16 }}>
          Sourates populaires
        </Text>

        <View style={{ gap: 12 }}>
          {SURAHS.map((surah) => (
            <Pressable
              key={surah.number}
              style={{
                backgroundColor: cardBg,
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: isDark ? '#334155' : '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f766e' }}>{surah.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: textPrimary }}>{surah.name}</Text>
                <Text style={{ fontSize: 12, color: textSecondary, marginTop: 2 }}>{surah.verses} versets</Text>
              </View>
              <Text style={{ fontSize: 18, color: textSecondary, fontFamily: 'System' }}>{surah.arabicName}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
