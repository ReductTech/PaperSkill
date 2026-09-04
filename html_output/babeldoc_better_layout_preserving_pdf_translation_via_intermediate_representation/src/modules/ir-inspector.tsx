import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  MUSEUM_COLORS,
  clearMuseumScene,
  drawCaptionCard,
  drawExhibitFrame,
  drawLegend,
  drawMuseumLabel,
  drawMuseumWall,
} from './museum-hero';

type SelectedField = 'pageLayout' | 'font' | 'character' | 'paragraph' | 'placeholder';

interface FieldDetail {
  label: string;
  source: string;
  example: string;
  meaning: string;
  cannot: string;
  feedback: string;
  color: string;
}

const FIELD_ORDER: SelectedField[] = ['pageLayout', 'font', 'character', 'paragraph', 'placeholder'];

const FIELD_DETAILS: Record<SelectedField, FieldDetail> = {
  pageLayout: {
    label: '页面布局',
    source: 'page_layout[].class_name、box、conf',
    example: '页眉类别、矩形坐标与置信度',
    meaning: '回答某个区域在哪里、被识别成什么，为后续重建提供空间依据。',
    cannot: '不能据此声称已经覆盖所有页面结构。',
    feedback: '你正在看视觉布局元数据：区域类别与边界框给后续重建提供空间依据。',
    color: MUSEUM_COLORS.current,
  },
  font: {
    label: '字体目录',
    source: 'pdf_font[].font_id、name、ascent、descent',
    example: '来源字体身份与上升部、下降部度量',
    meaning: '保存来源字体身份与度量，为重建提供约束。',
    cannot: '不能据此声称译文一定逐项复用同一字体。',
    feedback: '你正在看来源字体约束：保存身份和度量，不等于承诺输出字体逐项不变。',
    color: MUSEUM_COLORS.dark,
  },
  character: {
    label: '字符记录',
    source: 'pdf_character[].char_unicode、font_size、box、render_order',
    example: '字符文字、字号、矩形框与绘制次序',
    meaning: '一个字符同时带有文字、位置与绘制顺序，是内容与绘制状态的交叉点。',
    cannot: '单个字符记录不等于整页结构已经完整恢复。',
    feedback: '你正在看内容与绘制状态的交叉点：一个字符同时带有文字、位置和绘制顺序。',
    color: MUSEUM_COLORS.emphasis,
  },
  paragraph: {
    label: '段落文本',
    source: 'paragraph[].input、output、pdf_unicode、layout_label',
    example: '翻译前后文字、PDF 字符串与布局标签',
    meaning: '追踪翻译前后文字，同时连接段落与页面区域。',
    cannot: 'Listing 1 中输入输出相同只是截取状态，不能据此说系统没有翻译。',
    feedback: '你正在看可编辑语义状态：输入、输出和布局标签让文字修改仍能关联页面区域。',
    color: MUSEUM_COLORS.auxiliary,
  },
  placeholder: {
    label: '占位追踪',
    source: 'paragraph[].placeholders[]：类型、编号、占位符、来源字符',
    example: '附录引用占位符示例 {v1}',
    meaning: '说明结构化片段可以在段落记录中被追踪。',
    cannot: '这里只引用附录字段；它与第 2 章教学公式字符串中的 {v1} 属于不同证据用途。',
    feedback: '你正在看翻译跟踪：结构片段可用占位符登记；具体保护与恢复机制留到第 2 章。',
    color: MUSEUM_COLORS.support,
  },
};

const W = 1000;
const H = 600;
const NODE_X = 54;
const NODE_W = 330;
const NODE_H = 64;
const NODE_START_Y = 84;
const NODE_GAP = 92;

function nodeY(index: number) {
  return NODE_START_Y + index * NODE_GAP;
}

