'use client';

import React from 'react';
import { motion } from 'framer-motion';

// 8 Integrated Tracks with their sketchnote colors
const TRACK_COLORS = {
  'gods-creation-science': '#2F4731', // Palm Frond (green)
  'health-naturopathy': '#2F4731', // Palm Frond (green)
  'homesteading': '#2F4731', // Palm Frond (green)
  'government-economics': '#2F4731', // Palm Frond (green)
  'justice-change-making': '#3D1419', // Fuschia (investigations)
  'discipleship-cultural-discernment': '#9A3F4A', // Paradise (scripture)
  'truth-based-history': '#3D1419', // Fuschia (investigations)
  'english-language-literature': '#BD6809', // Papaya (vocabulary)
};

const TRACK_NAMES = {
  'gods-creation-science': "God's Creation & Science",
  'health-naturopathy': 'Health & Naturopathy',
  'homesteading': 'Homesteading',
  'government-economics': 'Government & Economics',
  'justice-change-making': 'Justice & Change-making',
  'discipleship-cultural-discernment': 'Discipleship & Cultural Discernment',
  'truth-based-history': 'Truth-Based History',
  'english-language-literature': 'English Language & Literature',
};

interface TrackBloomProps {
  completedTracks: string[]; // Array of completed track IDs
  currentTracks?: string[]; // Currently active tracks (optional)
  size?: 'small' | 'medium' | 'large';
}

export function TrackBloom({ completedTracks, currentTracks = [], size = 'medium' }: TrackBloomProps) {
  const sizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
  };

  const leafSize = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4',
  };

  // Calculate positions for 8 tracks in a circular pattern
  const trackPositions = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / 8 - Math.PI / 2; // Start from top
    const radius = size === 'small' ? 50 : size === 'medium' ? 70 : 90;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y, angle: (angle * 180) / Math.PI + 90 };
  });

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      {/* Central trunk */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-16 bg-amber-800 rounded-full" />
      
      {/* Tree branches and leaves */}
      <svg className={`absolute inset-0 ${sizeClasses[size]}`} viewBox="0 0 200 200">
        {/* Draw branches */}
        {trackPositions.map((pos, index) => {
          const trackKey = Object.keys(TRACK_COLORS)[index];
          const isCompleted = completedTracks.includes(trackKey);
          const isCurrent = currentTracks.includes(trackKey);
          const color = TRACK_COLORS[trackKey as keyof typeof TRACK_COLORS];
          
          return (
            <g key={trackKey}>
              {/* Branch */}
              <motion.line
                x1="100"
                y1="100"
                x2={100 + pos.x}
                y2={100 + pos.y}
                stroke="#8B4513"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
              
              {/* Leaf */}
              <motion.circle
                cx={100 + pos.x}
                cy={100 + pos.y}
                r={size === 'small' ? 4 : size === 'medium' ? 6 : 8}
                fill={isCompleted ? color : isCurrent ? color : '#E5E7EB'}
                stroke={isCurrent ? color : 'none'}
                strokeWidth={isCurrent ? 2 : 0}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isCompleted || isCurrent ? 1 : 0.3, 
                  opacity: isCompleted || isCurrent ? 1 : 0.5 
                }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              />
              
              {/* Track label */}
              {isCompleted && (
                <motion.text
                  x={100 + pos.x}
                  y={100 + pos.y + (size === 'small' ? 10 : size === 'medium' ? 15 : 20)}
                  fontSize="8"
                  fill={color}
                  textAnchor="middle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  {TRACK_NAMES[trackKey as keyof typeof TRACK_NAMES].substring(0, 12)}...
                </motion.text>
              )}
            </g>
          );
        })}
        
        {/* Center bloom when all tracks completed */}
        {completedTracks.length === 8 && (
          <motion.circle
            cx="100"
            cy="100"
            r="8"
            fill="#FFD700"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 1.5 }}
          />
        )}
      </svg>
      
      {/* Track legend */}
      <div className="mt-4 text-xs text-gray-600">
        <div className="flex flex-wrap justify-center gap-2">
          {completedTracks.map(track => (
            <div 
              key={track}
              className="flex items-center gap-1"
            >
              <div 
                className={`w-2 h-2 rounded-full`}
                style={{ backgroundColor: TRACK_COLORS[track as keyof typeof TRACK_COLORS] }}
              />
              <span className="text-xs">
                {TRACK_NAMES[track as keyof typeof TRACK_NAMES].substring(0, 15)}...
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
