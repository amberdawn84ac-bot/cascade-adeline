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

interface MatureOakProps {
  branches: Branch[];
  config: any;
  onBranchClick: (track: string) => void;
  onLeafHover: (leaf: any) => void;
  selectedBranch: string | null;
}

export function MatureOak({ branches, config, onBranchClick, onLeafHover, selectedBranch }: MatureOakProps) {
  // 9-12: Full mature oak with thick trunk, complex branching
  // Each branch has 18-20 tiny leaves + fruits on mastered branches
  
  const width = 1200;
  const height = 750;
  const centerX = width / 2;
  const groundY = height - 80;
  const trunkTop = groundY - 320;

  // 8 main branches with multiple secondaries and tertiaries
  const branchConfigs = [
    { 
      startY: trunkTop + 230, 
      angle: -70, 
      length: 220,
      secondaries: [
        {angle: -80, length: 80, tertiaries: [{angle: -85, length: 40}, {angle: -75, length: 35}]},
        {angle: -60, length: 70, tertiaries: [{angle: -65, length: 30}, {angle: -55, length: 35}]}
      ]
    },
    { 
      startY: trunkTop + 200, 
      angle: -50, 
      length: 210,
      secondaries: [
        {angle: -60, length: 75, tertiaries: [{angle: -68, length: 38}]},
        {angle: -40, length: 65, tertiaries: [{angle: -45, length: 32}]}
      ]
    },
    { 
      startY: trunkTop + 160, 
      angle: -28, 
      length: 230,
      secondaries: [
        {angle: -38, length: 85, tertiaries: [{angle: -45, length: 42}, {angle: -30, length: 38}]},
        {angle: -18, length: 75, tertiaries: [{angle: -22, length: 35}]}
      ]
    },
    { 
      startY: trunkTop + 120, 
      angle: -10, 
      length: 220,
      secondaries: [
        {angle: -18, length: 70, tertiaries: [{angle: -25, length: 35}]},
        {angle: -2, length: 80, tertiaries: [{angle: -8, length: 40}, {angle: 4, length: 35}]}
      ]
    },
    { 
      startY: trunkTop + 120, 
      angle: 10, 
      length: 220,
      secondaries: [
        {angle: 18, length: 70, tertiaries: [{angle: 25, length: 35}]},
        {angle: 2, length: 80, tertiaries: [{angle: 8, length: 40}, {angle: -4, length: 35}]}
      ]
    },
    { 
      startY: trunkTop + 160, 
      angle: 28, 
      length: 230,
      secondaries: [
        {angle: 38, length: 85, tertiaries: [{angle: 45, length: 42}, {angle: 30, length: 38}]},
        {angle: 18, length: 75, tertiaries: [{angle: 22, length: 35}]}
      ]
    },
    { 
      startY: trunkTop + 200, 
      angle: 50, 
      length: 210,
      secondaries: [
        {angle: 60, length: 75, tertiaries: [{angle: 68, length: 38}]},
        {angle: 40, length: 65, tertiaries: [{angle: 45, length: 32}]}
      ]
    },
    { 
      startY: trunkTop + 230, 
      angle: 70, 
      length: 220,
      secondaries: [
        {angle: 80, length: 80, tertiaries: [{angle: 85, length: 40}, {angle: 75, length: 35}]},
        {angle: 60, length: 70, tertiaries: [{angle: 65, length: 30}, {angle: 55, length: 35}]}
      ]
    }
  ];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Ground shadow */}
      <ellipse cx={centerX} cy={groundY + 15} rx={width / 1.8} ry="40" fill="#000" opacity="0.1" />
      
      {/* Ground */}
      <path
        d={`M 0 ${groundY} Q ${width/2} ${groundY + 25} ${width} ${groundY}`}
        fill="#D4A574"
        stroke="#8B4513"
        strokeWidth="3"
      />
      
      {/* Dense grass */}
      {[...Array(35)].map((_, i) => {
        const x = i * 35 + Math.random() * 20;
        const height = 18 + Math.random() * 15;
        return (
          <path
            key={`grass-${i}`}
            d={`M ${x} ${groundY} Q ${x + 2} ${groundY - height} ${x + 4} ${groundY}`}
            fill="none"
            stroke="#7BA05B"
            strokeWidth="3"
            strokeLinecap="round"
            opacity={0.6 + Math.random() * 0.4}
          />
        );
      })}

      {/* Thick oak trunk with detailed texture */}
      <defs>
        <linearGradient id="oakTrunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5a3a1a" />
          <stop offset="25%" stopColor="#6f4e37" />
          <stop offset="50%" stopColor="#8B4513" />
          <stop offset="75%" stopColor="#6f4e37" />
          <stop offset="100%" stopColor="#5a3a1a" />
        </linearGradient>
        
        <filter id="barkTexture">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" />
          <feColorMatrix values="0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 0.1 0" />
        </filter>
      </defs>

      <path
        d={`
          M ${centerX - 50} ${groundY}
          Q ${centerX - 45} ${groundY - 100} ${centerX - 38} ${groundY - 200}
          L ${centerX - 30} ${trunkTop}
          L ${centerX + 30} ${trunkTop}
          L ${centerX + 38} ${groundY - 200}
          Q ${centerX + 45} ${groundY - 100} ${centerX + 50} ${groundY}
          Z
        `}
        fill="url(#oakTrunkGradient)"
        stroke="#5a3a1a"
        strokeWidth="3"
      />

      {/* Bark texture overlay */}
      <path
        d={`
          M ${centerX - 50} ${groundY}
          Q ${centerX - 45} ${groundY - 100} ${centerX - 38} ${groundY - 200}
          L ${centerX - 30} ${trunkTop}
          L ${centerX + 30} ${trunkTop}
          L ${centerX + 38} ${groundY - 200}
          Q ${centerX + 45} ${groundY - 100} ${centerX + 50} ${groundY}
          Z
        `}
        fill="none"
        filter="url(#barkTexture)"
      />

      {/* Detailed bark patterns */}
      {[...Array(20)].map((_, i) => (
        <g key={`bark-detail-${i}`}>
          <ellipse
            cx={centerX + (i % 2 === 0 ? -25 : 22)}
            cy={groundY - 50 - i * 14}
            rx="12"
            ry="5"
            fill="#5a3a1a"
            opacity="0.4"
          />
          <line
            x1={centerX + (i % 3 === 0 ? -18 : 15)}
            y1={groundY - 45 - i * 14}
            x2={centerX + (i % 3 === 0 ? -20 : 17)}
            y2={groundY - 55 - i * 14}
            stroke="#5a3a1a"
            strokeWidth="2"
            opacity="0.3"
          />
        </g>
      ))}

      {/* 8 Complex branches with secondaries and tertiaries */}
      {branches.map((branch, index) => {
        const config = branchConfigs[index];
        const rad = (config.angle * Math.PI) / 180;
        const endX = centerX + Math.sin(rad) * config.length;
        const endY = config.startY - Math.abs(Math.cos(rad)) * config.length * 0.35;
        
        const isSelected = selectedBranch === branch.track;
        const hasFruit = branch.progress.mastered > branch.leaves.length * 0.7; // Fruits appear when >70% mastered

        return (
          <g key={branch.track}>
            {/* Main branch */}
            <path
              d={`M ${centerX} ${config.startY} Q ${centerX + Math.sin(rad) * config.length * 0.7} ${config.startY - 80} ${endX} ${endY}`}
              fill="none"
              stroke={isSelected ? branch.color : '#8B4513'}
              strokeWidth={isSelected ? 10 : 8}
              strokeLinecap="round"
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onClick={() => onBranchClick(branch.track)}
            />

            {/* Secondary and tertiary branches */}
            {config.secondaries.map((sec, secIndex) => {
              const secRad = (sec.angle * Math.PI) / 180;
              const secEndX = endX + Math.sin(secRad) * sec.length;
              const secEndY = endY - Math.abs(Math.cos(secRad)) * sec.length * 0.4;

              return (
                <g key={`sec-${secIndex}`}>
                  <path
                    d={`M ${endX} ${endY} L ${secEndX} ${secEndY}`}
                    fill="none"
                    stroke={isSelected ? branch.color : '#8B4513'}
                    strokeWidth={isSelected ? 6 : 4}
                    strokeLinecap="round"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onBranchClick(branch.track)}
                  />

                  {/* Tertiary branches */}
                  {sec.tertiaries?.map((ter, terIndex) => {
                    const terRad = (ter.angle * Math.PI) / 180;
                    const terEndX = secEndX + Math.sin(terRad) * ter.length;
                    const terEndY = secEndY - Math.abs(Math.cos(terRad)) * ter.length * 0.3;

                    return (
                      <path
                        key={`ter-${terIndex}`}
                        d={`M ${secEndX} ${secEndY} L ${terEndX} ${terEndY}`}
                        fill="none"
                        stroke={isSelected ? branch.color : '#8B4513'}
                        strokeWidth={isSelected ? 4 : 2.5}
                        strokeLinecap="round"
                        style={{ cursor: 'pointer' }}
                        onClick={() => onBranchClick(branch.track)}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Branch label */}
            <g 
              transform={`translate(${endX}, ${endY - 40})`}
              style={{ cursor: 'pointer' }}
              onClick={() => onBranchClick(branch.track)}
            >
              <circle r="24" fill={branch.color} />
              <circle r="24" fill="white" opacity="0.2" />
              <text
                textAnchor="middle"
                dy="0.35em"
                fontSize="18"
                fill="white"
                fontWeight="bold"
              >
                {branch.icon}
              </text>
            </g>

            {/* Dense tiny leaves (18-20) */}
            {branch.leaves.slice(0, 20).map((leaf, leafIndex) => {
              // Distribute across branch system
              const branchSegment = Math.floor(leafIndex / 7);
              const leafT = (leafIndex % 7) / 7;
              
              let leafX, leafY;
              
              if (branchSegment === 0) {
                // Main branch
                leafX = centerX + (endX - centerX) * leafT + (Math.random() - 0.5) * 30;
                leafY = config.startY + (endY - config.startY) * leafT - Math.random() * 25;
              } else {
                // Secondary branches
                const sec = config.secondaries[branchSegment - 1];
                if (sec) {
                  const secRad = (sec.angle * Math.PI) / 180;
                  const secEndX = endX + Math.sin(secRad) * sec.length;
                  const secEndY = endY - Math.abs(Math.cos(secRad)) * sec.length * 0.4;
                  leafX = endX + (secEndX - endX) * leafT + (Math.random() - 0.5) * 20;
                  leafY = endY + (secEndY - endY) * leafT - Math.random() * 15;
                } else {
                  leafX = endX + (Math.random() - 0.5) * 40;
                  leafY = endY - Math.random() * 30;
                }
              }

              const masteryColor = getLeafColor(leaf.mastery);

              return (
                <g
                  key={leaf.id}
                  transform={`translate(${leafX}, ${leafY}) rotate(${Math.random() * 120 - 60})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => onLeafHover(leaf)}
                  onMouseLeave={() => onLeafHover(null)}
                >
                  {/* Tiny detailed oak leaf */}
                  <path
                    d="M 0 0 Q -4 -3 -5 -6 Q -3 -8 0 -9 Q 3 -8 5 -6 Q 4 -3 0 0 Z"
                    fill={masteryColor}
                    stroke="#2d5016"
                    strokeWidth="0.8"
                  />
                </g>
              );
            })}

            {/* Fruits on highly mastered branches */}
            {hasFruit && [...Array(3)].map((_, i) => {
              const fruitT = (i + 1) / 4;
              const fruitX = centerX + (endX - centerX) * fruitT + (Math.random() - 0.5) * 20;
              const fruitY = config.startY + (endY - config.startY) * fruitT + 10;

              return (
                <g key={`fruit-${i}`} transform={`translate(${fruitX}, ${fruitY})`}>
                  <circle r="6" fill="#D4526E" />
                  <circle r="6" fill="#FF6B6B" opacity="0.7" />
                  <circle cx="-2" cy="-2" r="2" fill="white" opacity="0.5" />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Title */}
      <text
        x={width / 2}
        y={45}
        textAnchor="middle"
        fontSize="42"
        fontFamily="Permanent Marker, cursive"
        fill="#6A4C93"
      >
        🌳 My Mature Oak
      </text>

      {/* Graduation progress indicator */}
      <g transform={`translate(${centerX}, ${groundY - 180})`}>
        <circle r="35" fill="white" stroke="#6A4C93" strokeWidth="3" />
        <text
          textAnchor="middle"
          dy="-0.1em"
          fontSize="20"
          fontFamily="Kalam, cursive"
          fill="#6A4C93"
          fontWeight="bold"
        >
          {Math.round(branches.reduce((sum, b) => sum + b.progress.percent, 0) / branches.length)}%
        </text>
        <text
          textAnchor="middle"
          y="18"
          fontSize="11"
          fontFamily="Kalam, cursive"
          fill="#666"
        >
          to graduation
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
