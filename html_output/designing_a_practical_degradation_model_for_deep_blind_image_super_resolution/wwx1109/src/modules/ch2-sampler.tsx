import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  applyOps,
  createReferenceImage,
  drawImageTo,
  mulberry32,
  type DownMode,
  type Op,
} from './bsrganKit';

type Recipe = {
  blurKind: 'iso' | 'aniso';
  blurWidth: number;
  blurAngle: number;
  blurRatio: number;
  downMode: DownMode;
  scale: 2 | 4;
  noiseKind: 'gaussian' | 'jpeg' | 'sensor';
  sigma: number;
  quality: number;
  iso: number;
};

const DOWNS: DownMode[] = ['nearest', 'bilinear', 'bicubic', 'downup'];
const DOWN_LABEL: Record<DownMode, string> = {
  nearest: '最近邻',
  bilinear: '双线性',
  bicubic: '双三次',
  downup: '先下后上',
};
const NOISE_LABEL = { gaussian: '高斯', jpeg: 'JPEG', sensor: '传感器' } as const;

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function sampleRecipe(seed: number, prev?: Recipe, locks?: { blur: boolean; down: boolean; noise: boolean }): Recipe {
  const rng = mulberry32(seed * 7919 + 13);
  const scale: 2 | 4 = rng() < 0.5 ? 2 : 4;
  const fresh: Recipe = {
    blurKind: rng() < 0.5 ? 'iso' : 'aniso',
    blurWidth: 0.1 + rng() * (scale === 2 ? 2.3 : 2.7),
    blurAngle: rng() * 180,
    blurRatio: 1 + rng() * 7,
    downMode: pick(rng, DOWNS),
    scale,
    noiseKind: pick(rng, ['gaussian', 'jpeg', 'sensor'] as const),
    sigma: 1 + rng() * 24,
    quality: 30 + rng() * 65,
    iso: 100 + rng() * 6300,
  };
  if (!prev || !locks) return fresh;
  return {
    blurKind: locks.blur ? prev.blurKind : fresh.blurKind,
    blurWidth: locks.blur ? prev.blurWidth : fresh.blurWidth,
    blurAngle: locks.blur ? prev.blurAngle : fresh.blurAngle,
    blurRatio: locks.blur ? prev.blurRatio : fresh.blurRatio,
    downMode: locks.down ? prev.downMode : fresh.downMode,
    scale: locks.down ? prev.scale : fresh.scale,
    noiseKind: locks.noise ? prev.noiseKind : fresh.noiseKind,
    sigma: locks.noise ? prev.sigma : fresh.sigma,
    quality: locks.noise ? prev.quality : fresh.quality,
    iso: locks.noise ? prev.iso : fresh.iso,
  };
}

function recipeOps(recipe: Recipe): Op[] {
  const ops: Op[] = [
    { type: 'blur', kind: recipe.blurKind, width: recipe.blurWidth, angle: recipe.blurAngle, ratio: recipe.blurKind === 'aniso' ? recipe.blurRatio : 1 },
    { type: 'down', mode: recipe.downMode, scale: recipe.scale, align: recipe.downMode === 'nearest' && recipe.scale > 2, a: 1 },
  ];
  if (recipe.noiseKind === 'gaussian') ops.push({ type: 'gauss', sigma: recipe.sigma });
  else if (recipe.noiseKind === 'jpeg') ops.push({ type: 'jpeg', quality: recipe.quality });
  else ops.push({ type: 'sensor', iso: recipe.iso });
  return ops;
}

function MiniPrint({ data }: { data: ImageData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (ref.current) drawImageTo(ref.current, data, true); }, [data]);
  return <canvas ref={ref} className="bsr-mini-print" aria-label="之前生成的 LR 样张" />;
}

