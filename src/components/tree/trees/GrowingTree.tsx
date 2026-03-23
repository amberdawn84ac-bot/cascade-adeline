'use client';

import React from 'react';
import { BotanicalFilters, getTrackColors } from '../botanical/filters';
import { LeafCluster, FlowerCluster, ScrollLabel, TreeTrunk, SketchedGrass, ScrollFlourish } from '../botanical/components';

interface Branch {
  track: string;
  displayName: string;
  leaves: any[];
  progress: any;
}

interface GrowingTreeProps {
  branches: Branch[];
  config: any;
  onBranchClick: (track: string) => void;
  onLeafHover: (leaf: any) => void;
  selectedBranch: string | null;
}

export function GrowingTree({ branches, config, onBranchClick, selectedBranch }: GrowingTreeProps) {
  const width = 1000;
  const height = 700;
  const centerX = width / 2;
  const groundY = height - 90;
  const trunkTop = groundY - 280;

  // 8 main branches with secondary branches
  const branchConfigs = [
    { x: -200, y: -200, secondX: -240, secondY: -180 },  // Upper left
    { x: -140, y: -100, secondX: -170, secondY: -80 },   // Left
    { x: -180, y: 0, secondX: -210, secondY: 20 },       // Lower left
    { x: -100, y: 110, secondX: -120, secondY: 130 },    // Bottom left
    { x: 100, y: 110, secondX: 120, secondY: 130 },      // Bottom right
    { x: 180, y: 0, secondX: 210, secondY: 20 },         // Lower right
    { x: 140, y: -100, secondX: 170, secondY: -80 },     // Right
    { x: 200, y: -200, secondX: 240, secondY: -180 }     // Upper right
  ];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <BotanicalFilters />

      {/* Parchment background */}
      <rect width={width} height={height} fill="#F5F3ED" filter="url(#parchment)" />

      {/* Corner flourishes */}
      <ScrollFlourish x={40} y={40} direction="left" />
      <ScrollFlourish x={width - 40} y={40} direction="right" />
      <ScrollFlourish x={40} y={height - 40} direction="left" />
      <ScrollFlourish x={width - 40} y={height - 40} direction="right" />

      {/* Title */}
      <text
        x={width / 2}
        y={38}
        textAnchor="middle"
        fontFamily="'Amatic SC', cursive"
        fontSize="34"
        fontWeight="bold"
        fill="#4a5d3a"
        letterSpacing="2"
      >
        My Growing Tree
      </text>

      <text
        x={width / 2}
        y={62}
        textAnchor="middle"
        fontFamily="'Kalam', cursive"
        fontSize="15"
        fill="#7B6B8F"
        fontStyle="italic"
      >
        6th - 8th Grade Investigation
      </text>

      {/* Ground and grass */}
      <SketchedGrass centerX={centerX} groundY={groundY} width={600} />

      {/* Stronger trunk */}
      <TreeTrunk centerX={centerX} groundY={groundY} trunkTop={trunkTop} width={55} />

      {/* 8 branches with secondaries */}
      {branchConfigs.map((config, index) => {
        const branch = branches[index];
        if (!branch) return null;

        const mainEndX = centerX + config.x;
        const mainEndY = trunkTop + config.y;
        const secEndX = centerX + config.secondX;
        const secEndY = trunkTop + config.secondY;

        const isSelected = selectedBranch === branch.track;
        const masteryPercent = branch.progress.percent / 100;
        const hasFlowers = branch.progress.mastered > 2;

        return (
          <g key={branch.track}>
            {/* Main branch */}
            <path
              d={`M ${centerX} ${trunkTop} Q ${centerX + config.x * 0.6} ${trunkTop + config.y * 0.7} ${mainEndX} ${mainEndY}`}
              fill="none"
              stroke={isSelected ? '#6B5845' : '#8B7355'}
              strokeWidth={isSelected ? 5 : 3.5}
              strokeLinecap="round"
              filter="url(#pencilSketch)"
              style={{ cursor: 'pointer' }}
              onClick={() => onBranchClick(branch.track)}
            />

            {/* Secondary branch */}
            <path
              d={`M ${mainEndX} ${mainEndY} L ${secEndX} ${secEndY}`}
              fill="none"
              stroke={isSelected ? '#6B5845' : '#8B7355'}
              strokeWidth={isSelected ? 3.5 : 2.5}
              strokeLinecap="round"
              filter="url(#pencilSketch)"
              style={{ cursor: 'pointer' }}
              onClick={() => onBranchClick(branch.track)}
            />

            {/* Leaf cluster on main branch */}
            <g onClick={() => onBranchClick(branch.track)} style={{ cursor: 'pointer' }}>
              <LeafCluster
                x={mainEndX}
                y={mainEndY}
                track={branch.track}
                size="medium"
                rotation={0}
                leafCount={7}
                mastery={masteryPercent}
              />
            </g>

            {/* Smaller cluster on secondary */}
            <g onClick={() => onBranchClick(branch.track)} style={{ cursor: 'pointer' }}>
              <LeafCluster
                x={secEndX}
                y={secEndY}
                track={branch.track}
                size="small"
                rotation={15}
                leafCount={5}
                mastery={masteryPercent}
              />
            </g>

            {/* Flowers on mastered */}
            {hasFlowers && (
              <>
                <FlowerCluster x={mainEndX} y={mainEndY} count={6} />
                <FlowerCluster x={secEndX} y={secEndY} count={4} />
              </>
            )}

            {/* Label */}
            <ScrollLabel
              x={mainEndX}
              y={mainEndY - 65}
              text={branch.displayName}
              width={150}
              onClick={() => onBranchClick(branch.track)}
            />
          </g>
        );
      })}

      {/* Overall progress */}
      <g transform={`translate(${centerX}, ${groundY - 140})`}>
        <ellipse
          rx="32"
          ry="28"
          fill="#FFFEF7"
          stroke="#8B7355"
          strokeWidth="2.5"
          filter="url(#labelShadow)"
        />
        <text
          textAnchor="middle"
          dy="-0.1em"
          fontFamily="'Permanent Marker', cursive"
          fontSize="20"
          fill="#7FA663"
        >
          {Math.round(branches.reduce((sum, b) => sum + b.progress.percent, 0) / branches.length)}%
        </text>
        <text
          textAnchor="middle"
          y="17"
          fontFamily="'Kalam', cursive"
          fontSize="11"
          fill="#6B5845"
        >
          explored
        </text>
      </g>

      {/* Signature */}
      <text
        x={width - 20}
        y={height - 15}
        textAnchor="end"
        fontFamily="'Amatic SC', cursive"
        fontSize="13"
        fill="#9B8B7E"
        fontStyle="italic"
      >
        Dear Adeline
      </text>
    </svg>
  );
}
