"use client";

import React, { useState, useEffect } from 'react';
import { useLocationSync } from '../hooks/useLocationSync';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { tailwindClasses } from './ColorTheme';

interface SyncProgressBarProps {
  className?: string;
  showOnlyWhenActive?: boolean;
  position?: 'top' | 'bottom';
  showDetails?: boolean;
}

export function SyncProgressBar({ 
  className = '',
  showOnlyWhenActive = true,
  position = 'top',
  showDetails = false
}: SyncProgressBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const { syncStatus } = useLocationSync();
  const { syncQueue } = useOfflineManager();

  // Show/hide animation
  useEffect(() => {
    const shouldShow = !showOnlyWhenActive || syncStatus.isActive || syncQueue.length > 0;
    
    if (shouldShow && !isVisible) {
      setIsVisible(true);
      setAnimationClass('animate-slide-down');
    } else if (!shouldShow && isVisible) {
      setAnimationClass('animate-slide-up');
      setTimeout(() => {
        setIsVisible(false);
        setAnimationClass('');
      }, 300);
    }
  }, [syncStatus.isActive, syncQueue.length, showOnlyWhenActive, isVisible]);

  const getProgressPercentage = (): number => {
    if (!syncStatus.isActive) return 0;
    const { completed, total } = syncStatus.syncProgress;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getStatusColor = (): string => {
    if (syncStatus.syncProgress.errors.length > 0) return tailwindClasses.status.offline.indicator;
    if (syncStatus.isActive) return tailwindClasses.status.syncing.indicator;
    if (syncQueue.length > 0) return tailwindClasses.status.offlineMode.indicator;
    return tailwindClasses.status.online.indicator;
  };

  const getStatusText = (): string => {
    if (syncStatus.isActive) {
      return syncStatus.currentOperation || 'Syncing...';
    }
    if (syncQueue.length > 0) {
      return `${syncQueue.length} items queued for sync`;
    }
    return 'Sync complete';
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed left-0 right-0 z-40 
      ${position === 'top' ? 'top-0' : 'bottom-0'}
      ${animationClass}
      ${className}
    `}>
      <div className={`${tailwindClasses.surface.primary} shadow-lg border-b ${tailwindClasses.surface.border}`}>
        {/* Progress Bar */}
        <div className={`relative h-1 ${tailwindClasses.surface.tertiary} overflow-hidden`}>
          <div
            className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${getStatusColor()}`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
          
          {/* Indeterminate animation when no specific progress */}
          {syncStatus.isActive && syncStatus.syncProgress.total === 0 && (
            <div className={`absolute inset-y-0 w-1/3 ${getStatusColor()} animate-pulse`} 
                 style={{ 
                   animation: 'indeterminate 2s linear infinite',
                   transform: 'translateX(-100%)'
                 }} 
            />
          )}
        </div>

        {/* Status Content */}
        {showDetails && (
          <div className="px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Status Icon */}
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}>
                  {syncStatus.isActive && (
                    <div className={`absolute w-2 h-2 rounded-full ${getStatusColor()} animate-ping opacity-75`} />
                  )}
                </div>
                
                {/* Status Text */}
                <span className={`text-sm font-medium ${tailwindClasses.text.secondary}`}>
                  {getStatusText()}
                </span>
                
                {/* Progress Counter */}
                {syncStatus.isActive && syncStatus.syncProgress.total > 0 && (
                  <span className={`text-xs ${tailwindClasses.text.quaternary}`}>
                    ({syncStatus.syncProgress.completed}/{syncStatus.syncProgress.total})
                  </span>
                )}
              </div>

              {/* Error Count */}
              {syncStatus.syncProgress.errors.length > 0 && (
                <span className={`text-xs ${tailwindClasses.status.offline.text} font-medium`}>
                  {syncStatus.syncProgress.errors.length} error{syncStatus.syncProgress.errors.length !== 1 ? 's' : ''}
                </span>
              )}

              {/* Queue Count */}
              {!syncStatus.isActive && syncQueue.length > 0 && (
                <span className={`text-xs ${tailwindClasses.status.offlineMode.text} font-medium`}>
                  {syncQueue.length} queued
                </span>
              )}
            </div>

            {/* Current Operation Detail */}
            {syncStatus.isActive && syncStatus.syncProgress.current && (
              <div className={`mt-1 text-xs ${tailwindClasses.text.quaternary}`}>
                Current: {syncStatus.syncProgress.current}
              </div>
            )}

            {/* Recent Errors */}
            {syncStatus.syncProgress.errors.length > 0 && (
              <div className={`mt-1 text-xs ${tailwindClasses.status.offline.text}`}>
                {syncStatus.syncProgress.errors[syncStatus.syncProgress.errors.length - 1]}
              </div>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        
        .animate-slide-down {
          animation: slideDown 0.3s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-in forwards;
        }
        
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}