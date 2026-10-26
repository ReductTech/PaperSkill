// Recovered from the supplied local FPN guide; vendor runtime and slideshow shell removed.
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as jsxRuntime from "react/jsx-runtime";
var nm = jsxRuntime;
function fe({
  variant: t = "body",
  children: e,
  muted: l = !1
}) {
  return (0, nm.jsx)(t === "h1" || t === "h2" || t === "h3" ? t : "p", {
    className: `ppt-type ppt-type-${t}${l ? " ppt-muted" : ""}`,
    children: e
  });
}
var un = React;
var pi = React,
  E = jsxRuntime,
  x = {
    ink: "#21324a",
    muted: "#68778f",
    axis: "#d7deea",
    blue: "#27446e",
    green: "#228d5c",
    red: "#c43f52",
    orange: "#f07e47",
    purple: "#7c3aed",
    ground: "#eceee4",
    block: "#e3e4d9",
    road: "#d3d6cf",
    river: "#c9dde3",
    riverDeep: "#b6cfd8",
    park: "#cddcc0",
    tree: "#97b886",
    treeDark: "#6f9562"
  },
  ze = {
    2: "#86a7cf",
    3: "#5f86b9",
    4: "#43689c",
    5: "#27446e",
    6: "#182b47"
  },
  Ia = {
    2: 4,
    3: 8,
    4: 16,
    5: 32,
    6: 64
  },
  Ct = 1e3,
  Ne = 800;
function assignRoiLevel(t, e) {
  let l = Math.sqrt(Math.max(1, t * e)),
    a = 4 + Math.log2(l / 224),
    n = Math.floor(a);
  return {
    scale: l,
    raw: a,
    k: n,
    clamped: Math.max(2, Math.min(5, n))
  };
}
var oe = (t, e, l) => Math.max(e, Math.min(l, t));
function tn(t, e, l, a, n, i = 20) {
  let u = oe(t.w, e, Math.min(l, Ct - i)),
    c = oe(t.h, a, Math.min(n, Ne - i));
  return {
    cx: oe(t.cx, u / 2, Ct - i - u / 2),
    cy: oe(t.cy, c / 2, Ne - i - c / 2),
    w: u,
    h: c
  };
}
function en(t, e, l, a, n, i, u, c = 20) {
  let f = t.cx - t.w / 2,
    r = t.cy - t.h / 2,
    d = oe(e - f, a, Math.min(n, Ct - c - f)),
    h = oe(l - r, i, Math.min(u, Ne - c - r));
  return {
    cx: f + d / 2,
    cy: r + h / 2,
    w: d,
    h
  };
}
function Ko(t) {
  let e = Math.max(0, t.cx - t.w / 2),
    l = Math.max(0, t.cy - t.h / 2),
    a = Math.min(Ct, t.cx + t.w / 2),
    n = Math.min(Ne, t.cy + t.h / 2);
  return {
    x: e,
    y: l,
    width: Math.max(0, a - e),
    height: Math.max(0, n - l)
  };
}
function um(t, e) {
  let l = Math.max(t.cx - t.w / 2, e.cx - e.w / 2),
    a = Math.min(t.cx + t.w / 2, e.cx + e.w / 2),
    n = Math.max(t.cy - t.h / 2, e.cy - e.h / 2),
    i = Math.min(t.cy + t.h / 2, e.cy + e.h / 2),
    u = Math.max(0, a - l) * Math.max(0, i - n),
    c = t.w * t.h + e.w * e.h - u;
  return c > 0 ? u / c : 0;
}
function Bl(t, e, l = 0) {
  let a = Math.sin(t * 127.1 + e * 311.7 + l * 74.7) * 43758.5453;
  return a - Math.floor(a);
}
function im(t, e, l) {
  if (!t) return null;
  let a = t.getScreenCTM();
  if (!a) return null;
  let n = new DOMPoint(e, l).matrixTransform(a.inverse());
  return {
    x: n.x,
    y: n.y
  };
}
function ln(t, e) {
  let l = (0, pi.useRef)(null),
    a = (0, pi.useRef)(e);
  a.current = e;
  let n = i => {
    l.current === i.pointerId && (l.current = null, a.current.end?.());
  };
  return {
    onPointerDown: i => {
      if (!i.isPrimary || i.pointerType === "mouse" && i.button !== 0) return;
      let u = im(t.current, i.clientX, i.clientY);
      u && (l.current = i.pointerId, i.currentTarget.setPointerCapture(i.pointerId), a.current.start?.(u.x, u.y), a.current.move(u.x, u.y));
    },
    onPointerMove: i => {
      if (l.current !== i.pointerId) return;
      let u = im(t.current, i.clientX, i.clientY);
      u && a.current.move(u.x, u.y);
    },
    onPointerUp: n,
    onPointerCancel: n
  };
}
function an(t, e) {
  let a = {
    ArrowLeft: [-e, 0],
    ArrowRight: [e, 0],
    ArrowUp: [0, -e],
    ArrowDown: [0, e]
  }[t.key];
  return a ? (t.preventDefault(), a) : null;
}
function nn({
  b: t,
  color: e = "#c8553d"
}) {
  if (t.h > t.w) return (0, E.jsx)("g", {
    transform: `rotate(90 ${t.cx} ${t.cy})`,
    children: (0, E.jsx)(nn, {
      b: {
        cx: t.cx,
        cy: t.cy,
        w: t.h,
        h: t.w
      },
      color: e
    })
  });
  let l = t.cx - t.w / 2,
    a = t.cy - t.h / 2;
  return (0, E.jsxs)("g", {
    "aria-hidden": "true",
    children: [(0, E.jsx)("rect", {
      x: l + 1,
      y: a + 2,
      width: t.w,
      height: t.h,
      rx: t.h * .35,
      fill: "#000",
      opacity: "0.12"
    }), (0, E.jsx)("rect", {
      x: l,
      y: a,
      width: t.w,
      height: t.h,
      rx: t.h * .35,
      fill: e
    }), (0, E.jsx)("rect", {
      x: l + t.w * .58,
      y: a + t.h * .14,
      width: t.w * .17,
      height: t.h * .72,
      rx: t.h * .12,
      fill: "#2c3a4a",
      opacity: "0.85"
    }), (0, E.jsx)("rect", {
      x: l + t.w * .16,
      y: a + t.h * .18,
      width: t.w * .12,
      height: t.h * .64,
      rx: t.h * .1,
      fill: "#2c3a4a",
      opacity: "0.7"
    }), (0, E.jsx)("rect", {
      x: l + t.w * .3,
      y: a + t.h * .16,
      width: t.w * .27,
      height: t.h * .68,
      rx: t.h * .12,
      fill: "#ffffff",
      opacity: "0.18"
    })]
  });
}
function Fg({
  b: t
}) {
  let e = t.cx - t.w / 2,
    l = t.cy - t.h / 2;
  return (0, E.jsxs)("g", {
    "aria-hidden": "true",
    children: [(0, E.jsx)("rect", {
      x: e + 2,
      y: l + 3,
      width: t.w,
      height: t.h,
      rx: "5",
      fill: "#000",
      opacity: "0.12"
    }), (0, E.jsx)("rect", {
      x: e,
      y: l,
      width: t.w,
      height: t.h,
      rx: "5",
      fill: "#e3b23c"
    }), (0, E.jsx)("rect", {
      x: e + t.w * .86,
      y: l + 3,
      width: t.w * .1,
      height: t.h - 6,
      rx: "3",
      fill: "#2c3a4a",
      opacity: "0.8"
    }), (0, E.jsx)("rect", {
      x: e + t.w * .2,
      y: l + t.h * .28,
      width: t.w * .18,
      height: t.h * .44,
      rx: "2",
      fill: "#f4d98b"
    }), (0, E.jsx)("rect", {
      x: e + t.w * .48,
      y: l + t.h * .28,
      width: t.w * .18,
      height: t.h * .44,
      rx: "2",
      fill: "#f4d98b"
    }), (0, E.jsx)("path", {
      d: `M${e + 6} ${t.cy} H${e + t.w * .82}`,
      stroke: "#c99720",
      strokeWidth: "1.5"
    })]
  });
}
function Jo({
  b: t
}) {
  let e = t.cx - t.w / 2,
    l = t.cy - t.h / 2,
    a = `M${e} ${l + t.h * .18} H${e + t.w * .8} Q${e + t.w} ${t.cy} ${e + t.w * .8} ${l + t.h * .82} H${e} Z`;
  return (0, E.jsxs)("g", {
    "aria-hidden": "true",
    children: [(0, E.jsx)("path", {
      d: `M${e - 70} ${t.cy - 18} Q${e - 30} ${t.cy - 6} ${e} ${t.cy - 4} M${e - 70} ${t.cy + 18} Q${e - 30} ${t.cy + 6} ${e} ${t.cy + 4}`,
      stroke: "#ffffff",
      strokeWidth: "3",
      fill: "none",
      opacity: "0.7"
    }), (0, E.jsx)("path", {
      d: a,
      fill: "#f2f2ee",
      stroke: "#8a97a6",
      strokeWidth: "2"
    }), (0, E.jsx)("rect", {
      x: e + t.w * .14,
      y: l + t.h * .3,
      width: t.w * .5,
      height: t.h * .4,
      rx: "6",
      fill: "#3f6d8f"
    }), (0, E.jsx)("rect", {
      x: e + t.w * .18,
      y: l + t.h * .38,
      width: t.w * .42,
      height: t.h * .24,
      rx: "4",
      fill: "#d9e6ef"
    }), (0, E.jsx)("circle", {
      cx: e + t.w * .72,
      cy: t.cy,
      r: t.h * .12,
      fill: "#c43f52"
    })]
  });
}
function $o({
  b: t
}) {
  return (0, E.jsxs)("g", {
    "aria-hidden": "true",
    children: [(0, E.jsx)("ellipse", {
      cx: t.cx + 3,
      cy: t.cy + 5,
      rx: t.w / 2,
      ry: t.h / 2,
      fill: "#000",
      opacity: "0.1"
    }), (0, E.jsx)("ellipse", {
      cx: t.cx,
      cy: t.cy,
      rx: t.w / 2,
      ry: t.h / 2,
      fill: "#cfd2d6",
      stroke: "#a9aeb6",
      strokeWidth: "2"
    }), (0, E.jsx)("ellipse", {
      cx: t.cx,
      cy: t.cy,
      rx: t.w * .43,
      ry: t.h * .42,
      fill: "#8ea0b5"
    }), (0, E.jsx)("ellipse", {
      cx: t.cx,
      cy: t.cy,
      rx: t.w * .36,
      ry: t.h * .33,
      fill: "#c9705a"
    }), (0, E.jsx)("rect", {
      x: t.cx - t.w * .25,
      y: t.cy - t.h * .22,
      width: t.w * .5,
      height: t.h * .44,
      rx: t.h * .2,
      fill: "#6fa35f"
    }), (0, E.jsx)("path", {
      d: `M${t.cx} ${t.cy - t.h * .22} V${t.cy + t.h * .22}`,
      stroke: "#ffffff",
      strokeWidth: "2",
      opacity: "0.8"
    }), (0, E.jsx)("circle", {
      cx: t.cx,
      cy: t.cy,
      r: t.h * .07,
      fill: "none",
      stroke: "#ffffff",
      strokeWidth: "2",
      opacity: "0.8"
    })]
  });
}
function Wo({
  x: t,
  y: e,
  w: l,
  h: a,
  color: n = "#c98f6b"
}) {
  return (0, E.jsxs)("g", {
    "aria-hidden": "true",
    children: [(0, E.jsx)("rect", {
      x: t + 3,
      y: e + 4,
      width: l,
      height: a,
      fill: "#000",
      opacity: "0.1"
    }), (0, E.jsx)("rect", {
      x: t,
      y: e,
      width: l,
      height: a,
      fill: n
    }), (0, E.jsx)("path", {
      d: `M${t} ${e} L${t + l / 2} ${e + a / 2} L${t + l} ${e} M${t} ${e + a} L${t + l / 2} ${e + a / 2} L${t + l} ${e + a}`,
      stroke: "#ffffff",
      strokeOpacity: "0.35",
      strokeWidth: "2",
      fill: "none"
    }), (0, E.jsx)("path", {
      d: `M${t + l / 2} ${e + a / 2} V${e + a / 2}`,
      stroke: "#ffffff"
    })]
  });
}
function Fu({
  cx: t,
  cy: e,
  r: l
}) {
  return (0, E.jsxs)("g", {
    "aria-hidden": "true",
    children: [(0, E.jsx)("circle", {
      cx: t + 2,
      cy: e + 3,
      r: l,
      fill: "#000",
      opacity: "0.1"
    }), (0, E.jsx)("circle", {
      cx: t,
      cy: e,
      r: l,
      fill: x.tree
    }), (0, E.jsx)("circle", {
      cx: t - l * .25,
      cy: e - l * .25,
      r: l * .55,
      fill: "#b3cfa3",
      opacity: "0.8"
    })]
  });
}
function Zo({
  cx: t,
  cy: e,
  s: l = 14,
  color: a = "#3f6d8f"
}) {
  return (0, E.jsxs)("g", {
    "aria-hidden": "true",
    children: [(0, E.jsx)("ellipse", {
      cx: t,
      cy: e,
      rx: l * .5,
      ry: l * .32,
      fill: a
    }), (0, E.jsx)("circle", {
      cx: t,
      cy: e,
      r: l * .24,
      fill: "#e5ae78"
    })]
  });
}
var Rt = [{
    id: "stadium",
    name: "体育场",
    box: {
      cx: 770,
      cy: 245,
      w: 330,
      h: 230
    }
  }, {
    id: "ferry",
    name: "渡轮",
    box: {
      cx: 290,
      cy: 640,
      w: 230,
      h: 70
    }
  }, {
    id: "bus",
    name: "公交车",
    box: {
      cx: 640,
      cy: 486,
      w: 104,
      h: 32
    }
  }, {
    id: "car",
    name: "小汽车",
    box: {
      cx: 380,
      cy: 487,
      w: 42,
      h: 20
    }
  }, {
    id: "person",
    name: "行人",
    box: {
      cx: 545,
      cy: 548,
      w: 16,
      h: 12
    }
  }],
  Pg = [{
    b: {
      cx: 380,
      cy: 487,
      w: 42,
      h: 20
    },
    color: "#c8553d"
  }, {
    b: {
      cx: 250,
      cy: 487,
      w: 42,
      h: 20
    },
    color: "#5d7fa8"
  }, {
    b: {
      cx: 880,
      cy: 471,
      w: 42,
      h: 20
    },
    color: "#e1e2df"
  }, {
    b: {
      cx: 489,
      cy: 140,
      w: 20,
      h: 42
    },
    color: "#4b8d6d"
  }, {
    b: {
      cx: 471,
      cy: 330,
      w: 20,
      h: 42
    },
    color: "#2f3a48"
  }];
