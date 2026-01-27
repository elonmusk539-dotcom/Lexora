'use client';

import React from 'react';

interface CircularProgressProps {
  progress: number;
  isMastered: boolean;
  size?: number;
}

export function CircularProgress({ progress, isMastered, size = 48 }: CircularProgressProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${isMastered ? 'animate-pulse-glow rounded-full' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          className="text-[var(--color-border)]"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle with gradient */}
        <defs>
          <linearGradient id={`progress-gradient-${isMastered ? 'mastered' : 'normal'}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {isMastered ? (
              <>
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f97316" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#06b6d4" />
              </>
            )}
          </linearGradient>
        </defs>
        <circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={`url(#progress-gradient-${isMastered ? 'mastered' : 'normal'})`}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-500 ease-out"
          style={{
            filter: isMastered ? 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.5))' : 'none',
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isMastered ? (
          <span className="text-xs font-bold text-coral-500">★</span>
        ) : (
          <span className="text-xs font-semibold text-[var(--color-text-muted)]">
            {Math.round(progress)}%
          </span>
        )}
      </div>
    </div>
  );
}
