import { useMemo, useState } from 'react'
import { datasets, metricMeta, type MetricKey } from '../data/paper'
import { Icon } from './Icon'

const metrics = Object.keys(metricMeta) as MetricKey[]
const families = [
  { id: 'textldm', label: 'TextLDM' },
  { id: 'autoregressive', label: '自回归' },
  { id: 'diffusion', label: '已有扩散模型' },
] as const

export function ResultsLab() {
  const [datasetId, setDatasetId] = useState(datasets[0].id)
  const [metric, setMetric] = useState<MetricKey>('r1')
  const [visibleFamilies, setVisibleFamilies] = useState<string[]>(families.map((family) => family.id))

  const dataset = datasets.find((item) => item.id === datasetId) ?? datasets[0]
  const models = dataset.models.filter((model) => visibleFamilies.includes(model.family))
  const maxValue = useMemo(
    () => Math.max(...dataset.models.map((model) => model.values[metric])),
    [dataset, metric],
  )
  const bestModel = dataset.models.reduce((best, current) =>
    current.values[metric] > best.values[metric] ? current : best,
  )

  const toggleFamily = (familyId: string) => {
    setVisibleFamilies((current) => {
      if (current.includes(familyId)) {
        return current.length === 1 ? current : current.filter((id) => id !== familyId)
      }
      return [...current, familyId]
    })
  }

  return (
    <div className="results-lab">
      <div className="lab-toolbar">
        <div className="control-group">
          <span className="control-label">评测集</span>
          <div className="segmented-control">
            {datasets.map((item) => (
              <button
                className={item.id === dataset.id ? 'is-active' : ''}
                key={item.id}
                onClick={() => setDatasetId(item.id)}
                type="button"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <span className="control-label">指标</span>
          <div className="segmented-control segmented-control--compact">
            {metrics.map((key) => (
              <button
                className={key === metric ? 'is-active' : ''}
                key={key}
                onClick={() => setMetric(key)}
                title={metricMeta[key].full}
                type="button"
              >
                {metricMeta[key].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="results-summary">
        <div>
          <p className="eyebrow">Selected benchmark</p>
          <h3>{dataset.name}</h3>
          <p>{dataset.note}</p>
        </div>
        <div className="best-result">
          <span>当前指标最高</span>
          <strong>{bestModel.shortName}</strong>
          <b>{bestModel.values[metric]}</b>
        </div>
      </div>

      <div className="family-filters" aria-label="模型类别筛选">
        {families.map((family) => (
          <button
            aria-pressed={visibleFamilies.includes(family.id)}
            className={visibleFamilies.includes(family.id) ? 'is-active' : ''}
            key={family.id}
            onClick={() => toggleFamily(family.id)}
            type="button"
          >
            <span className={`family-dot family-dot--${family.id}`} />
            {family.label}
          </button>
        ))}
      </div>

      <div className="metric-chart" role="img" aria-label={`${dataset.name} 的 ${metricMeta[metric].full} 对比`}>
        {models.map((model) => {
          const value = model.values[metric]
          const width = Math.max((value / maxValue) * 100, 1.5)
          return (
            <div className="metric-row" key={model.name}>
              <div className="metric-row__label">
                <strong>{model.shortName}</strong>
                <span className={`family-tag family-tag--${model.family}`}>
                  {families.find((family) => family.id === model.family)?.label}
                </span>
              </div>
              <div className="metric-row__track">
                <span
                  className={`metric-row__fill metric-row__fill--${model.family}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <b className="metric-row__value">{value.toFixed(value < 2 ? 2 : 1)}</b>
            </div>
          )
        })}
      </div>

      <div className="repa-callout">
        <div className="repa-callout__icon"><Icon name="spark" size={22} /></div>
        <div className="repa-callout__copy">
          <span>关键消融 / WikiSource MAUVE</span>
          <strong>REPA 带来的提升不是重建，而是生成式潜空间质量</strong>
        </div>
        <div className="repa-bars">
          <div><span>无 REPA</span><b style={{ width: '12%' }}>2.5</b></div>
          <div><span>有 REPA</span><b style={{ width: '100%' }}>20.4</b></div>
        </div>
      </div>

      <p className="chart-footnote">
        柱长按当前评测集、当前指标内最高值归一化，仅用于论文内部结果比较；不代表跨指标综合得分。
      </p>
    </div>
  )
}
