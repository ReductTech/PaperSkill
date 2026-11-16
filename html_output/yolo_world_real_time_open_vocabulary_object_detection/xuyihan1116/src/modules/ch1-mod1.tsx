import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawDesks,
  drawKid,
  drawLabel,
  drawLegend,
  drawMeter,
  drawRoster,
  drawTick,
  useCanvas,
} from '../lib/classKit';

// §1 module: two ways of keeping the roster. step 0 = the fixed old roster (3 hit / 3 missed),
// step 1 = the open roster every name can be written into (6 hit / 0 missed).

const W = 1080;
const H = 280;

const HIT = [3, 6];
const MISS = [3, 0];

const FB_INIT = '翻旧册子：只能点册子上写过的名字。';
const FB_STEP = [
  { text: '翻旧册子：只能点册子上写过的名字，没写的孩子一直漏着。', cls: 'bad' },
  { text: '换一本能随时加名字的册子：想点谁就写谁，全班都能叫到。', cls: 'good' },
];

const NAMES_OLD = ['小红', '小刚', '小美'];
const NAMES_NEW = ['小红', '小刚', '小美', '小明', '小豆', '阿强'];
const WRITTEN = [0, 1, 3];

const DESK = { x: 300, y: 44, w: 248, h: 172, rows: 2, cols: 3 };
const CW = DESK.w / DESK.cols;
const CH = DESK.h / DESK.rows;

function kidAt(r: number, c: number): [number, number] {
  return [DESK.x + c * CW + CW / 2, DESK.y + r * CH + CH * 0.62];
}

export const Ch1Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: FB_INIT, cls: '' });

  const { ref } = useCanvas<{ step: number }>((ctx, _time, s) => {
    const hit = HIT[s.step];
    const miss = MISS[s.step];
    clearScene(ctx, W, H);

    // left: the roster itself — three written rows, or six
    drawLabel(ctx, s.step === 0 ? '旧册子' : '新册子', 56, 56, { color: COLORS.chalk, size: 15, bold: true });
    drawRoster(ctx, 56, 64, 186, 150, {
      lines: 6,
      labels: s.step === 0 ? NAMES_OLD : NAMES_NEW,
    });

    // middle: the same six children, ticked only where the book has a name
    drawDesks(ctx, DESK.x, DESK.y, DESK.w, DESK.h, { rows: DESK.rows, cols: DESK.cols });
    for (let r = 0; r < DESK.rows; r += 1) {
      for (let c = 0; c < DESK.cols; c += 1) {
        const idx = r * DESK.cols + c;
        const written = s.step === 1 || WRITTEN.indexOf(idx) >= 0;
        const [kx, ky] = kidAt(r, c);
        drawKid(ctx, kx, ky, 1.6, { kind: 'sit', dim: !written });
        if (written) drawTick(ctx, kx + 19, ky - 23, { ok: true });
      }
    }

    // right: how many were called, how many were missed
    drawMeter(ctx, 620, 92, 380, 26, hit / 6, { direction: 'up', color: COLORS.fast, label: `叫对 ${hit} / 6` });
    drawMeter(ctx, 620, 172, 380, 26, miss / 6, { direction: 'up', color: miss > 0 ? COLORS.bad : COLORS.fast, label: `漏掉 ${miss} / 6` });

    drawLegend(
      ctx,
      56,
      250,
      s.step === 0
        ? [
            { color: COLORS.fast, text: '叫到' },
            { color: COLORS.chalkDim, text: '一直漏着' },
          ]
        : [
            { color: COLORS.fast, text: '叫到' },
            { color: COLORS.book, text: '随时加名' },
          ]
    );
  }, W, H, stateRef);

  const sync = (s: number) => {
    stateRef.current.step = s;
    setStep(s);
    setFb(FB_STEP[s]);
  };
  const move = (delta: number) => {
    sync(Math.max(0, Math.min(HIT.length - 1, stateRef.current.step + delta)));
  };
  const reset = () => {
    stateRef.current.step = 0;
    setStep(0);
    setFb({ text: FB_INIT, cls: '' });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="chip" onClick={() => move(-1)}>
          上一步
        </button>
        <button type="button" className="chip" onClick={() => move(1)}>
          下一步
        </button>
        <button type="button" className="chip" onClick={reset}>
          重置
        </button>
        <span className="val">
          叫对 {HIT[step]} · 漏掉 {MISS[step]}
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch1Mod1;
