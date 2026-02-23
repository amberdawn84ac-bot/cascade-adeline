import React, { useMemo } from 'react';
import { getStroke } from 'perfect-freehand';

// Helper to convert stroke points to SVG Path data
const getSvgPathFromStroke = (stroke: number[][]) => {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
};

interface SketchProps {
  points?: number[][];
  className?: string;
  fill?: string;
  options?: {
    size?: number;
    thinning?: number;
    smoothing?: number;
    streamline?: number;
    simulatePressure?: boolean;
    start?: { taper: number | boolean };
    end?: { taper: number | boolean };
  };
}

// 1. Generic Freehand Path Component
export const SketchPath: React.FC<SketchProps> = ({ points = [], className, fill = "currentColor", options }) => {
  const pathData = useMemo(() => {
    const stroke = getStroke(points, {
      size: 4,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      ...options
    });
    return getSvgPathFromStroke(stroke);
  }, [points, options]);

  return <path d={pathData} className={className} fill={fill} />;
};

// 2. Vertical Line Component (Great for timelines)
export const SketchVerticalLine: React.FC<{ height?: string, className?: string, color?: string }> = ({ 
  height = "100%", 
  className,
  color = "currentColor"
}) => {
  // Generate points for a straight vertical line with slight randomness simulated by the library
  const points = useMemo(() => [
      [0, 0],
      [0, 100], // Normalized to 100, we'll scale via SVG
      [0, 200],
      [0, 300],
      [0, 400]
  ], []);

  return (
    <svg 
      className={className} 
      style={{ height, width: '10px', overflow: 'visible' }} 
      viewBox="0 0 10 400" 
      preserveAspectRatio="none"
    >
      <SketchPath 
        points={points} 
        fill={color} 
        options={{ size: 2, thinning: 0.7, start: { taper: true }, end: { taper: true } }} 
      />
    </svg>
  );
};

// 3. Horizontal Divider Component
export const SketchDivider: React.FC<{ className?: string, color?: string }> = ({ className, color = "currentColor" }) => {
    const points = useMemo(() => {
        const pts = [];
        for(let i=0; i<=200; i+=10) pts.push([i, Math.random()]);
        return pts;
    }, []);

    return (
        <svg className={className} viewBox="0 -5 200 10" preserveAspectRatio="none" style={{ width: '100%', height: '10px', overflow: 'visible' }}>
             <SketchPath 
                points={points} 
                fill={color} 
                options={{ size: 2, thinning: 0.3, smoothing: 0.8 }} 
            />
        </svg>
    )
}

// 4. Box/Border Component (Wraps children in a hand-drawn rectangle)
export const SketchBorder: React.FC<{ children: React.ReactNode, className?: string, color?: string }> = ({ 
    children, 
    className = "", 
    color = "currentColor" 
}) => {
    return (
        <div className={`relative p-1 ${className}`}>
             <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                 <rect 
                    x="2" y="2" width="99%" height="98%" 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="1.5" 
                    // Note: perfect-freehand doesn't stroke existing rects easily without complex point generation.
                    // For a box, "Rough.js" is better, but since user asked for perfect-freehand:
                    // We will just use a dashed CSS border fallback or simple SVG for now 
                    // because generating a perfect-freehand rect based on dynamic content size 
                    // requires ResizeObservers which adds complexity.
                    //
                    // HOWEVER, to satisfy the prompt, let's draw 4 lines using SketchPath logic approx.
                 /> 
                 {/* 
                    True implementation of a responsive freehand box requires known dimensions.
                    Instead, we will render 4 sketch lines absolutely positioned.
                 */}
             </svg>
             {/* Top Line */}
             <div className="absolute top-0 left-0 right-0 h-2 overflow-hidden pointer-events-none opacity-60">
                 <SketchDivider className="w-full h-full" color={color} />
             </div>
             {/* Bottom Line */}
             <div className="absolute bottom-0 left-0 right-0 h-2 overflow-hidden pointer-events-none opacity-60">
                 <SketchDivider className="w-full h-full" color={color} />
             </div>
             {/* Left Line */}
             <div className="absolute top-0 bottom-0 left-0 w-2 overflow-hidden pointer-events-none opacity-60">
                 <SketchVerticalLine className="w-full h-full" color={color} />
             </div>
             {/* Right Line */}
             <div className="absolute top-0 bottom-0 right-0 w-2 overflow-hidden pointer-events-none opacity-60">
                 <SketchVerticalLine className="w-full h-full" color={color} />
             </div>

             <div className="relative z-10">
                 {children}
             </div>
        </div>
    );
};
