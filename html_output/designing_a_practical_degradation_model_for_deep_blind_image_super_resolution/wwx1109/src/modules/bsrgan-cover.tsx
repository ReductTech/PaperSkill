import React, { useEffect, useMemo, useRef } from 'react';
import type { WidgetProps } from './registry';
import { useCoverPlayback } from '../components/CoverPlayback';
import { applyOps, clamp, createReferenceImage, drawImageTo, type Op } from './bsrganKit';

const FIXED: Op[] = [
  { type: 'blur', kind: 'iso', width: 1.0, angle: 0, ratio: 1 },
  { type: 'down', mode: 'bicubic', scale: 2, align: false, a: 1 },
  { type: 'gauss', sigma: 5 },
  { type: 'jpeg', quality: 72 },
];

const FIXED_CHAIN = ['模糊', '下采样', '高斯噪声', 'JPEG'];

// Three sampled recipes: same operator families, several parameter draws,
// and three different shuffles. Every sequence ends with JPEG, as in Fig. 1.
const RECIPES: { label: string; order: string; ops: Op[] }[] = [
  {
    label: '配方 ①',
    order: '最近邻（补偿）→ 模糊 → 噪声 → JPEG',
    ops: [
      { type: 'down', mode: 'nearest', scale: 2, align: true, a: 1 },
      { type: 'blur', kind: 'iso', width: 1.1, angle: 0, ratio: 1 },
      { type: 'gauss', sigma: 7 },
      { type: 'jpeg', quality: 58 },
    ],
  },
  {
    label: '配方 ②',
    order: '方向模糊 → 双三次 → 噪声 → JPEG',
    ops: [
      { type: 'blur', kind: 'aniso', width: 1.1, angle: 28, ratio: 3.4 },
      { type: 'down', mode: 'bicubic', scale: 2, align: false, a: 1 },
      { type: 'gauss', sigma: 7 },
      { type: 'jpeg', quality: 58 },
    ],
  },
  {
    label: '配方 ③',
    order: '噪声 → 先下后上 → 方向模糊 → JPEG',
    ops: [
      { type: 'gauss', sigma: 7 },
      { type: 'down', mode: 'downup', scale: 2, align: false, a: 1.5 },
      { type: 'blur', kind: 'aniso', width: 1.1, angle: 62, ratio: 3.4 },
      { type: 'jpeg', quality: 58 },
    ],
  },
];

function stageImages(hr: ImageData, ops: Op[]): ImageData[] {
  const stages: ImageData[] = [];
  let current = hr;
  stages.push(current);
  for (const op of ops) {
    current = applyOps(current, [op]);
    stages.push(current);
  }
  return stages;
}

export function BsrganCover({ moduleId }: WidgetProps) {
  const { progress } = useCoverPlayback();
  const planned = moduleId === 'newMethod';

  const data = useMemo(() => {
    const hr = createReferenceImage(320, 240);
    return {
      hr,
      fixedStages: stageImages(hr, FIXED),
      prints: RECIPES.map((recipe) => ({
        label: recipe.label,
        order: recipe.order,
        image: applyOps(hr, recipe.ops),
      })),
    };
  }, []);

  const reveal = clamp((progress - 0.08) / 0.74, 0, 1);
  const stage = Math.min(data.fixedStages.length - 1, Math.floor(reveal * data.fixedStages.length));
  const out = data.fixedStages[stage];
  const done = reveal > 0.98;
  const shown = clamp(Math.floor(progress * RECIPES.length) + 1, 1, RECIPES.length);

  const hrRef = useRef<HTMLCanvasElement>(null);
  const outRef = useRef<HTMLCanvasElement>(null);
  const printRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    if (hrRef.current) drawImageTo(hrRef.current, data.hr, true);
  }, [data]);
  useEffect(() => {
    if (outRef.current) drawImageTo(outRef.current, out, true);
  }, [out]);
  useEffect(() => {
    data.prints.forEach((print, index) => {
      const canvas = printRefs.current[index];
      if (canvas) drawImageTo(canvas, print.image, true);
    });
  }, [data]);

  const active = clamp(stage - 1, -1, FIXED_CHAIN.length - 1);

  if (planned) {
    return (
      <div className="bsrgan-cover is-new">
        <div className="bsrgan-cover-recipes">
          {data.prints.map((print, index) => (
            <figure key={print.label} className={index < shown ? '' : 'is-pending'}>
              <canvas
                ref={(node) => { printRefs.current[index] = node; }}
                aria-label={`${print.label}生成的退化样张，顺序为${print.order}`}
              />
              <figcaption>{print.label}</figcaption>
              <p className="bsrgan-cover-order">{print.order}</p>
            </figure>
          ))}
        </div>
        <div className="bsrgan-cover-result is-success">
          {shown < RECIPES.length
            ? `正在抽第 ${shown + 1} 份配方……`
            : '同一张 HR · 3 份随机配方：顺序与参数都在变'}
        </div>
      </div>
    );
  }

  return (
    <div className="bsrgan-cover is-old">
      <div className="bsrgan-cover-prints">
        <figure>
          <canvas ref={hrRef} aria-label="参考照片（教学用程序化静物图）" />
          <figcaption>同一张 HR</figcaption>
        </figure>
        <span className="bsrgan-cover-arrow" aria-hidden="true">→</span>
        <figure>
          <canvas ref={outRef} aria-label="固定顺序退化后的样张" />
          <figcaption>固定配方</figcaption>
        </figure>
      </div>
      <div className="bsrgan-cover-chain" aria-label="退化算子顺序">
        {FIXED_CHAIN.map((label, index) => (
          <span key={label} className={index === active ? 'is-active' : index < active ? 'is-done' : ''}>
            {label}
          </span>
        ))}
      </div>
      <div className={`bsrgan-cover-result ${done ? 'is-fail' : ''}`}>
        {!done ? '正在冲洗……' : '只有这一条链路：顺序固定，参数也不随图变化'}
      </div>
    </div>
  );
}
