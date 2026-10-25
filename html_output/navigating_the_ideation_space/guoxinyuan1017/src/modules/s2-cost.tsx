import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Second module of chapter 3. The paper's transition retrieval (T_PM / T_MF) is the whole
// point of the chapter, so this widget answers the obvious follow-up question: does it
// actually retrieve better than the plain baseline? Values are Table 3 R@30, taken from the
// paper: E5 0.160, T_PM 0.168, T_MF 0.148.

const BASE = 0.16;

interface Row {
  key: string;
  label: string;
  value: number;
  cls: string;
}

const ROWS: Row[] = [
  { key: 'e5', label: 'E5 基线', value: 0.16, cls: 'base' },
  { key: 'pm', label: 'T_PM（方法 − 问题）', value: 0.168, cls: 'pm' },
  { key: 'mf', label: 'T_MF（发现 − 方法）', value: 0.148, cls: 'mf' },
];

const ABS_SCALE = 0.18;
const DELTA_SCALE = 0.024;

const fmt = (n: number) => n.toFixed(3);
const signed = (n: number) => (n >= 0 ? `+${n.toFixed(3)}` : `−${Math.abs(n).toFixed(3)}`);

export const S2Cost: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'abs' | 'delta'>('abs');
  const isDelta = mode === 'delta';

  return (
    <div className="paper-stage">
      <div className="xcost">
        <div className="xcost-head">
          <div className="xcost-title">
            跃迁检索的 R@30：{isDelta ? '与基线的差' : '绝对值'}
          </div>
          <button
            type="button"
            className="xcost-toggle"
            onClick={() => setMode(isDelta ? 'abs' : 'delta')}
          >
            {isDelta ? '看绝对值' : '看差值'}
          </button>
        </div>

        <div className="xcost-rows">
          {ROWS.map((row) => {
            const delta = row.value - BASE;
            const ratio = isDelta
              ? Math.min(1, Math.abs(delta) / DELTA_SCALE)
              : Math.min(1, row.value / ABS_SCALE);
            const width = isDelta && row.cls === 'base' ? 0.004 : Math.max(0.012, ratio);
            return (
              <div className={`xcost-row ${row.cls}`} key={row.key}>
                <span className="xcost-label">{row.label}</span>
                <span className="xcost-track">
                  <span className="xcost-fill" style={{ width: `${width * 100}%` }} />
                </span>
                <span className="xcost-value">
                  {isDelta
                    ? row.cls === 'base'
                      ? '—'
                      : signed(delta)
                    : fmt(row.value)}
                </span>
              </div>
            );
          })}
        </div>

        <p className="xcost-note">
          {isDelta ? (
            <>
              T_PM 只高 <b>0.008</b>，T_MF 反而低 <b>0.012</b> —— 跨空间减法在检索上几乎没有回报。
            </>
          ) : (
            <>
              三条都停在 0.15 附近。<b>跃迁没有跳出基线的量级</b>，它更像一种分析视角，而不是更强的检索器。
            </>
          )}
        </p>
      </div>
    </div>
  );
};
