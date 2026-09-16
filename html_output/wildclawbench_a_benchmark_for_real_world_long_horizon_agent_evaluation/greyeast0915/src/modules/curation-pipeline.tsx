import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { ScoreGapLab } from './score-gap-lab';

const W = 1080;
const H = 350;
const C = {
  bg: '#f5f8f0', rock: '#e3eadc', ink: '#21324a', muted: '#68778f', line: '#d7deea',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', route: '#92400e',
};

const STAGES = [
  {
    title: '阶段一：编写候选任务',
    tab: '1 编写',
    summary: '从真实工作出发，写出需要长链规划与多工具协作的候选任务。',
    facts: ['明确可交付目标', '准备初始工作区', '覆盖长时程与多工具'],
  },
  {
    title: '阶段二：构建参考答案与评分点',
    tab: '2 参考构建',
    summary: '多位专家共同走通任务、讨论合理完成路径，并对齐参考产物、环境状态与评分标准。',
    facts: ['专家讨论完成路径', '对齐参考产物与状态', '共同确定评分标准'],
  },
  {
    title: '阶段三：模型试跑与人工审计',
    tab: '3 双重筛选',
    summary: '先用模型分差筛选区分度，再由专家检查歧义、泄漏、脆弱评分和不可复现问题。',
    facts: ['模型试跑', '0.2 区分度门槛', '专家复核'],
  },
  {
    title: '阶段四：精修并定稿',
    tab: '4 精修',
    summary: '研究人员回到电脑前，根据试跑日志和专家意见修改提示、输入素材与评分器，再进行回归测试。',
    facts: ['根据日志修改提示', '校正输入素材', '回归测试评分器'],
  },
] as const;

function card(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 16);
  ctx.fill();
  ctx.stroke();
}

function check(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x - 1, y + 7);
  ctx.lineTo(x + 10, y - 8);
  ctx.stroke();
}

function route(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, color: string, width = 4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
  ctx.stroke();
}

function person(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, facing = 1) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 48, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 28, y - 25, 56, 67, 18);
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.beginPath();
  ctx.moveTo(x - 19, y + 39);
  ctx.lineTo(x - 23, y + 65);
  ctx.moveTo(x + 19, y + 39);
  ctx.lineTo(x + 23, y + 65);
  ctx.moveTo(x + facing * 18, y - 12);
  ctx.lineTo(x + facing * 50, y + 5);
  ctx.stroke();
}

function paper(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-48, -34, 96, 68, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 4;
  [-14, 3, 20].forEach((lineY, index) => {
    ctx.beginPath();
    ctx.moveTo(-31, lineY);
    ctx.lineTo(29 - index * 7, lineY);
    ctx.stroke();
  });
  ctx.restore();
}

