import { useEffect, useRef, useState } from 'react';
import { hasConsentForMarketing, consentManager } from '../../lib/consent';

export interface GoogleAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal' | 'fluid';
  adStyle?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
  lazy?: boolean;
  testMode?: boolean;
}

interface AdSenseWindow extends Window {
  adsbygoogle: any[];
}

declare let window: AdSenseWindow;

export function GoogleAd({
  adSlot,
  adFormat = 'auto',
  adStyle,
  className = '',
  responsive = true,
  lazy = false,
  testMode = false
}: GoogleAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [hasConsent, setHasConsent] = useState(hasConsentForMarketing());
  const [isVisible, setIsVisible] = useState(!lazy);
  const [adLoaded, setAdLoaded] = useState(false);

  // Listen for consent changes
  useEffect(() => {
    const handleConsentChange = () => {
      setHasConsent(hasConsentForMarketing());
    };

    consentManager.addListener(handleConsentChange);
    return () => {
      consentManager.removeListener(handleConsentChange);
    };
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isVisible]);

  // Load and display ad when consent and visibility conditions are met
  useEffect(() => {
    if (!hasConsent || !isVisible || adLoaded) return;

    const loadAd = async () => {
      try {
        // Ensure AdSense script is loaded
        if (typeof window !== 'undefined') {
          if (!window.adsbygoogle) {
            // Load AdSense script if not already loaded
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${import.meta.env.PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-PLACEHOLDER'}`;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);

            // Initialize adsbygoogle array
            window.adsbygoogle = window.adsbygoogle || [];

            // Wait for script to load
            await new Promise((resolve) => {
              script.onload = resolve;
            });
          }

          // Push ad to Google AdSense
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setAdLoaded(true);
          } catch (adError) {
            console.warn('AdSense push error:', adError);
          }
        }
      } catch (error) {
        console.warn('Failed to load Google AdSense:', error);
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(loadAd, 100);
    return () => clearTimeout(timeoutId);
  }, [hasConsent, isVisible, adLoaded]);

  // Don't render anything if no consent
  if (!hasConsent) {
    return null;
  }

  // Show placeholder while loading
  if (!isVisible) {
    return (
      <div
        ref={adRef}
        className={`bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm ${className}`}
        style={adStyle}
      >
        {lazy ? 'Ad loading...' : ''}
      </div>
    );
  }

  // Determine responsive style based on ad format
  const getAdStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'block',
      ...adStyle
    };

    if (!responsive) return baseStyle;

    switch (adFormat) {
      case 'rectangle':
        return { ...baseStyle, width: '300px', height: '250px' };
      case 'horizontal':
        return { ...baseStyle, width: '728px', height: '90px' };
      case 'vertical':
        return { ...baseStyle, width: '160px', height: '600px' };
      case 'fluid':
        return { ...baseStyle, width: '100%', height: 'auto' };
      default:
        return { ...baseStyle, width: '100%', height: 'auto' };
    }
  };

  return (
    <div className={`ad-container ${className}`} ref={adRef}>
      {/* Ad label for transparency */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-center">
        Advertisement
      </div>

      <ins
        className="adsbygoogle"
        style={getAdStyle()}
        data-ad-client={import.meta.env.PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-PLACEHOLDER'}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-ad-test={testMode ? 'on' : undefined}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}

// Predefined ad components for common use cases
export function HeaderBannerAd({ className = '', ...props }: Omit<GoogleAdProps, 'adFormat' | 'adSlot'>) {
  return (
    <GoogleAd
      adSlot={import.meta.env.PUBLIC_HEADER_AD_SLOT || 'HEADER_SLOT_ID'}
      adFormat="horizontal"
      className={`max-w-screen-lg mx-auto ${className}`}
      testMode={import.meta.env.PUBLIC_ADS_TEST_MODE === 'true'}
      {...props}
    />
  );
}

export function SidebarAd({ className = '', ...props }: Omit<GoogleAdProps, 'adFormat' | 'adSlot'>) {
  return (
    <GoogleAd
      adSlot={import.meta.env.PUBLIC_SIDEBAR_AD_SLOT || 'SIDEBAR_SLOT_ID'}
      adFormat="rectangle"
      className={`sticky top-4 ${className}`}
      lazy={true}
      testMode={import.meta.env.PUBLIC_ADS_TEST_MODE === 'true'}
      {...props}
    />
  );
}

export function InContentAd({ className = '', ...props }: Omit<GoogleAdProps, 'adFormat' | 'adSlot'>) {
  return (
    <GoogleAd
      adSlot={import.meta.env.PUBLIC_CONTENT_AD_SLOT || 'CONTENT_SLOT_ID'}
      adFormat="auto"
      className={`my-8 ${className}`}
      lazy={true}
      testMode={import.meta.env.PUBLIC_ADS_TEST_MODE === 'true'}
      {...props}
    />
  );
}

export function FooterAd({ className = '', ...props }: Omit<GoogleAdProps, 'adFormat' | 'adSlot'>) {
  return (
    <GoogleAd
      adSlot={import.meta.env.PUBLIC_FOOTER_AD_SLOT || 'FOOTER_SLOT_ID'}
      adFormat="horizontal"
      className={`max-w-screen-lg mx-auto ${className}`}
      lazy={true}
      testMode={import.meta.env.PUBLIC_ADS_TEST_MODE === 'true'}
      {...props}
    />
  );
}

export default GoogleAd;