export function Ch2Sampler(_props: WidgetProps) {
  const [seed, setSeed] = useState(7);
  const [recipe, setRecipe] = useState<Recipe>(() => sampleRecipe(7));
  const [locks, setLocks] = useState({ blur: false, down: false, noise: false });
  const [history, setHistory] = useState<ImageData[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hr = useMemo(() => createReferenceImage(320, 240), []);
  const lr = useMemo(() => applyOps(hr, recipeOps(recipe)), [hr, recipe]);
  useEffect(() => { if (canvasRef.current) drawImageTo(canvasRef.current, lr, true); }, [lr]);

  const resample = () => {
    const nextSeed = seed + 1;
    const next = sampleRecipe(nextSeed, recipe, locks);
    setSeed(nextSeed);
    setRecipe(next);
    setHistory((prev) => [applyOps(hr, recipeOps(next)), ...prev].slice(0, 3));
  };

  const lockCount = Object.values(locks).filter(Boolean).length;
  const feedback = lockCount === 0
    ? `这次抽到：${recipe.blurKind === 'iso' ? '各向同性' : '各向异性'}模糊 + ${DOWN_LABEL[recipe.downMode]} + ${NOISE_LABEL[recipe.noiseKind]}。`
    : lockCount === 3
      ? '三类算子都锁定了，重掷只会重算同一份配方；解锁一类才能看到变化。'
      : `已锁定 ${lockCount} 类算子，只有未锁定的部分在变。`;

  return (
    <div className="bsr-ch2-sampler">
      <section className="bsr-recipe-panel">
        <div className="bsr-panel-head"><span>随机配方</span><b>seed {seed}</b></div>
        <div className="bsr-recipe-card">
          <div className="bsr-recipe-row">
            <span>模糊</span>
            <b>{recipe.blurKind === 'iso' ? '各向同性' : '各向异性'} · {recipe.blurWidth.toFixed(1)}</b>
          </div>
          <div className="bsr-recipe-row">
            <span>下采样</span>
            <b>{DOWN_LABEL[recipe.downMode]} · ×{recipe.scale}</b>
          </div>
          <div className="bsr-recipe-row">
            <span>噪声</span>
            <b>
              {NOISE_LABEL[recipe.noiseKind]}
              {recipe.noiseKind === 'gaussian' ? ` · σ ${Math.round(recipe.sigma)}` : recipe.noiseKind === 'jpeg' ? ` · q ${Math.round(recipe.quality)}` : ` · ISO ${Math.round(recipe.iso)}`}
            </b>
          </div>
        </div>
        <canvas ref={canvasRef} className="bsr-image bsr-recipe-image" aria-label="按当前随机配方生成的 LR" />
        <p className="bsr-photo-caption">同一张 HR，配方不同，模糊、块效应与噪声随之改变。</p>
      </section>
      <section className="bsr-sampler-side">
        <button className="bsr-primary-btn" onClick={resample}>重掷配方</button>
        <div className="bsr-lock-row">
          <label className="bsr-check"><input type="checkbox" checked={locks.blur} onChange={(e) => setLocks({ ...locks, blur: e.target.checked })} />锁定模糊</label>
          <label className="bsr-check"><input type="checkbox" checked={locks.down} onChange={(e) => setLocks({ ...locks, down: e.target.checked })} />锁定下采样</label>
          <label className="bsr-check"><input type="checkbox" checked={locks.noise} onChange={(e) => setLocks({ ...locks, noise: e.target.checked })} />锁定噪声</label>
        </div>
        <div className="bsr-history">
          <span className="bsr-mini-label">最近三次</span>
          <div className="bsr-history-row">
            {[0, 1, 2].map((slot) => history[slot]
              ? <MiniPrint key={`${seed}-${slot}`} data={history[slot]} />
              : <div key={`slot-${slot}`} className="bsr-history-slot" aria-hidden="true" />)}
          </div>
        </div>
        <div className="bsr-range-card">
          <h3>采样范围</h3>
          <p>模糊：宽度 <b>0.1–2.4/2.8σ</b>，角度 <b>0–180°</b>，轴长比 <b>1–8</b></p>
          <p>下采样：四种方式；缩放 <b>2 / 4</b></p>
          <p>噪声：高斯 σ <b>1–25/255</b>；JPEG q <b>30–95</b>；本页三选一</p>
        </div>
        <p className={`bsr-feedback ${lockCount === 3 ? 'is-orange' : 'is-blue'}`}>{feedback}</p>
        <p className="bsr-note">范围取自论文第 4–5 页；论文三类噪声是叠加关系（高斯必加、JPEG 0.75/1、传感器 0.25），本页简化为三选一；不是原训练代码。</p>
      </section>
    </div>
  );
}
