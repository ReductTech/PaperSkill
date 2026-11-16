import { useId, useState } from 'react';
import '../styles/gallery.css';

const scenes = [
  {
    id: 'night',
    name: '夜景',
    observation: '看灯光周围的彩色噪点，再沿着较细的枝条检查轮廓。',
    subject: '夜间建筑、窗灯和被灯光照亮的树枝',
  },
  {
    id: 'tulips',
    name: '郁金香',
    observation: '观察花瓣颜色的渐变和叶片边缘。色调变化也可能来自显影处理。',
    subject: '红色郁金香花瓣和绿色叶片',
  },
  {
    id: 'sculpture',
    name: '石雕',
    observation: '对照雕刻表面的颗粒和右侧背景。作者指出，这个场景的背景仍有部分残噪。',
    subject: '人物石雕的侧面和右侧的浅色背景',
  },
] as const;

const baselines = [
  { id: 'acr', name: 'Adobe Camera Raw', caption: '关闭降噪 · 原图第 2 行' },
  { id: 'lsc', name: 'LSC', caption: '自适应字典 · 单块编码 · 原图第 5 行' },
] as const;

const lssc = { id: 'lssc', name: 'LSSC', caption: '联合稀疏编码 · 原图第 6 行' };
const paperFigure = 'https://www.di.ens.fr/~fbach/iccv09_mairal.pdf#page=8';

interface PhotoProps {
  scene: (typeof scenes)[number];
  method: { id: string; name: string; caption: string };
}

function ResultPhoto({ scene, method }: PhotoProps) {
  const src = `${import.meta.env.BASE_URL}images/fig4-${scene.id}-${method.id}.png`;

  return (
    <figure className="real-effects-photo">
      <a href={src} target="_blank" rel="noreferrer" aria-label={`查看${scene.name}的 ${method.name} 原尺寸局部`}>
        <img
          src={src}
          alt={`${method.name} 处理后的${scene.subject}`}
          width={384}
          height={384}
          decoding="async"
        />
      </a>
      <figcaption>
        <strong>{method.name}</strong>
        <span>{method.caption}</span>
      </figcaption>
    </figure>
  );
}

export function RealEffects() {
  const [sceneIndex, selectScene] = useState(0);
  const [baselineIndex, selectBaseline] = useState(0);
  const sceneLabel = useId();
  const baselineLabel = useId();
  const scene = scenes[sceneIndex];
  const baseline = baselines[baselineIndex];

  return (
    <div className="real-effects">
      <div className="real-effects-controls">
        <div>
          <p className="real-effects-control-label" id={sceneLabel}>实拍场景</p>
          <div className="chip-row" role="group" aria-labelledby={sceneLabel}>
            {scenes.map((option, index) => (
              <button
                key={option.id}
                className={index === sceneIndex ? 'chip selected' : 'chip'}
                type="button"
                aria-pressed={index === sceneIndex}
                onClick={() => selectScene(index)}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="real-effects-control-label" id={baselineLabel}>对照方法</p>
          <div className="chip-row" role="group" aria-labelledby={baselineLabel}>
            {baselines.map((option, index) => (
              <button
                key={option.id}
                className={index === baselineIndex ? 'chip selected' : 'chip'}
                type="button"
                aria-pressed={index === baselineIndex}
                onClick={() => selectBaseline(index)}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="real-effects-pair">
        <ResultPhoto scene={scene} method={baseline} />
        <ResultPhoto scene={scene} method={lssc} />
      </div>

      <p className="real-effects-observation" aria-live="polite"><strong>观察{scene.name}</strong>　{scene.observation}</p>
      <p className="real-effects-credit">
        Canon PowerShot G9，ISO 1600，短曝光。两幅局部取自同一 RAW 拍摄的显影结果，可点击图片查看原始尺寸。
        论文对此组样例作定性比较。{baseline.id === 'acr' ? '两种显影流程都可能影响亮度、颜色和纹理。' : 'LSC 与 LSSC 便于比较单块编码和联合编码的效果。'}
        <a href={paperFigure} target="_blank" rel="noreferrer">查看 Mairal 等人的原论文图 4</a>
      </p>
    </div>
  );
}
