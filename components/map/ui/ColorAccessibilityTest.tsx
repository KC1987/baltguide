"use client";

import React from 'react';
import { colors, tailwindClasses } from './ColorTheme';

/**
 * Color Accessibility Test Component
 * Use this component to verify color contrast ratios and visual consistency
 */
export function ColorAccessibilityTest() {
  const statusStates = [
    { key: 'online', label: 'Online', description: 'Connected and synced' },
    { key: 'offline', label: 'Offline', description: 'No connection available' },
    { key: 'syncing', label: 'Syncing', description: 'Currently synchronizing' },
    { key: 'offlineMode', label: 'Offline Mode', description: 'Operating in offline mode' },
  ] as const;

  const semanticStates = [
    { key: 'success', label: 'Success', description: 'Operation completed successfully' },
    { key: 'warning', label: 'Warning', description: 'Attention required' },
    { key: 'error', label: 'Error', description: 'Something went wrong' },
    { key: 'info', label: 'Info', description: 'Additional information' },
  ] as const;

  return (
    <div className={`p-8 space-y-8 ${tailwindClasses.surface.primary}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-3xl font-bold ${tailwindClasses.text.primary} mb-8`}>
          Color Accessibility Test Suite
        </h1>

        {/* Connection Status Colors */}
        <section className="mb-12">
          <h2 className={`text-2xl font-semibold ${tailwindClasses.text.primary} mb-6`}>
            Connection Status Colors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {statusStates.map(({ key, label, description }) => (
              <div key={key} className={`p-6 rounded-lg ${tailwindClasses.surface.secondary} ${tailwindClasses.surface.border}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-4 h-4 rounded-full ${tailwindClasses.status[key].indicator}`} />
                  <h3 className={`text-lg font-medium ${tailwindClasses.text.primary}`}>
                    {label}
                  </h3>
                </div>
                
                <p className={`text-sm ${tailwindClasses.text.tertiary} mb-4`}>
                  {description}
                </p>

                {/* Status Variants */}
                <div className="space-y-3">
                  <div className={`p-3 rounded ${tailwindClasses.status[key].bg} ${tailwindClasses.status[key].border}`}>
                    <span className={tailwindClasses.status[key].text}>
                      Background variant with text
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tailwindClasses.status[key].indicator}`} />
                    <span className={tailwindClasses.text.secondary}>
                      Indicator with secondary text
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Semantic Colors */}
        <section className="mb-12">
          <h2 className={`text-2xl font-semibold ${tailwindClasses.text.primary} mb-6`}>
            Semantic Colors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {semanticStates.map(({ key, label, description }) => (
              <div key={key} className={`p-6 rounded-lg ${tailwindClasses.surface.secondary} ${tailwindClasses.surface.border}`}>
                <h3 className={`text-lg font-medium ${tailwindClasses.text.primary} mb-2`}>
                  {label}
                </h3>
                
                <p className={`text-sm ${tailwindClasses.text.tertiary} mb-4`}>
                  {description}
                </p>

                <div className="space-y-2">
                  <div className={`inline-flex px-3 py-1 rounded text-sm font-medium`}
                       style={{ 
                         backgroundColor: colors.status[key].bg,
                         color: colors.status[key].dark 
                       }}>
                    Light variant
                  </div>
                  
                  <div className={`inline-flex px-3 py-1 rounded text-sm font-medium ml-2`}
                       style={{ 
                         backgroundColor: colors.status[key].dark,
                         color: 'white'
                       }}>
                    Dark variant
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Text Hierarchy */}
        <section className="mb-12">
          <h2 className={`text-2xl font-semibold ${tailwindClasses.text.primary} mb-6`}>
            Text Hierarchy
          </h2>
          <div className={`p-6 rounded-lg ${tailwindClasses.surface.secondary} ${tailwindClasses.surface.border}`}>
            <div className="space-y-4">
              <h1 className={`text-4xl font-bold ${tailwindClasses.text.primary}`}>
                Primary Text (Headings)
              </h1>
              <h2 className={`text-2xl font-semibold ${tailwindClasses.text.secondary}`}>
                Secondary Text (Subheadings)
              </h2>
              <p className={`text-lg ${tailwindClasses.text.tertiary}`}>
                Tertiary Text (Body text, labels)
              </p>
              <p className={`text-base ${tailwindClasses.text.quaternary}`}>
                Quaternary Text (Captions, timestamps)
              </p>
              <p className={`text-sm ${tailwindClasses.text.disabled}`}>
                Disabled Text (Inactive elements)
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Elements */}
        <section className="mb-12">
          <h2 className={`text-2xl font-semibold ${tailwindClasses.text.primary} mb-6`}>
            Interactive Elements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className={`px-4 py-2 rounded font-medium transition-colors ${tailwindClasses.interactive.primary}`}>
              Primary Button
            </button>
            <button className={`px-4 py-2 rounded font-medium transition-colors ${tailwindClasses.interactive.secondary}`}>
              Secondary Button
            </button>
            <button className={`px-4 py-2 rounded font-medium transition-colors ${tailwindClasses.interactive.success}`}>
              Success Button
            </button>
            <button className={`px-4 py-2 rounded font-medium transition-colors ${tailwindClasses.interactive.danger}`}>
              Danger Button
            </button>
          </div>
        </section>

        {/* Surface Levels */}
        <section className="mb-12">
          <h2 className={`text-2xl font-semibold ${tailwindClasses.text.primary} mb-6`}>
            Surface Levels
          </h2>
          <div className={`p-6 rounded-lg ${tailwindClasses.surface.primary} ${tailwindClasses.surface.border}`}>
            <h3 className={`font-medium ${tailwindClasses.text.primary} mb-4`}>Primary Surface</h3>
            <div className={`p-4 rounded ${tailwindClasses.surface.secondary} ${tailwindClasses.surface.borderSubtle} mb-4`}>
              <h4 className={`font-medium ${tailwindClasses.text.primary} mb-2`}>Secondary Surface</h4>
              <div className={`p-3 rounded ${tailwindClasses.surface.tertiary}`}>
                <span className={tailwindClasses.text.secondary}>Tertiary Surface</span>
              </div>
            </div>
          </div>
        </section>

        {/* Accessibility Notes */}
        <section className={`p-6 rounded-lg ${tailwindClasses.surface.secondary} ${tailwindClasses.surface.border}`}>
          <h2 className={`text-xl font-semibold ${tailwindClasses.text.primary} mb-4`}>
            Accessibility Compliance
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full ${tailwindClasses.status.online.indicator} mt-2`} />
              <div>
                <strong className={tailwindClasses.text.primary}>WCAG AA Compliant:</strong>
                <span className={tailwindClasses.text.tertiary}> All color combinations meet 4.5:1 contrast ratio for normal text</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full ${tailwindClasses.status.online.indicator} mt-2`} />
              <div>
                <strong className={tailwindClasses.text.primary}>Dark Mode Support:</strong>
                <span className={tailwindClasses.text.tertiary}> All components adapt to system/user theme preference</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full ${tailwindClasses.status.online.indicator} mt-2`} />
              <div>
                <strong className={tailwindClasses.text.primary}>Consistent Usage:</strong>
                <span className={tailwindClasses.text.tertiary}> Status colors have semantic meaning across all components</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}