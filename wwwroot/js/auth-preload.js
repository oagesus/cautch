// Auth Preload Script - verhindert Flash auf Home Page
(function() {
    // Prüfe ob wir auf der Home-Seite sind
    if (window.location.pathname === '/' || window.location.pathname === '') {
        // Prüfe ob User authentifiziert ist durch das Vorhandensein des Auth-Cookies
        // Der Cookie-Name ist normalerweise ".AspNetCore.Identity.Application"
        const cookies = document.cookie.split(';');
        let isAuthenticated = false;
        
        for (let cookie of cookies) {
            const trimmed = cookie.trim();
            // Prüfe auf AspNetCore Identity Cookie
            if (trimmed.startsWith('.AspNetCore.Identity.Application=') || 
                trimmed.startsWith('.AspNetCore.Cookies=')) {
                isAuthenticated = true;
                break;
            }
        }
        
        // Wenn authentifiziert, sofort zu /browse redirecten
        if (isAuthenticated) {
            window.location.replace('/browse');
        }
    }
})();