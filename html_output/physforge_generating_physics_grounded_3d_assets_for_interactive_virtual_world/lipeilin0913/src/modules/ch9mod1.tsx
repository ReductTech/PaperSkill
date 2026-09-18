import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §9 Module 9.1 (P4 mode chips, hybrid): four joint types demo + ablation bars (Table 4 evidence).
const W = 1080;
const H = 280;

type Joint = 'revolute' | 'continuous' | 'prismatic' | 'fixed';

const JOINTS: Record<Joint, { label: string; fb: string }> = {
  revolute: { label: 'revolute 旋转', fb: '绕轴在限位内转动：柜门、盖板。状态机如 [on, off]。' },
  continuous: { label: 'continuous 连续', fb: '可连续旋转不限角度：旋钮、轮子一类。' },
  prismatic: { label: 'prismatic 棱柱', fb: '沿轴平移：抽屉沿滑轨进出。' },
  fixed: { label: 'fixed 固定', fb: '固定不动，也有明确语义角色（如柜体承重）。' },
};

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ joint: Joint }>({ joint: 'revolute' });
  const rafRef = useRef<number | null>(null);
  const [joint, setJoint] = useState<Joint>('revolute');
  const [feedback, setFeedback] = useState({ text: JOINTS.revolute.fb, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    // crossfade state: switching chips eases the old demo out / new demo in
    // over ~300ms instead of hard-cutting between them.
    let drawnJoint: Joint = stateRef.current.joint;
    let transFrom: Joint | null = null;
    let transStart = 0;

    const drawJoint = (j: Joint, time: number) => {
      const ph = Math.sin(time / 600); // smooth in/out oscillation, ~3.8s period
      if (j === 'revolute') {
        const a = (ph * 0.5 + 0.5) * 1.1; // 0 → ~63° and back, eased by sine
        // hinge on the cabinet's right vertical edge: horizontal cos
        // compression + slight upward drift of the free edge (oblique depth).
        // drop shadow trailing the panel; the gap grows with the swing angle
        ctx.save();
        ctx.translate(240 + 8 + 8 * Math.sin(a), 60 + 7);
        ctx.transform(Math.cos(a), -Math.sin(a) * 0.35, 0, 1, 0, 0);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, 0, 150, 70);
        ctx.restore();
        ctx.save();
        ctx.translate(240, 60);
        ctx.transform(Math.cos(a), -Math.sin(a) * 0.35, 0, 1, 0, 0);
        ctx.fillStyle = '#27446e';
        ctx.fillRect(0, 0, 150, 70);
        ctx.fillStyle = '#f07e47';
        ctx.fillRect(132, 30, 10, 10); // handle near the free edge
        ctx.restore();
        ctx.fillStyle = '#68778f';
        ctx.beginPath();
        ctx.arc(240, 70, 3.5, 0, Math.PI * 2);
        ctx.arc(240, 120, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (j === 'continuous') {
        // 装在柜体面上的旋钮：指针连续旋转，角度读数不停累积、转过一圈
        // 又一圈——“连续”就是不受任何限位
        const kx = 180;
        const ky = 140;
        const ang = time / 500;
        // dial tick ring
        ctx.strokeStyle = '#68778f';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(kx + Math.cos(a) * 38, ky + Math.sin(a) * 38);
          ctx.lineTo(kx + Math.cos(a) * 45, ky + Math.sin(a) * 45);
          ctx.stroke();
        }
        // knob disc
        ctx.fillStyle = '#27446e';
        ctx.beginPath();
        ctx.arc(kx, ky, 31, 0, Math.PI * 2);
        ctx.fill();
        // rotating pointer + tip marker
        ctx.strokeStyle = '#f07e47';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(kx, ky);
        ctx.lineTo(kx + Math.cos(ang) * 23, ky + Math.sin(ang) * 23);
        ctx.stroke();
        ctx.lineCap = 'butt';
        ctx.fillStyle = '#f07e47';
        ctx.beginPath();
        ctx.arc(kx + Math.cos(ang) * 23, ky + Math.sin(ang) * 23, 4, 0, Math.PI * 2);
        ctx.fill();
        // accumulated angle readout: keeps counting past 360° (no limit)
        const totalDeg = (ang * 180) / Math.PI;
        const turns = Math.floor(totalDeg / 360);
        ctx.fillStyle = '#21324a';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText(`θ = ${totalDeg.toFixed(0)}°（已转 ${turns} 圈）`, 118, 240);
      } else if (j === 'prismatic') {
        // drawer slides OUT toward the viewer (down-left along the depth axis)
        // from a real opening; the pulled box shows top + right side faces
        ctx.fillStyle = '#4a2c12';
        ctx.fillRect(130, 150, 100, 48); // opening
        const e = ph * 0.5 + 0.5;
        const ox = -14 * e;
        const oy = 18 * e;
        const fx = 134 + ox;
        const fy = 154 + oy;
        if (e > 0.01) {
          ctx.fillStyle = '#3a5a8c'; // top face (lighter)
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(134, 154);
          ctx.lineTo(226, 154);
          ctx.lineTo(fx + 92, fy);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#1b3252'; // right side face (darker)
          ctx.beginPath();
          ctx.moveTo(fx + 92, fy);
          ctx.lineTo(226, 154);
          ctx.lineTo(226, 194);
          ctx.lineTo(fx + 92, fy + 40);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = '#27446e'; // front panel
        ctx.fillRect(fx, fy, 92, 40);
        ctx.fillStyle = '#f07e47';
        ctx.beginPath();
        ctx.arc(fx + 46, fy + 20, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#76906a';
        ctx.fillRect(240, 60, 150, 160);
        ctx.fillStyle = '#68778f';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText('固定', 292, 145);
      }
    };

    const render = (time: number) => {
      const j = stateRef.current.joint;
      if (j !== drawnJoint) {
        transFrom = drawnJoint;
        drawnJoint = j;
        transStart = time;
      }
      let mix = 1;
      if (transFrom !== null) {
        mix = easeOutCubic(clamp((time - transStart) / 300, 0, 1));
        if (mix >= 1) transFrom = null;
      }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 248, W, 6);
      // cabinet body (shared by every joint demo, stays put during crossfade)
      ctx.fillStyle = '#92400e';
      ctx.fillRect(120, 60, 120, 160);
      if (transFrom !== null) {
        ctx.save();
        ctx.globalAlpha = 1 - mix;
        drawJoint(transFrom, time);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = mix;
      drawJoint(j, time);
      ctx.restore();
      // ablation bars (Table 4, lower is better)
      const bars = [
        { name: '完整模型', v: 0.164, c: '#228d5c' },
        { name: '去类型嵌入', v: 0.292, c: '#c43f52' },
        { name: '去运动学编解码', v: 0.204, c: '#c43f52' },
      ];
      bars.forEach((b, i) => {
        const by = 90 + i * 60;
        ctx.fillStyle = '#68778f';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText(b.name, 620, by - 8);
        ctx.fillStyle = '#d7deea';
        ctx.fillRect(620, by, 320, 16);
        ctx.fillStyle = b.c;
        ctx.fillRect(620, by, (b.v / 0.35) * 320, 16);
        ctx.fillStyle = '#21324a';
        ctx.fillText(b.v.toFixed(3), 950, by + 13);
      });
      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('Joint-Axis-Err-all（越低越好）', 620, 66);
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

  const select = (j: Joint) => {
    stateRef.current.joint = j;
    setJoint(j);
    setFeedback({ text: JOINTS[j].fb + ' 消融显示：去掉类型嵌入，轴误差从 0.164 升到 0.292。', cls: j === 'fixed' ? '' : 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="关节类型">
        {(Object.keys(JOINTS) as Joint[]).map((key) => (
          <button key={key} className={`chip ${joint === key ? 'selected' : ''}`} onClick={() => select(key)}>
            {JOINTS[key].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
