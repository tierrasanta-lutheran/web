/**
 * The location of the TLC CDN.
 */
export const TLC_CDN = "cdn.tierrasantalutheran.org";

// --- Global fallback for non-module usage ---
if (typeof window !== "undefined") {
    window.TlcDefs = {
        TLC_CDN
    };
}
