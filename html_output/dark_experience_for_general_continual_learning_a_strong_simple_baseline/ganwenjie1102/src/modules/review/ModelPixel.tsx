/** Hand-authored pixel interpretations for the synthetic three-class example. */
import { MODEL_CLASSES, type ModelClass } from "../../data/model-classes";
export { MODEL_CLASSES, type ModelClass } from "../../data/model-classes";

const GLYPHS = [
  [
    "0000000100000000", "0001000100010000", "0000100100100000", "0100010101000010",
    "0010001110000100", "0001111111111000", "0000111111100000", "1111111111111111",
    "0000111111100000", "0001111111111000", "0010001110000100", "0100010101000010",
    "0000100100100000", "0001000100010000", "0000000100000000", "0000000000000000",
  ],
  [
    "0000001111000000", "0000111001110000", "0001100000011000", "0011100111011100",
    "0110111100110110", "1100110001100011", "1001100111100001", "1011001100111101",
    "1011110011001101", "1000011110011001", "1100011000110011", "0110110011110110",
    "0011101110011100", "0001100000011000", "0000111001110000", "0000001111000000",
  ],
  [
    "0000000000000000", "0000000010100000", "0000000001000000", "0000000000000000",
    "0001111111100000", "0011111111110011", "0111111111110110", "1111111111111110",
    "1111111111111100", "1111111111111000", "0111111111110000", "0011111111100000",
    "0001111110000000", "0000011100000000", "0000000000000000", "0000000000000000",
  ],
] as const;

export default function ModelPixel({ model, x = 0, y = 0, size = 32 }: {
  model: ModelClass; x?: number; y?: number; size?: number;
}) {
  const cell = size / 16;
  return <g transform={`translate(${x} ${y})`} className={`lc-model-pixel lc-brand-${model}`} data-model-pixel={MODEL_CLASSES[model]} aria-label={`${MODEL_CLASSES[model]} 像素图`}>
    {GLYPHS[model].flatMap((row, r) => [...row].flatMap((on, c) => on === "1"
      ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell * 0.91} height={cell * 0.91} rx={cell * 0.08} /> : []))}
    {model === 2 && <rect x={4 * cell} y={6 * cell} width={cell} height={cell} fill="white" />}
  </g>;
}
