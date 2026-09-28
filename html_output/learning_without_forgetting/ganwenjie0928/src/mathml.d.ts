import type React from 'react';

type MathNodeProps = {
  children?: React.ReactNode;
  className?: string;
  display?: 'inline' | 'block';
  xmlns?: string;
  width?: string;
  mathvariant?: string;
  'aria-label'?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      math: MathNodeProps;
      mrow: MathNodeProps;
      mi: MathNodeProps;
      mo: MathNodeProps;
      mn: MathNodeProps;
      mspace: MathNodeProps;
      msub: MathNodeProps;
      msup: MathNodeProps;
      msubsup: MathNodeProps;
      munder: MathNodeProps;
      mfrac: MathNodeProps;
    }
  }
}
