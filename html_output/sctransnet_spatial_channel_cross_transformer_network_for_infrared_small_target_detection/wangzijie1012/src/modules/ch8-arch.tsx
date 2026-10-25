import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Chips, Feedback, Source, FONT_SANS, FONT_MONO, PaperImage } from './kit';

// 模块 8.1：可点击的完整结构（据原文图 2 重绘）。点击任一组件查看它的作用、输出形状与出处；
// “追踪层级”高亮某一层信息从编码到解码的完整路径；“阶段”切换训练 / 推理时的输出。

const CH = [32, 64, 128, 256];
const SUB = '₁₂₃₄₅';

type Kind = 'in' | 'rb' | 'pe' | 'sctb' | 'fm' | 'add' | 'neck' | 'dec' | 'head' | 'ds';
interface N {
  id: string;
  kind: Kind;
  lv?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

const ROWY = [92, 158, 224, 290];

const NODES: N[] = [
  { id: 'in', kind: 'in', x: 30, y: 26, w: 92, h: 30, label: '输入图像' },
  ...ROWY.map((y, i) => ({ id: `rb${i}`, kind: 'rb' as Kind, lv: i, x: 30, y: y - 15, w: 92, h: 30, label: `RB → E${SUB[i]}` })),
  { id: 'neck', kind: 'neck', x: 30, y: 356, w: 92, h: 30, label: 'RB（瓶颈）' },
  ...ROWY.map((y, i) => ({ id: `pe${i}`, kind: 'pe' as Kind, lv: i, x: 176, y: y - 15, w: 96, h: 30, label: `嵌入 ${[16, 8, 4, 2][i]}×${[16, 8, 4, 2][i]}` })),
  { id: 'sctb', kind: 'sctb', x: 326, y: 70, w: 120, h: 242, label: 'SCTB × 4' },
  ...ROWY.map((y, i) => ({ id: `fm${i}`, kind: 'fm' as Kind, lv: i, x: 500, y: y - 15, w: 84, h: 30, label: `FM ×${[16, 8, 4, 2][i]}` })),
  ...ROWY.map((y, i) => ({ id: `add${i}`, kind: 'add' as Kind, lv: i, x: 606, y: y - 13, w: 26, h: 26, label: '+' })),
  ...ROWY.map((y, i) => ({ id: `dec${i}`, kind: 'dec' as Kind, lv: i, x: 680, y: y - 15, w: 118, h: 30, label: `CCA + CBL×2 → F${SUB[i]}` })),
  { id: 'head', kind: 'head', x: 846, y: 77, w: 112, h: 30, label: '1×1 + σ → M₁' },
  { id: 'ds', kind: 'ds', x: 838, y: 300, w: 132, h: 54, label: '深监督' },
];

function info(n: N, L: number, mode: 'train' | 'infer'): { title: string; shape: string; body: React.ReactNode; ref: string } {
  const lv = n.lv ?? 0;
  const s = (d: number) => `${L / d}×${L / d}`;
  switch (n.kind) {
    case 'in':
      return { title: '输入', shape: `1×${s(1)}`, body: <>单帧红外图像（单通道）。训练时每张图归一化后随机裁剪为 256×256，并做随机翻转与旋转。</>, ref: '§IV-B' };
    case 'rb':
      return {
        title: `编码层 E${SUB[lv]}`,
        shape: `${CH[lv]}×${s(2 ** lv)}`,
        body: <>残差块（RB）提取特征{lv > 0 ? '，之前先做一次 2 倍最大池化' : ''}。四组 RB 与池化得到 E₁…E₄，通道数 32/64/128/256。表 IX 表明加深残差块能稳定提升性能。</>,
        ref: '§III-A，图 2',
      };
    case 'neck':
      return { title: '瓶颈层', shape: `256×${s(16)}`, body: <>最深的一组残差块，输出 F₅，经上采样进入最底层解码器，同时提供侧输出 M₅。原文未写明其通道数，形状按作者代码。</>, ref: '图 2；代码' };
    case 'pe':
      return {
        title: `patch 嵌入 I${SUB[lv]}`,
        shape: `${CH[lv]}×${s(16)}`,
        body: <>卷积核与步幅均为 {[16, 8, 4, 2][lv]}，把 E{SUB[lv]} 映射到四层共用的 H/16 × W/16 网格（第 2 章）。不加位置编码。</>,
        ref: '§III-A',
      };
    case 'sctb':
      return {
        title: 'SCTB（空间-通道交叉 Transformer 块）',
        shape: `四路：${CH.map((c) => `${c}×${s(16)}`).join('，')}`,
        body: <>每个 SCTB 同时接收四路嵌入：LN → SSCA（第 4、5 章）→ 残差 → CFN（第 6 章）。共堆叠 N = 4 个，输出与输入形状相同。表 X：N 从 1 增到 4，平均 IoU 从 82.33 升到 83.43；N = 6 只多 0.02 个百分点。</>,
        ref: '式 (8)–(11)，表 X',
      };
    case 'fm':
      return {
        title: `特征映射 FM${SUB[lv]}`,
        shape: `${CH[lv]}×${s(2 ** lv)}`,
        body: <>双线性插值放大 ×{[16, 8, 4, 2][lv]}，回到 E{SUB[lv]} 的尺寸，再接卷积、BN 与 ReLU。</>,
        ref: '§III-A',
      };
    case 'add':
      return {
        title: `残差合并 D${SUB[lv]}`,
        shape: `${CH[lv]}×${s(2 ** lv)}`,
        body: <>E{SUB[lv]} + FM{SUB[lv]}(SCTB(I₁, I₂, I₃, I₄))：跳连上传的不再只是 E{SUB[lv]}，而是叠加了四层交互信息的特征。原文图 2 把这一结果标为 D{SUB[lv]}；式 (1) 则把它记作 O{SUB[lv]}，与 SCTB 的输出（式 11、图 2 中的 O{SUB[lv]}）同名。</>,
        ref: '式 (1)，图 2',
      };
    case 'dec':
      return {
        title: `解码层（输出 F${SUB[lv]}）`,
        shape: `${[32, 32, 64, 128][lv]}×${s(2 ** lv)}`,
        body: <>先用 CCA（通道交叉注意力，来自 UCTransNet [27]）把上采样的深层特征与 D{SUB[lv]} 融合，再经两个 CBL（图 2 图例：卷积 + BN + LeakyReLU）解码，得到 F{SUB[lv]}。表 VIII 中把 CCA 换成 ACM、AGPC、AFFPN 的融合模块，效果都不如 CCA，且参数与计算量更大。</>,
        ref: '§III-A，表 VIII；通道数按代码',
      };
    case 'head':
      return {
        title: '输出头',
        shape: `1×${s(1)}`,
        body: mode === 'infer' ? <>推理只用这一张概率图 M₁，以 0.5 为阈值得到目标掩码。</> : <>训练时 M₁ 也是六项损失之一（式 4）。</>,
        ref: '式 (2)，§IV-B',
      };
    case 'ds':
      return {
        title: '多尺度深监督（仅训练）',
        shape: 'M₁…M₅、MΣ',
        body: <>F₂…F₄ 与瓶颈输出 F₅ 各经 1×1 卷积与 Sigmoid 得到侧输出，上采样到原图大小，与 M₁、融合图 MΣ 一起计算 6 项 BCE（第 7 章）。推理时整支不使用。</>,
        ref: '式 (2)–(7)',
      };
  }
}

export const ArchLab: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState('sctb');
  const [trace, setTrace] = useState(-1);
  const [mode, setMode] = useState<'train' | 'infer'>('infer');
  const [L, setL] = useState(256);
  const [showFig, setShowFig] = useState(false);
  const node = NODES.find((n) => n.id === sel) as N;
  const inf = info(node, L, mode);
  const onPath = (n: N) => trace >= 0 && (n.lv === trace || n.kind === 'sctb');

