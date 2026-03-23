'use client';

import React from 'react';
import { BotanicalFilters, getTrackColors } from '../botanical/filters';
import { LeafCluster, FlowerCluster, ScrollLabel, TreeTrunk, SketchedGrass, ScrollFlourish } from '../botanical/components';

interface Branch {
  track: string;
  displayName: string;
  color: string;
  icon: string;
  leaves: any[];
  progress: any;
}

interface YoungTreeProps {
  branches: Branch[];
  config: any;
  onBranchClick: (track: string) => void;
  onLeafHover: (leaf: any) => void;
  selectedBranch: string | null;
}

export function YoungTree({ branches, config, onBranchClick, onLeafHover, selectedBranch }: YoungTreeProps) {
  const width = 900;
  const height = 650;
  const centerX = width / 2;
  const groundY = height - 80;
  const trunkTop = groundY - 220;

  // 8 branch positions - arranged naturally like the reference image
  const branchPositions = [
    { x: -180, y: -180, angle: -45 },      // Upper left
    { x: -120, y: -80, angle: -30 },       // Left
    { x: -160, y: 20, angle: -20 },        // Lower left
    { x: -80, y: 100, angle: 0 },          // Bottom left
    { x: 0, y: -200, angle: 0 },           // Top center
    { x: 80, y: 100, angle: 0 },           // Bottom right
    { x: 160, y: 20, angle: 20 },          // Lower right
    { x: 120, y: -80, angle: 30 }          // Right
  ];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <BotanicalFilters />

      {/* Parchment background */}
      <rect width={width} height={height} fill="#F5F3ED" filter="url(#parchment)" />

      {/* Decorative corner flourishes */}
      <ScrollFlourish x={40} y={40} direction="left" />
      <ScrollFlourish x={width - 40} y={40} direction="right" />
      <ScrollFlourish x={40} y={height - 40} direction="left" />
      <ScrollFlourish x={width - 40} y={height - 40} direction="right" />

      {/* Title */}
      <text
        x={width / 2}
        y={35}
        textAnchor="middle"
        fontFamily="'Amatic SC', cursive"
        fontSize="32"
        fontWeight="bold"
        fill="#4a5d3a"
        letterSpacing="2"
      >
        My Learning Tree
      </text>

      {/* Subtitle */}
      <text
        x={width / 2}
        y={58}
        textAnchor="middle"
        fontFamily="'Kalam', cursive"
        fontSize="14"
        fill="#7B6B8F"
        fontStyle="italic"
      >
        3rd - 5th Grade Journey
      </text>

      {/* Ground and grass */}
      <SketchedGrass centerX={centerX} groundY={groundY} width={500} />

      {/* Tree trunk */}
      <TreeTrunk centerX={centerX} groundY={groundY} trunkTop={trunkTop} width={45} />

      {/* Branches with leaf clusters */}
      {branchPositions.map((pos, index) => {
        const branch = branches[index];
        if (!branch) return null;

        const endX = centerX + pos.x;
        const endY = trunkTop + pos.y;
        const controlX = centerX + pos.x * 0.5;
        const controlY = trunkTop + pos.y * 0.6;

        const isSelected = selectedBranch === branch.track;
        const masteryPercent = branch.progress.percent / 100;
        const hasFlowers = branch.progress.mastered > 0;

        return (
          <g key={branch.track}>
            {/* Branch stem */}
            <path
              d={`M ${centerX} ${trunkTop} Q ${controlX} ${controlY} ${endX} ${endY}`}
              fill="none"
              stroke={isSelected ? '#6B5845' : '#8B7355'}
              strokeWidth={isSelected ? 4 : 3}
              strokeLinecap="round"
              filter="url(#pencilSketch)"
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onClick={() => onBranchClick(branch.track)}
            />

            {/* Leaf cluster */}
            <g onClick={() => onBranchClick(branch.track)} style={{ cursor: 'pointer' }}>
              <LeafCluster
                x={endX}
                y={endY}
                track={branch.track}
                size="medium"
                rotation={pos.angle}
                leafCount={8}
                mastery={masteryPercent}
              />
            </g>

            {/* Flowers on mastered branches */}
            {hasFlowers && (
              <FlowerCluster 
                x={endX} 
                y={endY} 
                count={Math.min(branch.progress.mastered, 8)} 
              />
            )}

            {/* Label */}
            <ScrollLabel
              x={endX}
              y={endY - 60}
              text={branch.displayName}
              width={140}
              onClick={() => onBranchClick(branch.track)}
            />

            {/* Progress when selected */}
            {isSelected && (
              <g transform={`translate(${endX}, ${endY + 50})`}>
                <circle r="18" fill="#FFFEF7" stroke="#8B7355" strokeWidth="1.5" />
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fontFamily="'Kalam', cursive"
                  fontSize="13"
                  fontWeight="bold"
                  fill="#4a5d3a"
                >
                  {branch.progress.percent}%
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Overall progress */}
      <g transform={`translate(${centerX}, ${groundY - 110})`}>
        <ellipse
          rx="30"
          ry="25"
          fill="#FFFEF7"
          stroke="#8B7355"
          strokeWidth="2"
          filter="url(#labelShadow)"
        />
        <text
          textAnchor="middle"
          dy="-0.1em"
          fontFamily="'Permanent Marker', cursive"
          fontSize="18"
          fill="#7FA663"
        >
          {Math.round(branches.reduce((sum, b) => sum + b.progress.percent, 0) / branches.length)}%
        </text>
        <text
          textAnchor="middle"
          y="15"
          fontFamily="'Kalam', cursive"
          fontSize="10"
          fill="#6B5845"
        >
          growing
        </text>
      </g>

      {/* Signature */}
      <text
        x={width - 20}
        y={height - 15}
        textAnchor="end"
        fontFamily="'Amatic SC', cursive"
        fontSize="12"
        fill="#9B8B7E"
        fontStyle="italic"
      >
        Dear Adeline
      </text>
    </svg>
  );
}
