import { useMemo, useState } from 'react';
import type { PointerEvent } from 'react';
import { Canvas, Controls, Button, Chips, Feedback, Source, MatrixTable, Metric, Detail, WidgetFrame, fmt, palette } from './shared';
import { attention } from './math';

const E = [[1, 0], [0, 1], [1, 1]];
const GRID = { x: 30, y: 40, cell: 68, gap: 17 };

export function AxisAttentionExplorer() {
  const [axis, setAxis] = useState('feature');
  const [query, setQuery] = useState(0);
  const result = useMemo(() => attention(query), [query]);
  const feature = axis === 'feature';
  const axisName = feature ? 'Feature Attention：固定行，跨特征列' : 'Sample Attention：固定列，跨样本行';
  const activePosition = (i: number) => feature ? [1, i] : [i, 1];
  const pickToken = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * 720 / rect.width - GRID.x;
    const y = (event.clientY - rect.top) * 300 / rect.height - GRID.y;
    const stride = GRID.cell + GRID.gap;
    if (x < 0 || y < 0) return;
    const col = Math.floor(x / stride), row = Math.floor(y / stride);
    if (row > 2 || col > 2 || x % stride > GRID.cell || y % stride > GRID.cell) return;
    if (feature && row === 1) setQuery(col);
    if (!feature && col === 1) setQuery(row);
  };
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, w, h);
    const stride = GRID.cell + GRID.gap;
    const [qr, qc] = activePosition(query), qx = GRID.x + qc * stride + GRID.cell / 2, qy = GRID.y + qr * stride + GRID.cell / 2;
    ctx.strokeStyle = palette.green; ctx.globalAlpha = .23; ctx.lineWidth = 6;
    for (let i = 0; i < 3; i++) {
      const [row, col] = activePosition(i);
      ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(GRID.x + col * stride + GRID.cell / 2, GRID.y + row * stride + GRID.cell / 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
      const active = feature ? row === 1 : col === 1;
      const idx = feature ? col : row;
      const selected = active && idx === query;
      const x = GRID.x + col * stride, y = GRID.y + row * stride;
      ctx.fillStyle = active ? (selected ? palette.orange : palette.env) : '#eef0e9';
      ctx.fillRect(x, y, GRID.cell, GRID.cell);
      ctx.strokeStyle = selected ? palette.ink : active ? palette.green : palette.line; ctx.lineWidth = selected ? 4 : 1.5;
      ctx.strokeRect(x, y, GRID.cell, GRID.cell);
      if (active) { ctx.fillStyle = palette.ink; ctx.font = selected ? '700 24px sans-serif' : '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(idx + 1), x + GRID.cell / 2, y + GRID.cell / 2 + 8); }
    }
    ctx.textAlign = 'left'; ctx.fillStyle = palette.ink; ctx.font = '600 14px sans-serif'; ctx.fillText('权重', 363, 28);
    result.weights.forEach((weight, i) => {
      const y = 58 + i * 68;
      ctx.fillStyle = '#e4e9de'; ctx.fillRect(363, y, 312, 30);
      ctx.fillStyle = i === query ? palette.orange : palette.green; ctx.fillRect(363, y, 312 * weight, 30);
      if (i === query) { ctx.strokeStyle = palette.ink; ctx.lineWidth = 2; ctx.strokeRect(361, y - 2, 316, 34); }
    });
  };
  const contributions = result.v.map((v, i) => v.map(x => x * result.weights[i]));
  return <WidgetFrame id="axis-attention-lab">
    <Source kind="P · I · T" loc="pp4–6 §4；附录A 式(11)–(12)">交流轴依据论文；本模块使用人工三 token 矩阵，输出只是教学隐藏向量。</Source>
    <p><strong>Q</strong>提出匹配需求，<strong>K</strong>参与匹配打分，<strong>V</strong>提供被汇聚的内容。先选一个查询 token，再看同一套计算如何沿行或列安排。</p>
    <Chips label="交流轴" value={axis} onChange={setAxis} options={[{ value: 'feature', label: '同行：Feature Attention' }, { value: 'sample', label: '同列：Sample Attention' }]} />
    <Chips label="选择查询 token" value={String(query)} onChange={value => setQuery(Number(value))} options={[{ value: '0', label: '第1个token' }, { value: '1', label: '第2个token' }, { value: '2', label: '第3个token' }]} />
    <Controls><Button onClick={() => { setAxis('feature'); setQuery(0); }}>重置本模块</Button></Controls>
    <p aria-live="polite"><strong>当前轴：</strong>{axisName}；<strong>query：</strong>第 {query + 1} 个 token，q = [{result.q.map(v => fmt(v)).join(', ')}]。</p>
    <Canvas label={`${axisName}。橙色第${query + 1}个token为query；仅高亮行或列的三个token参与。本例权重为${result.weights.map(x => fmt(x, 5)).join('、')}`} draw={draw} height={300} onPointerDown={pickToken} style={{ cursor: 'pointer', touchAction: 'manipulation' }} />
    <p style={{ fontSize: '.9rem', color: palette.muted }}>左：可点击的 3×3 布局，橙色及粗边框是 query，绿格是参与集合；右：按 token 1→3 排列的权重，横轴固定 0–1。灰格没有参与本次数学例子。</p>
    <p><mark style={{ background: '#e8f2e8', color: palette.ink, padding: '4px 8px' }}>a = softmax(qKᵀ / √2)，o = aV</mark></p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16 }}>
      <MatrixTable label="当前 q 对各 K 的缩放点积" matrix={[result.scores]} headers={['token 1', 'token 2', 'token 3']} />
      <MatrixTable label="softmax 权重 a" matrix={[result.weights]} headers={['token 1', 'token 2', 'token 3']} />
    </div>
    <Controls><Metric label="权重和" value={fmt(result.weights.reduce((sum, x) => sum + x, 0), 6)} /><Metric label="教学隐藏向量 o" value={`[${result.output.map(v => fmt(v, 6)).join(', ')}]`} /></Controls>
    <Feedback>第 {query + 1} 个 token 的 Q 与 3 个 K 算出权重，再对 V 加权汇聚，得到 [{result.output.map(v => fmt(v, 6)).join(', ')}]。当前是{feature ? '同行跨特征' : '同列跨样本'}布局。这里没有执行真实 LimiX-2M 推理，也不是任务标签预测。</Feedback>
    <p>切换交流轴时，<strong>同一个三 token 数学例子</strong>从行搬到列，query 序号保留，因此数值不必改变。变化的是可交流的位置，不是 Q、K、V 的先后顺序。</p>
    <Detail title="E、Q、K、V 与逐项加权（固定人工参数）">
      <p>单头，d_k = 2；W_Q = W_K = I₂，W_V = diag(1, 2)。Q = EW_Q，K = EW_K，V = EW_V。本例未训练，也未复现 Fig2 的合成因果 DAG 实验。</p>
      <MatrixTable label="人工输入 E；同时也是 Q 与 K" matrix={E} headers={['通道1', '通道2']} />
      <MatrixTable label="V = E diag(1,2)" matrix={result.v} headers={['通道1', '通道2']} />
      <MatrixTable label="各 token 对输出的加权项 aᵢvᵢ" matrix={contributions} headers={['通道1', '通道2']} />
      <p>沿上表行求和得到 o。softmax 先减去最大打分以保持稳定，权重非负且总和为1。本例无 mask；真实任务必须遵守标签可见性，固定 PDF 未完整给出 mask 实现。</p>
    </Detail>
    <Detail title="FFN 做什么，哪些结论不能从注意力图推出">
      <p><strong>FFN（前馈网络）</strong>逐 token 变换通道，可引入非线性；它自身不沿样本或特征轴交换 token。论文没有给出足以确认的激活函数和中间宽度，本教程不把任意实现写成作者配置。</p>
      <p>注意力权重描述当前数学运算的汇聚比例，不直接等于真实因果关系或任务贡献。后面改变模块顺序时，Feature Attention、Sample Attention 和 FFN 的角色保持明确。</p>
    </Detail>
  </WidgetFrame>;
}
