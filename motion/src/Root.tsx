import React from 'react';
import { Composition } from 'remotion';
import { OticasReluxVideo } from './OticasReluxVideo';
import { FPS, WIDTH, HEIGHT } from './constants';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="OticasRelux"
        component={OticasReluxVideo}
        durationInFrames={35 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="OticasReluxSquare"
        component={OticasReluxVideo}
        durationInFrames={35 * FPS}
        fps={FPS}
        width={1080}
        height={1080}
      />
    </>
  );
};
