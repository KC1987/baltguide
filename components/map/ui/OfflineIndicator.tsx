"use client";

import React, { useState, useEffect } from 'react';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { useLocationSync } from '../hooks/useLocationSync';
import { tailwindClasses } from './ColorTheme';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function OfflineIndicator({ 
  className = '', 
  showDetails = false,
  position = 'top-right'
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  
  // Safely use hooks with error handling
  let offlineManagerData = null;
  let locationSyncData = null;
  
  try {
    offlineManagerData = useOfflineManager();
  } catch (error) {
    console.warn('[OfflineIndicator] useOfflineManager hook failed:', error);
  }
  
  try {
    locationSyncData = useLocationSync();
  } catch (error) {
    console.warn('[OfflineIndicator] useLocationSync hook failed:', error);
  }
  
  const { 
    isOfflineMode = false, 
    offlineAreas = [], 
    syncQueue = [], 
    cacheUsage = { used: 0, total: 0, breakdown: { maps: 0, images: 0, data: 0 } },
    lastSync = 0
  } = offlineManagerData || {};
  
  const { 
    syncStatus = { isActive: false, syncProgress: { completed: 0, total: 0, errors: [] } }, 
    locationContext = { currentLocation: null }
  } = locationSyncData || {};
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getConnectionStatus = () => {
    if (!isOnline) return 'offline';
    if (isOfflineMode) return 'offline-mode';
    if (syncStatus.isActive) return 'syncing';
    return 'online';
  };

  const getStatusColor = () => {
    const status = getConnectionStatus();
    switch (status) {
      case 'offline': return tailwindClasses.status.offline.indicator;
      case 'offline-mode': return tailwindClasses.status.offlineMode.indicator;
      case 'syncing': return tailwindClasses.status.syncing.indicator;
      case 'online': return tailwindClasses.status.online.indicator;
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (getConnectionStatus()) {
      case 'offline': return 'Offline';
      case 'offline-mode': return 'Offline Mode';
      case 'syncing': return 'Syncing...';
      case 'online': return 'Online';
      default: return 'Unknown';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left': return 'top-4 left-4';
      case 'top-right': return 'top-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      default: return 'top-4 right-4';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatTime = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      {/* Main Indicator */}
      <button
        onClick={() => setShowDetailPanel(!showDetailPanel)}
        className={`relative flex items-center gap-2 ${tailwindClasses.surface.primary} rounded-full shadow-lg ${tailwindClasses.surface.border} px-3 py-2 hover:shadow-xl transition-all duration-200`}
      >
        {/* Status Dot */}
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} relative`}>
          {syncStatus.isActive && (
            <div className={`absolute inset-0 rounded-full ${getStatusColor()} animate-ping opacity-75`} />
          )}
        </div>
        
        {/* Status Text */}
        <span className={`text-sm font-medium ${tailwindClasses.text.secondary}`}>
          {getStatusText()}
        </span>
        
        {/* Sync Progress */}
        {syncStatus.isActive && (
          <div className={`w-12 h-1 ${tailwindClasses.surface.tertiary} rounded-full overflow-hidden`}>
            <div
              className={`h-full ${tailwindClasses.status.syncing.indicator} transition-all duration-300`}
              style={{
                width: `${(syncStatus.syncProgress.completed / syncStatus.syncProgress.total) * 100}%`
              }}
            />
          </div>
        )}
        
        {/* Queue Count */}
        {syncQueue.length > 0 && (
          <div className={`absolute -top-1 -right-1 ${tailwindClasses.status.offlineMode.indicator} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center`}>
            {syncQueue.length}
          </div>
        )}
      </button>

      {/* Detail Panel */}
      {showDetailPanel && (
        <div className={`absolute top-full mt-2 right-0 w-80 ${tailwindClasses.surface.primary} rounded-lg shadow-xl ${tailwindClasses.surface.border} p-4 max-h-96 overflow-y-auto`}>
          {/* Connection Status */}
          <div className="mb-4">
            <h3 className={`font-semibold ${tailwindClasses.text.primary} mb-2`}>Connection Status</h3>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span className={tailwindClasses.text.tertiary}>{getStatusText()}</span>
              {locationContext.currentLocation && (
                <span className={`text-xs ${tailwindClasses.text.quaternary}`}>• GPS Active</span>
              )}
            </div>
          </div>

          {/* Sync Status */}
          {syncStatus.isActive && (
            <div className="mb-4">
              <h3 className={`font-semibold ${tailwindClasses.text.primary} mb-2`}>Sync Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={tailwindClasses.text.tertiary}>
                    {syncStatus.currentOperation || 'Syncing...'}
                  </span>
                  <span className={tailwindClasses.text.quaternary}>
                    {syncStatus.syncProgress.completed}/{syncStatus.syncProgress.total}
                  </span>
                </div>
                <div className={`w-full ${tailwindClasses.surface.tertiary} rounded-full h-2`}>
                  <div
                    className={`${tailwindClasses.status.syncing.indicator} h-2 rounded-full transition-all duration-300`}
                    style={{
                      width: `${(syncStatus.syncProgress.completed / syncStatus.syncProgress.total) * 100}%`
                    }}
                  />
                </div>
                {syncStatus.syncProgress.errors.length > 0 && (
                  <div className={`text-xs ${tailwindClasses.status.offline.text}`}>
                    {syncStatus.syncProgress.errors.length} error(s)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Offline Areas */}
          <div className="mb-4">
            <h3 className={`font-semibold ${tailwindClasses.text.primary} mb-2`}>
              Offline Areas ({offlineAreas.length})
            </h3>
            {offlineAreas.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {offlineAreas.map((area) => (
                  <div key={area.id} className="flex justify-between text-sm">
                    <span className={`${tailwindClasses.text.tertiary} truncate`}>
                      {area.name}
                    </span>
                    <span className={`text-xs ${tailwindClasses.text.quaternary}`}>
                      {formatBytes(area.size)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${tailwindClasses.text.quaternary}`}>No offline areas downloaded</p>
            )}
          </div>

          {/* Cache Usage */}
          <div className="mb-4">
            <h3 className={`font-semibold ${tailwindClasses.text.primary} mb-2`}>Cache Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={tailwindClasses.text.tertiary}>Used</span>
                <span className={tailwindClasses.text.quaternary}>
                  {formatBytes(cacheUsage.used)} / {formatBytes(cacheUsage.total)}
                </span>
              </div>
              <div className={`w-full ${tailwindClasses.surface.tertiary} rounded-full h-2`}>
                <div
                  className={`${tailwindClasses.status.online.indicator} h-2 rounded-full`}
                  style={{ width: `${(cacheUsage.used / cacheUsage.total) * 100}%` }}
                />
              </div>
              <div className={`flex justify-between text-xs ${tailwindClasses.text.quaternary}`}>
                <span>Maps: {formatBytes(cacheUsage.breakdown.maps)}</span>
                <span>Images: {formatBytes(cacheUsage.breakdown.images)}</span>
                <span>Data: {formatBytes(cacheUsage.breakdown.data)}</span>
              </div>
            </div>
          </div>

          {/* Sync Queue */}
          {syncQueue.length > 0 && (
            <div className="mb-4">
              <h3 className={`font-semibold ${tailwindClasses.text.primary} mb-2`}>
                Pending Actions ({syncQueue.length})
              </h3>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {syncQueue.slice(0, 3).map((item) => (
                  <div key={item.id} className={`text-sm ${tailwindClasses.text.tertiary}`}>
                    {item.action} - {item.data.name || 'Unknown'}
                  </div>
                ))}
                {syncQueue.length > 3 && (
                  <div className={`text-xs ${tailwindClasses.text.quaternary}`}>
                    +{syncQueue.length - 3} more...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Last Sync */}
          <div className={`pt-3 border-t ${tailwindClasses.surface.borderSubtle}`}>
            <div className="flex justify-between text-sm">
              <span className={tailwindClasses.text.tertiary}>Last sync</span>
              <span className={tailwindClasses.text.quaternary}>{formatTime(lastSync)}</span>
            </div>
            {syncStatus.nextSync > 0 && (
              <div className="flex justify-between text-sm mt-1">
                <span className={tailwindClasses.text.tertiary}>Next sync</span>
                <span className={tailwindClasses.text.quaternary}>
                  {formatTime(syncStatus.nextSync)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}