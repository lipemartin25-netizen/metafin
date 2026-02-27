import { useCallback } from 'react';
import { analytics } from './useAnalytics';

/**
 * Hook centralizado para eventos de analytics
 * Facilita tracking e evita código duplicado
 */
export function useAnalyticsEvent() {
    const trackFeature = useCallback((feature, metadata = {}) => {
        try {
            analytics.featureUsed(feature, {
                ...metadata,
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            console.warn('Analytics tracking failed:', err);
        }
    }, []);

    const trackError = useCallback((error, context = {}) => {
        try {
            analytics.error(error, {
                ...context,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
            });
        } catch (err) {
            console.warn('Analytics error tracking failed:', err);
        }
    }, []);

    const trackPageView = useCallback((page, title) => {
        try {
            analytics.pageView(page, title);
        } catch (err) {
            console.warn('Analytics page view failed:', err);
        }
    }, []);

    const trackConversion = useCallback((action, value = null) => {
        try {
            analytics.conversion(action, {
                value,
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            console.warn('Analytics conversion failed:', err);
        }
    }, []);

    return {
        trackFeature,
        trackError,
        trackPageView,
        trackConversion,
    };
}

export default useAnalyticsEvent;
