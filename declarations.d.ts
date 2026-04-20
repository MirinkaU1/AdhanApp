// declarations.d.ts
// Déclarations de types pour les modules non-TypeScript

declare module '*.bin' {
  const value: any;
  export default value;
}

// Fichiers SVG importés comme composants React (via react-native-svg-transformer)
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
