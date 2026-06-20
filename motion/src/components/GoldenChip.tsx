import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { C } from '../constants';

interface GoldenChipProps {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  origin?: 'left' | 'right' | 'center';
}

export const GoldenChip: React.FC<GoldenChipProps> = ({
  children,
  delay = 0,
  style,
  origin = 'center',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const local = Math.max(0, frame - delay);

  const scale = spring({ frame: local, fps, config: { damping: 14, stiffness: 140, mass: 0.7 } });
  const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const floatY = Math.sin((frame / fps) * Math.PI * 1.1) * 9;

  const origins: Record<string, string> = {
    left: 'left center',
    right: 'right center',
    center: 'center center',
  };

  return (
    <div
      style={{
        position: 'absolute',
        opacity,
        transform: `translateY(${floatY}px)`,
        zIndex: 10,
        ...style,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          transform: `scale(${scale})`,
          transformOrigin: origins[origin],
          background: 'rgba(217,119,6,0.12)',
          border: `1.5px solid ${C.goldBorder}`,
          borderRadius: 100,
          padding: '14px 32px',
          color: C.white,
          fontFamily: 'Inter, Helvetica Neue, sans-serif',
          fontSize: 30,
          fontWeight: 500,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 24px rgba(217,119,6,0.18)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
