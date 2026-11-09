// Adapted from the supplied NS-FPN guide; vendor runtime and fixed slideshow shell removed.
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as jsxRuntime from "react/jsx-runtime";
var W1 = jsxRuntime;
function gl({
  variant: t = "body",
  children: l,
  muted: e = !1
}) {
  return (0, W1.jsx)(t === "h1" || t === "h2" || t === "h3" ? t : "p", {
    className: `ppt-type ppt-type-${t}${e ? " ppt-muted" : ""}`,
    children: l
  });
}
var vn = React;
var ol = React,
  J1 = ReactDOM,
  yn = jsxRuntime;
function q2({
  children: t
}) {
  let l = (0, ol.useRef)(null),
    e = (0, ol.useRef)(null),
    a = (0, ol.useRef)(),
    [n, u] = (0, ol.useState)(null),
    [i, c] = (0, ol.useState)(!1),
    [o, s] = (0, ol.useState)({
      left: 12,
      top: 12
    }),
    d = (0, ol.useId)(),
    b = () => clearTimeout(a.current),
    p = () => {
      b(), u(null), c(!1);
    },
    S = () => {
      b(), i || (a.current = setTimeout(() => {
        l.current?.contains(document.activeElement) || u(null);
      }, 120));
    },
    K = x => x instanceof Element ? x.closest("[data-formula-symbol]") : null;
  return (0, ol.useLayoutEffect)(() => {
    if (!n || !e.current) return;
    let x = n.getBoundingClientRect(),
      H = e.current.getBoundingClientRect();
    return s({
      left: Math.max(12, Math.min(x.left + x.width / 2 - H.width / 2, window.innerWidth - H.width - 12)),
      top: Math.max(12, Math.min(x.bottom + 10 + H.height > window.innerHeight - 12 ? x.top - H.height - 10 : x.bottom + 10, window.innerHeight - H.height - 12))
    }), n.setAttribute("aria-describedby", d), () => n.removeAttribute("aria-describedby");
  }, [n, d]), (0, ol.useEffect)(() => {
    if (!n) return;
    let x = r => {
        !l.current?.contains(r.target) && !e.current?.contains(r.target) && p();
      },
      H = r => {
        r.key === "Escape" && p();
      };
    return document.addEventListener("pointerdown", x), document.addEventListener("keydown", H), document.addEventListener("fullscreenchange", p), window.addEventListener("resize", p), window.addEventListener("scroll", p, !0), () => {
      document.removeEventListener("pointerdown", x), document.removeEventListener("keydown", H), document.removeEventListener("fullscreenchange", p), window.removeEventListener("resize", p), window.removeEventListener("scroll", p, !0), b();
    };
  }, [n]), (0, yn.jsxs)("span", {
    ref: l,
    className: "formula-symbols",
    onPointerOver: x => {
      let H = K(x.target);
      H && (b(), u(H));
    },
    onPointerOut: S,
    onFocus: x => {
      let H = K(x.target);
      H && (b(), u(H));
    },
    onBlur: x => {
      !l.current?.contains(x.relatedTarget) && !i && p();
    },
    onClick: x => {
      let H = K(x.target);
      H && (b(), i && n === H ? p() : (u(H), c(!0)));
    },
    onKeyDown: x => {
      (x.key === "Enter" || x.key === " ") && K(x.target) && (x.preventDefault(), x.target.click());
    },
    children: [t, n && (0, J1.createPortal)((0, yn.jsx)("div", {
      ref: e,
      id: d,
      role: "tooltip",
      className: "formula-symbol-tooltip",
      style: o,
      onPointerEnter: b,
      onPointerLeave: S,
      children: n.dataset.formulaMeaning
    }), document.fullscreenElement ?? document.body)]
  });
}
function xt({
  children: t,
  meaning: l
}) {
  return (0, yn.jsx)(q2, {
    children: (0, yn.jsx)("span", {
      className: "formula-symbol",
      tabIndex: 0,
      role: "button",
      "aria-label": l,
      "data-formula-symbol": "",
      "data-formula-meaning": l,
      children: t
    })
  });
}
var Un = React,
  $ = jsxRuntime,
  m = {
    ink: "#21324a",
    muted: "#68778f",
    axis: "#d7deea",
    blue: "#27446e",
    green: "#228d5c",
    red: "#c43f52",
    orange: "#f07e47",
    purple: "#7c3aed",
    night: "#0d1624",
    deck: "#3a4a5f",
    scope: "#9fd3c7"
  },
  C = 128,
  rt = 96,
  Wt = C / 2,
  Gt = rt / 2,
  ht = (t, l, e) => Math.max(l, Math.min(e, t)),
  W2 = t => 1 / (1 + Math.exp(-t));
function rl(t, l, e = 0) {
  let a = Math.sin(t * 127.1 + l * 311.7 + e * 74.7) * 43758.5453;
  return a - Math.floor(a);
}
function fc(t, l, e, a) {
  let n = t / e,
    u = l / e,
    i = Math.floor(n),
    c = Math.floor(u),
    o = n - i,
    s = u - c,
    d = o * o * (3 - 2 * o),
    b = s * s * (3 - 2 * s),
    p = rl(i, c, a),
    S = rl(i + 1, c, a),
    K = rl(i, c + 1, a),
    x = rl(i + 1, c + 1, a);
  return p + (S - p) * d + (K - p) * b + (p - S - K + x) * d * b;
}
var st = [{
    x: 58,
    y: 20,
    a: .13,
    sg: 1.05,
    name: "夜空中的无人机",
    short: "无人机"
  }, {
    x: 37,
    y: 45,
    a: .14,
    sg: 1.1,
    name: "树冠上方的小鸟",
    short: "小鸟"
  }, {
    x: 79,
    y: 41,
    a: .13,
    sg: .75,
    name: "楼前的远处飞行物",
    short: "飞行物"
  }],
  J2 = (t, l) => ((t - 30) / 34) ** 2 + ((l - 80) / 26) ** 2 + (fc(t, l, 7, 5) - .5) * .45 < 1,
  V2 = (t, l) => t >= 94 && t <= 121 && l >= 30,
  B2 = [[18, 74], [46, 82]],
  Ap = null;
function N2() {
  if (Ap) return Ap;
  let t = new Float32Array(C * rt);
  for (let l = 0; l < rt; l++) for (let e = 0; e < C; e++) {
    let a = .27 + .05 * (l / rt) + Math.max(0, fc(e, l, 26, 1) - .45) * .18;
    if (l >= 88 && (a = .31 + .01 * fc(e, l, 5, 4)), J2(e, l)) {
      let n = rl(e, l, 7);
      a = .305 + .02 * fc(e, l, 4, 6) + (rl(e, l, 11) - .5) * F2, n > T2 ? a += .1 + .04 * rl(e, l, 8) : n < .05 && (a -= .03);
    }
    V2(e, l) && (a = .31, e >= 97 && e <= 118 && l >= 35 && (e - 97) % 6 === 0 && (l - 35) % 8 === 0 && rl(e, l, 3) > .45 && (a += .13)), a += (rl(e, l, 9) - .5) * .024, t[l * C + e] = a;
  }
  for (let [l, e] of B2) for (let a = 0; a < 2; a++) for (let n = 0; n < 2; n++) t[(e + a) * C + l + n] += .09;
  return Ap = t, t;
}
var T2 = .985,
  F2 = .07,
  yp = null;
function Ka() {
  if (yp) return yp;
  let t = new Float32Array(C * rt);
  for (let l = 0; l < rt; l++) for (let e = 0; e < C; e++) {
    let a = 0;
    for (let n of st) a = Math.max(a, Math.exp(-((e - n.x) ** 2 + (l - n.y) ** 2) / (2 * n.sg * n.sg)));
    t[l * C + e] = a;
  }
  return yp = t, t;
}
var Up = null;
function pl() {
  if (Up) return Up;
  let t = N2(),
    l = Float32Array.from(t);
  for (let e = 0; e < rt; e++) for (let a = 0; a < C; a++) {
    let n = 0;
    for (let u of st) n += u.a * Math.exp(-((a - u.x) ** 2 + (e - u.y) ** 2) / (2 * u.sg * u.sg));
    l[e * C + a] += n;
  }
  return Up = l, l;
}
function bc(t, l = C, e = rt) {
  let a = l / 2,
    n = e / 2,
    u = new Float32Array(a * n),
    i = new Float32Array(a * n),
    c = new Float32Array(a * n),
    o = new Float32Array(a * n);
  for (let s = 0; s < n; s++) for (let d = 0; d < a; d++) {
    let b = t[2 * s * l + 2 * d],
      p = t[2 * s * l + 2 * d + 1],
      S = t[(2 * s + 1) * l + 2 * d],
      K = t[(2 * s + 1) * l + 2 * d + 1],
      x = s * a + d;
    u[x] = (b + p + S + K) / 4, i[x] = (b + p - S - K) / 4, c[x] = (b - p + S - K) / 4, o[x] = (b - p - S + K) / 4;
  }
  return {
    LL: u,
    LH: i,
    HL: c,
    HH: o
  };
}
function B1(t, l = C, e = rt) {
  let a = l / 2,
    n = e / 2,
    u = new Float32Array(l * e);
  for (let i = 0; i < n; i++) for (let c = 0; c < a; c++) {
    let o = i * a + c,
      s = t.LL[o],
      d = t.LH[o],
      b = t.HL[o],
      p = t.HH[o];
    u[2 * i * l + 2 * c] = s + d + b + p, u[2 * i * l + 2 * c + 1] = s + d - b - p, u[(2 * i + 1) * l + 2 * c] = s - d + b - p, u[(2 * i + 1) * l + 2 * c + 1] = s - d - b + p;
  }
  return u;
}
function Kn(t) {
  let l = new Float32Array(t.LH.length);
  for (let e = 0; e < l.length; e++) l[e] = Math.hypot(t.LH[e], t.HL[e], t.HH[e]);
  return l;
}
function Kp(t, l = Wt, e = Gt) {
  let a = l * 2,
    n = e * 2,
    u = new Float32Array(a * n);
  for (let i = 0; i < n; i++) for (let c = 0; c < a; c++) u[i * a + c] = t[(i >> 1) * l + (c >> 1)];
  return u;
}
function xn(t, l, e = C, a = rt) {
  let n = new Float32Array(e * a),
    u = (2 * l + 1) ** 2;
  for (let i = 0; i < a; i++) for (let c = 0; c < e; c++) {
    let o = 0;
    for (let s = -l; s <= l; s++) {
      let d = ht(i + s, 0, a - 1) * e;
      for (let b = -l; b <= l; b++) o += t[d + ht(c + b, 0, e - 1)];
    }
    n[i * e + c] = o / u;
  }
  return n;
}
function R2(t, l, e) {
  let a = new Float32Array(t.length);
  for (let n = 0; n < e; n++) for (let u = 0; u < l; u++) {
    let i = -1 / 0;
    for (let c = -1; c <= 1; c++) for (let o = -1; o <= 1; o++) i = Math.max(i, t[ht(n + c, 0, e - 1) * l + ht(u + o, 0, l - 1)]);
    a[n * l + u] = i;
  }
  return a;
}
function xp(t, l = 5) {
  let e = Math.floor(l / 2),
    a = [],
    n = 0;
  for (let u = 0; u < l; u++) for (let i = 0; i < l; i++) {
    let c = Math.exp(-((u - e) ** 2 + (i - e) ** 2) / (2 * t * t));
    a.push(c), n += c;
  }
  return a.map(u => u / n);
}
function P2(t, l, e, a, n) {
  let u = new Float32Array(a * n),
    i = Math.floor(e / 2);
  for (let c = 0; c < n; c++) for (let o = 0; o < a; o++) {
    let s = 0;
    for (let d = 0; d < e; d++) {
      let b = ht(c + d - i, 0, n - 1) * a;
      for (let p = 0; p < e; p++) s += l[d * e + p] * t[b + ht(o + p - i, 0, a - 1)];
    }
    u[c * a + o] = s;
  }
  return u;
}
var Vu = .06;
function Et(t, l = Vu) {
  let e = Ka(),
    a = xn(t, 3),
    n = new Uint8Array(C * rt),
    u = 0,
    i = 0,
    c = 0,
    o = 0,
    s = st.map(() => !1);
  for (let p = 0; p < t.length; p++) {
    let S = t[p] - a[p] > l,
      K = e[p] > .5;
    S && (n[p] = 1, o++), S && K && i++, (S || K) && c++, S && e[p] < .05 && u++;
  }
  let d = 0,
    b = 0;
  for (let p = 0; p < st.length; p++) {
    let S = st[p];
    for (let K = -2; K <= 2 && !s[p]; K++) for (let x = -2; x <= 2; x++) if (n[(S.y + K) * C + S.x + x]) {
      s[p] = !0;
      break;
    }
    for (let K = -4; K <= 4; K++) for (let x = -4; x <= 4; x++) {
      let H = (S.y + K) * C + S.x + x,
        r = n[H] === 1,
        f = e[H] > .5;
      r && f && d++, (r || f) && b++;
    }
  }
  return {
    pred: n,
    hits: s,
    nHit: s.filter(Boolean).length,
    faPx: u,
    iou: c ? i / c : 0,
    tIoU: b ? d / b : 0,
    predPx: o
  };
}
var Tl = {
    gain: 300,
    bias: -10,
    tau: .03,
    sigma: 1
  },
  V1 = new Map();
function Gl(t = Tl, l = 2) {
  let e = `${t.gain}|${t.bias}|${t.tau}|${t.sigma}|${l}`,
    a = V1.get(e);
  if (a) return a;
  let n = pl(),
    u = bc(n),
    i = xn(u.LL, 2, Wt, Gt),
    c = u.LL.map((r, f) => r - i[f]),
    o = R2(c, Wt, Gt),
    s = o.map(r => W2(t.gain * r + t.bias)),
    d = {
      LL: u.LL,
      LH: u.LH.map((r, f) => r * s[f]),
      HL: u.HL.map((r, f) => r * s[f]),
      HH: u.HH.map((r, f) => r * s[f])
    },
    b = xp(t.sigma, 5),
    p = new Uint8Array(u.LL.length),
    S = Kn(d);
  for (let r = 0; r < p.length; r++) p[r] = S[r] >= t.tau ? 1 : 0;
  let K = d;
  if (l === 2) {
    let r = f => {
      let A = P2(f, b, 5, Wt, Gt);
      return f.map((y, g) => p[g] ? y : A[g]);
    };
    K = {
      LL: u.LL,
      LH: r(d.LH),
      HL: r(d.HL),
      HH: r(d.HH)
    };
  }
  let x = B1(K),
    H = {
      X: n,
      B: u,
      As: s,
      Fh1: d,
      gate: p,
      Fh2: K,
      Xp: x,
      cs: o
    };
  return V1.set(e, H), H;
}
function gp(t) {
  let l = bc(pl());
  return B1({
    LL: l.LL,
    LH: l.LH.map(e => e * t),
    HL: l.HL.map(e => e * t),
    HH: l.HH.map(e => e * t)
  });
}
function mp(t, l) {
  let e = ht(l, 0, 1),
    a = (n, u, i) => [0, 1, 2].map(c => Math.round(n[c] + (u[c] - n[c]) * i));
  if (t === "ir") {
    let n = [13, 22, 36],
      u = [120, 134, 150],
      i = [244, 246, 240];
    return e < .55 ? a(n, u, e / .55) : a(u, i, (e - .55) / .45);
  }
  return t === "att" ? a([248, 247, 253], [124, 58, 237], e) : t === "div" ? e < .5 ? a([39, 68, 110], [246, 247, 249], e / .5) : a([246, 247, 249], [196, 90, 40], (e - .5) / .5) : a([247, 249, 252], [39, 68, 110], e);
}
function Nt({
  data: t,
  w: l = C,
  h: e = rt,
  palette: a = "feat",
  vmin: n = 0,
  vmax: u = 1,
  gamma: i = 1,
  label: c,
  className: o
}) {
  let s = (0, Un.useRef)(null);
  return (0, Un.useEffect)(() => {
    let d = s.current;
    if (!d) return;
    let b = d.getContext("2d");
    if (!b) return;
    let p = b.createImageData(l, e);
    for (let S = 0; S < l * e; S++) {
      let [K, x, H] = mp(a, Math.pow(ht((t[S] - n) / (u - n), 0, 1), i));
      p.data[S * 4] = K, p.data[S * 4 + 1] = x, p.data[S * 4 + 2] = H, p.data[S * 4 + 3] = 255;
    }
    b.putImageData(p, 0, 0);
  }, [t, l, e, a, n, u, i]), (0, $.jsx)("canvas", {
    ref: s,
    width: l,
    height: e,
    className: `ns-canvas ${o ?? ""}`,
    role: "img",
    "aria-label": c
  });
}
function gn({
  s: t,
  showGt: l = !0,
  upto: e = C
}) {
  let a = Ka(),
    n = [];
  for (let u = 0; u < rt; u++) for (let i = 0; i < Math.min(C, e); i++) {
    let c = u * C + i;
    t.pred[c] && n.push((0, $.jsx)("rect", {
      x: i,
      y: u,
      width: 1.02,
      height: 1.02,
      fill: a[c] >= .05 ? m.green : m.red,
      opacity: .95
    }, c));
  }
  return (0, $.jsxs)("g", {
    pointerEvents: "none",
    children: [n, l && st.map((u, i) => u.x <= e ? (0, $.jsx)("circle", {
      cx: u.x + .5,
      cy: u.y + .5,
      r: 4.2,
      fill: "none",
      stroke: t.hits[i] ? m.green : m.orange,
      strokeWidth: .55,
      strokeDasharray: t.hits[i] ? void 0 : "1.3 0.9"
    }, i) : null)]
  });
}
function Yl({
  x: t = 0,
  y: l = 0,
  w: e = C,
  h: a = rt
}) {
  let n = Math.min(e, a) * .08,
    u = t + 2,
    i = l + 2,
    c = t + e - 2,
    o = l + a - 2;
  return (0, $.jsx)("g", {
    pointerEvents: "none",
    stroke: m.scope,
    strokeWidth: .6,
    fill: "none",
    opacity: .85,
    children: (0, $.jsx)("path", {
      d: `M${u} ${i + n} V${i} H${u + n} M${c - n} ${i} H${c} V${i + n} M${c} ${o - n} V${o} H${c - n} M${u + n} ${o} H${u} V${o - n}`
    })
  });
}
function vp() {
  return (0, $.jsxs)("svg", {
    className: "ns-sym",
    viewBox: "0 0 20 20",
    "aria-label": "⊙",
    role: "img",
    children: [(0, $.jsx)("circle", {
      cx: "10",
      cy: "10",
      r: "8",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2"
    }), (0, $.jsx)("circle", {
      cx: "10",
      cy: "10",
      r: "2.4",
      fill: "currentColor"
    })]
  });
}
function kp({
  state: t = "clean"
}) {
  return (0, $.jsxs)("g", {
    children: [(0, $.jsx)("path", {
      d: "M38 78 L22 118 M46 78 V118 M54 78 L70 118",
      stroke: m.deck,
      strokeWidth: "4",
      strokeLinecap: "round"
    }), (0, $.jsx)("rect", {
      x: "14",
      y: "30",
      width: "64",
      height: "48",
      rx: "10",
      fill: m.deck
    }), (0, $.jsx)("rect", {
      x: "78",
      y: "40",
      width: "16",
      height: "26",
      rx: "4",
      fill: "#536379"
    }), (0, $.jsx)("rect", {
      x: "22",
      y: "38",
      width: "44",
      height: "32",
      rx: "5",
      fill: m.night
    }), t !== "idle" && (0, $.jsx)("circle", {
      cx: "50",
      cy: "50",
      r: "2.6",
      fill: m.scope
    }), t === "noisy" && (0, $.jsxs)($.Fragment, {
      children: [(0, $.jsx)("circle", {
        cx: "30",
        cy: "62",
        r: "1.8",
        fill: m.red
      }), (0, $.jsx)("circle", {
        cx: "40",
        cy: "64",
        r: "1.8",
        fill: m.red
      }), (0, $.jsx)("circle", {
        cx: "58",
        cy: "62",
        r: "1.8",
        fill: m.red
      })]
    }), t === "clean" && (0, $.jsx)("rect", {
      x: "45",
      y: "45",
      width: "10",
      height: "10",
      fill: "none",
      stroke: m.green,
      strokeWidth: "1.6"
    })]
  });
}
function hp({
  x: t = 0,
  y: l = 0,
  s: e = 1
}) {
  return (0, $.jsxs)("g", {
    transform: `translate(${t} ${l}) scale(${e})`,
    children: [(0, $.jsx)("path", {
      d: "M6 6 L34 22 M34 6 L6 22",
      stroke: m.deck,
      strokeWidth: "3"
    }), (0, $.jsx)("rect", {
      x: "13",
      y: "10",
      width: "14",
      height: "8",
      rx: "3",
      fill: "#536379"
    }), [[6, 6], [34, 6], [6, 22], [34, 22]].map(([a, n], u) => (0, $.jsx)("ellipse", {
      cx: a,
      cy: n,
      rx: "7",
      ry: "2",
      fill: m.deck,
      opacity: "0.75"
    }, u))]
  });
}
function Cl({
  state: t = "clean",
  className: l = ""
}) {
  return (0, $.jsxs)("svg", {
    viewBox: "0 0 150 124",
    className: `ns-theme ${l}`,
    "aria-hidden": "true",
    children: [(0, $.jsx)(kp, {
      state: t
    }), (0, $.jsx)(hp, {
      x: 104,
      y: 6,
      s: 1
    }), (0, $.jsx)("path", {
      d: "M94 50 L112 30",
      stroke: m.scope,
      strokeWidth: "2",
      strokeDasharray: "4 3"
    })]
  });
}
function Sc(t, l, e) {
  if (!t) return null;
  let a = t.getScreenCTM();
  if (!a) return null;
  let n = new DOMPoint(l, e).matrixTransform(a.inverse());
  return {
    x: n.x,
    y: n.y
  };
}
function N1(t, l) {
  let e = (0, Un.useRef)(null),
    a = (0, Un.useRef)(l);
  a.current = l;
  let n = u => {
    e.current === u.pointerId && (e.current = null, a.current.end?.());
  };
  return {
    onPointerDown: u => {
      if (!u.isPrimary || u.pointerType === "mouse" && u.button !== 0) return;
      let i = Sc(t.current, u.clientX, u.clientY);
      i && (e.current = u.pointerId, u.currentTarget.setPointerCapture(u.pointerId), a.current.start?.(i.x, i.y), a.current.move(i.x, i.y));
    },
    onPointerMove: u => {
      if (e.current !== u.pointerId) return;
      let i = Sc(t.current, u.clientX, u.clientY);
      i && a.current.move(i.x, i.y);
    },
    onPointerUp: n,
    onPointerCancel: n
  };
}
function Ac(t, l) {
  let a = {
    ArrowLeft: [-l, 0],
    ArrowRight: [l, 0],
    ArrowUp: [0, -l],
    ArrowDown: [0, l]
  }[t.key];
  return a ? (t.preventDefault(), a) : null;
}
function mn(t, l = 20) {
  let e = t.match(/^(.*?)_(?:\{([^}]*)\}|(\S))(.*)$/);
  return e ? (0, $.jsxs)($.Fragment, {
    children: [e[1], (0, $.jsx)("tspan", {
      baselineShift: "sub",
      fontSize: l,
      children: e[2] ?? e[3]
    }), mn(e[4], l)]
  }) : t;
}
function T1(t) {
  return null;
}
var M = jsxRuntime,
  F1 = {
    irstd: {
      "00": [67.04, 91.16, 13.06],
      10: [68.82, 94.56, 9.79],
      "01": [67.81, 93.88, 13.66],
      11: [69.29, 95.24, 8.58]
    },
    nuaa: {
      "00": [76.04, 99.08, 12.42],
      10: [76.99, 100, 12.07],
      "01": [78.07, 100, 4.61],
      11: [78.75, 100, 1.6]
    }
  },
  R1 = {
    "00": ["3.91M", "6.80G"],
    10: ["+0.01M", "+0.01G"],
    "01": ["+0.25M", "+1.15G"],
    11: ["+0.26M", "+1.16G"]
  };