function drawStage(ctx: CanvasRenderingContext2D, stage: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.rock;
  ctx.beginPath();
  ctx.moveTo(0, 305);
  ctx.bezierCurveTo(230, 245, 390, 330, 610, 270);
  ctx.bezierCurveTo(790, 220, 900, 292, 1080, 235);
  ctx.lineTo(1080, 350);
  ctx.lineTo(0, 350);
  ctx.closePath();
  ctx.fill();

  if (stage === 0) {
    card(ctx, 86, 64, 290, 196, C.blue);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 5;
    [108, 142, 176, 210].forEach((y, index) => {
      ctx.beginPath();
      ctx.moveTo(128, y);
      ctx.lineTo(326 - index * 18, y);
      ctx.stroke();
    });
    route(ctx, [[454, 250], [548, 205], [620, 222], [708, 130], [804, 98], [948, 72]], C.route, 5);
    [[454, 250], [620, 222], [708, 130], [804, 98], [948, 72]].forEach(([x, y], index) => {
      ctx.fillStyle = index === 4 ? C.green : C.orange;
      ctx.beginPath();
      ctx.arc(x, y, index === 4 ? 13 : 9, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (stage === 1) {
    person(ctx, 190, 174, C.orange, 1);
    person(ctx, 360, 132, '#5f8fc4', 1);
    person(ctx, 540, 145, '#d8738f', 1);
    person(ctx, 720, 132, C.purple, -1);
    person(ctx, 890, 174, '#9aa9b8', -1);

    ctx.fillStyle = '#eee2d1';
    ctx.strokeStyle = C.route;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(540, 250, 410, 82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    paper(ctx, 458, 228, -0.08, C.blue);
    paper(ctx, 574, 229, 0.06, C.green);
    paper(ctx, 680, 239, 0.12, C.orange);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.arc(540, 188, 118, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    ctx.setLineDash([]);
    [[414, 174], [540, 164], [666, 174]].forEach(([x, y], index) => {
      ctx.fillStyle = [C.blue, C.orange, C.purple][index];
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    ctx.fillStyle = C.route;
    ctx.beginPath();
    ctx.roundRect(92, 250, 896, 34, 10);
    ctx.fill();
    person(ctx, 268, 172, C.blue, 1);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(462, 66, 390, 174, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#edf2f7';
    ctx.beginPath();
    ctx.roundRect(484, 88, 346, 128, 8);
    ctx.fill();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 5;
    [119, 153].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(514, y);
      ctx.lineTo(643, y);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(622, 105);
    ctx.lineTo(650, 133);
    ctx.moveTo(650, 105);
    ctx.lineTo(622, 133);
    ctx.stroke();
    ctx.strokeStyle = C.green;
    [119, 153, 187].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(691, y);
      ctx.lineTo(770, y);
      ctx.stroke();
    });
    check(ctx, 795, 187, C.green);
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.roundRect(610, 240, 94, 11, 5);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(432, 266, 228, 42, 8);
    ctx.fill();
    ctx.stroke();
    for (let index = 0; index < 8; index += 1) {
      ctx.fillStyle = index < 5 ? C.line : C.green;
      ctx.fillRect(450 + index * 24, 280, 16, 9);
    }
  }
}

export const CurationPipeline: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active === 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      drawStage(ctx, active);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, render, () => {});
    return () => disconnect();
  }, [active]);

  const current = STAGES[active];
  return (
    <div className="pipeline-shell">
      <div className="pipeline-heading">
        <span className="pipeline-counter">{active + 1} / 4</span>
        <div>
          <h4>{current.title}</h4>
          <p>{current.summary}</p>
        </div>
      </div>

      <div className="pipeline-stage-view" aria-live="polite">
        {active === 2 ? (
          <>
            <ScoreGapLab chapterId={chapterId} moduleId={`${moduleId}-screen`} />
            <div className="pipeline-formula">
              <b>区分度公式：</b>
              <span>Δᵢⱼ = |sᵢ − sⱼ|，保留条件：maxᵢ≠ⱼ Δᵢⱼ ≥ 0.2</span>
              <p><b>sᵢ、sⱼ</b> 是不同试跑模型的归一化得分；<b>Δᵢⱼ</b> 是一对模型的绝对分差；<b>maxᵢ≠ⱼ</b> 表示在所有不同模型对中取最大值。达到 0.2 只代表任务具有初步区分度，仍需专家复核。</p>
            </div>
          </>
        ) : (
          <>
            <canvas
              id={`cv-${chapterId}-${moduleId}-stage-${active + 1}`}
              ref={canvasRef}
              width={W}
              height={H}
              aria-label={`${current.title}的完整过程示意`}
            />
            <div className="pipeline-facts">
              {current.facts.map((fact) => <span key={fact}>{fact}</span>)}
            </div>
            <div className="feedback good">
              {active === 0 && '本阶段产出：目标明确、环境可准备、过程足够长的候选任务。'}
              {active === 1 && '本阶段产出：参考产物、状态证据与评分规则组成的验收基线。'}
              {active === 3 && '本阶段产出：提示、素材与评分器稳定一致的最终任务条目。'}
            </div>
          </>
        )}
      </div>

      <div className="pipeline-nav" role="group" aria-label="选择任务构建阶段">
        {STAGES.map((stage, index) => (
          <button
            key={stage.tab}
            type="button"
            className={`chip ${active === index ? 'active' : ''}`}
            aria-pressed={active === index}
            onClick={() => setActive(index)}
          >
            {stage.tab}
          </button>
        ))}
      </div>
      <div className="pipeline-total">整体投入：8 名研究者 × 2 周　·　最终产出：60 个经筛选与复核的任务</div>
    </div>
  );
};

export default CurationPipeline;