function cl({
  dim: t = 0
}) {
  let e = [];
  for (let n = 0; n < 16; n++) {
    let i = 40 + 380 * Bl(n, 1, 3),
      u = 40 + 160 * Bl(n, 2, 3);
    e.push((0, E.jsx)(Fu, {
      cx: i,
      cy: u,
      r: 12 + 10 * Bl(n, 3, 3)
    }, `t${n}`));
  }
  for (let n = 0; n < 7; n++) e.push((0, E.jsx)(Fu, {
    cx: 560 + 420 * Bl(n, 5, 4),
    cy: 395 + 40 * Bl(n, 6, 4),
    r: 11 + 6 * Bl(n, 7, 4)
  }, `p${n}`));
  let l = [],
    a = ["#c98f6b", "#b9806a", "#a9a39a", "#d4a373", "#9aa7b0"];
  for (let n = 0; n < 2; n++) for (let i = 0; i < 4; i++) l.push((0, E.jsx)(Wo, {
    x: 40 + i * 100,
    y: 250 + n * 100,
    w: 76,
    h: 66,
    color: a[(n * 4 + i) % 5]
  }, `h${n}${i}`));
  return (0, E.jsxs)("g", {
    "aria-hidden": "true",
    children: [(0, E.jsx)("rect", {
      x: "0",
      y: "0",
      width: Ct,
      height: Ne,
      fill: x.ground
    }), (0, E.jsx)("rect", {
      x: "530",
      y: "70",
      width: "460",
      height: "360",
      rx: "18",
      fill: x.park
    }), (0, E.jsx)("rect", {
      x: "20",
      y: "20",
      width: "430",
      height: "200",
      rx: "14",
      fill: x.park
    }), (0, E.jsx)("path", {
      d: `M0 560 C 200 540, 380 600, 560 585 S 860 545, ${Ct} 575 L ${Ct} 720 C 820 700, 640 735, 460 725 S 160 700, 0 720 Z`,
      fill: x.river
    }), (0, E.jsx)("path", {
      d: `M0 640 C 220 625, 420 660, 640 652 S 900 630, ${Ct} 645`,
      stroke: x.riverDeep,
      strokeWidth: "18",
      fill: "none",
      opacity: "0.6"
    }), (0, E.jsx)("rect", {
      x: "460",
      y: "0",
      width: "58",
      height: Ne,
      fill: x.road
    }), (0, E.jsx)("rect", {
      x: "0",
      y: "462",
      width: Ct,
      height: "50",
      fill: x.road
    }), (0, E.jsx)("path", {
      d: `M489 0 V${Ne}`,
      stroke: "#ffffff",
      strokeWidth: "2",
      strokeDasharray: "14 12"
    }), (0, E.jsx)("path", {
      d: `M0 487 H${Ct}`,
      stroke: "#ffffff",
      strokeWidth: "2",
      strokeDasharray: "14 12"
    }), (0, E.jsx)("rect", {
      x: "456",
      y: "566",
      width: "66",
      height: "160",
      fill: "#b9bdb5"
    }), l, e, (0, E.jsx)($o, {
      b: Rt[0].box
    }), (0, E.jsx)(Jo, {
      b: Rt[1].box
    }), (0, E.jsx)(Fg, {
      b: Rt[2].box
    }), Pg.map((n, i) => (0, E.jsx)(nn, {
      b: n.b,
      color: n.color
    }, i)), (0, E.jsx)(Zo, {
      cx: 545,
      cy: 548
    }), (0, E.jsx)(Zo, {
      cx: 566,
      cy: 540,
      color: "#a55a4a"
    }), (0, E.jsx)(Zo, {
      cx: 420,
      cy: 545,
      color: "#6f7d4f"
    }), (0, E.jsx)("rect", {
      x: "0",
      y: "770",
      width: Ct,
      height: "30",
      fill: "#e6e1d3"
    }), t > 0 && (0, E.jsx)("rect", {
      x: "0",
      y: "0",
      width: Ct,
      height: Ne,
      fill: "#ffffff",
      opacity: t
    })]
  });
}
function mi({
  x: t,
  y: e,
  w: l,
  h: a,
  cell: n,
  color: i = "#ffffff",
  opacity: u = .7,
  width: c = 1
}) {
  let f = "";
  for (let r = t; r <= t + l + .01; r += n) f += `M${r} ${e} V${e + a} `;
  for (let r = e; r <= e + a + .01; r += n) f += `M${t} ${r} H${t + l} `;
  return (0, E.jsx)("path", {
    d: f,
    stroke: i,
    strokeOpacity: u,
    strokeWidth: c,
    fill: "none",
    "aria-hidden": "true"
  });
}
function Ye({
  x: t,
  y: e,
  s: l = 1,
  zoom: a = 2
}) {
  let n = 40 / a,
    i = "";
  for (let u = 0; u <= 120; u += n) i += `M${-50 + u} -86 V64 `;
  return (0, E.jsxs)("g", {
    transform: `translate(${t} ${e}) scale(${l})`,
    "aria-hidden": "true",
    children: [(0, E.jsx)("rect", {
      x: "-62",
      y: "-104",
      width: "124",
      height: "196",
      rx: "18",
      fill: "#2f3a48"
    }), (0, E.jsx)("rect", {
      x: "-54",
      y: "-90",
      width: "108",
      height: "164",
      rx: "8",
      fill: x.ground
    }), (0, E.jsx)("path", {
      d: "M-54 10 C -20 0, 20 24, 54 12 L 54 40 C 20 52, -20 30, -54 44 Z",
      fill: x.river
    }), (0, E.jsx)("rect", {
      x: "-8",
      y: "-90",
      width: "12",
      height: "164",
      fill: x.road
    }), (0, E.jsx)("path", {
      d: i,
      stroke: "#ffffff",
      strokeOpacity: "0.6",
      strokeWidth: "1"
    }), (0, E.jsx)("circle", {
      cx: "20",
      cy: "-40",
      r: "9",
      fill: x.orange
    }), (0, E.jsx)("path", {
      d: "M20 -26 L14 -38 H26 Z",
      fill: x.orange
    }), (0, E.jsx)("rect", {
      x: "34",
      y: "46",
      width: "16",
      height: "22",
      rx: "4",
      fill: "#ffffff"
    }), (0, E.jsx)("path", {
      d: "M38 52 H46 M42 48 V56 M38 63 H46",
      stroke: x.ink,
      strokeWidth: "2"
    })]
  });
}
function UnusedWidget(t) {
  return null;
}
function MobileBarChart({rows, selected, onPick, metric, maximum, label, note, progress = 1}) {
  return <div className="fp-mobile-bars" role="group" aria-label={label}>
    <p className="fp-mobile-bar-axis">{metric} · 统一量程 0–{maximum}；条形从 0 起点绘制。</p>
    {rows.map(row => {
      const hasValue = row.value !== null && row.value !== undefined;
      const valueText = hasValue ? row.value.toFixed(1) : '未报告';
      const selectedRow = selected === row.id;
      return <button type="button" className={`fp-mobile-bar-row${selectedRow ? ' is-selected' : ''}`}
        key={row.id} aria-pressed={selectedRow}
        aria-label={`${row.label}：${metric} ${valueText}${row.meta ? `；${row.meta}` : ''}`}
        onClick={() => onPick(row.id)}>
        <span className="fp-mobile-bar-heading">
          <span className="fp-mobile-bar-label">{row.label}</span>
          <strong className="fp-mobile-bar-value">{valueText}</strong>
        </span>
        <span className="fp-mobile-bar-track" aria-hidden="true">
          <span style={{width: `${hasValue ? Math.max(0, Math.min(100, row.value / maximum * 100)) * progress : 0}%`, backgroundColor: row.color || x.blue}} />
        </span>
        {row.meta && <span className="fp-mobile-bar-meta">{row.meta}</span>}
      </button>;
    })}
    {note && <p className="fp-mobile-bar-note">{note}</p>}
  </div>;
}
var V = jsxRuntime,
  rpnAblationRows = [{
    id: "a",
    name: "(a) conv4 基线",
    feat: "C4",
    anchors: "47k",
    v: [36.1, 48.3, 32, 58.7, 62.2]
  }, {
    id: "b",
    name: "(b) conv5 基线",
    feat: "C5",
    anchors: "12k",
    v: [36.3, 44.9, 25.3, 55.5, 64.2]
  }, {
    id: "c",
    name: "(c) FPN",
    feat: "{Pk}",
    anchors: "200k",
    v: [44, 56.3, 44.9, 63.4, 66.2]
  }, {
    id: "d",
    name: "(d) 自底向上金字塔",
    feat: "{Pk}",
    anchors: "200k",
    v: [37.4, 49.5, 30.5, 59.9, 68]
  }, {
    id: "e",
    name: "(e) 自顶向下、无横向",
    feat: "{Pk}",
    anchors: "200k",
    v: [34.5, 46.1, 26.5, 57.4, 64.7]
  }, {
    id: "f",
    name: "(f) 只用最细层 P2",
    feat: "P2",
    anchors: "750k",
    v: [38.4, 51.3, 35.1, 59.7, 67.6]
  }],
  Fo = ["AR100", "AR1k", "AR1k 小", "AR1k 中", "AR1k 大"],
  Ig = {
    a: "单尺度 RPN 基线：在 C4 上放 5 种面积 × 3 种长宽比的锚框。",
    b: "C5 基线的 AR1k 为 44.9，低于 C4 的 48.3；更深、更粗的单层特征并未带来更高的整体提案召回。",
    c: "AR1k 比单尺度基线高 8.0，小目标 AR 高 12.9。",
    d: "去掉自顶向下后，AR1k 从 56.3 降至 49.5；但大物体 AR 为 68.0，高于完整 FPN 的 66.2，不能说每项都变差。",
    e: "没有横向连接：多次下采样再上采样后，特征的位置不精确。",
    f: "只用 P2：750k anchors 比完整 FPN 多，但 AR1k 51.3 仍低于 56.3；锚框数量增加没有带来更高的整体提案召回。"
  };
function RpnAblation(t) {
  let [e, l] = (0, un.useState)(!0),
    [a, n] = (0, un.useState)(!0),
    [i, u] = (0, un.useState)(!1),
    [c, f] = (0, un.useState)(null),
    [r, d] = (0, un.useState)(1),
    h = c || (a ? e ? i ? "f" : "c" : "e" : "d"),
    s = 70,
    g = rpnAblationRows.find(o => o.id === h),
    b = rpnAblationRows.find(o => o.id === "c"),
    v = g.v[r] - b.v[r],
    N = o => {
      if (f(null), o === "lat") {
        if (e && !a) return;
        l(!e), e && u(!1);
      }
      if (o === "td") {
        if (a && !e) return;
        n(!a), a && u(!1);
      }
      o === "fin" && (u(!i), l(!0), n(!0));
    },
    p = c === null;
  const [barProgress, setBarProgress] = React.useState(1);
  const [comparing, setComparing] = React.useState(false);
  const [comparisonStatus, setComparisonStatus] = React.useState('原表最终值；条形从同一零点比较。');
  const comparisonFrame = React.useRef(null);
  const stopComparison = () => {
    if (comparisonFrame.current !== null) cancelAnimationFrame(comparisonFrame.current);
    comparisonFrame.current = null;
  };
  React.useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finishWithoutMotion = () => {
      if (!preference.matches) return;
      stopComparison();
      setBarProgress(1);
      setComparing(false);
      setComparisonStatus('已减少动态效果：直接显示原表最终值。');
    };
    preference.addEventListener('change', finishWithoutMotion);
    return () => { stopComparison(); preference.removeEventListener('change', finishWithoutMotion); };
  }, []);
  const selectMetric = metric => {
    stopComparison();
    setBarProgress(1);
    setComparing(false);
    setComparisonStatus('已切换指标；显示原表最终值。');
    d(metric);
  };
  const selectRow = id => {
    if (id === 'a' || id === 'b') { f(id); return; }
    f(null);
    l(id !== 'e');
    n(id !== 'd');
    u(id === 'f');
  };
  const compareCurrentMetric = () => {
    stopComparison();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setBarProgress(1);
      setComparing(false);
      setComparisonStatus('已减少动态效果：直接显示原表最终值。');
      return;
    }
    setBarProgress(0);
    setComparing(true);
    setComparisonStatus('正在比较当前指标；文字始终显示原表最终值，动画不表示模型运行时间。');
    const start = performance.now();
    const advance = now => {
      const fraction = Math.min(1, (now - start) / 1800);
      setBarProgress(fraction);
      if (fraction < 1) comparisonFrame.current = requestAnimationFrame(advance);
      else {
        comparisonFrame.current = null;
        setComparing(false);
        setComparisonStatus('比较完成；条形与文字均为当前指标的原表最终值。');
      }
    };
    comparisonFrame.current = requestAnimationFrame(advance);
  };
  return (0, V.jsxs)("div", {
    className: "fp-page fp-ablation-page",
    children: [(0, V.jsxs)("div", {
      className: "fp-ablation-controls",
      children: [(0, V.jsxs)("svg", {
        viewBox: "0 0 440 300",
        className: "fp-svg fp-ablation-mini",
        role: "img",
        "aria-label": `\u5F53\u524D\u7ED3\u6784\uFF1A${g.name}`,
        children: [(0, V.jsx)("rect", {
          x: "0",
          y: "0",
          width: "440",
          height: "300",
          rx: "16",
          fill: "#f7f9fb"
        }), [0, 1, 2, 3].map(o => {
          let m = 250 - o * 62,
            y = 90 - o * 14,
            z = p && !(i && o > 0);
          return (0, V.jsxs)("g", {
            opacity: c && !(c === "a" && o === 2 || c === "b" && o === 3) ? .35 : 1,
            children: [(0, V.jsx)("rect", {
              x: 70 - y / 2,
              y: m - 20,
              width: y,
              height: 40,
              rx: "6",
              fill: ["#dfe7f2", "#b7c8de", "#7f9cc2", "#4a6b98"][o],
              stroke: "#8a9bb2"
            }), (0, V.jsxs)("text", {
              x: "70",
              y: m + 9,
              textAnchor: "middle",
              fontSize: "26",
              fill: o >= 2 ? "#fff" : x.ink,
              children: ["C", o + 2]
            }), p && (0, V.jsx)("line", {
              x1: 70 + y / 2 + 4,
              y1: m,
              x2: 250 - y / 2 - 8,
              y2: m,
              stroke: e ? x.green : "#c8ced8",
              strokeWidth: e ? 4 : 2,
              strokeDasharray: e ? void 0 : "6 6"
            }), p && (0, V.jsx)("rect", {
              x: 250 - y / 2,
              y: m - 20,
              width: y,
              height: 40,
              rx: "6",
              fill: z ? a ? "#27446e" : "#7f9cc2" : "#eef1f5",
              stroke: z ? "#27446e" : "#c8ced8"
            }), p && (0, V.jsxs)("text", {
              x: "250",
              y: m + 9,
              textAnchor: "middle",
              fontSize: "26",
              fill: z ? "#fff" : x.muted,
              children: ["P", o + 2]
            }), p && o < 3 && (0, V.jsx)("line", {
              x1: "250",
              y1: m - 62 + 22,
              x2: "250",
              y2: m - 22,
              stroke: a ? x.blue : "#c8ced8",
              strokeWidth: a ? 4 : 2,
              strokeDasharray: a ? void 0 : "6 6"
            }), z && (0, V.jsx)("text", {
              x: 250 + y / 2 + 12,
              y: m + 9,
              fontSize: "26",
              fill: x.orange,
              children: "→ 预测"
            }), c && (c === "a" && o === 2 || c === "b" && o === 3) && (0, V.jsx)("text", {
              x: 70 + y / 2 + 12,
              y: m + 9,
              fontSize: "26",
              fill: x.orange,
              children: "→ 预测"
            })]
          }, o);
        })]
      }), (0, V.jsxs)("div", {
        className: "fp-toggles fp-wrap",
        role: "group",
        "aria-label": "结构部件",
        children: [(0, V.jsx)("button", {
          className: `fp-toggle ${p && a ? "is-on" : ""}`,
          "aria-pressed": p && a,
          onClick: () => N("td"),
          children: "自顶向下"
        }), (0, V.jsx)("button", {
          className: `fp-toggle ${p && e ? "is-on" : ""}`,
          "aria-pressed": p && e,
          onClick: () => N("lat"),
          children: "横向连接"
        }), (0, V.jsx)("button", {
          className: `fp-toggle ${p && i ? "is-on" : ""}`,
          "aria-pressed": p && i,
          onClick: () => N("fin"),
          children: "只用 P2"
        })]
      }), (0, V.jsxs)("div", {
        className: "fp-chips",
        role: "group",
        "aria-label": "单尺度基线",
        children: [(0, V.jsx)("button", {
          className: `fp-chip ${c === "a" ? "is-on is-old" : ""}`,
          "aria-pressed": c === "a",
          onClick: () => f("a"),
          children: "C4 基线"
        }), (0, V.jsx)("button", {
          className: `fp-chip ${c === "b" ? "is-on is-old" : ""}`,
          "aria-pressed": c === "b",
          onClick: () => f("b"),
          children: "C5 基线"
        })]
      })]
    }), (0, V.jsxs)("div", {
      className: "fp-side fp-ablation-chart",
      children: [(0, V.jsxs)("div", {
        className: "fp-chips",
        role: "group",
        "aria-label": "指标",
        children: [(0, V.jsx)("svg", {
          viewBox: "-70 -110 140 210",
          className: "fp-chip-icon",
          "aria-hidden": "true",
          children: (0, V.jsx)(Ye, {
            x: 0,
            y: 0
          })
        }), Fo.map((o, m) => (0, V.jsx)("button", {
          className: `fp-chip ${m === r ? "is-on" : ""}`,
          "aria-pressed": m === r,
          onClick: () => selectMetric(m),
          children: o
        }, o))]
      }), <div className="fp-comparison-controls" key="comparison-controls">
        <button type="button" className="fp-chip" onClick={compareCurrentMetric} disabled={comparing}>动态比较当前指标</button>
        <p className="fp-comparison-status" role="status">{comparisonStatus}</p>
      </div>, <MobileBarChart key="mobile-results" rows={rpnAblationRows.map(row => ({
        id: row.id, label: row.name, value: row.v[r],
        color: row.id === 'c' ? x.green : row.id === 'a' || row.id === 'b' ? x.red : '#7f8ea3',
        meta: `特征 ${row.feat} · ${row.anchors} anchors`
      }))} selected={h} onPick={selectRow} metric={Fo[r]} maximum={70}
        label={`表 1 RPN 消融：${Fo[r]}`} progress={barProgress}
        note="数值为表 1 原始结果。动画仅改变条形显示进度，文字始终保留最终值。" />, (0, V.jsxs)("svg", {
        viewBox: "0 0 940 380",
        className: "fp-svg fp-desktop-chart",
        role: "group",
        "aria-label": `\u8868 1 \u7684 ${Fo[r]}\uFF1A${rpnAblationRows.map(o => `${o.name} ${o.v[r]}`).join("，")}`,
        children: [[0, 20, 40, 60].map(o => (0, V.jsxs)("g", {
          children: [(0, V.jsx)("line", {
            x1: 300 + o / s * 560,
            x2: 300 + o / s * 560,
            y1: "8",
            y2: "340",
            stroke: x.axis
          }), (0, V.jsx)("text", {
            x: 300 + o / s * 560,
            y: "358",
            textAnchor: "middle",
            fontSize: "24",
            fill: x.muted,
            children: o
          })]
        }, o)), rpnAblationRows.map((o, m) => {
          let y = o.id === h,
            z = 14 + m * 54,
            w = o.v[r] / s * 560,
            A = o.id === "c" ? x.green : o.id === "a" || o.id === "b" ? x.red : "#7f8ea3";
          return (0, V.jsxs)("g", {
            role: "button",
            tabIndex: 0,
            "aria-pressed": y,
            "aria-label": `${o.name}：${Fo[r]} ${o.v[r].toFixed(1)}`,
            className: "fp-hot",
            onClick: () => selectRow(o.id),
            onKeyDown: event => {
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectRow(o.id); }
            },
            children: [y && (0, V.jsx)("rect", {
              x: "0",
              y: z - 6,
              width: "900",
              height: "50",
              rx: "10",
              fill: "#fff4ec"
            }), (0, V.jsx)("text", {
              x: "290",
              y: z + 27,
              textAnchor: "end",
              fontSize: "26",
              fontWeight: y ? 700 : 400,
              fill: y ? x.ink : x.muted,
              children: o.name
            }), (0, V.jsx)("rect", {
              x: "300",
              y: z + 4,
              width: w * barProgress,
              height: "32",
              rx: "5",
              fill: A,
              opacity: y ? 1 : .45
            }), (0, V.jsx)("text", {
              x: 300 + w + 10,
              y: z + 30,
              fontSize: "26",
              fontWeight: "700",
              fill: y ? x.ink : x.muted,
              children: o.v[r].toFixed(1)
            })]
          }, o.id);
        })]
      }), (0, V.jsxs)("div", {
        className: `fp-feedback ${h === "c" ? "is-good" : v < 0 ? "is-bad" : ""}`,
        "aria-live": "polite",
        children: [g.name, "：", Ig[h], h !== "c" ? `\uFF08${Fo[r]} \u6BD4 FPN ${v > 0 ? "高" : "低"} ${Math.abs(v).toFixed(1)}\uFF09` : ""]
      })]
    })]
  });
}
var hi = React;
var $ = jsxRuntime,
  rm = [2, 3, 4, 5, 6],
  sm = {
    2: 32,
    3: 64,
    4: 128,
    5: 256,
    6: 512
  },
  dm = [.5, 1, 2],
  om = ["1:2", "1:1", "2:1"],
  ty = ["car", "bus", "ferry", "stadium"];
