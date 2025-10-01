/**
 * Enhanced Storage Manager
 * Comprehensive storage management with quota monitoring, cleanup, and optimization
 */

import { notificationManager } from '../services/notifications.js';
import { ModuleErrorBoundary } from './error-boundary.js';
import { configService } from '../services/config.js';
import { getStorageKeys } from './constants.js';

// Storage configuration constants
const STORAGE_CONFIG = {
  QUOTA_WARNING_THRESHOLD: 0.75,    // 75% usage warning
  QUOTA_CLEANUP_THRESHOLD: 0.85,    // 85% usage triggers cleanup
  QUOTA_CRITICAL_THRESHOLD: 0.95,   // 95% usage triggers aggressive cleanup

  MAX_ERROR_LOG_ENTRIES: 50,
  MAX_MATCH_HISTORY_ENTRIES: 100,
  MAX_CACHE_AGE: 86400000,          // 24 hours in milliseconds

  COMPRESSION_THRESHOLD: 1024,       // Compress data larger than 1KB
  CLEANUP_INTERVAL: 300000,          // 5 minutes
  QUOTA_CHECK_INTERVAL: 60000,       // 1 minute

  // Fallback prefixes when configuration is not available
  FALLBACK_STORAGE_PREFIX: 'gt_',
  FALLBACK_CACHE_PREFIX: 'gt-cache-',
  TEMP_KEYS_PATTERNS: ['temp_', 'cache_', '_tmp', '_temp'],
  CACHE_KEYS_PATTERNS: ['cached_', '_cache', 'cache_']
};

class StorageQuotaManager {
  constructor() {
    this.quotaInfo = null;
    this.lastQuotaCheck = 0;
    this.cleanupInProgress = false;
    this.compressionEnabled = true;
    this.encryptionEnabled = false;
    this.storageCache = new Map();
    this.observers = new Set();
    this.migrationCompleted = false;

    // Bind methods for event listeners
    this._handleStorageEvent = this._handleStorageEvent.bind(this);
    this._handleBeforeUnload = this._handleBeforeUnload.bind(this);
  }

  /**
   * Get current storage key prefix from configuration
   * @returns {string} Storage key prefix
   */
  getStoragePrefix() {
    if (configService.isConfigLoaded()) {
      const storageConfig = configService.getStorageConfig();
      return storageConfig?.keyPrefix || STORAGE_CONFIG.FALLBACK_STORAGE_PREFIX;
    }
    return STORAGE_CONFIG.FALLBACK_STORAGE_PREFIX;
  }

  /**
   * Get current cache prefix from configuration
   * @returns {string} Cache prefix
   */
  getCachePrefix() {
    if (configService.isConfigLoaded()) {
      const storageConfig = configService.getStorageConfig();
      return storageConfig?.cachePrefix || STORAGE_CONFIG.FALLBACK_CACHE_PREFIX;
    }
    return STORAGE_CONFIG.FALLBACK_CACHE_PREFIX;
  }

