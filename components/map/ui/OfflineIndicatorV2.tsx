"use client";

import React, { useState, useEffect } from 'react';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { useLocationSync } from '../hooks/useLocationSync';

interface OfflineIndicatorV2Props {
  className?: string;
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function OfflineIndicatorV2({ 
  className = '', 
  showDetails = false,
  position = 'top-right'
}: OfflineIndicatorV2Props) {
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

  const getStatusInfo = () => {
    const status = getConnectionStatus();
    switch (status) {
      case 'offline':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700 dark:text-red-300',
          bgColor: 'bg-red-50 dark:bg-red-900/10',
          borderColor: 'border-red-200 dark:border-red-800',
          text: 'Offline',
          icon: '🔴'
        };
      case 'offline-mode':
        return {
          color: 'bg-amber-500',
          textColor: 'text-amber-700 dark:text-amber-300',
          bgColor: 'bg-amber-50 dark:bg-amber-900/10',
          borderColor: 'border-amber-200 dark:border-amber-800',
          text: 'Offline Mode',
          icon: '🟡'
        };
      case 'syncing':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700 dark:text-blue-300',
          bgColor: 'bg-blue-50 dark:bg-blue-900/10',
          borderColor: 'border-blue-200 dark:border-blue-800',
          text: 'Syncing...',
          icon: '🔵'
        };
      case 'online':
      default:
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700 dark:text-green-300',
          bgColor: 'bg-green-50 dark:bg-green-900/10',
          borderColor: 'border-green-200 dark:border-green-800',
          text: 'Online',
          icon: '🟢'
        };
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

  const statusInfo = getStatusInfo();

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      {/* Modern Status Card */}
      <div 
        className={`relative backdrop-blur-md ${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl`}
        style={{ minWidth: '140px' }}
      >
        <button
          onClick={() => setShowDetailPanel(!showDetailPanel)}
          className="w-full p-3 flex items-center gap-3 text-left"
        >
          {/* Status Indicator */}
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}>
              {syncStatus.isActive && (
                <div className={`absolute inset-0 rounded-full ${statusInfo.color} animate-ping opacity-60`} />
              )}
            </div>
          </div>
          
          {/* Status Content */}
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${statusInfo.textColor}`}>
              {statusInfo.text}
            </div>
            
            {/* Progress Bar */}
            {syncStatus.isActive && syncStatus.syncProgress.total > 0 && (
              <div className="mt-1">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Syncing</span>
                  <span>{syncStatus.syncProgress.completed}/{syncStatus.syncProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${statusInfo.color} transition-all duration-300`}
                    style={{
                      width: `${Math.max(5, (syncStatus.syncProgress.completed / syncStatus.syncProgress.total) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Queue Indicator */}
            {syncQueue.length > 0 && !syncStatus.isActive && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {syncQueue.length} items queued
              </div>
            )}
          </div>

          {/* Expand Arrow */}
          <div className="text-gray-400 dark:text-gray-500">
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${showDetailPanel ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Detail Panel */}
        {showDetailPanel && (
          <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {/* Connection Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Connection Status
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className={statusInfo.textColor}>{statusInfo.text}</span>
                  {locationContext.currentLocation && (
                    <span className="text-green-600 dark:text-green-400 text-xs">• GPS Active</span>
                  )}
                </div>
              </div>

              {/* Sync Progress */}
              {syncStatus.isActive && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Sync Progress
                  </h3>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {syncStatus.currentOperation || 'Processing...'}
                    </div>
                    {syncStatus.syncProgress.errors.length > 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {syncStatus.syncProgress.errors.length} error(s)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <div className="text-gray-600 dark:text-gray-400 text-xs">Offline Areas</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{offlineAreas.length}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <div className="text-gray-600 dark:text-gray-400 text-xs">Cache Used</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {formatBytes(cacheUsage.used)}
                  </div>
                </div>
              </div>

              {/* Last Sync */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Last sync</span>
                  <span className="text-gray-500 dark:text-gray-500">{formatTime(lastSync)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}