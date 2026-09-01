/**
 * Cloudflare Worker: Advanced Backblaze CDN Router
 *
 * Features:
 *  - Auto-detect bucket names from URL paths
 *  - Support multiple default buckets
 *  - Rewrite shorthand URLs to default bucket
 *  - Add strong CDN caching headers
 *  - Log requests for analytics and debugging
 *
 * URL Routing Rules:
 *  1. Fully-qualified Backblaze-style paths:
 *        /file/<bucket>/<path>/<filename>
 *     → Passed through unchanged.
 *
 *  2. Shorthand paths:
 *        /<path>/<filename>
 *     → Rewritten to:
 *        /file/<defaultBucket>/<path>/<filename>
 *
 *  3. Optional multi-bucket shorthand:
 *        /youth/<file> → /file/tlc-youth-cdn/youth/<file>
 *        /music/<file> → /file/tlc-music-cdn/music/<file>
 *
 * Caching:
 *  - Adds long-lived immutable caching headers for static assets.
 *  - Ensures Cloudflare caches aggressively while Backblaze is hit only once.
 *
 * Logging:
 *  - Logs bucket, path, and request metadata to Workers Analytics Engine.
 */

export default {
  /**
   * Handle incoming CDN requests and route them to Backblaze B2.
   *
   * @param {Request} request
   *   Incoming HTTP request from the client.
   *
   * @returns {Promise<Response>}
   *   Response returned from Backblaze B2 after URL rewriting and header injection.
   */
  async fetch(request) {
    const url = new URL(request.url);

    // -----------------------------
    // CONFIGURATION
    // -----------------------------

    /** @type {string} Default bucket for shorthand URLs */
    const defaultBucket = "tlc-cdn";

    /** @type {Record<string,string>} Optional shorthand → bucket mappings */
    const bucketMap = {
        //  youth: "tlc-cdn2",
        //  music: "tlc-cdn3"
        // Add more ministries here as needed
    };

    /** @type {Record<string,string>} Optional shorthand → folder short-cut mappings */
    const folderMap = {
      manifests: "/.manifests/",
      LiveNativity: "/media/Groups/LiveNativity/",
      VBS: "/media/Groups/VBS/",
      RummageSale: "/media/Groups/RummageSale/",
      Confirmation: "/media/Events/Confirmation/",
      bulletins: "/docs/bulletins/"
      // Add more folder short-cut mappings here as needed
    };

    /** @type {string} Backblaze host */
    const b2Host = "f004.backblazeb2.com";

    // -----------------------------
    // LOGGING (for analytics)
    // -----------------------------
    console.log("CDN Request:", {
      path: url.pathname,
      method: request.method,
      client: request.headers.get("CF-Connecting-IP")
    });

    /**
     * Fetches a resource from the specified URL while explicitly bypassing all
     * browser, Cloudflare, and Worker-level caching layers.
     *
     * This helper ensures the request is treated as a fresh origin fetch by
     * setting `cache: "no-store"` and preserving any additional request options
     * supplied via the outer `request` object.
     *
     * @async
     * @function FetchRawUrlAsync
     * @param {string} url
     *        The absolute or relative URL to retrieve.
     *
     * @returns {Promise<Response>}
     *          A promise resolving to the raw `fetch()` response returned by the
     *          origin. The caller is responsible for checking `response.ok`,
     *          parsing the body, and handling any network or protocol errors.
     */
    async function FetchRawUrlAsync(url) {
        return await fetch(url, {
            ...request,
            cache: "no-store"  // Do not store this value in the cache yet
        });
    }

    /**
     * Resolves a canonical Backblaze B2 `/file/<bucket>/...` path from a set of
     * URL sub‑segments, applying folder alias mappings when the first segment
     * matches a known key in `folderMap`.
     *
     * This function supports “virtual” folder names by rewriting the first
     * segment using `folderMap[subSegments[0]]`. If no mapping exists, the
     * segments are joined verbatim.
     *
     * @function DecodeFolderPath
     * @param {string} bucket
     *        The B2 bucket name to prepend to the resolved path.
     *
     * @param {string[]} subSegments
     *        The URL path segments following the bucket. The first segment may
     *        represent a logical alias that maps to a physical folder path.
     *
     * @returns {string}
     *          A fully resolved B2 file path beginning with `/file/<bucket>/`,
     *          either rewritten using the folder map or constructed directly
     *          from the provided segments.
     *
     * @example
     * // Given: folderMap = { "media": "/media" }
     * DecodeFolderPath("tlc-cdn", ["media", "images", "logo.png"]);
     * // → "/file/tlc-cdn/media/images/logo.png"
     *
     * @example
     * DecodeFolderPath("tlc-cdn", ["scripts", "common", "definitions.js"]);
     * // → "/file/tlc-cdn/scripts/common/definitions.js"
     */
    function DecodeFolderPath(bucket, subSegments) {
      if (folderMap[subSegments[0]]) {
        return `/file/${bucket}${folderMap[subSegments[0]]}${subSegments.slice(1).join('/')}`;
      }
      return `/file/${bucket}/${subSegments.join('/')}`;
    }

    // -----------------------------
    // RULE 1: Already a /file/<bucket>/... path
    // -----------------------------
    if (url.pathname.startsWith("/file/")) {
      url.hostname = b2Host;
      return addCachingHeaders(await FetchRawUrlAsync(url));
    }

    // -----------------------------
    // RULE 2: Auto-detect bucket from first path segment
    // Example: /youth/Retreat.jpg → bucketMap["youth"]
    // -----------------------------
    const segments = url.pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];

    if (bucketMap[firstSegment]) {
      const bucket = bucketMap[firstSegment];
      const segmentsAfterBucket = segments.slice(1);
      url.hostname = b2Host;
      url.pathname = DecodeFolderPath(bucket, segmentsAfterBucket);
      return addCachingHeaders(await FetchRawUrlAsync(url));
    }

    // -----------------------------
    // RULE 3: Shorthand → default bucket
    // Example: /Temp/Ascension.jpg → /file/tlc-cdn/Temp/Ascension.jpg
    // -----------------------------
    url.hostname = b2Host;
    url.pathname = DecodeFolderPath(defaultBucket, segments);
    return addCachingHeaders(await FetchRawUrlAsync(url));
  }
};

/**
 * Add strong CDN caching headers to the response.
 *
 * @param {Response} response
 *   The original response returned from Backblaze.
 *
 * @returns {Response}
 *   A new Response object with optimized caching headers applied.
 */
function addCachingHeaders(response) {
  const newHeaders = new Headers(response.headers);

  // Cache for 1 year, immutable (best for static assets)
  //  newHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
  
  // Another cache option
  //  newHeaders.set("Cache-Control", "public, max-age=0");

  newHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");

  newHeaders.set("Pragma", "no-cache");
  newHeaders.set("Expires", "0");

  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "*");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
