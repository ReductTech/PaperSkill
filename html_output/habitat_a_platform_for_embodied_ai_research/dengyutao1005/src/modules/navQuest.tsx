import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

// ============================================================================
// 第一人称送货导航小游戏（新增交互方式，§6 PointGoal 设定）
//  - 确定性迷宫（DFS 生成，保证连通）；agent 圆柱体 0.2m，动作 turn±10° / move 0.25m / stop
//  - 四种传感器视角：Blind / RGB / Depth / RGBD（第一人称光线投射渲染）
//  - 上帝视角小地图：最短路线（l）、实际轨迹（p）、目标门；SPL = S·l / max(p,l)
//  - 自动走最短路线演示（对照 l 与 p），500 步上限
// ============================================================================

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 17;
const H = 15;
const TURN = (10 * Math.PI) / 180;
const MOVE = 0.25;
const MAX_STEPS = 500;

type Sensor = 'Blind' | 'RGB' | 'Depth' | 'RGBD';

interface GameState {
  x: number;
  y: number;
  ang: number;
  steps: number;
  wallHits: number;
  trail: { x: number; y: number }[];
  done: boolean;
  success: boolean | null;
  spl: number | null;
  auto: boolean;
}

function buildMaze() {
  const rnd = mulberry32(20261019);
  const wall: boolean[][] = Array.from({ length: H }, () => Array(W).fill(true));
  const stack: [number, number][] = [[1, 1]];
  wall[1][1] = false;
  const dirs: [number, number][] = [
    [2, 0],
    [-2, 0],
    [0, 2],
    [0, -2],
  ];
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    let moved = false;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx > 0 && nx < W - 1 && ny > 0 && ny < H - 1 && wall[ny][nx]) {
        wall[ny][nx] = false;
        wall[cy + dy / 2][cx + dx / 2] = false;
        stack.push([nx, ny]);
        moved = true;
        break;
      }
    }
    if (!moved) stack.pop();
  }
  // BFS：目标门选“距离约 45 格”的房间（太远会超出 500 步上限，太近没挑战）；
  // 同时记录每个格子的前驱，用于重建最短路径
  const open = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && !wall[y][x];
  const dist: number[][] = Array.from({ length: H }, () => Array(W).fill(-1));
  const prev: ([number, number] | null)[][] = Array.from({ length: H }, () => Array(W).fill(null));
  const q: [number, number][] = [[1, 1]];
  dist[1][1] = 0;
  let goal: [number, number] = [1, 1];
  let best = Infinity;
  while (q.length) {
    const [x, y] = q.shift()!;
    const score = Math.abs(dist[y][x] - 45);
    if (score < best) {
      best = score;
      goal = [x, y];
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (!open(nx, ny) || dist[ny][nx] >= 0) continue;
      dist[ny][nx] = dist[y][x] + 1;
      prev[ny][nx] = [x, y];
      q.push([nx, ny]);
    }
  }
  // 重建最短路径（含起点）
  const path: [number, number][] = [];
  let cur: [number, number] | null = goal;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur[1]][cur[0]];
  }
  return { wall, goal, path };
}

const MAZE = buildMaze();
const SHORTEST_ACTIONS = (MAZE.path.length - 1) * 4;

function isWall(px: number, py: number) {
  const x = Math.floor(px);
  const y = Math.floor(py);
  return x < 0 || y < 0 || x >= W || y >= H || MAZE.wall[y][x];
}

const SENSOR_INFO: Record<Sensor, { desc: string; tip: string }> = {
  Blind: { desc: '没有视觉，只有 GPS + 罗盘', tip: '屏幕全黑，靠罗盘找方向、撞墙摸路' },
  RGB: { desc: '彩色相机（256², 90° FOV）', tip: '看得到颜色纹理，但泛化最差' },
  Depth: { desc: '深度相机：只看距离', tip: '离得近的墙更亮——只关心“有没有路”' },
  RGBD: { desc: 'RGB + Depth 叠加', tip: '信息最全，但跨数据集会退化' },
};

