type MathFieldElement = HTMLElement & {
  value: string;
  readOnly: boolean;
  virtualKeyboardMode: string;
};

declare namespace JSX {
  interface IntrinsicElements {
    'math-field': import('react').DetailedHTMLProps<
      import('react').HTMLAttributes<MathFieldElement>,
      MathFieldElement
    > & {
      'read-only'?: string;
      'virtual-keyboard-mode'?: string;
      'data-latex'?: string;
    };
  }
}

declare module '*.mjs';