function ey(t) {
  let e = [];
  rm.forEach(a => {
    let n = Ia[a],
      i = (Math.floor(t.cx / n) + .5) * n,
      u = (Math.floor(t.cy / n) + .5) * n;
    dm.forEach((c, f) => {
      let r = sm[a],
        d = r / Math.sqrt(c),
        h = r * Math.sqrt(c),
        s = {
          cx: i,
          cy: u,
          w: d,
          h
        };
      e.push({
        k: a,
        r: f,
        box: s,
        iou: um(s, t),
        label: "neg"
      });
    });
  });
  let l = Math.max(...e.map(a => a.iou));
  return e.forEach(a => {
    a.label = a.iou > .7 || a.iou === l ? "pos" : a.iou < .3 ? "neg" : "neu";
  }), e;
}
function AnchorMatcher(t) {
  let e = (0, hi.useRef)(null),
    [l, a] = (0, hi.useState)({
      ...Rt.find(b => b.id === "bus").box
    }),
    n = (0, hi.useRef)({
      dx: 0,
      dy: 0
    }),
    i = ey(l),
    u = i.reduce((b, v) => v.iou > b.iou ? v : b, i[0]),
    c = i.filter(b => b.label === "pos"),
    f = c.some(b => b.iou > .7),
    r = ln(e, {
      start: (b, v) => {
        n.current = {
          dx: l.cx - b,
          dy: l.cy - v
        };
      },
      move: (b, v) => a(N => tn({
        ...N,
        cx: b + n.current.dx,
        cy: v + n.current.dy
      }, 12, 600, 12, 500))
    }),
    d = ln(e, {
      move: (b, v) => a(N => en(N, b, v, 12, 600, 12, 500))
    }),
    h = b => a({
      ...Rt.find(v => v.id === b).box
    }),
    s = [...new Set(c.map(b => b.k))],
    g = f ? `IoU > 0.7 \u7684\u951A\u6846\u5728 P${s.join("、P")} \u4E0A\uFF0C\u5B83\u4EEC\u6210\u4E3A\u6B63\u6837\u672C\uFF1B\u8BBA\u6587\u4E0D\u76F4\u63A5\u6309\u76EE\u6807\u5C3A\u5BF8\u5206\u5C42\uFF0C\u5C42\u7EA7\u7531\u951A\u6846\u9762\u79EF\u9690\u5F0F\u51B3\u5B9A\u3002` : `\u6CA1\u6709\u951A\u6846\u8D85\u8FC7 0.7\uFF1AIoU \u6700\u9AD8\u7684 P${u.k} ${om[u.r]}\uFF08${u.iou.toFixed(3)}\uFF09\u6309\u201C\u4E0E\u67D0\u4E2A\u76EE\u6807 IoU \u6700\u9AD8\u201D\u8FD9\u6761\u89C4\u5219\u6210\u4E3A\u6B63\u6837\u672C\u3002`;
  return (0, $.jsxs)("div", {
    className: "fp-page fp-anchor-page",
    children: [(0, $.jsx)("div", {
      className: "fp-frame fp-anchor-scene",
      children: (0, $.jsxs)("svg", {
        ref: e,
        viewBox: `0 0 ${Ct} ${Ne}`,
        className: "fp-svg",
        role: "group",
        "aria-label": `\u76EE\u6807\u6846 ${Math.round(l.w)}\xD7${Math.round(l.h)} \u50CF\u7D20\uFF0C\u6700\u4F73\u951A\u6846\u5728 P${u.k}`,
        children: [(0, $.jsx)(cl, {
          dim: .12
        }), i.filter(b => b.label === "neu").map((b, v) => (0, $.jsx)("rect", {
          ...Ko(b.box),
          fill: "none",
          stroke: x.purple,
          strokeWidth: "3",
          strokeDasharray: "10 6",
          pointerEvents: "none"
        }, `u${v}`)), c.map((b, v) => (0, $.jsx)("rect", {
          ...Ko(b.box),
          fill: x.green,
          fillOpacity: "0.08",
          stroke: x.green,
          strokeWidth: "5",
          pointerEvents: "none"
        }, `p${v}`)), (0, $.jsx)("g", {
          role: "slider",
          tabIndex: 0,
          "aria-label": "拖动目标框",
          "aria-valuenow": Math.round(l.cx),
          "aria-valuemin": 0,
          "aria-valuemax": Ct,
          className: "fp-handle",
          ...r,
          onKeyDown: b => {
            let v = an(b, 8);
            v && a(N => tn({
              ...N,
              cx: N.cx + v[0],
              cy: N.cy + v[1]
            }, 12, 600, 12, 500));
          },
          children: (0, $.jsx)("rect", {
            x: l.cx - l.w / 2,
            y: l.cy - l.h / 2,
            width: l.w,
            height: l.h,
            fill: x.orange,
            fillOpacity: "0.12",
            stroke: x.ink,
            strokeWidth: "4",
            strokeDasharray: "12 7"
          })
        }), (0, $.jsx)("g", {
          role: "slider",
          tabIndex: 0,
          "aria-label": "拖动右下角改变目标框大小",
          "aria-valuenow": Math.round(l.w),
          "aria-valuemin": 12,
          "aria-valuemax": 600,
          className: "fp-handle",
          ...d,
          onKeyDown: b => {
            let v = an(b, 8);
            v && a(N => en(N, N.cx + N.w / 2 + v[0], N.cy + N.h / 2 + v[1], 12, 600, 12, 500));
          },
          children: (0, $.jsx)("rect", {
            x: Math.max(0, l.cx + l.w / 2 - 16),
            y: Math.max(0, l.cy + l.h / 2 - 16),
            width: "32",
            height: "32",
            rx: "7",
            fill: x.orange,
            stroke: "#ffffff",
            strokeWidth: "3"
          })
        })]
      })
    }), (0, $.jsxs)("div", {
      className: "fp-side",
      children: [(0, $.jsx)("div", {
        className: "fp-chips",
        role: "group",
        "aria-label": "目标预设",
        children: ty.map(b => (0, $.jsx)("button", {
          className: "fp-chip",
          onClick: () => h(b),
          children: Rt.find(v => v.id === b).name
        }, b))
      }), (0, $.jsxs)("div", {
        className: "fp-text",
        children: ["目标 ", Math.round(l.w), " × ", Math.round(l.h), " 像素；每层只放一种面积、三种比例的锚框（表头按高:宽表示）"]
      }), (0, $.jsxs)("table", {
        className: "fp-iou fp-text",
        "aria-label": "15 个锚框与目标的 IoU",
        children: [(0, $.jsx)("thead", {
          children: (0, $.jsxs)("tr", {
            children: [(0, $.jsx)("th", {
              children: "层级 · 面积"
            }), om.map(b => (0, $.jsx)("th", {
              children: b
            }, b))]
          })
        }), (0, $.jsx)("tbody", {
          children: rm.map(b => (0, $.jsxs)("tr", {
            children: [(0, $.jsxs)("td", {
              children: [(0, $.jsxs)("b", {
                style: {
                  color: ze[b]
                },
                children: ["P", b]
              }), " · ", sm[b], "²"]
            }), dm.map((v, N) => {
              let p = i.find(o => o.k === b && o.r === N);
              return (0, $.jsx)("td", {
                className: `is-${p.label}`,
                children: p.iou.toFixed(3)
              }, N);
            })]
          }, b))
        })]
      }), (0, $.jsxs)("div", {
        className: "fp-legend fp-text",
        children: [(0, $.jsx)("span", {
          className: "is-pos",
          children: "正样本"
        }), (0, $.jsx)("span", {
          className: "is-neu",
          children: "忽略 0.3–0.7"
        }), (0, $.jsx)("span", {
          className: "is-neg",
          children: "负样本 < 0.3"
        })]
      }), (0, $.jsx)("div", {
        className: `fp-feedback ${f ? "is-good" : ""}`,
        "aria-live": "polite",
        children: g
      })]
    })]
  });
}
var Po = React;
var Wt = React,
  mm = ReactDOM,
  cn = jsxRuntime;
function ly({
  children: t
}) {
  let e = (0, Wt.useRef)(null),
    l = (0, Wt.useRef)(null),
    a = (0, Wt.useRef)(),
    [n, i] = (0, Wt.useState)(null),
    [u, c] = (0, Wt.useState)(!1),
    [f, r] = (0, Wt.useState)({
      left: 12,
      top: 12
    }),
    d = (0, Wt.useId)(),
    h = () => clearTimeout(a.current),
    s = () => {
      h(), i(null), c(!1);
    },
    g = () => {
      h(), u || (a.current = setTimeout(() => {
        e.current?.contains(document.activeElement) || i(null);
      }, 120));
    },
    b = v => v instanceof Element ? v.closest("[data-formula-symbol]") : null;
  return (0, Wt.useLayoutEffect)(() => {
    if (!n || !l.current) return;
    let v = n.getBoundingClientRect(),
      N = l.current.getBoundingClientRect();
    return r({
      left: Math.max(12, Math.min(v.left + v.width / 2 - N.width / 2, window.innerWidth - N.width - 12)),
      top: Math.max(12, Math.min(v.bottom + 10 + N.height > window.innerHeight - 12 ? v.top - N.height - 10 : v.bottom + 10, window.innerHeight - N.height - 12))
    }), n.setAttribute("aria-describedby", d), () => n.removeAttribute("aria-describedby");
  }, [n, d]), (0, Wt.useEffect)(() => {
    if (!n) return;
    let v = p => {
        !e.current?.contains(p.target) && !l.current?.contains(p.target) && s();
      },
      N = p => {
        p.key === "Escape" && s();
      };
    return document.addEventListener("pointerdown", v), document.addEventListener("keydown", N), document.addEventListener("fullscreenchange", s), window.addEventListener("resize", s), window.addEventListener("scroll", s, !0), () => {
      document.removeEventListener("pointerdown", v), document.removeEventListener("keydown", N), document.removeEventListener("fullscreenchange", s), window.removeEventListener("resize", s), window.removeEventListener("scroll", s, !0), h();
    };
  }, [n]), (0, cn.jsxs)("span", {
    ref: e,
    className: "formula-symbols",
    onPointerOver: v => {
      let N = b(v.target);
      N && (h(), i(N));
    },
    onPointerOut: g,
    onFocus: v => {
      let N = b(v.target);
      N && (h(), i(N));
    },
    onBlur: v => {
      !e.current?.contains(v.relatedTarget) && !u && s();
    },
    onClick: v => {
      let N = b(v.target);
      N && (h(), u && n === N ? s() : (i(N), c(!0)));
    },
    onKeyDown: v => {
      (v.key === "Enter" || v.key === " ") && b(v.target) && (v.preventDefault(), v.target.click());
    },
    children: [t, n && (0, mm.createPortal)((0, cn.jsx)("div", {
      ref: l,
      id: d,
      role: "tooltip",
      className: "formula-symbol-tooltip",
      style: f,
      onPointerEnter: h,
      onPointerLeave: g,
      children: n.dataset.formulaMeaning
    }), document.fullscreenElement ?? document.body)]
  });
}
function Ge({
  children: t,
  meaning: e
}) {
  return (0, cn.jsx)(ly, {
    children: (0, cn.jsx)("span", {
      className: "formula-symbol",
      tabIndex: 0,
      role: "button",
      "aria-label": e,
      "data-formula-symbol": "",
      "data-formula-meaning": e,
      children: t
    })
  });
}
var M = jsxRuntime,
  ay = 800,
  ny = [1e3, 1216, 1333],
  iy = {
    2: 256,
    3: 512,
    4: 1024,
    5: 2048
  },
  uy = [2, 3, 4, 5],
  Iu = t => t >= 1e5 ? `${(t / 1e3).toFixed(0)}k` : `${(t / 1e3).toFixed(1)}k`;
function PyramidArchitecture() {
  const [width, setWidth] = React.useState(1000);
  const [level, setLevel] = React.useState(5);
  const shape = k => [Math.ceil(800 / 2 ** k), Math.ceil(width / 2 ** k)];
  const count = k => shape(k)[0] * shape(k)[1];
  const total = [2, 3, 4, 5, 6].reduce((sum, k) => sum + count(k) * 3, 0);
  const rows = [['(a) C4', count(4) * 15, '47k'], ['(b) C5', count(5) * 15, '12k'], ['(c) FPN', total, '200k'], ['(f) only P2', count(2) * 15, '750k']];
  const y = k => 500 - (k - 2) * 112;
  const [height, cellsWide] = shape(level);
  const activate = (event, k) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setLevel(k);
    }
  };
  return <div className="fp-page fp-arch-page">
      <div className="fp-frame fp-arch-diagram">
        <svg viewBox="0 0 940 610" className="fp-svg" role="group" aria-label="FPN：C 阶段、融合中间图 M、自顶向下递归，以及独立 3×3 输出 P">
          <defs><marker id="fp-arch-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#68778f" /></marker></defs>
          <rect width="940" height="610" fill="#f7f9fb" />
          <text x="95" y="34" textAnchor="middle" fontSize="23" fill={x.ink}>骨干阶段 C</text>
          <text x="455" y="34" textAnchor="middle" fontSize="23" fill={x.ink}>融合中间图 M</text>
          <text x="775" y="34" textAnchor="middle" fontSize="23" fill={x.ink}>预测特征 P</text>
          {[2, 3, 4, 5].map(k => <g key={k} role="button" tabIndex={0} aria-label={'查看第 ' + k + ' 层'} aria-pressed={level === k} className="fp-hot" onClick={() => setLevel(k)} onKeyDown={event => activate(event, k)}>
            <rect x="42" y={y(k) - 29} width="106" height="58" rx="8" fill={ze[k]} stroke={level === k ? x.orange : 'none'} strokeWidth="4" />
            <text x="95" y={y(k) + 9} textAnchor="middle" fontSize="26" fill="white">C{k}</text>
            <path d={`M150 ${y(k)} H205`} fill="none" stroke={x.muted} strokeWidth="2" markerEnd="url(#fp-arch-arrow)" />
            <rect x="208" y={y(k) - 23} width="78" height="46" rx="8" fill="white" stroke={x.axis} />
            <text x="247" y={y(k) + 8} textAnchor="middle" fontSize="22" fill={x.ink}>1×1</text>
            <path d={`M288 ${y(k)} H${k === 5 ? 401 : 351}`} fill="none" stroke={x.muted} strokeWidth="2" markerEnd="url(#fp-arch-arrow)" />
            {k < 5 && <><circle cx="368" cy={y(k)} r="17" fill="white" stroke={x.muted} /><text x="368" y={y(k) + 8} textAnchor="middle" fontSize="25" fill={x.ink}>+</text><path d={`M385 ${y(k)} H401`} fill="none" stroke={x.muted} strokeWidth="2" /><path d={`M455 ${y(k + 1) + 30} V${y(k + 1) + 55} H368 V${y(k) - 19}`} fill="none" stroke={x.blue} strokeWidth="2.5" markerEnd="url(#fp-arch-arrow)" /><text x="348" y={y(k) - 44} textAnchor="end" fontSize="20" fill={x.blue}>↑ 对齐尺寸</text></>}
            <rect x="404" y={y(k) - 29} width="102" height="58" rx="8" fill={ze[k]} stroke={level === k ? x.orange : 'none'} strokeWidth="4" />
            <text x="455" y={y(k) + 9} textAnchor="middle" fontSize="26" fill="white">M{k}</text>
            <path d={`M508 ${y(k)} H581`} fill="none" stroke={x.muted} strokeWidth="2" markerEnd="url(#fp-arch-arrow)" />
            <rect x="584" y={y(k) - 23} width="78" height="46" rx="8" fill="white" stroke={x.axis} /><text x="623" y={y(k) + 8} textAnchor="middle" fontSize="22" fill={x.ink}>3×3</text>
            <path d={`M664 ${y(k)} H721`} fill="none" stroke={x.muted} strokeWidth="2" markerEnd="url(#fp-arch-arrow)" />
            <rect x="724" y={y(k) - 29} width="102" height="58" rx="8" fill={ze[k]} stroke={level === k ? x.orange : 'none'} strokeWidth="4" />
            <text x="775" y={y(k) + 9} textAnchor="middle" fontSize="26" fill="white">P{k}</text>
            <text x="850" y={y(k) + 7} fontSize="20" fill={x.muted}>s={2 ** k}</text>
          </g>)}
          <rect x="739" y="65" width="72" height="38" rx="7" fill={ze[6]} /><text x="775" y="92" textAnchor="middle" fontSize="24" fill="white">P6</text>
          <path d="M775 133 V107" fill="none" stroke={x.purple} strokeWidth="2" markerEnd="url(#fp-arch-arrow)" />
          <text x="725" y="88" textAnchor="end" fontSize="19" fill={x.purple}>P5 步长 2 下采样</text>
          <text x="830" y="90" fontSize="19" fill={x.purple}>仅 RPN</text>
          <text x="35" y="573" fontSize="21" fill={x.muted}>M 是导读记号；递归取 M，不把已输出的 P 反复送入 3×3。</text>
        </svg>
      </div>
      <div className="fp-side fp-arch-side">
        <div className="fp-build-stepper" role="group" aria-label="逐层构建金字塔">
          <button type="button" className="fp-chip" disabled={level === 5} onClick={() => setLevel(value => Math.min(5, value + 1))}>上一层</button>
          <span className="fp-build-progress" role="status">步骤 {6 - level} / 4 · 构建 P{level}</span>
          <button type="button" className="fp-chip" disabled={level === 2} onClick={() => setLevel(value => Math.max(2, value - 1))}>下一层</button>
        </div>
        <p className="fp-build-caption">按 P5 → P4 → P3 → P2 依次查看；点击结构图也可直接选层。高亮表示当前讲解步骤，不是训练进度。</p>
        <div className="fp-row"><span className="fp-text fp-label">示例输入</span><div className="fp-chips" role="group" aria-label="输入图像宽度">{ny.map(value => <button key={value} className={'fp-chip ' + (width === value ? 'is-on' : '')} aria-pressed={width === value} onClick={() => setWidth(value)}>800 × {value}</button>)}</div></div>
        <div className="fp-path fp-text" aria-live="polite"><b>C{level}</b>：{height} × {cellsWide} × {iy[level]}<br />1×1 投影 → 256 通道<br />{level < 5 ? <>与上层 <b>M{level + 1}</b> 最近邻上采样并对齐后相加</> : <>M5 由 C5 的 1×1 投影得到</>}<br />得到 M{level} → 3×3 → <b>P{level}</b>：{height} × {cellsWide} × 256</div>
        <p className="fp-text fp-tight fp-muted">图中“对齐尺寸”是奇数宽高的实现处理。例如输入 800×1000 时 C5 宽 32、C4 宽 63，严格 ×2 会得到 64；实际需按横向特征尺寸对齐。论文描述最近邻 ×2，没有规定这一工程细节。</p>
        <div className="fp-h">锚框数：尺寸规则下的推算</div>
        <table className="fp-table fp-text"><thead><tr><th>表 1 行</th><th>本页推算</th><th>原文量级</th></tr></thead><tbody>{rows.map(([label, value, paper]) => <tr key={label}><td>{label}</td><td>{value.toLocaleString('en-US')}</td><td>{paper}</td></tr>)}</tbody></table>
        <p className="fp-text fp-tight fp-muted">单层基线每位置 5 尺度 × 3 比例 = 15 框；FPN 每层每位置 3 框。尺寸采用向上取整；论文未报告计数所用输入宽度，800×1000 的吻合仅说明量级一致。C2–C5 通道数来自所采用的 ResNet 骨干配置。</p>
      </div>
    </div>;
}
var gi = React;
var q = jsxRuntime,
  cy = ["car", "bus", "ferry", "stadium"],
  gm = 30,
  fy = 650,
  Oe = t => gm + (Math.log2(t) - 4) / 6 * (fy - gm);
