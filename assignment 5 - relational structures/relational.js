// D3-driven canvas renderer: force simulation + zoom/pan + node dragging.
// Requires d3 v7 to be loaded on the page.

const nodes = [
  { id: "🧠 Human-Computer Interaction" },
  { id: "📘 CAD" },
  { id: "🤖 AI" },
  { id: "🔰 Multimodal" },
  { id: "✏️ Drawing" },
  { id: "📊 Datasets" },
  { id: "🎨 Art" },
  { id: "💡 Creativity" }
];

const links = [
  // Directed edges requested by the user
  { source: "🎨 Art", target: "✏️ Drawing", directed: true },
    { source: "💡 Creativity", target: "✏️ Drawing", directed: true },

  { source: "✏️ Drawing", target: "🤖 AI", directed: true },
  { source: "✏️ Drawing", target: "📊 Datasets", directed: true },
  { source: "✏️ Drawing", target: "🧠 Human-Computer Interaction", directed: true },

  { source: "📊 Datasets", target: "🤖 AI", directed: true },
  { source: "🔰 Multimodal", target: "🤖 AI", directed: true },
    { source: "🔰 Multimodal", target: "📊 Datasets", directed: true },

  // Supporting undirected links for connectivity
  // mark HCI -> CAD as directed per request
  { source: "🧠 Human-Computer Interaction", target: "📘 CAD", directed: true },
  // add CAD -> Datasets (directed)
  { source: "📘 CAD", target: "📊 Datasets", directed: true },
  // add AI -> HCI (directed)
  { source: "🤖 AI", target: "🧠 Human-Computer Interaction", directed: true },
  // keep datasets->CAD for connectivity (optional)
  { source: "📊 Datasets", target: "📘 CAD" }
];

