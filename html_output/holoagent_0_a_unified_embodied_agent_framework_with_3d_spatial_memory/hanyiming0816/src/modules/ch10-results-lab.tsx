import React, { useEffect, useMemo, useRef, useState } from 'react';
import { easeOutCubic, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearSea, drawBoat, drawLegend, drawRoute, drawSceneLabel, PALETTE } from './sailing-kit';

const W = 560;
const H = 280;

type Metric = 'hm3d-sr' | 'hm3d-spl' | 'real-top1' | 'scannet-miou';
type Entry = { name: string; value: number; tag?: string; paper?: boolean };
type MetricDef = {
  chip: string;
  protocol: string;
  evidence: string;
  maximum: number;
  entries: Entry[];
  selectedFeedback: string;
  completedFeedback: string;
};

const DATA: Record<Metric, MetricDef> = {
  'hm3d-sr': {
    chip: 'HM3D · SR',
    protocol: 'HM3D-ObjNav · SR（成功率）· 越高越好',
    evidence: '论文表 1 · 模拟导航协议',
    maximum: 90,
    entries: [
      { name: 'HoloAgent-Nav', value: 82.6, paper: true },
      { name: 'FSR-VLN slow', value: 80.8 },
      { name: 'MSGNav', value: 74.1 },
    ],
    selectedFeedback: '已锁定 HM3D-ObjNav 的 SR 协议；三种方法可以在同一百分比轴上比较。',
    completedFeedback: '在 HM3D-ObjNav 的 SR 协议下，HoloAgent-Nav 为 82.6%，高于 FSR-VLN slow 的 80.8% 和 MSGNav 的 74.1%。',
  },
  'hm3d-spl': {
    chip: 'HM3D · SPL',
    protocol: 'HM3D-ObjNav · SPL（路径效率）· 越高越好',
    evidence: '论文表 1 · 模拟导航协议',
    maximum: 48,
    entries: [
      { name: 'HoloAgent-Nav', value: 42.8, paper: true },
      { name: 'FSR-VLN slow', value: 41.0 },
      { name: 'MSGNav', value: 33.4 },
    ],
    selectedFeedback: '已锁定 HM3D-ObjNav 的 SPL 协议；路径效率必须在同一模拟设置内比较。',
    completedFeedback: '在同一模拟协议下，42.8% 的 SPL 表明成功率提升没有以更长路径为代价。',
  },
  'real-top1': {
    chip: '真机 · Top-1@1m',
    protocol: '真机公寓 · Top-1@1.0m · 越高越好',
    evidence: '论文表 2 · 真实机器人导航协议',
    maximum: 100,
    entries: [
      { name: 'HoloAgent-Nav', value: 97.70, paper: true },
      { name: 'FSR-VLN', value: 91.95 },
      { name: 'HOV-SG', value: 51.72 },
    ],
    selectedFeedback: '已锁定真机公寓 Top-1@1.0m；它与模拟 SR/SPL 属于不同协议。',
    completedFeedback: '在真机公寓 Top-1@1.0m 协议下，HoloAgent-Nav 为 97.70%；这不能与模拟 SR/SPL 合并成一个总分。',
  },
  'scannet-miou': {
    chip: 'ScanNet · mIoU',
    protocol: 'ScanNet · 零样本语义映射 mIoU · 越高越好',
    evidence: '论文表 3 · 在线/离线属性需保留',
    maximum: 36,
    entries: [
      { name: 'HoloAgent-Memory', value: 31.58, tag: '在线', paper: true },
      { name: 'Omni-Map', value: 25.42, tag: '离线' },
      { name: 'HOV-SG', value: 20.76, tag: '在线' },
    ],
    selectedFeedback: '已锁定 ScanNet 零样本语义映射；比较时还要保留在线/离线属性。',
    completedFeedback: '在 ScanNet 零样本语义映射上，HoloAgent-Memory 的 mIoU 为 31.58%；比较时仍要保留方法的在线/离线属性。',
  },
};

const metricOrder: Metric[] = ['hm3d-sr', 'hm3d-spl', 'real-top1', 'scannet-miou'];

