/**
 * safeHtml2Canvas — A wrapper around html2canvas that automatically handles
 * oklch() color conversion for Tailwind CSS v4 compatibility.
 *
 * html2canvas v1.4.1 only supports rgb/rgba/hsl/hsla color functions.
 * Tailwind CSS v4 generates oklch() colors in external stylesheets.
 * This utility neutralizes ALL oklch() in the document before rendering,
 * then restores the original stylesheets afterwards.
 *
 * Usage:
 *   import { safeHtml2Canvas } from '@/lib/safeHtml2Canvas';
 *   const canvas = await safeHtml2Canvas(element, { scale: 2, ... });
 */

interface SafeHtml2CanvasOptions {
  scale?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
  backgroundColor?: string;
  logging?: boolean;
  windowWidth?: number;
  [key: string]: any;
}

// Convert a single oklch(...) value to rgb using the browser's CSS engine
function oklchToRgb(oklchVal: string): string {
  try {
    const tmp = document.createElement('div');
    tmp.style.color = oklchVal;
    document.body.appendChild(tmp);
    const computed = getComputedStyle(tmp).color;
    document.body.removeChild(tmp);
    return computed || 'rgb(0,0,0)';
  } catch {
    return 'rgb(0,0,0)';
  }
}

// Replace all oklch() occurrences in a CSS text string with rgb()
function replaceOklchInCSS(cssText: string): string {
  return cssText.replace(/oklch\([^)]*\)/g, (match) => {
    try {
      return oklchToRgb(match);
    } catch {
      return 'rgb(0,0,0)';
    }
  });
}

interface RestorationItem {
  link: HTMLLinkElement;
  replacement: HTMLStyleElement;
  nextSibling: Node | null;
  parent: Node;
}

interface InlineRestorationItem {
  el: HTMLStyleElement;
  original: string;
}

/**
 * Neutralize all oklch() colors in the document by:
 * 1. Converting external <link> stylesheets to inline <style> with oklch replaced
 * 2. Replacing oklch in existing inline <style> tags
 *
 * Returns a restore function that reverts all changes.
 */
function neutralizeOklch(): () => void {
  const restorationQueue: RestorationItem[] = [];
  const inlineRestorationQueue: InlineRestorationItem[] = [];

  // Step 1: Convert external <link> stylesheets containing oklch
  const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  for (const link of linkElements) {
    const linkEl = link as HTMLLinkElement;
    try {
      const sheet = linkEl.sheet;
      if (!sheet) continue;
      let cssText = '';
      try {
        for (let i = 0; i < sheet.cssRules.length; i++) {
          cssText += sheet.cssRules[i].cssText + '\n';
        }
      } catch {
        continue; // Skip cross-origin stylesheets
      }
      if (!cssText.includes('oklch')) continue;

      const cleanedCSS = replaceOklchInCSS(cssText);
      const styleEl = document.createElement('style');
      styleEl.textContent = cleanedCSS;
      styleEl.setAttribute('data-oklch-replacement', 'true');

      const parent = linkEl.parentNode!;
      const nextSibling = linkEl.nextSibling;
      parent.insertBefore(styleEl, linkEl);
      linkEl.remove();
      restorationQueue.push({ link: linkEl, replacement: styleEl, nextSibling, parent });
    } catch {
      /* skip problematic stylesheets */
    }
  }

  // Step 2: Neutralize inline <style> tags containing oklch
  const inlineStyles = Array.from(
    document.querySelectorAll('style:not([data-oklch-replacement])')
  );
  for (const styleEl of inlineStyles) {
    const s = styleEl as HTMLStyleElement;
    if (s.textContent && s.textContent.includes('oklch')) {
      inlineRestorationQueue.push({ el: s, original: s.textContent });
      s.textContent = replaceOklchInCSS(s.textContent);
    }
  }

  // Return restore function
  return () => {
    // Restore external stylesheets
    for (const { link, replacement, nextSibling, parent } of restorationQueue) {
      try {
        if (nextSibling && nextSibling.parentNode === parent) {
          parent.insertBefore(link, nextSibling);
        } else {
          parent.appendChild(link);
        }
        replacement.remove();
      } catch {
        /* best effort restoration */
      }
    }
    // Restore inline styles
    for (const { el, original } of inlineRestorationQueue) {
      try {
        el.textContent = original;
      } catch {
        /* best effort */
      }
    }
  };
}

/**
 * Safe html2canvas wrapper that automatically handles oklch() colors.
 * Drop-in replacement: just use safeHtml2Canvas(element, options) instead of html2canvas(element, options).
 */
export async function safeHtml2Canvas(
  element: HTMLElement,
  options: SafeHtml2CanvasOptions = {}
): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas')).default;

  // Neutralize oklch before rendering
  const restoreOklch = neutralizeOklch();

  try {
    const canvas = await html2canvas(element, options);
    return canvas;
  } finally {
    // Always restore, even if html2canvas throws
    restoreOklch();
  }
}

export default safeHtml2Canvas;
