import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvasBox, useStageLoop } from '../lib/hooks';
import { C, FONT_SANS, FONT_MONO } from '../lib/palette';
import { Btn, Feedback, Seg } from '../ui/kit';
import { pyRound } from '../lib/maxmin';

// 1.1 分步演示：图像 → CLIP → 投影层 →（DivPrune）→ 拼接 → 预填充 → 逐词解码。
// 数字来源：视觉 token 数（论文 §4.1 / 代码 tflops.py）、维度与层数（tflops.py）。
// 问题长度取代码中各数据集平均文本长度的均值（图像 45、视频 69），仅作示意。

interface Preset {
  id: string;
  label: string;
  M: number;
  Mnote: string;
  d: number;
  T: number;
  N: number;
  r: number;
  prefix: number | null;
  input: string;
  enc: string;
}

const PRESETS: Preset[] = [
  { id: 'a', label: 'LLaVA 1.5-7B', M: 576, Mnote: '24×24 = 576', d: 4096, T: 32, N: 45, r: 0.098, prefix: 35, input: '一张图片（缩放到 336×336）', enc: 'CLIP 把图切成 24×24 个图块并编码，得到 576 个特征' },
  { id: 'b', label: 'LLaVA 1.5-13B', M: 576, Mnote: '24×24 = 576', d: 5120, T: 40, N: 45, r: 0.098, prefix: 35, input: '一张图片（缩放到 336×336）', enc: 'CLIP 把图切成 24×24 个图块并编码，得到 576 个特征' },
  { id: 'c', label: 'LLaVA 1.6-7B', M: 2096, Mnote: '平均约 2096（1598–2292）', d: 4096, T: 32, N: 45, r: 0.098, prefix: 35, input: '一张高分辨率图片，按分辨率切成多块', enc: '每一块分别编码后拼接；各数据集平均约 1598–2292 个特征' },
  { id: 'd', label: 'NeXT-Video-7B', M: 1152, Mnote: '8 帧 × 144 = 1152', d: 4096, T: 32, N: 69, r: 0.1, prefix: null, input: '一段视频，均匀抽取 8 帧', enc: '每帧编码为 144 个特征，8 帧共 1152 个' },
];

const STAGES = ['输入', '视觉编码器', '投影层', 'DivPrune', '拼接', '预填充', '逐词解码'];

