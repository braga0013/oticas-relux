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

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: 'clamp' });
  // Sem fade-out final (últimos 3s = hold/respiro)
  const fadeOut = interpolate(frame, [462, 480], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Linha 1 headline
  const h1Op = interpolate(frame, [20, 55], [0, 1], { extrapolateRight: 'clamp' });
  const h1Y = interpolate(frame, [20, 55], [40, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Linha 2 headline
  const h2Op = interpolate(frame, [52, 88], [0, 1], { extrapolateRight: 'clamp' });
  const h2Y = interpolate(frame, [52, 88], [40, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Linha dourada
  const lineW = interpolate(frame, [96, 142], [0, 880], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Texto detalhes
  const detailOp = interpolate(frame, [148, 192], [0, 1], { extrapolateRight: 'clamp' });
  const detailY = interpolate(frame, [148, 192], [26, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Botão CTA
  const btnSp = spring({ frame: Math.max(0, frame - 205), fps, config: { damping: 14, stiffness: 120 } });
  const btnScale = interpolate(btnSp, [0, 1], [0.65, 1]);
  const btnOp = interpolate(Math.max(0, frame - 205), [0, 14], [0, 1], { extrapolateRight: 'clamp' });

  // Pulse no botão
  const pulse = Math.max(0, frame - 250);
  const pulseFactor = pulse > 0 ? 1 + Math.sin((pulse / fps) * Math.PI * 2 * 0.9) * 0.025 : 1;
  const glowI = pulse > 0 ? 0.5 + Math.sin((pulse / fps) * Math.PI * 2 * 0.9) * 0.2 : 0.5;

  // Tagline
  const tagOp = interpolate(frame, [268, 305], [0, 1], { extrapolateRight: 'clamp' });

  // Footer
  const footerOp = interpolate(frame, [318, 360], [0, 1], { extrapolateRight: 'clamp' });

  // Respiro final: sutil pulsação de brilho
  const bgGlow = frame > 310
    ? 0.05 + Math.sin(((frame - 310) / fps) * Math.PI * 0.55) * 0.018
    : 0.05;

  return (
    <AbsoluteFill style={{ background: C.black, opacity: fadeIn * fadeOut }}>
      <GrainOverlay opacity={0.055} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 1060px 840px at 50% 44%, rgba(217,119,6,${bgGlow}) 0%, transparent 68%)`,
          pointerEvents: 'none',
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 75px',
          gap: 0,
        }}
      >
        {/* Headline linha 1 */}
        <div
          style={{
            opacity: h1Op,
            transform: `translateY(${h1Y}px)`,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 124,
            fontWeight: 900,
            color: C.white,
            textAlign: 'center',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
          }}
        >
          Quer uma loja
        </div>

        {/* Headline linha 2 — dourado itálico */}
        <div
          style={{
            opacity: h2Op,
            transform: `translateY(${h2Y}px)`,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 124,
            fontWeight: 900,
            fontStyle: 'italic',
            color: C.gold,
            textAlign: 'center',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            marginBottom: 0,
          }}
        >
          assim?
        </div>

        {/* Linha dourada animada */}
        <div
          style={{
            width: lineW,
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${C.gold} 15%, ${C.goldLight} 50%, ${C.gold} 85%, transparent 100%)`,
            margin: '52px auto',
            borderRadius: 2,
            boxShadow: `0 0 16px rgba(217,119,6,0.4)`,
          }}
        />

        {/* Detalhes */}
        <div
          style={{
            opacity: detailOp,
            transform: `translateY(${detailY}px)`,
            textAlign: 'center',
            marginBottom: 62,
            maxWidth: 900,
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, Helvetica Neue, sans-serif',
              fontSize: 36,
              fontWeight: 300,
              color: C.whiteDim,
              lineHeight: 1.58,
            }}
          >
            Desenvolvido do zero — design, sistema
            <br />
            de pedidos, pagamentos e painel
            <br />
            de gestão completo.
          </div>
        </div>

        {/* Botão CTA com pulse */}
        <div
          style={{
            opacity: btnOp,
            transform: `scale(${btnScale * pulseFactor})`,
          }}
        >
          <div
            style={{
              background: C.gold,
              borderRadius: 100,
              padding: '34px 76px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              boxShadow: [
                `0 0 70px rgba(217,119,6,${glowI})`,
                `0 24px 56px rgba(217,119,6,0.28)`,
                `inset 0 1px 0 rgba(255,255,255,0.22)`,
              ].join(', '),
            }}
          >
            <span style={{ fontSize: 44 }}>💬</span>
            <span
              style={{
                fontFamily: 'Inter, Helvetica Neue, sans-serif',
                fontSize: 42,
                fontWeight: 700,
                color: '#000',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              Me chame no WhatsApp
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: tagOp,
            marginTop: 38,
            fontFamily: 'Inter, Helvetica Neue, sans-serif',
            fontSize: 30,
            fontWeight: 300,
            color: C.whiteFaint,
            textAlign: 'center',
          }}
        >
          Vamos conversar sobre o seu projeto.
        </div>

        {/* Footer */}
        <div
          style={{
            opacity: footerOp,
            position: 'absolute',
            bottom: 140,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 420,
              height: 1,
              background: 'rgba(255,255,255,0.1)',
              margin: '0 auto 30px',
            }}
          />
          <div
            style={{
              fontFamily: 'Inter, Helvetica Neue, sans-serif',
              fontSize: 26,
              color: 'rgba(250,250,248,0.4)',
              letterSpacing: '0.03em',
            }}
          >
            Exemplo ao vivo:{' '}
            <span style={{ color: C.gold }}>oticasrelux.com.br</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
