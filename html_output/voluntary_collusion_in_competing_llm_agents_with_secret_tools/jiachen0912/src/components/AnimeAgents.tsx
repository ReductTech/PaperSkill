import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 角色小剧场（5 幕）：用动漫形象 + 内心独白，帮读者建立「自愿合谋」的直觉。
// 四位角色对应论文里命名的 7B 模型：Lily / Luke / Mike / Quinn。

const W = 1080;
const H = 420;
const SKIN = '#ffe3c2';
const INK = '#4a3a30';

const AGENTS = [
  { name: 'Lily', model: 'LLaMA-3.1', hair: '#f0718f', shirt: '#f8d3dc', x: W * 0.18 },
  { name: 'Luke', model: 'LLaMA-3', hair: '#4f7fb5', shirt: '#cfe0f2', x: W * 0.38 },
  { name: 'Mike', model: 'Mistral', hair: '#4fae6a', shirt: '#d2e8d7', x: W * 0.62 },
  { name: 'Quinn', model: 'Qwen2.5', hair: '#e8a33d', shirt: '#f7e3c4', x: W * 0.82 },
];

type Face = 'neutral' | 'sly' | 'suspicious' | 'surprised' | 'happy' | 'angry';
type Scenario = 'deceive' | 'challenge' | 'collude' | 'profit' | 'choice';
type Choice = 'none' | 'accept' | 'refuse';

function drawFace(ctx: CanvasRenderingContext2D, x: number, y: number, face: Face) {
  const eyeY = y - 5;
  const dx = 12;
  const r = 5;
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';

  if (face === 'happy') {
    ctx.beginPath(); ctx.arc(x - dx, eyeY, r, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + dx, eyeY, r, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + 6, 7, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
  } else if (face === 'sly') {
    ctx.beginPath(); ctx.arc(x - dx, eyeY, r, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + dx, eyeY, r * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 4, y + 7, 6, 0.15 * Math.PI, 0.95 * Math.PI); ctx.stroke();
  } else if (face === 'suspicious') {
    ctx.beginPath(); ctx.moveTo(x - dx - 4, eyeY); ctx.lineTo(x - dx + 4, eyeY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + dx - 4, eyeY); ctx.lineTo(x + dx + 4, eyeY); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + 10, 6, 1.1 * Math.PI, 1.9 * Math.PI); ctx.stroke();
  } else if (face === 'surprised') {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - dx, eyeY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + dx, eyeY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(x - dx, eyeY, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + dx, eyeY, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y + 7, 3.4, 0, Math.PI * 2); ctx.stroke();
  } else if (face === 'angry') {
    ctx.beginPath(); ctx.moveTo(x - dx - 6, eyeY - 6); ctx.lineTo(x - dx + 5, eyeY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + dx + 6, eyeY - 6); ctx.lineTo(x + dx - 5, eyeY); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - dx, eyeY + 2, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + dx, eyeY + 2, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + 8, 5, 6, 0, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(x - dx, eyeY, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + dx, eyeY, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 4, y + 7); ctx.lineTo(x + 4, y + 7); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(240, 126, 113, 0.5)';
  ctx.beginPath(); ctx.arc(x - dx - 7, y + 3, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + dx + 7, y + 3, 4, 0, Math.PI * 2); ctx.fill();
}

function drawAgent(ctx: CanvasRenderingContext2D, agent: typeof AGENTS[number], cy: number, face: Face, lean: number) {
  const cx = agent.x + lean;
  ctx.fillStyle = agent.shirt;
  ctx.beginPath();
  ctx.roundRect(cx - 26, cy + 30, 52, 44, 10);
  ctx.fill();
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(cx, cy, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = agent.hair;
  ctx.beginPath();
  ctx.arc(cx, cy - 4, 37, Math.PI, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - 18, cy - 14, 12, Math.PI, 1.6 * Math.PI);
  ctx.arc(cx, cy - 20, 14, 0, Math.PI);
  ctx.arc(cx + 18, cy - 14, 12, 0.4 * Math.PI, Math.PI);
  ctx.fill();
  drawFace(ctx, cx, cy - 2, face);
  const nameY = cy + 96;
  ctx.fillStyle = agent.hair;
  ctx.beginPath();
  ctx.roundRect(cx - 52, nameY - 14, 104, 28, 14);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(agent.name, cx, nameY + 5);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillText(agent.model, cx, nameY + 24);
  ctx.textAlign = 'left';
}

// 内心独白气泡：把角色的「想法」直接画出来（建立直觉的关键）
function thought(ctx: CanvasRenderingContext2D, x: number, topY: number, text: string, border = '#27446e') {
  ctx.font = 'bold 15px "Segoe UI", sans-serif';
  const w = ctx.measureText(text).width + 30;
  const h = 34;
  const bx = Math.max(8, Math.min(x - w / 2, W - w - 8));
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bx, topY, w, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x - 6, topY + h - 2);
  ctx.lineTo(x, topY + h + 10);
  ctx.lineTo(x + 6, topY + h - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, topY + h / 2 + 6);
  ctx.textAlign = 'left';
}

function bubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, size = 18) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 20, y - 18, 40, 36, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y + 6);
  ctx.textAlign = 'left';
}