function P1(t) {
  let [l, e] = (0, vn.useState)(!0),
    [a, n] = (0, vn.useState)(!0),
    [u, i] = (0, vn.useState)("irstd"),
    c = `${l ? 1 : 0}${a ? 1 : 0}`,
    [o, s, d] = F1[u][c],
    [b, p, S] = F1[u]["00"],
    K = (0, vn.useMemo)(() => {
      let A = l ? Gl(Tl, 2).Xp : pl();
      return {
        X: A,
        s: Et(A)
      };
    }, [l]),
    r = (A, y, g, k, j, J, R = "") => {
      let z = k ? y < g : y > g,
        at = y === g;
      return (0, M.jsxs)("div", {
        className: "ns-metric",
        children: [(0, M.jsxs)("div", {
          className: "ns-metric-head",
          children: [(0, M.jsx)("span", {
            className: "ns-text",
            children: A
          }), (0, M.jsxs)("b", {
            className: `ns-em ${at ? "" : z ? "is-good" : "is-bad"}`,
            children: [y.toFixed(2), (0, M.jsx)("span", {
              className: "ns-text ns-muted",
              children: J
            })]
          })]
        }), (0, M.jsxs)("div", {
          className: "ns-track",
          children: [(0, M.jsx)("i", {
            className: "is-base",
            style: {
              width: `${g / j * 100}%`
            }
          }), (0, M.jsx)("i", {
            style: {
              width: `${y / j * 100}%`,
              background: at ? "#9fb0c8" : z ? m.green : m.red
            }
          })]
        }), (0, M.jsxs)("div", {
          className: "ns-text ns-muted",
          children: ["基线 ", g.toFixed(2), at ? "" : `\uFF0C${y > g ? "+" : ""}${(y - g).toFixed(2)}`, R]
        })]
      });
    },
    f = u === "irstd" ? c === "01" ? "IRSTD-1k：只加 SFS，Fa 反而从 13.06 升到 13.66；IoU、Pd 有提升。" : c === "10" ? "IRSTD-1k：只加 LFP，三项都改善，Fa 降 3.27——与论文正文一致。" : c === "11" ? "两个都加：IoU 69.29、Pd 95.24、Fa 8.58，三项都是表 2 最好。" : "基线 MSHNet（带普通 FPN）。" : c === "01" ? "NUAA-SIRST：只加 SFS，Fa 就从 12.42 降到 4.61；只加 LFP 只降到 12.07。两个数据集上降虚警的主力不同。" : c === "10" ? "NUAA-SIRST：只加 LFP，Fa 只从 12.42 降到 12.07，Pd 到 100。" : c === "11" ? "两个都加：Fa 1.60；三种加模块配置在本表中的 Pd 均为 100%。这不代表其他数据或设置下不会漏检。" : "基线 MSHNet（带普通 FPN）。";
  return (0, M.jsxs)("div", {
    className: "ns-page ns-ablation-page",
    children: [(0, M.jsxs)("div", {
      className: "ns-ablation-left",
      children: [(0, M.jsxs)("div", {
        className: "ns-toggles",
        children: [(0, M.jsx)("button", {
          className: `ns-toggle ${l ? "is-on" : ""}`,
          "aria-pressed": l,
          onClick: () => e(A => !A),
          children: "LFP"
        }), (0, M.jsx)("button", {
          className: `ns-toggle ${a ? "is-on" : ""}`,
          "aria-pressed": a,
          onClick: () => n(A => !A),
          children: "SFS"
        })]
      }), (0, M.jsx)("div", {
        className: "ns-chips",
        role: "group",
        "aria-label": "数据集",
        children: [["irstd", "IRSTD-1k"], ["nuaa", "NUAA-SIRST"]].map(([A, y]) => (0, M.jsx)("button", {
          className: `ns-chip ${u === A ? "is-on" : ""}`,
          "aria-pressed": u === A,
          onClick: () => i(A),
          children: y
        }, A))
      }), (0, M.jsxs)("div", {
        className: "ns-view ns-abl-toy",
        children: [(0, M.jsx)(Nt, {
          data: K.X,
          palette: "ir",
          vmin: .2,
          vmax: .62,
          label: l ? "示意：经 LFP 净化后的检测" : "示意：原特征上的检测"
        }), (0, M.jsxs)("svg", {
          viewBox: `0 0 ${C} ${rt}`,
          "aria-hidden": "true",
          children: [(0, M.jsx)(Yl, {}), (0, M.jsx)(gn, {
            s: K.s
          })]
        }), (0, M.jsxs)("div", {
          className: "ns-badge",
          children: ["示意：虚警 ", K.s.faPx, " 像素"]
        })]
      }), (0, M.jsx)("div", {
        className: "ns-text ns-muted",
        children: "缩略画面只演示 LFP；SFS 不在此处模拟。虚警像素采用教学简化规则，论文实现使用连通组件匹配。"
      })]
    }), (0, M.jsxs)("div", {
      className: "ns-ablation-right",
      children: [(0, M.jsxs)("div", {
        className: "ns-metrics",
        children: [r("IoU", o, b, !1, 100, "%"), r((0, M.jsxs)(xt, {
          meaning: "Pd 按原论文以百分比报告；这里仅比较百分点，不据有限小数反推测试目标数。",
          children: ["P", (0, M.jsx)("sub", {
            children: "d"
          })]
        }), s, p, !1, 100, "%", ""), r((0, M.jsxs)(M.Fragment, {
          children: ["F", (0, M.jsx)("sub", {
            children: "a"
          }), "（×10⁻⁶）"]
        }), d, S, !0, 16, "")]
      }), (0, M.jsxs)("table", {
        className: "ns-table",
        children: [(0, M.jsx)("thead", {
          children: (0, M.jsxs)("tr", {
            children: [(0, M.jsx)("th", {
              children: "表 6（IRSTD-1k）"
            }), (0, M.jsx)("th", {
              children: "参数量"
            }), (0, M.jsx)("th", {
              children: "FLOPs"
            })]
          })
        }), (0, M.jsx)("tbody", {
          children: ["00", "10", "01", "11"].map(A => (0, M.jsxs)("tr", {
            className: A === c ? "is-row-on" : "",
            children: [(0, M.jsx)("td", {
              children: A === "00" ? "基线" : A === "10" ? "+ LFP" : A === "01" ? "+ SFS" : "+ LFP + SFS"
            }), (0, M.jsx)("td", {
              children: R1[A][0]
            }), (0, M.jsx)("td", {
              children: R1[A][1]
            })]
          }, A))
        })]
      }), (0, M.jsx)("div", {
        className: `ns-feedback ${c === "01" && u === "irstd" ? "is-bad" : c === "00" ? "" : "is-good"}`,
        "aria-live": "polite",
        children: f
      })]
    })]
  });
}
var jp = React;
var h = jsxRuntime,
  z1 = {
    y: {
      title: "上一层特征",
      head: (0, h.jsxs)(h.Fragment, {
        children: ["上一层特征 Y", (0, h.jsx)("sub", {
          children: "i+1"
        })]
      }),
      shape: (0, h.jsxs)(h.Fragment, {
        children: ["B×C×H", (0, h.jsx)("sub", {
          children: "i+1"
        }), "×W", (0, h.jsx)("sub", {
          children: "i+1"
        }), "，C = 64"]
      }),
      body: (0, h.jsx)(h.Fragment, {
        children: "更深一层、分辨率减半，语义更强；提供 key 与 value。"
      }),
      src: "第 3 节、3.2 节"
    },
    p: {
      title: "参考点与偏移",
      head: "参考点 p 与偏移 Δp",
      shape: (0, h.jsxs)(h.Fragment, {
        children: ["p ∈ ℝ", (0, h.jsxs)("sup", {
          children: ["H", (0, h.jsx)("sub", {
            children: "G"
          }), "×W", (0, h.jsx)("sub", {
            children: "G"
          }), "×2"]
        }), "，Δp = s + ε"]
      }),
      body: (0, h.jsxs)(h.Fragment, {
        children: ["均匀网格加螺旋偏移 s 与可学习偏置 ε，所有 query 共用；H", (0, h.jsx)("sub", {
          children: "G"
        }), "×W", (0, h.jsx)("sub", {
          children: "G"
        }), " 论文未给出。"]
      }),
      src: "式 (7)–(8)"
    },
    phi: {
      title: "双线性采样",
      head: "双线性采样 φ",
      shape: (0, h.jsxs)(h.Fragment, {
        children: ["Y′", (0, h.jsx)("sub", {
          children: "i+1"
        }), " = φ(Y", (0, h.jsx)("sub", {
          children: "i+1"
        }), "; p + Δp)"]
      }),
      body: (0, h.jsx)(h.Fragment, {
        children: "在螺旋位置插值取值，取代 FPN 的“整图上采样 2 倍”。"
      }),
      src: "式 (7)"
    },
    x: {
      title: "本层特征",
      head: (0, h.jsxs)(h.Fragment, {
        children: ["本层特征 X′", (0, h.jsx)("sub", {
          children: "i"
        })]
      }),
      shape: (0, h.jsxs)(h.Fragment, {
        children: ["B×C×H", (0, h.jsx)("sub", {
          children: "i"
        }), "×W", (0, h.jsx)("sub", {
          children: "i"
        })]
      }),
      body: (0, h.jsx)(h.Fragment, {
        children: "LFP 净化后的本层特征，经 LN 后作 query。"
      }),
      src: "式 (9)"
    },
    fc: {
      title: "FC + Softmax",
      head: "FC + Softmax 权重",
      shape: (0, h.jsxs)(h.Fragment, {
        children: ["X′", (0, h.jsx)("sub", {
          children: "i"
        }), " → FC → Softmax，⊗ 采样特征"]
      }),
      body: (0, h.jsx)(h.Fragment, {
        children: "图 3 画出这条支路，得到的权重乘到采样特征上；正文没有给出公式。"
      }),
      src: "图 3（正文未展开）"
    },
    attn: {
      title: "交叉注意力",
      head: "多头交叉注意力",
      shape: (0, h.jsxs)(h.Fragment, {
        children: ["F", (0, h.jsx)("sub", {
          children: "s"
        }), " = Attn(LN(X′", (0, h.jsx)("sub", {
          children: "i"
        }), "), LN(Y′", (0, h.jsx)("sub", {
          children: "i+1"
        }), "))"]
      }),
      body: (0, h.jsx)(h.Fragment, {
        children: "由本层 query 引导，对采样的上层特征加权汇总；图 3 画出 FC + Softmax 权重支路。"
      }),
      src: "式 (9)、图 6"
    },
    res: {
      title: "残差相加",
      head: "残差相加",
      shape: (0, h.jsxs)(h.Fragment, {
        children: ["Y", (0, h.jsx)("sub", {
          children: "i"
        }), " = X′", (0, h.jsx)("sub", {
          children: "i"
        }), " + F", (0, h.jsx)("sub", {
          children: "s"
        })]
      }),
      body: (0, h.jsxs)(h.Fragment, {
        children: ["FPN 是 Y", (0, h.jsx)("sub", {
          children: "i"
        }), " = Conv", (0, h.jsx)("sub", {
          children: "1×1"
        }), "(C", (0, h.jsx)("sub", {
          children: "i"
        }), ") + Up(Y", (0, h.jsx)("sub", {
          children: "i+1"
        }), ")：相加保留，加进来的内容变了。Y", (0, h.jsx)("sub", {
          children: "4"
        }), " 无 SFS。"]
      }),
      src: "式 (10)、图 3 注"
    }
  },
  G1 = [{
    id: "y",
    x: 20,
    y: 14,
    w: 250,
    label: "Y_{i+1}",
    tone: "in"
  }, {
    id: "p",
    x: 20,
    y: 146,
    w: 250,
    label: "p + Δp 螺旋",
    tone: "new"
  }, {
    id: "phi",
    x: 330,
    y: 146,
    w: 230,
    label: "双线性 φ",
    tone: "op"
  }, {
    id: "x",
    x: 20,
    y: 290,
    w: 250,
    label: "X′_i",
    tone: "in"
  }, {
    id: "fc",
    x: 330,
    y: 290,
    w: 230,
    label: "FC + Softmax",
    tone: "op"
  }, {
    id: "attn",
    x: 610,
    y: 396,
    w: 250,
    label: "交叉注意力",
    tone: "new"
  }, {
    id: "res",
    x: 610,
    y: 506,
    w: 250,
    label: "Y_i = X′_i + F_s",
    tone: "op"
  }],
  C1 = [{
    name: "上采样",
    iou: 68.82,
    pd: 94.56,
    fa: 9.79,
    fl: 0
  }, {
    name: "DAT",
    iou: 68.52,
    pd: 93.54,
    fa: 10.4,
    fl: 1.24
  }, {
    name: "SFS",
    iou: 69.29,
    pd: 95.24,
    fa: 8.58,
    fl: 1.16
  }],
  Q1 = {
    iou: "IoU",
    pd: "Pd",
    fa: "Fa",
    fl: "+FLOPs"
  };
