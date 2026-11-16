import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

const BLOCKS = [
  { id: 'vit', zh: 'ViT', verdict: 'weak', note: '图 5(a) 中 ViT 的柱明显低于 pre-attn。' },
  { id: 'conn-in', zh: 'Conn. in', verdict: 'weak', note: '连接层输入侧，对齐低于 pre-attn。' },
  { id: 'conn-out', zh: 'Conn. out', verdict: 'weak', note: '连接层输出侧，同样偏低。' },
  { id: 'pos', zh: '2D pos.', verdict: 'weak', note: '位置嵌入附近只有很小的正值。' },
  { id: 'pre-attn', zh: 'Pre-attn', verdict: 'strong', note: '论文报告：受控配对里对齐最强的就是理解分支的 pre-attention RMSNorm。' },
  { id: 'q', zh: 'Q', verdict: 'weak', note: '查询投影，接近零。' },
  { id: 'k', zh: 'K', verdict: 'weak', note: '键投影，接近零。' },
  { id: 'v', zh: 'V', verdict: 'weak', note: '值投影，接近零。' },
  { id: 'q-norm', zh: 'Q norm', verdict: 'neg', note: '图 5(a) 中该块为负：两个目标在此互相抵消。' },
  { id: 'k-norm', zh: 'K norm', verdict: 'neg', note: '同样偏负。' },
  { id: 'out', zh: 'Out', verdict: 'weak', note: '注意力输出侧，正值很小。' },
  { id: 'pre-mlp', zh: 'Pre-MLP', verdict: 'weak', note: 'MLP 前的归一化，仍有正值但更小。' },
  { id: 'gate', zh: 'Gate', verdict: 'weak', note: '门控参数，接近零。' },
  { id: 'up', zh: 'Up', verdict: 'weak', note: 'MLP 上投影，接近零。' },
  { id: 'down', zh: 'Down', verdict: 'weak', note: 'MLP 下投影，接近零。' },
];

const verdictColor = (verdict: string) => (verdict === 'strong' ? C.green : verdict === 'neg' ? C.red : C.muted);

