/**
 * WebView-aware payment redirect utility.
 * When in a WebView (LinkedIn, Instagram, etc.), tries to open the Stripe
 * checkout URL in the native browser instead of within the limited WebView.
 */

export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || '';
  return /LinkedInApp|Instagram|FBAN|FBAV|FB_IAB|Twitter|BytedanceWebview|TikTok/i.test(ua) ||
    (/wv\)|WebView/i.test(ua) && /Android/i.test(ua));
}

export function getInAppSource(): string {
  const ua = navigator.userAgent || '';
  if (/LinkedInApp/i.test(ua)) return 'LinkedIn';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV/i.test(ua)) return 'Facebook';
  if (/Twitter/i.test(ua)) return 'Twitter/X';
  if (/TikTok/i.test(ua)) return 'TikTok';
  return 'in-app browser';
}

/**
 * Redirect to Stripe checkout, with WebView-aware handling.
 * In WebView: tries Android intent or copies URL with instructions.
 * In normal browser: standard redirect.
 */
export function redirectToCheckout(url: string): void {
  if (!isInAppBrowser()) {
    // Normal browser — standard redirect
    window.location.href = url;
    return;
  }

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);

  if (isAndroid) {
    // Try Android intent to open in Chrome
    const intentUrl = 'intent://' + url.replace(/^https?:\/\//, '') +
      '#Intent;scheme=https;package=com.android.chrome;end';
    window.location.href = intentUrl;

    // Fallback: generic browser intent after 1.5s
    setTimeout(() => {
      const genericIntent = 'intent://' + url.replace(/^https?:\/\//, '') +
        '#Intent;scheme=https;action=android.intent.action.VIEW;end';
      window.location.href = genericIntent;
    }, 1500);

    // Final fallback: just redirect normally (some WebViews handle Stripe OK)
    setTimeout(() => {
      window.location.href = url;
    }, 3000);
  } else {
    // iOS and others: try window.open, then fallback to normal redirect
    const w = window.open(url, '_system') || window.open(url, '_blank');
    if (!w) {
      window.location.href = url;
    }
  }
}
