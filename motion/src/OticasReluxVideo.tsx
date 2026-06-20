import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { Scene1 } from './scenes/Scene1';
import { Scene2 } from './scenes/Scene2';
import { Scene3 } from './scenes/Scene3';
import { Scene4 } from './scenes/Scene4';
import { Scene5 } from './scenes/Scene5';
import { Scene6 } from './scenes/Scene6';
import { SCENES } from './constants';

export const OticasReluxVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#0a0a0a' }}>
      <Sequence from={SCENES.s1.start} durationInFrames={SCENES.s1.duration}>
        <Scene1 />
      </Sequence>
      <Sequence from={SCENES.s2.start} durationInFrames={SCENES.s2.duration}>
        <Scene2 />
      </Sequence>
      <Sequence from={SCENES.s3.start} durationInFrames={SCENES.s3.duration}>
        <Scene3 />
      </Sequence>
      <Sequence from={SCENES.s4.start} durationInFrames={SCENES.s4.duration}>
        <Scene4 />
      </Sequence>
      <Sequence from={SCENES.s5.start} durationInFrames={SCENES.s5.duration}>
        <Scene5 />
      </Sequence>
      <Sequence from={SCENES.s6.start} durationInFrames={SCENES.s6.duration}>
        <Scene6 />
      </Sequence>
    </AbsoluteFill>
  );
};
