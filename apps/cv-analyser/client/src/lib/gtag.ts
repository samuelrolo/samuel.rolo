interface GtagWindow extends Window {
  dataLayer: any[];
  gtag: (...args: any[]) => void;
  fbq: (...args: any[]) => void;
}

declare const window: GtagWindow;

// Google Ads conversion tracking
export const sendConversion = (value: number, currency: string, transaction_id: string) => {
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'conversion',
      send_to: 'AW-17015553005/9nRUCPa9l_AbEO330rE_',
      value,
      currency,
      transaction_id,
    });
  }
};

// GA4 custom event tracking
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
    if (window.dataLayer) {
      window.dataLayer.push({ event: eventName, ...params });
    }
  } catch (e) { /* silent */ }
};

// Meta Pixel event tracking
export const trackFBEvent = (eventName: string, params?: Record<string, any>) => {
  try {
    if (typeof window.fbq === 'function') {
      window.fbq('track', eventName, params);
    }
  } catch (e) { /* silent */ }
};

// Predefined funnel events
export const trackCVUpload = () => {
  trackEvent('cv_upload', { event_category: 'engagement' });
  trackFBEvent('InitiateCheckout');
};

type AnalysisTrackingType =
  | 'cv_analyser'
  | 'cv_analyser_linkedin'
  | 'career_path'
  | 'career_intelligence_full';

export const trackAnalysisStart = (type: AnalysisTrackingType) => {
  trackEvent('analysis_start', { event_category: 'engagement', analysis_type: type });
};

export const trackAnalysisComplete = (type: AnalysisTrackingType, score?: number) => {
  trackEvent('analysis_complete', { event_category: 'engagement', analysis_type: type, score });
  trackFBEvent('ViewContent', { content_name: type, value: score });
};

export const trackPaymentStart = (product: string, value: number) => {
  trackEvent('begin_checkout', { event_category: 'ecommerce', items: [{ item_name: product }], value, currency: 'EUR' });
  trackFBEvent('InitiateCheckout', { value, currency: 'EUR', content_name: product });
};

export const trackPurchase = (product: string, value: number, transactionId: string) => {
  sendConversion(value, 'EUR', transactionId);
  trackEvent('purchase', { event_category: 'ecommerce', items: [{ item_name: product }], value, currency: 'EUR', transaction_id: transactionId });
  trackFBEvent('Purchase', { value, currency: 'EUR', content_name: product });
};

export const trackLinkedInShare = (type: 'cv_analyser' | 'career_path' | 'career_energy') => {
  trackEvent('share', { event_category: 'social', method: 'linkedin', content_type: type });
  trackFBEvent('Lead', { content_name: `linkedin_share_${type}` });
};

export const trackCareerEnergyComplete = (score: number, country?: string) => {
  trackEvent('career_energy_complete', { event_category: 'engagement', score, country });
  trackFBEvent('CompleteRegistration', { value: score, content_name: 'career_energy' });
};

export const trackPageView = (pageName: string) => {
  trackEvent('page_view', { page_title: pageName });
};