export const Ch1Pipeline: React.FC<WidgetProps> = () => {
  const [pid, setPid] = useState('a');
  const [step, setStep] = useState(0);
  const [on, setOn] = useState(true);
  const p = PRESETS.find((x) => x.id === pid)!;
  const kept = p.M - pyRound((1 - p.r) * p.M);
  const vis = on ? kept : p.M;
  const pre = p.prefix ?? 0;
  const L = pre + vis + p.N;
  const Lfull = pre + p.M + p.N;

  // 关闭 DivPrune 时，“DivPrune”这一步被跳过
  const steps = useMemo(() => STAGES.map((_, i) => i).filter((i) => on || i !== 3), [on]);
  const si = Math.min(step, steps.length - 1);
  const stage = steps[si];

  const { wrapRef, canvasRef, w, h } = useCanvasBox((W) => (W < 560 ? 310 : 252));

  // 动画：每次切换步骤 / 模型 / 开关时重新计时；当前方框呼吸发光并有一道高光扫过，
  // 视觉 token 逐格亮起，剪枝时被剪掉的格子从后往前熄灭，序列条从左向右长出。
  const animRef = useRef({ since: 0, key: '' });
  useStageLoop(canvasRef, w, h, (ctx, t, dt) => {
    const a = animRef.current;
    const key = pid + ':' + on + ':' + stage;
    if (a.key !== key) {
      a.key = key;
      a.since = 0;
    }
    a.since += dt;
    const final = t > 900;
    const since = final ? 99 : a.since;
    const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    ctx.clearRect(0, 0, w, h);
    const vertical = w < 560;
    // 流水线方框
    const n = STAGES.length;
    const boxes: { x: number; y: number; bw: number; bh: number }[] = [];
    if (!vertical) {
      const gap = 8;
      const bw = (w - gap * (n - 1)) / n;
      for (let i = 0; i < n; i++) boxes.push({ x: i * (bw + gap), y: 10, bw, bh: 54 });
    } else {
      const cols = 4;
      const gap = 6;
      const bw = (w - gap * (cols - 1)) / cols;
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / cols);
        const cc = i % cols;
        boxes.push({ x: cc * (bw + gap), y: 8 + r * 60, bw, bh: 50 });
      }
    }
    STAGES.forEach((name, i) => {
      const b = boxes[i];
      const isDiv = i === 3;
      const disabled = isDiv && !on;
      const active = i === stage;
      const passed = steps.indexOf(i) >= 0 && steps.indexOf(i) < si;
      ctx.save();
      if (active) {
        ctx.shadowColor = isDiv ? C.verm : C.cobalt;
        ctx.shadowBlur = final ? 12 : 10 + 8 * Math.sin(t * 3);
      }
      ctx.lineWidth = active ? 2 : 1;
      ctx.setLineDash(isDiv ? [5, 4] : []);
      ctx.fillStyle = active ? (isDiv ? C.vermSoft : C.cobaltSoft) : passed ? '#eef2fb' : C.paper;
      ctx.strokeStyle = disabled ? C.faint : active ? (isDiv ? C.verm : C.cobalt) : isDiv ? C.verm : C.rule;
      ctx.beginPath();
      ctx.roundRect(b.x + 0.5, b.y + 0.5, b.bw - 1, b.bh - 1, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.setLineDash([]);
      if (active && !final) {
        // 高光扫过当前方框
        const sx = b.x + ((since * 0.9) % 1.6) * b.bw - 0.3 * b.bw;
        const sg = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0);
        sg.addColorStop(0, 'rgba(255,255,255,0)');
        sg.addColorStop(0.5, 'rgba(59,91,255,0.10)');
        sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(b.x + 0.5, b.y + 0.5, b.bw - 1, b.bh - 1, 8);
        ctx.clip();
        ctx.fillStyle = sg;
        ctx.fillRect(b.x, b.y, b.bw, b.bh);
        ctx.restore();
      }
      ctx.fillStyle = disabled ? C.faint : active ? (isDiv ? C.vermD : C.cobaltD) : C.ink2;
      ctx.font = `600 ${vertical ? 12 : 13}px ${FONT_SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText(name, b.x + b.bw / 2, b.y + b.bh / 2 - 2);
      ctx.font = `500 11px ${FONT_MONO}`;
      ctx.fillStyle = disabled ? C.faint : C.muted;
      ctx.fillText(disabled ? '已关闭' : `${i + 1}`, b.x + b.bw / 2, b.y + b.bh / 2 + 14);
      ctx.textAlign = 'left';
    });

    // 序列条：前缀 | 视觉 | 问题
    const top = vertical ? 140 : 96;
    const barW = w;
    const scale = barW / Lfull;
    const segs = [
      { n: pre, color: C.faint, name: p.prefix === null ? '前缀（未公开）' : `前缀 ${pre}` },
      { n: vis, color: on && stage >= 3 ? C.verm : C.cobalt, name: `视觉 ${vis}` },
      { n: p.N, color: C.ink2, name: `问题 ≈${p.N}` },
    ];
    const showSeq = stage >= 4;
    ctx.font = `600 12px ${FONT_SANS}`;
    ctx.fillStyle = C.muted;
    ctx.fillText(showSeq ? `送入 LLM 的序列：长度 μ = ${L}${on ? `（不剪枝时为 ${Lfull}）` : ''}` : stage >= 1 ? `视觉 token：${stage >= 3 && on ? `${p.M} → ${kept}` : p.M}` : '等待编码…', 0, top - 8);
    if (showSeq) {
      let x = 0;
      const grow = stage === 4 ? ease(since / 0.8) : 1;
      for (const sg of segs) {
        const ww = Math.max(sg.n > 0 ? 3 : 0, sg.n * scale);
        const vis2 = Math.max(0, Math.min(ww, grow * barW - x));
        ctx.save();
        ctx.shadowColor = sg.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = sg.color;
        ctx.fillRect(x, top, vis2, 22);
        ctx.restore();
        x += ww;
      }
      // 被剪掉的部分（虚框）
      if (on) {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = C.faint;
        ctx.strokeRect(x + 0.5, top + 0.5, (Lfull - L) * scale - 1, 21);
        ctx.setLineDash([]);
      }
      // 图例
      let lx = 0;
      const ly = top + 42;
      for (const sg of segs) {
        ctx.fillStyle = sg.color;
        ctx.fillRect(lx, ly - 9, 10, 10);
        ctx.fillStyle = C.ink2;
        ctx.fillText(sg.name, lx + 14, ly);
        lx += ctx.measureText(sg.name).width + 30;
      }
    } else if (stage >= 1) {
      // 视觉 token 的数量示意：剪枝后只按“个数”着色，不表示被选中的位置
      const cols = 48;
      const pruned = stage >= 3 && on;
      const cell = Math.min(10, (w - 4) / cols);
      const shown = Math.min(p.M, 576);
      // M > 576 时每格代表 M/576 个 token，按比例着色
      const keepCells = Math.round((kept * shown) / p.M);
      for (let i = 0; i < shown; i++) {
        const r = Math.floor(i / cols);
        const c2 = i % cols;
        const keep = !pruned || i < keepCells;
        // 进入编码步：逐格亮起；进入剪枝步：被剪掉的格子从后往前熄灭，保留的格子由蓝转红
        const appear = stage === 1 ? ease((since - (i / shown) * 0.7) / 0.25) : 1;
        const fadeK = stage === 3 && on ? ease((since - ((shown - i) / shown) * 0.7) / 0.3) : 1;
        ctx.globalAlpha = appear;
        ctx.fillStyle = keep ? (pruned ? C.verm : C.cobalt) : '#dfe5f1';
        if (pruned && fadeK < 1) ctx.fillStyle = keep ? C.verm : C.cobalt;
        ctx.fillRect(c2 * cell, top + r * cell, cell - 1.5, cell - 1.5);
        if (pruned && fadeK < 1 && !keep) {
          ctx.globalAlpha = fadeK;
          ctx.fillStyle = '#dfe5f1';
          ctx.fillRect(c2 * cell, top + r * cell, cell - 1.5, cell - 1.5);
        } else if (pruned && fadeK < 1 && keep) {
          ctx.globalAlpha = 1 - ease(since / 0.5);
          ctx.fillStyle = C.cobalt;
          ctx.fillRect(c2 * cell, top + r * cell, cell - 1.5, cell - 1.5);
        }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = C.muted;
      ctx.font = `500 11px ${FONT_SANS}`;
      const note = pruned ? `只表示数量（${kept} / ${p.M}）；哪些位置被选中见第 5、6 章` : p.M > 576 ? `每格约代表 ${(p.M / 576).toFixed(1)} 个 token（共约 ${p.M} 个）` : '';
      if (note) ctx.fillText(note, 0, top + Math.ceil(shown / cols) * cell + 14);
    }
  }, [stage, si, steps, on, p, kept, vis, L, Lfull, pre]);

  const text: Record<number, string> = {
    0: `${p.input}。`,
    1: `${p.enc}（${p.Mnote}）。`,
    2: `投影层把每个特征映射成 ${p.d} 维向量——这就是送入 LLM 的视觉 token。DivPrune 就在这些向量上计算余弦距离。`,
    3: `DivPrune 从 ${p.M} 个视觉 token 中选出 ${kept} 个（保留比例 r = ${p.r}，M̃ = round(r·M)）。只用视觉特征，不看问题文本。`,
    4: p.prefix === null
      ? `拼接：前缀 + ${vis} 个视觉 token + 约 ${p.N} 个问题 token。视频模型的 DivPrune 实现不在公开代码中，前缀长度未知。`
      : `拼接：35 个前缀 token（代码中硬编码的 SYS_TOKEN_LEN）+ ${vis} 个视觉 token + 约 ${p.N} 个问题 token，共 ${L} 个。`,
    5: `预填充：${p.T} 层解码器一次处理全部 ${L} 个 token 并写入 KV cache。${on ? `不剪枝时是 ${Lfull} 个，每层少处理 ${Lfull - L} 个。` : '打开 DivPrune 看看能省多少。'}`,
    6: `逐词解码：每一步生成 1 个 token，并读取 KV cache 中全部 ${L} 个 token 的缓存（Eq. (1)）。剪枝只在预填充时做一次，解码阶段直接沿用剪枝后的缓存。`,
  };

  return (
    <div className="w">
      <div className="ctl-row">
        <Seg label="模型" options={PRESETS.map((x) => ({ value: x.id, label: x.label }))} value={pid} onChange={(v) => setPid(v)} />
        <label className="sw">
          <input type="checkbox" checked={on} onChange={(e) => { setOn(e.target.checked); setStep(0); }} />
          <span className="sw-track" aria-hidden="true" />
          <span>启用 DivPrune</span>
        </label>
      </div>
      <div ref={wrapRef} className="cv">
        <canvas ref={canvasRef} role="img" aria-label={`流水线第 ${si + 1} 步：${STAGES[stage]}`} />
      </div>
      <div className="ctl-row">
        <Btn onClick={() => setStep(0)} label="回到第一步">⟲ 重置</Btn>
        <Btn onClick={() => setStep(Math.max(0, si - 1))} disabled={si === 0}>‹ 上一步</Btn>
        <span className="step-dots" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s} className={i === si ? 'on' : i < si ? 'done' : ''} />
          ))}
        </span>
        <Btn primary onClick={() => setStep(Math.min(steps.length - 1, si + 1))} disabled={si === steps.length - 1}>下一步 ›</Btn>
      </div>
      <Feedback tone={stage === 3 ? 'good' : 'info'}>
        <b>第 {si + 1} / {steps.length} 步 · {STAGES[stage]}：</b>
        {text[stage]}
      </Feedback>
    </div>
  );
};

export default Ch1Pipeline;
