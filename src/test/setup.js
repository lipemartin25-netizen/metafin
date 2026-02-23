// src/test/setup.js
import '@testing-library/jest-dom'

// Polyfills para happy-dom (se necessário)
if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    }
}

if (typeof globalThis.matchMedia === 'undefined') {
    globalThis.matchMedia = () => ({
        matches: false,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
    })
}