  /**
   * Migrate existing storage keys to new prefixes
   * @param {string} oldPrefix - Old storage prefix
   * @param {string} newPrefix - New storage prefix
   * @returns {Promise<Object>} Migration result
   */
  async migrateStorageKeys(oldPrefix = 'nugt_', newPrefix = null) {
    if (this.migrationCompleted) {
      console.log('Storage migration already completed');
      return { migrated: 0, errors: 0, skipped: 0 };
    }

    return ModuleErrorBoundary.wrap(async () => {
      const targetPrefix = newPrefix || this.getStoragePrefix();
      
      if (oldPrefix === targetPrefix) {
        console.log('No migration needed - prefixes are the same');
        this.migrationCompleted = true;
        return { migrated: 0, errors: 0, skipped: 0 };
      }

      console.log(`🔄 Migrating storage keys from '${oldPrefix}' to '${targetPrefix}'...`);

      const migrationResults = {
        migrated: 0,
        errors: 0,
        skipped: 0,
        details: []
      };

      // Get all keys that match the old prefix
      const keysToMigrate = [];
      for (let key in localStorage) {
        if (key.startsWith(oldPrefix)) {
          keysToMigrate.push(key);
        }
      }

      console.log(`Found ${keysToMigrate.length} keys to migrate`);

      for (const oldKey of keysToMigrate) {
        try {
          const newKey = oldKey.replace(oldPrefix, targetPrefix);
          
          // Check if new key already exists
          if (localStorage.getItem(newKey) !== null) {
            console.log(`Skipping migration of ${oldKey} - target key ${newKey} already exists`);
            migrationResults.skipped++;
            migrationResults.details.push({ oldKey, newKey, status: 'skipped', reason: 'target_exists' });
            continue;
          }

          // Get the data from old key
          const data = localStorage.getItem(oldKey);
          if (data !== null) {
            // Set data with new key
            localStorage.setItem(newKey, data);
            
            // Verify the migration was successful
            if (localStorage.getItem(newKey) === data) {
              // Remove old key only after successful verification
              localStorage.removeItem(oldKey);
              migrationResults.migrated++;
              migrationResults.details.push({ oldKey, newKey, status: 'migrated' });
              console.log(`✅ Migrated: ${oldKey} → ${newKey}`);
            } else {
              migrationResults.errors++;
              migrationResults.details.push({ oldKey, newKey, status: 'error', reason: 'verification_failed' });
              console.error(`❌ Migration verification failed: ${oldKey} → ${newKey}`);
            }
          } else {
            migrationResults.skipped++;
            migrationResults.details.push({ oldKey, newKey, status: 'skipped', reason: 'no_data' });
          }
        } catch (error) {
          migrationResults.errors++;
          migrationResults.details.push({ oldKey, status: 'error', reason: error.message });
          console.error(`❌ Error migrating ${oldKey}:`, error);
        }
      }

      this.migrationCompleted = true;
      
      console.log(`✅ Storage migration completed:`, migrationResults);
      
      if (migrationResults.migrated > 0) {
        this._notifyObservers('migrationCompleted', migrationResults);
        notificationManager?.success(`Migrated ${migrationResults.migrated} storage keys to new format`);
      }

      return migrationResults;
    }, () => ({ migrated: 0, errors: 1, skipped: 0 }), 'StorageMigration')();
  }

  /**
   * Validate storage operations use correct prefixes
   * @param {string} key - Storage key to validate
   * @returns {boolean} True if key uses correct prefix
   */
  validateStorageKey(key) {
    const currentPrefix = this.getStoragePrefix();
    const currentCachePrefix = this.getCachePrefix();
    
    // Check if key uses current storage prefix or cache prefix
    return key.startsWith(currentPrefix) || 
           key.startsWith(currentCachePrefix) ||
           STORAGE_CONFIG.TEMP_KEYS_PATTERNS.some(pattern => key.includes(pattern)) ||
           STORAGE_CONFIG.CACHE_KEYS_PATTERNS.some(pattern => key.includes(pattern));
  }

  /**
   * Get storage key with correct prefix
   * @param {string} keyName - Base key name (without prefix)
   * @returns {string} Full storage key with prefix
   */
  getStorageKey(keyName) {
    const prefix = this.getStoragePrefix();
    return prefix + keyName;
  }

  /**
   * Get cache key with correct prefix
   * @param {string} keyName - Base key name (without prefix)
   * @returns {string} Full cache key with prefix
   */
  getCacheKey(keyName) {
    const prefix = this.getCachePrefix();
    return prefix + keyName;
  }

  async checkStorageQuota(force = false) {
    const now = Date.now();

    // Use cached result if recent and not forced
    if (!force && this.quotaInfo && (now - this.lastQuotaCheck) < STORAGE_CONFIG.QUOTA_CHECK_INTERVAL) {
      return this.quotaInfo;
    }

    return ModuleErrorBoundary.wrap(async () => {
      let quotaInfo;

      if ('storage' in navigator && 'estimate' in navigator.storage) {
        quotaInfo = await this._getStorageEstimate();
      } else {
        quotaInfo = this._estimateLocalStorageUsage();
      }

      this.quotaInfo = quotaInfo;
      this.lastQuotaCheck = now;

      // Handle quota thresholds
      await this._handleQuotaThresholds(quotaInfo);

      // Notify observers
      this._notifyObservers('quotaUpdated', quotaInfo);

      return quotaInfo;
    }, () => this.quotaInfo, 'StorageQuotaCheck')();
  }

