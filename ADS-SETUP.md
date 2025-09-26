# Google Analytics & AdSense Setup Guide

This guide explains how to configure Google Analytics and Google AdSense on FreeFormatHub with proper consent management.

## 🚀 Quick Setup

### 1. Google Analytics (Already Configured)

Your Google Analytics is already integrated:
- **Measurement ID**: G-34Z7YVSEZ2
- **Stream URL**: https://freeformathub.com/
- **Consent Mode**: Enabled with GDPR/CCPA compliance

### 2. Google AdSense Setup

#### A. Get AdSense Publisher ID
1. Apply for Google AdSense at [adsense.google.com](https://adsense.google.com)
2. Once approved, get your Publisher ID (format: `ca-pub-XXXXXXXXXX`)
3. Create ad units in AdSense dashboard and get slot IDs

#### B. Update Environment Variables ✅ COMPLETED
Your `.env` file is configured:
```bash
# Your actual AdSense Publisher ID
PUBLIC_ADSENSE_CLIENT_ID=pub-5745115058807126

# Replace with actual ad slot IDs from AdSense dashboard
PUBLIC_HEADER_AD_SLOT=1234567890
PUBLIC_SIDEBAR_AD_SLOT=2345678901
PUBLIC_CONTENT_AD_SLOT=3456789012
PUBLIC_FOOTER_AD_SLOT=4567890123

# Set to 'false' for production
PUBLIC_ADS_TEST_MODE=true
```

#### C. Verify Implementation ✅ COMPLETED
1. ✅ Build successful: `npm run build`
2. ✅ AdSense script loads conditionally with consent
3. ✅ Consent banner implemented and working
4. ✅ Ad placements integrated across all pages
5. ✅ Google Auto ads script properly configured

## 📊 Ad Placements

The implementation includes strategic ad placements:

### Header Banner (728x90)
- **Location**: Below site navigation
- **Component**: `<AdPlacement type="header" />`
- **Visibility**: All pages
- **Loading**: Immediate (above fold)

### Sidebar Ads (300x250)
- **Location**: Tool pages sidebar
- **Component**: `<AdPlacement type="sidebar" />`
- **Visibility**: Tool pages only
- **Loading**: Lazy loaded

### In-Content Ads (Responsive)
- **Location**: Between page sections
- **Component**: `<AdPlacement type="content" />`
- **Visibility**: Homepage and tool pages
- **Loading**: Lazy loaded

### Footer Banner (728x90)
- **Location**: Before footer links
- **Component**: `<AdPlacement type="footer" />`
- **Visibility**: All pages
- **Loading**: Lazy loaded

## 🔒 Privacy & Consent

### Consent Management
- **GDPR/CCPA Compliant**: Default deny all cookies
- **Google Consent Mode v2**: Implemented
- **Granular Control**: Separate analytics/marketing consent
- **Persistent**: User choices saved in localStorage

### Cookie Categories
1. **Necessary**: Always enabled (site functionality)
2. **Analytics**: Google Analytics (optional)
3. **Marketing**: Google AdSense (optional)

### User Rights
- View/change consent preferences anytime
- Clear browser data to reset
- Access privacy policy at `/privacy`
- Contact: privacy@freeformathub.com

## 🛠️ Technical Implementation

### File Structure
```
src/
├── components/
│   ├── ads/
│   │   ├── GoogleAd.tsx          # Main ad component
│   │   └── AdPlacement.astro     # Astro wrapper
│   └── CookieConsent.tsx         # Consent banner
├── lib/
│   └── consent.ts                # Consent management
├── layouts/
│   └── BaseLayout.astro          # GA4 + consent scripts
└── pages/
    ├── privacy.astro             # Privacy policy
    └── terms.astro               # Terms of service
```

### Key Features
- **Consent-Aware Ads**: Only load with marketing consent
- **Lazy Loading**: Ads load when scrolled into view
- **Responsive**: Adapts to screen size
- **Test Mode**: Safe testing without affecting metrics
- **Performance Optimized**: Minimal impact on Core Web Vitals

### Environment Variables
```bash
# Analytics (Already Set)
PUBLIC_GA_MEASUREMENT_ID=G-34Z7YVSEZ2

# AdSense (Update These)
PUBLIC_ADSENSE_CLIENT_ID=pub-PLACEHOLDER
PUBLIC_HEADER_AD_SLOT=HEADER_SLOT_ID
PUBLIC_SIDEBAR_AD_SLOT=SIDEBAR_SLOT_ID
PUBLIC_CONTENT_AD_SLOT=CONTENT_SLOT_ID
PUBLIC_FOOTER_AD_SLOT=FOOTER_SLOT_ID

# Testing
PUBLIC_ADS_TEST_MODE=true  # Set to false for production
```

## 🧪 Testing Checklist

Before going live:

### Cookie Consent Testing
- [ ] Banner appears on first visit
- [ ] "Accept All" enables analytics + marketing
- [ ] "Necessary Only" disables analytics + marketing
- [ ] "Customize" allows granular control
- [ ] Settings persist across page reloads
- [ ] Privacy policy links work

### Ad Loading Testing
- [ ] Ads only load with marketing consent
- [ ] Test ads appear (when `PUBLIC_ADS_TEST_MODE=true`)
- [ ] Lazy loading works (ads load on scroll)
- [ ] Responsive design works on mobile
- [ ] No JavaScript errors in console

### Analytics Testing
- [ ] Google Analytics only tracks with analytics consent
- [ ] Consent mode updates work correctly
- [ ] Conversion events respect consent state

### Performance Testing
- [ ] Lighthouse scores remain good (>90)
- [ ] Core Web Vitals not significantly impacted
- [ ] Page load times acceptable

## 📈 Monitoring & Optimization

### Key Metrics to Track
1. **Consent Rate**: % users accepting marketing cookies
2. **Ad Performance**: CTR, viewability, revenue
3. **Site Performance**: Core Web Vitals, load times
4. **User Experience**: Bounce rate, session duration

### Optimization Tips
1. **A/B Test Consent Banner**: Text, design, timing
2. **Ad Placement**: Monitor performance by location
3. **Load Strategy**: Balance revenue vs. performance
4. **Compliance**: Regular privacy policy updates

## 🔧 Troubleshooting

### Common Issues

**Ads Not Showing**
- Check console for errors
- Verify AdSense Publisher ID
- Ensure marketing consent is granted
- Check ad slot IDs match AdSense dashboard

**Consent Banner Not Working**
- Check browser localStorage access
- Verify no ad blockers interfering
- Test in incognito mode

**Analytics Not Tracking**
- Verify Measurement ID (G-34Z7YVSEZ2)
- Check analytics consent is granted
- Use Google Analytics DebugView

**Performance Issues**
- Enable lazy loading for below-fold ads
- Monitor Core Web Vitals
- Consider reducing ad density

### Support Contacts
- **Technical**: development@freeformathub.com
- **Privacy**: privacy@freeformathub.com
- **Legal**: legal@freeformathub.com

## 🎯 Next Steps

1. **AdSense Approval**: Apply and get Publisher ID
2. **Production Config**: Update environment variables
3. **Testing**: Run full test checklist
4. **Launch**: Deploy with monitoring
5. **Optimize**: A/B test and improve based on data

---

**Note**: This implementation maintains FreeFormatHub's privacy-first approach while enabling sustainable monetization through compliant advertising.