function D1(t) {
  let [l, e] = (0, jp.useState)("p"),
    [a, n] = (0, jp.useState)("fa"),
    u = z1[l],
    i = p => G1.find(S => S.id === p),
    c = p => i(p).x + i(p).w / 2,
    o = C1.map(p => p[a]),
    s = a === "fl" ? 0 : Math.min(...o) - (a === "fa" ? 1 : .6),
    d = Math.max(...o) + (a === "fl" ? .2 : .3),
    b = a === "fa" || a === "fl" ? Math.min(...o) : Math.max(...o);
  return (0, h.jsxs)("div", {
    className: "ns-page ns-attn-page",
    children: [jsxRuntime.jsx("div", {
      className: "ns-chart-scroll",
      children: (0, h.jsxs)("svg", {
        className: "ns-svg ns-attn-diagram",
        viewBox: "0 0 880 600",
        role: "group",
        "aria-label": "SFS 数据流：点击各步骤查看说明",
        children: [(0, h.jsx)("defs", {
          children: (0, h.jsx)("marker", {
            id: "ns-ah",
            viewBox: "0 0 10 10",
            refX: "9",
            refY: "5",
            markerWidth: "7",
            markerHeight: "7",
            orient: "auto",
            children: (0, h.jsx)("path", {
              d: "M0 0 L10 5 L0 10 Z",
              fill: m.muted
            })
          })
        }), (0, h.jsxs)("g", {
          stroke: m.muted,
          strokeWidth: 2.5,
          fill: "none",
          markerEnd: "url(#ns-ah)",
          children: [(0, h.jsx)("path", {
            d: "M145 84 V142"
          }), (0, h.jsx)("path", {
            d: "M270 181 H326"
          }), (0, h.jsx)("path", {
            d: "M560 181 H612"
          }), (0, h.jsx)("path", {
            d: "M445 290 V246 H640 V207"
          }), (0, h.jsx)("path", {
            d: "M662 181 H735 V392"
          }), (0, h.jsx)("path", {
            d: "M270 325 H326"
          }), (0, h.jsx)("path", {
            d: "M200 360 V431 H606"
          }), (0, h.jsx)("path", {
            d: "M735 466 V502"
          }), (0, h.jsx)("path", {
            d: "M80 360 V541 H606"
          })]
        }), (0, h.jsx)("circle", {
          cx: 640,
          cy: 181,
          r: 22,
          fill: "#ffffff",
          stroke: m.muted,
          strokeWidth: 2.5
        }), (0, h.jsx)("path", {
          d: "M625 166 L655 196 M655 166 L625 196",
          stroke: m.muted,
          strokeWidth: 2.5
        }), (0, h.jsxs)("g", {
          transform: "translate(690 8) scale(0.95)",
          "aria-hidden": "true",
          children: [(0, h.jsx)(kp, {
            state: "clean"
          }), (0, h.jsx)(hp, {
            x: 104,
            y: 4
          }), (0, h.jsx)("path", {
            d: "M94 50 L112 30",
            stroke: m.scope,
            strokeWidth: "2",
            strokeDasharray: "4 3"
          })]
        }), (0, h.jsx)("text", {
          x: 748,
          y: 300,
          fontSize: 24,
          fill: m.muted,
          children: "K, V"
        }), (0, h.jsx)("text", {
          x: 560,
          y: 420,
          fontSize: 24,
          fill: m.muted,
          children: "Q"
        }), (0, h.jsx)("text", {
          x: 450,
          y: 236,
          fontSize: 22,
          fill: m.muted,
          children: "权重"
        }), G1.map(p => {
          let S = p.id === l,
            K = S ? "#fff3ea" : p.tone === "new" ? "#e9f5ee" : p.tone === "in" ? "#eef3fa" : "#ffffff",
            x = S ? m.orange : p.tone === "new" ? m.green : "#c8d2df";
          return (0, h.jsxs)("g", {
            className: "ns-hot",
            role: "button",
            tabIndex: 0,
            "aria-pressed": S,
            "aria-label": z1[p.id].title,
            onClick: () => e(p.id),
            onKeyDown: H => {
              (H.key === "Enter" || H.key === " ") && (H.preventDefault(), e(p.id));
            },
            children: [(0, h.jsx)("rect", {
              x: p.x,
              y: p.y,
              width: p.w,
              height: 70,
              rx: 16,
              fill: K,
              stroke: x,
              strokeWidth: S ? 4 : 2.5
            }), (0, h.jsx)("text", {
              x: p.x + p.w / 2,
              y: p.y + 45,
              textAnchor: "middle",
              fontSize: 28,
              fontWeight: S ? 750 : 600,
              fill: m.ink,
              children: mn(p.label)
            })]
          }, p.id);
        }), (0, h.jsx)("text", {
          x: 20,
          y: 592,
          fontSize: 24,
          fill: m.muted,
          children: "绿框 = SFS 新增；点任一步看说明"
        })]
      })
    }), (0, h.jsxs)("div", {
      className: "ns-side ns-attn-side",
      children: [(0, h.jsxs)("div", {
        className: "ns-panel",
        children: [(0, h.jsx)("div", {
          className: "ns-h",
          children: u.head
        }), (0, h.jsx)("div", {
          className: "ns-formula ns-text",
          children: (0, h.jsx)("b", {
            children: u.shape
          })
        }), (0, h.jsx)("div", {
          className: "ns-text",
          children: u.body
        }), (0, h.jsxs)("div", {
          className: "ns-text ns-muted",
          children: ["出处：", u.src]
        })]
      }), (0, h.jsx)("div", {
        className: "ns-chips",
        role: "group",
        "aria-label": "表 1 指标",
        children: Object.keys(Q1).map(p => (0, h.jsx)("button", {
          className: `ns-chip ${a === p ? "is-on" : ""}`,
          "aria-pressed": a === p,
          onClick: () => n(p),
          children: Q1[p]
        }, p))
      }), (0, h.jsx)("div", {
        className: "ns-bars",
        children: C1.map(p => {
          let S = p[a],
            K = a === "fl" ? S / 1.4 * 100 : (S - s) / (d - s) * 100;
          return (0, h.jsxs)("div", {
            className: "ns-bar",
            children: [(0, h.jsx)("span", {
              children: p.name
            }), (0, h.jsx)("i", {
              style: {
                width: `${Math.max(2, K)}%`,
                background: p.name === "SFS" ? m.green : p.name === "DAT" ? m.red : "#9fb0c8"
              }
            }), (0, h.jsx)("b", {
              className: S === b ? "is-good" : "",
              children: a === "fl" ? S === 0 ? "6.80G" : `+${S.toFixed(2)}G` : S.toFixed(2)
            })]
          }, p.name);
        })
      }), (0, h.jsx)("div", {
        className: "ns-feedback",
        "aria-live": "polite",
        children: a === "fl" ? "表 1：SFS 比上采样多 1.16G FLOPs，比 DAT 少 0.08G（共享偏移，不必为每个 query 预测偏移）。" : a === "fa" ? "表 1：DAT 的 Fa 反而比上采样高（10.40 > 9.79）；SFS 降到 8.58。" : a === "iou" ? "表 1：DAT 的 IoU 低于上采样（68.52 < 68.82），SFS 为 69.29。坐标轴不从 0 开始。" : "表 1：Pd 上 SFS 95.24 > 上采样 94.56 > DAT 93.54。坐标轴不从 0 开始。"
      })]
    })]
  });
}
var X1 = React;
var U = jsxRuntime,
  M1 = [{
    tag: "数字",
    title: "检测 mAP50 “两个数据集都最好”？",
    body: (0, U.jsxs)(U.Fragment, {
      children: [(0, U.jsx)("p", {
        children: "第 4.4 节写本文在两个数据集上 mAP50 都最好。表 5 的 NUAA-SIRST 一栏："
      }), (0, U.jsx)("table", {
        className: "ns-table",
        children: (0, U.jsxs)("tbody", {
          children: [(0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "EFLNet"
            }), (0, U.jsx)("td", {
              className: "is-good",
              children: "98.1（原表加粗）"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "YOLOv8n + NS-FPN"
            }), (0, U.jsx)("td", {
              children: "97.5（原表下划线）"
            })]
          })]
        })
      }), (0, U.jsx)("p", {
        children: "表格本身显示本文是第二。mAP75、mAP 两项本文确实最高。"
      })]
    })
  }, {
    tag: "数字",
    title: "表 3 的 6.15 属于哪一行",
    body: (0, U.jsxs)(U.Fragment, {
      children: [(0, U.jsx)("p", {
        children: "正文：“把 LFP 加在大尺度层（X1、X2）使 Fa 降到 6.15”。表 3："
      }), (0, U.jsx)("table", {
        className: "ns-table",
        children: (0, U.jsxs)("tbody", {
          children: [(0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "只加 X1"
            }), (0, U.jsx)("td", {
              className: "is-good",
              children: "Fa 6.15"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "加 X1、X2"
            }), (0, U.jsx)("td", {
              children: "Fa 8.35"
            })]
          })]
        })
      }), (0, U.jsx)("p", {
        children: "6.15 对应只加 X1 的那一行，与正文的说法差一行。"
      })]
    })
  }, {
    tag: "数字",
    title: "不同表格的数值精度",
    body: (0, U.jsxs)(U.Fragment, {
      children: [(0, U.jsx)("p", {
        children: "表 2 与表 4 分别报告下列数值，本页按各表原值呈现："
      }), (0, U.jsxs)("table", {
        className: "ns-table",
        children: [(0, U.jsx)("thead", {
          children: (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("th", {}), (0, U.jsx)("th", {
              children: "表 2"
            }), (0, U.jsx)("th", {
              children: "表 4"
            }), (0, U.jsx)("th", {
              children: "方式"
            })]
          })
        }), (0, U.jsxs)("tbody", {
          children: [(0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "FPN Pd"
            }), (0, U.jsx)("td", {
              children: "91.16"
            }), (0, U.jsx)("td", {
              children: "91.2"
            }), (0, U.jsx)("td", {
              children: "保留一位"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "本文 IoU"
            }), (0, U.jsx)("td", {
              children: "69.29"
            }), (0, U.jsx)("td", {
              children: "69.2"
            }), (0, U.jsx)("td", {
              children: "原表写法"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "本文 Fa"
            }), (0, U.jsx)("td", {
              children: "8.58"
            }), (0, U.jsx)("td", {
              children: "8.5"
            }), (0, U.jsx)("td", {
              children: "原表写法"
            })]
          })]
        })]
      }), (0, U.jsx)("p", {
        children: "这些显示并不都符合通常的四舍五入规则，不自行修改原表。表 4 的 PANet Fa 6.7 仍低于 NS-FPN 的 8.5。"
      })]
    })
  }, {
    tag: "基线",
    title: "表 5 的 MSHNet 与表 2 的基线不同",
    body: (0, U.jsxs)(U.Fragment, {
      children: [(0, U.jsxs)("table", {
        className: "ns-table",
        children: [(0, U.jsx)("thead", {
          children: (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("th", {
              children: "IRSTD-1k"
            }), (0, U.jsx)("th", {
              children: "IoU"
            }), (0, U.jsx)("th", {
              children: "Pd"
            }), (0, U.jsx)("th", {
              children: "Fa"
            })]
          })
        }), (0, U.jsxs)("tbody", {
          children: [(0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "表 2 基线"
            }), (0, U.jsx)("td", {
              children: "67.04"
            }), (0, U.jsx)("td", {
              children: "91.16"
            }), (0, U.jsx)("td", {
              children: "13.06"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "表 5 MSHNet"
            }), (0, U.jsx)("td", {
              children: "67.16"
            }), (0, U.jsx)("td", {
              children: "93.88"
            }), (0, U.jsx)("td", {
              children: "15.03"
            })]
          })]
        })]
      }), (0, U.jsx)("p", {
        children: "两表的基线数值不同，论文未在该处充分解释差异。消融增益应在表 2 内计算，方法比较应在表 5 内阅读，不能把两张表拼成同一组受控实验。"
      })]
    })
  }, {
    tag: "基线",
    title: "检测基线：FPN 还是 YOLOv8n 行",
    body: (0, U.jsxs)(U.Fragment, {
      children: [(0, U.jsx)("p", {
        children: "正文说检测基线是“带 FPN 的 YOLOv8n-p2”。"
      }), (0, U.jsxs)("table", {
        className: "ns-table",
        children: [(0, U.jsx)("thead", {
          children: (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("th", {
              children: "IRSTD-1k"
            }), (0, U.jsx)("th", {
              children: "mAP50"
            }), (0, U.jsx)("th", {
              children: "mAP"
            })]
          })
        }), (0, U.jsxs)("tbody", {
          children: [(0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "表 4 FPN"
            }), (0, U.jsx)("td", {
              children: "85.9"
            }), (0, U.jsx)("td", {
              children: "41.8"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "表 4 PANet"
            }), (0, U.jsx)("td", {
              children: "85.0"
            }), (0, U.jsx)("td", {
              children: "41.5"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "表 5 YOLOv8n"
            }), (0, U.jsx)("td", {
              children: "85.0"
            }), (0, U.jsx)("td", {
              children: "41.5"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "本文"
            }), (0, U.jsx)("td", {
              children: "86.3"
            }), (0, U.jsx)("td", {
              children: "42.1"
            })]
          })]
        })]
      }), (0, U.jsx)("p", {
        children: "表 5 的 YOLOv8n 行与表 4 的 PANet 行数值相同。相对表 4 的 FPN，本文只高 0.4 和 0.3。"
      })]
    })
  }, {
    tag: "推算",
    title: "百分比不能反推出测试目标数",
    body: (0, U.jsxs)(U.Fragment, {
      children: [(0, U.jsx)("p", {
        children: "论文报告 Pd 百分比，但仅凭有限小数位不能唯一反推出测试集目标总数。相似的数值颗粒度不足以证明采用了某个分母。"
      }), (0, U.jsx)("p", {
        children: "表 2 中 91.16% 到 95.24% 是 4.08 个百分点的提升；若要换算成目标个数，需要实际测试清单、匹配规则和逐样本预测。"
      }), (0, U.jsx)("p", {
        children: "本导读不据此猜测其他方法的测试来源或目标个数。报告精度、评价协议及来源应分别核实。"
      })]
    })
  }, {
    tag: "推算",
    title: "图 6 的 24 组与“上采样”对照",
    body: (0, U.jsxs)(U.Fragment, {
      children: [(0, U.jsx)("p", {
        children: "图 6 与表 1 都是“LFP + 某种融合”在 IRSTD-1k 上的结果。以表 1 的上采样（68.82 / 94.56 / 9.79）为参照，24 组 (H, P) 中："
      }), (0, U.jsx)("table", {
        className: "ns-table",
        children: (0, U.jsxs)("tbody", {
          children: [(0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "IoU 更高"
            }), (0, U.jsx)("td", {
              children: "3 组"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "Pd 更高"
            }), (0, U.jsx)("td", {
              children: "4 组"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "Fa 更低"
            }), (0, U.jsx)("td", {
              children: "2 组"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "三项都更好"
            }), (0, U.jsx)("td", {
              className: "is-bad",
              children: "1 组（H=8、P=4）"
            })]
          })]
        })
      }), (0, U.jsx)("p", {
        children: "论文说明 80% 训练、20% 测试；超参数选择所用验证集及多随机种子方差未详细报告，不能由此直接判定作者如何调参。"
      })]
    })
  }, {
    tag: "解读",
    title: "两个模块的作用随数据集变化",
    body: (0, U.jsxs)(U.Fragment, {
      children: [(0, U.jsxs)("table", {
        className: "ns-table",
        children: [(0, U.jsx)("thead", {
          children: (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("th", {
              children: "Fa（表 2）"
            }), (0, U.jsx)("th", {
              children: "IRSTD-1k"
            }), (0, U.jsx)("th", {
              children: "NUAA-SIRST"
            })]
          })
        }), (0, U.jsxs)("tbody", {
          children: [(0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "基线"
            }), (0, U.jsx)("td", {
              children: "13.06"
            }), (0, U.jsx)("td", {
              children: "12.42"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "只加 LFP"
            }), (0, U.jsx)("td", {
              className: "is-good",
              children: "9.79"
            }), (0, U.jsx)("td", {
              children: "12.07"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "只加 SFS"
            }), (0, U.jsx)("td", {
              className: "is-bad",
              children: "13.66"
            }), (0, U.jsx)("td", {
              className: "is-good",
              children: "4.61"
            })]
          }), (0, U.jsxs)("tr", {
            children: [(0, U.jsx)("td", {
              children: "两者"
            }), (0, U.jsx)("td", {
              children: "8.58"
            }), (0, U.jsx)("td", {
              children: "1.60"
            })]
          })]
        })]
      }), (0, U.jsx)("p", {
        children: "“LFP 净化高频、降低虚警”在 IRSTD-1k 上最明显；在 NUAA-SIRST 上，Fa 的下降主要来自 SFS。"
      })]
    })
  }, {
    tag: "复现",
    title: "论文没有给出的设置",
    body: (0, U.jsxs)(U.Fragment, {
      children: [(0, U.jsxs)("p", {
        children: ["τ、高斯核大小 k、σ 初值；式 (2) 卷积核大小；l₀、Δl、H", (0, U.jsx)("sub", {
          children: "G"
        }), "×W", (0, U.jsx)("sub", {
          children: "G"
        }), "、ε 的初始化及随机种子等细节，需要对照作者已公开的代码与配置。代码公开不等于本导读完成了模型训练或评估。"]
      }), (0, U.jsx)("p", {
        children: "另有两处表述需要对照：第 1 节说 LFP“替换 1×1 卷积”，第 3 节又说 1×1 卷积先把通道降到 64 再进 LFP；图 3 画了 FC + Softmax 支路，正文没有对应公式。"
      })]
    })
  }, {
    tag: "命名",
    title: "“NUAA-SIRST”这个名字",
    body: (0, U.jsxs)(U.Fragment, {
      children: [(0, U.jsx)("p", {
        children: "本文使用 NUAA-SIRST 这一名称，并引用 ACM 论文的数据集工作。本导读引用数字时沿用本文写法，同时保留论文报告的数据划分。"
      }), (0, U.jsx)("p", {
        children: "与 ACM 原论文的 SIRST 数字比较时，需要先核对划分与评价协议，不能只因名称相近就把数值直接并列排序。"
      })]
    })
  }],
  G2 = ["数字", "基线", "推算", "解读", "复现", "命名"];
function w1(t) {
  let [l, e] = (0, X1.useState)(0),
    a = M1[l];
  return (0, U.jsxs)("div", {
    className: "ns-page ns-check-page",
    children: [(0, U.jsx)("ol", {
      className: "ns-check-list",
      "aria-label": "核对条目",
      children: M1.map((n, u) => (0, U.jsx)("li", {
        children: (0, U.jsxs)("button", {
          className: `ns-check-item ${u === l ? "is-on" : ""}`,
          "aria-pressed": u === l,
          onClick: () => e(u),
          children: [(0, U.jsx)("span", {
            className: `ns-tag is-${G2.indexOf(n.tag)}`,
            children: n.tag
          }), (0, U.jsx)("span", {
            children: n.title
          })]
        })
      }, u))
    }), (0, U.jsxs)("div", {
      className: "ns-check-detail",
      children: [(0, U.jsx)("div", {
        className: "ns-h",
        children: a.title
      }), (0, U.jsx)("div", {
        className: "ns-text ns-check-body",
        children: a.body
      }), (0, U.jsx)(Cl, {
        state: a.tag === "复现" ? "idle" : "clean",
        className: "ns-check-theme"
      })]
    })]
  });
}
var Hp = React;
var yc = React,
  Op = (0, yc.createContext)({
    progress: 1,
    playing: !1
  }),
  L1 = () => (0, yc.useContext)(Op);
var _l = jsxRuntime,
  Ie = 10,
  kn = 76;
function Z1({
  moduleId: t
}) {
  let {
      progress: l
    } = L1(),
    e = t === "newMethod" || t === "new",
    a = e ? Gl(Tl, 2).Xp : pl(),
    n = (0, Hp.useMemo)(() => Et(a), [a]),
    u = (0, Hp.useMemo)(() => a.slice(Ie * C, (Ie + kn) * C), [a]),
    i = ht((l - .06) / .72, 0, 1) * C,
    c = l > .8,
    o = Ka(),
    s = 0,
    d = [];
  for (let p = Ie; p < Math.min(rt, Ie + kn); p++) for (let S = 0; S < C; S++) {
    let K = p * C + S;
    n.pred[K] && (o[K] < .05 && s++, S < i && d.push((0, _l.jsx)("rect", {
      x: S - .7,
      y: p - .7,
      width: 2.4,
      height: 2.4,
      fill: "none",
      stroke: o[K] >= .05 ? m.green : m.red,
      strokeWidth: .6
    }, K)));
  }
  let b = st.filter((p, S) => n.hits[S]).length;
  return (0, _l.jsxs)("div", {
    className: "ns-cover",
    children: [(0, _l.jsx)(Nt, {
      data: u,
      h: kn,
      palette: "ir",
      vmin: .2,
      vmax: .62,
      label: e ? "手工模拟：低频引导与门控平滑后的响应" : "手工模拟：高频增强同时突出目标与背景细节"
    }), (0, _l.jsxs)("svg", {
      viewBox: `0 ${Ie} ${C} ${kn}`,
      preserveAspectRatio: "none",
      "aria-hidden": "true",
      children: [(0, _l.jsx)(Yl, {
        y: Ie,
        h: kn
      }), i > 0 && i < C && (0, _l.jsx)("line", {
        x1: i,
        x2: i,
        y1: Ie,
        y2: Ie + kn,
        stroke: m.scope,
        strokeWidth: .5,
        opacity: .85
      }), d, st.map((p, S) => p.x < i ? (0, _l.jsx)("circle", {
        cx: p.x + .5,
        cy: p.y + .5,
        r: 4.4,
        fill: "none",
        stroke: m.orange,
        strokeWidth: .5,
        strokeDasharray: "1.3 0.9"
      }, S) : null)]
    }), (0, _l.jsx)("div", {
      className: `ns-cover-result ${c ? e ? "is-new" : "is-old" : ""}`,
      "aria-live": "polite",
      children: e ? "教学示意 · 低频引导与高频净化" : "教学示意 · 细节与背景同时增强"
    })]
  });
}
var Uc = React;
var B = jsxRuntime,
  C2 = .025;
