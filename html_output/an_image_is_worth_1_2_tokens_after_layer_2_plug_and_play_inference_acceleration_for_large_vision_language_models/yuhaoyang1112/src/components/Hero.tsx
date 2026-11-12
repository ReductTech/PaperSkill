import { SlidingChoices } from './SlidingChoices';
import { playFeedback } from '../lib/controlMotion';
import { memo, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { sceneCanvas, syntheticAttention, rankOrder, GRID } from '../modules/stageKit';
import { tutorial } from '../data/tutorial';
import { Ev } from '../modules/panels';
import { LINKS } from '../modules/glossary';
import './coverSample.css';

const total = GRID * GRID;
const retained = total / 2;
const tileSize = 20;
const canvasSize = GRID * tileSize;
const narrowScreen = window.matchMedia('(max-width: 720px)');
const subscribeToWidth = (update: () => void) => {
  narrowScreen.addEventListener('change', update);
  return () => narrowScreen.removeEventListener('change', update);
};
const isNarrow = () => narrowScreen.matches;

function BalloonBoard({ pruned }: { pruned: boolean }) {
  const picture = useRef<HTMLCanvasElement>(null);
  const mask = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const imageContext = picture.current?.getContext('2d');
    const maskContext = mask.current?.getContext('2d');
    if (!imageContext || !maskContext) return;
    const scene = sceneCanvas();
    const patchSize = scene.width / GRID;
    const kept = new Set(rankOrder(syntheticAttention()).slice(0, retained));
    imageContext.clearRect(0, 0, canvasSize, canvasSize);
    maskContext.clearRect(0, 0, canvasSize, canvasSize);
    maskContext.fillStyle = '#e2e4f1';
    for (let i = 0; i < total; i++) {
      const col = i % GRID;
      const row = Math.floor(i / GRID);
      const x = col * tileSize;
      const y = row * tileSize;
      imageContext.drawImage(
        scene, col * patchSize, row * patchSize, patchSize, patchSize,
        x, y, tileSize - 1, tileSize - 1,
      );
      if (!kept.has(i)) maskContext.fillRect(x, y, tileSize - 1, tileSize - 1);
    }
  }, []);
  return (
    <div className={'fv-duel-board' + (pruned ? ' is-pruned' : '')}>
      <p className="fv-duel-name">{pruned ? 'FastV · 第 3 层起' : '完整模型 · 每一层'}</p>
      <div className="fv-duel-image" role="img" aria-label={pruned
        ? '同一张热气球图，原位保留合成注意力排名前半的 288 个图块'
        : '热气球完整图像，24 行 24 列共 576 个图块'}>
        <canvas aria-hidden="true" ref={picture} width={canvasSize} height={canvasSize} />
        <canvas aria-hidden="true" ref={mask} className="fv-duel-mask" width={canvasSize} height={canvasSize} />
      </div>
      <div className="fv-duel-reading">
        <span className="fv-length-track" aria-hidden="true"><i /></span>
        <strong>{pruned ? retained : total}</strong> 个视觉 token
      </div>
    </div>
  );
}

function CoverFigure() {
  const narrow = useSyncExternalStore(subscribeToWidth, isNarrow);
  const [pruned, setPruned] = useState(true);
  const comparison = useRef<HTMLElement>(null);
  const replayPruning = () => {
    const layer = comparison.current?.querySelector<HTMLCanvasElement>('.is-pruned .fv-duel-mask');
    if (!layer) return;
    layer.getAnimations().forEach((animation) => animation.cancel());
    playFeedback(layer, [{ opacity: 0 }, { opacity: 0, offset: 0.32 }, { opacity: 1 }], 800);
  };
  return (
    <figure className="fv-cover-duel" ref={comparison}>
      <div className="fv-duel-charts">
        {!narrow && <BalloonBoard pruned={false} />}
        <BalloonBoard pruned={narrow ? pruned : true} />
      </div>
      {narrow && (
        <SlidingChoices className="fv-duel-switch" label="切换封面剪枝示意" selected={pruned}>
          <button type="button" aria-pressed={!pruned} onClick={() => setPruned(false)}>完整模型 · 576</button>
          <button type="button" aria-pressed={pruned} onClick={() => setPruned(true)}>FastV · 288</button>
        </SlidingChoices>
      )}
      <figcaption className="hero-note">
        教学示意：两种模型的前两层都处理 576 个视觉 token。FastV 从第 3 层起只保留 288 个，图块位置按合成注意力排序绘制。
        {(!narrow || pruned) && <button type="button" className="hero-replay fv-replay" onClick={replayPruning}>重播剪枝</button>}
      </figcaption>
    </figure>
  );
}

