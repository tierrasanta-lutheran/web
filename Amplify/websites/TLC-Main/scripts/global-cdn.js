/**
 * @file 
 * global-cdn.js (ES module)
 * TLC CDN helper utilities.
 * @summary Provides basic helper utilities to interface with the Content Delivery Network (CDN).
 * @description
 * The Content Delivery Network (CDN) provides TLC a platform which can deliver custom content
 * for its website, e-mails, and other digital communication needs.  Such content can be:
 *   - images
 *   - scripts and styles
 *   - documents
 *
 * The CDN is managed by Cloudflare which accesses backend files store on Backblaze B2.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation of CDN helper utilities.
 * 
 * @see {@link https://www.backblaze.com/} Backblaze Home
 * @see {@link https://www.cloudflare.com/} Cloudflare Home
 */
import {TLC_CDN} from "./common/definitions.js";
import * as utils from "./common/utils.js"

/**
 * @summary
 * Constructs a fully qualified CDN URL using the global `TLC_CDN` hostname
 * and a provided path. This function ensures consistent URL formatting for
 * assets stored on the Tierrasanta Lutheran Church CDN.
 * @description
 * Behavior:
 *   - If `cdnPath` is not a string, the function logs a warning and returns
 *     the base CDN URL with a trailing slash.
 *   - If `cdnPath` begins with "/", it is appended directly to the base URL.
 *   - Otherwise, a "/" is inserted between the base URL and the path.
 *
 * Examples:
 *   TLC_CDN = "cdn.tierrasantalutheran.org"
 *
 *   ConstructUrlCDN("images/photo.png")
 *     → "https://cdn.tierrasantalutheran.org/images/photo.png"
 *
 *   ConstructUrlCDN("/images/photo.png")
 *     → "https://cdn.tierrasantalutheran.org/images/photo.png"
 *
 *   ConstructUrlCDN(123)
 *     → logs warning
 *     → "https://cdn.tierrasantalutheran.org/"
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @function ConstructUrlCDN
 *
 * @param {string} cdnPath
 *   The relative path to a CDN asset. May begin with "/" or be a bare path.
 *   Example: "bulletins/2026/03/03.pdf" or "/bulletins/2026/03/03.pdf".
 *
 * @returns {string}
 *   A fully qualified CDN URL. If `cdnPath` is invalid, returns the base CDN
 *   URL with a trailing slash.
 */
export function ConstructUrlCDN(cdnPath) {
    const baseUrl = `https://${TLC_CDN}`;

    if (typeof cdnPath !== "string") {
        console.warn(
            `ConstructUrlCDN: Parameter 'cdnPath' is not a string.  Returning base CDN url '${baseUrl}/'.`
        );
        return `${baseUrl}/`;
    }
    
    if (cdnPath.startsWith('/')) {
        return `${baseUrl}${cdnPath}`;
    }

    return `${baseUrl}/${cdnPath}`;
}

/**
 * @summary
 * Generates the correct CDN URL for a worship service bulletin PDF based on
 * the event's date and start time. If the expected bulletin file does not
 * exist on the CDN, a default bulletin file is returned instead.
 * @description
 * This function encapsulates several nested helpers:
 *   - FileExistsAsync(fileName): Checks whether a bulletin file exists on the CDN.
 *   - ConstructFileName(): Builds the expected bulletin filename using date/time.
 *   - ConstructFileUrl(fileName): Converts a filename into a fully qualified CDN URL.
 *   - GetUrlAsync(): Orchestrates filename creation, existence check, and fallback.
 *
 * Expected filename format:
 *   "Service Bulletin YYYY-MM-DD TIME MERIDIEM.pdf"
 *
 * Example:
 *   "Service Bulletin 2026-03-03 830 am.pdf"
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @async
 * @function GetBulletinUrl
 *
 * @param {number|string} year     - Four‑digit year (e.g., 2026).
 * @param {number|string} month    - Month (1–12).
 * @param {number|string} day      - Day of month (1–31).
 * @param {string} time            - Time without colon (e.g., "830").
 * @param {string} meridiem        - "am" or "pm".
 *
 * @returns {Promise<string>}
 *   A fully qualified CDN URL pointing to the correct bulletin file, or the
 *   default bulletin file if the expected file does not exist.
 */