function drawPageTargets(ctx: CanvasRenderingContext2D, selected: SelectedField) {
  const pageX = 550;
  const pageY = 65;
  const pageW = 370;
  const pageH = 470;
  drawExhibitFrame(ctx, pageX, pageY, pageW, pageH, {
    stroke: selected === 'pageLayout' ? MUSEUM_COLORS.current : MUSEUM_COLORS.dark,
    fill: '#ffffff',
    lineWidth: selected === 'pageLayout' ? 3 : 2,
    radius: 12,
  });

  drawCaptionCard(ctx, 585, 96, 300, 48, 'page_layout：页眉区域', {
    stroke: selected === 'pageLayout' ? MUSEUM_COLORS.current : MUSEUM_COLORS.border,
    textColor: selected === 'pageLayout' ? MUSEUM_COLORS.current : MUSEUM_COLORS.muted,
    fontSize: 13,
    align: 'center',
    padding: 8,
  });
  drawCaptionCard(ctx, 585, 166, 134, 54, ['pdf_font', '身份 + 度量'], {
    stroke: selected === 'font' ? MUSEUM_COLORS.dark : MUSEUM_COLORS.border,
    textColor: selected === 'font' ? MUSEUM_COLORS.dark : MUSEUM_COLORS.muted,
    fontSize: 12,
    align: 'center',
    padding: 6,
  });
  drawCaptionCard(ctx, 751, 166, 134, 54, ['character', '字 + 框 + 次序'], {
    stroke: selected === 'character' ? MUSEUM_COLORS.emphasis : MUSEUM_COLORS.border,
    textColor: selected === 'character' ? MUSEUM_COLORS.emphasis : MUSEUM_COLORS.muted,
    fontSize: 12,
    align: 'center',
    padding: 6,
  });
  drawCaptionCard(ctx, 585, 250, 300, 112, ['paragraph.input', 'paragraph.output', 'layout_label → 页面区域'], {
    stroke: selected === 'paragraph' ? MUSEUM_COLORS.auxiliary : MUSEUM_COLORS.border,
    textColor: selected === 'paragraph' ? MUSEUM_COLORS.auxiliary : MUSEUM_COLORS.muted,
    fontSize: 13,
    lineHeight: 26,
    padding: 10,
  });
  drawCaptionCard(ctx, 650, 402, 170, 60, 'placeholders[]  {v1}', {
    stroke: selected === 'placeholder' ? MUSEUM_COLORS.support : MUSEUM_COLORS.border,
    textColor: selected === 'placeholder' ? MUSEUM_COLORS.support : MUSEUM_COLORS.muted,
    fontSize: 13,
    align: 'center',
    padding: 8,
  });
}

function drawState(ctx: CanvasRenderingContext2D, selected: SelectedField) {
  clearMuseumScene(ctx, W, H);
  drawMuseumWall(ctx, W, H, { pedestalY: 558 });

  ctx.save();
  ctx.strokeStyle = MUSEUM_COLORS.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, nodeY(0) + NODE_H / 2);
  ctx.lineTo(30, nodeY(4) + NODE_H / 2);
  ctx.stroke();
  ctx.restore();

  FIELD_ORDER.forEach((field, index) => {
    const current = selected === field;
    const detail = FIELD_DETAILS[field];
    const y = nodeY(index);
    ctx.save();
    ctx.strokeStyle = current ? MUSEUM_COLORS.current : MUSEUM_COLORS.border;
    ctx.lineWidth = current ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(30, y + NODE_H / 2);
    ctx.lineTo(NODE_X, y + NODE_H / 2);
    ctx.stroke();
    ctx.restore();
    drawCaptionCard(ctx, NODE_X, y, NODE_W, NODE_H, detail.label, {
      stroke: current ? MUSEUM_COLORS.current : MUSEUM_COLORS.border,
      fill: current ? 'rgba(39,68,110,0.07)' : 'rgba(255,255,255,0.45)',
      textColor: current ? MUSEUM_COLORS.current : MUSEUM_COLORS.muted,
      fontSize: 15,
      align: 'center',
      padding: 10,
    });
  });

  const currentIndex = FIELD_ORDER.indexOf(selected);
  const targetYs: Record<SelectedField, number> = {
    pageLayout: 120,
    font: 193,
    character: 193,
    paragraph: 306,
    placeholder: 432,
  };
  ctx.save();
  ctx.strokeStyle = MUSEUM_COLORS.current;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(NODE_X + NODE_W, nodeY(currentIndex) + NODE_H / 2);
  ctx.bezierCurveTo(455, nodeY(currentIndex) + NODE_H / 2, 470, targetYs[selected], 550, targetYs[selected]);
  ctx.stroke();
  ctx.restore();

  drawPageTargets(ctx, selected);
  drawMuseumLabel(ctx, '结构记录', 55, 52, { color: MUSEUM_COLORS.current, fontSize: 14 });
  drawMuseumLabel(ctx, '页面卡', 920, 52, { color: MUSEUM_COLORS.dark, fontSize: 14, align: 'right' });
  drawLegend(ctx, [{ label: '当前字段', color: MUSEUM_COLORS.current }], 420, 574);
}

