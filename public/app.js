const teachersList = document.getElementById('teachers');
const teacherSelect = document.getElementById('teacherSelect');
const searchInput = document.getElementById('search');
const timeSelect = document.getElementById('time');
const bookingForm = document.getElementById('booking-form');
const statusEl = document.getElementById('status');

async function fetchTeachers(query = '') {
	const url = query ? `/api/teachers?q=${encodeURIComponent(query)}` : '/api/teachers';
	const res = await fetch(url);
	const data = await res.json();
	return data;
}

function renderTeachers(teachers) {
	teachersList.innerHTML = '';
	teacherSelect.innerHTML = '<option value="">Select a teacher</option>';
	for (const t of teachers) {
		const li = document.createElement('li');
		li.className = 'item';
		li.innerHTML = `
			<div style="display:flex; gap:12px; align-items:center;">
				<img src="${t.imageUrl || 'https://via.placeholder.com/56'}" alt="${t.name}" width="56" height="56" style="border-radius:12px; object-fit:cover;"/>
				<div>
					<div class="title">${t.name}</div>
					<div class="sub">${t.subject} · ${t.bio || ''}</div>
				</div>
			</div>
			<div style="display:flex; flex-direction:column; align-items:end; gap:6px;">
				<div class="pill">${t.slots.length} slots</div>
				<div class="pill">$${(t.price ?? 0).toFixed(2)}</div>
			</div>
		`;
		teachersList.appendChild(li);

		const opt = document.createElement('option');
		opt.value = t._id;
		opt.textContent = `${t.name} (${t.subject}) - $${(t.price ?? 0).toFixed(2)}`;
		opt.dataset.slots = JSON.stringify(t.slots);
		teacherSelect.appendChild(opt);
	}
}

function renderTimesFromSelectedTeacher() {
	const selected = teacherSelect.options[teacherSelect.selectedIndex];
	timeSelect.innerHTML = '<option value="">Select time</option>';
	if (!selected || !selected.dataset.slots) return;
	const slots = JSON.parse(selected.dataset.slots);
	for (const s of slots) {
		const opt = document.createElement('option');
		opt.value = s; opt.textContent = s;
		timeSelect.appendChild(opt);
	}
}

async function init() {
	const teachers = await fetchTeachers();
	renderTeachers(teachers);
}

searchInput.addEventListener('input', async (e) => {
	const teachers = await fetchTeachers(e.target.value.trim());
	renderTeachers(teachers);
});

teacherSelect.addEventListener('change', renderTimesFromSelectedTeacher);

bookingForm.addEventListener('submit', async (e) => {
	e.preventDefault();
	statusEl.textContent = '';
	
	// Check if user is logged in
	const token = localStorage.getItem('token');
	if (!token) {
		// Redirect to login page with return URL
		const currentUrl = encodeURIComponent(window.location.href);
		window.location.href = `/login.html?next=${currentUrl}`;
		return;
	}
	
	const form = new FormData(bookingForm);
	const payload = Object.fromEntries(form.entries());
	
	// Remove name and email from payload since they come from auth
	delete payload.name;
	delete payload.email;
	
	try {
		const res = await fetch('/api/bookings', { 
			method: 'POST', 
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}, 
			body: JSON.stringify(payload) 
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || 'Failed to book');
		
		// Show prominent success message with booking details
		statusEl.innerHTML = `
			<div style="
				background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05));
				border: 2px solid rgb(0, 121, 44);
				border-radius: 16px;
				padding: 24px;
				margin: 16px 0;
				text-align: center;
				box-shadow: 0 8px 32px rgba(34,197,94,0.2);
				animation: fadeInUp 0.5s ease-out;
			">
				<div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
				<div style="font-size: 24px; font-weight: 700; color:rgb(0, 140, 51); margin-bottom: 16px;">Booking Successful!</div>
				<div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
					<div style="font-size: 16px; margin-bottom: 8px;"><strong>👨‍🏫 Teacher:</strong> ${data.teacher.name}</div>
					<div style="font-size: 16px; margin-bottom: 8px;"><strong>📅 Date:</strong> ${data.date} at ${data.time}</div>
					<div style="font-size: 16px; margin-bottom: 8px;"><strong>💰 Price:</strong> $${(data.teacher.price || 0).toFixed(2)}</div>
					<div style="font-size: 16px;"><strong>📝 Note:</strong> ${data.note || 'No additional notes'}</div>
				</div>
				<div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
					<a href="/profile.html" class="btn" style="background:rgb(0, 165, 61); color: white; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
						👤 View My Bookings
					</a>
					<button onclick="this.parentElement.parentElement.parentElement.innerHTML = ''" class="btn" style="background: rgba(255,255,255,0.1); color: #4ade80; font-weight: 600; padding: 12px 24px; border-radius: 8px; border: 1px solid #4ade80;">
						✖️ Close
					</button>
				</div>
			</div>
		`;
		
		bookingForm.reset();
		renderTimesFromSelectedTeacher();
	} catch (err) {
		statusEl.style.color = '#fca5a5';
		statusEl.textContent = err.message;
	}
});

init();


