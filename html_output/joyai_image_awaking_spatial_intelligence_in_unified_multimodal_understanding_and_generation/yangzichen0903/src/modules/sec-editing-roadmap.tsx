import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Layer = 'data' | 'training' | 'results';
const layers = [
  { key:'data' as const, index:'01', en:'DATA', zh:'空间监督从哪里来', color:'#33ccff' },
  { key:'training' as const, index:'02', en:'TRAINING', zh:'怎样学会改与保留', color:'#ffcc00' },
  { key:'results' as const, index:'03', en:'RESULTS', zh:'空间控制真的成立吗', color:'#ff3366' }
];

export const SecEditingRoadmap: React.FC<WidgetProps> = () => {
  const [active,setActive] = useState<Layer>('data');
  const current = layers.find(item => item.key === active)!;
  return <div className="generation-roadmap editing-roadmap">
    <div className="gen-route">
      {layers.map((item,index) => <React.Fragment key={item.key}>
        <button className={active === item.key ? 'active' : ''} style={{'--route-color':item.color} as React.CSSProperties} onClick={() => setActive(item.key)}>
          <b>{item.index}</b><span>{item.en}</span><small>{item.zh}</small>
        </button>{index < 2 ? <i aria-hidden="true">→</i> : null}
      </React.Fragment>)}
    </div>
    <div className="gen-layer-head" style={{'--route-color':current.color} as React.CSSProperties}>
      <span>{current.index}</span><div><b>{current.en}</b><p>{current.zh}</p></div>
    </div>

    {active === 'data' ? <div className="edit-data-layout">
      <section className="edit-spatial-core">
        <div className="edit-core-label">CORE · SPATIAL EDITING DATA ENGINE</div>
        <h4>用可控 3D 渲染制造几何无歧义的编辑对</h4>
        <p>自然图像对很少同时给出明确的物体运动、视角变化和控制参数，因此论文用 Blender 构造两条互补分支。</p>
        <div className="edit-branches">
          <article><b>STATIC-CAMERA</b><h5>物体变换分支</h5><strong>移动 · 旋转 · 缩放</strong><p>固定相机与场景，让目标物体发生局部变化；重点学习“只改目标、背景保持”。</p></article>
          <div className="edit-branch-plus">+</div>
          <article><b>DYNAMIC-CAMERA</b><h5>视角变换分支</h5><strong>Yaw · Pitch · Zoom</strong><p>固定 3D 场景结构，采样相机姿态；重点学习全局视角变化与空间关系保持。</p></article>
        </div>
      </section>
      <aside className="edit-support-data">
        <h4>通用能力底座</h4>
        <div><b>Open-domain</b><span>视频帧对提供真实运动与自然变化，约占语料近一半。</span></div>
        <div><b>General Editing</b><span>开源数据、专家蒸馏、文字编辑与多图编辑覆盖长尾任务。</span></div>
        <p>它们的作用不是抢走空间主线，而是避免模型只会几何变换，却失去普通编辑和内容保持能力。</p>
      </aside>
    </div> : null}

    {active === 'training' ? <div className="gen-training-list edit-training-list">
      <article><span>1</span><div><em>PRE-TRAIN</em><h4>先学会把指令理解为图像变换</h4><strong>生成/重建先验 + 粗粒度编辑监督</strong><p>视频帧对帮助模型识别源图与目标图之间的可执行差异。</p></div></article>
      <article><span>2</span><div><em>CONTINUE</em><h4>把空间、文字和多图数据混进高质量训练</h4><strong>可编辑性 + 内容保持 + 视觉质量</strong><p>这是将粗略编辑能力变成稳定、可控编辑行为的主阶段。</p></div></article>
      <article><span>3</span><div><em>SFT</em><h4>针对高敏感能力继续收紧</h4><strong>空间精度 · 文字准确 · 局部控制</strong><p>重新平衡专门任务，避免大量普通编辑样本淹没空间监督。</p></div></article>
      <article className="with-formula"><span>4</span><div><em>POST-TRAIN</em><h4>用 DiffusionNFT 做偏好优化</h4><strong>指令遵循优先 + 自然度奖励</strong><p>Gemini-3-Flash 评价指令一致性，HPSv3 补充自然度；指令没执行好时不能靠“好看”获得高奖励。</p></div>
        <aside className="gen-pretrain-formula edit-nft-formula full-training-formula" aria-label="DiffusionNFT 后训练目标">
          <small>DIFFUSIONNFT OBJECTIVE</small>
          <div className="paper-equation nft-main">
            <b>L<sub>NFT</sub> = E<sub>c,π<sup>old</sup>(x₀|c),t,ε</sub>[</b>
            <span>r‖v<sub>θ</sub><sup>+</sup>(x<sub>r</sub>,x<sub>t</sub>,c,t)−v‖<sub>2</sub><sup>2</sup> + (1−r)‖v<sub>θ</sub><sup>−</sup>(x<sub>r</sub>,x<sub>t</sub>,c,t)−v‖<sub>2</sub><sup>2</sup> ]</span>
          </div>
          <div className="paper-equation nft-policy"><b>v<sub>θ</sub><sup>+</sup>(x<sub>r</sub>,x<sub>t</sub>,c,t) :=</b><span>(1−β)v<sub>θ</sub><sup>old</sup>(x<sub>r</sub>,x<sub>t</sub>,c,t) + βv<sub>θ</sub>(x<sub>r</sub>,x<sub>t</sub>,c,t)</span><em>Implicit positive policy</em></div>
          <div className="paper-equation nft-policy"><b>v<sub>θ</sub><sup>−</sup>(x<sub>r</sub>,x<sub>t</sub>,c,t) :=</b><span>(1+β)v<sub>θ</sub><sup>old</sup>(x<sub>r</sub>,x<sub>t</sub>,c,t) − βv<sub>θ</sub>(x<sub>r</sub>,x<sub>t</sub>,c,t)</span><em>Implicit negative policy</em></div>
          <p>r∈[0,1] 是样本最优概率：高 r 推向隐式正策略，低 r 推向隐式负策略。</p>
        </aside>
      </article>
    </div> : null}

    {active === 'results' ? <div className="edit-result-layout">
      <article className="spatial-result"><em>核心验证 · SpatialEdit-Bench</em><h4>既能操纵物体，也能操纵相机</h4><div><b>0.649<span>Object Overall ↑</span></b><b>0.429<span>Camera Error ↓</span></b></div><p>相较 LongCat 的 0.439 / 0.743，物体操作更强、相机误差更低。</p></article>
      <article><em>通用能力 · GEdit</em><h4>空间专项训练没有让普通编辑失效</h4><strong>EN 8.290 · CN 8.208</strong><p>两种语言的 Overall 都保持强竞争力。</p></article>
      <article><em>通用能力 · ImgEdit</em><h4>覆盖不同编辑类别</h4><strong>w/ PE Overall 4.57</strong><p>完整类别与模型数据可在右侧结果浏览器查看。</p></article>
      <div className="gen-result-hint">结果边界：对 Nano Banana 2 的整体人评为 33.1% vs 52.2%，自然度仍是明显短板。</div>
    </div> : null}
    <div className="feedback good">{active === 'data' ? '重点：Spatial 不是普通编辑数据中的一个小标签，而是一套独立的 3D 数据引擎。' : active === 'training' ? '重点：训练目标同时包含“按指令改变”和“保持非目标内容”，不能只优化改动幅度。' : '重点：SpatialEdit 证明操纵空间，GEdit 与 ImgEdit 则证明这项专项能力没有成为孤立技能。'}</div>
  </div>;
};

export default SecEditingRoadmap;