function RoiAssignment(t) {
  let e = (0, gi.useRef)(null),
    [l, a] = (0, gi.useState)({
      ...Rt.find(o => o.id === "ferry").box
    }),
    n = (0, gi.useRef)({
      dx: 0,
      dy: 0
    }),
    i = assignRoiLevel(l.w, l.h),
    u = i.clamped,
    c = Ia[u],
    f = l.w / c,
    r = l.h / c,
    d = ln(e, {
      start: (o, m) => {
        n.current = {
          dx: l.cx - o,
          dy: l.cy - m
        };
      },
      move: (o, m) => a(y => tn({
        ...y,
        cx: o + n.current.dx,
        cy: m + n.current.dy
      }, 10, 760, 10, 640))
    }),
    h = ln(e, {
      move: (o, m) => a(y => en(y, o, m, 10, 760, 10, 640))
    }),
    s = l.cx - l.w / 2,
    g = l.cy - l.h / 2,
    b = g >= 48 ? g - 44 : g + 6,
    v = "";
  for (let o = Math.ceil(s / c) * c; o < s + l.w; o += c) v += `M${o} ${g} V${g + l.h} `;
  for (let o = Math.ceil(g / c) * c; o < g + l.h; o += c) v += `M${s} ${o} H${s + l.w} `;
  let N = "";
  for (let o = 1; o < 7; o++) N += `M${s + l.w * o / 7} ${g} V${g + l.h} M${s} ${g + l.h * o / 7} H${s + l.w} `;
  let p = i.k !== u ? `\u539F\u59CB k = ${i.k}\uFF0C\u8D85\u51FA P2\u2013P5\uFF1B\u5B9E\u73B0\u4E2D\u4E00\u822C\u622A\u65AD\u5230 P${u}\uFF08\u8BBA\u6587\u6B63\u6587\u672A\u5199\u660E\uFF09\u3002` : `\u8BE5 RoI \u5728 P${u} \u4E0A\u7EA6 ${f.toFixed(1)} \xD7 ${r.toFixed(1)} \u683C\uFF0C\u518D\u6C60\u5316\u6210 7 \xD7 7\u3002`;
  return (0, q.jsxs)("div", {
    className: "fp-page fp-assign-page",
    children: [(0, q.jsx)("div", {
      className: "fp-frame fp-assign-scene",
      children: (0, q.jsxs)("svg", {
        ref: e,
        viewBox: `0 0 ${Ct} ${Ne}`,
        className: "fp-svg",
        role: "group",
        "aria-label": `RoI ${Math.round(l.w)}\xD7${Math.round(l.h)} \u50CF\u7D20\uFF0C\u5206\u914D\u5230 P${u}`,
        children: [(0, q.jsx)(cl, {
          dim: .2
        }), (0, q.jsx)("path", {
          d: v,
          stroke: ze[u],
          strokeWidth: c < 8 ? .8 : 1.4,
          opacity: "0.75",
          pointerEvents: "none"
        }), (0, q.jsx)("path", {
          d: N,
          stroke: x.green,
          strokeWidth: "2",
          strokeDasharray: "5 5",
          opacity: "0.9",
          pointerEvents: "none"
        }), (0, q.jsx)("g", {
          role: "slider",
          tabIndex: 0,
          "aria-label": "拖动 RoI",
          "aria-valuetext": `中心 (${Math.round(l.cx)}, ${Math.round(l.cy)})，宽 ${Math.round(l.w)}、高 ${Math.round(l.h)} 像素`,
          "aria-valuenow": Math.round(l.cx),
          "aria-valuemin": 0,
          "aria-valuemax": Ct,
          className: "fp-handle",
          ...d,
          onKeyDown: o => {
            let m = an(o, 8);
            m && a(y => tn({
              ...y,
              cx: y.cx + m[0],
              cy: y.cy + m[1]
            }, 10, 760, 10, 640));
          },
          children: (0, q.jsx)("rect", {
            x: s,
            y: g,
            width: l.w,
            height: l.h,
            fill: x.orange,
            fillOpacity: "0.08",
            stroke: x.green,
            strokeWidth: "5"
          })
        }), (0, q.jsx)("g", {
          role: "slider",
          tabIndex: 0,
          "aria-label": "拖动右下角改变 RoI 大小",
          "aria-valuetext": `宽 ${Math.round(l.w)}、高 ${Math.round(l.h)} 像素`,
          "aria-valuenow": Math.round(l.w),
          "aria-valuemin": 10,
          "aria-valuemax": 760,
          className: "fp-handle",
          ...h,
          onKeyDown: o => {
            let m = an(o, 10);
            m && a(y => en(y, y.cx + y.w / 2 + m[0], y.cy + y.h / 2 + m[1], 10, 760, 10, 640));
          },
          children: (0, q.jsx)("rect", {
            x: Math.max(0, s + l.w - 18),
            y: Math.max(0, g + l.h - 18),
            width: "36",
            height: "36",
            rx: "8",
            fill: x.orange,
            stroke: "#ffffff",
            strokeWidth: "3"
          })
        }), (0, q.jsxs)("g", {
          pointerEvents: "none",
          children: [(0, q.jsx)("rect", {
            x: s + (b > g ? 6 : 0),
            y: b,
            width: "74",
            height: "40",
            rx: "8",
            fill: ze[u]
          }), (0, q.jsxs)("text", {
            x: s + (b > g ? 6 : 0) + 37,
            y: b + 30,
            textAnchor: "middle",
            fontSize: "28",
            fontWeight: "700",
            fill: "#ffffff",
            children: ["P", u]
          })]
        })]
      })
    }), (0, q.jsxs)("div", {
      className: "fp-side",
      children: [(0, q.jsx)("div", {
        className: "fp-chips",
        role: "group",
        "aria-label": "RoI 预设",
        children: cy.map(o => (0, q.jsx)("button", {
          className: "fp-chip",
          onClick: () => a({
            ...Rt.find(m => m.id === o).box
          }),
          children: Rt.find(m => m.id === o).name
        }, o))
      }), <div className="fp-roi-fields fp-row" key="roi-number-inputs">
          <label>宽 w <input type="number" min="10" max="760" step="1" value={Math.round(l.w)} onChange={event => {
            const value = Number(event.target.value);
            if (Number.isFinite(value) && value >= 10) a(box => tn({
              ...box,
              w: value
            }, 10, 760, 10, 640));
          }} /> px</label>
          <label>高 h <input type="number" min="10" max="640" step="1" value={Math.round(l.h)} onChange={event => {
            const value = Number(event.target.value);
            if (Number.isFinite(value) && value >= 10) a(box => tn({
              ...box,
              h: value
            }, 10, 760, 10, 640));
          }} /> px</label>
        </div>, <div className="fp-chips" role="group" aria-label="公式边界示例" key="roi-boundaries">{[55, 56, 112, 224, 448].map(size => <button key={size} className="fp-chip" onClick={() => a(box => tn({
          ...box,
          w: size,
          h: size
        }, 10, 760, 10, 640))}>{size} × {size}</button>)}</div>, (0, q.jsxs)("div", {
        className: "fp-formula fp-em",
        children: [(0, q.jsx)(Ge, {
          meaning: "k：RoI 被分配到的金字塔层级 P_k。",
          children: "k"
        }), " = ⌊", (0, q.jsxs)(Ge, {
          meaning: "k0 = 4：224×224 的 RoI 对应第 4 层，与基于 ResNet 的 Faster R-CNN 使用 C4 一致。",
          children: ["k", (0, q.jsx)("sub", {
            children: "0"
          })]
        }), " + log", (0, q.jsx)("sub", {
          children: "2"
        }), "(√", (0, q.jsx)(Ge, {
          meaning: "w、h：RoI 在输入图像上的宽和高（像素）。",
          children: "wh"
        }), " / ", (0, q.jsx)(Ge, {
          meaning: "224：ImageNet 预训练的标准输入尺寸。",
          children: "224"
        }), ")⌋"]
      }), (0, q.jsxs)("div", {
        className: "fp-text fp-sub",
        children: ["= ⌊4 + log", (0, q.jsx)("sub", {
          children: "2"
        }), "(", i.scale.toFixed(0), " / 224)⌋ = ⌊", i.raw.toFixed(2), "⌋ = ", (0, q.jsx)("b", {
          style: {
            color: ze[u]
          },
          children: i.k
        })]
      }), <div className="fp-text fp-feedback" aria-live="polite" key="roi-raw-used">原式：k_raw = {i.k}；有限层处理：k_used = min(5, max(2, k_raw)) = {u}。裁至 [2,5] 是本导读的实现约定，不属于原文式 (1)。</div>, (0, q.jsx)("div", {
        className: "fp-text fp-muted fp-ruler-label",
        children: "√(wh)，像素（对数刻度）"
      }), (0, q.jsxs)("svg", {
        viewBox: "0 0 680 124",
        className: "fp-svg fp-ruler",
        role: "img",
        "aria-label": `\u221A(wh) = ${i.scale.toFixed(0)} \u50CF\u7D20\uFF0C\u4F4D\u4E8E P${u} \u533A\u95F4`,
        children: [[{
          k: 2,
          a: 16,
          b: 112
        }, {
          k: 3,
          a: 112,
          b: 224
        }, {
          k: 4,
          a: 224,
          b: 448
        }, {
          k: 5,
          a: 448,
          b: 1024
        }].map(o => (0, q.jsxs)("g", {
          children: [(0, q.jsx)("rect", {
            x: Oe(o.a),
            y: "22",
            width: Oe(o.b) - Oe(o.a),
            height: "44",
            fill: ze[o.k],
            opacity: o.k === u ? 1 : .35
          }), (0, q.jsxs)("text", {
            x: (Oe(o.a) + Oe(o.b)) / 2,
            y: "54",
            textAnchor: "middle",
            fontSize: "26",
            fontWeight: "700",
            fill: "#ffffff",
            children: ["P", o.k]
          })]
        }, o.k)), [56, 112, 224, 448].map(o => (0, q.jsxs)("g", {
          children: [(0, q.jsx)("line", {
            x1: Oe(o),
            x2: Oe(o),
            y1: "66",
            y2: "78",
            stroke: x.muted,
            strokeWidth: "2"
          }), (0, q.jsx)("text", {
            x: Oe(o),
            y: "104",
            textAnchor: "middle",
            fontSize: "24",
            fill: x.muted,
            children: o
          })]
        }, o)), (0, q.jsx)("path", {
          d: `M${Oe(oe(i.scale, 16, 1024))} 22 l-10 -14 h20 Z`,
          fill: x.orange
        }), (0, q.jsx)("line", {
          x1: Oe(oe(i.scale, 16, 1024)),
          x2: Oe(oe(i.scale, 16, 1024)),
          y1: "18",
          y2: "70",
          stroke: x.orange,
          strokeWidth: "4"
        })]
      }), (0, q.jsx)("div", {
        className: "fp-feedback is-good",
        "aria-live": "polite",
        children: p
      }), (0, q.jsx)("p", {
        className: "fp-text fp-tight fp-muted",
        children: "当宽、高同时减半，原式 k_raw 减 1；裁至 P2–P5 后，边界层可能不再变化。输入是缩放后图像上的 RoI 像素尺寸。"
      })]
    })]
  });
}
var Io = React;
var k = jsxRuntime,
  cocoBenchmarkRows = [{
    id: "ours",
    name: "Faster R-CNN on FPN",
    backbone: "ResNet-101",
    year: "本文",
    pyramid: !1,
    ours: !0,
    v: [59.1, 36.2, 18.2]
  }, {
    id: "attr",
    name: "AttractioNet",
    backbone: "VGG16 + Wide ResNet",
    year: "2016",
    pyramid: !0,
    v: [53.4, 35.7, 15.6]
  }, {
    id: "frcnn",
    name: "Faster R-CNN +++",
    backbone: "ResNet-101",
    year: "2015",
    pyramid: !0,
    v: [55.7, 34.9, 15.6]
  }, {
    id: "grmi",
    name: "G-RMI",
    backbone: "Inception-ResNet",
    year: "2016",
    pyramid: null,
    v: [null, 34.7, null]
  }, {
    id: "multi",
    name: "Multipath",
    backbone: "VGG-16",
    year: "2015",
    pyramid: null,
    minival: !0,
    v: [49.6, 31.5, null]
  }, {
    id: "ion",
    name: "ION",
    backbone: "VGG-16",
    year: "2015",
    pyramid: null,
    v: [53.4, 31.2, 12.8]
  }],
  bm = ["AP@.5", "AP", "AP 小目标"];
function CocoBenchmark(t) {
  let [e, l] = (0, Io.useState)(1),
    [a, n] = (0, Io.useState)("ours"),
    i = cocoBenchmarkRows.find(c => c.id === a),
    u = 60;
  return (0, k.jsxs)("div", {
    className: "fp-page fp-coco-page",
    children: [(0, k.jsxs)("div", {
      className: "fp-panel fp-coco-chart",
      children: [(0, k.jsxs)("div", {
        className: "fp-chips",
        role: "group",
        "aria-label": "指标",
        children: [(0, k.jsx)("svg", {
          viewBox: "-70 -110 140 210",
          className: "fp-chip-icon",
          "aria-hidden": "true",
          children: (0, k.jsx)(Ye, {
            x: 0,
            y: 0,
            zoom: 1
          })
        }), bm.map((c, f) => (0, k.jsx)("button", {
          className: `fp-chip ${f === e ? "is-on" : ""}`,
          "aria-pressed": f === e,
          onClick: () => l(f),
          children: c
        }, c))]
      }), <MobileBarChart key="mobile-results" rows={cocoBenchmarkRows.map(row => ({
        id: row.id, label: row.name, value: row.v[e],
        color: row.ours ? x.green : '#7f8ea3',
        meta: `${row.minival ? 'minival*' : 'test-dev'} · ${row.backbone}`
      }))} selected={a} onPick={n} metric={bm[e]} maximum={60}
        label={`表 4 COCO 对比：${bm[e]}`}
        note="未报告的指标不绘制条形。Multipath 使用 minival，与其他行的 test-dev 结果口径不同。" />, (0, k.jsxs)("svg", {
        viewBox: "0 0 860 380",
        className: "fp-svg fp-desktop-chart",
        role: "group",
        "aria-label": `表 4 ${bm[e]}：Multipath 为 minival，其余为 test-dev`,
        children: [[0, 20, 40, 60].map(c => (0, k.jsxs)("g", {
          children: [(0, k.jsx)("line", {
            x1: 330 + c / u * 470,
            x2: 330 + c / u * 470,
            y1: "4",
            y2: "340",
            stroke: x.axis
          }), (0, k.jsx)("text", {
            x: 330 + c / u * 470,
            y: "368",
            textAnchor: "middle",
            fontSize: "24",
            fill: x.muted,
            children: c
          })]
        }, c)), cocoBenchmarkRows.map((c, f) => {
          let r = c.id === a,
            d = c.v[e],
            h = 10 + f * 55,
            s = c.ours ? x.green : "#7f8ea3";
          return (0, k.jsxs)("g", {
            role: "button",
            tabIndex: 0,
            "aria-pressed": r,
            "aria-label": `${c.name}\uFF1A${d ?? "未报告"}`,
            className: "fp-hot",
            onClick: () => n(c.id),
            onKeyDown: g => {
              (g.key === "Enter" || g.key === " ") && (g.preventDefault(), n(c.id));
            },
            children: [(0, k.jsx)("rect", {
              x: "0",
              y: h - 4,
              width: "860",
              height: "50",
              rx: "8",
              fill: c.minival ? "#fff3e1" : r ? "#fff4ec" : "transparent"
            }), (0, k.jsxs)("text", {
              x: "320",
              y: h + 28,
              textAnchor: "end",
              fontSize: "25",
              fontWeight: r || c.ours ? 700 : 400,
              fill: r ? x.ink : x.muted,
              children: [c.name, c.minival ? " · minival*" : ""]
            }), d !== null ? (0, k.jsxs)(k.Fragment, {
              children: [(0, k.jsx)("rect", {
                x: "330",
                y: h + 6,
                width: d / u * 470,
                height: "30",
                rx: "5",
                fill: s,
                opacity: r ? 1 : .55
              }), (0, k.jsx)("text", {
                x: 330 + d / u * 470 + 8,
                y: h + 30,
                fontSize: "25",
                fontWeight: "700",
                fill: r ? x.ink : x.muted,
                children: d.toFixed(1)
              })]
            }) : (0, k.jsx)("text", {
              x: "340",
              y: h + 30,
              fontSize: "25",
              fill: x.muted,
              children: "未报告"
            })]
          }, c.id);
        })]
      }), (0, k.jsx)("p", {
        className: "fp-text fp-tight fp-muted",
        children: "* Multipath 为 minival 结果，与其他行的 test-dev 口径不同。"
      })]
    }), (0, k.jsxs)("div", {
      className: "fp-side",
      children: [<label className="fp-mobile-choice" key="method-select">选择对比方法
        <select className="fp-mobile-select" aria-label="选择对比方法" value={a} onChange={event => n(event.target.value)}>
          {cocoBenchmarkRows.map(row => <option key={row.id} value={row.id}>{row.name}{row.minival ? ' · minival' : ''}</option>)}
        </select>
      </label>, (0, k.jsxs)("div", {
        className: `fp-feedback ${i.ours ? "is-good" : ""}`,
        "aria-live": "polite",
        children: [(0, k.jsx)("b", {
          children: i.name
        }), "（", i.backbone, i.ours ? "" : `，${i.year} 竞赛`, "）", i.pyramid === !0 ? "：使用图像金字塔。" : i.ours ? "：单尺度输入，不用图像金字塔，也不用迭代回归、难例挖掘等技巧。" : "。", i.id === 'attr' ? ' 表 4 脚注：提案使用 VGG-16，检测使用 Wide ResNet，因此严格说不是单模型结果。' : '']
      }), (0, k.jsx)("div", {
        className: "fp-h",
        children: "速度（单张 NVIDIA M40）"
      }), (0, k.jsxs)("div", {
        className: "fp-speed fp-text",
        children: [(0, k.jsxs)("div", {
          children: [(0, k.jsx)("span", {
            children: "ResNet-50 + FPN（共享特征）"
          }), (0, k.jsx)("b", {
            className: "is-good",
            children: "0.165 s"
          })]
        }), (0, k.jsxs)("div", {
          children: [(0, k.jsx)("span", {
            children: "ResNet-101 + FPN（共享特征）"
          }), (0, k.jsx)("b", {
            className: "is-good",
            children: "0.19 s"
          })]
        }), (0, k.jsxs)("div", {
          children: [(0, k.jsx)("span", {
            children: "单尺度 ResNet-50 基线"
          }), (0, k.jsx)("b", {
            children: "0.32 s"
          })]
        })]
      }), (0, k.jsx)("div", {
        className: "fp-h",
        children: "表 5 · 共享特征（minival）"
      }), (0, k.jsxs)("div", {
        className: "fp-speed fp-text",
        children: [(0, k.jsxs)("div", {
          children: [(0, k.jsx)("span", {
            children: "ResNet-50 不共享 → 共享"
          }), (0, k.jsx)("b", {
            children: "33.9 → 34.3"
          })]
        }), (0, k.jsxs)("div", {
          children: [(0, k.jsx)("span", {
            children: "ResNet-101 共享"
          }), (0, k.jsx)("b", {
            children: "35.2"
          })]
        })]
      })]
    })]
  });
}
var tc = React,
  tr = (0, tc.createContext)({
    progress: 1,
    playing: !1
  }),
  Sm = () => (0, tc.useContext)(tr);
