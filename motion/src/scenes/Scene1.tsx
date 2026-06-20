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
import { FontLoader } from '../components/FontLoader';

const CharReveal: React.FC<{ char: string; delay: number }> = ({ char, delay }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const y = interpolate(frame, [delay, delay + 14], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  if (char === ' ') return <span style={{ display: 'inline-block', width: '0.28em' }}>&nbsp;</span>;
  return (
    <span style={{ display: 'inline-block', opacity, transform: `translateY(${y}px)` }}>
      {char}
    </span>
  );
};

const LineReveal: React.FC<{ text: string; startFrame: number; charDelay?: number }> = ({
  text, startFrame, charDelay = 4,
}) => (
  <div style={{ overflow: 'hidden' }}>
    <span>
      {text.split('').map((char, i) => (
        <CharReveal key={i} char={char} delay={startFrame + i * charDelay} />
      ))}
    </span>
  </div>
);

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [272, 300], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const lineWidth = interpolate(frame, [185, 220], [0, 180], { extrapolateRight: 'clamp' });

  const logoOpacity = interpolate(frame, [195, 228], [0, 1], { extrapolateRight: 'clamp' });
  const logoY = interpolate(frame, [195, 228], [28, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const subtitleOpacity = interpolate(frame, [242, 275], [0, 1], { extrapolateRight: 'clamp' });
  const glowPulse = 0.055 + Math.sin((frame / fps) * Math.PI * 0.7) * 0.02;

  return (
    <AbsoluteFill style={{ background: C.black, opacity: fadeIn * fadeOut }}>
      <FontLoader />
      <GrainOverlay opacity={0.05} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 960px 720px at 50% 48%, rgba(217,119,6,${glowPulse}) 0%, transparent 68%)`,
          pointerEvents: 'none',
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 80px',
        }}
      >
        {/* Headline dourado */}
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 110,
            fontWeight: 900,
            color: C.gold,
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}
        >
          <LineReveal text="Seu negócio" startFrame={22} charDelay={4} />
          <LineReveal text="merece uma" startFrame={86} charDelay={4} />
          <LineReveal text="loja assim." startFrame={148} charDelay={4} />
        </div>

        {/* Linha separadora dourada */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
            margin: '52px auto',
            borderRadius: 2,
          }}
        />

        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `translateY(${logoY}px)`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 72,
              fontWeight: 700,
              color: C.white,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            ÓTICAS RELUX
          </div>
          <div
            style={{
              fontFamily: 'Inter, Helvetica Neue, sans-serif',
              fontSize: 22,
              fontWeight: 300,
              color: C.whiteFaint,
              letterSpacing: '0.44em',
              textTransform: 'uppercase',
              marginTop: 12,
            }}
          >
            PREMIUM EYEWEAR
          </div>
        </div>

        {/* Label portfolio */}
        <div
          style={{
            opacity: subtitleOpacity,
            marginTop: 60,
            fontFamily: 'Inter, Helvetica Neue, sans-serif',
            fontSize: 26,
            fontWeight: 300,
            color: 'rgba(250,250,248,0.32)',
            letterSpacing: '0.06em',
            textAlign: 'center',
          }}
        >
          Case real · desenvolvido por um dev web
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