const SENSOR_COLORS: Record<Sensor, string> = {
  Blind: '#6b7280',
  RGB: '#ea580c',
  Depth: '#16a34a',
  RGBD: '#dc2626',
};

export const NavQuest: React.FC<WidgetProps> = () => {
  const fovRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const [sensor, setSensor] = useState<Sensor>('Depth');
  const [tick, setTick] = useState(0);
  const [showPath, setShowPath] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const gameRef = useRef<GameState>({
    x: 1.5,
    y: 1.5,
    ang: 0,
    steps: 0,
    wallHits: 0,
    trail: [{ x: 1.5, y: 1.5 }],
    done: false,
    success: null,
    spl: null,
    auto: false,
  });
  const autoTimer = useRef<number | null>(null);

  const commit = () => setTick((t) => t + 1);

  const reset = () => {
    if (autoTimer.current) {
      window.clearInterval(autoTimer.current);
      autoTimer.current = null;
    }
    gameRef.current = {
      x: 1.5,
      y: 1.5,
      ang: 0,
      steps: 0,
      wallHits: 0,
      trail: [{ x: 1.5, y: 1.5 }],
      done: false,
      success: null,
      spl: null,
      auto: false,
    };
    setMsg(null);
    commit();
  };

  const stop = () => {
    const g = gameRef.current;
    if (g.done) return;
    g.done = true;
    const gx = MAZE.goal[0] + 0.5;
    const gy = MAZE.goal[1] + 0.5;
    const d = Math.hypot(g.x - gx, g.y - gy);
    if (d < 0.4) {
      g.success = true;
      g.spl = Math.min(1, SHORTEST_ACTIONS / Math.max(g.steps, SHORTEST_ACTIONS));
      setMsg(`成功！实际 ${g.steps} 步 vs 最短 ${SHORTEST_ACTIONS} 步 → SPL = ${g.spl.toFixed(3)}`);
    } else {
      g.success = false;
      g.spl = 0;
      setMsg(`没送到（距目标 ${d.toFixed(2)} m）→ SPL = 0。`);
    }
    commit();
  };

  const move = () => {
    const g = gameRef.current;
    if (g.done) return;
    const nx = g.x + Math.cos(g.ang) * MOVE;
    const ny = g.y + Math.sin(g.ang) * MOVE;
    if (isWall(nx, ny)) {
      g.wallHits += 1;
      setMsg('撞墙！被挡住了（真实碰撞，move 无效）');
    } else {
      g.x = nx;
      g.y = ny;
      g.trail.push({ x: nx, y: ny });
      setMsg(null);
    }
    g.steps += 1;
    if (g.steps >= MAX_STEPS) {
      g.done = true;
      g.success = false;
      g.spl = 0;
      setMsg('500 步上限：本轮失败。');
    }
    commit();
  };

  const turn = (dir: 1 | -1) => {
    const g = gameRef.current;
    if (g.done) return;
    g.ang += dir * TURN;
    g.steps += 1;
    setMsg(null);
    if (g.steps >= MAX_STEPS) {
      g.done = true;
      g.success = false;
      g.spl = 0;
      setMsg('500 步上限：本轮失败。');
    }
    commit();
  };

  const runAuto = () => {
    const g0 = gameRef.current;
    if (g0.done) return;
    reset();
    const g = gameRef.current;
    g.auto = true;
    setMsg('自动走最短路线演示中…');
    // 闭环控制器：每一步都朝向“下一个未到达的路点”重新定向，避免 10° 量化误差累积撞墙
    let wp = 1;
    autoTimer.current = window.setInterval(() => {
      const gg = gameRef.current;
      if (wp >= MAZE.path.length) {
        window.clearInterval(autoTimer.current!);
        autoTimer.current = null;
        stop();
        return;
      }
      const [tx, ty] = MAZE.path[wp];
      const cx = tx + 0.5;
      const cy = ty + 0.5;
      if (Math.hypot(gg.x - cx, gg.y - cy) < 0.3) {
        wp += 1;
        return;
      }
      const desired = Math.atan2(cy - gg.y, cx - gg.x);
      let diff = desired - gg.ang;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > TURN / 2) {
        gg.ang += (diff > 0 ? 1 : -1) * TURN;
        gg.steps += 1;
      } else {
        const nx = gg.x + Math.cos(gg.ang) * MOVE;
        const ny = gg.y + Math.sin(gg.ang) * MOVE;
        if (!isWall(nx, ny)) {
          gg.x = nx;
          gg.y = ny;
          gg.trail.push({ x: nx, y: ny });
        } else {
          gg.wallHits += 1;
        }
        gg.steps += 1;
      }
      if (gg.steps >= MAX_STEPS) {
        gg.done = true;
        gg.success = false;
        gg.spl = 0;
        wp = MAZE.path.length;
        window.clearInterval(autoTimer.current!);
        autoTimer.current = null;
        setMsg('500 步上限：自动演示中断。');
      }
      commit();
    }, 60);
  };

  // 渲染循环：第一人称 + 小地图
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const fov = fovRef.current;
      const map = mapRef.current;
      const g = gameRef.current;
      if (fov) {
        const ctx = fov.getContext('2d');
        if (ctx) {
          const fw = fov.width;
          const fh = fov.height;
          ctx.clearRect(0, 0, fw, fh);
          // 天花板 / 地板渐变
          const ceil = ctx.createLinearGradient(0, 0, 0, fh / 2);
          ceil.addColorStop(0, '#f3e9dc');
          ceil.addColorStop(1, '#e8d8c2');
          ctx.fillStyle = ceil;
          ctx.fillRect(0, 0, fw, fh / 2);
          const floor = ctx.createLinearGradient(0, fh / 2, 0, fh);
          floor.addColorStop(0, '#b7a48c');
          floor.addColorStop(1, '#8d7b66');
          ctx.fillStyle = floor;
          ctx.fillRect(0, fh / 2, fw, fh / 2);
          if (sensor !== 'Blind') {
            // 光线投射（DDA）
            const FOV = Math.PI / 3;
            const RAYS = 120;
            for (let r = 0; r < RAYS; r++) {
              const rayAng = g.ang - FOV / 2 + (r / RAYS) * FOV;
              const dirX = Math.cos(rayAng);
              const dirY = Math.sin(rayAng);
              let mapX = Math.floor(g.x);
              let mapY = Math.floor(g.y);
              const dDX = Math.abs(1 / (dirX || 1e-9));
              const dDY = Math.abs(1 / (dirY || 1e-9));
              let stepX: number;
              let stepY: number;
              let sideX: number;
              let sideY: number;
              if (dirX < 0) {
                stepX = -1;
                sideX = (g.x - mapX) * dDX;
              } else {
                stepX = 1;
                sideX = (mapX + 1 - g.x) * dDX;
              }
              if (dirY < 0) {
                stepY = -1;
                sideY = (g.y - mapY) * dDY;
              } else {
                stepY = 1;
                sideY = (mapY + 1 - g.y) * dDY;
              }
              let hit = false;
              let side = 0;
              let dist = 0;
              for (let k = 0; k < 64 && !hit; k++) {
                if (sideX < sideY) {
                  sideX += dDX;
                  mapX += stepX;
                  side = 0;
                } else {
                  sideY += dDY;
                  mapY += stepY;
                  side = 1;
                }
                if (mapX < 0 || mapY < 0 || mapX >= W || mapY >= H || MAZE.wall[mapY][mapX]) hit = true;
                else dist += side === 0 ? dDX : dDY;
              }
              dist = Math.max(dist, 0.02);
              // 垂距矫正（消除鱼眼）
              const perp = dist * Math.cos(rayAng - g.ang);
              const lineH = Math.min(fh, (fh * 1.2) / Math.max(perp, 0.02));
              const shade = Math.min(1, 1.4 / (1 + perp * 1.05));
              const x0 = (r / RAYS) * fw;
              const w1 = fw / RAYS + 0.5;
              const y0 = (fh - lineH) / 2;
              const cellHash = ((mapX * 73856093) ^ (mapY * 19349663)) % 1000 / 1000;
              let fill: string;
              if (sensor === 'Depth') {
                const v = Math.round(255 * shade);
                fill = `rgb(${v},${v},${v})`;
              } else {
                const r = Math.round((205 + cellHash * 50) * shade);
                const gr = Math.round((168 + cellHash * 40) * shade);
                const b = Math.round((120 + cellHash * 30) * shade);
                if (sensor === 'RGBD') {
                  const fog = Math.max(0.35, shade);
                  fill = `rgb(${Math.round(r * fog)},${Math.round(gr * fog)},${Math.round(b * fog)})`;
                } else {
                  fill = `rgb(${r},${gr},${b})`;
                }
              }
              // 砖缝（x 向条纹）
              ctx.fillStyle = fill;
              ctx.fillRect(x0, y0, w1, lineH);
              if (side === 1) {
                ctx.fillStyle = 'rgba(0,0,0,0.18)';
                ctx.fillRect(x0, y0, w1, lineH);
              }
            }
          } else {
            // Blind：全黑 + 微弱噪声点
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, fw, fh);
            for (let i = 0; i < 40; i++) {
              ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
              ctx.fillRect(Math.random() * fw, Math.random() * fh, 1.5, 1.5);
            }
          }
        }
      }
      if (map) {
        const ctx = map.getContext('2d');
        if (ctx) {
          const mw = map.width;
          const mh = map.height;
          ctx.clearRect(0, 0, mw, mh);
          const cell = mw / W;
          ctx.fillStyle = '#f6f1e9';
          ctx.fillRect(0, 0, mw, mh);
          for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
              if (MAZE.wall[y][x]) {
                ctx.fillStyle = '#9aa5b1';
                ctx.fillRect(x * cell, y * cell, cell, cell);
              }
            }
          }
          // 最短路线（虚线）
          if (showPath) {
            ctx.strokeStyle = 'rgba(37,99,235,0.55)';
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            MAZE.path.forEach(([px, py], i) => {
              const cx = (px + 0.5) * cell;
              const cy = (py + 0.5) * cell;
              if (i === 0) ctx.moveTo(cx, cy);
              else ctx.lineTo(cx, cy);
            });
            ctx.stroke();
            ctx.setLineDash([]);
          }
          // 实际轨迹
          ctx.strokeStyle = 'rgba(220,38,38,0.7)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          g.trail.forEach((p, i) => {
            const cx = p.x * cell;
            const cy = p.y * cell;
            if (i === 0) ctx.moveTo(cx, cy);
            else ctx.lineTo(cx, cy);
          });
          ctx.stroke();
          // 目标门
          const gx = (MAZE.goal[0] + 0.5) * cell;
          const gy = (MAZE.goal[1] + 0.5) * cell;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(gx, gy, cell * 0.38, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#c2410c';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // agent 三角
          ctx.save();
          ctx.translate(g.x * cell, g.y * cell);
          ctx.rotate(g.ang);
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.moveTo(cell * 0.55, 0);
          ctx.lineTo(-cell * 0.3, -cell * 0.32);
          ctx.lineTo(-cell * 0.3, cell * 0.32);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
      raf = window.requestAnimationFrame(draw);
    };
    raf = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(raf);
  }, [sensor, showPath]);

  useEffect(() => {
    return () => {
      if (autoTimer.current) window.clearInterval(autoTimer.current);
    };
  }, []);

  const g = gameRef.current;

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 'd', 's', 'W', 'A', 'D', 'S'].includes(k)) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (k === 'ArrowUp' || k === 'w' || k === 'W') move();
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') turn(-1);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') turn(1);
    else if (k === ' ' || k === 's' || k === 'S' || k === 'Enter') stop();
  };

  return (
    <div className="nav-quest" tabIndex={0} onKeyDown={onKey}>
      <div className="nq-sensors">
        {(Object.keys(SENSOR_INFO) as Sensor[]).map((s) => (
          <button
            key={s}
            className={`tgl ${sensor === s ? 'active' : ''}`}
            style={sensor === s ? { background: SENSOR_COLORS[s], borderColor: SENSOR_COLORS[s] } : undefined}
            onClick={() => setSensor(s)}
          >
            {s}
          </button>
        ))}
        <span className="nq-sensor-desc">{SENSOR_INFO[sensor].desc}</span>
      </div>
      <div className="nq-stage">
        <div className="nq-fov">
          <canvas ref={fovRef} width={360} height={225} className="nq-canvas" />
          {sensor === 'Blind' ? (
            <div className="nq-compass">
              罗盘（GPS 方向）：
              <span
                className="nq-compass-needle"
                style={{
                  transform: `rotate(${Math.atan2(MAZE.goal[1] + 0.5 - g.y, MAZE.goal[0] + 0.5 - g.x) - g.ang}rad)`,
                }}
              >
                ➤
              </span>
            </div>
          ) : null}
          <div className="nq-tag">第一人称 · {sensor}（{SENSOR_INFO[sensor].tip}）</div>
        </div>
        <div className="nq-map">
          <canvas ref={mapRef} width={204} height={180} className="nq-canvas" />
          <div className="nq-tag">上帝视角小地图 · 蓝=你 橙=目标门 蓝虚线=最短路线 红=轨迹</div>
        </div>
      </div>
      <div className="nq-controls">
        <button className="nq-btn" onClick={() => turn(-1)} title="← / A">◀ 左转</button>
        <button className="nq-btn nq-btn-main" onClick={move} title="↑ / W">▲ 前进</button>
        <button className="nq-btn" onClick={() => turn(1)} title="→ / D">右转 ▶</button>
        <button className="nq-btn nq-btn-stop" onClick={stop} title="空格 / S">■ 停（到达判定）</button>
        <button className="nq-btn" onClick={runAuto} disabled={g.done && g.success === null}>⚡ 自动走最短路线</button>
        <button className="nq-btn" onClick={reset}>↺ 重玩</button>
      </div>
      <div className="nq-hud">
        <span>步数 {g.steps} / {MAX_STEPS}</span>
        <span>撞墙 {g.wallHits} 次</span>
        <span>最短路线 {SHORTEST_ACTIONS} 步（l）</span>
        <label className="nq-check">
          <input type="checkbox" checked={showPath} onChange={(e) => setShowPath(e.target.checked)} />
          显示最短路线
        </label>
      </div>
      {g.done ? (
        <div className={`feedback ${g.success ? 'good' : 'bad'}`}>
          结果：{g.success ? `成功送达 · SPL = S·l/max(p,l) = ${g.spl!.toFixed(3)}` : '失败（未送达或步数超限）→ SPL = 0'}
        </div>
      ) : msg ? (
        <div className="feedback">{msg}</div>
      ) : null}
      <div className="feedback good" style={{ marginTop: 4 }}>
        怎么玩：↑/W 前进、←→/AD 转向、空格停。每个动作记 1 步（论文动作空间：turn±10°、move 0.25m、stop）。先开 Depth 试手感，再换 Blind/RGB/RGBD 感受传感器差异；对照“最短路线”理解 SPL 为什么同时惩罚没送到和绕路。
      </div>
    </div>
  );
};

export default NavQuest;
