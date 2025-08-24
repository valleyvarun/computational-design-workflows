// NPN transistor doping visualization (Phase 1: Silicon lattice)
// p5.js instance mode sketch rendering three regions (N, P, N) with a grid of silicon atoms.

var npnSketch = function(p) {
  var canvas;
  var cols = 15;          // atoms per row (supports N=6, P=3, N=6)
  var rows = 8;           // atoms per column
  var margin = 24;        // outer margin
  var regionGap = 0;      // no gap between regions (contiguous N-P-N)
  var atomSpacing = 64;   // nominal spacing between atom centers (scaled)
  var atomR = 3 * Math.cbrt(28); // silicon nucleus radius (3 × cube root of 28)
  var electronR = 3;      // electron radius (small grey dots)
  var overlayW = 460;     // dopants overlay width (wider)
  var overlayH = 70;      // dopants overlay height (more compact)
  // Drag-and-drop dopants state
  var dopants = [];       // { type: 'P'|'B', x, y }
  var dragging = false;
  var dragType = null;    // 'P' or 'B'
  var dragPos = { x: 0, y: 0 };
  var lastOverlay = null; // store overlay layout for hit-testing
  var lastGrid = null;    // store last computed grid geometry for hit-testing/snap
  // Lattice doping map: 'Si' | 'P' | 'B' for each [row][col]
  var dopingMap = [];
  // Free electrons (golden) that float inside a rectangle when P is placed
  var freeElectrons = []; // { region: 0|1|2, ux:0..1, uy:0..1, vx, vy }
  // Holes (golden outline, black fill) spawned when B is placed
  var freeHoles = [];     // { region: 0|1|2, ux:0..1, uy:0..1, vx, vy }

  function initDopingMap() {
    dopingMap = new Array(rows);
    for (var r = 0; r < rows; r++) {
      dopingMap[r] = new Array(cols);
      for (var c = 0; c < cols; c++) dopingMap[r][c] = 'Si';
    }
  }
  var controlsBuilt = false;

  function computeCanvasSize() {
    var parent = document.getElementById('canvas-container-2');
    var w = parent ? parent.clientWidth : p.windowWidth;
    var h = Math.min(p.windowHeight, Math.round(w * 9 / 16));
    return { w: w, h: h };
  }

  p.setup = function() {
    var sz = computeCanvasSize();
    canvas = p.createCanvas(sz.w, sz.h);
    canvas.parent('canvas-container-2');
    p.textFont('Roboto, sans-serif');
  // Expose helpers to external UI
  p.clearDopants = function(){ dopants = []; dragging = false; dragType = null; initDopingMap(); freeElectrons = []; freeHoles = []; };
  window.clearNpnDopants = p.clearDopants;

  // Checker: validate dopant placement and return { ok, msg }
  p.checkNpnWafer = function(){
    var n1Cols = 6, pCols = 3; // column splits (left N, middle P, right N)
    var n2Cols = 6;
    var left = { P: 0, B: 0, total: 0 };
    var mid  = { P: 0, B: 0, total: 0 };
    var right= { P: 0, B: 0, total: 0 };
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var t = dopingMap[r][c];
        if (t === 'Si') continue;
        if (c < n1Cols) {
          left.total++; if (t === 'P') left.P++; else if (t === 'B') left.B++;
        } else if (c < n1Cols + pCols) {
          mid.total++; if (t === 'P') mid.P++; else if (t === 'B') mid.B++;
        } else {
          right.total++; if (t === 'P') right.P++; else if (t === 'B') right.B++;
        }
      }
    }
    var sizeLeft = 6 * rows, sizeMid = 3 * rows, sizeRight = 6 * rows;
    var tooManyLeft = left.total > Math.floor(sizeLeft * 0.25);
    var tooManyMid = mid.total > Math.floor(sizeMid * 0.25);
    var tooManyRight = right.total > Math.floor(sizeRight * 0.25);

    var errors = [];
    // Missing dopants in any region
    if (left.total === 0) errors.push('Left N has no dopants');
    if (mid.total === 0) errors.push('P has no dopants');
    if (right.total === 0) errors.push('Right N has no dopants');
    // Wrong dopant types in regions
    if (left.B > 0) errors.push('Boron found in left N region');
    if (right.B > 0) errors.push('Boron found in right N region');
    if (mid.P > 0) errors.push('Phosphorus found in P region');
    // Required placements present?
    if (mid.B === 0) errors.push('No boron in P region');
    if (left.P === 0) errors.push('No phosphorus in left N region');
    if (right.P === 0) errors.push('No phosphorus in right N region');
    // Excessive doping
    var tooManyMsgs = [];
    if (tooManyLeft) tooManyMsgs.push('Left N (' + left.total + '/' + sizeLeft + ')');
    if (tooManyMid) tooManyMsgs.push('P (' + mid.total + '/' + sizeMid + ')');
    if (tooManyRight) tooManyMsgs.push('Right N (' + right.total + '/' + sizeRight + ')');
    if (tooManyMsgs.length) errors.push('Too many dopants in: ' + tooManyMsgs.join(', '));

    if (errors.length === 0) {
      return { ok: true, msg: 'This npn wafer will work!' };
    } else {
      return { ok: false, msg: 'Issue: ' + errors.join(' | ') };
    }
  };
  window.checkNpnWafer = p.checkNpnWafer;
  initDopingMap();
  buildControls2();
  };

  p.windowResized = function() {
    var sz = computeCanvasSize();
    p.resizeCanvas(sz.w, sz.h);
  };

  p.draw = function() {
  p.background(18); // dark grey base outside the rectangles

  // (Removed full-canvas region backgrounds; we'll draw backgrounds inside grid rectangles only)

  // Titles will be drawn after computing grid bounds so they align with rectangles

  // Compute grid area bounds
  var gridLeft = margin;
  var gridRight = p.width - margin;
  // Reserve space for the centered overlay at the top
  var reservedTop = 6 + overlayH + 6; // smaller top pad + height + tighter gap
  var gridTop = Math.max(margin + 16, reservedTop);
  var gridBottom = p.height - margin;

    // Adjust spacing based on available area
    var availW = gridRight - gridLeft;
    var availH = gridBottom - gridTop;
    var sx = availW / (cols - 1);
    var sy = availH / (rows - 1);
    var spacing = Math.min(atomSpacing, sx, sy);

    // Recompute start to center the grid
    var gridW = spacing * (cols - 1);
    var gridH = spacing * (rows - 1);
  var startX = Math.round(gridLeft + (availW - gridW) / 2);
  var startY = Math.round(gridTop + (availH - gridH) / 2);

  // Compute grid rectangles for N (6 cols), P (3 cols), N (6 cols) and draw light backgrounds inside these
  var n1Cols = 6;
  var pCols  = 3;
  var hs = spacing * 0.5; // half-spacing for boundaries
  var x1 = startX - hs;                               // left outer boundary
  var x2 = startX + (n1Cols - 0.5) * spacing;         // after first N region
  var x3 = startX + (n1Cols + pCols - 0.5) * spacing; // after P region
  var x4 = startX + (cols - 0.5) * spacing;           // right outer boundary
  var y1 = startY - hs;                               // top boundary
  var y2 = startY + (rows - 0.5) * spacing;           // bottom boundary

  // Light backgrounds inside rectangles (inset by 1px to avoid covering borders)
  p.noStroke();
  p.fill(20, 20, 28);
  p.rect(x1 + 1, y1 + 1, (x2 - x1) - 2, (y2 - y1) - 2);
  p.fill(26, 26, 34);
  p.rect(x2 + 1, y1 + 1, (x3 - x2) - 2, (y2 - y1) - 2);
  p.fill(20, 20, 28);
  p.rect(x3 + 1, y1 + 1, (x4 - x3) - 2, (y2 - y1) - 2);

  // Draw silicon atoms and orbiting electrons
    p.stroke(230);
    p.fill(255, 255, 255, 15);
    p.textSize(12);

    var t = p.millis() * 0.0012; // animate electrons slowly
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cx = startX + c * spacing;
        var cy = startY + r * spacing;
        var cellType = dopingMap[r][c];
        if (cellType === 'Si') {
          // Atom nucleus
          p.stroke(230);
          p.strokeWeight(1);
          p.fill(245, 245, 245, 210);
          p.circle(cx, cy, atomR * 2);

          // Si label
          p.noStroke();
          p.fill(20);
          p.textAlign(p.CENTER, p.CENTER);
          p.text('Si', cx, cy + 1);

          // Four electrons orbiting (phase shifted)
          var orbitR = atomR + 10;
          var phases = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
          p.fill(190, 110); // light grey with reduced opacity for regular electrons
          for (var k = 0; k < 4; k++) {
            var ang = t + phases[k];
            var ex = cx + orbitR * Math.cos(ang);
            var ey = cy + orbitR * Math.sin(ang);
            p.circle(ex, ey, electronR * 2);
          }
        } else {
          // Draw dopant in place of Si (placed=true)
          drawDopant(p, cellType, cx, cy, true);
        }
      }
    }

  // Region borders (thin white rectangles) around the silicon grid only (using computed x1..x4,y1..y2)

  p.noFill();
  p.stroke(255);
  p.strokeWeight(1);
  // Align to pixel grid for crisp edges
  p.rect(x1 + 0.5, y1 + 0.5, (x2 - x1) - 1, (y2 - y1) - 1);
  p.rect(x2 + 0.5, y1 + 0.5, (x3 - x2) - 1, (y2 - y1) - 1);
  p.rect(x3 + 0.5, y1 + 0.5, (x4 - x3) - 1, (y2 - y1) - 1);

  // Labels centered horizontally under each rectangle
  p.fill(210);
  p.noStroke();
  p.textSize(18); // larger labels
  p.textStyle(p.BOLD);
  p.textAlign(p.CENTER, p.TOP);
  var labelY = y2 + 10; // small offset below rectangles
  p.text('N', (x1 + x2) * 0.5, labelY);
  p.text('P', (x2 + x3) * 0.5, labelY);
  p.text('N', (x3 + x4) * 0.5, labelY);
  // Labels centered horizontally above each rectangle
  p.textAlign(p.CENTER, p.BOTTOM);
  var labelYTop = y1 - 10; // small offset above rectangles
  p.text('N', (x1 + x2) * 0.5, labelYTop);
  p.text('P', (x2 + x3) * 0.5, labelYTop);
  p.text('N', (x3 + x4) * 0.5, labelYTop);
  p.textStyle(p.NORMAL);

  // Snapshot grid geometry for snapping on drop
  lastGrid = {
    startX: startX,
    startY: startY,
    spacing: spacing,
    cols: cols,
    rows: rows,
    x1: x1, x2: x2, x3: x3, x4: x4,
    y1: y1, y2: y2
  };

  // Simulate and draw free electrons (use current rectangle bounds)
  simulateAndDrawFreeElectrons(p, lastGrid);
  // Simulate and draw holes (use current rectangle bounds)
  simulateAndDrawFreeHoles(p, lastGrid);

    // Overlay for dopants (similar style to Lorenz box)
    // Draw overlay and keep its layout for hit testing
    lastOverlay = drawDopantsOverlay(p, overlayW, overlayH);

    // Draw placed dopants
    for (var d = 0; d < dopants.length; d++) {
      drawDopant(p, dopants[d].type, dopants[d].x, dopants[d].y);
    }

    // Draw dragging preview
    if (dragging && dragType) {
      drawDopant(p, dragType, dragPos.x, dragPos.y);
    }
  };

  // Mouse interactions for dragging from overlay
  p.mousePressed = function() {
  if (!lastOverlay) return;
    var mx = p.mouseX, my = p.mouseY;
    // Check if press started on P or B sample in overlay
    if (pointInCircle(mx, my, lastOverlay.px, lastOverlay.cy, lastOverlay.rP + 6)) {
      dragging = true; dragType = 'P'; dragPos.x = mx; dragPos.y = my; return;
    }
    if (pointInCircle(mx, my, lastOverlay.bx, lastOverlay.cy, lastOverlay.rB + 6)) {
      dragging = true; dragType = 'B'; dragPos.x = mx; dragPos.y = my; return;
    }
  };
  p.mouseDragged = function() {
    if (!dragging) return;
    dragPos.x = p.mouseX; dragPos.y = p.mouseY;
  };
  p.mouseReleased = function() {
    if (!dragging) return;
    // If released over the lattice rectangles, replace nearest Si atom
    if (lastGrid) {
      var gx = lastGrid;
      var mx = dragPos.x, my = dragPos.y;
      if (mx >= gx.x1 && mx <= gx.x4 && my >= gx.y1 && my <= gx.y2) {
        // Map to nearest lattice indices
        var c = Math.round((mx - gx.startX) / gx.spacing);
        var r = Math.round((my - gx.startY) / gx.spacing);
        // Clamp to bounds
        c = Math.max(0, Math.min(gx.cols - 1, c));
        r = Math.max(0, Math.min(gx.rows - 1, r));
        var prev = dopingMap[r][c];
        dopingMap[r][c] = dragType;
        // Spawn a golden electron only when placing P into a previously Si site
        if (dragType === 'P' && prev === 'Si') {
          var cx = gx.startX + c * gx.spacing;
          var regionIndex = (cx < gx.x2) ? 0 : (cx < gx.x3 ? 1 : 2);
          var xL = regionIndex === 0 ? gx.x1 : (regionIndex === 1 ? gx.x2 : gx.x3);
          var xR = regionIndex === 0 ? gx.x2 : (regionIndex === 1 ? gx.x3 : gx.x4);
          var ux = (mx - xL) / (xR - xL);
          var uy = (my - gx.y1) / (gx.y2 - gx.y1);
          ux = Math.max(0.05, Math.min(0.95, ux));
          uy = Math.max(0.05, Math.min(0.95, uy));
          // Lower initial velocities
          freeElectrons.push({ region: regionIndex, ux: ux, uy: uy, vx: (Math.random()*0.004-0.002), vy: (Math.random()*0.004-0.002), bornAt: p.millis() });
        }
        // Spawn a hole only when placing B into a previously Si site
        if (dragType === 'B' && prev === 'Si') {
          var cxb = gx.startX + c * gx.spacing;
          var regionIndexB = (cxb < gx.x2) ? 0 : (cxb < gx.x3 ? 1 : 2);
          var xLB = regionIndexB === 0 ? gx.x1 : (regionIndexB === 1 ? gx.x2 : gx.x3);
          var xRB = regionIndexB === 0 ? gx.x2 : (regionIndexB === 1 ? gx.x3 : gx.x4);
          var uxb = (mx - xLB) / (xRB - xLB);
          var uyb = (my - gx.y1) / (gx.y2 - gx.y1);
          uxb = Math.max(0.05, Math.min(0.95, uxb));
          uyb = Math.max(0.05, Math.min(0.95, uyb));
          // Lower initial velocities
          freeHoles.push({ region: regionIndexB, ux: uxb, uy: uyb, vx: (Math.random()*0.002-0.001), vy: (Math.random()*0.002-0.001), bornAt: p.millis() });
        }
      }
    }
    // Do not create free-floating dopants; only placement on lattice
    dragging = false; dragType = null;
  };

  function simulateAndDrawFreeElectrons(p, grid) {
    if (!grid || freeElectrons.length === 0) return;
    p.push();
    p.noStroke();
    p.fill(0, 255, 255);

    // Global geometry
    var totalW = grid.x4 - grid.x1;
    var totalH = grid.y2 - grid.y1;

    // Stability and interaction constants (gentle)
    var damp = 0.992;
    var baseMaxV = 0.01;
    var maxA = 0.0015;
  var kRep = 0.0010;     // e–e repulsion (local) [legacy]
  var kRepG = 0.0008;    // e–e repulsion (global normalized across rectangles)
    var kAttCg = 0.0008;   // e–h Coulomb-like (global normalized)
    var kAttLg = 0.00012;  // e–h spring-like (global normalized)
    var eps2Local = 0.001; // softening in local space
    var eps2Global = 0.0003; // softening in global normalized space
  var now = p.millis();
  var delayMs = 4000;   // wander ~4s before forces
  var rampMs = 150;     // quick ramp to full force

    // Speed scaling: more electrons -> slower electrons
    var N = freeElectrons.length;
    var speedScale = 1 / (1 + 0.25 * Math.max(0, N - 1)); // 1, 0.8, 0.67, 0.57, ...
    var maxV = baseMaxV * speedScale;

    function regionBounds(region) {
      var xL = region === 0 ? grid.x1 : (region === 1 ? grid.x2 : grid.x3);
      var xR = region === 0 ? grid.x2 : (region === 1 ? grid.x3 : grid.x4);
      return { xL: xL, xR: xR, y1: grid.y1, y2: grid.y2, w: xR - xL, h: totalH };
    }
    function toPixel(pos) {
      var rb = regionBounds(pos.region);
      return { x: rb.xL + pos.ux * rb.w, y: rb.y1 + pos.uy * rb.h };
    }
    function toGlobalNorm(px, py) {
      return { gx: (px - grid.x1) / totalW, gy: (py - grid.y1) / totalH };
    }

    for (var i = 0; i < freeElectrons.length; i++) {
      var e = freeElectrons[i];
      var rbE = regionBounds(e.region);

      var ax = 0, ay = 0;
      var minHoleRg = Infinity;

      // Compute electron position once in global normalized space
      var ePix = toPixel(e);
      var eg = toGlobalNorm(ePix.x, ePix.y);
      var scaleXLocalFromGlobal = totalW / rbE.w; // convert global accel to local x units

      // e–e repulsion across all rectangles (global normalized space)
      for (var j = 0; j < freeElectrons.length; j++) {
        if (i === j) continue;
        var e2 = freeElectrons[j];
        var e2Pix = toPixel(e2);
        var e2g = toGlobalNorm(e2Pix.x, e2Pix.y);
        var dxgEE = eg.gx - e2g.gx;
        var dygEE = eg.gy - e2g.gy;
        var r2gEE = dxgEE*dxgEE + dygEE*dygEE + eps2Global;
        var rgEE = Math.sqrt(r2gEE);
        var invRgEE = 1 / rgEE;
        var invR3gEE = invRgEE * invRgEE * invRgEE;
        var axgEE = kRepG * dxgEE * invR3gEE;
        var aygEE = kRepG * dygEE * invR3gEE;
        ax += axgEE * scaleXLocalFromGlobal;
        ay += aygEE;
      }

      // e–h attraction across all rectangles (compute in global normalized space)
      // (uses eg computed above)

      for (var h = 0; h < freeHoles.length; h++) {
        var hole = freeHoles[h];
        var hPix = toPixel(hole);
        var hg = toGlobalNorm(hPix.x, hPix.y);
        var dxg = hg.gx - eg.gx;
        var dyg = hg.gy - eg.gy;
        var r2g = dxg*dxg + dyg*dyg + eps2Global;
        var rg = Math.sqrt(r2g);
        if (rg < minHoleRg) minHoleRg = rg;
        var invRg = 1 / rg;
        var invR3g = invRg * invRg * invRg;

        // Proximity scaling to avoid bursts
        var near = rg < 0.03 ? 0.4 : 1.0;

        // Global Coulomb-like term then map to local
        var axg = near * kAttCg * dxg * invR3g + kAttLg * dxg;
        var ayg = near * kAttCg * dyg * invR3g + kAttLg * dyg;
        ax += axg * scaleXLocalFromGlobal;
        ay += ayg; // y scale is same across rectangles
      }

      // NEW: weak repulsion from orbiting "normal" electrons (same region only)
      (function repelFromNormalElectrons(){
        var tElect = p.millis() * 0.0012; // match Si orbit animation speed
        var xLpix = rbE.xL, wPix = rbE.w, hPix = totalH;
        var kRepN = 0.00005;  // further weakened repulsion from normal electrons
        var eps2N = 0.002;    // increased softening to reduce near-field effect
        for (var rr = 0; rr < grid.rows; rr++) {
          for (var cc = 0; cc < grid.cols; cc++) {
            var cx = grid.startX + cc * grid.spacing;
            var regionIdx = (cx < grid.x2) ? 0 : (cx < grid.x3 ? 1 : 2);
            if (regionIdx !== e.region) continue;
            var cy = grid.startY + rr * grid.spacing;
            var cellType = dopingMap[rr][cc];

            if (cellType === 'Si') {
              var orbitR = atomR + 10;
              var phases = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
              for (var k = 0; k < 4; k++) {
                var ang = tElect + phases[k];
                var ex = cx + orbitR * Math.cos(ang);
                var ey = cy + orbitR * Math.sin(ang);
                var dxn = e.ux - (ex - grid.startX) / wPix;
                var dyn = e.uy - (ey - grid.startY) / hPix;
                var r2n = dxn*dxn + dyn*dyn + eps2N;
                var invRn = 1 / Math.sqrt(r2n);
                var invR3n = invRn * invRn * invRn;
                ax += kRepN * dxn * invR3n;
                ay += kRepN * dyn * invR3n;
              }
            }
          }
        }
      })();

  // Age-based force ramp: wander first, then engage forces smoothly
  if (e.bornAt == null) e.bornAt = now; // default for older items
  var age = now - e.bornAt;
  var rf = Math.max(0, Math.min(1, (age - delayMs) / rampMs));
  ax *= rf; ay *= rf;

      // Minor jitter; smaller when near a hole
      var jitter = minHoleRg < 0.03 ? 0.0002 : 0.0004;
      e.vx += (Math.random()*2*jitter - jitter);
      e.vy += (Math.random()*2*jitter - jitter);

      // Cap total acceleration
      var aMag = Math.hypot(ax, ay);
      if (aMag > maxA) { ax *= maxA / aMag; ay *= maxA / aMag; }

      // Integrate with damping
      e.vx = (e.vx + ax) * damp;
      e.vy = (e.vy + ay) * damp;

      // Extra braking near a hole
      if (minHoleRg < 0.03) { e.vx *= 0.9; e.vy *= 0.9; }

      // Clamp velocities (scaled by electron count)
      if (e.vx > maxV) e.vx = maxV; if (e.vx < -maxV) e.vx = -maxV;
      if (e.vy > maxV) e.vy = maxV; if (e.vy < -maxV) e.vy = -maxV;

      // Integrate position
      e.ux += e.vx; e.uy += e.vy;

      // Bounds with gentle bounce
      if (e.ux < 0.02) { e.ux = 0.02; e.vx *= -0.8; }
      if (e.ux > 0.98) { e.ux = 0.98; e.vx *= -0.8; }
      if (e.uy < 0.02) { e.uy = 0.02; e.vy *= -0.8; }
      if (e.uy > 0.98) { e.uy = 0.98; e.vy *= -0.8; }

      // Draw in pixel space
      var xL = rbE.xL, xR = rbE.xR;
      var px = xL + e.ux * (xR - xL);
      var py = grid.y1 + e.uy * (grid.y2 - grid.y1);
      p.circle(px, py, 6);
    }
    p.pop();
  }

  function simulateAndDrawFreeHoles(p, grid) {
    if (!grid || freeHoles.length === 0) return;
    p.push();

    var totalW = grid.x4 - grid.x1;
    var totalH = grid.y2 - grid.y1;

    // Gentle parameters for holes
    var damp = 0.998;
    var maxV = 0.0015;
    var maxA = 0.0008;
    var kAttCg = 0.0006;  // weaker than electrons
    var kAttLg = 0.00008;
    var eps2Global = 0.0003;
    // Hole–hole repulsion (local normalized space)
    var kRepH = 0.0007;
    var eps2LocalH = 0.001;
  var now = p.millis();
  var delayMs = 4000;   // wander ~4s before forces
  var rampMs = 150;     // quick ramp to full force

    function regionBounds(region) {
      var xL = region === 0 ? grid.x1 : (region === 1 ? grid.x2 : grid.x3);
      var xR = region === 0 ? grid.x2 : (region === 1 ? grid.x3 : grid.x4);
      return { xL: xL, xR: xR, y1: grid.y1, y2: grid.y2, w: xR - xL, h: totalH };
    }
    function toPixel(pos) {
      var rb = regionBounds(pos.region);
      return { x: rb.xL + pos.ux * rb.w, y: rb.y1 + pos.uy * rb.h };
    }
    function toGlobalNorm(px, py) {
      return { gx: (px - grid.x1) / totalW, gy: (py - grid.y1) / totalH };
    }

    for (var i = 0; i < freeHoles.length; i++) {
      var h = freeHoles[i];
      var rbH = regionBounds(h.region);

      var ax = 0, ay = 0;
      var minElecRg = Infinity;

      // Hole–hole repulsion within same region (local normalized)
      for (var j = 0; j < freeHoles.length; j++) {
        if (i === j) continue;
        var h2 = freeHoles[j];
        if (h2.region !== h.region) continue;
        var dxh = h.ux - h2.ux;
        var dyh = h.uy - h2.uy;
        var r2h = dxh*dxh + dyh*dyh + eps2LocalH;
        var invRh = 1 / Math.sqrt(r2h);
        var invR3h = invRh * invRh * invRh;
        ax += kRepH * dxh * invR3h;
        ay += kRepH * dyh * invR3h;
      }

      var hPix = toPixel(h);
      var hg = toGlobalNorm(hPix.x, hPix.y);
      var scaleXLocalFromGlobal = totalW / rbH.w;

      // Attract to all electrons across rectangles
      for (var e = 0; e < freeElectrons.length; e++) {
        var el = freeElectrons[e];
        var ePix = toPixel(el);
        var eg = toGlobalNorm(ePix.x, ePix.y);
        var dxg = eg.gx - hg.gx;
        var dyg = eg.gy - hg.gy;
        var r2g = dxg*dxg + dyg*dyg + eps2Global;
        var rg = Math.sqrt(r2g);
        if (rg < minElecRg) minElecRg = rg;
        var invRg = 1 / rg;
        var invR3g = invRg * invRg * invRg;

        var near = rg < 0.03 ? 0.45 : 1.0;

        var axg = near * kAttCg * dxg * invR3g + kAttLg * dxg;
        var ayg = near * kAttCg * dyg * invR3g + kAttLg * dyg;
        ax += axg * scaleXLocalFromGlobal;
        ay += ayg;
      }

  // Age-based force ramp
  if (h.bornAt == null) h.bornAt = now;
  var age = now - h.bornAt;
  var rf = Math.max(0, Math.min(1, (age - delayMs) / rampMs));
  ax *= rf; ay *= rf;

      // Minor jitter, smaller when very close
      var jitter = minElecRg < 0.03 ? 0.00015 : 0.0003;
      h.vx += (Math.random()*2*jitter - jitter);
      h.vy += (Math.random()*2*jitter - jitter);

      // Cap acceleration
      var aMag = Math.hypot(ax, ay);
      if (aMag > maxA) { ax *= maxA / aMag; ay *= maxA / aMag; }

      // Integrate with damping
      h.vx = (h.vx + ax) * damp;
      h.vy = (h.vy + ay) * damp;

      // Extra braking near electrons
      if (minElecRg < 0.03) { h.vx *= 0.9; h.vy *= 0.9; }

      // Clamp speeds
      if (h.vx > maxV) h.vx = maxV; if (h.vx < -maxV) h.vx = -maxV;
      if (h.vy > maxV) h.vy = maxV; if (h.vy < -maxV) h.vy = -maxV;

      h.ux += h.vx; h.uy += h.vy;

      // Bounds
      if (h.ux < 0.02) { h.ux = 0.02; h.vx *= -0.7; }
      if (h.ux > 0.98) { h.ux = 0.98; h.vx *= -0.7; }
      if (h.uy < 0.02) { h.uy = 0.02; h.vy *= -0.7; }
      if (h.uy > 0.98) { h.uy = 0.98; h.vy *= -0.7; }

      // Draw
      var px = rbH.xL + h.ux * rbH.w;
      var py = grid.y1 + h.uy * (grid.y2 - grid.y1);
      p.push();
      p.stroke(0, 255, 255); // cyan holes
      p.strokeWeight(2);
      p.noFill();
      p.circle(px, py, 10);
      p.pop();
    }
    p.pop();
  }
