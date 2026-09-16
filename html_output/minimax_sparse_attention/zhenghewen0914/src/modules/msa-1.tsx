import React, { useRef, useState } from 'react';
import { Scene, C, book, pen, label, rounded, Feedback, Stat } from './hero-old';

const pairs = (n: number) => n * (n + 1) / 2;
const formatted = (n: number) => n.toLocaleString('zh-CN');

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function hatch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = C.neutral;
  ctx.lineWidth = 1.5;
  for (let offset = -h; offset < w + h; offset += 7) {
    ctx.beginPath();
    ctx.moveTo(x + offset, y + h);
    ctx.lineTo(x + offset + h, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function Msa1() {
  const [nPow, setNPow] = useState(0);
  const n = 32 * 2 ** nPow;
  const count = pairs(n);
  const draw = (ctx: CanvasRenderingContext2D) => {
    label(ctx, '资料册', 44, 43, C.blue);
    label(ctx, '因果配对', 414, 43, C.blue);
    for (let layer = nPow + 1; layer >= 0; layer--) {
      rounded(ctx, 58, 88 + layer * 9, 267, 103, C.paper, C.neutral);
    }
    book(ctx, 44, 73, 289, 119, C.blue);
    const strokes = 3 + nPow;
    for (let j = 0; j < strokes; j++) {
      ctx.strokeStyle = j === strokes - 1 ? C.orange : C.neutral;
      ctx.lineWidth = j === strokes - 1 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(65, 98 + j * 9);
      ctx.lineTo(167, 98 + j * 9);
      ctx.stroke();
    }
    label(ctx, `N = ${n}`, 122, 249, C.text);
    const left = 428, right = 1023, top = 62, bottom = 218;
    const xAt = (value: number) => left + ((value - 32) / (1024 - 32)) * (right - left);
    const yAt = (value: number) => bottom - (pairs(value) / pairs(1024)) * (bottom - top);
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5;
    for (let r = 0; r <= 4; r++) {
      const y = bottom - (bottom - top) * r / 4;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.lineTo(right, bottom); ctx.stroke();
    const path = (end: number, color: string, width: number) => {
      ctx.beginPath();
      for (let value = 32; value < end; value += 4) {
        if (value === 32) ctx.moveTo(xAt(value), yAt(value));
        else ctx.lineTo(xAt(value), yAt(value));
      }
      ctx.lineTo(xAt(end), yAt(end)); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
    };
    path(1024, C.neutral, 2);
    path(n, C.blue, 4);
    [32, 128, 256, 512, 1024].forEach((value) => {
      dot(ctx, xAt(value), yAt(value), 3, C.neutral);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = C.text;
      ctx.textAlign = 'center'; ctx.fillText(String(value), xAt(value), 243);
    });
    ctx.textAlign = 'left';
    dot(ctx, xAt(n), yAt(n), 9, C.paper);
    dot(ctx, xAt(n), yAt(n), 6, C.orange);
    label(ctx, formatted(count), Math.min(xAt(n) + 12, 920), Math.max(yAt(n) - 14, 54), C.text);
  };
  return <div>
    <Scene draw={draw} label={`长度 ${n}，因果配对 ${count}；教学模拟`} />
    <div className="ctrl">
      <label htmlFor="msa-context-scale">上下文倍数 <span className="val">{2 ** nPow}×</span></label>
      <input id="msa-context-scale" type="range" min={0} max={5} step={1} value={nPow} onChange={e => setNPow(Number(e.target.value))} onKeyDown={e => { if (e.key.startsWith('Arrow')) e.stopPropagation(); }} aria-valuetext={`${n} 个位置，${count} 次因果配对`} />
      <button type="button" className="tiny ghost" onClick={() => setNPow(0)}>重置</button>
    </div>
    <div className="metrics">
      <Stat label="上下文长度 N" value={formatted(n)} />
      <Stat label="因果配对数" value={formatted(count)} />
      <Stat label="相对 N=32 的配对数" value={`${(count / pairs(32)).toFixed(2)}×`} />
    </div>
    <Feedback tone={nPow === 0 ? 'blue' : 'green'}>{nPow === 0 ? '32 个位置需要 528 次因果配对。' : `${n} 个位置需要 ${formatted(count)} 次因果配对。长度翻倍，配对数接近四倍。GQA 共享 KV 仍保留这项成本。`}</Feedback>
  </div>;
}

export function Msa2() {
  const [query, setQuery] = useState(23);
  const dragging = useRef(false);
  const current = Math.floor(query / 4);
  const futureLocal = current * 4 + 3 - query;
  const updateFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - bounds.left) / bounds.width * 1080;
    const position = x < 360 ? Math.round((x - 63) / 258 * 31) : Math.floor((x - 414) / 19.25);
    setQuery(Math.max(0, Math.min(31, position)));
  };
  const pointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    updateFromPointer(e);
    e.preventDefault();
  };
  const pointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const keyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      if (e.key === 'Home') setQuery(0);
      else if (e.key === 'End') setQuery(31);
      else setQuery(q => Math.max(0, Math.min(31, q + (e.key === 'ArrowRight' ? 1 : -1))));
    }
  };
  const draw = (ctx: CanvasRenderingContext2D) => {
    label(ctx, '当前查询', 45, 42, C.blue);
    label(ctx, '同组共享', 411, 177, C.blue);
    book(ctx, 40, 69, 298, 128, C.neutral);
    const bookmark = 63 + query / 31 * 258;
    ctx.fillStyle = C.orange;
    ctx.beginPath(); ctx.moveTo(bookmark - 8, 56); ctx.lineTo(bookmark + 8, 56); ctx.lineTo(bookmark + 8, 115); ctx.lineTo(bookmark, 107); ctx.lineTo(bookmark - 8, 115); ctx.closePath(); ctx.fill();
    label(ctx, `i = ${query}`, 115, 235, C.text);
    for (let b = 0; b < 8; b++) {
      const x = 407 + b * 77;
      ctx.lineWidth = b === current ? 3 : 1;
      rounded(ctx, x, 56, 74, 87, C.paper, b === current ? C.orange : C.axis);
      for (let t = 0; t < 4; t++) {
        const j = b * 4 + t, tx = 414 + j * 19.25;
        const visible = j <= query;
        rounded(ctx, tx, 74, 14, 36, visible ? (j === query ? C.blue : C.neutral) : C.bg);
        if (!visible) hatch(ctx, tx, 74, 14, 36);
        if (j === query) {
          ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.strokeRect(tx - 2, 72, 18, 40);
          dot(ctx, tx + 7, 65, 4, C.orange);
        }
      }
      ctx.font = '17px sans-serif'; ctx.fillStyle = C.text; ctx.textAlign = 'center'; ctx.fillText(String(b), x + 37, 133);
    }
    ctx.textAlign = 'left';
    for (let head = 0; head < 4; head++) {
      const hx = 514 + head * 85;
      ctx.strokeStyle = C.axis; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(hx + 26, 212); ctx.lineTo(893, 233); ctx.stroke();
    }
    for (let head = 0; head < 4; head++) {
      const hx = 514 + head * 85;
      rounded(ctx, hx, 188, 55, 36, C.paper, C.blue);
      label(ctx, `Q${head}`, hx + 9, 212, C.blue);
    }
    rounded(ctx, 891, 214, 131, 40, C.paper, C.green);
    label(ctx, 'K / V', 927, 241, C.green);
  };
  return <div>
    <Scene draw={draw} tabIndex={0} label={`拖动书签或按左右键调整查询。当前位置 ${query}，可见 ${query + 1} 个 token，当前块有 ${futureLocal} 个未来 token 被遮蔽。教学模拟。`} onPointerDown={pointerDown} onPointerMove={e => { if (dragging.current) updateFromPointer(e); }} onPointerUp={pointerUp} onKeyDown={keyDown} />
    <div className="step-ctrl">
      <button type="button" className="tiny" disabled={query === 0} onClick={() => setQuery(q => q - 1)}>← 前一位置</button>
      <span className="step-label">查询 i = <b>{query}</b></span>
      <button type="button" className="tiny" disabled={query === 31} onClick={() => setQuery(q => q + 1)}>后一位置 →</button>
      <button type="button" className="tiny ghost" onClick={() => setQuery(23)}>重置</button>
    </div>
    <div className="metrics">
      <Stat label="可见 token" value={`${query + 1} / 32`} />
      <Stat label="当前块编号" value={String(current)} />
      <Stat label="当前块中未来 token" value={String(futureLocal)} />
    </div>
    <Feedback tone="blue">位置 i={query}；可见 {query + 1} 个 token，本地块还有 {futureLocal} 个未来 token 被遮蔽。因果约束：不能读取未来。</Feedback>
  </div>;
}

