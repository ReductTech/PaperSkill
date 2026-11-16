import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { C, SeaCliffScene, clamp, pct } from './seesr-cover';

const CLEAN: Record<string, number> = { 船: 0.93, 海: 0.9, 崖: 0.84, 灯塔: 0.76, 鸟: 0.1, 飞机: 0.07 };
const DEGRADED: Record<string, number> = { 船: 0.31, 海: 0.76, 崖: 0.62, 灯塔: 0.36, 鸟: 0.62, 飞机: 0.47 };
const TAGS = ['船', '海', '崖', '灯塔', '鸟', '飞机'];

/** S3 — what DAPE aligns (Eq.1) and what λ trades off. */
export function SeesrDapeTrain(_props: WidgetProps) {
  const [lambda, setLambda] = useState(1);
  const [progress, setProgress] = useState(0.35);

  const tagAcc = progress * (lambda / (lambda + 0.3));
  const repGap = 0.86 * (1 - 0.82 * progress) * (1 + 0.06 * lambda);
  const tagCE = 1.55 * (1 - tagAcc);
  const loss = repGap + lambda * tagCE;
  const total = Math.max(0.001, loss);
  const repShare = repGap / total;
  const tagShare = (lambda * tagCE) / total;

  const scores = TAGS.map((name) => ({
    name,
    score: clamp(CLEAN[name] * tagAcc + DEGRADED[name] * (1 - tagAcc), 0.01, 0.99),
  }));

  const feedback = lambda === 0
    ? 'λ=0：只校准特征，标签头没有监督，清单一直停在错判上。'
    : tagAcc > 0.55 && loss < 1.2
      ? '两项都压下来了：清单与干净摹本一致。'
      : lambda >= 2.5
        ? '标签压过特征：清单变准了，但表示离摹本更远，软提示能给的信息变少。'
        : '调整 λ 与训练进度，观察两项误差此消彼长。';
  const tone = lambda === 0 ? 'is-bad' : tagAcc > 0.55 && loss < 1.2 ? 'is-good' : lambda >= 2.5 ? 'is-warn' : 'is-mid';

  return (
    <div className="seesr-scene">
      <div className="seesr-panel seesr-plain" style={{ left: 0, top: 0, width: 560, height: 288 }}>
        <div className="seesr-h">干净摹本：锚点</div>
        <div className="seesr-frame seesr-frame-sm" style={{ left: 0, top: 56, width: 300, height: 210 }}>
          <SeaCliffScene interpretation="boat" damage={0} detail={1} />
        </div>
        <div className="seesr-anchors" style={{ left: 316, top: 60, width: 236 }}>
          <span className="seesr-anchor is-rep">表示嵌入</span>
          <span className="seesr-anchor is-logit">分类输出嵌入</span>
          <p className="seesr-muted">HR 经冻结标签模型得到，训练时不动。</p>
        </div>
      </div>

      <div className="seesr-panel" style={{ left: 0, top: 300, width: 560, height: 322 }}>
        <div className="seesr-h">LR 分支：当前鉴定</div>
        <div className="seesr-taglist">
          {scores.map((item) => (
            <div className="seesr-tagitem" key={item.name}>
              <b>{item.name}</b>
              <span className="seesr-bar"><i style={{ width: pct(item.score), background: item.score >= 0.5 ? C.blue : C.line }} /></span>
              <b className="seesr-muted">{pct(item.score)}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="seesr-panel" style={{ left: 584, top: 0, width: 888, height: 330 }}>
        <div className="seesr-h">两项监督，一个权重</div>
        <label className="seesr-slider">
          <span>平衡权重 λ</span>
          <input type="range" min={0} max={3} step={0.25} value={lambda}
            onChange={(event) => setLambda(Number(event.target.value))} />
          <b>{lambda.toFixed(2)}</b>
        </label>
        <label className="seesr-slider">
          <span>训练进度</span>
          <input type="range" min={0} max={1} step={0.05} value={progress}
            onChange={(event) => setProgress(Number(event.target.value))} />
          <b>{pct(progress)}</b>
        </label>
        <div className="seesr-lossbar" aria-label={`总损失 ${loss.toFixed(2)}，表示误差占 ${pct(repShare)}，标签误差占 ${pct(tagShare)}`}>
          <i className="is-rep" style={{ width: pct(repShare) }} />
          <i className="is-tag" style={{ width: pct(tagShare) }} />
        </div>
        <div className="seesr-losslegend">
          <span><b className="is-rep">L_r（表示误差）</b> {repGap.toFixed(2)}</span>
          <span><b className="is-tag">λ·L_l（标签误差）</b> {(lambda * tagCE).toFixed(2)}</span>
          <span><b>L_DAPE</b> {loss.toFixed(2)}</span>
        </div>
        <div className="seesr-formula-line">
          <strong>
            <SymbolHint meaning="L_DAPE：DAPE 的总训练损失，两项加权相加。">L</SymbolHint>
            <sub>DAPE</sub> = <SymbolHint meaning="L_r：表示嵌入的均方误差，衡量特征像不像。">L</SymbolHint><sub>r</sub>
            {' + '}
            <SymbolHint meaning="λ：两项监督的平衡权重，论文实现取 1。">λ</SymbolHint>
            <SymbolHint meaning="L_l：分类输出嵌入的交叉熵，衡量标签对不对。">L</SymbolHint><sub>l</sub>
          </strong>
        </div>
      </div>

      <div className="seesr-panel seesr-plain" style={{ left: 584, top: 346, width: 888, height: 276 }}>
        <div className="seesr-numbers">
          <span>标签一致度 <b>{pct(tagAcc)}</b></span>
          <span>表示误差 <b>{repGap.toFixed(2)}</b></span>
          <span>标签交叉熵 <b>{tagCE.toFixed(2)}</b></span>
        </div>
        <p className={`seesr-feedback ${tone}`} aria-live="polite">{feedback}</p>
        <p className="seesr-muted">曲线数值是讲解用的示意模型，趋势对应论文式 (1)：两项监督加权、λ 控制取舍。</p>
      </div>
    </div>
  );
}