export function AnimeAgents() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scenario, setScenario] = useState<Scenario>('deceive');
  const [choice, setChoice] = useState<Choice>('none');
  const stateRef = useRef({ scenario: 'deceive' as Scenario, choice: 'none' as Choice });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { scenario: Scenario; choice: Choice }, time: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      const bob = Math.sin(time / 500) * 3;
      const cy = H * 0.44;
      const TOP = 72; // thought-bubble top line

      const titles: Record<Scenario, string> = {
        deceive: '第一幕 · 欺骗：虚张声势',
        challenge: '第二幕 · 揭穿：当场拆穿',
        collude: '第三幕 · 合作：秘密结盟',
        profit: '第四幕 · 得利：合谋得逞',
        choice: '第五幕 · 选择：接受还是拒绝？',
      };
      ctx.fillStyle = INK;
      ctx.font = 'bold 28px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(titles[s.scenario], W / 2, 46);
      ctx.textAlign = 'left';

      if (s.scenario === 'deceive') {
        drawAgent(ctx, AGENTS[0], cy, 'suspicious', 0);
        drawAgent(ctx, AGENTS[1], cy, 'neutral', 0);
        drawAgent(ctx, AGENTS[2], cy, 'sly', 0);
        drawAgent(ctx, AGENTS[3], cy, 'neutral', 0);
        const mc = AGENTS[2].x;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#b8c9a7';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(mc - 16, cy + 14, 32, 44, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#c43f52';
        ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', mc, cy + 44);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#7cb8e8';
        ctx.beginPath();
        ctx.arc(mc + 32, cy - 30 + Math.sin(time / 300) * 3, 5, 0, Math.PI * 2);
        ctx.fill();
        thought(ctx, mc, TOP, '我知道这不是目标牌…但能赢', '#c43f52');
        bubble(ctx, AGENTS[0].x + 42, cy - 40, '!', '#f8b26a');
      } else if (s.scenario === 'challenge') {
        drawAgent(ctx, AGENTS[0], cy, 'angry', 0);
        drawAgent(ctx, AGENTS[1], cy, 'neutral', 0);
        drawAgent(ctx, AGENTS[2], cy, 'surprised', 0);
        drawAgent(ctx, AGENTS[3], cy, 'neutral', 0);
        const mc = AGENTS[2].x;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(mc - 16, cy + 14, 32, 44, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#c43f52';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('非目标', mc, cy + 40);
        ctx.textAlign = 'left';
        thought(ctx, AGENTS[0].x, TOP, '你在撒谎，我要拆穿你！', '#c43f52');
        bubble(ctx, mc - 42, cy - 40, '啊', '#f8b26a');
      } else if (s.scenario === 'collude') {
        const lean = 26;
        drawAgent(ctx, AGENTS[0], cy, 'surprised', 0);
        drawAgent(ctx, AGENTS[1], cy, 'happy', lean);
        drawAgent(ctx, AGENTS[2], cy, 'happy', -lean);
        drawAgent(ctx, AGENTS[3], cy, 'surprised', 0);
        const mid = (AGENTS[1].x + AGENTS[2].x) / 2;
        const nx = mid + Math.sin(time / 700) * 10;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(nx - 20, cy - 8, 40, 26, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#27446e';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('密信', nx, cy + 9);
        ctx.textAlign = 'left';
        thought(ctx, mid, TOP, '这不公平…但对我们有利', '#27446e');
        bubble(ctx, AGENTS[0].x + 42, cy - 40, '?', '#d7deea');
        bubble(ctx, AGENTS[3].x - 42, cy - 40, '?', '#d7deea');
      } else if (s.scenario === 'profit') {
        drawAgent(ctx, AGENTS[0], cy, 'suspicious', 0);
        drawAgent(ctx, AGENTS[1], cy, 'happy', 0);
        drawAgent(ctx, AGENTS[2], cy, 'happy', 0);
        drawAgent(ctx, AGENTS[3], cy, 'suspicious', 0);
        const up = Math.sin(time / 400) * 4;
        ctx.font = 'bold 26px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#228d5c';
        ctx.fillText('↑', AGENTS[1].x + 40, cy - 46 + up);
        ctx.fillText('↑', AGENTS[2].x - 40, cy - 46 + up);
        ctx.fillStyle = '#c43f52';
        ctx.fillText('↓', AGENTS[0].x + 40, cy - 46 - up);
        ctx.fillText('↓', AGENTS[3].x - 40, cy - 46 - up);
        ctx.textAlign = 'left';
        thought(ctx, AGENTS[1].x + 40, TOP, '果然，联手更赚', '#228d5c');
        thought(ctx, AGENTS[0].x, TOP, '我们被坑了…', '#c43f52');
      } else {
        // choice act
        if (s.choice === 'accept') {
          const lean = 26;
          drawAgent(ctx, AGENTS[0], cy, 'surprised', 0);
          drawAgent(ctx, AGENTS[1], cy, 'happy', lean);
          drawAgent(ctx, AGENTS[2], cy, 'sly', -lean);
          drawAgent(ctx, AGENTS[3], cy, 'surprised', 0);
          const mid = (AGENTS[1].x + AGENTS[2].x) / 2;
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#228d5c';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.roundRect(mid - 20, cy - 8, 40, 26, 5); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#228d5c';
          ctx.font = 'bold 16px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('结盟', mid, cy + 9);
          ctx.textAlign = 'left';
          thought(ctx, AGENTS[2].x, TOP, '我接受——能赢就行', '#228d5c');
          ctx.font = 'bold 26px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#228d5c';
          ctx.fillText('↑', AGENTS[1].x + 40, cy - 46);
          ctx.fillText('↑', AGENTS[2].x - 40, cy - 46);
          ctx.fillStyle = '#c43f52';
          ctx.fillText('↓', AGENTS[0].x + 40, cy - 46);
          ctx.fillText('↓', AGENTS[3].x - 40, cy - 46);
          ctx.textAlign = 'left';
        } else if (s.choice === 'refuse') {
          drawAgent(ctx, AGENTS[0], cy, 'neutral', 0);
          drawAgent(ctx, AGENTS[1], cy, 'neutral', 0);
          drawAgent(ctx, AGENTS[2], cy, 'happy', 0);
          drawAgent(ctx, AGENTS[3], cy, 'neutral', 0);
          thought(ctx, AGENTS[2].x, TOP, '这不公平，我拒绝', '#27446e');
          ctx.fillStyle = INK;
          ctx.font = 'bold 18px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('公平竞争 · 无人得利', W / 2, cy - 60);
          ctx.textAlign = 'left';
        } else {
          drawAgent(ctx, AGENTS[0], cy, 'neutral', 0);
          drawAgent(ctx, AGENTS[1], cy, 'neutral', 0);
          drawAgent(ctx, AGENTS[2], cy, 'suspicious', 0);
          drawAgent(ctx, AGENTS[3], cy, 'neutral', 0);
          thought(ctx, AGENTS[2].x, TOP, '接受？拒绝？', '#f07e47');
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#f07e47';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.roundRect(AGENTS[2].x - 24, cy + 12, 48, 48, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#f07e47';
          ctx.font = 'bold 15px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('秘密', AGENTS[2].x, cy + 30);
          ctx.fillText('工具', AGENTS[2].x, cy + 48);
          ctx.textAlign = 'left';
        }
      }
    };
    let rafId = 0;
    const tick = () => {
      render(stateRef.current, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (sc: Scenario) => {
    stateRef.current.scenario = sc;
    setScenario(sc);
    if (sc === 'choice') {
      stateRef.current.choice = 'none';
      setChoice('none');
    }
  };

  const choose = (c: Choice) => {
    stateRef.current.choice = c;
    setChoice(c);
  };

  const feedback: Record<Scenario, string> = {
    deceive: '欺骗：Mike 心里清楚这不是目标牌，却为了赢面不改色地报牌——「明知不对，仍要行动」。',
    challenge: '揭穿：Lily 起疑挑战，翻开果然是「非目标」——虚张声势被当场拆穿。',
    collude: '合作：Mike 与 Luke 明知这不公平，却因「对我们有利」而私下结盟、传递密信。',
    profit: '得利：合谋让 Mike 与 Luke 的得分上升，Lily 与 Quinn 的得分下降——赢家通吃。',
    choice:
      choice === 'accept'
        ? '你选了「接受」——合谋成立，你和 Luke 得利，Lily 与 Quinn 受损。论文发现：多数模型会这样选。'
        : choice === 'refuse'
        ? '你选了「拒绝」——公平竞争，无人得利。论文发现：只有 Claude、Qwen 等少数模型会这样选。'
        : '面对这个明知道不公平、却能带来优势的秘密工具，你会怎么选？点下面的按钮。',
  };

  return (
    <section className="anime-agents">
      <h2 className="anime-title">角色小剧场 · 动漫演示</h2>
      <p className="anime-sub">
        五幕小剧场：四位智能体如何<b>欺骗</b>、<b>揭穿</b>、<b>结盟</b>、<b>得逞</b>，最后一幕
        <b>由你来选</b>。留意每个角色头顶的<b>内心独白</b>——这就是「认账之后仍然行动」。
      </p>
      <canvas id="cv-anime-agents" ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${scenario === 'deceive' ? 'selected' : ''}`} onClick={() => select('deceive')}>① 欺骗</button>
        <button className={`chip ${scenario === 'challenge' ? 'selected' : ''}`} onClick={() => select('challenge')}>② 揭穿</button>
        <button className={`chip ${scenario === 'collude' ? 'selected' : ''}`} onClick={() => select('collude')}>③ 结盟</button>
        <button className={`chip ${scenario === 'profit' ? 'selected' : ''}`} onClick={() => select('profit')}>④ 得利</button>
        <button className={`chip ${scenario === 'choice' ? 'selected' : ''}`} onClick={() => select('choice')}>⑤ 选择</button>
      </div>
      {scenario === 'choice' ? (
        <div className="chip-row">
          <button className="chip" onClick={() => choose('accept')}>✅ 接受秘密工具</button>
          <button className="chip" onClick={() => choose('refuse')}>🚫 拒绝</button>
        </div>
      ) : null}
      <div className={`feedback ${scenario === 'profit' || (scenario === 'choice' && choice !== 'none') ? 'good' : ''}`}>{feedback[scenario]}</div>
    </section>
  );
}
