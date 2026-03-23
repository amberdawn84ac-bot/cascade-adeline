'use client';

import React from 'react';
import { getTrackColors } from './filters';

/**
 * Botanical leaf cluster - watercolor style
 */
export function LeafCluster({ 
  x, 
  y, 
  track, 
  size = 'medium',
  rotation = 0,
  leafCount = 5,
  mastery = 0 // 0-1, how many leaves are "grown"
}: { 
  x: number; 
  y: number; 
  track: string;
  size?: 'small' | 'medium' | 'large';
  rotation?: number;
  leafCount?: number;
  mastery?: number;
}) {
  const colors = getTrackColors(track);
  const sizes = { small: 20, medium: 35, large: 50 };
  const baseSize = sizes[size];
  
  // Calculate how many leaves to show as "mastered" (darker)
  const masteredCount = Math.floor(leafCount * mastery);

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      {[...Array(leafCount)].map((_, i) => {
        const angle = (i / leafCount) * 360;
        const rad = (angle * Math.PI) / 180;
        const distance = baseSize * 0.6;
        const leafX = Math.cos(rad) * distance;
        const leafY = Math.sin(rad) * distance;
        const isMastered = i < masteredCount;
        
        return (
          <g key={i} transform={`translate(${leafX}, ${leafY}) rotate(${angle})`}>
            {/* Individual watercolor leaf */}
            <path
              d={`M 0 0 Q -${baseSize * 0.15} -${baseSize * 0.3} 0 -${baseSize * 0.5} Q ${baseSize * 0.15} -${baseSize * 0.3} 0 0 Z`}
              fill={isMastered ? colors.primary : colors.tertiary}
              stroke="#4a5d3a"
              strokeWidth="0.5"
              opacity={0.85}
              filter="url(#watercolor)"
            />
            {/* Leaf vein */}
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={-baseSize * 0.5}
              stroke="#4a5d3a"
              strokeWidth="0.3"
              opacity="0.6"
            />
          </g>
        );
      })}
    </g>
  );
}

/**
 * White flower cluster - appears when standards mastered
 */