function Q2(t, l) {
  let e = Ka(),
    a = new Uint8Array(C * rt),
    n = 0,
    u = 0,
    i = 0,
    c = 0,
    o = 0,
    s = 0;
  for (let b = 0; b < t.length; b++) {
    let p = t[b] > l,
      S = e[b] > .5;
    p && (a[b] = 1, u++, e[b] < .05 && n++), p && S && i++, (p || S) && c++;
  }
  let d = st.map(b => {
    let p = !1;
    for (let S = -4; S <= 4; S++) for (let K = -4; K <= 4; K++) {
      let x = (b.y + S) * C + b.x + K;
      Math.abs(K) <= 2 && Math.abs(S) <= 2 && a[x] && (p = !0);
      let H = a[x] === 1,
        r = e[x] > .5;
      H && r && o++, (H || r) && s++;
    }
    return p;
  });
  return {
    pred: a,
    hits: d,
    nHit: d.filter(Boolean).length,
    faPx: n,
    iou: c ? i / c : 0,
    tIoU: s ? o / s : 0,
    predPx: u
  };
}
var D2 = [{
  v: "X",
  name: "原图"
}, {
  v: "LL",
  name: (0, B.jsxs)(B.Fragment, {
    children: ["低频 F", (0, B.jsx)("sub", {
      children: "l"
    })]
  })
}, {
  v: "HF",
  name: (0, B.jsxs)(B.Fragment, {
    children: ["高频 F", (0, B.jsx)("sub", {
      children: "h"
    })]
  })
}];
function E1(t) {
  let [l, e] = (0, Uc.useState)("X"),
    a = (0, Uc.useMemo)(() => {
      let s = pl(),
        d = bc(s),
        b = Kn(d);
      return {
        X: s,
        B: d,
        M: b,
        sc: {
          X: Et(s),
          LL: Et(Kp(d.LL)),
          HF: Q2(Kp(b), C2)
        }
      };
    }, []),
    n = l === "X" ? "X" : l === "LL" ? "LL" : "HF",
    u = a.sc[n],
    i = l === "X" || l === "LL" || l === "HF",
    c = l === "X" ? (0, B.jsx)(Nt, {
      data: a.X,
      palette: "ir",
      vmin: .2,
      vmax: .62,
      label: "合成热像原图"
    }) : l === "LL" ? (0, B.jsx)(Nt, {
      data: a.B.LL,
      w: Wt,
      h: Gt,
      palette: "ir",
      vmin: .2,
      vmax: .62,
      label: "低频分量：2×2 块均值"
    }) : l === "HF" ? (0, B.jsx)(Nt, {
      data: a.M,
      w: Wt,
      h: Gt,
      palette: "feat",
      vmin: 0,
      vmax: .06,
      label: "高频幅值"
    }) : (0, B.jsx)(Nt, {
      data: a.B[l],
      w: Wt,
      h: Gt,
      palette: "div",
      vmin: -.05,
      vmax: .05,
      label: `${l} \u5B50\u5E26`
    }),
    o = l === "X" ? "原图：细节最全，3 个目标都找到，虚警来自树冠亮斑和亮窗。" : l === "LL" ? "低频：单像素亮斑被 2×2 平均冲淡，虚警最少；但最小的目标也被冲淡而漏检，目标形状变成方块（观察 ➋）。" : l === "HF" ? "高频：目标的边缘还在，所以 3 个都命中；树叶纹理和噪声同样落在高频里，虚警最多（观察 ➊）。" : `${l} \u5B50\u5E26\u53EA\u662F\u9AD8\u9891\u7684\u4E00\u4E2A\u65B9\u5411\u5206\u91CF\uFF1A${l === "LH" ? "上下差，对水平边敏感" : l === "HL" ? "左右差，对竖直边敏感" : "对角差"}\u3002`;
  return (0, B.jsxs)("div", {
    className: "ns-page ns-dwt-page",
    children: [(0, B.jsxs)("div", {
      className: "ns-dwt-left",
      children: [(0, B.jsxs)("div", {
        className: "ns-chips",
        role: "group",
        "aria-label": "查看哪一部分",
        children: [[["X", (0, B.jsx)(B.Fragment, {
          children: "原图 X"
        })], ["LL", (0, B.jsxs)(B.Fragment, {
          children: ["低频 F", (0, B.jsx)("sub", {
            children: "l"
          })]
        })], ["HF", (0, B.jsxs)(B.Fragment, {
          children: ["高频 F", (0, B.jsx)("sub", {
            children: "h"
          })]
        })]].map(([s, d]) => (0, B.jsx)("button", {
          className: `ns-chip ${l === s ? "is-on" : ""}`,
          "aria-pressed": l === s,
          onClick: () => e(s),
          children: d
        }, s)), (0, B.jsx)("span", {
          className: "ns-chip-gap",
          "aria-hidden": "true"
        }), ["LH", "HL", "HH"].map(s => (0, B.jsx)("button", {
          className: `ns-chip ${l === s ? "is-on" : ""}`,
          "aria-pressed": l === s,
          onClick: () => e(s),
          children: s
        }, s))]
      }), (0, B.jsxs)("div", {
        className: `ns-view ns-dwt-view ${l === "X" || l === "LL" ? "" : "is-light"}`,
        children: [c, (0, B.jsxs)("svg", {
          viewBox: `0 0 ${C} ${rt}`,
          "aria-hidden": "true",
          children: [(0, B.jsx)(Yl, {}), i && (0, B.jsxs)("g", {
            pointerEvents: "none",
            children: [Array.from(u.pred).map((s, d) => s ? (0, B.jsx)("rect", {
              x: d % C,
              y: Math.floor(d / C),
              width: 1.02,
              height: 1.02,
              fill: Ka()[d] >= .05 ? m.green : m.red,
              opacity: .9
            }, d) : null), st.map((s, d) => (0, B.jsx)("circle", {
              cx: s.x + .5,
              cy: s.y + .5,
              r: 4.2,
              fill: "none",
              stroke: u.hits[d] ? m.green : m.orange,
              strokeWidth: .55,
              strokeDasharray: u.hits[d] ? void 0 : "1.3 0.9"
            }, d))]
          })]
        })]
      })]
    }), (0, B.jsxs)("div", {
      className: "ns-side",
      children: [(0, B.jsxs)("div", {
        className: "ns-formula ns-h",
        children: ["[", (0, B.jsxs)(xt, {
          meaning: "F_l：低频分量。本页采用均值归一化的 Haar 教学分解，取每个 2×2 块的均值，分辨率减半；并非作者 DWT 的数值复刻。",
          children: ["F", (0, B.jsx)("sub", {
            children: "l"
          })]
        }), ", ", (0, B.jsxs)(xt, {
          meaning: "F_h：高频分量，含 LH、HL、HH 三个子带，是块内的上下、左右、对角差分，保留边缘和点状细节。",
          children: ["F", (0, B.jsx)("sub", {
            children: "h"
          })]
        }), "] = ", (0, B.jsx)(xt, {
          meaning: "DWT：单层二维离散小波变换。论文图 2 用 Haar 小波拆分原图，LFP 中对特征做同样的分解（式 1）。",
          children: "DWT"
        }), "(X)\u3000", (0, B.jsx)("span", {
          className: "ns-muted ns-text",
          children: "式 (1)"
        })]
      }), (0, B.jsxs)("table", {
        className: "ns-table",
        children: [(0, B.jsx)("thead", {
          children: (0, B.jsxs)("tr", {
            children: [(0, B.jsx)("th", {
              children: "示意检测"
            }), (0, B.jsx)("th", {
              children: "命中"
            }), (0, B.jsx)("th", {
              children: "虚警像素"
            }), (0, B.jsx)("th", {
              children: "目标处 IoU"
            })]
          })
        }), (0, B.jsx)("tbody", {
          children: D2.map(s => {
            let d = a.sc[s.v];
            return (0, B.jsxs)("tr", {
              className: n === s.v && i ? "is-row-on" : "",
              children: [(0, B.jsx)("td", {
                children: s.name
              }), (0, B.jsxs)("td", {
                className: d.nHit < 3 ? "is-bad" : "",
                children: [d.nHit, "/3"]
              }), (0, B.jsx)("td", {
                className: d.faPx === Math.min(a.sc.X.faPx, a.sc.LL.faPx, a.sc.HF.faPx) ? "is-good" : d.faPx === Math.max(a.sc.X.faPx, a.sc.LL.faPx, a.sc.HF.faPx) ? "is-bad" : "",
                children: d.faPx
              }), (0, B.jsx)("td", {
                children: d.tIoU.toFixed(2)
              })]
            }, s.v);
          })
        })]
      }), (0, B.jsxs)("div", {
        className: "ns-panel ns-text",
        children: [(0, B.jsxs)("div", {
          children: [(0, B.jsx)("b", {
            children: "➊"
          }), " 高频对定位关键，也带来虚警：原图的 IoU、P", (0, B.jsx)("sub", {
            children: "d"
          }), " 优于低频。"]
        }), (0, B.jsxs)("div", {
          children: [(0, B.jsx)("b", {
            children: "➋"
          }), " 低频削弱定位，却是压虚警的线索：F", (0, B.jsx)("sub", {
            children: "a"
          }), " 最好。"]
        }), (0, B.jsx)("div", {
          className: "ns-muted",
          children: "图 2 在 DNANet、MSHNet 上观察到这两点。"
        })]
      }), (0, B.jsx)("div", {
        className: `ns-feedback ${l === "HF" ? "is-bad" : l === "LL" ? "is-good" : ""}`,
        "aria-live": "polite",
        children: o
      })]
    })]
  });
}
var qp = React;
var Q = jsxRuntime,
  hn = [{
    name: "FPN",
    iou: 67,
    pd: 91.2,
    fa: 13.1,
    map50: 85.9,
    map: 41.8,
    p: 0,
    f: 0,
    desc: "自顶向下逐层上采样，与侧向 1×1 卷积相加。论文认为这种线性求和未必是最有效的融合。"
  }, {
    name: "PANet",
    iou: 68.9,
    pd: 93.5,
    fa: 6.7,
    map50: 85,
    map: 41.5,
    p: .41,
    f: 1.41,
    desc: "在 FPN 之后再加一条自底向上的路径，让低层特征被复用、信息路径更短。"
  }, {
    name: "BiFPN",
    iou: 66.9,
    pd: 93.5,
    fa: 12.1,
    map50: 85.8,
    map: 41.6,
    p: .39,
    f: 1.33,
    desc: "去掉只有一个输入的节点，双向融合并为每个输入学习权重。"
  }, {
    name: "HS-FPN",
    iou: 66.7,
    pd: 94.9,
    fa: 18.1,
    map50: 85.1,
    map: 41,
    p: .17,
    f: .98,
    desc: "面向可见光微小目标，依赖预设频段的高频；论文认为它忽视低频，不适合红外小目标。"
  }, {
    name: "NS-FPN",
    iou: 69.2,
    pd: 95.2,
    fa: 8.5,
    map50: 86.3,
    map: 42.1,
    p: .26,
    f: 1.16,
    desc: "侧向用 LFP 替换 1×1 卷积，自顶向下用 SFS 替换上采样，融合仍是相加。"
  }],
  Bu = {
    iou: "IoU",
    pd: "Pd",
    fa: "Fa",
    map50: "mAP50",
    map: "mAP",
    p: "+参数(M)",
    f: "+FLOPs(G)"
  },
  M2 = ["fa", "p", "f"];
function X2({
  name: t
}) {
  let l = [60, 130, 200],
    e = (u, i, c = "#c8d2df") => (0, Q.jsx)("rect", {
      x: u - 18,
      y: i - 14,
      width: 36,
      height: 28,
      rx: 6,
      fill: "#ffffff",
      stroke: c,
      strokeWidth: 3
    }),
    a = (u, i, c, o, s = m.muted) => (0, Q.jsx)("line", {
      x1: u,
      y1: i,
      x2: c,
      y2: o,
      stroke: s,
      strokeWidth: 3,
      markerEnd: "url(#ns-tp)"
    }),
    n = t === "NS-FPN";
  return (0, Q.jsxs)("svg", {
    viewBox: "0 0 300 230",
    className: "ns-topo",
    role: "img",
    "aria-label": `${t} \u7684\u7ED3\u6784\u793A\u610F`,
    children: [(0, Q.jsx)("defs", {
      children: (0, Q.jsx)("marker", {
        id: "ns-tp",
        viewBox: "0 0 10 10",
        refX: "8",
        refY: "5",
        markerWidth: "6",
        markerHeight: "6",
        orient: "auto",
        children: (0, Q.jsx)("path", {
          d: "M0 0 L10 5 L0 10 Z",
          fill: m.muted
        })
      })
    }), l.map((u, i) => (0, Q.jsxs)("g", {
      children: [e(40, u), a(60, u, 112, u, n ? m.green : m.muted), e(140, u, n ? m.green : "#c8d2df")]
    }, i)), a(140, 74, 140, 114, n ? m.green : m.blue), a(140, 144, 140, 184, n ? m.green : m.blue), (t === "PANet" || t === "BiFPN") && (0, Q.jsxs)(Q.Fragment, {
      children: [l.map((u, i) => (0, Q.jsxs)("g", {
        children: [e(240, u), a(160, u, 220, u)]
      }, i)), a(240, 184, 240, 146, m.orange), a(240, 114, 240, 76, m.orange)]
    }), t === "BiFPN" && (0, Q.jsx)("path", {
      d: "M58 46 C120 20 200 20 222 46",
      fill: "none",
      stroke: m.purple,
      strokeWidth: 3,
      strokeDasharray: "6 5"
    }), t === "HS-FPN" && (0, Q.jsx)("text", {
      x: 190,
      y: 135,
      fontSize: 24,
      fill: m.red,
      children: "高频"
    }), n && (0, Q.jsxs)(Q.Fragment, {
      children: [(0, Q.jsx)("text", {
        x: 64,
        y: 30,
        fontSize: 22,
        fill: m.green,
        children: "LFP"
      }), (0, Q.jsx)("text", {
        x: 160,
        y: 102,
        fontSize: 22,
        fill: m.green,
        children: "SFS"
      })]
    })]
  });
}
function NsMethodSelect({
  label,
  value,
  onChange,
  options
}) {
  return jsxRuntime.jsxs("label", {
    className: "ns-method-select",
    children: [label, jsxRuntime.jsx("select", {
      "aria-label": label,
      value,
      onChange: e => onChange(e.target.value),
      children: options.map(x => jsxRuntime.jsx("option", {
        value: x,
        children: x
      }, x))
    })]
  });
}
function I1(t) {
  let [l, e] = (0, qp.useState)("fa"),
    [a, n] = (0, qp.useState)("NS-FPN"),
    u = M2.includes(l),
    i = hn.map(S => S[l]),
    c = u ? Math.min(...(l === "p" || l === "f" ? i.slice(1) : i)) : Math.max(...i),
    o = l === "p" || l === "f" ? 0 : Math.min(...i) - (l === "fa" ? 2 : 1.2),
    s = Math.max(...i) + (l === "p" || l === "f" ? .1 : .4),
    d = hn.find(S => S.name === a),
    b = hn.find(S => S[l] === c),
    p = l === "fa" ? "Fa 最低的是 PANet（6.7），NS-FPN 为 8.5；正文用“保持可接受的 Fa”来描述。" : l === "p" || l === "f" ? `\u589E\u91CF\u6700\u5C0F\u7684\u662F HS-FPN\uFF08+${hn[3][l]}\uFF09\uFF1BNS-FPN +${d && hn[4][l]}\uFF0C\u4F4E\u4E8E PANet\u3001BiFPN\u3002` : l === "pd" ? "Pd：NS-FPN 95.2，HS-FPN 94.9 紧随其后，但 HS-FPN 的 Fa 是 18.1。" : `${Bu[l]} \u6700\u9AD8\u7684\u662F ${b.name}\uFF08${c.toFixed(1)}\uFF09\u3002${l === "map50" ? "检测上各 FPN 差距都在 1.3 以内。" : ""}`;
  return (0, Q.jsxs)("div", {
    className: "ns-page ns-fpns-page",
    children: [(0, Q.jsxs)("div", {
      className: "ns-fpns-left",
      children: [jsxRuntime.jsx(NsMethodSelect, {
        label: "选择特征金字塔",
        value: a,
        onChange: n,
        options: hn.map(x => x.name)
      }), (0, Q.jsx)("div", {
        className: "ns-chips ns-chips-tight",
        role: "group",
        "aria-label": "指标",
        children: Object.keys(Bu).map(S => (0, Q.jsx)("button", {
          className: `ns-chip ${l === S ? "is-on" : ""}`,
          "aria-pressed": l === S,
          onClick: () => e(S),
          children: Bu[S]
        }, S))
      }), jsxRuntime.jsx("div", {
        className: "ns-chart-scroll",
        children: (0, Q.jsxs)("svg", {
          className: "ns-svg ns-fpns-chart",
          viewBox: "0 0 860 470",
          role: "group",
          "aria-label": `\u8868 4\uFF1A${Bu[l]}`,
          children: [hn.map((S, K) => {
            let x = S[l],
              H = 20 + K * 88,
              r = Math.max(4, (x - o) / (s - o) * 560),
              f = S.name === a;
            return (0, Q.jsxs)("g", {
              className: "ns-hot",
              role: "button",
              tabIndex: 0,
              "aria-pressed": f,
              "aria-label": `${S.name}\uFF1A${Bu[l]} ${x}`,
              onClick: () => n(S.name),
              onKeyDown: A => {
                (A.key === "Enter" || A.key === " ") && (A.preventDefault(), n(S.name));
              },
              children: [(0, Q.jsx)("rect", {
                x: 0,
                y: H - 8,
                width: 860,
                height: 78,
                rx: 10,
                fill: f ? "#fff3ea" : "transparent"
              }), (0, Q.jsx)("text", {
                x: 150,
                y: H + 40,
                textAnchor: "end",
                fontSize: 28,
                fontWeight: f ? 800 : 600,
                fill: m.ink,
                children: S.name
              }), (l === "p" || l === "f") && K === 0 ? (0, Q.jsxs)("text", {
                x: 176,
                y: H + 40,
                fontSize: 26,
                fill: m.muted,
                children: ["基准 ", l === "p" ? "3.91M" : "6.80G"]
              }) : (0, Q.jsxs)(Q.Fragment, {
                children: [(0, Q.jsx)("rect", {
                  x: 170,
                  y: H + 10,
                  width: r,
                  height: 44,
                  rx: 8,
                  fill: S.name === "NS-FPN" ? m.green : x === c ? m.blue : "#b9c2cf"
                }), (0, Q.jsx)("text", {
                  x: 170 + r + 12,
                  y: H + 42,
                  fontSize: 28,
                  fill: x === c ? m.ink : m.muted,
                  fontWeight: x === c ? 800 : 400,
                  children: l === "p" || l === "f" ? `+${x.toFixed(2)}` : x.toFixed(1)
                })]
              })]
            }, S.name);
          }), !(l === "p" || l === "f") && (0, Q.jsxs)("text", {
            x: 170,
            y: 466,
            fontSize: 24,
            fill: m.muted,
            children: ["坐标从 ", o.toFixed(1), " 开始，", u ? "越短越好" : "越长越好"]
          })]
        })
      })]
    }), (0, Q.jsxs)("div", {
      className: "ns-side",
      children: [(0, Q.jsxs)("div", {
        className: "ns-fpns-card",
        children: [(0, Q.jsx)(X2, {
          name: d.name
        }), (0, Q.jsx)(Cl, {
          state: d.name === "NS-FPN" ? "clean" : "noisy"
        })]
      }), (0, Q.jsx)("div", {
        className: "ns-text",
        children: d.desc
      }), (0, Q.jsxs)("div", {
        className: "ns-text ns-kv",
        children: [(0, Q.jsxs)("div", {
          children: [(0, Q.jsx)("span", {
            children: "分割 IoU / Pd / Fa"
          }), (0, Q.jsxs)("b", {
            children: [d.iou, " / ", d.pd, " / ", d.fa]
          })]
        }), (0, Q.jsxs)("div", {
          children: [(0, Q.jsx)("span", {
            children: "检测 mAP50 / mAP"
          }), (0, Q.jsxs)("b", {
            children: [d.map50, " / ", d.map]
          })]
        })]
      }), (0, Q.jsx)("div", {
        className: `ns-feedback ${l === "fa" ? "is-bad" : ""}`,
        "aria-live": "polite",
        children: p
      })]
    })]
  });
}
var xe = React;
var N = jsxRuntime,
  Y1 = [0, .01, .02, .03, .04, .05, .06, .08],
  _1 = [.5, 1, 1.5, 2];
