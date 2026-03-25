import React from 'react';

interface InfographicBlockProps {
  blockData: {
    block_id: string;
    title: string;
    data_visualization: 'timeline' | 'bar-chart' | 'network' | 'map';
    data_source?: string;
    svg_content?: string;
    interpretation_guide?: string;
    data_points?: Array<{
      year?: number;
      label?: string;
      value?: number;
      [key: string]: any;
    }>;
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

export default function InfographicBlock({ blockData }: InfographicBlockProps) {
  return (
    <div className="infographic-block">
      <div className="infographic-header">
        <h4>{blockData.title}</h4>
        <span className="visualization-type">{blockData.data_visualization}</span>
      </div>

      <div className="infographic-content">
        {blockData.svg_content ? (
          <div 
            className="svg-container"
            dangerouslySetInnerHTML={{ __html: blockData.svg_content }}
          />
        ) : (
          <div className="placeholder-visualization">
            <svg viewBox="0 0 400 300" className="infographic-svg">
              {blockData.data_visualization === 'timeline' && (
                <g>
                  {blockData.data_points?.map((point, i) => (
                    <g key={i}>
                      <circle
                        cx={50 + (i * 80)}
                        cy={150}
                        r="8"
                        fill="#6A4C93"
                      />
                      <text
                        x={50 + (i * 80)}
                        y={180}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#4A3C2E"
                      >
                        {point.year || point.label}
                      </text>
                    </g>
                  ))}
                  <line x1="50" y1="150" x2="350" y2="150" stroke="#8B7355" strokeWidth="2"/>
                </g>
              )}
              
              {blockData.data_visualization === 'bar-chart' && (
                <g>
                  {blockData.data_points?.map((point, i) => (
                    <rect
                      key={i}
                      x={50 + (i * 70)}
                      y={250 - (point.value || 50)}
                      width="50"
                      height={point.value || 50}
                      fill="#7BA05B"
                    />
                  ))}
                </g>
              )}
              
              {blockData.data_visualization === 'network' && (
                <g>
                  {blockData.data_points?.map((point, i) => (
                    <circle
                      key={i}
                      cx={100 + (Math.random() * 200)}
                      cy={50 + (Math.random() * 200)}
                      r="15"
                      fill="#FF7F11"
                      opacity="0.7"
                    />
                  ))}
                </g>
              )}
              
              {blockData.data_visualization === 'map' && (
                <g>
                  <rect x="50" y="50" width="300" height="200" fill="#E8F4F8" stroke="#8B7355" strokeWidth="2"/>
                  <text x="200" y="150" textAnchor="middle" fontSize="16" fill="#4A3C2E">
                    Map Visualization
                  </text>
                </g>
              )}
            </svg>
          </div>
        )}
      </div>

      {blockData.interpretation_guide && (
        <div className="interpretation-guide">
          <h5>Interpretation:</h5>
          <p>{blockData.interpretation_guide}</p>
        </div>
      )}

      {blockData.data_source && (
        <div className="data-source">
          <strong>Data Source:</strong> {blockData.data_source}
        </div>
      )}
    </div>
  );
}
