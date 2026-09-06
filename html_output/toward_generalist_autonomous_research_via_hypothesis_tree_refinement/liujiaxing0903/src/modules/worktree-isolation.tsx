import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 285;
type Mode = 'shared' | 'isolated';

export const WorktreeIsolation: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 'shared' as Mode });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('shared');
  const checks = [mode === 'isolated', mode === 'isolated', mode === 'isolated'];
  const passed = checks.filter(Boolean).length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (time: number) => {
      const current = stateRef.current;
      const clean = current.mode === 'isolated';
      const pulse = 0.5 + Math.sin(time / 450) * 0.5;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#27446e';
      ctx.fillRect(34, 48, 116, 58);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Mbest 主干', 92, 82);

      const targetX = 350;
      ctx.strokeStyle = clean ? `rgba(34,141,92,${0.6 + pulse * 0.35})` : '#c43f52';
      ctx.lineWidth = clean ? 6 : 4;
      ctx.setLineDash(current.mode === 'isolated' ? [] : [8, 6]);
      ctx.beginPath();
      ctx.moveTo(150, 77);
      ctx.bezierCurveTo(228, 77, 270, 138, targetX, 138);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = clean ? '#228d5c' : current.mode === 'isolated' ? '#d97706' : '#c43f52';
      ctx.fillRect(350, 106, 176, 64);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillText(current.mode === 'isolated' ? '隔离 git worktree' : '共享工作目录', 438, 143);

      const audit = [
        { label: '候选制品可归因到独立分支', ok: current.mode === 'isolated' },
        { label: '不混入兄弟分支状态', ok: clean },
        { label: '可在新环境执行验收', ok: clean },
      ];
      audit.forEach((item, index) => {
        const y = 205 + index * 24;
        ctx.fillStyle = item.ok ? '#228d5c' : '#c43f52';
        ctx.beginPath();
        ctx.arc(48, y - 4, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#21324a';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${item.ok ? '通过' : '未通过'} · ${item.label}`, 66, y);
      });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const chooseMode = (next: Mode) => {
    stateRef.current.mode = next;
    setMode(next);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl" role="group" aria-label="执行环境模式">
        <button type="button" aria-pressed={mode === 'shared'} onClick={() => chooseMode('shared')}>共享工作目录</button>
        <button type="button" aria-pressed={mode === 'isolated'} onClick={() => chooseMode('isolated')}>隔离 git worktree</button>
      </div>
      <div className="ctrl">
        <span>论文不变量：每个候选都从当前 Mbest 创建新的隔离 git worktree</span>
        <span className="val">审计检查 {passed}/3</span>
      </div>
      <div className={`feedback ${passed === 3 ? 'good' : passed === 0 ? 'bad' : ''}`} aria-live="polite">
        {passed === 3
          ? '验证链清晰：候选从当前 Mbest 的新隔离 worktree 开始，可归因到固定假设，并能在独立环境中接受留出验收。'
          : '共享目录是违规对照：它可能混入其他尝试的状态。论文实现为每个候选创建新的隔离 worktree。'}
      </div>
      <p style={{ color: '#21324a', marginBottom: 0 }}>“审计检查”是机制核对清单，不是论文报告的风险百分比。</p>
    </div>
  );
};

export default WorktreeIsolation;
