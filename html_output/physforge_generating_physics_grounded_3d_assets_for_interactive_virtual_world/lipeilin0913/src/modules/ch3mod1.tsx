import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §3 Module 3.1 (P3 synchronized before/after): build without blueprint vs with blueprint.
// 每格是一个小过程：噪声点先聚拢成形——左格聚成一整块实心板、门缝被熔死（红 ✗）；
// 右格沿虚线蓝图分件组装，柜门绕可见铰链点打开（绿 ✓）。自动循环并重置，按钮可手动重播。
const W = 1080;
const H = 280;
const DOTS = 22;

// deterministic pseudo-random in [0,1) so the noise cloud is stable frame to frame
const rnd = (i: number, salt: number) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ t: 0, running: true }); // auto-plays, then loops
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const doneAtRef = useRef<number | null>(null);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState({ text: '两条路线同时开工：左侧凭感觉拼接，右侧照蓝图施工……', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const panel = (ox: number, t: number, guided: boolean, scoreA: number, contentA: number) => {
      // panel frame
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.fillRect(ox, 24, 500, 210);
      ctx.strokeRect(ox, 24, 500, 210);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(ox + 20, 206, 460, 6);

      ctx.save();
      // --- noise dots converge onto their target region ---
      const e1 = easeInOutQuad(clamp(t / 0.42, 0, 1));
      const dotBase = clamp(t / 0.04, 0, 1);
      for (let i = 0; i < DOTS; i++) {
        const sx = ox + 50 + rnd(i, 1) * 400;
        const sy = 48 + rnd(i, 2) * 140;
        let tx: number;
        let ty: number;
        if (guided) {
          const zone = i % 3;
          if (zone === 0) {
            tx = ox + 160 + rnd(i, 3) * 240;
            ty = 66 + rnd(i, 4) * 110; // 柜体
          } else if (zone === 1) {
            tx = ox + 172 + rnd(i, 3) * 216;
            ty = 78 + rnd(i, 4) * 60; // 柜门
          } else {
            tx = ox + 172 + rnd(i, 3) * 216;
            ty = 146 + rnd(i, 4) * 20; // 抽屉
          }
        } else {
          tx = ox + 170 + rnd(i, 3) * 220;
          ty = 80 + rnd(i, 4) * 96; // one undifferentiated slab
        }
        const dotA = (1 - e1) * dotBase;
        if (dotA > 0.01) {
          ctx.globalAlpha = contentA * dotA;
          ctx.fillStyle = '#68778f';
          ctx.beginPath();
          ctx.arc(lerp(sx, tx, e1), lerp(sy, ty, e1), 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const noiseA = clamp(t / 0.05, 0, 1) * (1 - clamp((t - 0.15) / 0.15, 0, 1));
      if (noiseA > 0.01) {
        ctx.globalAlpha = contentA * noiseA;
        ctx.fillStyle = '#68778f';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText('从噪声开始', ox + 30, 52);
      }

      if (!guided) {
        // ---- left: dots fuse into ONE solid slab, no part separation ----
        ctx.globalAlpha = contentA * e1;
        ctx.fillStyle = '#92400e';
        ctx.fillRect(ox + 170, 80, 220, 96);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(ox + 170, 80, 220, 10);
        // a door outline tries to appear…
        const outlineA = clamp((t - 0.45) / 0.15, 0, 1) * (1 - clamp((t - 0.62) / 0.12, 0, 1));
        if (outlineA > 0.01) {
          ctx.globalAlpha = contentA * outlineA;
          ctx.strokeStyle = '#5c2d0c';
          ctx.lineWidth = 2;
          ctx.strokeRect(ox + 182, 92, 196, 52);
        }
        // …but the seam welds shut: red seal over the outline + red ✗
        const seal = easeOutCubic(clamp((t - 0.6) / 0.18, 0, 1));
        if (seal > 0.01) {
          ctx.globalAlpha = contentA * seal;
          ctx.strokeStyle = '#c43f52';
          ctx.lineWidth = 4;
          ctx.strokeRect(ox + 182, 92, 196, 52);
          const cxm = ox + 280;
          const cym = 128;
          const r = 13;
          ctx.beginPath();
          ctx.moveTo(cxm - r, cym - r);
          ctx.lineTo(cxm + r, cym + r);
          ctx.moveTo(cxm + r, cym - r);
          ctx.lineTo(cxm - r, cym + r);
          ctx.stroke();
        }
        ctx.globalAlpha = contentA * clamp((t - 0.6) / 0.15, 0, 1);
        ctx.fillStyle = '#c43f52';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('一整块板：门缝熔死，打不开', ox + 195, 226);
      } else {
        // ---- right: dashed blueprint guides part-by-part assembly ----
        const guideA = clamp((t - 0.1) / 0.1, 0, 1) * (1 - clamp((t - 0.7) / 0.1, 0, 1));
        if (guideA > 0.01) {
          ctx.globalAlpha = contentA * guideA;
          ctx.strokeStyle = '#27446e';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);
          ctx.strokeRect(ox + 160, 66, 240, 110);
          ctx.setLineDash([]);
        }
        const bodyE = easeOutCubic(clamp((t - 0.35) / 0.2, 0, 1));
        const doorFormE = easeOutCubic(clamp((t - 0.45) / 0.2, 0, 1));
        const drawerE = easeOutCubic(clamp((t - 0.52) / 0.18, 0, 1));
        const open = easeInOutQuad(clamp((t - 0.68) / 0.27, 0, 1));
        // 柜体
        ctx.globalAlpha = contentA * bodyE;
        ctx.fillStyle = '#92400e';
        ctx.fillRect(ox + 160, 66, 240, 110);
        ctx.fillStyle = '#5c2d0c';
        ctx.fillRect(ox + 172, 78, 216, 88);
        // 抽屉
        ctx.globalAlpha = contentA * drawerE;
        ctx.fillStyle = '#7a3509';
        ctx.fillRect(ox + 172, 146, 216, 20);
        ctx.fillStyle = '#d7deea';
        ctx.fillRect(ox + 266, 153, 28, 5);
        // 柜门 swings open around its LEFT edge (铰链), foreshortening like ch4ana
        const rad = open * 0.96; // ~55°
        const wApp = Math.max(216 * Math.cos(rad), 2);
        const lift = 10 * Math.sin(rad);
        // cast shadow on the cavity wall as the door swings
        if (open > 0.02) {
          ctx.save();
          ctx.globalAlpha = contentA * doorFormE;
          ctx.beginPath();
          ctx.rect(ox + 172, 78, 216, 88);
          ctx.clip();
          ctx.fillStyle = `rgba(0,0,0,${0.3 * open})`;
          ctx.beginPath();
          ctx.moveTo(ox + 181, 86);
          ctx.lineTo(ox + 172 + wApp + 9, 78 - lift + 8);
          ctx.lineTo(ox + 172 + wApp + 9, 138 - lift + 8);
          ctx.lineTo(ox + 181, 146);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = contentA * doorFormE;
        ctx.beginPath();
        ctx.moveTo(ox + 172, 78);
        ctx.lineTo(ox + 172 + wApp, 78 - lift);
        ctx.lineTo(ox + 172 + wApp, 138 - lift);
        ctx.lineTo(ox + 172, 138);
        ctx.closePath();
        ctx.fillStyle = '#a0522d';
        ctx.fill();
        ctx.strokeStyle = '#5c2d0c';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#d7deea'; // knob rides the free edge
        ctx.beginPath();
        ctx.arc(ox + 172 + wApp - 12, 108 - lift, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // hinge dots stay on the frame — the visible pivot
        if (doorFormE > 0.5) {
          ctx.fillStyle = '#f07e47';
          for (const hy of [90, 126]) {
            ctx.beginPath();
            ctx.arc(ox + 172, hy, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#68778f';
          ctx.font = '11px "Segoe UI", sans-serif';
          ctx.fillText('铰链', ox + 132, 94);
        }
        // green ✓ once the door is open
        const okA = easeOutCubic(clamp((t - 0.9) / 0.1, 0, 1));
        if (okA > 0.01) {
          ctx.globalAlpha = contentA * okA;
          ctx.fillStyle = '#228d5c';
          ctx.beginPath();
          ctx.arc(ox + 424, 96, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ox + 417.5, 96);
          ctx.lineTo(ox + 422, 101);
          ctx.lineTo(ox + 430.5, 90);
          ctx.stroke();
        }
        ctx.globalAlpha = contentA * clamp((t - 0.75) / 0.15, 0, 1);
        ctx.fillStyle = '#228d5c';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('分件组装：柜门绕铰链打开', ox + 195, 226);
      }

      // final score fades in after the build completes
      if (scoreA > 0.01) {
        ctx.globalAlpha = scoreA * contentA;
        ctx.fillStyle = '#68778f';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText('Voxel recall', ox + 322, 52);
        ctx.fillStyle = guided ? '#228d5c' : '#c43f52';
        ctx.font = 'bold 20px "Segoe UI", sans-serif';
        ctx.fillText(guided ? '73.63' : '67.89', ox + 400, 54);
      }
      ctx.restore();
    };

    const render = (time: number) => {
      const s = stateRef.current;
      if (s.running) {
        if (startRef.current === null) startRef.current = time;
        s.t = Math.min((time - startRef.current) / 2600, 1);
        if (s.t >= 1) {
          s.running = false;
          doneAtRef.current = time;
          setRunning(false);
          setDone(true);
          setFeedback({ text: '物理蓝图引导的规划更准：Voxel recall 73.63 对 67.89（越高越好）。', cls: 'good' });
        }
      } else if (doneAtRef.current !== null && time - doneAtRef.current > 2300) {
        // hold, fade out, then loop back to a fresh build — no teleporting parts
        doneAtRef.current = null;
        startRef.current = null;
        s.t = 0;
        s.running = true;
        setDone(false);
        setRunning(true);
        setFeedback({ text: '两条路线同时开工：左侧凭感觉拼接，右侧照蓝图施工……', cls: '' });
      }
      const doneAt = doneAtRef.current;
      const scoreA = doneAt !== null ? clamp((time - doneAt) / 500, 0, 1) : 0;
      const contentA = doneAt !== null ? 1 - clamp((time - doneAt - 1500) / 700, 0, 1) : 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      panel(20, s.t, false, scoreA, contentA);
      panel(560, s.t, true, scoreA, contentA);
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('无蓝图（仅几何）', 40, 18);
      ctx.fillText('物理蓝图引导', 580, 18);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = () => {
    stateRef.current.t = 0;
    stateRef.current.running = true;
    startRef.current = null;
    doneAtRef.current = null;
    setDone(false);
    setRunning(true);
    setFeedback({ text: '两条路线同时开工：左侧凭感觉拼接，右侧照蓝图施工……', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className="chip" onClick={onStart} disabled={running}>
          {done ? '再来一次' : running ? '进行中…' : '同时开工'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