var zt = jsxRuntime,
  Ft = {
    x: 0,
    y: 110,
    w: 1e3,
    h: 640
  },
  er = Rt.filter(t => t.id !== "person");
function oy(t, e, l = 1.3) {
  let a = (Math.max(t.w, t.h) * l + e * 2) / 2,
    n = Math.max(Ft.x + 4, t.cx - a),
    i = Math.min(Ft.x + Ft.w - 4, t.cx + a),
    u = Math.max(Ft.y + 44, t.cy - a),
    c = Math.min(Ft.y + Ft.h - 4, t.cy + a);
  return {
    cx: (n + i) / 2,
    cy: (u + c) / 2,
    w: i - n,
    h: c - u
  };
}
function CoverScene({
  moduleId: t
}) {
  let {
      progress: e
    } = Sm(),
    l = t === "newMethod",
    a = oe((e - .06) / .72, 0, 1),
    n = e > .8;
  if (!l) {
    let c = Math.floor(a * er.length + .001);
    return (0, zt.jsxs)("div", {
      className: "fp-cover",
      children: [(0, zt.jsxs)("svg", {
        viewBox: `${Ft.x} ${Ft.y} ${Ft.w} ${Ft.h}`,
        preserveAspectRatio: "xMidYMid meet",
        role: "img",
        "aria-label": "只用一张步长 32 的特征图：小汽车和公交车不足或刚到一两个格子",
        children: [(0, zt.jsx)(cl, {}), (0, zt.jsx)(mi, {
          x: 0,
          y: 0,
          w: 1e3,
          h: 800,
          cell: 32,
          opacity: .75,
          width: 1.2
        }), er.slice(0, c).map(f => {
          let d = Math.sqrt(f.box.w * f.box.h) / 32 < 2;
          return (0, zt.jsx)("g", {
            children: (0, zt.jsx)("rect", {
              x: f.box.cx - f.box.w / 2,
              y: f.box.cy - f.box.h / 2,
              width: f.box.w,
              height: f.box.h,
              fill: d ? x.red : "none",
              fillOpacity: d ? .18 : 0,
              stroke: d ? x.red : x.blue,
              strokeWidth: d ? 4 : 5,
              strokeDasharray: d ? "8 6" : void 0
            })
          }, f.id);
        })]
      }), (0, zt.jsx)("div", {
        className: `fp-cover-result ${n ? "is-old" : ""}`,
        "aria-live": "polite",
        children: n ? "小汽车在步长 32 的图上不到 1 格" : "在单一粗网格上逐格查找……"
      })]
    });
  }
  let i = [...er].sort((c, f) => f.box.w * f.box.h - c.box.w * c.box.h),
    u = a * i.length;
  return (0, zt.jsxs)("div", {
    className: "fp-cover",
    children: [(0, zt.jsxs)("svg", {
      viewBox: `${Ft.x} ${Ft.y} ${Ft.w} ${Ft.h}`,
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-label": "特征金字塔：体育场交给 P4，渡轮交给 P3，公交车和小汽车交给 P2",
      children: [(0, zt.jsx)(cl, {}), i.map((c, f) => {
        let r = oe(u - f, 0, 1);
        if (r <= 0) return null;
        let d = assignRoiLevel(c.box.w, c.box.h).clamped,
          h = Ia[d],
          s = oy(c.box, h),
          g = ze[d],
          b = s.cx - s.w / 2 + (s.w < 140 ? 0 : 6),
          v = s.w < 140 ? s.cy - s.h / 2 - 42 : s.cy - s.h / 2 + 6;
        return (0, zt.jsxs)("g", {
          opacity: Math.min(1, r * 2),
          children: [(0, zt.jsx)("rect", {
            x: s.cx - s.w / 2,
            y: s.cy - s.h / 2,
            width: s.w,
            height: s.h,
            rx: "10",
            fill: g,
            fillOpacity: "0.08",
            stroke: g,
            strokeWidth: "2"
          }), (0, zt.jsx)(mi, {
            x: s.cx - s.w / 2,
            y: s.cy - s.h / 2,
            w: Math.floor(s.w / h) * h,
            h: Math.floor(s.h / h) * h,
            cell: h,
            color: g,
            opacity: .55,
            width: h < 8 ? .6 : 1
          }), (0, zt.jsx)("rect", {
            x: c.box.cx - c.box.w / 2,
            y: c.box.cy - c.box.h / 2,
            width: c.box.w,
            height: c.box.h,
            fill: "none",
            stroke: x.green,
            strokeWidth: "5"
          }), (0, zt.jsx)("rect", {
            x: b,
            y: v,
            width: "64",
            height: "36",
            rx: "8",
            fill: g
          }), (0, zt.jsxs)("text", {
            x: b + 32,
            y: v + 28,
            textAnchor: "middle",
            fontSize: "26",
            fontWeight: "700",
            fill: "#ffffff",
            children: ["P", d]
          })]
        }, c.id);
      })]
    }), (0, zt.jsx)("div", {
      className: `fp-cover-result ${n ? "is-new" : ""}`,
      "aria-live": "polite",
      children: n ? "大目标用粗层，小目标用细层" : "按目标大小选择金字塔层级……"
    })]
  });
}
var lr = React;
var W = jsxRuntime,
  fastRcnnRows = [{
    id: "a",
    name: "(a) conv4 基线",
    feat: "C4",
    head: "conv5",
    v: [54.7, 31.9, 15.7]
  }, {
    id: "b",
    name: "(b) conv5 基线",
    feat: "C5",
    head: "2fc",
    v: [52.9, 28.8, 11.9]
  }, {
    id: "c",
    name: "(c) FPN",
    feat: "{Pk}",
    head: "2fc",
    v: [56.9, 33.9, 17.8]
  }, {
    id: "d",
    name: "(d) 自底向上金字塔",
    feat: "{Pk}",
    head: "2fc",
    v: [44.9, 24.9, 10.9]
  }, {
    id: "e",
    name: "(e) 自顶向下、无横向",
    feat: "{Pk}",
    head: "2fc",
    v: [54, 31.3, 13.3]
  }, {
    id: "f",
    name: "(f) 只用 P2",
    feat: "P2",
    head: "2fc",
    v: [56.3, 33.4, 17.3]
  }],
  fasterRcnnRows = [{
    id: "*",
    name: "(*) He 等人的基线",
    feat: "C4",
    head: "conv5",
    v: [47.3, 26.3, null]
  }, {
    id: "a",
    name: "(a) conv4 基线",
    feat: "C4",
    head: "conv5",
    v: [53.1, 31.6, 13.2]
  }, {
    id: "b",
    name: "(b) conv5 基线",
    feat: "C5",
    head: "2fc",
    v: [51.7, 28, 9.6]
  }, {
    id: "c",
    name: "(c) FPN",
    feat: "{Pk}",
    head: "2fc",
    v: [56.9, 33.9, 17.8]
  }],
  Am = ["AP@0.5", "AP", "AP 小目标"],
  ry = {
    "t2-a": "单尺度 C4 + conv5 头的强基线。",
    "t2-b": "C5 + 2fc：FPN 比它高 5.1 AP。",
    "t2-c": "比 (a) 高 2.0 AP，小目标 AP 高 2.1。",
    "t2-d": "去掉自顶向下后明显变差：高分辨率层上的低层特征不利于 Fast R-CNN。",
    "t2-e": "去掉横向连接也更差。",
    "t2-f": "只用 P2 接近但仍低于完整 FPN。",
    "t3-*": "原论文 He 等人报告的结果（图像短边 600、每图 64 个 RoI 等设置不同）。",
    "t3-a": "本文复现的强基线：短边 800、每图 512 个 RoI、5 种面积锚框、测试 1000 个候选框。",
    "t3-b": "C5 单尺度 + 2fc 头。",
    "t3-c": "比强基线 (a) 高 2.3 AP、3.8 AP@0.5。"
  };
function Em({
  rows: t,
  table: e,
  metric: l,
  sel: a,
  onPick: n
}) {
  return <><MobileBarChart rows={t.map(row => ({
    id: `${e}-${row.id}`, label: row.name, value: row.v[l],
    color: row.id === 'c' ? x.green : row.id === 'a' || row.id === 'b' || row.id === '*' ? x.red : '#7f8ea3',
    meta: `特征 ${row.feat} · 检测头 ${row.head}`
  }))} selected={a} onPick={n} metric={Am[l]} maximum={60}
    label={`${e === 't2' ? '表 2 Fast R-CNN' : '表 3 Faster R-CNN'}：${Am[l]}`}
    note={e === 't3' ? '表 3 的 (*) 为 He 等人的原始基线，训练与测试设置不同；点击该行查看说明。未报告指标不绘制条形。' : '表 2 使用固定候选框；点击条形查看对应结构的结果与解释。'} />{(0, W.jsxs)("svg", {
    viewBox: `0 0 680 ${t.length * 54 + 44}`,
    className: "fp-svg fp-desktop-chart",
    role: "group",
    "aria-label": `${e === "t2" ? "表 2" : "表 3"} ${Am[l]}`,
    children: [[0, 20, 40, 60].map(c => (0, W.jsxs)("g", {
      children: [(0, W.jsx)("line", {
        x1: 270 + c / 60 * 360,
        x2: 270 + c / 60 * 360,
        y1: "4",
        y2: t.length * 54 + 10,
        stroke: x.axis
      }), (0, W.jsx)("text", {
        x: 270 + c / 60 * 360,
        y: t.length * 54 + 36,
        textAnchor: "middle",
        fontSize: "24",
        fill: x.muted,
        children: c
      })]
    }, c)), t.map((c, f) => {
      let r = `${e}-${c.id}`,
        d = r === a,
        h = c.v[l],
        s = 8 + f * 54,
        g = c.id === "c" ? x.green : c.id === "a" || c.id === "b" || c.id === "*" ? x.red : "#7f8ea3";
      return (0, W.jsxs)("g", {
        role: "button",
        tabIndex: 0,
        "aria-pressed": d,
        "aria-label": `${c.name}\uFF1A${h ?? "未报告"}`,
        className: "fp-hot",
        onClick: () => n(r),
        onKeyDown: b => {
          (b.key === "Enter" || b.key === " ") && (b.preventDefault(), n(r));
        },
        children: [(0, W.jsx)("rect", {
          x: "0",
          y: s - 4,
          width: "680",
          height: 50,
          rx: "8",
          fill: d ? "#fff4ec" : "transparent"
        }), (0, W.jsx)("text", {
          x: "260",
          y: s + 26,
          textAnchor: "end",
          fontSize: "25",
          fontWeight: d ? 700 : 400,
          fill: d ? x.ink : x.muted,
          children: c.name
        }), h !== null ? (0, W.jsxs)(W.Fragment, {
          children: [(0, W.jsx)("rect", {
            x: "270",
            y: s + 4,
            width: h / 60 * 360,
            height: "28",
            rx: "5",
            fill: g,
            opacity: d ? 1 : .5
          }), (0, W.jsx)("text", {
            x: 270 + h / 60 * 360 + 8,
            y: s + 27,
            fontSize: "25",
            fontWeight: "700",
            fill: d ? x.ink : x.muted,
            children: h.toFixed(1)
          })]
        }) : (0, W.jsx)("text", {
          x: "280",
          y: s + 27,
          fontSize: "25",
          fill: x.muted,
          children: "未报告"
        })]
      }, r);
    })]
  })}</>;
}
function DetectionAblation(t) {
  let [e, l] = (0, lr.useState)(1),
    [a, n] = (0, lr.useState)("t2-c"),
    [i, u] = a.split("-"),
    c = (i === "t2" ? fastRcnnRows : fasterRcnnRows).find(f => f.id === u);
  return (0, W.jsxs)("div", {
    className: "fp-page fp-detect-page",
    children: [(0, W.jsxs)("div", {
      className: "fp-detect-top",
      children: [(0, W.jsx)("div", {
        className: "fp-chips",
        role: "group",
        "aria-label": "指标",
        children: Am.map((f, r) => (0, W.jsx)("button", {
          className: `fp-chip ${r === e ? "is-on" : ""}`,
          "aria-pressed": r === e,
          onClick: () => l(r),
          children: f
        }, f))
      }), (0, W.jsxs)("svg", {
        viewBox: "0 0 200 64",
        className: "fp-detect-icons",
        "aria-hidden": "true",
        children: [(0, W.jsx)(nn, {
          b: {
            cx: 40,
            cy: 34,
            w: 56,
            h: 26
          }
        }), (0, W.jsx)($o, {
          b: {
            cx: 150,
            cy: 32,
            w: 84,
            h: 58
          }
        })]
      })]
    }), (0, W.jsxs)("div", {
      className: "fp-detect-charts",
      children: [(0, W.jsxs)("figure", {
        className: "fp-panel",
        children: [(0, W.jsx)("figcaption", {
          className: "fp-h",
          children: "表 2 · Fast R-CNN（固定候选框）"
        }), (0, W.jsx)(Em, {
          rows: fastRcnnRows,
          table: "t2",
          metric: e,
          sel: a,
          onPick: n
        })]
      }), (0, W.jsxs)("figure", {
        className: "fp-panel",
        children: [(0, W.jsx)("figcaption", {
          className: "fp-h",
          children: "表 3 · Faster R-CNN"
        }), (0, W.jsx)(Em, {
          rows: fasterRcnnRows,
          table: "t3",
          metric: e,
          sel: a,
          onPick: n
        })]
      })]
    }), (0, W.jsxs)("div", {
      className: `fp-feedback ${c.id === "c" ? "is-good" : ""}`,
      "aria-live": "polite",
      children: [(0, W.jsxs)("b", {
        children: [i === "t2" ? "表 2" : "表 3", " ", c.name]
      }), "（特征 ", c.feat, "，检测头 ", c.head, "）：", ry[a]]
    })]
  });
}
var ar = React;
var ot = jsxRuntime,
  yi = [{
    title: "表 2(c) 和表 3(c) 为什么一样？",
    a: {
      k: "表 2(c) Fast R-CNN",
      v: "33.9 AP"
    },
    b: {
      k: "表 3(c) Faster R-CNN",
      v: "33.9 AP"
    },
    tag: "解读",
    text: "两行都是“FPN 的 RPN 候选框 + FPN 上的 Fast R-CNN”，且两者不共享特征，配置实质相同，所以五个数字完全一致。共享特征的结果在表 5（34.3 AP）。"
  }, {
    title: "47k / 200k / 750k 锚框从哪来？",
    a: {
      k: "表 1 #anchors",
      v: "47k · 200k"
    },
    b: {
      k: "按 800 × 1000 推算",
      v: "47.3k · 200k"
    },
    tag: "解读",
    text: "论文没写计数用的输入宽度。按短边 800、长边 1000 计算：C4 每位置 15 个锚框、FPN 每层每位置 3 个，结果与表 1 吻合。"
  }, {
    title: "没用的技巧",
    a: {
      k: "本文单模型",
      v: "36.2 AP"
    },
    b: {
      k: "未使用",
      v: "4 类技巧"
    },
    tag: "论文自述",
    text: "没用迭代回归、难例挖掘、上下文建模、更强的数据增强；作者认为这些改进与 FPN 互补，应能进一步提高精度。"
  }, {
    title: "速度数字的条件",
    a: {
      k: "ResNet-50 + FPN",
      v: "0.165 s"
    },
    b: {
      k: "InstanceFCN（表 6）",
      v: "1.50 s"
    },
    tag: "论文自述",
    text: "0.165 / 0.19 秒是在单张 M40 上、共享特征时测得；InstanceFCN 的时间在较慢的 K40 上测得，横向比较时要注意。"
  }, {
    title: "表 4 的口径",
    a: {
      k: "本文 test-dev",
      v: "36.2 AP"
    },
    b: {
      k: "Multipath（minival）",
      v: "31.5 AP"
    },
    tag: "阅读核对",
    text: "Multipath 一行是 minival 结果；G-RMI 只报告了 AP。比较时只对比同一评测集、同一指标。"
  }, {
    title: "结构细节不是越复杂越好",
    a: {
      k: "额外层的非线性",
      v: "无"
    },
    b: {
      k: "多层残差块",
      v: "略好"
    },
    tag: "论文自述",
    text: "新增层不加非线性（影响很小）；连接处换成多层残差块只“略好”。论文刻意保持设计简单，把重点放在金字塔本身。"
  }];
