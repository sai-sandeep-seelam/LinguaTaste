'use client';

import React from 'react';

interface EditorialHeadingProps {
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  subtitle?: string;
  withScribble?: boolean;
  scribbleColor?: string;
  className?: string;
  scribbleClassName?: string;
}

/**
 * EditorialHeading
 * Hand-crafted editorial typography heading featuring an organic SVG pencil-scribble
 * underline with stroke-dash draw-on animation. Respects prefers-reduced-motion.
 */
export default function EditorialHeading({
  level = 2,
  children,
  subtitle,
  withScribble = true,
  scribbleColor = 'currentColor',
  className = '',
  scribbleClassName = '',
}: EditorialHeadingProps) {
  const sizeClasses = {
    1: 'text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight',
    2: 'text-2xl sm:text-3xl md:text-3xl font-serif tracking-tight',
    3: 'text-xl sm:text-2xl font-serif',
    4: 'text-lg sm:text-xl font-serif',
  }[level];

  const headingClass = `${sizeClasses} text-[var(--text-ink,#1a1917)] dark:text-[var(--text-ink,#f7f6f4)] font-normal leading-tight`;

  const renderHeading = () => {
    switch (level) {
      case 1:
        return <h1 className={headingClass}>{children}</h1>;
      case 3:
        return <h3 className={headingClass}>{children}</h3>;
      case 4:
        return <h4 className={headingClass}>{children}</h4>;
      case 2:
      default:
        return <h2 className={headingClass}>{children}</h2>;
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {renderHeading()}

      {subtitle && (
        <p className="mt-1 text-xs sm:text-sm font-sans uppercase tracking-widest text-[var(--text-tertiary,#78716c)]">
          {subtitle}
        </p>
      )}

      {withScribble && (
        <div
          className={`pointer-events-none mt-1 sm:mt-1.5 w-full overflow-visible ${scribbleClassName}`}
          aria-hidden="true"
        >
          <svg
            className="w-full h-3 sm:h-3.5 overflow-visible text-[var(--accent-ink,#7c3aed)] dark:text-[var(--accent-ink,#a78bfa)]"
            viewBox="0 0 240 12"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Hand-drawn organic pencil line with natural pressure variation */}
            <path
              d="M 2 8 C 45 4, 95 10, 140 6 C 180 3, 215 9, 238 6 C 190 8, 110 5, 4 9 C 60 7, 180 6, 235 7.5"
              stroke={scribbleColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="editorial-scribble-path"
              opacity="0.85"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
