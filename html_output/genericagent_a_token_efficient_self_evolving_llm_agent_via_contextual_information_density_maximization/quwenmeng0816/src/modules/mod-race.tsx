import React, { useEffect, useRef, useState } from 'react';
import { easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawStamp, drawLabel, bar, drawInkPath, startLoop } from './journalKit';

const W = 560;
const H = 260;

type Metric = 'lifelong' | 'sop' | 'realfin' | 'long5' | 'evo9' | 'web';

const METRICS: Record<
  Metric,
  {
    label: string;
    dir: string;
    protocol: string;
    rows: { name: string; v: number; max: number; better: 'high' | 'low' }[];
    note: string;
    gaBest: boolean;
  }
> = {
  lifelong: {
    label: 'Lifelong 完成率',
    dir: '越高越好',
    protocol: 'Lifelong AgentBench · Claude Sonnet 4.6',
    rows: [
      { name: 'GA', v: 100, max: 100, better: 'high' },
      { name: 'Claude Code', v: 75, max: 100, better: 'high' },
      { name: 'OpenClaw', v: 70, max: 100, better: 'high' },
    ],
    note: 'GA 以 241k 总 token 达到 100% 完成率，高于同骨干的对比系统。',
    gaBest: true,
  },
  sop: {
    label: 'SOP-Bench 完成率',
    dir: '越高越好',
    protocol: 'SOP-Bench · Claude Sonnet 4.6；效率数字不可跨表比较',
    rows: [
      { name: 'GA', v: 100, max: 100, better: 'high' },
      { name: 'OpenClaw', v: 100, max: 100, better: 'high' },
      { name: 'Claude Code', v: 85, max: 100, better: 'high' },
    ],
    note: 'GA 保持 100%；Claude Code 效率数字更高，但完成率降到 85%。',
    gaBest: false,
  },
  realfin: {
    label: 'RealFin 完成率',
    dir: '越高越好',
    protocol: 'RealFin-benchmark；GA 行为 Claude Sonnet 4.6',
    rows: [
      { name: 'GA', v: 65, max: 100, better: 'high' },
      { name: 'Claude Code Opus', v: 60, max: 100, better: 'high' },
      { name: 'Codex GPT-5.4', v: 60, max: 100, better: 'high' },
      { name: 'OpenClaw', v: 35, max: 100, better: 'high' },
    ],
    note: '该表中 GA 完成率 65% 为最高。',
    gaBest: true,
  },
  long5: {
    label: '长程五任务 token',
    dir: '越低越好',
    protocol: '五任务平均 · 同 Claude Sonnet 4.6 · 成功：GA/CC 100%，OC 80%',
    rows: [
      { name: 'GA', v: 188829, max: 633101, better: 'low' },
      { name: 'Claude Code', v: 537413, max: 633101, better: 'low' },
      { name: 'OpenClaw', v: 633101, max: 633101, better: 'low' },
    ],
    note: '同样 100% 成功时，GA 的 token 约为 Claude Code 的 35.1%。',
    gaBest: true,
  },
  evo9: {
    label: '九轮 GitHub 调研 token',
    dir: '越低越好',
    protocol: 'Table 8 · Claude Opus 4.6 · 同一轨迹，不是所有任务的保证',
    rows: [
      { name: '第1轮', v: 222203, max: 222203, better: 'low' },
      { name: '第9轮', v: 23010, max: 222203, better: 'low' },
    ],
    note: '该轨迹总 token 下降约 89.6%，代码化后约 23k。',
    gaBest: true,
  },
  web: {
    label: 'BrowseComp-ZH 分数',
    dir: '越高越好',
    protocol: 'n=10 · LLM Judge · 双方 Claude Opus 4.6',
    rows: [
      { name: 'GA', v: 0.6, max: 1, better: 'high' },
      { name: 'OpenClaw', v: 0.2, max: 1, better: 'high' },
    ],
    note: '分数 0.60 vs 0.20，平均 token 0.47M vs 1.31M。',
    gaBest: true,
  },
};

export const ModRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ metric: 'lifelong' as Metric, t: 0, running: false, start: 0 });
  const [metric, setMetric] = useState<Metric>('lifelong');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const s = stateRef.current;
      if (s.running) {
        s.t = Math.min(1, (now - s.start) / 1600);
        if (s.t >= 1) {
          s.running = false;
          setDone(true);
        }
      }
      const e = easeOutCubic(s.t);
      const m = METRICS[s.metric];
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 16, 16, 120, 200, 0, 0);
      const route = [
        { x: 44, y: 44 },
        { x: 88, y: 72 },
        { x: 56, y: 108 },
        { x: 92, y: 148 },
      ];
      const tip = drawInkPath(ctx, route, e, C.green, 2.6);
      drawStamp(ctx, tip.x, tip.y, e > 0.85 && m.gaBest);
      drawLabel(ctx, m.protocol, 156, 32, C.muted, 12);
      drawLabel(ctx, m.dir, 156, 52, C.orange, 12);
      m.rows.forEach((row, i) => {
        const y = 70 + i * 36;
        const t = row.better === 'high' ? row.v / row.max : 1 - row.v / row.max;
        drawLabel(ctx, row.name, 156, y + 12, C.text, 13);
        const color = row.name.startsWith('GA') || row.name === '第9轮' ? C.green : C.blue;
        bar(ctx, 250, y, 220, 16, t * e, color);
        const shown = row.max === 1 ? row.v.toFixed(2) : row.v.toLocaleString();
        drawLabel(ctx, shown, 480, y + 12, C.muted, 12);
      });
    });
  }, []);

  const m = METRICS[metric];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {(Object.keys(METRICS) as Metric[]).map((k) => (
          <button
            key={k}
            className={`chip ${metric === k ? 'selected' : ''}`}
            onClick={() => {
              stateRef.current.metric = k;
              stateRef.current.t = 0;
              stateRef.current.running = false;
              setMetric(k);
              setDone(false);
            }}
          >
            {METRICS[k].label}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <button
          className="chip selected"
          onClick={() => {
            stateRef.current.t = 0;
            stateRef.current.running = true;
            stateRef.current.start = performance.now();
            setDone(false);
          }}
        >
          开始对照
        </button>
      </div>
      <div className={`feedback ${done && m.gaBest ? 'good' : done ? '' : ''}`}>
        {done ? m.note : '选择基准块后开始对照。效率数字只在同一表内阅读。'}
      </div>
      <p style={{ color: '#68778f', fontSize: 13, marginTop: 8 }}>
        边界：探索权重自适应未充分验证；α 对中文可能低估；30 轮上限；技能树仍需人工维护。
      </p>
    </div>
  );
};
