import React from 'react';

export const GrainOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.045 }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: 99,
      pointerEvents: 'none',
      opacity,
    }}
  >
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.68"
          numOctaves="4"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  </div>
);
