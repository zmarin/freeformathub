export interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export interface GoogleConsentMode {
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  analytics_storage: 'granted' | 'denied';
}

const CONSENT_STORAGE_KEY = 'freeformathub_consent';
const CONSENT_VERSION = '1.0';

// Default consent state - GDPR compliant (deny all except necessary)
export const DEFAULT_CONSENT: ConsentState = {
  necessary: true, // Always true - required for site functionality
  analytics: false,
  marketing: false,
  timestamp: Date.now()
};

export class ConsentManager {
  private static instance: ConsentManager;
  private consentState: ConsentState = DEFAULT_CONSENT;
  private listeners: ((state: ConsentState) => void)[] = [];

  private constructor() {
    this.loadConsent();
  }

  public static getInstance(): ConsentManager {
    if (!ConsentManager.instance) {
      ConsentManager.instance = new ConsentManager();
    }
    return ConsentManager.instance;
  }

  public getConsent(): ConsentState {
    return { ...this.consentState };
  }

  public updateConsent(updates: Partial<ConsentState>): void {
    this.consentState = {
      ...this.consentState,
      ...updates,
      necessary: true, // Always keep necessary cookies enabled
      timestamp: Date.now()
    };

    this.saveConsent();
    this.updateGoogleConsent();
    this.notifyListeners();
  }

  public hasConsent(type: keyof ConsentState): boolean {
    return this.consentState[type];
  }

  public hasConsentForAnalytics(): boolean {
    return this.consentState.analytics;
  }

  public hasConsentForMarketing(): boolean {
    return this.consentState.marketing;
  }

  public isConsentGiven(): boolean {
    // Check if user has made a consent decision (not using defaults)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }

    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored !== null;
  }

  public addListener(callback: (state: ConsentState) => void): void {
    this.listeners.push(callback);
  }

  public removeListener(callback: (state: ConsentState) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private loadConsent(): void {
    // Only access localStorage in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.consentState = DEFAULT_CONSENT;
      return;
    }

    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === CONSENT_VERSION) {
          this.consentState = {
            ...DEFAULT_CONSENT,
            ...parsed.state,
            necessary: true // Always enforce necessary cookies
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load consent preferences:', error);
      this.consentState = DEFAULT_CONSENT;
    }
  }

  private saveConsent(): void {
    // Only access localStorage in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const data = {
        version: CONSENT_VERSION,
        state: this.consentState
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save consent preferences:', error);
    }
  }

  private updateGoogleConsent(): void {
    if (typeof window !== 'undefined' && window.gtag) {
      const consentMode: GoogleConsentMode = {
        ad_storage: this.consentState.marketing ? 'granted' : 'denied',
        ad_user_data: this.consentState.marketing ? 'granted' : 'denied',
        ad_personalization: this.consentState.marketing ? 'granted' : 'denied',
        analytics_storage: this.consentState.analytics ? 'granted' : 'denied'
      };

      window.gtag('consent', 'update', consentMode);

      // Emit consent change event for AdSense Auto ads
      const consentEvent = new CustomEvent('consentChanged', {
        detail: {
          marketing: this.consentState.marketing,
          analytics: this.consentState.analytics
        }
      });
      window.dispatchEvent(consentEvent);

      // Load AdSense if marketing consent is granted (fallback)
      if (this.consentState.marketing && !window.adsbygoogle) {
        this.loadAdSense();
      }
    }
  }

  private loadAdSense(): void {
    if (typeof window !== 'undefined' && !window.adsbygoogle) {
      // This is a fallback - primary AdSense loading happens in BaseLayout.astro
      console.log('AdSense loading handled by BaseLayout');
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.getConsent());
      } catch (error) {
        console.warn('Consent listener error:', error);
      }
    });
  }

  // Utility method to reset consent (for testing or user request)
  public resetConsent(): void {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    this.consentState = DEFAULT_CONSENT;
    this.updateGoogleConsent();
    this.notifyListeners();
  }
}

// Global consent manager instance
export const consentManager = ConsentManager.getInstance();

// Helper functions for easy access
export const getConsent = () => consentManager.getConsent();
export const hasConsent = (type: keyof ConsentState) => consentManager.hasConsent(type);
export const updateConsent = (updates: Partial<ConsentState>) => consentManager.updateConsent(updates);
export const hasConsentForAnalytics = () => consentManager.hasConsentForAnalytics();
export const hasConsentForMarketing = () => consentManager.hasConsentForMarketing();
export const isConsentGiven = () => consentManager.isConsentGiven();

// Declare global gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    adsbygoogle: any[];
  }
}