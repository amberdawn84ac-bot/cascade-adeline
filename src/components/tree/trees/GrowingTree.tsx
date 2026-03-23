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

interface GrowingTreeProps {
  branches: Branch[];
  config: any;
  onBranchClick: (track: string) => void;
  onLeafHover: (leaf: any) => void;
  selectedBranch: string | null;
}

export function GrowingTree({ branches, config, onBranchClick, onLeafHover, selectedBranch }: GrowingTreeProps) {
  // 6-8: Stronger tree with thicker trunk, more branches
  // Each branch has 12-15 smaller leaves
  
  const width = 1000;
  const height = 650;
  const centerX = width / 2;
  const groundY = height - 70;
  const trunkTop = groundY - 250;

  // 8 main branches with secondary branches
  const branchConfigs = [
    { startY: trunkTop + 180, angle: -65, length: 180, secondaries: [{angle: -75, length: 60}, {angle: -55, length: 50}] },
    { startY: trunkTop + 150, angle: -45, length: 170, secondaries: [{angle: -55, length: 55}, {angle: -35, length: 45}] },
    { startY: trunkTop + 110, angle: -25, length: 190, secondaries: [{angle: -35, length: 65}, {angle: -15, length: 55}] },
    { startY: trunkTop + 80, angle: -12, length: 175, secondaries: [{angle: -20, length: 50}, {angle: -5, length: 60}] },
    { startY: trunkTop + 80, angle: 12, length: 175, secondaries: [{angle: 20, length: 50}, {angle: 5, length: 60}] },
    { startY: trunkTop + 110, angle: 25, length: 190, secondaries: [{angle: 35, length: 65}, {angle: 15, length: 55}] },
    { startY: trunkTop + 150, angle: 45, length: 170, secondaries: [{angle: 55, length: 55}, {angle: 35, length: 45}] },
    { startY: trunkTop + 180, angle: 65, length: 180, secondaries: [{angle: 75, length: 60}, {angle: 55, length: 50}] }
  ];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Ground */}
      <ellipse cx={centerX} cy={groundY + 10} rx={width / 2} ry="30" fill="#D4A574" opacity="0.6" />
      <path
        d={`M 0 ${groundY} Q ${width/2} ${groundY + 20} ${width} ${groundY}`}
        fill="#D4A574"
        stroke="#8B4513"
        strokeWidth="3"
      />
      
      {/* Rich grass */}
      {[...Array(25)].map((_, i) => {
        const x = i * 40 + Math.random() * 20;
        const height = 15 + Math.random() * 10;
        return (
          <path
            key={`grass-${i}`}
            d={`M ${x} ${groundY} Q ${x + 2} ${groundY - height} ${x + 4} ${groundY}`}
            fill="none"
            stroke="#7BA05B"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity={0.7 + Math.random() * 0.3}
          />
        );
      })}

      {/* Thicker trunk with more detail */}
      <defs>
        <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#654321" />
          <stop offset="50%" stopColor="#8B4513" />
          <stop offset="100%" stopColor="#654321" />
        </linearGradient>
      </defs>

      <path
        d={`
          M ${centerX - 35} ${groundY}
          L ${centerX - 28} ${trunkTop + 50}
          L ${centerX - 22} ${trunkTop}
          L ${centerX + 22} ${trunkTop}
          L ${centerX + 28} ${trunkTop + 50}
          L ${centerX + 35} ${groundY}
          Z
        `}
        fill="url(#trunkGradient)"
        stroke="#654321"
        strokeWidth="2"
      />

      {/* Trunk bark texture */}
      {[...Array(12)].map((_, i) => (
        <ellipse
          key={`bark-${i}`}
          cx={centerX + (i % 2 === 0 ? -15 : 15)}
          cy={groundY - 40 - i * 18}
          rx="8"
          ry="4"
          fill="#654321"
          opacity="0.3"
        />
      ))}

      {/* 8 Branches with secondaries */}
      {branches.map((branch, index) => {
        const config = branchConfigs[index];
        const rad = (config.angle * Math.PI) / 180;
        const endX = centerX + Math.sin(rad) * config.length;
        const endY = config.startY - Math.abs(Math.cos(rad)) * config.length * 0.4;
        
        const isSelected = selectedBranch === branch.track;

        return (
          <g key={branch.track}>
            {/* Main branch */}
            <path
              d={`M ${centerX} ${config.startY} Q ${centerX + Math.sin(rad) * config.length * 0.6} ${config.startY - 60} ${endX} ${endY}`}
              fill="none"
              stroke={isSelected ? branch.color : '#8B4513'}
              strokeWidth={isSelected ? 8 : 6}
              strokeLinecap="round"
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onClick={() => onBranchClick(branch.track)}
            />

            {/* Secondary branches */}
            {config.secondaries.map((sec, secIndex) => {
              const secRad = (sec.angle * Math.PI) / 180;
              const secEndX = endX + Math.sin(secRad) * sec.length;
              const secEndY = endY - Math.abs(Math.cos(secRad)) * sec.length * 0.5;

              return (
                <path
                  key={`sec-${secIndex}`}
                  d={`M ${endX} ${endY} L ${secEndX} ${secEndY}`}
                  fill="none"
                  stroke={isSelected ? branch.color : '#8B4513'}
                  strokeWidth={isSelected ? 5 : 3}
                  strokeLinecap="round"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onBranchClick(branch.track)}
                />
              );
            })}

            {/* Branch label */}
            <g 
              transform={`translate(${endX}, ${endY - 35})`}
              style={{ cursor: 'pointer' }}
              onClick={() => onBranchClick(branch.track)}
            >
              <circle r="20" fill={branch.color} />
              <text
                textAnchor="middle"
                dy="0.35em"
                fontSize="16"
                fill="white"
              >
                {branch.icon}
              </text>
            </g>

            {/* Cluster leaves (12-15 small leaves) */}
            {branch.leaves.slice(0, 15).map((leaf, leafIndex) => {
              // Distribute leaves across main and secondary branches
              const useSec = leafIndex > 10;
              const sec = config.secondaries[leafIndex % 2];
              const secRad = (sec.angle * Math.PI) / 180;
              
              const t = (leafIndex % 10) / 10;
              let leafX, leafY;
              
              if (useSec) {
                const secEndX = endX + Math.sin(secRad) * sec.length;
                const secEndY = endY - Math.abs(Math.cos(secRad)) * sec.length * 0.5;
                leafX = endX + (secEndX - endX) * t + (Math.random() - 0.5) * 20;
                leafY = endY + (secEndY - endY) * t - Math.random() * 15;
              } else {
                leafX = centerX + (endX - centerX) * t + (Math.random() - 0.5) * 25;
                leafY = config.startY + (endY - config.startY) * t - Math.random() * 20;
              }

              const masteryColor = getLeafColor(leaf.mastery);

              return (
                <g
                  key={leaf.id}
                  transform={`translate(${leafX}, ${leafY}) rotate(${Math.random() * 90 - 45})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => onLeafHover(leaf)}
                  onMouseLeave={() => onLeafHover(null)}
                >
                  {/* Smaller detailed leaf */}
                  <path
                    d="M 0 0 Q -6 -4 -8 -8 Q -5 -11 0 -12 Q 5 -11 8 -8 Q 6 -4 0 0 Z"
                    fill={masteryColor}
                    stroke="#2d5016"
                    strokeWidth="1"
                  />
                  <line x1="0" y1="0" x2="0" y2="-12" stroke="#2d5016" strokeWidth="0.6" />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Title */}
      <text
        x={width / 2}
        y={40}
        textAnchor="middle"
        fontSize="36"
        fontFamily="Permanent Marker, cursive"
        fill="#6A4C93"
      >
        🌲 My Growing Tree
      </text>

      {/* Overall progress ring in trunk */}
      <g transform={`translate(${centerX}, ${groundY - 130})`}>
        <circle r="25" fill="white" opacity="0.9" />
        <text
          textAnchor="middle"
          dy="0.35em"
          fontSize="18"
          fontFamily="Kalam, cursive"
          fill="#6A4C93"
          fontWeight="bold"
        >
          {Math.round(branches.reduce((sum, b) => sum + b.progress.percent, 0) / branches.length)}%
        </text>
      </g>
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
