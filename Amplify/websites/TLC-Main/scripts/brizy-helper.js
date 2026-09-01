/**
 * @file 
 * brizy-helper.js (ES module)
 * Brizy helper utilities.
 * @summary Provides basic helper utilities to interface with Brizy constructs.
 * @description
 * Brizy is a website management system provided by the Ministry Brands Amplify platform.
 * This system provides various widgts/components (like a Tab Group) which can be dropped
 * into webpages and used to display content.
 *
 * This file contains helper utilities to interface with webpages and its widgets/components
 * to facilitate changes in properties, display, etc.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation of Brizy helper utilities.
 */
import {InitCarouselAsync} from "./glider-helper.js";
import {GetGroupImageLinksAsync, ConstructUrlCDN} from "./global-cdn.js";

/**
 * @summary Gets the webpage slug identifier from the url.
 * @description
 * Retrieves the value of the `mc-slug` query parameter from the current
 * page's URL. This function is used in Ministry Brands Amplify pages
 * (such as Worship, Events, and Group listings) where event or content
 * metadata is encoded in the URL via the `mc-slug` parameter.
 *
 * Behavior:
 *   - Parses the current window's query string using `URLSearchParams`.
 *   - Returns the raw slug value if present.
 *   - Returns `null` if the parameter does not exist.
 *
 * Example URL:
 *   https://tierrasantalutheran.org/worship?mc-slug=tlc-2026-03-03-contemporary-830am
 *
 * Calling GetSlugFromUrl() on the above URL returns:
 *   "tlc-2026-03-03-contemporary-830am"
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @function GetSlugFromUrl
 *
 * @returns {string|null}
 *   The slug value from the `mc-slug` query parameter, or `null` if the
 *   parameter is not present in the current page URL.
 *
 * @example
 * // URL: https://example.com/page?mc-slug=tlc-2026-03-03-unity-830am
 * const slug = GetSlugFromUrl();
 * console.log(slug);
 * // "tlc-2026-03-03-unity-830am"
 *
 * @example
 * // URL: https://example.com/page
 * const slug = GetSlugFromUrl();
 * console.log(slug);
 * // null
 */
export function GetSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("mc-slug");
    return slug;
}

/**
 * @summary Returns the number of tabs in a Brizy tab control.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @param {HTMLElement} tabGroupEl - The root element of the Brizy tab group.
 * @returns {number} - Number of tabs.
 */