function Wp(t) {
  let l = xn(t, 3);
  return st.map(e => t[e.y * C + e.x] - l[e.y * C + e.x]);
}
function $1(t) {
  let [l, e] = (0, xe.useState)(3),
    [a, n] = (0, xe.useState)(1),
    [u, i] = (0, xe.useState)("s2"),
    c = Y1[l],
    o = _1[a],
    s = (0, xe.useMemo)(() => Gl(Tl, 1), []),
    d = (0, xe.useMemo)(() => Gl({
      ...Tl,
      tau: c,
      sigma: o
    }, 2), [c, o]),
    b = (0, xe.useMemo)(() => {
      let g = pl();
      return [{
        id: "X",
        name: "原特征 X",
        X: g,
        s: Et(g),
        c: Wp(g)
      }, {
        id: "s1",
        name: "第一阶段后",
        X: s.Xp,
        s: Et(s.Xp),
        c: Wp(s.Xp)
      }, {
        id: "s2",
        name: "第二阶段 X′",
        X: d.Xp,
        s: Et(d.Xp),
        c: Wp(d.Xp)
      }];
    }, [s, d]),
    p = b.find(g => g.id === u),
    S = xp(o, 5),
    K = Math.max(...S),
    x = 0;
  for (let g of d.gate) g || x++;
  let H = 100 - x / d.gate.length * 100,
    r = (0, xe.useMemo)(() => Float32Array.from(d.gate), [d]),
    f = b[2].s,
    A = Math.min(...b[2].c),
    y = f.nHit < 3 ? `\u03C4\u3001\u03C3 \u592A\u5927\uFF1A\u8FDE ${st.find((g, k) => !f.hits[k])?.name}\u7684\u8FB9\u7F18\u7CFB\u6570\u4E5F\u88AB\u62B9\u5E73\uFF0C\u5B83\u7684\u5C40\u90E8\u5BF9\u6BD4\u6389\u5230 ${Vu} \u4EE5\u4E0B\u800C\u6F0F\u68C0\u3002` : c === 0 ? "τ = 0：没有系数低于门限，第二阶段什么都不做，X′ 与第一阶段相同。" : `\u4F4E\u4E8E \u03C4 \u7684\u7CFB\u6570\u88AB\u5E73\u6ED1\uFF1A\u865A\u8B66 ${b[1].s.faPx} \u2192 ${f.faPx}\uFF1B\u4EE3\u4EF7\u662F\u76EE\u6807\u4E5F\u88AB\u524A\u5F31\uFF0C\u6700\u6697\u5904\u5BF9\u6BD4\u964D\u5230 ${A.toFixed(3)}\uFF08\u95E8\u9650 ${Vu}\uFF09\u3002`;
  return (0, N.jsxs)("div", {
    className: "ns-page ns-gate-page",
    children: [(0, N.jsxs)("div", {
      className: "ns-gate-left",
      children: [(0, N.jsx)("div", {
        className: "ns-chips",
        role: "group",
        "aria-label": "查看哪一步的结果",
        children: b.map(g => (0, N.jsx)("button", {
          className: `ns-chip ${u === g.id ? "is-on" : ""}`,
          "aria-pressed": u === g.id,
          onClick: () => i(g.id),
          children: g.name
        }, g.id))
      }), (0, N.jsxs)("div", {
        className: "ns-view ns-gate-view",
        children: [(0, N.jsx)(Nt, {
          data: p.X,
          palette: "ir",
          vmin: .2,
          vmax: .62,
          label: `${p.name}\u7684\u793A\u610F\u68C0\u6D4B\u7ED3\u679C`
        }), (0, N.jsxs)("svg", {
          viewBox: `0 0 ${C} ${rt}`,
          "aria-hidden": "true",
          children: [(0, N.jsx)(Yl, {}), (0, N.jsx)(gn, {
            s: p.s
          })]
        })]
      })]
    }), (0, N.jsxs)("div", {
      className: "ns-gate-mid",
      children: [(0, N.jsxs)("div", {
        className: "ns-formula ns-h",
        children: ["F̃", (0, N.jsx)("sub", {
          children: "h"
        }), " = ", (0, N.jsx)(xt, {
          meaning: "G(·)：高斯平滑，核按式 (5) 计算；σ 在论文中可学习，k 未给出，示意取 5。",
          children: "𝒢"
        }), "(F̂", (0, N.jsx)("sub", {
          children: "h"
        }), ")·𝕀", (0, N.jsx)("sub", {
          children: "<τ"
        }), " + F̂", (0, N.jsx)("sub", {
          children: "h"
        }), "·𝕀", (0, N.jsx)("sub", {
          children: "≥τ"
        })]
      }), (0, N.jsxs)("div", {
        className: "ns-formula ns-h",
        children: ["X′ = ", (0, N.jsx)(xt, {
          meaning: "IDWT：逆小波变换。用原来的低频 F_l 和净化后的高频 F̃_h 重建特征，分辨率回到原尺寸（式 6）。",
          children: "IDWT"
        }), "(F", (0, N.jsx)("sub", {
          children: "l"
        }), ", F̃", (0, N.jsx)("sub", {
          children: "h"
        }), ")"]
      }), (0, N.jsxs)("label", {
        className: "ns-row",
        children: [(0, N.jsx)("span", {
          className: "ns-label",
          children: (0, N.jsx)(xt, {
            meaning: "τ：经验设定的门限。|F̂_h| 低于 τ 的位置被认为“不可信”，做高斯平滑；论文没有给出取值。",
            children: "τ"
          })
        }), (0, N.jsx)("input", {
          className: "ns-range",
          type: "range",
          min: 0,
          max: Y1.length - 1,
          step: 1,
          value: l,
          onChange: g => e(Number(g.target.value)),
          "aria-label": "门限 τ",
          "aria-valuetext": `${c}`
        }), (0, N.jsx)("b", {
          className: "ns-w",
          children: c.toFixed(2)
        })]
      }), (0, N.jsxs)("label", {
        className: "ns-row",
        children: [(0, N.jsx)("span", {
          className: "ns-label",
          children: (0, N.jsx)(xt, {
            meaning: "σ：高斯核的标准差，论文中可学习。σ 越大，平滑范围越宽。",
            children: "σ"
          })
        }), (0, N.jsx)("input", {
          className: "ns-range",
          type: "range",
          min: 0,
          max: _1.length - 1,
          step: 1,
          value: a,
          onChange: g => n(Number(g.target.value)),
          "aria-label": "高斯核标准差 σ",
          "aria-valuetext": `${o}`
        }), (0, N.jsx)("b", {
          className: "ns-w",
          children: o.toFixed(1)
        })]
      }), (0, N.jsxs)("div", {
        className: "ns-gate-pics",
        children: [(0, N.jsxs)("figure", {
          children: [(0, N.jsx)("svg", {
            viewBox: "0 0 5 5",
            className: "ns-kernel",
            role: "img",
            "aria-label": `5\xD75 \u9AD8\u65AF\u6838\uFF0C\u4E2D\u5FC3\u6743\u91CD ${K.toFixed(2)}`,
            children: S.map((g, k) => (0, N.jsx)("rect", {
              x: k % 5 + .04,
              y: Math.floor(k / 5) + .04,
              width: .92,
              height: .92,
              rx: .12,
              fill: m.blue,
              opacity: .12 + .88 * g / K
            }, k))
          }), (0, N.jsxs)("figcaption", {
            className: "ns-text",
            children: ["核中心 ", (0, N.jsx)("b", {
              children: K.toFixed(2)
            })]
          })]
        }), (0, N.jsxs)("figure", {
          children: [(0, N.jsx)("div", {
            className: "ns-view is-light ns-gate-mask",
            children: (0, N.jsx)(Nt, {
              data: r,
              w: Wt,
              h: Gt,
              palette: "feat",
              vmin: 0,
              vmax: 1.6,
              label: "门控图：深色为保留，浅色为平滑"
            })
          }), (0, N.jsxs)("figcaption", {
            className: "ns-text",
            children: ["保留 ", (0, N.jsxs)("b", {
              children: [H.toFixed(1), "%"]
            })]
          })]
        })]
      })]
    }), (0, N.jsxs)("div", {
      className: "ns-side ns-gate-side",
      children: [(0, N.jsxs)("table", {
        className: "ns-table",
        children: [(0, N.jsx)("thead", {
          children: (0, N.jsxs)("tr", {
            children: [(0, N.jsx)("th", {}), (0, N.jsx)("th", {
              children: "命中"
            }), (0, N.jsx)("th", {
              children: "虚警"
            }), (0, N.jsx)("th", {
              children: "最暗对比"
            })]
          })
        }), (0, N.jsx)("tbody", {
          children: b.map(g => (0, N.jsxs)("tr", {
            className: u === g.id ? "is-row-on" : "",
            children: [(0, N.jsx)("td", {
              children: g.name
            }), (0, N.jsxs)("td", {
              className: g.s.nHit < 3 ? "is-bad" : "",
              children: [g.s.nHit, "/3"]
            }), (0, N.jsx)("td", {
              children: g.s.faPx
            }), (0, N.jsx)("td", {
              className: Math.min(...g.c) < Vu ? "is-bad" : "",
              children: Math.min(...g.c).toFixed(3)
            })]
          }, g.id))
        })]
      }), (0, N.jsx)("div", {
        className: `ns-feedback ${f.nHit < 3 ? "is-bad" : c === 0 ? "" : "is-good"}`,
        "aria-live": "polite",
        children: y
      })]
    })]
  });
}
var ml = React;
var O = jsxRuntime,
  t0 = [-2, -4, -6, -8, -9, -10, -11, -12, -14];
function l0(t) {
  let [l, e] = (0, ml.useState)(5),
    [a, n] = (0, ml.useState)({
      x: st[1].x >> 1,
      y: st[1].y >> 1
    }),
    u = t0[l],
    i = (0, ml.useMemo)(() => Gl({
      ...Tl,
      bias: u
    }, 1), [u]),
    c = (0, ml.useMemo)(() => Et(pl()), []),
    o = (0, ml.useMemo)(() => Et(i.Xp), [i]),
    s = (0, ml.useMemo)(() => Kn(i.B), [i]),
    d = (0, ml.useMemo)(() => Kn(i.Fh1), [i]),
    b = 0;
  for (let y of i.As) y > .5 && b++;
  let p = b / i.As.length * 100,
    S = a.y * Wt + a.x,
    K = (0, ml.useRef)([]),
    x = y => g => {
      let k = Sc(K.current[y], g.clientX, g.clientY);
      k && n({
        x: ht(Math.floor(k.x), 0, Wt - 1),
        y: ht(Math.floor(k.y), 0, Gt - 1)
      });
    },
    H = [{
      key: "Fl",
      cap: (0, O.jsxs)(O.Fragment, {
        children: ["低频 F", (0, O.jsx)("sub", {
          children: "l"
        })]
      }),
      el: (0, O.jsx)(Nt, {
        data: i.B.LL,
        w: Wt,
        h: Gt,
        palette: "ir",
        vmin: .2,
        vmax: .62,
        label: "低频分量"
      })
    }, {
      key: "As",
      cap: (0, O.jsxs)(O.Fragment, {
        children: ["权重图 A", (0, O.jsx)("sub", {
          children: "s"
        })]
      }),
      el: (0, O.jsx)(Nt, {
        data: i.As,
        w: Wt,
        h: Gt,
        palette: "att",
        vmin: 0,
        vmax: 1,
        label: "空间注意力权重图"
      })
    }, {
      key: "Fh",
      cap: (0, O.jsxs)(O.Fragment, {
        children: ["高频 |F", (0, O.jsx)("sub", {
          children: "h"
        }), "|"]
      }),
      el: (0, O.jsx)(Nt, {
        data: s,
        w: Wt,
        h: Gt,
        palette: "feat",
        vmin: 0,
        vmax: .06,
        label: "原始高频幅值"
      })
    }, {
      key: "Fh1",
      cap: (0, O.jsxs)(O.Fragment, {
        children: ["调制后 |F̂", (0, O.jsx)("sub", {
          children: "h"
        }), "|"]
      }),
      el: (0, O.jsx)(Nt, {
        data: d,
        w: Wt,
        h: Gt,
        palette: "feat",
        vmin: 0,
        vmax: .06,
        label: "被权重图调制后的高频幅值"
      })
    }],
    r = st.findIndex(y => Math.abs((y.x >> 1) - a.x) <= 1 && Math.abs((y.y >> 1) - a.y) <= 1),
    f = p > 12,
    A = o.nHit < 3 ? "门槛太高：目标附近的高频也被压掉，目标漏检。" : f ? `\u95E8\u69DB\u592A\u4F4E\uFF1A${p.toFixed(0)}% \u7684\u4F4D\u7F6E\u653E\u884C\uFF0C\u4EAE\u6591\u7684\u9AD8\u9891\u5927\u591A\u4FDD\u7559\uFF0C\u865A\u8B66 ${o.faPx}\u3002` : u <= -12 ? `\u518D\u4E25\u4E5F\u53EA\u964D\u5230 ${o.faPx}\uFF1A8 \u4E2A\u662F\u4E24\u5757 2\xD72 \u6696\u679D\uFF0C\u4F4E\u9891\u91CC\u672C\u5C31\u4EAE\uFF0C\u53EA\u8C03\u9AD8\u9891\u7BA1\u4E0D\u5230\u3002` : `\u53EA\u653E\u884C ${p.toFixed(1)}% \u7684\u4F4D\u7F6E\uFF1A3 \u4E2A\u76EE\u6807\u90FD\u5728\uFF0C\u865A\u8B66 ${c.faPx} \u2192 ${o.faPx}\u3002`;
  return (0, O.jsxs)("div", {
    className: "ns-page ns-guide-page",
    children: [(0, O.jsx)("div", {
      className: "ns-guide-row",
      children: H.map((y, g) => (0, O.jsxs)(ml.default.Fragment, {
        children: [g > 0 && (0, O.jsx)("div", {
          className: "ns-arrow",
          "aria-hidden": "true",
          children: g === 3 ? "" : "→"
        }), (0, O.jsxs)("figure", {
          className: "ns-guide-cell",
          children: [(0, O.jsxs)("div", {
            className: `ns-view ns-guide-map ${g === 1 || g >= 2 ? "is-light" : ""}`,
            children: [y.el, (0, O.jsxs)("svg", {
              ref: k => {
                K.current[g] = k;
              },
              viewBox: `0 0 ${Wt} ${Gt}`,
              className: "ns-probe-layer",
              role: "slider",
              tabIndex: 0,
              "aria-label": `\u63A2\u9488\u4F4D\u7F6E (${a.x}, ${a.y})`,
              "aria-valuenow": a.x,
              "aria-valuemin": 0,
              "aria-valuemax": Wt - 1,
              onPointerDown: x(g),
              onKeyDown: k => {
                let j = Ac(k, 1);
                j && n(J => ({
                  x: ht(J.x + j[0], 0, Wt - 1),
                  y: ht(J.y + j[1], 0, Gt - 1)
                }));
              },
              children: [(0, O.jsx)("rect", {
                x: a.x - .2,
                y: a.y - .2,
                width: 1.4,
                height: 1.4,
                fill: "none",
                stroke: m.orange,
                strokeWidth: .5
              }), st.map((k, j) => (0, O.jsx)("circle", {
                cx: (k.x >> 1) + .5,
                cy: (k.y >> 1) + .5,
                r: 2.6,
                fill: "none",
                stroke: m.orange,
                strokeWidth: .3,
                strokeDasharray: "0.8 0.5",
                opacity: .8
              }, j))]
            })]
          }), (0, O.jsxs)("figcaption", {
            className: "ns-text",
            children: [g === 3 && (0, O.jsxs)("span", {
              className: "ns-op",
              children: ["A", (0, O.jsx)("sub", {
                children: "s"
              }), " ", (0, O.jsx)(vp, {}), " F", (0, O.jsx)("sub", {
                children: "h"
              }), " ="]
            }), y.cap]
          })]
        })]
      }, y.key))
    }), (0, O.jsxs)("div", {
      className: "ns-guide-bottom",
      children: [(0, O.jsxs)("div", {
        className: "ns-side",
        children: [(0, O.jsxs)("div", {
          className: "ns-formula ns-h",
          children: [(0, O.jsxs)(xt, {
            meaning: "A_s：空间权重图，0–1 之间，大的地方被认为可能有目标。",
            children: ["A", (0, O.jsx)("sub", {
              children: "s"
            })]
          }), " = σ(", (0, O.jsx)(xt, {
            meaning: "Conv：论文中可学习的卷积；示意中换成‘中心减周围、再取 3×3 邻域最大’的手写卷积。",
            children: "Conv"
          }), "(", (0, O.jsx)(xt, {
            meaning: "APool：沿通道做平均池化。示意只有 1 个通道，它与 MPool 结果相同。",
            children: "APool"
          }), "(F", (0, O.jsx)("sub", {
            children: "l"
          }), ") ‖ ", (0, O.jsx)(xt, {
            meaning: "MPool：沿通道取最大值；‖ 表示把两张图拼接成两个通道。",
            children: "MPool"
          }), "(F", (0, O.jsx)("sub", {
            children: "l"
          }), ")))"]
        }), (0, O.jsxs)("div", {
          className: "ns-formula ns-h",
          children: ["F̂", (0, O.jsx)("sub", {
            children: "h"
          }), " = A", (0, O.jsx)("sub", {
            children: "s"
          }), " ", (0, O.jsx)(vp, {}), " F", (0, O.jsx)("sub", {
            children: "h"
          }), (0, O.jsx)("span", {
            className: "ns-muted ns-text",
            children: "\u3000式 (2)–(3)"
          })]
        }), (0, O.jsxs)("label", {
          className: "ns-row",
          children: [(0, O.jsx)("span", {
            className: "ns-label",
            children: "放行门槛"
          }), (0, O.jsx)("input", {
            className: "ns-range",
            type: "range",
            min: 0,
            max: t0.length - 1,
            step: 1,
            value: l,
            onChange: y => e(Number(y.target.value)),
            "aria-label": "Sigmoid 前的偏置，越负越严格",
            "aria-valuetext": `\u504F\u7F6E ${u}`
          }), (0, O.jsxs)("b", {
            children: ["b = ", u]
          })]
        })]
      }), (0, O.jsxs)("div", {
        className: "ns-panel ns-text ns-probe",
        children: [(0, O.jsxs)("div", {
          className: "ns-h",
          children: ["探针 (", a.x, ", ", a.y, ")", r >= 0 ? (0, O.jsxs)("span", {
            className: "ns-muted ns-text",
            children: ["\u3000", st[r].short]
          }) : null]
        }), (0, O.jsxs)("div", {
          className: "ns-kv",
          children: [(0, O.jsxs)("div", {
            children: [(0, O.jsxs)("span", {
              children: ["F", (0, O.jsx)("sub", {
                children: "l"
              })]
            }), (0, O.jsx)("b", {
              children: i.B.LL[S].toFixed(3)
            })]
          }), (0, O.jsxs)("div", {
            children: [(0, O.jsx)("span", {
              children: "中心 − 周围"
            }), (0, O.jsx)("b", {
              children: i.cs[S].toFixed(3)
            })]
          }), (0, O.jsxs)("div", {
            children: [(0, O.jsxs)("span", {
              children: ["A", (0, O.jsx)("sub", {
                children: "s"
              })]
            }), (0, O.jsx)("b", {
              className: "is-aux",
              children: i.As[S].toFixed(2)
            })]
          }), (0, O.jsxs)("div", {
            children: [(0, O.jsxs)("span", {
              children: ["|F", (0, O.jsx)("sub", {
                children: "h"
              }), "|"]
            }), (0, O.jsx)("b", {
              children: s[S].toFixed(3)
            })]
          }), (0, O.jsxs)("div", {
            children: [(0, O.jsxs)("span", {
              children: ["|F̂", (0, O.jsx)("sub", {
                children: "h"
              }), "| = A", (0, O.jsx)("sub", {
                children: "s"
              }), "·|F", (0, O.jsx)("sub", {
                children: "h"
              }), "|"]
            }), (0, O.jsx)("b", {
              children: d[S].toFixed(3)
            })]
          })]
        })]
      }), (0, O.jsxs)("div", {
        className: "ns-side",
        children: [(0, O.jsxs)("div", {
          className: "ns-kv ns-text ns-panel",
          children: [(0, O.jsxs)("div", {
            children: [(0, O.jsx)("span", {
              children: "放行高频的位置"
            }), (0, O.jsxs)("b", {
              children: [p.toFixed(1), "%"]
            })]
          }), (0, O.jsxs)("div", {
            children: [(0, O.jsx)("span", {
              children: "命中目标"
            }), (0, O.jsxs)("b", {
              className: o.nHit === 3 ? "is-good" : "is-bad",
              children: [o.nHit, "/3"]
            })]
          }), (0, O.jsxs)("div", {
            children: [(0, O.jsx)("span", {
              children: "虚警像素"
            }), (0, O.jsxs)("b", {
              children: [c.faPx, " → ", o.faPx]
            })]
          })]
        }), (0, O.jsx)("div", {
          className: `ns-feedback ${o.nHit < 3 || f ? "is-bad" : u <= -12 ? "" : "is-good"}`,
          "aria-live": "polite",
          children: A
        })]
      })]
    })]
  });
}
var On = React;
var T = jsxRuntime,
  e0 = [[67.81, 93.88, 13.66], [67.72, 94.56, 6.15], [67.66, 94.22, 8.35], [68.45, 94.22, 12.98], [69.29, 95.24, 8.58]],
  Nu = [1, 2, 4, 8, 16, 32],
  jn = [3, 4, 5, 6],
  xa = {
    iou: [[68.96, 66.83, 67.67, 67.68], [67.29, 67.69, 68.3, 67.41], [68.33, 67.76, 68.17, 67.94], [66.68, 69.29, 69.03, 67.15], [67.35, 68.04, 68.54, 68.55], [66.36, 68.34, 67.83, 68.1]],
    pd: [[94.22, 92.52, 94.22, 94.22], [94.9, 92.86, 94.22, 93.54], [94.22, 94.9, 94.22, 94.56], [92.52, 95.24, 93.54, 93.2], [93.54, 94.22, 94.9, 93.88], [92.18, 93.88, 91.84, 93.54]],
    fa: [[10.25, 14.88, 13.51, 12.98], [17.61, 14.12, 10.93, 14.04], [10.86, 17.54, 15.64, 15.18], [15.49, 8.58, 12.37, 8.58], [11.61, 13.36, 13.89, 10.4], [15.71, 11.31, 11.31, 33.33]]
  },
  a0 = {
    iou: 68.82,
    pd: 94.56,
    fa: 9.79
  },
  Kc = {
    iou: "IoU",
    pd: "Pd",
    fa: "Fa"
  };
