import React from 'react';

/** Keeps short notation in the surrounding text style. Use MathFormula for complete equations. */
export function InlineNotation({ text }: { text: string }) {
  const notation: Array<[RegExp, string]> = [
    [/θ_s/g, "θₛ"], [/θ_o/g, "θₒ"], [/θ_n/g, "θₙ"],
    [/X_n/g, "Xₙ"], [/Y_o/g, "Yₒ"], [/Y_n/g, "Yₙ"],
    [/Ŷ_o/g, "Ŷₒ"], [/Ŷ_n/g, "Ŷₙ"], [/λ_o/g, "λₒ"],
  ];
  const rendered = notation.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
  return <>{rendered}</>;
}