export function GetBrizyTabCount(tabGroupEl) {
  if (!tabGroupEl) return 0;

  const navList = tabGroupEl.querySelector('.brz-tabs__nav');
  if (!navList) return 0;

  const tabButtons = navList.querySelectorAll('.brz-tabs__nav--item');
  return tabButtons.length;
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
function GetEventDateParts(event) {
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
function GetEventStartTime(event) {
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
 * Activates a tab in a Brizy tab control.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @function ActivateBrizyTab
 * @param {HTMLElement} tabGroupEl - The root element of the Brizy tab group.
 * @param {number|string} indexOrKeyword - Zero-based index, "first", or "last".
 */
export function ActivateBrizyTab(tabGroupEl, indexOrKeyword) {
  if (!tabGroupEl) return;

  const navList = tabGroupEl.querySelector('.brz-tabs__nav');
  const contentContainer = tabGroupEl.querySelector('.brz-tabs__content');

  if (!navList || !contentContainer) return;

  const tabButtons = navList.querySelectorAll('.brz-tabs__nav--item');
  const tabPanels = contentContainer.querySelectorAll('.brz-tabs__items');

  if (tabButtons.length === 0) return;

  // Resolve keyword
  let index = indexOrKeyword;
  if (indexOrKeyword === "first") index = 0;
  if (indexOrKeyword === "last") index = tabButtons.length - 1;

  // Validate index
  if (typeof index !== "number" || index < 0 || index >= tabButtons.length) {
    console.error("ActivateBrizyTab: invalid index", indexOrKeyword);
    return;
  }

  // Remove active classes
  tabButtons.forEach(btn => btn.classList.remove('brz-tabs__nav--active'));
  tabPanels.forEach(panel => panel.classList.remove('brz-tabs__items--active'));

  // Activate selected tab
  const activeButton = tabButtons[index];
  const activePanel = tabPanels[index];

  activeButton.classList.add('brz-tabs__nav--active');
  activePanel.classList.add('brz-tabs__items--active');

  // Update ARIA attributes
  const btnEl = activeButton.querySelector('.brz-tabs__nav--button');
  const panelId = activePanel.id;

  if (btnEl && panelId) {
    btnEl.setAttribute('aria-selected', 'true');
    btnEl.setAttribute('tabindex', '0');
    activePanel.setAttribute('aria-hidden', 'false');
  }

  // Deactivate others
  tabButtons.forEach((btn, i) => {
    if (i !== index) {
      const b = btn.querySelector('.brz-tabs__nav--button');
      if (b) {
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('tabindex', '-1');
      }
    }
  });

  tabPanels.forEach((panel, i) => {
    if (i !== index) {
      panel.setAttribute('aria-hidden', 'true');
    }
  });
}

/**
 * @summary
 * Removes a tab (button + panel) from a Brizy tab control by index.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @function RemoveBrizyTab
 * @param {HTMLElement} tabGroupEl - The root element of the Brizy tab group.
 * @param {number} index - The zero-based index of the tab to remove.
 */
export function RemoveBrizyTab(tabGroupEl, index) {
  if (!tabGroupEl) {
    console.error("RemoveBrizyTab: tabGroupEl is null.");
    return;
  }

  // Locate tab button list and panel container
  const navList = tabGroupEl.querySelector('.brz-tabs__nav');
  const contentContainer = tabGroupEl.querySelector('.brz-tabs__content');

  if (!navList || !contentContainer) {
    console.error("RemoveBrizyTab: Brizy tab structure not found.");
    return;
  }

  const tabButtons = navList.querySelectorAll('.brz-tabs__nav--item');
  const tabPanels = contentContainer.querySelectorAll('.brz-tabs__items');

  if (index < 0 || index >= tabButtons.length) {
    console.error("RemoveBrizyTab: index out of range.");
    return;
  }

  const tabButton = tabButtons[index];
  const tabPanel = tabPanels[index];

  // Remove desktop tab button
  tabButton.remove();

  // Remove desktop panel
  tabPanel.remove();

  // Remove mobile tab + panel inside the panel structure
  const mobileTab = tabPanel.querySelector('.brz-tabs__nav--mobile');
  const mobilePanel = tabPanel.querySelector('.brz-tabs__item--content');

  if (mobileTab) mobileTab.remove();
  if (mobilePanel) mobilePanel.remove();

  // Optional: Reassign ARIA attributes to remaining tabs
  const remainingButtons = navList.querySelectorAll('.brz-tabs__nav--item');
  const remainingPanels = contentContainer.querySelectorAll('.brz-tabs__items');

  remainingButtons.forEach((btn, i) => {
    const newId = `brz-tabs-tab-${i}`;
    btn.querySelector('.brz-tabs__nav--button').id = newId;
    btn.querySelector('.brz-tabs__nav--button').setAttribute('aria-controls', `brz-tabs-panel-${i}`);
  });

  remainingPanels.forEach((panel, i) => {
    const newPanelId = `brz-tabs-panel-${i}`;
    panel.id = newPanelId;
    panel.setAttribute('aria-labelledby', `brz-tabs-tab-${i}`);
  });

  console.debug(`Tab ${index} removed successfully.`);
}

/**
 * @summary
 * Dynamically adds a new tab to a Brizy/Amplify tab group.
 * @description
 * This function clones the structure of an existing Brizy tab and panel,
 * generates new unique IDs, updates ARIA attributes, inserts the new tab
 * button into the tab navigation list, and inserts a new tab panel into
 * the tab content container. It also supports optional tab icons:
 *
 *  - If `iconName` is null, undefined, false, or "none", no icon is added.
 *  - If `iconName` is "calendar-1", the default Brizy calendar icon is used.
 *  - Otherwise, the icon name is used to construct a <use> reference to a
 *    Brizy icon asset.
 *
 * The function returns references to the newly created tab button and panel.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @function AddBrizyTab
 * @param {HTMLElement} tabGroupEl
 *        The root <div> element containing the entire Brizy tab widget.
 *
 * @param {string} label
 *        The text label to display on the new tab.
 *
 * @param {HTMLElement} contentEl
 *        The DOM element that will become the content of the new tab panel.
 *
 * @param {string|null} iconName
 *        Optional icon name. Use:
 *          - null / undefined / false / "none" → no icon
 *          - "calendar-1" → default calendar icon
 *          - any other string → custom icon name
 *
 * @returns {{tabButton: HTMLElement, panel: HTMLElement}}
 *          An object containing references to the created tab button and panel.
 */
export function AddBrizyTab(tabGroupEl, label, contentEl, iconName = "none") {
    // Locate the tab navigation list and content container
    const navList = tabGroupEl.querySelector('.brz-tabs__nav');
    const contentContainer = tabGroupEl.querySelector('.brz-tabs__content');

    if (!navList || !contentContainer) {
        console.error("Tab structure not found");
        return;
    }

    // Determine the new tab index based on existing tabs
    const index = navList.querySelectorAll('.brz-tabs__nav--item').length;

    // Generate unique IDs for desktop and mobile tab/panel pairs
    const tabId = `brz-tabs-tab-dynamic-${index}`;
    const panelId = `brz-tabs-panel-dynamic-${index}`;
    const mobileTabId = `brz-tabs-mobile-tab-dynamic-${index}`;
    const mobilePanelId = `brz-tabs-mobile-panel-dynamic-${index}`;

    // Clone an existing tab button to preserve Brizy styling and structure
    const existingTab = navList.querySelector('.brz-tabs__nav--item');
    const newTab = existingTab.cloneNode(true);

    // Update desktop tab button attributes
    const btn = newTab.querySelector('.brz-tabs__nav--button');
    btn.id = tabId;
    btn.setAttribute('aria-controls', panelId);
    btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('tabindex', '-1');

    // --- ICON HANDLING -----------------------------------------------------

    // Determine whether to remove the icon entirely
    const removeIcon = (!iconName || iconName === "none");

    // Locate existing icon (if any)
    let iconContainer = btn.querySelector('svg');

    // Compute icon href if needed
    let iconHref = null;

    if (!removeIcon) {
        if (iconName === "calendar-1") {
            // Use the default calendar icon
            iconHref = "https://tierrasantalutheran.org/icon/23211437/outline/calendar-grid-61.svg#nc_icon";
        } else {
            // Use a custom icon name
            iconHref = `https://tierrasantalutheran.org/icon/23211437/outline/${iconName}.svg#nc_icon`;
        }
    }

    if (removeIcon) {
        // Remove icon if present
        if (iconContainer) iconContainer.remove();
    } else {
        // Ensure an icon container exists
        if (!iconContainer) {
            iconContainer = document.createElement('svg');
            iconContainer.classList.add('brz-icon-svg');
            btn.prepend(iconContainer);
        }
        // Insert the <use> reference
   //     iconContainer.innerHTML = `<use href="${iconHref}"></use>`;
    }

    // Update the tab label text
    btn.querySelector('span').textContent = label;

    // Ensure the new tab is not marked active
    newTab.classList.remove('brz-tabs__nav--active');

    // Insert the new tab button into the navigation list
    navList.appendChild(newTab);

    // --- PANEL CREATION ----------------------------------------------------

    // Clone an existing panel to preserve structure
    const existingPanel = contentContainer.querySelector('.brz-tabs__items');
    const newPanel = existingPanel.cloneNode(true);

    // Update panel attributes
    newPanel.id = panelId;
    newPanel.setAttribute('aria-labelledby', tabId);
    newPanel.setAttribute('aria-hidden', 'true');
    newPanel.classList.remove('brz-tabs__items--active');

    // Replace panel content with the provided element
    const contentWrapper = newPanel.querySelector('.brz-tabs__item--content');
    contentWrapper.innerHTML = '';
    contentWrapper.appendChild(contentEl);

    // Insert the new panel into the content container
    contentContainer.appendChild(newPanel);

    // --- MOBILE TAB SUPPORT ------------------------------------------------

    const mobileNav = newPanel.querySelector('.brz-tabs__nav--mobile');
    const mobileBtn = mobileNav.querySelector('.brz-tabs__nav--button');

    // Update mobile tab button attributes
    mobileBtn.id = mobileTabId;
    mobileBtn.setAttribute('aria-controls', mobilePanelId);
    mobileBtn.querySelector('span').textContent = label;

    // Mobile icon handling
    let mobileIcon = mobileBtn.querySelector('svg');

    if (removeIcon) {
        if (mobileIcon) mobileIcon.remove();
    } else {
        if (!mobileIcon) {
            mobileIcon = document.createElement('svg');
            mobileIcon.classList.add('brz-icon-svg');
            mobileBtn.prepend(mobileIcon);
        }
  //      mobileIcon.innerHTML = `<use href="${iconHref}"></use>`;
    }

    // Update mobile panel attributes
    const mobilePanel = newPanel.querySelector('.brz-tabs__item--content');
    mobilePanel.id = mobilePanelId;
    mobilePanel.setAttribute('aria-labelledby', mobileTabId);

    // Return references for optional further manipulation
    return { tabButton: newTab, panel: newPanel };
}

/**
 * @summary
 * Builds and initializes a Glider.js carousel, inserts it into the DOM,
 * populates it with slides, and optionally enables automated scrolling.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @function BuildCarousel
 *
 * @param {Array<Object>} slides
 *   An array of slide objects used to populate the carousel.
 *   Each slide object must contain:
 *   @param {string} slides[].url - The image URL for the slide.
 *   @param {string} slides[].caption - The caption text displayed under the image.
 *
 * @param {Object} [options=null]
 *   Optional configuration and DOM placement settings.
 * @param {HTMLElement} [options.parent]
 *   If provided, the carousel is appended as the last child of this parent element.
 * @param {HTMLElement} [options.sibling]
 *   If provided (and `options.parent` is not), the carousel is inserted
 *   relative to this sibling element using `options.siblingPosition`.
 * @param {("beforebegin"|"afterbegin"|"beforeend"|"afterend")} [options.siblingPosition="afterend"]
 *   Determines where the carousel is inserted relative to `options.sibling`.
 *   Defaults to `"afterend"` if an invalid value is supplied.
 * @param {number} [options.slidesToShow=1]
 *   Number of slides visible at once in the Glider carousel.
 * @param {number} [options.slidesToScroll=1]
 *   Number of slides advanced per scroll action.
 * @param {boolean} [options.draggable=true]
 *   Enables or disables drag/swipe navigation.
 * @param {boolean} [options.rewind=true]
 *   Enables infinite looping behavior when reaching the end of the carousel.
 * @param {number} [options.timeInterval=0]
 *   If greater than zero, the carousel automatically advances to the next slide
 *   every `timeInterval` milliseconds.
 * @param {number} [options.nodots=false]
 *   If true then the navigation dots are not displayed.
 *
 * @description
 * Creates a `<div class="glider-container">` wrapper, injects the required
 * Glider.js markup (track, arrows, dots), populates the track with slides,
 * initializes Glider.js with the provided options, and optionally sets up
 * automated scrolling using `setInterval`.
 *
 * @returns {void}
 *   This function returns the new carousel that was created.
 */
export function BuildCarousel(slides, options = null) {
  console.debug("Carousel Options:", options);
  const newCarousel = document.createElement("div");
  newCarousel.classList.add("glider-container");

  // Add new carousel to the document.
  if (options?.parent) {
    options.parent.appendChild(newCarousel);
  }
  else if (options?.sibling) {
    const positions = ["beforebegin", "afterbegin", "beforeend", "afterend"];
    const sibPos = positions.includes(options.siblingPosition)
      ? options.siblingPosition
      : "afterend";
    options.sibling.insertAdjacentElement(sibPos, newCarousel);
  }

  // Set initial contents of new carousel.
  newCarousel.innerHTML = `
    <div class="glider"></div>
    <button class="glider-prev">«</button>
    <button class="glider-next">»</button>
    <div class="glider-dots"></div>
  `;

  // Add slides.
  const track = newCarousel.querySelector('.glider');

  slides.forEach(slide => {
    const divSlide = document.createElement('div');
    divSlide.classList.add("glider-slide");
    divSlide.classList.add("figure");
    divSlide.innerHTML = `
      <div class="slide">
        <img src="${slide.url}" alt="">
        <div class="caption">${slide.caption}</div>
      </div>`;
    track.appendChild(divSlide);
  });

  /**
   * Initializes a Glider.js carousel when the specified track element becomes visible
   * in the viewport. This function uses an IntersectionObserver to defer initialization
   * until the element is intersecting, which helps avoid unnecessary work for off‑screen
   * carousels.
   *
   * Once visible, the function calls `InitCarouselAsync()` to asynchronously create a
   * Glider instance. Because the initialization is asynchronous, the Glider instance is
   * assigned to `newGlider` only after the Promise resolves.
   *
   * Additional behaviors:
   *   - If `options.nodots` is true, the function hides the `.glider-dots` element inside
   *     `newCarousel`.
   *   - If `options.timeInterval` is a positive number, the function sets up a repeating
   *     timer that advances the carousel to the next slide using `scrollItem("next")`.
   *     The timer begins immediately, even if the Glider instance has not yet resolved;
   *     in that case, it logs `<no glider>` until the instance becomes available.
   *
   * The IntersectionObserver disconnects itself after the first successful intersection
   * to prevent repeated initialization.
   *
   * @function InitGliderWhenVisible
   * @param {Element} track - The DOM element representing the Glider track container.
   * @param {boolean} [options.nodots=false]
   *        If true, hides the `.glider-dots` element inside the carousel once created.
   * @param {number} [options.timeInterval=0]
   *        Interval in milliseconds for automatically advancing the carousel.
   *        If greater than zero, a repeating timer calls `scrollItem("next")` on the
   *        Glider instance. If the Glider has not yet resolved, the timer logs
   *        `<no glider>` until the instance becomes available.
   * @param {number} [options.slidesToShow]
   *        Passed directly to the Glider constructor. Determines how many slides
   *        are visible at once.
   * @param {number} [options.slidesToScroll]
   *        Passed directly to the Glider constructor. Determines how many slides
   *        advance per scroll.
   * @param {boolean} [options.draggable]
   *        Passed directly to Glider. Enables or disables drag‑to‑scroll behavior.
   * @param {boolean} [options.scrollLock]
   *        Passed directly to Glider. Locks scrolling to prevent partial slide visibility.
   * @param {Object} [options.responsive]
   *        A Glider.js responsive configuration object defining breakpoints and
   *        per‑breakpoint settings.
   *
   * @returns {void} This function does not return a value; initialization occurs
   *          asynchronously once the element becomes visible.
   */
  function InitGliderWhenVisible(track, options) {
    const observer = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;

        let newGlider = null;

        console.debug("Initializing carousel glider options: ", options);
       
        InitCarouselAsync(track, options).then(glider => {
            newGlider = glider;
        });

        // Turn off the dots if specified.
        if ((options?.nodots ?? false) === true) {
            const dots = newCarousel.querySelector('.glider-dots');
            if (dots) dots.style.display = "none";
        }

        const timeInterval = options?.timeInterval ?? 0;
        if (timeInterval > 0) {
            setInterval(() => {
                newGlider?.scrollItem("next");
            }, timeInterval);
        }

        observer.disconnect();
    });

    observer.observe(track);
  }
  
  InitGliderWhenVisible(track, {
        slidesToShow: options?.slidesToShow ?? 1,
        slidesToScroll: options?.slidesToScroll ?? 1,
        draggable: options?.draggable ?? true,
        dots: '.glider-dots',
        rewind: options?.rewind ?? true,
        arrows: {
          prev: '.glider-prev',
          next: '.glider-next'
        },
        timeInterval: options?.timeInterval ?? 0,
        nodots: options?.nodots ?? false
      }); 
  return newCarousel;
}

/**
 * @summary
 * Builds and renders photo displays (albums or carousels) for a group page.
 * @description
 * Determines whether photos are grouped, creates Brizy tabs when needed,
 * and renders each group according to its configured display type.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @async
 * @function BuildPhotoDisplaysAsync
 * @param {string} idGroupTabs - The DOM element ID of the Brizy tab container.
 * @returns {Promise<void>} Resolves when all photo displays have been rendered.
 *
 * @typedef {Object} GroupData
 * @property {Object|null} [base] - Base metadata for the group.
 * @property {string|null} [base.image] - URL of the master group image.
 * @property {boolean|null} [base.grouped] - Whether images are grouped.
 * @property {GroupDisplayInfo|null} [display] - Display configuration for ungrouped images.
 * @property {Array<GroupImage>|null} [images] - Ungrouped image list.
 * @property {Array<GroupObject>|null} [groups] - Grouped image sets.
 *
 * @typedef {Object} GroupObject
 * @property {string|null} [groupName] - Name of the group.
 * @property {Array<GroupImage>} images - Images belonging to this group.
 * @property {GroupDisplayInfo|null} [display] - Display configuration for this group.
 *
 * @typedef {Object} GroupImage
 * @property {string} src - CDN-relative image source path.
 * @property {string|null} [description] - Optional caption text.
 * @property {number|null} [order] - Sort order for display.
 * @property {Object|null} [display] - Optional display overrides.
 * @property {string|number|null} [display.width] - Width or "auto".
 * @property {string|number|null} [display.height] - Height or "auto".
 *
 * @typedef {Object} GroupDisplayInfo
 * @property {number|null} [numColumns] - Number of columns for album layout.
 * @property {string|null} [icon] - Icon name for Brizy tab.
 * @property {"album"|"carousel"|null} [type] - Display type.
 *
 * @typedef {Object} BuildOptions
 * @property {HTMLElement|null} [parent] - Parent element to append content into.
 * @property {HTMLElement|null} [sibling] - Sibling element for insertAdjacentElement.
 * @property {"beforebegin"|"afterbegin"|"beforeend"|"afterend"|null} [siblingPosition]
 * @property {number|null} [timeInterval] - Carousel interval in ms.
 *
 * @example
 * await BuildPhotoDisplaysAsync("group-tabs");
 */
export async function BuildPhotoDisplaysAsync(idGroupTabs) {
    const DISPLAY_TYPE_ALBUM = "album";
    const DISPLAY_TYPE_CAROUSEL = "carousel";
    const DISPLAY_TYPE_DEFAULT = DISPLAY_TYPE_ALBUM;

    const groupTabs = document.getElementById(idGroupTabs);
    const sectionImages = document.getElementById("media-links");

    const urlSlug = GetSlugFromUrl();
    const groupData = await GetGroupImageLinksAsync(urlSlug);
    const masterGroupImage = groupData?.base?.image ?? null;
    const haveImageGroups = groupData?.base?.grouped ?? false;

    /**
     * Ensures an element has at least the specified minimum padding on all sides.
     *
     * @function EnsureMinPadding
     * @param {HTMLElement} el - The target DOM element.
     * @param {number} [min=10] - Minimum padding in pixels.
     * @returns {void}
     */
    function EnsureMinPadding(el, min = 10) {
        const styles = window.getComputedStyle(el);
        const sides = ["Top", "Right", "Bottom", "Left"];

        sides.forEach(side => {
            const value = parseInt(styles[`padding${side}`], 10);
            if (isNaN(value) || value < min) {
                el.style[`padding${side}`] = `${min}px`;
            }
        });
    }

    EnsureMinPadding(sectionImages, 50);

    /** @returns {void} */
    function HideGroupTabs() { groupTabs.style.display = "none"; }

    /** @returns {void} */
    function ShowGroupTabs() { groupTabs.style.display = "block"; }

    /** @returns {void} */
    function HideSectionImages() { sectionImages.style.display = "none"; }

    /** @returns {void} */
    function ShowSectionImages() { sectionImages.style.display = "block"; }

    if (!groupData) return;

    ShowSectionImages();

    /**
     * Builds an array of image groups based on groupData.
     *
     * @function GetImageGroups
     * @returns {Array<GroupObject>} Array of image group objects.
     */
    function GetImageGroups() {
        const imageGroups = [];

        if (haveImageGroups) {
            groupData.groups.forEach((group, index) => {
                const newGroup = {
                    groupName: group?.groupName ?? `Group ${index + 1}`,
                    images: group?.images.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)) ?? null,
                    display: group?.display ?? null
                };
                imageGroups.push(newGroup);
            });
        } else {
            const singleGroup = {
                images: groupData?.images.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)) ?? null,
                display: groupData?.display ?? null
            };
            imageGroups.push(singleGroup);
        }
        return imageGroups;
    }

    const imageGroups = GetImageGroups();
    console.debug(`groupData (haveImageGroups: ${haveImageGroups}):`, groupData);

    /**
     * Extracts display configuration for an image group.
     *
     * @function GetImageGroupDisplayInfo
     * @param {GroupObject} group - The image group.
     * @returns {GroupDisplayInfo} Display info including numColumns, icon, and type.
     */
    function GetImageGroupDisplayInfo(group) {
        return {
            numColumns: group.display?.numColumns ?? 1,
            icon: group.display?.icon ?? null,
            type: group.display?.type ?? DISPLAY_TYPE_DEFAULT
        };
    }

    /**
     * Builds an album-style image display for a group.
     *
     * @function BuildImageGroupAlbum
     * @param {GroupObject} group - The image group.
     * @param {number} groupIndex - Index of the group; 0+ means tabbed, -1 means standalone.
     * @param {BuildOptions} options - Rendering options.
     * @returns {void}
     */
    function BuildImageGroupAlbum(group, groupIndex, options) {
        const groupImages = group.images;
        const displayInfo = GetImageGroupDisplayInfo(group);

        /**
         * Creates the full album table and inserts it into the DOM.
         *
         * @function CreateGroupAlbumTable
         * @returns {{wrapper: HTMLElement, newTable: HTMLTableElement}}
         */
        function CreateGroupAlbumTable() {

            /**
             * Creates the wrapper and table element for an album.
             *
             * @function CreateImagesTable
             * @returns {{wrapper: HTMLElement, table: HTMLTableElement}}
             */
            function CreateImagesTable() {
                const wrapper = document.createElement("div");
                wrapper.className = "brz-container brz-container--boxed";
                wrapper.style.textAlign = "center";

                const tbl = document.createElement("table");

                if (groupImages.length === 0 || groupImages.every(image => image.display?.width === "auto")) {
                    tbl.style.width = "90%";
                    tbl.style.margin = "0 auto";
                } else {
                    tbl.style.margin = "0 5%";
                }

                tbl.style.borderCollapse = "collapse";
                wrapper.appendChild(tbl);

                if (options.parent) {
                    options.parent.appendChild(wrapper);
                } else if (options.sibling) {
                    const positions = ["beforebegin", "afterbegin", "beforeend", "afterend"];
                    const sibPos = positions.includes(options.siblingPosition)
                        ? options.siblingPosition
                        : "afterend";
                    options.sibling.insertAdjacentElement(sibPos, wrapper);
                }

                return { wrapper, table: tbl };
            }

            /**
             * Adds a row of images to the album table.
             *
             * @function AddRow
             * @param {HTMLTableElement} tbl - The table to append to.
             * @param {Array<GroupImage>} images - Array of image objects for the row.
             * @returns {void}
             */
            function AddRow(tbl, images) {
                const row = document.createElement("tr");
                tbl.appendChild(row);

                const sortedImages = images.sort((a, b) => {
                    const ao = Number.isInteger(a.order) ? a.order : 0;
                    const bo = Number.isInteger(b.order) ? b.order : 0;
                    return ao - bo;
                });

                sortedImages.forEach(image => {
                    const iWidth = image.display?.width ?? "auto";
                    const iHeight = image.display?.height ?? "auto";

                    const cell = document.createElement("td");
                    const fig = document.createElement("figure");
                    const img = document.createElement("img");

                    if (iWidth === "auto" && iHeight === "auto") {
                        cell.style.setProperty("width", (100 / displayInfo.numColumns) + "%", "important");
                    } else if (iWidth !== "auto" && iHeight === "auto") {
                        fig.style.setProperty("width", iWidth, "important");
                    } else if (iWidth === "auto" && iHeight !== "auto") {
                        img.style.setProperty("height", iHeight, "important");
                    } else {
                        fig.style.setProperty("width", iWidth, "important");
                        img.style.setProperty("height", iHeight, "important");
                    }

                    cell.style.height = iHeight;
                    cell.style.verticalAlign = "top";
                    cell.style.padding = "10px";
                    row.appendChild(cell);

                    fig.style.margin = "0";
                    fig.style.display = "block";
                    cell.appendChild(fig);

                    fig.appendChild(img);
                    img.src = ConstructUrlCDN(image.src);
                    img.alt = image.description ?? "";
                    img.style.display = "block";
                    img.style.paddingTop = "5px";
                    img.style.paddingBottom = "5px";

                    if (image.description) {
                        const cap = document.createElement("figcaption");
                        fig.appendChild(cap);
                        cap.textContent = image.description;
                        cap.style.textAlign = "center";
                        fig.style.removeProperty("width");
                    }
                });
            }

            const { wrapper, table } = CreateImagesTable();

            for (let i = 0; i < groupImages.length; i += displayInfo.numColumns) {
                const chunk = groupImages.slice(i, i + displayInfo.numColumns);
                AddRow(table, chunk);
            }

            return { wrapper, newTable: table };
        }

        /**
         * Creates a Brizy tab containing the album for this group.
         *
         * @function CreateGroupAlbumTab
         * @returns {void}
         */
        function CreateGroupAlbumTab() {
            const tabName = group.groupName;
            const display = group.display;

            const { wrapper } = CreateGroupAlbumTable();

            AddBrizyTab(groupTabs, tabName, wrapper, display?.icon ?? null);
        }

        if (haveImageGroups) {
            CreateGroupAlbumTab();
            if (groupIndex === 0) {
                RemoveBrizyTab(groupTabs, 0);
            }
        } else {
            CreateGroupAlbumTable();
        }

        SyncImageCaptionWidths();
    }

    /**
     * Builds a carousel-style image display for a group.
     *
     * @function BuildImageGroupCarousel
     * @param {GroupObject} group - The image group.
     * @param {number} groupIndex - Index of the group; 0+ means tabbed, -1 means standalone.
     * @param {BuildOptions} options - Rendering options.
     * @returns {void}
     */
    function BuildImageGroupCarousel(group, groupIndex, options) {
        const groupImages = group.images;
        const displayInfo = GetImageGroupDisplayInfo(group);

        const slides = groupImages
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(x => ({ url: ConstructUrlCDN(x.src), caption: x.description }));

        /**
         * Creates the carousel component for the group.
         *
         * @function CreateGroupCarousel
         * @returns {HTMLElement} The carousel wrapper element.
         */
        function CreateGroupCarousel() {
            return BuildCarousel(slides, options);
        }

        /**
         * Creates a Brizy tab containing the carousel for this group.
         *
         * @function CreateGroupCarouselTab
         * @returns {void}
         */
        function CreateGroupCarouselTab() {
            const tabName = group.groupName;
            const display = group.display;

            const newCarousel = CreateGroupCarousel();

            AddBrizyTab(groupTabs, tabName, newCarousel, display?.icon ?? null);
        }

        if (haveImageGroups) {
            CreateGroupCarouselTab();
            if (groupIndex === 0) {
                RemoveBrizyTab(groupTabs, 0);
            }
        } else {
            CreateGroupCarousel();
        }
    }

    /**
     * Processes a single image group and renders it according to its display type.
     *
     * @function ProcessImageGroup
     * @param {GroupObject} group - The image group.
     * @param {number} groupIndex - Index of the group; -1 means standalone.
     * @param {BuildOptions} [options] - Rendering options.
     * @returns {void}
     */
    function ProcessImageGroup(group, groupIndex, options = {}) {
        const displayInfo = GetImageGroupDisplayInfo(group);

        if (groupIndex < 0) {
            const wrapper = document.createElement("div");
            wrapper.style.width = "900px";
            wrapper.style.margin = "0 auto";
            sectionImages.appendChild(wrapper);
            options.parent = wrapper;
        }

        switch (displayInfo.type) {
            case DISPLAY_TYPE_ALBUM:
                BuildImageGroupAlbum(group, groupIndex, options);
                break;

            case DISPLAY_TYPE_CAROUSEL:
                options.timeInterval = 5000;
                BuildImageGroupCarousel(group, groupIndex, options);
                break;
        }
    }

    HideGroupTabs();

    if (haveImageGroups) {
        imageGroups.forEach((group, index) => {
            ProcessImageGroup(group, index);
        });

        ActivateBrizyTab(groupTabs, "first");
        ShowGroupTabs();
    } else {
        const singleGroup = imageGroups[0];
        ProcessImageGroup(singleGroup, -1, {
            parent: sectionImages
        });
    }
}

