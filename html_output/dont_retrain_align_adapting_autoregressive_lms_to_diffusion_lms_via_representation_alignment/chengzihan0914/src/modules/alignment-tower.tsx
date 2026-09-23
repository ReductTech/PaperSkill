import { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { EvidenceLens } from './evidence-lens';
import { C, clamp, mixColor, W } from './visual-core';

const LAMBDAS = [0, 1, 5, 10, 20];
const BASE = [0.28, 0.34, 0.39, 0.32, 0.36];
const GAIN = [0.54, 0.50, 0.49, 0.57, 0.53];

export const AlignmentTower: React.FC<WidgetProps> = () => {
  const [lambda, setLambda] = useState(10);
  const [layer, setLayer] = useState(3);
  const strength = lambda === 0 ? 0 : lambda === 1 ? 0.25 : lambda === 5 ? 0.6 : lambda === 10 ? 1 : 0.72;
  const similarities = useMemo(() => BASE.map((base, index) => clamp(base + GAIN[index] * strength, 0, 0.96)), [strength]);
  return <div className="alignment-lab">
    <svg className="ra-svg alignment-svg" viewBox={`0 0 ${W} 340`} role="img" aria-label="冻结 AR 教师与可训练 DLM 学生的五层教学示意；实际层数由模型决定">
      <rect width={W} height="340" fill={C.bg} />
      <text x="110" y="34" fill={C.blue} fontSize="22" fontWeight="700">❄ 冻结 AR 教师</text>
      <text x="800" y="34" fill={C.green} fontSize="22" fontWeight="700">↔ 可训练 DLM</text>
      {similarities.map((similarity, index) => { const y = 62 + index * 50; const selected = layer === index; return <g key={index}>
        <rect x="90" y={y} width="205" height="34" rx="8" fill="#e4ebf3" stroke={selected ? C.orange : C.blue} strokeWidth={selected ? 4 : 2} />
        <text x="110" y={y + 23} fill={C.text} fontSize="15">AR hidden · L{index + 1}</text>
        <line x1="295" y1={y + 17} x2="785" y2={y + 17} stroke={lambda === 0 ? C.red : mixColor(C.orange, C.green, similarity)} strokeWidth={2 + similarity * 5} />
        <circle cx="540" cy={y + 17} r="24" fill="#fff" stroke={selected ? C.orange : C.line} strokeWidth="2" />
        <text x="540" y={y + 22} textAnchor="middle" fill={C.text} fontSize="13" fontWeight="700">{similarity.toFixed(2)}</text>
        <rect x="785" y={y} width="205" height="34" rx="8" fill={mixColor('#f8ddd1', '#d5efe2', similarity)} stroke={selected ? C.orange : C.green} strokeWidth={selected ? 4 : 2} />
        <text x="805" y={y + 23} fill={C.text} fontSize="15">DLM hidden · L{index + 1}</text>
      </g>; })}
      <text x="350" y="328" fill={C.muted} fontSize="14">五层与连线数值均为教学示意，不代表真实层数或逐层实测曲线</text>
    </svg>
    <div className="ctrl"><label htmlFor="lambda-control">对齐权重 <span className="val">λ = {lambda}</span></label><select id="lambda-control" aria-label="表示对齐权重" value={lambda} onChange={(event) => setLambda(Number(event.target.value))}>{LAMBDAS.map((value) => <option key={value} value={value}>λ = {value}</option>)}</select></div>
    <div className="chip-row">{similarities.map((value, index) => <button type="button" key={index} className={`chip ${layer === index ? 'selected' : ''}`} onClick={() => setLayer(index)}>层 {index + 1} · {value.toFixed(2)}</button>)}</div>
    <div className={`feedback ${lambda === 10 ? 'good' : lambda === 0 || lambda === 20 ? 'bad' : ''}`}>{lambda === 10 ? 'λ=10 是论文采用的默认点。五层与数值为教学示意；实际默认对齐 embedding、全部 block 输出和最终归一化 hidden state。' : lambda === 20 ? '更强并不总更好：Table 2 中 λ=20 的 pass@1 / pass@10 都低于 λ=10。' : lambda === 0 ? '没有表示锚点时，学生只接收去噪与共享的路径规划目标；红线表示可能出现的表示漂移。' : '锚点逐渐增强；实际优劣由下方消融数据判断。'}</div>
    <EvidenceLens src="./images/figure-2-method.png" title="Figure 2 · 方法架构" caption="论文 Figure 2：同架构 AR 教师保持因果注意力并冻结；DLM 学生切换为双向注意力，逐层接收表示对齐损失。" hotspots={[
      { id: 'teacher', label: '冻结教师', detail: '干净序列进入 pretrained AR，雪花表示其参数不更新。', box: { left: 3, top: 16, width: 34, height: 66 } },
      { id: 'loss', label: '逐层对齐', detail: '对应层的 hidden state 进入 L_align，教师侧停止梯度。', box: { left: 38, top: 25, width: 25, height: 56 } },
      { id: 'student', label: '双向学生', detail: '被遮蔽序列进入 DLM，完整目标包含 L_mdm、共享的 L_path 与加权的 L_align。', box: { left: 63, top: 16, width: 34, height: 68 } },
    ]} />
  </div>;
};
