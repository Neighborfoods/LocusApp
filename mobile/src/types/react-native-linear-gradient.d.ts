declare module 'react-native-linear-gradient' {
  import { ViewProps } from 'react-native';
  import React from 'react';

  interface LinearGradientProps extends ViewProps {
    colors: ReadonlyArray<string | number> | (string | number)[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
  }

  const LinearGradient: React.FC<LinearGradientProps>;
  export default LinearGradient;
}
