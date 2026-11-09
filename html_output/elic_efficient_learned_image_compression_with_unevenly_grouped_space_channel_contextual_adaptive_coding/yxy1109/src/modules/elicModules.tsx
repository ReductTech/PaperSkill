import React, { useCallback, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, drawBars, drawGaussian, drawPhoto, ease, roundRect, useElicCanvas } from './elicKit';

const MW = 1080;
const MH = 260;

function useStatefulCanvas<T>(
  w: number,
  h: number,
  initial: T,
  draw: (ctx: CanvasRenderingContext2D, t: number, state: T) => void
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<T>(initial);
  const [state, setState] = useState<T>(initial);
  const drawCb = useCallback(
    (ctx: CanvasRenderingContext2D, t: number) => draw(ctx, t, stateRef.current),
    [draw]
  );
  useElicCanvas(ref, w, h, drawCb);
  const update = (next: T) => {
    stateRef.current = next;
    setState(next);
  };
  return { ref, state, update };
}

function feedback(text: string, cls: '' | 'good' | 'bad' = '') {
  return { text, cls };
}

function Module11() {
  const { ref, state, update } = useStatefulCanvas(
    MW,
    MH,
    { q: 0.5 },
    (ctx, _t, s) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, MW, MH);
      const clarity = 0.22 + 0.78 * s.q;
      drawPhoto(ctx, 28, 34, 430, 210, clarity, s.q > 0.7 ? 'green' : s.q < 0.3 ? 'red' : 'blue');
      const bpp = 0.04 + 0.96 * s.q;
      const psnr = 24 + 14 * s.q;
      ctx.fillStyle = C.ink;
      ctx.font = '26px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('码率', 520, 70);
      ctx.fillText(String(bpp.toFixed(2)) + ' bpp', 650, 70);
      ctx.fillText('质量', 520, 140);
      ctx.fillText(String(psnr.toFixed(1)) + ' dB', 650, 140);
      drawBars(ctx, 520, 180, 170, 50, [{ v: bpp, color: C.blue, label: 'BPP' }], 1);
      drawBars(ctx, 780, 170, 250, 60, [
        { v: 49.16, color: C.green, label: 'ELIC 49ms' },
        { v: 65.75, color: C.red, label: '传统 66ms' },
      ], 70);
    }
  );
  const q = state.q;
  const fb =
    q > 0.72
      ? feedback('高码率档：细节清晰，但需要更多比特；ELIC 解码仍快于传统方法。', 'good')
      : q < 0.28
      ? feedback('低码率档：体积小，但细节被牺牲；这就是率失真的代价。', 'bad')
      : feedback('中间档：质量与码率在互相拉扯，拖动滑块体会两者的张力。');
  return (
    <div>
      <canvas ref={ref} width={MW} height={MH} />
      <div className="ctrl">
        <label>
          目标质量 <span className="val">{q.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(q * 100)}
          onChange={(e) => update({ q: Number(e.target.value) / 100 })}
        />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}

function Module21() {
  const { ref, state, update } = useStatefulCanvas(
    MW,
    MH,
    { region: 0 },
    (ctx, _t, s) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, MW, MH);
      drawPhoto(ctx, 28, 34, 430, 210, 0.75, 'neutral');
      ctx.save();
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 2;
      for (let i = 1; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(28 + 215, 34);
        ctx.lineTo(28 + 215, 244);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(28, 34 + 105);
        ctx.lineTo(458, 34 + 105);
        ctx.stroke();
      }
      const cx = 28 + (s.region % 2) * 215;
      const cy = 34 + Math.floor(s.region / 2) * 105;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 4;
      roundRect(ctx, cx, cy, 215, 105, 0);
      ctx.stroke();
      ctx.restore();
      const values = [1, 0.72, 0.46, 0.26, 0.12].map((v) => v * (1 - s.region * 0.04));
      drawBars(ctx, 520, 150, 500, 70, values.map((v, i) => ({
        v,
        color: i === 0 ? C.green : i === 1 ? C.blue : C.env,
        label: String(i + 1),
      })), 1);
      ctx.fillStyle = C.ink;
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('通道能量（按通道排序）', 520, 110);
    }
  );
  const names = ['天空与山脊', '近景地面', '水面反光', '远处云层'];
  const fb = feedback(
    `选中「${names[state.region]}」：潜变量能量集中在靠前的少数通道，后部通道逐渐稀疏。`
  );
  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * MW;
    const y = ((e.clientY - rect.top) / rect.height) * MH;
    const col = x >= 28 && x < 458 ? Math.floor((x - 28) / 215) : 0;
    const row = y >= 34 && y < 244 ? Math.floor((y - 34) / 105) : 0;
    update({ region: row * 2 + col });
  };
  return (
    <div>
      <canvas ref={ref} width={MW} height={MH} onPointerDown={hit} />
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}

