/** localStorage key + custom event shared by the theme script and <ThemeToggle>. */
export const THEME_KEY = "alumni-theme";
export const THEME_EVENT = "alumni-theme-change";

/**
 * Inline script for <head>: applies the saved (or OS) theme before the page
 * paints, so there is no flash of the wrong theme. Plain module (no "use client")
 * so the server layout can read the string.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();`;