export function FlowerCluster({ x, y, count = 8 }: { x: number; y: number; count?: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {[...Array(count)].map((_, i) => {
        const angle = (i / count) * 360;
        const rad = (angle * Math.PI) / 180;
        const distance = 12 + Math.random() * 8;
        const flowerX = Math.cos(rad) * distance;
        const flowerY = Math.sin(rad) * distance;
        
        return (
          <g key={i} transform={`translate(${flowerX}, ${flowerY})`}>
            {/* Five-petal flower */}
            {[...Array(5)].map((_, p) => {
              const petalAngle = (p / 5) * 360;
              return (
                <ellipse
                  key={p}
                  cx="0"
                  cy="-3"
                  rx="2.5"
                  ry="4"
                  fill="#FDFBF7"
                  stroke="#E8E4D8"
                  strokeWidth="0.3"
                  transform={`rotate(${petalAngle})`}
                  filter="url(#softEdge)"
                />
              );
            })}
            {/* Yellow center */}
            <circle cx="0" cy="0" r="1.5" fill="#F4D03F" opacity="0.9" />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Vintage scroll label plaque
 */
export function ScrollLabel({ 
  x, 
  y, 
  text, 
  width = 120,
  onClick
}: { 
  x: number; 
  y: number; 
  text: string;
  width?: number;
  onClick?: () => void;
}) {
  const height = 28;
  
  return (
    <g 
      transform={`translate(${x}, ${y})`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {/* Scroll background */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill="#FFFEF7"
        stroke="#8B7355"
        strokeWidth="1.5"
        rx="3"
        filter="url(#labelShadow)"
      />
      
      {/* Decorative scroll ends */}
      <circle cx={-width / 2} cy="0" r="4" fill="#FFFEF7" stroke="#8B7355" strokeWidth="1.5" />
      <circle cx={width / 2} cy="0" r="4" fill="#FFFEF7" stroke="#8B7355" strokeWidth="1.5" />
      
      {/* Inner scroll line */}
      <line
        x1={-width / 2 + 8}
        y1="0"
        x2={width / 2 - 8}
        y2="0"
        stroke="#C9BFB3"
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />
      
      {/* Text */}
      <text
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Amatic SC', cursive"
        fontSize="14"
        fontWeight="bold"
        fill="#4a5d3a"
        letterSpacing="0.5"
      >
        {text.toUpperCase()}
      </text>
    </g>
  );
}

/**
 * Cross-hatched tree trunk
 */
export function TreeTrunk({ 
  centerX, 
  groundY, 
  trunkTop, 
  width = 40 
}: { 
  centerX: number; 
  groundY: number; 
  trunkTop: number;
  width?: number;
}) {
  const trunkHeight = groundY - trunkTop;
  
  return (
    <g>
      {/* Main trunk shape */}
      <path
        d={`
          M ${centerX - width / 2} ${groundY}
          Q ${centerX - width / 2.5} ${groundY - trunkHeight * 0.3} ${centerX - width / 3} ${trunkTop}
          L ${centerX + width / 3} ${trunkTop}
          Q ${centerX + width / 2.5} ${groundY - trunkHeight * 0.3} ${centerX + width / 2} ${groundY}
          Z
        `}
        fill="#8B7355"
        stroke="#6B5845"
        strokeWidth="1"
        filter="url(#pencilSketch)"
      />

      {/* Bark texture - cross-hatching */}
      {[...Array(12)].map((_, i) => {
        const y = groundY - (trunkHeight / 12) * i;
        const offset = i % 2 === 0 ? 5 : -5;
        return (
          <g key={i}>
            <line
              x1={centerX - width / 3 + offset}
              y1={y}
              x2={centerX + width / 4 + offset}
              y2={y - 15}
              stroke="#6B5845"
              strokeWidth="0.5"
              opacity="0.4"
            />
            <line
              x1={centerX + width / 4 - offset}
              y1={y}
              x2={centerX - width / 3 - offset}
              y2={y - 15}
              stroke="#6B5845"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </g>
        );
      })}

      {/* Vertical bark lines */}
      {[...Array(5)].map((_, i) => {
        const x = centerX - width / 3 + (width * 0.66 / 5) * i;
        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1={trunkTop}
            x2={x + (i % 2 === 0 ? -3 : 3)}
            y2={groundY}
            stroke="#6B5845"
            strokeWidth="0.8"
            opacity="0.3"
          />
        );
      })}
    </g>
  );
}

/**
 * Sketched grass at base
 */
export function SketchedGrass({ centerX, groundY, width = 400 }: { centerX: number; groundY: number; width?: number }) {
  return (
    <g>
      {/* Ground line with slight curve */}
      <path
        d={`M ${centerX - width / 2} ${groundY} Q ${centerX} ${groundY + 5} ${centerX + width / 2} ${groundY}`}
        fill="none"
        stroke="#9B8B7E"
        strokeWidth="1.5"
        opacity="0.6"
      />

      {/* Grass blades - loose, sketchy */}
      {[...Array(30)].map((_, i) => {
        const x = centerX - width / 2 + (width / 30) * i + Math.random() * 10;
        const height = 8 + Math.random() * 12;
        const curve = (Math.random() - 0.5) * 6;
        
        return (
          <path
            key={i}
            d={`M ${x} ${groundY} Q ${x + curve} ${groundY - height / 2} ${x + curve * 1.5} ${groundY - height}`}
            fill="none"
            stroke="#7FA663"
            strokeWidth="1"
            strokeLinecap="round"
            opacity={0.5 + Math.random() * 0.3}
          />
        );
      })}

      {/* Small flowers in grass */}
      {[...Array(8)].map((_, i) => {
        const x = centerX - width / 2 + Math.random() * width;
        const y = groundY - Math.random() * 5;
        
        return (
          <g key={`flower-${i}`}>
            <circle cx={x} cy={y} r="2" fill="#FDFBF7" opacity="0.8" />
            <circle cx={x} cy={y} r="0.8" fill="#F4D03F" />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Decorative scroll flourishes
 */
export function ScrollFlourish({ x, y, direction = 'left' }: { x: number; y: number; direction?: 'left' | 'right' }) {
  const flip = direction === 'right' ? -1 : 1;
  
  return (
    <g transform={`translate(${x}, ${y}) scale(${flip}, 1)`}>
      <path
        d="M 0 0 Q 15 -10 25 -8 Q 35 -6 40 -15"
        fill="none"
        stroke="#9B8B7E"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <path
        d="M 0 0 Q 10 8 18 10 Q 25 11 30 8"
        fill="none"
        stroke="#9B8B7E"
        strokeWidth="0.8"
        opacity="0.5"
      />
    </g>
  );
}
