import { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, W } from './visual-core';
import { EvidenceLens } from './evidence-lens';

type Mode = 'scale' | 'data' | 'freeze' | 'public';
const SCALE = [
  { model: '0.6B', label: 'Baseline', value: 24.9, color: C.light }, { model: '0.6B', label: 'REPR-ALIGN', value: 31.0, color: C.purple },
  { model: '1.7B', label: 'Baseline', value: 31.1, color: C.light }, { model: '1.7B', label: 'REPR-ALIGN', value: 40.5, color: C.purple },
];

function ScaleChart({ visible }: { visible: boolean }) {
  const max = 45;
  return <svg className="ra-svg result-svg" viewBox={`0 0 ${W} 330`} role="img" aria-label="0.6B 和 1.7B 模型 HumanEval pass@10 对比">
    <rect width={W} height="330" fill={C.bg} /><line x1="90" y1="270" x2="1010" y2="270" stroke={C.muted} /><line x1="90" y1="42" x2="90" y2="270" stroke={C.muted} />
    {[0, 10, 20, 30, 40].map((tick) => <g key={tick}><line x1="84" y1={270 - tick / max * 210} x2="1010" y2={270 - tick / max * 210} stroke={C.line} /><text x="50" y={276 - tick / max * 210} fill={C.muted} fontSize="14">{tick}</text></g>)}
    {SCALE.map((bar, index) => { const height = visible ? bar.value / max * 210 : 8; const x = 190 + index * 190; return <g key={`${bar.model}-${bar.label}`}><rect x={x} y={270 - height} width="110" height={height} rx="5" fill={bar.color} /><text x={x + 55} y={260 - height} textAnchor="middle" fill={C.text} fontSize="20" fontWeight="700">{bar.value.toFixed(1)}</text><text x={x + 55} y="296" textAnchor="middle" fill={C.text} fontSize="14">{bar.model}</text><text x={x + 55} y="316" textAnchor="middle" fill={C.muted} fontSize="12">{bar.label}</text></g>; })}
    <text transform="translate(24 230) rotate(-90)" fill={C.text} fontSize="15" fontWeight="700">HumanEval pass@10 (%)</text>
  </svg>;
}

export const ResultExplorer: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('scale');
  const [visible, setVisible] = useState(true);
  const replayFrame = useRef<number | null>(null);

  useEffect(() => () => {
    if (replayFrame.current !== null) cancelAnimationFrame(replayFrame.current);
  }, []);

  const replay = () => {
    setVisible(false);
    if (replayFrame.current !== null) cancelAnimationFrame(replayFrame.current);
    replayFrame.current = requestAnimationFrame(() => {
      replayFrame.current = null;
      setVisible(true);
    });
  };

  return <div className="result-explorer">
    <div className="chip-row"><button type="button" className={`chip ${mode === 'scale' ? 'selected' : ''}`} onClick={() => setMode('scale')}>模型规模</button><button type="button" className={`chip ${mode === 'data' ? 'selected' : ''}`} onClick={() => setMode('data')}>低数据</button><button type="button" className={`chip ${mode === 'freeze' ? 'selected' : ''}`} onClick={() => setMode('freeze')}>冻结参数</button><button type="button" className={`chip ${mode === 'public' ? 'selected' : ''}`} onClick={() => setMode('public')}>4B 公开对比</button>{mode === 'scale' && <button type="button" className="tiny ghost" onClick={replay}>重播柱图</button>}</div>
    {mode === 'scale' && <><ScaleChart visible={visible} /><div className="feedback good">200k 步 HumanEval pass@10：0.6B 为 24.9→31.0，1.7B 为 31.1→40.5；较大模型获得更大的绝对增益。</div><EvidenceLens src="./images/figure-3-results.png" title="Figure 3 · 训练效率与规模" caption="论文 Figure 3：左侧比较训练步数曲线，右侧给出 0.6B 与 1.7B 在 200k 步时的 pass@10。" hotspots={[
      { id: 'speed', label: '训练曲线', detail: '左图显示 REPR-ALIGN 在早期转换中持续高于 baseline；“最高 4×”来自训练步数效率比较。', box: { left: 2, top: 3, width: 49, height: 66 } },
      { id: 'scale', label: '规模效应', detail: '右图的绝对增益从 0.6B 的 6.1 点扩大到 1.7B 的 9.4 点。', box: { left: 57, top: 3, width: 41, height: 66 } },
    ]} /></>}
    {mode === 'data' && <div className="evidence-card-grid"><article><span>REPR-ALIGN + FreezeEmb</span><strong>50B tokens</strong><p>固定训练步数下的完整数据流。</p></article><div className="evidence-arrow">→</div><article className="winner"><span>REPR-ALIGN + FreezeEmb · 有放回采样</span><strong>0.8B tokens</strong><p>Figure 5 中，pass@1 和 pass@10 曲线均高于对应的 50B-token 流。</p></article><div className="feedback good wide">比较固定模型设置、batch size、序列长度和训练步数；tiny 子集有放回采样。论文没有给出所有曲线端点的精确表格值，因此这里只展示协议与方向。</div></div>}
    {mode === 'freeze' && <div className="freeze-table-wrap"><table className="paper freeze-table"><thead><tr><th>1.7B 设置</th><th>HumanEval pass@10</th><th>吞吐量 M tok/s</th></tr></thead><tbody><tr><td>Baseline</td><td>31.1</td><td>0.071</td></tr><tr><td>Freeze Emb</td><td className="best-cell">40.5</td><td>0.071</td></tr><tr><td>Freeze Emb + MLP</td><td>37.6</td><td className="best-cell">0.140</td></tr></tbody></table><div className="feedback good">Figure 4：冻结 Embedding + MLP 把吞吐量从 0.071 提高到 0.140 M tok/s，同时 pass@10 从 31.1 提高到 37.6。</div></div>}
    {mode === 'public' && <div className="freeze-table-wrap"><table className="paper freeze-table"><thead><tr><th rowSpan={2}>Table 1 摘录</th><th colSpan={2}>HumanEval</th><th colSpan={2}>HumanEval+</th><th colSpan={2}>MBPP</th><th colSpan={2}>MBPP+</th></tr><tr><th>pass@1</th><th>pass@10</th><th>pass@1</th><th>pass@10</th><th>pass@1</th><th>pass@10</th><th>pass@1</th><th>pass@10</th></tr></thead><tbody><tr><td>Dream (7B)</td><td>56.7</td><td>59.2</td><td>50.0</td><td>53.7</td><td>55.4</td><td>56.2</td><td>71.5</td><td>72.5</td></tr><tr><td>oDLM (4B)</td><td>30.49</td><td className="best-cell">61.59</td><td>26.95</td><td className="best-cell">56.10</td><td>14.42</td><td>37.00</td><td>20.24</td><td>47.35</td></tr></tbody></table><div className="feedback good">这里只摘录论文 Table 1 中 Dream-7B 与 oDLM-4B 两行。oDLM-4B 的 HumanEval / HumanEval+ pass@10 比 Dream-7B 高 2.39 / 2.40 点；其 pass@1 与 MBPP 系列较低，因此这不是全指标领先。</div></div>}
  </div>;
};
