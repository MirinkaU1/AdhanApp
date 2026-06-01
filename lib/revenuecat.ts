import Purchases from 'react-native-purchases';

export const getRevenueCatApiKey = () =>
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';

let isConfigured = false;

export const initRevenueCat = () => {
  const apiKey = getRevenueCatApiKey();

  if (!apiKey || isConfigured) {
    return { isReady: !!apiKey };
  }

  Purchases.setLogLevel(Purchases.LOG_LEVEL.INFO);
  Purchases.configure({ apiKey });
  isConfigured = true;

  return { isReady: true };
};

// Lier l'utilisateur RevenueCat à l'UUID Supabase. Indispensable pour que
// le webhook serveur sache à quel user_id Supabase rattacher l'achat
// (sinon RC utilise un $RCAnonymousID:... aléatoire).
export const loginRevenueCat = async (userId: string) => {
  try {
    if (!isConfigured) initRevenueCat();
    if (!isConfigured) return;
    await Purchases.logIn(userId);
  } catch (error) {
    console.warn('[RevenueCat] logIn error:', error);
  }
};

export const logoutRevenueCat = async () => {
  if (!isConfigured) return;
  try {
    await Purchases.logOut();
  } catch (error) {
    // logOut() throws si l'user est déjà anonyme — on ignore
    console.log('[RevenueCat] logOut (ok if already anonymous):', error);
  }
};
