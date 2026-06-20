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

// Layout: 4 feature items em coluna, ocupando a tela inteira
// Cada item: height=340px  (4×340=1360 + label 80 + texto 200 = 1640)
// Safe zone y:220–1700 ✓

interface FeatureProps {
  number: string;
  title: string;
  sub: string;
  delay: number;
  isLast?: boolean;
}

const Feature: React.FC<FeatureProps> = ({ number, title, sub, delay, isLast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 22, stiffness: 80 } });
  const x = interpolate(s, [0, 1], [-90, 0]);
  const op = interpolate(Math.max(0, frame - delay), [0, 14], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'relative',
        opacity: op,
        transform: `translateX(${x}px)`,
        height: 340,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 70,
        paddingRight: 60,
        gap: 40,
      }}
    >
      {/* Número dourado grande */}
      <div
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 100,
          fontWeight: 900,
          color: 'rgba(217,119,6,0.18)',
          lineHeight: 1,
          minWidth: 80,
          userSelect: 'none',
          letterSpacing: '-0.04em',
        }}
      >
        {number}
      </div>

      {/* Linha vertical dourada */}
      <div
        style={{
          width: 2,
          height: 130,
          background: `linear-gradient(180deg, transparent, ${C.gold}, transparent)`,
          flexShrink: 0,
        }}
      />

      {/* Conteúdo */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 54,
            fontWeight: 700,
            color: C.white,
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'Inter, Helvetica Neue, sans-serif',
            fontSize: 32,
            fontWeight: 300,
            color: C.whiteDim,
            lineHeight: 1.45,
          }}
        >
          {sub}
        </div>
      </div>

      {/* Separador horizontal (exceto último) */}
      {!isLast && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 70,
            right: 60,
            height: 1,
            background: `linear-gradient(90deg, rgba(217,119,6,0.35), rgba(217,119,6,0.08), transparent)`,
          }}
        />
      )}
    </div>
  );
};

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [332, 360], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const labelOp = interpolate(frame, [6, 26], [0, 1], { extrapolateRight: 'clamp' });

  const textOp = interpolate(frame, [295, 330], [0, 1], { extrapolateRight: 'clamp' });
  const textY = interpolate(frame, [295, 330], [24, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const features = [
    { number: '01', title: 'Pedidos em tempo real', sub: 'Cada venda aparece no painel instantaneamente', delay: 30 },
    { number: '02', title: 'Atualização de status', sub: 'Seu cliente sempre informado em cada etapa', delay: 80 },
    { number: '03', title: 'Rastreio com e-mail auto', sub: 'Código enviado automaticamente, sem trabalho manual', delay: 130 },
    { number: '04', title: 'Controle de estoque', sub: 'Produtos e quantidades na palma da mão', delay: 180 },
  ];

  return (
    <AbsoluteFill style={{ background: C.black, opacity: fadeIn * fadeOut }}>
      <GrainOverlay />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 900px 700px at 50% 50%, rgba(217,119,6,0.035) 0%, transparent 65%)',
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
        Gestão Completa
      </div>

      {/* 4 Features — top=300, cada um 340px */}
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0 }}>
        {features.map((f, i) => (
          <Feature
            key={f.title}
            number={f.number}
            title={f.title}
            sub={f.sub}
            delay={f.delay}
            isLast={i === features.length - 1}
          />
        ))}
      </div>

      {/* Texto bottom — top≈1660 */}
      <div
        style={{
          position: 'absolute',
          top: 1660,
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
            fontSize: 48,
            fontWeight: 700,
            color: C.gold,
            lineHeight: 1.3,
          }}
        >
          De onde estiver, pelo celular.
        </div>
      </div>
    </AbsoluteFill>
  );
};