function Module31() {
  const { ref, state, update } = useStatefulCanvas(
    MW,
    MH,
    { step: 0 },
    (ctx, _t, s) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, MW, MH);
      const clarity = 0.18 + (s.step / 5) * 0.8;
      drawPhoto(ctx, 28, 34, 380, 190, clarity, s.step >= 4 ? 'green' : 'blue');
      const vals = [1, 0.72, 0.46, 0.26, 0.12];
      drawBars(ctx, 470, 150, 540, 72, vals.map((v, i) => ({
        v,
        color: i < s.step ? C.green : i === s.step ? C.blue : C.env,
        label: `组${i + 1}`,
      })), 1);
      ctx.fillStyle = C.ink;
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('平均能量', 470, 110);
    }
  );
  const labels = ['未开始', '组1：最强能量', '组2', '组3', '组4', '组5：接近尾声'];
  const fb = feedback(
    state.step === 0
      ? '点击下一步，逐组查看能量递减。'
      : `已查看前 ${state.step} 组：第 ${state.step} 组能量${state.step === 1 ? '最高，承载主要语义' : '继续下降'}。`,
    state.step >= 4 ? 'good' : ''
  );
  return (
    <div>
      <canvas ref={ref} width={MW} height={MH} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => update({ step: Math.max(0, state.step - 1) })}>
          上一步
        </button>
        <span className="step-label">
          <b>{state.step}</b> / 5
        </span>
        <button className="tiny" onClick={() => update({ step: Math.min(5, state.step + 1) })}>
          下一步
        </button>
        <button className="tiny ghost" onClick={() => update({ step: 0 })}>
          重置
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}