export async function GetBulletinUrlAsync(year, month, day, time, meridiem) {

    /**
     * Checks whether a bulletin file exists on the CDN by performing a HEAD
     * request, falling back to a GET request if necessary. Returns true if
     * the file is accessible, false otherwise.
     *
     * @async
     * @function FileExistsAsync
     *
     * @param {string} fileName - The bulletin filename to test.
     * @returns {Promise<boolean>}
     *   True if the file exists on the CDN, false otherwise.
     */
    async function FileExistsAsync(fileName) {
        let url = ConstructFileUrl(fileName);

        console.log(`Testing url: ${url}`);

        try {
            const head = await fetch(url, { method: "HEAD" });
            if (head.ok) return true;
        } catch {}

        try {
            const get = await fetch(url, { method: "GET" });
            return get.ok;
        } catch {
            return false;
        }
    }

    /**
     * Constructs the expected bulletin filename using the event's date and
     * start time. Ensures proper zero‑padding for year, month, and day.
     *
     * Filename format:
     *   "Service Bulletin YYYY-MM-DD TIME MERIDIEM.pdf"
     *
     * @function ConstructFileName
     *
     * @returns {string} The constructed bulletin filename.
     */
    function ConstructFileName() {

        /**
         * Converts a numeric value into a zero‑padded string with a fixed
         * number of digits. If the value cannot be parsed as a number, the
         * original value is returned unchanged.
         *
         * @function toDigits
         *
         * @param {string|number} value     - Value to convert.
         * @param {number}        numDigits - Required digit count.
         * @returns {string} Zero‑padded string or original value.
         */
        function toDigits(value, numDigits) {
            const num = parseInt(value, 10);
            if (isNaN(num)) return value;
            return num.toString().padStart(numDigits, "0");
        }

        const sYear = toDigits(year, 4);
        const sMonth = toDigits(month, 2);
        const sDay = toDigits(day, 2);

        return `Service Bulletin ${sYear}-${sMonth}-${sDay} ${time} ${meridiem}.pdf`;
    }

    /**
     * Converts a bulletin filename into a fully qualified CDN URL using the
     * global ConstructUrlCDN() helper. The resulting URL is URI‑encoded.
     *
     * @function ConstructFileUrl
     *
     * @param {string} fileName - The bulletin filename.
     * @returns {string} Fully qualified CDN URL.
     */
    function ConstructFileUrl(fileName) {
        const url = ConstructUrlCDN(`/bulletins/${fileName}`);
        return encodeURI(url);
    }

    /**
     * Orchestrates bulletin URL generation:
     *   - Builds the expected filename
     *   - Checks whether the file exists
     *   - Returns the correct URL or falls back to the default bulletin
     *
     * @async
     * @function GetUrlAsync
     *
     * @returns {Promise<string>}
     *   The URL of the correct bulletin file or the default fallback.
     */
    async function GetUrlAsync() {
        const fileName = ConstructFileName();
        const fileUrl = ConstructFileUrl(fileName);

        const exists = await FileExistsAsync(fileName);

        if (exists) {
            return fileUrl;
        } else {
            const DEFAULT_BULLETIN = "Default Bulletin.pdf";
            console.log(
                `File '${fileName}' does NOT exist.  Using default file '${DEFAULT_BULLETIN}'.`
            );
            const defaultUrl = ConstructFileUrl(DEFAULT_BULLETIN);
            console.log(`Using default file url: ${defaultUrl}`);
            return defaultUrl;
        }
    }

    return await GetUrlAsync();
}

/**
 * @summary
 * Creates and appends a bulletin hyperlink to a specified DOM element.
 * @description
 * This function is designed for Ministry Brands Amplify event listings,
 * where bulletins are generated dynamically based on the event's date
 * and start time. It constructs an `<a>` element, retrieves the correct
 * bulletin URL via `GetBulletinUrl(...)`, and inserts the link into the
 * provided container element.
 *
 * The function is asynchronous because bulletin URLs may require
 * server-side lookup, API calls, or dynamic generation. The created link
 * always opens in a new browser tab (`target="_blank"`).
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @async
 * @function AddBulletinLink
 *
 * @param {string} linkText
 *   The text content to display inside the generated `<a>` element.
 *   Example: `"View Bulletin"` or `"Download PDF"`.
 *
 * @param {HTMLElement} element
 *   The DOM node to which the new hyperlink will be appended. This is
 *   typically a container inside an event card or metadata block
 *   but can be any HTML element which can contain children elements
 *   (like a &lt;div&gt; element).
 *
 * @param {number|string} year
 *   The four‑digit year of the event (e.g., `2026`). May be passed as a
 *   number or string.
 *
 * @param {number|string} month
 *   The month of the event (1–12). May be numeric or string.
 *
 * @param {number|string} day
 *   The day of the month (1–31). May be numeric or string.
 *
 * @param {string} time
 *   The normalized start time of the event without a colon (e.g., `"830"`
 *   for 8:30). This typically comes from `GetEventStartTime(...)`.
 *
 * @param {string} meridiem
 *   Either `"am"` or `"pm"` (case-insensitive). Also typically sourced
 *   from `GetEventStartTime(...)`.
 *
 * @returns {Promise<void>}
 *   Resolves once the `<a>` element has been created, configured, and
 *   appended to the target DOM element. No value is returned.
 *
 * @example
 * // Appending a bulletin link to an event card:
 * const card = document.querySelector(".event-card");
 * await AddBulletinLink(
 *   "View Bulletin",
 *   card,
 *   2026,
 *   3,
 *   3,
 *   "830",
 *   "am"
 * );
 *
 * @example
 * // Using parsed event metadata:
 * const { time, meridiem } = GetEventStartTime(eventElement);
 * await AddBulletinLink("Bulletin", eventElement, 2026, 4, 12, time, meridiem);
 */
