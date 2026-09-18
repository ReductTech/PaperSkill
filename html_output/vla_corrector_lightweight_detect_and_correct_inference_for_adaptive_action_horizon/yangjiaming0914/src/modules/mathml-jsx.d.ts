import type React from 'react';

type MathMLProps = React.HTMLAttributes<MathMLElement> & {
  display?: 'block' | 'inline';
  accent?: 'true' | 'false';
  accentunder?: 'true' | 'false';
  stretchy?: 'true' | 'false';
  columnalign?: string;
  rowspacing?: string;
  mathvariant?: string;
  width?: string;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      math: MathMLProps;
      mrow: MathMLProps;
      mi: MathMLProps;
      mo: MathMLProps;
      mn: MathMLProps;
      mtext: MathMLProps;
      msub: MathMLProps;
      msup: MathMLProps;
      msubsup: MathMLProps;
      mover: MathMLProps;
      munder: MathMLProps;
      mfrac: MathMLProps;
      mtable: MathMLProps;
      mtr: MathMLProps;
      mtd: MathMLProps;
      mspace: MathMLProps;
    }
  }
}

export {};