export function S9Where(_props: WidgetProps) {
  const [block, setBlock] = useState('pre-attn');
  const [layer, setLayer] = useState(2);
  const stripRef = useRef<SVGSVGElement | null>(null);
  const dragging = useRef(false);
  const current = BLOCKS.find((item) => item.id === block)!;
  const early = layer <= 6;
  const mid = layer > 6 && layer <= 13;
  const scan = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = stripRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 820;
    setLayer(Math.max(0, Math.min(27, Math.round((x - 14 - 11) / 28))));
  };
  const strength = current.verdict === 'strong' ? (early ? 1 : mid ? 0.55 : 0.3)
    : current.verdict === 'neg' ? (early ? -0.55 : -0.3) : (early ? 0.45 : mid ? 0.25 : 0.12);

  return (
    <div style={{ display: 'flex', gap: 26, width: 1472, height: 622 }}>
      <div style={{ flex: 1, background: C.bg, border: `2px solid ${C.line}`, borderRadius: 18, padding: '14px 18px', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 24, color: C.muted }}>点一个参数块，看它在图 5(a) 中的相对位置</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {BLOCKS.map((item) => {
            const active = item.id === block;
            return (
              <button key={item.id} type="button" onClick={() => setBlock(item.id)}
                style={{
                  padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 21,
                  color: C.ink, background: active ? 'rgba(240,126,71,.14)' : '#fff',
                  border: `2px solid ${active ? C.orange : C.line}`,
                  boxShadow: active ? '0 6px 14px rgba(146,64,14,.12)' : 'none',
                }}>{item.zh}</button>
            );
          })}
        </div>

        <div style={{ marginTop: 18, fontSize: 24, color: C.muted }}>第 {layer} 层（共 28 层，理解分支）· 在层条上横向拖动可连续扫过</div>
        <svg ref={stripRef} viewBox="0 0 820 96" width="820" height="96" role="application"
          aria-label={`28 层中的第 ${layer} 层，可拖动`}
          style={{ cursor: 'ew-resize', touchAction: 'pan-y' }}
          onPointerDown={(event) => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); scan(event); }}
          onPointerMove={(event) => { if (dragging.current) scan(event); }}
          onPointerUp={() => { dragging.current = false; }}
          onPointerLeave={() => { dragging.current = false; }}>
          {Array.from({ length: 28 }).map((_, index) => {
            const x = 14 + index * 28;
            const band = index <= 6 ? C.green : index <= 13 ? C.envL : C.line;
            const active = index === layer;
            return (
              <g key={index} role="button" tabIndex={0} aria-label={`第 ${index} 层`} style={{ cursor: 'pointer' }}
                onClick={() => setLayer(index)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setLayer(index); } }}>
                <rect x={x} y="12" width="22" height={active ? 66 : 52} rx="5" fill={band} stroke={active ? C.orange : 'none'} strokeWidth={active ? 3 : 0} />
                {index % 7 === 0 && <text x={x + 11} y="92" fontSize="15" fill={C.muted} textAnchor="middle">{index}</text>}
              </g>
            );
          })}
        </svg>
        <div style={{ display: 'flex', gap: 26, fontSize: 19, color: C.muted, marginTop: 2 }}>
          <span><b style={{ color: C.green }}>■</b> 更早的层（示意：更强）</span>
          <span><b style={{ color: C.envL }}>■</b> 中段（示意）</span>
          <span><b style={{ color: C.line }}>■</b> 更深层（示意：更弱）</span>
          <span style={{ color: C.muted }}>分档边界为示意，论文只给“较早层更强”</span>
        </div>

        <div style={{ marginTop: 14, padding: '14px 18px', background: '#fff', border: `2px solid ${C.line}`, borderRadius: 14, fontSize: 22, lineHeight: 1.5, color: C.ink }}>
          层条高度与配色是<b>定性示意</b>：论文只报告“较早层更强”，未在正文给出逐层数值；具体柱高见原始图 5(b)。
          <div style={{ fontSize: 20, color: C.muted, marginTop: 8 }}>
            跨任务分析把 28 层 pre-attention RMSNorm 参数拼接起来，对 7 个评估样本 &gt; 500 的能力各采 500 例、minibatch 64 计算梯度。
          </div>
        </div>
      </div>

      <div style={{ width: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ padding: '18px 22px', background: '#fff', border: `2px solid ${verdictColor(current.verdict)}`, borderRadius: 16 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.ink }}>{current.zh}</div>
          <div style={{ fontSize: 24, lineHeight: 1.5, color: C.ink, marginTop: 8 }}>{current.note}</div>
          <div style={{ fontSize: 21, color: verdictColor(current.verdict), marginTop: 8 }}>
            {current.verdict === 'strong' ? '对齐最强' : current.verdict === 'neg' ? '方向相反（负值）' : '明显更弱'}
          </div>
        </div>

        <div style={{ padding: '16px 20px', background: '#fff', border: `2px solid ${C.blue}`, borderRadius: 16 }}>
          <div style={{ fontSize: 22, color: C.muted }}>当前层</div>
          <div style={{ fontSize: 26, color: C.ink, marginTop: 4 }}>
            第 {layer} 层：{early ? '属于较早层，论文报告对齐更强' : mid ? '中间层，弱于早期层' : '较深，基本接近零'}
          </div>
          <input type="range" min={0} max={27} step={1} value={layer} aria-label="选择 transformer 层"
            onChange={(event) => setLayer(Number(event.target.value))}
            style={{ width: '100%', accentColor: C.blue, marginTop: 8 }} />
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 19, color: C.muted }}>该块 × 该层的对齐强度（相对，示意）</div>
            <svg viewBox="0 0 500 54" width="500" height="54" role="img" aria-label={`相对对齐强度 ${strength.toFixed(2)}`}>
              <line x1="250" y1="6" x2="250" y2="48" stroke={C.muted} strokeWidth="2" />
              <rect x={strength >= 0 ? 250 : 250 + strength * 220} y="14"
                width={Math.abs(strength) * 220} height="26" rx="6"
                fill={strength >= 0 ? C.green : C.red} opacity=".28"
                stroke={strength >= 0 ? C.green : C.red} strokeWidth="2" />
              <text x={Math.max(40, Math.min(460, 250 + (strength * 220) / 2))} y="34"
                fontSize="17" fill={strength >= 0 ? C.green : C.red} fontWeight="700"
                textAnchor="middle">{strength.toFixed(2)}</text>
              <text x="8" y="52" fontSize="15" fill={C.muted}>← 反向</text>
              <text x="492" y="52" fontSize="15" fill={C.muted} textAnchor="end">同向 →</text>
            </svg>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: C.bg, border: `2px solid ${C.line}`, borderRadius: 16 }}>
          <svg viewBox="0 0 90 90" width="90" height="90" aria-label="最靠近木料的夹具">
            <rect x="6" y="30" width="78" height="16" rx="5" fill={C.woodSoft} stroke={C.wood} strokeWidth="3" />
            <rect x="18" y="14" width="12" height="52" rx="4" fill={current.verdict === 'strong' ? C.green : C.envL} stroke={C.wood} strokeWidth="2.5" />
            <rect x="56" y="14" width="12" height="52" rx="4" fill={current.verdict === 'strong' ? C.green : C.envL} stroke={C.wood} strokeWidth="2.5" />
            <path d="M30 20 H56" stroke={C.wood} strokeWidth="6" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 21, color: C.muted, lineHeight: 1.5 }}>
            越靠近木料的夹具（越早的归一化层），两个任务的力越先在这里相遇——这就是论文把注意力放在 pre-attention RMSNorm 上的原因。
          </div>
        </div>
      </div>
    </div>
  );
}
