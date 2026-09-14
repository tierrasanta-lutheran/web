/**
 * @file 
 * utils.js (ES module)
 * General JavaScript utilities.
 * @summary This file provides general helper utilities to perform JavaScript operations.
 * @description
 * Methods in thie file help do things such as:
 *   - Date operations.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation of general JavaScript utilities.
 */

/**
 * @summary Determines whether two Date objects represent the same calendar day.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @param {Date} day1 The first day to compare.
 * @param {Date} day2 The second day to compare.
 * @returns {boolean} True if year, month, and day match; otherwise false.
 */
export function IsSameCalendarDay(day1, day2) {
    return (
        day1.getFullYear() === day2.getFullYear() &&
        day1.getMonth() === day2.getMonth() &&     // Months are 0-indexed
        day1.getDate() === day2.getDate()
    );
}

/**
 * @summary
 * Extracts date components (year, month, day) and worship service type
 * from an Amplify event element by parsing its `mc-slug` query parameter.
 * @description
 * This function is designed for Ministry Brands Amplify event listings,
 * where each event includes an anchor tag whose `href` contains a slug
 * describing the event in the format:
 *
 *   tlc-YYYY-MM-DD-serviceType-time
 *
 * Example:
 *   mc-slug=tlc-2026-03-03-contemporary-830am
 *
 * The function validates:
 *   - That the event contains a slug-bearing link
 *   - That the slug exists and is parseable
 *   - That the service type is one of: contemporary, traditional, unity
 *
 * It returns a structured object indicating success or failure. On success,
 * the object includes the parsed date parts and service type. On failure,
 * it includes an explanatory message.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @function GetEventDateParts
 *
 * @param {HTMLElement} event
 *   The DOM element representing a single event item. Must contain an
 *   `<a>` element whose `href` includes `mc-slug`.
 *
 * @returns {{
 *   result: boolean,
 *   message?: string,
 *   year?: string,
 *   month?: string,
 *   day?: string,
 *   service?: string
 * }}
 *   A result object describing the outcome:
 *
 *   - On success:
 *       {
 *         result: true,
 *         year: "2026",
 *         month: "03",
 *         day: "03",
 *         service: "contemporary"
 *       }
 *
 *   - On failure:
 *       {
 *         result: false,
 *         message: "Event does not appear to be associated with a slug."
 *       }
 *
 * @example
 * // Given HTML:
 * // <a href="...?mc-slug=tlc-2026-03-03-contemporary-830am"></a>
 * //
 * // GetEventDateParts(event) returns:
 * // {
 * //   result: true,
 * //   year: "2026",
 * //   month: "03",
 * //   day: "03",
 * //   service: "contemporary"
 * // }
 *
 * @example
 * // If the slug is missing:
 * // { result: false, message: "Event does not appear to be associated with a slug." }
 *
 * @example
 * // If the service type is not a worship service:
 * // { result: false, message: "Event does not appear to be a contemporary, traditional or unity service." }
 */
export function GetEventDateParts(event) {
    // Find the slug-bearing link
    const link = event.querySelector("a[href*='mc-slug']");
    if (!link) {
        console.warn("Event does not appear to be associated with a slug:", event);
        return {
            result: false,
            message: "Event does not appear to be associated with a slug."
        };
    }

    // Extract slug from URL
    const url = new URL(link.href);
    const mcSlug = url.searchParams.get("mc-slug");
    if (!mcSlug) {
        console.warn("Could not get event slug:", url);
        return {
            result: false,
            message: `Could not get event slug: ${url}`
        };
    }

    const urlParts = mcSlug.split("-");

    const year = urlParts[1];
    const month = urlParts[2];
    const day = urlParts[3];

    // Validate worship service type
    if (!["contemporary", "traditional", "unity"].includes(urlParts[4])) {
        console.debug(
            "Event does not appear to be a contemporary, traditional or unity service.",
            event
        );
        return {
            result: false,
            message: "Event does not appear to be a contemporary, traditional or unity service."
        };
    }

    return {
        result: true,
        year,
        month,
        day,
        service: urlParts[4]
    };
}

