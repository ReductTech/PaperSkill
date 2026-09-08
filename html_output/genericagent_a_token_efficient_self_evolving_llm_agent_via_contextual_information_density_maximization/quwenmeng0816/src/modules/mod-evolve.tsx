import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawLabel, fillRR, startLoop, strokeRR } from './journalKit';

const W = 560;
const H = 390;
type View = 'rounds' | 'stages' | 'transfer';

const ROUNDS = [
  { n: 1, stage: '自然语言执行', tok: 222203, calls: 32, time: '7m30s', color: C.red },
  { n: 2, stage: 'SOP 蒸馏', tok: 66341, calls: 12, time: '4m19s', color: C.blue },
  { n: 3, stage: 'SOP 蒸馏', tok: 49825, calls: 8, time: '2m53s', color: C.blue },
  { n: 4, stage: 'SOP 蒸馏', tok: 51758, calls: 9, time: '2m29s', color: C.blue },
  { n: 5, stage: 'SOP 蒸馏', tok: 35536, calls: 7, time: '2m50s', color: C.blue },
  { n: 6, stage: '代码化执行', tok: 25762, calls: 6, time: '2m24s', color: C.green },
  { n: 7, stage: '代码化执行', tok: 23014, calls: 5, time: '1m41s', color: C.green },
  { n: 8, stage: '代码化执行', tok: 22689, calls: 5, time: '1m35s', color: C.green },
  { n: 9, stage: '代码化执行', tok: 23010, calls: 5, time: '1m38s', color: C.green },
];

const STAGES = [
  {
    id: 1,
    title: 'Stage 1 自然语言执行',
    body: '冷启动靠上下文推理、探索性工具使用和试错。第 1 轮：32 次调用、7m30s、222,203 token。',
    color: C.red,
  },
  {
    id: 2,
    title: 'Stage 2 SOP 蒸馏',
    body: '经验被压成结构化文本 SOP，去掉探索弯路。第 2–5 轮 token 从 66k 降到 36k，但仍有适配抖动。',
    color: C.blue,
  },
  {
    id: 3,
    title: 'Stage 3 代码化执行',
    body: '验证工作流结晶为可执行逻辑。第 6–9 轮进入约 23k±1k 的窄带，执行变得可预测。',
    color: C.green,
  },
];

