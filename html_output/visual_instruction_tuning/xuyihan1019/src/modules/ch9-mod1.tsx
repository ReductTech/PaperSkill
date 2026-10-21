import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLabel,
  drawLegend,
  drawTrail,
  useCanvas,
} from '../lib/trailKit';

// §9 module 9.1 — four data mixtures, four LLaVA-Bench (COCO) relative scores. The bars
// compare the mixtures; the note block shows how the selected mixture is composed.
const W = 1080;
const H = 280;

type MixKey = 'full' | 'conv' | 'small' | 'detail';

interface Mix {
  key: MixKey;
  label: string;
  score: number;
  comp: [number, number, number];
  note: string;
  cls: string;
}

const MIXES: Mix[] = [
  {
    key: 'full',
    label: '完整数据',
    score: 85.1,
    comp: [0.367, 0.146, 0.487],
    note: '完整数据 85.1：三类齐全最好。',
    cls: 'good',
  },
  {
    key: 'conv',
    label: '只有对话',
    score: 73.8,
    comp: [1, 0, 0],
    note: '只有对话 73.8：描述与推理能力明显不足。',
    cls: 'bad',
  },
  {
    key: 'small',
    label: '对话+少量描述与推理',
    score: 80.5,
    comp: [0.87, 0.043, 0.087],
    note: '对话 + 5% 描述 + 10% 推理 80.5：少量就能涨 6.7 分。',
    cls: 'good',
  },
  {
    key: 'detail',
    label: '只有描述与推理',
    score: 81.9,
    comp: [0, 0.23, 0.77],
    note: '详细描述 + 复杂推理 81.9：没有对话也还行，但不如齐全。',
    cls: '',
  },
];

const COMP_COLORS = [COLORS.route, COLORS.aux, COLORS.good];
const COMP_NAMES = ['对话', '描述', '推理'];

interface Ch9State {
  mix: MixKey;
}

function findMix(key: MixKey): Mix {
  const found = MIXES.filter((item) => item.key === key)[0];
  return found ?? MIXES[0];
}

function compText(mix: Mix): string {
  const parts: string[] = [];
  mix.comp.forEach((v, i) => {
    if (v <= 0.001) return;
    const digits = v >= 0.995 || v <= 0.005 ? 0 : 1;
    parts.push(`${COMP_NAMES[i]} ${(v * 100).toFixed(digits)}%`);
  });
  return parts.join(' · ');
}

export const Ch9Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Ch9State>({ mix: 'full' });
  const [mix, setMix] = useState<MixKey>('full');
  const [feedback, setFeedback] = useState({ text: MIXES[0].note, cls: MIXES[0].cls });

  const choose = (key: MixKey) => {
    const next = findMix(key);
    stateRef.current.mix = key;
    setMix(key);
    setFeedback({ text: next.note, cls: next.cls });
  };

  const { ref } = useCanvas<Ch9State>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);
      const current = findMix(s.mix);

      drawLabel(ctx, '相对分', 40, 34, { color: COLORS.muted, size: 15 });

      // axis: baseline plus a 100 guide line
      drawTrail(ctx, [[48, 226], [500, 226]]);
      drawTrail(ctx, [[48, 66], [500, 66]], { dashed: true });

      MIXES.forEach((item, i) => {
        const barW = 64;
        const bx = 83 + i * 110;
        const barH = (item.score / 100) * 160;
        const by = 226 - barH;
        const active = item.key === s.mix;
        ctx.fillStyle = active ? COLORS.fader : COLORS.muted;
        ctx.fillRect(bx, by, barW, barH);
        ctx.lineWidth = active ? 3 : 1.5;
        ctx.strokeStyle = active ? COLORS.fader : COLORS.axis;
        ctx.strokeRect(bx, by, barW, barH);
        if (active) {
          drawLabel(ctx, item.score.toFixed(1), bx, by - 10, {
            color: COLORS.fader,
            size: 15,
            bold: true,
          });
        }
      });

      drawTrail(ctx, [[540, 40], [540, 240]], { dashed: true });

      // note block: the selected mixture as one 100% stacked bar
      const nx = 580;
      const ny = 104;
      const nw = 420;
      const nh = 40;
      let cx = nx;
      current.comp.forEach((share, i) => {
        const segW = nw * share;
        if (segW > 0.5) {
          ctx.fillStyle = COMP_COLORS[i];
          ctx.fillRect(cx, ny, segW, nh);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = COLORS.axis;
          ctx.strokeRect(cx, ny, segW, nh);
        }
        cx += segW;
      });
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COLORS.ink;
      ctx.strokeRect(nx, ny, nw, nh);
      [0, 0.5, 1].forEach((t) => {
        ctx.beginPath();
        ctx.moveTo(nx + nw * t, ny + nh);
        ctx.lineTo(nx + nw * t, ny + nh + 6);
        ctx.strokeStyle = COLORS.axis;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      drawLegend(ctx, nx, 172, [
        { color: COLORS.route, text: '对话' },
        { color: COLORS.aux, text: '详细描述' },
        { color: COLORS.good, text: '复杂推理' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const current = findMix(mix);

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {MIXES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === mix ? 'chip selected' : 'chip'}
              onClick={() => choose(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label>
          相对分 <span className="val">{current.score.toFixed(1)}</span>
        </label>
        <label>
          配比 <span>{compText(current)}</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
