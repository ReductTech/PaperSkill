import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  第 7-9 章交互模块：正当程序审判 / 守卫修订 / 收敛停止
// ============================================================================

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const ENV_L = '#b8c9a7';
const ENV_D = '#76906a';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const TEXT = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';

/* ---------------- Ch7：陪审团投票与裁决计算（P1 滑块，双画布） ---------------- */
const JURY_SIZE = 9;
const QUORUM_RATIO = 0.8; // 示意：存活票 ≥ 80% 陪审团规模
const MAJORITY_RATIO = 0.6; // 示意：一方 > 60% 存活票

// 圆角矩形辅助（canvas 2D）
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rr: number
) {
  const r = Math.min(rr, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const Ch7JuryVote: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const juryRef = useRef<HTMLCanvasElement>(null);
  const codeRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ support: 62 }); // 支持"指控成立"的百分比
  const [support, setSupport] = useState(62);
  const [feedback, setFeedback] = useState({
    text: '示意阈值：存活票≥80%达到 quorum；一方票数>60%存活票达到 majority。拖动滑块改变投票分布。',
    cls: '',
  });

  useEffect(() => {
    const c1 = juryRef.current;
    const c2 = codeRef.current;
    if (!c1 || !c2) return;
    let ctx1: CanvasRenderingContext2D;
    let ctx2: CanvasRenderingContext2D;
    try {
      ctx1 = setupCanvas(c1, 540, H);
      ctx2 = setupCanvas(c2, 540, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    // 左图：陪审团投票分布（独立画布 540x280）
    const drawJury = (s: { support: number }, ctx: CanvasRenderingContext2D) => {
      const supportN = Math.round((s.support / 100) * JURY_SIZE);
      const W2 = 540;
      ctx.clearRect(0, 0, W2, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fbfdf9');
      grad.addColorStop(1, BG);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W2, H);

      ctx.fillStyle = MUTED;
      ctx.font = '600 16px "Microsoft YaHei", sans-serif';
      ctx.fillText('局部陪审团', 40, 40);
      for (let i = 0; i < JURY_SIZE; i++) {
        const x = 60 + (i % 5) * 82;
        const y = 76 + Math.floor(i / 5) * 92;
        const sup = i < supportN;
        ctx.fillStyle = sup ? GREEN : RED;
        ctx.beginPath();
        ctx.arc(x, y, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sup ? '✓' : '✗', x, y + 7);
        ctx.textAlign = 'left';
      }
    };

    // 右图：裁决计算（代码）（独立画布 540x280）
    const drawCode = (s: { support: number }, ctx: CanvasRenderingContext2D) => {
      const supportN = Math.round((s.support / 100) * JURY_SIZE);
      const opposeN = JURY_SIZE - supportN;
      const quorumOK = JURY_SIZE >= Math.ceil(QUORUM_RATIO * JURY_SIZE);
      const alive = JURY_SIZE;
      const supportRatio = supportN / alive;
      const majorityOK = supportRatio > MAJORITY_RATIO || opposeN / alive > MAJORITY_RATIO;
      const verdict = quorumOK && majorityOK
        ? supportRatio > opposeN / alive
          ? 'valid-fixable（成立·可机修）'
          : 'invalid-drop（不成立·驳回）'
        : '升级更大陪审团';
      const W2 = 540;
      ctx.clearRect(0, 0, W2, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fbfdf9');
      grad.addColorStop(1, BG);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W2, H);

      ctx.fillStyle = TEXT;
      ctx.font = '700 17px "Microsoft YaHei", sans-serif';
      ctx.fillText('裁决计算（代码）', 60, 44);

      // quorum 检查
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = quorumOK ? GREEN : RED;
      ctx.lineWidth = 2;
      roundRect(ctx, 60, 62, 440, 52, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = quorumOK ? GREEN : RED;
      ctx.font = '20px "Microsoft YaHei", sans-serif';
      ctx.fillText(
        `${quorumOK ? '✓' : '✗'} quorum：存活 ${alive}/${JURY_SIZE} ≥ ${Math.ceil(QUORUM_RATIO * JURY_SIZE)}`,
        80,
        96
      );

      // majority 检查
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = majorityOK ? GREEN : RED;
      ctx.lineWidth = 2;
      roundRect(ctx, 60, 124, 440, 52, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = majorityOK ? GREEN : RED;
      ctx.font = '20px "Microsoft YaHei", sans-serif';
      ctx.fillText(
        `${majorityOK ? '✓' : '✗'} majority：支持 ${Math.round(supportRatio * 100)}% 存活票`,
        80,
        158
      );

      // 裁决
      ctx.fillStyle = 'rgba(39,68,110,0.08)';
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2;
      roundRect(ctx, 60, 190, 440, 60, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = BLUE;
      ctx.font = '20px "Microsoft YaHei", sans-serif';
      ctx.fillText('裁决：' + verdict, 80, 230);
    };

    const tick = () => {
      drawJury(stateRef.current, ctx1);
      drawCode(stateRef.current, ctx2);
      if (!c1.classList.contains('is-ready')) c1.classList.add('is-ready');
      if (!c2.classList.contains('is-ready')) c2.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(c1, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.support = v;
    setSupport(v);
    const supportN = Math.round((v / 100) * JURY_SIZE);
    const ratio = supportN / JURY_SIZE;
    if (ratio > MAJORITY_RATIO) {
      setFeedback({ text: `支持票 ${supportN}/${JURY_SIZE}（${Math.round(ratio * 100)}%）超过多数阈值：指控成立 → valid-fixable。`, cls: 'good' });
    } else if (ratio < 1 - MAJORITY_RATIO) {
      setFeedback({ text: `支持票仅 ${supportN}/${JURY_SIZE}：多数倾向驳回 → invalid-drop（指控不成立）。`, cls: '' });
    } else {
      setFeedback({ text: `支持票 ${supportN}/${JURY_SIZE}：未形成明确多数 → 升级到更大陪审团。`, cls: 'bad' });
    }
  };

  return (
    <div>
      <div className="dual-canvas">
        <canvas id={`cv-${chapterId}-${moduleId}-jury`} ref={juryRef} width={540} height={H} />
        <canvas id={`cv-${chapterId}-${moduleId}-code`} ref={codeRef} width={540} height={H} />
      </div>
      <div className="ctrl">
        <label>
          支持"成立"的比例 <span className="val">{support}%</span>
        </label>
        <input type="range" min={0} max={100} value={support} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

/* ---------------- Ch8：守卫链（P4 芯片 + P2 步进） ---------------- */
const CH8_GUARDS = ['锚点边界', '交叉引用', '语义审计', '编译检查'];
type RiskMode = 'LOW' | 'RISKY' | 'NONE';

interface Ch8State {
  risk: RiskMode;
  step: number;
  done: boolean;
}

const ch8State: Record<RiskMode, { label: string; color: string; blockedAt: number | null; verdict: string }> = {
  LOW: {
    label: 'LOW 轻量路径',
    color: GREEN,
    blockedAt: null,
    verdict: '守卫链全部通过 → 精确一次应用并记入日志。',
  },
  RISKY: {
    label: 'RISKY 更强审计',
    color: ORANGE,
    blockedAt: 3,
    verdict: '语义审计触发：检测到邻近主张可能被改变 → 阻断并升级处理。',
  },
  NONE: {
    label: '无守卫（对照）',
    color: RED,
    blockedAt: null,
    verdict: '无守卫：补丁直接落地，但产生不安全编辑（越界改写邻近主张）→ ESVR 恶化。',
  },
};

export const Ch8GuardChain: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Ch8State>({ risk: 'LOW', step: 0, done: false });
  const [risk, setRisk] = useState<RiskMode>('LOW');
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '选择补丁风险等级，点击"运行守卫链"逐步检查；对比三种配置的最终结果。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (s: Ch8State) => {
      const cfg = ch8State[s.risk];
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 风险模式徽标
      ctx.fillStyle = cfg.color;
      ctx.fillRect(40, 30, 220, 44);
      ctx.fillStyle = '#fff';
      ctx.font = '22px sans-serif';
      ctx.fillText(cfg.label, 62, 62);

      // 补丁
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      ctx.fillRect(40, 110, 180, 60);
      ctx.strokeRect(40, 110, 180, 60);
      ctx.fillStyle = TEXT;
      ctx.font = '20px sans-serif';
      ctx.fillText('补丁 Pᵢ', 82, 148);

      // 四道守卫关卡
      const gateX = 300;
      CH8_GUARDS.forEach((g, i) => {
        const x = gateX + i * 170;
        const reached = s.step > i;
        const blocked = s.risk !== 'NONE' && ch8State[s.risk].blockedAt === i && reached;
        const passed = reached && !blocked;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = blocked ? RED : passed ? GREEN : BORDER;
        ctx.lineWidth = blocked || passed ? 3 : 1.5;
        ctx.fillRect(x, 80, 140, 60);
        ctx.strokeRect(x, 80, 140, 60);
        ctx.fillStyle = TEXT;
        ctx.font = '18px sans-serif';
        ctx.fillText(g, x + 34, 100);
        ctx.fillStyle = blocked ? RED : passed ? GREEN : MUTED;
        ctx.font = '28px sans-serif';
        ctx.fillText(blocked ? '✗' : passed ? '✓' : '·', x + 60, 132);
      });

      // 结果
      if (s.done) {
        ctx.fillStyle = cfg.color;
        ctx.fillRect(980, 80, 90, 60);
        ctx.fillStyle = '#fff';
        ctx.font = '18px sans-serif';
        ctx.fillText(cfg.blockedAt !== null ? '阻断' : '应用', 995, 118);
      }

      // 流程线
      if (s.step > 0) {
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(222, 140);
        ctx.lineTo(298, 140);
        ctx.stroke();
      }
      for (let i = 0; i < s.step - 1; i++) {
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(gateX + i * 170 + 142, 110);
        ctx.lineTo(gateX + (i + 1) * 170, 110);
        ctx.stroke();
      }
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const setMode = (r: RiskMode) => {
    stateRef.current = { risk: r, step: 0, done: false };
    setRisk(r);
    setStep(0);
    setDone(false);
    setFeedback({ text: '选择补丁风险等级，点击"运行守卫链"逐步检查。', cls: '' });
  };

  const runGuard = () => {
    const cfg = ch8State[stateRef.current.risk];
    const blockedAt = cfg.blockedAt;
    if (blockedAt !== null) {
      stateRef.current = { ...stateRef.current, step: blockedAt + 1, done: true };
      setStep(blockedAt + 1);
      setDone(true);
      setFeedback({ text: `第 ${blockedAt + 1} 关（${CH8_GUARDS[blockedAt]}）拦截：${cfg.verdict}`, cls: 'bad' });
      return;
    }
    stateRef.current = { ...stateRef.current, step: 4, done: true };
    setStep(4);
    setDone(true);
    setFeedback({
      text: cfg.verdict,
      cls: stateRef.current.risk === 'NONE' ? 'bad' : 'good',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={`chip ${risk === 'LOW' ? 'selected' : ''}`} onClick={() => setMode('LOW')}>
          LOW
        </button>
        <button type="button" className={`chip ${risk === 'RISKY' ? 'selected' : ''}`} onClick={() => setMode('RISKY')}>
          RISKY
        </button>
        <button type="button" className={`chip ${risk === 'NONE' ? 'selected' : ''}`} onClick={() => setMode('NONE')}>
          无守卫
        </button>
        <button type="button" onClick={runGuard} disabled={done}>
          运行守卫链
        </button>
        <button type="button" onClick={() => setMode(risk)}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

/* ---------------- Ch9：轮次收敛模拟器（P2 步进） ---------------- */
const CH9_ROUNDS = [
  { r: 1, newIssues: 5, closed: 2 },
  { r: 2, newIssues: 2, closed: 4 },
  { r: 3, newIssues: 0, closed: 3 },
];

export const Ch9Convergence: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ round: 0 });
  const [round, setRound] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (s: { round: number }) => {
      const rr = s.round;
      const openCount = CH9_ROUNDS.slice(0, rr).reduce((a, x) => a + x.newIssues - x.closed, 0);
      const converged = rr > 0 && CH9_ROUNDS[rr - 1].newIssues === 0 && openCount <= 0;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 账本状态
      ctx.fillStyle = MUTED;
      ctx.font = '20px sans-serif';
      ctx.fillText('持久账本（累计开放问题）', 40, 44);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      ctx.fillRect(40, 60, 260, 120);
      ctx.strokeRect(40, 60, 260, 120);
      ctx.fillStyle = TEXT;
      ctx.font = '64px sans-serif';
      ctx.fillText(String(openCount), 120, 150);
      ctx.fillStyle = MUTED;
      ctx.font = '18px sans-serif';
      ctx.fillText('开放问题', 180, 110);

      // 每轮 U_r / C_r
      ctx.fillStyle = TEXT;
      ctx.font = '22px sans-serif';
      ctx.fillText('逐轮明细', 380, 44);
      for (let i = 0; i < 3; i++) {
        const x = 380 + i * 200;
        const active = i === rr - 1;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = active ? ORANGE : BORDER;
        ctx.lineWidth = active ? 3 : 1.5;
        ctx.fillRect(x, 60, 180, 110);
        ctx.strokeRect(x, 60, 180, 110);
        ctx.fillStyle = TEXT;
        ctx.font = '18px sans-serif';
        ctx.fillText(`第 ${CH9_ROUNDS[i].r} 轮`, x + 58, 88);
        ctx.fillStyle = BLUE;
        ctx.fillText(`新增 Uᵣ ${CH9_ROUNDS[i].newIssues}`, x + 30, 118);
        ctx.fillStyle = GREEN;
        ctx.fillText(`关闭 Cᵣ ${CH9_ROUNDS[i].closed}`, x + 30, 148);
      }

      // 停止谓词
      ctx.fillStyle = 'rgba(34,141,92,0.1)';
      ctx.fillRect(40, 205, 900, 56);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 205, 900, 56);
      ctx.fillStyle = GREEN;
      ctx.font = '22px sans-serif';
      if (converged) {
        ctx.fillText('τ(L, Uᵣ, Cᵣ, r) = true → 收敛停止（clean re-review 无新问题，账本清空）', 70, 242);
      } else if (rr === 0) {
        ctx.fillText('尚未开始：点击"进入下一轮"，观察 τ 如何基于账本查询判定收敛。', 70, 242);
      } else if (rr < 3) {
        ctx.fillStyle = BLUE;
        ctx.fillText(`τ = false：仍有 ${openCount} 个开放问题，进入第 ${rr + 1} 轮 clean re-review…`, 70, 242);
      } else {
        ctx.fillText('τ = true → 停止（三号轮收敛，从未触达五轮上限）', 70, 242);
      }
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const nextRound = () => {
    const nr = Math.min(3, stateRef.current.round + 1);
    stateRef.current.round = nr;
    setRound(nr);
  };
  const resetRounds = () => {
    stateRef.current.round = 0;
    setRound(0);
  };

  const converged = round > 0 && CH9_ROUNDS[round - 1].newIssues === 0;
  const openCount = CH9_ROUNDS.slice(0, round).reduce((a, x) => a + x.newIssues - x.closed, 0);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={nextRound} disabled={round >= 3 || (round > 0 && converged)}>
          进入下一轮
        </button>
        <button type="button" onClick={resetRounds}>
          重置
        </button>
      </div>
      <div className={`feedback ${converged && round > 0 ? 'good' : ''}`}>
        {round === 0
          ? '每轮 clean re-review 重读当前文本；停止由确定性谓词 τ 判定，不由模型自我评估。'
          : converged
          ? `第 ${round} 轮后无新问题、账本清空：τ=true，确定性停止。`
          : `第 ${round} 轮完成：Uᵣ=${CH9_ROUNDS[round - 1].newIssues}、Cᵣ=${CH9_ROUNDS[round - 1].closed}，开放问题 ${openCount} 个，τ=false。`}
      </div>
    </div>
  );
};
