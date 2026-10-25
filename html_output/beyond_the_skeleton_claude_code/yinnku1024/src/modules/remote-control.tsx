import React, { useState } from 'react';
import { Dept, Feedback, HW } from './kit';

const LAYERS = ['CCD 桌面端', '全局', '用户', '策略', '项目', '本地'];

const SETTINGS = [
  { id: 'model', name: '默认模型', layer: '用户', dialog: false, note: '普通偏好，直接生效。' },
  { id: 'proxy', name: 'HTTP_PROXY', layer: '策略', dialog: true, note: '流量劫持风险：远程推送会弹安全对话框。' },
  { id: 'helper', name: 'apiKeyHelper', layer: '策略', dialog: true, note: '危险 shell 配置：需要用户确认。' },
  { id: 'deny', name: '权限 deny 规则', layer: '项目', dialog: false, note: '项目级策略，随仓库走。' },
];

/* 监控室：遥测不是“上报指标”，而是一条从云端到终端的配置通道。
   优先级链决定谁覆盖谁；危险配置在落地前还要过一道人工确认。 */
export function RemoteControl() {
  const [active, setActive] = useState('proxy');
  const setting = SETTINGS.find(item => item.id === active)!;

  return (
    <div className="hw" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.02fr)' }}>
      <div className="hw-card hw-card--plain hw-col" style={{ gap: 8 }}>
        <div className="hw-spread">
          <p className="hw-h">配置优先级</p>
          <Dept>监控室</Dept>
        </div>
        {LAYERS.map((layer, index) => (
          <div key={layer} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px',
            borderRadius: 6, border: `1px solid ${layer === setting.layer ? HW.orange : HW.line}`,
            background: layer === setting.layer ? '#fdf2ea' : '#ffffff',
          }}>
            <span className="hw-num" style={{ width: 34, height: 34, fontSize: 24, background: layer === setting.layer ? HW.orange : HW.lineStrong }}>{index + 1}</span>
            <span className="hw-t">{layer}</span>
            {layer === setting.layer && <span className="hw-chip" data-tone="orange" style={{ marginLeft: 'auto' }}>本次来源</span>}
          </div>
        ))}
        <p className="hw-t hw-muted" style={{ fontSize: 26 }}>越靠上优先级越高：企业策略可以覆盖项目与本地。</p>
      </div>

      <div className="hw-col">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SETTINGS.map(item => (
            <button key={item.id} type="button" className="hw-btn"
              aria-pressed={active === item.id} onClick={() => setActive(item.id)}
              style={{ fontSize: 27, padding: '6px 12px' }}>{item.name}</button>
          ))}
        </div>

        <div className="hw-card hw-card--plain">
          <p className="hw-t hw-muted">这次下发的来源</p>
          <p className="hw-h" style={{ margin: '4px 0' }}>{setting.layer}</p>
          <p className="hw-t hw-t--tight">{setting.note}</p>
          {setting.dialog && (
            <div className="hw-slot" style={{ marginTop: 8, borderColor: HW.red, background: '#fbe9ec' }}>
              <p className="hw-t" style={{ color: '#9b2c3d' }}>安全对话框：是否允许远程修改这条配置？</p>
            </div>
          )}
        </div>

        <div className="hw-card hw-card--mint">
          <p className="hw-t hw-muted">三个数据端点 · 每 300 秒批量导出</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {['/metrics', '/organizations/…', '/claude_code_grove'].map(path => (
              <span key={path} className="hw-mono" style={{ fontSize: 24, color: HW.tealDark }}>{path}</span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={setting.dialog ? 'bad' : 'neutral'}>
            {setting.dialog
              ? '从云端到终端的通道本身没错；危险的是它能在你不知情时改掉代理或密钥助手。'
              : '普通配置沿优先级链生效；只有危险项需要人工确认。'}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
