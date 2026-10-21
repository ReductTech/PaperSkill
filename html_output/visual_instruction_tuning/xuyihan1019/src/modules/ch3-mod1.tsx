import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawGuide,
  drawLegend,
  drawMeter,
  drawPage,
  drawTrail,
  drawWalker,
  useCanvas,
} from '../lib/trailKit';

const W = 1080;
const H = 280;

type Mode = 'linear' | 'xattn' | 'qformer';

const MODE_LABEL: Record<Mode, string> = {
  linear: '线性投影',
  xattn: '门控交叉注意力',
  qformer: 'Q-Former',
};

const MODE_FEEDBACK: Record<Mode, { text: string; cls: string }> = {
  linear: {
    text: '线性投影：参数最少，作者刻意选它以便快速迭代数据实验。',
    cls: 'good',
  },
  xattn: {
    text: '门控交叉注意力（Flamingo 路线）：更强，但更重。',
    cls: '',
  },
  qformer: {
    text: 'Q-Former（BLIP-2 路线）：中等成本，论文留作未来工作。',
    cls: '',
  },
};

const COST: Record<Mode, number> = { linear: 1, xattn: 6, qformer: 4 };

const alignOf = (dim: number): number => clamp(0.5 + (0.4 * Math.log2(dim / 64)) / 4, 0, 1);

const feedbackFor = (dim: number, mode: Mode): { text: string; cls: string } => {
  if (dim < 200) {
    return {
      text: `投影太窄：只有 ${dim} 维，视觉 token 装不下景物细节，对齐度掉到 ${alignOf(
        dim
      ).toFixed(2)}。`,
      cls: 'bad',
    };
  }
  return MODE_FEEDBACK[mode];
};

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ dim: 768, mode: 'linear' as Mode });
  const [ui, setUi] = useState({ dim: 768, mode: 'linear' as Mode });

  const update = (next: { dim: number; mode: Mode }) => {
    stateRef.current.dim = next.dim;
    stateRef.current.mode = next.mode;
    setUi(next);
  };

  const { ref } = useCanvas<typeof stateRef.current>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);
      const align = alignOf(s.dim);
      const cost = COST[s.mode];
      const bandLen = Math.max(16, (s.dim / 1024) * 200);

      // 眼睛 → 翻译本
      drawTrail(ctx, [[96, 172], [166, 164]], { active: true, dashed: true });

      // 桥上中间块：三种连接方式形状不同
      ctx.save();
      ctx.translate(232, 160);
      if (s.mode === 'linear') {
        drawPage(ctx, -58, -18, 116, 36, { lines: 1, rows: 1, highlight: 0 });
        ctx.strokeStyle = COLORS.fader;
        ctx.lineWidth = 2;
        ctx.strokeRect(-62, -22, 124, 44);
      } else if (s.mode === 'xattn') {
        [-0.24, 0.24].forEach((ang) => {
          ctx.save();
          ctx.rotate(ang);
          ctx.strokeStyle = COLORS.fader;
          ctx.lineWidth = 2;
          ctx.strokeRect(-50, -16, 100, 32);
          ctx.restore();
        });
        ctx.beginPath();
        ctx.arc(0, -28, 4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.aux;
        ctx.fill();
      } else {
        for (let i = 0; i < 4; i += 1) {
          const bx = -52 + i * 27;
          ctx.beginPath();
          ctx.rect(bx, -10, 18, 20);
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = COLORS.aux;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = COLORS.fader;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      ctx.restore();

      // 词带：长度 = dim / 1024
      for (let x = 310; x + 12 <= 310 + bandLen; x += 18) {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = COLORS.good;
        ctx.fillRect(x, 152, 12, 16);
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(310, 176);
      ctx.lineTo(510, 176);
      ctx.stroke();

      // 词带 → 同伴
      drawTrail(ctx, [[310 + bandLen + 4, 160], [524, 160]], { active: true, dashed: true });

      drawGuide(ctx, 70, 172, { eye: true });
      drawWalker(ctx, 540, 172, {});

      // 右区 bars：对齐度与相对成本
      drawMeter(ctx, 620, 70, 360, 18, align, { label: '对齐度' });
      drawMeter(ctx, 620, 146, 360, 18, cost / 6, { label: '相对成本', direction: 'down' });
      if (s.dim < 200) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = COLORS.bad;
        ctx.fillRect(621.5, 71.5, 357 * align, 15);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = COLORS.bad;
        ctx.lineWidth = 2;
        ctx.strokeRect(616, 66, 368, 26);
      }

      drawLegend(ctx, 40, 264, [
        { color: COLORS.good, text: '视觉 token' },
        { color: COLORS.fader, text: '翻译本' },
        { color: COLORS.aux, text: '辅助结构' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const fb = feedbackFor(ui.dim, ui.mode);

  return (
    <div data-chapter={chapterId} data-module={moduleId}>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          投影宽度 <span className="val">{ui.dim}</span>
        </label>
        <input
          type="range"
          min={64}
          max={1024}
          step={64}
          value={ui.dim}
          aria-label="投影宽度"
          onChange={(e) => update({ dim: Number(e.target.value), mode: ui.mode })}
        />
        <div className="chip-row">
          {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`chip${ui.mode === m ? ' selected' : ''}`}
              onClick={() => update({ dim: ui.dim, mode: m })}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch3Mod1;
