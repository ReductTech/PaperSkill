import React, { useState } from 'react';
import { Feedback, Meter, RW, Switch } from './kit';

type Mode = 'eager' | 'lazy' | 'skip';
const DEPS = [
  { id: 'otel', name: 'OpenTelemetry', size: 400, use: '追踪与指标' },
  { id: 'grpc', name: 'gRPC', size: 700, use: '流式通道' },
];

/* 启动预算：常用能力并行预取，重依赖推到首次使用。
   两个数字（≈400KB、≈700KB）来自文档；这里只比较加载时机，不编造耗时。 */
export function StartupBudget() {
  const [modes, setModes] = useState<Record<string, Mode>>({ otel: 'lazy', grpc: 'lazy' });
  const [prefetch, setPrefetch] = useState(true);
  const eager = DEPS.filter(dep => modes[dep.id] === 'eager').reduce((sum, dep) => sum + dep.size, 0);
  const lazy = DEPS.filter(dep => modes[dep.id] === 'lazy').reduce((sum, dep) => sum + dep.size, 0);
  const missing = DEPS.filter(dep => modes[dep.id] === 'skip').length;

  return (
    <div className="rw" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)' }}>
      <div className="rw-col">
        {DEPS.map(dep => (
          <div key={dep.id} className="rw-card rw-card--plain">
            <div className="rw-spread">
              <div>
                <p className="rw-t" style={{ fontWeight: 700 }}>{dep.name}</p>
                <p className="rw-t rw-muted" style={{ fontSize: 26 }}>{dep.use} · 约 {dep.size} KB</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['eager', 'lazy', 'skip'] as Mode[]).map(mode => (
                  <button key={mode} type="button" className="rw-btn"
                    aria-pressed={modes[dep.id] === mode}
                    style={{ fontSize: 26, padding: '4px 12px' }}
                    onClick={() => setModes(current => ({ ...current, [dep.id]: mode }))}>
                    {mode === 'eager' ? '启动加载' : mode === 'lazy' ? '首次使用' : '不加载'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        <Switch checked={prefetch} onChange={setPrefetch}>启动时并行预取（MDM / 钥匙串 / API 预连接）</Switch>

        <div className="rw-card rw-card--soft">
          <p className="rw-t rw-t--tight">
            {prefetch
              ? '三件事在重模块 import 之前并行发起：首屏交互不用等它们串行完成。'
              : '全部串行：用户敲下第一条命令之前，要依次等完三次往返。'}
          </p>
        </div>
      </div>

      <div className="rw-col">
        <div className="rw-card rw-card--plain">
          <p className="rw-fig" style={{ color: eager > 0 ? RW.orange : RW.green }}>{eager}</p>
          <p className="rw-t rw-muted">启动时就要加载（KB）</p>
          <Meter label="启动负担" value={eager} max={1100} tone={eager > 500 ? 'red' : 'green'}
            readout={`${eager} / 1100`} />
        </div>
        <div className="rw-card rw-card--plain">
          <p className="rw-fig" style={{ color: RW.blue }}>{lazy}</p>
          <p className="rw-t rw-muted">推迟到首次使用（KB）</p>
          <Meter label="按需加载" value={lazy} max={1100} tone="blue" readout={`${lazy} / 1100`} />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={missing > 0 ? 'bad' : eager > 500 ? 'neutral' : 'good'}>
            {missing > 0
              ? `有 ${missing} 个依赖完全不加载：对应能力在用到时会直接不可用。`
              : eager > 500
                ? '两个重依赖都在启动时加载：打开就要背 1.1MB。'
                : '启动只背必需的东西；遥测与流式通道等到第一次真正用到。'}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
