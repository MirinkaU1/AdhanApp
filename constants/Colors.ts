// Couleurs principales de l'application MaPrière
export const primary = '#D97706'; // Gold/Amber
export const tealBase = '#115E59'; // Petrol teal
export const tealDark = '#0f4c5c'; // Deep petrol blue

const tintColorLight = primary;
const tintColorDark = primary;

export default {
  light: {
    text: '#1E293B',
    background: '#F3F4F6',
    card: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    header: tealBase,
  },
  dark: {
    text: '#F1F5F9',
    background: '#0F172A',
    card: '#1E293B',
    tint: tintColorDark,
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    header: tealDark,
  },
};
