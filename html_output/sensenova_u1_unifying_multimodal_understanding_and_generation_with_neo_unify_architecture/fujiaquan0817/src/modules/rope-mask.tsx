import React, { useCallback, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearStudio, drawDesk, drawLabel, drawLegend, useObservedCanvas } from './studio-kit';

const W = 960;
const H = 560;
const MATRIX = { x: 508, y: 104, cell: 52 };

type TokenKind = 'text' | 'cleanImage' | 'noiseImage';
type Token = { label: string; kind: TokenKind; block?: 'clean' | 'noise' };

const tokens: Token[] = [
  { label: '前文0', kind: 'text' },
  { label: '前文1', kind: 'text' },
  { label: '净图0', kind: 'cleanImage', block: 'clean' },
  { label: '净图1', kind: 'cleanImage', block: 'clean' },
  { label: '图后文', kind: 'text' },
  { label: '噪图0', kind: 'noiseImage', block: 'noise' },
  { label: '噪图1', kind: 'noiseImage', block: 'noise' },
];

const kindNames: Record<TokenKind, string> = { text: '文本', cleanImage: '干净图像', noiseImage: '噪声图像' };
const kindColors: Record<TokenKind, string> = { text: C.current, cleanImage: C.success, noiseImage: C.aux };

function isAllowedForRow(query: number, key: number) {
  const source = tokens[query];
  const target = tokens[key];
  if (source.kind === 'text') return key <= query && target.kind !== 'noiseImage';
  if (source.kind === 'cleanImage') return (target.kind === 'text' && key < 2) || target.block === 'clean';
  return target.kind !== 'noiseImage' || target.block === 'noise';
}

function ruleText(query: number) {
  if (query < 2) return '当前是前文：只按因果顺序读取已经出现的前文；后面的图像与噪声均不可见。';
  if (query === 4) return '当前是图后文本：可读取此前前文与干净图像，但不能读取后面的噪声。';
  if (tokens[query].kind === 'cleanImage') return '读取此前文本 + 同一干净图像块；同块内部双向可见。';
  return '读取全部干净上下文 + 同一噪声图像块；同块内部双向可见。';
}

function roundedCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = C.white;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke();
}

