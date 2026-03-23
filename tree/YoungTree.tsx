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

interface YoungTreeProps {
  branches: Branch[];
  config: any;
  onBranchClick: (track: string) => void;
  onLeafHover: (leaf: any) => void;
  selectedBranch: string | null;
}

export function YoungTree({ branches, config, onBranchClick, onLeafHover, selectedBranch }: YoungTreeProps) {
  // 3-5: Actual small tree with trunk and 8 branches
  // Each branch has 8-10 medium-sized leaves
  
  const width = 900;
  const height = 550;
  const centerX = width / 2;
  const groundY = height - 60;
  const trunkTop = groundY - 180;

  // 8 branches positioned around the tree
  const branchConfigs = [
    { startY: trunkTop + 120, angle: -60, length: 140, curve: 40 },  // Lower left
    { startY: trunkTop + 100, angle: -40, length: 130, curve: 35 },
    { startY: trunkTop + 70, angle: -20, length: 150, curve: 45 },   // Mid left
    { startY: trunkTop + 40, angle: -10, length: 140, curve: 40 },
    { startY: trunkTop + 40, angle: 10, length: 140, curve: 40 },
    { startY: trunkTop + 70, angle: 20, length: 150, curve: 45 },    // Mid right
    { startY: trunkTop + 100, angle: 40, length: 130, curve: 35 },
    { startY: trunkTop + 120, angle: 60, length: 140, curve: 40 }    // Lower right
  ];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Ground with grass */}
      <path
        d={`M 0 ${groundY} Q ${width/2} ${groundY + 15} ${width} ${groundY}`}
        fill="#D4A574"
        stroke="#8B4513"
        strokeWidth="2"
      />
      
      {/* Grass patches */}
      {[...Array(15)].map((_, i) => {
        const x = i * 60 + 30;
        return (
          <g key={`grass-${i}`}>
            <path
              d={`M ${x} ${groundY} Q ${x + 3} ${groundY - 15} ${x + 6} ${groundY}`}
              fill="none"
              stroke="#7BA05B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d={`M ${x + 8} ${groundY} Q ${x + 11} ${groundY - 12} ${x + 14} ${groundY}`}
              fill="none"
              stroke="#7BA05B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        );
      })}

      {/* Tree trunk */}
      <path
        d={`
          M ${centerX - 25} ${groundY}
          L ${centerX - 20} ${trunkTop}
          L ${centerX + 20} ${trunkTop}
          L ${centerX + 25} ${groundY}
          Z
        `}
        fill="#8B4513"
        stroke="#654321"
        strokeWidth="2"
      />

      {/* Trunk texture */}
      <line x1={centerX - 15} y1={groundY - 40} x2={centerX - 12} y2={groundY - 70} stroke="#654321" strokeWidth="1.5" />
      <line x1={centerX + 15} y1={groundY - 50} x2={centerX + 12} y2={groundY - 80} stroke="#654321" strokeWidth="1.5" />
      <line x1={centerX - 10} y1={groundY - 100} x2={centerX - 8} y2={groundY - 120} stroke="#654321" strokeWidth="1.5" />

      {/* 8 Branches */}
      {branches.map((branch, index) => {
        const config = branchConfigs[index];
        const rad = (config.angle * Math.PI) / 180;
        const endX = centerX + Math.sin(rad) * config.length;
        const endY = config.startY - Math.cos(rad) * config.length * 0.5;
        const controlX = centerX + Math.sin(rad) * (config.length * 0.6);
        const controlY = config.startY - config.curve;

        const isSelected = selectedBranch === branch.track;

        return (
          <g key={branch.track}>
            {/* Branch */}
            <path
              d={`M ${centerX} ${config.startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
              fill="none"
              stroke={isSelected ? branch.color : '#8B4513'}
              strokeWidth={isSelected ? 7 : 5}
              strokeLinecap="round"
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onClick={() => onBranchClick(branch.track)}
            />

            {/* Branch icon label */}
            <g 
              transform={`translate(${endX}, ${endY - 30})`}
              style={{ cursor: 'pointer' }}
              onClick={() => onBranchClick(branch.track)}
            >
              <circle r="22" fill={branch.color} opacity="0.95" />
              <text
                textAnchor="middle"
                dy="0.35em"
                fontSize="18"
                fill="white"
              >
                {branch.icon}
              </text>
            </g>

            {/* Leaves on branch (8-10 medium leaves) */}
            {branch.leaves.slice(0, 10).map((leaf, leafIndex) => {
              const t = (leafIndex + 1) / 11;
              const leafX = centerX + (endX - centerX) * t + (Math.random() - 0.5) * 30;
              const leafY = config.startY + (endY - config.startY) * t - Math.random() * 20;

              const masteryColor = getLeafColor(leaf.mastery);

              return (
                <g
                  key={leaf.id}
                  transform={`translate(${leafX}, ${leafY}) rotate(${Math.random() * 60 - 30})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => onLeafHover(leaf)}
                  onMouseLeave={() => onLeafHover(null)}
                >
                  {/* Medium leaf shape */}
                  <path
                    d="M 0 0 Q -8 -6 -12 -10 Q -8 -14 0 -16 Q 8 -14 12 -10 Q 8 -6 0 0 Z"
                    fill={masteryColor}
                    stroke="#2d5016"
                    strokeWidth="1.2"
                  />
                  <line x1="0" y1="0" x2="0" y2="-16" stroke="#2d5016" strokeWidth="0.8" />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Progress indicator in trunk */}
      <text
        x={centerX}
        y={groundY - 90}
        textAnchor="middle"
        fontSize="16"
        fontFamily="Kalam, cursive"
        fill="white"
        fontWeight="bold"
      >
        {Math.round(branches.reduce((sum, b) => sum + b.progress.percent, 0) / branches.length)}%
      </text>

      {/* Title */}
      <text
        x={width / 2}
        y={35}
        textAnchor="middle"
        fontSize="32"
        fontFamily="Permanent Marker, cursive"
        fill="#6A4C93"
      >
        🌳 My Learning Tree
      </text>
    </svg>
  );
}

function getLeafColor(mastery: string): string {
  switch (mastery) {
    case 'MASTERED':
      return '#7BA05B';
    case 'PROFICIENT':
      return '#98FB98';
    case 'PRACTICING':
      return '#FFDAB9';
    case 'INTRODUCED':
      return '#FFE5B4';
    default:
      return '#e0e0e0';
  }
}
