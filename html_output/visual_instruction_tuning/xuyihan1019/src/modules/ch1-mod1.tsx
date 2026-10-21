import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawGuide,
  drawLegend,
  drawMeter,
  drawTrail,
  drawWalker,
  useCanvas,
} from '../lib/trailKit';

const W = 1080;
const H = 280;

type Step = 0 | 1 | 2;

// 三种做法：每任务单独训练 / 只给标签 / 自由指令。
// offset 是示意用的路径偏离量，rules 是需要人工写死的规则条数。
const STEP_INFO: Array<{ offset: number; rules: number; text: string; cls: string }> = [
  {
    offset: 0.9,
    rules: 12,
    text: '每个任务单独训练：接口写死，换个问法就不会。',
    cls: 'bad',
  },
  {
    offset: 0.45,
    rules: 6,
    text: '只给类别标签：能分类，但不能用一句话问它。',
    cls: '',
  },
  {
    offset: 0.05,
    rules: 1,
    text: '用自由指令提问：这才是本文要的方向——但要先有指令数据。',
    cls: 'good',
  },
];

const IDEAL_Y = 202;
const START_X = 104;
const END_X = 620;

const walkColor = (step: Step): string =>
  step === 0 ? COLORS.bad : step === 1 ? COLORS.route : COLORS.good;

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ step: 0 as Step });
  const [ui, setUi] = useState({ step: 0 as Step });

  const { ref } = useCanvas<typeof stateRef.current>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);
      const info = STEP_INFO[s.step];
      const dev = info.offset * 34;
      const color = walkColor(s.step);

      // 左区 paths：向导说的路线（蓝色引导）与同伴实际走出的路线
      drawTrail(
        ctx,
        [
          [START_X, IDEAL_Y],
          [360, IDEAL_Y - 3],
          [END_X, IDEAL_Y - 8],
        ],
        { active: true }
      );

      const walkPts: Array<[number, number]> = [];
      for (let i = 0; i <= 14; i += 1) {
        const t = i / 14;
        walkPts.push([START_X + (END_X - START_X) * t, IDEAL_Y - 8 * t + dev * t * t]);
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(walkPts[0][0], walkPts[0][1]);
      for (let i = 1; i < walkPts.length; i += 1) ctx.lineTo(walkPts[i][0], walkPts[i][1]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(s.step === 2 ? [] : [7, 5]);
      ctx.stroke();
      ctx.restore();

      // 脚印：偏离越大，末尾越散
      walkPts.forEach(([x, y], i) => {
        if (i % 2 !== 0) return;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      // 终点偏差括线（距离就是 offset）
      const endY = IDEAL_Y - 8 + dev;
      if (dev > 2) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(636, IDEAL_Y - 8);
        ctx.lineTo(636, endY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(630, IDEAL_Y - 8);
        ctx.lineTo(642, IDEAL_Y - 8);
        ctx.moveTo(630, endY);
        ctx.lineTo(642, endY);
        ctx.stroke();
        ctx.restore();
      }

      drawGuide(ctx, 80, 180, { eye: true });
      drawWalker(ctx, 600, 172 + dev, { blocked: s.step === 0 });

      // 右区 marks：偏差刻痕与所需人工规则数
      drawMeter(ctx, 700, 74, 300, 16, info.rules / 12, { label: '规则数', direction: 'down' });
      drawMeter(ctx, 700, 146, 300, 16, 1 - info.offset, { label: '对齐度' });

      // 三格偏差刻痕：橙色数量 = step
      for (let i = 0; i < 3; i += 1) {
        const x = 700 + i * 32;
        ctx.beginPath();
        ctx.rect(x, 196, 6, 20);
        ctx.globalAlpha = i < s.step ? 1 : 0.22;
        ctx.fillStyle = i < s.step ? COLORS.fader : COLORS.axis;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = i < s.step ? COLORS.fader : COLORS.axis;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      drawLegend(ctx, 40, 264, [
        { color: COLORS.route, text: '说的路线' },
        { color, text: '走的路线' },
        { color: COLORS.fader, text: '偏差刻痕' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const go = (step: Step) => {
    stateRef.current.step = step;
    setUi({ step });
  };

  const info = STEP_INFO[ui.step];

  return (
    <div data-chapter={chapterId} data-module={moduleId}>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button
            type="button"
            className="chip"
            onClick={() => go(ui.step === 0 ? 1 : 2)}
            disabled={ui.step === 2}
          >
            下一步
          </button>
          <button type="button" className="chip" onClick={() => go(0)}>
            重置
          </button>
        </div>
        <span className="val">第 {ui.step + 1}/3 步</span>
        <span className="val">人工规则 {info.rules} 条</span>
      </div>
      <div className={`feedback ${info.cls}`}>{info.text}</div>
    </div>
  );
};

export default Ch1Mod1;
