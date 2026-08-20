/**
 * copyToClipboard
 * Tries the modern Clipboard API first; falls back to the legacy
 * execCommand approach when the Permissions Policy blocks the API
 * (common in sandboxed iframes / embedded environments).
 */
export function copyToClipboard(text: string): void {
  // Modern path
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
    return;
  }
  legacyCopy(text);
}

function legacyCopy(text: string): void {
  const ta = document.createElement('textarea');
  ta.value = text;
  // Keep it off-screen
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
  } catch {
    // silently fail — nothing we can do
  } finally {
    document.body.removeChild(ta);
  }
}
