// Minimal template controller: toggle boxes between normal and fullscreen-like overlay

(() => {
	const $ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

	function enterFullscreen(box) {
		// Hide placeholders if iframe has src
		const iframe = box.querySelector('iframe');
		const placeholder = box.querySelector('.placeholder');
		if (iframe) {
			// Lazy load: promote data-src to src on demand
			if (!iframe.getAttribute('src')) {
				const ds = iframe.getAttribute('data-src');
				if (ds) iframe.setAttribute('src', ds);
			}
			if (iframe.getAttribute('src')) {
				placeholder && (placeholder.style.display = 'none');
			}
		}

		box.classList.add('fullscreen');
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';

		// Swap header title to full name if provided
		const h2 = box.querySelector('.box-header h2');
		if (h2) {
			// Cache the original title once
			if (!box.dataset.titleOriginal) {
				box.dataset.titleOriginal = h2.textContent;
			}
			const full = box.dataset.fullTitle;
			if (full) h2.textContent = full;
		}

		const minimizeBtn = box.querySelector('.btn-minimize');
		if (minimizeBtn) minimizeBtn.hidden = false;
	}

	function exitFullscreen(box) {
		box.classList.remove('fullscreen');
		document.documentElement.style.overflow = '';
		document.body.style.overflow = '';

		// Restore original header title if cached
		const h2 = box.querySelector('.box-header h2');
		if (h2 && box.dataset.titleOriginal) {
			h2.textContent = box.dataset.titleOriginal;
		}

		// Unload iframe so it stops running in background
		const iframe = box.querySelector('iframe');
		const placeholder = box.querySelector('.placeholder');
		const thumb = box.querySelector('.thumb');
		if (iframe && iframe.getAttribute('src')) {
			iframe.removeAttribute('src');
		}
		if (placeholder) placeholder.style.display = thumb ? 'none' : '';

		const minimizeBtn = box.querySelector('.btn-minimize');
		if (minimizeBtn) minimizeBtn.hidden = true;
	}

	function collapseAll() {
		$('.box.fullscreen').forEach(exitFullscreen);
	}

	function onClick(e) {
		const box = e.target.closest('.box');
		if (!box) return;
		if (!box.classList.contains('fullscreen')) {
			// Enter fullscreen when clicking anywhere on the box in grid view
			collapseAll();
			enterFullscreen(box);
		} else {
			// Only minimize when clicking the explicit minimize button
			const btn = e.target.closest('.btn-minimize');
			if (btn) exitFullscreen(box);
		}
	}

	// Close fullscreen on Escape
	function onKeydown(e) { /* Escape no-op to require button for minimize */ }

	// Initialize: if iframe has src, hide placeholder
	function init() {
		$('.box').forEach(box => {
			const iframe = box.querySelector('iframe');
			const thumb = box.querySelector('.thumb');
			const placeholder = box.querySelector('.placeholder');
			if ((iframe && (iframe.getAttribute('src') || iframe.getAttribute('data-src'))) || thumb) {
				if (placeholder) placeholder.style.display = 'none';
			}
			// Ensure minimize button is visible only in fullscreen
			const minBtn = box.querySelector('.btn-minimize');
			if (minBtn) minBtn.hidden = true;
		});
	}

	window.addEventListener('click', onClick);
	window.addEventListener('keydown', onKeydown);
	window.addEventListener('DOMContentLoaded', init);
})();

