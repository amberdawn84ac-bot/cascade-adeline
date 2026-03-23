'use client';

import React from 'react';
import { BotanicalFilters, getTrackColors } from '../botanical/filters';
import { LeafCluster, FlowerCluster, ScrollLabel, SketchedGrass, ScrollFlourish } from '../botanical/components';

interface Branch {
  track: string;
  displayName: string;
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

export function SeedlingTree({ branches, config, onBranchClick, selectedBranch }: SeedlingTreeProps) {
  const width = 800;
  const height = 550;
  const centerX = width / 2;
  const groundY = height - 70;

  // 8 shoots emerging from ground - simple radial pattern
  const shootPositions = [
    { angle: -75, length: 100 },
    { angle: -50, length: 90 },
    { angle: -25, length: 95 },
    { angle: 0, length: 110 },
    { angle: 25, length: 95 },
    { angle: 50, length: 90 },
    { angle: 75, length: 100 },
    { angle: 90, length: 85 }
  ];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <BotanicalFilters />

      {/* Parchment background */}
      <rect width={width} height={height} fill="#F5F3ED" filter="url(#parchment)" />

      {/* Corner flourishes */}
      <ScrollFlourish x={30} y={30} direction="left" />
      <ScrollFlourish x={width - 30} y={30} direction="right" />

      {/* Title */}
      <text
        x={width / 2}
        y={40}
        textAnchor="middle"
        fontFamily="'Amatic SC', cursive"
        fontSize="36"
        fontWeight="bold"
        fill="#4a5d3a"
        letterSpacing="2"
      >
        🌱 My First Sprouts
      </text>

      <text
        x={width / 2}
        y={65}
        textAnchor="middle"
        fontFamily="'Kalam', cursive"
        fontSize="15"
        fill="#7FA663"
        fontStyle="italic"
      >
        Kindergarten - 2nd Grade
      </text>

      {/* Ground with grass */}
      <SketchedGrass centerX={centerX} groundY={groundY} width={600} />

      {/* Central seed/bulb */}
      <ellipse
        cx={centerX}
        cy={groundY - 10}
        rx="25"
        ry="20"
        fill="#8B7355"
        stroke="#6B5845"
        strokeWidth="1.5"
        filter="url(#pencilSketch)"
      />

      {/* 8 shoots emerging */}
      {shootPositions.map((pos, index) => {
        const branch = branches[index];
        if (!branch) return null;

        const rad = (pos.angle * Math.PI) / 180;
        const endX = centerX + Math.sin(rad) * pos.length;
        const endY = groundY - 10 - Math.abs(Math.cos(rad)) * pos.length;
        const controlX = centerX + Math.sin(rad) * (pos.length * 0.5);
        const controlY = groundY - 10 - Math.abs(Math.cos(rad)) * (pos.length * 0.7);

        const isSelected = selectedBranch === branch.track;
        const masteryPercent = branch.progress.percent / 100;
        const hasFlowers = branch.progress.mastered > 0;

        return (
          <g key={branch.track}>
            {/* Simple curved stem */}
            <path
              d={`M ${centerX} ${groundY - 10} Q ${controlX} ${controlY} ${endX} ${endY}`}
              fill="none"
              stroke={isSelected ? '#6B5845' : '#7FA663'}
              strokeWidth={isSelected ? 3.5 : 2.5}
              strokeLinecap="round"
              filter="url(#pencilSketch)"
              style={{ cursor: 'pointer' }}
              onClick={() => onBranchClick(branch.track)}
            />

            {/* Large simple leaf cluster */}
            <g onClick={() => onBranchClick(branch.track)} style={{ cursor: 'pointer' }}>
              <LeafCluster
                x={endX}
                y={endY}
                track={branch.track}
                size="large"
                rotation={pos.angle}
                leafCount={5}
                mastery={masteryPercent}
              />
            </g>

            {/* Flowers for mastered */}
            {hasFlowers && (
              <FlowerCluster x={endX} y={endY} count={4} />
            )}

            {/* Label - shorter for young kids */}
            <ScrollLabel
              x={endX}
              y={endY - 50}
              text={branch.displayName.split(' ')[0]}
              width={100}
              onClick={() => onBranchClick(branch.track)}
            />
          </g>
        );
      })}

      {/* Signature */}
      <text
        x={width - 15}
        y={height - 12}
        textAnchor="end"
        fontFamily="'Amatic SC', cursive"
        fontSize="11"
        fill="#9B8B7E"
        fontStyle="italic"
      >
        Dear Adeline
      </text>
    </svg>
  );
}