/**
 * @summary
 * Extracts a normalized event start time from a Ministry Brands Amplify
 * event DOM element.
 * @description
 * This function searches for a specific `<h5>` element
 * containing the date metadata (`h5.brz-ministryBrands__item--meta-date`),
 * then locates a nested `<span>` whose inner text includes a human‑readable
 * date/time string (e.g., "Sunday, March 3, 8:30 am").
 *
 * The function identifies the time portion by scanning for a pattern
 * matching "H:MM am/pm" or "HH:MM am/pm". If found, the time is returned
 * in a normalized object where:
 *
 *   - `time` is the numeric time with the colon removed (e.g., "8:30" → "830")
 *   - `meridiem` is either `"am"` or `"pm"` in lowercase
 *
 * If the expected DOM structure is missing or no valid time string is found,
 * the function returns `null`.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @function GetEventStartTime
 * @param {HTMLElement} event
 *   The root DOM element representing a single event item. This element
 *   must contain an `<h5>` with the class `brz-ministryBrands__item--meta-date`
 *   and a nested `<span>` containing the event's date/time text.
 *
 * @returns {{ time: string, meridiem: string } | null}
 *   An object containing the parsed start time, or `null` if:
 *   - The `<h5>` or `<span>` cannot be found,
 *   - The text does not contain a recognizable time,
 *   - The time cannot be parsed into the expected format.
 *
 * @example
 * // Given HTML:
 * // <h5 class="brz-ministryBrands__item--meta-date">
 * //   <span>Sunday, March 3, 8:30 am</span>
 * // </h5>
 * //
 * // Returns:
 * // { time: "830", meridiem: "am" }
 *
 * @example
 * // If no time is present:
 * // <span>Sunday, March 3</span>
 * //
 * // Returns:
 * // null
 */
export function GetEventStartTime(event) {
    const eventTimeH5 = event.querySelector("h5.brz-ministryBrands__item--meta-date")
    const eventTimeSPANs = eventTimeH5?.querySelectorAll("span");
    const lastEventTimeSpan = eventTimeSPANs?.[eventTimeSPANs.length - 1] || null;
    const eventTimeRaw = lastEventTimeSpan?.innerText;

    if (!eventTimeRaw) {
        return null;
    }

    const parts = eventTimeRaw.split(", ");
    const match = parts.find(p => /\d?\d:\d\d (am|pm)/i.test(p));

    if (match) {
        const [, time, meridiem] = match.match(/(\d?\d:\d\d) (am|pm)/i);
        return { 
            time: time.replace(/:/g, ""),   // Remove ':' from the time, e.g. 8:30 => 830
            meridiem 
        };
    }

    return null;
}

/**
 * @summary
 * Returns a Date object representing the next Sunday.
 * @description
 * If today is Sunday, today's date is returned; otherwise, the upcoming Sunday is returned.
 * The returned Date has no time or timezone offset (set to local midnight).
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @returns {Date} A Date object for yyyy-mm-dd (local date only).
 */
export function GetNextSunday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday = 0

    // Determine next Sunday (or today if Sunday)
    const nextSunday = new Date(today);
    if (dayOfWeek !== 0) {
        const daysUntilSunday = 7 - dayOfWeek;
        nextSunday.setDate(today.getDate() + daysUntilSunday);
    }

    // Strip time by reconstructing a pure yyyy-mm-dd date
    const year = nextSunday.getFullYear();
    const month = nextSunday.getMonth(); // already 0-indexed
    const day = nextSunday.getDate();

    return new Date(year, month, day); // midnight local time, no offset info
}

/**
 * Determines whether a Brizy/Amplify event time string represents an
 * all‑day event using the “fake all‑day” time range format.
 *
 * Amplify does not always mark all‑day events with the literal text
 * “All Day”. Instead, events created from 12:00 AM to 11:59 PM are
 * rendered as:
 *
 *     "12:00 am - 11:59 pm"
 *
 * This helper normalizes whitespace and performs a strict comparison
 * against that known pattern.
 *
 * @function IsAllDayTimeRange
 * @param {string|null|undefined} eventTime
 *   The raw time string extracted from `.brz-eventDetail__item--meta--date`.
 *
 * @returns {boolean}
 *   `true` if the time range matches the all‑day pattern,
 *   otherwise `false`.
 *
 * @example
 * IsAllDayTimeRange("12:00 am - 11:59 pm");   // true
 * IsAllDayTimeRange("9:00 am - 10:00 am");    // false
 * IsAllDayTimeRange(null);                    // false
 */
function IsAllDayTimeRange(eventTime) {
  return eventTime?.trim() === "12:00 am - 11:59 pm";
}


// --- Global fallback for non-module usage ---
if (typeof window !== "undefined") {
    window.TlcUtils = {
        IsSameCalendarDay,
        GetEventDateParts,
        GetEventStartTime,
        GetNextSunday,
        IsAllDayTimeRange
    };
}

