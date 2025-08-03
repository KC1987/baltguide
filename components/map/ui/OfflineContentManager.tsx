"use client";

import React, { useState, useEffect } from 'react';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { useLocationSync } from '../hooks/useLocationSync';
import { tailwindClasses } from './ColorTheme';

interface OfflineContentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfflineContentManager({ isOpen, onClose }: OfflineContentManagerProps) {
  const [activeTab, setActiveTab] = useState<'areas' | 'queue' | 'cache' | 'sync'>('areas');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const {
    offlineAreas,
    syncQueue,
    cacheUsage,
    isOfflineMode,
    toggleOfflineMode,
    removeOfflineArea,
    clearSyncQueue,
    clearCache,
    retryFailedSync
  } = useOfflineManager();
  
  const {
    config,
    locationContext,
    syncStatus,
    updateConfig,
    forceSync
  } = useLocationSync();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteArea = async (areaId: string) => {
    if (showDeleteConfirm === areaId) {
      await removeOfflineArea(areaId);
      setShowDeleteConfirm(null);
    } else {
      setShowDeleteConfirm(areaId);
    }
  };

  const handleClearCache = async (cacheType?: string) => {
    if (cacheType) {
      await clearCache(cacheType);
    } else {
      await clearCache();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className={`${tailwindClasses.surface.primary} rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${tailwindClasses.surface.border}`}>
          <h2 className={`text-xl font-bold ${tailwindClasses.text.primary}`}>
            Offline Content Manager
          </h2>
          <button
            onClick={onClose}
            className={`${tailwindClasses.text.quaternary} hover:${tailwindClasses.text.secondary} transition-colors`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${tailwindClasses.surface.border}`}>
          {[
            { id: 'areas', label: 'Offline Areas', count: offlineAreas.length },
            { id: 'queue', label: 'Sync Queue', count: syncQueue.length },
            { id: 'cache', label: 'Cache Usage', count: null },
            { id: 'sync', label: 'Sync Settings', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium relative transition-colors ${
                activeTab === tab.id
                  ? `${tailwindClasses.status.syncing.text} border-b-2 ${tailwindClasses.status.syncing.indicator.replace('bg-', 'border-')}`
                  : `${tailwindClasses.text.quaternary} hover:${tailwindClasses.text.tertiary}`
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs ${tailwindClasses.surface.tertiary} rounded-full`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Offline Areas Tab */}
          {activeTab === 'areas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Downloaded Areas
                </h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isOfflineMode}
                    onChange={toggleOfflineMode}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Offline Mode
                  </span>
                </label>
              </div>

              {offlineAreas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📱</div>
                  <p>No offline areas downloaded</p>
                  <p className="text-sm mt-2">Areas will be automatically downloaded when you visit them</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {offlineAreas.map((area) => (
                    <div
                      key={area.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {area.name}
                        </h4>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Downloaded: {formatDate(area.downloadedAt)}</p>
                          <p>Size: {formatBytes(area.size)} • Zoom levels: {area.zoomLevels.join(', ')}</p>
                          <p>Expires: {formatDate(area.expiresAt)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteArea(area.id)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          showDeleteConfirm === area.id
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        {showDeleteConfirm === area.id ? 'Confirm Delete' : 'Delete'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sync Queue Tab */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pending Sync Items
                </h3>
                {syncQueue.length > 0 && (
                  <button
                    onClick={clearSyncQueue}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {syncQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">✅</div>
                  <p>No items in sync queue</p>
                  <p className="text-sm mt-2">All changes have been synchronized</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {syncQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.action}
                        </h4>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Item: {item.data.name || 'Unknown'}</p>
                          <p>Created: {formatDate(item.timestamp)}</p>
                          <p>Attempts: {item.retryCount}/3</p>
                          {item.error && (
                            <p className="text-red-500">Error: {item.error}</p>
                          )}
                        </div>
                      </div>
                      {item.status === 'failed' && (
                        <button
                          onClick={() => retryFailedSync(item.id)}
                          className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cache Usage Tab */}
          {activeTab === 'cache' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cache Usage
              </h3>

              {/* Overall Usage */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Usage
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatBytes(cacheUsage.used)} / {formatBytes(cacheUsage.total)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(cacheUsage.used / cacheUsage.total) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {((cacheUsage.used / cacheUsage.total) * 100).toFixed(1)}% used
                </div>
              </div>

              {/* Breakdown by Type */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Cache Breakdown</h4>
                {Object.entries(cacheUsage.breakdown).map(([type, size]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="capitalize text-sm text-gray-600 dark:text-gray-400">
                      {type}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{formatBytes(size)}</span>
                      <button
                        onClick={() => handleClearCache(type)}
                        className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear All Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => handleClearCache()}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Clear All Cache
                </button>
              </div>
            </div>
          )}

          {/* Sync Settings Tab */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sync Configuration
              </h3>

              {/* Current Status */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Current Status
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Location Tracking</span>
                    <span className={locationContext.currentLocation ? 'text-green-600' : 'text-red-600'}>
                      {locationContext.currentLocation ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Background Sync</span>
                    <span className={config.updateFrequency.backgroundSync ? 'text-green-600' : 'text-red-600'}>
                      {config.updateFrequency.backgroundSync ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Current Region</span>
                    <span className="text-gray-500">
                      {locationContext.currentRegion?.name || 'None'}
                    </span>
                  </div>
                  {syncStatus.lastSync > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Sync</span>
                      <span className="text-gray-500">
                        {formatDate(syncStatus.lastSync)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sync Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Settings</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Background Sync
                    </span>
                    <input
                      type="checkbox"
                      checked={config.updateFrequency.backgroundSync}
                      onChange={(e) => updateConfig({
                        updateFrequency: {
                          ...config.updateFrequency,
                          backgroundSync: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      WiFi Only
                    </span>
                    <input
                      type="checkbox"
                      checked={config.updateFrequency.wifiOnly}
                      onChange={(e) => updateConfig({
                        updateFrequency: {
                          ...config.updateFrequency,
                          wifiOnly: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                  </label>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Check Interval (minutes)
                    </span>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={config.updateFrequency.checkInterval}
                      onChange={(e) => updateConfig({
                        updateFrequency: {
                          ...config.updateFrequency,
                          checkInterval: parseInt(e.target.value)
                        }
                      })}
                      className="w-20 px-2 py-1 border rounded text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Nearby Range (km)
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={config.updateFrequency.nearbyRange}
                      onChange={(e) => updateConfig({
                        updateFrequency: {
                          ...config.updateFrequency,
                          nearbyRange: parseInt(e.target.value)
                        }
                      })}
                      className="w-20 px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Content Types */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Sync Content Types</h4>
                <div className="space-y-3">
                  {Object.entries(config.enabledTypes).map(([type, enabled]) => (
                    <label key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {type}
                      </span>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => updateConfig({
                          enabledTypes: {
                            ...config.enabledTypes,
                            [type]: e.target.checked
                          }
                        })}
                        className="rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Manual Sync */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={forceSync}
                  disabled={syncStatus.isActive || !locationContext.currentLocation}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncStatus.isActive ? 'Syncing...' : 'Force Sync Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}