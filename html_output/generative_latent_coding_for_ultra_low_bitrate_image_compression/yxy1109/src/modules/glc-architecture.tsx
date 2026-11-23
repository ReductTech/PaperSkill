import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { CodeChip, MosaicArtwork, StageBadge, StudioPanel } from './glc-kit';

type Part = 'x' | 'E' | 'l' | 'g_a' | 'y' | 'Q' | 'y_hat' | 'g_s' | 'l_hat' | 'D' | 'x_hat';
type Task = 'natural' | 'face';

const parts: Part[] = ['x', 'E', 'l', 'g_a', 'y', 'Q', 'y_hat', 'g_s', 'l_hat', 'D', 'x_hat'];
const labels: Record<Part, string> = {
  x: '照片 x', E: '潜编码 E', l: '潜码 l', g_a: '分析 gₐ', y: '变换码 y', Q: '量化 Q',
  y_hat: 'ŷ', g_s: '合成 gₛ', l_hat: 'l̂', D: '潜解码 D', x_hat: '重建 x̂'
};
const info: Record<Part, { title: string; body: string; formula: string }> = {
  x: { title: '输入照片', body: 'GLC 的入口仍是普通图像；变化发生在“在哪里做变换编码”。', formula: 'x ∈ ℝ^{H×W×3}' },
  E: { title: '潜编码器', body: '生成式 VQ-VAE 把像素映射到离散语义潜码，生成式解码能力在这个阶段形成。', formula: 'l = E(x)' },
  l: { title: '离散语义潜码', body: '潜码是后续压缩的工作对象；它比像素更稀疏，也更贴近主体、结构和纹理语义。', formula: 'l ∈ ℝ^{h×w×256}' },
  g_a: { title: '分析变换', body: '分析变换继续消除潜码空间冗余，把 l 变成更适合熵编码的变换码 y。', formula: 'y = gₐ(l)' },
  y: { title: '连续变换码', body: 'y 仍是连续特征；它还没有进入码流，真正传输前要经过标量量化。', formula: 'y = gₐ(l)' },
  Q: { title: '标量量化', body: '量化把连续码映射到可熵编码的离散值；训练中通常用可微代理模拟不可导的量化。', formula: 'ŷ = Q(y)' },
  y_hat: { title: '量化后的变换码', body: '熵模型对 ŷ 建模并由算术编码写入码流；分类超先验和空间上下文共同估计概率。', formula: 'ŷ = Q(y)' },
  g_s: { title: '合成变换', body: '解码端先从 ŷ 重建潜码 l̂，再把它交给生成式潜解码器。', formula: 'l̂ = gₛ(ŷ)' },
  l_hat: { title: '重建潜码', body: 'l̂ 不必被码预测器重新量化，因此能保留更灵活的特征，避免部署时多一道码本瓶颈。', formula: 'l̂ = gₛ(ŷ)' },
  D: { title: '生成式潜解码器', body: '潜解码器补全纹理并生成照片；它的能力来自 Stage I 的生成式训练。', formula: 'x̂ = D(l̂)' },
  x_hat: { title: '最终重建', body: '最终码流只携带量化变换码、超信息和上下文所需信息，x̂ 由解码网络生成。', formula: 'x̂ = D(gₛ(Q(gₐ(E(x)))))' }
};

export function GlcArchitecture() {
  const [task, setTask] = useState<Task>('natural');
  const [selected, setSelected] = useState<Part>('l');
  const current = info[selected];
  return <div className="glc-scene glc-architecture-page">
    <div className="glc-architecture-toolbar">
      <StageBadge tone="blue">前向路径 · 式 (1)</StageBadge>
      <div className="glc-segmented is-small" role="group" aria-label="选择模型配置">
        <button className={task === 'natural' ? 'is-active' : ''} onClick={() => setTask('natural')}>自然图像</button>
        <button className={task === 'face' ? 'is-active is-purple' : ''} onClick={() => setTask('face')}>人脸</button>
      </div>
      <span className="glc-toolbar-note">{task === 'natural' ? 'f = 1/16 · M = 16384' : 'f = 1/32 · M = 1024'}</span>
    </div>
    <StudioPanel className="glc-path-board" tone="blue">
      <div className="glc-path-row" role="group" aria-label="GLC 前向路径，点击部件查看说明">
        {parts.map((part, index) => <React.Fragment key={part}>
          <button className={`glc-path-node ${selected === part ? 'is-active' : ''}`}
            onClick={() => setSelected(part)} aria-pressed={selected === part}>
            <span>{labels[part]}</span>
          </button>
          {index < parts.length - 1 && <span className="glc-path-arrow" aria-hidden="true">→</span>}
        </React.Fragment>)}
      </div>
      <div className="glc-mini-stream">
        <span>像素入口</span><i /><span>语义潜码</span><i /><span>可熵编码变换码</span><i /><span>生成重建</span>
      </div>
    </StudioPanel>
    <div className="glc-architecture-bottom">
      <StudioPanel className="glc-part-explainer" tone="blue">
        <div className="glc-card-title"><span>{current.title}</span><CodeChip tone="blue">{labels[selected]}</CodeChip></div>
        <p>{current.body}</p>
        <div className="glc-formula is-small">
          {selected === 'E' || selected === 'l'
            ? <><SymbolHint meaning="E：生成式 VQ-VAE 的潜编码器，将像素 x 映射到潜码 l。">E</SymbolHint>
              <span>(</span><SymbolHint meaning="x：尺寸为 H×W×3 的输入图像。">x</SymbolHint><span>)</span></>
            : selected === 'g_a' || selected === 'y'
              ? <><SymbolHint meaning="gₐ：分析变换，把潜码 l 映射为变换码 y。">gₐ</SymbolHint>
                <span>(</span><SymbolHint meaning="l：生成式 VQ-VAE 输出的连续潜码特征。">l</SymbolHint><span>)</span></>
              : selected === 'Q' || selected === 'y_hat'
                ? <><SymbolHint meaning="Q：标量量化算子，产生可熵编码的离散码。">Q</SymbolHint>
                  <span>(</span><SymbolHint meaning="y：量化前的连续变换码。">y</SymbolHint><span>)</span></>
                : selected === 'g_s' || selected === 'l_hat'
                  ? <><SymbolHint meaning="gₛ：合成变换，从量化码恢复潜码特征。">gₛ</SymbolHint>
                    <span>(</span><SymbolHint meaning="ŷ：量化后的变换码，也是码流中的主要语法元素。">ŷ</SymbolHint><span>)</span></>
                  : <><SymbolHint meaning="D：生成式潜解码器，把潜码恢复为图像。">D</SymbolHint>
                    <span>(</span><SymbolHint meaning="l̂：解码端由量化码重建的潜码。">l̂</SymbolHint><span>)</span></>}
        </div>
      </StudioPanel>
      <StudioPanel className="glc-config-card" tone="purple">
        <MosaicArtwork className="glc-arch-mini" detail={task === 'natural' ? 82 : 58}
          mode="latent" generative label={task === 'natural' ? '自然图像潜空间示意' : '人脸潜空间示意'} />
        <div>
          <strong>{task === 'natural' ? '自然图像模型' : '人脸模型'}</strong>
          <p>{task === 'natural' ? '空间下采样 16 倍，主码本 16384 项。' : '空间下采样 32 倍，主码本 1024 项。'}</p>
          <CodeChip tone="purple">主变换通道 N = 256</CodeChip>
        </div>
      </StudioPanel>
    </div>
  </div>;
}
