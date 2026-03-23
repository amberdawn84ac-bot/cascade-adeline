/**
 * SVG Filters for Botanical Illustration Style
 * Creates watercolor washes, pencil textures, and organic edges
 */

export function BotanicalFilters() {
  return (
    <defs>
      {/* Watercolor wash effect for leaves */}
      <filter id="watercolor" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="1" />
        <feDisplacementMap in="SourceGraphic" scale="8" />
        <feGaussianBlur stdDeviation="0.8" />
      </filter>

      {/* Pencil sketch texture */}
      <filter id="pencilSketch">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed="2" />
        <feColorMatrix values="0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 0.15 0" />
        <feComposite operator="in" in2="SourceGraphic" />
        <feComposite operator="over" in2="SourceGraphic" />
      </filter>

      {/* Soft edge blur for organic shapes */}
      <filter id="softEdge">
        <feGaussianBlur stdDeviation="0.5" />
      </filter>

      {/* Parchment paper texture */}
      <filter id="parchment">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="5" seed="3" />
        <feColorMatrix values="0 0 0 0 0.96, 0 0 0 0 0.94, 0 0 0 0 0.88, 0 0 0 0.03 0" />
        <feBlend mode="multiply" in2="SourceGraphic" />
      </filter>

      {/* Drop shadow for labels */}
      <filter id="labelShadow">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
        <feOffset dx="1" dy="2" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/**
 * Track color palette - muted botanical watercolors
 */
export const TRACK_COLORS = {
  'gods-creation-science': {
    primary: '#7FA663',    // Sage green
    secondary: '#9BC279',  // Light olive
    tertiary: '#CADBA8'    // Pale green
  },
  'health-naturopathy': {
    primary: '#E8A87C',    // Warm terracotta
    secondary: '#F0C097',  // Peachy
    tertiary: '#F9E4D4'    // Cream peach
  },
  'food-systems': {
    primary: '#D4A574',    // Golden wheat
    secondary: '#E6C89C',  // Light tan
    tertiary: '#F2E5D0'    // Ivory
  },
  'government-economics': {
    primary: '#9B8B7E',    // Taupe
  secondary: '#B5A79A',  // Warm gray
    tertiary: '#D4CCC4'    // Light taupe
  },
  'justice-changemaking': {
    primary: '#C97676',    // Dusty rose
    secondary: '#E09999',  // Soft coral
    tertiary: '#F0CCCC'    // Pale pink
  },
  'discipleship-cultural-discernment': {
    primary: '#8B7355',    // Saddle brown
    secondary: '#A68968',  // Light brown
    tertiary: '#C9BFB3'    // Beige
  },
  'truth-based-history': {
    primary: '#B8956A',    // Antique brass
    secondary: '#D4B896',  // Sand
    tertiary: '#E8DCC8'    // Parchment
  },
  'english-literature': {
    primary: '#7B6B8F',    // Muted purple
    secondary: '#9D8DB0',  // Lavender gray
    tertiary: '#C9BFD8'    // Pale lavender
  }
};

/**
 * Get colors for a track
 */
export function getTrackColors(track: string) {
  return TRACK_COLORS[track as keyof typeof TRACK_COLORS] || TRACK_COLORS['gods-creation-science'];
}