export const ModEvolve: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ view: 'rounds' as View, round: 1 });
  const [view, setView] = useState<View>('rounds');
  const [round, setRound] = useState(1);
  const current = ROUNDS[round - 1];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx) => {
      const state = stateRef.current;
      const r = ROUNDS[state.round - 1];
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);

      if (state.view === 'rounds') {
        drawLabel(ctx, 'Table 8 · LangChain GitHub 调研 · Claude Opus 4.6', 22, 32, C.text, 14);
        ROUNDS.forEach((item, i) => {
          const x = 22 + i * 58;
          const h = 18 + (item.tok / 222203) * 168;
          const y = 248 - h;
          fillRR(ctx, x, y, 46, h, 4, item.n === r.n ? item.color : C.axis);
        });
        drawLabel(ctx, '轮次 1 → 9', 22, 268, C.muted, 11);
        fillRR(ctx, 22, 286, 516, 68, 8, '#fffef8');
        strokeRR(ctx, 22, 286, 516, 68, 8, r.color, 2.5);
        drawLabel(ctx, `第 ${r.n} 轮 · ${r.stage}`, 40, 312, r.color, 14);
        drawLabel(ctx, `${r.calls} 次调用  ·  ${r.time}  ·  ${r.tok.toLocaleString()} token`, 40, 338, C.text, 12);
      } else if (state.view === 'stages') {
        drawLabel(ctx, '三个表示阶段同时压缩调用次数、时间和 token', 22, 32, C.text, 14);
        STAGES.forEach((item, i) => {
          const y = 58 + i * 96;
          const on = (r.n === 1 && i === 0) || (r.n >= 2 && r.n <= 5 && i === 1) || (r.n >= 6 && i === 2);
          fillRR(ctx, 22, y, 516, 82, 9, '#fffef8');
          strokeRR(ctx, 22, y, 516, 82, 9, on ? item.color : C.axis, on ? 3 : 1.5);
          drawLabel(ctx, item.title, 42, y + 28, on ? item.color : C.text, 14);
          drawLabel(ctx, item.body, 42, y + 56, C.muted, 11);
        });
      } else {
        drawLabel(ctx, 'Figure 5 · 八任务跨任务重复执行（相对 OpenClaw）', 22, 32, C.text, 14);
        const facts = [
          { title: '单任务下降区间', value: '61.0% – 92.4%', note: '八个任务上后轮均低于首轮' },
          { title: '总体下降', value: '79.3%', note: '跨任务平均 token 节省' },
          { title: '最强增益类别', value: 'Category D 92.0%', note: '长程状态转移与恢复任务' },
          { title: '九轮轨迹', value: '89.6%', note: 'Table 8 特定 GitHub 调研，不是全体保证' },
        ];
        facts.forEach((item, i) => {
          const x = 22 + (i % 2) * 268;
          const y = 62 + Math.floor(i / 2) * 140;
          fillRR(ctx, x, y, 248, 118, 10, '#fffef8');
          strokeRR(ctx, x, y, 248, 118, 10, i === 3 ? C.orange : C.green, 2.4);
          drawLabel(ctx, item.title, x + 18, y + 32, C.muted, 12);
          drawLabel(ctx, item.value, x + 18, y + 64, i === 3 ? C.orange : C.green, 18);
          drawLabel(ctx, item.note, x + 18, y + 94, C.text, 11);
        });
      }
    });
  }, []);

  const setActiveView = (next: View) => {
    stateRef.current.view = next;
    setView(next);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${view === 'rounds' ? 'selected' : ''}`} onClick={() => setActiveView('rounds')}>九轮轨迹</button>
        <button className={`chip ${view === 'stages' ? 'selected' : ''}`} onClick={() => setActiveView('stages')}>三阶段表示</button>
        <button className={`chip ${view === 'transfer' ? 'selected' : ''}`} onClick={() => setActiveView('transfer')}>跨任务证据</button>
      </div>
      {view !== 'transfer' ? (
        <div className="ctrl">
          <button
            className="chip"
            onClick={() => {
              const value = Math.max(1, stateRef.current.round - 1);
              stateRef.current.round = value;
              setRound(value);
            }}
          >
            上一轮
          </button>
          <button
            className="chip selected"
            disabled={round >= 9}
            onClick={() => {
              const value = Math.min(9, stateRef.current.round + 1);
              stateRef.current.round = value;
              setRound(value);
            }}
          >
            下一轮
          </button>
          <button
            className="chip"
            onClick={() => {
              stateRef.current.round = 1;
              setRound(1);
            }}
          >
            重置
          </button>
          <span className="val">{round} / 9</span>
        </div>
      ) : null}
      <div className={`feedback ${current.n >= 6 || view === 'transfer' ? 'good' : current.n === 1 ? 'bad' : ''}`}>
        {view === 'rounds'
          ? current.n === 1
            ? '冷启动仍要付探索成本：32 次调用、222,203 token。这是该轨迹第 1 轮，不是所有任务的保证。'
            : current.n <= 5
              ? 'SOP 已去掉大部分探索，但仍需把通用规程对齐到当前任务实例，因此存在适配抖动。'
              : '代码化后进入约 23k±1k 窄带。相对第 1 轮：时间 -78.2%，调用 -84.4%，token -89.6%。'
          : view === 'stages'
            ? '主导变化是调用次数崩溃：它删除了整段“理解—推理—生成”循环，而不只是缩短单次回复。'
            : '八任务实验显示 SOP 不是只记住一条工作流：后轮均低于首轮，总体下降 79.3%；89.6% 仅属于 Table 8 的九轮 GitHub 轨迹。'}
      </div>
    </div>
  );
};
