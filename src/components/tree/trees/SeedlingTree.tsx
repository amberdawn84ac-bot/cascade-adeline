'use client';

import React from 'react';

interface Branch {
  track: string;
  displayName: string;
  color: string;
  icon: string;
  leaves: any[];
  progress: any;
}

interface SeedlingTreeProps {
  branches: Branch[];
  config: any;
  onBranchClick: (track: string) => void;
  onLeafHover: (leaf: any) => void;
  selectedBranch: string | null;
}

export function SeedlingTree({ branches, config, onBranchClick, onLeafHover, selectedBranch }: SeedlingTreeProps) {
  // K-2: Simple sprout with 8 shoots emerging from ground
  // Each branch is a simple curved line with 3-5 BIG leaves
  
  const width = 800;
  const height = 400;
  const centerX = width / 2;
  const groundY = height - 50;

  // Position branches in a radial pattern
  const branchPositions = [
    { angle: -75, length: 120, labelX: -100, labelY: -100 }, // Top left
    { angle: -50, length: 100, labelX: -80, labelY: -60 },
    { angle: -25, length: 110, labelX: -60, labelY: -20 },
    { angle: 0, length: 130, labelX: 0, labelY: -140 },      // Top center
    { angle: 25, length: 110, labelX: 60, labelY: -20 },
    { angle: 50, length: 100, labelX: 80, labelY: -60 },
    { angle: 75, length: 120, labelX: 100, labelY: -100 },   // Top right
    { angle: 90, length: 90, labelX: 120, labelY: -40 }
  ];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Ground */}
      <path
        d={`M 0 ${groundY} Q ${width/2} ${groundY + 10} ${width} ${groundY}`}
        fill="#D4A574"
        stroke="#8B4513"
        strokeWidth="2"
      />
      
      {/* Grass tufts */}
      {[...Array(12)].map((_, i) => (
        <path
          key={`grass-${i}`}
          d={`M ${i * 70 + 20} ${groundY} Q ${i * 70 + 25} ${groundY - 20} ${i * 70 + 30} ${groundY}`}
          fill="none"
          stroke="#7BA05B"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}

      {/* Central sprout stem */}
      <path
        d={`M ${centerX} ${groundY} Q ${centerX - 5} ${groundY - 40} ${centerX} ${groundY - 60}`}
        fill="none"
        stroke="#8B4513"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* 8 Branches (shoots) */}
      {branches.map((branch, index) => {
        const pos = branchPositions[index];
        const rad = (pos.angle * Math.PI) / 180;
        const endX = centerX + Math.sin(rad) * pos.length;
        const endY = groundY - 60 - Math.cos(rad) * pos.length;
        const controlX = centerX + Math.sin(rad) * (pos.length / 2);
        const controlY = groundY - 60 - Math.cos(rad) * (pos.length / 2) - 20;

        const isSelected = selectedBranch === branch.track;

        return (
          <g key={branch.track}>
            {/* Branch stem */}
            <path
              d={`M ${centerX} ${groundY - 60} Q ${controlX} ${controlY} ${endX} ${endY}`}
              fill="none"
              stroke={isSelected ? branch.color : '#8B4513'}
              strokeWidth={isSelected ? 6 : 4}
              strokeLinecap="round"
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onClick={() => onBranchClick(branch.track)}
            />

            {/* Branch label (icon + name) */}
            <g 
              transform={`translate(${centerX + pos.labelX}, ${groundY - 60 + pos.labelY})`}
              style={{ cursor: 'pointer' }}
              onClick={() => onBranchClick(branch.track)}
            >
              <circle
                r="25"
                fill={branch.color}
                opacity="0.9"
              />
              <text
                textAnchor="middle"
                dy="0.3em"
                fontSize="20"
                fill="white"
              >
                {branch.icon}
              </text>
            </g>

            {/* Leaves on this branch (3-5 big simple leaves) */}
            {branch.leaves.slice(0, 5).map((leaf, leafIndex) => {
              const leafT = (leafIndex + 1) / 6; // Position along branch
              const leafX = centerX + Math.sin(rad) * pos.length * leafT;
              const leafY = groundY - 60 - Math.cos(rad) * pos.length * leafT - 20 * leafT;
              
              // Offset leaves alternately left and right
              const offset = leafIndex % 2 === 0 ? 15 : -15;
              const finalLeafX = leafX + offset;

              const masteryColor = getLeafColor(leaf.mastery);

              return (
                <g
                  key={leaf.id}
                  transform={`translate(${finalLeafX}, ${leafY})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => onLeafHover(leaf)}
                  onMouseLeave={() => onLeafHover(null)}
                >
                  {/* Large simple leaf shape */}
                  <ellipse
                    rx="18"
                    ry="12"
                    fill={masteryColor}
                    stroke="#2d5016"
                    strokeWidth="1.5"
                  />
                  {/* Leaf vein */}
                  <line
                    x1="-15"
                    y1="0"
                    x2="15"
                    y2="0"
                    stroke="#2d5016"
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Cute seedling face */}
      <g transform={`translate(${centerX}, ${groundY - 30})`}>
        <circle r="15" fill="#8B4513" />
        <circle cx="-5" cy="-3" r="2" fill="white" />
        <circle cx="5" cy="-3" r="2" fill="white" />
        <path
          d="M -5 3 Q 0 6 5 3"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      {/* Title */}
      <text
        x={width / 2}
        y={30}
        textAnchor="middle"
        fontSize="28"
        fontFamily="Permanent Marker, cursive"
        fill="#6A4C93"
      >
        🌱 My Learning Sprout
      </text>
    </svg>
  );
}

function getLeafColor(mastery: string): string {
  switch (mastery) {
    case 'MASTERED':
      return '#7BA05B'; // Dark green
    case 'PROFICIENT':
      return '#98FB98'; // Light green
    case 'PRACTICING':
      return '#FFDAB9'; // Peach
    case 'INTRODUCED':
      return '#FFE5B4'; // Light peach
    default:
      return '#e0e0e0'; // Gray
  }
}