function Module32() {
  const { ref, state, update } = useStatefulCanvas(
    MW,
    MH,
    { mode: 'even' },
    (ctx, _t, s) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, MW, MH);
      const uneven = s.mode === 'uneven';
      const steps = uneven ? 5 : 10;
      const latency = uneven ? 6.45 : 13.46;
      const bd = uneven ? -2.78 : -3.81;
      drawBars(ctx, 80, 170, 300, 60, [{ v: steps, color: uneven ? C.green : C.red, label: `${steps} 次` }], 10);
      drawBars(ctx, 440, 170, 300, 60, [{ v: latency, color: uneven ? C.green : C.red, label: `${latency} ms` }], 14);
      ctx.fillStyle = C.ink;
      ctx.font = '24px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('并行步骤', 80, 100);
      ctx.fillText('参数延迟', 440, 100);
      ctx.fillText('BD-Rate ' + bd.toFixed(2) + '%', 820, 100);
      ctx.fillStyle = uneven ? C.green : C.red;
      ctx.font = '34px "Segoe UI", sans-serif';
      ctx.fillText(bd.toFixed(2) + '%', 820, 170);
    }
  );
  const fb = feedback(
    state.mode === 'uneven'
      ? '不均匀分组：并行步骤减半、参数延迟近减半，只用少量 BD-Rate 换取速度。'
      : '均匀分组：10 次并行步骤，BD-Rate 略好，但参数延迟几乎是两倍。',
    state.mode === 'uneven' ? 'good' : 'bad'
  );
  return (
    <div>
      <canvas ref={ref} width={MW} height={MH} />
      <div className="chip-row">
        {[
          ['even', '10 组均匀'],
          ['uneven', '5 组非均匀'],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`chip ${state.mode === id ? 'selected' : ''}`}
            onClick={() => update({ mode: id as 'even' | 'uneven' })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}

function Module41() {
  const { ref, state, update } = useStatefulCanvas(
    MW,
    MH,
    { lambda: 0.5 },
    (ctx, _t, s) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, MW, MH);
      drawPhoto(ctx, 28, 34, 430, 210, 0.24 + 0.74 * s.lambda, s.lambda > 0.7 ? 'green' : s.lambda < 0.3 ? 'red' : 'blue');
      const bpp = 0.04 + 0.96 * s.lambda;
      const psnr = 24 + 14 * s.lambda;
      ctx.fillStyle = C.axis;
      ctx.fillRect(520, 40, 500, 170);
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const t = i / 80;
        const px = 520 + t * 500;
        const py = 210 - (24 + 14 * t - 20) * 5.4;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 2;
      ctx.stroke();
      const dx = 520 + s.lambda * 500;
      const dy = 210 - (24 + 14 * s.lambda - 20) * 5.4;
      ctx.beginPath();
      ctx.arc(dx, dy, 9, 0, Math.PI * 2);
      ctx.fillStyle = C.orange;
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${psnr.toFixed(1)} dB · ${bpp.toFixed(2)} bpp`, 560, 234);
      ctx.fillText('码率 bpp →', 560, 62);
    }
  );
  const fb = feedback(
    state.lambda > 0.7
      ? '高 λ：愿意多花比特，重建更清晰。'
      : state.lambda < 0.3
      ? '低 λ：强烈压码率，细节被牺牲。'
      : '中间 λ：在清晰度与码率之间取平衡。',
    state.lambda > 0.7 ? 'good' : state.lambda < 0.3 ? 'bad' : ''
  );
  return (
    <div>
      <canvas ref={ref} width={MW} height={MH} />
      <div className="ctrl">
        <label>
          λ 权重 <span className="val">{state.lambda.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(state.lambda * 100)}
          onChange={(e) => update({ lambda: Number(e.target.value) / 100 })}
        />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}

function Module51() {
  const modes = ['none', 'hyper', 'spatial', 'channel', 'scctx'] as const;
  const sigma = { none: 90, hyper: 66, spatial: 50, channel: 42, scctx: 26 } as const;
  const bits = { none: 1.0, hyper: 0.82, spatial: 0.7, channel: 0.58, scctx: 0.42 } as const;
  const { ref, state, update } = useStatefulCanvas(
    MW,
    MH,
    { mode: 'none' as (typeof modes)[number] },
    (ctx, _t, s) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, MW, MH);
      ctx.fillStyle = C.axis;
      ctx.fillRect(80, 220, 500, 4);
      drawGaussian(ctx, 330, 220, 150, sigma[s.mode]);
      ctx.fillStyle = s.mode === 'scctx' ? C.green : s.mode === 'none' ? C.red : C.blue;
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('预测概率分布（越窄越确定）', 80, 54);
      ctx.fillText('省下的码率', 700, 54);
      drawBars(ctx, 700, 160, 300, 60, [{ v: 1 - bits[s.mode], color: s.mode === 'scctx' ? C.green : C.blue, label: `${Math.round((1 - bits[s.mode]) * 100)}%` }], 1);
    }
  );
  const fbText: Record<string, string> = {
    none: '没有上下文：概率分布最宽，每个符号都要花更多比特。',
    hyper: '超先验提供全局先验，分布收窄一档。',
    spatial: '空间上下文利用邻居，进一步收窄分布。',
    channel: '通道条件利用前部通道，分布更集中。',
    scctx: 'SCCTX 联合空间与通道上下文，分布最窄、最省比特。',
  };
  const fb = feedback(fbText[state.mode], state.mode === 'scctx' ? 'good' : state.mode === 'none' ? 'bad' : '');
  return (
    <div>
      <canvas ref={ref} width={MW} height={MH} />
      <div className="chip-row">
        {[
          ['none', '无上下文'],
          ['hyper', '超先验'],
          ['spatial', '空间上下文'],
          ['channel', '通道条件'],
          ['scctx', 'SCCTX'],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`chip ${state.mode === id ? 'selected' : ''}`}
            onClick={() => update({ mode: id as (typeof modes)[number] })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}

function Module61() {
  const { ref, state, update } = useStatefulCanvas(
    MW,
    MH,
    { k: 0 },
    (ctx, _t, s) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, MW, MH);
      drawPhoto(ctx, 28, 34, 420, 210, s.k === 0 ? 0.12 : 0.2 + (s.k / 5) * 0.8, s.k >= 5 ? 'green' : 'blue');
      const counts = [16, 16, 32, 64, 192];
      let x = 500;
      counts.forEach((c, i) => {
        const w = 80 + (c / 192) * 70;
        roundRect(ctx, x, 110, w - 8, 70, 6);
        ctx.fillStyle = i < s.k ? C.green : C.env;
        ctx.fill();
        ctx.fillStyle = C.ink;
        ctx.font = '17px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(c), x + (w - 8) / 2, 150);
        x += w;
      });
      ctx.fillStyle = C.ink;
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('已解码通道组', 500, 54);
    }
  );
  const fb = feedback(
    state.k === 0
      ? '还未解码任何通道：图像不可见。'
      : state.k === 1
      ? '前 16 个通道：结构轮廓已经出现。'
      : state.k < 5
      ? `已解码 ${state.k} 组：色彩与高频细节逐步补齐。`
      : '全部 5 组解码完成：完整重建。',
    state.k >= 5 ? 'good' : ''
  );
  return (
    <div>
      <canvas ref={ref} width={MW} height={MH} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => update({ k: Math.max(0, state.k - 1) })}>
          上一步
        </button>
        <span className="step-label">
          <b>{state.k}</b> / 5
        </span>
        <button className="tiny" onClick={() => update({ k: Math.min(5, state.k + 1) })}>
          下一步
        </button>
        <button className="tiny ghost" onClick={() => update({ k: 0 })}>
          重置
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}

function Module71() {
  const { ref, state, update } = useStatefulCanvas(
    MW,
    MH,
    { stage: 0 },
    (ctx, _t, s) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, MW, MH);
      const loss = [1, 0.72, 0.52, 0.44][s.stage];
      ctx.fillStyle = C.axis;
      ctx.fillRect(80, 40, 500, 170);
      ctx.beginPath();
      [0, 1, 2, 3].forEach((i, idx) => {
        const px = 80 + (i / 3) * 500;
        const py = 210 - [1, 0.72, 0.52, 0.44][i] * 130;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.stroke();
      const px = 80 + (s.stage / 3) * 500;
      const py = 210 - loss * 130;
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fillStyle = C.orange;
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('训练损失', 80, 54);
      ctx.fillText(['准备', '主训练', '微调', '完成'][s.stage], 680, 130);
    }
  );
  const fb = feedback(
    [
      '初始：低码率模型先用 λ=0.015 预热。',
      '主训练：均匀噪声 + STE(y)，可用快速的一次性编码。',
      '微调：切换 STE(y−μ)+μ，让合成器与上下文数值对齐。',
      '训练完成：损失下降，BD-Rate 收敛。',
    ][state.stage],
    state.stage === 3 ? 'good' : ''
  );
  return (
    <div>
      <canvas ref={ref} width={MW} height={MH} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => update({ stage: Math.max(0, state.stage - 1) })}>
          上一步
        </button>
        <span className="step-label">
          <b>{state.stage + 1}</b> / 4
        </span>
        <button className="tiny" onClick={() => update({ stage: Math.min(3, state.stage + 1) })}>
          下一步
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}

const archNodes = [
  { id: 'analysis', name: '分析变换', x: 90, y: 100, w: 150, h: 66, color: C.red },
  { id: 'hyper', name: '超先验', x: 300, y: 30, w: 150, h: 66, color: C.purple },
  { id: 'scctx', name: 'SCCTX', x: 300, y: 150, w: 180, h: 66, color: C.blue },
  { id: 'entropy', name: '熵参数', x: 540, y: 150, w: 150, h: 66, color: C.orange },
  { id: 'synthesis', name: '合成变换', x: 760, y: 100, w: 160, h: 66, color: C.green },
] as const;

function Module81() {
  const { ref, state, update } = useStatefulCanvas(
    MW,
    MH,
    { sel: 'analysis' as (typeof archNodes)[number]['id'] },
    (ctx, _t, s) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, MW, MH);
      const edges: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 4]];
      edges.forEach(([a, b]) => {
        const from = archNodes[a];
        const to = archNodes[b];
        ctx.beginPath();
        ctx.moveTo(from.x + from.w, from.y + from.h / 2);
        ctx.lineTo(to.x, to.y + to.h / 2);
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 3;
        ctx.stroke();
      });
      archNodes.forEach((n) => {
        roundRect(ctx, n.x, n.y, n.w, n.h, 8);
        ctx.fillStyle = n.id === s.sel ? n.color : C.bg;
        ctx.fill();
        ctx.lineWidth = n.id === s.sel ? 4 : 2;
        ctx.strokeStyle = n.color;
        ctx.stroke();
        ctx.fillStyle = n.id === s.sel ? '#fff' : C.ink;
        ctx.font = '22px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.name, n.x + n.w / 2, n.y + n.h / 2 + 8);
      });
      ctx.fillStyle = C.ink;
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('x', 40, 60);
      ctx.fillText('x̂', 940, 60);
    }
  );
  const info: Record<string, string> = {
    analysis: '分析变换：用可堆叠残差瓶颈块把像素 x 映射为潜变量 ŷ，替代 GDN。',
    hyper: '超先验：从潜变量提取边信息 ẑ，给熵模型提供全局先验。',
    scctx: 'SCCTX：联合空间上下文与通道条件，编码时用已解码符号预测概率。',
    entropy: '熵参数：由 SCCTX 与超先验拼接后预测均值 μ 与方差 σ。',
    synthesis: '合成变换：把编码符号 ŷ 重建回图像 x̂，同样采用残差块。',
  };
  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * MW;
    const y = ((e.clientY - rect.top) / rect.height) * MH;
    const hitNode = archNodes.find((n) => x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h);
    if (hitNode) update({ sel: hitNode.id });
  };
  return (
    <div>
      <canvas ref={ref} width={MW} height={MH} onPointerDown={hit} />
      <div className="chip-row">
        {archNodes.map((n) => (
          <button
            key={n.id}
            className={`chip ${state.sel === n.id ? 'selected' : ''}`}
            onClick={() => update({ sel: n.id })}
          >
            {n.name}
          </button>
        ))}
      </div>
      <div className="feedback">{info[state.sel]}</div>
    </div>
  );
}

function Module91() {
  const startRef = useRef<number | null>(null);
  const [done, setDone] = useState(false);
  const { ref, state, update } = useStatefulCanvas(
    MW,
    MH,
    { running: false },
    (ctx, t, s) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, MW, MH);
      const elapsed = s.running && startRef.current !== null ? t - startRef.current : 0;
      const thumb = ease(Math.min(elapsed / 300, 1));
      const full = ease(Math.min(elapsed / 1800, 1));
      drawPhoto(ctx, 40, 40, 450, 190, 0.25 + 0.65 * thumb, thumb >= 1 ? 'green' : 'blue');
      drawPhoto(ctx, 570, 40, 450, 190, 0.25 + 0.65 * full, full >= 1 ? 'green' : 'blue');
      ctx.fillStyle = C.ink;
      ctx.font = '24px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('缩略图预览', 40, 28);
      ctx.fillText('全分辨率解码', 570, 28);
      if (thumb >= 1) {
        ctx.fillStyle = C.green;
        ctx.fillText('3 μs 完成', 350, 60);
      }
      if (full >= 1) {
        ctx.fillStyle = C.red;
        ctx.fillText('40 ms 完成', 880, 60);
      }
    }
  );
  const start = () => {
    setDone(false);
    startRef.current = performance.now();
    update({ running: true });
    window.setTimeout(() => setDone(true), 1900);
  };
  const fb = feedback(
    !state.running
      ? '点击开始，观察两种解码在同一时间尺度上的速度差异。'
      : done
      ? '缩略图合成器约 3 微秒完成，比全解码快 12 倍以上。'
      : '对比进行中，缩略图预览几乎瞬间完成。',
    done ? 'good' : ''
  );
  return (
    <div>
      <canvas ref={ref} width={MW} height={MH} />
      <div className="chip-row">
        <button className="tiny" onClick={start}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}

function Module101() {
  const startRef = useRef<number | null>(null);
  const [done, setDone] = useState(false);
  const { ref, state, update } = useStatefulCanvas(
    MW,
    MH,
    { running: false },
    (ctx, t, s) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, MW, MH);
      const elapsed = s.running && startRef.current !== null ? t - startRef.current : 0;
      const k = ease(Math.min(elapsed / 1400, 1));
      const rows = [
        { name: 'ELIC', bd: -7.88, lat: 49.16, color: C.green },
        { name: 'Minnen2020', bd: 1.11, lat: 65.75, color: C.red },
        { name: 'Cheng2020', bd: 3.89, lat: 53.01, color: C.blue },
        { name: 'VVC', bd: 0, lat: 0, color: C.axis },
      ];
      const baseX = 620;
      rows.forEach((r, i) => {
        const y = 40 + i * 56;
        ctx.fillStyle = C.ink;
        ctx.font = '22px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(r.name, 70, y + 24);
        const val = r.bd * k;
        const w = Math.abs(val) * 46;
        if (r.bd < 0) {
          ctx.fillStyle = r.color;
          ctx.fillRect(baseX - w, y, w, 34);
        } else {
          ctx.fillStyle = r.color;
          ctx.fillRect(baseX, y, w, 34);
        }
        ctx.fillStyle = C.ink;
        ctx.textAlign = 'left';
        ctx.fillText(r.bd === 0 ? '0.00%' : val.toFixed(2) + '%', baseX + (r.bd < 0 ? -w - 8 : w + 8), y + 24);
        ctx.fillStyle = C.muted;
        ctx.fillText(r.lat > 0 ? `${r.lat} ms` : '—', 880, y + 24);
      });
      ctx.fillStyle = C.ink;
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('PSNR BD-Rate（越低越好）', 70, 28);
      ctx.fillText('解码延迟', 880, 28);
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(baseX, 28);
      ctx.lineTo(baseX, 250);
      ctx.stroke();
    }
  );
  const start = () => {
    setDone(false);
    startRef.current = performance.now();
    update({ running: true });
    window.setTimeout(() => setDone(true), 1500);
  };
  const fb = feedback(
    !state.running
      ? '点击开始，基于论文 Table 2 的 Kodak 数据展开对比。'
      : done
      ? 'ELIC 以更低延迟拿到更低的 BD-Rate，同时优于同类的可学习方法。'
      : '对比动画进行中。',
    done ? 'good' : ''
  );
  return (
    <div>
      <canvas ref={ref} width={MW} height={MH} />
      <div className="chip-row">
        <button className="tiny" onClick={start}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}

const modules: Record<string, React.FC> = {
  '1.1': Module11,
  '2.1': Module21,
  '3.1': Module31,
  '3.2': Module32,
  '4.1': Module41,
  '5.1': Module51,
  '6.1': Module61,
  '7.1': Module71,
  '8.1': Module81,
  '9.1': Module91,
  '10.1': Module101,
};

export const ElicWidget: React.FC<WidgetProps> = ({ moduleId }) => {
  const M = modules[moduleId] || Module11;
  return <M />;
};