  const W = 980;
  const H = 400;
  const cx = (n: N) => n.x + n.w / 2;
  const cy = (n: N) => n.y + n.h / 2;
  const get = (id: string) => NODES.find((n) => n.id === id) as N;
  const edge = (a: N, b: N, opts: { color?: string; dash?: boolean; hot?: boolean; fromSide?: 'r' | 'b'; toSide?: 'l' | 't' | 'b' } = {}) => {
    const x1 = opts.fromSide === 'b' ? cx(a) : a.x + a.w;
    const y1 = opts.fromSide === 'b' ? a.y + a.h : cy(a);
    const x2 = opts.toSide === 't' ? cx(b) : opts.toSide === 'b' ? cx(b) : b.x;
    const y2 = opts.toSide === 't' ? b.y : opts.toSide === 'b' ? b.y + b.h : cy(b);
    const d = opts.fromSide === 'b' || opts.toSide === 't' || opts.toSide === 'b' ? `M ${x1} ${y1} L ${x2} ${y2}` : `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;
    return <path d={d} fill="none" stroke={opts.hot ? C.orange : opts.color ?? '#b9b2a4'} strokeWidth={opts.hot ? 2.2 : 1.3} strokeDasharray={opts.dash ? '5 4' : undefined} markerEnd={`url(#ar-${opts.hot ? 'hot' : 'n'})`} />;
  };

  const box = (n: N) => {
    const on = n.id === sel;
    const path = onPath(n);
    const dim = (mode === 'infer' && n.kind === 'ds') ? 0.3 : 1;
    const fill = n.kind === 'sctb' ? '#f3effc' : n.kind === 'ds' ? '#fbeef0' : n.kind === 'add' ? '#fff' : n.kind === 'dec' || n.kind === 'head' ? '#eef6f1' : '#f2f4f7';
    const stroke = on ? C.blue : path ? C.orange : n.kind === 'sctb' ? C.purple : n.kind === 'ds' ? C.red : n.kind === 'dec' || n.kind === 'head' ? C.green : C.line2;
    return (
      <g key={n.id} className="sx-node" opacity={dim} onClick={() => setSel(n.id)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(n.id)}>
        {n.kind === 'add' ? (
          <circle cx={cx(n)} cy={cy(n)} r={13} fill={fill} stroke={stroke} strokeWidth={on || path ? 2.2 : 1.2} />
        ) : (
          <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={6} fill={fill} stroke={stroke} strokeWidth={on || path ? 2.2 : 1.1} />
        )}
        {n.kind === 'sctb' ? (
          <>
            <text x={cx(n)} y={n.y + 34} textAnchor="middle" fontSize={14} fontWeight={700} fill={C.purple}>
              SCTB × 4
            </text>
            {['LN', 'SSCA', '+', 'LN', 'CFN', '+'].map((t, k) => (
              <text key={k} x={cx(n)} y={n.y + 70 + k * 26} textAnchor="middle" fontSize={12} fill={C.ink2}>
                {t}
              </text>
            ))}
          </>
        ) : n.kind === 'ds' ? (
          <>
            <text x={cx(n)} y={n.y + 22} textAnchor="middle" fontSize={12.5} fill={C.red} fontWeight={600}>
              深监督（训练）
            </text>
            <text x={cx(n)} y={n.y + 40} textAnchor="middle" fontSize={11} fill={C.muted}>
              M₁…M₅、MΣ · 6 项 BCE
            </text>
          </>
        ) : (
          <text x={cx(n)} y={cy(n) + 4.5} textAnchor="middle" fontSize={n.kind === 'add' ? 15 : 12} fill={C.ink}>
            {n.label}
          </text>
        )}
      </g>
    );
  };

  const sctb = get('sctb');
  return (
    <div className="sx-lab">
      <div className="sx-chip-rows">
        <Chips label="追踪层级" value={trace} onChange={setTrace} options={[{ value: -1, label: '不追踪' }, ...[0, 1, 2, 3].map((i) => ({ value: i, label: `第 ${i + 1} 层` }))]} />
        <Chips label="阶段" value={mode} onChange={setMode} options={[{ value: 'infer', label: '推理' }, { value: 'train', label: '训练' }]} />
        <Chips label="输入" value={L} onChange={setL} options={[256, 512].map((v) => ({ value: v, label: `${v}×${v}` }))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="sx-diagram" role="group" aria-label="SCTransNet 完整结构，可点击组件">
        <defs>
          <marker id="ar-n" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,1 L9,5 L0,9 z" fill="#b9b2a4" />
          </marker>
          <marker id="ar-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,1 L9,5 L0,9 z" fill={C.orange} />
          </marker>
        </defs>
        <g fontFamily={FONT_SANS}>
          {edge(get('in'), get('rb0'), { fromSide: 'b', toSide: 't' })}
          {[0, 1, 2].map((i) => (
            <g key={i}>{edge(get(`rb${i}`), get(`rb${i + 1}`), { fromSide: 'b', toSide: 't' })}</g>
          ))}
          {edge(get('rb3'), get('neck'), { fromSide: 'b', toSide: 't' })}
          {[0, 1, 2, 3].map((i) => {
            const hot = trace === i;
            const pe = get(`pe${i}`);
            const fm = get(`fm${i}`);
            const ad = get(`add${i}`);
            const dc = get(`dec${i}`);
            return (
              <g key={i}>
                {edge(get(`rb${i}`), pe, { hot })}
                <path d={`M ${pe.x + pe.w} ${cy(pe)} C ${pe.x + pe.w + 30} ${cy(pe)}, ${sctb.x - 24} ${cy(pe)}, ${sctb.x} ${cy(pe)}`} fill="none" stroke={hot ? C.orange : C.purple} strokeOpacity={hot ? 1 : 0.6} strokeWidth={hot ? 2.2 : 1.3} markerEnd={`url(#ar-${hot ? 'hot' : 'n'})`} />
                <path d={`M ${sctb.x + sctb.w} ${cy(fm)} L ${fm.x} ${cy(fm)}`} fill="none" stroke={hot ? C.orange : C.purple} strokeOpacity={hot ? 1 : 0.6} strokeWidth={hot ? 2.2 : 1.3} markerEnd={`url(#ar-${hot ? 'hot' : 'n'})`} />
                {edge(fm, ad, { hot })}
                {/* 残差：E_i 绕过 SCTB 直达 ⊕ */}
                {hot || sel === `add${i}` ? (
                  <path d={`M ${122} ${ROWY[i] - 6} C 160 ${ROWY[i] - 34}, ${cx(ad) - 40} ${ROWY[i] - 34}, ${cx(ad)} ${ROWY[i] - 14}`} fill="none" stroke={C.orange} strokeDasharray="3 4" strokeWidth={1.6} />
                ) : null}
                {edge(ad, dc, { hot })}
              </g>
            );
          })}
          {/* 解码路径：瓶颈 → 第 4 层 → … → 第 1 层 */}
          <path d={`M 122 371 C 760 371, 739 371, 739 ${ROWY[3] + 15}`} fill="none" stroke="#b9b2a4" strokeWidth={1.3} markerEnd="url(#ar-n)" />
          {[3, 2, 1].map((i) => (
            <path key={i} d={`M 739 ${ROWY[i] - 15} L 739 ${ROWY[i - 1] + 15}`} fill="none" stroke="#b9b2a4" strokeWidth={1.3} markerEnd="url(#ar-n)" />
          ))}
          {edge(get('dec0'), get('head'), { color: C.green })}
          {mode === 'train' ? (
            <g>
              {[1, 2, 3].map((i) => (
                <path key={i} d={`M 798 ${ROWY[i]} C 822 ${ROWY[i]}, 822 327, 846 327`} fill="none" stroke={C.red} strokeOpacity={0.6} strokeDasharray="4 3" strokeWidth={1.2} />
              ))}
              <path d="M 122 371 C 600 392, 830 392, 902 354" fill="none" stroke={C.red} strokeOpacity={0.6} strokeDasharray="4 3" strokeWidth={1.2} />
              <path d="M 902 107 L 902 300" fill="none" stroke={C.red} strokeOpacity={0.6} strokeDasharray="4 3" strokeWidth={1.2} markerEnd="url(#ar-n)" />
            </g>
          ) : (
            <g>
              <path d="M 902 107 L 902 140" stroke={C.blue} strokeWidth={1.8} markerEnd="url(#ar-n)" />
              <rect x={866} y={142} width={72} height={26} rx={5} fill="#eef2f8" stroke={C.blue} />
              <text x={902} y={159} textAnchor="middle" fontSize={11.5} fill={C.blue}>
                阈值 0.5
              </text>
            </g>
          )}
          {NODES.map(box)}
          <text x={76} y={16} textAnchor="middle" fontSize={11} fill={C.muted}>编码器</text>
          <text x={386} y={60} textAnchor="middle" fontSize={11} fill={C.muted}>长程跳连上的 SCTB</text>
          <text x={739} y={60} textAnchor="middle" fontSize={11} fill={C.muted}>解码器</text>
        </g>
      </svg>
      <div className="arch-info">
        <div className="arch-info-head">
          <b>{inf.title}</b>
          <span className="mono">{inf.shape}</span>
          <span className="ref">{inf.ref}</span>
        </div>
        <div className="arch-info-body">{inf.body}</div>
      </div>
      <Feedback tone={trace >= 0 ? 'good' : 'info'}>
        {trace >= 0 ? (
          <>
            第 {trace + 1} 层的路径：E{SUB[trace]}（{CH[trace]} 通道）→ 嵌入 → 与另外三层一起进入 SCTB → FM 放大回原尺寸 → 与 E{SUB[trace]} 相加得到 D{SUB[trace]}（式 1 记作 O{SUB[trace]}）→ 经 CCA 与两个 CBL 解码为 F{SUB[trace]}。橙色虚线是绕过 SCTB 的残差。
          </>
        ) : (
          <>点击任一组件查看说明；选择“追踪层级”可以看到某一层的信息怎样经过 SCTB 回到同一尺度的解码层。</>
        )}
      </Feedback>
      <button type="button" className="tiny ghost" onClick={() => setShowFig(!showFig)}>
        {showFig ? '收起原文图 2' : '对照原文图 2'}
      </button>
      {showFig ? <PaperImage src="./images/fig2.png" alt="原文图 2：SCTransNet 总体结构" caption="原文图 2（p.4）。" /> : null}
      <Source>
        结构依据原文图 2 与 §III-A 重绘，省略了 batch 维。编码器、嵌入与 SCTB 的形状来自原文；瓶颈与解码器通道数原文未写，按作者代码（F₄…F₁ 为 128、64、32、32 通道）。记号沿用原文图 2：Dᵢ 为送入解码层的跳连特征，Fᵢ 为解码层输出。
      </Source>
    </div>
  );
};
