import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type TokenType = 'image' | 'latent' | 'text' | 'output';
type Token = { id: string; label: string; type: TokenType; visualGroup?: number };

const tokens: Token[] = [
  { id: 'i11', label: '图1·1', type: 'image', visualGroup: 1 },
  { id: 'i12', label: '图1·2', type: 'image', visualGroup: 1 },
  { id: 'i13', label: '图1·3', type: 'image', visualGroup: 1 },
  { id: 'l1', label: '潜1', type: 'latent' },
  { id: 't1', label: '把', type: 'text' },
  { id: 't2', label: '红杯', type: 'text' },
  { id: 'i21', label: '图2·1', type: 'image', visualGroup: 2 },
  { id: 'i22', label: '图2·2', type: 'image', visualGroup: 2 },
  { id: 'i23', label: '图2·3', type: 'image', visualGroup: 2 },
  { id: 'l2', label: '潜2', type: 'latent' },
  { id: 't3', label: '放入', type: 'text' },
  { id: 't4', label: '上层', type: 'text' },
  { id: 'o1', label: '避开', type: 'output' },
  { id: 'o2', label: '玻璃杯', type: 'output' },
];

function allowed(query: Token, key: Token, qi: number, ki: number) {
  if (query.type === 'image') return key.type === 'image' && query.visualGroup === key.visualGroup;
  return ki <= qi;
}

function PatchWhy() {
  return <div className="patch-why">
    <div className="patch-why-text old"><span>只按先后读取</span><b>杯口暂时看不到杯身与杯柄</b></div>
    <div className="patch-why-figure">
      <div className="real-cup-patch" role="img" aria-label="写实红色马克杯被切分为 6 乘 8 个图像 Patch，杯口、杯身和杯柄属于同一视觉元素">
        <img src="/assets/red-mug-patch.png" alt="写实红色马克杯" />
        <div className="real-patch-grid" aria-hidden="true">
          {Array.from({ length: 48 }, (_, index) => <span key={index} />)}
        </div>
        <span className="patch-focus focus-rim">杯口</span>
        <span className="patch-focus focus-body">杯身</span>
        <span className="patch-focus focus-handle">杯柄</span>
      </div>
      <div className="patch-part-labels"><span>杯口 Patch</span><i>↔</i><span>杯身 Patch</span><i>↔</i><span>杯柄 Patch</span></div>
    </div>
    <div className="patch-why-text new"><span>局部全注意力</span><b>同一张图内部双向互看，完整理解红杯</b></div>
  </div>;
}

export const AttentionMask: React.FC<WidgetProps> = () => {
  const [qi, setQi] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setQi(row => (row + 1) % tokens.length), 1600);
    return () => window.clearInterval(timer);
  }, []);

  const query = tokens[qi];
  const causalVisible = tokens.filter((_, ki) => ki <= qi);
  const hyVisible = tokens.filter((key, ki) => allowed(query, key, qi, ki));

  const renderPanel = (mode: 'causal' | 'hy') => {
    const isHy = mode === 'hy';
    const visible = isHy ? hyVisible : causalVisible;
    const explanation = !isHy
      ? '所有 token 都按先后顺序读取，图像块也只能看自己和前面的块。'
      : query.type === 'image'
        ? '当前图像块可与同一图像内的所有块双向互看，但不会跨到另一张图。'
        : '文本、潜变量和输出仍沿全局因果路径逐步生成。';
    return <section className={`mask-panel ${isHy ? 'hy' : 'causal'}`} aria-label={`${isHy ? 'HY-Embodied MoT' : '标准因果注意力'}，当前查询行 ${query.label}`}>
      <header><b>{isHy ? 'HY-Embodied MoT' : '标准因果注意力'}</b><span>Query：{query.label}</span></header>
      <div className="matrix-wrap">
        <div className="matrix-corner">Q \ K</div>
        {tokens.map(t => <div key={`h-${mode}-${t.id}`} className={`matrix-label top token-${t.type}`}>{t.label}</div>)}
        {tokens.map((row, r) => <React.Fragment key={`${mode}-${row.id}`}>
          <div className={`matrix-label side token-${row.type} ${r === qi ? 'active' : ''}`}>{row.label}</div>
          {tokens.map((col, c) => {
            const isAllowed = isHy ? allowed(row, col, r, c) : c <= r;
            const isFull = isHy && row.type === 'image' && col.type === 'image' && row.visualGroup === col.visualGroup;
            return <span key={`${mode}-${row.id}-${col.id}`} className={`mask-cell ${isAllowed ? isFull ? 'full' : 'causal' : 'masked'} ${r === qi ? 'query-row' : ''}`} />;
          })}
        </React.Fragment>)}
      </div>
      <div className="mask-panel-caption"><b>{explanation}</b><small>可查看：{visible.map(t => t.label).join('、')}</small></div>
    </section>;
  };

  return <div className="mask-demo">
    <p className="attention-context"><b>MoT 先把视觉与语言的计算参数分开；接下来，还要把“看谁”的规则分开。</b></p>
    <div className="mask-autoplay-head" aria-label={`双矩阵按行自动演示，当前第 ${qi + 1} 行：${query.label}`}>
      <div className="mask-loop-status"><span>双矩阵按行自动循环</span><b>当前 Query：{query.label}</b><small>{qi + 1}/{tokens.length}</small></div>
      <div className="mask-loop-track"><i key={qi} /></div>
    </div>
    <div className="mask-comparison">{renderPanel('causal')}{renderPanel('hy')}</div>
    <PatchWhy />
    <div className="attention-script-lines compact">
      <p><b>语言按顺序生成：</b>当前词只能看见自己和前文。</p>
      <p><b>但图像不是一句话：</b>杯柄必须同时参考杯身和杯口，才能理解完整红杯。</p>
      <p>所以同一视觉元素内部使用<b>局部全注意力</b>；文本、输出和不同图像之间继续遵守全局因果注意力。</p>
    </div>
    <p className="attention-takeaway">视觉负责同时看清，语言负责逐步生成。</p>
  </div>;
};

export default AttentionMask;