function EvidenceChecklist(t) {
  let [e, l] = (0, ar.useState)(0),
    [a, n] = (0, ar.useState)([]),
    i = c => {
      l(c), n(f => f.includes(c) ? f : [...f, c]);
    },
    u = yi[e];
  return (0, ot.jsxs)("div", {
    className: "fp-page fp-limits-page",
    children: [(0, ot.jsx)("div", {
      className: "fp-frame fp-limits-list",
      children: (0, ot.jsxs)("svg", {
        viewBox: "0 0 640 600",
        className: "fp-svg",
        role: "group",
        "aria-label": "阅读核对清单",
        children: [(0, ot.jsx)("rect", {
          x: "0",
          y: "0",
          width: "640",
          height: "600",
          fill: "#f4f6f1"
        }), yi.map((c, f) => {
          let r = 30 + f * 90,
            d = f === e,
            h = a.includes(f);
          return (0, ot.jsxs)("g", {
            role: "button",
            tabIndex: 0,
            "aria-pressed": d,
            "aria-label": `\u6838\u5BF9\uFF1A${c.title}`,
            className: "fp-hot",
            onClick: () => i(f),
            onKeyDown: s => {
              (s.key === "Enter" || s.key === " ") && (s.preventDefault(), i(f));
            },
            children: [(0, ot.jsx)("rect", {
              x: "24",
              y: r,
              width: "592",
              height: "76",
              rx: "12",
              fill: d ? "#e8eef7" : "#ffffff",
              stroke: d ? x.blue : "#dde3ea",
              strokeWidth: d ? 3 : 1.5
            }), (0, ot.jsx)("rect", {
              x: "44",
              y: r + 20,
              width: "36",
              height: "36",
              rx: "7",
              fill: "#ffffff",
              stroke: h ? x.green : "#9aa6b5",
              strokeWidth: "3"
            }), h && (0, ot.jsx)("path", {
              d: `M51 ${r + 38} l9 9 l16 -20`,
              stroke: x.green,
              strokeWidth: "5",
              fill: "none",
              strokeLinecap: "round"
            }), (0, ot.jsx)("text", {
              x: "100",
              y: r + 48,
              fontSize: "27",
              fontWeight: d ? 700 : 400,
              fill: d ? x.blue : x.ink,
              children: c.title
            })]
          }, c.title);
        })]
      })
    }), (0, ot.jsxs)("div", {
      className: "fp-side fp-limits-side",
      children: [(0, ot.jsxs)("div", {
        className: "fp-h",
        children: [u.title, (0, ot.jsx)("span", {
          className: `fp-tag ${u.tag === "论文自述" ? "is-paper" : u.tag === "解读" ? "is-interp" : ""}`,
          children: u.tag
        })]
      }), (0, ot.jsxs)("div", {
        className: "fp-compare",
        children: [(0, ot.jsxs)("div", {
          children: [(0, ot.jsx)("span", {
            className: "fp-em",
            children: u.a.v
          }), (0, ot.jsx)("span", {
            className: "fp-text fp-muted",
            children: u.a.k
          })]
        }), (0, ot.jsxs)("div", {
          children: [(0, ot.jsx)("span", {
            className: "fp-em",
            children: u.b.v
          }), (0, ot.jsx)("span", {
            className: "fp-text fp-muted",
            children: u.b.k
          })]
        })]
      }), (0, ot.jsx)("p", {
        className: "fp-text fp-tight",
        children: u.text
      }), (0, ot.jsxs)("div", {
        className: `fp-feedback ${a.length === yi.length ? "is-good" : ""}`,
        "aria-live": "polite",
        children: ["已浏览 ", a.length, " / ", yi.length, " 项", a.length === yi.length ? "：引用数字前，先确认评测集、硬件和对比配置。" : "，点左侧清单继续。"]
      }), (0, ot.jsx)("svg", {
        viewBox: "-70 -110 140 210",
        className: "fp-corner-icon",
        "aria-hidden": "true",
        children: (0, ot.jsx)(Ye, {
          x: 0,
          y: 0,
          zoom: 3
        })
      })]
    })]
  });
}
var Om = React;
var G = jsxRuntime,
  nr = [{
    id: "fpn",
    name: "FPN",
    sub: "CVPR 2017",
    x: 140,
    y: 230,
    color: x.green,
    text: "FPN 在单尺度输入上，用自顶向下通路与横向相加构建多尺度特征。这里把后续论文作为问题延伸的阅读入口；连线表示本导读组织的主题关联，不代表原论文声称的技术继承关系。",
    src: "FPN §3；其余节点分别链接对应原论文"
  }, {
    id: "yolox",
    name: "YOLOX",
    sub: "arXiv 2021",
    x: 500,
    y: 110,
    color: x.blue,
    text: "YOLOX 的摘要明确提出 anchor-free、解耦检测头与 SimOTA 标签分配。阅读时应区分多尺度特征表示与正负样本分配；不能把 FPN 的 RoI 选层公式当成 YOLOX 的标签分配规则。",
    src: "YOLOX arXiv:2107.08430v2 摘要"
  }, {
    id: "byte",
    name: "ByteTrack",
    sub: "ECCV 2022",
    x: 800,
    y: 110,
    color: x.blue,
    text: "ByteTrack 关注检测框与轨迹的关联。摘要强调：不能直接丢弃所有低分框，而要用它们与已有轨迹的相似性恢复真实目标并过滤背景。这是关联策略，不能归因于 FPN 本身。",
    src: "ByteTrack arXiv:2110.06864v3 摘要"
  }, {
    id: "acm",
    name: "ACM",
    sub: "WACV 2021",
    x: 500,
    y: 350,
    color: x.purple,
    text: "红外弱小目标检测：在自顶向下的全局上下文反馈之外，补充一条基于逐点通道注意力的自底向上调制通路，用来交换高层语义和细微的低层细节。",
    src: "ACM arXiv:2009.14530 摘要"
  }],
  sy = [["fpn", "yolox", "多尺度检测"], ["yolox", "byte", "检测器 → 跟踪"], ["fpn", "acm", "跨层信息交换"]];
function RelatedReading(t) {
  let [e, l] = (0, Om.useState)("fpn"),
    a = nr.find(i => i.id === e),
    n = i => nr.find(u => u.id === i);
  return (0, G.jsxs)("div", {
    className: "fp-page fp-lineage-page",
    children: [(0, G.jsx)("div", {
      className: "fp-frame fp-lineage-graph",
      children: (0, G.jsxs)("svg", {
        viewBox: "0 0 930 470",
        className: "fp-svg",
        role: "group",
        "aria-label": "FPN 与专题三后续工作的关系图",
        children: [(0, G.jsx)("defs", {
          children: (0, G.jsx)("marker", {
            id: "fp-lin-arrow",
            viewBox: "0 0 10 10",
            refX: "9",
            refY: "5",
            markerWidth: "6",
            markerHeight: "6",
            orient: "auto",
            children: (0, G.jsx)("path", {
              d: "M0 0L10 5L0 10z",
              fill: "#8a9bb2"
            })
          })
        }), (0, G.jsx)("rect", {
          x: "0",
          y: "0",
          width: "930",
          height: "470",
          fill: "#f7f9fb"
        }), sy.map(([i, u, c]) => {
          let f = n(i),
            r = n(u),
            d = f.x + 110,
            h = r.x - 110,
            s = (d + h) / 2;
          return (0, G.jsxs)("g", {
            children: [(0, G.jsx)("path", {
              d: `M${d} ${f.y} C ${s} ${f.y}, ${s} ${r.y}, ${h} ${r.y}`,
              fill: "none",
              stroke: "#8a9bb2",
              strokeWidth: "2.5",
              markerEnd: "url(#fp-lin-arrow)"
            }), (0, G.jsx)("text", {
              x: f.y === r.y ? s : 296,
              y: f.y === r.y ? f.y - 62 : r.y < f.y ? 124 : 380,
              textAnchor: f.y === r.y ? "middle" : "end",
              fontSize: "24",
              fill: x.muted,
              children: c
            })]
          }, `${i}-${u}`);
        }), nr.map(i => {
          let u = i.id === e;
          return (0, G.jsxs)("g", {
            role: "button",
            tabIndex: 0,
            "aria-pressed": u,
            "aria-label": `${i.name}\uFF08${i.sub}\uFF09`,
            className: "fp-hot",
            onClick: () => l(i.id),
            onKeyDown: c => {
              (c.key === "Enter" || c.key === " ") && (c.preventDefault(), l(i.id));
            },
            children: [(0, G.jsx)("rect", {
              x: i.x - 110,
              y: i.y - 46,
              width: "220",
              height: "92",
              rx: "14",
              fill: u ? i.color : "#ffffff",
              fillOpacity: u ? .14 : 1,
              stroke: i.color,
              strokeWidth: u ? 5 : 2
            }), (0, G.jsx)("text", {
              x: i.x,
              y: i.y - 6,
              textAnchor: "middle",
              fontSize: "30",
              fontWeight: "700",
              fill: x.ink,
              children: i.name
            }), (0, G.jsx)("text", {
              x: i.x,
              y: i.y + 30,
              textAnchor: "middle",
              fontSize: "24",
              fill: x.muted,
              children: i.sub
            })]
          }, i.id);
        }), (0, G.jsx)("text", {
          x: "800",
          y: "200",
          textAnchor: "middle",
          fontSize: "24",
          fill: x.muted,
          children: "延伸阅读：跟踪"
        }), (0, G.jsx)(Ye, {
          x: 850,
          y: 380,
          s: .5
        })]
      })
    }), (0, G.jsxs)("div", {
      className: "fp-side",
      children: [(0, G.jsxs)("div", {
        className: "fp-h",
        children: [a.name, (0, G.jsxs)("span", {
          className: "fp-muted fp-text",
          children: ["\u3000", a.sub]
        })]
      }), (0, G.jsx)("p", {
        className: "fp-text fp-tight",
        children: a.text
      }), (0, G.jsxs)("div", {
        className: "fp-formula fp-text",
        children: [e === "fpn" && (0, G.jsx)(G.Fragment, {
          children: "M₅=L₅(C₅)；Mₖ=Lₖ(Cₖ)+Up(Mₖ₊₁)；Pₖ=Sₖ(Mₖ)。M 是导读辅助记号。"
        }), e === "yolox" && (0, G.jsxs)(G.Fragment, {
          children: ["多尺度特征 P", (0, G.jsx)("sub", {
            children: "k"
          }), " → anchor-free 检测；标签分配：SimOTA"]
        }), e === "byte" && (0, G.jsx)(G.Fragment, {
          children: "高分框关联后，再利用低分框与轨迹的相似度"
        }), e === "acm" && (0, G.jsx)(G.Fragment, {
          children: "自顶向下全局上下文反馈 + 自底向上逐点通道注意力"
        })]
      }), (0, G.jsxs)("div", {
        className: "fp-feedback",
        "aria-live": "polite",
        children: ["出处：", a.src]
      })]
    })]
  });
}
var fn = React;
var C = jsxRuntime,
  Me = 16,
  Rm = 8,
  nt = {
    c0: 5,
    c1: 9,
    r0: 9,
    r1: 11
  };
function dy() {
  let t = Array.from({
    length: Me
  }, (e, l) => Array.from({
    length: Me
  }, (a, n) => .06 + .06 * Bl(l, n, 1)));
  for (let e = nt.r0; e <= nt.r1; e++) for (let l = nt.c0; l <= nt.c1; l++) {
    let a = e === nt.r0 || e === nt.r1 || l === nt.c0 || l === nt.c1;
    t[e][l] = a ? .85 : .55;
  }
  for (let e = 1; e <= 5; e++) for (let l = 10; l <= 14; l++) {
    let a = Math.hypot(e - 3, l - 12);
    a <= 2.3 && (t[e][l] = a > 1.3 ? .92 : .5);
  }
  for (let e = 1; e <= 4; e++) for (let l = 0; l <= 3; l++) (e === 4 || l === 3) && (t[e][l] = .8);
  for (let e = 0; e < Me; e++) e % 3 !== 2 && (t[13][e] = .62);
  return t;
}
function py() {
  let t = Array.from({
    length: Rm
  }, () => Array.from({
    length: Rm
  }, () => .05));
  return t[0][5] = .12, t[0][6] = .12, t[1][5] = .12, t[1][6] = .12, t[2][6] = .12, t[1][0] = .1, t[1][1] = .1, t[5][3] = 1, t[5][2] = .72, t[5][4] = .72, t[4][3] = .6, t[4][2] = .46, t[4][4] = .46, t[6][3] = .3, t[6][2] = .2, t[6][4] = .2, t;
}
var Dm = dy(),
  my = py(),
  _m = Array.from({
    length: Me
  }, (t, e) => Array.from({
    length: Me
  }, (l, a) => my[e >> 1][a >> 1]));