export const RopeMask: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [query, setQuery] = useState(4);
  const [focusedKey, setFocusedKey] = useState<number | null>(null);
  const allowed = focusedKey === null ? null : isAllowedForRow(query, focusedKey);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    clearStudio(ctx, W, H); drawDesk(ctx, W, H, 488);
    drawLabel(ctx, '第二步：保留 mask 矩阵，但一次只追踪一条读取关系', 32, 31, C.text, 18);
    drawLabel(ctx, '矩阵行 = Query（谁在读），矩阵列 = Key（读谁）', 32, 58, C.muted, 12);
    drawLabel(ctx, '示例顺序：前文 → 干净图像 → 图后文本 → 噪声图像', 32, 79, C.current, 11.5);

    const queryToken = tokens[query];
    const relationColor = allowed === null ? C.border : allowed ? C.success : C.failure;
    roundedCard(ctx, 34, 92, 392, 92, C.control);
    drawLabel(ctx, '① 当前 Query', 54, 116, C.control, 12);
    drawLabel(ctx, `${queryToken.label} · ${kindNames[queryToken.kind]} Query`, 54, 144, kindColors[queryToken.kind], 16);
    drawLabel(ctx, ruleText(query), 54, 168, C.muted, 11.5);

    roundedCard(ctx, 34, 204, 392, 132, relationColor);
    drawLabel(ctx, '② 当前单元格', 54, 229, relationColor, 12);
    if (focusedKey === null) {
      drawLabel(ctx, '请在右侧高亮行中选择一个 Key', 54, 267, C.muted, 14);
      drawLabel(ctx, '然后判断该位置是可见还是被 mask。', 54, 296, C.muted, 12);
    } else {
      const key = tokens[focusedKey];
      drawLabel(ctx, `${queryToken.label} 读取 ${key.label}`, 54, 263, relationColor, 16);
      drawLabel(ctx, allowed ? '✓ 允许通过' : '× 被 mask 阻断', 54, 292, relationColor, 14);
      drawLabel(ctx, allowed ? `等价信息流：${key.label} → ${queryToken.label}` : '没有信息通过该单元格', 54, 316, relationColor, 11.5);
    }

    ctx.fillStyle = C.white; ctx.strokeStyle = C.contour; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(34, 356, 392, 104, 10); ctx.fill(); ctx.stroke();
    drawLabel(ctx, '方向约定', 54, 380, C.text, 13);
    drawLabel(ctx, '注意力方向：Query 读取 Key', 54, 407, C.current, 12);
    drawLabel(ctx, '信息流方向：Key → Query', 54, 433, C.success, 12);
    drawLabel(ctx, '二者描述同一条连接，只是观察方向相反。', 54, 451, C.muted, 10.5);

    drawLabel(ctx, 'Key（被读取）', MATRIX.x + MATRIX.cell * 3.5, 78, C.text, 12, 'center');
    tokens.forEach((token, index) => {
      drawLabel(ctx, token.label, MATRIX.x + index * MATRIX.cell + MATRIX.cell / 2, 96, kindColors[token.kind], 11, 'center');
      drawLabel(ctx, token.label, MATRIX.x - 17, MATRIX.y + index * MATRIX.cell + MATRIX.cell / 2, kindColors[token.kind], 11, 'center');
    });
    ctx.save();
    ctx.translate(456, MATRIX.y + MATRIX.cell * 3.5);
    ctx.rotate(-Math.PI / 2);
    drawLabel(ctx, 'Query（谁在读）', 0, 0, C.text, 12, 'center');
    ctx.restore();

    for (let row = 0; row < tokens.length; row += 1) {
      for (let key = 0; key < tokens.length; key += 1) {
        const x = MATRIX.x + key * MATRIX.cell;
        const y = MATRIX.y + row * MATRIX.cell;
        const cellAllowed = isAllowedForRow(row, key);
        const activeRow = row === query;
        const activeCell = activeRow && focusedKey === key;
        ctx.fillStyle = activeRow && cellAllowed ? '#edf7f1' : cellAllowed ? '#f4f7fb' : C.white;
        ctx.strokeStyle = activeCell ? (cellAllowed ? C.success : C.failure) : activeRow ? C.control : C.border;
        ctx.lineWidth = activeCell ? 4 : activeRow ? 2 : 1;
        ctx.fillRect(x, y, MATRIX.cell, MATRIX.cell);
        ctx.strokeRect(x, y, MATRIX.cell, MATRIX.cell);
        drawLabel(ctx, cellAllowed ? '✓' : '╱', x + MATRIX.cell / 2, y + MATRIX.cell / 2, cellAllowed ? kindColors[tokens[row].kind] : C.failure, 14, 'center');
      }
    }
    ctx.strokeStyle = C.control; ctx.lineWidth = 4;
    ctx.strokeRect(MATRIX.x - 3, MATRIX.y + query * MATRIX.cell - 3, MATRIX.cell * tokens.length + 6, MATRIX.cell + 6);
    drawLabel(ctx, `${queryToken.label} 行`, 928, MATRIX.y + query * MATRIX.cell + MATRIX.cell / 2, C.control, 11, 'right');

    drawLegend(ctx, [
      { label: '允许读取', color: C.success },
      { label: 'mask 阻断', color: C.failure, dashed: true },
      { label: '当前 Query 行', color: C.control },
    ], 220, 526, 190);
  }, [allowed, focusedKey, query]);

  useObservedCanvas(canvasRef, W, H, draw);

  const chooseQuery = (index: number) => {
    setQuery(index);
    setFocusedKey(null);
  };

  let feedback = query < 2
    ? `${tokens[query].label} Query 已选：它位于图像之前，只能读取此前已经出现的文本。请直接点击橙色行中的一个单元格。`
    : query === 4
    ? '图后文 Query 已选：它与前文同为文本 token，但位于图像之后，因此可以读取此前出现的干净图像。请直接点击橙色行中的一个单元格。'
    : `${tokens[query].label} Query 已选；请直接点击右侧橙色行中的一个单元格。`;
  let cls = '';
  if (focusedKey !== null) {
    const key = tokens[focusedKey];
    if (allowed) {
      feedback = `允许：矩阵单元格 (${tokens[query].label}, ${key.label}) 为可见；注意力是 ${tokens[query].label} 读取 ${key.label}，信息流是 ${key.label} → ${tokens[query].label}。`;
      cls = 'good';
    } else {
      feedback = `阻断：矩阵单元格 (${tokens[query].label}, ${key.label}) 被 mask，${tokens[query].label} 无法读取 ${key.label}。`;
      cls = 'bad';
    }
  }

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        aria-label={`混合注意力 mask 矩阵，当前 ${tokens[query].label} Query，${focusedKey === null ? '尚未选择 Key' : `选择 ${tokens[focusedKey].label}`}`}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left) * W / rect.width;
          const y = (event.clientY - rect.top) * H / rect.height;
          const rowTop = MATRIX.y + query * MATRIX.cell;
          if (x < MATRIX.x || x >= MATRIX.x + MATRIX.cell * tokens.length || y < rowTop || y >= rowTop + MATRIX.cell) return;
          setFocusedKey(Math.floor((x - MATRIX.x) / MATRIX.cell));
        }}
        onKeyDown={(event) => {
          const current = focusedKey ?? 0;
          if (event.key === 'ArrowLeft') setFocusedKey(Math.max(0, current - 1));
          if (event.key === 'ArrowRight') setFocusedKey(Math.min(tokens.length - 1, current + 1));
        }}
      />
      <div className="ctrl" role="group" aria-label="选择 Query 行">
        {tokens.map((token, index) => (
          <button key={`${token.label}-${index}`} type="button" aria-pressed={query === index} onClick={() => chooseQuery(index)}>{token.label} Query</button>
        ))}
      </div>
      <div className={`feedback ${cls}`} aria-live="polite">{feedback}</div>
      <blockquote className="paper-quote">
        “文本 token 仅因果读取此前 token；同一图像块内的图像 token 双向读取并以此前上下文为条件；噪声 token 可以完整访问干净输入，而干净 token 不能读取任何噪声 token。”
        <cite>论文依据（中文释义）：SenseNova-U1, §3.2 Native Mixture-of-Transformers, p.8</cite>
      </blockquote>
      <p className="note">标签说明：“前文0/1”和“图后文”都是文本 token，区别仅是序列位置；前文位于干净图像之前，图后文位于干净图像之后，所以图后文可以因果读取已经出现的图像。读图时先找 Query 行，再找 Key 列；交点为 ✓ 表示允许读取，为 ╱ 表示被 mask。</p>
    </div>
  );
};

export default RopeMask;
