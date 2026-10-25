import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  scene: '#f5f8f0', blue: '#27446e', green: '#228d5c', red: '#c43f52',
  orange: '#f07e47', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

export const EwcCh10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ race: 0, running: false, metric: 'mnist' as 'mnist' | 'atari' });
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const [metric, setMetric] = useState<'mnist' | 'atari'>('mnist');
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({ text: '选择指标，按下“开始对比”观看结果竞速。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { race: number; metric: 'mnist' | 'atari' }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);
      const rx = 30, ry = 24, rw = 1000, rh = 200;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.fillStyle = C.muted;
      ctx.font = '13px sans-serif';
      ctx.fillText(s.metric === 'mnist' ? '可稳定维持的任务数（置换 MNIST，依据图 2B）' : '人类标准化总分（满分 10，依据图 3B）', rx + 16, ry + 22);
      const lanes = s.metric === 'mnist'
        ? [
            { label: 'SGD', v: 0.2, color: C.red, note: '约 2 个任务' },
            { label: 'EWC', v: 1.0, color: C.green, note: '图 2B 到 10 个任务' },
          ]
        : [
            { label: 'SGD', v: 0.08, color: C.red, note: '总分 < 1' },
            { label: 'EWC', v: 0.3, color: C.green, note: '学会多个游戏' },
            { label: '单独十网络', v: 1.0, color: C.blue, note: '上限' },
          ];
      lanes.forEach((lane, i) => {
        const y = ry + 48 + i * 52;
        ctx.fillStyle = C.ink;
        ctx.font = '13px sans-serif';
        ctx.fillText(lane.label, rx + 16, y + 6);
        ctx.fillStyle = C.border;
        ctx.fillRect(rx + 130, y - 8, 700, 24);
        const v = lane.v * s.race;
        ctx.fillStyle = lane.color;
        ctx.fillRect(rx + 130, y - 8, 700 * v, 24);
        if (s.race >= 1) {
          ctx.fillStyle = C.ink;
          ctx.fillText(lane.note, rx + 130 + 700 * lane.v + 10, y + 10);
        }
      });
      ctx.fillStyle = C.muted;
      ctx.font = '12px sans-serif';
      ctx.fillText('条形为协议内示意，具体数值见论文图 2B / 图 3B；指标方向：越高越好', rx + 16, ry + rh - 12);
    };
    const tick = (now: number) => {
      const s = stateRef.current;
      if (s.running && s.race < 1) {
        const t = (now - startRef.current) / 1600;
        s.race = Math.min(1, easeOutCubic(Math.max(0, t)));
        if (s.race >= 1) {
          s.running = false;
          setRunning(false);
          setFeedback({ text: '对比完成：指标方向为越高越好；结论只在这些协议内成立。', cls: '' });
        }
      }
      render(s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disc = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disc();
    };
  }, []);

  const begin = () => {
    stateRef.current.race = 0;
    stateRef.current.running = true;
    startRef.current = performance.now();
    setRunning(true);
    const m = stateRef.current.metric;
    setFeedback(m === 'mnist'
      ? { text: 'MNIST：EWC 能连续维持更多任务，误差只温和增长；SGD 两个任务后就明显退化。', cls: '' }
      : { text: 'Atari：普通 DQN 总分 <1，EWC 学会多个游戏，但仍低于单独训练十个网络的上限。', cls: '' });
  };
  const pickMetric = (m: 'mnist' | 'atari') => {
    stateRef.current.metric = m;
    stateRef.current.race = 0;
    setMetric(m);
    setFeedback({ text: '已切换指标，按下“开始对比”观看结果竞速。', cls: '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {(['mnist', 'atari'] as const).map((m) => (
          <button key={m} className={'chip' + (metric === m ? ' selected' : '')} onClick={() => pickMetric(m)}>
            {m === 'mnist' ? '置换 MNIST' : 'Atari'}
          </button>
        ))}
        <button className="chip" onClick={begin} disabled={running}>开始对比</button>
        <button className="chip" onClick={begin}>重播</button>
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default EwcCh10Mod1;
