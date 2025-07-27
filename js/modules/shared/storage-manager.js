/**
 * Storage Quota Management - Prevent Storage Issues
 * @version 1.0
 */

import { notificationManager } from '../services/notifications.js';
import { ModuleErrorBoundary } from './error-boundary.js';

class StorageQuotaManager {
  constructor() {
    this.quotaThreshold = 0.8; // 80% usage threshold
    this.cleanupThreshold = 0.9; // 90% usage triggers aggressive cleanup
    this.maxErrorLogEntries = 10;
    this.maxMatchHistoryEntries = 50;
  }

  // Check storage quota and usage
  async checkStorageQuota() {
    return ModuleErrorBoundary.safeAsync(async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usagePercentage = (estimate.usage / estimate.quota) * 100;
        
        const quotaInfo = {
          usage: estimate.usage,
          quota: estimate.quota,
          usagePercentage: Math.round(usagePercentage * 100) / 100,
          usageMB: Math.round(estimate.usage / 1048576 * 100) / 100,
          quotaMB: Math.round(estimate.quota / 1048576 * 100) / 100
        };

        console.log('Storage quota info:', quotaInfo);

        // Check if we need to clean up
        if (usagePercentage > this.cleanupThreshold * 100) {
          await this.performAggressiveCleanup();
          notificationManager.warning('Storage space was running low. Old data has been cleaned up.');
        } else if (usagePercentage > this.quotaThreshold * 100) {
          await this.performRoutineCleanup();
          notificationManager.info('Routine storage cleanup performed.');
        }

        return quotaInfo;
      } else {
        // Fallback for browsers without Storage API
        return this.estimateLocalStorageUsage();
      }
    }, null, 'StorageQuotaCheck');
  }

  // Estimate localStorage usage for browsers without Storage API
  estimateLocalStorageUsage() {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }

      // Rough estimate: most browsers allow 5-10MB for localStorage
      const estimatedQuota = 5 * 1024 * 1024; // 5MB
      const usagePercentage = (totalSize / estimatedQuota) * 100;

      return {
        usage: totalSize,
        quota: estimatedQuota,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        usageMB: Math.round(totalSize / 1048576 * 100) / 100,
        quotaMB: Math.round(estimatedQuota / 1048576 * 100) / 100,
        estimated: true
      };
    } catch (error) {
      console.warn('Could not estimate localStorage usage:', error);
      return null;
    }
  }

  // Perform routine cleanup
  async performRoutineCleanup() {
    return ModuleErrorBoundary.safeAsync(async () => {
      console.log('Performing routine storage cleanup...');

      // Clean up error logs
      this.cleanupErrorLogs();

      // Clean up old match data (keep last 30 matches)
      this.cleanupOldMatches(30);

      // Clean up temporary data
      this.cleanupTemporaryData();

      console.log('Routine cleanup completed');
    }, null, 'RoutineCleanup');
  }

  // Perform aggressive cleanup when storage is critically low
  async performAggressiveCleanup() {
    return ModuleErrorBoundary.safeAsync(async () => {
      console.log('Performing aggressive storage cleanup...');

      // Clean up error logs more aggressively
      this.cleanupErrorLogs(5);

      // Keep only last 10 matches
      this.cleanupOldMatches(10);

      // Clean up all temporary data
      this.cleanupTemporaryData();

      // Clean up cached data
      this.cleanupCachedData();

      console.log('Aggressive cleanup completed');
    }, null, 'AggressiveCleanup');
  }

  // Clean up error logs
  cleanupErrorLogs(maxEntries = this.maxErrorLogEntries) {
    try {
      const errorLog = JSON.parse(localStorage.getItem('nugt_error_log') || '[]');
      if (errorLog.length > maxEntries) {
        const cleanedLog = errorLog.slice(-maxEntries);
        localStorage.setItem('nugt_error_log', JSON.stringify(cleanedLog));
        console.log(`Cleaned error log: ${errorLog.length} -> ${cleanedLog.length} entries`);
      }
    } catch (error) {
      console.warn('Could not cleanup error logs:', error);
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

  // Initialize storage monitoring
  init() {
    // Check quota on initialization
    this.checkStorageQuota();

    // Set up periodic quota checks (every 5 minutes)
    setInterval(() => {
      this.checkStorageQuota();
    }, 5 * 60 * 1000);

    console.log('Storage quota manager initialized');
  }
}

// Create and export singleton instance
export const storageQuotaManager = new StorageQuotaManager();