function n0(t, l) {
  let e = xa[t].flat(),
    a = Math.min(...e),
    n = t === "fa" ? 18 : Math.max(...e),
    u = Math.min(1, Math.max(0, (l - a) / (n - a)));
  return t === "fa" ? 1 - u : u;
}
function w2(t, l) {
  let e = n0(t, l),
    a = [246, 247, 249],
    n = [39, 68, 110];
  return `rgb(${a.map((u, i) => Math.round(u + (n[i] - u) * e)).join(",")})`;
}
function u0(t) {
  let [l, e] = (0, On.useState)("f6"),
    [a, n] = (0, On.useState)(4),
    [u, i] = (0, On.useState)("iou"),
    [c, o] = (0, On.useState)(!1),
    [s, d] = (0, On.useState)([3, 1]),
    b = (r, f) => r === "fa" ? f < a0[r] : f > a0[r],
    p = xa[u].flat().filter(r => b(u, r)).length,
    S = Nu.flatMap((r, f) => jn.map((A, y) => ["iou", "pd", "fa"].every(g => b(g, xa[g][f][y])))).filter(Boolean).length,
    [K, x] = s,
    H = e0[a];
  return (0, T.jsxs)("div", {
    className: "ns-page ns-hp-page",
    children: [(0, T.jsxs)("div", {
      className: "ns-chips ns-hp-tabs",
      role: "tablist",
      "aria-label": "选择表 3 或图 6",
      children: [(0, T.jsx)("button", {
        role: "tab",
        "aria-selected": l === "t3",
        className: `ns-chip ${l === "t3" ? "is-on" : ""}`,
        onClick: () => e("t3"),
        children: "表 3：LFP 放在哪几层"
      }), (0, T.jsx)("button", {
        role: "tab",
        "aria-selected": l === "f6",
        className: `ns-chip ${l === "f6" ? "is-on" : ""}`,
        onClick: () => e("f6"),
        children: "图 6：SFS 的 H 与 P"
      })]
    }), l === "t3" ? (0, T.jsxs)("div", {
      className: "ns-hp-body ns-t3",
      children: [jsxRuntime.jsx("div", {
        className: "ns-chart-scroll",
        children: (0, T.jsxs)("svg", {
          className: "ns-svg ns-pyr",
          viewBox: "0 0 640 470",
          role: "group",
          "aria-label": "点击层级，决定 LFP 加到哪一层为止",
          children: [[0, 1, 2, 3].map(r => {
            let f = 560 - r * 110,
              A = (640 - f) / 2,
              y = 380 - r * 100,
              g = r < a;
            return (0, T.jsxs)("g", {
              className: "ns-hot",
              role: "button",
              tabIndex: 0,
              "aria-pressed": g,
              "aria-label": `LFP \u52A0\u5230 X${r + 1} \u4E3A\u6B62`,
              onClick: () => n(r + 1 === a ? r : r + 1),
              onKeyDown: k => {
                (k.key === "Enter" || k.key === " ") && (k.preventDefault(), n(r + 1 === a ? r : r + 1));
              },
              children: [(0, T.jsx)("rect", {
                x: A,
                y,
                width: f,
                height: 74,
                rx: 14,
                fill: g ? "#e9f5ee" : "#f3f5f8",
                stroke: g ? m.green : "#c8d2df",
                strokeWidth: 3
              }), (0, T.jsxs)("text", {
                x: 320,
                y: y + 47,
                textAnchor: "middle",
                fontSize: 28,
                fontWeight: 700,
                fill: m.ink,
                children: ["X", r + 1, "\u3000步长 ", 2 ** (r + 1), g ? "\u3000+ LFP" : ""]
              })]
            }, r);
          }), (0, T.jsx)("text", {
            x: 320,
            y: 34,
            textAnchor: "middle",
            fontSize: 26,
            fill: m.muted,
            children: "按论文表 3 的顺序，从 X1 往上逐层累加"
          })]
        })
      }), (0, T.jsxs)("div", {
        className: "ns-side",
        children: [(0, T.jsxs)("table", {
          className: "ns-table",
          children: [(0, T.jsx)("thead", {
            children: (0, T.jsxs)("tr", {
              children: [(0, T.jsx)("th", {
                children: "LFP 所在层"
              }), (0, T.jsx)("th", {
                children: "IoU"
              }), (0, T.jsx)("th", {
                children: "Pd"
              }), (0, T.jsx)("th", {
                children: "Fa"
              })]
            })
          }), (0, T.jsx)("tbody", {
            children: e0.map((r, f) => (0, T.jsxs)("tr", {
              className: f === a ? "is-row-on" : "",
              children: [(0, T.jsx)("td", {
                children: f === 0 ? "无" : f === 4 ? "X1–X4" : f === 1 ? "X1" : `X1\u2013X${f}`
              }), (0, T.jsx)("td", {
                className: r[0] === 69.29 ? "is-good" : "",
                children: r[0].toFixed(2)
              }), (0, T.jsx)("td", {
                className: r[1] === 95.24 ? "is-good" : "",
                children: r[1].toFixed(2)
              }), (0, T.jsx)("td", {
                className: r[2] === 6.15 ? "is-good" : "",
                children: r[2].toFixed(2)
              })]
            }, f))
          })]
        }), (0, T.jsxs)("div", {
          className: "ns-fb-row",
          children: [(0, T.jsx)("div", {
            className: "ns-feedback",
            "aria-live": "polite",
            children: a === 1 ? "只加在 X1：Fa 6.15，全表最低；但 IoU 67.72 比不加还略低。" : a === 2 ? "加到 X1、X2：Fa 8.35。正文写“X1、X2 把 Fa 降到 6.15”，而表中 6.15 对应的是只加 X1 那一行。" : a === 3 ? "加到 X3：IoU 升到 68.45，Fa 却回到 12.98——正文说小尺度层语义多、IoU 高但虚警也高。" : a === 4 ? "四层都加：IoU 69.29、Pd 95.24 最高，Fa 8.58，作者称这是最佳折中。" : "不加 LFP（只有 SFS）：与表 2 的“只加 SFS”行相同。"
          }), (0, T.jsx)(Cl, {
            state: a === 4 ? "clean" : "noisy",
            className: "ns-theme-sm"
          })]
        })]
      })]
    }) : (0, T.jsxs)("div", {
      className: "ns-hp-body ns-f6",
      children: [(0, T.jsxs)("div", {
        className: "ns-f6-left",
        children: [(0, T.jsxs)("div", {
          className: "ns-chips",
          role: "group",
          "aria-label": "指标",
          children: [["iou", "pd", "fa"].map(r => (0, T.jsx)("button", {
            className: `ns-chip ${u === r ? "is-on" : ""}`,
            "aria-pressed": u === r,
            onClick: () => i(r),
            children: Kc[r]
          }, r)), (0, T.jsx)("button", {
            className: `ns-toggle ${c ? "is-on" : ""}`,
            "aria-pressed": c,
            onClick: () => o(r => !r),
            children: "对照上采样（表 1）"
          })]
        }), jsxRuntime.jsx("div", {
          className: "ns-chart-scroll",
          children: (0, T.jsxs)("svg", {
            className: "ns-svg ns-heat",
            viewBox: "0 0 640 450",
            role: "group",
            "aria-label": `\u56FE 6 \u70ED\u529B\u56FE\uFF1A${Kc[u]}`,
            children: [jn.map((r, f) => (0, T.jsxs)("text", {
              x: 110 + f * 128 + 60,
              y: 438,
              textAnchor: "middle",
              fontSize: 26,
              fill: m.muted,
              children: ["P=", r]
            }, r)), Nu.map((r, f) => (0, T.jsxs)("g", {
              children: [(0, T.jsxs)("text", {
                x: 84,
                y: 20 + f * 68 + 42,
                textAnchor: "end",
                fontSize: 26,
                fill: m.muted,
                children: ["H=", r]
              }), jn.map((A, y) => {
                let g = xa[u][f][y],
                  k = K === f && x === y,
                  j = b(u, g);
                return (0, T.jsxs)("g", {
                  className: "ns-hot",
                  role: "button",
                  tabIndex: 0,
                  "aria-pressed": k,
                  "aria-label": `H=${r}\uFF0CP=${jn[y]}\uFF1A${Kc[u]} ${g}`,
                  onClick: () => d([f, y]),
                  onKeyDown: J => {
                    (J.key === "Enter" || J.key === " ") && (J.preventDefault(), d([f, y]));
                  },
                  children: [(0, T.jsx)("rect", {
                    x: 110 + y * 128,
                    y: 14 + f * 68,
                    width: 120,
                    height: 62,
                    rx: 8,
                    fill: c ? j ? "#e9f5ee" : "#f3f5f8" : w2(u, g),
                    stroke: k ? m.orange : c && j ? m.green : "none",
                    strokeWidth: k ? 5 : 3
                  }), (0, T.jsx)("text", {
                    x: 110 + y * 128 + 60,
                    y: 14 + f * 68 + 41,
                    textAnchor: "middle",
                    fontSize: 26,
                    fontWeight: k ? 800 : 600,
                    fill: c ? j ? m.green : m.muted : n0(u, g) > .55 ? "#ffffff" : m.ink,
                    children: g.toFixed(2)
                  })]
                }, y);
              })]
            }, r))]
          })
        })]
      }), (0, T.jsxs)("div", {
        className: "ns-side",
        children: [(0, T.jsxs)("div", {
          className: "ns-panel ns-text",
          children: [(0, T.jsxs)("div", {
            className: "ns-h",
            children: ["H = ", Nu[K], "，P = ", jn[x]]
          }), (0, T.jsxs)("div", {
            children: ["IoU ", (0, T.jsx)("b", {
              children: xa.iou[K][x].toFixed(2)
            }), "\u3000Pd ", (0, T.jsx)("b", {
              children: xa.pd[K][x].toFixed(2)
            }), "\u3000Fa ", (0, T.jsx)("b", {
              children: xa.fa[K][x].toFixed(2)
            })]
          }), (0, T.jsxs)("div", {
            className: "ns-muted",
            children: ["采样点 H×P = ", Nu[K] * jn[x], " 个；64 通道均分时，每头 ", 64 / Nu[K], " 维（算术示意）"]
          })]
        }), (0, T.jsxs)("div", {
          className: "ns-panel ns-text",
          children: [(0, T.jsx)("div", {
            children: "上采样版本（表 1）：IoU 68.82，Pd 94.56，Fa 9.79"
          }), (0, T.jsxs)("div", {
            children: ["24 组里 ", Kc[u], " 优于它的：", (0, T.jsxs)("b", {
              className: p <= 4 ? "is-bad" : "",
              children: [p, " 组"]
            })]
          }), (0, T.jsxs)("div", {
            children: ["三项同时优于它的：", (0, T.jsxs)("b", {
              className: "is-bad",
              children: [S, " 组"]
            }), "（即 H=8、P=4）"]
          })]
        }), (0, T.jsxs)("div", {
          className: "ns-fb-row",
          children: [(0, T.jsx)("div", {
            className: "ns-feedback",
            "aria-live": "polite",
            children: c ? "H=8、P=4 的 IoU、Pd 在所报告 24 组中最高，Fa 与 H=8、P=6 并列最低。只有 H=8、P=4 三项均优于表 1 的上采样参照；超参数选择协议和多次运行方差未详细报告。" : u === "iou" ? "IoU 并不随 H 单调变化：H=1、P=3 也有 68.96，H=8、P=3 只有 66.68。" : u === "fa" ? "Fa 波动很大：同为 H=32，P=6 时高达 33.33，P=4、5 时为 11.31。" : "图 6 所报 Pd 介于 91.84% 与 95.24% 之间，相差 3.40 个百分点；不能只据这些小数反推测试目标个数。"
          }), (0, T.jsx)(Cl, {
            state: K === 3 && x === 1 ? "clean" : "noisy",
            className: "ns-theme-sm"
          })]
        })]
      })]
    })]
  });
}
var i0 = React;
var F = jsxRuntime,
  xc = {
    fpn: {
      name: "FPN",
      year: "CVPR 2017",
      lat: "1×1 卷积",
      td: "最近邻上采样 2 倍",
      fuse: "逐元素相加",
      focus: "通用目标检测的多尺度表示",
      data: "COCO"
    },
    acm: {
      name: "ACM-FPN",
      year: "WACV 2021",
      lat: "保留：低层特征 X",
      td: "保留：高层特征 Y 上采样",
      fuse: "Z = G(Y)⊗X + L(X)⊗Y：全局通道调制 + 逐点通道调制（ACM 式 5）",
      focus: "小目标在深层被淹没",
      data: "SIRST（本文称 NUAA-SIRST）"
    },
    ns: {
      name: "NS-FPN",
      year: "CVPR 2026",
      lat: "LFP：DWT → 低频指路 → 门控高斯 → IDWT",
      td: "SFS：螺旋采样 + 交叉注意力",
      fuse: "仍是相加：Yᵢ = X′ᵢ + Fₛ（式 10）",
      focus: "增强细节带来的虚警",
      data: "IRSTD-1k、NUAA-SIRST"
    }
  };
function c0(t) {
  let [l, e] = (0, i0.useState)("ns"),
    a = xc[l],
    n = l === "ns",
    u = l === "ns",
    i = l === "acm",
    c = (o, s, d, b, p, S) => (0, F.jsxs)("g", {
      children: [(0, F.jsx)("rect", {
        x: o,
        y: s,
        width: d,
        height: 64,
        rx: 14,
        fill: p ? "#e9f5ee" : "#ffffff",
        stroke: p ? S : "#c8d2df",
        strokeWidth: p ? 4 : 2.5
      }), (0, F.jsx)("text", {
        x: o + d / 2,
        y: s + 42,
        textAnchor: "middle",
        fontSize: 28,
        fontWeight: p ? 750 : 600,
        fill: m.ink,
        children: mn(b)
      })]
    });
  return (0, F.jsxs)("div", {
    className: "ns-page ns-lineage-page",
    children: [(0, F.jsxs)("div", {
      className: "ns-lineage-left",
      children: [(0, F.jsx)("div", {
        className: "ns-chips",
        role: "group",
        "aria-label": "选择方法",
        children: Object.keys(xc).map(o => (0, F.jsxs)("button", {
          className: `ns-chip ${l === o ? "is-on" : ""}`,
          "aria-pressed": l === o,
          onClick: () => e(o),
          children: [xc[o].name, (0, F.jsxs)("span", {
            className: "ns-muted",
            children: [" · ", xc[o].year.slice(-4)]
          })]
        }, o))
      }), jsxRuntime.jsx("div", {
        className: "ns-chart-scroll",
        children: (0, F.jsxs)("svg", {
          className: "ns-svg ns-lineage-diagram",
          viewBox: "0 0 720 470",
          role: "img",
          "aria-label": `${a.name} \u5728\u4E00\u5C42\u4FA7\u5411\u8FDE\u63A5\u4E0A\u7684\u6539\u52A8`,
          children: [(0, F.jsx)("defs", {
            children: (0, F.jsx)("marker", {
              id: "ns-la",
              viewBox: "0 0 10 10",
              refX: "9",
              refY: "5",
              markerWidth: "7",
              markerHeight: "7",
              orient: "auto",
              children: (0, F.jsx)("path", {
                d: "M0 0 L10 5 L0 10 Z",
                fill: m.muted
              })
            })
          }), c(250, 20, 220, "Y_{i+1}", !1, m.green), c(20, 300, 160, "C_i", !1, m.green), c(230, 160, 260, l === "ns" ? "SFS" : "上采样 ×2", u, m.green), c(230, 300, 260, l === "ns" ? "LFP" : "1×1 卷积", n, m.green), (0, F.jsxs)("g", {
            children: [(0, F.jsx)("circle", {
              cx: 600,
              cy: 262,
              r: l === "acm" ? 70 : 40,
              fill: i ? "#e9f5ee" : "#ffffff",
              stroke: i ? m.green : "#c8d2df",
              strokeWidth: i ? 4 : 2.5
            }), (0, F.jsx)("text", {
              x: 600,
              y: l === "acm" ? 256 : 274,
              textAnchor: "middle",
              fontSize: l === "acm" ? 28 : 36,
              fontWeight: 700,
              fill: m.ink,
              children: l === "acm" ? "ACM" : "+"
            }), l === "acm" && (0, F.jsx)("text", {
              x: 600,
              y: 290,
              textAnchor: "middle",
              fontSize: 22,
              fill: m.muted,
              children: "双向调制"
            })]
          }), (0, F.jsxs)("g", {
            stroke: m.muted,
            strokeWidth: 3,
            fill: "none",
            markerEnd: "url(#ns-la)",
            children: [(0, F.jsx)("path", {
              d: "M360 84 V156"
            }), (0, F.jsx)("path", {
              d: "M180 332 H226"
            }), (0, F.jsx)("path", {
              d: `M490 192 H${l === "acm" ? 540 : 566} V${l === "acm" ? 220 : 240}`
            }), (0, F.jsx)("path", {
              d: `M490 332 H${l === "acm" ? 540 : 566} V${l === "acm" ? 304 : 284}`
            }), (0, F.jsx)("path", {
              d: `M600 ${l === "acm" ? 332 : 302} V420`
            })]
          }), (0, F.jsxs)("text", {
            x: 600,
            y: 455,
            textAnchor: "middle",
            fontSize: 28,
            fill: m.ink,
            children: ["Y", (0, F.jsx)("tspan", {
              baselineShift: "sub",
              fontSize: 20,
              children: "i"
            })]
          }), l === "ns" && (0, F.jsx)("path", {
            d: "M360 300 C 330 260, 330 240, 360 228",
            stroke: m.green,
            strokeWidth: 3,
            fill: "none",
            strokeDasharray: "6 5"
          }), l === "ns" && (0, F.jsx)("text", {
            x: 250,
            y: 262,
            fontSize: 22,
            fill: m.green,
            children: mn("X′_i 作 query", 16)
          }), (0, F.jsx)("text", {
            x: 20,
            y: 455,
            fontSize: 24,
            fill: m.muted,
            children: "绿 = 该方法改动的部分"
          })]
        })
      })]
    }), (0, F.jsxs)("div", {
      className: "ns-side ns-lineage-side",
      children: [(0, F.jsx)("table", {
        className: "ns-table ns-compare",
        children: (0, F.jsxs)("tbody", {
          children: [(0, F.jsxs)("tr", {
            children: [(0, F.jsx)("td", {
              children: "侧向连接"
            }), (0, F.jsx)("td", {
              className: n ? "is-good" : "",
              children: a.lat
            })]
          }), (0, F.jsxs)("tr", {
            children: [(0, F.jsx)("td", {
              children: "自顶向下"
            }), (0, F.jsx)("td", {
              className: u ? "is-good" : "",
              children: a.td
            })]
          }), (0, F.jsxs)("tr", {
            children: [(0, F.jsx)("td", {
              children: "融合"
            }), (0, F.jsx)("td", {
              className: i ? "is-good" : "",
              children: a.fuse
            })]
          }), (0, F.jsxs)("tr", {
            children: [(0, F.jsx)("td", {
              children: "想解决的问题"
            }), (0, F.jsx)("td", {
              children: a.focus
            })]
          }), (0, F.jsxs)("tr", {
            children: [(0, F.jsx)("td", {
              children: "数据"
            }), (0, F.jsx)("td", {
              children: a.data
            })]
          })]
        })
      }), (0, F.jsxs)("div", {
        className: "ns-lineage-note",
        children: [(0, F.jsx)("div", {
          className: "ns-panel ns-text",
          children: l === "ns" ? (0, F.jsx)(F.Fragment, {
            children: "ACM 调整跨层调制方式；NS-FPN 在侧向先去噪，并从上层特征按螺旋位置采样，再由本层 query 引导加权汇总。两文都有 Yimian Dai。"
          }) : l === "acm" ? (0, F.jsx)(F.Fragment, {
            children: "同一数据集的数字对不上：ACM 原文 ACM-FPN 在 SIRST 上 IoU 0.731（约 50/20/30 划分）；本文表 5 的 ACMNet 在 NUAA-SIRST 上 70.77（80/20 划分），协议不同。"
          }) : (0, F.jsx)(F.Fragment, {
            children: "NS-FPN 在第 2.2 节把 FPN 的“线性求和”列为不足，表 4 用 FPN 作基线：分割 IoU 67.0 → 69.2。"
          })
        }), (0, F.jsx)(Cl, {
          state: l === "ns" ? "clean" : "noisy"
        })]
      })]
    })]
  });
}
var Hn = React;
var X = jsxRuntime,
  gc = [0, .25, .5, .75, 1, 1.25, 1.5, 1.75, 2];
