// /hooks/useLenis.js
import { useEffect } from 'react';
import Lenis from 'lenis';

export default function useLenis(options = {}) {
    useEffect(() => {
        // Da window erst clientseitig verfügbar ist, prüfen wir hier:
        if (typeof window === 'undefined') return;

        // Initialisiere Lenis mit Standard- oder benutzerdefinierten Optionen
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            smoothWheel: true,
            smoothTouch: false,
            ...options, // Erlaubt es Dir, zusätzliche Optionen zu überschreiben
        });

        // Animationsschleife starten
        const animate = (time) => {
            lenis.raf(time);
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);

        // Optional: Event-Listener o.ä. hinzufügen, falls nötig

        // Aufräumfunktion: Falls es später notwendig wird, z. B. beim Routenwechsel
        return () => {
            // Es besteht aktuell keine eingebaute Methode zum Stoppen der RAF-Schleife in Lenis,
            // aber Du kannst hier zum Beispiel Event-Listener entfernen oder die Instanz
            // aufräumen, falls Du eigene Logik ergänzt.
        };
    }, [options]);
}
