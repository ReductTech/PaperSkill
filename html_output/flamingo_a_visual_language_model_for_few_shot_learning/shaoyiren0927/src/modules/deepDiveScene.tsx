import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type Q = { prompt: string; options: string[]; answer: number; explain: string };

const RESAMPLER: Q[] = [
  { prompt:'为什么视觉 features 数量可变？', options:['图片分辨率、视频帧数和内容长度不同','因为语言模型会随机改变输入','因为所有图片都被裁成同样大小'], answer:0, explain:'视觉编码器输出的 patch 数量随分辨率变化，视频还会随帧数变化。' },
  { prompt:'为什么固定为 64 个 visual tokens？', options:['64 是图像的真实物理尺寸','固定长度让语言上下文与计算量可控','64 可以替代所有文字'], answer:1, explain:'论文选择固定数量的 latent 输出，使不同媒体拥有稳定的视觉接口。' },
  { prompt:'latent queries 在做什么？', options:['主动从视觉特征中读取互补信息','直接生成最终答案','冻结视觉编码器'], answer:0, explain:'可学习 queries 通过 cross-attention 询问视觉特征，并逐层更新成摘要。' },
  { prompt:'和普通 pooling 有什么概念区别？', options:['普通 pooling 也会学习 64 个查询','pooling 通常固定聚合规则，queries 会内容自适应地读取特征','两者完全等价'], answer:1, explain:'latent queries 是一组可学习的读取器，会根据内容和上下文形成互补摘要。' },
];

const GATED: Q[] = [
  { prompt:'Q/K/V 分别来自哪里？', options:['Q 来自语言状态，K/V 来自 visual tokens','Q/K/V 都来自原始像素','Q 来自答案，K/V 来自词表'], answer:0, explain:'语言隐状态提出问题，视觉 tokens 提供可被检索的 key/value。' },
  { prompt:'cross-attention 怎样把视觉注入语言？', options:['把视觉 token 直接拼成句子','用语言 Q 对视觉 K/V 加权读取，再加回语言状态','删除语言状态'], answer:1, explain:'注意力输出是视觉证据的加权摘要，通过残差路径回到语言流。' },
  { prompt:'tanh gating 为什么初始化为 0？', options:['先关闭新通路，保护原有语言能力','让输出永远为 0','减少视觉 token 数量'], answer:0, explain:'α≈0 时 tanh(α)≈0，训练初期新桥接不会突然破坏 Frozen LM。' },
  { prompt:'为什么 freezing LM 有意义？', options:['保留大规模语言先验，只训练跨模态连接器','让模型不能生成文字','让视觉编码器自动变大'], answer:0, explain:'冻结语言骨干降低训练成本，也保留它已有的生成与推理能力。' },
];

const pseudo = [
  '1  vision = VisionEncoder(media)       # 读取图片 / 视频',
  '2  visual = PerceiverResampler(vision) # 压成 64 个 token',
  '3  for layer in FrozenLM:',
  '4      x = layer.self_attention(x)      # 语言先走自己的路径',
  '5      z = cross_attention(Q=x, K=visual, V=visual)',
  '6      x = x + tanh(alpha) * z           # 门控注入视觉证据',
  '7  text = decode(x)                       # 逐 token 生成文本',
];

