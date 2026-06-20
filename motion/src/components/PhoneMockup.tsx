import React from 'react';
import { C } from '../constants';

interface PhoneMockupProps {
  children: React.ReactNode;
  width?: number;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ children, width = 420 }) => {
  const height = Math.round(width * 2.1);
  const radius = Math.round(width * 0.11);

  return (
    <div
      style={{
        width,
        height,
        background: '#161616',
        borderRadius: radius,
        border: '2.5px solid #2e2e2e',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: [
          `0 0 0 1px #0a0a0a`,
          `0 0 100px rgba(217,119,6,0.18)`,
          `0 60px 120px rgba(0,0,0,0.75)`,
          `inset 0 1px 0 rgba(255,255,255,0.07)`,
        ].join(', '),
        flexShrink: 0,
      }}
    >
      {/* Dynamic island */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 110,
          height: 34,
          background: '#000',
          borderRadius: 20,
          zIndex: 20,
        }}
      />
      {/* Screen content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#0f0f0f',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// --- Sub-components for phone screen contents ---

export const ProductGridScreen: React.FC<{ frame: number }> = ({ frame }) => {
  const products = [
    { name: 'Armação Dourada', price: 'R$ 499', grad: 'linear-gradient(135deg,#2a2010,#1a1410)' },
    { name: 'Solar Premium UV', price: 'R$ 699', grad: 'linear-gradient(135deg,#10182a,#0a1020)' },
    { name: 'Lentes Progressivas', price: 'R$ 380', grad: 'linear-gradient(135deg,#162010,#0e1a0a)' },
    { name: 'Titanium Slim', price: 'R$ 890', grad: 'linear-gradient(135deg,#1e1020,#160a18)' },
    { name: 'Clip-on Magnético', price: 'R$ 320', grad: 'linear-gradient(135deg,#201510,#18100a)' },
    { name: 'Sport Flex', price: 'R$ 450', grad: 'linear-gradient(135deg,#0a1820,#051018)' },
  ];

  return (
    <div style={{ paddingTop: 70, height: '100%', overflowY: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '0 18px 14px', borderBottom: '1px solid #1e1e1e' }}>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 20,
            color: C.white,
          }}
        >
          Catálogo
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'nowrap' }}>
          {['Todos', 'Armações', 'Solar', 'Lentes'].map((cat, i) => (
            <div
              key={cat}
              style={{
                background: i === 0 ? C.gold : '#1e1e1e',
                borderRadius: 100,
                padding: '5px 14px',
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                color: i === 0 ? '#000' : 'rgba(255,255,255,0.5)',
                fontWeight: i === 0 ? 700 : 400,
                flexShrink: 0,
              }}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          padding: '14px 14px',
        }}
      >
        {products.map((p, i) => (
          <div
            key={p.name}
            style={{
              background: '#181818',
              borderRadius: 12,
              overflow: 'hidden',
              opacity: frame > i * 12 + 40 ? 1 : 0,
              transform: `scale(${frame > i * 12 + 40 ? 1 : 0.92})`,
              transition: 'none',
            }}
          >
            <div
              style={{
                height: 90,
                background: p.grad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 20,
                  borderRadius: 4,
                  border: `1.5px solid rgba(217,119,6,0.4)`,
                  background: 'rgba(217,119,6,0.08)',
                }}
              />
            </div>
            <div style={{ padding: '8px 10px 10px' }}>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11,
                  color: C.white,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11,
                  color: C.gold,
                  fontWeight: 700,
                  marginTop: 3,
                }}
              >
                {p.price}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CheckoutScreen: React.FC = () => (
  <div style={{ paddingTop: 70, padding: '70px 18px 0', height: '100%' }}>
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: 18,
        color: C.white,
        marginBottom: 20,
      }}
    >
      Finalizar Pedido
    </div>
    {/* Order item */}
    <div
      style={{
        background: '#181818',
        borderRadius: 12,
        padding: '12px',
        display: 'flex',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          background: 'linear-gradient(135deg,#2a2010,#1a1410)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 32,
            height: 13,
            border: `1.5px solid rgba(217,119,6,0.5)`,
            borderRadius: 3,
          }}
        />
      </div>
      <div>
        <div
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: C.white, fontWeight: 500 }}
        >
          Armação Dourada Classic
        </div>
        <div
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: C.gold, marginTop: 4 }}
        >
          R$ 499,00
        </div>
      </div>
    </div>
    {/* Payment */}
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      Pagamento
    </div>
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {['PIX', 'Cartão'].map((m, i) => (
        <div
          key={m}
          style={{
            flex: 1,
            background: i === 0 ? 'rgba(217,119,6,0.15)' : '#181818',
            border: `1.5px solid ${i === 0 ? C.gold : '#2e2e2e'}`,
            borderRadius: 10,
            padding: '10px 0',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            color: i === 0 ? C.gold : 'rgba(255,255,255,0.5)',
            fontWeight: i === 0 ? 700 : 400,
          }}
        >
          {m}
        </div>
      ))}
    </div>
    {/* PIX discount */}
    <div
      style={{
        background: 'rgba(34,197,94,0.08)',
        border: '1px solid rgba(34,197,94,0.25)',
        borderRadius: 8,
        padding: '8px 12px',
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        color: C.green,
        marginBottom: 16,
      }}
    >
      ✓ 10% de desconto no PIX → R$ 449,10
    </div>
    {/* Total */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        Total
      </span>
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          color: C.white,
          fontWeight: 700,
        }}
      >
        R$ 449,10
      </span>
    </div>
    {/* Button */}
    <div
      style={{
        background: C.gold,
        borderRadius: 12,
        padding: '13px 0',
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
        fontWeight: 700,
        color: '#000',
      }}
    >
      Confirmar Pedido
    </div>
  </div>
);

export const AdminScreen: React.FC<{ frame: number }> = ({ frame }) => {
  const orders = [
    { id: '#2847', name: 'Ana Silva', status: 'Enviado', color: C.goldLight },
    { id: '#2846', name: 'Carlos Mendes', status: 'Em preparo', color: C.gold },
    { id: '#2845', name: 'Maria Souza', status: 'Entregue', color: C.green },
    { id: '#2844', name: 'João Costa', status: 'Confirmado', color: 'rgba(255,255,255,0.5)' },
  ];

  return (
    <div style={{ paddingTop: 70, height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '0 18px 14px' }}>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 18,
            color: C.white,
          }}
        >
          Painel Admin
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {[
            { label: 'Hoje', value: '12 pedidos' },
            { label: 'Receita', value: 'R$ 5.840' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                background: '#181818',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.4)',
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: C.gold,
                  fontWeight: 700,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '0 18px' }}>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Pedidos Recentes
        </div>
        {orders.map((o, i) => (
          <div
            key={o.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px solid #1e1e1e',
              opacity: frame > i * 18 + 30 ? 1 : 0,
              transform: `translateX(${frame > i * 18 + 30 ? 0 : 20}px)`,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  color: C.white,
                  fontWeight: 600,
                }}
              >
                {o.id} · {o.name}
              </div>
            </div>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: o.color,
                fontWeight: 600,
              }}
            >
              {o.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