export const Ch10ResultsLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(true);
  const drawRef = useRef<() => void>(() => undefined);
  const stateRef = useRef({ metric: 'hm3d-sr' as Metric, progress: 0, running: false });
  const [metric, setMetric] = useState<Metric>('hm3d-sr');
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState(DATA['hm3d-sr'].selectedFeedback);
  const current = useMemo(() => DATA[metric], [metric]);

  useEffect(() => {
    stateRef.current = { metric, progress, running };
    if (visibleRef.current) drawRef.current();
  }, [metric, progress, running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const state = stateRef.current;
      const def = DATA[state.metric];
      const eased = easeOutCubic(state.progress);
      clearSea(ctx, W, H);

      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.strokeStyle = PALETTE.line;
      ctx.lineWidth = 1;
      ctx.fillRect(12, 12, 536, 36);
      ctx.strokeRect(12, 12, 536, 36);
      drawSceneLabel(ctx, def.protocol, 24, 30, PALETTE.blue);
      drawSceneLabel(ctx, def.evidence, 536, 30, PALETTE.muted, 'right');

      const laneStart = 150;
      const laneWidth = 358;
      def.entries.forEach((entry, index) => {
        const y = 84 + index * 51;
        drawSceneLabel(ctx, entry.name, 22, y - 7, entry.paper ? PALETTE.green : PALETTE.text);
        if (entry.tag) drawSceneLabel(ctx, entry.tag, 22, y + 11, PALETTE.muted);
        drawRoute(ctx, [{ x: laneStart, y }, { x: laneStart + laneWidth, y }], PALETTE.line, 5);
        const x = laneStart + (entry.value / def.maximum) * laneWidth * eased;
        const color = entry.paper ? PALETTE.green : index === 1 ? PALETTE.blue : PALETTE.orange;
        drawRoute(ctx, [{ x: laneStart, y }, { x, y }], color, 5);
        drawBoat(ctx, x, y - 9, color, 0.66);
        if (state.progress > 0.94) {
          drawSceneLabel(ctx, `${entry.value.toFixed(entry.value % 1 === 0 ? 1 : 2)}%`, Math.min(x + 15, 530), y - 9, color);
        }
      });

      ctx.strokeStyle = PALETTE.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(laneStart, 218);
      ctx.lineTo(laneStart + laneWidth, 218);
      ctx.stroke();
      for (let i = 0; i <= 4; i += 1) {
        const x = laneStart + (laneWidth * i) / 4;
        ctx.beginPath(); ctx.moveTo(x, 214); ctx.lineTo(x, 222); ctx.stroke();
        drawSceneLabel(ctx, `${Math.round((def.maximum * i) / 4)}%`, x, 235, PALETTE.muted, 'center');
      }
      drawLegend(ctx, [
        { label: '本文方法', color: PALETTE.green },
        { label: '基线', color: PALETTE.blue },
        { label: '基线', color: PALETTE.orange },
      ], 22, 234);

      ctx.fillStyle = 'rgba(217,119,6,.08)';
      ctx.fillRect(12, 248, 536, 28);
      drawSceneLabel(ctx, '协议不同，不能直接相加或排序；完整系统的其他能力仍主要是定性演示。', 22, 262, PALETTE.route);
      canvas.classList.add('is-ready');
    };

    drawRef.current = render;
    render();
    const disconnect = observeCanvas(
      canvas,
      () => { visibleRef.current = true; render(); },
      () => { visibleRef.current = false; },
    );
    return () => {
      disconnect();
      drawRef.current = () => undefined;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const chooseMetric = (next: Metric) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setMetric(next);
    setProgress(0);
    setRunning(false);
    setCompleted(false);
    setFeedback(DATA[next].selectedFeedback);
  };

  const startRace = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    setRunning(true);
    setCompleted(false);
    setProgress(0);
    setFeedback('比较进行中：所有方法都按同一指标、同一方向前进。');
    const startedAt = performance.now();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduceMotion ? 80 : 1800;
    const step = (now: number) => {
      const next = Math.min(1, (now - startedAt) / duration);
      stateRef.current.progress = next;
      stateRef.current.running = next < 1;
      setProgress(next);
      if (next < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        setRunning(false);
        setCompleted(true);
        setFeedback(DATA[stateRef.current.metric].completedFeedback);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="同一评测协议内的结果赛道" />
      <div className="ctrl" role="group" aria-label="选择评测协议">
        {metricOrder.map((key) => (
          <button
            key={key}
            type="button"
            className={`tiny ${metric === key ? '' : 'ghost'}`}
            aria-pressed={metric === key}
            onClick={() => chooseMetric(key)}
          >
            {DATA[key].chip}
          </button>
        ))}
        <button type="button" className="tiny" onClick={startRace} disabled={running}>
          {running ? '比较进行中' : completed ? '再次比较' : '开始同协议比较'}
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 440 }}>
          <thead>
            <tr><th style={{ textAlign: 'left' }}>方法</th><th>数值</th><th>属性</th></tr>
          </thead>
          <tbody>
            {current.entries.map((entry) => (
              <tr key={entry.name}>
                <td>{entry.name}{entry.paper ? '（本文方法）' : ''}</td>
                <td style={{ textAlign: 'center' }}>{entry.value.toFixed(2)}%</td>
                <td style={{ textAlign: 'center' }}>{entry.tag || '同协议'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`feedback ${completed ? 'good' : ''}`} aria-live="polite">{feedback}</div>
    </div>
  );
};

export default Ch10ResultsLab;