export const DeepDiveScene: React.FC<WidgetProps> = () => {
  const [room, setRoom] = useState<'resampler' | 'gated'>('resampler');
  const [anim, setAnim] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState(0);
  const [feedback, setFeedback] = useState('先播放一遍数据变化，再开始回答。');
  const [details, setDetails] = useState(false);
  const [finale, setFinale] = useState(false);

  const questions = room === 'resampler' ? RESAMPLER : GATED;
  const done = answers >= 4;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setAnim(v => { if (v >= 3) { setPlaying(false); return 3; } return v + 1; }), 650);
    return () => window.clearInterval(timer);
  }, [playing]);

  const switchRoom = () => { setRoom('gated'); setAnim(0); setPlaying(false); setQIndex(0); setAnswers(0); setDetails(false); setFeedback('进入 GATED XATTN-DENSE：先播放视觉注入语言的全过程。'); };
  const answer = (i: number) => {
    const q = questions[qIndex];
    setFeedback(i === q.answer ? `回答成立：${q.explain}` : `再看一次这个结构：${q.explain}`);
    setAnswers(v => v + 1); setQIndex(v => Math.min(3, v + 1)); setDetails(false);
  };
  const next = () => { if (room === 'resampler') switchRoom(); else setFinale(true); };
  const enterNext = () => { const b = document.querySelector('button.slide-nav-btn-primary:not(:disabled)') as HTMLButtonElement | null; if (b) { b.focus(); b.click(); } };

  const visual = room === 'resampler' ? <div className="deep-visual resampler-visual">
    <div className="visual-column feature-column"><span>image / video</span>{Array.from({ length: anim === 0 ? 12 : 7 }).map((_, i) => <i key={i} />)}</div>
    <div className="visual-arrow">→</div>
    <div className="visual-column query-column"><span>latent queries</span>{Array.from({ length: anim < 2 ? 4 : 8 }).map((_, i) => <i key={i} className={anim >= 1 ? 'lit' : ''} />)}</div>
    <div className="visual-arrow">→</div>
    <div className="visual-column token-column"><span>64 visual tokens</span>{Array.from({ length: anim >= 3 ? 16 : 6 }).map((_, i) => <i key={i} className={anim >= 3 ? 'lit' : ''} />)}</div>
  </div> : <div className="deep-visual gated-visual">
    <div className="stream language-stream"><span>语言 Q</span>{Array.from({ length: 5 }).map((_, i) => <i key={i} className={anim >= 2 ? 'lit' : ''} />)}</div>
    <div className="gate">{anim >= 3 ? 'tanh(α) · 开' : '门控 α ≈ 0'}</div>
    <div className="stream visual-stream"><span>视觉 K / V</span>{Array.from({ length: 8 }).map((_, i) => <i key={i} className={anim >= 1 ? 'lit' : ''} />)}</div>
    <div className="fusion">{anim >= 3 ? '语言状态 + 视觉证据' : '等待 cross-attention'}</div>
  </div>;

  return <div className="deep-dive">
    {!finale ? <>
      <div className="deep-room-label">ROOM {room === 'resampler' ? '01' : '02'} · {room === 'resampler' ? 'PERCEIVER RESAMPLER' : 'GATED XATTN-DENSE'}</div>
      {visual}
      <div className="deep-controls"><button type="button" onClick={() => { setAnim(0); setPlaying(true); }}>播放数据变化</button><span>阶段 {anim} / 3</span></div>
      {!done ? <div className="deep-question"><div className="deep-q-count">QUESTION {qIndex + 1} / 4</div><h4>{questions[qIndex].prompt}</h4><div className="deep-options">{questions[qIndex].options.map((o, i) => <button key={o} type="button" onClick={() => answer(i)}>{String.fromCharCode(65 + i)} · {o}</button>)}</div></div> : <div className="deep-complete"><p>{room === 'resampler' ? '一句话总结：Perceiver Resampler 用可学习 queries 把任意长度视觉输入变成稳定的 64-token 记忆。' : '一句话总结：GATED XATTN-DENSE 让语言状态按需读取视觉记忆，并用接近 0 的门控保护 Frozen LM。'}</p><button type="button" onClick={() => setDetails(v => !v)}>{details ? '收起技术细节' : '打开技术细节抽屉'}</button>{details && <div className="deep-drawer"><code>{room === 'resampler' ? 'Z = Perceiver(Q, V) ∈ R^(64×d)' : 'x′ = x + tanh(α) · XAttn(x, Z),  α₀ = 0'}</code><span>{room === 'resampler' ? 'Q 是可学习 latent queries；V 是视觉编码器特征；Z 是固定数量的视觉 token。' : 'Q 来自语言隐状态，K/V 来自视觉 token；残差加法保持语言路径连续。'}</span></div>}<button type="button" className="deep-next" onClick={next}>{room === 'resampler' ? '进入 GATED XATTN-DENSE →' : '进入最终解释 →'}</button></div>}
      <div className="deep-feedback">SYSTEM · {feedback}</div>
    </> : <div className="deep-finale">
      <div className="deep-room-label">FINAL EXPLANATION · 从生活类比到 Figure 4</div>
      <section><h3>先用生活类比</h3><p>把视觉 tokens 想成一叠已经整理好的照片便签：Resampler 先挑出 64 张最有用的便签；GATED XATTN-DENSE 像一扇阀门，语言助手提问时才把相关便签递进来。</p></section>
      <section><h3>升级到 Transformer 级解释</h3><p>语言隐状态作为 Query，视觉 tokens 作为 Key/Value。注意力权重决定每个文字位置读取哪些视觉证据；tanh(α) 让这条新路径从 0 开始，残差连接则保留原语言流。</p></section>
      <section><h3>翻出 Figure 4 风格伪代码</h3><pre>{pseudo.join('\n')}</pre><p>第 1–2 行完成视觉抽取与固定长度压缩；第 3–6 行在冻结语言层之间插入门控视觉读取；第 7 行把融合后的状态解码成文字。</p></section>
      <button type="button" className="deep-next" onClick={enterNext}>读完了，进入下一章 →</button>
    </div>}
  </div>;
};
