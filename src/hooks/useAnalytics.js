const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const isGAConfigured = GA_ID.length > 0;

// ========== INIT ==========
export function initAnalytics() {
    if (!isGAConfigured) {
        console.log('[Analytics] GA4 não configurado. Eventos serão logados no console.');
        return;
    }

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
        window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
        send_page_view: false,
    });
}

// ========== HELPER ==========
function track(eventName, params = {}) {
    if (isGAConfigured && window.gtag) {
        window.gtag('event', eventName, params);
    }
    // Sempre log em dev
    if (import.meta.env.DEV) {
        console.log(`[Analytics] ${eventName}`, params);
    }
}

// ========== PAGE VIEWS ==========
export function trackPageView(path, title) {
    track('page_view', { page_path: path, page_title: title });
}

// ========== CUSTOM EVENTS ==========
export const analytics = {
    // Auth
    signUp: (method = 'email') => track('sign_up', { method }),
    login: (method = 'email') => track('login', { method }),
    logout: () => track('logout'),

    // Import
    csvImportStarted: (rowCount) =>
        track('csv_import_started', {
            event_category: 'import',
            value: rowCount,
        }),
    csvImportCompleted: (rowCount, categorizedCount) =>
        track('csv_import_completed', {
            event_category: 'import',
            value: rowCount,
            custom_categorized: categorizedCount,
            custom_success_rate: Math.round((categorizedCount / rowCount) * 100),
        }),
    csvImportError: (errorMessage) =>
        track('csv_import_error', {
            event_category: 'import',
            event_label: errorMessage,
        }),

    // Transactions
    transactionCreated: (type, category) =>
        track('transaction_created', {
            event_category: 'transactions',
            event_label: type,
            custom_category: category,
        }),
    transactionEdited: (field) =>
        track('transaction_edited', {
            event_category: 'transactions',
            event_label: field,
        }),
    transactionDeleted: () =>
        track('transaction_deleted', { event_category: 'transactions' }),
    transactionFiltered: (filterType, filterValue) =>
        track('transaction_filtered', {
            event_category: 'transactions',
            event_label: `${filterType}:${filterValue}`,
        }),
    transactionSearched: (query) =>
        track('transaction_searched', {
            event_category: 'transactions',
            event_label: query.substring(0, 50),
        }),

    // Engagement
    featureUsed: (featureName) =>
        track('feature_used', {
            event_category: 'engagement',
            event_label: featureName,
        }),
    dashboardViewed: () =>
        track('dashboard_viewed', { event_category: 'engagement' }),

    // Conversion
    ctaClicked: (ctaName, location) =>
        track('cta_clicked', {
            event_category: 'conversion',
            event_label: ctaName,
            custom_location: location,
        }),
    waitlistJoined: () =>
        track('waitlist_joined', { event_category: 'conversion' }),
    planSelected: (planName) =>
        track('plan_selected', {
            event_category: 'conversion',
            event_label: planName,
        }),

    // Feedback
    npsFeedback: (score, comment = '') =>
        track('nps_feedback', {
            event_category: 'feedback',
            value: score,
            event_label: score <= 6 ? 'detractor' : score <= 8 ? 'passive' : 'promoter',
            custom_comment: comment.substring(0, 200),
        }),
};
