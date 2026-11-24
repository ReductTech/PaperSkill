import React, { useState } from 'react';
import {
  HideBadge,
  HideBar,
  HideKeyValue,
  HideNote,
  HidePanel,
  HideScene,
  HideSegment,
  hideClass,
} from './hide-kit';

type ModelKind = 'gaussian' | 'variance' | 'knn';
type Hotspot = 'mean' | 'covariance' | 'centers';

type ModelInfo = {
  label: string;
  storage: string;
  distribution: string;
  slots: string;
  tii: string;
  tap: string;
  complexity: number;
  recordHeight: number;
  note: string;
};

const modelInfo: Record<ModelKind, ModelInfo> = {
  gaussian: {
    label: 'Gaussian',
    storage: 'μc + Σc',
    distribution: '每类均值 + 协方差',
    slots: '连续高斯采样',
    tii: 'Ĝc · 未受提示高斯',
    tap: 'Gc · 受提示高斯',
    complexity: 96,
    recordHeight: 76,
    note: '默认模型：更完整地近似单峰类别分布。',
  },
  variance: {
    label: 'variance',
    storage: 'μc + σc²',
    distribution: '均值 + 方差向量',
    slots: '对角近似采样',
    tii: 'Ĝc · 方差近似',
    tap: 'Gc · 方差近似',
    complexity: 58,
    recordHeight: 52,
    note: '充分预训练时可把协方差进一步退化为方差，以节省存储。',
  },
  knn: {
    label: 'KNN centroids',
    storage: '约 5 个中心 + 噪声',
    distribution: '最多 10 中心，平均约 5',
    slots: '中心加高斯噪声',
    tii: 'Ĝc · 中心近似',
    tap: 'Gc · 中心近似',
    complexity: 38,
    recordHeight: 32,
    note: 'KNN 中心加高斯噪声，是更通用也更紧凑的近似。',
  },
};

const pseudoSlots = Array.from({ length: 6 }, (_, index) => index + 1);

const modelHotspot: Record<ModelKind, Hotspot> = {
  gaussian: 'mean',
  variance: 'covariance',
  knn: 'centers',
};

