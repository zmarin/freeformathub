import { useState, useEffect, useCallback } from 'react';
import { consentManager, type ConsentState, isConsentGiven } from '../lib/consent';

interface CookieConsentProps {
  className?: string;
}

export function CookieConsent({ className = '' }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consentState, setConsentState] = useState<ConsentState>(consentManager.getConsent());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Prevent hydration mismatch by checking if we're in browser
    if (typeof window === 'undefined') return;

    // Mark as hydrated
    setIsHydrated(true);

    // Show banner if consent hasn't been given
    const shouldShow = !isConsentGiven();
    console.log('🍪 Cookie consent check - should show banner:', shouldShow);
    setIsVisible(shouldShow);

    // Listen for consent changes
    const handleConsentChange = (state: ConsentState) => {
      setConsentState(state);
    };

    consentManager.addListener(handleConsentChange);

    return () => {
      consentManager.removeListener(handleConsentChange);
    };
  }, []);

  const handleAcceptAll = useCallback(() => {
    consentManager.updateConsent({
      analytics: true,
      marketing: true
    });
    setIsVisible(false);
  }, []);

  const handleAcceptNecessary = useCallback(() => {
    consentManager.updateConsent({
      analytics: false,
      marketing: false
    });
    setIsVisible(false);
  }, []);

  const handleCustomizeConsent = useCallback(() => {
    consentManager.updateConsent({
      analytics: consentState.analytics,
      marketing: consentState.marketing
    });
    setIsVisible(false);
  }, [consentState]);

  const handleToggleAnalytics = useCallback(() => {
    setConsentState(prev => ({
      ...prev,
      analytics: !prev.analytics
    }));
  }, []);

  const handleToggleMarketing = useCallback(() => {
    setConsentState(prev => ({
      ...prev,
      marketing: !prev.marketing
    }));
  }, []);

  // Don't render anything on server or until hydrated to prevent hydration mismatch
  if (!isHydrated || !isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-x-0 bottom-0 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {!showDetails ? (
            // Simple consent banner
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  🍪 We use cookies
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                  We use cookies to improve your experience, analyze site usage, and serve personalized ads.
                  You can choose which types of cookies to accept.{' '}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                    Learn more
                  </a>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
                <button
                  onClick={() => setShowDetails(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                           bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                           rounded-md transition-colors"
                >
                  Customize
                </button>
                <button
                  onClick={handleAcceptNecessary}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                           bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                           rounded-md transition-colors"
                >
                  Necessary only
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm font-medium text-white
                           bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
                >
                  Accept all
                </button>
              </div>
            </div>
          ) : (
            // Detailed consent preferences
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Cookie Preferences
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Close detailed settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        Necessary Cookies
                      </h4>
                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200
                                     px-2 py-1 rounded-full">
                        Always Active
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Required for basic site functionality, user preferences, and security.
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Analytics Cookies
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Help us understand how visitors use our site to improve user experience.
                      Uses Google Analytics.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={handleToggleAnalytics}
                      className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                        consentState.analytics
                          ? 'bg-blue-500 justify-end'
                          : 'bg-gray-300 dark:bg-gray-600 justify-start'
                      }`}
                      aria-label={`${consentState.analytics ? 'Disable' : 'Enable'} analytics cookies`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full mx-1"></div>
                    </button>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Marketing Cookies
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Used to display relevant advertisements and measure ad performance.
                      Uses Google AdSense.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={handleToggleMarketing}
                      className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                        consentState.marketing
                          ? 'bg-blue-500 justify-end'
                          : 'bg-gray-300 dark:bg-gray-600 justify-start'
                      }`}
                      aria-label={`${consentState.marketing ? 'Disable' : 'Enable'} marketing cookies`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full mx-1"></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You can change these settings anytime in your browser or on our{' '}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                    privacy page
                  </a>.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAcceptNecessary}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                             bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600
                             rounded-md transition-colors"
                  >
                    Necessary only
                  </button>
                  <button
                    onClick={handleCustomizeConsent}
                    className="px-4 py-2 text-sm font-medium text-white
                             bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
                  >
                    Save preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;