/**
 * @summary
 * Synchronizes the width of each <figcaption> with the rendered width of its
 * corresponding <img> inside table cells. This ensures captions wrap correctly
 * under images regardless of responsive scaling or dynamic layout changes.
 * @description
 * The function:
 *   - Selects all <figure> elements inside <td> cells.
 *   - Locates the <img> and <figcaption> within each figure.
 *   - Measures the actual rendered width of the image using getBoundingClientRect().
 *   - Applies that width to the caption and sets wrapping styles.
 *   - Handles both cached and newly loaded images by checking `img.complete`
 *     and attaching a `load` event listener when needed.
 * @author Anthony Bernard Colson (Tierrasanta Lutheran Church)
 * @version 1.0.0
 * @since 2026-08-31
 * @changelog
 *   - 2026-08-31: Initial creation.
 *
 * @function SyncImageCaptionWidths
 * @returns {void}
 *
 * @example
 * // After dynamically inserting images into a table:
 * SyncImageCaptionWidths();
 *
 * @example
 * // Ensuring captions resize after layout changes:
 * window.addEventListener('resize', SyncImageCaptionWidths);
 */
export function SyncImageCaptionWidths() {
    document.querySelectorAll('td figure').forEach(function (fig) {
        var img = fig.querySelector('img');
        var cap = fig.querySelector('figcaption');
        if (!img || !cap) return;

        /**
         * Measures the rendered width of the image and applies it to the caption.
         *
         * @returns {void}
         */
        function syncCaptionWidth() {
            var w = img.getBoundingClientRect().width;
            if (!w) return;

            cap.style.width = w + 'px';
            cap.style.whiteSpace = 'normal';
            cap.style.overflowWrap = 'break-word';
            cap.style.boxSizing = 'border-box';
        }

        if (img.complete) {
            // Image already loaded (cached)
            syncCaptionWidth();
        } else {
            // Wait for the image to load
            img.addEventListener('load', syncCaptionWidth);
        }
    });
}

// --- Global fallback for non-module usage ---
if (typeof window !== "undefined") {
    window.BrizyHelper = {
        GetEventDateParts,
        GetEventStartTime,
        GetSlugFromUrl,
        GetBrizyTabCount,
        ActivateBrizyTab,
        RemoveBrizyTab,
        AddBrizyTab,
        BuildCarousel,
        BuildPhotoDisplaysAsync,
        SyncImageCaptionWidths
    };
}
