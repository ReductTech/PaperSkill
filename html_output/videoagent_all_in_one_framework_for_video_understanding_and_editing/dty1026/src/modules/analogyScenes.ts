type Context = CanvasRenderingContext2D;

const ink = '#21324a';
const muted = '#64758b';
const border = '#d6e0e4';
const blue = '#28547a';
const green = '#258260';
const orange = '#e37a4b';
const red = '#bb5260';

const titles = [
  '整体意图', '镜头蓝图', '素材检索', '片段裁剪', '意图筛选',
  '依赖规划', '文本修图', '剪辑对齐', '证据辨析', '发布复核',
];
const captions = [
  '从局部素材扩展到完整故事', '先定镜头职责，再寻找素材',
  '取回与描述最匹配的片段', '在候选片段内寻找动作边界',
  '只保留当前请求需要的工具', '连接任务，保持无环依赖',
  '删除导致冲突的依赖边', '让画面切点与声音落点一致',
  '按实验口径逐项核对结论', '高风险内容交由人工把关',
];

function rounded(c: Context, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, lineWidth = 1) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = lineWidth;
    c.stroke();
  }
}

function line(c: Context, x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.stroke();
}

function label(c: Context, value: string, x: number, y: number, size: number, color: string, weight = 500) {
  c.fillStyle = color;
  c.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  c.fillText(value, x, y);
}

function circle(c: Context, x: number, y: number, r: number, color: string) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}

function ease(x: number) {
  return x * x * (3 - 2 * x);
}

// Hold at both ends so the viewer can read the cause and result before the loop reverses.
function motion(time: number) {
  const cycle = ((time % 5000) + 5000) % 5000;
  if (cycle < 500) return 0;
  if (cycle < 1750) return ease((cycle - 500) / 1250);
  if (cycle < 3350) return 1;
  if (cycle < 4600) return 1 - ease((cycle - 3350) / 1250);
  return 0;
}

function scenicFrame(c: Context, x: number, y: number, w: number, h: number, kind: 'coast' | 'mountain' | 'city' | 'sunset') {
  c.save();
  c.beginPath();
  c.roundRect(x, y, w, h, 5);
  c.clip();
  const sky = c.createLinearGradient(0, y, 0, y + h);
  if (kind === 'sunset') {
    sky.addColorStop(0, '#f5c698'); sky.addColorStop(1, '#e58c75');
  } else if (kind === 'mountain') {
    sky.addColorStop(0, '#cbe2e4'); sky.addColorStop(1, '#eff1d6');
  } else {
    sky.addColorStop(0, '#b4dce7'); sky.addColorStop(1, '#e8eddb');
  }
  c.fillStyle = sky;
  c.fillRect(x, y, w, h);
  circle(c, x + w * .76, y + h * .26, Math.max(2, h * .09), kind === 'sunset' ? '#fff1ca' : '#fff9dc');
  if (kind === 'city') {
    c.fillStyle = '#728f9c';
    for (let i = 0; i < 7; i++) {
      const bw = w / 9;
      const bh = h * (.24 + ((i * 7) % 5) * .08);
      c.fillRect(x + i * w / 7 - 2, y + h - bh, bw, bh);
    }
    c.fillStyle = '#4c7184';
    c.fillRect(x, y + h * .84, w, h * .16);
  } else if (kind === 'mountain') {
    c.fillStyle = '#9ab7ac';
    c.beginPath(); c.moveTo(x, y + h * .82); c.lineTo(x + w * .24, y + h * .27); c.lineTo(x + w * .53, y + h * .83); c.fill();
    c.fillStyle = '#5e927c';
    c.beginPath(); c.moveTo(x + w * .18, y + h); c.lineTo(x + w * .61, y + h * .36); c.lineTo(x + w, y + h); c.fill();
    c.fillStyle = '#345d5a'; c.fillRect(x, y + h * .9, w, h * .1);
  } else {
    c.fillStyle = kind === 'sunset' ? '#5f8b83' : '#76a8ad';
    c.beginPath(); c.moveTo(x, y + h * .58); c.quadraticCurveTo(x + w * .23, y + h * .37, x + w * .47, y + h * .62); c.lineTo(x + w, y + h * .62); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.fill();
    c.fillStyle = kind === 'sunset' ? '#467985' : '#438ba6';
    c.fillRect(x, y + h * .67, w, h * .33);
    c.strokeStyle = 'rgba(255,255,255,.54)'; c.lineWidth = 1;
    for (let i = 0; i < 3; i++) line(c, x + 7 + i * w * .24, y + h * (.78 + i * .055), x + w * (.22 + i * .24), y + h * (.78 + i * .055), 'rgba(255,255,255,.5)', 1);
  }
  c.restore();
  rounded(c, x, y, w, h, 5, 'rgba(0,0,0,0)', 'rgba(29,57,72,.18)');
}

