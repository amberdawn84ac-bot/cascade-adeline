'use client';

import React from 'react';
import { BotanicalFilters } from '../botanical/filters';
import { LeafCluster, FlowerCluster, ScrollLabel, TreeTrunk, SketchedGrass, ScrollFlourish } from '../botanical/components';

interface Branch {
  track: string;
  displayName: string;
  leaves: any[];
  progress: any;
}

interface MatureOakProps {
  branches: Branch[];
  config: any;
  onBranchClick: (track: string) => void;
  onLeafHover: (leaf: any) => void;
  selectedBranch: string | null;
}

export function MatureOak({ branches, config, onBranchClick, selectedBranch }: MatureOakProps) {
  const width = 1100;
  const height = 750;
  const centerX = width / 2;
  const groundY = height - 95;
  const trunkTop = groundY - 320;

  // 8 complex branch systems with tertiary branches
  const branchConfigs = [
    { 
      main: { x: -220, y: -240 },
      secondary: [{ x: -260, y: -220 }, { x: -240, y: -260 }],
      tertiary: [{ x: -280, y: -200 }, { x: -220, y: -280 }]
    },
    { 
      main: { x: -160, y: -120 },
      secondary: [{ x: -190, y: -100 }, { x: -180, y: -140 }],
      tertiary: [{ x: -210, y: -90 }]
    },
    { 
      main: { x: -200, y: 10 },
      secondary: [{ x: -230, y: 30 }, { x: -220, y: -10 }],
      tertiary: [{ x: -250, y: 50 }]
    },
    { 
      main: { x: -110, y: 130 },
      secondary: [{ x: -130, y: 150 }],
      tertiary: []
    },
    { 
      main: { x: 110, y: 130 },
      secondary: [{ x: 130, y: 150 }],
      tertiary: []
    },
    { 
      main: { x: 200, y: 10 },
      secondary: [{ x: 230, y: 30 }, { x: 220, y: -10 }],
      tertiary: [{ x: 250, y: 50 }]
    },
    { 
      main: { x: 160, y: -120 },
      secondary: [{ x: 190, y: -100 }, { x: 180, y: -140 }],
      tertiary: [{ x: 210, y: -90 }]
    },
    { 
      main: { x: 220, y: -240 },
      secondary: [{ x: 260, y: -220 }, { x: 240, y: -260 }],
      tertiary: [{ x: 280, y: -200 }, { x: 220, y: -280 }]
    }
  ];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <BotanicalFilters />

      {/* Parchment background */}
      <rect width={width} height={height} fill="#F5F3ED" filter="url(#parchment)" />

      {/* Decorative border */}
      <rect
        x="15"
        y="15"
        width={width - 30}
        height={height - 30}
        fill="none"
        stroke="#9B8B7E"
        strokeWidth="1.5"
        strokeDasharray="4,4"
        opacity="0.4"
      />

      {/* Corner flourishes */}
      <ScrollFlourish x={45} y={45} direction="left" />
      <ScrollFlourish x={width - 45} y={45} direction="right" />
      <ScrollFlourish x={45} y={height - 45} direction="left" />
      <ScrollFlourish x={width - 45} y={height - 45} direction="right" />

      {/* Title */}
      <text
        x={width / 2}
        y={40}
        textAnchor="middle"
        fontFamily="'Amatic SC', cursive"
        fontSize="38"
        fontWeight="bold"
        fill="#4a5d3a"
        letterSpacing="3"
      >
        My Mature Oak
      </text>

      <text
        x={width / 2}
        y={66}
        textAnchor="middle"
        fontFamily="'Kalam', cursive"
        fontSize="16"
        fill="#7B6B8F"
        fontStyle="italic"
      >
        9th - 12th Grade Mastery Journey to Graduation
      </text>

      {/* Ground and grass */}
      <SketchedGrass centerX={centerX} groundY={groundY} width={650} />

      {/* Thick mature trunk */}
      <TreeTrunk centerX={centerX} groundY={groundY} trunkTop={trunkTop} width={65} />

      {/* Complex branch systems */}
      {branchConfigs.map((config, index) => {
        const branch = branches[index];
        if (!branch) return null;

        const mainEndX = centerX + config.main.x;
        const mainEndY = trunkTop + config.main.y;

        const isSelected = selectedBranch === branch.track;
        const masteryPercent = branch.progress.percent / 100;
        const hasFlowers = branch.progress.mastered > 5;

        return (
          <g key={branch.track}>
            {/* Main branch */}
            <path
              d={`M ${centerX} ${trunkTop} Q ${centerX + config.main.x * 0.7} ${trunkTop + config.main.y * 0.7} ${mainEndX} ${mainEndY}`}
              fill="none"
              stroke={isSelected ? '#6B5845' : '#8B7355'}
              strokeWidth={isSelected ? 6 : 4.5}
              strokeLinecap="round"
              filter="url(#pencilSketch)"
              style={{ cursor: 'pointer' }}
              onClick={() => onBranchClick(branch.track)}
            />

            {/* Secondary branches */}
            {config.secondary.map((sec, i) => {
              const secEndX = centerX + sec.x;
              const secEndY = trunkTop + sec.y;
              return (
                <path
                  key={`sec-${i}`}
                  d={`M ${mainEndX} ${mainEndY} L ${secEndX} ${secEndY}`}
                  fill="none"
                  stroke={isSelected ? '#6B5845' : '#8B7355'}
                  strokeWidth={isSelected ? 4 : 3}
                  strokeLinecap="round"
                  filter="url(#pencilSketch)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onBranchClick(branch.track)}
                />
              );
            })}

            {/* Tertiary branches */}
            {config.tertiary.map((ter, i) => {
              const terEndX = centerX + ter.x;
              const terEndY = trunkTop + ter.y;
              const secIdx = i < config.secondary.length ? i : 0;
              const secEndX = centerX + config.secondary[secIdx].x;
              const secEndY = trunkTop + config.secondary[secIdx].y;
              return (
                <path
                  key={`ter-${i}`}
                  d={`M ${secEndX} ${secEndY} L ${terEndX} ${terEndY}`}
                  fill="none"
                  stroke={isSelected ? '#6B5845' : '#8B7355'}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeLinecap="round"
                  filter="url(#pencilSketch)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onBranchClick(branch.track)}
                />
              );
            })}

            {/* Dense leaf clusters */}
            <g onClick={() => onBranchClick(branch.track)} style={{ cursor: 'pointer' }}>
              <LeafCluster
                x={mainEndX}
                y={mainEndY}
                track={branch.track}
                size="small"
                rotation={0}
                leafCount={8}
                mastery={masteryPercent}
              />
              {config.secondary.map((sec, i) => (
                <LeafCluster
                  key={`sec-leaf-${i}`}
                  x={centerX + sec.x}
                  y={trunkTop + sec.y}
                  track={branch.track}
                  size="small"
                  rotation={i * 30}
                  leafCount={6}
                  mastery={masteryPercent}
                />
              ))}
              {config.tertiary.map((ter, i) => (
                <LeafCluster
                  key={`ter-leaf-${i}`}
                  x={centerX + ter.x}
                  y={trunkTop + ter.y}
                  track={branch.track}
                  size="small"
                  rotation={i * 45}
                  leafCount={4}
                  mastery={masteryPercent}
                />
              ))}
            </g>

            {/* Abundant flowers on mastered */}
            {hasFlowers && (
              <>
                <FlowerCluster x={mainEndX} y={mainEndY} count={8} />
                {config.secondary.map((sec, i) => (
                  <FlowerCluster 
                    key={`sec-flower-${i}`}
                    x={centerX + sec.x} 
                    y={trunkTop + sec.y} 
                    count={6} 
                  />
                ))}
              </>
            )}

            {/* Label */}
            <ScrollLabel
              x={mainEndX}
              y={mainEndY - 70}
              text={branch.displayName}
              width={160}
              onClick={() => onBranchClick(branch.track)}
            />
          </g>
        );
      })}

      {/* Graduation progress */}
      <g transform={`translate(${centerX}, ${groundY - 160})`}>
        <ellipse
          rx="40"
          ry="35"
          fill="#FFFEF7"
          stroke="#8B7355"
          strokeWidth="3"
          filter="url(#labelShadow)"
        />
        <text
          textAnchor="middle"
          dy="-0.2em"
          fontFamily="'Permanent Marker', cursive"
          fontSize="24"
          fill="#7FA663"
        >
          {Math.round(branches.reduce((sum, b) => sum + b.progress.percent, 0) / branches.length)}%
        </text>
        <text
          textAnchor="middle"
          y="20"
          fontFamily="'Kalam', cursive"
          fontSize="12"
          fill="#6B5845"
          fontWeight="bold"
        >
          to graduation
        </text>
      </g>

      {/* Signature */}
      <text
        x={width - 25}
        y={height - 18}
        textAnchor="end"
        fontFamily="'Amatic SC', cursive"
        fontSize="14"
        fill="#9B8B7E"
        fontStyle="italic"
      >
        Dear Adeline
      </text>
    </svg>
  );
}
