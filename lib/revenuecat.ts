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
