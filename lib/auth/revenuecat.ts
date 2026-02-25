import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// These should ideally be in .env
const REVENUECAT_API_KEY_IOS = 'goog_placeholder_ios'; // TODO: Replace with real key
const REVENUECAT_API_KEY_ANDROID = 'goog_placeholder_android'; // TODO: Replace with real key

export const ENTITLEMENT_ID = 'pro';

/**
 * Checks if the RevenueCat SDK is configured and the native module is available.
 * This is a safety check to prevent "no singleton instance" errors.
 */
const isReady = async (): Promise<boolean> => {
    try {
        // First check the internal JS-side configuration state if the SDK provides it
        // Some versions of react-native-purchases have isConfigured()
        const configured = await Purchases.isConfigured();
        return configured;
    } catch (e) {
        return false;
    }
};

export const initRevenueCat = async (userId: string) => {
    try {
        const apiKey = Platform.select({
            ios: REVENUECAT_API_KEY_IOS,
            android: REVENUECAT_API_KEY_ANDROID,
        });

        if (!apiKey || apiKey.includes('placeholder')) {
            console.warn('RevenueCat API key is missing or placeholder. Skipping initialization.');
            return;
        }

        // Configure only if not already configured
        if (!(await isReady())) {
            await Purchases.configure({ apiKey, appUserID: userId });
            console.log('RevenueCat configured successfully');
        }
    } catch (e) {
        console.error('Error configuring RevenueCat:', e);
    }
};

export const checkPremiumStatus = async (): Promise<boolean> => {
    if (!(await isReady())) {
        return false;
    }
    try {
        const purchaserInfo = await Purchases.getCustomerInfo();
        return purchaserInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e) {
        console.error('Error checking premium status:', e);
        return false;
    }
};

export const purchasePremium = async (): Promise<boolean> => {
    if (!(await isReady())) {
        throw new Error('RevenueCat is not configured. Please check your API keys and native environment.');
    }
    try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.monthly) {
            const { customerInfo } = await Purchases.purchasePackage(offerings.current.monthly);
            return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        }
        return false;
    } catch (e: any) {
        if (e.userCancelled) return false;
        console.error('Error purchasing premium:', e);
        throw e;
    }
};
