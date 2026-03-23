'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

// 8 Integrated Tracks with their positions and colors
const TRACKS = [
  { id: 'gods-creation-science', name: "God's Creation & Science", angle: 0, color: '#2F4731' },
  { id: 'health-naturopathy', name: 'Health & Naturopathy', angle: 45, color: '#2F4731' },
  { id: 'homesteading', name: 'Homesteading', angle: 90, color: '#2F4731' },
  { id: 'government-economics', name: 'Government & Economics', angle: 135, color: '#2F4731' },
  { id: 'justice-change-making', name: 'Justice & Change-making', angle: 180, color: '#3D1419' },
  { id: 'discipleship-cultural-discernment', name: 'Discipleship & Cultural Discernment', angle: 225, color: '#9A3F4A' },
  { id: 'truth-based-history', name: 'Truth-Based History', angle: 270, color: '#3D1419' },
  { id: 'english-language-literature', name: 'English Language & Literature', angle: 315, color: '#BD6809' },
];

interface LeafProps {
  x: number;
  y: number;
  size: number;
  mastery?: {
    standardName: string;
    unitName: string;
  };
  isVisible: boolean;
}

// Heart-shaped Catalpa leaf component
function Leaf({ x, y, size, mastery, isVisible }: LeafProps) {
  if (!isVisible || !mastery) return null;

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: Math.random() * 0.3 }}
    >
      {/* Heart-shaped Catalpa leaf */}
      <path
        d={`M ${x} ${y} 
            C ${x - size * 0.5} ${y - size * 0.3}, ${x - size * 0.5} ${y - size * 0.8}, ${x} ${y - size}
            C ${x + size * 0.5} ${y - size * 0.8}, ${x + size * 0.5} ${y - size * 0.3}, ${x} ${y}
            C ${x + size * 0.3} ${y + size * 0.2}, ${x + size * 0.1} ${y + size * 0.4}, ${x} ${y + size * 0.6}
            C ${x - size * 0.1} ${y + size * 0.4}, ${x - size * 0.3} ${y + size * 0.2}, ${x} ${y}`}
        fill="#4A7C59"
        stroke="#2F4731"
        strokeWidth="0.5"
        strokeDasharray="0.5 1"
        opacity="0.9"
      />
      
      {/* Tooltip on hover */}
      <motion.g
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{ pointerEvents: mastery ? 'auto' : 'none' }}
      >
        <rect
          x={x - 60}
          y={y - 40}
          width="120"
          height="30"
          rx="4"
          fill="white"
          stroke="#BD6809"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <text
          x={x}
          y={y - 25}
          fontSize="10"
          fill="#BD6809"
          textAnchor="middle"
          fontFamily="Swanky and Moo Moo, cursive"
        >
          {mastery.standardName}
        </text>
        <text
          x={x}
          y={y - 12}
          fontSize="8"
          fill="#666"
          textAnchor="middle"
          fontFamily="Kalam, cursive"
        >
          via {mastery.unitName}
        </text>
      </motion.g>
    </motion.g>
  );
}

interface BotanicalTreeProps {
  standardsProgress?: {
    trackId: string;
    masteredStandards: Array<{
      standardName: string;
      unitName: string;
    }>;
  }[];
  width?: number;
  height?: number;
}

