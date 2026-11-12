import { Sub } from "./lesson-math";
import { PatchCrop, PatchGrid, Specimen } from "./specimen";
import { Term } from "../shared/core/reference/ReferenceHub";

export function Arrow() {
  return <svg className="flow-arrow" viewBox="0 0 24 18" aria-hidden="true"><path d="M2 9h18m-6-5 6 5-6 5" /></svg>;
}

export function VectorGlyph({ kind = "token" }: { kind?: "pixel" | "token" | "position" }) {
  return <span aria-hidden="true" className={`vector-glyph vector-${kind}`}>
    {Array.from({ length: 7 }, (_, i) => <i key={i} />)}
  </span>;
}

function TokenRow({ index, output = false }: { index?: number; output?: boolean }) {
  return <div className="architecture-tokens" aria-label={output ? "末层输出序列" : "输入序列"}>
    <span className="token special"><Term id="cls-token">{output ? "[CLS]" : "[CLS]"}</Term></span>
    {index !== undefined && index > 0 && <span>…</span>}
    <span className={index === undefined ? "token" : "token traced-token"} data-token-index={index}><Term id="patch-token">{index === undefined ? "Patch 1" : index + 1}</Term></span>
    {index !== 195 && <span>…</span>}
    {output && <span className="token"><Term id="patch-token">Patch 196</Term></span>}
  </div>;
}

export function ViTOverview({ index, select }: { index: number; select: (index: number) => void }) {
  return <figure className="lesson-figure architecture">
    <div className="figure-top"><strong><Term id="vit">Vision Transformer</Term> · 从图像到分类读出</strong><span>典型 <Term id="vit-b16">ViT-B/16</Term> · 224 × 224 输入</span></div>
    <div className="figure-body">
      <div className="architecture-lanes" aria-label="ViT 端到端架构">
        <div className="arch-boundary"><b>fₑ</b> <Term id="embedding-layer">输入嵌入</Term> · 形成序列</div>
        <div className="arch-boundary"><b>fᵣ</b> 编码</div>
        <div className="arch-boundary arch-readout"><Term id="classification-head">分类读出</Term></div>
        <section className="arch-node">
          <h4>输入图像</h4><Specimen /><small>224 × 224 × 3</small>
        </section>
        <section className="arch-node">
          <h4>分割成 <Term id="image-patch">Patch</Term></h4><PatchGrid index={index} select={select} /><small>14 × 14 个位置</small>
        </section>
        <section className="arch-node">
          <h4><Term id="image-patch">Patch</Term> → <Term id="patch-token">Token</Term></h4><div className="arch-projection"><VectorGlyph kind="pixel" /><span><Term id="linear-projection">线性投影</Term></span><VectorGlyph /></div><small>每块一个 D 维向量</small>
        </section>
        <section className="arch-node">
          <h4><Term id="token-sequence">组装序列</Term></h4><TokenRow index={index} /><div className="position-row"><span>+</span><VectorGlyph kind="position" /></div><small>加上对应 <Term id="position-embedding">位置向量</Term></small>
        </section>
        <section className="arch-node stack-node">
          <h4><Term id="encoder-block">Encoder × 12</Term></h4><ol className="block-stack"><li>Block 1</li><li>Block 2</li><li>⋮</li><li className="stack-focus"><Term id="encoder-block">Block ℓ</Term></li><li>⋮</li><li>Block 12</li></ol><small>逐层更新 Token</small>
        </section>
        <section className="arch-node arch-last">
          <h4>输出 Token</h4><TokenRow output /><div className="readout-line"><span><Term id="cls-token">[CLS]</Term> 特征</span><Arrow /><span><Term id="classification-head">分类头</Term></span></div><small>普通 ViT 的读出</small>
        </section>
      </div>
      <div className="arch-zoom-link"><span>放大堆叠中的 Block ℓ</span></div>
      <BlockDiagram compact />
      <div className="architecture-legend"><span><i className="legend-image" />图像空间</span><span><i className="legend-token" />向量特征</span><span><i className="legend-special" />[CLS] 与选中位置</span></div>
    </div>
    <figcaption>冻结的特征主干是 <math><mi>f</mi><mo>=</mo><Sub base="f" index="r" /><mo>∘</mo><Sub base="f" index="e" /></math>。图中右侧展示普通 ViT 从末层 [CLS] 到分类头的路径。L2P 会在后续为 [CLS] 特征和分类读出安排不同用途。</figcaption>
  </figure>;
}

export function PatchJourney({ index }: { index: number }) {
  return <div className="patch-journey">
    <div className="patch-crop-stage"><PatchCrop index={index} /><b><Term id="image-patch">Patch {index + 1}</Term></b><small>16 × 16 × 3</small></div>
    <Arrow />
    <div><VectorGlyph kind="pixel" /><b>按固定顺序 <Term id="flattening">展平</Term></b><small>768 个像素通道值</small></div>
    <Arrow />
    <div><svg className="matrix-glyph" viewBox="0 0 70 56" aria-hidden="true">
      <path d="M11 4H5v48h6M59 4h6v48h-6" fill="none" stroke="currentColor" strokeWidth="2" />
      {Array.from({length: 25}, (_, i) => <rect key={i} x={14 + i % 5 * 9} y={7 + Math.floor(i / 5) * 9}
        width="6" height="6" fill="currentColor" opacity={.22 + ((i * 11) % 7) / 12} />)}
    </svg><b>共享 <Term id="linear-projection">线性投影</Term></b><small>混合像素通道</small></div>
    <Arrow />
    <div><VectorGlyph /><b><Term id="patch-token">Token {index + 1}</Term></b><small>768 个嵌入坐标</small></div>
  </div>;
}

function Residual({ input, result, operation, detail }: { input: string; result: string; operation: string; detail: string }) {
  return <div className="residual-unit">
      <div className="bypass"><span>{input} 沿<Term id="residual-connection">残差支路</Term>直达加法</span></div>
    <div className="block-nodes">
      <strong>{input}</strong><Arrow /><span><Term id="layer-normalization">LayerNorm</Term></span><Arrow />
      <b><Term id={operation === "多头注意力" ? "multi-head-attention" : "ffn"}>{operation}</Term>
        {operation === "多头注意力" && <span className="mini-heads" aria-hidden="true"><i /><i /><i /><em /><VectorGlyph /></span>}
        <small>{detail}</small>
      </b><Arrow /><span className="sum-node" aria-label="与残差相加">+</span><Arrow /><strong>{result}</strong>
    </div>
  </div>;
}

export function BlockDiagram({ compact = false }: { compact?: boolean }) {
  return <div className={`encoder-cutaway ${compact ? "cutaway-overview" : ""}`}>
      {compact && <div className="cutaway-title"><b><Term id="encoder-block">Transformer Encoder Block</Term></b><span>典型 <Term id="pre-ln">Pre-LN</Term> 结构</span></div>}
    <div className="block-flow">
      <Residual input="Z" operation="多头注意力" detail="跨 Token 汇聚" result="U" />
      <Residual input="U" operation="MLP / FFN" detail="逐 Token 变换" result="Z′" />
    </div>
  </div>;
}