export function HideCh7Statistics() {
  const [model, setModel] = useState<ModelKind>('gaussian');
  const [hotspot, setHotspot] = useState<Hotspot>('mean');
  const info = modelInfo[model];

  const chooseModel = (value: ModelKind) => {
    setModel(value);
    setHotspot(modelHotspot[value]);
  };

  const chooseHotspot = (value: Hotspot) => {
    setHotspot(value);
    if (value === 'centers') setModel('knn');
    if (value === 'covariance') setModel(model === 'variance' ? 'variance' : 'gaussian');
    if (value === 'mean' && model === 'knn') setModel('gaussian');
  };

  return (
    <HideScene chapter="暗房架 07 · 类统计档案" cue="保存统计，不回放旧照片" tone="blue">
      <div className="hide-grid hide-ch7-layout">
        <HidePanel
          title="类别统计柜"
          meta={`模型 ${info.label}`}
          tone="blue"
          className="hide-ch7-cabinet-panel"
        >
          <HideSegment
            value={model}
            onChange={chooseModel}
            label="选择类别表征统计模型"
            options={[
              { value: 'gaussian', label: 'Gaussian', note: '默认均值与协方差' },
              { value: 'variance', label: 'variance', note: '协方差退化为方差' },
              { value: 'knn', label: 'KNN', note: '约五个中心加高斯噪声' },
            ]}
          />

          <div className="hide-ch7-hotspots" role="group" aria-label="统计档案热点">
            <button
              type="button"
              className={hideClass('hide-ch7-drawer', hotspot === 'mean' && 'is-active')}
              aria-pressed={hotspot === 'mean'}
              onClick={() => chooseHotspot('mean')}
            >
              <span>01</span>
              <strong>均值</strong>
              <code>μc</code>
              <small>类别中心</small>
            </button>
            <button
              type="button"
              className={hideClass('hide-ch7-drawer', hotspot === 'covariance' && 'is-active')}
              aria-pressed={hotspot === 'covariance'}
              onClick={() => chooseHotspot('covariance')}
            >
              <span>02</span>
              <strong>协方差</strong>
              <code>{model === 'variance' ? 'σc²' : 'Σc'}</code>
              <small>{model === 'variance' ? '已退化为方差' : '分布展开形状'}</small>
            </button>
            <button
              type="button"
              className={hideClass('hide-ch7-drawer', hotspot === 'centers' && 'is-active')}
              aria-pressed={hotspot === 'centers'}
              onClick={() => chooseHotspot('centers')}
            >
              <span>03</span>
              <strong>KNN 中心</strong>
              <code>≈5</code>
              <small>中心 + 噪声</small>
            </button>
          </div>

          <div
            className={hideClass('hide-ch7-record', `is-${model}`, 'is-expanded')}
            style={{ '--hide-record-height': `${info.recordHeight}px` } as React.CSSProperties}
            aria-live="polite"
          >
            <div className="hide-ch7-record-head">
              <HideBadge tone="blue">每类一条记录</HideBadge>
              <strong>{info.storage}</strong>
            </div>
            <div className="hide-ch7-record-fill" aria-hidden="true">
              <i />
              <i />
              <i />
              {model === 'knn' ? <b>centroid field</b> : <b>distribution field</b>}
            </div>
            <span>{info.distribution}</span>
          </div>

          <HideBar
            label="示教存储厚度"
            value={info.complexity}
            tone="blue"
            note={info.label}
          />
          <p className="hide-ch7-model-note">{info.note}</p>
          <HideNote title="档案边界" tone="green">
            柜中保存紧凑统计量，不保存旧图片或旧样本；这仍然是 rehearsal-free。
          </HideNote>
        </HidePanel>

        <div className="hide-side-stack">
          <HidePanel title="伪表征抽屉" meta="每类等量 6 个示意槽" tone="orange">
            <div className={hideClass('hide-ch7-slot-sheet', `is-${model}`)}>
              <div className="hide-ch7-slot-heading">
                <span>类别 c</span>
                <strong>{info.slots}</strong>
                <small>合成 h̃ / h，不来自旧图</small>
              </div>
              <div className="hide-ch7-slots" aria-label="每类六个等量伪表征槽位">
                {pseudoSlots.map((slot) => (
                  <span key={slot}>
                    <b>{`h̃${slot}`}</b>
                    <i aria-hidden="true" />
                  </span>
                ))}
              </div>
              <div className="hide-ch7-slot-footer">
                <span>类 A</span>
                <span>类 B</span>
                <span>类 C</span>
                <strong>每类等量，平衡任务头与全类输出</strong>
              </div>
            </div>
          </HidePanel>

          <HidePanel title="统计量流向两个分类器" meta="平衡采样 · 只合成表征" tone="green">
            <div className="hide-ch7-sampling-grid">
              <div className="hide-ch7-sampling-card is-tii">
                <HideBadge tone="blue">TII</HideBadge>
                <strong>任务身份推断</strong>
                <HideKeyValue label="来源" value={info.tii} note="未受提示表征统计 Ĝc" />
                <small>等量采样后训练任务头 ω，覆盖全部已见任务。</small>
              </div>
              <div className="hide-ch7-sampling-card is-tap">
                <HideBadge tone="green">TAP</HideBadge>
                <strong>任务自适应预测</strong>
                <HideKeyValue label="来源" value={info.tap} note="受提示表征统计 Gc" />
                <small>等量采样后训练共享输出层 ψ，覆盖全部已见类别。</small>
              </div>
            </div>
            <HideNote title="不是旧样本回放" tone="purple">
              <code>Ĝc → ω</code> 与 <code>Gc → ψ</code> 的箭头只表示从统计分布重新采样；
              原始任务是过去的数据，不进入当前训练批次。
            </HideNote>
          </HidePanel>
        </div>
      </div>
    </HideScene>
  );
}
