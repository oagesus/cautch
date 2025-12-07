// Theme Preload Script - lädt Theme SOFORT beim Seitenaufruf
(function() {
    // Gespeichertes Theme aus LocalStorage laden
    const savedTheme = localStorage.getItem('darkMode');
    // Standard ist Dark Mode (true), außer explizit auf false gesetzt
    const isDark = savedTheme === null ? true : savedTheme === 'true';
    
    // Wenn Light Mode, dann sofort CSS-Klasse setzen
    if (!isDark) {
        document.documentElement.classList.add('mud-theme-light');
        document.documentElement.classList.remove('mud-theme-dark');
    } else {
        document.documentElement.classList.add('mud-theme-dark');
        document.documentElement.classList.remove('mud-theme-light');
    }
})();