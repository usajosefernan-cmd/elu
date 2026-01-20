import { Capacitor } from '@capacitor/core';
import { useState, useEffect } from 'react';

export interface PlatformState {
    isNative: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isWeb: boolean;
    platform: string;
    isSimulated: boolean;
}

/**
 * Custom hook to detect the current running platform.
 * Used for "Adaptive Monolith" logic (switching between Web Admin and Mobile Camera UI).
 */
export const usePlatform = (): PlatformState => {
    // DEV OVERRIDE LOGIC
    const getOverride = () => {
        try {
            return localStorage.getItem('LUX_DEV_PLATFORM_OVERRIDE');
        } catch (e) { return null; }
    };

    const [platformState, setPlatformState] = useState<PlatformState>(() => {
        const override = getOverride();
        const currentPlatform = override || Capacitor.getPlatform();
        const isNative = override === 'native' || Capacitor.isNativePlatform();

        return {
            isNative,
            isIOS: currentPlatform === 'ios',
            isAndroid: currentPlatform === 'android',
            isWeb: !isNative,
            platform: currentPlatform,
            isSimulated: !!override
        };
    });

    useEffect(() => {
        // Listen for storage events to allow cross-tab or same-tab updates if we dispatch event
        const handleStorageChange = () => {
            const override = getOverride();
            const currentPlatform = override || Capacitor.getPlatform();
            const isNative = override === 'native' || Capacitor.isNativePlatform();

            setPlatformState({
                isNative,
                isIOS: currentPlatform === 'ios',
                isAndroid: currentPlatform === 'android',
                isWeb: !isNative,
                platform: currentPlatform,
                isSimulated: !!override
            });
        };

        window.addEventListener('storage', handleStorageChange);
        // Custom event for immediate update within same window
        window.addEventListener('lux-platform-change', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('lux-platform-change', handleStorageChange);
        };
    }, []);

    return platformState;
};