// Helper inside sketch
  function pointInCircle(x, y, cx, cy, r) {
    var dx = x - cx, dy = y - cy; return (dx*dx + dy*dy) <= r*r;
  }
  // No rect hit-test needed any more (button moved to external controls)
};
// ...existing code...
function drawDopantsOverlay(p, boxW, boxH){
  // Draw a semi-transparent white box with "Dopants:" and two atoms (P, B), centered at top
  var pad = 6; // tighter
  var w = Math.min(p.width - 20, boxW);
  var x = Math.round((p.width - w) / 2);
  var y = pad;

  p.push();
  p.noStroke();
  // Match background color (dark grey) for the box
  p.fill(18);
  p.rect(x, y, w, boxH, 8);

  // External controls will host Reset; no in-canvas button

  // Atoms row (centered)
  var cy = y + Math.round(boxH * 0.5) - 4; // nudge up slightly
  var rP = 3 * Math.cbrt(30); // Phosphorus radius
  var rB = 3 * Math.cbrt(10); // Boron radius
  p.textAlign(p.CENTER, p.CENTER);
  // Phosphorus (orange)
  var px = Math.round(x + w * (1/3));
  p.noStroke();
  p.fill(255, 160, 40);
  p.circle(px, cy, rP * 2);
  p.fill(0);
  p.textSize(12); // match Si label size
  p.textStyle(p.BOLD);
  p.text('P', px, cy + 1);
  p.textStyle(p.NORMAL);
  // Boron (pink)
  var bx = Math.round(x + w * (2/3));
  p.noStroke();
  p.fill(255, 120, 170);
  p.circle(bx, cy, rB * 2);
  p.fill(0);
  p.textSize(12); // match Si label size
  p.textStyle(p.BOLD);
  p.text('B', bx, cy + 1);
  p.textStyle(p.NORMAL);

  // Revolving electrons (anti-clockwise): P has 5, B has 3
  var t = p.millis() * 0.002; // animation speed
  var eR = 3;
  var orbitRP = rP + 12;
  var orbitRB = rB + 12;
  p.noStroke();
  p.fill(190, 110); // light grey with reduced opacity for overlay electrons
  for (var i = 0; i < 5; i++) {
    var ang = -t + i * (2 * Math.PI / 5);
    var ex = px + orbitRP * Math.cos(ang);
    var ey = cy + orbitRP * Math.sin(ang);
    p.circle(ex, ey, eR * 2);
  }
  for (var j = 0; j < 3; j++) {
    var ang2 = -t + j * (2 * Math.PI / 3);
    var ex2 = bx + orbitRB * Math.cos(ang2);
    var ey2 = cy + orbitRB * Math.sin(ang2);
    p.circle(ex2, ey2, eR * 2);
  }
  p.pop();
  // Return layout for hit-testing
  return { x: x, y: y, w: w, h: boxH, px: px, bx: bx, cy: cy, rP: rP, rB: rB };
}

