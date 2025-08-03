"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Generate a blur placeholder for images
function generateBlurDataURL(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create a simple gradient blur placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

// Hook for intersection observer
function useInView(threshold = 0.1) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // Only observe once
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export default function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = "",
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  quality = 85,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { ref, inView } = useInView(0.1);

  // Generate blur placeholder if not provided
  const defaultBlurDataURL = blurDataURL || generateBlurDataURL(20, 15);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Don't load image until it's in view (unless priority is set)
  const shouldLoad = priority || inView;

  return (
    <div 
      ref={ref}
      className={`relative overflow-hidden bg-gray-200 ${className}`}
      style={{ width: width || '100%', height: height || 'auto' }}
    >
      {shouldLoad && !hasError && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={defaultBlurDataURL}
          quality={quality}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {/* Loading skeleton */}
      {isLoading && shouldLoad && !hasError && (
        <div className="absolute inset-0 bg-gray-200">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
            animate={{ x: [-100, 400] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="text-center">
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm">Image not available</div>
          </div>
        </div>
      )}
      
      {/* Lazy loading placeholder */}
      {!shouldLoad && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="text-gray-400 text-sm">📍</div>
        </div>
      )}
    </div>
  );
}

// Preset configurations for common use cases
export const ImagePresets = {
  locationCard: {
    width: 320,
    height: 180,
    quality: 80,
    sizes: "(max-width: 768px) 100vw, 320px"
  },
  locationHero: {
    width: 800,
    height: 400,
    quality: 90,
    priority: true,
    sizes: "(max-width: 768px) 100vw, 800px"
  },
  thumbnail: {
    width: 120,
    height: 80,
    quality: 75,
    sizes: "120px"
  },
  avatar: {
    width: 64,
    height: 64,
    quality: 80,
    sizes: "64px"
  }
};

// Component for progressive image loading with multiple sources
interface ProgressiveImageProps {
  sources: Array<{
    src: string;
    quality: 'low' | 'medium' | 'high';
    width: number;
    height: number;
  }>;
  alt: string;
  className?: string;
}

export function ProgressiveImage({ sources, alt, className }: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(sources[0]?.src || '');
  const [loadedSources, setLoadedSources] = useState<string[]>([]);

  useEffect(() => {
    // Preload higher quality images
    sources.forEach((source, index) => {
      if (index === 0) return; // Skip first (already loaded)
      
      const img = new window.Image();
      img.onload = () => {
        setLoadedSources(prev => [...prev, source.src]);
        // Switch to higher quality image when available
        if (source.quality === 'high' || 
           (source.quality === 'medium' && !sources.some(s => s.quality === 'high'))) {
          setCurrentSrc(source.src);
        }
      };
      img.src = source.src;
    });
  }, [sources]);

  const currentSource = sources.find(s => s.src === currentSrc) || sources[0];

  return (
    <OptimizedImage
      src={currentSrc}
      alt={alt}
      width={currentSource.width}
      height={currentSource.height}
      className={className}
      quality={85}
    />
  );
}