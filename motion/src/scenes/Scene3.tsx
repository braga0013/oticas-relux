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
import { PhoneMockup, CheckoutScreen } from '../components/PhoneMockup';

// Layout vertical preciso — SEM sobreposição de elementos
// Canvas: 1080×1920, safe zone: y 220–1700
//
//  top=230  → Label "Checkout & Pagamentos"
//  top=300  → Phone 370×777px  (left=355, right=725)
//  top=1095 → Chip PIX   (left=40)
//  top=1200 → Chip Cartão (right=30)
//  top=1305 → Checkmark SVG 180×180 (centrado)
//  top=1505 → "Pagamento aprovado" (centrado)
//  top=1565 → Texto principal 3 linhas 52px  (bottom≈1775)

const CheckmarkSVG: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();

  const circleOffset = interpolate(frame, [startFrame, startFrame + 35], [276.5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const checkOffset = interpolate(frame, [startFrame + 18, startFrame + 48], [78, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const opacity = interpolate(frame, [startFrame - 4, startFrame + 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulsePhase = Math.max(0, frame - (startFrame + 50));
  const glow =
    pulsePhase > 0 ? 0.35 + Math.sin((pulsePhase / 60) * Math.PI * 2) * 0.14 : 0;

  return (
    <div style={{ position: 'relative', width: 180, height: 180, opacity }}>
      {glow > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: -24,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(34,197,94,${glow}) 0%, transparent 70%)`,
          }}
        />
      )}
      <svg viewBox="0 0 100 100" width={180} height={180}>
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={C.green}
          strokeWidth="3.5"
          strokeDasharray="276.5"
          strokeDashoffset={circleOffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <path
          d="M26 50 L42 68 L74 30"
          fill="none"
          stroke={C.green}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="78"
          strokeDashoffset={checkOffset}
        />
      </svg>
    </div>
  );
};

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [332, 360], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const phoneSpring = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 24, stiffness: 60 } });
  const phoneY = interpolate(phoneSpring, [0, 1], [160, 0]);
  const phoneFloat = Math.sin((frame / fps) * Math.PI * 0.6) * 10;

  const labelOp = interpolate(frame, [6, 26], [0, 1], { extrapolateRight: 'clamp' });

  // Checkmark spring (aparece após chips)
  const checkSpring = spring({ frame: Math.max(0, frame - 215), fps, config: { damping: 18, stiffness: 100 } });
  const checkScale = interpolate(checkSpring, [0, 1], [0.5, 1]);

  // "Pagamento aprovado"
  const approvedOp = interpolate(frame, [262, 285], [0, 1], { extrapolateRight: 'clamp' });

  // Texto principal
  const textOp = interpolate(frame, [285, 320], [0, 1], { extrapolateRight: 'clamp' });
  const textY = interpolate(frame, [285, 320], [28, 0], {
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
          background: 'radial-gradient(ellipse 780px 580px at 50% 46%, rgba(217,119,6,0.04) 0%, transparent 66%)',
          pointerEvents: 'none',
        }}
      />

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          top: 230,
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
        Checkout & Pagamentos
      </div>

      {/* Phone: 370×777, left=355 */}
      <div
        style={{
          position: 'absolute',
          top: 300,
          left: 355,
          transform: `translateY(${phoneY + phoneFloat}px)`,
        }}
      >
        <PhoneMockup width={370}>
          <CheckoutScreen />
        </PhoneMockup>
      </div>

      {/* Chip PIX — top=1095 (abaixo do phone bottom≈1077) */}
      <GoldenChip delay={70} origin="left" style={{ top: 1095, left: 40 }}>
        ⚡ Pix com desconto automático
      </GoldenChip>

      {/* Chip Cartão — top=1200 (gap=35px do chip anterior) */}
      <GoldenChip delay={115} origin="right" style={{ top: 1200, right: 30 }}>
        💳 Cartão em até 10x
      </GoldenChip>

      {/* Checkmark — top=1305 (gap=35px do chip anterior bottom≈1270) */}
      <div
        style={{
          position: 'absolute',
          top: 1305,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${checkScale})`,
        }}
      >
        <CheckmarkSVG startFrame={220} />
      </div>

      {/* "Pagamento aprovado" — top=1505 (gap=20px abaixo checkmark bottom=1485) */}
      <div
        style={{
          position: 'absolute',
          top: 1505,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: approvedOp,
          fontFamily: 'Inter, Helvetica Neue, sans-serif',
          fontSize: 30,
          fontWeight: 600,
          color: C.green,
          letterSpacing: '0.04em',
        }}
      >
        Pagamento aprovado ✓
      </div>

      {/* Texto principal — top=1565 (gap=30px abaixo approved) */}
      <div
        style={{
          position: 'absolute',
          top: 1565,
          left: 70,
          right: 70,
          textAlign: 'center',
          opacity: textOp,
          transform: `translateY(${textY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 52,
            fontWeight: 700,
            color: C.white,
            lineHeight: 1.38,
          }}
        >
          O cliente compra.
          <br />O dinheiro cai
          <br />na sua conta.
        </div>
      </div>
    </AbsoluteFill>
  );
};
