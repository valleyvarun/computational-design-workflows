// Mapbox GL map that loads and displays hia-site.geojson
(function(){
	var msgEl = document.getElementById('map-msg');
	function setMsg(text, ok) {
		if (!msgEl) return;
		msgEl.textContent = text || '';
		msgEl.style.color = ok ? '#00d084' : '#bbb';
	}

	// Simple HTML escape to prevent injection in popups
	function esc(s){
		return String(s).replace(/[&<>"']/g, function(c){
			return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]) || c;
		});
	}

	if (typeof mapboxgl === 'undefined') {
		setMsg('Map failed to load: Mapbox GL JS not available.', false);
		return;
	}

		// Access token: use page-provided token if available, otherwise fallback to embedded provided token
		var TOKEN_FALLBACK = 'pk.eyJ1IjoidmFydW4tY2RwIiwiYSI6ImNtZXFibjI0ZDA5NmQya3B1dmFmbjJnMGwifQ._OXDR7R-StkIW4RzeHu2lw';
		var tokenCandidate = (window.MAPBOX_TOKEN && String(window.MAPBOX_TOKEN).trim()) || TOKEN_FALLBACK;
		mapboxgl.accessToken = tokenCandidate;
		if (!tokenCandidate) {
			setMsg('Mapbox token missing. Please provide a valid token.', false);
		}

	var map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/satellite-streets-v12',
		center: [0,0],
		zoom: 2,
		attributionControl: true,
		cooperativeGestures: true
	});
		map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

	map.on('load', function(){
		// Load local GeoJSON
		fetch('hia-site.geojson').then(function(r){ return r.json(); }).then(function(geo){
			map.addSource('hia-site', { type: 'geojson', data: geo });

			// Add fills: site polygons in purple, others in grey
			map.addLayer({
				id: 'hia-fill-site',
				type: 'fill',
				source: 'hia-site',
				paint: {
					'fill-color': '#7b61ff',
					'fill-opacity': 0.25
				},
				filter: ['all',
					['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
					['in', ['get', 'site'], ['literal', ['main site', 'future expansion']]]
				]
			});

			map.addLayer({
				id: 'hia-fill-other',
				type: 'fill',
				source: 'hia-site',
				paint: {
					'fill-color': '#b0b7c3',
					'fill-opacity': 0.18
				},
				filter: ['all',
					['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
					['!', ['in', ['get', 'site'], ['literal', ['main site', 'future expansion']]]]
				]
			});

			// Polygon outlines: site in purple, others in grey
			map.addLayer({
				id: 'hia-line-site-polys',
				type: 'line',
				source: 'hia-site',
				paint: {
					'line-color': '#7b61ff',
					'line-width': 2
				},
				filter: ['all',
					['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
					['in', ['get', 'site'], ['literal', ['main site', 'future expansion']]]
				]
			});

			map.addLayer({
				id: 'hia-line-other-polys',
				type: 'line',
				source: 'hia-site',
				paint: {
					'line-color': '#7f8da0',
					'line-width': 1.5
				},
				filter: ['all',
					['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
					['!', ['in', ['get', 'site'], ['literal', ['main site', 'future expansion']]]]
				]
			});

			// Other line features (e.g., canal) in grey
			map.addLayer({
				id: 'hia-line-others',
				type: 'line',
				source: 'hia-site',
				paint: {
					'line-color': '#7f8da0',
					'line-width': 2
				},
				filter: ['any', ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']]
			});

			// Lakes (type = 'lake') in light sky blue
			map.addLayer({
				id: 'hia-fill-lakes',
				type: 'fill',
				source: 'hia-site',
				paint: {
					'fill-color': '#87CEFA',
					'fill-opacity': 0.45
				},
				filter: ['all',
					['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
					['==', ['get', 'type'], 'lake']
				]
			});

			map.addLayer({
				id: 'hia-line-lakes',
				type: 'line',
				source: 'hia-site',
				paint: {
					'line-color': '#5fb3e6',
					'line-width': 2
				},
				filter: ['all',
					['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
					['==', ['get', 'type'], 'lake']
				]
			});

			// Canal polylines in same blue as lakes
			map.addLayer({
				id: 'hia-line-canal',
				type: 'line',
				source: 'hia-site',
				paint: {
					'line-color': '#5fb3e6',
					'line-width': 2.5
				},
				filter: ['all',
					['any', ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']],
					['==', ['get', 'type'], 'canal']
				]
			});

			// Label inside the 'future expansion' polygon (two lines)
			map.addLayer({
				id: 'hia-label-future-expansion',
				type: 'symbol',
				source: 'hia-site',
				layout: {
					'text-field': ['literal', 'future\nexpansion'],
					'text-size': 14,
					'text-justify': 'center',
					'text-anchor': 'center',
					'symbol-placement': 'point'
				},
				paint: {
					'text-color': '#7b61ff',
					'text-halo-color': '#ffffff',
					'text-halo-width': 1.2
				},
				filter: ['all',
					['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
					['==', ['get', 'site'], 'future expansion']
				]
			});

			// Label inside the 'main site' polygon
			map.addLayer({
				id: 'hia-label-main-site',
				type: 'symbol',
				source: 'hia-site',
				layout: {
					'text-field': ['literal', 'site'],
					'text-size': 14,
					'text-justify': 'center',
					'text-anchor': 'center',
					'symbol-placement': 'point'
				},
				paint: {
					'text-color': '#7b61ff',
					'text-halo-color': '#ffffff',
					'text-halo-width': 1.2
				},
				filter: ['all',
					['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
					['==', ['get', 'site'], 'main site']
				]
			});

			// Add teardrop pins for points; try loading a PNG, fallback to built-in icon
			var pointFilter = ['any', ['==', ['geometry-type'], 'Point'], ['==', ['geometry-type'], 'MultiPoint']];
			map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', function(err, image){
				if (!err && image) {
					if (!map.hasImage('teardrop')) map.addImage('teardrop', image);
					map.addLayer({
						id: 'hia-point-symbol',
						type: 'symbol',
						source: 'hia-site',
						layout: {
							'icon-image': 'teardrop',
							'icon-size': 0.9,
							'icon-allow-overlap': true,
							'icon-ignore-placement': true,
							'icon-anchor': 'bottom'
						},
						filter: pointFilter
					});
					// Bind events now that layer exists
					map.on('mouseenter', 'hia-point-symbol', function(){ map.getCanvas().style.cursor = 'pointer'; });
					map.on('mouseleave', 'hia-point-symbol', function(){ map.getCanvas().style.cursor = ''; });
					map.on('click', 'hia-point-symbol', function(e){
						var f = e.features && e.features[0]; if (!f) return;
						var p = f.properties || {};
						var title = p.name || p.site || p.type || 'Location';
						var desc = p.description || '';
						var html = '<div style="font:600 13px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0a0f1e;">'+esc(title)+'</div>';
						if (desc) html += '<div style="margin-top:4px;font:400 12px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#5c6a8a;">'+esc(desc)+'</div>';
						new mapboxgl.Popup({ offset: 8 })
							.setLngLat(e.lngLat)
							.setHTML(html)
							.addTo(map);
					});
				} else {
					// Fallback to SDF marker icon
					map.addLayer({
						id: 'hia-point-symbol',
						type: 'symbol',
						source: 'hia-site',
						layout: {
							'icon-image': 'marker-15',
							'icon-size': 2.2,
							'icon-allow-overlap': true,
							'icon-ignore-placement': true,
							'icon-anchor': 'bottom'
						},
						paint: {
							'icon-color': '#e63946',
							'icon-halo-color': '#ffffff',
							'icon-halo-width': 1
						},
						filter: pointFilter
					});
					// Bind events now that layer exists
					map.on('mouseenter', 'hia-point-symbol', function(){ map.getCanvas().style.cursor = 'pointer'; });
					map.on('mouseleave', 'hia-point-symbol', function(){ map.getCanvas().style.cursor = ''; });
					map.on('click', 'hia-point-symbol', function(e){
						var f = e.features && e.features[0]; if (!f) return;
						var p = f.properties || {};
						var title = p.name || p.site || p.type || 'Location';
						var desc = p.description || '';
						var html = '<div style="font:600 13px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0a0f1e;">'+esc(title)+'</div>';
						if (desc) html += '<div style="margin-top:4px;font:400 12px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#5c6a8a;">'+esc(desc)+'</div>';
						new mapboxgl.Popup({ offset: 8 })
							.setLngLat(e.lngLat)
							.setHTML(html)
							.addTo(map);
					});
				}
			});



			// Fit to bounds
					var bb;
					if (typeof turf !== 'undefined' && turf && turf.bbox) {
						bb = turf.bbox(geo);
					} else {
						// Fallback bbox calculation
						var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
						var fc = geo.type === 'FeatureCollection' ? geo.features : [geo];
						function scanCoords(arr){ for (var i=0;i<arr.length;i++){ var c=arr[i]; if (Array.isArray(c[0])) scanCoords(c); else { var x=c[0], y=c[1]; if (x<minX) minX=x; if (x>maxX) maxX=x; if (y<minY) minY=y; if (y>maxY) maxY=y; } } }
						for (var fi=0; fi<fc.length; fi++) {
							var gm = fc[fi].geometry; if (!gm) continue;
							scanCoords(gm.coordinates);
						}
						bb = [minX, minY, maxX, maxY];
					}
			if (bb && bb.length === 4 && isFinite(bb[0])) {
				map.fitBounds([[bb[0], bb[1]], [bb[2], bb[3]]], { padding: 40, animate: false });
			} else {
				setMsg('Loaded GeoJSON but could not compute bounds.', false);
			}

			// Success: no status text needed
		}).catch(function(err){
			console.error(err);
			setMsg('Failed to load hia-site.geojson.', false);
		});
	});
})();