  async _getStorageEstimate() {
    const estimate = await navigator.storage.estimate();
    const usagePercentage = estimate.quota > 0 ? (estimate.usage / estimate.quota) : 0;

    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usagePercentage: Math.round(usagePercentage * 10000) / 100,
      usageMB: Math.round(estimate.usage / 1048576 * 100) / 100,
      quotaMB: Math.round(estimate.quota / 1048576 * 100) / 100,
      available: estimate.quota - estimate.usage,
      availableMB: Math.round((estimate.quota - estimate.usage) / 1048576 * 100) / 100,
      estimated: false,
      timestamp: Date.now()
    };
  }

  _estimateLocalStorageUsage() {
    try {
      let totalSize = 0;
      let itemCount = 0;
      const categories = {};

      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const itemSize = localStorage[key].length + key.length;
          totalSize += itemSize;
          itemCount++;

          // Categorize for better insights
          const category = this._categorizeKey(key);
          if (!categories[category]) {
            categories[category] = { count: 0, size: 0 };
          }
          categories[category].count++;
          categories[category].size += itemSize;
        }
      }

      // Dynamic quota estimation based on browser
      const estimatedQuota = this._estimateQuotaSize();
      const usagePercentage = estimatedQuota > 0 ? (totalSize / estimatedQuota) : 0;

      return {
        usage: totalSize,
        quota: estimatedQuota,
        usagePercentage: Math.round(usagePercentage * 10000) / 100,
        usageMB: Math.round(totalSize / 1048576 * 100) / 100,
        quotaMB: Math.round(estimatedQuota / 1048576 * 100) / 100,
        available: estimatedQuota - totalSize,
        availableMB: Math.round((estimatedQuota - totalSize) / 1048576 * 100) / 100,
        itemCount,
        categories,
        estimated: true,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('LocalStorageEstimation error:', error);
      return this._getDefaultQuotaInfo();
    }
  }

  _estimateQuotaSize() {
    // Try to detect quota by attempting to store data
    try {
      const testKey = 'nugt_quota_test';
      const testData = 'x'.repeat(1024); // 1KB chunks
      let size = 0;

      // Test up to 10MB in 1KB increments (simplified)
      for (let i = 0; i < 10240; i++) {
        try {
          localStorage.setItem(testKey, testData.repeat(i));
          size = testData.length * i;
        } catch {
          break;
        }
      }

      localStorage.removeItem(testKey);

      // Return estimated quota (add some buffer)
      return Math.max(size * 1.2, 5 * 1024 * 1024); // At least 5MB
    } catch {
      // Fallback to common browser limits
      return 10 * 1024 * 1024; // 10MB default
    }
  }

  _getDefaultQuotaInfo() {
    return {
      usage: 0,
      quota: 5 * 1024 * 1024, // 5MB default
      usagePercentage: 0,
      usageMB: 0,
      quotaMB: 5,
      available: 5 * 1024 * 1024,
      availableMB: 5,
      estimated: true,
      error: true,
      timestamp: Date.now()
    };
  }

  async performRoutineCleanup() {
    if (this.cleanupInProgress) {
      console.log('Cleanup already in progress, skipping...');
      return false;
    }

    return ModuleErrorBoundary.wrap(async () => {
      this.cleanupInProgress = true;
      console.log('🧹 Performing routine storage cleanup...');

      const cleanupResults = {
        errorLogs: await this._cleanupErrorLogs(STORAGE_CONFIG.MAX_ERROR_LOG_ENTRIES),
        matches: await this._cleanupOldMatches(STORAGE_CONFIG.MAX_MATCH_HISTORY_ENTRIES),
        temporary: await this._cleanupTemporaryData(),
        expired: await this._cleanupExpiredData(),
        compressed: await this._compressLargeData()
      };

      const totalCleaned = Object.values(cleanupResults).reduce((sum, result) => sum + (result.bytesFreed || 0), 0);

      console.log('✅ Routine cleanup completed:', cleanupResults);

      if (totalCleaned > 0) {
        this._notifyObservers('cleanupCompleted', { type: 'routine', results: cleanupResults, bytesFreed: totalCleaned });
        notificationManager.success(`Storage cleanup freed ${this._formatBytes(totalCleaned)}`);
      }

      return cleanupResults;
    }, () => false, 'RoutineCleanup')().finally(() => {
      this.cleanupInProgress = false;
    });
  }

  async performAggressiveCleanup() {
    if (this.cleanupInProgress) {
      console.log('Cleanup already in progress, skipping...');
      return false;
    }

    return ModuleErrorBoundary.wrap(async () => {
      this.cleanupInProgress = true;
      console.log('🚨 Performing aggressive storage cleanup...');

      const cleanupResults = {
        errorLogs: await this._cleanupErrorLogs(10),
        matches: await this._cleanupOldMatches(20),
        temporary: await this._cleanupTemporaryData(),
        cached: await this._cleanupCachedData(),
        expired: await this._cleanupExpiredData(),
        compressed: await this._compressLargeData(),
        orphaned: await this._cleanupOrphanedData()
      };

      const totalCleaned = Object.values(cleanupResults).reduce((sum, result) => sum + (result.bytesFreed || 0), 0);

      console.log('✅ Aggressive cleanup completed:', cleanupResults);

      this._notifyObservers('cleanupCompleted', { type: 'aggressive', results: cleanupResults, bytesFreed: totalCleaned });
      notificationManager.warning(`Critical storage cleanup freed ${this._formatBytes(totalCleaned)}`);

      return cleanupResults;
    }, () => false, 'AggressiveCleanup')().finally(() => {
      this.cleanupInProgress = false;
    });
  }

  async _cleanupErrorLogs(maxEntries = STORAGE_CONFIG.MAX_ERROR_LOG_ENTRIES) {
    try {
      const errorLogKey = this.getStorageKey('error_log');
      const errorLog = JSON.parse(localStorage.getItem(errorLogKey) || '[]');

      if (errorLog.length <= maxEntries) {
        return { cleaned: 0, bytesFreed: 0 };
      }

      const originalSize = JSON.stringify(errorLog).length;
      const cleanedLog = errorLog.slice(-maxEntries);
      const newSize = JSON.stringify(cleanedLog).length;

      localStorage.setItem(errorLogKey, JSON.stringify(cleanedLog));

      const result = {
        cleaned: errorLog.length - cleanedLog.length,
        bytesFreed: originalSize - newSize,
        kept: cleanedLog.length
      };

      console.log(`🗑️ Error logs cleaned: ${errorLog.length} -> ${cleanedLog.length} entries`);
      return result;
    } catch (error) {
      console.error('ErrorLogCleanup error:', error);
      return { cleaned: 0, bytesFreed: 0, error: true };
    }
  }

  // Clean up old match data
  cleanupOldMatches(maxEntries = this.maxMatchHistoryEntries) {
    try {
      // This would need to be implemented based on how match history is stored
      // For now, we'll clean up any keys that look like match data
      const keysToCheck = [];
      for (let key in localStorage) {
        if (key.startsWith('nugt_match_') || key.startsWith('nugt_saved_match_')) {
          keysToCheck.push({
            key,
            timestamp: this.extractTimestamp(key),
            size: localStorage[key].length
          });
        }
      }

      // Sort by timestamp and keep only the most recent
      keysToCheck.sort((a, b) => b.timestamp - a.timestamp);

      if (keysToCheck.length > maxEntries) {
        const keysToRemove = keysToCheck.slice(maxEntries);
        keysToRemove.forEach(item => {
          localStorage.removeItem(item.key);
        });
        console.log(`Cleaned old matches: ${keysToCheck.length} -> ${maxEntries} entries`);
      }
    } catch (error) {
      console.warn('Could not cleanup old matches:', error);
    }
  }

  // Clean up temporary data
  cleanupTemporaryData() {
    try {
      const tempKeys = [];
      for (let key in localStorage) {
        if (key.includes('temp_') || key.includes('cache_') || key.includes('_tmp')) {
          tempKeys.push(key);
        }
      }

      tempKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      if (tempKeys.length > 0) {
        console.log(`Cleaned temporary data: ${tempKeys.length} keys removed`);
      }
    } catch (error) {
      console.warn('Could not cleanup temporary data:', error);
    }
  }

  // Clean up cached data
  cleanupCachedData() {
    try {
      const cacheKeys = [];
      for (let key in localStorage) {
        if (key.includes('cached_') || key.includes('_cache')) {
          cacheKeys.push(key);
        }
      }

      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      if (cacheKeys.length > 0) {
        console.log(`Cleaned cached data: ${cacheKeys.length} keys removed`);
      }
    } catch (error) {
      console.warn('Could not cleanup cached data:', error);
    }
  }

  // Extract timestamp from key (fallback to current time if not found)
  extractTimestamp(key) {
    const timestampMatch = key.match(/(\d{13})/); // 13-digit timestamp
    return timestampMatch ? parseInt(timestampMatch[1]) : Date.now();
  }

  // Get storage usage summary
  getStorageUsageSummary() {
    try {
      const summary = {};
      let totalSize = 0;

      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const size = localStorage[key].length + key.length;
          totalSize += size;

          // Categorize by key prefix
          const category = this.categorizeKey(key);
          if (!summary[category]) {
            summary[category] = { count: 0, size: 0 };
          }
          summary[category].count++;
          summary[category].size += size;
        }
      }

      summary.total = {
        count: Object.keys(localStorage).length,
        size: totalSize,
        sizeMB: Math.round(totalSize / 1048576 * 100) / 100
      };

      return summary;
    } catch (error) {
      console.warn('Could not get storage usage summary:', error);
      return null;
    }
  }

  // Categorize storage keys
  categorizeKey(key) {
    if (key.startsWith('nugt_match_') || key.startsWith('nugt_saved_match_')) return 'matches';
    if (key.startsWith('nugt_error_')) return 'errors';
    if (key.startsWith('nugt_user_') || key.startsWith('nugt_auth_')) return 'auth';
    if (key.includes('temp_') || key.includes('cache_')) return 'temporary';
    if (key.startsWith('nugt_')) return 'app_data';
    return 'other';
  }

  // Enhanced initialization
  async init() {
    try {
      console.log('🚀 Initializing Storage Manager...');

      // Wait for configuration to be loaded if it's not already
      if (!configService.isConfigLoaded()) {
        console.log('Waiting for configuration to load...');
        await configService.loadConfig();
      }

      // Check if migration is needed
      await this._checkAndPerformMigration();

      // Initial quota check
      await this.checkStorageQuota(true);

      // Set up event listeners
      this._setupEventListeners();

      // Set up periodic monitoring
      this._setupPeriodicTasks();

      // Set up configuration change listener
      configService.onConfigChange(this._handleConfigChange.bind(this));

      // Perform initial cleanup if needed
      const quotaInfo = await this.checkStorageQuota();
      if (quotaInfo && quotaInfo.usagePercentage > STORAGE_CONFIG.QUOTA_WARNING_THRESHOLD * 100) {
        await this.performRoutineCleanup();
      }
      
      // Check memory usage and trigger cleanup if high
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
        if (memoryUsage > 0.9) {
          console.log('🧹 High memory usage detected during init, performing cleanup...');
          await this.performRoutineCleanup();
        }
      }

      console.log('✅ Storage Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('StorageManagerInit error:', error);
      return false;
    }
  }

  /**
   * Check if migration is needed and perform it
   * @private
   */
  async _checkAndPerformMigration() {
    try {
      const currentPrefix = this.getStoragePrefix();
      
      // Check if there are any keys with the old 'nugt_' prefix
      const oldKeys = [];
      for (let key in localStorage) {
        if (key.startsWith('nugt_')) {
          oldKeys.push(key);
        }
      }

      if (oldKeys.length > 0 && currentPrefix !== 'nugt_') {
        console.log(`Found ${oldKeys.length} keys with old prefix 'nugt_', migrating to '${currentPrefix}'`);
        await this.migrateStorageKeys('nugt_', currentPrefix);
      }
    } catch (error) {
      console.error('Migration check error:', error);
    }
  }

  /**
   * Handle configuration changes
   * @private
   */
  _handleConfigChange() {
    console.log('Configuration changed - storage manager updating prefixes');
    this.migrationCompleted = false; // Allow re-migration if needed
    this._checkAndPerformMigration();
  }

  // Cleanup and destroy
  destroy() {
    this._removeEventListeners();
    this._clearPeriodicTasks();
    this.storageCache.clear();
    this.observers.clear();
    console.log('Storage Manager destroyed');
  }

  // Private helper methods
  async _handleQuotaThresholds(quotaInfo) {
    const { usagePercentage } = quotaInfo;

    if (usagePercentage >= STORAGE_CONFIG.QUOTA_CRITICAL_THRESHOLD * 100) {
      await this.performAggressiveCleanup();
    } else if (usagePercentage >= STORAGE_CONFIG.QUOTA_CLEANUP_THRESHOLD * 100) {
      await this.performRoutineCleanup();
    } else if (usagePercentage >= STORAGE_CONFIG.QUOTA_WARNING_THRESHOLD * 100) {
      console.warn(`⚠️ Storage usage at ${usagePercentage.toFixed(1)}%`);
      this._notifyObservers('quotaWarning', quotaInfo);
    }
  }

  async _cleanupOldMatches(maxEntries = STORAGE_CONFIG.MAX_MATCH_HISTORY_ENTRIES) {
    try {
      const matchKeys = this._getMatchKeys();

      if (matchKeys.length <= maxEntries) {
        return { cleaned: 0, bytesFreed: 0 };
      }

      // Sort by timestamp and keep only the most recent
      matchKeys.sort((a, b) => b.timestamp - a.timestamp);
      const keysToRemove = matchKeys.slice(maxEntries);

      let bytesFreed = 0;
      keysToRemove.forEach(item => {
        bytesFreed += localStorage.getItem(item.key)?.length || 0;
        localStorage.removeItem(item.key);
      });

      const result = {
        cleaned: keysToRemove.length,
        bytesFreed,
        kept: maxEntries
      };

      console.log(`🗑️ Old matches cleaned: ${matchKeys.length} -> ${maxEntries} entries`);
      return result;
    } catch (error) {
      console.error('MatchCleanup error:', error);
      return { cleaned: 0, bytesFreed: 0, error: true };
    }
  }

  async _cleanupTemporaryData() {
    try {
      const tempKeys = this._getTemporaryKeys();
      let bytesFreed = 0;

      tempKeys.forEach(key => {
        bytesFreed += localStorage.getItem(key)?.length || 0;
        localStorage.removeItem(key);
      });

      const result = {
        cleaned: tempKeys.length,
        bytesFreed
      };

      if (tempKeys.length > 0) {
        console.log(`🗑️ Temporary data cleaned: ${tempKeys.length} keys removed`);
      }

      return result;
    } catch (error) {
      console.error('TempDataCleanup error:', error);
      return { cleaned: 0, bytesFreed: 0, error: true };
    }
  }

  async _cleanupCachedData() {
    try {
      const cacheKeys = this._getCacheKeys();
      let bytesFreed = 0;

      cacheKeys.forEach(key => {
        bytesFreed += localStorage.getItem(key)?.length || 0;
        localStorage.removeItem(key);
      });

      const result = {
        cleaned: cacheKeys.length,
        bytesFreed
      };

      if (cacheKeys.length > 0) {
        console.log(`🗑️ Cached data cleaned: ${cacheKeys.length} keys removed`);
      }

      return result;
    } catch (error) {
      console.error('CacheCleanup error:', error);
      return { cleaned: 0, bytesFreed: 0, error: true };
    }
  }

  async _cleanupExpiredData() {
    try {
      const expiredKeys = this._getExpiredKeys();
      let bytesFreed = 0;

      expiredKeys.forEach(key => {
        bytesFreed += localStorage.getItem(key)?.length || 0;
        localStorage.removeItem(key);
      });

      const result = {
        cleaned: expiredKeys.length,
        bytesFreed
      };

      if (expiredKeys.length > 0) {
        console.log(`🗑️ Expired data cleaned: ${expiredKeys.length} keys removed`);
      }

      return result;
    } catch (error) {
      console.error('ExpiredDataCleanup error:', error);
      return { cleaned: 0, bytesFreed: 0, error: true };
    }
  }

  async _cleanupOrphanedData() {
    try {
      const orphanedKeys = this._getOrphanedKeys();
      let bytesFreed = 0;

      orphanedKeys.forEach(key => {
        bytesFreed += localStorage.getItem(key)?.length || 0;
        localStorage.removeItem(key);
      });

      const result = {
        cleaned: orphanedKeys.length,
        bytesFreed
      };

      if (orphanedKeys.length > 0) {
        console.log(`🗑️ Orphaned data cleaned: ${orphanedKeys.length} keys removed`);
      }

      return result;
    } catch (error) {
      console.error('OrphanedDataCleanup error:', error);
      return { cleaned: 0, bytesFreed: 0, error: true };
    }
  }

  async _compressLargeData() {
    if (!this.compressionEnabled) {
      return { compressed: 0, bytesFreed: 0 };
    }

    try {
      let compressed = 0;
      let bytesFreed = 0;
      const currentPrefix = this.getStoragePrefix();

      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith(currentPrefix)) {
          const data = localStorage.getItem(key);
          if (data && data.length > STORAGE_CONFIG.COMPRESSION_THRESHOLD && !key.includes('_compressed')) {
            try {
              const compressedData = this._compressData(data);
              if (compressedData.length < data.length * 0.8) { // Only if 20%+ savings
                localStorage.setItem(key + '_compressed', compressedData);
                localStorage.removeItem(key);
                compressed++;
                bytesFreed += data.length - compressedData.length;
              }
            } catch (compressionError) {
              // Skip this item if compression fails
              continue;
            }
          }
        }
      }

      const result = { compressed, bytesFreed };

      if (compressed > 0) {
        console.log(`🗜️ Data compressed: ${compressed} items, ${this._formatBytes(bytesFreed)} saved`);
      }

      return result;
    } catch (error) {
      console.error('DataCompression error:', error);
      return { compressed: 0, bytesFreed: 0, error: true };
    }
  }

  _getMatchKeys() {
    const keys = [];
    const prefix = this.getStoragePrefix();
    
    for (let key in localStorage) {
      if (key.startsWith(prefix + 'match_') || key.startsWith(prefix + 'saved_match_')) {
        keys.push({
          key,
          timestamp: this._extractTimestamp(key),
          size: localStorage[key]?.length || 0
        });
      }
    }
    return keys;
  }

  _getTemporaryKeys() {
    const keys = [];
    for (let key in localStorage) {
      if (STORAGE_CONFIG.TEMP_KEYS_PATTERNS.some(pattern => key.includes(pattern))) {
        keys.push(key);
      }
    }
    return keys;
  }

  _getCacheKeys() {
    const keys = [];
    for (let key in localStorage) {
      if (STORAGE_CONFIG.CACHE_KEYS_PATTERNS.some(pattern => key.includes(pattern))) {
        keys.push(key);
      }
    }
    return keys;
  }

  _getExpiredKeys() {
    const keys = [];
    const now = Date.now();

    for (let key in localStorage) {
      if (key.includes('_expires_')) {
        const expiryMatch = key.match(/_expires_(\d+)/);
        if (expiryMatch) {
          const expiryTime = parseInt(expiryMatch[1]);
          if (now > expiryTime) {
            keys.push(key);
          }
        }
      }
    }
    return keys;
  }

  _getOrphanedKeys() {
    const keys = [];
    const currentPrefix = this.getStoragePrefix();
    const currentCachePrefix = this.getCachePrefix();
    
    for (let key in localStorage) {
      // Look for keys that don't match any known patterns
      if (!key.startsWith(currentPrefix) &&
        !key.startsWith(currentCachePrefix) &&
        !STORAGE_CONFIG.TEMP_KEYS_PATTERNS.some(pattern => key.includes(pattern)) &&
        !STORAGE_CONFIG.CACHE_KEYS_PATTERNS.some(pattern => key.includes(pattern)) &&
        !key.startsWith('nugt_')) { // Keep old prefix keys for potential migration
        keys.push(key);
      }
    }
    return keys;
  }

  _extractTimestamp(key) {
    const timestampMatch = key.match(/(\d{13})/);
    return timestampMatch ? parseInt(timestampMatch[1]) : Date.now();
  }

  _categorizeKey(key) {
    const currentPrefix = this.getStoragePrefix();
    const currentCachePrefix = this.getCachePrefix();
    
    if (key.startsWith(currentPrefix + 'match_') || key.startsWith(currentPrefix + 'saved_match_')) return 'matches';
    if (key.startsWith(currentPrefix + 'error_')) return 'errors';
    if (key.startsWith(currentPrefix + 'user_') || key.startsWith(currentPrefix + 'auth_')) return 'auth';
    if (STORAGE_CONFIG.TEMP_KEYS_PATTERNS.some(pattern => key.includes(pattern))) return 'temporary';
    if (STORAGE_CONFIG.CACHE_KEYS_PATTERNS.some(pattern => key.includes(pattern))) return 'cache';
    if (key.startsWith(currentPrefix) || key.startsWith(currentCachePrefix)) return 'app_data';
    if (key.startsWith('nugt_')) return 'legacy'; // Old prefix keys
    return 'other';
  }

  _compressData(data) {
    // Simple compression using built-in compression
    try {
      return btoa(unescape(encodeURIComponent(data)));
    } catch {
      return data; // Return original if compression fails
    }
  }

  _decompressData(compressedData) {
    try {
      return decodeURIComponent(escape(atob(compressedData)));
    } catch {
      return compressedData; // Return as-is if decompression fails
    }
  }

  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  _setupEventListeners() {
    window.addEventListener('storage', this._handleStorageEvent);
    window.addEventListener('beforeunload', this._handleBeforeUnload);
  }

  _removeEventListeners() {
    window.removeEventListener('storage', this._handleStorageEvent);
    window.removeEventListener('beforeunload', this._handleBeforeUnload);
  }

  _handleStorageEvent(event) {
    // Handle storage changes from other tabs
    this.storageCache.delete(event.key);
    this._notifyObservers('storageChanged', event);
  }

  _handleBeforeUnload() {
    // Perform final cleanup before page unload
    this._cleanupTemporaryData();
  }

  _setupPeriodicTasks() {
    // Periodic quota checks
    this.quotaCheckInterval = setInterval(() => {
      this.checkStorageQuota();
    }, STORAGE_CONFIG.QUOTA_CHECK_INTERVAL);

    // Periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performRoutineCleanup();
    }, STORAGE_CONFIG.CLEANUP_INTERVAL);
  }

  _clearPeriodicTasks() {
    if (this.quotaCheckInterval) {
      clearInterval(this.quotaCheckInterval);
      this.quotaCheckInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  _notifyObservers(event, data) {
    this.observers.forEach(observer => {
      try {
        observer(event, data);
      } catch (error) {
        console.warn('Observer error:', error);
      }
    });
  }

  // Public observer methods
  addObserver(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  removeObserver(callback) {
    return this.observers.delete(callback);
  }
}

// Create and export singleton instance
export const storageQuotaManager = new StorageQuotaManager();

// Make available globally for memory management
window.storageQuotaManager = storageQuotaManager;