(function d3CanvasNetwork() {
  if (typeof d3 === 'undefined') {
    console.error('d3 is required for relational.js — please include d3 v7');
    return;
  }

  const canvas = document.getElementById('rel-canvas-1');
  if (!canvas) {
    console.warn('relational.js: canvas #rel-canvas-1 not found');
    return;
  }

  const ctx = canvas.getContext('2d');
  const dpr = Math.max(window.devicePixelRatio || 1, 1);

  // Initialize transform for zoom/pan
  let transform = d3.zoomIdentity;

  // create simulation copies
  const simNodes = nodes.map(d => Object.assign({}, d));
  const simLinks = links.map(l => ({ source: l.source, target: l.target, directed: !!l.directed }));

  const simulation = d3.forceSimulation(simNodes)
    .force('link', d3.forceLink(simLinks).id(d => d.id).distance(180).strength(0.2))
    .force('charge', d3.forceManyBody().strength(-350))
    .force('center', d3.forceCenter(0, 0))
    .alphaTarget(0.01)
    .on('tick', scheduleDraw);

  // sizing helper
  function resizeBackingStore() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    }
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line ? line + ' ' + words[n] : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        lines.push(line);
        line = words[n];
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // draw function uses current transform
  function draw() {
    resizeBackingStore();
    const rect = canvas.getBoundingClientRect();

    // draw background (CSS pixels) as dark grey
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1b1b1d'; // dark grey background
    ctx.fillRect(0, 0, rect.width, rect.height);

    // apply zoom/pan + DPR in one transform
    ctx.setTransform(dpr * transform.k, 0, 0, dpr * transform.k, dpr * transform.x, dpr * transform.y);

    // Draw links (with arrowheads for directed links)
    ctx.save();
    ctx.lineWidth = 2 / transform.k; // keep width consistent when zooming
    ctx.setLineDash([6 / transform.k, 4 / transform.k]);
    ctx.strokeStyle = 'rgba(160,120,255,0.9)';
    ctx.fillStyle = 'rgba(160,120,255,0.95)';

    // world-space node radius used for offsetting link endpoints and hit tests
    const nodeRadius = 36;

    simLinks.forEach(l => {
      const a = l.source;
      const b = l.target;
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;
      const ux = dx / len;
      const uy = dy / len;

      // offset so lines don't go under node circles
      const startX = a.x + ux * nodeRadius;
      const startY = a.y + uy * nodeRadius;
      const endX = b.x - ux * nodeRadius;
      const endY = b.y - uy * nodeRadius;

      // draw line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // arrowhead for directed links
      if (l.directed) {
        const headLen = 12 / transform.k;
        const hx = endX;
        const hy = endY;
        const leftX = hx - ux * headLen - uy * (headLen * 0.6);
        const leftY = hy - uy * headLen + ux * (headLen * 0.6);
        const rightX = hx - ux * headLen + uy * (headLen * 0.6);
        const rightY = hy - uy * headLen - ux * (headLen * 0.6);

        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(leftX, leftY);
        ctx.lineTo(rightX, rightY);
        ctx.closePath();
        ctx.fill();
      }
    });
    ctx.restore();

    // Draw nodes with labels inside the circles
    simNodes.forEach(n => {
      ctx.beginPath();
      ctx.fillStyle = '#a020f0';
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2 / transform.k;
      ctx.arc(n.x, n.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // labels: wrap and center inside the circle
      ctx.fillStyle = '#ffffff';
      // base font size scaled by zoom so text stays legible
      const baseFontPx = Math.max(10, 12 / transform.k);
      ctx.font = `${baseFontPx}px Roboto, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // approximate max text width inside circle (allow some padding)
      const maxTextWidth = nodeRadius * 1.6;
      let lines = wrapText(ctx, n.id, maxTextWidth);

      // If wrapped lines are too tall for the circle, reduce font size
      let lineHeight = baseFontPx * 1.1;
      while (lines.length * lineHeight > nodeRadius * 1.6 && baseFontPx > 8) {
        // shrink font and recompute lines
        baseFontPx -= 1;
        ctx.font = `${baseFontPx}px Roboto, Arial, sans-serif`;
        lineHeight = baseFontPx * 1.1;
        lines = wrapText(ctx, n.id, maxTextWidth);
      }

      // center vertically inside node
      const totalH = lines.length * lineHeight;
      const startY = n.y - totalH / 2 + lineHeight / 2;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], n.x, startY + i * lineHeight);
      }
    });
  }

  let raf = null;
  function scheduleDraw() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(draw);
  }

  // Zoom/pan using d3.zoom
  const d3canvas = d3.select(canvas);
  const zoom = d3.zoom()
    .scaleExtent([0.2, 4])
    .on('zoom', (event) => {
      transform = event.transform;
      scheduleDraw();
    });

  // helper: center the world origin on the canvas (initial view)
  function centerView() {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // compute bounding box of simulation nodes
    if (simNodes.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    simNodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
    });
    const bboxCx = (minX + maxX) / 2;
    const bboxCy = (minY + maxY) / 2;

    const k = transform && transform.k ? transform.k : 1;
    // translate so bbox center maps to canvas center
    const tx = cx - bboxCx * k;
    const ty = cy - bboxCy * k;
    const t = d3.zoomIdentity.translate(tx, ty).scale(k);
    d3canvas.call(zoom.transform, t);
    scheduleDraw();
  }

  // track node dragging
  let draggingNode = null;

  // helper to find node at screen pointer (account for transform)
  function pointerToWorld(event) {
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    // invert transform: world = (screen - translate)/k
    const x = (px - transform.x) / transform.k;
    const y = (py - transform.y) / transform.k;
    return { x, y };
  }

  function findNodeAt(event, radius = 36) {
    const p = pointerToWorld(event);
    for (let i = simNodes.length - 1; i >= 0; i--) {
      const n = simNodes[i];
      const dx = p.x - n.x;
      const dy = p.y - n.y;
      if (dx * dx + dy * dy <= radius * radius) return n;
    }
    return null;
  }

  // attach pointer handlers BEFORE calling d3.zoom so we can detect drags
  canvas.addEventListener('pointerdown', (ev) => {
    const node = findNodeAt(ev);
    if (node) {
      draggingNode = node;
      node.fx = node.x;
      node.fy = node.y;
      simulation.alphaTarget(0.3).restart();
      canvas.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    }
  });

  canvas.addEventListener('pointermove', (ev) => {
    if (!draggingNode) return;
    const p = pointerToWorld(ev);
    draggingNode.fx = p.x;
    draggingNode.fy = p.y;
    scheduleDraw();
  });

  canvas.addEventListener('pointerup', (ev) => {
    if (!draggingNode) return;
    draggingNode.fx = null;
    draggingNode.fy = null;
    simulation.alphaTarget(0);
    try { canvas.releasePointerCapture(ev.pointerId); } catch (e) {}
    draggingNode = null;
  });

  // Apply zoom to canvas
  d3canvas.call(zoom);

  // Initialize positions in a circle centered at (0,0)
  function initPositions() {
    const R = 220;
    simNodes.forEach((n, i) => {
      const a = (i / simNodes.length) * Math.PI * 2;
      n.x = Math.cos(a) * R;
      n.y = Math.sin(a) * R;
    });
  }
  initPositions();
  // center view after initial positions are set
  centerView();
  // re-center shortly after to allow the simulation to settle a bit
  setTimeout(() => { centerView(); }, 250);

  // Resize handling
  window.addEventListener('resize', () => { resizeBackingStore(); scheduleDraw(); });
  window.addEventListener('load', () => { resizeBackingStore(); centerView(); scheduleDraw(); });
  setTimeout(() => { resizeBackingStore(); centerView(); scheduleDraw(); }, 60);

  // start
  scheduleDraw();
})();