const toyScores = [0.2, 0.3, 0.8, 0.1, 1.2, 2.8, 0.1, 0.2, 0.3, 0.5, 0.4, 0.1, 3.2, 0.2, 0.1, 0.5, 0.1, 0.3, 0.2, 0.4, 2.3, 0.5, 0.1, 0.1, 0.4, 0.2, 0.1, 0.3, -0.2, -0.1];
const toyBlockScores = Array.from({ length: 8 }, (_, b) => Math.max(...toyScores.slice(b * 4, b * 4 + 4)));
const toySelected = [...toyBlockScores.map((score, b) => ({ score, b })).filter(item => item.b !== 7).sort((a, b) => b.score - a.score || a.b - b.b).slice(0, 2).map(item => item.b), 7].sort((a, b) => a - b);
const stageNames = ['token 分数', '块内 max', '选择 3 块', '交给主分支'];
const stageFeedback = [
  '先对每个因果可见 token 计算索引分数；未来位置 30、31 不参与。',
  '局部最大值决定块分数。块 3 得分 3.2；当前块 7 只在两个可见 token 中取 max，得到 −0.1。',
  '当前块占 1 名额，另选 2 块。块 3、块 1 的分数最高，与当前块 7 共同形成 I={1,3,7}。',
  '选中块内的可见 token 进入主分支：4–7、12–15、28–29，共 10 个。当前块的未来位置依然遮蔽。',
];