function o0(t) {
  return t === 0 ? "只剩低频" : t === 1 ? "原图" : t < 1 ? "削弱细节" : "强调细节";
}
function r0(t) {
  let [l, e] = (0, Hn.useState)(4),
    a = gc[l],
    n = (0, Hn.useMemo)(() => gc.map(d => Et(gp(d))), []),
    u = (0, Hn.useMemo)(() => Et(Gl(Tl, 2).Xp), []),
    i = n[l],
    c = (0, Hn.useMemo)(() => gp(a), [a]),
    o = 180,
    s = i.nHit < 3 ? `\u7EC6\u8282\u5168\u62FF\u6389\uFF1A\u865A\u8B66\u53EA\u5269 ${i.faPx} \u50CF\u7D20\uFF0C\u4F46${st.find((d, b) => !i.hits[b])?.name}\u4E5F\u4E22\u4E86\u3002` : a > 1 ? `\u7EC6\u8282\u653E\u5927 ${a} \u500D\uFF1A\u76EE\u6807\u8FD8\u5728\uFF0C\u6811\u53F6\u7EB9\u7406\u5374\u6210\u7247\u62A5\u8B66\uFF08${i.faPx} \u50CF\u7D20\uFF09\u2014\u2014\u53EA\u987E\u589E\u5F3A\u7279\u5F81\u7684\u4EE3\u4EF7\u3002` : `3 \u4E2A\u76EE\u6807\u90FD\u627E\u5230\uFF0C\u4ECD\u6709 ${i.faPx} \u4E2A\u865A\u8B66\u50CF\u7D20\uFF0C\u591A\u5728\u6811\u51A0\u4EAE\u6591\u548C\u4EAE\u7A97\u4E0A\u3002`;
  return (0, X.jsxs)("div", {
    className: "ns-page ns-problem-page",
    children: [(0, X.jsxs)("div", {
      className: "ns-view ns-problem-view",
      children: [(0, X.jsx)(Nt, {
        data: c,
        palette: "ir",
        vmin: .2,
        vmax: .62,
        label: `\u5408\u6210\u70ED\u50CF\uFF0C\u9AD8\u9891\u6743\u91CD ${a}`
      }), (0, X.jsxs)("svg", {
        viewBox: `0 0 ${C} ${rt}`,
        "aria-hidden": "true",
        children: [(0, X.jsx)(Yl, {}), (0, X.jsx)(gn, {
          s: i
        })]
      }), (0, X.jsxs)("div", {
        className: "ns-badge",
        children: ["示意 · 高频 × ", a.toFixed(2)]
      })]
    }), (0, X.jsxs)("div", {
      className: "ns-side",
      children: [(0, X.jsxs)("label", {
        className: "ns-row",
        children: [(0, X.jsx)("span", {
          className: "ns-label",
          children: "高频权重"
        }), (0, X.jsx)("input", {
          className: "ns-range",
          type: "range",
          min: 0,
          max: gc.length - 1,
          step: 1,
          value: l,
          onChange: d => e(Number(d.target.value)),
          "aria-label": "高频分量乘以的权重",
          "aria-valuetext": `${a}\uFF0C${o0(a)}`
        }), (0, X.jsx)("b", {
          className: "ns-w",
          children: a.toFixed(2)
        })]
      }), (0, X.jsxs)("div", {
        className: "ns-stat-row",
        children: [(0, X.jsxs)("div", {
          children: [(0, X.jsx)("span", {
            className: "ns-muted",
            children: "命中"
          }), (0, X.jsxs)("b", {
            className: `ns-em ${i.nHit === 3 ? "is-good" : "is-bad"}`,
            children: [i.nHit, "/3"]
          })]
        }), (0, X.jsxs)("div", {
          children: [(0, X.jsx)("span", {
            className: "ns-muted",
            children: "虚警"
          }), (0, X.jsx)("b", {
            className: `ns-em ${i.faPx > u.faPx ? "is-bad" : "is-good"}`,
            children: i.faPx
          })]
        }), (0, X.jsx)("div", {
          children: (0, X.jsx)("b", {
            className: "ns-h",
            children: o0(a)
          })
        })]
      }), jsxRuntime.jsx("div", {
        className: "ns-chart-scroll",
        children: (0, X.jsxs)("svg", {
          className: "ns-svg ns-fa-bars",
          viewBox: "0 0 700 200",
          role: "img",
          "aria-label": "不同高频权重下的虚警像素数与命中数",
          children: [(0, X.jsx)("line", {
            x1: 14,
            x2: 54,
            y1: 20,
            y2: 20,
            stroke: m.green,
            strokeWidth: 3,
            strokeDasharray: "10 7"
          }), (0, X.jsxs)("text", {
            x: 62,
            y: 29,
            fontSize: 24,
            fill: m.green,
            fontWeight: 700,
            children: ["LFP 示意：", u.nHit, "/3 命中，虚警 ", u.faPx]
          }), (0, X.jsx)("text", {
            x: 692,
            y: 29,
            textAnchor: "end",
            fontSize: 24,
            fill: m.muted,
            children: "柱高 = 虚警像素"
          }), gc.map((d, b) => {
            let p = Math.max(3, n[b].faPx / o * 110),
              S = 18 + b * 76;
            return (0, X.jsxs)("g", {
              children: [(0, X.jsx)("rect", {
                x: S,
                y: 146 - p,
                width: 52,
                height: p,
                rx: 5,
                fill: b === l ? m.orange : n[b].nHit < 3 ? "#b9c2cf" : "#e3a1ac"
              }), (0, X.jsx)("text", {
                x: S + 26,
                y: 172,
                textAnchor: "middle",
                fontSize: 22,
                fill: m.muted,
                children: d
              }), (0, X.jsxs)("text", {
                x: S + 26,
                y: 196,
                textAnchor: "middle",
                fontSize: 22,
                fill: n[b].nHit < 3 ? m.red : m.muted,
                children: [n[b].nHit, "/3"]
              })]
            }, b);
          }), (0, X.jsx)("line", {
            x1: 8,
            x2: 700,
            y1: 146 - u.faPx / o * 110,
            y2: 146 - u.faPx / o * 110,
            stroke: m.green,
            strokeWidth: 3,
            strokeDasharray: "10 7"
          })]
        })
      }), (0, X.jsxs)("div", {
        className: "ns-panel ns-text",
        children: [(0, X.jsxs)("div", {
          children: ["图 1 / 表 5，IRSTD-1k：MSHNet 的 ", (0, X.jsxs)(xt, {
            meaning: "Pd（检测概率）：匹配到的目标数 ÷ 目标总数。作者公开代码按 8 连通组件的质心距离小于 3 进行匹配；本页合成热像使用简化命中规则。",
            children: ["P", (0, X.jsx)("sub", {
              children: "d"
            })]
          }), " ", (0, X.jsx)("b", {
            children: "93.88%"
          }), "、", (0, X.jsxs)(xt, {
            meaning: "Fa（虚警率）：作者公开代码以未匹配预测连通组件的面积除以总像素数，按 ×10⁻⁶ 报告，越低越好。本页热像示意采用非目标区域超阈值像素近似，不是原评估器。",
            children: ["F", (0, X.jsx)("sub", {
              children: "a"
            })]
          }), " ", (0, X.jsx)("b", {
            className: "is-bad",
            children: "15.03"
          }), "×10⁻⁶"]
        }), (0, X.jsxs)("div", {
          children: ["接入 NS-FPN 后：", (0, X.jsx)("b", {
            className: "is-good",
            children: "95.24%"
          }), "、", (0, X.jsx)("b", {
            className: "is-good",
            children: "8.58"
          }), "×10⁻⁶"]
        })]
      }), (0, X.jsx)("div", {
        className: `ns-feedback ${i.nHit < 3 || a > 1 ? "is-bad" : ""}`,
        "aria-live": "polite",
        children: s
      })]
    })]
  });
}
var Tu = React;
var tt = jsxRuntime,
  p0 = [{
    name: "Top-Hat",
    type: "滤波",
    v: [10.06, 75.11, 1432, 7.14, 79.84, 1012]
  }, {
    name: "Max-Median",
    type: "滤波",
    v: [7, 65.21, 59.73, 4.17, 69.2, 55.33]
  }, {
    name: "WSLCM",
    type: "局部对比",
    v: [3.45, 72.44, 6619, 1.16, 77.95, 5446]
  }, {
    name: "TLLCM",
    type: "局部对比",
    v: [3.31, 77.39, 6738, 1.03, 79.09, 5899]
  }, {
    name: "IPI",
    type: "低秩",
    v: [27.92, 81.37, 16.18, 25.67, 85.55, 11.47]
  }, {
    name: "RIPT",
    type: "低秩",
    v: [14.11, 77.55, 28.31, 11.05, 79.08, 22.61]
  }, {
    name: "ACMNet",
    type: "深度",
    v: [59.23, 93.27, 65.28, 70.77, 93.08, 3.7]
  }, {
    name: "ISNet",
    type: "深度",
    v: [62.88, 92.59, 27.92, 74.16, 97.99, 8.35]
  }, {
    name: "DNANet",
    type: "深度",
    v: [65.71, 91.84, 17.61, 74.31, 98.17, 15.97]
  }, {
    name: "UIUNet",
    type: "深度",
    v: [65.06, 91.16, 12.68, 72.69, 99.08, 26.61]
  }, {
    name: "HCFNet",
    type: "深度",
    v: [64.26, 92.86, 23.91, 72.74, 98.17, 6.21]
  }, {
    name: "IRPruneDet",
    type: "深度",
    v: [64.54, 91.74, 16.04, 75.12, 98.61, 2.96]
  }, {
    name: "IRSAM",
    type: "深度",
    v: [64.65, 90.57, 16.61, 71.44, 92.66, 7.53]
  }, {
    name: "SCTransNet",
    type: "深度",
    v: [68.64, 91.84, 11.92, 77.09, 98.17, 15.26]
  }, {
    name: "SFCANet",
    type: "深度",
    v: [66.68, 92.89, 12.69, 78.46, 97.24, 8.02]
  }, {
    name: "PConv",
    type: "深度",
    v: [67.08, 92.18, 11.92, 76.25, 99.08, 6.74]
  }, {
    name: "MSHNet",
    type: "深度",
    v: [67.16, 93.88, 15.03, 74.6, 99.08, 17.21]
  }, {
    name: "MSHNet+NS-FPN",
    type: "本文",
    v: [69.29, 95.24, 8.58, 78.75, 100, 1.6]
  }],
  Jp = [{
    name: "EFLNet",
    v: [86.1, 29.5, 38, 98.1, 37.9, 47.1]
  }, {
    name: "DFLMF-ISTD",
    v: [82.7, null, 38.6, 94.2, null, 51.1]
  }, {
    name: "PConv",
    v: [86.1, 34.5, 40.8, 96.4, 49.9, 54.9]
  }, {
    name: "YOLOv8n",
    v: [85, 31.9, 41.5, 95.6, 40.3, 49]
  }, {
    name: "YOLOv8n+NS-FPN",
    v: [86.3, 36.9, 42.1, 97.5, 61.6, 58]
  }],
  L2 = ["IoU", "Pd", "Fa（对数轴）"],
  s0 = ["mAP50", "mAP75", "mAP"];
function f0(t) {
  let [l, e] = (0, Tu.useState)("seg"),
    [a, n] = (0, Tu.useState)(0),
    [u, i] = (0, Tu.useState)(2),
    [c, o] = (0, Tu.useState)("MSHNet+NS-FPN"),
    s = l === "seg" ? p0 : Jp,
    d = a * 3 + u,
    b = k => k.v[d],
    p = s.map(b).filter(k => k !== null),
    S = l === "seg" && u === 2,
    x = S ? Math.min(...p) : Math.max(...p),
    H = k => S ? (Math.log10(k) - Math.log10(1)) / (Math.log10(1e4) - Math.log10(1)) : k / 100,
    r = l === "seg" ? 31 : 90,
    f = s.find(k => k.name === c) ?? s[s.length - 1],
    g = l === "det" ? a === 1 && u === 0 ? "NUAA-SIRST 的 mAP50：EFLNet 98.1 高于本文 97.5（原表也把 98.1 加粗）；正文却写本文在两个数据集上 mAP50 都最好。" : a === 1 && u === 1 ? "mAP75 上本文 61.6，比第二名 PConv 49.9 高 11.7：更严格的 IoU 阈值下优势最大。" : `${s0[u]}\uFF1A\u672C\u6587 ${Jp[4].v[d]}\uFF0CYOLOv8n \u57FA\u7EBF ${Jp[3].v[d]}\u3002` : S ? a === 0 ? "Top-Hat、WSLCM、TLLCM 的 Fa 上千（对数轴）；本文 8.58 最低，其次是 SCTransNet、PConv 的 11.92。" : "NUAA-SIRST 上本文 Fa 1.60 最低，IRPruneDet 2.96、ACMNet 3.70 其次。" : u === 1 ? a === 1 ? "NUAA-SIRST 的 Pd：本文为 100%，多个方法为 99.08%；差异为 0.92 个百分点。" : "IRSTD-1k 的 Pd：本文为 95.24%，表 5 的 MSHNet 为 93.88%，差异为 1.36 个百分点。" : `IoU\uFF1A\u672C\u6587 ${p0[17].v[d]} \u6700\u9AD8\uFF0C\u7B2C\u4E8C\u540D ${a === 0 ? "SCTransNet 68.64" : "SFCANet 78.46"}\u3002`;
  return (0, tt.jsxs)("div", {
    className: "ns-page ns-sota-page",
    children: [(0, tt.jsx)("div", {
      className: "ns-sota-chart",
      children: (0, tt.jsxs)("svg", {
        className: "ns-svg",
        viewBox: `0 0 880 ${l === "seg" ? 590 : 500}`,
        role: "group",
        "aria-label": "表 5 柱状图",
        children: [s.map((k, j) => {
          let J = b(k),
            R = 6 + j * r,
            z = k.name === c,
            at = J === null ? 0 : Math.max(3, H(J) * (l === "seg" ? 560 : 520)),
            va = k.name.includes("NS-FPN");
          return (0, tt.jsxs)("g", {
            className: "ns-hot",
            role: "button",
            tabIndex: 0,
            "aria-pressed": z,
            "aria-label": `${k.name}\uFF1A${J ?? "无"}`,
            onClick: () => o(k.name),
            onKeyDown: Wn => {
              (Wn.key === "Enter" || Wn.key === " ") && (Wn.preventDefault(), o(k.name));
            },
            children: [(0, tt.jsx)("rect", {
              x: 0,
              y: R,
              width: 880,
              height: r,
              fill: z ? "#fff3ea" : "transparent"
            }), (0, tt.jsx)("text", {
              x: l === "seg" ? 226 : 236,
              y: R + r / 2 + 9,
              textAnchor: "end",
              fontSize: 24,
              fontWeight: z || va ? 750 : 400,
              fill: m.ink,
              children: k.name
            }), J === null ? (0, tt.jsx)("text", {
              x: 240,
              y: R + r / 2 + 9,
              fontSize: 24,
              fill: m.muted,
              children: "—（原表未报告）"
            }) : (0, tt.jsxs)(tt.Fragment, {
              children: [(0, tt.jsx)("rect", {
                x: l === "seg" ? 240 : 250,
                y: R + r * .2,
                width: at,
                height: r * .6,
                rx: 4,
                fill: va ? m.green : J === x ? m.blue : l === "seg" && j < 6 ? "#d7dde6" : "#9fb0c8"
              }), (0, tt.jsx)("text", {
                x: (l === "seg" ? 240 : 250) + at + 8,
                y: R + r / 2 + 9,
                fontSize: 24,
                fill: J === x ? m.ink : m.muted,
                fontWeight: J === x ? 750 : 400,
                children: J
              })]
            })]
          }, k.name);
        }), l === "seg" && (0, tt.jsx)("line", {
          x1: 0,
          x2: 880,
          y1: 6 + 6 * r,
          y2: 6 + 6 * r,
          stroke: m.ink,
          strokeDasharray: "6 5"
        })]
      })
    }), (0, tt.jsxs)("div", {
      className: "ns-side",
      children: [jsxRuntime.jsx(NsMethodSelect, {
        label: "选择对比方法",
        value: f.name,
        onChange: o,
        options: s.map(x => x.name)
      }), (0, tt.jsxs)("div", {
        className: "ns-chips",
        role: "group",
        "aria-label": "任务与数据集",
        children: [(0, tt.jsx)("button", {
          className: `ns-chip ${l === "seg" ? "is-on" : ""}`,
          "aria-pressed": l === "seg",
          onClick: () => {
            e("seg"), o("MSHNet+NS-FPN");
          },
          children: "分割"
        }), (0, tt.jsx)("button", {
          className: `ns-chip ${l === "det" ? "is-on" : ""}`,
          "aria-pressed": l === "det",
          onClick: () => {
            e("det"), o("YOLOv8n+NS-FPN");
          },
          children: "检测"
        }), (0, tt.jsx)("button", {
          className: `ns-chip ${a === 0 ? "is-on" : ""}`,
          "aria-pressed": a === 0,
          onClick: () => n(0),
          children: "IRSTD-1k"
        }), (0, tt.jsx)("button", {
          className: `ns-chip ${a === 1 ? "is-on" : ""}`,
          "aria-pressed": a === 1,
          onClick: () => n(1),
          children: "NUAA-SIRST"
        })]
      }), (0, tt.jsx)("div", {
        className: "ns-chips",
        role: "group",
        "aria-label": "指标",
        children: (l === "seg" ? L2 : s0).map((k, j) => (0, tt.jsx)("button", {
          className: `ns-chip ${u === j ? "is-on" : ""}`,
          "aria-pressed": u === j,
          onClick: () => i(j),
          children: k
        }, k))
      }), (0, tt.jsxs)("div", {
        className: "ns-panel ns-text",
        children: [(0, tt.jsxs)("div", {
          className: "ns-h",
          children: [f.name, (0, tt.jsx)("span", {
            className: "ns-text ns-muted",
            children: l === "seg" ? `\u3000${f.type}` : ""
          })]
        }), (0, tt.jsxs)("div", {
          children: [l === "seg" ? "IoU / Pd / Fa" : "mAP50 / mAP75 / mAP", "：", (0, tt.jsx)("b", {
            children: f.v.slice(a * 3, a * 3 + 3).map(k => k ?? "—").join(" / ")
          })]
        }), l === "seg" && (0, tt.jsx)("div", {
          className: "ns-muted",
          children: "IoU、Pd 的单位为 %；Fa 按原表以 ×10⁻⁶ 报告，越低越好。"
        })]
      }), (0, tt.jsxs)("div", {
        className: "ns-fb-row",
        children: [(0, tt.jsx)("div", {
          className: `ns-feedback ${l === "det" && a === 1 && u === 0 ? "is-bad" : ""}`,
          "aria-live": "polite",
          children: g
        }), (0, tt.jsx)(Cl, {
          state: f.name.includes("NS-FPN") ? "clean" : "noisy",
          className: "ns-theme-sm"
        })]
      })]
    })]
  });
}
var tl = React;
var W = jsxRuntime,
  Ql = C / 4,
  vc = rt / 4,
  Z2 = [1, 2, 4, 8, 16, 32],
  ga = 2,
  ma = 4,
  kc = 16,
  hc = 12,
  Vp = t => t.x >= ga - .4 && t.x <= ga + kc - .6 && t.y >= ma - .4 && t.y <= ma + hc - .6,
  S0 = t => ht(t, ga + .75, ga + kc - 1.75),
  b0 = t => ht(t, ma + .75, ma + hc - 1.75),
  E2 = [3, 4, 5, 6];
