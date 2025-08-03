"use client";

import React, { useState, useEffect } from 'react';
import { useLocationSync } from '../hooks/useLocationSync';
import { useOfflineManager } from '../hooks/useOfflineManager';

interface SyncProgressBarV2Props {
  className?: string;
  showOnlyWhenActive?: boolean;
  position?: 'top' | 'bottom';
  showDetails?: boolean;
}

export function SyncProgressBarV2({ 
  className = '',
  showOnlyWhenActive = true,
  position = 'top',
  showDetails = true
}: SyncProgressBarV2Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const { syncStatus } = useLocationSync();
  const { syncQueue } = useOfflineManager();

  // Show/hide animation
  useEffect(() => {
    const shouldShow = !showOnlyWhenActive || syncStatus.isActive || syncQueue.length > 0;
    
    if (shouldShow && !isVisible) {
      setIsVisible(true);
      setAnimationClass('animate-slide-in');
    } else if (!shouldShow && isVisible) {
      setAnimationClass('animate-slide-out');
      setTimeout(() => {
        setIsVisible(false);
        setAnimationClass('');
      }, 300);
    }
  }, [syncStatus.isActive, syncQueue.length, showOnlyWhenActive, isVisible]);

  const getProgressPercentage = (): number => {
    if (!syncStatus.isActive) return 0;
    const { completed, total } = syncStatus.syncProgress;
    return total > 0 ? Math.max(2, (completed / total) * 100) : 2; // Minimum 2% for visibility
  };

  const getStatusInfo = () => {
    if (syncStatus.syncProgress.errors.length > 0) {
      return {
        color: 'bg-red-500',
        textColor: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/10',
        text: `${syncStatus.syncProgress.errors.length} error${syncStatus.syncProgress.errors.length !== 1 ? 's' : ''}`,
        icon: '⚠️'
      };
    }
    
    if (syncStatus.isActive) {
      return {
        color: 'bg-blue-500',
        textColor: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/10',
        text: syncStatus.currentOperation || 'Syncing...',
        icon: '🔄'
      };
    }
    
    if (syncQueue.length > 0) {
      return {
        color: 'bg-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-900/10',
        text: `${syncQueue.length} item${syncQueue.length !== 1 ? 's' : ''} queued`,
        icon: '⏳'
      };
    }
    
    return {
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/10',
      text: 'Sync complete',
      icon: '✅'
    };
  };

  if (!isVisible) return null;

  const statusInfo = getStatusInfo();

  return (
    <div className={`
      fixed left-0 right-0 z-40 
      ${position === 'top' ? 'top-0' : 'bottom-0'}
      ${animationClass}
      ${className}
    `}>
      {/* Modern Progress Bar Container */}
      <div className={`relative backdrop-blur-md ${statusInfo.bgColor} border-b border-gray-200 dark:border-gray-700 shadow-sm`}>
        {/* Animated Progress Bar */}
        <div className="relative h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
          {syncStatus.isActive ? (
            // Determinate progress
            syncStatus.syncProgress.total > 0 ? (
              <div
                className={`absolute inset-y-0 left-0 ${statusInfo.color} transition-all duration-500 ease-out`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            ) : (
              // Indeterminate progress
              <div 
                className={`absolute inset-y-0 w-1/3 ${statusInfo.color} animate-progress-indeterminate`}
              />
            )
          ) : (
            // Complete state
            <div className={`absolute inset-0 ${statusInfo.color} transition-all duration-300`} />
          )}
        </div>

        {/* Status Content */}
        {showDetails && (
          <div className="px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Status Icon */}
                <div className="relative">
                  <div className={`w-2 h-2 rounded-full ${statusInfo.color}`}>
                    {syncStatus.isActive && (
                      <div className={`absolute inset-0 rounded-full ${statusInfo.color} animate-ping opacity-75`} />
                    )}
                  </div>
                </div>
                
                {/* Status Text */}
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${statusInfo.textColor}`}>
                    {statusInfo.text}
                  </span>
                  
                  {/* Progress Counter */}
                  {syncStatus.isActive && syncStatus.syncProgress.total > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {syncStatus.syncProgress.completed}/{syncStatus.syncProgress.total}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side Info */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {/* Time or ETA */}
                {syncStatus.isActive && (
                  <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    Syncing...
                  </span>
                )}
                
                {/* Queue indicator */}
                {!syncStatus.isActive && syncQueue.length > 0 && (
                  <span className="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    {syncQueue.length} queued
                  </span>
                )}

                {/* Error indicator */}
                {syncStatus.syncProgress.errors.length > 0 && (
                  <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                    {syncStatus.syncProgress.errors.length} error{syncStatus.syncProgress.errors.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Current Operation Detail */}
            {syncStatus.isActive && syncStatus.syncProgress.current && syncStatus.syncProgress.current !== statusInfo.text && (
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                {syncStatus.syncProgress.current}
              </div>
            )}

            {/* Recent Error */}
            {syncStatus.syncProgress.errors.length > 0 && (
              <div className="mt-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded">
                {syncStatus.syncProgress.errors[syncStatus.syncProgress.errors.length - 1]}
              </div>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes progress-indeterminate {
          0% { 
            transform: translateX(-100%); 
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          100% { 
            transform: translateX(300%); 
            opacity: 0.8;
          }
        }
        
        .animate-progress-indeterminate {
          animation: progress-indeterminate 2s ease-in-out infinite;
        }
        
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        
        .animate-slide-out {
          animation: slideOut 0.3s ease-in forwards;
        }
        
        @keyframes slideIn {
          from {
            transform: translateY(${position === 'top' ? '-100%' : '100%'});
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(${position === 'top' ? '-100%' : '100%'});
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}