export async function AddBulletinLinkAsync(linkText, element, year, month, day, time, meridiem) {
    const newLink = document.createElement("a");
    newLink.href = await GetBulletinUrlAsync(year, month, day, time, meridiem);
    newLink.target = "_blank";
    newLink.innerText = linkText;
    element.appendChild(newLink);
}

/**
 * @summary
 * Iterates through a list of Amplify event DOM elements and appends bulletin
 * links to Sunday worship services (contemporary, traditional, unity).
 * @description
 * This function identifies valid worship events by inspecting the event's slug
 * (`mc-slug` query parameter), extracts the date components, parses the event
 * start time, and then delegates bulletin link creation to
 * `AddBulletinLinkAsync(...)`.
 *
 * The function is asynchronous because bulletin URLs may require remote
 * lookup or dynamic generation. Events that do not meet the expected
 * structure or naming conventions are skipped with diagnostic console output.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @async
 * @function AddBulletinLinksToSundayWorshipEventsAsync
 *
 * @param {string} linkText
 *   The text to display inside each generated bulletin hyperlink.
 *   Example: `"View Bulletin"` or `"Download Bulletin PDF"`.
 *
 * @param {NodeListOf<HTMLElement> | HTMLElement[]} events
 *   A collection of event DOM elements, typically obtained via:
 *   `document.querySelectorAll(".brz-eventList__item")`.
 *   Each event must contain an anchor tag whose `href` includes `mc-slug`.
 *
 * @returns {Promise<void>}
 *   Resolves once all qualifying events have been processed. No value is
 *   returned. Events that fail validation are skipped.
 *
 * @example
 * // Typical usage:
 * const events = document.querySelectorAll(".brz-eventList__item");
 * await AddBulletinLinksToSundayWorshipEventsAsync("View Bulletin", events);
 *
 * @example
 * // Example slug format:
 * // mc-slug=tlc-2026-03-03-contemporary-830am
 * //
 * // Parsed:
 * // year  = "2026"
 * // month = "03"
 * // day   = "03"
 * // service type = "contemporary"
 *
 * @example
 * // Events that are NOT worship services (e.g., descriptions or non-Sunday
 * // activities) are skipped automatically.
 */
export async function AddBulletinLinksToSundayWorshipEventsAsync(linkText, events) {
    for (const event of events) {
        const dateParts = utils.GetEventDateParts(event);

        if (!dateParts.result) {
            console.debug(`Failed to process event date: ${dateParts.message}`);
            continue;
        }

        // Validate worship service type
        if (!["contemporary", "traditional", "unity"].includes(dateParts.service)) {
            console.debug(
                "Event does not appear to be a contemporary, traditional or unity service.",
                event
            );
            continue; // Likely a description or non-worship event
        }

        // Validate date
        const dateStr = [dateParts.year, dateParts.month, dateParts.day].join("-");
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj)) {
            console.warn("Invalid Event Date:", dateStr);
            continue;
        }

        // Parse event start time
        const eventStart = utils.GetEventStartTime(event);
        if (!eventStart) {
            console.warn("Could not get event time:", event);
            continue;
        }

        console.debug("Event Time:", eventStart);

        // Append bulletin link
        await AddBulletinLinkAsync(
            linkText,
            event,
            year,
            month,
            day,
            eventStart.time,
            eventStart.meridiem
        );
    }
}

/**
 * @summary
 * Fetches and returns image-link metadata for a specific group slug.
 * @description
 * Loads the manifest file `/manifests/group-image-links.json` from the CDN,
 * parses the JSON, and returns the group object whose `slug` matches the
 * provided `groupSlug`. If the fetch fails or the slug is not found, `null`
 * is returned.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @async
 * @function GetGroupImageLinksAsync
 * @param {string} groupSlug - The slug used to identify the group.
 * @returns {Promise<GroupImageLinks|null>} The matching group object, or `null` if not found.
 *
 * @example
 * const links = await GetGroupImageLinksAsync("vacation-bible-school-crew");
 * if (links) {
 *     console.log("Found group:", links.slug);
 * }
 */
export async function GetGroupImageLinksAsync(groupSlug) {
    const url = ConstructUrlCDN("/manifests/group-image-links.json");

    const groupImageLinks =
        await fetch(url)
            .then(response => response.json())
            .then(data => {
                return data.find(group => group.slug === groupSlug) ?? null;
            })
            .catch(error => {
                console.error("Error loading JSON:", error);
                return null;
            });

    return groupImageLinks;
}

// --- Global fallback for non-module usage ---
if (typeof window !== "undefined") {
    window.GlobalCdn = {
        ConstructUrlCDN,
        GetBulletinUrlAsync: GetBulletinUrlAsync,
        AddBulletinLinkAsync,
        AddBulletinLinksToSundayWorshipEventsAsync,
        GetGroupImageLinksAsync
    };
}