function I2() {
  let t = pl(),
    l = xn(t, 3),
    e = new Float32Array(Ql * vc);
  for (let a = 0; a < vc; a++) for (let n = 0; n < Ql; n++) {
    let u = 0;
    for (let i = 0; i < 4; i++) for (let c = 0; c < 4; c++) {
      let o = (a * 4 + i) * C + n * 4 + c;
      u += Math.max(0, t[o] - l[o]);
    }
    e[a * Ql + n] = u / 16;
  }
  return e;
}
function Y2(t, l, e) {
  let a = ht(l, 0, Ql - 1),
    n = ht(e, 0, vc - 1),
    u = Math.floor(a),
    i = Math.floor(n),
    c = Math.min(u + 1, Ql - 1),
    o = Math.min(i + 1, vc - 1),
    s = a - u,
    d = n - i;
  return (t[i * Ql + u] * (1 - s) + t[i * Ql + c] * s) * (1 - d) + (t[o * Ql + u] * (1 - s) + t[o * Ql + c] * s) * d;
}
var mc = t => Math.round((t + .25) * 2) / 2 - .25;
function A0(t) {
  let [l, e] = (0, tl.useState)("sfs"),
    [a, n] = (0, tl.useState)(8),
    [u, i] = (0, tl.useState)(4),
    [c, o] = (0, tl.useState)(1),
    [s, d] = (0, tl.useState)(.75),
    [b, p] = (0, tl.useState)(!1),
    [S, K] = (0, tl.useState)(1),
    [x, H] = (0, tl.useState)(1),
    [r, f] = (0, tl.useState)({
      x: mc((st[1].x + .5) / 4 - .5),
      y: mc((st[1].y + .5) / 4 - .5)
    }),
    A = (0, tl.useMemo)(I2, []),
    y = (0, tl.useRef)(null),
    g = N1(y, {
      move: (q, Z) => f({
        x: S0(mc(q)),
        y: b0(mc(Z))
      })
    }),
    k = Math.min(S, a),
    j = (0, tl.useMemo)(() => {
      let q = [];
      if (l === "up") {
        let Z = Math.floor(r.x),
          yt = Math.floor(r.y),
          Dt = r.x - Z,
          Jt = r.y - yt;
        return [[0, 0, (1 - Dt) * (1 - Jt)], [1, 0, Dt * (1 - Jt)], [0, 1, (1 - Dt) * Jt], [1, 1, Dt * Jt]].forEach(([Oc, Hc, H0], q0) => q.push({
          x: Z + Oc,
          y: yt + Hc,
          h: 1,
          k: q0 + 1,
          w: H0
        })), q;
      }
      for (let Z = 1; Z <= a; Z++) for (let yt = 1; yt <= u; yt++) if (l === "dat") {
        let Dt = rl(Z * 13 + yt, Math.round(r.x * 2) * 7 + Math.round(r.y * 2) * 131, x),
          Jt = rl(Z * 17 + yt * 3, Math.round(r.x * 2) * 11 + Math.round(r.y * 2) * 97, x + 5);
        q.push({
          x: r.x + (Dt - .5) * 8,
          y: r.y + (Jt - .5) * 8,
          h: Z,
          k: yt
        });
      } else {
        let Dt = 2 * Math.PI * yt / u + 2 * Math.PI * Z / a,
          Jt = c + yt * s,
          Oc = b ? (rl(Z, yt, 21) - .5) * .6 : 0,
          Hc = b ? (rl(Z, yt, 22) - .5) * .6 : 0;
        q.push({
          x: r.x + Jt * Math.cos(Dt) + Oc,
          y: r.y + Jt * Math.sin(Dt) + Hc,
          h: Z,
          k: yt,
          theta: Dt,
          l: Jt
        });
      }
      return q;
    }, [l, a, u, c, s, b, x, r]),
    J = new Array(8).fill(0);
  for (let q of j) {
    let Z = q.x - r.x,
      yt = q.y - r.y;
    if (Math.hypot(Z, yt) < 1e-6) continue;
    let Dt = (Math.atan2(yt, Z) + 2 * Math.PI + Math.PI / 8) % (2 * Math.PI);
    J[Math.floor(Dt / (Math.PI / 4)) % 8]++;
  }
  let R = J.filter(q => q > 0).length,
    z = Math.max(1, ...J),
    at = j.filter(q => q.h === k),
    va = new Set(j.map(q => Math.round((Math.atan2(q.y - r.y, q.x - r.x) * 180 / Math.PI + 360) * 100) % 36e3)).size,
    Wn = l === "up" ? "此处双线性插值读取参考位置周围 4 个特征值。图中仅展示当前采样算子，不代表其输入特征没有更大感受野。" : l === "dat" ? `\u968F\u673A\uFF1A${j.length} \u4E2A\u70B9\uFF0C8 \u4E2A\u6247\u533A\u5404 ${Math.min(...J)}\u2013${z} \u4E2A\uFF0C\u5206\u5E03\u4E0D\u5747\uFF1B\u79FB\u52A8 query \u4F1A\u6574\u7EC4\u91CD\u62BD\u3002` : `\u87BA\u65CB ${a}\xD7${u}\uFF1A8 \u4E2A\u6247\u533A\u5404 ${Math.min(...J) === z ? z : `${Math.min(...J)}\u2013${z}`} \u4E2A${b ? "" : `\uFF0C\u5171 ${va} \u4E2A\u65B9\u5411`}\uFF1B\u79FB\u52A8 query\uFF0C\u6574\u7EC4\u504F\u79FB\u539F\u6837\u5E73\u79FB\u3002`,
    Tp = [];
  for (let q = ma; q < ma + hc; q++) for (let Z = ga; Z < ga + kc; Z++) {
    let [yt, Dt, Jt] = mp("feat", ht(A[q * Ql + Z] / .03, 0, 1));
    Tp.push((0, W.jsx)("rect", {
      x: Z - .5,
      y: q - .5,
      width: 1,
      height: 1,
      fill: `rgb(${yt},${Dt},${Jt})`,
      stroke: "#ffffff",
      strokeWidth: .03
    }, `c${Z}-${q}`));
  }
  return (0, W.jsxs)("div", {
    className: "ns-page ns-spiral-page",
    children: [(0, W.jsxs)("div", {
      className: "ns-spiral-left",
      children: [(0, W.jsx)("div", {
        className: "ns-chips",
        role: "group",
        "aria-label": "采样方式",
        children: [["up", "FPN 上采样"], ["dat", "散乱采样示意"], ["sfs", "SFS 螺旋"]].map(([q, Z]) => (0, W.jsx)("button", {
          className: `ns-chip ${l === q ? q === "sfs" ? "is-on is-new" : "is-on is-old" : ""}`,
          "aria-pressed": l === q,
          onClick: () => e(q),
          children: Z
        }, q))
      }), (0, W.jsx)("div", {
        className: "ns-view is-light ns-spiral-view",
        children: (0, W.jsxs)("svg", {
          ref: y,
          viewBox: `${ga - .5} ${ma - .5} ${kc} ${hc}`,
          role: "group",
          "aria-label": `\u4E0A\u4E00\u5C42\u7279\u5F81 Y(i+1) \u7684\u5C40\u90E8\uFF08\u793A\u610F\uFF09\uFF0Cquery \u4F4D\u4E8E (${r.x}, ${r.y})`,
          children: [(0, W.jsx)("g", {
            className: "ns-probe-layer",
            ...g,
            children: Tp
          }), j.map((q, Z) => q.h !== k && l !== "up" && Vp(q) ? (0, W.jsx)("circle", {
            cx: q.x,
            cy: q.y,
            r: .15,
            fill: l === "sfs" ? m.green : m.red,
            opacity: .6,
            pointerEvents: "none"
          }, `o${Z}`) : null), l === "sfs" && at.every(Vp) && (0, W.jsx)("polyline", {
            points: [{
              x: r.x,
              y: r.y
            }, ...at].map(q => `${q.x},${q.y}`).join(" "),
            fill: "none",
            stroke: m.orange,
            strokeWidth: .07,
            pointerEvents: "none"
          }), (l === "up" ? j : at).filter(Vp).map((q, Z) => (0, W.jsx)("circle", {
            cx: q.x,
            cy: q.y,
            r: l === "up" ? .12 + .3 * (q.w ?? 0) : .22,
            fill: l === "up" ? m.blue : m.orange,
            stroke: "#ffffff",
            strokeWidth: .06,
            pointerEvents: "none"
          }, `m${Z}`)), (0, W.jsxs)("g", {
            className: "ns-handle",
            role: "slider",
            tabIndex: 0,
            "aria-label": "拖动 query 位置",
            "aria-valuenow": r.x,
            "aria-valuemin": 0,
            "aria-valuemax": Ql - 1,
            ...g,
            onKeyDown: q => {
              let Z = Ac(q, .5);
              Z && f(yt => ({
                x: S0(yt.x + Z[0]),
                y: b0(yt.y + Z[1])
              }));
            },
            children: [(0, W.jsx)("circle", {
              cx: r.x,
              cy: r.y,
              r: .7,
              fill: "#ffffff",
              fillOpacity: .01,
              stroke: m.orange,
              strokeWidth: .08
            }), (0, W.jsx)("path", {
              d: `M${r.x - .45} ${r.y} H${r.x + .45} M${r.x} ${r.y - .45} V${r.y + .45}`,
              stroke: m.ink,
              strokeWidth: .08
            })]
          })]
        })
      }), (0, W.jsxs)("div", {
        className: "ns-text ns-muted",
        children: ["方格 = Y", (0, W.jsx)("sub", {
          children: "i+1"
        }), " 局部（示意）；十字 = query"]
      })]
    }), (0, W.jsxs)("div", {
      className: `ns-side ns-spiral-ctl ${l === "up" ? "is-dim" : ""}`,
      children: [(0, W.jsxs)("div", {
        className: "ns-formula ns-h",
        children: ["θ", (0, W.jsx)("sub", {
          children: "h,k"
        }), " = 2πk/P + 2πh/H", (0, W.jsx)("br", {}), "l", (0, W.jsx)("sub", {
          children: "s"
        }), " = l₀ + k·Δl", (0, W.jsx)("span", {
          className: "ns-muted ns-text",
          children: "\u3000式 (8)"
        })]
      }), (0, W.jsxs)("div", {
        className: "ns-row",
        children: [(0, W.jsx)("span", {
          className: "ns-label",
          children: (0, W.jsx)(xt, {
            meaning: "H：注意力头数。论文要求 64 个通道能被 H 整除，图 6 在 1、2、4、8、16、32 中比较，最终取 8。",
            children: "H"
          })
        }), (0, W.jsx)("div", {
          className: "ns-chips ns-chips-tight",
          role: "group",
          "aria-label": "头数 H",
          children: Z2.map(q => (0, W.jsx)("button", {
            disabled: l === "up",
            className: `ns-chip ${a === q ? "is-on" : ""}`,
            "aria-pressed": a === q,
            onClick: () => {
              n(q), K(1);
            },
            children: q
          }, q))
        })]
      }), (0, W.jsxs)("div", {
        className: "ns-row",
        children: [(0, W.jsx)("span", {
          className: "ns-label",
          children: (0, W.jsx)(xt, {
            meaning: "P：每个头的采样点数，图 6 比较 3–6，最终取 4。",
            children: "P"
          })
        }), (0, W.jsx)("div", {
          className: "ns-chips ns-chips-tight",
          role: "group",
          "aria-label": "每头点数 P",
          children: E2.map(q => (0, W.jsx)("button", {
            disabled: l === "up",
            className: `ns-chip ${u === q ? "is-on" : ""}`,
            "aria-pressed": u === q,
            onClick: () => i(q),
            children: q
          }, q))
        })]
      }), (0, W.jsxs)("label", {
        className: "ns-row",
        children: [(0, W.jsx)("span", {
          className: "ns-label",
          children: (0, W.jsx)(xt, {
            meaning: "l₀：基础半径。式 (8) 的 k 从 1 开始，因此首点半径是 l₀+Δl；论文未给出 l₀ 的具体取值。",
            children: "l₀"
          })
        }), (0, W.jsx)("input", {
          className: "ns-range",
          type: "range",
          min: 0,
          max: 2,
          step: .25,
          value: c,
          disabled: l !== "sfs",
          onChange: q => o(Number(q.target.value)),
          "aria-label": "初始半径 l0"
        }), (0, W.jsx)("b", {
          className: "ns-w",
          children: c.toFixed(2)
        })]
      }), (0, W.jsxs)("label", {
        className: "ns-row",
        children: [(0, W.jsx)("span", {
          className: "ns-label",
          children: (0, W.jsx)(xt, {
            meaning: "Δl：相邻两个采样点之间的半径步长。论文没有给出取值。",
            children: "Δl"
          })
        }), (0, W.jsx)("input", {
          className: "ns-range",
          type: "range",
          min: .25,
          max: 1.5,
          step: .25,
          value: s,
          disabled: l !== "sfs",
          onChange: q => d(Number(q.target.value)),
          "aria-label": "半径步长 Δl"
        }), (0, W.jsx)("b", {
          className: "ns-w",
          children: s.toFixed(2)
        })]
      }), (0, W.jsxs)("label", {
        className: "ns-row",
        children: [(0, W.jsx)("span", {
          className: "ns-label",
          children: "高亮头 h"
        }), (0, W.jsx)("input", {
          className: "ns-range",
          type: "range",
          min: 1,
          max: a,
          step: 1,
          value: k,
          disabled: l === "up",
          onChange: q => K(Number(q.target.value)),
          "aria-label": "高亮的注意力头"
        }), (0, W.jsx)("b", {
          className: "ns-w",
          children: k
        })]
      }), (0, W.jsxs)("div", {
        className: "ns-toggles",
        children: [(0, W.jsx)("button", {
          className: `ns-toggle ${b ? "is-on" : ""}`,
          "aria-pressed": b,
          disabled: l !== "sfs",
          onClick: () => p(q => !q),
          children: "加偏移 ε"
        }), (0, W.jsx)("button", {
          className: "ns-toggle",
          disabled: l !== "dat",
          onClick: () => H(q => q + 1),
          children: "重抽示意点"
        })]
      })]
    }), (0, W.jsxs)("div", {
      className: "ns-side ns-spiral-info",
      children: [(0, W.jsxs)("table", {
        className: "ns-table ns-head-table",
        children: [(0, W.jsx)("thead", {
          children: (0, W.jsxs)("tr", {
            children: [(0, W.jsx)("th", {
              children: "k"
            }), (0, W.jsx)("th", {
              children: l === "up" ? "权重" : l === "sfs" ? "θ（度）" : "Δx"
            }), (0, W.jsx)("th", {
              children: l === "up" ? "格子" : l === "sfs" ? (0, W.jsxs)(W.Fragment, {
                children: ["l", (0, W.jsx)("sub", {
                  children: "s"
                })]
              }) : "Δy"
            }), (0, W.jsx)("th", {
              children: "采样值×100"
            })]
          })
        }), (0, W.jsx)("tbody", {
          children: (l === "up" ? j : at).slice(0, 6).map((q, Z) => (0, W.jsxs)("tr", {
            children: [(0, W.jsx)("td", {
              children: q.k
            }), (0, W.jsx)("td", {
              children: l === "up" ? (q.w ?? 0).toFixed(2) : l === "sfs" ? ((q.theta ?? 0) * 180 / Math.PI % 360).toFixed(1) : (q.x - r.x).toFixed(2)
            }), (0, W.jsx)("td", {
              children: l === "up" ? `(${q.x}, ${q.y})` : l === "sfs" ? (q.l ?? 0).toFixed(2) : (q.y - r.y).toFixed(2)
            }), (0, W.jsx)("td", {
              children: (Y2(A, q.x, q.y) * 100).toFixed(2)
            })]
          }, Z))
        })]
      }), (0, W.jsxs)("div", {
        className: "ns-rose-row",
        children: [(0, W.jsxs)("svg", {
          viewBox: "-60 -60 120 120",
          className: "ns-rose",
          role: "img",
          "aria-label": `8 \u4E2A\u65B9\u5411\u7684\u91C7\u6837\u6570\uFF1A${J.join("、")}`,
          children: [(0, W.jsx)("circle", {
            r: 50,
            fill: "none",
            stroke: m.axis,
            strokeWidth: 1.5
          }), J.map((q, Z) => {
            let yt = (Z - .5) * Math.PI / 4 + .04,
              Dt = (Z + .5) * Math.PI / 4 - .04,
              Jt = 6 + 44 * q / z;
            return (0, W.jsx)("path", {
              d: `M0 0 L${Jt * Math.cos(yt)} ${Jt * Math.sin(yt)} A${Jt} ${Jt} 0 0 1 ${Jt * Math.cos(Dt)} ${Jt * Math.sin(Dt)} Z`,
              fill: q ? l === "sfs" ? m.green : l === "dat" ? m.red : m.blue : "#eef2f7",
              opacity: q ? .85 : 1
            }, Z);
          })]
        }), (0, W.jsxs)("div", {
          className: "ns-text",
          children: [(0, W.jsxs)("div", {
            children: ["采样点 ", (0, W.jsx)("b", {
              children: j.length
            })]
          }), (0, W.jsxs)("div", {
            children: ["覆盖方向 ", (0, W.jsxs)("b", {
              children: [R, "/8"]
            })]
          })]
        })]
      }), (0, W.jsx)("div", {
        className: `ns-feedback ${l === "sfs" ? "is-good" : l === "dat" ? "is-bad" : ""}`,
        "aria-live": "polite",
        children: Wn
      })]
    })]
  });
}
var Ct = {};
Ct["ns-ablation"] = P1;
Ct["ns-attn"] = D1;
Ct["ns-check"] = w1;
Ct["ns-cover"] = Z1;
Ct["ns-dwt"] = E1;
Ct["ns-fpns"] = I1;
Ct["ns-gate"] = $1;
Ct["ns-guide"] = l0;
Ct["ns-hp"] = u0;
Ct["ns-kit"] = T1;
Ct["ns-lineage"] = c0;
Ct["ns-problem"] = r0;
Ct["ns-sota"] = f0;
Ct["ns-spiral"] = A0;
const nsModuleNotes = {
  "ns-problem": "合成热像与手工增强规则。示例命中和虚警只来自本页数据；虚警像素是教学简化，原实现按连通组件匹配，不是逐像素 FP 的简单同义替换。",
  "ns-dwt": "Haar 教学分解采用四像素和/差除以 4 的均值归一化，并非作者 DWT 的数值复刻；目标与背景均为合成。LH/HL 的方向命名随变换约定变化。",
  "ns-guide": "低频图、注意力门控和高频系数为手工教学计算。真实注意力与卷积参数通过训练学习，示意阈值不属于作者实验设置。",
  "ns-gate": "教学高斯核与门控实验，非训练后参数。式 (4) 在幅值低于 τ 的位置使用平滑结果；幅值不低于 τ 的位置保留原系数。",
  "ns-spiral": "式 (8) 几何示意，h、k 从 1 开始。散乱采样使用伪随机点，仅帮助比较覆盖范围，不是 DAT 的学习偏移实现；ε 也是手工扰动。",
  "ns-attn": "结构重绘对应式 (7)–(10)、图 3；表 1 来自 IRSTD-1k，FLOPs 中带 + 的数值为相对上采样的增量，6.80G 为参照。",
  "ns-ablation": "论文表 2、表 6。IoU/Pd 单位为 %；Fa 为 ×10⁻⁶，越低越好；参数和 FLOPs 中带 + 的值为相对基线的增量。左侧缩略热像仅演示 LFP，虚警像素规则作教学简化。",
  "ns-hp": "论文表 3、图 6，IRSTD-1k。图 6 选择 H=8、P=4 时 IoU/Pd 在报告配置中最高，Fa 与 H=8、P=6 并列最低。",
  "ns-fpns": "论文表 4，IRSTD-1k。各表原值分别保留；参数/M 与 FLOPs/G 的 + 号表示相对基线的增量。Fa 单位为 ×10⁻⁶。",
  "ns-sota": "论文表 5。分割的 IoU/Pd 为 %，Fa 为 ×10⁻⁶；检测 mAP 指标为 %。数字均为作者报告，未由本导读重新训练或评测。",
  "ns-lineage": "结构比较示意，不构成跨论文性能实验。三篇论文的任务、宿主、训练与数据划分不同，结构继承不等于统一评测。",
  "ns-check": "阅读核对依据为原论文各表和说明。点击展开仅表示查看条目，不代表完成模型复现。"
};
export const recoveredWidgets = Object.fromEntries(Object.entries(Ct).map(([id, Component]) => [id, function RecoveredWidget(props) {
  return jsxRuntime.jsxs(React.Fragment, {
    children: [jsxRuntime.jsx(Component, props), nsModuleNotes[id] && jsxRuntime.jsx('p', {
      className: 'ns-module-notice',
      children: nsModuleNotes[id]
    })]
  });
}]));
