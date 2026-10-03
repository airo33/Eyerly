import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * True when running inside Expo Go, where native modules like RevenueCat are
 * unavailable. In that case we fall back to a local dev flag so the Pro-gating
 * UI can still be exercised.
 */
export const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// --- RevenueCat configuration (fill in before production build in October) ---
export const ENTITLEMENT_ID = 'pro';
// TODO: replace with real key from RevenueCat dashboard (Project > API keys).
export const REVENUECAT_IOS_API_KEY = 'appl_REPLACE_ME';

// Product identifiers as configured in App Store Connect + RevenueCat.
export const PRODUCT_IDS = {
  monthly: 'eyerly_pro_monthly', // $2.99 / month, 7-day free trial
  yearly: 'eyerly_pro_yearly', // $14.99 / year
} as const;

// Fallback prices shown when offerings can't be fetched (e.g. in Expo Go).
export const FALLBACK_PRICES = {
  monthly: '$2.99',
  yearly: '$14.99',
} as const;

const DEV_PRO_KEY = 'eyerly.devPro.v1';

// Lazily require the native module so importing this file never crashes Expo Go.
type PurchasesModule = typeof import('react-native-purchases').default;
let purchasesRef: PurchasesModule | null = null;

function getPurchases(): PurchasesModule | null {
  if (IS_EXPO_GO || Platform.OS === 'web') return null;
  if (!purchasesRef) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    purchasesRef = require('react-native-purchases').default;
  }
  return purchasesRef;
}

let configured = false;

export async function configurePurchases(): Promise<void> {
  const Purchases = getPurchases();
  if (!Purchases || configured) return;
  Purchases.configure({ apiKey: REVENUECAT_IOS_API_KEY });
  configured = true;
}

/** Whether the user currently has the Pro entitlement. */
export async function fetchIsPro(): Promise<boolean> {
  const Purchases = getPurchases();
  if (!Purchases) {
    // Expo Go dev fallback.
    const flag = await AsyncStorage.getItem(DEV_PRO_KEY);
    return flag === '1';
  }
  try {
    await configurePurchases();
    const info = await Purchases.getCustomerInfo();
    return typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch {
    return false;
  }
}

export type PlanId = keyof typeof PRODUCT_IDS;

/**
 * Attempt a purchase. Returns true if the user ends up Pro.
 * In Expo Go this flips the local dev flag instead of charging.
 */
export async function purchasePlan(plan: PlanId): Promise<boolean> {
  const Purchases = getPurchases();
  if (!Purchases) {
    await AsyncStorage.setItem(DEV_PRO_KEY, '1');
    return true;
  }
  try {
    await configurePurchases();
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return false;
    const pkg =
      plan === 'monthly' ? current.monthly : current.annual;
    if (!pkg) return false;
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return (
      typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
    );
  } catch (e: unknown) {
    // User cancellation is not an error worth surfacing.
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  const Purchases = getPurchases();
  if (!Purchases) {
    const flag = await AsyncStorage.getItem(DEV_PRO_KEY);
    return flag === '1';
  }
  try {
    await configurePurchases();
    const info = await Purchases.restorePurchases();
    return typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch {
    return false;
  }
}

/** Dev-only: reset the local Pro flag (Expo Go). */
export async function devResetPro(): Promise<void> {
  await AsyncStorage.removeItem(DEV_PRO_KEY);
}
