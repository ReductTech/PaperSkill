import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 340;

const COLORS = {
  bg: '#f5f8f0',
  rock: '#e3eadc',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
};

type CaseName = '精确文件' | '发送邮件' | '创意海报';
type CheckKey = 'rule' | 'state' | 'semantic';
type Coverage = 'missing' | 'partial' | 'covered';

type GraderModel = {
  rule: boolean;
  state: boolean;
  semantic: boolean;
  case: CaseName;
};

const CASES: CaseName[] = ['精确文件', '发送邮件', '创意海报'];
const CHECKS: Array<{ key: CheckKey; label: string; code: string; detail: string; example: string }> = [
  {
    key: 'rule',
    label: '规则检查',
    code: 'G_rule',
    detail: '检查最终产物中可以精确判断的属性。',
    example: '例如：文件是否存在，路径、名称、格式、字段与数值是否正确。',
  },
  {
    key: 'state',
    label: '环境状态',
    code: 'G_state',
    detail: '检查工具执行后，真实环境是否按要求改变。',
    example: '例如：邮件是否发出、收件人与附件是否正确，日历、文件或权限是否更新。',
  },
  {
    key: 'semantic',
    label: '语义评审',
    code: 'G_sem',
    detail: '依据 rubric 判断无法用固定规则覆盖的开放质量。',
    example: '例如：内容是否符合意图、完整连贯，图像或海报是否清晰且视觉合理。',
  },
];

const CASE_CONFIG: Record<
  CaseName,
  { critical: CheckKey[]; recommended: CheckKey[]; artifact: string }
> = {
  精确文件: {
    critical: ['rule'],
    recommended: ['rule'],
    artifact: 'CSV 文件\n字段与数值',
  },
  发送邮件: {
    critical: ['state'],
    recommended: ['rule', 'state'],
    artifact: '邮件任务\n正文与副作用',
  },
  创意海报: {
    critical: ['semantic'],
    recommended: ['rule', 'semantic'],
    artifact: '海报文件\n格式与开放质量',
  },
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function coverageFor(model: GraderModel): Coverage {
  const config = CASE_CONFIG[model.case];
  if (config.critical.some((key) => !model[key])) return 'missing';
  if (config.recommended.some((key) => !model[key])) return 'partial';
  return 'covered';
}

function feedbackFor(model: GraderModel): string {
  const coverage = coverageFor(model);
  if (coverage === 'missing') {
    if (model.case === '精确文件') {
      return '规则检查未启用：精确文件的格式与内容没有确定性核对。';
    }
    if (model.case === '发送邮件') {
      return '环境状态未启用：可能漏掉未发送或收件人错误等副作用。';
    }
    return '语义评审未启用：开放式海报的质量没有被评价。';
  }
  if (coverage === 'partial') {
    if (model.case === '发送邮件') {
      return '环境状态已覆盖关键副作用；加入规则检查可补充附件和格式核对。';
    }
    return '语义评审已覆盖关键质量；加入规则检查可补充尺寸与文件格式核对。';
  }
  if (model.case === '精确文件') {
    return '规则检查已覆盖精确文件的关键属性。';
  }
  if (model.case === '发送邮件') {
    return '规则检查与环境状态共同覆盖产物和真实副作用。';
  }
  return '规则检查与语义评审共同覆盖格式与开放质量。';
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX - 9, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 10, toY - 6);
  ctx.lineTo(toX - 10, toY + 6);
  ctx.closePath();
  ctx.fill();
}