function drawDopant(p, type, x, y, placed) {
  var spec = (type === 'P')
    ? { color: [255,160,40], label: 'P', r: 3*Math.cbrt(30), electrons: 5 }
    : { color: [255,120,170], label: 'B', r: 3*Math.cbrt(10), electrons: 3 };
  var t = p.millis() * 0.002;
  var orbitR = spec.r + 12;
  // nucleus
  p.push();
  p.noStroke();
  p.fill(spec.color[0], spec.color[1], spec.color[2]);
  p.circle(x, y, spec.r * 2);
  // label
  p.fill(0);
  p.textSize(12); // match Si label size
  p.textStyle(p.BOLD);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(spec.label, x, y + 1);
  p.textStyle(p.NORMAL);
  // electrons
  p.fill(190, 110); // light grey with reduced opacity for dopant electrons
  var electronCount = (placed && type === 'P') ? 4 : spec.electrons;
  for (var i = 0; i < electronCount; i++) {
    var ang = -t + i * (2 * Math.PI / electronCount);
    var ex = x + orbitR * Math.cos(ang);
    var ey = y + orbitR * Math.sin(ang);
    p.circle(ex, ey, 6);
  }
  p.pop();
}

// Create the instance
var npnP5 = new p5(npnSketch, 'canvas-container-2');

