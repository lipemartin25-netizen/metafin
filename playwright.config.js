// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 2,
    reporter: [
        ['html', { open: 'never' }],
        ['list'],
        process.env.CI ? ['github'] : ['line'],
    ],

    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',

        // Viewport padrão desktop
        viewport: { width: 1280, height: 720 },

        // Timeout por ação
        actionTimeout: 10000,
        navigationTimeout: 15000,
    },

    // Timeout global por teste
    timeout: 30000,

    // Rodar o dev server antes dos testes
    webServer: {
        command: 'npm run dev',
        port: 5173,
        timeout: 30000,
        reuseExistingServer: !process.env.CI,
    },

    projects: [
        // === AUTH SETUP (roda antes de tudo) ===
        {
            name: 'setup',
            testMatch: /.*\.setup\.js/,
        },

        // === DESKTOP CHROME ===
        {
            name: 'chrome-desktop',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'e2e/.auth/user.json',
            },
            dependencies: ['setup'],
        },

        // === MOBILE SAFARI ===
        {
            name: 'mobile-safari',
            use: {
                ...devices['iPhone 14'],
                storageState: 'e2e/.auth/user.json',
            },
            dependencies: ['setup'],
        },

        // === FIREFOX (CI only) ===
        ...(process.env.CI ? [{
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                storageState: 'e2e/.auth/user.json',
            },
            dependencies: ['setup'],
        }] : []),
    ],
});