function drawScene(ctx: CanvasRenderingContext2D, model: GraderModel) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLORS.rock;
  ctx.beginPath();
  ctx.moveTo(0, 302);
  ctx.bezierCurveTo(210, 266, 365, 325, 565, 287);
  ctx.bezierCurveTo(750, 254, 920, 310, 1080, 276);
  ctx.lineTo(1080, 340);
  ctx.lineTo(0, 340);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORS.text;
  ctx.font = '700 20px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('任务最多组合三层，并非每个任务都用满三层', 35, 31);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('并列证据 · 不做固定加权', 1038, 31);

  roundedRect(ctx, 36, 103, 172, 132, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = COLORS.orange;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.orange;
  ctx.font = '700 16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(model.case, 122, 132);
  ctx.fillStyle = COLORS.text;
  ctx.font = '16px "Segoe UI", sans-serif';
  CASE_CONFIG[model.case].artifact.split('\n').forEach((line, index) => {
    ctx.fillText(line, 122, 171 + index * 27);
  });

  CHECKS.forEach((check, index) => {
    const x = 304;
    const y = 62 + index * 86;
    const enabled = model[check.key];
    const critical = CASE_CONFIG[model.case].critical.includes(check.key);
    const fill = enabled ? COLORS.blue : '#ffffff';
    const stroke = critical && !enabled ? COLORS.red : enabled ? COLORS.blue : COLORS.border;
    drawArrow(ctx, 216, 169, x - 9, y + 31, enabled ? COLORS.blue : COLORS.border);
    roundedRect(ctx, x, y, 248, 62, 14);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = critical && !enabled ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = enabled ? '#ffffff' : COLORS.text;
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(check.label, x + 18, y + 27);
    ctx.fillStyle = enabled ? 'rgba(255,255,255,0.82)' : COLORS.muted;
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(check.code + (critical ? ' · 关键' : ' · 可选'), x + 18, y + 49);
    drawArrow(ctx, x + 257, y + 31, 731, 169, enabled ? COLORS.blue : COLORS.border);
  });

  const coverage = coverageFor(model);
  const verdictColor =
    coverage === 'covered' ? COLORS.green : coverage === 'partial' ? COLORS.blue : COLORS.red;
  roundedRect(ctx, 740, 86, 302, 166, 18);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = verdictColor;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = verdictColor;
  ctx.beginPath();
  ctx.arc(891, 126, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 19px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(coverage === 'covered' ? '✓' : coverage === 'partial' ? '…' : '!', 891, 133);
  ctx.fillStyle = verdictColor;
  ctx.font = '700 19px "Segoe UI", sans-serif';
  ctx.fillText(
    coverage === 'covered' ? '关键证据已覆盖' : coverage === 'partial' ? '关键覆盖，可再补充' : '遗漏关键属性',
    891,
    179
  );
  const enabledCount = CHECKS.filter((check) => model[check.key]).length;
  ctx.fillStyle = COLORS.muted;
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.fillText('当前启用 ' + enabledCount + ' / 3 层', 891, 215);
}

export const GraderTriad: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [model, setModel] = useState<GraderModel>({
    rule: true,
    state: false,
    semantic: false,
    case: '精确文件',
  });
  const modelRef = useRef(model);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const tick = () => {
      drawScene(ctx, modelRef.current);
      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const toggleCheck = (key: CheckKey) => {
    setModel((current) => ({ ...current, [key]: !current[key] }));
  };

  const coverage = coverageFor(model);
  const partialStyle =
    coverage === 'partial'
      ? { color: COLORS.blue, borderLeftColor: COLORS.blue, background: '#eef3fb' }
      : undefined;

  return (
    <div>
      <canvas
        id={'cv-' + chapterId + '-' + moduleId}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="产物通过三类评分器形成验收结论的示意图"
      />
      <div className="ctrl">
        <span>任务案例</span>
        {CASES.map((caseName) => (
          <button
            key={caseName}
            className={'tiny ' + (model.case === caseName ? '' : 'ghost')}
            type="button"
            aria-pressed={model.case === caseName}
            onClick={() => setModel((current) => ({ ...current, case: caseName }))}
          >
            {caseName}
          </button>
        ))}
        <span>启用检查</span>
        {CHECKS.map((check) => (
          <button
            key={check.key}
            className={'tiny ' + (model[check.key] ? '' : 'ghost')}
            type="button"
            aria-pressed={model[check.key]}
            onClick={() => toggleCheck(check.key)}
          >
            {check.label}
          </button>
        ))}
      </div>
      <div className="grader-explain" aria-label="三类验收检查说明">
        <h4>三类检查分别看什么？</h4>
        <div className="grader-explain-grid">
          {CHECKS.map((check) => (
            <article
              key={check.key}
              className={'grader-explain-card ' + (model[check.key] ? 'active' : '')}
            >
              <div className="grader-explain-title">
                <b>{check.label}</b>
                <span>{check.code}</span>
              </div>
              <p>{check.detail}</p>
              <small>{check.example}</small>
            </article>
          ))}
        </div>
      </div>
      <div
        className={
          'feedback ' + (coverage === 'covered' ? 'good' : coverage === 'missing' ? 'bad' : '')
        }
        style={partialStyle}
      >
        {feedbackFor(model)}
      </div>
    </div>
  );
};

export default GraderTriad;
