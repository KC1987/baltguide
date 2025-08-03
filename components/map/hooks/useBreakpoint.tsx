"use client";

import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
}

const defaultBreakpoints: BreakpointConfig = {
  mobile: 768,   // < 768px
  tablet: 1024,  // 768px - 1023px
  desktop: 1024  // >= 1024px
};

export function useBreakpoint(breakpoints: BreakpointConfig = defaultBreakpoints) {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [windowSize, setWindowSize] = useState({
    width: 1024,
    height: 768
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowSize({
        width,
        height: window.innerHeight
      });

      if (width < breakpoints.mobile) {
        setBreakpoint('mobile');
      } else if (width < breakpoints.tablet) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    // Set initial breakpoint
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints]);

  return {
    breakpoint,
    windowSize,
    isMobile: isClient && breakpoint === 'mobile',
    isTablet: isClient && breakpoint === 'tablet',
    isDesktop: isClient && breakpoint === 'desktop',
    isMobileOrTablet: isClient && (breakpoint === 'mobile' || breakpoint === 'tablet'),
    isClient
  };
}