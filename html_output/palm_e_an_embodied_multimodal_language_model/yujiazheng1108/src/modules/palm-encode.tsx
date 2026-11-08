import { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { Choice, Kitchen } from './palm-kit';

const sources = [
  { name: '状态向量', observed: '位置、大小、颜色等数值', transform: 'MLP 状态编码器', slices: 1, image: false, note: '输入本身已是数值化的场景状态。' },
  { name: '图像', observed: '抽屉的 RGB 图像', transform: 'ViT ＋ 学习的仿射投影', slices: 4, image: true, note: 'ViT 的特征维度可以和语言嵌入维度不同，投影把它对齐。' },
  { name: '对象槽', observed: '多视角图像的对象槽', transform: 'OSRT ＋ 逐槽应用 MLP', slices: 3, image: true, note: 'OSRT 用多视角学习对象表征；每个槽可生成多条嵌入向量。' },
];

export function PalmEncode() {
  const [index, setIndex] = useState(1);
  const source = sources[index];
  return <div className="pk-body pk-stack pk-encode">
    <div className="pk-options">
      {sources.map((item, i) => <Choice key={item.name} active={index === i} onClick={() => setIndex(i)}>{item.name}</Choice>)}
    </div>
    <div className="pk-encoder-grid">
      <div className="pk-card pk-stack">
        <h2>{source.name}</h2>
        <Kitchen opening={.8} sponge={index === 2 ? 1 : 0} camera={source.image} />
        <p>{source.observed}</p>
      </div>
      <div className="pk-card pk-stack pk-project">
        <h2>编码与维度对齐</h2><p>{source.transform}</p>
        <div className="pk-formula">
          <SymbolHint meaning="观测编码器。">φ</SymbolHint>
          <span>：</span><SymbolHint meaning="传感器观测空间。">O</SymbolHint>
          <span> → </span><SymbolHint meaning="由 q 个与词嵌入同宽的向量组成的序列空间。">X<sup>q</sup></SymbolHint>
        </div>
      </div>
      <div className="pk-card pk-stack">
        <h2>进入 PaLM 的向量</h2>
        <div className="pk-vector-grid" aria-label="对齐宽度后的向量数量示意">
          {Array.from({ length: source.slices }, (_, i) => <div className="pk-vector" key={i} aria-hidden="true">
            {Array.from({ length: 7 }, (_, col) => <i key={col} />)}
          </div>)}
        </div>
        <p>每行同宽，条数仅作示意。</p>
      </div>
    </div>
    <p className="pk-strip">{source.note}</p>
  </div>;
}
