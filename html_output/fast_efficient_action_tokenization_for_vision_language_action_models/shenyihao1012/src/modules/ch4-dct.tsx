import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWaveform,
  drawFreqBars,
  drawLegend,
  drawValueChip,
} from './packKit';
import type { WidgetProps } from './registry';

// Ch4 module (E04): waveform ↔ frequency-domain linkage. Switch the kept band
// {仅低频|低+中|全频} to see the reconstruction close in on the original; drag
// γ (1..20, default 10) to quantize bar heights to steps of 10/γ — small
// coefficients collapse to zero (sparse), yet the paper found both
// hyperparameters insensitive.
const W = 1080;
const H = 280;

type Band = 'low' | 'mid' | 'all';
const KEEP: Record<Band, number> = { low: 2, mid: 5, all: 10 };

const BANDS: { id: Band; label: string }[] = [
  { id: 'low', label: '仅低频' },
  { id: 'mid', label: '低+中' },
  { id: 'all', label: '全频' },
];

// 10-coefficient cosine-sum signal; low frequencies carry the bulk (left bars)
const N = 10;
const SIGNS = [1, 1, -1, 1, -1, 1, -1, 1, -1, 1];
const MAGS = [0.86, 0.52, 0.41, 0.24, 0.17, 0.11, 0.08, 0.05, 0.035, 0.02];
const A = SIGNS.map((sgn, i) => sgn * MAGS[i]);

function basisSum(u: number, coefs: number[]): number {
  const t = u * N;
  let v = 0;
  for (let i = 0; i < coefs.length; i++) v += coefs[i] * Math.cos((Math.PI * i * (t + 0.5)) / N);
  return v;
}

// normalize so the full wave fills the panel nicely
let rawMax = 0;
for (let k = 0; k < 120; k++) rawMax = Math.max(rawMax, Math.abs(basisSum(k / 119, A)));
const SCALE = 0.92 / rawMax;
const FULL: number[] = [];
for (let k = 0; k < 120; k++) FULL.push(basisSum(k / 119, A) * SCALE);

// scale-and-round quantization: bar magnitudes live on a 0..10 scale,
// γ sets the step width 10/γ
function quantMag(m: number, gamma: number): number {
  const step = 10 / gamma;
  return (Math.round((m * 10) / step) * step) / 10;
}

interface DctState {
  band: Band;
  gamma: number;
}

function fbFor(band: Band, g: number): { text: string; cls: string } {
  if (g < 4) return { text: 'γ 太小：档距太宽，小系数整条归零——重建走样。', cls: 'bad' };
  if (g > 16)
    return {
      text: '档位更细、误差微降，但 token 变多——收益递减；论文实测两端均不敏感。',
      cls: '',
    };
  if (band === 'low')
    return { text: '只留低频：主旨已对，细节缺失——恰是压缩的来源。', cls: '' };
  if (band === 'mid')
    return { text: '低+中频：主要起伏都跟上了——信息更密，token 仍少。', cls: '' };
  return g === 10
    ? { text: '全频重建近乎重合——γ=10 下精度与压缩兼得。', cls: 'good' }
    : {
        text: '全频重建近乎重合——γ 从默认微调，误差变化很小：两超参不敏感。',
        cls: 'good',
      };
}

export const Ch4Dct: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<DctState>({ band: 'low', gamma: 10 });
  const [band, setBand] = useState<Band>('low');
  const [gamma, setGamma] = useState(10);
  const [feedback, setFeedback] = useState(fbFor('low', 10));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (s: DctState) => {
      const keep = KEEP[s.band];
      const g = s.gamma;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // quantized coefficients: kept bands quantized by γ, dropped = 0
      const reconCoefs = A.map((a, i) => (i < keep ? Math.sign(a) * quantMag(Math.abs(a), g) : 0));
      const recon: number[] = [];
      for (let k = 0; k < 120; k++) recon.push(basisSum(k / 119, reconCoefs) * SCALE);

      // top: original waveform (black) + reconstruction overlay (green)
      drawWaveform(ctx, 40, 12, 1000, 134, FULL, C.text);
      drawWaveform(ctx, 40, 12, 1000, 134, recon, C.green);

      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(24, 154);
      ctx.lineTo(1056, 154);
      ctx.stroke();

      // bottom: frequency bars — kept colored, dropped grey
      const qmags = MAGS.map((m) => quantMag(m, g));
      drawFreqBars(ctx, 40, 164, 1000, 78, qmags, C.purple, { keep });

      // quantization step chip (bare number)
      drawValueChip(ctx, 1012, 264, (10 / g).toFixed(1), C.orange);
      drawLegend(
        ctx,
        [
          ['原波形', C.text],
          ['重建', C.green],
          ['保留系数', C.purple],
        ],
        40,
        264
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(() => render(stateRef.current));
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(() => render(stateRef.current));
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pickBand = (b: Band) => {
    stateRef.current.band = b;
    setBand(b);
    setFeedback(fbFor(b, stateRef.current.gamma));
  };

  const onGamma = (e: React.ChangeEvent<HTMLInputElement>) => {
    const g = Math.round(Number(e.target.value));
    stateRef.current.gamma = g;
    setGamma(g);
    setFeedback(fbFor(stateRef.current.band, g));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {BANDS.map((b) => (
            <button
              key={b.id}
              type="button"
              className={band === b.id ? 'chip selected' : 'chip'}
              onClick={() => pickBand(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
        <label>
          量化 γ <span className="val">{gamma}</span>
        </label>
        <input type="range" min={1} max={20} step={1} value={gamma} onChange={onGamma} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Dct;
