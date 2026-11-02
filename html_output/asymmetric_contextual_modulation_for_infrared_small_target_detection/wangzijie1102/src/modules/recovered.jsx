// Recovered from the supplied ACM guide; bundled vendor runtime and slideshow shell removed.
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as jsxRuntime from "react/jsx-runtime";
  var um = jsxRuntime;
  function de({
    variant: t = "body",
    children: e,
    muted: a = !1
  }) {
    return (0, um.jsx)(t === "h1" || t === "h2" || t === "h3" ? t : "p", {
      className: `ppt-type ppt-type-${t}${a ? " ppt-muted" : ""}`,
      children: e
    });
  }
  var ec = React;
  var fl = React,
    yt = jsxRuntime,
    S = {
      ink: "#21324a",
      muted: "#68778f",
      axis: "#d7deea",
      blue: "#27446e",
      green: "#228d5c",
      red: "#c43f52",
      orange: "#f07e47",
      purple: "#7c3aed",
      night: "#0d1624",
      deck: "#3a4a5f"
    },
    z = 120,
    L = 90,
    te = 50,
    Pu = .4,
    Vt = {
      x: 90,
      y: 30,
      s: 3,
      a: .12
    },
    zt = (t, e, a) => Math.max(e, Math.min(a, t)),
    on = t => 1 / (1 + Math.exp(-t));
  function ol(t, e, a = 0) {
    let l = Math.sin(t * 127.1 + e * 311.7 + a * 74.7) * 43758.5453;
    return l - Math.floor(l);
  }
  function ts(t, e, a, l) {
    let n = t / a,
      i = e / a,
      u = Math.floor(n),
      c = Math.floor(i),
      o = n - u,
      f = i - c,
      s = o * o * (3 - 2 * o),
      m = f * f * (3 - 2 * f),
      p = ol(u, c, l),
      h = ol(u + 1, c, l),
      b = ol(u, c + 1, l),
      y = ol(u + 1, c + 1, l);
    return p + (h - p) * s + (b - p) * m + (p - h - b + y) * s * m;
  }
  var iv = [[8, 62, .5], [19, 71, .42], [31, 58, .46], [47, 80, .55], [58, 66, .4], [66, 75, .48], [80, 61, .52], [92, 84, .44], [101, 68, .47], [112, 77, .41], [25, 86, .38], [86, 72, .36]],
    es = null;
  function uv() {
    if (es) return es;
    let t = new Float32Array(z * L);
    for (let e = 0; e < L; e++) for (let a = 0; a < z; a++) {
      let l;
      if (e < te) {
        let n = ts(a, e, 22, 1) * .7 + ts(a, e, 9, 2) * .3;
        l = .3 + .06 * (e / te) + Math.max(0, n - .52) * .9;
      } else l = .2 + .025 * Math.sin(a * .55 + e * 1.7) + .02 * ts(a, e, 6, 3);
      e >= te - 3 && e <= te && a >= 64 && a <= 104 && (l = .42), l += (ol(a, e, 9) - .5) * .03, t[e * z + a] = l;
    }
    for (let [e, a, l] of iv) t[a * z + e] += l, t[a * z + e + 1] += l * .6;
    return es = t, t;
  }
  function sl(t) {
    let e = new Float32Array(z * L),
      a = t.s / 2.4;
    for (let l = 0; l < L; l++) for (let n = 0; n < z; n++) {
      let i = (n - t.x) ** 2 + (l - t.y) ** 2;
      e[l * z + n] = Math.exp(-i / (2 * a * a));
    }
    return e;
  }
  function Ga(t) {
    let e = Float32Array.from(uv());
    if (t) {
      let a = sl(t);
      for (let l = 0; l < e.length; l++) e[l] += t.a * a[l];
    }
    return e;
  }
  function as(t, e, a = z, l = L) {
    let n = new Float32Array(a * l),
      i = (2 * e + 1) ** 2;
    for (let u = 0; u < l; u++) for (let c = 0; c < a; c++) {
      let o = 0;
      for (let f = -e; f <= e; f++) {
        let s = zt(u + f, 0, l - 1) * a;
        for (let m = -e; m <= e; m++) o += t[s + zt(c + m, 0, a - 1)];
      }
      n[u * a + c] = o / i;
    }
    return n;
  }
  function cv(t) {
    let e = as(t, 5),
      a = as(t, 2),
      l = as(t, 1),
      n = new Float32Array(z * L),
      i = new Float32Array(z * L);
    for (let u = 0; u < L; u++) for (let c = 0; c < z; c++) {
      let o = u * z + c,
        f = (e[o] * 121 - a[o] * 25) / 96;
      n[o] = Math.max(0, t[o] - f);
      let s = c === 0 ? l[o + 1] - l[o] : c === z - 1 ? l[o] - l[o - 1] : (l[o + 1] - l[o - 1]) / 2,
        m = u === 0 ? l[o + z] - l[o] : u === L - 1 ? l[o] - l[o - z] : (l[o + z] - l[o - z]) / 2;
      i[o] = Math.hypot(s, m) * 2;
    }
    return {
      X0: n,
      X1: i
    };
  }
  function cm(t, e, a = z, l = L) {
    let n = Math.ceil(a / e),
      i = Math.ceil(l / e),
      u = new Float32Array(n * i);
    for (let c = 0; c < i; c++) for (let o = 0; o < n; o++) {
      let f = 0,
        s = 0;
      for (let m = c * e; m < Math.min(l, (c + 1) * e); m++) for (let p = o * e; p < Math.min(a, (o + 1) * e); p++) f += t[m * a + p], s++;
      u[c * n + o] = f / s;
    }
    return {
      g: u,
      gw: n,
      gh: i
    };
  }
  function om(t, e, a = z, l = L) {
    let n = new Float32Array(a * l);
    for (let i = 0; i < l; i++) {
      let u = zt((i + .5) / e - .5, 0, t.gh - 1),
        c = Math.floor(u),
        o = Math.min(c + 1, t.gh - 1),
        f = u - c;
      for (let s = 0; s < a; s++) {
        let m = zt((s + .5) / e - .5, 0, t.gw - 1),
          p = Math.floor(m),
          h = Math.min(p + 1, t.gw - 1),
          b = m - p,
          y = t.g[c * t.gw + p] * (1 - b) + t.g[c * t.gw + h] * b,
          M = t.g[o * t.gw + p] * (1 - b) + t.g[o * t.gw + h] * b;
        n[i * a + s] = y * (1 - f) + M * f;
      }
    }
    return n;
  }
  var Zt = {
      ySem: 2.5,
      gIn: 60,
      g0: [2.2, -1.5],
      g1: [1, -1.17],
      hBlob: 35,
      hEdge: -10,
      l0: [1, -1.2],
      l1: [-.5, -.3]
    },
    fm = new Map();
  function rl(t, e, a = Vt) {
    let l = `${t}|${e}|${a.x}|${a.y}|${a.s}|${a.a}`,
      n = fm.get(l);
    if (n) return n;
    let i = Ga(a),
      {
        X0: u,
        X1: c
      } = cv(i),
      o = sl(a),
      f = om(cm(o, e), e).map(C => C * Zt.ySem),
      s = om(cm(c, e), e),
      m = 0,
      p = 0;
    for (let C = 0; C < f.length; C++) m += f[C], p += s[C];
    m /= f.length, p /= s.length;
    let h = Math.max(0, Zt.gIn * p),
      b = [on(Zt.g0[0] + Zt.g0[1] * h), on(Zt.g1[0] + Zt.g1[1] * h)],
      y = new Float32Array(z * L),
      M = new Float32Array(z * L),
      d = new Float32Array(z * L),
      r = 0,
      g = 0,
      v = 0,
      N = 0,
      T = 0,
      A = -1,
      O = 0;
    for (let C = 0; C < d.length; C++) {
      let ht = Math.max(0, Zt.hBlob * u[C] + Zt.hEdge * c[C]);
      y[C] = on(Zt.l0[0] * ht + Zt.l0[1]), M[C] = on(Zt.l1[0] * ht + Zt.l1[1]);
      let sc = t === "td" || t === "acm" ? b[0] : 1,
        lg = t === "td" || t === "acm" ? b[1] : 1,
        ng = t === "bu" || t === "acm" ? y[C] : 1,
        ig = t === "bu" || t === "acm" ? M[C] : 1;
      d[C] = sc * u[C] + ng * f[C] + lg * c[C] + ig * s[C];
      let xi = d[C] > Pu,
        rc = o[C] > .5;
      xi && r++, rc && g++, xi && rc && v++, (xi || rc) && T++, xi && o[C] <= .05 && N++, d[C] > A && (A = d[C], O = C);
    }
    let B = {
      I: i,
      X0: u,
      X1: c,
      Y0: f,
      Y1: s,
      y: [m, p],
      g: b,
      L0: y,
      L1: M,
      P: d,
      S: o,
      iou: T ? v / T : 0,
      predPx: r,
      gtPx: g,
      hitPx: v,
      faPx: N,
      peakIsTarget: o[O] > .3
    };
    return fm.set(l, B), B;
  }
  function ov(t, e) {
    let a = zt(e, 0, 1);
    if (t === "ir") {
      let i = [13, 22, 36],
        u = [120, 134, 150],
        c = [244, 246, 240],
        o = a < .55 ? [i, u, a / .55] : [u, c, (a - .55) / .45],
        [f, s, m] = o;
      return [0, 1, 2].map(p => Math.round(f[p] + (s[p] - f[p]) * m));
    }
    if (t === "att") {
      let i = [248, 247, 253],
        u = [124, 58, 237];
      return [0, 1, 2].map(c => Math.round(i[c] + (u[c] - i[c]) * a));
    }
    let l = [247, 249, 252],
      n = [39, 68, 110];
    return [0, 1, 2].map(i => Math.round(l[i] + (n[i] - l[i]) * a));
  }
  function Lt({
    data: t,
    w: e = z,
    h: a = L,
    palette: l = "feat",
    vmin: n = 0,
    vmax: i = 1,
    gamma: u = 1,
    label: c,
    className: o
  }) {
    let f = (0, fl.useRef)(null);
    return (0, fl.useEffect)(() => {
      let s = f.current;
      if (!s) return;
      let m = s.getContext("2d");
      if (!m) return;
      let p = m.createImageData(e, a);
      for (let h = 0; h < e * a; h++) {
        let [b, y, M] = ov(l, Math.pow(zt((t[h] - n) / (i - n), 0, 1), u));
        p.data[h * 4] = b, p.data[h * 4 + 1] = y, p.data[h * 4 + 2] = M, p.data[h * 4 + 3] = 255;
      }
      m.putImageData(p, 0, 0);
    }, [t, e, a, l, n, i, u]), (0, yt.jsx)("canvas", {
      ref: f,
      width: e,
      height: a,
      className: `ac-canvas ${o ?? ""}`,
      role: "img",
      "aria-label": `${c || "热图"}（手工参数教学示意）`
    });
  }
  function Le() {
    return (0, yt.jsxs)("svg", {
      className: "ac-ot",
      viewBox: "0 0 20 20",
      "aria-label": "⊗",
      role: "img",
      children: [(0, yt.jsx)("circle", {
        cx: "10",
        cy: "10",
        r: "8",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2"
      }), (0, yt.jsx)("path", {
        d: "M5.5 5.5 L14.5 14.5 M14.5 5.5 L5.5 14.5",
        stroke: "currentColor",
        strokeWidth: "2"
      })]
    });
  }
  function Xe({
    x: t = 0,
    y: e = 0,
    w: a = z,
    h: l = L
  }) {
    let n = Math.min(a, l) * .08,
      i = "#9fd3c7",
      u = t + 2,
      c = e + 2,
      o = t + a - 2,
      f = e + l - 2;
    return (0, yt.jsx)("g", {
      pointerEvents: "none",
      stroke: i,
      strokeWidth: .7,
      fill: "none",
      opacity: .85,
      children: (0, yt.jsx)("path", {
        d: `M${u} ${c + n} V${c} H${u + n} M${o - n} ${c} H${o} V${c + n} M${o} ${f - n} V${f} H${o - n} M${u + n} ${f} H${u} V${f - n}`
      })
    });
  }
  function sm(t, e, a, l = z) {
    return t.slice(e * l, (e + a) * l);
  }
  function Te({
    x: t = 0,
    y: e = 0,
    s: a = 1,
    glow: l = !1
  }) {
    return (0, yt.jsxs)("g", {
      transform: `translate(${t} ${e}) scale(${a})`,
      children: [(0, yt.jsx)("rect", {
        x: "4",
        y: "18",
        width: "30",
        height: "44",
        rx: "10",
        fill: S.deck
      }), (0, yt.jsx)("rect", {
        x: "46",
        y: "18",
        width: "30",
        height: "44",
        rx: "10",
        fill: S.deck
      }), (0, yt.jsx)("rect", {
        x: "30",
        y: "26",
        width: "20",
        height: "14",
        rx: "4",
        fill: "#536379"
      }), (0, yt.jsx)("circle", {
        cx: "19",
        cy: "62",
        r: "13",
        fill: "#1d2a3c",
        stroke: S.deck,
        strokeWidth: "4"
      }), (0, yt.jsx)("circle", {
        cx: "61",
        cy: "62",
        r: "13",
        fill: "#1d2a3c",
        stroke: S.deck,
        strokeWidth: "4"
      }), (0, yt.jsx)("circle", {
        cx: "19",
        cy: "62",
        r: "6",
        fill: l ? "#9fd3c7" : "#2c3d55"
      }), (0, yt.jsx)("circle", {
        cx: "61",
        cy: "62",
        r: "6",
        fill: l ? "#9fd3c7" : "#2c3d55"
      }), (0, yt.jsx)("rect", {
        x: "10",
        y: "8",
        width: "18",
        height: "12",
        rx: "4",
        fill: "#536379"
      }), (0, yt.jsx)("rect", {
        x: "52",
        y: "8",
        width: "18",
        height: "12",
        rx: "4",
        fill: "#536379"
      })]
    });
  }
  function Iu(t, e, a) {
    if (!t) return null;
    let l = t.getScreenCTM();
    if (!l) return null;
    let n = new DOMPoint(e, a).matrixTransform(l.inverse());
    return {
      x: n.x,
      y: n.y
    };
  }
  function rm(t, e) {
    let a = (0, fl.useRef)(null),
      l = (0, fl.useRef)(e);
    l.current = e;
    let n = i => {
      a.current === i.pointerId && (a.current = null, l.current.end?.());
    };
    return {
      onPointerDown: i => {
        if (!i.isPrimary || i.pointerType === "mouse" && i.button !== 0) return;
        let u = Iu(t.current, i.clientX, i.clientY);
        u && (a.current = i.pointerId, i.currentTarget.setPointerCapture(i.pointerId), l.current.start?.(u.x, u.y), l.current.move(u.x, u.y));
      },
      onPointerMove: i => {
        if (a.current !== i.pointerId) return;
        let u = Iu(t.current, i.clientX, i.clientY);
        u && l.current.move(u.x, u.y);
      },
      onPointerUp: n,
      onPointerCancel: n
    };
  }
  function tc(t, e) {
    let l = {
      ArrowLeft: [-e, 0],
      ArrowRight: [e, 0],
      ArrowUp: [0, -e],
      ArrowDown: [0, e]
    }[t.key];
    return l ? (t.preventDefault(), l) : null;
  }
  function dm({
    r: t,
    showGt: e = !0
  }) {
    let a = [];
    for (let n = 0; n < L; n++) for (let i = 0; i < z; i++) {
      let u = n * z + i;
      t.P[u] > Pu && a.push((0, yt.jsx)("rect", {
        x: i,
        y: n,
        width: 1.02,
        height: 1.02,
        fill: t.S[u] > .05 ? S.green : S.red,
        opacity: .92
      }, u));
    }
    let l = null;
    if (e) {
      let n = z,
        i = L,
        u = -1,
        c = -1;
      for (let o = 0; o < L; o++) for (let f = 0; f < z; f++) t.S[o * z + f] > .5 && (n = Math.min(n, f), i = Math.min(i, o), u = Math.max(u, f), c = Math.max(c, o));
      u >= 0 && (l = (0, yt.jsx)("rect", {
        x: n - 1.5,
        y: i - 1.5,
        width: u - n + 4,
        height: c - i + 4,
        fill: "none",
        stroke: S.orange,
        strokeWidth: .6,
        strokeDasharray: "1.4 1"
      }));
    }
    return (0, yt.jsxs)("g", {
      pointerEvents: "none",
      children: [a, l]
    });
  }
  function pm(t) {
    return null;
  }
  var Z = jsxRuntime,
    ls = {
      fpn: {
        iou: {
          TopDownLocal: [.595, .648, .693, .713],
          BiGlobal: [.599, .66, .685, .693],
          BiLocal: [.591, .662, .713, .722],
          "Regular-ACM": [.683, .703, .711, .711],
          ACM: [.645, .7, .714, .731]
        },
        niou: {
          TopDownLocal: [.635, .662, .688, .703],
          BiGlobal: [.645, .674, .696, .684],
          BiLocal: [.657, .694, .709, .714],
          "Regular-ACM": [.661, .671, .68, .675],
          ACM: [.684, .702, .713, .721]
        }
      },
      unet: {
        iou: {
          TopDownLocal: [.648, .71, .713, .718],
          BiGlobal: [.682, .716, .723, .73],
          BiLocal: [.67, .715, .718, .742],
          "Regular-ACM": [.684, .7, .692, .692],
          ACM: [.707, .732, .741, .743]
        },
        niou: {
          TopDownLocal: [.673, .692, .694, .697],
          BiGlobal: [.688, .708, .707, .719],
          BiLocal: [.68, .71, .713, .72],
          "Regular-ACM": [.637, .65, .646, .643],
          ACM: [.709, .72, .726, .731]
        }
      }
    },
    gi = {
      TopDownLocal: S.red,
      BiGlobal: S.purple,
      BiLocal: S.blue,
      "Regular-ACM": S.red,
      ACM: S.green
    },
    mm = {
      TopDownLocal: ["逐点", "—"],
      BiLocal: ["逐点", "逐点"],
      BiGlobal: ["全局", "全局"],
      ACM: ["全局", "逐点"],
      "Regular-ACM": ["全局", "逐点"]
    },
    gm = [{
      id: "q1",
      name: "Q1 下采样",
      rows: ["ACM", "Regular-ACM"],
      claim: "待核对：降低下采样是否在每个深度、每个指标下都更好？"
    }, {
      id: "q2",
      name: "Q2 双向",
      rows: ["BiLocal", "TopDownLocal"],
      claim: "待核对：控制注意力参数量为 C² 后，双向 BiLocal 是否总优于单向 TopDownLocal？"
    }, {
      id: "q3",
      name: "Q3 非对称",
      rows: ["ACM", "BiLocal", "BiGlobal"],
      claim: "待核对：非对称 ACM 与 BiLocal、BiGlobal 相比，各设置的优势是否一致？"
    }];
  function hm(t) {
    let [e, a] = (0, ec.useState)(1),
      [l, n] = (0, ec.useState)("fpn"),
      [i, u] = (0, ec.useState)("iou"),
      c = gm[e],
      o = ls[l][i],
      f = .58,
      s = .75,
      m = r => 160 + r * 195,
      p = r => 400 - (r - f) / (s - f) * 360,
      h = c.rows[0],
      b = [],
      y = 0,
      M = 0;
    ["iou", "niou"].forEach(r => [0, 1, 2, 3].forEach(g => {
      M++;
      let v = ls[l][r][h][g],
        N = Math.max(...c.rows.slice(1).map(T => ls[l][r][T][g]));
      v > N ? y++ : b.push(`${r === "iou" ? "IoU" : "nIoU"} b=${g + 1}`);
    }));
    let d = b.length === 0 ? `${l === "fpn" ? "FPN" : "U-Net"} \u5BBF\u4E3B\uFF1A${h} \u5728 8 \u4E2A\u683C\u5B50\u91CC\u5168\u90E8\u9886\u5148\u3002` : `${l === "fpn" ? "FPN" : "U-Net"} \u5BBF\u4E3B\uFF1A${h} \u9886\u5148 ${y}/${M}\uFF0C\u4F8B\u5916\u662F ${b.join("、")}\u3002`;
    return (0, Z.jsxs)("div", {
      className: "ac-page ac-ablation-page",
      children: [(0, Z.jsxs)("div", {
        className: "ac-ablation-left",
        children: [(0, Z.jsx)("div", {
          className: "ac-chips ac-qs",
          role: "group",
          "aria-label": "消融问题",
          children: gm.map((r, g) => (0, Z.jsx)("button", {
            className: `ac-chip ${e === g ? "is-on" : ""}`,
            "aria-pressed": e === g,
            onClick: () => a(g),
            children: r.name
          }, r.id))
        }), (0, Z.jsxs)("div", {
          className: "ac-chips",
          role: "group",
          "aria-label": "宿主网络与指标",
          children: [(0, Z.jsx)("button", {
            className: `ac-chip ${l === "fpn" ? "is-on" : ""}`,
            "aria-pressed": l === "fpn",
            onClick: () => n("fpn"),
            children: "FPN"
          }), (0, Z.jsx)("button", {
            className: `ac-chip ${l === "unet" ? "is-on" : ""}`,
            "aria-pressed": l === "unet",
            onClick: () => n("unet"),
            children: "U-Net"
          }), (0, Z.jsx)("button", {
            className: `ac-chip ${i === "iou" ? "is-on" : ""}`,
            "aria-pressed": i === "iou",
            onClick: () => u("iou"),
            children: "IoU"
          }), (0, Z.jsx)("button", {
            className: `ac-chip ${i === "niou" ? "is-on" : ""}`,
            "aria-pressed": i === "niou",
            onClick: () => u("niou"),
            children: "nIoU"
          })]
        }), (0, Z.jsxs)("table", {
          className: "ac-table ac-paths",
          children: [(0, Z.jsx)("thead", {
            children: (0, Z.jsxs)("tr", {
              children: [(0, Z.jsx)("th", {
                children: "结构"
              }), (0, Z.jsx)("th", {
                children: "自顶向下"
              }), (0, Z.jsx)("th", {
                children: "自底向上"
              })]
            })
          }), (0, Z.jsx)("tbody", {
            children: c.rows.map(r => (0, Z.jsxs)("tr", {
              children: [(0, Z.jsx)("td", {
                style: {
                  color: gi[r],
                  fontWeight: 750
                },
                children: r
              }), (0, Z.jsx)("td", {
                children: mm[r][0]
              }), (0, Z.jsx)("td", {
                children: mm[r][1]
              })]
            }, r))
          })]
        }), (0, Z.jsx)("p", {
          className: "ac-text ac-tight ac-muted",
          children: e === 0 ? "Regular-ACM：模块相同，只是特征图多下采样 4 倍。" : "图 7 比较的注意力分支按 C² 控制权重参数预算，用来比较方向和注意力尺度；这不表示整个网络的参数量相同。"
        })]
      }), (0, Z.jsxs)("div", {
        className: "ac-ablation-right",
        children: [(0, Z.jsxs)("svg", {
          viewBox: "0 0 960 470",
          className: "ac-svg",
          role: "img",
          "aria-label": `\u8868 2\uFF1A${c.rows.join("、")} \u7684 ${i === "iou" ? "IoU" : "nIoU"} \u968F b \u7684\u53D8\u5316`,
          children: [[.6, .65, .7, .75].map(r => (0, Z.jsxs)("g", {
            children: [(0, Z.jsx)("line", {
              x1: 90,
              x2: 760,
              y1: p(r),
              y2: p(r),
              stroke: S.axis
            }), (0, Z.jsx)("text", {
              x: 80,
              y: p(r) + 9,
              textAnchor: "end",
              fontSize: 24,
              fill: S.muted,
              children: r.toFixed(2)
            })]
          }, r)), [0, 1, 2, 3].map(r => (0, Z.jsxs)("text", {
            x: m(r),
            y: 444,
            textAnchor: "middle",
            fontSize: 26,
            fill: S.ink,
            children: ["b = ", r + 1]
          }, r)), c.rows.map(r => (0, Z.jsxs)("g", {
            children: [(0, Z.jsx)("polyline", {
              points: o[r].map((g, v) => `${m(v)},${p(g)}`).join(" "),
              fill: "none",
              stroke: gi[r],
              strokeWidth: r === h ? 5 : 3,
              strokeDasharray: r === "Regular-ACM" || r === "TopDownLocal" ? "10 7" : void 0
            }), o[r].map((g, v) => (0, Z.jsx)("circle", {
              cx: m(v),
              cy: p(g),
              r: r === h ? 8 : 6,
              fill: gi[r]
            }, v)), (0, Z.jsx)("text", {
              x: m(3) + 18,
              y: p(o[r][3]) + (r === "BiGlobal" ? 22 : r === "BiLocal" && e === 2 ? -6 : 9),
              fontSize: 24,
              fontWeight: 700,
              fill: gi[r],
              children: r
            })]
          }, r)), c.rows.map(r => o[r].map((g, v) => r === h ? (0, Z.jsx)("text", {
            x: m(v),
            y: p(g) - 16,
            textAnchor: "middle",
            fontSize: 24,
            fill: gi[r],
            children: g.toFixed(3)
          }, `${r}${v}`) : null)), (0, Z.jsx)("g", {
            transform: "translate(870 380) scale(0.55)",
            children: (0, Z.jsx)(Te, {})
          })]
        }), (0, Z.jsxs)("div", {
          className: "ac-feedback",
          "aria-live": "polite",
          children: [c.claim, " ", d]
        })]
      })]
    });
  }
  var dl = React;
  var ee = React,
    vm = ReactDOM,
    fn = jsxRuntime;
  function fv({
    children: t
  }) {
    let e = (0, ee.useRef)(null),
      a = (0, ee.useRef)(null),
      l = (0, ee.useRef)(),
      [n, i] = (0, ee.useState)(null),
      [u, c] = (0, ee.useState)(!1),
      [o, f] = (0, ee.useState)({
        left: 12,
        top: 12
      }),
      s = (0, ee.useId)(),
      m = () => clearTimeout(l.current),
      p = () => {
        m(), i(null), c(!1);
      },
      h = () => {
        m(), u || (l.current = setTimeout(() => {
          e.current?.contains(document.activeElement) || i(null);
        }, 120));
      },
      b = y => y instanceof Element ? y.closest("[data-formula-symbol]") : null;
    return (0, ee.useLayoutEffect)(() => {
      if (!n || !a.current) return;
      let y = n.getBoundingClientRect(),
        M = a.current.getBoundingClientRect();
      return f({
        left: Math.max(12, Math.min(y.left + y.width / 2 - M.width / 2, window.innerWidth - M.width - 12)),
        top: Math.max(12, Math.min(y.bottom + 10 + M.height > window.innerHeight - 12 ? y.top - M.height - 10 : y.bottom + 10, window.innerHeight - M.height - 12))
      }), n.setAttribute("aria-describedby", s), () => n.removeAttribute("aria-describedby");
    }, [n, s]), (0, ee.useEffect)(() => {
      if (!n) return;
      let y = d => {
          !e.current?.contains(d.target) && !a.current?.contains(d.target) && p();
        },
        M = d => {
          d.key === "Escape" && p();
        };
      return document.addEventListener("pointerdown", y), document.addEventListener("keydown", M), document.addEventListener("fullscreenchange", p), window.addEventListener("resize", p), window.addEventListener("scroll", p, !0), () => {
        document.removeEventListener("pointerdown", y), document.removeEventListener("keydown", M), document.removeEventListener("fullscreenchange", p), window.removeEventListener("resize", p), window.removeEventListener("scroll", p, !0), m();
      };
    }, [n]), (0, fn.jsxs)("span", {
      ref: e,
      className: "formula-symbols",
      onPointerOver: y => {
        let M = b(y.target);
        M && (m(), i(M));
      },
      onPointerOut: h,
      onFocus: y => {
        let M = b(y.target);
        M && (m(), i(M));
      },
      onBlur: y => {
        !e.current?.contains(y.relatedTarget) && !u && p();
      },
      onClick: y => {
        let M = b(y.target);
        M && (m(), u && n === M ? p() : (i(M), c(!0)));
      },
      onKeyDown: y => {
        (y.key === "Enter" || y.key === " ") && b(y.target) && (y.preventDefault(), y.target.click());
      },
      children: [t, n && (0, vm.createPortal)((0, fn.jsx)("div", {
        ref: a,
        id: s,
        role: "tooltip",
        className: "formula-symbol-tooltip",
        style: o,
        onPointerEnter: m,
        onPointerLeave: h,
        children: n.dataset.formulaMeaning
      }), document.fullscreenElement ?? document.body)]
    });
  }
  function xt({
    children: t,
    meaning: e
  }) {
    return (0, fn.jsx)(fv, {
      children: (0, fn.jsx)("span", {
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
  var D = jsxRuntime,
    hi = 20,
    ac = 14;
  function bm(t) {
    let [e, a] = (0, dl.useState)(!0),
      [l, n] = (0, dl.useState)(!0),
      [i, u] = (0, dl.useState)(4),
      c = e && l ? "acm" : e ? "td" : l ? "bu" : "add",
      o = rl(c, i),
      f = (0, dl.useMemo)(() => {
        let y = z * L,
          M = new Float32Array(y),
          d = new Float32Array(y),
          r = new Float32Array(y),
          g = new Float32Array(y);
        for (let v = 0; v < y; v++) M[v] = o.X0[v] + o.X1[v], d[v] = o.Y0[v] + o.Y1[v], r[v] = (e ? o.g[0] : 1) * o.X0[v] + (e ? o.g[1] : 1) * o.X1[v], g[v] = (l ? o.L0[v] : 1) * o.Y0[v] + (l ? o.L1[v] : 1) * o.Y1[v];
        return {
          X: M,
          Y: d,
          A: r,
          B: g
        };
      }, [o, e, l]),
      s = (0, dl.useMemo)(() => {
        let y = Vt.x - 10,
          M = Vt.y - 7,
          d = new Float32Array(hi * ac),
          r = [];
        for (let g = 0; g < ac; g++) for (let v = 0; v < hi; v++) {
          let N = (M + g) * z + y + v;
          d[g * hi + v] = o.I[N], o.P[N] > .4 && r.push((0, D.jsx)("rect", {
            x: v + .08,
            y: g + .08,
            width: .84,
            height: .84,
            fill: o.S[N] > .05 ? S.green : S.red,
            opacity: .85
          }, N)), o.S[N] > .5 && r.push((0, D.jsx)("rect", {
            x: v + .04,
            y: g + .04,
            width: .92,
            height: .92,
            fill: "none",
            stroke: S.orange,
            strokeWidth: .12
          }, `g${N}`));
        }
        return {
          I: d,
          cells: r
        };
      }, [o]),
      m = {
        add: "两条都关：直接相加（简化示意）",
        td: "只有自顶向下 G(Y)",
        bu: "只有自底向上 L(X)",
        acm: "ACM：两条都开"
      }[c],
      p = "",
      h = "";
    i === 16 ? (p = "在这组手工参数里，下采样减弱了 Y 中的目标响应；这个演示只能说明信息丢失的可能性，不能证明所有网络都无法恢复。", h = "is-bad") : c === "acm" ? (p = "在手工设定的特征与门控下，G 调整通道权重，L 在各位置调整通道响应；当前合成掩码更贴合目标。真实增益应查看表 2 的实验。", h = "is-good") : c === "td" ? p = "本示意只开启 G：全局通道权重在各位置共享，因此不会单独细化某一个位置的响应。" : c === "bu" ? (p = "本示意只开启 L：高层响应按位置调制，但 X 的杂波响应仍直接参与相加。", h = "is-bad") : (p = "本示意关闭两条门控后直接相加：当前手工特征中的杂波也会保留。这不是 FPN 的真实推理结果。", h = "is-bad");
    let b = (y, M, d, r, g = "feat") => (0, D.jsxs)("figure", {
      className: "ac-acm-small",
      children: [(0, D.jsx)("div", {
        className: "ac-light",
        children: (0, D.jsx)(Lt, {
          data: y,
          palette: g,
          vmin: 0,
          vmax: r,
          gamma: .5,
          label: M
        })
      }), (0, D.jsx)("figcaption", {
        className: "ac-text",
        children: d
      })]
    });
    return (0, D.jsxs)("div", {
      className: "ac-page ac-acm-page",
      children: [(0, D.jsxs)("div", {
        className: "ac-acm-main",
        children: [(0, D.jsxs)("div", {
          className: "ac-view ac-acm-view",
          children: [(0, D.jsx)(Lt, {
            data: o.I,
            palette: "ir",
            vmin: .12,
            vmax: .78,
            label: "合成热像与手工计算的示意掩码"
          }), (0, D.jsxs)("svg", {
            viewBox: `0 0 ${z} ${L}`,
            "aria-hidden": "true",
            children: [(0, D.jsx)(Xe, {}), (0, D.jsx)(dm, {
              r: o
            }), (0, D.jsx)("rect", {
              x: Vt.x - 10,
              y: Vt.y - 7.5,
              width: 20,
              height: 15,
              fill: "none",
              stroke: "#9fd3c7",
              strokeWidth: .4,
              strokeDasharray: "1 0.8"
            })]
          }), (0, D.jsxs)("div", {
            className: "ac-zoom",
            children: [(0, D.jsx)(Lt, {
              data: s.I,
              w: hi,
              h: ac,
              palette: "ir",
              vmin: .12,
              vmax: .78,
              label: "目标附近放大 6 倍"
            }), (0, D.jsx)("svg", {
              viewBox: `0 0 ${hi} ${ac}`,
              "aria-hidden": "true",
              children: s.cells
            })]
          })]
        }), (0, D.jsxs)("div", {
          className: "ac-legend ac-text",
          children: [(0, D.jsx)("span", {
            style: {
              "--c": S.green
            },
            children: "命中"
          }), (0, D.jsx)("span", {
            style: {
              "--c": S.red
            },
            children: "虚警"
          }), (0, D.jsx)("span", {
            className: "is-dash",
            style: {
              "--c": S.orange
            },
            children: "真值"
          })]
        })]
      }), (0, D.jsxs)("div", {
        className: "ac-acm-grid",
        children: [b(f.X, "低层特征 X", (0, D.jsxs)(D.Fragment, {
          children: ["低层 ", (0, D.jsx)(xt, {
            meaning: "X：浅层特征，分辨率高、细节多（这里两个示意通道：斑点、边缘）。",
            children: "X"
          })]
        }), .35), b(f.Y, "高层特征 Y（上采样后）", (0, D.jsxs)(D.Fragment, {
          children: ["高层 ", (0, D.jsx)(xt, {
            meaning: "Y：深层特征，语义强但分辨率低；与 X 融合前先上采样到同一尺寸。",
            children: "Y"
          })]
        }), 1), b(f.A, "G(Y)⊗X", e ? (0, D.jsxs)(D.Fragment, {
          children: ["G(Y) ", (0, D.jsx)(Le, {}), " X"]
        }) : "X（未调制）", .35), b(f.B, "L(X)⊗Y", l ? (0, D.jsxs)(D.Fragment, {
          children: ["L(X) ", (0, D.jsx)(Le, {}), " Y"]
        }) : "Y（未调制）", 1)]
      }), (0, D.jsxs)("div", {
        className: "ac-side",
        children: [(0, D.jsxs)("div", {
          className: "ac-formula ac-h",
          children: ["Z = ", (0, D.jsx)("span", {
            className: e ? "" : "ac-off",
            children: "G(Y)"
          }), " ", (0, D.jsx)(Le, {}), " X + ", (0, D.jsx)("span", {
            className: l ? "" : "ac-off",
            children: "L(X)"
          }), " ", (0, D.jsx)(Le, {}), " Y"]
        }), (0, D.jsxs)("div", {
          className: "ac-toggles",
          role: "group",
          "aria-label": "两条调制通路",
          children: [(0, D.jsx)("button", {
            className: `ac-toggle ${e ? "is-on" : ""}`,
            "aria-pressed": e,
            onClick: () => a(!e),
            children: "自顶向下 G"
          }), (0, D.jsx)("button", {
            className: `ac-toggle ${l ? "is-on" : ""}`,
            "aria-pressed": l,
            onClick: () => n(!l),
            children: "自底向上 L"
          })]
        }), (0, D.jsxs)("div", {
          className: "ac-chips",
          role: "group",
          "aria-label": "高层 Y 的分辨率",
          children: [(0, D.jsx)("button", {
            className: `ac-chip ${i === 4 ? "is-on is-new" : ""}`,
            "aria-pressed": i === 4,
            onClick: () => u(4),
            children: "保留分辨率"
          }), (0, D.jsx)("button", {
            className: `ac-chip ${i === 16 ? "is-on is-old" : ""}`,
            "aria-pressed": i === 16,
            onClick: () => u(16),
            children: "过度下采样"
          })]
        }), (0, D.jsx)("div", {
          className: "ac-text",
          children: (0, D.jsx)("b", {
            children: m
          })
        }), (0, D.jsxs)("div", {
          className: "ac-kv ac-text",
          children: [(0, D.jsxs)("div", {
            children: [(0, D.jsx)("span", {
              children: "合成示例 IoU（非实验）"
            }), (0, D.jsx)("b", {
              className: o.iou > .6 ? "is-good" : "is-bad",
              children: o.iou.toFixed(2)
            })]
          }), (0, D.jsxs)("div", {
            children: [(0, D.jsx)("span", {
              children: "合成示例虚警像素"
            }), (0, D.jsx)("b", {
              className: o.faPx === 0 ? "is-good" : "is-bad",
              children: o.faPx
            })]
          })]
        }), (0, D.jsx)("div", {
          className: `ac-feedback ${h}`,
          "aria-live": "polite",
          children: p
        })]
      })]
    });
  }
  var xm = React;
  var lc = React,
    ns = (0, lc.createContext)({
      progress: 1,
      playing: !1
    }),
    ym = () => (0, lc.useContext)(ns);
  var qe = jsxRuntime,
    pl = 17,
    sn = 70;
  function Sm({
    moduleId: t
  }) {
    let {
        progress: e
      } = ym(),
      a = t === "newMethod" || t === "new",
      l = a ? rl("acm", 4) : rl("add", 16),
      n = (0, xm.useMemo)(() => sm(l.I, pl, sn), [l]),
      i = zt((e - .08) / .7, 0, 1) * z,
      u = e > .8,
      c = [];
    for (let f = pl; f < Math.min(L, pl + sn); f++) for (let s = 0; s < Math.min(z, i); s++) {
      let m = f * z + s;
      l.P[m] > Pu && c.push((0, qe.jsx)("rect", {
        x: s - .6,
        y: f - .6,
        width: 2.2,
        height: 2.2,
        fill: "none",
        stroke: l.S[m] > .05 ? S.green : S.red,
        strokeWidth: .7
      }, m));
    }
    let o = !a && u;
    return (0, qe.jsxs)("div", {
      className: "ac-cover",
      children: [(0, qe.jsx)(Lt, {
        data: n,
        h: sn,
        palette: "ir",
        vmin: .12,
        vmax: .78,
        label: a ? "手工参数示意：保留细节并组合两条调制通路" : "手工参数示意：下采样与杂波带来的困难"
      }), (0, qe.jsxs)("svg", {
        viewBox: `0 ${pl} ${z} ${sn}`,
        preserveAspectRatio: "none",
        "aria-hidden": "true",
        children: [(0, qe.jsx)(Xe, {
          y: pl,
          h: sn
        }), i > 0 && i < z && (0, qe.jsx)("line", {
          x1: i,
          x2: i,
          y1: pl,
          y2: pl + sn,
          stroke: "#9fd3c7",
          strokeWidth: .5,
          opacity: .8
        }), c, o && (0, qe.jsx)("circle", {
          cx: Vt.x,
          cy: Vt.y,
          r: 5,
          fill: "none",
          stroke: S.orange,
          strokeWidth: .8,
          strokeDasharray: "1.6 1.2"
        })]
      }), (0, qe.jsx)("div", {
        className: `ac-cover-result ${u ? a ? "is-new" : "is-old" : ""}`,
        "aria-live": "polite",
        children: a ? "教学示意 · 双向信息互补" : "教学示意 · 小目标与背景干扰"
      })]
    });
  }
  var vi = React;
  var V = jsxRuntime,
    Ee = 48,
    Nm = 64,
    Mm = 0,
    nc = {
      ours: {
        name: "本文（表 1）",
        strides: [1, 2, 4]
      },
      regular: {
        name: "常规 ResNet",
        strides: [4, 8, 16]
      }
    },
    sv = ["Stage-1", "Stage-2", "Stage-3"];
  function Am(t, e) {
    let a = Math.ceil(z / e),
      l = Math.ceil(L / e),
      n = new Float32Array(a * l);
    for (let i = 0; i < l; i++) for (let u = 0; u < a; u++) {
      let c = 0,
        o = 0;
      for (let f = i * e; f < Math.min(L, (i + 1) * e); f++) for (let s = u * e; s < Math.min(z, (u + 1) * e); s++) c += t[f * z + s], o++;
      n[i * a + u] = c / o;
    }
    return {
      g: n,
      gw: a,
      gh: l
    };
  }
  function zm(t, e, a) {
    let l = 0;
    for (let n = -1; n <= 1; n++) for (let i = -1; i <= 1; i++) (i || n) && (l += t.g[(a + n) * t.gw + e + i]);
    return t.g[a * t.gw + e] - l / 8;
  }
  function Tm(t) {
    let [e, a] = (0, vi.useState)("ours"),
      [l, n] = (0, vi.useState)(2),
      i = nc[e].strides[l],
      u = (0, vi.useMemo)(() => {
        let f = Am(Ga(Vt), i),
          s = Am(Ga(null), i),
          m = Math.floor(Vt.x / i),
          p = Math.floor(Vt.y / i),
          h = zm(f, m, p),
          b = [];
        for (let d = 1; d < s.gh - 1; d++) for (let r = 1; r < s.gw - 1; r++) (d + 1) * i <= te - 3 && b.push(Math.abs(zm(s, r, d)));
        b.sort((d, r) => d - r);
        let y = b[Math.min(b.length - 1, Math.floor(.95 * (b.length - 1)))],
          M = new Float32Array(Ee * Ee);
        for (let d = 0; d < Ee; d++) for (let r = 0; r < Ee; r++) M[d * Ee + r] = f.g[Math.floor((Mm + d) / i) * f.gw + Math.floor((Nm + r) / i)];
        return {
          view: M,
          ct: h,
          p95: y,
          ratio: h / y,
          cx: m * i - Nm,
          cy: p * i - Mm
        };
      }, [i]),
      c = [];
    if (i >= 2) for (let f = i; f < Ee; f += i) c.push((0, V.jsx)("path", {
      d: `M${f} 0 V${Ee} M0 ${f} H${Ee}`
    }, f));
    let o = u.ratio >= 1.2;
    return (0, V.jsxs)("div", {
      className: "ac-page ac-down-page",
      children: [(0, V.jsxs)("div", {
        className: "ac-view ac-down-view",
        children: [(0, V.jsx)(Lt, {
          data: u.view,
          w: Ee,
          h: Ee,
          palette: "ir",
          vmin: .12,
          vmax: .62,
          label: `\u76EE\u6807\u5468\u56F4 48\xD748 \u50CF\u7D20\u6309\u6B65\u957F ${i} \u5E73\u5747\u6C60\u5316\u540E\u7684\u6837\u5B50`
        }), (0, V.jsxs)("svg", {
          viewBox: `0 0 ${Ee} ${Ee}`,
          "aria-hidden": "true",
          children: [(0, V.jsx)("g", {
            stroke: "#9fd3c7",
            strokeWidth: .12,
            opacity: .55,
            children: c
          }), (0, V.jsx)("rect", {
            x: u.cx,
            y: u.cy,
            width: i,
            height: i,
            fill: "none",
            stroke: S.orange,
            strokeWidth: i === 1 ? .25 : .4
          })]
        })]
      }), (0, V.jsxs)("div", {
        className: "ac-side",
        children: [(0, V.jsx)("div", {
          className: "ac-chips",
          role: "group",
          "aria-label": "下采样方案",
          children: Object.keys(nc).map(f => (0, V.jsx)("button", {
            className: `ac-chip ${e === f ? f === "ours" ? "is-on is-new" : "is-on is-old" : ""}`,
            "aria-pressed": e === f,
            onClick: () => a(f),
            children: nc[f].name
          }, f))
        }), (0, V.jsx)("div", {
          className: "ac-stages",
          role: "group",
          "aria-label": "选择网络阶段",
          children: sv.map((f, s) => {
            let m = nc[e].strides[s];
            return (0, V.jsxs)("button", {
              className: `ac-stage ${l === s ? "is-on" : ""}`,
              "aria-pressed": l === s,
              onClick: () => n(s),
              children: [(0, V.jsx)("span", {
                children: f
              }), (0, V.jsxs)("b", {
                children: [480 / m, " × ", 480 / m]
              }), (0, V.jsxs)("span", {
                className: "ac-muted",
                children: ["步长 ", m]
              })]
            }, f);
          })
        }), (0, V.jsxs)("div", {
          className: "ac-kv ac-text",
          children: [(0, V.jsxs)("div", {
            children: [(0, V.jsx)("span", {
              children: "理想同格：3×3 面积 / 格子面积"
            }), (0, V.jsxs)("b", {
              children: [Math.min(100, 900 / (i * i)).toFixed(i >= 8 ? 1 : 0), "%"]
            })]
          }), (0, V.jsxs)("div", {
            children: [(0, V.jsx)("span", {
              children: "目标格比周围 8 格亮"
            }), (0, V.jsxs)("b", {
              children: ["+", u.ct.toFixed(3)]
            })]
          }), (0, V.jsxs)("div", {
            children: [(0, V.jsx)("span", {
              children: "天空背景的局部起伏（95%）"
            }), (0, V.jsx)("b", {
              children: u.p95.toFixed(3)
            })]
          }), (0, V.jsxs)("div", {
            children: [(0, V.jsx)("span", {
              children: "二者之比"
            }), (0, V.jsx)("b", {
              className: o ? "is-good" : "is-bad",
              children: u.ratio.toFixed(2)
            })]
          })]
        }), (0, V.jsx)("div", {
          className: "ac-panel ac-text",
          children: (0, V.jsxs)("p", {
            className: "ac-tight",
            children: ["表 2，b = 4，U-Net 宿主：IoU ", (0, V.jsx)("b", {
              className: "is-good",
              children: "0.743"
            }), " 对 ", (0, V.jsx)("b", {
              className: "is-bad",
              children: "0.692"
            }), "，nIoU ", (0, V.jsx)("b", {
              className: "is-good",
              children: "0.731"
            }), " 对 ", (0, V.jsx)("b", {
              className: "is-bad",
              children: "0.643"
            }), "（本文方案对常规方案）。"]
          })
        }), (0, V.jsx)("div", {
          className: `ac-feedback ${o ? "is-good" : "is-bad"}`,
          "aria-live": "polite",
          children: o ? `\u6B65\u957F ${i}\uFF1A\u76EE\u6807\u5728\u8FD9\u4E00\u5C42\u4ECD\u660E\u663E\u9AD8\u4E8E\u80CC\u666F\u8D77\u4F0F\uFF0C\u540E\u9762\u7684\u5C42\u8FD8\u201C\u770B\u5F97\u89C1\u201D\u5B83\u3002` : `\u6B65\u957F ${i}\uFF1A\u76EE\u6807\u88AB\u5E73\u5747\u8FDB ${i}\xD7${i} \u7684\u683C\u5B50\u91CC\uFF0C\u5C40\u90E8\u5BF9\u6BD4\u5DF2\u7ECF\u6DF9\u6CA1\u5728\u80CC\u666F\u8D77\u4F0F\u91CC\u2014\u2014\u6DF1\u5C42\u51E0\u4E4E\u770B\u4E0D\u89C1\u5B83\u3002`
        })]
      })]
    });
  }
  var Cm = React;
  var _ = jsxRuntime,
    rv = [{
      k: "融合一步",
      fpn: "上采样 + 1×1 横向，相加后 3×3",
      acm: "G(Y)⊗X + L(X)⊗Y"
    }, {
      k: "信息方向",
      fpn: "高层语义向下融合；骨干仍自底向上",
      acm: "自顶向下 + 自底向上"
    }, {
      k: "注意力尺度",
      fpn: "无",
      acm: "全局（向下）/ 逐点（向上）"
    }, {
      k: "在哪里预测",
      fpn: "原论文 RPN：P2–P6 提议框",
      acm: "只在最细一层预测"
    }, {
      k: "最深一层步长",
      fpn: "32（P6 为 64）",
      acm: "4（输入 480 → 120）"
    }, {
      k: "骨干",
      fpn: "ResNet-50/101，ImageNet 预训练",
      acm: "ResNet-20 式，从头训练"
    }];
  function Em({
    x: t,
    y: e,
    w: a,
    label: l,
    fill: n,
    stroke: i = "#8a9bb2"
  }) {
    let u = a * .3;
    return (0, _.jsxs)("g", {
      children: [(0, _.jsx)("path", {
        d: `M${t - a / 2} ${e} l${u} ${-u} h${a - u} l${-u} ${u} Z`,
        fill: n,
        stroke: i,
        strokeWidth: 1.5
      }), (0, _.jsx)("text", {
        x: t,
        y: e - u / 2 + 9,
        textAnchor: "middle",
        fontSize: 24,
        fontWeight: 700,
        fill: n === "#27446e" || n === "#43689c" ? "#ffffff" : S.ink,
        children: l
      })]
    });
  }
  function Um(t) {
    let [e, a] = (0, Cm.useState)("acm"),
      l = e === "fpn",
      n = l ? ["C2", "C3", "C4", "C5"] : ["S1", "S2", "S3"],
      i = l ? ["P2", "P3", "P4", "P5"] : ["Z1", "Z2", "S3"],
      u = l ? [470, 360, 255, 160] : [460, 330, 205],
      c = l ? [200, 160, 125, 95] : [200, 170, 140],
      o = ["#dfe7f2", "#b7c8de", "#43689c", "#27446e"];
    return (0, _.jsxs)("div", {
      className: "ac-page ac-fpn-page",
      children: [(0, _.jsx)("div", {
        className: "ac-light ac-fpn-diagram",
        children: (0, _.jsxs)("svg", {
          viewBox: "0 0 760 560",
          className: "ac-svg",
          role: "img",
          "aria-label": l ? "FPN：自顶向下 + 横向相加，每层预测" : "ACM-FPN：双向调制融合，只在最细层预测",
          children: [(0, _.jsxs)("defs", {
            children: [(0, _.jsx)("marker", {
              id: "ac-f-a",
              viewBox: "0 0 10 10",
              refX: "9",
              refY: "5",
              markerWidth: "6",
              markerHeight: "6",
              orient: "auto",
              children: (0, _.jsx)("path", {
                d: "M0 0L10 5L0 10z",
                fill: "#8a9bb2"
              })
            }), (0, _.jsx)("marker", {
              id: "ac-f-g",
              viewBox: "0 0 10 10",
              refX: "9",
              refY: "5",
              markerWidth: "6",
              markerHeight: "6",
              orient: "auto",
              children: (0, _.jsx)("path", {
                d: "M0 0L10 5L0 10z",
                fill: S.green
              })
            }), (0, _.jsx)("marker", {
              id: "ac-f-p",
              viewBox: "0 0 10 10",
              refX: "9",
              refY: "5",
              markerWidth: "6",
              markerHeight: "6",
              orient: "auto",
              children: (0, _.jsx)("path", {
                d: "M0 0L10 5L0 10z",
                fill: S.purple
              })
            }), (0, _.jsx)("marker", {
              id: "ac-f-o",
              viewBox: "0 0 10 10",
              refX: "9",
              refY: "5",
              markerWidth: "6",
              markerHeight: "6",
              orient: "auto",
              children: (0, _.jsx)("path", {
                d: "M0 0L10 5L0 10z",
                fill: S.orange
              })
            })]
          }), (0, _.jsx)("text", {
            x: 150,
            y: 44,
            textAnchor: "middle",
            fontSize: 26,
            fontWeight: 700,
            fill: S.ink,
            children: "自底向上"
          }), (0, _.jsx)("text", {
            x: 470,
            y: 44,
            textAnchor: "middle",
            fontSize: 26,
            fontWeight: 700,
            fill: S.ink,
            children: l ? "自顶向下" : "双向调制"
          }), n.map((f, s) => (0, _.jsxs)("g", {
            children: [(0, _.jsx)(Em, {
              x: 150,
              y: u[s],
              w: c[s],
              label: f,
              fill: o[l ? s : s + 1]
            }), s < n.length - 1 && (0, _.jsx)("line", {
              x1: 150,
              y1: u[s] - c[s] * .3 - 4,
              x2: 150,
              y2: u[s + 1] + 4,
              stroke: "#8a9bb2",
              strokeWidth: 2.5,
              markerEnd: "url(#ac-f-a)"
            }), (l || s < n.length - 1) && (0, _.jsx)("line", {
              x1: 150 + c[s] / 2 + 6,
              y1: u[s] - c[s] * .15,
              x2: 470 - c[s] / 2 - 10,
              y2: u[s] - c[s] * .15,
              stroke: l ? "#8a9bb2" : S.green,
              strokeWidth: 2.5,
              strokeDasharray: l ? void 0 : "8 6",
              markerEnd: l ? "url(#ac-f-a)" : "url(#ac-f-g)"
            }), !l && s < n.length - 1 && (() => {
              let m = u[s] - c[s] * .15,
                h = ((s === n.length - 2 ? u[s + 1] - c[s + 1] * .15 : u[s + 1]) + u[s] - c[s] * .3) / 2;
              return (0, _.jsx)("path", {
                d: `M${150 + c[s] / 2 + 70} ${m} Q 420 ${m - 6} 462 ${h}`,
                fill: "none",
                stroke: S.purple,
                strokeWidth: 3,
                markerEnd: "url(#ac-f-p)"
              });
            })()]
          }, f)), i.map((f, s) => (0, _.jsxs)("g", {
            children: [(l || s < i.length - 1) && (0, _.jsx)(Em, {
              x: 470,
              y: u[s],
              w: c[s],
              label: f,
              fill: l ? "#27446e" : "#e9f5ee",
              stroke: l ? "#ffffff" : S.green
            }), s < i.length - 1 && (0, _.jsx)("line", {
              x1: 470,
              y1: !l && s === i.length - 2 ? u[s + 1] - c[s + 1] * .15 : u[s + 1] + 4,
              x2: 470,
              y2: u[s] - c[s] * .3 - 4,
              stroke: S.blue,
              strokeWidth: 3,
              markerEnd: "url(#ac-f-a)"
            }), (l || s === 0) && (0, _.jsx)("line", {
              x1: 470 + c[s] / 2 + 6,
              y1: u[s] - c[s] * .15,
              x2: 470 + c[s] / 2 + 70,
              y2: u[s] - c[s] * .15,
              stroke: S.orange,
              strokeWidth: 4,
              markerEnd: "url(#ac-f-o)"
            }), (l || s === 0) && (0, _.jsx)("text", {
              x: 470 + c[s] / 2 + 78,
              y: u[s] - c[s] * .15 + 9,
              fontSize: 24,
              fontWeight: 700,
              fill: S.orange,
              children: "预测"
            })]
          }, f)), !l && (0, _.jsx)("line", {
            x1: 150 + c[2] / 2 + 6,
            y1: u[2] - c[2] * .15,
            x2: 470,
            y2: u[2] - c[2] * .15,
            stroke: S.blue,
            strokeWidth: 3
          }), !l && (0, _.jsxs)("text", {
            x: 330,
            y: u[0] + 46,
            textAnchor: "middle",
            fontSize: 24,
            children: [(0, _.jsx)("tspan", {
              fill: S.green,
              children: "绿虚线：X 横向送入"
            }), (0, _.jsx)("tspan", {
              fill: S.purple,
              children: "；紫：L(X) 调制上面传下来的 Y"
            })]
          }), (0, _.jsx)("g", {
            transform: "translate(640 20) scale(0.9)",
            children: (0, _.jsx)(Te, {
              glow: !l
            })
          })]
        })
      }), (0, _.jsxs)("div", {
        className: "ac-side",
        children: [(0, _.jsxs)("div", {
          className: "ac-chips",
          role: "group",
          "aria-label": "选择结构",
          children: [(0, _.jsx)("button", {
            className: `ac-chip ${l ? "is-on" : ""}`,
            "aria-pressed": l,
            onClick: () => a("fpn"),
            children: "FPN（原论文 RPN）"
          }), (0, _.jsx)("button", {
            className: `ac-chip ${l ? "" : "is-on is-new"}`,
            "aria-pressed": !l,
            onClick: () => a("acm"),
            children: "ACM-FPN（红外小目标）"
          })]
        }), (0, _.jsx)("table", {
          className: "ac-table ac-compare",
          children: (0, _.jsx)("tbody", {
            children: rv.map(f => (0, _.jsxs)("tr", {
              children: [(0, _.jsx)("td", {
                children: f.k
              }), (0, _.jsx)("td", {
                children: l ? f.fpn : f.k === "融合一步" ? (0, _.jsxs)(_.Fragment, {
                  children: ["G(Y) ", (0, _.jsx)(Le, {}), " X + L(X) ", (0, _.jsx)(Le, {}), " Y"]
                }) : f.acm
              })]
            }, f.k))
          })
        }), (0, _.jsx)("div", {
          className: "ac-feedback",
          "aria-live": "polite",
          children: l ? "此处比较原始 FPN 的 RPN 实例：多层特征用于候选框预测。骨干仍自底向上，图中“向下”指高层语义融合路径。" : "本文 ACM-FPN 在最细层输出像素级预测。这里只比较结构选择；论文没有单独证明所有红外小目标任务都不需要多尺度输出。"
        })]
      })]
    });
  }
  var ic = React;
  var q = jsxRuntime,
    pe = 120,
    Om = [[18, 92], [44, 104], [70, 98], [96, 110], [104, 88]],
    is = 78,
    us = 38;
  function wm(t) {
    let e = new Float32Array(pe * pe);
    for (let l = 0; l < pe; l++) for (let n = 0; n < pe; n++) e[l * pe + n] = .16 + .08 * ol(Math.floor(n / 3), Math.floor(l / 3), 5) + (l > 80 ? .04 : 0);
    for (let [l, n] of Om) for (let i = n; i < n + 2; i++) for (let u = l; u < l + 2; u++) e[i * pe + u] = 1.2;
    let a = Math.floor(t / 2);
    for (let l = us - a; l < us - a + t; l++) for (let n = is - a; n < is - a + t; n++) e[l * pe + n] = 1;
    return e;
  }
  var Dm = t => t.reduce((e, a) => e + a, 0) / t.length,
    Rm = t => on(6 * (t - .2));
  function _m(t) {
    let [e, a] = (0, ic.useState)(3),
      l = (0, ic.useMemo)(() => {
        let c = wm(e),
          o = wm(0),
          f = Dm(c),
          s = Dm(o);
        return {
          A: c,
          y: f,
          y0: s,
          g: Rm(f),
          g0: Rm(s)
        };
      }, [e]),
      n = e * e / (pe * pe) * 100,
      i = Math.floor(e / 2),
      u = 1 / 1.2;
    return (0, q.jsxs)("div", {
      className: "ac-page ac-gap-page",
      children: [(0, q.jsxs)("div", {
        className: "ac-light ac-gap-view",
        children: [(0, q.jsx)(Lt, {
          data: l.A,
          w: pe,
          h: pe,
          palette: "feat",
          vmin: 0,
          vmax: 1.2,
          label: `Stage-3 \u7279\u5F81\u56FE\uFF08120\xD7120\uFF0C\u793A\u610F\uFF09\uFF0C\u76EE\u6807\u5360 ${e}\xD7${e} \u4E2A\u4F4D\u7F6E`
        }), (0, q.jsxs)("svg", {
          viewBox: `0 0 ${pe} ${pe}`,
          "aria-hidden": "true",
          children: [(0, q.jsx)("rect", {
            x: is - i - 1.5,
            y: us - i - 1.5,
            width: e + 3,
            height: e + 3,
            fill: "none",
            stroke: S.orange,
            strokeWidth: .7
          }), Om.map(([c, o], f) => (0, q.jsx)("rect", {
            x: c - 1.2,
            y: o - 1.2,
            width: 4.4,
            height: 4.4,
            fill: "none",
            stroke: S.red,
            strokeWidth: .5
          }, f))]
        })]
      }), (0, q.jsxs)("div", {
        className: "ac-side",
        children: [(0, q.jsxs)("div", {
          className: "ac-formula ac-em",
          children: [(0, q.jsx)(xt, {
            meaning: "X′：被调制后的低层特征。",
            children: "X′"
          }), " = ", (0, q.jsx)(xt, {
            meaning: "G(Y)：由高层特征 Y 算出的全局通道注意力，形状 C×1×1，每个通道一个数。",
            children: "G(Y)"
          }), " ", (0, q.jsx)(Le, {}), " ", (0, q.jsx)(xt, {
            meaning: "X：低层特征，C×H×W；圆圈乘号表示逐元素相乘（按通道广播到每个位置）。",
            children: "X"
          }), "，", (0, q.jsx)(xt, {
            meaning: "y：对 Y 做全局平均池化得到的 C 维向量，y = 1/(H×W) · Σ Y[:, i, j]。",
            children: "y"
          }), " = ", (0, q.jsx)(xt, {
            meaning: "全局平均池化：把一个通道的 H×W 个值取平均。",
            children: "GAP"
          }), "(Y)"]
        }), (0, q.jsxs)("label", {
          className: "ac-row",
          children: [(0, q.jsx)("span", {
            className: "ac-label",
            children: "目标占"
          }), (0, q.jsx)("input", {
            className: "ac-range",
            type: "range",
            min: 1,
            max: 24,
            step: 1,
            value: e,
            onChange: c => a(Number(c.target.value)),
            "aria-label": "目标在 Stage-3 上占的边长（位置数）"
          }), (0, q.jsxs)("b", {
            children: [e, "×", e]
          })]
        }), (0, q.jsxs)("div", {
          className: "ac-kv ac-text",
          children: [(0, q.jsxs)("div", {
            children: [(0, q.jsx)("span", {
              children: "目标在 120×120 中的占比"
            }), (0, q.jsxs)("b", {
              children: [n < .1 ? n.toFixed(3) : n.toFixed(2), "%"]
            })]
          }), (0, q.jsxs)("div", {
            children: [(0, q.jsx)("span", {
              children: "该通道的 y（无目标 → 有目标）"
            }), (0, q.jsxs)("b", {
              children: [l.y0.toFixed(4), " → ", l.y.toFixed(4)]
            })]
          }), (0, q.jsxs)("div", {
            children: [(0, q.jsx)("span", {
              children: "G 给这个通道的权重"
            }), (0, q.jsxs)("b", {
              children: [l.g0.toFixed(4), " → ", l.g.toFixed(4)]
            })]
          }), (0, q.jsxs)("div", {
            children: [(0, q.jsx)("span", {
              children: "调制后 目标 ÷ 海面亮斑"
            }), (0, q.jsxs)("b", {
              children: [u.toFixed(3), " → ", (l.g * 1 / (l.g * 1.2)).toFixed(3)]
            })]
          })]
        }), (0, q.jsxs)("div", {
          className: "ac-gap-note",
          children: [(0, q.jsx)("svg", {
            viewBox: "0 0 80 80",
            className: "ac-icon",
            "aria-hidden": "true",
            children: (0, q.jsx)(Te, {
              s: 1
            })
          }), (0, q.jsx)("p", {
            className: "ac-text ac-tight",
            children: "G(Y) 为 C×1×1：同一通道的权重在各位置共享，因此门控本身不提供位置差异。原特征仍可保留空间信息，不能据此断言全局通道注意力无法定位。"
          })]
        }), (0, q.jsx)("div", {
          className: `ac-feedback ${e <= 3 ? "is-bad" : ""}`,
          "aria-live": "polite",
          children: e <= 3 ? `3\xD73 \u4EE5\u5185\u7684\u76EE\u6807\u53EA\u5360 ${n.toFixed(3)}%\uFF1A\u6709\u6CA1\u6709\u5B83\uFF0C\u5168\u5C40\u5E73\u5747\u51E0\u4E4E\u4E0D\u53D8\u2014\u2014\u8FD9\u5C31\u662F\u8BBA\u6587\u8BF4\u7684\u201C\u7279\u5F81\u5728\u5168\u5C40\u5E73\u5747\u6C60\u5316\u4E2D\u88AB\u524A\u5F31\u201D\u3002` : `\u76EE\u6807\u5360\u5230 ${n.toFixed(2)}% \u65F6 y \u624D\u5F00\u59CB\u660E\u663E\u53D8\u5316\uFF1B\u7EA2\u5916\u5C0F\u76EE\u6807\u901A\u5E38\u8FDC\u5C0F\u4E8E\u8FD9\u4E2A\u5C3A\u5EA6\u3002`
        })]
      })]
    });
  }
  var uc = React;
  var U = jsxRuntime,
    Hm = {
      fpn: {
        acm: {
          iou: [.645, .7, .714, .731],
          niou: [.684, .702, .713, .721]
        },
        reg: {
          iou: [.683, .703, .711, .711],
          niou: [.661, .671, .68, .675]
        }
      },
      unet: {
        acm: {
          iou: [.707, .732, .741, .743],
          niou: [.709, .72, .726, .731]
        },
        reg: {
          iou: [.684, .7, .692, .692],
          niou: [.637, .65, .646, .643]
        }
      }
    };
  function bi({
    x: t,
    y: e,
    w: a,
    h: l,
    title: n,
    sub: i,
    fill: u,
    stroke: c = "#9fb0c8",
    bold: o
  }) {
    return (0, U.jsxs)("g", {
      children: [(0, U.jsx)("rect", {
        x: t,
        y: e,
        width: a,
        height: l,
        rx: 12,
        fill: u,
        stroke: c,
        strokeWidth: o ? 3 : 1.5
      }), (0, U.jsx)("text", {
        x: t + a / 2,
        y: e + (i ? l / 2 - 4 : l / 2 + 9),
        textAnchor: "middle",
        fontSize: 26,
        fontWeight: 700,
        fill: S.ink,
        children: n
      }), i && (0, U.jsx)("text", {
        x: t + a / 2,
        y: e + l / 2 + 26,
        textAnchor: "middle",
        fontSize: 24,
        fill: S.muted,
        children: i
      })]
    });
  }
  function Bm(t) {
    let [e, a] = (0, uc.useState)("fpn"),
      [l, n] = (0, uc.useState)(3),
      [i, u] = (0, uc.useState)("ours"),
      c = i === "ours" ? [480, 480, 240, 120] : [120, 120, 60, 30],
      o = [16, 16, 32, 64],
      f = [20, 230, 440, 650],
      s = ["Conv-1", "Stage-1", "Stage-2", "Stage-3"],
      m = "#e9f5ee",
      p = Hm[e][i === "ours" ? "acm" : "reg"],
      h = Hm[e][i === "ours" ? "reg" : "acm"];
    return (0, U.jsxs)("div", {
      className: "ac-page ac-hosts-page",
      children: [(0, U.jsx)("div", {
        className: "ac-light ac-hosts-diagram",
        children: (0, U.jsxs)("svg", {
          viewBox: "0 0 880 560",
          className: "ac-svg",
          role: "img",
          "aria-label": `${e === "fpn" ? "ACM-FPN" : "ACM-U-Net"} \u7ED3\u6784\u793A\u610F`,
          children: [(0, U.jsx)("defs", {
            children: (0, U.jsx)("marker", {
              id: "ac-h-arrow",
              viewBox: "0 0 10 10",
              refX: "9",
              refY: "5",
              markerWidth: "6",
              markerHeight: "6",
              orient: "auto",
              children: (0, U.jsx)("path", {
                d: "M0 0L10 5L0 10z",
                fill: "#8a9bb2"
              })
            })
          }), s.map((b, y) => (0, U.jsxs)("g", {
            children: [(0, U.jsx)(bi, {
              x: f[y],
              y: 40,
              w: 180,
              h: 110,
              title: b,
              sub: `${c[y]}\xB2 \xB7 ${o[y]}`,
              fill: y === 0 ? "#eef2f7" : "#e9eff8",
              stroke: y >= 2 && i === "regular" ? S.red : "#9fb0c8",
              bold: y >= 2 && i === "regular"
            }), y > 0 && (0, U.jsxs)("text", {
              x: f[y] + 130,
              y: 180,
              textAnchor: "middle",
              fontSize: 24,
              fill: S.muted,
              children: ["× ", l]
            }), y < 3 && (0, U.jsx)("line", {
              x1: f[y] + 182,
              y1: 95,
              x2: f[y + 1] - 4,
              y2: 95,
              stroke: "#8a9bb2",
              strokeWidth: 2.5,
              markerEnd: "url(#ac-h-arrow)"
            })]
          }, b)), (0, U.jsx)("path", {
            d: "M740 152 V300 H624",
            fill: "none",
            stroke: S.blue,
            strokeWidth: 3,
            markerEnd: "url(#ac-h-arrow)"
          }), (0, U.jsx)("text", {
            x: 732,
            y: 238,
            textAnchor: "end",
            fontSize: 24,
            fill: S.blue,
            children: e === "fpn" ? "双线性上采样" : "转置卷积 ×2"
          }), (0, U.jsx)(bi, {
            x: 440,
            y: 260,
            w: 180,
            h: 80,
            title: "ACM",
            fill: m,
            stroke: S.green,
            bold: !0
          }), (0, U.jsx)("line", {
            x1: 480,
            y1: 152,
            x2: 480,
            y2: 256,
            stroke: S.green,
            strokeWidth: 2.5,
            strokeDasharray: "7 5",
            markerEnd: "url(#ac-h-arrow)"
          }), e === "unet" && (0, U.jsx)(bi, {
            x: 440,
            y: 380,
            w: 180,
            h: 80,
            title: "UpStage-2",
            fill: "#e9eff8"
          }), e === "unet" && (0, U.jsx)("line", {
            x1: 530,
            y1: 342,
            x2: 530,
            y2: 376,
            stroke: "#8a9bb2",
            strokeWidth: 2.5,
            markerEnd: "url(#ac-h-arrow)"
          }), (0, U.jsx)("path", {
            d: e === "unet" ? "M438 420 H395 V300 H354" : "M438 300 H354",
            fill: "none",
            stroke: S.blue,
            strokeWidth: 3,
            markerEnd: "url(#ac-h-arrow)"
          }), (0, U.jsx)(bi, {
            x: 170,
            y: 260,
            w: 180,
            h: 80,
            title: "ACM",
            fill: m,
            stroke: S.green,
            bold: !0
          }), (0, U.jsx)("line", {
            x1: 270,
            y1: 152,
            x2: 270,
            y2: 256,
            stroke: S.green,
            strokeWidth: 2.5,
            strokeDasharray: "7 5",
            markerEnd: "url(#ac-h-arrow)"
          }), e === "unet" && (0, U.jsx)(bi, {
            x: 170,
            y: 380,
            w: 180,
            h: 80,
            title: "UpStage-1",
            fill: "#e9eff8"
          }), e === "unet" && (0, U.jsx)("line", {
            x1: 260,
            y1: 342,
            x2: 260,
            y2: 376,
            stroke: "#8a9bb2",
            strokeWidth: 2.5,
            markerEnd: "url(#ac-h-arrow)"
          }), (0, U.jsx)("path", {
            d: e === "unet" ? "M168 420 H80 V490" : "M168 300 H80 V490",
            fill: "none",
            stroke: S.blue,
            strokeWidth: 3,
            markerEnd: "url(#ac-h-arrow)"
          }), (0, U.jsx)("rect", {
            x: 20,
            y: 494,
            width: 260,
            height: 52,
            rx: 12,
            fill: "#fff3ea",
            stroke: S.orange,
            strokeWidth: 2
          }), (0, U.jsxs)("text", {
            x: 150,
            y: 529,
            textAnchor: "middle",
            fontSize: 26,
            fontWeight: 700,
            fill: S.ink,
            children: ["预测 ", i === "ours" ? "480²" : "上采样回 480²"]
          }), (0, U.jsx)("text", {
            x: 310,
            y: 529,
            fontSize: 24,
            fill: S.muted,
            children: "绿色虚线：送入 ACM 的低层特征 X"
          }), (0, U.jsx)("g", {
            transform: "translate(790 230) scale(0.85)",
            children: (0, U.jsx)(Te, {
              glow: !0
            })
          })]
        })
      }), (0, U.jsxs)("div", {
        className: "ac-side",
        children: [(0, U.jsxs)("div", {
          className: "ac-chips",
          role: "group",
          "aria-label": "宿主网络",
          children: [(0, U.jsx)("button", {
            className: `ac-chip ${e === "fpn" ? "is-on" : ""}`,
            "aria-pressed": e === "fpn",
            onClick: () => a("fpn"),
            children: "ACM-FPN"
          }), (0, U.jsx)("button", {
            className: `ac-chip ${e === "unet" ? "is-on" : ""}`,
            "aria-pressed": e === "unet",
            onClick: () => a("unet"),
            children: "ACM-U-Net"
          })]
        }), (0, U.jsxs)("div", {
          className: "ac-chips",
          role: "group",
          "aria-label": "下采样方案",
          children: [(0, U.jsx)("button", {
            className: `ac-chip ${i === "ours" ? "is-on is-new" : ""}`,
            "aria-pressed": i === "ours",
            onClick: () => u("ours"),
            children: "本文下采样"
          }), (0, U.jsx)("button", {
            className: `ac-chip ${i === "regular" ? "is-on is-old" : ""}`,
            "aria-pressed": i === "regular",
            onClick: () => u("regular"),
            children: "常规（多 4 倍）"
          })]
        }), (0, U.jsxs)("label", {
          className: "ac-row",
          children: [(0, U.jsx)("span", {
            className: "ac-label",
            children: "每阶段块数 b"
          }), (0, U.jsx)("input", {
            className: "ac-range",
            type: "range",
            min: 1,
            max: 4,
            step: 1,
            value: l,
            onChange: b => n(Number(b.target.value)),
            "aria-label": "每个阶段的残差块数 b"
          }), (0, U.jsx)("b", {
            children: l
          })]
        }), (0, U.jsxs)("div", {
          className: "ac-kv ac-text",
          children: [(0, U.jsxs)("div", {
            children: [(0, U.jsx)("span", {
              children: "骨干卷积层（1 + 6b）"
            }), (0, U.jsxs)("b", {
              children: [1 + 6 * l, l === 3 ? " · ResNet-20 风格骨干" : ""]
            })]
          }), (0, U.jsxs)("div", {
            children: [(0, U.jsx)("span", {
              children: "被 ACM 替换的融合"
            }), (0, U.jsxs)("b", {
              children: [e === "fpn" ? "相加" : "拼接", " × 2 处"]
            })]
          }), (0, U.jsxs)("div", {
            children: [(0, U.jsx)("span", {
              children: "Stage-3 输出"
            }), (0, U.jsxs)("b", {
              className: i === "ours" ? "is-good" : "is-bad",
              children: [c[3], " × ", c[3]]
            })]
          })]
        }), (0, U.jsxs)("div", {
          className: "ac-panel ac-text",
          children: [(0, U.jsxs)("div", {
            children: ["表 2，b = ", l, "：", i === "ours" ? "ACM" : "Regular-ACM", " 的 IoU ", (0, U.jsx)("b", {
              children: p.iou[l - 1].toFixed(3)
            }), "、nIoU ", (0, U.jsx)("b", {
              children: p.niou[l - 1].toFixed(3)
            })]
          }), (0, U.jsxs)("div", {
            className: "ac-muted",
            children: ["另一种下采样：IoU ", h.iou[l - 1].toFixed(3), "、nIoU ", h.niou[l - 1].toFixed(3)]
          })]
        }), (0, U.jsx)("div", {
          className: `ac-feedback ${p.niou[l - 1] >= h.niou[l - 1] ? "is-good" : "is-bad"}`,
          "aria-live": "polite",
          children: i === "ours" ? `\u53EA\u5728 Stage-2\u30013 \u4E0B\u91C7\u6837\uFF0C\u6700\u6DF1\u4E00\u5C42\u4ECD\u6709 120\xD7120\uFF1Bb = ${l} \u65F6 nIoU \u6BD4\u5E38\u89C4\u65B9\u6848\u9AD8 ${(p.niou[l - 1] - h.niou[l - 1]).toFixed(3)}\u3002` : `\u5E38\u89C4\u65B9\u6848\u591A\u4E0B\u91C7\u6837 4 \u500D\uFF0C\u6700\u6DF1\u4E00\u5C42\u53EA\u5269 30\xD730\uFF1B${e === "fpn" && l <= 2 ? `\u6CE8\u610F FPN \u5BBF\u4E3B\u5728 b = ${l} \u65F6 IoU \u53CD\u800C\u66F4\u9AD8\uFF08${p.iou[l - 1].toFixed(3)} \u5BF9 ${h.iou[l - 1].toFixed(3)}\uFF09\uFF0C\u4F46 nIoU \u4ECD\u66F4\u4F4E\u3002` : `b = ${l} \u65F6 nIoU \u4F4E ${(h.niou[l - 1] - p.niou[l - 1]).toFixed(3)}\u3002`}`
        })]
      })]
    });
  }
  var cs = React;
  var pt = jsxRuntime,
    yi = [
  {
    "title": "双向融合并非每格都更高",
    "a": {
      "k": "表 2 · FPN · IoU · b = 1 · BiLocal",
      "v": "0.591"
    },
    "b": {
      "k": "同条件 TopDownLocal",
      "v": "0.595"
    },
    "tag": "表 2 核对",
    "text": "BiLocal 在多数设置中更好，但此格低于 TopDownLocal。因此“总是优于”应收窄为多数已报告设置。"
  },
  {
    "title": "降低下采样也有条件",
    "a": {
      "k": "表 2 · FPN · IoU · b = 1 / 2 · Regular-ACM",
      "v": "0.683 / 0.703"
    },
    "b": {
      "k": "同条件 ACM",
      "v": "0.645 / 0.700"
    },
    "tag": "表 2 核对",
    "text": "较浅的两个 FPN 设置中，Regular-ACM 的 IoU 更高；同条件 nIoU 则是 ACM 更高。结论需要同时说明宿主、深度和指标。"
  },
  {
    "title": "很小的差距不等于稳定胜出",
    "a": {
      "k": "表 2 · U-Net · b = 4 · IoU · ACM",
      "v": "0.743"
    },
    "b": {
      "k": "同条件 BiLocal",
      "v": "0.742"
    },
    "tag": "证据边界",
    "text": "该格差距为 0.001。表 2 未给多次训练的均值、方差或置信区间，不能仅凭这一个数证明差距在重复实验中稳定。"
  },
  {
    "title": "数据集内优势与泛化是两件事",
    "a": {
      "k": "本文主要实验",
      "v": "SIRST"
    },
    "b": {
      "k": "迁移到新传感器或场景",
      "v": "需另行验证"
    },
    "tag": "证据边界",
    "text": "表 2、表 3 支持所用数据与训练设置下的比较，不自动证明所有红外传感器、气象条件或跨域任务都有相同增益。"
  },
  {
    "title": "比例与换算应分开核对",
    "a": {
      "k": "第 3.2 节 · 面积比例描述",
      "v": "约 0.02%"
    },
    "b": {
      "k": "300×300 × 0.02% 的算术值",
      "v": "18 像素"
    },
    "tag": "算术核对",
    "text": "原文同时举了 300×300 中 3×3 的例子，换算并不一致。本导读保留原文统计比例，不沿用该像素换算，也不据此推断统计本身失效。"
  },
  {
    "title": "教学交互不是模型复现",
    "a": {
      "k": "本页热图与门控",
      "v": "手工设定"
    },
    "b": {
      "k": "论文表 2 / 表 3",
      "v": "作者报告"
    },
    "tag": "来源边界",
    "text": "热图、通道、阈值和掩码是用于解释机制的合成示意；没有在浏览器里训练或运行 ACM 检测网络。交互演示的 IoU 不能当作论文实验结果。"
  }
];
  function Ym() {
    const [selected,setSelected] = React.useState(0);
    const [opened,setOpened] = React.useState([0]);
    const item=yi[selected];
    const choose=index=>{setSelected(index);setOpened(previous=>previous.includes(index)?previous:[...previous,index]);};
    return <div className="ac-page ac-limits-page">
      <div className="ac-evidence-list" role="group" aria-label="阅读核对清单">{yi.map((entry,index)=><button key={entry.title} className={selected===index?'ac-evidence-item is-selected':'ac-evidence-item'} aria-pressed={selected===index} onClick={()=>choose(index)}><span className="ac-evidence-number">{String(index+1).padStart(2,'0')}</span><span>{entry.title}</span><span className="ac-evidence-status">{opened.includes(index)?'已展开':'查看'}</span></button>)}</div>
      <div className="ac-side ac-limits-side"><div className="ac-h">{item.title}<br/><span className="ac-tag">{item.tag}</span></div><div className="ac-compare2">{[item.a,item.b].map((part,index)=><div key={index}><span className="ac-em">{part.v}</span><span className="ac-text ac-muted">{part.k}</span></div>)}</div><p className="ac-text ac-tight">{item.text}</p><div className="ac-feedback" aria-live="polite">已展开 {opened.length} / {yi.length} 项。对照原文判断证据能支持到哪一步。</div></div>
    </div>;
  }
  var Gm = React;
  var J = jsxRuntime,
    dv = [4, 6, 9, 9, 20, 150],
    rn = 18;
  function pv() {
    let t = [];
    for (let e = 0; e < rn; e++) for (let a = 0; a < rn; a++) t.push([a, e, (a - 8.5) ** 2 + (e - 8.5) ** 2 + .001 * (a * 7 + e)]);
    return t.sort((e, a) => e[2] - a[2]).map(([e, a]) => [e, a]);
  }
  var km = pv();
  function mv(t) {
    return dv.map(e => {
      let a = e < 10 ? {
          tp: 0,
          p: 0
        } : {
          tp: .92 * e,
          p: e
        },
        l = {
          tp: Math.min(e, 6),
          p: Math.min(e, 6) + 1
        },
        n = (1 - t) * a.tp + t * l.tp,
        i = (1 - t) * a.p + t * l.p;
      const tp = Math.round(n), predicted = Math.max(tp, Math.round(i));
      return { t: e, tp, p: predicted, iou: tp / (e + predicted - tp) };
    });
  }
  function Lm(t) {
    let [e, a] = (0, Gm.useState)(0),
      l = mv(e),
      n = l.reduce((f, s) => f + s.tp, 0),
      i = l.reduce((f, s) => f + s.t + s.p - s.tp, 0),
      u = n / i,
      c = l.reduce((f, s) => f + s.iou, 0) / l.length,
      o = `当前合成六图：IoU = ${u.toFixed(3)}，nIoU = ${c.toFixed(3)}。IoU 先累加像素，nIoU 先算每张图再平均；它们的大小关系不能单独证明某个真实模型如何处理小目标。`;
    return (0, J.jsxs)("div", {
      className: "ac-page ac-niou-page",
      children: [(0, J.jsx)("div", {
        className: "ac-nights",
        children: l.map((f, s) => {
          let m = Math.round(f.tp),
            p = Math.round(f.p - f.tp),
            h = km.slice(0, f.t),
            b = km.slice(f.t, f.t + p);
          return (0, J.jsxs)("figure", {
            className: "ac-night",
            children: [(0, J.jsxs)("svg", {
              viewBox: `0 0 ${rn} ${rn}`,
              className: "ac-night-grid",
              role: "img",
              "aria-label": `\u7B2C ${s + 1} \u665A\uFF1A\u76EE\u6807 ${f.t} \u50CF\u7D20\uFF0C\u547D\u4E2D ${m}\uFF0C\u865A\u8B66 ${p}`,
              children: [(0, J.jsx)("rect", {
                x: 0,
                y: 0,
                width: rn,
                height: rn,
                fill: "#0d1624"
              }), h.map(([y, M], d) => (0, J.jsx)("rect", {
                x: y + .06,
                y: M + .06,
                width: .88,
                height: .88,
                fill: d < m ? S.green : "#3a4a5f"
              }, `g${d}`)), b.map(([y, M], d) => (0, J.jsx)("rect", {
                x: y + .06,
                y: M + .06,
                width: .88,
                height: .88,
                fill: S.red
              }, `f${d}`))]
            }), (0, J.jsxs)("figcaption", {
              className: "ac-text",
              children: [(0, J.jsxs)("span", {
                children: [f.t, " 像素"]
              }), (0, J.jsx)("b", {
                className: f.iou > .5 ? "is-good" : "is-bad",
                children: f.iou.toFixed(2)
              })]
            })]
          }, s);
        })
      }), (0, J.jsxs)("div", {
        className: "ac-niou-bottom",
        children: [(0, J.jsxs)("div", {
          className: "ac-side",
          children: [(0, J.jsxs)("label", {
            className: "ac-row",
            children: [(0, J.jsx)("span", {
              className: "ac-label",
              children: "大目标优先"
            }), (0, J.jsx)("input", {
              className: "ac-range",
              type: "range",
              min: 0,
              max: 1,
              step: .05,
              value: e,
              onChange: f => a(Number(f.target.value)),
              "aria-label": "检测器风格：从“大目标优先”到“每个都找到”"
            }), (0, J.jsx)("span", {
              className: "ac-label",
              children: "每个都找到"
            })]
          }), (0, J.jsxs)("div", {
            className: "ac-formula ac-h",
            children: [(0, J.jsx)(xt, {
              meaning: "nIoU：先在每张图上算 IoU，再对 N 张图取平均（式 1）。",
              children: "nIoU"
            }), " = ", (0, J.jsx)(xt, {
              meaning: "N：测试图像数。",
              children: "1/N"
            }), " Σ ", (0, J.jsx)(xt, {
              meaning: "TP[i]：第 i 张图中预测正确的目标像素数。",
              children: "TP"
            }), " / (", (0, J.jsx)(xt, {
              meaning: "T[i]：第 i 张图的真值目标像素数。",
              children: "T"
            }), " + ", (0, J.jsx)(xt, {
              meaning: "P[i]：第 i 张图中预测为目标的像素数。",
              children: "P"
            }), " − TP)"]
          }), (0, J.jsxs)("div", {
            className: "ac-legend ac-text",
            children: [(0, J.jsx)("span", {
              style: {
                "--c": S.green
              },
              children: "命中"
            }), (0, J.jsx)("span", {
              style: {
                "--c": "#3a4a5f"
              },
              children: "漏掉的目标像素"
            }), (0, J.jsx)("span", {
              style: {
                "--c": S.red
              },
              children: "虚警"
            })]
          })]
        }), (0, J.jsxs)("div", {
          className: "ac-scores",
          children: [(0, J.jsxs)("div", {
            children: [(0, J.jsx)("span", {
              className: "ac-text ac-muted",
              children: "整体 IoU（像素累计）"
            }), (0, J.jsx)("b", {
              className: "ac-em",
              children: u.toFixed(2)
            })]
          }), (0, J.jsxs)("div", {
            children: [(0, J.jsx)("span", {
              className: "ac-text ac-muted",
              children: "nIoU（逐晚平均）"
            }), (0, J.jsx)("b", {
              className: "ac-em",
              children: c.toFixed(2)
            })]
          })]
        }), (0, J.jsx)("div", {
          className: "ac-feedback",
          "aria-live": "polite",
          children: o
        })]
      })]
    });
  }
  var dn = React;
  var w = jsxRuntime;
  function Xm(t) {
    let e = rl("acm", 4),
      a = (0, dn.useMemo)(() => {
        let d = 0,
          r = -1,
          g = 0,
          v = -1;
        for (let N = 2; N < L - 2; N++) for (let T = 2; T < z - 2; T++) {
          let A = N * z + T;
          N < te - 6 && e.X1[A] > r && Math.abs(T - 90) + Math.abs(N - 30) > 8 && (r = e.X1[A], d = A), N >= te - 5 && N <= te - 2 && T > 66 && T < 102 && e.X1[A] > v && (v = e.X1[A], g = A);
        }
        return [{
          id: "t",
          name: "目标",
          x: 90,
          y: 30
        }, {
          id: "g",
          name: "海面亮斑",
          x: 80,
          y: 61
        }, {
          id: "c",
          name: "云层亮边",
          x: d % z,
          y: Math.floor(d / z)
        }, {
          id: "k",
          name: "海岸线",
          x: g % z,
          y: Math.floor(g / z)
        }, {
          id: "s",
          name: "平静海面",
          x: 40,
          y: 76
        }];
      }, [e]),
      [l, n] = (0, dn.useState)({
        x: 90,
        y: 30
      }),
      i = (0, dn.useRef)(null),
      u = l.y * z + l.x,
      c = e.X0[u],
      o = e.X1[u],
      f = Math.max(0, Zt.hBlob * c + Zt.hEdge * o),
      s = e.L0[u],
      m = e.L1[u],
      p = d => {
        let r = Iu(i.current, d.clientX, d.clientY);
        r && n({
          x: zt(Math.floor(r.x), 0, z - 1),
          y: zt(Math.floor(r.y), 0, L - 1)
        });
      },
      h = a.find(d => d.x === l.x && d.y === l.y),
      b = (d, r) => `${Math.max(2, Math.min(1, d / r) * 100)}%`,
      y = e.Y0[u],
      M = s > .6 ? y > .3 ? `\u50CF\u5B64\u7ACB\u4EAE\u70B9\uFF0CL = ${s.toFixed(2)}\uFF1B\u9AD8\u5C42 Y \u5728\u8FD9\u91CC\u4E5F\u8BA4\u4E3A\u201C\u50CF\u76EE\u6807\u201D\uFF0C\u4E58\u79EF\u4FDD\u7559\u4E0B\u6765\u2014\u2014\u7EC6\u8282\u88AB\u5199\u8FDB\u4E86\u6DF1\u5C42\u7279\u5F81\u3002` : `\u4E5F\u50CF\u5B64\u7ACB\u4EAE\u70B9\uFF0CL = ${s.toFixed(2)}\uFF1B\u4F46\u9AD8\u5C42 Y \u5728\u8FD9\u91CC\u63A5\u8FD1 0\uFF08\u5224\u4E3A\u6742\u6CE2\uFF09\uFF0C\u4E58\u79EF\u4ECD\u7136\u5F88\u5C0F\u3002` : `\u8FD9\u91CC\u7684 L \u53EA\u6709 ${s.toFixed(2)}\uFF1A\u8FB9\u7F18\u6216\u5E73\u5766\u80CC\u666F\u4E0D\u4F1A\u88AB\u8FD9\u6761\u901A\u8DEF\u653E\u5927\u3002G(Y) \u5219\u5728\u6BCF\u4E2A\u4F4D\u7F6E\u90FD\u662F\u540C\u4E00\u7EC4\u6570\u3002`;
    return (0, w.jsxs)("div", {
      className: "ac-page ac-pcam-page",
      children: [(0, w.jsxs)("div", {
        className: "ac-pcam-left",
        children: [(0, w.jsxs)("div", {
          className: "ac-view ac-pcam-view",
          children: [(0, w.jsx)(Lt, {
            data: e.I,
            palette: "ir",
            vmin: .12,
            vmax: .78,
            label: "合成热像，点任意位置查看该位置的逐点注意力"
          }), (0, w.jsxs)("svg", {
            ref: i,
            viewBox: `0 0 ${z} ${L}`,
            role: "group",
            "aria-label": `\u5F53\u524D\u4F4D\u7F6E (${l.x}, ${l.y})`,
            className: "ac-hot",
            onPointerDown: p,
            tabIndex: 0,
            onKeyDown: d => {
              let r = tc(d, 1);
              r && n(g => ({
                x: zt(g.x + r[0], 0, z - 1),
                y: zt(g.y + r[1], 0, L - 1)
              }));
            },
            children: [(0, w.jsx)(Xe, {}), (0, w.jsx)("rect", {
              x: zt(l.x - 2, .4, z - 5.4),
              y: zt(l.y - 2, .4, L - 5.4),
              width: 5,
              height: 5,
              fill: "none",
              stroke: S.orange,
              strokeWidth: .8
            }), (0, w.jsx)("path", {
              d: `M${l.x + .5} ${Math.max(.5, l.y - 6)} V${Math.max(.5, l.y - 2.5)} M${l.x + .5} ${Math.min(L - .5, l.y + 3.5)} V${Math.min(L - .5, l.y + 7)} M${Math.max(.5, l.x - 6)} ${l.y + .5} H${Math.max(.5, l.x - 2.5)} M${Math.min(z - .5, l.x + 3.5)} ${l.y + .5} H${Math.min(z - .5, l.x + 7)}`,
              stroke: S.orange,
              strokeWidth: .6
            })]
          })]
        }), (0, w.jsx)("div", {
          className: "ac-chips",
          role: "group",
          "aria-label": "典型位置",
          children: a.map(d => (0, w.jsx)("button", {
            className: `ac-chip ${h?.id === d.id ? "is-on" : ""}`,
            "aria-pressed": h?.id === d.id,
            onClick: () => n({
              x: d.x,
              y: d.y
            }),
            children: d.name
          }, d.id))
        })]
      }), (0, w.jsxs)("div", {
        className: "ac-side ac-pcam-side",
        children: [(0, w.jsxs)("div", {
          className: "ac-formula ac-h",
          children: [(0, w.jsx)(xt, {
            meaning: "L(X)：逐点通道注意力权重，形状 C×H×W，与高层特征 Y 相同。",
            children: "L(X)"
          }), " = σ(B(", (0, w.jsx)(xt, {
            meaning: "PWConv₂：逐点（1×1）卷积，核大小 C×C/4×1×1，把隐藏通道展开回 C 个。",
            children: "PWConv₂"
          }), "(δ(B(", (0, w.jsx)(xt, {
            meaning: "PWConv₁：逐点（1×1）卷积，核大小 C/4×C×1×1，在每个位置把 C 维通道向量压成 C/4 维。",
            children: "PWConv₁"
          }), "(X))))))"]
        }), (0, w.jsxs)("div", {
          className: "ac-flow",
          children: [(0, w.jsxs)("div", {
            className: "ac-flow-col",
            children: [(0, w.jsx)("div", {
              className: "ac-text ac-muted",
              children: "该位置的 X"
            }), (0, w.jsxs)("div", {
              className: "ac-bar",
              children: [(0, w.jsx)("span", {
                children: "斑点"
              }), (0, w.jsx)("i", {
                style: {
                  width: b(c, .5)
                }
              }), (0, w.jsx)("b", {
                children: c.toFixed(3)
              })]
            }), (0, w.jsxs)("div", {
              className: "ac-bar",
              children: [(0, w.jsx)("span", {
                children: "边缘"
              }), (0, w.jsx)("i", {
                style: {
                  width: b(o, .5)
                }
              }), (0, w.jsx)("b", {
                children: o.toFixed(3)
              })]
            })]
          }), (0, w.jsx)("div", {
            className: "ac-flow-arrow",
            children: "→"
          }), (0, w.jsxs)("div", {
            className: "ac-flow-col ac-flow-mid",
            children: [(0, w.jsx)("div", {
              className: "ac-text ac-muted",
              children: "PWConv₁ + ReLU"
            }), (0, w.jsxs)("div", {
              className: "ac-h",
              children: ["h = ", f.toFixed(2)]
            })]
          }), (0, w.jsx)("div", {
            className: "ac-flow-arrow",
            children: "→"
          }), (0, w.jsxs)("div", {
            className: "ac-flow-col",
            children: [(0, w.jsx)("div", {
              className: "ac-text ac-muted",
              children: "PWConv₂ + σ"
            }), (0, w.jsxs)("div", {
              className: "ac-bar is-att",
              children: [(0, w.jsx)("span", {
                children: "斑点"
              }), (0, w.jsx)("i", {
                style: {
                  width: b(s, 1)
                }
              }), (0, w.jsx)("b", {
                children: s.toFixed(2)
              })]
            }), (0, w.jsxs)("div", {
              className: "ac-bar is-att",
              children: [(0, w.jsx)("span", {
                children: "边缘"
              }), (0, w.jsx)("i", {
                style: {
                  width: b(m, 1)
                }
              }), (0, w.jsx)("b", {
                children: m.toFixed(2)
              })]
            })]
          })]
        }), (0, w.jsxs)("div", {
          className: "ac-pcam-bottom",
          children: [(0, w.jsxs)("figure", {
            className: "ac-pcam-map",
            children: [(0, w.jsx)("div", {
              className: "ac-light ac-pcam-lmap",
              children: (0, w.jsx)(Lt, {
                data: e.L0,
                palette: "att",
                vmin: 0,
                vmax: 1,
                label: "L(X) 斑点通道的权重图"
              })
            }), (0, w.jsx)("figcaption", {
              className: "ac-text",
              children: "L(X) 斑点通道权重图"
            })]
          }), (0, w.jsxs)("div", {
            className: "ac-side",
            children: [(0, w.jsxs)("div", {
              className: "ac-kv ac-text",
              children: [(0, w.jsxs)("div", {
                children: [(0, w.jsx)("span", {
                  children: "G(Y)（任何位置都相同）"
                }), (0, w.jsxs)("b", {
                  children: ["[", e.g[0].toFixed(2), ", ", e.g[1].toFixed(2), "]"]
                })]
              }), (0, w.jsxs)("div", {
                children: [(0, w.jsx)("span", {
                  children: "L(X)（这个位置）"
                }), (0, w.jsxs)("b", {
                  className: "is-aux",
                  children: ["[", s.toFixed(2), ", ", m.toFixed(2), "]"]
                })]
              }), (0, w.jsxs)("div", {
                children: [(0, w.jsx)("span", {
                  children: "Y 的目标语义 → 乘 L 之后"
                }), (0, w.jsxs)("b", {
                  children: [e.Y0[u].toFixed(2), " → ", (s * e.Y0[u]).toFixed(2)]
                })]
              })]
            }), (0, w.jsx)("div", {
              className: `ac-feedback ${s > .6 && y > .3 ? "is-good" : ""}`,
              "aria-live": "polite",
              children: M
            })]
          })]
        })]
      })]
    });
  }
  var cc = React;
  var $ = jsxRuntime,
    os = {
      x: 90,
      y: 30,
      s: 3,
      a: .14
    },
    fs = {
      x: 34,
      y: 40,
      s: 4,
      a: .12
    },
    qm = [{
      id: "cls",
      name: "类别标签"
    }, {
      id: "ins",
      name: "实例分割"
    }, {
      id: "box",
      name: "边界框"
    }, {
      id: "sem",
      name: "语义分割"
    }, {
      id: "spot",
      name: "实例点"
    }],
    gv = [{
      name: "训练",
      p: 50,
      c: S.blue
    }, {
      name: "验证",
      p: 20,
      c: "#7f9cc2"
    }, {
      name: "测试",
      p: 30,
      c: S.orange
    }];
  function Qm(t) {
    let [e, a] = (0, cc.useState)("ins"),
      {
        I: l,
        masks: n,
        sem: i
      } = (0, cc.useMemo)(() => {
        let o = Ga(os),
          f = sl(os),
          s = sl(fs);
        for (let m = 0; m < o.length; m++) o[m] += fs.a * s[m];
        return {
          I: o,
          masks: [f, s],
          sem: f.map((m, p) => m > .5 || s[p] > .5 ? 1 : 0)
        };
      }, []),
      u = (o, f, s) => {
        let m = [];
        for (let p = 0; p < L; p++) for (let h = 0; h < z; h++) o[p * z + h] > .5 && m.push((0, $.jsx)("rect", {
          x: h,
          y: p,
          width: 1.02,
          height: 1.02,
          fill: f
        }, `${s}${h}-${p}`));
        return m;
      },
      c = [os, fs];
    return (0, $.jsxs)("div", {
      className: "ac-page ac-sirst-page",
      children: [(0, $.jsxs)("div", {
        className: "ac-sirst-left",
        children: [(0, $.jsx)("div", {
          className: "ac-chips",
          role: "group",
          "aria-label": "标注形式（图 2）",
          children: qm.map(o => (0, $.jsx)("button", {
            className: `ac-chip ${e === o.id ? "is-on" : ""}`,
            "aria-pressed": e === o.id,
            onClick: () => a(o.id),
            children: o.name
          }, o.id))
        }), (0, $.jsxs)("div", {
          className: "ac-view ac-sirst-view",
          children: [(0, $.jsx)(Lt, {
            data: e === "sem" ? i : l,
            palette: "ir",
            vmin: e === "sem" ? 0 : .12,
            vmax: e === "sem" ? 1 : .78,
            label: `\u5408\u6210\u70ED\u50CF\u4E0A\u7684${qm.find(o => o.id === e).name}`
          }), (0, $.jsxs)("svg", {
            viewBox: `0 0 ${z} ${L}`,
            "aria-hidden": "true",
            children: [(0, $.jsx)(Xe, {}), e === "ins" && (0, $.jsxs)("g", {
              children: [u(n[0], S.green, "a"), u(n[1], S.purple, "b")]
            }), e === "box" && c.map((o, f) => (0, $.jsx)("rect", {
              x: o.x - o.s / 1.2 - 1,
              y: o.y - o.s / 1.2 - 1,
              width: o.s * 1.67 + 2,
              height: o.s * 1.67 + 2,
              fill: "none",
              stroke: S.green,
              strokeWidth: .6
            }, f)), e === "spot" && c.map((o, f) => (0, $.jsx)("path", {
              d: `M${o.x + .5 - 3} ${o.y + .5} H${o.x + .5 + 3} M${o.x + .5} ${o.y + .5 - 3} V${o.y + .5 + 3}`,
              stroke: S.green,
              strokeWidth: .7
            }, f))]
          }), e === "cls" && (0, $.jsx)("div", {
            className: "ac-badge",
            children: "整张图：有目标"
          })]
        })]
      }), (0, $.jsxs)("div", {
        className: "ac-side",
        children: [(0, $.jsx)("div", {
          className: "ac-em",
          children: "427 张图 · 480 个目标"
        }), (0, $.jsx)("p", {
          className: "ac-text ac-tight ac-muted",
          children: "论文从每段红外序列挑选代表帧，减少帧间相似性；并借助序列中的运动确认目标。这里的热图与标注为手绘示例，非 SIRST 样本。"
        }), (0, $.jsx)("div", {
          className: "ac-split",
          "aria-label": "论文给出的大致划分：50% 训练、20% 验证、30% 测试",
          children: gv.map(o => (0, $.jsx)("div", {
            style: {
              width: `${o.p}%`,
              background: o.c
            },
            children: (0, $.jsxs)("span", {
              children: [o.name, " ", o.p, "%"]
            })
          }, o.name))
        }), (0, $.jsxs)("div", {
          className: "ac-stat ac-text",
          children: [(0, $.jsxs)("div", {
            children: [(0, $.jsx)("b", {
              className: "ac-em",
              children: "≈90%"
            }), (0, $.jsx)("span", {
              children: "的图像只有 1 个目标"
            })]
          }), (0, $.jsxs)("div", {
            children: [(0, $.jsx)("b", {
              className: "ac-em",
              children: "≈55%"
            }), (0, $.jsx)("span", {
              children: "的目标只占画面约 0.02%"
            })]
          }), (0, $.jsxs)("div", {
            children: [(0, $.jsx)("b", {
              className: "ac-em is-bad",
              children: "35%"
            }), (0, $.jsx)("span", {
              children: "的目标是全图最亮"
            })]
          })]
        }), (0, $.jsxs)("div", {
          className: "ac-feedback",
          "aria-live": "polite",
          children: [e === "cls" && "类别标签只回答“有没有”：所有目标都归为一类，不再细分是飞机还是船。", e === "ins" && "实例分割给每个目标一张独立掩码：两个目标颜色不同。", e === "box" && "边界框适合检测式的方法；目标只有几个像素，框的一点偏差就很明显。", e === "sem" && "语义分割只分“目标 / 背景”两类像素；本文的实验就按这种形式建模。", e === "spot" && "实例点只标中心位置，适合只关心“在哪”的应用。"]
        })]
      })]
    });
  }
  var ml = React;
  var Y = jsxRuntime,
    hv = [{
      s: 3,
      label: "3×3"
    }, {
      s: 5,
      label: "5×5"
    }, {
      s: 9,
      label: "9×9"
    }];
  function vv(t) {
    let e = t % z,
      a = Math.floor(t / z);
    return a >= te - 3 && a <= te && e >= 64 && e <= 104 ? "海岸线" : a >= te ? "海面波光" : "云层亮边";
  }
  function jm(t) {
    let e = (0, ml.useRef)(null),
      [a, l] = (0, ml.useState)({
        ...Vt
      }),
      n = (0, ml.useRef)({
        dx: 0,
        dy: 0
      }),
      i = rm(e, {
        start: (f, s) => {
          n.current = {
            dx: a.x - f,
            dy: a.y - s
          };
        },
        move: (f, s) => l(m => ({
          ...m,
          x: Math.round(zt(f + n.current.dx, 7, z - 8)),
          y: Math.round(zt(s + n.current.dy, 7, L - 8))
        }))
      }),
      u = (0, ml.useMemo)(() => {
        let f = Ga(a),
          s = sl(a),
          m = -1,
          p = 0,
          h = 0,
          b = 0;
        for (let d = 0; d < f.length; d++) f[d] > m && (m = f[d], p = d), s[d] > .5 && (b++, h = Math.max(h, f[d]));
        let y = 0;
        for (let d = 0; d < f.length; d++) f[d] < h && y++;
        let M = 0;
        for (let d = 0; d < f.length; d++) f[d] > h && s[d] <= .3 && M++;
        return {
          I: f,
          area: b,
          rank: y / f.length,
          brighter: M,
          bx: p % z,
          by: Math.floor(p / z),
          hit: s[p] > .3,
          place: vv(p)
        };
      }, [a]),
      c = u.area / (z * L) * 100,
      o = u.hit ? "在这个合成场景中，目标恰好是最亮位置，因此当前规则命中；这不代表真实检测模型的检测率。" : `这个合成场景中最亮的是${u.place}；当前“取最亮像素”规则选中了背景。另有 ${u.brighter} 个背景像素比目标峰值更亮，说明亮度本身不总能区分目标与背景。`;
    return (0, Y.jsxs)("div", {
      className: "ac-page ac-small-page",
      children: [(0, Y.jsxs)("div", {
        className: "ac-view ac-small-view",
        children: [(0, Y.jsx)(Lt, {
          data: u.I,
          palette: "ir",
          vmin: .12,
          vmax: .78,
          label: "合成夜间热像：天空、云、海岸线和带波光的海面"
        }), (0, Y.jsxs)("svg", {
          ref: e,
          viewBox: `0 0 ${z} ${L}`,
          role: "group",
          "aria-label": `\u76EE\u6807\u4F4D\u4E8E (${a.x}, ${a.y})`,
          children: [(0, Y.jsx)(Xe, {}), (0, Y.jsxs)("g", {
            role: "slider",
            tabIndex: 0,
            "aria-label": "拖动目标",
            "aria-valuenow": a.x,
            "aria-valuemin": 0,
            "aria-valuemax": z,
            className: "ac-handle",
            ...i,
            onKeyDown: f => {
              let s = tc(f, 2);
              s && l(m => ({
                ...m,
                x: zt(m.x + s[0], 7, z - 8),
                y: zt(m.y + s[1], 7, L - 8)
              }));
            },
            children: [(0, Y.jsx)("circle", {
              cx: a.x,
              cy: a.y,
              r: 6,
              fill: "#ffffff",
              fillOpacity: .01,
              stroke: S.orange,
              strokeWidth: .9
            }), (0, Y.jsx)("circle", {
              cx: a.x,
              cy: a.y,
              r: 1.2,
              fill: "none",
              stroke: S.orange,
              strokeWidth: .5
            })]
          }), (0, Y.jsxs)("g", {
            pointerEvents: "none",
            stroke: u.hit ? S.green : S.red,
            strokeWidth: .7,
            fill: "none",
            children: [(0, Y.jsx)("rect", {
              x: u.bx - 2.5,
              y: u.by - 2.5,
              width: 6,
              height: 6
            }), (0, Y.jsx)("path", {
              d: `M${u.bx + .5} ${u.by - 6} V${u.by - 3} M${u.bx + .5} ${u.by + 4} V${u.by + 7}`
            })]
          })]
        })]
      }), (0, Y.jsxs)("div", {
        className: "ac-side",
        children: [(0, Y.jsxs)("div", {
          className: "ac-row",
          children: [(0, Y.jsx)("span", {
            className: "ac-label",
            children: "目标大小"
          }), (0, Y.jsx)("div", {
            className: "ac-chips",
            role: "group",
            "aria-label": "目标大小",
            children: hv.map(f => (0, Y.jsx)("button", {
              className: `ac-chip ${a.s === f.s ? "is-on" : ""}`,
              "aria-pressed": a.s === f.s,
              onClick: () => l(s => ({
                ...s,
                s: f.s
              })),
              children: f.label
            }, f.s))
          })]
        }), (0, Y.jsxs)("label", {
          className: "ac-row",
          children: [(0, Y.jsx)("span", {
            className: "ac-label",
            children: "比背景亮"
          }), (0, Y.jsx)("input", {
            className: "ac-range",
            type: "range",
            min: .02,
            max: .6,
            step: .01,
            value: a.a,
            onChange: f => l(s => ({
              ...s,
              a: Number(f.target.value)
            })),
            "aria-label": "目标比背景亮多少"
          }), (0, Y.jsxs)("b", {
            children: ["+", a.a.toFixed(2)]
          })]
        }), (0, Y.jsxs)("div", {
          className: "ac-kv ac-text",
          children: [(0, Y.jsxs)("div", {
            children: [(0, Y.jsx)("span", {
              children: "目标面积"
            }), (0, Y.jsxs)("b", {
              children: [u.area, " 像素（画面的 ", c.toFixed(2), "%）"]
            })]
          }), (0, Y.jsxs)("div", {
            children: [(0, Y.jsx)("span", {
              children: (0, Y.jsx)(xt, {
                meaning: "论文引用：256×256 图像中面积小于 80 像素。这里仅把 80/65536 的面积比例换算到合成图作参考，不能当作任意分辨率下的统一定义。",
                children: "按面积比例换算的参考线"
              })
            }), (0, Y.jsx)("b", {
              className: c < 80 / 65536 * 100 ? "is-good" : "is-bad",
              children: c < 80 / 65536 * 100 ? "在线内" : "已超出"
            })]
          }), (0, Y.jsxs)("div", {
            children: [(0, Y.jsx)("span", {
              children: "比目标峰值更亮的像素"
            }), (0, Y.jsxs)("b", {
              children: [u.brighter, " 个"]
            })]
          }), (0, Y.jsxs)("div", {
            children: [(0, Y.jsx)("span", {
              children: "全图最亮的点"
            }), (0, Y.jsx)("b", {
              className: u.hit ? "is-good" : "is-bad",
              children: u.hit ? "就是目标" : u.place
            })]
          })]
        }), (0, Y.jsxs)("div", {
          className: "ac-panel ac-text",
          children: (0, Y.jsxs)("div", {
            children: ["SIRST 统计（§3.2）：约 ", (0, Y.jsx)("b", {
              children: "35%"
            }), " 的目标是所在图像中最亮的。该比例描述数据分布，不是本页演示测得的检测率。"]
          })
        }), (0, Y.jsx)("div", {
          className: `ac-feedback ${u.hit ? "" : "is-bad"}`,
          "aria-live": "polite",
          children: o
        })]
      })]
    });
  }
  var ss = React;
  var W = jsxRuntime,
    oc = [{
      name: "Tophat",
      group: "lcm",
      iou: .22,
      niou: .352,
      full: "顶帽滤波"
    }, {
      name: "LCM",
      group: "lcm",
      iou: .193,
      niou: .207,
      full: "局部对比度方法"
    }, {
      name: "ILCM",
      group: "lcm",
      iou: .104,
      niou: .123,
      full: "改进的 LCM"
    }, {
      name: "LSM",
      group: "lcm",
      iou: .1864,
      niou: .2598,
      full: "局部显著性方法"
    }, {
      name: "FKRW",
      group: "lcm",
      iou: .268,
      niou: .339,
      full: "Facet 核 + 随机游走"
    }, {
      name: "MPCM",
      group: "lcm",
      iou: .357,
      niou: .445,
      full: "多尺度块对比度"
    }, {
      name: "IPI",
      group: "rank",
      iou: .466,
      niou: .607,
      full: "红外块图像模型"
    }, {
      name: "NIPPS",
      group: "rank",
      iou: .473,
      niou: .602,
      full: "NIPPS（论文对比方法）"
    }, {
      name: "RIPT",
      group: "rank",
      iou: .146,
      niou: .245,
      full: "重加权红外块张量"
    }, {
      name: "PSTNN",
      group: "rank",
      iou: .605,
      niou: .504,
      full: "张量核范数部分和"
    }, {
      name: "NRAM",
      group: "rank",
      iou: .294,
      niou: .424,
      full: "非凸秩近似最小化"
    }, {
      name: "FPN",
      group: "fpn",
      iou: .72,
      niou: .7,
      full: "FPN 宿主基线"
    }, {
      name: "SK-FPN",
      group: "fpn",
      iou: .702,
      niou: .695,
      full: "选择性核融合"
    }, {
      name: "GAU-FPN",
      group: "fpn",
      iou: .701,
      niou: .701,
      full: "全局注意力上采样"
    }, {
      name: "ACM-FPN",
      group: "fpn",
      iou: .731,
      niou: .721,
      full: "本文"
    }, {
      name: "U-Net",
      group: "unet",
      iou: .733,
      niou: .709,
      full: "U-Net 宿主基线"
    }, {
      name: "SK-U-Net",
      group: "unet",
      iou: .708,
      niou: .699,
      full: "选择性核融合"
    }, {
      name: "GAU-U-Net",
      group: "unet",
      iou: .718,
      niou: .697,
      full: "全局注意力上采样"
    }, {
      name: "ACM-U-Net",
      group: "unet",
      iou: .743,
      niou: .731,
      full: "本文"
    }],
    bv = {
      lcm: "局部对比",
      rank: "低秩 + 稀疏",
      fpn: "FPN 宿主",
      unet: "U-Net 宿主"
    };
  function Zm(t) {
    let [e, a] = (0, ss.useState)("niou"),
      [l, n] = (0, ss.useState)("ACM-U-Net"),
      i = b => e === "iou" ? b.iou : e === "niou" ? b.niou : b.niou - b.iou,
      u = 26,
      c = 8,
      o = e === "diff" ? 430 : 150,
      f = e === "diff" ? 2e3 : 800,
      s = b => e === "diff" ? i(b) > 0 ? S.purple : S.blue : b.name.startsWith("ACM") ? S.green : b.group === "fpn" || b.group === "unet" ? "#7f9cc2" : "#b9c2cf",
      m = oc.find(b => b.name === l),
      p = oc.filter(b => (b.group === "lcm" || b.group === "rank") && b.niou > b.iou).length,
      h = oc.filter(b => (b.group === "fpn" || b.group === "unet") && b.iou > b.niou).length;
    return (0, W.jsxs)("div", {
      className: "ac-page ac-sota-page",
      children: [(0, W.jsx)("div", {
        className: "ac-sota-chart",
        children: (0, W.jsxs)("svg", {
          viewBox: "0 0 860 545",
          className: "ac-svg",
          role: "group",
          "aria-label": "表 3：19 种方法的 IoU 与 nIoU",
          children: [e === "diff" && (0, W.jsx)("line", {
            x1: o,
            x2: o,
            y1: c,
            y2: c + u * 19 + 4,
            stroke: S.ink,
            strokeWidth: 1.5
          }), e !== "diff" && [0, .25, .5, .75].map(b => (0, W.jsxs)("g", {
            children: [(0, W.jsx)("line", {
              x1: o + b * f,
              x2: o + b * f,
              y1: c,
              y2: c + u * 19 + 4,
              stroke: S.axis
            }), (0, W.jsx)("text", {
              x: o + b * f,
              y: c + u * 19 + 30,
              textAnchor: "middle",
              fontSize: 24,
              fill: S.muted,
              children: b.toFixed(2)
            })]
          }, b)), e === "diff" && [-.1, 0, .1].map(b => (0, W.jsxs)("text", {
            x: o + b * f,
            y: c + u * 19 + 30,
            textAnchor: "middle",
            fontSize: 24,
            fill: S.muted,
            children: [b > 0 ? "+" : "", b.toFixed(1)]
          }, b)), oc.map((b, y) => {
            let M = i(b),
              d = c + y * u,
              r = Math.abs(M) * f,
              g = e === "diff" && M < 0 ? o - r : o,
              v = b.name === l;
            return (0, W.jsxs)("g", {
              role: "button",
              tabIndex: 0,
              "aria-pressed": v,
              "aria-label": `${b.name}\uFF1AIoU ${b.iou}\uFF0CnIoU ${b.niou}`,
              className: "ac-hot",
              onClick: () => n(b.name),
              onKeyDown: N => {
                (N.key === "Enter" || N.key === " ") && (N.preventDefault(), n(b.name));
              },
              children: [(0, W.jsx)("rect", {
                x: 0,
                y: d,
                width: 860,
                height: u,
                fill: v ? "#fff3ea" : "transparent"
              }), (0, W.jsx)("text", {
                x: 140,
                y: d + 21,
                textAnchor: "end",
                fontSize: 22,
                fontWeight: v ? 750 : 400,
                fill: S.ink,
                children: b.name
              }), (0, W.jsx)("rect", {
                x: g,
                y: d + 5,
                width: Math.max(2, r),
                height: u - 10,
                rx: 3,
                fill: s(b)
              }), (0, W.jsx)("text", {
                x: e === "diff" ? M >= 0 ? o + r + 8 : o - r - 8 : o + r + 8,
                y: d + 21,
                textAnchor: e === "diff" && M < 0 ? "end" : "start",
                fontSize: 22,
                fill: S.muted,
                children: e === "diff" ? `${M >= 0 ? "+" : ""}${M.toFixed(3)}` : M.toFixed(b.name === "LSM" ? 4 : 3)
              })]
            }, b.name);
          }), (0, W.jsx)("line", {
            x1: 0,
            x2: 860,
            y1: c + u * 11,
            y2: c + u * 11,
            stroke: S.ink,
            strokeWidth: 1,
            strokeDasharray: "6 5"
          })]
        })
      }), (0, W.jsxs)("div", {
        className: "ac-side",
        children: [jsxRuntime.jsxs("label", {className: "ac-method-select", children: [jsxRuntime.jsx("span", {children: "选择方法（与图同步）"}), jsxRuntime.jsx("select", {value:l, onChange:event=>n(event.target.value), children:oc.map(method=>jsxRuntime.jsx("option", {value:method.name, children:method.name}, method.name))})]}), (0, W.jsx)("div", {
          className: "ac-chips",
          role: "group",
          "aria-label": "指标",
          children: [["iou", "IoU"], ["niou", "nIoU"], ["diff", "nIoU − IoU"]].map(([b, y]) => (0, W.jsx)("button", {
            className: `ac-chip ${e === b ? "is-on" : ""}`,
            "aria-pressed": e === b,
            onClick: () => a(b),
            children: y
          }, b))
        }), (0, W.jsxs)("div", {
          className: "ac-panel",
          children: [(0, W.jsxs)("div", {
            className: "ac-h",
            children: [m.name, (0, W.jsxs)("span", {
              className: "ac-text ac-muted",
              children: ["\u3000", m.full]
            })]
          }), (0, W.jsxs)("div", {
            className: "ac-text ac-muted",
            children: [m.group === "lcm" || m.group === "rank" ? "模型驱动" : "数据驱动", " · ", bv[m.group]]
          }), (0, W.jsxs)("div", {
            className: "ac-text",
            children: ["IoU ", (0, W.jsx)("b", {
              children: m.iou.toFixed(m.name === "LSM" ? 4 : 3)
            }), "\u3000nIoU ", (0, W.jsx)("b", {
              children: m.niou.toFixed(m.name === "LSM" ? 4 : 3)
            }), "\u3000差 ", (0, W.jsx)("b", {
              className: m.niou > m.iou ? "is-aux" : "",
              children: (m.niou - m.iou >= 0 ? "+" : "") + (m.niou - m.iou).toFixed(3)
            })]
          })]
        }), (0, W.jsxs)("div", {
          className: "ac-sota-note",
          children: [(0, W.jsx)("svg", {
            viewBox: "0 0 80 80",
            className: "ac-icon",
            "aria-hidden": "true",
            children: (0, W.jsx)(Te, {})
          }), (0, W.jsx)("p", {
            className: "ac-text ac-tight",
            children: "表 3 是特定预测设置的重叠指标；图 9 的 ROC 展示不同阈值下的权衡。判断优劣时，应结合阈值、检测率和虚警率，不能只用单一排名概括。"
          })]
        }), (0, W.jsx)("div", {
          className: "ac-feedback",
          "aria-live": "polite",
          children: e === "diff" ? `\u6A21\u578B\u9A71\u52A8 ${p}/11 \u662F nIoU \u66F4\u9AD8\uFF08PSTNN \u4F8B\u5916\uFF09\uFF1B\u6570\u636E\u9A71\u52A8 ${h}/8 \u662F IoU \u66F4\u9AD8\uFF08GAU-FPN \u76F8\u7B49\uFF09\u3002` : "8 种数据驱动方法全部高于 11 种模型驱动方法；两种 ACM 网络在各自宿主里都最高。"
        })]
      })]
    });
  }
  var Ot = {};
  Ot["ac-ablation"] = hm;
  Ot["ac-acm"] = bm;
  Ot["ac-cover"] = Sm;
  Ot["ac-down"] = Tm;
  Ot["ac-fpn"] = Um;
  Ot["ac-gap"] = _m;
  Ot["ac-hosts"] = Bm;
  Ot["ac-kit"] = pm;
  Ot["ac-limits"] = Ym;
  Ot["ac-niou"] = Lm;
  Ot["ac-pcam"] = Xm;
  Ot["ac-sirst"] = Qm;
  Ot["ac-small"] = jm;
  Ot["ac-sota"] = Zm;

const moduleNotes = {
"ac-small": "手绘热像示意。亮度、目标位置与背景均为合成数据，非 SIRST 图像或检测输出。",
"ac-sirst": "手绘标注示意；427 图、480 实例及划分比例来自原文 §3。五种标注显示同一合成场景。",
"ac-down": "平均池化教学示意，不等于 ResNet 实际卷积。可见性阈值 1.2 是演示规则；实验数字来自表 2。",
"ac-gap": "单通道数值示意；门控函数为手工设定。G(Y) 的真实权重通过训练学习。",
"ac-pcam": "手工两通道示意，省略 BN；隐藏通道数不按真实 C/4 缩减。Y 预先按合成目标构造，不能证明网络会识别这些目标。",
"ac-acm": "合成特征与手工门控示意。Y 预先按合成目标构造；示例 IoU、虚警像素及掩码不是 ACM 网络实测。",
"ac-hosts": "结构重绘示意，依据原文表 1 与图 7；切换仅用于查看宿主及 b 的配置。",
"ac-ablation": "数据来源：原论文表 2，SIRST。b 为每 stage 残差块数。折线连接离散配置，不代表插值实验。",
"ac-niou": "六张合成二值掩码，数字由显示的整数像素计数计算；用于比较公式，不是论文实验。",
"ac-sota": "数据来源：原论文表 3，SIRST。数值为作者报告，未在本项目重新训练或测量。",
"ac-fpn": "结构比较示意。FPN 一侧特指原论文 RPN 实例；图中省略 P6，ACM-FPN 对应本文图 6。",
"ac-limits": "核对依据：原文 §3、表 2、表 3。点击条目仅表示已展开阅读，不代表完成模型复现。"
};
export const recoveredWidgets = Object.fromEntries(Object.entries(Ot).map(([id, Component]) => [id, function RecoveredWidget(props) {
  return jsxRuntime.jsxs(React.Fragment, {children: [jsxRuntime.jsx(Component, props), moduleNotes[id] && jsxRuntime.jsx("p", {className: "ac-module-notice", children: moduleNotes[id]})]});
}]));
