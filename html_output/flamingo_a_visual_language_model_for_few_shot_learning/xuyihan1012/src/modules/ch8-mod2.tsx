import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawChannelStrip,
  drawLabel,
  drawLegend,
  drawLevelMeter,
  useCanvas,
} from '../lib/consoleKit';

// §8.2 module — 插入频率与参数预算的取舍。
// 一个主导操作：在「每层 / 每四层 / 每七层」之间切换插入频率，
// 通道条间距与三组对比条（总体得分 / 可训练参数 / 单步时间）同步变化。
// 论文没有单独报告「每七层」这一消融行，因此该状态只显示灰色说明，不编造数值。

const W = 1080;
const H = 280;

type Freq = 'every' | 'fourth' | 'seventh';

interface Report {
  params: number;
  stepTime: number;
  overall: number;
}

// Table 3 row (v)（Flamingo-3B，DEV 验证集，4 示例）：overall 越高越好，参数与单步时间越低越好。
const REPORT: Record<Freq, Report | null> = {
  every: { params: 3.2, stepTime: 1.74, overall: 70.7 },
  fourth: { params: 2.3, stepTime: 1.02, overall: 68.8 },
  seventh: null,
};

const SLOTS = 24;
const SLOT_W = 480 / SLOTS;

const INSERT_SLOTS: Record<Freq, number[]> = {
  every: Array.from({ length: SLOTS }, (_, i) => i),
  fourth: [0, 4, 8, 12, 16, 20],
  seventh: [0, 7, 14, 21],
};

const FREQ_LABEL: Record<Freq, string> = {
  every: '每层',
  fourth: '每四层',
  seventh: '每七层',
};

type ModState = { freq: Freq };

function feedbackFor(freq: Freq): { text: string; cls: string } {
  if (freq === 'every') {
    return {
      text: '每层插入：总体得分 70.7 最高，但参数 3.2B、单步 1.74s 也最高。',
      cls: 'good',
    };
  }
  if (freq === 'fourth') {
    return {
      text: '每四层插入：单步时间降到 1.02s（训练加速约 66%），总体得分只降 1.9%，论文给 9B 采用的就是这个频率。',
      cls: 'good',
    };
  }
  return {
    text: '每七层插入是 80B 实际采用的频率；论文没有单独列出这一行的消融数值，因此这里不给出得分。',
    cls: '',
  };
}

export const Ch8Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<ModState>({ freq: 'every' });
  const [ui, setUi] = useState<ModState>({ freq: 'every' });

  const applyFreq = (freq: Freq): void => {
    stateRef.current.freq = freq;
    setUi({ freq });
  };

  const { ref, ready } = useCanvas<ModState>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);
      const report = REPORT[s.freq];

      // 冻结 LM 层的底轨
      drawChannelStrip(ctx, 40, 68, 480, 12, { count: SLOTS, active: 0, color: COLORS.muted });

      // 按频率稀疏排布的插入通道条
      INSERT_SLOTS[s.freq].forEach((i) => {
        drawChannelStrip(ctx, 40 + i * SLOT_W + SLOT_W / 2 - 5, 92, 10, 90, {
          count: 1,
          active: 1,
          color: COLORS.aux,
        });
      });

      drawLabel(ctx, '冻结 LM 层', 40, 56, { color: COLORS.ink, size: 15 });
      drawLabel(ctx, '插入 通道条', 280, 206, { color: COLORS.muted, size: 13, align: 'center' });

      // 三组对比条：总体得分 / 可训练参数 / 单步时间
      const score = report ? report.overall / 100 : 0;
      const params = report ? report.params / 4 : 0;
      const step = report ? report.stepTime / 2 : 0;
      const grey = report === null;

      drawLevelMeter(ctx, 620, 66, 380, 24, score, {
        direction: 'up',
        muted: grey,
        label: report ? `得分 ${report.overall}` : '得分 —',
      });
      drawLevelMeter(ctx, 620, 126, 380, 24, params, {
        direction: 'down',
        muted: grey,
        label: report ? `参数 ${report.params}B` : '参数 —',
      });
      drawLevelMeter(ctx, 620, 186, 380, 24, step, {
        direction: 'down',
        muted: grey,
        label: report ? `单步 ${report.stepTime}s` : '单步 —',
      });

      if (grey) {
        ctx.beginPath();
        ctx.rect(560, 234, 480, 40);
        ctx.fillStyle = COLORS.axis;
        ctx.globalAlpha = 0.45;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.strokeStyle = COLORS.muted;
        ctx.stroke();
        drawLabel(ctx, '论文未单独', 620, 252, { color: COLORS.muted, size: 15 });
        drawLabel(ctx, '报告此消融行', 620, 270, { color: COLORS.muted, size: 15 });
      }

      drawLegend(ctx, 40, 244, [
        { color: COLORS.aux, text: '插入通道条' },
        { color: COLORS.axis, text: '冻结 LM 层' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * W) / rect.width;
    const y = ((event.clientY - rect.top) * H) / rect.height;
    if (x < 560 || y < 40 || y > 220) return;
    if (y < 108) applyFreq('every');
    else if (y < 168) applyFreq('fourth');
    else applyFreq('seventh');
  };

  const fb = feedbackFor(ui.freq);
  const report = REPORT[ui.freq];

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        onClick={onCanvasClick}
        aria-label={ready ? '插入频率与参数预算的对比' : '加载中'}
      />
      <div className="ctrl">
        <div className="chip-row">
          {(Object.keys(FREQ_LABEL) as Freq[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`chip${f === ui.freq ? ' selected' : ''}`}
              aria-pressed={f === ui.freq}
              onClick={() => applyFreq(f)}
            >
              {FREQ_LABEL[f]}
            </button>
          ))}
        </div>
        <span className="step-label">
          插入频率 <b>{FREQ_LABEL[ui.freq]}</b>
        </span>
        {report ? (
          <>
            <span className="step-label">
              总体得分 <b>{report.overall}</b>
            </span>
            <span className="step-label">
              可训练参数 <b>{report.params}B</b>
            </span>
            <span className="step-label">
              单步时间 <b>{report.stepTime}s</b>
            </span>
          </>
        ) : (
          <span className="step-label">论文未单独报告此消融行</span>
        )}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch8Mod2;
