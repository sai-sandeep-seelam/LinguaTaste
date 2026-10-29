'use client';

import React from 'react';

interface RestrainedAnimatedBorderProps {
  children: React.ReactNode;
  isActive?: boolean;
  variant?: 'ants' | 'reveal' | 'dashed';
  className?: string;
}

/**
 * RestrainedAnimatedBorder
 * Handcrafted editorial border treatment with restrained CSS/SVG stroke animations.
 * Used exclusively on:
 *   1. Active discovery panel
 *   2. Selected category / active seed
 *   3. Editorial callouts
 * Respects prefers-reduced-motion and preserves theme contrast.
 */
export default function RestrainedAnimatedBorder({
  children,
  isActive = false,
  variant = 'ants',
  className = '',
}: RestrainedAnimatedBorderProps) {
  if (!isActive) {
    return <div className={className}>{children}</div>;
  }

  if (variant === 'ants') {
    return (
      <div className={`relative ${className}`}>
        {/* SVG Marching Ants stroke outline */}
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full rounded-2xl overflow-visible z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="0.5"
            y="0.5"
            width="calc(100% - 1px)"
            height="calc(100% - 1px)"
            rx="16"
            ry="16"
            fill="none"
            stroke="currentColor"
            className="marching-ants-svg text-[#7c3aed]/40 dark:text-[#a78bfa]/40"
            strokeWidth="1.5"
          />
        </svg>
        {children}
      </div>
    );
  }

  if (variant === 'reveal') {
    return (
      <div className={`relative reveal-border ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`relative editorial-dashed-panel is-active rounded-2xl ${className}`}>
      {children}
    </div>
  );
}
