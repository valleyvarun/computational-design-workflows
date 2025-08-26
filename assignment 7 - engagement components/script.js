import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-analytics.js';
import { getDatabase, ref, push, set } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js';

const firebaseConfig = (window && window.FIREBASE_CONFIG) || null;
if (!firebaseConfig || !firebaseConfig.apiKey) {
	console.error('FIREBASE_CONFIG missing. Create assignment 7 - engagement components/firebaseConfig.js from firebaseConfig.template.js and reload.');
	alert('Missing Firebase config. Please add firebaseConfig.js locally.');
}

const app = initializeApp(firebaseConfig);
try { if (await isSupported()) getAnalytics(app); } catch(_) {}
const db = getDatabase(app);

const btnNext1 = document.getElementById('btn-next-1');
const btnNext2 = document.getElementById('btn-next-2');
const btnNext3 = document.getElementById('btn-next-3');
const section2 = document.getElementById('additional-questions');
const section3 = document.getElementById('section3');
const section4 = document.getElementById('section4');
const section1 = document.getElementById('section1');
const section1Toggle = document.getElementById('section1-toggle');
const section1Content = document.getElementById('section1-content');
const section2Toggle = document.getElementById('section2-toggle');
const section2Content = document.getElementById('section2-content');
const section3Toggle = document.getElementById('section3-toggle');
const section3Content = document.getElementById('section3-content');
const enjoymentSlider = document.getElementById('survey-enjoyment');
const enjoymentValue = document.getElementById('enjoyment-value');

// helper to set collapsed/expanded state
function setSection1Collapsed(collapsed) {
	if (!section1 || !section1Content || !section1Toggle) return;
	if (collapsed) {
		section1.classList.add('collapsed');
		section1.setAttribute('aria-collapsed', 'true');
		section1Toggle.setAttribute('aria-expanded', 'false');
		section1Content.classList.add('collapsed');
	} else {
		section1.classList.remove('collapsed');
		section1.removeAttribute('aria-collapsed');
		section1Toggle.setAttribute('aria-expanded', 'true');
		section1Content.classList.remove('collapsed');
	}
}

// initialize expanded
setSection1Collapsed(false);

function setSection2Collapsed(collapsed) {
	if (!section2 || !section2Content || !section2Toggle) return;
	if (collapsed) {
		section2.classList.add('collapsed');
		section2.setAttribute('aria-collapsed', 'true');
		section2Toggle.setAttribute('aria-expanded', 'false');
		section2Content.classList.add('collapsed');
	} else {
		section2.classList.remove('collapsed');
		section2.removeAttribute('aria-collapsed');
		section2Toggle.setAttribute('aria-expanded', 'true');
		section2Content.classList.remove('collapsed');
	}
}

function setSection3Collapsed(collapsed) {
	if (!section3 || !section3Content || !section3Toggle) return;
	if (collapsed) {
		section3.classList.add('collapsed');
		section3.setAttribute('aria-collapsed', 'true');
		section3Toggle.setAttribute('aria-expanded', 'false');
		section3Content.classList.add('collapsed');
	} else {
		section3.classList.remove('collapsed');
		section3.removeAttribute('aria-collapsed');
		section3Toggle.setAttribute('aria-expanded', 'true');
		section3Content.classList.remove('collapsed');
	}
}

// click/keyboard toggle for section 1
section1Toggle?.addEventListener('click', () => {
	const isCollapsed = section1?.classList.contains('collapsed');
	setSection1Collapsed(!isCollapsed);
});
section1Toggle?.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' || e.key === ' ') {
		e.preventDefault();
		const isCollapsed = section1?.classList.contains('collapsed');
		setSection1Collapsed(!isCollapsed);
	}
});

// live update enjoyment slider display
if (enjoymentSlider && enjoymentValue) {
	enjoymentSlider.addEventListener('input', () => {
		enjoymentValue.textContent = enjoymentSlider.value;
	});
}

// Section 2 toggle handlers
section2Toggle?.addEventListener('click', () => {
	const isCollapsed = section2?.classList.contains('collapsed');
	setSection2Collapsed(!isCollapsed);
});
section2Toggle?.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' || e.key === ' ') {
		e.preventDefault();
		const isCollapsed = section2?.classList.contains('collapsed');
		setSection2Collapsed(!isCollapsed);
	}
});

