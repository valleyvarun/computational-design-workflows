// Minimal template controller: toggle boxes between normal and fullscreen-like overlay

(() => {
	const $ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

	function enterFullscreen(box) {
		// Hide placeholders if iframe has src
		const iframe = box.querySelector('iframe');
		const placeholder = box.querySelector('.placeholder');
		if (iframe && iframe.getAttribute('src')) {
			placeholder && (placeholder.style.display = 'none');
		}

		box.classList.add('fullscreen');
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';

		const expandBtn = box.querySelector('.btn-expand');
		const minimizeBtn = box.querySelector('.btn-minimize');
		if (expandBtn) expandBtn.hidden = true;
		if (minimizeBtn) minimizeBtn.hidden = false;
	}

	function exitFullscreen(box) {
		box.classList.remove('fullscreen');
		document.documentElement.style.overflow = '';
		document.body.style.overflow = '';

		const expandBtn = box.querySelector('.btn-expand');
		const minimizeBtn = box.querySelector('.btn-minimize');
		if (expandBtn) expandBtn.hidden = false;
		if (minimizeBtn) minimizeBtn.hidden = true;
	}

	function collapseAll() {
		$('.box.fullscreen').forEach(exitFullscreen);
	}

	function onClick(e) {
		const btn = e.target.closest('button');
		if (!btn) return;
		const box = e.target.closest('.box');
		if (!box) return;
		if (btn.classList.contains('btn-expand')) {
			collapseAll();
			enterFullscreen(box);
			return;
		}
		if (btn.classList.contains('btn-minimize')) {
			exitFullscreen(box);
			return;
		}
	}

	// Close fullscreen on Escape
	function onKeydown(e) {
		if (e.key === 'Escape') collapseAll();
	}

	// Initialize: if iframe has src, hide placeholder
	function init() {
		$('.box').forEach(box => {
			const iframe = box.querySelector('iframe');
			const placeholder = box.querySelector('.placeholder');
			if (iframe && iframe.getAttribute('src')) {
				if (placeholder) placeholder.style.display = 'none';
			}
		});
	}

	window.addEventListener('click', onClick);
	window.addEventListener('keydown', onKeydown);
	window.addEventListener('DOMContentLoaded', init);
})();