export function BotanicalTree({ 
  standardsProgress = [], 
  width = 400, 
  height = 400 
}: BotanicalTreeProps) {
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);

  const centerX = width / 2;
  const centerY = height / 2 + 50;
  const trunkHeight = 120;
  const branchLength = 80;

  // Create hand-drawn effect with slight jitter
  const jitter = (value: number, amount: number = 2) => {
    return value + (Math.random() - 0.5) * amount;
  };

  return (
    <div className="relative">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background parchment texture hint */}
        <rect width={width} height={height} fill="#FFFEF7" opacity="0.3" />
        
        {/* Main trunk - hand-drawn style */}
        <motion.path
          d={`M ${jitter(centerX)} ${centerY + trunkHeight}
              C ${jitter(centerX - 5)} ${centerY + trunkHeight - 30}, ${jitter(centerX + 3)} ${centerY + trunkHeight - 60}, ${jitter(centerX - 2)} ${centerY + trunkHeight - 90}
              L ${jitter(centerX)} ${centerY}`}
          fill="none"
          stroke="#3D1419"
          strokeWidth="8"
          strokeDasharray="8 4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Trunk texture lines */}
        <motion.path
          d={`M ${jitter(centerX - 3)} ${centerY + 40} L ${jitter(centerX + 2)} ${centerY + 35}`}
          fill="none"
          stroke="#3D1419"
          strokeWidth="1"
          strokeDasharray="1 2"
          opacity="0.4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1, duration: 0.5 }}
        />
        <motion.path
          d={`M ${jitter(centerX + 2)} ${centerY + 80} L ${jitter(centerX - 3)} ${centerY + 75}`}
          fill="none"
          stroke="#3D1419"
          strokeWidth="1"
          strokeDasharray="1 2"
          opacity="0.4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        />

        {/* 8 branches - hand-drawn curved paths */}
        {TRACKS.map((track, index) => {
          const angleRad = (track.angle * Math.PI) / 180;
          const endX = centerX + Math.cos(angleRad) * branchLength;
          const endY = centerY + Math.sin(angleRad) * branchLength - 20;
          
          // Create curved branch path
          const controlX = centerX + Math.cos(angleRad) * (branchLength * 0.6);
          const controlY = centerY + Math.sin(angleRad) * (branchLength * 0.6) - 10;
          
          const isHovered = hoveredBranch === track.id;
          const trackProgress = standardsProgress.find(p => p.trackId === track.id);
          const masteredCount = trackProgress?.masteredStandards.length || 0;
          
          return (
            <g key={track.id}>
              {/* Branch */}
              <motion.path
                d={`M ${jitter(centerX)} ${jitter(centerY)}
                    Q ${jitter(controlX)} ${jitter(controlY)}, ${jitter(endX)} ${jitter(endY)}`}
                fill="none"
                stroke={track.color}
                strokeWidth={isHovered ? "6" : "4"}
                strokeDasharray="6 3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ 
                  pathLength: 1,
                  strokeWidth: isHovered ? "6" : "4",
                  opacity: isHovered ? 1 : 0.8
                }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.3 + index * 0.1,
                  strokeWidth: { duration: 0.2 }
                }}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredBranch(track.id)}
                onMouseLeave={() => setHoveredBranch(null)}
              />
              
              {/* Branch label */}
              <motion.text
                x={endX + Math.cos(angleRad) * 20}
                y={endY + Math.sin(angleRad) * 20}
                fontSize="11"
                fill={track.color}
                textAnchor={track.angle > 90 && track.angle < 270 ? "end" : "start"}
                fontFamily="Swanky and Moo Moo, cursive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
              >
                {track.name}
              </motion.text>
              
              {/* Leaves on this branch */}
              {trackProgress?.masteredStandards.map((mastery, leafIndex) => {
                const leafDistance = 20 + leafIndex * 15;
                const leafX = centerX + Math.cos(angleRad) * leafDistance;
                const leafY = centerY + Math.sin(angleRad) * leafDistance - (leafDistance * 0.2);
                
                return (
                  <Leaf
                    key={`${track.id}-${leafIndex}`}
                    x={jitter(leafX, 1)}
                    y={jitter(leafY, 1)}
                    size={8}
                    mastery={mastery}
                    isVisible={true}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Root system */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 2 }}>
          <path
            d={`M ${jitter(centerX)} ${centerY + trunkHeight}
                C ${jitter(centerX - 20)} ${centerY + trunkHeight + 20}, ${jitter(centerX - 30)} ${centerY + trunkHeight + 40}, ${jitter(centerX - 25)} ${centerY + trunkHeight + 60}`}
            fill="none"
            stroke="#3D1419"
            strokeWidth="3"
            strokeDasharray="4 2"
          />
          <path
            d={`M ${jitter(centerX)} ${centerY + trunkHeight}
                C ${jitter(centerX + 15)} ${centerY + trunkHeight + 25}, ${jitter(centerX + 25)} ${centerY + trunkHeight + 45}, ${jitter(centerX + 20)} ${centerY + trunkHeight + 65}`}
            fill="none"
            stroke="#3D1419"
            strokeWidth="3"
            strokeDasharray="4 2"
          />
        </motion.g>

        {/* Ground line */}
        <motion.line
          x1={centerX - 60}
          y1={centerY + trunkHeight + 70}
          x2={centerX + 60}
          y2={centerY + trunkHeight + 70}
          stroke="#3D1419"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        />
      </svg>
      
      {/* Tree title */}
      <div className="text-center mt-4">
        <h3 className="text-lg font-bold" style={{ color: '#3D1419', fontFamily: 'Swanky and Moo Moo, cursive' }}>
          Graduation Tree
        </h3>
        <p className="text-sm text-gray-600" style={{ fontFamily: 'Kalam, cursive' }}>
          Watch your knowledge grow across the 8 Integrated Tracks
        </p>
      </div>
    </div>
  );
}