// Next 1: open Section 2, collapse Section 1
btnNext1?.addEventListener('click', () => {
	section2?.classList.remove('hidden');
	setSection1Collapsed(true);
	setSection2Collapsed(false);
	btnNext1.remove();
	section2?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Next 2: open Section 3, collapse Section 2
btnNext2?.addEventListener('click', () => {
	section3?.classList.remove('hidden');
	setSection2Collapsed(true);
	setSection3Collapsed(false);
	section3?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Next 3: open Section 4
btnNext3?.addEventListener('click', () => {
	section4?.classList.remove('hidden');
	// collapse section 3 and remove the Next button
	setSection3Collapsed(true);
	btnNext3.remove();
	section4?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Section 3 toggle handlers
section3Toggle?.addEventListener('click', () => {
	const isCollapsed = section3?.classList.contains('collapsed');
	setSection3Collapsed(!isCollapsed);
});
section3Toggle?.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' || e.key === ' ') {
		e.preventDefault();
		const isCollapsed = section3?.classList.contains('collapsed');
		setSection3Collapsed(!isCollapsed);
	}
});

const btnSubmit = document.getElementById('btn-submit');
const submitStatus = document.getElementById('submit-status');
// Q5: enable/disable the optional text when "Other" is selected
const q5OtherRadio = document.getElementById('q5-other');
const q5OtherText = document.getElementById('q5-other-text');
if (q5OtherRadio && q5OtherText) {
	const syncQ5Other = () => {
		const selected = document.querySelector('input[name="survey-special-arrangements"]:checked');
		const isOther = selected && selected.id === 'q5-other';
		q5OtherText.disabled = !isOther;
		if (!isOther) q5OtherText.value = '';
	};
	document.querySelectorAll('input[name="survey-special-arrangements"]').forEach((el) => {
		el.addEventListener('change', syncQ5Other);
	});
}

async function sendEmailWithPdfCopy(toEmail, payload, pdfDataUrl, pdfBase64) {
	const functionUrl = window.SURVEY_EMAIL_FUNCTION_URL || '';
	if (!functionUrl) return { ok: false, error: 'Function URL missing' };
	const body = {
		to: toEmail,
		subject: 'Your Survey Response — A Survey on Experiencing Industry',
		text: 'Thanks for your submission. A PDF copy is attached.',
		html: '<p>Thanks for your submission. A PDF copy is attached.</p>',
		pdfDataUrl,
		pdfBase64,
		replyTo: toEmail
	};
	try {
		const r = await fetch(functionUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		const data = await r.json().catch(() => ({}));
		return { ok: r.ok && data && data.ok === true, status: r.status, data };
	} catch (e) {
		return { ok: false, error: (e && e.message) || String(e) };
	}
}

btnSubmit?.addEventListener('click', async () => {
	const name = (document.getElementById('survey-name')?.value || '').trim();
	const email = (document.getElementById('survey-email')?.value || '').trim();
	// Basic validation: Name and Email required
	if (!name) {
		alert('Please enter your name.');
		document.getElementById('survey-name')?.focus();
		return;
	}
	if (!email) {
		alert('Please enter your email id.');
		document.getElementById('survey-email')?.focus();
		return;
	}
	const location = (document.getElementById('survey-location')?.value || '').trim();
	const ageRange = (document.getElementById('survey-age')?.value || '').trim();
	const profession = (document.getElementById('survey-profession')?.value || '').trim();
	const industryRole = document.querySelector('input[name="survey-industry-role"]:checked')?.value || '';

	const visitExperience = document.querySelector('input[name="survey-visit-experience"]:checked')?.value || '';
	const visitFacilities = (document.getElementById('visit-facilities')?.value || '').trim();
	const schoolTripVisits = document.querySelector('input[name="survey-school-trip"]:checked')?.value || '';
	const exposureCheckboxes = Array.from(document.querySelectorAll('input[name="survey-exposure-levels"]:checked'));
	const exposureLevels = exposureCheckboxes.map(c => c.value);
	const exposureOtherChecked = document.getElementById('exposure-other')?.checked;
	const exposureOtherText = (document.getElementById('exposure-other-text')?.value || '').trim();
	if (exposureOtherChecked) {
		exposureLevels.push(exposureOtherText ? `Other: ${exposureOtherText}` : 'Other');
	}

	// Q5 value with optional text
	let specialArrangements = document.querySelector('input[name="survey-special-arrangements"]:checked')?.value || '';
	const q5OtherSelected = document.getElementById('q5-other')?.checked;
	const q5OtherVal = (document.getElementById('q5-other-text')?.value || '').trim();
	if (q5OtherSelected) {
		specialArrangements = q5OtherVal ? `Other: ${q5OtherVal}` : 'Other';
	}

	// Q6-Q10 values (after Q5)
	const disturbance = document.querySelector('input[name="survey-disturbance"]:checked')?.value || '';
	const accessEase = document.querySelector('input[name="survey-access-ease"]:checked')?.value || '';
	const casualVisit = document.querySelector('input[name="survey-casual-visit"]:checked')?.value || '';
	let whereNoticed = document.querySelector('input[name="survey-where-noticed"]:checked')?.value || '';
	const q9OtherSelected = document.getElementById('q9-other')?.checked;
	const q9OtherVal = (document.getElementById('q9-other-text')?.value || '').trim();
	if (q9OtherSelected) {
		whereNoticed = q9OtherVal ? `Other: ${q9OtherVal}` : 'Other';
	}
	const curiosity = document.querySelector('input[name="survey-curiosity"]:checked')?.value || '';

	// Q11 short text
	const q11IndustryWords = (document.getElementById('q11-industry-words')?.value || '').trim();

	// Section 3: concept ratings (1-5)
	const concept1Rating = document.querySelector('input[name="concept1-rating"]:checked')?.value || '';
	const concept2Rating = document.querySelector('input[name="concept2-rating"]:checked')?.value || '';
	const concept3Rating = document.querySelector('input[name="concept3-rating"]:checked')?.value || '';
	const concept4Rating = document.querySelector('input[name="concept4-rating"]:checked')?.value || '';
	const concept5Rating = document.querySelector('input[name="concept5-rating"]:checked')?.value || '';

	// Section 4: enjoyment slider
	const enjoyment = (document.getElementById('survey-enjoyment')?.value || '').toString();

	// Build section-wise structured payload with numbered questions
	const section1 = {
		title: 'Basic information',
		q1: { number: 'S1.Q1', label: 'Name', value: name },
		q2: { number: 'S1.Q2', label: 'Email', value: email },
		q3: { number: 'S1.Q3', label: 'Location', value: location },
		q4: { number: 'S1.Q4', label: 'Age Range', value: ageRange },
		q5: { number: 'S1.Q5', label: 'Profession/Field', value: profession },
		q6: { number: 'S1.Q6', label: 'Industry Role (Y/N)', value: industryRole }
	};

	const section2 = {
		title: 'Exposure and Impressions of Industry',
		q1: { number: 'S2.Q1', label: 'Visited factory/industrial/R&D facility (in person)', value: visitExperience },
		q2: { number: 'S2.Q2', label: 'Facilities visited and where', value: visitFacilities },
		q3: { number: 'S2.Q3', label: 'School/college trips as student', value: schoolTripVisits },
		q4: { number: 'S2.Q4', label: 'Exposure levels during visits', value: Array.isArray(exposureLevels) ? exposureLevels : [] },
		q5: { number: 'S2.Q5', label: 'Special arrangements during visits', value: specialArrangements },
		q6: { number: 'S2.Q6', label: 'Disturbance caused during visit', value: disturbance },
		q7: { number: 'S2.Q7', label: 'Ease of access to facility', value: accessEase },
		q8: { number: 'S2.Q8', label: 'Casual visit outside school/work', value: casualVisit },
		q9: { number: 'S2.Q9', label: 'Where industrial spaces noticed (most)', value: whereNoticed },
		q10: { number: 'S2.Q10', label: 'Curiosity to explore/enter', value: curiosity },
		q11: { number: 'S2.Q11', label: 'Word(s) associated with "industry"', value: q11IndustryWords }
	};

	const section3 = {
		title: 'Design Concepts for Experiencing Industry through Architecture',
		c1: { number: 'S3.C1', label: 'Concept 1 — Bridge Tube Walkway (rating 1-5)', value: concept1Rating },
		c2: { number: 'S3.C2', label: 'Concept 2 — Public Exhibition at Facility Entry (rating 1-5)', value: concept2Rating },
		c3: { number: 'S3.C3', label: 'Concept 3 — Training Centre Overlooking Operational Areas (rating 1-5)', value: concept3Rating },
		c4: { number: 'S3.C4', label: 'Concept 4 — Contrasting Nature with Industry (rating 1-5)', value: concept4Rating },
		c5: { number: 'S3.C5', label: 'Concept 5 — Iconic Landmark Architecture (rating 1-5)', value: concept5Rating }
	};

	const section4 = {
		title: 'Feedback',
		q1: { number: 'S4.Q1', label: 'Enjoyment rating (0-10)', value: enjoyment }
	};

	// Build a question index: number => label
	const index = {};
	const sanitizeKey = (k) => (k || '').replace(/[.#$\[\]\/]/g, '_');
	const collectIndex = (sec) => {
		Object.keys(sec).forEach((k) => {
			if (k === 'title') return;
			const entry = sec[k];
			if (entry && entry.number && entry.label) index[sanitizeKey(entry.number)] = entry.label;
		});
	};
	[section1, section2, section3, section4].forEach(collectIndex);

	const payload = {
		sections: { section1, section2, section3, section4 },
		index,
		createdAt: Date.now(),
		userAgent: navigator.userAgent
	};

	const original = btnSubmit.textContent;
	btnSubmit.disabled = true; btnSubmit.textContent = 'Submitting…';
	try {
		const r = push(ref(db, 'surveyResponses'));
		await set(r, payload);

		let pdfDataUrl = '';
		let pdfBase64 = '';
		try {
			const { jsPDF } = window.jspdf || {};
			if (jsPDF) {
				const doc = new jsPDF({ unit: 'pt' });
				const line = (t, y) => { doc.text(t, 40, y); };
				let y = 60;
				doc.setFont('helvetica', 'bold'); doc.setFontSize(16); line('Survey Response — A Survey on Experiencing Industry', y); y += 24;
				doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
				const rows = [];
				const addRowsFromSection = (sec) => {
					Object.keys(sec).forEach((k) => {
						if (k === 'title') return;
						const { number, label, value } = sec[k] || {};
						if (!number) return;
						const val = Array.isArray(value) ? value.join(', ') : (value || '-');
						rows.push([`${number} — ${label}`, val]);
					});
				};
				[section1, section2, section3, section4].forEach(addRowsFromSection);
				rows.push(['Submitted At', new Date(payload.createdAt).toLocaleString()]);
				rows.forEach(([k, v]) => {
					const text = `${k}: ${v || '-'}`;
					const split = doc.splitTextToSize(text, 515);
					split.forEach((ln) => { if (y > 760) { doc.addPage(); y = 60; } line(ln, y); y += 18; });
					y += 6;
				});
				pdfDataUrl = doc.output('datauristring');
				try { pdfBase64 = (pdfDataUrl && pdfDataUrl.includes(',')) ? pdfDataUrl.split(',')[1] : ''; } catch(_) { pdfBase64 = ''; }
				doc.save('survey-response.pdf');
			}
		} catch (e) { console.warn('PDF generation failed:', e); }

		btnSubmit.textContent = 'Submitted ✓';
		const result = await sendEmailWithPdfCopy(email, payload, pdfDataUrl, pdfBase64);
		if (result && result.ok) {
			submitStatus?.classList.remove('hidden');
			submitStatus && (submitStatus.textContent = 'A copy of your response has been sent to your email id. If it’s not in your Inbox, please check Spam or Promotions.');
		} else {
			const msg = result && (result.error || (result.data && (result.data.error || JSON.stringify(result.data))) || 'Email send failed');
			if (submitStatus) {
				submitStatus.textContent = `Email not sent: ${msg}`;
				submitStatus.classList.remove('hidden');
				submitStatus.style.color = '#ff6b6b';
			}
			console.warn('Email send failed:', result);
		}
	} catch (err) {
		console.error('Submit failed', err);
		const errMsg = (err && (err.message || (err.code ? `${err.code}` : ''))) || 'Please try again.';
		alert(`Could not submit your response. ${errMsg}`);
		btnSubmit.textContent = original;
		btnSubmit.disabled = false;
		return;
	}
});

