import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §4 Module 4.1 (P6 drag, hybrid): drag hinge origin + axis on the door, watch the 8-dim vector.
// 摆动模型：门板绕 O 摆心转动（拖 O 可见摆心迁移、摆弧重定心）；
// A 轴偏转超 ±20° 判定物理不合法：门板刮擦柜体——干涉区红光、刮擦星芒、
// 违法轨迹段标红、门板带颤抖。
const W = 1080;
const H = 280;

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // ox,oy in [0,1] across door face; axisDeg in [-30,30]
  const stateRef = useRef({ ox: 0.5, oy: 0.5, axisDeg: 0 });
  const dragRef = useRef<'origin' | 'axis' | null>(null);
  const rafRef = useRef<number | null>(null);
  const [vec, setVec] = useState({ ox: 0.5, oy: 0.5, axisDeg: 0 });
  const [feedback, setFeedback] = useState({ text: '拖动橙色原点或蓝色轴箭头——门板绕 O 摆动，绿色虚线轨迹会跟着变。', cls: '' });

  // door face rect in canvas coords
  const DX = 110;
  const DY = 46;
  const DW = 350;
  const DH = 190;
  const LIFT = 18;
  const TILT = -0.1; // 开门时门板绕 O 的附加倾角（rad），随开角缩放
  // hinge origin sits exactly ON the door's left edge and slides along it
  const originXY = (s: { ox: number; oy: number }) => [DX, DY + s.oy * DH] as const;
  // axis = hinge PIN through the origin; unit vector origin→tip.
  // axisDeg 0 = straight up along the edge; positive tilts toward -x.
  const axisDir = (s: { axisDeg: number }) => {
    const rad = (s.axisDeg * Math.PI) / 180;
    return [-Math.sin(rad), -Math.cos(rad)] as const;
  };
  const axisTipXY = (s: { ox: number; oy: number; axisDeg: number }) => {
    const [ox, oy] = originXY(s);
    const [ux, uy] = axisDir(s);
    return [ox + ux * 78, oy + uy * 78] as const;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (time: number) => {
      const s = stateRef.current;
      const [ox, oy] = originXY(s);
      const [ux, uy] = axisDir(s);
      const badK = clamp((Math.abs(s.axisDeg) - 20) / 10, 0, 1); // 0=合法 1=严重违法
      const shear = Math.sin((s.axisDeg * Math.PI) / 180) * DW * 0.15;

      // ── 统一的角点变换：闭合一角的局部坐标 (lx, ry) → 摆动角 a 后的画布坐标 ──
      // lx∈[0,DW] 沿门宽（0=铰链缘），ry 为相对摆心 O 的纵向偏移。
      // 自由缘收缩 cos a、抬升 LIFT·sin a、轴偏剪切 shear·sin a（上下角异号），
      // 最后整板绕 O 附加倾角 θ(a)。
      const corner = (lx: number, ry: number, a: number, jitter = 0) => {
        const sa = Math.sin(a);
        const sx = lx * Math.cos(a);
        const liftT = -LIFT * sa * (lx / DW);
        const shearT = shear * sa * (lx / DW) * (ry >= 0 ? 1 : -1);
        const sy = ry + liftT + shearT;
        const th = TILT * sa + jitter;
        return [
          ox + sx * Math.cos(th) - sy * Math.sin(th),
          oy + sx * Math.sin(th) + sy * Math.cos(th),
        ] as const;
      };

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 248, W, 6);
      // cabinet frame; dark interior (depth gradient) revealed as door opens
      ctx.fillStyle = '#7a3509';
      ctx.fillRect(DX - 14, DY - 12, DW + 28, DH + 24);
      const ig = ctx.createLinearGradient(DX, DY, DX, DY + DH);
      ig.addColorStop(0, '#38200e');
      ig.addColorStop(1, '#57351a');
      ctx.fillStyle = ig;
      ctx.fillRect(DX, DY, DW, DH);

      // door swing loop: 0°→90°→0°, sine drive so it never lurches
      const phi = (Math.sin(time / 900) * 0.5 + 0.5) * (Math.PI / 2);
      const sinP = Math.sin(phi);
      // 违法时门板刮擦颤抖（只加在活门板上，轨迹/残影保持干净）
      const jitter = badK * Math.sin(time / 40) * 0.028 * sinP;

      // ── 刮擦预警：干涉梃区域红光脉冲 + 星芒 + 文字 ──
      const frameTop = DY - 12;
      const frameBot = DY + DH + 12;
      if (badK > 0) {
        const topSide = shear > 0; // 轴正偏 → 上角抬起刮上梃；负偏刮下梃
        const jy = topSide ? frameTop : frameBot - 12;
        const pulse = (0.16 + 0.12 * Math.sin(time / 110)) * badK;
        ctx.fillStyle = `rgba(196,63,82,${pulse})`;
        ctx.fillRect(DX - 14, jy, DW * 0.62, 12);
        // 找轨迹与梃线的交点放星芒
        const probe = (a: number) =>
          corner(DW, topSide ? DY - oy : DY + DH - oy, a)[1];
        let hitA = -1;
        for (let d = 2; d <= 90; d += 2) {
          const a = (d * Math.PI) / 180;
          const y = probe(a);
          if (topSide ? y < frameTop : y > frameBot) {
            hitA = a;
            break;
          }
        }
        if (hitA > 0) {
          const [mx, my] = corner(DW, topSide ? DY - oy : DY + DH - oy, hitA);
          const cy2 = clamp(my, frameTop - 2, frameBot + 2);
          // 星芒（缓慢旋转）
          ctx.strokeStyle = `rgba(196,63,82,${0.85 * badK})`;
          ctx.lineWidth = 2.5;
          for (let i = 0; i < 8; i++) {
            const ang = time / 350 + (i * Math.PI) / 4;
            ctx.beginPath();
            ctx.moveTo(mx + Math.cos(ang) * 5, cy2 + Math.sin(ang) * 5);
            ctx.lineTo(mx + Math.cos(ang) * 13, cy2 + Math.sin(ang) * 13);
            ctx.stroke();
          }
          ctx.fillStyle = `rgba(196,63,82,${0.75 + 0.25 * Math.sin(time / 130)})`;
          ctx.font = 'bold 13px "Segoe UI", sans-serif';
          ctx.fillText('⚠ 刮到柜体', mx + 18, topSide ? cy2 + 4 : cy2 + 4);
        }
      }

      // cast shadow of the swinging panel on the interior back wall
      if (sinP > 0.03) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(DX, DY, DW, DH);
        ctx.clip();
        ctx.fillStyle = `rgba(0,0,0,${0.3 * sinP})`;
        ctx.beginPath();
        const sc = [
          corner(0, DY - oy, phi, jitter),
          corner(DW, DY - oy, phi, jitter),
          corner(DW, DY + DH - oy, phi, jitter),
          corner(0, DY + DH - oy, phi, jitter),
        ];
        ctx.moveTo(sc[0][0] + 12, sc[0][1] + 9);
        for (let i = 1; i < 4; i++) ctx.lineTo(sc[i][0] + 12, sc[i][1] + 9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // ghost outlines: the door panel sampled along its opening path
      ctx.strokeStyle = badK > 0 ? `rgba(196,63,82,${0.2 + 0.2 * badK})` : 'rgba(34,141,92,0.35)';
      ctx.lineWidth = 1.5;
      for (const gdeg of [25, 50, 75]) {
        const g = (gdeg * Math.PI) / 180;
        ctx.beginPath();
        const gc = [
          corner(0, DY - oy, g),
          corner(DW, DY - oy, g),
          corner(DW, DY + DH - oy, g),
          corner(0, DY + DH - oy, g),
        ];
        ctx.moveTo(gc[0][0], gc[0][1]);
        for (let i = 1; i < 4; i++) ctx.lineTo(gc[i][0], gc[i][1]);
        ctx.closePath();
        ctx.stroke();
      }
      // opening trajectory (green dashes): path of the free-edge top corner,
      // recomputed live — dragging A tilts it, dragging O re-centers it;
      // 违法时越出柜体的段改画红色实线
      const trajPt = (a: number) => corner(DW, DY - oy, a);
      ctx.lineWidth = 2;
      let illegalRun: [number, number][] = [];
      ctx.strokeStyle = '#228d5c';
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * (Math.PI / 2);
        const [px, py] = trajPt(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
        if (badK > 0 && (py < frameTop || py > frameBot)) illegalRun.push([px, py]);
        else if (illegalRun.length) {
          illegalRun.push([px, py]);
          ctx.setLineDash([]);
          ctx.save();
          ctx.strokeStyle = 'rgba(196,63,82,0.9)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          illegalRun.forEach(([qx, qy], qi) => (qi ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy)));
          ctx.stroke();
          ctx.restore();
          ctx.setLineDash([6, 5]);
          illegalRun = [];
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (illegalRun.length) {
        ctx.save();
        ctx.strokeStyle = 'rgba(196,63,82,0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        illegalRun.forEach(([qx, qy], qi) => (qi ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy)));
        ctx.stroke();
        ctx.restore();
      }
      // O 摆心参考弧：过摆心高度的两条摆弧，拖 O 时随之重定心
      ctx.strokeStyle = 'rgba(240,126,71,0.3)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 5]);
      for (const r of [DW * 0.45, DW * 0.75]) {
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
          const a = (i / 20) * (Math.PI / 2);
          const [px, py] = corner(r, 0, a);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // trajectory end labels: 0° closed → 90° fully open
      const [e0x, e0y] = trajPt(0);
      const [e9x, e9y] = trajPt(Math.PI / 2);
      ctx.fillStyle = '#228d5c';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('0°', e0x + 6, e0y + 4);
      ctx.fillText('90°', e9x - 26, e9y - 4);

      // live door panel swinging around the O pivot (hinge edge on the jamb)
      ctx.beginPath();
      const dc = [
        corner(0, DY - oy, phi, jitter),
        corner(DW, DY - oy, phi, jitter),
        corner(DW, DY + DH - oy, phi, jitter),
        corner(0, DY + DH - oy, phi, jitter),
      ];
      ctx.moveTo(dc[0][0], dc[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(dc[i][0], dc[i][1]);
      ctx.closePath();
      ctx.fillStyle = badK > 0 ? '#8a3a10' : '#92400e';
      ctx.fill();
      ctx.strokeStyle = badK > 0 ? `rgba(196,63,82,${0.4 + 0.3 * badK})` : 'rgba(0,0,0,0.15)';
      ctx.lineWidth = badK > 0 ? 2.5 : 1.5;
      ctx.stroke();
      // 当前正在干涉的角点闪红光
      if (badK > 0) {
        const topSide = shear > 0;
        const [ccx, ccy] = dc[topSide ? 1 : 2];
        if (topSide ? ccy < frameTop : ccy > frameBot) {
          ctx.fillStyle = `rgba(196,63,82,${0.5 + 0.4 * Math.sin(time / 90)})`;
          ctx.beginPath();
          ctx.arc(ccx, clamp(ccy, frameTop, frameBot), 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // knob rides the free edge midpoint (shear cancels out there)
      const [knx, kny] = corner(DW, DH / 2 - (oy - DY), phi, jitter);
      ctx.fillStyle = '#d7deea';
      ctx.beginPath();
      ctx.arc(knx - 10, kny, 5, 0, Math.PI * 2);
      ctx.fill();
      // axis pin A: line through the origin along the edge, tilted by axisDeg;
      // tail below the origin + draggable tip above — reads as a hinge pin
      const bad = badK > 0;
      const pinColor = bad ? '#c43f52' : '#27446e';
      const [tx, ty] = axisTipXY(s);
      ctx.strokeStyle = pinColor;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ox - ux * 38, oy - uy * 38);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.lineCap = 'butt';
      // hinge origin O (orange, draggable) on the door's left edge
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(ox, oy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      // draggable axis tip handle
      ctx.fillStyle = pinColor;
      ctx.beginPath();
      ctx.arc(tx, ty, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      // tiny O / A / L annotations tied to the readout groups
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#f07e47';
      ctx.fillText('O', ox - 24, oy + 4);
      ctx.fillStyle = pinColor;
      ctx.fillText('A', tx - 18, ty - 4);
      ctx.fillStyle = '#228d5c';
      ctx.fillText('L', e9x + 40, e9y - 4);

      // right: the 8-dim vector grouped by role — O (3) / A (3) / L (2) —
      // with plain-language headers so each number's meaning is obvious
      const groups: { title: string; color: string; items: [string, string][] }[] = [
        {
          title: 'O · 原点：铰链中心在门上的位置',
          color: '#f07e47',
          items: [
            ['O.x', (s.ox - 0.5).toFixed(2)],
            ['O.y', (s.oy - 0.5).toFixed(2)],
            ['O.z', '0.00'],
          ],
        },
        {
          title: 'A · 轴向：门绕哪根线转',
          color: pinColor,
          items: [
            ['A.x', Math.sin((s.axisDeg * Math.PI) / 180).toFixed(2)],
            ['A.y', (-Math.cos((s.axisDeg * Math.PI) / 180)).toFixed(2)],
            ['A.z', '0.00'],
          ],
        },
        {
          title: 'L · 范围：最小 ~ 最大开门角度',
          color: '#228d5c',
          items: [
            ['L.0', '0°'],
            ['L.1', '90°'],
          ],
        },
      ];
      groups.forEach((g, gi) => {
        const gy = 40 + gi * 58;
        ctx.fillStyle = g.color;
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillText(g.title, 560, gy);
        g.items.forEach(([name, v], j) => {
          const bx = 560 + j * 130;
          ctx.fillStyle = '#68778f';
          ctx.font = '13px "Segoe UI", sans-serif';
          ctx.fillText(name, bx, gy + 20);
          ctx.fillStyle = '#d7deea';
          ctx.fillRect(bx, gy + 26, 90, 9);
          const w = clamp(Math.abs(parseFloat(v)) * 90, 2, 90);
          ctx.fillStyle = g.color;
          ctx.fillRect(bx, gy + 26, w, 9);
          ctx.fillStyle = '#21324a';
          ctx.fillText(v, bx + 96, gy + 34);
        });
      });
      // one-line plain translation of the 8 numbers (live)
      ctx.fillStyle = '#21324a';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(
        `翻译：铰链在左缘 ${(s.oy * 100).toFixed(0)}% 高 · 轴偏 ${s.axisDeg.toFixed(0)}° · 可开 0°~90°（O.x/O.z/A.z 恒为 0）`,
        560,
        220
      );
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);

    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return [((e.clientX - rect.left) / rect.width) * W, ((e.clientY - rect.top) / rect.height) * H] as const;
    };
    const near = (x: number, y: number, px: number, py: number) => (x - px) ** 2 + (y - py) ** 2 < 26 ** 2;
    const onDown = (e: PointerEvent) => {
      const [x, y] = toLocal(e);
      const [ox, oy] = originXY(stateRef.current);
      const [tx, ty] = axisTipXY(stateRef.current);
      if (near(x, y, ox, oy)) dragRef.current = 'origin';
      else if (near(x, y, tx, ty)) dragRef.current = 'axis';
      if (dragRef.current) canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const mode = dragRef.current;
      if (!mode) return;
      const [x, y] = toLocal(e);
      const s = stateRef.current;
      if (mode === 'origin') {
        s.oy = clamp((y - DY) / DH, 0.05, 0.95);
        s.ox = 0.5;
        setVec({ ox: s.ox, oy: s.oy, axisDeg: s.axisDeg });
        setFeedback({
          text: `铰链移到左缘 ${(s.oy * 100).toFixed(0)}% 高处：门板改绕新摆心摆动，橙色摆弧跟着重定心。`,
          cls: '',
        });
        return;
      }
      const [ox, oy] = originXY(s);
      // atan2 of the pointer around the origin: axisDeg 0 = straight up,
      // sign matches the rendered tip direction (positive tilts toward -x).
      const deg = (Math.atan2(-(x - ox), -(y - oy)) * 180) / Math.PI;
      s.axisDeg = clamp(deg, -30, 30);
      setVec({ ox: s.ox, oy: s.oy, axisDeg: s.axisDeg });
      if (Math.abs(s.axisDeg) > 20)
        setFeedback({ text: '轴向偏离门缘太多：门板刮擦柜体（红光处）——物理上不合法。', cls: 'bad' });
      else if (Math.abs(s.axisDeg) > 8)
        setFeedback({ text: '轴向有偏转：门的开合轨迹已经改变。', cls: '' });
      else setFeedback({ text: '原点 + 轴向 + 范围 = 8 个数，KineVoxel 要预测的就是它们。', cls: 'good' });
    };
    const onUp = () => {
      dragRef.current = null;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.style.cursor = 'grab';
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          铰链位置 y <span className="val">{vec.oy.toFixed(2)}</span> · 轴偏角{' '}
          <span className="val">{vec.axisDeg.toFixed(0)}°</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
