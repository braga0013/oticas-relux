import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { C } from '../constants';
import { GrainOverlay } from '../components/GrainOverlay';
import { GoldenChip } from '../components/GoldenChip';
import { PhoneMockup, ProductGridScreen } from '../components/PhoneMockup';

// Posições calculadas para 1080×1920 (safe zone y:220–1700)
// Phone: 460×966px centrado em x=310, top=330 → bottom=1296
// Label: top=232
// Text: top=1340 → bottom=1615

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [272, 300], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const phoneSpring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 22, stiffness: 55 },
  });
  const phoneY = interpolate(phoneSpring, [0, 1], [200, 0]);
  const phoneFloat = Math.sin((frame / fps) * Math.PI * 0.55) * 13;

  const labelOp = interpolate(frame, [6, 28], [0, 1], { extrapolateRight: 'clamp' });
  const textOp = interpolate(frame, [170, 210], [0, 1], { extrapolateRight: 'clamp' });
  const textX = interpolate(frame, [170, 210], [-50, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: C.black, opacity: fadeIn * fadeOut }}>
      <GrainOverlay />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 860px 640px at 50% 44%, rgba(217,119,6,0.045) 0%, transparent 66%)',
          pointerEvents: 'none',
        }}
      />

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          top: 232,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: labelOp,
          fontFamily: 'Inter, Helvetica Neue, sans-serif',
          fontSize: 24,
          fontWeight: 600,
          color: C.gold,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
        }}
      >
        Catálogo Online
      </div>

      {/* Phone — centrado horizontalmente, top=330 */}
      <div
        style={{
          position: 'absolute',
          top: 330,
          left: 310,
          transform: `translateY(${phoneY + phoneFloat}px)`,
        }}
      >
        <PhoneMockup width={460}>
          <ProductGridScreen frame={frame} />
        </PhoneMockup>
      </div>

      {/* Chips flutuantes ao redor do phone */}
      {/* Chip esq-superior: y≈490, chip se sobrepõe ligeiramente ao phone — design intencional */}
      <GoldenChip delay={55} origin="left" style={{ top: 490, left: 12 }}>
        📦 Catálogo 100% online
      </GoldenChip>

      {/* Chip dir-meio */}
      <GoldenChip delay={100} origin="right" style={{ top: 780, right: 10 }}>
        📸 Fotos e descrições
      </GoldenChip>

      {/* Chip esq-inferior */}
      <GoldenChip delay={145} origin="left" style={{ top: 1090, left: 12 }}>
        🔍 Filtros por categoria
      </GoldenChip>

      {/* Texto principal — top=1340, fonte 64px, 3 linhas */}
      <div
        style={{
          position: 'absolute',
          top: 1340,
          left: 70,
          right: 70,
          textAlign: 'center',
          opacity: textOp,
          transform: `translateX(${textX}px)`,
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 60,
            fontWeight: 700,
            color: C.white,
            lineHeight: 1.35,
          }}
        >
          Seus produtos,
          <br />
          organizados e prontos
          <br />
          <span style={{ color: C.gold }}>para vender.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