export function Msa3() {
  const [step, setStep] = useState(0);
  const draw = (ctx: CanvasRenderingContext2D) => {
    label(ctx, '证据名单', 45, 42, C.blue);
    label(ctx, '索引分数', 410, 42, C.blue);
    book(ctx, 40, 70, 298, 140, C.neutral);
    for (let b = 0; b < 8; b++) {
      const bx = b < 4 ? 62 : 214;
      const by = 88 + (b % 4) * 26;
      const selected = step >= 2 && toySelected.includes(b);
      rounded(ctx, bx, by, 96, 18, selected ? C.green : C.bg, b === 7 ? C.orange : C.axis);
      ctx.font = '14px sans-serif'; ctx.fillStyle = selected ? C.paper : C.text; ctx.fillText(String(b), bx + 5, by + 14);
    }
    if (step > 0) pen(ctx, 145, 142, -0.45, C.orange);
    label(ctx, step >= 2 ? 'I = {1, 3, 7}' : 'I = ?', 93, 244, C.text);
    for (let b = 0; b < 8; b++) {
      const x = 408 + b * 80;
      const selected = step >= 2 && toySelected.includes(b);
      ctx.lineWidth = selected ? 3 : 1;
      rounded(ctx, x, 55, 74, 119, C.paper, selected ? (b === 7 ? C.orange : C.green) : C.axis);
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 5, 137); ctx.lineTo(x + 69, 137); ctx.stroke();
      for (let t = 0; t < 4; t++) {
        const j = b * 4 + t, sx = x + 7 + t * 16;
        const score = toyScores[j];
        if (j >= 30) { rounded(ctx, sx, 72, 12, 62, C.bg); hatch(ctx, sx, 72, 12, 62); continue; }
        const h = Math.max(3, Math.abs(score) * 20);
        const fill = step === 3 && selected ? C.green : (step >= 1 && score === toyBlockScores[b] ? C.blue : C.neutral);
        rounded(ctx, sx, score >= 0 ? 137 - h : 139, 12, h, fill);
      }
      ctx.font = '16px sans-serif'; ctx.fillStyle = C.text; ctx.textAlign = 'center'; ctx.fillText(String(b), x + 37, 164);
      rounded(ctx, x, 186, 74, 38, selected ? C.green : C.paper, b === 7 && step >= 2 ? C.orange : C.axis);
      ctx.fillStyle = selected ? C.paper : C.text;
      ctx.font = '19px sans-serif'; ctx.fillText(step >= 1 ? toyBlockScores[b].toFixed(1) : '?', x + 37, 212);
      if (step >= 2 && selected) {
        ctx.fillStyle = C.green; ctx.font = '18px sans-serif'; ctx.fillText(b === 7 ? '2' : '4', x + 37, 253);
      }
    }
    ctx.textAlign = 'left';
  };
  return <div>
    <Scene draw={draw} label={`Top-k 教学模拟，第 ${step + 1} 步：${stageNames[step]}。${stageFeedback[step]}`} />
    <div className="step-ctrl">
      <button type="button" className="tiny ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>上一步</button>
      <span className="step-label"><b>{step + 1}</b> / 4 · {stageNames[step]}</span>
      <button type="button" className="tiny" disabled={step === 3} onClick={() => setStep(s => s + 1)}>下一步</button>
      <button type="button" className="tiny ghost" onClick={() => setStep(0)}>重置</button>
    </div>
    <Feedback tone={step >= 2 ? 'green' : 'blue'}>{stageFeedback[step]}</Feedback>
    <details>
      <summary>查看当前阶段的教学分数表</summary>
      <table className="paper">
        <caption>教学模拟，非论文实测 · i=29，Bk=4，k=3（含当前块）</caption>
        <thead><tr><th scope="col">块</th><th scope="col">可见 token 分数</th><th scope="col">块内 max</th><th scope="col">当前状态</th></tr></thead>
        <tbody>{toyBlockScores.map((score, b) => <tr key={b}>
          <th scope="row">{b}{b === 7 ? '（当前）' : ''}</th>
          <td>{toyScores.slice(b * 4, b * 4 + 4).map(s => s.toFixed(1)).join(' · ')}{b === 7 ? '；30、31 遮蔽' : ''}</td>
          <td>{step >= 1 ? score.toFixed(1) : '尚未计算'}</td>
          <td>{step < 2 ? '尚未选块' : toySelected.includes(b) ? step === 3 ? `${b === 7 ? 2 : 4} 个可见 token 进入主分支` : b === 7 ? '强制保留，占 1 名额' : '按分数选中' : '未选中'}</td>
        </tr>)}</tbody>
      </table>
    </details>
  </div>;
}
