// Lorenz Attractor Animation (p5.js instance mode)
// Plots the x-y trajectory while integrating the Lorenz system over time.

var sketch1 = function(p) {
  // Canvas (sized to container)
  var canvas, pg;

  // Lorenz parameters
  var sigma = 10;
  var rho = 28;
  var beta = 8 / 3;
  var dt = 0.0015; // slower integration step for a slower developing graph

  // State variables for three trajectories and drawing controls
  var states = [];
  var initialStates = [];
  var stepsPerFrame = 5;   // default speed (steps per frame)
  var scale = 10;          // effective scale = baseScale * zoom
  var baseScale = 10;      // base scale computed from canvas size
  var zoom = 1.0;          // user-controlled zoom factor
  var minZoom = 0.25, maxZoom = 8;
  var segmentsDrawn = 0;
  var maxSegments = 90000; // after this, reset and loop

  function computeCanvasSize() {
    var parent = document.getElementById('canvas-container-1');
    var w = parent ? parent.clientWidth : p.windowWidth;
    // Prefer a tall canvas but cap by viewport height; keep ~16:11 aspect when possible
    var h = Math.min(p.windowHeight, Math.round(w * 11 / 16));
    return { w: w, h: h };
  }

  function updateScale() {
    // Lorenz x,y roughly within ~[-30, 30]; map to screen with some margin
    var minDim = Math.min(p.width, p.height);
  baseScale = minDim / 60; // heuristic to fit attractor comfortably
  scale = baseScale * zoom;
  }

  function resetSystem() {
    // Initialize three trajectories with tiny offsets
  states = [
      { x: 0.10, y: 0.00, z: 0.00, col: {r:220,g:60,b:60} },   // red
      { x: 0.14, y: 0.04, z: 0.02, col: {r:60,g:180,b:80} },   // green
      { x: 0.06, y: -0.04, z: -0.02, col: {r:60,g:100,b:220} } // blue
    ];
  // capture initial states for legend
  initialStates = states.map(function(s){ return { x: s.x, y: s.y, z: s.z, col: s.col }; });
    segmentsDrawn = 0;
    if (pg) {
      pg.resizeCanvas(p.width, p.height);
      pg.clear(); // transparent so background/grid/axes show through
      pg.strokeWeight(1);
      pg.noFill();
    }
  }

  p.setup = function() {
  var sz = computeCanvasSize();
  canvas = p.createCanvas(sz.w, sz.h);
    canvas.parent('canvas-container-1');
  pg = p.createGraphics(p.width, p.height);
    resetSystem();
  updateScale();

  // Build controls
  buildControls();
  };

  p.windowResized = function() {
  var sz = computeCanvasSize();
  p.resizeCanvas(sz.w, sz.h);
  // Recreate buffer to match new size
  pg = p.createGraphics(p.width, p.height);
  resetSystem();
  updateScale();
  };

  // Mouse wheel zoom only when cursor is inside the canvas
  p.mouseWheel = function(event) {
    if (!isPointerInsideCanvas(event)) {
      // Outside canvas: do not handle; allow page to scroll normally
      return;
    }
    var factor = Math.pow(1.0015, event.deltaY); // smooth exponential mapping
    setZoom(zoom / factor);
    // Prevent page scroll since we used the wheel for zoom
    return false;
  };

  function isPointerInsideCanvas(evt) {
    var rect = p.canvas.getBoundingClientRect();
    var x = evt.clientX, y = evt.clientY;
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  // Keyboard zoom: '+'/'=' to zoom in, '-'/'_' to zoom out, '0' to reset
  p.keyPressed = function() {
    if (p.key === '+' || p.key === '=') {
      setZoom(zoom * 1.1);
    } else if (p.key === '-' || p.key === '_') {
      setZoom(zoom / 1.1);
    } else if (p.key === '0') {
      setZoom(1.0);
    }
  };

  function setZoom(z) {
    zoom = p.constrain(z, minZoom, maxZoom);
    updateScale();
    // Clear and restart so the persistent buffer matches new scale
    resetSystem();
  }

  p.draw = function() {
    // Integrate and draw segments for all trajectories onto the persistent buffer
    for (var i = 0; i < stepsPerFrame; i++) {
      for (var s = 0; s < states.length; s++) {
        var st = states[s];
        var dx = sigma * (st.y - st.x);
        var dy = st.x * (rho - st.z) - st.y;
        var dz = st.x * st.y - beta * st.z;

        var xPrev = st.x;
        var yPrev = st.y;

        st.x += dx * dt;
        st.y += dy * dt;
        st.z += dz * dt;

        // Project to screen (x-y plane), center canvas, invert y for screen coords
        var cx = p.width / 2;
        var cy = p.height / 2;
        var px1 = cx + xPrev * scale;
        var py1 = cy - yPrev * scale;
        var px2 = cx + st.x * scale;
        var py2 = cy - st.y * scale;

        pg.stroke(st.col.r, st.col.g, st.col.b);
        pg.line(px1, py1, px2, py2);
      }
      segmentsDrawn++;
      if (segmentsDrawn >= maxSegments) {
        resetSystem();
      }
    }

  // Background and axes underlay
  p.background(22); // dark grey grid background
  drawGridBackground();
  drawAxesWithTicks();

    // Draw the accumulated path and overlay the equations and triad
    p.image(pg, 0, 0);
  drawEquationsOverlay();
    drawAxisTriad();
  };

  // Choose a "nice" step size (1, 2, 5 × 10^n) near the desired value
  function niceStep(desired) {
    if (desired <= 0 || !isFinite(desired)) return 1;
    var exp = Math.floor(Math.log10(desired));
    var base = Math.pow(10, exp);
    var f = desired / base;
    var nice;
    if (f < 1.5) nice = 1;
    else if (f < 3.5) nice = 2;
    else if (f < 7.5) nice = 5;
    else nice = 10;
    return nice * base;
  }

  function drawGridBackground() {
    p.push();
    var cx = p.width / 2;
    var cy = p.height / 2;
    // Aim for ~40px between grid lines
    var desiredPx = 40;
    var stepW = niceStep(desiredPx / Math.max(scale, 1e-9)); // world units per grid line

    // Visible world extents
    var worldXLeft = (0 - cx) / scale;
    var worldXRight = (p.width - cx) / scale;
    var worldYBottom = (cy - p.height) / scale;
    var worldYTop = (cy - 0) / scale;

    // Draw grid lines
    p.stroke(255); // white
    p.strokeWeight(0.5); // very thin
    p.noFill();

    // Vertical lines at x = k * stepW
    var kxStart = Math.ceil(worldXLeft / stepW);
    var kxEnd = Math.floor(worldXRight / stepW);
    for (var kx = kxStart; kx <= kxEnd; kx++) {
      var xw = kx * stepW;
      var sx = cx + xw * scale;
      p.line(sx, 0, sx, p.height);
    }
    // Horizontal lines at y = k * stepW
    var kyStart = Math.ceil(worldYBottom / stepW);
    var kyEnd = Math.floor(worldYTop / stepW);
    for (var ky = kyStart; ky <= kyEnd; ky++) {
      var yw = ky * stepW;
      var sy = cy - yw * scale;
      p.line(0, sy, p.width, sy);
    }
    p.pop();
  }

  function drawAxesWithTicks() {
    var cx = p.width / 2;
    var cy = p.height / 2;
    p.push();
    // Main axes
    p.stroke(180);
    p.strokeWeight(2);
    // X/Y axes (world origin)
    p.line(0, cy, p.width, cy);
    p.line(cx, 0, cx, p.height);

    // Arrowheads
    p.stroke(200);
    // X arrow
    p.line(p.width - 14, cy - 7, p.width, cy);
    p.line(p.width - 14, cy + 7, p.width, cy);
    // Y arrow
    p.line(cx - 7, 14, cx, 0);
    p.line(cx + 7, 14, cx, 0);

    // Ticks and numeric labels aligned to a nice zoom-aware step
    var desiredTickPx = 80; // target pixels between tick labels
    var tickStep = niceStep(desiredTickPx / Math.max(scale, 1e-9)); // world units per tick

    // Visible world extents
    var worldXLeft = (0 - cx) / scale;
    var worldXRight = (p.width - cx) / scale;
    var worldYBottom = (cy - p.height) / scale;
    var worldYTop = (cy - 0) / scale;

    p.textSize(14);
    p.fill(235);

    // X ticks
    var kxStart = Math.ceil(worldXLeft / tickStep);
    var kxEnd = Math.floor(worldXRight / tickStep);
    for (var kx = kxStart; kx <= kxEnd; kx++) {
      var wx = kx * tickStep;
      if (Math.abs(wx) < 1e-9) continue; // skip origin (label overlaps axis)
      var sx = cx + wx * scale;
      p.stroke(160);
      p.strokeWeight(1);
      p.line(sx, cy - 6, sx, cy + 6);
      p.noStroke();
      p.textAlign(p.CENTER, p.TOP);
      p.text(formatWorld(wx), sx, cy + 8);
    }
    // Y ticks
    var kyStart = Math.ceil(worldYBottom / tickStep);
    var kyEnd = Math.floor(worldYTop / tickStep);
    for (var ky = kyStart; ky <= kyEnd; ky++) {
      var wy = ky * tickStep;
      if (Math.abs(wy) < 1e-9) continue;
      var sy = cy - wy * scale;
      p.stroke(160);
      p.strokeWeight(1);
      p.line(cx - 6, sy, cx + 6, sy);
      p.noStroke();
      p.textAlign(p.LEFT, p.CENTER);
      p.text(formatWorld(wy), cx + 8, sy - 1);
    }
    // Axis labels
    p.textAlign(p.LEFT, p.TOP);
    p.textStyle(p.BOLD);
    p.textSize(16);
    p.text('X', p.width - 20, cy - 14);
    p.text('Y', cx + 12, 12);
    p.pop();
  }

  function formatWorld(v) {
    // Format world coordinate with minimal decimals
    var av = Math.abs(v);
    if (av >= 100) return v.toFixed(0);
    if (av >= 10) return v.toFixed(1);
    if (av >= 1) return v.toFixed(2);
    return v.toFixed(3);
  }

  function drawEquationsOverlay() {
    var pad = 10;
  var boxW = 200; // narrower box as requested

    p.push();
    p.textSize(12);
    p.textStyle(p.NORMAL);
    var lines = [
      'Lorenz system (x–y projection):',
      'dx/dt = σ (y − x)',
      'dy/dt = x (ρ − z) − y',
      'dz/dt = x y − β z'
    ];

    // Pre-compute layout to size the box height
    var y0 = pad + 18;
    var legendY = y0 + lines.length * 16 + 10;
    var entryStartY = legendY + 18; // one line gap below label
    var contentBottom = entryStartY + (initialStates.length - 1) * 18 + 14; // include a little bottom padding
  var boxH = Math.max(160, contentBottom - pad); // slightly shorter min height

    // Draw background box now that dimensions are known
    p.noStroke();
    p.fill(255, 255, 255, 220);
    p.rect(pad, pad, boxW, boxH, 8);

    // Text content
    p.fill(0);
    for (var i = 0; i < lines.length; i++) {
      p.text(lines[i], pad + 10, y0 + i * 16);
    }

    // Legend with colored dots and initial states below the equations
    // Label above the legend entries
    p.textStyle(p.BOLD);
    p.text('Initial states:', pad + 10, legendY - 6);
    p.textStyle(p.NORMAL);
    var dotR = 5;
    var labelX = pad + 30;
    for (var j = 0; j < initialStates.length; j++) {
      var st0 = initialStates[j];
      var yLine = entryStartY + j * 18;
      p.noStroke();
      p.fill(st0.col.r, st0.col.g, st0.col.b);
      p.circle(pad + 14, yLine, dotR * 2);
      p.fill(0);
      var txt = '(' + st0.x.toFixed(2) + ', ' + st0.y.toFixed(2) + ', ' + st0.z.toFixed(2) + ')';
      p.text(txt, labelX, yLine + 4);
    }
    p.pop();
  }

  function drawAxisTriad() {
    // Small 3D axis triad (X right, Y up, Z out of screen)
    var ox = p.width - 90;
    var oy = p.height - 60;
    p.push();
    p.strokeWeight(2);

    // X (red)
    p.stroke(220, 60, 60);
    p.line(ox, oy, ox + 40, oy);
    p.noStroke(); p.fill(220,60,60); p.text('X', ox + 44, oy + 4);

    // Y (green)
    p.stroke(60, 180, 80);
    p.line(ox, oy, ox, oy - 40);
    p.noStroke(); p.fill(60,180,80); p.text('Y', ox - 4, oy - 44);

    // Z (blue) – indicate out of screen with a small circle + dot
    p.stroke(60, 100, 220);
    p.noFill();
    p.circle(ox, oy, 12);
    p.noStroke();
    p.fill(60, 100, 220);
    p.circle(ox, oy, 4);
    p.text('Z', ox + 10, oy - 10);

    p.pop();
  }

  // Color gradient helpers no longer needed (fixed colors per trajectory)

  function buildControls() {
    var container = document.getElementById('controls-1');
    if (!container) return;
    container.innerHTML = '';

    // Helper to add a slider with label and value span
    function addSlider(label, id, min, max, step, value) {
      var wrapper = document.createElement('label');
      wrapper.setAttribute('for', id);
      wrapper.textContent = label + ': ';
      var val = document.createElement('span');
      val.id = id + '-val';
      val.textContent = (id === 'beta' ? value.toFixed(4) : (id === 'speed' ? value.toFixed(0) : value.toFixed(2)));
      var input = document.createElement('input');
      input.type = 'range';
      input.id = id;
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(value);
      input.addEventListener('input', function() {
        var v = parseFloat(this.value);
        if (id === 'sigma') sigma = v;
        if (id === 'rho') rho = v;
        if (id === 'beta') beta = v;
        if (id === 'speed') stepsPerFrame = Math.max(1, Math.round(v));
        document.getElementById(id + '-val').textContent = (id === 'beta' ? v.toFixed(4) : (id === 'speed' ? Math.round(v).toString() : v.toFixed(2)));
        resetSystem();
        updateScale();
      });
      wrapper.appendChild(val);
      wrapper.appendChild(input);
      container.appendChild(wrapper);
    }

  addSlider('σ', 'sigma', 0, 20, 0.1, sigma);
  addSlider('ρ', 'rho', 0, 50, 0.5, rho);
  addSlider('β', 'beta', 0.5, 3, 0.01, beta);
  addSlider('Speed', 'speed', 1, 12, 1, stepsPerFrame);

  // Zoom controls
  var zoomWrap = document.createElement('div');
  zoomWrap.style.marginTop = '8px';
  var label = document.createElement('span');
  label.textContent = 'Zoom:';
  label.style.marginRight = '8px';
  var btnOut = document.createElement('button');
  btnOut.textContent = '−';
  btnOut.title = 'Zoom out';
  btnOut.style.marginRight = '4px';
  btnOut.addEventListener('click', function(){ setZoom(zoom / 1.2); });
  var btnIn = document.createElement('button');
  btnIn.textContent = '+';
  btnIn.title = 'Zoom in';
  btnIn.style.marginRight = '6px';
  btnIn.addEventListener('click', function(){ setZoom(zoom * 1.2); });
  var btnReset = document.createElement('button');
  btnReset.textContent = 'Reset';
  btnReset.title = 'Reset zoom (0)';
  btnReset.addEventListener('click', function(){ setZoom(1.0); });
  var zval = document.createElement('span');
  zval.id = 'zoom-val';
  zval.style.marginLeft = '8px';
  zval.style.opacity = '0.85';
  function updateZoomLabel(){ zval.textContent = (zoom*100).toFixed(0) + '%'; }
  updateZoomLabel();
  // Hook into setZoom to update label
  var _setZoom = setZoom;
  setZoom = function(z){ _setZoom(z); updateZoomLabel(); };
  zoomWrap.appendChild(label);
  zoomWrap.appendChild(btnOut);
  zoomWrap.appendChild(btnIn);
  zoomWrap.appendChild(btnReset);
  zoomWrap.appendChild(zval);
  container.appendChild(zoomWrap);
  }
};

// Create the instance
var myp5_1 = new p5(sketch1, 'canvas-container-1');