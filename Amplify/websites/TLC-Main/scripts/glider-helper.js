/**
 * @file 
 * glider-helper.js (ES module)
 * Glider initialization utilities.
 * @summary Handles dynamic loading of Glider.js and carousel initialization helpers.
 * @description
 * This module provides async and visibility‑triggered initialization helpers
 * for Glider.js carousels used across TLC’s Amplify pages.
 *
 * Glider is a JavaScript library.  We use it here to make use of its carousel
 * functionlity for displaying (scrolling) images.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation of Glider loader utilities.
 * @see https://nickpiscitelli.github.io/Glider.js/
 * @see https://cdn.jsdelivr.net/npm/glider-js@1/glider.min.css
 */
import {ConstructUrlCDN} from "./global-cdn.js"

/**
 * @summary Defines the path within the TLC CDN to the housed glider.min.js file.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 */
const GLIDER_MIN_FILE = "scripts/vendor/glider/glider.min.js";

/**
 * @summary Dynamically loads the non‑module Glider.js script into the document.
 * @description
 * This function checks whether `window.Glider` already exists and, if so,
 * immediately resolves with the existing instance. Otherwise, it injects
 * a `<script>` element whose `src` points to the Glider.js CDN file and
 * waits for it to finish loading.
 *
 * The function always returns a Promise that resolves to `window.Glider`
 * once the script has successfully loaded.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @async
 * @function LoadGliderAsync
 * @returns {Promise<Glider>} A Promise that resolves to the global `Glider`
 *          constructor after the script has been loaded.
 *
 * @throws {Error} If the Glider.js script fails to load or the network request
 *         encounters an error.
 */
async function LoadGliderAsync() {
    if (window.Glider) return window.Glider;

    await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = ConstructUrlCDN(GLIDER_MIN_FILE);
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });

    return window.Glider;
}

/**
 * @summary Asynchronously initializes a Glider.js carousel for the specified element.
 * @description
 * This function loads the Glider.js script using `LoadGliderAsync()` and,
 * once available, constructs a new `Glider` instance using the provided
 * selector and options. Because the Glider loader is asynchronous, this
 * function returns a Promise that resolves to the created `Glider` instance.
 *
 * If the Glider.js script fails to load or the loader returns a falsy value,
 * the Promise resolves to `null` and a warning is logged.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @function InitCarouselAsync
 * @param {string|Element} selector - A CSS selector string or DOM element
 *        identifying the carousel container to initialize.
 * @param {Object} options - Configuration options passed directly to the
 *        `Glider` constructor.
 *
 * @returns {Promise<Glider|null>} A Promise that resolves to the created
 *          `Glider` instance, or `null` if loading failed.
 *
 * @example
 * InitCarouselAsync("div.glider", { slidesToShow: 1 })
 *     .then(glider => {
 *         if (glider) {
 *             console.log("Carousel initialized:", glider);
 *         }
 *     });
 */
export function InitCarouselAsync(selector, options) {
    return LoadGliderAsync()
        .then(Glider => {
            if (!Glider) {
                console.warn(`Could not load a Glider from "${GLIDER_MIN_FILE}".`);
                return null;
            }

            const newGlider = new Glider(selector, options);
            return newGlider;
        })
        .catch(err => {
            console.error("Error loading Glider:", err);
            return null;
        });
}




// --- Global fallback for non-module usage ---
if (typeof window !== "undefined") {
    window.GliderHelper = {
        InitCarouselAsync: InitCarouselAsync
    };
}
