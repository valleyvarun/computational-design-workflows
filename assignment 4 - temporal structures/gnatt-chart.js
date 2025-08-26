// gnatt-chart.js
// D3.js Gantt chart for B.Arch thesis process
// Project: Semiconductor Electronics Technology Park in Mysore

(function() {
	// Helper: ensure D3 is available, or load it dynamically
	function ensureD3(cb) {
		if (window.d3) return cb();
		console.warn('D3 not found; loading from CDN...');
		const s = document.createElement('script');
		s.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js';
		s.async = true;
		s.onload = () => {
			console.log('D3 loaded dynamically');
			cb();
		};
		s.onerror = () => {
			console.error('Failed to load D3 from CDN');
			const host = document.getElementById('canvas-container-1') || document.body;
			const err = document.createElement('div');
			err.style.color = '#ff6b6b';
			err.style.padding = '12px';
			err.style.background = '#2b2b2b';
			err.style.borderRadius = '6px';
			err.style.marginTop = '12px';
			err.textContent = 'Error: could not load D3 library. Check your internet connection.';
			host.appendChild(err);
		};
		document.head.appendChild(s);
	}

	// Data: thesis tasks with start/end dates and categories
	const tasks = [
		{
			name: 'Literature Study Research',
			start: new Date('2024-06-01'),
			end: new Date('2024-12-31'),
			category: 'Research'
		},
			{
				name: 'NNFC Case Study',
				// multiple segments: first visit Sep 5–15 2024, second visit Feb 15–Mar 15 2025
				segments: [
					{ start: new Date('2024-09-05'), end: new Date('2024-09-15') },
					{ start: new Date('2025-02-15'), end: new Date('2025-03-15') }
				],
				category: 'Case Study'
			},
		{
			name: 'Thesis Synopsis & Site Selection',
			start: new Date('2024-12-01'),
			end: new Date('2024-12-15'),
			category: 'Synopsis & Site'
		},
		{
			name: 'Site Visit & Survey',
			start: new Date('2024-12-16'),
			end: new Date('2024-12-31'),
			category: 'Survey'
		},
		{
			name: 'Site Analysis',
			start: new Date('2025-01-01'),
			end: new Date('2025-03-31'),
			category: 'Analysis'
		},
		{
			name: 'Design Concept',
			start: new Date('2025-02-01'),
			end: new Date('2025-04-30'),
			category: 'Concept'
		},
		{
			name: 'Master Planning',
			start: new Date('2025-03-01'),
			// ended first week of May 2025 (assume May 7)
			end: new Date('2025-05-07'),
			category: 'Master Planning'
		},
		{
			name: 'Design of Buildings',
			start: new Date('2025-04-01'),
			end: new Date('2025-05-15'),
			category: 'Design'
		},
		{
			name: 'Final Renders & Drawings',
			start: new Date('2025-04-15'),
			end: new Date('2025-05-15'),
			category: 'Presentation'
		},
		{
			name: 'Thesis Report Booklet',
			start: new Date('2025-05-16'),
			end: new Date('2025-05-31'),
			category: 'Documentation'
		}
	];

		const categories = [
			'Research', 'Case Study', 'Synopsis & Site', 'Survey', 'Analysis',
			'Concept', 'Master Planning', 'Design', 'Presentation', 'Documentation'
		];

		// Create a smooth gradient from blue (top) to orange (bottom)
		// We'll map each task's index to an interpolated color.
		function getColorInterpolator() {
			const start = d3.color('#0b3d91'); // deeper navy blue
			const end = d3.color('#ff8a33'); // orange
			return d3.interpolateRgb(start, end);
		}

		function init() {
			// Container: replace the existing canvas in Assignment 4 so the Gantt chart appears in-place
			const host = document.getElementById('canvas-container-1');
			if (!host) {
				console.error('No host element (#canvas-container-1) found for Gantt chart');
				return;
			}

			// Create/clear the dedicated D3 container
			const containerId = 'd3-gnatt-container';
			const old = document.getElementById(containerId);
			if (old && old.parentElement) old.parentElement.removeChild(old);

			const container = document.createElement('div');
			container.id = containerId;
			container.style.width = '100%';
			container.style.marginTop = '8px';

			// If a canvas exists, replace it. Otherwise append to host.
			const existingCanvas = host.querySelector('canvas');
			if (existingCanvas && existingCanvas.parentElement) {
				existingCanvas.parentElement.replaceChild(container, existingCanvas);
			} else {
				host.appendChild(container);
			}

			function draw() {
				try {
					// Clear previous svg if any
					d3.select(container).selectAll('*').remove();

				const margin = { top: 56, right: 40, bottom: 60, left: 180 };
				const width = Math.max(560, (container.clientWidth || 800) - margin.left - margin.right);
				// increase bar height and spacing so the chart fills the page better
				const barHeight = 36;
				const rowGap = 18;
					const height = tasks.length * (barHeight + rowGap) - rowGap; // content height

						// dark grey background for the container and svg
						container.style.background = '#121314';
						container.style.padding = '12px';

						const svg = d3.select(container)
							.append('svg')
							.attr('width', width + margin.left + margin.right)
							.attr('height', height + margin.top + margin.bottom)
							.style('background', '#1c1c1e')
							.append('g')
							.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// defs for gradients
		const defs = d3.select(container).select('svg').append('defs');

				// compute overall min/max considering segments
				const minStart = d3.min(tasks, d => d.segments ? d3.min(d.segments, s => s.start) : d.start);
				const maxEnd = d3.max(tasks, d => d.segments ? d3.max(d.segments, s => s.end) : d.end);

					const x = d3.scaleTime()
						.domain([minStart, maxEnd])
						.range([0, width]);

					const y = d3.scaleBand()
						.domain(tasks.map(d => d.name))
						.range([0, height])
						.paddingInner(0.25);

				// Axis with gridlines
					const xAxis = d3.axisBottom(x)
						.ticks(d3.timeMonth.every(1))
						.tickFormat(d3.timeFormat('%b %Y'))
						.tickSize(-height);

					svg.append('g')
						.attr('class', 'x-axis')
						.attr('transform', `translate(0, ${height})`)
						.call(xAxis)
						.selectAll('line')
						.attr('stroke', '#2b2b2b')
						.attr('stroke-dasharray', '2,2');

					svg.select('.x-axis').selectAll('text')
						.style('font-size', '11px')
						.style('fill', '#cfcfcf');

							// horizontal dashed guide lines from left of chart to blocks (behind bars)
									svg.append('g')
										.attr('class', 'row-guides')
										.selectAll('line')
										.data(tasks)
										.enter()
										.append('line')
										.attr('x1', 0)
										.attr('x2', width)
										.attr('y1', d => y(d.name) + y.bandwidth() / 2)
										.attr('y2', d => y(d.name) + y.bandwidth() / 2)
										.attr('stroke', '#8b8b8b')
										.attr('stroke-width', 1)
										.attr('stroke-dasharray', '4,4')
										.style('opacity', 0.95);

					// Title
					svg.append('text')
						.attr('x', 0)
						.attr('y', -20)
						.style('font-weight', '600')
						.style('font-size', '14px')
						.style('fill', '#eaeaea')
						.text('Semiconductor Electronics Technology Park in Mysore — Thesis Timeline');

							// Bars with gradient colors from left (blue) to right (orange)
							const interpolator = getColorInterpolator();
									const taskGroup = svg.selectAll('.task-row')
										.data(tasks)
										.enter()
										.append('g')
										.attr('class', 'task-row')
										.attr('transform', (d) => `translate(0, ${y(d.name)})`);

									taskGroup.each(function(d, i) {
										const g = d3.select(this);
										// color based on midpoint x position (left->right)
										function colorForRange(s, e) {
											const mid = new Date((+s + +e) / 2);
											const px = x(mid); // px across [0, width]
											const t = Math.max(0, Math.min(1, px / width));
											return interpolator(t);
										}

										if (d.segments && Array.isArray(d.segments)) {
											d.segments.forEach(seg => {
												const color = colorForRange(seg.start, seg.end);
																							// create gradient for this segment (left->right inside the block)
																							const tStart = Math.max(0, Math.min(1, x(seg.start) / width));
																							const tEnd = Math.max(0, Math.min(1, x(seg.end) / width));
																							const colorStart = interpolator(tStart);
																							const colorEnd = interpolator(tEnd);
																							const gradId = `grad-${i}-s${Math.round(+seg.start)}-${Math.round(+seg.end)}`;
																							const lg = defs.append('linearGradient')
																								.attr('id', gradId)
																								.attr('gradientUnits', 'objectBoundingBox')
																								.attr('x1', '0')
																								.attr('y1', '0')
																								.attr('x2', '1')
																								.attr('y2', '0');
																							lg.append('stop').attr('offset', '0%').attr('stop-color', colorStart.toString());
																							lg.append('stop').attr('offset', '100%').attr('stop-color', colorEnd.toString());

																							g.append('rect')
																											.attr('class', 'task-bar')
																											.attr('x', x(seg.start))
																											.attr('y', (y.bandwidth() - barHeight) / 2)
																											.attr('width', Math.max(1, x(seg.end) - x(seg.start)))
																											.attr('height', barHeight)
																											.attr('fill', `url(#${gradId})`)
																											.attr('stroke', '#0f0f10')
																											.attr('stroke-width', 1)
																											.style('opacity', 0.75)
																											.style('cursor', 'pointer')
																											.on('mouseover', function(event) { d3.select(this).transition().duration(150).style('opacity', 1).attr('stroke-width', 2); showTooltip(event, { name: d.name, start: seg.start, end: seg.end, category: d.category }); })
																											.on('mouseout', function() { d3.select(this).transition().duration(150).style('opacity', 0.75).attr('stroke-width', 1); hideTooltip(); });
											});
										} else {
																						const colorL = colorForRange(d.start, d.end);
																						const tStart = Math.max(0, Math.min(1, x(d.start) / width));
																						const tEnd = Math.max(0, Math.min(1, x(d.end) / width));
																						const colorStart = interpolator(tStart);
																						const colorEnd = interpolator(tEnd);
																						const gradId = `grad-${i}-full-${Math.round(+d.start)}-${Math.round(+d.end)}`;
																						const lg = defs.append('linearGradient')
																							.attr('id', gradId)
																							.attr('gradientUnits', 'objectBoundingBox')
																							.attr('x1', '0')
																							.attr('y1', '0')
																							.attr('x2', '1')
																							.attr('y2', '0');
																						lg.append('stop').attr('offset', '0%').attr('stop-color', colorStart.toString());
																						lg.append('stop').attr('offset', '100%').attr('stop-color', colorEnd.toString());

																						g.append('rect')
																								.attr('class', 'task-bar')
																								.attr('x', x(d.start))
																								.attr('y', (y.bandwidth() - barHeight) / 2)
																								.attr('width', Math.max(1, x(d.end) - x(d.start)))
																								.attr('height', barHeight)
																								.attr('fill', `url(#${gradId})`)
																								.attr('stroke', '#0f0f10')
																								.attr('stroke-width', 1)
																								.style('opacity', 0.75)
																								.style('cursor', 'pointer')
																								.on('mouseover', function(event) { d3.select(this).transition().duration(150).style('opacity', 1).attr('stroke-width', 2); showTooltip(event, d); })
																								.on('mouseout', function() { d3.select(this).transition().duration(150).style('opacity', 0.75).attr('stroke-width', 1); hideTooltip(); });
										}
									});

					// Labels (two-line wrapping similar to concurrent-events.js)
					function splitTwo(text, maxLength = 18) {
						const words = text.split(' ');
						if (text.length <= maxLength) return [text, ''];
						let l1 = '', l2 = '';
						for (let i = 0; i < words.length; i++) {
							if ((l1 + (l1 ? ' ' : '') + words[i]).length <= maxLength) {
								l1 = l1 + (l1 ? ' ' : '') + words[i];
							} else {
								l2 = words.slice(i).join(' ');
								break;
							}
						}
						return [l1, l2];
					}

					const labelGroup = svg.selectAll('.label-group')
						.data(tasks)
						.enter()
						.append('g')
						.attr('class', 'label-group')
						.attr('transform', d => `translate(-10, ${y(d.name) + y.bandwidth()/2})`)
						.style('pointer-events', 'none');

					labelGroup.append('text')
						.attr('x', 0)
						.attr('y', -6)
						.attr('text-anchor', 'end')
						.attr('dominant-baseline', 'middle')
						.style('font-size', '11px')
						.style('fill', '#cfcfcf')
						.text(d => splitTwo(d.name)[0]);

					labelGroup.append('text')
						.attr('x', 0)
						.attr('y', 8)
						.attr('text-anchor', 'end')
						.attr('dominant-baseline', 'middle')
						.style('font-size', '11px')
						.style('fill', '#cfcfcf')
						.text(d => splitTwo(d.name)[1]);

					// Tooltip
					const tip = d3.select(container)
						.append('div')
						.attr('class', 'tooltip')
						.style('position', 'absolute')
						.style('background', 'rgba(0, 0, 0, 0.8)')
						.style('color', '#fff')
						.style('padding', '8px 12px')
						.style('border-radius', '4px')
						.style('font-size', '12px')
						.style('pointer-events', 'none')
						.style('opacity', 0)
						.style('transition', 'opacity 0.2s');

					function showTooltip(event, d) {
						const ms = d.end - d.start;
						const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
						tip.transition().duration(150).style('opacity', 1);
						tip.html(`
							<strong>${d.name}</strong><br>
							Start: ${d3.timeFormat('%b %d, %Y')(d.start)}<br>
							End: ${d3.timeFormat('%b %d, %Y')(d.end)}<br>
							Duration: ${days} day${days>1?'s':''}<br>
							Category: ${d.category}
						`)
						.style('left', (event.pageX + 10) + 'px')
						.style('top', (event.pageY - 10) + 'px');
					}

					function hideTooltip() {
						tip.transition().duration(150).style('opacity', 0);
					}

				// Legend removed per request

					// Today line
					const today = new Date();
					if (today >= x.domain()[0] && today <= x.domain()[1]) {
						svg.append('line')
							.attr('x1', x(today))
							.attr('x2', x(today))
							.attr('y1', 0)
							.attr('y2', height)
							.attr('stroke', '#ff4757')
							.attr('stroke-width', 2)
							.attr('stroke-dasharray', '5,5');

						svg.append('text')
							.attr('x', x(today) + 6)
							.attr('y', 12)
							.style('font-size', '11px')
							.style('fill', '#ff4757')
							.style('font-weight', 'bold')
							.text('Today');
					}
				} catch (err) {
					console.error('Error drawing Gantt chart:', err);
					const msg = document.createElement('div');
					msg.style.color = '#ff6b6b';
					msg.style.background = '#2b2b2b';
					msg.style.padding = '8px';
					msg.style.marginTop = '8px';
					msg.textContent = 'An error occurred while rendering the Gantt chart. See console for details.';
					container.appendChild(msg);
				}
			}

			// Initial draw and responsive redraw
			draw();
			let resizeT;
			window.addEventListener('resize', () => {
				clearTimeout(resizeT);
				resizeT = setTimeout(() => draw(), 150);
			});

			console.log('Thesis Gantt chart rendered.');
		}

		// Start: ensure D3 then init
		ensureD3(init);
	})();
