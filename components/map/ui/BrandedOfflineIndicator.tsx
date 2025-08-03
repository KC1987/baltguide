"use client";

import React, { useState, useEffect } from 'react';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { useLocationSync } from '../hooks/useLocationSync';

interface BrandedOfflineIndicatorProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function BrandedOfflineIndicator({ 
  className = '', 
  position = 'top-right'
}: BrandedOfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  
  // Safely use hooks with error handling
  let offlineManagerData = null;
  let locationSyncData = null;
  
  try {
    offlineManagerData = useOfflineManager();
  } catch (error) {
    console.warn('[BrandedOfflineIndicator] useOfflineManager hook failed:', error);
  }
  
  try {
    locationSyncData = useLocationSync();
  } catch (error) {
    console.warn('[BrandedOfflineIndicator] useLocationSync hook failed:', error);
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
          text: 'Offline',
          textColor: 'text-white',
          bgGradient: 'from-red-500 to-red-600',
          hoverGradient: 'hover:from-red-600 hover:to-red-700'
        };
      case 'offline-mode':
        return {
          color: 'bg-pink-500',  // BaltGuide pink
          text: 'Offline Mode',
          textColor: 'text-white',
          bgGradient: 'from-pink-500 to-pink-600',
          hoverGradient: 'hover:from-pink-600 hover:to-pink-700'
        };
      case 'syncing':
        return {
          color: 'bg-sky-500',  // BaltGuide blue
          text: 'Syncing',
          textColor: 'text-white',
          bgGradient: 'from-sky-500 to-sky-600',
          hoverGradient: 'hover:from-sky-600 hover:to-sky-700'
        };
      case 'online':
      default:
        return {
          color: 'bg-emerald-500',
          text: 'Online',
          textColor: 'text-white',
          bgGradient: 'from-emerald-500 to-emerald-600',
          hoverGradient: 'hover:from-emerald-600 hover:to-emerald-700'
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
      {/* BaltGuide-Styled Status Pill */}
      <div className="relative">
        <button
          onClick={() => setShowDetailPanel(!showDetailPanel)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm
            bg-gradient-to-r ${statusInfo.bgGradient} ${statusInfo.hoverGradient}
            border border-white/20 transition-all duration-300 hover:shadow-xl hover:scale-105
            ${statusInfo.textColor} font-medium text-sm min-w-[120px] justify-center
          `}
        >
          {/* Status Indicator */}
          <div className="relative">
            <div className="w-2 h-2 bg-white rounded-full">
              {syncStatus.isActive && (
                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
              )}
            </div>
          </div>
          
          {/* Status Text */}
          <span className="font-medium">
            {statusInfo.text}
          </span>
          
          {/* Queue Count Badge */}
          {syncQueue.length > 0 && (
            <div className="absolute -top-1 -right-1 bg-white text-gray-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">
              {syncQueue.length}
            </div>
          )}
          
          {/* Expand Indicator */}
          <svg 
            className={`w-3 h-3 transition-transform duration-200 ${showDetailPanel ? 'rotate-180' : ''}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Inline Progress Bar (when syncing) */}
        {syncStatus.isActive && syncStatus.syncProgress.total > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white/90 backdrop-blur-sm rounded-full h-1 overflow-hidden shadow-sm">
            <div
              className={`h-full bg-gradient-to-r ${statusInfo.bgGradient} transition-all duration-500`}
              style={{
                width: `${Math.max(5, (syncStatus.syncProgress.completed / syncStatus.syncProgress.total) * 100)}%`
              }}
            />
          </div>
        )}

        {/* Detail Panel - BaltGuide Style */}
        {showDetailPanel && (
          <div className="absolute top-full mt-3 right-0 w-80">
            {/* White card like in the BaltGuide interface */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Header with gradient like BaltGuide */}
              <div className={`px-4 py-3 bg-gradient-to-r ${statusInfo.bgGradient} text-white`}>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  Connection Status
                </h3>
              </div>
              
              <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                {/* Connection Details */}
                <div className="text-sm text-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <span>Status</span>
                    <span className="font-medium text-gray-900">{statusInfo.text}</span>
                  </div>
                  {locationContext.currentLocation && (
                    <div className="flex items-center justify-between">
                      <span>GPS</span>
                      <span className="text-emerald-600 font-medium">Active</span>
                    </div>
                  )}
                </div>

                {/* Sync Progress */}
                {syncStatus.isActive && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Sync Progress</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{syncStatus.currentOperation || 'Processing...'}</span>
                        <span>{syncStatus.syncProgress.completed}/{syncStatus.syncProgress.total}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full bg-gradient-to-r ${statusInfo.bgGradient} transition-all duration-300`}
                          style={{
                            width: `${Math.max(2, (syncStatus.syncProgress.completed / syncStatus.syncProgress.total) * 100)}%`
                          }}
                        />
                      </div>
                      {syncStatus.syncProgress.errors.length > 0 && (
                        <div className="text-xs text-red-600">
                          {syncStatus.syncProgress.errors.length} error(s) occurred
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Stats Grid - BaltGuide Style */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{offlineAreas.length}</div>
                    <div className="text-xs text-gray-600">Offline Areas</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{formatBytes(cacheUsage.used)}</div>
                    <div className="text-xs text-gray-600">Cache Used</div>
                  </div>
                </div>

                {/* Last Sync */}
                {lastSync > 0 && (
                  <div className="border-t pt-3 text-xs text-gray-500 text-center">
                    Last sync: {formatTime(lastSync)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}