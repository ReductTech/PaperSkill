import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawTag, drawSceneLabel, DC, useDcCanvas } from './dc-kit';

const W = 1080;
const H = 280;
const N = 8;

function huffLengths(probs: number[]): number[] {
  const lens = new Array(probs.length).fill(0);
  let nodes = probs.map((p, i) => ({ w: p, syms: [i] }));
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.w - b.w);
    const a = nodes.shift()!;
    const b = nodes.shift()!;
    a.syms.concat(b.syms).forEach((s) => {
      lens[s] += 1;
    });
    nodes.push({ w: a.w + b.w, syms: a.syms.concat(b.syms) });
  }
  return lens;
}

function makeProbs(skew: number): number[] {
  const raw = Array.from({ length: N }, (_, i) => 1 - skew + skew * Math.exp(-i * 0.7));
  const s = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / s);
}

export const M9Huffman: React.FC<WidgetProps> = () => {
  const [skew, setSkew] = useState(0);
  const probs = makeProbs(skew);
  const lens = huffLengths(probs);
  const avg = probs.reduce((a, p, i) => a + p * lens[i], 0);

  const ref = useDcCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const order = probs.map((_, i) => i).sort((a, b) => probs[b] - probs[a]);
    order.forEach((sym, rank) => {
      const y = 46 + rank * 26;
      drawBar(ctx, 50, y, 380, 16, probs[sym] / probs[order[0]], DC.blue);
      drawTag(ctx, 450, y - 4, `码长 ${lens[sym]}`, lens[sym] <= 3 ? DC.green : DC.purple);
    });
    drawSceneLabel(ctx, 600, 70, `平均码长 ${avg.toFixed(2)}`, DC.ink, 16);
    drawSceneLabel(ctx, 600, 104, '越偏斜越省', DC.muted, 13);
  }, W, H);

  const cls = skew >= 0.3 ? 'good' : '';
  const text =
    skew < 0.3
      ? '分布较均匀，变长码省不了多少。'
      : skew <= 0.8
      ? '分布偏斜，高频符号拿到短码，平均码长明显下降。'
      : '偏斜越强越省；论文实测再省约 20%–30%（AlexNet 为 22%）。';

  return (
    <div>
      <canvas id="cv-m9-huffman" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          分布偏斜 <span className="val">{(skew * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(skew * 100)}
          onChange={(e) => setSkew(Number(e.target.value) / 100)}
        />
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M9Huffman;
