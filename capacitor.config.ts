import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.smartfinance.hub',
    appName: 'SmartFinance Hub',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
        // Para desenvolvimento local (ajustar IP):
        // url: 'http://192.168.1.5:5173',
        // cleartext: true,
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#030712',
            showSpinner: false,
            androidScaleType: 'CENTER_CROP',
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#030712',
        },
        Keyboard: {
            resize: 'body',
            style: 'DARK',
        },
    },
    android: {
        allowMixedContent: false,
        backgroundColor: '#030712',
    },
    ios: {
        backgroundColor: '#030712',
        contentInset: 'automatic',
    },
};

export default config;
