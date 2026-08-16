import React, { useState } from 'react';

type RouteKey = 'all' | 'understanding' | 'generation' | 'editing';

const routes: Array<{ key: RouteKey; label: string; color: string; summary: string; steps: string[] }> = [
  { key: 'all', label: '整体架构', color: '#9933ff', summary: '先看完整 Figure 4：左侧给出三项任务的输入与输出。MLLM 是共同语义接口；VAE 与 MMDiT 构成生成和编辑路径，右侧展开 MMDiT Block。', steps: ['共同语义接口', '生成/编辑潜空间', '生成执行核心'] },
  { key: 'understanding', label: 'Understanding', color: '#33ccff', summary: '图像与问题经 ViT/MLLM 编码后直接解码为文本答案；这条路径不调用 MMDiT 和 VAE Decoder。', steps: ['图像 + 问题', 'ViT / MLLM', '文本答案'] },
  { key: 'generation', label: 'Generation', color: '#ff3366', summary: '文本经 MLLM 形成语义 token，和噪声 token 一起进入 MMDiT，随后由 VAE Decoder 还原为生成图像。', steps: ['文本语义', 'MMDiT 去噪', 'VAE 解码', '生成图像'] },
  { key: 'editing', label: 'Editing', color: '#9933ff', summary: '源图一方面经 ViT 进入 MLLM 帮助解释指令，另一方面经 VAE Encoder 形成图像潜变量；两路条件再与噪声 token 一起进入 MMDiT。', steps: ['源图 + 指令', 'MLLM / VAE 编码', 'MMDiT 融合', 'VAE 解码并输出'] }
];

function RouteOverlay({ route }: { route: RouteKey }) {
  if (route === 'all') return null;
  const common = { fill: 'none', strokeWidth: 3.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, markerEnd: 'url(#route-arrow)' };
  return (
    <svg className="arch-route-overlay" viewBox="0 0 1080 550" aria-hidden="true">
      <defs>
        <marker id="route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="route-arrow-head" />
        </marker>
      </defs>
      <rect className="arch-dim" x="0" y="0" width="1080" height="550" />
      {route === 'understanding' ? (
        <g className="route-understanding">
          <rect x="27" y="28" width="225" height="122" rx="15" />
          <rect x="31" y="196" width="208" height="92" rx="13" />
          <rect x="40" y="381" width="401" height="56" rx="11" />
          <rect x="139" y="335" width="92" height="46" rx="9" />
          <rect x="471" y="379" width="116" height="160" rx="10" />
          <path {...common} d="M82 381 L82 319" />
          <path {...common} d="M471 458 L444 458 L444 358 L231 358" />
          <path {...common} d="M185 335 L185 319" />
          <path {...common} d="M137 196 L137 150" />
          <circle cx="58" cy="406" r="13" /><text x="58" y="411">1</text>
          <circle cx="500" cy="405" r="13" /><text x="500" y="410">1</text>
          <circle cx="185" cy="242" r="13" /><text x="185" y="247">2</text>
          <circle cx="137" cy="88" r="13" /><text x="137" y="93">3</text>
        </g>
      ) : null}
      {route === 'generation' ? (
        <g className="route-generation">
          <rect x="31" y="196" width="208" height="92" rx="13" />
          <rect x="257" y="200" width="397" height="82" rx="13" />
          <rect x="545" y="98" width="117" height="47" rx="9" />
          <rect x="412" y="28" width="113" height="161" rx="10" />
          <rect x="40" y="430" width="401" height="56" rx="11" />
          <rect x="682" y="4" width="385" height="540" rx="14" className="route-detail" />
          <path {...common} d="M82 430 L82 319" />
          <path {...common} d="M239 242 L257 242" />
          <path {...common} d="M604 200 L604 145" />
          <path {...common} d="M545 121 L525 121" />
          <circle cx="58" cy="455" r="13" /><text x="58" y="460">1</text>
          <circle cx="185" cy="242" r="13" /><text x="185" y="247">2</text>
          <circle cx="456" cy="242" r="13" /><text x="456" y="247">3</text>
          <circle cx="469" cy="108" r="13" /><text x="469" y="113">4</text>
        </g>
      ) : null}
      {route === 'editing' ? (
        <g className="route-editing">
          <rect x="31" y="196" width="208" height="92" rx="13" />
          <rect x="139" y="335" width="92" height="46" rx="9" />
          <rect x="466" y="335" width="121" height="47" rx="9" />
          <rect x="257" y="200" width="397" height="82" rx="13" />
          <rect x="545" y="98" width="117" height="47" rx="9" />
          <rect x="283" y="28" width="113" height="161" rx="10" />
          <rect x="40" y="480" width="401" height="57" rx="11" />
          <rect x="471" y="379" width="116" height="160" rx="10" />
          <rect x="682" y="4" width="385" height="540" rx="14" className="route-detail" />
          <path {...common} d="M82 480 L82 319" />
          <path {...common} d="M471 458 L444 458 L444 358 L231 358" />
          <path {...common} d="M185 335 L185 319" />
          <path {...common} d="M587 458 L610 458 L610 358 L587 358" />
          <path {...common} d="M527 335 L527 282" />
          <path {...common} d="M239 242 L257 242" />
          <path {...common} d="M604 200 L604 145" />
          <path {...common} d="M545 121 L396 121" />
          <circle cx="58" cy="507" r="13" /><text x="58" y="512">1</text>
          <circle cx="500" cy="405" r="13" /><text x="500" y="410">1</text>
          <circle cx="185" cy="242" r="13" /><text x="185" y="247">2</text>
          <circle cx="527" cy="358" r="13" /><text x="527" y="363">2</text>
          <circle cx="456" cy="242" r="13" /><text x="456" y="247">3</text>
          <circle cx="339" cy="108" r="13" /><text x="339" y="113">4</text>
        </g>
      ) : null}
    </svg>
  );
}

export function FigArch() {
  const [active, setActive] = useState<RouteKey>('all');
  const route = routes.find((item) => item.key === active)!;
  return (
    <div className="arch-explorer">
      <div className="arch-demand-map" aria-label="从设计需求到论文组件的映射">
        <div><span>共同语义接口</span><b>→</b><strong>MLLM</strong></div>
        <div><span>共同图像接口</span><b>→</b><strong>ViT + VAE</strong></div>
        <div><span>共同生成执行器</span><b>→</b><strong>MMDiT</strong></div>
      </div>
      <p className="arch-demand-lead">Figure 4 给出了上节问题的答案。现在沿三项任务检查：这些接口是否真的被接通。</p>
      <div className="arch-route-tabs" role="tablist" aria-label="切换 Figure 4 中的任务路径">
        {routes.map((item) => (
          <button key={item.key} className={active === item.key ? 'active' : ''} onClick={() => setActive(item.key)} style={{ '--route-color': item.color } as React.CSSProperties}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="arch-figure-stage" style={{ '--route-color': route.color } as React.CSSProperties}>
        <img src="/images/fig-architecture.png?v=figure4-full-2" alt="论文 Figure 4：JoyAI-Image 统一架构" />
        <RouteOverlay route={active} />
      </div>
      <div className="arch-route-readout" style={{ '--route-color': route.color } as React.CSSProperties}>
        <div className="arch-route-steps">{route.steps.map((step, index) => <span key={step}><b>{index + 1}</b>{step}</span>)}</div>
        <p>{route.summary}</p>
      </div>
    </div>
  );
}

export default FigArch;