export const IrInspector: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const visibleRef = useRef(false);
  const selectedRef = useRef<SelectedField>('pageLayout');
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [selectedField, setSelectedField] = useState<SelectedField>('pageLayout');

  useEffect(() => {
    selectedRef.current = selectedField;
    if (visibleRef.current && ctxRef.current) drawState(ctxRef.current, selectedField);
  }, [selectedField]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      ctxRef.current = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const start = () => {
      visibleRef.current = true;
      if (ctxRef.current) drawState(ctxRef.current, selectedRef.current);
      canvas.classList.add('is-ready');
    };
    const stop = () => {
      visibleRef.current = false;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      visibleRef.current = false;
      disconnect();
    };
  }, []);

  const selectAndFocus = (index: number) => {
    const field = FIELD_ORDER[index];
    if (!field) return;
    setSelectedField(field);
    buttonRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | null = null;
    if (event.key === 'ArrowDown') next = (index + 1) % FIELD_ORDER.length;
    if (event.key === 'ArrowUp') next = (index - 1 + FIELD_ORDER.length) % FIELD_ORDER.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = FIELD_ORDER.length - 1;
    if (next !== null) {
      event.preventDefault();
      selectAndFocus(next);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * W) / rect.width;
    const y = ((event.clientY - rect.top) * H) / rect.height;
    if (x < NODE_X || x > NODE_X + NODE_W) return;
    const index = FIELD_ORDER.findIndex((_, itemIndex) => {
      const top = nodeY(itemIndex);
      return y >= top && y <= top + NODE_H;
    });
    if (index >= 0) setSelectedField(FIELD_ORDER[index]);
  };

  const detail = FIELD_DETAILS[selectedField];

  return (
    <div>
      <div className="chip-row" role="tablist" aria-label="简化 IR 字段组" aria-orientation="vertical">
        {FIELD_ORDER.map((field, index) => (
          <button
            key={field}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={selectedField === field}
            aria-controls={`${chapterId}-${moduleId}-detail`}
            tabIndex={selectedField === field ? 0 : -1}
            className={`chip ${selectedField === field ? 'selected' : ''}`}
            onClick={() => setSelectedField(field)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {FIELD_DETAILS[field].label}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`简化 IR 检查器，当前选择${detail.label}`}
        onClick={handleCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      <div
        id={`${chapterId}-${moduleId}-detail`}
        style={{
          minHeight: 230,
          marginTop: 12,
          padding: '14px 16px',
          border: `1px solid ${MUSEUM_COLORS.border}`,
          borderLeft: `4px solid ${MUSEUM_COLORS.current}`,
          borderRadius: 10,
          background: '#fff',
        }}
      >
        <strong style={{ color: MUSEUM_COLORS.current }}>{detail.label}</strong>
        <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(92px, auto) 1fr', gap: '8px 12px', margin: '12px 0 0' }}>
          <dt>来源字段</dt>
          <dd style={{ margin: 0 }}><code>{detail.source}</code></dd>
          <dt>示例值</dt>
          <dd style={{ margin: 0 }}>{detail.example}</dd>
          <dt>准确含义</dt>
          <dd style={{ margin: 0 }}>{detail.meaning}</dd>
          <dt>不能推出</dt>
          <dd style={{ margin: 0 }}>{detail.cannot}</dd>
        </dl>
      </div>
      <div
        className="feedback"
        aria-live="polite"
        style={{ borderLeftColor: MUSEUM_COLORS.current, color: MUSEUM_COLORS.current }}
      >
        {detail.feedback}
      </div>
      <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.support, color: MUSEUM_COLORS.support }}>
        论文附录明确称此 Listing 为简化片段；不要把五组字段当作完整生产 schema。
      </div>
      <p style={{ color: MUSEUM_COLORS.muted, margin: '10px 0 0' }}>
        判断提示：若只剩 <code>paragraph.output</code>，即使译文正确，也仍不足以恢复页面。
      </p>
    </div>
  );
};

export default IrInspector;