function hy(t) {
  let e = (l, a) => t[Math.min(Me - 1, Math.max(0, l))][Math.min(Me - 1, Math.max(0, a))];
  return t.map((l, a) => l.map((n, i) => .5 * n + .125 * (e(a - 1, i) + e(a + 1, i) + e(a, i - 1) + e(a, i + 1))));
}
function gy(t) {
  let e = 0;
  t.forEach(b => b.forEach(v => {
    e = Math.max(e, v);
  }));
  let l = (b, v) => b >= nt.r0 && b <= nt.r1 && v >= nt.c0 && v <= nt.c1,
    a = (b, v) => b >= nt.r0 - 2 && b <= nt.r1 + 2 && v >= nt.c0 - 2 && v <= nt.c1 + 2,
    n = 0,
    i = 0;
  t.forEach((b, v) => b.forEach((N, p) => {
    l(v, p) ? n = Math.max(n, N) : a(v, p) || (i = Math.max(i, N));
  }));
  let u = Me,
    c = -1,
    f = Me,
    r = -1;
  t.forEach((b, v) => b.forEach((N, p) => {
    N >= .6 * e && (u = Math.min(u, v), c = Math.max(c, v), f = Math.min(f, p), r = Math.max(r, p));
  }));
  let d = Math.max(0, Math.min(r, nt.c1) - Math.max(f, nt.c0) + 1) * Math.max(0, Math.min(c, nt.r1) - Math.max(u, nt.r0) + 1),
    h = (r - f + 1) * (c - u + 1),
    s = 0,
    g = 0;
  for (let b = 6; b < 14; b++) for (let v = 1; v < 12; v += 2) s += Math.abs(t[b][v] - t[b][v + 1]), g++;
  return {
    contrast: i > 0 ? n / i : 0,
    iou: d / (h + 15 - d),
    jump: s / g,
    box: {
      r0: u,
      r1: c,
      c0: f,
      c1: r
    },
    mx: e
  };
}
function yy(t, e) {
  let l = Math.max(0, Math.min(1, t / e)),
    a = [247, 249, 252],
    n = [39, 68, 110];
  return `rgb(${a.map((i, u) => Math.round(i + (n[u] - i) * l)).join(",")})`;
}
function ir({
  grid: t,
  n: e,
  max: l,
  off: a,
  region: n
}) {
  let i = 288 / e;
  return (0, C.jsxs)("svg", {
    viewBox: "0 0 288 288",
    className: "fp-heat",
    role: "img",
    "aria-label": a ? "该分支已关闭" : "响应热力图",
    children: [(0, C.jsx)("rect", {
      x: "0",
      y: "0",
      width: "288",
      height: "288",
      fill: "#f2f4f7"
    }), t && !a && t.map((u, c) => u.map((f, r) => (0, C.jsx)("rect", {
      x: r * i,
      y: c * i,
      width: i + .4,
      height: i + .4,
      fill: yy(f, l)
    }, `${c}-${r}`))), a && (0, C.jsx)("text", {
      x: "144",
      y: "154",
      textAnchor: "middle",
      fontSize: "28",
      fill: x.muted,
      children: "已关闭"
    }), (0, C.jsx)("rect", {
      x: nt.c0 * 18,
      y: nt.r0 * 18,
      width: (nt.c1 - nt.c0 + 1) * 18,
      height: (nt.r1 - nt.r0 + 1) * 18,
      fill: "none",
      stroke: x.orange,
      strokeWidth: "3",
      strokeDasharray: "7 5"
    }), n && n.r1 >= 0 && (0, C.jsx)("rect", {
      x: n.c0 * 18,
      y: n.r0 * 18,
      width: (n.c1 - n.c0 + 1) * 18,
      height: (n.r1 - n.r0 + 1) * 18,
      fill: "none",
      stroke: x.green,
      strokeWidth: "4"
    })]
  });
}
function FeatureMerge(t) {
  let [e, l] = (0, fn.useState)(!0),
    [a, n] = (0, fn.useState)(!0),
    [i, u] = (0, fn.useState)(!0),
    c = (0, fn.useMemo)(() => {
      let s = Dm.map((g, b) => g.map((v, N) => (e ? v : 0) + (a ? _m[b][N] : 0)));
      return i && (s = hy(s)), s;
    }, [e, a, i]),
    f = gy(c),
    r = s => {
      if (s === "lat") {
        if (e && !a) return;
        l(!e);
      } else {
        if (a && !e) return;
        n(!a);
      }
    },
    d = "本手工示意中，相加和平滑让高响应更集中于设定车框；这不是网络实测，也不证明真实检测框必然准确。",
    h = "is-good";
  return a ? e ? i || (d = "本示意关闭固定 3×3 平滑核后，方块边界更明显。论文实际使用可学习的 3×3 卷积减弱混叠，并非本示意核。", h = "") : (d = "本示意只保留自顶向下分支：人为设置的粗响应覆盖附近区域。可用它理解定位损失，但数字不能替代表 1(e) 的真实实验。", h = "is-bad") : (d = "本示意只保留横向分支：人为设置的树冠和屋角响应更强。这是语义歧义的说明，不是表 1(d) 的激活实测。", h = "is-bad"), (0, C.jsxs)("div", {
    className: "fp-page fp-merge-page",
    children: [(0, C.jsxs)("div", {
      className: "fp-merge-row",
      children: [(0, C.jsxs)("figure", {
        className: "fp-merge-panel",
        children: [(0, C.jsxs)("svg", {
          viewBox: "0 0 128 128",
          className: "fp-heat",
          role: "img",
          "aria-label": "这块街区：一辆车、树冠、屋角和路面虚线",
          children: [(0, C.jsx)("rect", {
            x: "0",
            y: "0",
            width: "128",
            height: "128",
            fill: "#eceee4"
          }), (0, C.jsx)("rect", {
            x: "0",
            y: "100",
            width: "128",
            height: "20",
            fill: "#d3d6cf"
          }), Array.from({
            length: 6
          }, (s, g) => (0, C.jsx)("rect", {
            x: g * 24,
            y: "105",
            width: "16",
            height: "2.5",
            fill: "#ffffff"
          }, g)), (0, C.jsx)(Wo, {
            x: 0,
            y: 0,
            w: 30,
            h: 34
          }), (0, C.jsx)(Fu, {
            cx: 100,
            cy: 28,
            r: 18
          }), (0, C.jsx)(nn, {
            b: {
              cx: 60,
              cy: 84,
              w: 40,
              h: 22
            }
          })]
        }), (0, C.jsx)("figcaption", {
          className: "fp-text",
          children: "街区（128 像素见方）"
        })]
      }), (0, C.jsx)("span", {
        className: "fp-op",
        children: "→"
      }), (0, C.jsxs)("figure", {
        className: `fp-merge-panel ${e ? "" : "is-off"}`,
        children: [(0, C.jsx)(ir, {
          grid: Dm,
          n: Me,
          max: 2,
          off: !e
        }), (0, C.jsxs)("figcaption", {
          className: "fp-text",
          children: [(0, C.jsx)(Ge, {
            meaning: "C3：ResNet conv3 阶段输出（步长 8）；1×1 卷积把通道降到 d = 256。",
            children: "C3"
          }), " 经 1×1 横向"]
        })]
      }), (0, C.jsx)("span", {
        className: "fp-op",
        children: "+"
      }), (0, C.jsxs)("figure", {
        className: `fp-merge-panel ${a ? "" : "is-off"}`,
        children: [(0, C.jsx)(ir, {
          grid: _m,
          n: Me,
          max: 2,
          off: !a
        }), (0, C.jsxs)("figcaption", {
          className: "fp-text",
          children: [(0, C.jsx)(Ge, {
            meaning: "M4：上一层（步长 16）的融合中间图，M 为导读记号；先最近邻上采样，再与 C3 的投影相加。递归不从最终 3×3 输出 P4 取输入。",
            children: "M4"
          }), " 最近邻 ×2"]
        })]
      }), (0, C.jsx)("span", {
        className: "fp-op",
        children: i ? "→ 3×3 →" : "→"
      }), (0, C.jsxs)("figure", {
        className: "fp-merge-panel is-result",
        children: [(0, C.jsx)(ir, {
          grid: c,
          n: Me,
          max: 2,
          region: f.box
        }), (0, C.jsxs)("figcaption", {
          className: "fp-text",
          children: [(0, C.jsx)("b", {
            children: "P3"
          }), " 示意输出"]
        })]
      })]
    }), (0, C.jsxs)("div", {
      className: "fp-merge-bottom",
      children: [(0, C.jsxs)("div", {
        className: "fp-toggles",
        role: "group",
        "aria-label": "构建块的三个部件",
        children: [(0, C.jsx)("button", {
          className: `fp-toggle ${e ? "is-on" : ""}`,
          "aria-pressed": e,
          disabled: e && !a,
          onClick: () => r("lat"),
          children: "横向连接 1×1"
        }), (0, C.jsx)("button", {
          className: `fp-toggle ${a ? "is-on" : ""}`,
          "aria-pressed": a,
          disabled: a && !e,
          onClick: () => r("td"),
          children: "自顶向下 ×2"
        }), (0, C.jsx)("button", {
          className: `fp-toggle ${i ? "is-on" : ""}`,
          "aria-pressed": i,
          onClick: () => u(!i),
          children: "3×3 卷积"
        })]
      }), (0, C.jsxs)("div", {
        className: "fp-metrics fp-text",
        children: [(0, C.jsxs)("div", {
          children: [(0, C.jsx)("span", {
            children: "示意车 / 杂物响应比"
          }), (0, C.jsx)("b", {
            className: f.contrast > 1.2 ? "is-good" : "is-bad",
            children: f.contrast.toFixed(2)
          })]
        }), (0, C.jsxs)("div", {
          children: [(0, C.jsx)("span", {
            children: "示意亮区外接框 IoU"
          }), (0, C.jsx)("b", {
            className: f.iou > .9 ? "is-good" : "is-bad",
            children: f.iou.toFixed(2)
          })]
        }), (0, C.jsxs)("div", {
          children: [(0, C.jsx)("span", {
            children: "方块边界跳变"
          }), (0, C.jsx)("b", {
            children: f.jump.toFixed(2)
          })]
        })]
      }), (0, C.jsx)("div", {
        className: `fp-feedback ${h}`,
        "aria-live": "polite",
        children: d
      })]
    })]
  });
}
var cr = React;
var R = jsxRuntime,
  vy = [{
    id: "a",
    label: "(a)",
    name: "图像金字塔"
  }, {
    id: "b",
    label: "(b)",
    name: "单一特征图"
  }, {
    id: "c",
    label: "(c)",
    name: "网络层级金字塔"
  }, {
    id: "d",
    label: "(d)",
    name: "特征金字塔网络"
  }],
  by = ["#dfe7f2", "#b7c8de", "#7f9cc2", "#4a6b98", "#27446e"];
function xy(t, e) {
  let l = Rt.find(u => u.id === e).box,
    a = Math.sqrt(l.w * l.h);
  if (t === "a") {
    let u = e === "car" ? 2 : .5;
    return {
      map: `\xD7${u} \u56FE\u50CF \u2192 \u6B65\u957F 32`,
      cells: a * u / 32,
      res: a * u / 32 >= 1.5,
      sem: !0,
      fast: !1
    };
  }
  if (t === "b") return {
    map: "C5（步长 32）",
    cells: a / 32,
    res: a / 32 >= 1.5,
    sem: !0,
    fast: !0
  };
  let n = assignRoiLevel(l.w, l.h).clamped,
    i = 2 ** n;
  return t === "c" ? {
    map: `C${n}\uFF08\u6B65\u957F ${i}\uFF09`,
    cells: a / i,
    res: !0,
    sem: n >= 4,
    fast: !0
  } : {
    map: `P${n}\uFF08\u6B65\u957F ${i}\uFF09`,
    cells: a / i,
    res: !0,
    sem: !0,
    fast: !0
  };
}
var Sy = {
  a: "本文讨论的图像金字塔方案使推理开销显著增加，训练时显存代价很高，通常仅在测试时采用；这是当时设置下的取舍，并非所有硬件上的不可能性结论。",
  b: "只用单一尺度的特征换取速度；粗分辨率与强语义之间存在取舍。",
  c: "复用网络本身的层级，但不同深度带来很大的语义鸿沟，高分辨率层的低层特征削弱识别能力。",
  d: "自顶向下 + 横向连接：从单一尺度输入快速构建，每一层都有强语义。"
};
function ec({
  cx: t,
  y: e,
  w: l,
  sem: a,
  hot: n,
  label: i
}) {
  let u = l * .26,
    c = t - l / 2;
  return (0, R.jsxs)("g", {
    children: [(0, R.jsx)("path", {
      d: `M${c} ${e} l${u} ${-u} h${l - u} l${-u} ${u} Z`,
      fill: by[a],
      stroke: n ? x.orange : "#8a9bb2",
      strokeWidth: n ? 5 : 1.5
    }), i && (0, R.jsx)("text", {
      x: c - 12,
      y: e - u / 2 + 9,
      textAnchor: "end",
      fontSize: "26",
      fontWeight: n ? 700 : 400,
      fill: n ? x.orange : x.muted,
      children: i
    })]
  });
}
function lc({
  x1: t,
  y1: e,
  x2: l,
  y2: a,
  color: n = "#8a9bb2",
  width: i = 2.5
}) {
  return (0, R.jsx)("line", {
    x1: t,
    y1: e,
    x2: l,
    y2: a,
    stroke: n,
    strokeWidth: i,
    markerEnd: "url(#fp-sch-arrow)"
  });
}
var ur = [{
  w: 230,
  y: 312
}, {
  w: 176,
  y: 236
}, {
  w: 130,
  y: 170
}, {
  w: 94,
  y: 114
}];
function Ny({
  s: t,
  t: e
}) {
  let l = Rt.find(i => i.id === e).box,
    a = assignRoiLevel(l.w, l.h).clamped,
    n = (i, u, c) => (0, R.jsx)(lc, {
      x1: i,
      y1: u,
      x2: i + 56,
      y2: u,
      color: c ? x.orange : "#8a9bb2",
      width: c ? 4 : 2.5
    });
  return (0, R.jsxs)("svg", {
    viewBox: "0 0 860 330",
    className: "fp-svg",
    role: "img",
    "aria-label": `\u65B9\u6848 ${t} \u7684\u793A\u610F\u7ED3\u6784`,
    children: [(0, R.jsx)("defs", {
      children: (0, R.jsx)("marker", {
        id: "fp-sch-arrow",
        viewBox: "0 0 10 10",
        refX: "9",
        refY: "5",
        markerWidth: "6",
        markerHeight: "6",
        orient: "auto",
        children: (0, R.jsx)("path", {
          d: "M0 0L10 5L0 10z",
          fill: "#8a9bb2"
        })
      })
    }), t === "a" && (0, R.jsxs)("g", {
      children: [[{
        w: 150,
        y: 316,
        tag: "×2"
      }, {
        w: 108,
        y: 206,
        tag: "×1"
      }, {
        w: 74,
        y: 112,
        tag: "×0.5"
      }].map((i, u) => {
        let c = e === "car" && u === 0 || e === "stadium" && u === 2,
          f = i.w * .62;
        return (0, R.jsxs)("g", {
          children: [(0, R.jsx)("rect", {
            x: 170 - i.w,
            y: i.y - f,
            width: i.w,
            height: f,
            rx: "6",
            fill: "#eceee4",
            stroke: "#a9b3c1"
          }), (0, R.jsx)("text", {
            x: 170 - i.w / 2,
            y: i.y - f / 2 + 9,
            textAnchor: "middle",
            fontSize: "26",
            fill: x.muted,
            children: i.tag
          }), (0, R.jsx)(lc, {
            x1: 180,
            y1: i.y - f / 2,
            x2: 262,
            y2: i.y - f / 2
          }), (0, R.jsx)(ec, {
            cx: 270 + i.w * .55,
            y: i.y - f / 2 + i.w * .13,
            w: i.w * 1.1,
            sem: 4,
            hot: c
          }), n(285 + i.w * 1.1, i.y - f / 2, c)]
        }, u);
      }), (0, R.jsx)("text", {
        x: 600,
        y: 150,
        fontSize: "28",
        fill: x.red,
        fontWeight: "700",
        children: "每个尺度"
      }), (0, R.jsx)("text", {
        x: 600,
        y: 190,
        fontSize: "28",
        fill: x.red,
        fontWeight: "700",
        children: "完整算一遍特征"
      })]
    }), (t === "b" || t === "c") && (0, R.jsxs)("g", {
      children: [ur.map((i, u) => {
        let c = u + 2,
          f = t === "b" && c === 5 || t === "c" && c === a;
        return (0, R.jsxs)("g", {
          children: [(0, R.jsx)(ec, {
            cx: 300,
            y: i.y,
            w: i.w,
            sem: 1 + u,
            hot: f,
            label: `C${c}`
          }), (t === "c" || c === 5) && n(300 + i.w / 2 + 8, i.y - i.w * .13, f)]
        }, u);
      }), t === "c" && (0, R.jsx)("text", {
        x: 520,
        y: 300,
        fontSize: "28",
        fill: x.red,
        fontWeight: "700",
        children: "低层：位置准，语义弱"
      }), t === "b" && (0, R.jsx)("text", {
        x: 500,
        y: 110,
        fontSize: "28",
        fill: x.muted,
        children: "只在最顶层预测"
      })]
    }), t === "d" && (0, R.jsxs)("g", {
      children: [ur.map((i, u) => {
        let c = u + 2,
          f = c === a,
          r = i.w * .82;
        return (0, R.jsxs)("g", {
          children: [(0, R.jsx)(ec, {
            cx: 190,
            y: i.y,
            w: r,
            sem: 1 + u,
            label: `C${c}`
          }), (0, R.jsx)(lc, {
            x1: 190 + r / 2 + 6,
            y1: i.y - r * .13,
            x2: 548 - r / 2,
            y2: i.y - r * .13,
            color: x.green
          }), (0, R.jsx)(ec, {
            cx: 560,
            y: i.y,
            w: r,
            sem: 4,
            hot: f
          }), (0, R.jsxs)("text", {
            x: 560 + r / 2 + 14,
            y: i.y - r * .13 - 14,
            fontSize: "26",
            fontWeight: f ? 700 : 400,
            fill: f ? x.orange : x.muted,
            children: ["P", c]
          }), n(560 + r / 2 + 64, i.y - r * .13 + 4, f), u < 3 && (0, R.jsx)(lc, {
            x1: 560,
            y1: ur[u + 1].y + 4,
            x2: 560,
            y2: i.y - r * .26 - 4,
            color: x.blue,
            width: 3
          })]
        }, u);
      }), (0, R.jsx)("text", {
        x: 370,
        y: 92,
        textAnchor: "middle",
        fontSize: "26",
        fill: x.green,
        fontWeight: "700",
        children: "横向 1×1"
      }), (0, R.jsx)("text", {
        x: 600,
        y: 56,
        fontSize: "26",
        fill: x.blue,
        fontWeight: "700",
        children: "自顶向下 ×2"
      })]
    })]
  });
}
function MultiscaleSchemes(t) {
  let [e, l] = (0, cr.useState)("c"),
    [a, n] = (0, cr.useState)("car"),
    i = xy(e, a),
    u = Rt.find(d => d.id === a),
    c = i.res && i.sem && i.fast,
    f = d => h => {
      (h.key === "Enter" || h.key === " ") && (h.preventDefault(), n(d));
    },
    r = d => (0, R.jsx)("b", {
      className: d ? "is-good" : "is-bad",
      children: d ? "✓" : "✗"
    });
  return (0, R.jsxs)("div", {
    className: "fp-page fp-schemes-page",
    children: [(0, R.jsx)("div", {
      className: "fp-frame fp-schemes-scene",
      children: (0, R.jsxs)("svg", {
        viewBox: "0 0 1000 800",
        className: "fp-svg",
        role: "group",
        "aria-label": "航拍图：点小汽车或体育场选择要找的目标",
        children: [(0, R.jsx)(cl, {}), (0, R.jsx)(mi, {
          x: 0,
          y: 0,
          w: 1e3,
          h: 800,
          cell: 32,
          opacity: .35
        }), ["car", "stadium"].map(d => {
          let h = Rt.find(b => b.id === d).box,
            s = d === a,
            g = d === "car" ? 14 : 8;
          return (0, R.jsx)("g", {
            role: "button",
            tabIndex: 0,
            "aria-pressed": s,
            "aria-label": `\u9009\u62E9${d === "car" ? "小汽车" : "体育场"}`,
            className: "fp-hot",
            onClick: () => n(d),
            onKeyDown: f(d),
            children: (0, R.jsx)("rect", {
              x: h.cx - h.w / 2 - g,
              y: h.cy - h.h / 2 - g,
              width: h.w + g * 2,
              height: h.h + g * 2,
              rx: "10",
              fill: s ? x.orange : "#ffffff",
              fillOpacity: s ? .14 : .01,
              stroke: s ? x.orange : "#ffffff",
              strokeWidth: s ? 5 : 3,
              strokeDasharray: s ? void 0 : "8 6"
            })
          }, d);
        })]
      })
    }), (0, R.jsxs)("div", {
      className: "fp-side",
      children: [(0, R.jsx)("div", {
        className: "fp-chips fp-grid2",
        role: "group",
        "aria-label": "多尺度方案（图 1）",
        children: vy.map(d => (0, R.jsxs)("button", {
          className: `fp-chip ${d.id === e ? d.id === "d" ? "is-on is-new" : "is-on" : ""}`,
          "aria-pressed": d.id === e,
          onClick: () => l(d.id),
          children: [d.label, " ", d.name]
        }, d.id))
      }), (0, R.jsx)(Ny, {
        s: e,
        t: a
      }), (0, R.jsxs)("div", {
        className: "fp-verdict fp-text",
        children: [(0, R.jsxs)("span", {
          children: ["找", (0, R.jsx)("b", {
            children: u.name
          }), "用：", i.map, "，等效尺度约 ", i.cells.toFixed(1), " 格（√wh / 步长）"]
        }), (0, R.jsxs)("span", {
          children: ["分辨率 ", r(i.res), "\u3000语义 ", r(i.sem), "\u3000速度 ", r(i.fast)]
        })]
      }), (0, R.jsx)("div", {
        className: `fp-feedback ${e === "d" ? "is-good" : c ? "" : "is-bad"}`,
        "aria-live": "polite",
        children: Sy[e]
      })]
    })]
  });
}
var Bm = React;
var et = jsxRuntime,
  maskProposalRows = [{
    id: "dm",
    name: "DeepMask",
    short: "DeepMask",
    fpn: !1,
    ar: 37.1,
    s: 15.8,
    m: 50.1,
    l: 54.9,
    t: .49
  }, {
    id: "sm",
    name: "SharpMask",
    short: "SharpMask",
    fpn: !1,
    ar: 39.8,
    s: 17.4,
    m: 53.1,
    l: 59.1,
    t: .77
  }, {
    id: "if",
    name: "InstanceFCN",
    short: "InstanceFCN",
    fpn: !1,
    ar: 39.2,
    s: null,
    m: null,
    l: null,
    t: 1.5,
    note: "时间在较慢的 K40 上测得，其余为 M40"
  }, {
    id: "s5",
    name: "FPN 单 MLP 5×5",
    short: "5×5",
    fpn: !0,
    ar: 43.4,
    s: 32.5,
    m: 49.2,
    l: 53.7,
    t: .15
  }, {
    id: "s7",
    name: "FPN 单 MLP 7×7",
    short: "7×7",
    fpn: !0,
    ar: 43.5,
    s: 30,
    m: 49.6,
    l: 57.8,
    t: .19
  }, {
    id: "du",
    name: "FPN 双 MLP（5×5、7×7）",
    short: "双 MLP",
    fpn: !0,
    ar: 45.7,
    s: 31.9,
    m: 51.5,
    l: 60.8,
    t: .24
  }, {
    id: "mr",
    name: "+ 2× 掩码分辨率",
    short: "+2× 掩码",
    fpn: !0,
    ar: 46.7,
    s: 31.7,
    m: 53.1,
    l: 63.2,
    t: .25
  }, {
    id: "ts",
    name: "+ 2× 训练时长",
    short: "+2× 训练",
    fpn: !0,
    ar: 48.1,
    s: 32.6,
    m: 54.2,
    l: 65.6,
    t: .25
  }],
  vi = 90,
  fr = 840,
  bi = 400,
  Ym = 46,
  on = t => vi + t / 1.6 * (fr - vi),
  rn = t => bi - (t - 34) / 16 * (bi - Ym),
  zy = {
    dm: [16, 8],
    sm: [16, 8],
    if: [-16, -18],
    s5: [-16, 30],
    s7: [16, -8],
    du: [18, 12],
    mr: [-18, 8],
    ts: [18, -6]
  };