const routes = [
  { label: '先懂原理', path: '§1 → §3 → §4', target: 'chap-1' },
  { label: '动手剪 token 与复算', path: '§5.1 → §5.2 → §6', target: 'module-5-1' },
  { label: '检查实验与边界', path: '§7 → §9 → §10', target: 'chap-7' },
];

const stats = [
  { value: '576 → 288', label: '第 2 层后保留的视觉 token', source: '剪枝配置', evidence: 'sec41' },
  { value: '55%', label: '13B 理论 FLOPs 占完整模型的比例', source: '理论估算', evidence: 'tab1' },
  { value: '73.6', label: '13B 四项任务平均分，完整模型同为 73.6', source: '论文实测', evidence: 'tab1' },
  { value: '0.341 s', label: '13B 单样本延迟（A40，K=0 随机剪半）', source: '论文实测', evidence: 'tab4' },
];

export const Hero = memo(function Hero({ go }: { go: (id: string) => void }) {
  const { meta } = tutorial;
  return (
    <section id="top" className="hero fastv-series-hero" aria-labelledby="paper-title">
      <span className="hero-badge">INTERACTIVE TUTORIAL</span>
      <h1 id="paper-title" lang="en">{meta.titleEn}</h1>
      <p className="hero-sub">{meta.titleZh} · ECCV 2024 Oral</p>
      <p className="hero-authors" lang="en">{meta.authors}</p>
      <p className="hero-authors">{meta.affiliation} · <a href={LINKS.paper} target="_blank" rel="noreferrer">论文原文 ↗</a> · <a href={LINKS.readme} target="_blank" rel="noreferrer">作者代码 ↗</a></p>
      <p className="hero-abstract">
        一张图在 LLaVA-1.5 里占 576 个视觉 token。作者发现，生成答案时，模型深层分给单个图块的注意力很少。FastV 让前几层读完整张图，再按注意力留下部分图块，让后续层处理更短的序列。第 2 层后剪掉一半，哪些细节还能保住？
      </p>
      <div className="hero-chips">
        {['视觉 token 剪枝', '注意力排序', '即插即用', '无需训练', 'FLOPs 与延迟'].map(word => <span key={word}>{word}</span>)}
      </div>
      <CoverFigure />
      <div className="hero-stats">
        {stats.map(stat => <div key={stat.value}>
          <b>{stat.value}</b>
          <span>{stat.label}</span>
          <small className="fv-stat-origin">{stat.source} <Ev k={stat.evidence} /></small>
        </div>)}
      </div>
      <div className="hero-routes">
        <span className="hero-routes-k">按目的选一条路线</span>
        {routes.map(route => <button type="button" key={route.target} onClick={() => go(route.target)}>
          <b>{route.label}</b><span>{route.path}</span>
        </button>)}
      </div>
      <p className="hero-warn">表 1 用 K=2、R=50% 报告理论计算量和任务分数；表 4 的 A40 计时使用 K=0 的随机剪枝配置。</p>
      <div className="hero-cta">
        准备好了吗？
        <button className="chap-loader-btn" type="button" onClick={() => go('chap-1')}>
          开始学习 §1<span className="chap-loader-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
});
