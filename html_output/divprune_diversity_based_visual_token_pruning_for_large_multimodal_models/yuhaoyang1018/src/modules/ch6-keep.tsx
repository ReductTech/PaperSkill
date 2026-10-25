import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { prepCanvas, useCanvasBox, useTween } from '../lib/hooks';
import { C, FONT_MONO, FONT_SANS } from '../lib/palette';
import { Feedback, Seg, Slider } from '../ui/kit';
import { GRID, cachedDist, featDist, greedyMaxMin, makeScene, pyRound } from '../lib/maxmin';

// 6.2 保留个数 M̃ = int(round(r·M))（代码事实）+ 选择顺序 vs 送入 LLM 的顺序（教学示意图块图）。

const MS = [
  { v: 576, label: 'M = 576（LLaVA 1.5）' },
  { v: 1152, label: 'M = 1152（视频 8 帧）' },
  { v: 2225, label: 'M = 2225（LLaVA 1.6 · COCO 平均）' },
];

export const Ch6Keep: React.FC<WidgetProps> = () => {
  const [r, setR] = useState(0.098);
  const [M, setM] = useState(576);
  const [view, setView] = useState<'sel' | 'seq'>('sel');
  const kept = pyRound(r * M);
  const keptT = useTween(kept, 300);
  const patches = useMemo(() => makeScene(7), []);
  const d = useMemo(() => cachedDist(patches.length, featDist(patches, 'cos')), [patches]);
  const k576 = pyRound(r * 576);
  const order = useMemo(() => greedyMaxMin(patches.length, k576, d), [d, k576]);
  const sorted = useMemo(() => [...order].sort((a, b) => a - b), [order]);

  const { wrapRef, canvasRef, w, h } = useCanvasBox((W) => {
    const g = Math.min(W, 380);
    const per = Math.max(1, Math.floor(W / 22));
    return g + 34 + Math.ceil(k576 / per) * 22 + 10;
  });

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !w) return;
    const ctx = prepCanvas(c, w, h);
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const g = Math.min(w, 380);
    const cell = g / GRID;
    const gx = (w - g) / 2;
    const rank = new Map<number, number>();
    (view === 'sel' ? order : sorted).forEach((idx, i) => rank.set(idx, i + 1));
    for (let i = 0; i < patches.length; i++) {
      const p = patches[i];
      const x = gx + (i % GRID) * cell;
      const y = Math.floor(i / GRID) * cell;
      const on = rank.has(i);
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.globalAlpha = on ? 1 : 0.28;
      ctx.fillRect(x, y, cell - 0.6, cell - 0.6);
      ctx.globalAlpha = 1;
    }
    ctx.font = `700 ${Math.max(7, cell * 0.5)}px ${FONT_MONO}`;
    ctx.textAlign = 'center';
    for (const [idx, rk] of rank) {
      const x = gx + (idx % GRID) * cell;
      const y = Math.floor(idx / GRID) * cell;
      ctx.strokeStyle = C.vermD;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y + 0.75, cell - 2, cell - 2);
      if (cell >= 12 && rk <= 99) {
        ctx.fillStyle = C.ink;
        ctx.fillText(String(rk), x + cell / 2, y + cell * 0.66);
      }
    }
    ctx.textAlign = 'left';
    // 下方：送入 LLM 的序列条
    const sy = g + 26;
    ctx.font = `600 12px ${FONT_SANS}`;
    ctx.fillStyle = C.muted;
    ctx.fillText(view === 'sel' ? '按选择顺序排列（DivPrune 返回的 s）：' : '按位置排序后送入 LLM（keep_indexs.sort()）：', 0, sy - 8);
    const seq = view === 'sel' ? order : sorted;
    const per = Math.max(1, Math.floor(w / 22));
    seq.forEach((idx, i) => {
      const x = (i % per) * 22;
      const y = sy + Math.floor(i / per) * 22;
      const p = patches[idx];
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.fillRect(x, y, 19, 19);
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, 18, 18);
    });
  }, [w, h, patches, order, sorted, view, canvasRef]);

  const pruneRate = (1 - kept / M) * 100;
  const supp51 = 576 - pyRound(0.912 * 576);
  const REGION = ['天空', '太阳', '屋顶', '墙面', '树冠', '门', '树干', '草地'];
  const first = order.slice(0, 3).map((i) => `#${i}（${REGION[patches[i].region]}）`).join('、');
  const regionsCovered = new Set(order.map((i) => patches[i].region)).size;

  return (
    <div className="w">
      <div className="ctl-stack">
        <Slider label="SUBSET_RATIO（保留比例 r）" value={r} min={0.02} max={0.25} step={0.002} onChange={setR} display={r.toFixed(3)} />
        <Seg small label="视觉 token 总数 M" options={MS.map((m) => ({ value: m.v, label: m.label }))} value={M} onChange={setM} />
      </div>
      <div className="readouts">
        <div className="ro ro-verm"><span>M̃ = int(round(r · M))</span><b>{Math.round(keptT)}</b></div>
        <div className="ro"><span>剪枝率 1 − M̃/M</span><b>{pruneRate.toFixed(1)}%</b></div>
        <div className="ro ro-amber"><span>补充材料“剪枝率 91.2%”对应（M = 576）</span><b>{supp51}</b></div>
      </div>
      <div className="ctl-stack">
        <Seg label="查看顺序" options={[{ value: 'sel', label: '① 选择顺序' }, { value: 'seq', label: '② 送入 LLM 的顺序' }]} value={view} onChange={setView} />
      </div>
      <div ref={wrapRef} className="cv">
        <canvas ref={canvasRef} role="img" aria-label={`示意图块图：保留 ${k576} 个图块，当前显示${view === 'sel' ? '选择顺序' : '位置顺序'}`} />
      </div>
      <Feedback tone={Math.abs(r - 0.098) < 0.0011 ? 'good' : 'info'}>
        r = {r.toFixed(3)}、M = {M} 时保留 {kept} 个（代码第 153 行的 int(round(r·M))）。
        {Math.abs(r - 0.098) < 0.0011 ? ' 这正是论文实验使用的配置（LLaVA 1.5 保留 56 个）。' : ''}
        {view === 'sel'
          ? ` 图块上的编号是 DivPrune 的选择顺序（视觉段内 0 起始索引）：前三个是 ${first}。保留的 ${k576} 个图块覆盖了 8 类区域中的 ${regionsCovered} 类。`
          : ' 送入 LLM 前，代码把保留的位置从小到大排序：编号变成了从左上到右下的空间顺序，选择顺序本身被丢弃。'}
      </Feedback>
      <p className="w-note">图块图是程序生成的 24×24 示意场景（固定 576 个图块，特征为颜色向量），只用于展示选择与排序逻辑；上方的保留个数按代码公式对任意 M 计算。</p>
    </div>
  );
};

export default Ch6Keep;
