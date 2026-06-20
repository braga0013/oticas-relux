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

// Layout vertical safe zone:
//  top=230  Label
//  top=310  Notif 1 (height=185)
//  top=515  Notif 2 (height=185)
//  top=730  Sublabel "Acompanhamento"
//  top=790  Timeline (height=520, bottom=1310)
//  top=1360 Texto principal 3 linhas 56px (bottom≈1590)

interface NotifCardProps {
  icon: string;
  title: string;
  sub: string;
  delay: number;
  fromRight?: boolean;
}

const NotifCard: React.FC<NotifCardProps> = ({ icon, title, sub, delay, fromRight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 20, stiffness: 78 } });
  const x = interpolate(s, [0, 1], [fromRight ? 140 : -140, 0]);
  const op = interpolate(Math.max(0, frame - delay), [0, 14], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        opacity: op,
        transform: `translateX(${x}px)`,
        background: C.dark2,
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 28,
        padding: '32px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: 'rgba(217,119,6,0.1)',
          border: `1.5px solid rgba(217,119,6,0.32)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 38,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontFamily: 'Inter, Helvetica Neue, sans-serif',
            fontSize: 34,
            fontWeight: 600,
            color: C.white,
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'Inter, Helvetica Neue, sans-serif',
            fontSize: 26,
            fontWeight: 300,
            color: C.whiteDim,
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
};

interface StatusDotProps {
  label: string;
  time: string;
  index: number;
  startFrame: number;
  totalItems: number;
  timelineHeight: number;
}

const StatusDot: React.FC<StatusDotProps> = ({ label, time, index, startFrame, totalItems, timelineHeight }) => {
  const frame = useCurrentFrame();
  const dotFrame = startFrame + index * 22;
  const dotProg = interpolate(frame, [dotFrame, dotFrame + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isActive = dotProg > 0.3;
  const spacing = timelineHeight / (totalItems - 1);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: index * spacing,
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        opacity: dotProg,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: isActive ? C.gold : C.dark3,
          border: `3px solid ${isActive ? C.gold : 'rgba(255,255,255,0.1)'}`,
          boxShadow: isActive ? `0 0 18px rgba(217,119,6,0.65)` : 'none',
          flexShrink: 0,
          transform: `scale(${dotProg})`,
        }}
      />
      <div>
        <div
          style={{
            fontFamily: 'Inter, Helvetica Neue, sans-serif',
            fontSize: 30,
            fontWeight: 600,
            color: isActive ? C.white : C.whiteDim,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: 'Inter, Helvetica Neue, sans-serif',
            fontSize: 22,
            color: C.gold,
            marginTop: 4,
          }}
        >
          {time}
        </div>
      </div>
    </div>
  );
};

const STATUSES = [
  { label: 'Pedido confirmado', time: '14:32' },
  { label: 'Em preparo', time: '14:35' },
  { label: 'Enviado para entrega', time: '15:10' },
  { label: 'Entregue com sucesso', time: '17:48' },
];
const TIMELINE_HEIGHT = 470;
const TIMELINE_START_FRAME = 148;

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [272, 300], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const labelOp = interpolate(frame, [6, 26], [0, 1], { extrapolateRight: 'clamp' });

  // Linha da timeline preenchendo
  const lineProgress = interpolate(
    frame,
    [TIMELINE_START_FRAME, TIMELINE_START_FRAME + 90],
    [0, TIMELINE_HEIGHT],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }
  );

  const textOp = interpolate(frame, [228, 265], [0, 1], { extrapolateRight: 'clamp' });
  const textY = interpolate(frame, [228, 265], [26, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const sublabelOp = interpolate(frame, [118, 140], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.black, opacity: fadeIn * fadeOut }}>
      <GrainOverlay />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 760px 580px at 50% 44%, rgba(217,119,6,0.04) 0%, transparent 65%)',
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
        Experiência do Cliente
      </div>

      {/* Notificação 1 — top=310, height=185 */}
      <div style={{ position: 'absolute', top: 310, left: 60, right: 60 }}>
        <NotifCard
          icon="✅"
          title="Pedido confirmado!"
          sub="Óticas Relux · Pedido #2847"
          delay={28}
        />
      </div>

      {/* Notificação 2 — top=515 */}
      <div style={{ position: 'absolute', top: 515, left: 60, right: 60 }}>
        <NotifCard
          icon="📦"
          title="Seu pedido foi enviado!"
          sub="Código: BR123456789"
          delay={88}
          fromRight
        />
      </div>

      {/* Sublabel "Acompanhamento" — top=730 */}
      <div
        style={{
          position: 'absolute',
          top: 730,
          left: 80,
          opacity: sublabelOp,
          fontFamily: 'Inter, Helvetica Neue, sans-serif',
          fontSize: 20,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Acompanhamento em tempo real
      </div>

      {/* Timeline — top=790 */}
      <div style={{ position: 'absolute', top: 790, left: 80, right: 80 }}>
        {/* Track background */}
        <div
          style={{
            position: 'absolute',
            left: 14,
            top: 16,
            width: 3,
            height: TIMELINE_HEIGHT,
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 2,
          }}
        />
        {/* Track preenchimento dourado */}
        <div
          style={{
            position: 'absolute',
            left: 14,
            top: 16,
            width: 3,
            height: lineProgress,
            background: `linear-gradient(180deg, ${C.gold}, ${C.goldLight})`,
            borderRadius: 2,
            boxShadow: `0 0 14px rgba(217,119,6,0.55)`,
          }}
        />
        {/* Status dots */}
        <div style={{ position: 'relative', height: TIMELINE_HEIGHT }}>
          {STATUSES.map((s, i) => (
            <StatusDot
              key={s.label}
              label={s.label}
              time={s.time}
              index={i}
              startFrame={TIMELINE_START_FRAME}
              totalItems={STATUSES.length}
              timelineHeight={TIMELINE_HEIGHT}
            />
          ))}
        </div>
      </div>

      {/* Texto principal — top=1360 */}
      <div
        style={{
          position: 'absolute',
          top: 1360,
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
            fontSize: 54,
            fontWeight: 700,
            color: C.white,
            lineHeight: 1.38,
          }}
        >
          Seu cliente acompanha
          <br />
          cada etapa.{' '}
          <span style={{ color: C.gold, fontStyle: 'italic' }}>Profissional</span>
          <br />
          do início ao fim.
        </div>
      </div>
    </AbsoluteFill>
  );
};
