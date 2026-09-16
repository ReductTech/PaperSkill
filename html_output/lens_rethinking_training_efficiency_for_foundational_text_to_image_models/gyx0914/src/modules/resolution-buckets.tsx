import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { sceneUrl } from './teaching-visuals';

const ratios = ['1:2', '9:16', '2:3', '3:4', '1:1', '4:3', '3:2', '16:9', '2:1'];
const buckets = [
  { base: '512²', sizes: [[352, 704], [384, 672], [416, 640], [448, 608], [512, 512], [608, 448], [640, 416], [672, 384], [704, 352]] },
  { base: '768²', sizes: [[544, 1088], [576, 1024], [640, 960], [672, 896], [768, 768], [896, 672], [960, 640], [1024, 576], [1088, 544]] },
  { base: '1024²', sizes: [[736, 1472], [768, 1376], [832, 1248], [864, 1152], [1024, 1024], [1152, 864], [1248, 832], [1376, 768], [1472, 736]] },
];
const fit = (width: number, height: number, maxWidth: number, maxHeight: number) => {
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return { width: width * scale, height: height * scale };
};

export const ResolutionBuckets: React.FC<WidgetProps> = () => {
  const [row, setRow] = useState(0);
  const [column, setColumn] = useState(4);
  const [touched, setTouched] = useState(false);
  const [width, height] = buckets[row].sizes[column];
  const previewSize = fit(width, height, 200, 170);

  return (
    <div className="lens-buckets lens-widget">
      <div className="lens-widget-kicker">27 个训练桶，带来超出训练桶的生成能力</div>
      <div className="lens-buckets-generalization">
        <div><span>训练时</span><strong>27 个具体尺寸</strong></div>
        <b aria-hidden="true">→</b>
        <div><span>推理时</span><strong>未见过的 5:4、6:7 等比例</strong></div>
        <b aria-hidden="true">→</b>
        <div><span>更高图像面积</span><strong>最高 1440²</strong></div>
      </div>
      <p className="lens-buckets-generalization-note">论文报告：Lens 在 1:2 至 2:1 的比例范围内也能生成训练未见过的尺寸与构图。这是混合分辨率训练带来的重要泛化能力。</p>
      <div className="lens-buckets-stages">
        <div><b>① 固定尺寸预训练</b><span>512 × 512，40 万次迭代</span></div>
        <div><b>② 混合分辨率续训</b><span>在已有模型上接着训练；三种基础面积 × 九种长宽比，另 40 万次迭代</span></div>
      </div>
      <p className="lens-widget-instruction">点选下方任一格，看看模型训练时具体见过哪些尺寸；上方的生成范围超出了这些格子。</p>
      <div className="lens-buckets-layout">
        <div className="lens-buckets-scroll" aria-label="27 个训练分辨率桶">
          <div className="lens-buckets-grid">
            <span className="lens-buckets-corner">基础面积 ↓<br />长宽比 →</span>
            {ratios.map(ratio => <span className="lens-buckets-label" key={ratio}>{ratio}</span>)}
            {buckets.map((group, r) => (
              <React.Fragment key={group.base}>
                <span className="lens-buckets-label">{group.base}</span>
                {group.sizes.map(([w, h], c) => (
                  <button
                    type="button"
                    className={`lens-bucket ${row === r && column === c ? 'is-selected' : ''}`}
                    key={`${group.base}-${ratios[c]}`}
                    onClick={() => { setRow(r); setColumn(c); setTouched(true); }}
                    aria-pressed={row === r && column === c}
                    aria-label={`${group.base} 基础面积，${ratios[c]} 长宽比，${w} 乘 ${h} 像素`}
                  >
                    <span className="lens-bucket-shape" style={fit(w, h, 40, 30)} />
                    <small>{w}×{h}</small>
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="lens-buckets-result" aria-live="polite">
          <div className="lens-buckets-preview"><div className="lens-buckets-paper" style={previewSize}><img src={sceneUrl(column < 4 ? 'cat-portrait' : column > 4 ? 'cat-landscape' : 'cat-chair')} alt="猫与椅子的构图预览" /></div></div>
          <strong>{width} × {height} 像素</strong>
          <span>基础面积 {buckets[row].base} · 长宽比 {ratios[column]}</span>
          <p>“基础面积”用于分组；具体桶尺寸经过取整，不能把 {buckets[row].base} 当成每个格子的精确像素总数。</p>
        </div>
      </div>
      <div className={`feedback ${touched ? 'good' : ''}`}>
        {touched ? `你选中了训练时见过的 ${width}×${height}。Lens 的亮点是它不只会生成这 27 个尺寸：论文报告它还能生成未见过的 5:4、6:7 等比例，并达到 1440² 图像面积。` : '点一个训练桶，再对照上方的推理成果：模型能够把训练中学到的构图规律用到新尺寸。'}
      </div>
      <p className="lens-widget-source">依据：论文 §2.3 的训练桶与分辨率泛化结果。猫图按所选画框裁切，仅用于讲解构图。</p>
    </div>
  );
};
