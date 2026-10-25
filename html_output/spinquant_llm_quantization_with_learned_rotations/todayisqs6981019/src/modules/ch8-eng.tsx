import React, { useState } from 'react';
import { useCanvas } from './useCanvas';
import { C, clearScene, inset, rrect, text } from './kit';

const W = 720;
const H = 240;
const SY = 96;

// ch8-eng：P4 三芯片组合——fuse_layer_norms / 融合时机 / eval --rotate
export const Ch8Eng: React.FC = () => {
  const [fuse, setFuse] = useState(true);
  const [mode, setMode] = useState<'offline' | 'runtime'>('runtime');
  const [rotate, setRotate] = useState(false);

  const legal = !(mode === 'runtime' && !rotate);
  const ok = legal && (mode === 'offline' || rotate);

  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);

    const stages = [
      { x: 30, w: 92, label: 'Norm 融合', on: fuse },
      { x: 146, w: 92, label: mode === 'runtime' ? '权重融合·运行时' : '权重融合·离线', on: true },
      { x: 262, w: 92, label: '量化', on: true },
      { x: 378, w: 92, label: '评测', on: mode === 'offline' || rotate },
    ];
    stages.forEach((s, i) => {
      ctx.strokeStyle = s.on ? C.green : C.axis;
      ctx.lineWidth = s.on ? 2 : 1.5;
      if (!s.on) ctx.setLineDash([5, 4]);
      ctx.fillStyle = s.on ? '#e8f5ec' : '#f0f2ee';
      ctx.beginPath();
      ctx.roundRect(s.x, SY - 24, s.w, 48, 8);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, `${i + 1}`, s.x + 12, SY - 10, s.on ? C.green : C.muted, 12);
      text(ctx, s.label, s.x + s.w / 2, SY + 8, s.on ? C.ink : C.muted, 12, 'center');
      if (i < stages.length - 1) {
        ctx.strokeStyle = s.on && stages[i + 1].on ? C.green : C.axis;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x + s.w + 3, SY);
        ctx.lineTo(s.x + s.w + 19, SY);
        ctx.stroke();
      }
    });

    if (!ok) {
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2 + Math.sin(t * 6) * 0.6;
      ctx.beginPath();
      ctx.roundRect(24, SY - 40, 452, 80, 10);
      ctx.stroke();
      text(ctx, '旋转没有生效', 250, SY + 44, C.red, 13, 'center');
    } else {
      text(ctx, mode === 'runtime' ? '融合在运行时做，评测带 --rotate' : '旋转已离线写回，评测无需 --rotate', 250, SY + 44, C.green, 13, 'center');
    }

    inset(ctx, 496, 20, 204, 200);
    text(ctx, '当前组合', 512, 46, C.muted, 12);
    const row = (label: string, val: string, valColor: string, y: number) => {
      text(ctx, label, 512, y, C.muted, 12);
      text(ctx, val, 684, y, valColor, 13, 'right');
    };
    row('fuse_layer_norms', fuse ? '开' : '关', fuse ? C.green : C.red, 76);
    row('融合时机', mode === 'runtime' ? '运行时' : '离线写回', C.blue, 102);
    row('eval --rotate', rotate ? '开' : '关', rotate ? C.green : C.red, 128);
    ctx.strokeStyle = legal ? C.green : C.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(508, 152, 180, 40, 8);
    ctx.stroke();
    text(ctx, legal ? '组合合法' : '非法组合', 598, 172, legal ? C.green : C.red, 14, 'center');
    text(ctx, '源码口径', 684, 206, C.orange, 11.5, 'right');
  });

  const fb = !legal
    ? { text: '融合在运行时做，评测必须 --rotate', cls: 'bad' }
    : mode === 'runtime'
    ? { text: '旋转在评测中生效', cls: 'good' }
    : { text: '离线写回，评测无需 --rotate', cls: 'good' };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl" role="group" aria-label="工程配置开关">
        <button
          className={`chip${fuse ? ' on' : ''}`}
          style={fuse ? { background: C.green, borderColor: C.green } : undefined}
          onClick={() => setFuse((v) => !v)}
        >
          fuse_layer_norms：{fuse ? '开' : '关'}
        </button>
        <button className="chip on" style={{ background: C.blue, borderColor: C.blue }} onClick={() => setMode((m) => (m === 'runtime' ? 'offline' : 'runtime'))}>
          融合时机：{mode === 'runtime' ? '运行时' : '离线写回'}
        </button>
        <button
          className={`chip${rotate ? ' on' : ''}`}
          style={rotate ? { background: C.green, borderColor: C.green } : undefined}
          onClick={() => setRotate((v) => !v)}
        >
          eval --rotate：{rotate ? '开' : '关'}
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <p className="sq-note">
        <b>读图方式：</b>绿色实线 = 当前生效环节，灰虚线 = 被跳过环节；右栏给出组合合法性与三行开关状态。
        「融合发生在 QuantizeLinear.forward 运行时、eval 需 --rotate」为源码核实口径（Q4），
        架构位次与论文 §3.1/§6 一致。
      </p>
    </div>
  );
};

export default Ch8Eng;
