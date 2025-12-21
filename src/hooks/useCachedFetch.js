import { useState, useEffect, useCallback } from 'react';

/**
 * Production-grade caching hook for API requests
 * Implements localStorage caching with configurable expiry to respect API rate limits
 *
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options (headers, method, etc.)
 * @param {number} cacheTime - Cache duration in milliseconds (default: 24 hours)
 * @returns {object} - { data, loading, error, refetch, clearCache }
 */
const useCachedFetch = (url, options = {}, cacheTime = 24 * 60 * 60 * 1000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate a unique cache key based on URL and options
  const getCacheKey = useCallback(() => {
    const optionsString = JSON.stringify(options);
    return `cache_${url}_${btoa(optionsString)}`;
  }, [url, options]);

  // Check if cached data is still valid
  const isCacheValid = useCallback((cacheEntry) => {
    if (!cacheEntry) return false;

    const now = new Date().getTime();
    const expiryTime = cacheEntry.timestamp + cacheTime;

    return now < expiryTime;
  }, [cacheTime]);

  // Get data from cache
  const getFromCache = useCallback(() => {
    try {
      const cacheKey = getCacheKey();
      const cachedData = localStorage.getItem(cacheKey);

      if (!cachedData) return null;

      const cacheEntry = JSON.parse(cachedData);

      if (isCacheValid(cacheEntry)) {
        return cacheEntry.data;
      } else {
        // Cache expired, remove it
        localStorage.removeItem(cacheKey);
        return null;
      }
    } catch (err) {
      console.warn('Error reading from cache:', err);
      return null;
    }
  }, [getCacheKey, isCacheValid]);

  // Save data to cache
  const saveToCache = useCallback((responseData) => {
    try {
      const cacheKey = getCacheKey();
      const cacheEntry = {
        data: responseData,
        timestamp: new Date().getTime()
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (err) {
      console.warn('Error saving to cache:', err);
      // If localStorage is full, clear old entries
      if (err.name === 'QuotaExceededError') {
        clearOldCaches();
        // Try again
        try {
          const cacheKey = getCacheKey();
          const cacheEntry = {
            data: responseData,
            timestamp: new Date().getTime()
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        } catch (retryErr) {
          console.error('Failed to cache after cleanup:', retryErr);
        }
      }
    }
  }, [getCacheKey]);

  // Clear old cache entries
  const clearOldCaches = useCallback(() => {
    const now = new Date().getTime();
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith('cache_')) {
        try {
          const cacheEntry = JSON.parse(localStorage.getItem(key));
          const expiryTime = cacheEntry.timestamp + cacheTime;

          if (now >= expiryTime) {
            keysToRemove.push(key);
          }
        } catch (err) {
          // Invalid cache entry, remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, [cacheTime]);

  // Fetch data from API
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cachedData = getFromCache();
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // No valid cache, fetch from API
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // Response wasn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      // Save to cache
      saveToCache(responseData);

      setData(responseData);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);

      // On error, try to use stale cache if available
      const staleCache = getFromCache();
      if (staleCache) {
        setData(staleCache);
        setError(null); // Use stale data instead of showing error
      }
    } finally {
      setLoading(false);
    }
  }, [url, options, getFromCache, saveToCache]);

  // Clear cache for this specific request
  const clearCache = useCallback(() => {
    try {
      const cacheKey = getCacheKey();
      localStorage.removeItem(cacheKey);
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }, [getCacheKey]);

  // Refetch with option to bypass cache
  const refetch = useCallback((forceRefresh = true) => {
    fetchData(forceRefresh);
  }, [fetchData]);

  // Initial fetch on mount or when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup old caches periodically
  useEffect(() => {
    clearOldCaches();
  }, [clearOldCaches]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache
  };
};

/**
 * Utility function to clear all cached data
 */
export const clearAllCache = () => {
  const keysToRemove = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cache_')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
};

/**
 * Utility function to get cache statistics
 */
export const getCacheStats = () => {
  let cacheCount = 0;
  let totalSize = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cache_')) {
      cacheCount++;
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }
  }

  return {
    cacheCount,
    totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(2)
  };
};

export default useCachedFetch;