function MaskProposals(t) {
  let [e, l] = (0, Bm.useState)("ts"),
    a = maskProposalRows.find(i => i.id === e),
    n = i => i === null ? "未报告" : i.toFixed(1);
  return (0, et.jsxs)("div", {
    className: "fp-page fp-seg-page",
    children: [(0, et.jsxs)("div", {
      className: "fp-panel fp-seg-chart",
      children: [<MobileBarChart key="mobile-results" rows={maskProposalRows.map(row => ({
        id: row.id, label: row.name, value: row.ar,
        color: row.fpn ? x.green : x.red,
        meta: `${row.t.toFixed(2)} 秒/图 · NVIDIA ${row.id === 'if' ? 'K40' : 'M40'}`
      }))} selected={e} onPick={l} metric="AR" maximum={50}
        label="表 6 分割提案：AR 与单张图时间"
        note="条长仅表示 AR，时间单独列出。InstanceFCN 在较慢的 K40 上测时，其余为 M40，不能把这些时间当作相同硬件下的速度比较。" />, (0, et.jsxs)("svg", {
        viewBox: "0 0 880 470",
        className: "fp-svg fp-desktop-chart",
        role: "group",
        "aria-label": "表 6：AR 与单张图时间",
        children: [[36, 40, 44, 48].map(i => (0, et.jsxs)("g", {
          children: [(0, et.jsx)("line", {
            x1: vi,
            x2: fr,
            y1: rn(i),
            y2: rn(i),
            stroke: x.axis
          }), (0, et.jsx)("text", {
            x: vi - 12,
            y: rn(i) + 9,
            textAnchor: "end",
            fontSize: "24",
            fill: x.muted,
            children: i
          })]
        }, i)), [0, .4, .8, 1.2, 1.6].map(i => (0, et.jsxs)("g", {
          children: [(0, et.jsx)("line", {
            x1: on(i),
            x2: on(i),
            y1: Ym,
            y2: bi,
            stroke: x.axis
          }), (0, et.jsx)("text", {
            x: on(i),
            y: bi + 32,
            textAnchor: "middle",
            fontSize: "24",
            fill: x.muted,
            children: i.toFixed(1)
          })]
        }, i)), (0, et.jsx)("text", {
          x: fr,
          y: bi + 62,
          textAnchor: "end",
          fontSize: "24",
          fill: x.muted,
          children: "单张图时间（秒）"
        }), (0, et.jsx)("text", {
          x: vi,
          y: "30",
          fontSize: "24",
          fill: x.muted,
          children: "AR"
        }), maskProposalRows.map(i => {
          let u = i.id === e,
            [c, f] = zy[i.id],
            r = i.fpn ? x.green : x.red;
          return (0, et.jsxs)("g", {
            role: "button",
            tabIndex: 0,
            "aria-pressed": u,
            "aria-label": `${i.name}\uFF1AAR ${i.ar}\uFF0C${i.t} \u79D2`,
            className: "fp-hot",
            onClick: () => l(i.id),
            onKeyDown: d => {
              (d.key === "Enter" || d.key === " ") && (d.preventDefault(), l(i.id));
            },
            children: [(0, et.jsx)("circle", {
              cx: on(i.t),
              cy: rn(i.ar),
              r: "14",
              fill: "transparent"
            }), (0, et.jsx)("circle", {
              cx: on(i.t),
              cy: rn(i.ar),
              r: u ? 12 : 9,
              fill: r,
              stroke: u ? x.orange : "#ffffff",
              strokeWidth: u ? 4 : 2
            }), (0, et.jsx)("text", {
              x: on(i.t) + c,
              y: rn(i.ar) + f,
              textAnchor: c < 0 ? "end" : "start",
              fontSize: "24",
              fontWeight: u ? 700 : 400,
              fill: u ? x.ink : r,
              children: i.short
            })]
          }, i.id);
        })]
      })]
    }), (0, et.jsxs)("div", {
      className: "fp-side",
      children: [<label className="fp-mobile-choice" key="proposal-select">选择分割提案配置
        <select className="fp-mobile-select" aria-label="选择分割提案配置" value={e} onChange={event => l(event.target.value)}>
          {maskProposalRows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </label>, (0, et.jsxs)("svg", {
        viewBox: "0 0 520 170",
        className: "fp-seg-vignette",
        role: "img",
        "aria-label": "默认 14×14 掩码提案的教学示意；不是所选实验配置的真实网络输出",
        children: [(0, et.jsx)("rect", {
          x: "0",
          y: "0",
          width: "520",
          height: "170",
          rx: "14",
          fill: "#eef3f5"
        }), (0, et.jsx)("rect", {
          x: "0",
          y: "0",
          width: "520",
          height: "170",
          rx: "14",
          fill: "#c9dde3",
          opacity: "0.6"
        }), (0, et.jsx)(Jo, {
          b: {
            cx: 150,
            cy: 86,
            w: 220,
            h: 70
          }
        }), Array.from({
          length: 14
        }, (i, u) => Array.from({
          length: 14
        }, (c, f) => {
          let r = 330 + f * 11,
            d = 8 + u * 11,
            h = Math.abs(u - 6.5) < 3 && f > 1 && f < 13 - Math.abs(u - 6.5) * .6;
          return (0, et.jsx)("rect", {
            x: r,
            y: d,
            width: "10",
            height: "10",
            fill: h ? x.green : "#ffffff",
            opacity: h ? .85 : .8
          }, `${u}-${f}`);
        })), (0, et.jsx)("text", {
          x: "300",
          y: "96",
          textAnchor: "middle",
          fontSize: "28",
          fill: x.ink,
          children: "→"
        })]
      }), (0, et.jsx)("p", {
        className: "fp-text fp-tight",
        children: "图 4 的结构示意：每层小 MLP 预测类别无关的掩码提案；d = 128。上图始终画默认 14×14 示例；表 6 的“2×掩码分辨率”配置实际为 28×28。"
      }), (0, et.jsxs)("div", {
        className: `fp-feedback ${a.fpn ? "is-good" : ""}`,
        "aria-live": "polite",
        children: [(0, et.jsx)("b", {
          children: a.name
        }), "：AR ", n(a.ar), "（小 ", n(a.s), " · 中 ", n(a.m), " · 大 ", n(a.l), "），", a.t.toFixed(2), " 秒", a.note ? `\uFF1B${a.note}` : "", "。", a.fpn ? "" : "依赖密集采样的图像金字塔。"]
      }), (0, et.jsx)("p", {
        className: "fp-text fp-tight fp-muted",
        children: "表 6：5×5 单 MLP 为 0.15 秒/图（约 6.7 FPS）；最佳 AR 48.1 对应 0.25 秒/图（4 FPS）。不同配置的精度与速度不能拼成一个结果。"
      })]
    })]
  });
}
const FPN_PDF = 'https://openaccess.thecvf.com/content_cvpr_2017/papers/Lin_Feature_Pyramid_Networks_CVPR_2017_paper.pdf';
const evidence = {
  'fp-schemes': {
    location: '图 1、§1',
    page: 1,
    kind: '结构教学示意',
    text: '航拍街区是手绘场景；等效尺度 = √(wh) / 特征步长。方案的分辨率、语义、速度勾选是定性教学判断，并非准确率或延迟实测。为便于比较，示例用 RoI 选层公式组织 (c)/(d)，不表示所有网络采用相同分配规则。'
  },
  'fp-arch': {
    location: '§3、图 2–3、§4.1',
    page: 3,
    kind: '原文结构 + 尺寸推算',
    text: '检测实验额外 FPN 卷积输出均为 256 通道，不加非线性。M 为导读中间量记号；横向相加不是通道拼接。跨层共享的是预测 head，不能由此推断横向 1×1 卷积共享权重。'
  },
  'fp-merge': {
    location: '§3、图 3',
    page: 3,
    kind: '手工数值示意 · 非模型输出',
    text: '全部热力图均为人工构造，不读取预训练网络。示意平滑核中心 0.5、四邻各 0.125；真实 3×3 是可学习卷积。IoU 指响应 ≥ 最大值 60% 的格子外接框与设定车框的重叠；它不是检测器输出框的 IoU，也不能替代消融实验。'
  },
  'fp-anchors': {
    location: '§4.1、§5.1',
    page: 4,
    kind: '局部锚框匹配示意',
    text: '本交互仅展示 P2–P6 每层在目标中心附近一个位置的 3 个框，共 15 个；“最高 IoU”只在该局部集合中计算。真实训练在全部 anchors 与全部 GT 间匹配：某 GT 最高 IoU 或 IoU > 0.7 为正；未先被正样本规则选中、且与全部 GT 的 IoU < 0.3 才为负，其余忽略。即使最高 IoU 低于 0.3，最高匹配兜底也优先判为正。显示保留 3 位，判定使用未舍入值。'
  },
  'fp-ablation': {
    location: '表 1、§5.1',
    page: 6,
    kind: '原论文数据',
    text: 'COCO minival，trainval35k 训练，ResNet-50。AR100 对应 100 proposals；AR1k 与小/中/大物体 AR 对应 1000 proposals。单层基线也有 32²–512² 全部 5 种锚框面积。完整 FPN 整体更好，不意味着每个尺寸都最优：(d) 大物体 AR 68.0 高于 (c) 的 66.2。'
  },
  'fp-assign': {
    location: '式 (1)、§4.2',
    page: 4,
    kind: '原式 + 有限层实现',
    text: 'w、h 是网络输入图像（缩放后）上的 RoI 宽、高。使用 floor，不能换成四舍五入。原式没有显式 clamp；本页将可用层限制为 P2–P5。相同面积不同长宽比得到同一层。本文为 RoI pooling 7×7，接两层 1024 维 fc 与 ReLU，不能改称 RoIAlign。网格是几何示意。'
  },
  'fp-detect': {
    location: '表 2、表 3、§5.2',
    page: 6,
    kind: '原论文数据 · 两种对照',
    text: 'COCO minival，ResNet-50。表 2 固定使用 FPN RPN proposals：(c)33.9 − (a)31.9 = 2.0 AP；表 3 使用对应 RPN 与检测器：(c)33.9 − (a)31.6 = 2.3 AP。两表默认 RPN 与检测器不共享特征。表 3 大物体 AP：C4 47.1 > FPN 45.8，不能说所有目标尺度均提升。'
  },
  'fp-coco': {
    location: '表 4–5、§5.2.2–5.2.3',
    page: 7,
    kind: '原论文数据 · 配置分开读',
    text: '表 4 的最终 ResNet-101：test-dev 36.2 AP，Fast R-CNN 训练日程加倍，RPN/检测器不共享特征；未报告该最终提交配置的对应速度。0.165/0.19 秒来自单张 M40、共享特征的 ResNet-50/101 系统。表 5 是 minival、默认日程；AttractioNet 提案用 VGG-16、检测用 Wide ResNet，脚注说明其严格说不算单模型。不同数据集、骨干和训练条件的横向条形图不是受控消融。'
  },
  'fp-seg': {
    location: '§6、图 4、表 6',
    page: 8,
    kind: '原论文数据 + 掩码示意',
    text: '类别无关的 segmentation proposals，在 1000 个 proposals 上评估 segment AR；不是 Mask R-CNN 的实例分割 AP。训练 COCO train，评估 val 前 5k；此扩展使用 d=128。InstanceFCN 计时为 K40，其余为 M40。表中 FPN 改动逐步叠加，不能将每项增益视作互相独立。'
  },
  'fp-lineage': {
    location: 'FPN §3；下列后续论文摘要',
    page: 3,
    kind: '延伸阅读 · 非 FPN 实验结论',
    text: '连线表示本导读组织的主题关联，不证明直接继承或因果关系。FPN 的多尺度表示、YOLOX 的样本分配、ByteTrack 的跨帧关联与 ACM 的上下文调制需要分别阅读。'
  },
  'fp-limits': {
    location: '§3、表 1–6',
    page: 6,
    kind: '证据边界核对',
    text: '点击仅记录本次页面“已浏览”，不等于掌握原文，也不是训练或复现记录。比较数字时同时保留模型、评测集、proposal 数量、特征共享与硬件条件。'
  }
};
function withEvidence(Component, id) {
  return function EvidenceWidget(props) {
    const item = evidence[id];
    return <div className="fp-evidence-widget">
      <div className="fp-source-note" role="note"><span className="fp-source-kind">{item.kind}</span><p>{item.text}</p><a href={`${FPN_PDF}#page=${item.page}`} target="_blank" rel="noreferrer">原文定位：{item.location} ↗</a></div>
      <Component {...props} />
      {id === 'fp-lineage' && <div className="fp-related-links"><a href="https://arxiv.org/abs/2107.08430" target="_blank" rel="noreferrer">YOLOX 原文 ↗</a><a href="https://arxiv.org/abs/2110.06864" target="_blank" rel="noreferrer">ByteTrack 原文 ↗</a><a href="https://arxiv.org/abs/2009.14530" target="_blank" rel="noreferrer">ACM 原文 ↗</a></div>}
    </div>;
  };
}
export function CoverAnimationProvider({ children }) {
  const [progress, setProgress] = React.useState(1);
  const [playing, setPlaying] = React.useState(false);
  const [manuallyPaused, setManuallyPaused] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [pageVisible, setPageVisible] = React.useState(true);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const panelRef = React.useRef(null);
  const elapsed = React.useRef(0);
  const frame = React.useRef(null);
  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotion = () => {
      setReducedMotion(media.matches);
      if (media.matches) { elapsed.current = 6000; setProgress(1); setPlaying(false); }
    };
    handleMotion();
    if (!media.matches) { setProgress(0); setPlaying(true); }
    media.addEventListener('change', handleMotion);
    const handleVisibility = () => setPageVisible(!document.hidden);
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(
      entries => setVisible(entries.some(entry => entry.isIntersecting)), { threshold: 0.1 }
    );
    if (observer && panelRef.current) observer.observe(panelRef.current);
    else setVisible(true);
    return () => {
      media.removeEventListener('change', handleMotion);
      document.removeEventListener('visibilitychange', handleVisibility);
      observer?.disconnect();
    };
  }, []);
  React.useEffect(() => {
    if (!playing || manuallyPaused || hovered || !visible || !pageVisible || reducedMotion) return;
    let lastTime = null;
    const tick = now => {
      if (lastTime !== null) elapsed.current = Math.min(6000, elapsed.current + now - lastTime);
      lastTime = now;
      setProgress(elapsed.current / 6000);
      if (elapsed.current < 6000) frame.current = requestAnimationFrame(tick);
      else { frame.current = null; setPlaying(false); }
    };
    frame.current = requestAnimationFrame(tick);
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); frame.current = null; };
  }, [playing, manuallyPaused, hovered, visible, pageVisible, reducedMotion]);
  const replay = () => {
    if (reducedMotion) { setProgress(1); return; }
    elapsed.current = 0;
    setProgress(0);
    setManuallyPaused(false);
    setPlaying(true);
  };
  const status = reducedMotion ? '已减少动态效果，显示最终示意。' : !playing ? '同步演示完成。' : manuallyPaused ? '已暂停。' : hovered ? '指针移出图示后继续。' : !visible || !pageVisible ? '图示回到可见区域后继续。' : '两侧使用同一时间轴演示。';
  return <tr.Provider value={{ progress, playing: playing && !manuallyPaused && !hovered && visible && pageVisible }}>
    <div className="fp-cover-sync">
      <div className="fp-cover-panels" ref={panelRef} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>{children}</div>
      <div className="fp-cover-controls">
        <button type="button" className="fp-cover-control" disabled={reducedMotion} onClick={replay}>重新演示</button>
        <button type="button" className="fp-cover-control" disabled={reducedMotion || !playing} onClick={() => setManuallyPaused(value => !value)}>{manuallyPaused ? '继续' : '暂停'}</button>
        <span className="fp-cover-status" role="status">{status}</span>
      </div>
    </div>
  </tr.Provider>;
}
function AnimatedCover(props) {
  const moduleId = props.moduleId === 'new' || props.moduleId === 'newMethod' ? 'newMethod' : 'oldMethod';
  return <><CoverScene {...props} moduleId={moduleId} /><p className="fp-hero-note">手绘几何示意 · 不代表检测结果</p></>;
}
export const recoveredWidgets = {
  'fp-ablation': withEvidence(RpnAblation, 'fp-ablation'),
  'fp-anchors': withEvidence(AnchorMatcher, 'fp-anchors'),
  'fp-arch': withEvidence(PyramidArchitecture, 'fp-arch'),
  'fp-assign': withEvidence(RoiAssignment, 'fp-assign'),
  'fp-coco': withEvidence(CocoBenchmark, 'fp-coco'),
  'fp-cover': AnimatedCover,
  'fp-detect': withEvidence(DetectionAblation, 'fp-detect'),
  'fp-kit': UnusedWidget,
  'fp-limits': withEvidence(EvidenceChecklist, 'fp-limits'),
  'fp-lineage': withEvidence(RelatedReading, 'fp-lineage'),
  'fp-merge': withEvidence(FeatureMerge, 'fp-merge'),
  'fp-schemes': withEvidence(MultiscaleSchemes, 'fp-schemes'),
  'fp-seg': withEvidence(MaskProposals, 'fp-seg')
};
