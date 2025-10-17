'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface CircularProgressProps {
  progress: number;
  isMastered: boolean;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({
  progress,
  isMastered,
  size = 60,
  strokeWidth = 4,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  if (isMastered) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <div className="text-xs font-semibold text-green-600 dark:text-green-400">Mastered</div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="dark:stroke-gray-700"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="dark:stroke-blue-400"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
