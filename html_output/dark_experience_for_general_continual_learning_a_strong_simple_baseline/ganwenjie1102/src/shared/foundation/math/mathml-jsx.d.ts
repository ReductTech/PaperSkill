/**
 * Minimal JSX declarations for MathML Core elements.
 *
 * `@types/react` 18 declares the HTML and SVG intrinsics but not MathML, so JSX
 * cannot type `<math>`/`<msub>`/`<mfrac>` without this augmentation. Chromium and
 * recent WebKit/Firefox lay these elements out with a real math engine, which is
 * why the Kit typesets formulas with MathML instead of styling plain text.
 *
 * A paper project that writes MathML in JSX copies this file next to its other
 * `src` types (or lists it in `tsconfig.json` `include`) so the augmentation is
 * part of the program.
 */
import type { ReactNode } from "react";

type MathMLCoreAttributes = {
  display?: "block" | "inline" | "inline-block";
  className?: string;
  title?: string;
  xmlns?: string;
  children?: ReactNode;
  "aria-label"?: string;
  mathvariant?: string;
  displaystyle?: boolean | string;
  scriptlevel?: string | number;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      math: MathMLCoreAttributes;
      mrow: MathMLCoreAttributes;
      mi: MathMLCoreAttributes;
      mo: MathMLCoreAttributes;
      mn: MathMLCoreAttributes;
      mtext: MathMLCoreAttributes;
      mspace: MathMLCoreAttributes;
      msub: MathMLCoreAttributes;
      msup: MathMLCoreAttributes;
      msubsup: MathMLCoreAttributes;
      munder: MathMLCoreAttributes;
      mover: MathMLCoreAttributes;
      munderover: MathMLCoreAttributes;
      mfrac: MathMLCoreAttributes;
      msqrt: MathMLCoreAttributes;
      mroot: MathMLCoreAttributes;
      mtable: MathMLCoreAttributes;
      mtr: MathMLCoreAttributes;
      mtd: MathMLCoreAttributes;
    }
  }
}