// Build external controls for NPN sketch
function buildControls2() {
  if (typeof document === 'undefined') return;
  var container = document.getElementById('controls-2');
  if (!container || container.__npnControlsBuilt) return;
  container.innerHTML = '';
  var resetBtn = document.createElement('button');
  resetBtn.textContent = 'reset silicon wafer';
  resetBtn.title = 'Remove all placed dopant atoms';
  resetBtn.addEventListener('click', function(){ if (window.clearNpnDopants) window.clearNpnDopants(); });
  container.appendChild(resetBtn);
  // Check button
  var checkBtn = document.createElement('button');
  checkBtn.textContent = 'check ✓';
  checkBtn.title = 'Validate dopant placement';
  checkBtn.style.marginLeft = '12px';
  container.appendChild(checkBtn);
  // Result label
  var resultSpan = document.createElement('span');
  resultSpan.style.marginLeft = '12px';
  resultSpan.style.color = '#ddd';
  resultSpan.style.fontSize = '14px';
  container.appendChild(resultSpan);
  // Wire up click
  checkBtn.addEventListener('click', function(){
    if (window.checkNpnWafer) {
      var res = window.checkNpnWafer();
      resultSpan.textContent = res.msg;
      resultSpan.style.color = res.ok ? '#00d084' : '#ff7070';
    }
  });
  container.__npnControlsBuilt = true;
}