function filmTicks(c: Context, x: number, y: number, w: number) {
  for (let i = 0; i < Math.floor(w / 25); i++) {
    rounded(c, x + 6 + i * 25, y, 9, 3, 1, '#a9bac1');
  }
}

function iconCheck(c: Context, x: number, y: number, scale: number, color: string) {
  line(c, x, y + scale * .45, x + scale * .35, y + scale, color, 3);
  line(c, x + scale * .35, y + scale, x + scale, y, color, 3);
}

export function drawAnalogyScene(c: Context, variant: number, time: number) {
  const v = Math.max(1, Math.min(10, variant));
  const p = motion(time);
  c.clearRect(0, 0, 560, 140);
  c.fillStyle = '#f5f8f0';
  c.fillRect(0, 0, 560, 140);
  rounded(c, 19, 34, 522, 86, 8, '#ffffff', border);
  label(c, titles[v - 1], 21, 22, 14, ink, 700);
  label(c, String(v).padStart(2, '0'), 516, 22, 12, muted, 700);
  label(c, captions[v - 1], 21, 136, 11, muted);

  c.save();
  c.beginPath(); c.roundRect(20, 35, 520, 84, 7); c.clip();

  if (v === 1) {
    scenicFrame(c, 42, 47, 324, 60, 'coast');
    rounded(c, 390, 49, 122, 23, 4, '#edf3f1');
    line(c, 399, 61, 501, 61, '#aac4bc', 2);
    for (let i = 0; i < 7; i++) line(c, 397 + i * 16, 87, 397 + i * 16, 90 + (i % 3) * 4, '#86b2a0', 2);
    const x = 103 - p * 47;
    const w = 164 + p * 290;
    c.save(); c.shadowColor = 'rgba(37,130,96,.18)'; c.shadowBlur = 7;
    rounded(c, x, 43, w, 69, 5, 'rgba(255,255,255,.02)', green, 3); c.restore();
    circle(c, x + 2, 44, 3, green); circle(c, x + w - 2, 111, 3, green);
  }

  if (v === 2) {
    filmTicks(c, 43, 42, 473);
    scenicFrame(c, 45, 54, 140, 50, 'city');
    scenicFrame(c, 375, 54, 140, 50, 'sunset');
    rounded(c, 207, 51, 146, 57, 6, '#e8f2ed');
    c.save(); c.shadowColor = 'rgba(29,63,62,.2)'; c.shadowBlur = 7; c.shadowOffsetY = 3;
    scenicFrame(c, 212, 38 + 17 * p, 136, 49, 'mountain'); c.restore();
    if (p > .8) iconCheck(c, 337, 96, 8, green);
    filmTicks(c, 43, 111, 473);
  }

  if (v === 3) {
    const xs = [45, 174, 303, 432];
    const kinds: Array<'city' | 'mountain' | 'coast' | 'sunset'> = ['city', 'mountain', 'coast', 'sunset'];
    xs.forEach((x, i) => scenicFrame(c, x, 56, 91, 49, kinds[i]));
    rounded(c, 40 + p * 258, 49, 101, 63, 5, 'rgba(255,255,255,.02)', orange, 3);
    line(c, 90 + p * 258, 42, 90 + p * 258, 49, orange, 2);
    rounded(c, 304, 40, 89, 4, 2, '#dceee5');
    rounded(c, 304, 40, 89 * p, 4, 2, green);
  }

  if (v === 4) {
    rounded(c, 43, 50, 474, 59, 6, '#edf3f2');
    for (let i = 0; i < 8; i++) scenicFrame(c, 48 + i * 58, 60, 54, 40, i < 5 ? 'coast' : 'sunset');
    rounded(c, 242, 53, 116, 52, 4, 'rgba(37,130,96,.1)', green, 1.5);
    filmTicks(c, 46, 54, 468);
    const x = 90 + p * 211;
    line(c, x, 45, x, 111, orange, 2.5);
    c.beginPath(); c.moveTo(x - 7, 44); c.lineTo(x + 7, 44); c.lineTo(x, 52); c.closePath(); c.fillStyle = orange; c.fill();
  }

  if (v === 5) {
    rounded(c, 57, 47, 446, 60, 6, '#fcfdf9', '#dce7e2');
    const rows = [62, 78, 94];
    rows.forEach((y, i) => {
      circle(c, 72, y - 3, 2.3, i === 1 ? green : '#b2c2c7');
      rounded(c, 83, y - 6, [219, 283, 178][i], 5, 2, i === 1 ? '#94b9a7' : '#c9d7d8');
      rounded(c, 381, y - 6, 91, 5, 2, i === 1 ? '#bad9ca' : '#e1e9e7');
    });
    rounded(c, 80, 68, 290 * p, 17, 4, 'rgba(227,122,75,.11)');
    line(c, 80, 87, 80 + 290 * p, 87, orange, 2.5);
    const px = 80 + 290 * p;
    c.save(); c.translate(px, 82); c.rotate(.4);
    rounded(c, -4, -13, 8, 18, 2, '#e9aa62', '#ba7754');
    c.beginPath(); c.moveTo(-4, 5); c.lineTo(4, 5); c.lineTo(0, 12); c.closePath(); c.fillStyle = '#715a4a'; c.fill(); c.restore();
  }

  if (v === 6) {
    const nodes = [[103, 75], [272, 75], [454, 75]];
    line(c, 146, 75, 225, 75, blue, 2);
    line(c, 318, 75, 409 - (1 - p) * 91, 75, green, 3);
    nodes.forEach(([x, y], i) => {
      rounded(c, x - 43, y - 21, 86, 42, 6, '#f7fbf8', i === 2 ? green : '#9bb4bd', 1.5);
      circle(c, x - 15, y, 4, i === 2 ? green : blue);
      rounded(c, x - 3, y - 7, 26, 5, 2, '#afc5c5');
      rounded(c, x - 3, y + 3, 18, 4, 2, '#cfdddb');
    });
  }

  if (v === 7) {
    rounded(c, 48, 50, 467, 60, 5, '#f9fbf8', '#d8e4df');
    [99, 270, 444].forEach((x, i) => rounded(c, x - 24, 67, 48, 29, 5, i === 2 ? '#e6f1eb' : '#eaf0f0', i === 2 ? green : '#abc1c5'));
    line(c, 123, 81, 246, 81, blue, 2);
    line(c, 294, 81, 420, 81, green, 2);
    const redEnd = 122 + 294 * p;
    if (redEnd < 416) {
      c.beginPath(); c.moveTo(418, 61); c.quadraticCurveTo(260 + 147 * p, 39 + 22 * p, redEnd, 61); c.strokeStyle = red; c.lineWidth = 2; c.setLineDash([5, 4]); c.stroke(); c.setLineDash([]);
    }
    const x = redEnd;
    c.save(); c.translate(x, 56); c.rotate(-.16);
    rounded(c, -13, -7, 26, 14, 3, '#f2a77f', '#d16d52');
    rounded(c, -13, 2, 26, 5, 1, '#f5ded1'); c.restore();
  }

  if (v === 8) {
    scenicFrame(c, 46, 48, 160, 47, 'coast');
    scenicFrame(c, 208, 48, 160, 47, 'sunset');
    scenicFrame(c, 370, 48, 141, 47, 'city');
    rounded(c, 46, 98, 465, 14, 3, '#e9f1ee');
    for (let i = 0; i < 26; i++) {
      const h = 3 + ((i * 17 + 5) % 10);
      line(c, 52 + i * 17, 105 - h / 2, 52 + i * 17, 105 + h / 2, '#83a8a0', 2);
    }
    line(c, 369, 45, 369, 114, green, 2);
    const x = 115 + 254 * p;
    line(c, x, 44, x, 114, orange, 3);
    circle(c, x, 43, 4, orange);
    if (p > .94) circle(c, 369, 105, 4, green);
  }

  if (v === 9) {
    rounded(c, 76, 44, 410, 66, 5, '#fbfcfa', '#dce5e2');
    for (let i = 0; i < 3; i++) {
      const y = 51 + i * 19;
      if (i === 1) rounded(c, 84, y - 2, 394, 18, 3, '#e8f3eb');
      circle(c, 97, y + 7, 3, [blue, green, orange][i]);
      rounded(c, 111, y + 3, 85 + i * 13, 6, 2, '#b7c9cc');
      rounded(c, 321, y + 3, 110 - i * 19, 6, 2, i === 1 ? '#78ad91' : '#c7d5d5');
    }
    const x = 282 + 89 * p, y = 62 + 15 * p;
    c.save(); c.shadowColor = 'rgba(39,84,122,.15)'; c.shadowBlur = 5;
    circle(c, x, y, 18, 'rgba(255,255,255,.45)');
    c.beginPath(); c.arc(x, y, 18, 0, Math.PI * 2); c.strokeStyle = blue; c.lineWidth = 3; c.stroke();
    line(c, x + 13, y + 13, x + 27, y + 27, blue, 4); c.restore();
  }

  if (v === 10) {
    scenicFrame(c, 78, 43, 283, 67, 'city');
    rounded(c, 379, 47, 99, 59, 5, '#f8fbf8', '#d4e3db');
    for (let i = 0; i < 3; i++) {
      circle(c, 394, 59 + i * 17, 3, i === 2 ? '#c3d1cf' : green);
      rounded(c, 406, 56 + i * 17, 54 - i * 8, 5, 2, '#bdceca');
    }
    const y = 38 + 44 * p;
    c.save(); c.shadowColor = 'rgba(32,111,83,.22)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
    rounded(c, 250, y, 69, 28, 5, '#e7f3ea', green, 2);
    iconCheck(c, 271, y + 7, 13, green); c.restore();
    if (p > .88) rounded(c, 245, 78, 79, 33, 5, 'rgba(37,130,96,.08)', green);
  }

  c.restore();
}

