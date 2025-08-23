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
  // Expose a global helper to clear dopants from external UI
  p.clearDopants = function(){ dopants = []; dragging = false; dragType = null; initDopingMap(); freeElectrons = []; freeHoles = []; };
  window.clearNpnDopants = p.clearDopants;
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
          p.fill(180);
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
          freeElectrons.push({ region: regionIndex, ux: ux, uy: uy, vx: (Math.random()*0.02-0.01), vy: (Math.random()*0.02-0.01) });
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
          freeHoles.push({ region: regionIndexB, ux: uxb, uy: uyb, vx: (Math.random()*0.004-0.002), vy: (Math.random()*0.004-0.002) });
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
    p.fill(255, 210, 60); // golden color
    var damp = 0.98;
    for (var i = 0; i < freeElectrons.length; i++) {
      var e = freeElectrons[i];
      // Random walk in normalized space
      e.vx += (Math.random()*0.01 - 0.005);
      e.vy += (Math.random()*0.01 - 0.005);
      e.vx *= damp; e.vy *= damp;
      e.ux += e.vx; e.uy += e.vy;
      // Bounce off 0..1 bounds with a small margin
      if (e.ux < 0.02) { e.ux = 0.02; e.vx *= -0.8; }
      if (e.ux > 0.98) { e.ux = 0.98; e.vx *= -0.8; }
      if (e.uy < 0.02) { e.uy = 0.02; e.vy *= -0.8; }
      if (e.uy > 0.98) { e.uy = 0.98; e.vy *= -0.8; }
      // Map normalized to current rectangle bounds
      var xL = e.region === 0 ? grid.x1 : (e.region === 1 ? grid.x2 : grid.x3);
      var xR = e.region === 0 ? grid.x2 : (e.region === 1 ? grid.x3 : grid.x4);
      var px = xL + e.ux * (xR - xL);
      var py = grid.y1 + e.uy * (grid.y2 - grid.y1);
      p.circle(px, py, 6);
    }
    p.pop();
  }

  function simulateAndDrawFreeHoles(p, grid) {
    if (!grid || freeHoles.length === 0) return;
    p.push();
    var damp = 0.995; // much slower
    var maxV = 0.003; // cap per-axis speed
    for (var i = 0; i < freeHoles.length; i++) {
      var h = freeHoles[i];
      // Gentle random walk
      h.vx += (Math.random()*0.002 - 0.001);
      h.vy += (Math.random()*0.002 - 0.001);
      h.vx *= damp; h.vy *= damp;
      // Clamp speeds
      if (h.vx > maxV) h.vx = maxV; if (h.vx < -maxV) h.vx = -maxV;
      if (h.vy > maxV) h.vy = maxV; if (h.vy < -maxV) h.vy = -maxV;
      h.ux += h.vx; h.uy += h.vy;
      // Bounds
      if (h.ux < 0.02) { h.ux = 0.02; h.vx *= -0.7; }
      if (h.ux > 0.98) { h.ux = 0.98; h.vx *= -0.7; }
      if (h.uy < 0.02) { h.uy = 0.02; h.vy *= -0.7; }
      if (h.uy > 0.98) { h.uy = 0.98; h.vy *= -0.7; }
      // Map to rectangle
      var xL = h.region === 0 ? grid.x1 : (h.region === 1 ? grid.x2 : grid.x3);
      var xR = h.region === 0 ? grid.x2 : (h.region === 1 ? grid.x3 : grid.x4);
      var px = xL + h.ux * (xR - xL);
      var py = grid.y1 + h.uy * (grid.y2 - grid.y1);
      // Render: black fill, golden stroke, slightly larger than electron
      p.stroke(255, 210, 60);
      p.strokeWeight(2);
      p.fill(0);
      p.circle(px, py, 10);
    }
    p.pop();
  }

  function pointInCircle(x, y, cx, cy, r) {
    var dx = x - cx, dy = y - cy; return (dx*dx + dy*dy) <= r*r;
  }
  // No rect hit-test needed any more (button moved to external controls)
};

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
  p.fill(190);
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
  p.fill(190);
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
  container.__npnControlsBuilt = true;
}
