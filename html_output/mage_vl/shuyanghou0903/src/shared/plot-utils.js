(function () {
  'use strict';

  var Canvas = window.DLCanvas;

  var defaults = {
    blue: '#27446e',
    red: '#c43f52',
    orange: '#f07e47',
    green: '#228d5c',
    grid: '#dfe6f1',
    axis: '#68778f',
    tick: '#9fb0c8',
    bg: '#fbfdff',
    white: '#fff',
  };

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function colors(options) {
    var merged = {};
    var source = (options && options.colors) || {};
    Object.keys(defaults).forEach(function (key) {
      merged[key] = source[key] || defaults[key];
    });
    return merged;
  }

  function isMajorTick(value, step) {
    step = step || 0.5;
    return Math.abs(value / step - Math.round(value / step)) < 0.01;
  }

  function project2D(canvas, x, y, options) {
    options = options || {};
    var logical = Canvas.size(canvas);
    var scale = options.scale || Math.min(logical.width, logical.height) * (options.scaleFactor || 0.34) * (options.zoom || 1);
    var centerX = options.centerX != null ? options.centerX : logical.width / 2 + (options.panX || 0);
    var centerY = options.centerY != null ? options.centerY : logical.height / 2 + (options.panY || 0);
    var invertY = options.invertY !== false;

    return {
      x: centerX + x * scale,
      y: centerY + (invertY ? -y : y) * scale,
      depth: 0,
      scale: scale,
    };
  }

  function drawAxes2D(ctx, canvas, options) {
    options = options || {};
    var logical = Canvas.size(canvas);
    var c = colors(options);
    var project = options.project || function (x, y) {
      return project2D(canvas, x, y, options);
    };

    if (options.clear !== false) {
      Canvas.clear(ctx, canvas, options.fill || c.bg);
    }

    if (options.grid !== false) {
      ctx.strokeStyle = options.gridColor || c.grid;
      ctx.lineWidth = options.gridWidth || 1;
      var gridMin = options.gridMin == null ? -1 : options.gridMin;
      var gridMax = options.gridMax == null ? 1 : options.gridMax;
      var gridStep = options.gridStep || 0.25;
      for (var value = gridMin; value <= gridMax + 0.001; value += gridStep) {
        var vertical = project(value, 0).x;
        var horizontal = project(0, value).y;
        ctx.beginPath();
        ctx.moveTo(vertical, 0);
        ctx.lineTo(vertical, logical.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, horizontal);
        ctx.lineTo(logical.width, horizontal);
        ctx.stroke();
      }
    }

    var axisRange = options.axisRange || options.range || 1.2;
    var xStart = project(-axisRange, 0);
    var xEnd = project(axisRange, 0);
    var yStart = project(0, -axisRange);
    var yEnd = project(0, axisRange);

    ctx.strokeStyle = options.axisColor || c.axis;
    ctx.lineWidth = options.axisWidth || 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(xStart.x, xStart.y);
    ctx.lineTo(xEnd.x, xEnd.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(yStart.x, yStart.y);
    ctx.lineTo(yEnd.x, yEnd.y);
    ctx.stroke();

    if (options.ticks) {
      var tickMin = options.tickMin == null ? -1 : options.tickMin;
      var tickMax = options.tickMax == null ? 1 : options.tickMax;
      var tickStep = options.tickStep || 0.25;
      var majorStep = options.majorStep || 0.5;
      ctx.strokeStyle = options.tickColor || c.axis;
      for (var tick = tickMin; tick <= tickMax + 0.001; tick += tickStep) {
        var major = isMajorTick(tick, majorStep);
        var tickLength = major ? (options.majorTickSize || 6) : (options.minorTickSize || 4);
        var xTick = project(tick, 0);
        var yTick = project(0, tick);
        ctx.lineWidth = major ? 1.6 : 1;
        ctx.beginPath();
        ctx.moveTo(xTick.x, xTick.y - tickLength);
        ctx.lineTo(xTick.x, xTick.y + tickLength);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(yTick.x - tickLength, yTick.y);
        ctx.lineTo(yTick.x + tickLength, yTick.y);
        ctx.stroke();

        if (options.tickLabels && major && Math.abs(tick) > 0.01) {
          ctx.fillStyle = options.tickLabelColor || c.axis;
          ctx.font = options.tickLabelFont || '800 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(tick.toFixed(1), xTick.x, xTick.y + 18);
          ctx.textAlign = 'right';
          ctx.fillText(tick.toFixed(1), yTick.x - 9, yTick.y + 3);
        }
      }
    }

    if (options.labels !== false) {
      ctx.fillStyle = options.labelColor || c.blue;
      ctx.font = options.labelFont || '900 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText((options.xLabel || 'x'), xEnd.x + 7, xEnd.y + 4);
      ctx.fillText((options.yLabel || 'y'), yEnd.x + 7, yEnd.y - 5);
    }
  }

  function strokeFunction(ctx, canvas, fn, options) {
    options = options || {};
    var project = options.project || function (x, y) {
      return project2D(canvas, x, y, options);
    };
    var xMin = options.xMin == null ? -1.15 : options.xMin;
    var xMax = options.xMax == null ? 1.15 : options.xMax;
    var samples = options.samples || 160;
    var clipMin = options.clipMin == null ? -1.18 : options.clipMin;
    var clipMax = options.clipMax == null ? 1.18 : options.clipMax;
    var topLeft = project(clipMin, clipMax);
    var bottomRight = project(clipMax, clipMin);

    ctx.save();
    if (options.clip !== false) {
      ctx.beginPath();
      ctx.rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
      ctx.clip();
    }

    ctx.strokeStyle = options.color || defaults.green;
    ctx.lineWidth = options.lineWidth || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    var hasPoint = false;
    for (var i = 0; i <= samples; i++) {
      var x = xMin + (i / samples) * (xMax - xMin);
      var y = fn(x);
      if (!Number.isFinite(y)) {
        hasPoint = false;
        continue;
      }
      var point = project(x, y);
      if (!hasPoint) {
        ctx.moveTo(point.x, point.y);
        hasPoint = true;
      }
      else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function project3D(canvas, point, view, options) {
    options = options || {};
    view = view || {};
    var logical = Canvas.size(canvas);
    var scale = options.scale || Math.min(logical.width, logical.height) * (options.scaleFactor || 0.29) * (view.zoom || 1);
    var cy = Math.cos(view.rotY || 0);
    var sy = Math.sin(view.rotY || 0);
    var cx = Math.cos(view.rotX || 0);
    var sx = Math.sin(view.rotX || 0);
    var x1 = cy * point[0] + sy * point[2];
    var z1 = -sy * point[0] + cy * point[2];
    var y1 = cx * point[1] - sx * z1;

    return {
      x: logical.width / 2 + (view.panX || options.panX || 0) + x1 * scale,
      y: logical.height / 2 + (view.panY || options.panY || 0) - y1 * scale,
      depth: sx * point[1] + cx * z1,
    };
  }

  function drawAxis3D(ctx, options) {
    options = options || {};
    var c = colors(options);
    var project = options.project;
    if (!project) return;

    var start = options.start;
    var end = options.end;
    var label = options.label || '';
    var a = project(start);
    var b = project(end);
    var length = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
    var normalX = -(b.y - a.y) / length;
    var normalY = (b.x - a.x) / length;

    ctx.strokeStyle = options.axisColor || c.axis;
    ctx.lineWidth = options.axisWidth || 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    var axisIndex = label === 'x' ? 0 : (label === 'y' ? 1 : 2);
    var base = options.tickBase == null ? -1 : options.tickBase;
    var tickMin = options.tickMin == null ? -1 : options.tickMin;
    var tickMax = options.tickMax == null ? 1 : options.tickMax;
    var tickStep = options.tickStep || 0.5;
    var majorStep = options.majorStep || 0.5;

    for (var value = tickMin; value <= tickMax + 0.001; value += tickStep) {
      var coordinates = [base, base, base];
      coordinates[axisIndex] = value;
      var point = project(coordinates);
      var major = isMajorTick(value, majorStep);
      var tickSize = major ? (options.majorTickSize || 6) : (options.minorTickSize || 3.5);

      ctx.strokeStyle = options.tickColor || c.tick;
      ctx.lineWidth = major ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(point.x - normalX * tickSize, point.y - normalY * tickSize);
      ctx.lineTo(point.x + normalX * tickSize, point.y + normalY * tickSize);
      ctx.stroke();

      if (options.tickLabels && major) {
        ctx.fillStyle = options.tickLabelColor || c.axis;
        ctx.font = options.tickLabelFont || '800 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(value.toFixed(value === 0 ? 0 : 1), point.x + normalX * 13, point.y + normalY * 13 + 3);
      }
    }

    ctx.fillStyle = options.labelColor || c.blue;
    ctx.font = options.labelFont || '900 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, b.x + 7, b.y);
  }

  function drawAxes3D(ctx, options) {
    options = options || {};
    var axes = options.axes || [
      [[-1, -1, -1], [1.12, -1, -1], 'x'],
      [[-1, -1, -1], [-1, 1.12, -1], 'y'],
      [[-1, -1, -1], [-1, -1, 1.12], 'z'],
    ];

    axes.forEach(function (axis) {
      drawAxis3D(ctx, Object.assign({}, options, {
        start: axis[0],
        end: axis[1],
        label: axis[2],
      }));
    });
  }

  function numberLineMetrics(options) {
    options = options || {};
    var width = options.width || 720;
    var height = options.height || 240;
    var min = options.min == null ? 0 : options.min;
    var max = options.max == null ? 10 : options.max;
    var left = options.left == null ? 80 : options.left;
    var right = options.right == null ? 80 : options.right;
    var axisY = options.axisY == null ? height / 2 + 20 : options.axisY;
    var tickHeight = options.tickHeight == null ? height / 3 : options.tickHeight;
    var span = width - left - right;

    return {
      width: width,
      height: height,
      min: min,
      max: max,
      left: left,
      right: right,
      axisY: axisY,
      tickHeight: tickHeight,
      toX: function (value) {
        return left + (value - min) / (max - min) * span;
      },
      toValue: function (x) {
        return min + (x - left) / span * (max - min);
      },
    };
  }

  function drawNumberLine(canvas, options) {
    options = options || {};
    var c = colors(options);
    var metrics = numberLineMetrics(options);
    var gt = options.gt == null ? 7 : options.gt;
    var pred = options.pred == null ? 1.6 : options.pred;
    var isDragging = !!options.isDragging;
    var ctx = Canvas.prepare(canvas, { width: metrics.width, height: metrics.height });
    Canvas.clear(ctx, canvas, options.fill || c.bg);

    ctx.strokeStyle = options.axisColor || c.tick;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(metrics.left, metrics.axisY);
    ctx.lineTo(metrics.width - metrics.right, metrics.axisY);
    ctx.stroke();

    for (var i = metrics.min; i <= metrics.max + 0.001; i += options.tickStep || 1) {
      var tx = metrics.toX(i);
      ctx.strokeStyle = options.tickColor || c.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, metrics.axisY - metrics.tickHeight / 3);
      ctx.lineTo(tx, metrics.axisY + metrics.tickHeight / 3);
      ctx.stroke();
      ctx.fillStyle = options.tickLabelColor || c.axis;
      ctx.font = options.tickLabelFont || '800 13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(String(i), tx, metrics.axisY + metrics.tickHeight / 3 + 6);
    }

    var gx = metrics.toX(gt);
    var px = metrics.toX(pred);
    if (options.showDistance !== false) {
      var distance = gt - pred;
      ctx.strokeStyle = options.distanceColor || 'rgba(240,126,71,0.35)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(gx, metrics.axisY - 20);
      ctx.lineTo(px, metrics.axisY - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = options.distanceLabelColor || c.orange;
      ctx.font = '900 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('d = ' + distance.toFixed(0), (gx + px) / 2, metrics.axisY - 28);
    }

    ctx.fillStyle = options.gtColor || c.red;
    ctx.beginPath();
    ctx.arc(gx, metrics.axisY - metrics.tickHeight / 3 - 4, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.white;
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.gtShortLabel || '真', gx, metrics.axisY - metrics.tickHeight / 3 - 4);
    ctx.fillStyle = options.gtColor || c.red;
    ctx.font = '800 12px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText((options.gtLabel || '真实值 ') + gt, gx, metrics.axisY - metrics.tickHeight / 3 - 32);

    if (options.highlightPred) {
      var pulse = 0.5 + Math.sin((options.pulseTime || 0) / 520) * 0.5;
      var py = metrics.axisY + metrics.tickHeight / 3 + 4;
      var glow = ctx.createRadialGradient(px, py, 16, px, py, 46 + pulse * 5);
      glow.addColorStop(0, 'rgba(34,141,92,0.22)');
      glow.addColorStop(0.45, 'rgba(34,141,92,' + (0.08 + pulse * 0.08).toFixed(2) + ')');
      glow.addColorStop(1, 'rgba(34,141,92,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, 48 + pulse * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(34,141,92,' + (0.32 + pulse * 0.18).toFixed(2) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 22 + pulse * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(34,141,92,0.88)';
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(options.dragLabel || '拖这里', px, py - 28 - pulse * 2);
    }

    ctx.fillStyle = options.predColor || c.green;
    ctx.beginPath();
    ctx.arc(px, metrics.axisY + metrics.tickHeight / 3 + 4, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.white;
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.predShortLabel || '预', px, metrics.axisY + metrics.tickHeight / 3 + 4);
    ctx.fillStyle = options.predColor || c.green;
    ctx.font = '800 12px sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.fillText((options.predLabel || '预测值 ') + pred.toFixed(1), px, metrics.axisY + metrics.tickHeight / 3 + 32);

    ctx.fillStyle = isDragging ? (options.predColor || c.green) : (options.hintColor || c.axis);
    ctx.font = isDragging ? '900 11px sans-serif' : '700 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      isDragging ? '拖动中... 预测值 = ' + pred.toFixed(1) : (options.solved ? 'Loss 已经降到 0' : '← 拖动绿色预测值，试图缩小损失 →'),
      metrics.width / 2,
      metrics.height - 14
    );
  }

  function numberLineValueFromPointer(canvas, event, options) {
    options = options || {};
    var metrics = numberLineMetrics(options);
    var point = Canvas.pointer(canvas, event);
    return clamp(metrics.toValue(point.x), metrics.min, metrics.max);
  }

  function numberLineHit(canvas, event, value, options) {
    options = options || {};
    var metrics = numberLineMetrics(options);
    var point = Canvas.pointer(canvas, event);
    return Math.abs(point.x - metrics.toX(value)) < (options.hitRadius || 28);
  }

  function bindDraggableNumberLine(canvas, options) {
    options = options || {};
    var state = { dragging: false, hover: false };

    function currentValue() {
      return typeof options.getValue === 'function' ? options.getValue() : options.value;
    }

    function setValue(value, event) {
      var step = options.step || 0.1;
      var rounded = Math.round(value / step) * step;
      if (typeof options.setValue === 'function') options.setValue(rounded, event);
      if (typeof options.onChange === 'function') options.onChange(rounded, event);
    }

    canvas.addEventListener('pointerdown', function (event) {
      if (options.enabled && !options.enabled(event)) return;
      if (!numberLineHit(canvas, event, currentValue(), options)) return;
      state.dragging = true;
      state.hover = true;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
      if (typeof options.onDragStart === 'function') options.onDragStart(event, state);
    });

    canvas.addEventListener('pointermove', function (event) {
      if (options.enabled && !options.enabled(event)) return;
      if (!state.dragging) {
        state.hover = numberLineHit(canvas, event, currentValue(), options);
        canvas.style.cursor = state.hover ? 'grab' : 'default';
        if (typeof options.onHover === 'function') options.onHover(state.hover, event, state);
        return;
      }

      setValue(numberLineValueFromPointer(canvas, event, options), event);
      if (typeof options.onDrag === 'function') options.onDrag(event, state);
    });

    function endDrag(event) {
      if (!state.dragging) return;
      state.dragging = false;
      canvas.style.cursor = state.hover ? 'grab' : 'default';
      if (typeof options.onDragEnd === 'function') options.onDragEnd(event, state);
    }

    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', function (event) {
      state.hover = false;
      if (state.dragging) endDrag(event);
      canvas.style.cursor = 'default';
      if (typeof options.onHover === 'function') options.onHover(false, event, state);
    });

    return state;
  }

  function drawLossComparison(canvas, options) {
    options = options || {};
    var c = colors(options);
    var width = options.width || 760;
    var height = options.height || 460;
    var gt = options.gt == null ? 3 : options.gt;
    var pred = options.pred == null ? 7 : options.pred;
    var view = options.view || { zoom: 1, panX: 0, panY: 0 };
    var ctx = Canvas.prepare(canvas, { width: width, height: height });
    Canvas.clear(ctx, canvas, c.bg);
    var scale = 54 * view.zoom;
    var originX = width * 0.22 + (view.panX || 0);
    var originY = height * 0.82 + (view.panY || 0);
    var toX = function (value) { return originX + value * scale; };
    var toY = function (value) { return originY - value * scale; };
    var fromX = function (pixel) { return (pixel - originX) / scale; };
    var minX = Math.floor(fromX(0)) - 1;
    var maxX = Math.ceil(fromX(width)) + 1;
    var maxY = Math.ceil((originY - 0) / scale) + 1;
    var step = maxY > 24 ? 4 : (maxY > 12 ? 2 : 1);

    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 1;
    for (var gridX = minX; gridX <= maxX; gridX++) {
      ctx.beginPath();
      ctx.moveTo(toX(gridX), 0);
      ctx.lineTo(toX(gridX), height);
      ctx.stroke();
    }
    for (var gridY = 0; gridY <= Math.max(24, maxY); gridY += step) {
      ctx.beginPath();
      ctx.moveTo(0, toY(gridY));
      ctx.lineTo(width, toY(gridY));
      ctx.stroke();
    }

    ctx.strokeStyle = c.axis;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, toY(0));
    ctx.lineTo(width, toY(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toX(0), height);
    ctx.lineTo(toX(0), 0);
    ctx.stroke();

    ctx.fillStyle = c.axis;
    ctx.font = '800 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var tickX = minX; tickX <= maxX; tickX++) {
      var tx = toX(tickX);
      var major = tickX % 2 === 0;
      ctx.strokeStyle = c.axis;
      ctx.lineWidth = major ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(tx, toY(0) - (major ? 6 : 4));
      ctx.lineTo(tx, toY(0) + (major ? 6 : 4));
      ctx.stroke();
      if (major && tx > -6 && tx < width + 6) ctx.fillText(tickX, tx, toY(0) + 11);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var tickY = 0; tickY <= Math.max(24, maxY); tickY += step * 2) {
      if (tickY === 0) continue;
      var ty = toY(tickY);
      if (ty < -8 || ty > height + 8) continue;
      ctx.strokeStyle = c.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(toX(0) - 6, ty);
      ctx.lineTo(toX(0) + 6, ty);
      ctx.stroke();
      ctx.fillText(tickY, toX(0) - 10, ty);
    }

    ctx.fillStyle = c.blue;
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(options.xLabel || '预测值', Math.min(width - 56, Math.max(12, width - 70)), toY(0) - 10);
    ctx.fillText(options.yLabel || 'Loss', toX(0) + 8, 18);

    function drawCurve(color, fn, label, labelX) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      var hasPoint = false;
      for (var i = 0; i <= 360; i++) {
        var value = fromX(-20) + i / 360 * (fromX(width + 20) - fromX(-20));
        var loss = fn(value);
        var y = toY(loss);
        if (y < -40 || y > height + 40) {
          hasPoint = false;
          continue;
        }
        var x = toX(value);
        if (!hasPoint) {
          ctx.moveTo(x, y);
          hasPoint = true;
        }
        else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      var lx = toX(labelX);
      var ly = toY(fn(labelX));
      if (lx > 0 && lx < width && ly > 0 && ly < height) {
        ctx.fillStyle = color;
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, lx, ly - 8);
      }
    }

    drawCurve(c.green, function (value) { return Math.abs(gt - value); }, 'L1 = |真实值 - 预测值|', 8.2);
    drawCurve(c.orange, function (value) { var diff = gt - value; return diff * diff; }, 'L2 = (真实值 - 预测值)²', 4.4);

    var trueX = toX(gt);
    var predX = toX(pred);
    var distance = Math.abs(gt - pred);
    var l2 = distance * distance;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(39,68,110,0.34)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(predX, toY(0));
    ctx.lineTo(predX, toY(l2));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = c.red;
    ctx.beginPath();
    ctx.arc(trueX, toY(0), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.green;
    ctx.beginPath();
    ctx.arc(predX, toY(0), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.red;
    ctx.font = '900 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('真实值 ' + gt, trueX, toY(0) - 12);
    ctx.fillStyle = c.green;
    ctx.fillText('预测值 ' + pred, predX, toY(0) - 12);

    ctx.fillStyle = '#21324a';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('距离 |' + gt + ' - ' + pred + '| = ' + Math.abs(gt - pred), Math.max(12, toX(0) + 8), 18);
    ctx.fillStyle = c.axis;
    ctx.font = '800 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(options.hint || '拖动平移 · 滚轮缩放', width - 14, height - 12);
  }

  function bindPanZoom(canvas, view, options) {
    options = options || {};
    var active = false;
    canvas.style.cursor = options.cursor || 'grab';

    function enabled(event) {
      return !options.enabled || options.enabled(event);
    }

    function changed(event) {
      if (typeof options.onChange === 'function') options.onChange(event);
    }

    canvas.addEventListener('wheel', function (event) {
      if (!enabled(event)) return;
      event.preventDefault();
      var zoomIn = options.zoomInFactor || 1.1;
      var zoomOut = options.zoomOutFactor || 0.9;
      view.zoom = clamp(view.zoom * (event.deltaY < 0 ? zoomIn : zoomOut), options.zoomMin || 0.5, options.zoomMax || 3);
      changed(event);
    }, { passive: false });

    canvas.addEventListener('pointerdown', function (event) {
      if (!enabled(event)) return;
      active = true;
      view.dragging = true;
      view.moved = false;
      view.lastX = event.clientX;
      view.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
      if (typeof options.onDragStart === 'function') options.onDragStart(event);
    });

    canvas.addEventListener('pointermove', function (event) {
      if (!active || !view.dragging || !enabled(event)) return;
      var dx = event.clientX - view.lastX;
      var dy = event.clientY - view.lastY;
      if (Math.abs(dx) + Math.abs(dy) > (options.moveThreshold || 2)) view.moved = true;
      view.panX += dx;
      view.panY += dy;
      view.lastX = event.clientX;
      view.lastY = event.clientY;
      changed(event);
    });

    function endDrag(event) {
      if (!active) return;
      active = false;
      view.dragging = false;
      canvas.style.cursor = options.cursor || 'grab';
      if (typeof options.onDragEnd === 'function') options.onDragEnd(event);
    }

    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    if (options.endOnLeave) canvas.addEventListener('pointerleave', endDrag);
  }

  function bindRotateZoom(canvas, view, options) {
    options = options || {};
    var active = false;
    canvas.style.cursor = options.cursor || 'grab';

    function enabled(event) {
      return !options.enabled || options.enabled(event);
    }

    function changed(event) {
      if (typeof options.onChange === 'function') options.onChange(event);
    }

    canvas.addEventListener('pointerdown', function (event) {
      if (!enabled(event)) return;
      active = true;
      view.dragging = true;
      view.moved = false;
      view.lastX = event.clientX;
      view.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
      if (typeof options.onDragStart === 'function') options.onDragStart(event);
    });

    canvas.addEventListener('pointermove', function (event) {
      if (!active || !view.dragging || !enabled(event)) return;
      var dx = event.clientX - view.lastX;
      var dy = event.clientY - view.lastY;
      if (Math.abs(dx) + Math.abs(dy) > (options.moveThreshold || 2)) view.moved = true;
      view.rotY += dx * (options.rotationSpeed || 0.01);
      view.rotX = clamp(view.rotX + dy * (options.rotationSpeed || 0.01), options.rotXMin || -1.45, options.rotXMax || 1.45);
      view.lastX = event.clientX;
      view.lastY = event.clientY;
      changed(event);
    });

    function endDrag(event) {
      if (!active) return;
      active = false;
      view.dragging = false;
      canvas.style.cursor = options.cursor || 'grab';
      if (typeof options.onDragEnd === 'function') options.onDragEnd(event);
    }

    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    if (options.endOnLeave) canvas.addEventListener('pointerleave', endDrag);

    canvas.addEventListener('wheel', function (event) {
      if (!enabled(event)) return;
      event.preventDefault();
      var zoomIn = options.zoomInFactor || 1.08;
      var zoomOut = options.zoomOutFactor || 0.92;
      view.zoom = clamp(view.zoom * (event.deltaY < 0 ? zoomIn : zoomOut), options.zoomMin || 0.72, options.zoomMax || 1.7);
      changed(event);
    }, { passive: false });
  }

  function plotlyHost(target) {
    var host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) throw new Error('DLPlot: Plotly 容器不存在。');
    if (!window.Plotly || typeof window.Plotly.newPlot !== 'function') {
      throw new Error('DLPlot: 请先加载 shared/vendor/plotly/3.6.0/plotly.min.js。');
    }
    return host;
  }

  function plotlyFont() {
    return {
      family: 'Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      color: defaults.blue,
      size: 12,
    };
  }

  function plotlyConfig(options) {
    return Object.assign({
      responsive: true,
      scrollZoom: true,
      displayModeBar: false,
      displaylogo: false,
      showTips: false,
      doubleClick: 'reset+autosize',
    }, options || {});
  }

  function plotlyAxis(title, palette, options) {
    options = options || {};
    return Object.assign({
      title: { text: title || '', standoff: 8, font: { size: 12, color: palette.blue } },
      showgrid: true,
      gridcolor: palette.grid,
      gridwidth: 1,
      zeroline: true,
      zerolinecolor: palette.axis,
      zerolinewidth: 1.5,
      showline: false,
      ticks: 'outside',
      tickcolor: palette.tick,
      tickfont: { size: 10, color: palette.axis },
      fixedrange: false,
      automargin: true,
    }, options);
  }

  function bindPlotlyCallbacks(host, options, internalRelayout) {
    if (typeof host.removeAllListeners === 'function') host.removeAllListeners('plotly_relayout');
    if ((typeof internalRelayout === 'function' || typeof options.onRelayout === 'function') && typeof host.on === 'function') {
      host.on('plotly_relayout', function (event) {
        if (typeof internalRelayout === 'function') internalRelayout(event, host);
        if (typeof options.onRelayout === 'function') options.onRelayout(event, host);
      });
    }
    if (typeof options.onReady === 'function') options.onReady(host);
    return host;
  }

  function sampleFunction2D(fn, options) {
    options = options || {};
    var xMin = options.xMin == null ? -1.5 : options.xMin;
    var xMax = options.xMax == null ? 1.5 : options.xMax;
    var count = options.samples || 180;
    var x = [];
    var y = [];
    for (var index = 0; index <= count; index++) {
      var value = xMin + (index / count) * (xMax - xMin);
      x.push(value);
      y.push(fn(value));
    }
    return { x: x, y: y };
  }

  function sampleSurface3D(fn, options) {
    options = options || {};
    var min = options.min == null ? -1 : options.min;
    var max = options.max == null ? 1 : options.max;
    var count = options.samples || 30;
    var zMin = options.zMin;
    var zMax = options.zMax;
    var axis = [];
    var z = [];
    for (var index = 0; index <= count; index++) axis.push(min + (index / count) * (max - min));
    axis.forEach(function (yValue) {
      z.push(axis.map(function (xValue) {
        var value = fn(xValue, yValue);
        if (zMin != null) value = Math.max(zMin, value);
        if (zMax != null) value = Math.min(zMax, value);
        return value;
      }));
    });
    return { x: axis, y: axis, z: z };
  }

  function formulaAnnotation(text, options) {
    options = options || {};
    return {
      xref: 'paper',
      yref: 'paper',
      x: options.x == null ? 0.02 : options.x,
      y: options.y == null ? 0.98 : options.y,
      xanchor: options.xanchor || 'left',
      yanchor: options.yanchor || 'top',
      showarrow: false,
      text: text,
      font: Object.assign({
        family: 'Consolas, monospace',
        size: 12,
        color: defaults.blue,
      }, options.font || {}),
      bgcolor: options.bgcolor || 'rgba(255,255,255,0.82)',
      borderpad: options.borderpad == null ? 4 : options.borderpad,
    };
  }

  function mount2D(target, options) {
    options = options || {};
    var host = plotlyHost(target);
    var palette = colors(options);
    var series = options.series || [];
    var customLayout = options.layout || {};
    var initialXRange = options.xRange || (customLayout.xaxis && customLayout.xaxis.range) || [-1.5, 1.5];
    var traces = series.map(function (item, index) {
      var sampled = typeof item.fn === 'function'
        ? sampleFunction2D(item.fn, {
          xMin: initialXRange[0],
          xMax: initialXRange[1],
          samples: item.samples || options.samples || 240,
        })
        : null;
      return Object.assign({
        type: 'scatter',
        mode: item.mode || 'lines',
        name: item.name || ('series-' + (index + 1)),
        x: sampled ? sampled.x : (item.x || []),
        y: sampled ? sampled.y : (item.y || []),
        line: Object.assign({
          color: item.color || palette.orange,
          width: item.width || 4,
          shape: item.shape || 'linear',
        }, item.line || {}),
        marker: Object.assign({ color: item.color || palette.orange, size: 7 }, item.marker || {}),
        hovertemplate: item.hovertemplate || 'x = %{x:.3f}<br>y = %{y:.3f}<extra></extra>',
      }, item.trace || {});
    });
    var layout = Object.assign({
      autosize: true,
      paper_bgcolor: palette.bg,
      plot_bgcolor: palette.bg,
      font: plotlyFont(),
      margin: { l: 52, r: 20, t: 18, b: 46 },
      showlegend: !!options.showLegend,
      hovermode: 'closest',
      dragmode: 'pan',
    }, customLayout);
    layout.xaxis = plotlyAxis(options.xTitle || 'x', palette, Object.assign({
      range: options.xRange || [-1.5, 1.5],
    }, customLayout.xaxis || {}));
    layout.yaxis = plotlyAxis(options.yTitle || 'y', palette, Object.assign({
      range: options.yRange || [-1.1, 1.1],
    }, customLayout.yaxis || {}));

    return window.Plotly.newPlot(host, traces, layout, plotlyConfig(options.config)).then(function (graph) {
      return bindPlotlyCallbacks(graph, options, function (event, currentGraph) {
        var hasRange = event && (
          Array.isArray(event['xaxis.range'])
          || (Number.isFinite(event['xaxis.range[0]']) && Number.isFinite(event['xaxis.range[1]']))
          || event['xaxis.autorange'] === true
        );
        if (!hasRange) return;
        var range = Array.isArray(event['xaxis.range'])
          ? event['xaxis.range']
          : [event['xaxis.range[0]'], event['xaxis.range[1]']];
        if (!Number.isFinite(range[0]) || !Number.isFinite(range[1])) {
          range = currentGraph._fullLayout && currentGraph._fullLayout.xaxis
            ? currentGraph._fullLayout.xaxis.range
            : initialXRange;
        }
        var traceIndexes = [];
        var xUpdates = [];
        var yUpdates = [];
        series.forEach(function (item, index) {
          if (typeof item.fn !== 'function') return;
          var sampled = sampleFunction2D(item.fn, {
            xMin: range[0],
            xMax: range[1],
            samples: item.samples || options.samples || 240,
          });
          traceIndexes.push(index);
          xUpdates.push(sampled.x);
          yUpdates.push(sampled.y);
        });
        if (traceIndexes.length) window.Plotly.restyle(currentGraph, { x: xUpdates, y: yUpdates }, traceIndexes);
      });
    });
  }

  function mountFunction2D(target, options) {
    options = options || {};
    if (typeof options.fn !== 'function') throw new Error('DLPlot: mountFunction2D 需要 fn。');
    var series = Object.assign({
      name: options.name || '函数曲线',
      fn: options.fn,
      samples: options.samples,
      color: options.color,
      width: options.width,
    }, options.series || {});
    return mount2D(target, Object.assign({}, options, { series: [series] }));
  }

  function mountTrainingHistory(target, options) {
    options = options || {};
    var palette = colors(options);
    var loss = options.loss || [];
    var accuracy = options.accuracy || [];
    var showAccuracy = options.showAccuracy !== false;
    var count = Math.max(loss.length, accuracy.length);
    var epochs = options.epochs || Array.from({ length: count }, function (_, index) { return index + 1; });
    var epochValues = epochs.map(Number).filter(Number.isFinite);
    var epochMin = epochValues.length ? Math.min.apply(null, epochValues) : 1;
    var epochMax = epochValues.length ? Math.max.apply(null, epochValues) : Math.max(2, count);
    var lossValues = loss.map(Number).filter(Number.isFinite);
    var lossMax = lossValues.length ? Math.max.apply(null, lossValues) : 1;
    var customLayout = options.layout || {};
    var layout = Object.assign({
      hovermode: 'x unified',
      margin: { l: 58, r: 58, t: 34, b: 48 },
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.12,
        xanchor: 'left',
        yanchor: 'top',
        font: { size: 11, color: palette.axis },
      },
    }, customLayout);
    layout.yaxis = Object.assign({
      title: { text: options.lossTitle || 'Loss', standoff: 8, font: { size: 12, color: palette.orange } },
      tickfont: { size: 10, color: palette.orange },
    }, customLayout.yaxis || {});
    if (showAccuracy) layout.yaxis2 = Object.assign({
      title: { text: options.accuracyTitle || 'Accuracy', standoff: 8, font: { size: 12, color: palette.green } },
      overlaying: 'y',
      side: 'right',
      range: options.accuracyRange || [0, 1],
      tickformat: '.0%',
      showgrid: false,
      zeroline: false,
      ticks: 'outside',
      tickcolor: palette.tick,
      tickfont: { size: 10, color: palette.green },
      fixedrange: false,
      automargin: true,
    }, customLayout.yaxis2 || {});

    var series = [{
      name: options.lossName || 'Loss',
      x: epochs.slice(0, loss.length),
      y: loss,
      color: options.lossColor || palette.orange,
      width: 4,
      mode: options.lossMode || 'lines',
      marker: options.lossMarker,
      hovertemplate: 'Loss = %{y:.4f}<extra></extra>',
    }];
    if (showAccuracy) series.push({
      name: options.accuracyName || 'Accuracy',
      x: epochs.slice(0, accuracy.length),
      y: accuracy,
      color: options.accuracyColor || palette.green,
      width: 4,
      hovertemplate: 'Accuracy = %{y:.1%}<extra></extra>',
      trace: { yaxis: 'y2' },
    });

    return mount2D(target, Object.assign({}, options, {
      series: series,
      xTitle: options.xTitle || 'Epoch',
      yTitle: options.lossTitle || 'Loss',
      xRange: options.xRange || [epochMin, epochMax],
      yRange: options.lossRange || [0, Math.max(1, lossMax * 1.08)],
      showLegend: options.showLegend == null ? showAccuracy : options.showLegend,
      layout: layout,
    }));
  }

  function mount3D(target, options) {
    options = options || {};
    var host = plotlyHost(target);
    var palette = colors(options);
    var customLayout = options.layout || {};
    var customScene = customLayout.scene || {};
    var trace = Object.assign({
      type: 'surface',
      x: options.x || [],
      y: options.y || [],
      z: options.z || [],
      showscale: false,
      opacity: options.opacity == null ? 0.94 : options.opacity,
      colorscale: options.colorscale || [
        [0, '#fff4ee'],
        [0.45, '#f7b28d'],
        [1, palette.orange],
      ],
      hovertemplate: 'x = %{x:.3f}<br>y = %{y:.3f}<br>z = %{z:.3f}<extra></extra>',
      contours: {
        x: { show: true, color: 'rgba(255,255,255,0.55)', width: 1 },
        y: { show: true, color: 'rgba(255,255,255,0.55)', width: 1 },
        z: { show: false },
      },
    }, options.trace || {});
    var sceneAxis = function (title, axisOptions) {
      return plotlyAxis(title, palette, Object.assign({
        showbackground: true,
        backgroundcolor: palette.bg,
      }, axisOptions || {}));
    };
    var scene = Object.assign({
      bgcolor: palette.bg,
      dragmode: 'orbit',
      aspectmode: options.aspectMode || 'cube',
      camera: options.camera || { eye: { x: 1.35, y: 1.35, z: 0.95 } },
    }, customScene);
    scene.xaxis = sceneAxis(options.xTitle || 'x', customScene.xaxis);
    scene.yaxis = sceneAxis(options.yTitle || 'y', customScene.yaxis);
    scene.zaxis = sceneAxis(options.zTitle || 'z', customScene.zaxis);
    var layout = Object.assign({
      autosize: true,
      paper_bgcolor: palette.bg,
      font: plotlyFont(),
      margin: { l: 0, r: 0, t: 0, b: 0 },
      showlegend: false,
      scene: scene,
    }, customLayout, { scene: scene });

    return window.Plotly.newPlot(host, [trace], layout, plotlyConfig(options.config)).then(function (graph) {
      return bindPlotlyCallbacks(graph, options);
    });
  }

  function mountSurfaceFunction3D(target, options) {
    options = options || {};
    if (typeof options.fn !== 'function') throw new Error('DLPlot: mountSurfaceFunction3D 需要 fn。');
    var sampled = sampleSurface3D(options.fn, options);
    return mount3D(target, Object.assign({}, options, {
      x: sampled.x,
      y: sampled.y,
      z: sampled.z,
    }));
  }

  function purgePlot(target) {
    var host = typeof target === 'string' ? document.querySelector(target) : target;
    if (host && window.Plotly && typeof window.Plotly.purge === 'function') window.Plotly.purge(host);
  }

  window.DLPlot = {
    clamp: clamp,
    project2D: project2D,
    drawAxes2D: drawAxes2D,
    strokeFunction: strokeFunction,
    project3D: project3D,
    drawAxis3D: drawAxis3D,
    drawAxes3D: drawAxes3D,
    drawNumberLine: drawNumberLine,
    drawLossComparison: drawLossComparison,
    numberLineValueFromPointer: numberLineValueFromPointer,
    numberLineHit: numberLineHit,
    bindDraggableNumberLine: bindDraggableNumberLine,
    bindPanZoom: bindPanZoom,
    bindRotateZoom: bindRotateZoom,
    sampleFunction2D: sampleFunction2D,
    sampleSurface3D: sampleSurface3D,
    formulaAnnotation: formulaAnnotation,
    mount2D: mount2D,
    mountFunction2D: mountFunction2D,
    mountTrainingHistory: mountTrainingHistory,
    mount3D: mount3D,
    mountSurfaceFunction3D: mountSurfaceFunction3D,
    purge: purgePlot,
  };
})();