export function drawHeroComparison(c: Context, mode: 'old' | 'new', value: number) {
  c.clearRect(0, 0, 1080, 300);
  c.fillStyle = '#f5f8f0';
  c.fillRect(0, 0, 1080, 300);

  if (mode === 'old') {
    scenicFrame(c, 72, 43, 320, 180, 'coast');
    rounded(c, 65, 36, 334, 194, 9, 'rgba(255,255,255,.01)', red, 6);
    for (let i = 0; i < 2; i++) {
      const x = 488 + i * 276;
      rounded(c, x, 68, 224, 127, 8, '#edf0ed', '#cdd8d8', 3);
      line(c, x + 32, 111, x + 191, 111, '#b9c9ca', 7);
      line(c, x + 32, 144, x + 143, 144, '#cbd8d7', 7);
    }
    c.setLineDash([14, 10]);
    line(c, 403, 133, 476, 133, '#a8bac0', 6);
    line(c, 722, 133, 752, 133, '#a8bac0', 6);
    c.setLineDash([]);
    rounded(c, 76, 247, 926, 13, 6, '#e2e9e7');
    rounded(c, 76, 247, 170 + value * 160, 13, 6, red);
    circle(c, 76 + 170 + value * 160, 253, 13, red);
  } else {
    const xs = [48, 375, 702];
    const scenes: Array<'city' | 'coast' | 'sunset'> = ['city', 'coast', 'sunset'];
    xs.forEach((x, i) => {
      scenicFrame(c, x, 51, 284, 150, scenes[i]);
      rounded(c, x, 50, 285, 152, 6, 'rgba(255,255,255,.01)', i === Math.min(2, Math.floor(value * 3)) ? green : '#aac4bc', 4);
    });
    line(c, 339, 124, 366, 124, green, 5);
    line(c, 666, 124, 693, 124, green, 5);
    rounded(c, 48, 227, 938, 30, 7, '#e2eee7');
    for (let i = 0; i < 32; i++) {
      const h = 5 + ((i * 13 + 7) % 17);
      line(c, 62 + i * 28, 242 - h / 2, 62 + i * 28, 242 + h / 2, '#8cb59f', 4);
    }
    line(c, 60 + value * 903, 211, 60 + value * 903, 265, orange, 5);
  }
}
