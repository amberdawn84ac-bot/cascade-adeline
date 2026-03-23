'use client';

import React, { useState, useEffect } from 'react';
import { SeedlingTree } from './trees/SeedlingTree';
import { YoungTree } from './trees/YoungTree';
import { GrowingTree } from './trees/GrowingTree';
import { MatureOak } from './trees/MatureOak';

interface TreeData {
  gradeBand: string;
  gradeLevel: string;
  branches: Branch[];
  progress: {
    total: number;
    mastered: number;
    percent: number;
    recentGrowth: number;
  };
  visualConfig: any;
}

interface Branch {
  track: string;
  displayName: string;
  color: string;
  icon: string;
  leaves: Leaf[];
  progress: {
    total: number;
    mastered: number;
    proficient: number;
    practicing: number;
    percent: number;
  };
}

interface Leaf {
  id: string;
  standardCode: string;
  description: string;
  mastery: 'NOT_STARTED' | 'INTRODUCED' | 'PRACTICING' | 'PROFICIENT' | 'MASTERED';
  demonstratedAt?: Date;
  microcredits: number;
}

export function TreeVisualization() {
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [hoveredLeaf, setHoveredLeaf] = useState<Leaf | null>(null);

  useEffect(() => {
    fetchTreeData();
  }, []);

  const fetchTreeData = async () => {
    try {
      const response = await fetch('/api/tree');
      const data = await response.json();
      setTreeData(data);
    } catch (error) {
      console.error('Failed to fetch tree data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tree-loading">
        <div className="loading-spinner">🌱</div>
        <p>Growing your learning tree...</p>
      </div>
    );
  }

  if (!treeData) {
    return <div className="tree-error">Unable to load your tree. Please try again.</div>;
  }

  // Select appropriate tree component based on grade band
  const renderTree = () => {
    const props = {
      branches: treeData.branches,
      config: treeData.visualConfig,
      onBranchClick: setSelectedBranch,
      onLeafHover: setHoveredLeaf,
      selectedBranch
    };

    switch (treeData.gradeBand) {
      case 'seedling':
        return <SeedlingTree {...props} />;
      case 'young-tree':
        return <YoungTree {...props} />;
      case 'growing-tree':
        return <GrowingTree {...props} />;
      case 'mature-oak':
        return <MatureOak {...props} />;
      default:
        return <YoungTree {...props} />;
    }
  };

  return (
    <div className="tree-visualization">
      {/* Header with progress */}
      <div className="tree-header">
        <h1 className="tree-title">
          <span className="tree-icon">🌳</span>
          Your Learning Tree
        </h1>
        <div className="tree-stats">
          <div className="stat">
            <span className="stat-label">Overall Growth</span>
            <span className="stat-value">{treeData.progress.percent}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">Leaves Grown</span>
            <span className="stat-value">{treeData.progress.mastered}/{treeData.progress.total}</span>
          </div>
          <div className="stat">
            <span className="stat-label">This Month</span>
            <span className="stat-value">+{treeData.progress.recentGrowth} 🌿</span>
          </div>
        </div>
      </div>

      {/* Main tree visualization */}
      <div className="tree-container">
        {renderTree()}
      </div>

      {/* Leaf detail panel (when hovering) */}
      {hoveredLeaf && (
        <div className="leaf-detail-panel">
          <h3>🍃 {hoveredLeaf.standardCode}</h3>
          <p className="leaf-description">{hoveredLeaf.description}</p>
          <div className="leaf-mastery">
            <span className={`mastery-badge mastery-${hoveredLeaf.mastery.toLowerCase()}`}>
              {hoveredLeaf.mastery}
            </span>
            {hoveredLeaf.demonstratedAt && (
              <span className="mastered-date">
                Mastered {new Date(hoveredLeaf.demonstratedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {hoveredLeaf.mastery !== 'MASTERED' && (
            <button className="practice-button">
              Practice This →
            </button>
          )}
        </div>
      )}

      {/* Branch detail panel (when branch is selected) */}
      {selectedBranch && (
        <div className="branch-detail-panel">
          {(() => {
            const branch = treeData.branches.find(b => b.track === selectedBranch);
            if (!branch) return null;

            return (
              <>
                <div className="branch-header">
                  <button 
                    className="close-button"
                    onClick={() => setSelectedBranch(null)}
                  >
                    ✕
                  </button>
                  <h2>
                    <span className="branch-icon">{branch.icon}</span>
                    {branch.displayName}
                  </h2>
                  <div className="branch-progress-bar">
                    <div 
                      className="branch-progress-fill"
                      style={{ 
                        width: `${branch.progress.percent}%`,
                        backgroundColor: branch.color
                      }}
                    />
                  </div>
                  <p className="branch-stats">
                    {branch.progress.mastered} mastered, {branch.progress.proficient} proficient, {branch.progress.practicing} practicing
                  </p>
                </div>

                <div className="leaves-list">
                  {branch.leaves.map(leaf => (
                    <div 
                      key={leaf.id}
                      className={`leaf-item mastery-${leaf.mastery.toLowerCase()}`}
                      onMouseEnter={() => setHoveredLeaf(leaf)}
                      onMouseLeave={() => setHoveredLeaf(null)}
                    >
                      <span className="leaf-status">
                        {leaf.mastery === 'MASTERED' ? '✓' : '○'}
                      </span>
                      <div className="leaf-content">
                        <span className="leaf-code">{leaf.standardCode}</span>
                        <span className="leaf-desc">{leaf.description.substring(0, 80)}...</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      <style jsx>{`
        .tree-visualization {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Kalam', cursive;
        }

        .tree-header {
          background: linear-gradient(135deg, #FFFEF7 0%, #FFF8E7 100%);
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .tree-title {
          font-family: 'Permanent Marker', cursive;
          font-size: 2.5rem;
          color: #6A4C93;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .tree-icon {
          font-size: 3rem;
        }

        .tree-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-label {
          font-family: 'Amatic SC', cursive;
          font-size: 1.3rem;
          color: #666;
        }

        .stat-value {
          font-family: 'Permanent Marker', cursive;
          font-size: 2rem;
          color: #7BA05B;
        }

        .tree-container {
          min-height: 600px;
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .tree-loading, .tree-error {
          text-align: center;
          padding: 4rem;
          font-size: 1.5rem;
          color: #666;
        }

        .loading-spinner {
          font-size: 4rem;
          animation: grow 2s ease-in-out infinite;
        }

        @keyframes grow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .leaf-detail-panel {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 350px;
          background: white;
          border: 3px solid #7BA05B;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          z-index: 100;
        }

        .leaf-detail-panel h3 {
          font-family: 'Amatic SC', cursive;
          font-size: 1.8rem;
          color: #6A4C93;
          margin-bottom: 0.5rem;
        }

        .leaf-description {
          color: #333;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .leaf-mastery {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .mastery-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: bold;
        }

        .mastery-not_started { background: #e0e0e0; color: #666; }
        .mastery-introduced { background: #FFE5B4; color: #8B4513; }
        .mastery-practicing { background: #FFDAB9; color: #CD853F; }
        .mastery-proficient { background: #98FB98; color: #228B22; }
        .mastery-mastered { background: #7BA05B; color: white; }

        .mastered-date {
          font-size: 0.85rem;
          color: #666;
        }

        .practice-button {
          width: 100%;
          padding: 0.75rem;
          background: #FF7F11;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Kalam', cursive;
          font-size: 1rem;
          font-weight: bold;
        }

        .practice-button:hover {
          background: #FF006E;
        }

        .branch-detail-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
          overflow-y: auto;
          z-index: 200;
        }

        .branch-header {
          position: relative;
          margin-bottom: 2rem;
        }

        .close-button {
          position: absolute;
          top: -1rem;
          right: -1rem;
          width: 40px;
          height: 40px;
          background: #FF006E;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.5rem;
          line-height: 1;
        }

        .branch-header h2 {
          font-family: 'Permanent Marker', cursive;
          font-size: 2rem;
          color: #6A4C93;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .branch-icon {
          font-size: 2.5rem;
        }

        .branch-progress-bar {
          width: 100%;
          height: 16px;
          background: #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .branch-progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .branch-stats {
          font-size: 0.95rem;
          color: #666;
        }

        .leaves-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .leaf-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: #f9f9f9;
          border-radius: 8px;
          border-left: 4px solid #e0e0e0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .leaf-item:hover {
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .leaf-item.mastery-mastered {
          border-left-color: #7BA05B;
          background: #f0f8f0;
        }

        .leaf-item.mastery-proficient {
          border-left-color: #98FB98;
        }

        .leaf-item.mastery-practicing {
          border-left-color: #FFDAB9;
        }

        .leaf-status {
          font-size: 1.5rem;
          color: #7BA05B;
        }

        .leaf-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .leaf-code {
          font-weight: bold;
          color: #6A4C93;
          font-size: 0.9rem;
        }

        .leaf-desc {
          color: #666;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}
