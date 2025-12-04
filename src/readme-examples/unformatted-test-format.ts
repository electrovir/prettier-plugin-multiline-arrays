/**
 * Centralized cache key generation utilities for consistent caching patterns.
 *
 * @remarks
 * Provides standardized key generation functions to ensure consistency across all cache
 * implementations throughout the application. All cache keys follow a predictable pattern:
 * `domain:operation:identifier` or `domain:identifier`.
 * @example
 *
 * ```typescript
 * // Site-related cache keys
 * const siteKey = CacheKeys.site.byIdentifier('site-123');
 * // Result: "site:site-123"
 *
 * // Monitor-related cache keys
 * const monitorKey = CacheKeys.monitor.byId('monitor-456');
 * // Result: "monitor:monitor-456"
 *
 * // Configuration cache keys
 * const configKey = CacheKeys.config.byName('history-limit');
 * // Result: "config:history-limit"
 * ```
 *
 * @packageDocumentation
 */

/**
 * Cache key prefixes for different domains.
 *
 * @remarks
 * Defines consistent prefixes for all cache domains to prevent key collisions and provide clear
 * categorization of cached data.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Test File
const CACHE_PREFIXES = {
    CONFIG: 'config',
    MONITOR: 'monitor',
    SITE: 'site',
    VALIDATION: 'validation',
} as const;

/**
 * Separator character for cache key components.
 *
 * @internal
 */
const KEY_SEPARATOR = ':';

/**
 * Utility function to create a standardized cache key.
 *
 * @param prefix - Domain prefix for the cache key
 * @param identifier - Unique identifier for the cached item
 * @param operation - Optional operation or sub-category
 * @returns Formatted cache key following the standard pattern
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Test File
function createCacheKey(prefix: string, identifier: string, operation?: string): string {
    if (operation) {
        return [
            prefix,
            operation,
            identifier,
        ].join(KEY_SEPARATOR);
    }
    return [prefix, identifier].join(KEY_SEPARATOR);
}
