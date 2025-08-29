function isLoggedIn(){
	try { return !!localStorage.getItem('token'); } catch { return false; }
}

function renderNav(){
	const nav = document.querySelector('.nav');
	if(!nav) return;
	if(isLoggedIn()){
		nav.innerHTML = '<a class="btn" href="/index.html" id="nav-book">Book</a>\
<button class="btn" id="nav-user" type="button" aria-haspopup="true" aria-expanded="false">👤</button>\
<button class="btn" id="nav-logout" type="button" >Logout</button>';
	} else {
		nav.innerHTML = '<a class="btn" href="/index.html" id="nav-book">Book</a>\
<a class="btn" href="/login.html">Login</a>\
<a class="btn" href="/signup.html">Sign up</a>';
	}
	const book = document.getElementById('nav-book');
	if(book){
		book.addEventListener('click', (e)=>{
			if(!isLoggedIn()){
				e.preventDefault();
				window.location.href = '/login.html?next=' + encodeURIComponent('/index.html');
			}
		});
	}
	const logoutBtn = document.getElementById('nav-logout');
	if(logoutBtn){
		logoutBtn.addEventListener('click', ()=>{
			try { localStorage.removeItem('token'); } catch {}
			window.location.replace('/landing.html');
		});
	}

	const userBtn = document.getElementById('nav-user');
	if(userBtn){
		const pop = document.createElement('div');
		pop.style.position = 'absolute';
		pop.style.top = '60px';
		pop.style.right = '20px';
		pop.style.background = '#0f172a';
		pop.style.border = '1px solid rgba(255, 255, 255, 0.08)';
		pop.style.borderRadius = '12px';
		pop.style.padding = '12px';
		pop.style.minWidth = '240px';
		pop.style.boxShadow = '0 10px 30px rgba(255, 255, 255, 0.35)';
		pop.style.display = 'none';
		pop.id = 'user-popover';
		document.body.appendChild(pop);

		async function loadMe(){
			try{
				const token = localStorage.getItem('token');
				const res = await fetch('/api/me',{headers:{Authorization:'Bearer '+token}});
				const me = await res.json();
				if(!res.ok) throw new Error(me.error||'Failed');
				pop.innerHTML = `
					<div style="display:flex; gap:12px; align-items:center;">
						<img src="${me.avatarUrl}" alt="avatar" width="48" height="48" style="border-radius:10px; object-fit:cover;"/>
						<div>
							<div class="title">${me.name}</div>
							<div class="sub">${me.email}</div>
						</div>
					</div>
					<div style="display:flex; gap:8px; margin-top:10px;">
						<span class="pill">Bookings: ${me.stats.bookingsCount||0}</span>
						${me.role==='student' ? `<span class="pill">Spent: $${(me.stats.totalSpend||0).toFixed(2)}</span>` : `<span class="pill">Earnings: $${(me.stats.totalEarnings||0).toFixed(2)}</span>`}
					</div>
				`;
			}catch(err){
				pop.innerHTML = '<div class="sub">Failed to load profile</div>';
			}
		}

		userBtn.addEventListener('click', async ()=>{
			window.location.href = '/profile.html';
		});

		// Remove popover logic as profile is now a page
	}
}

function enforceAuthOnPages(){
	const path = location.pathname.toLowerCase();
	if(isLoggedIn() && (path.endsWith('/login.html') || path.endsWith('/signup.html'))){
		location.replace('/index.html');
	}
}

document.addEventListener('DOMContentLoaded', ()=>{
	renderNav();
	enforceAuthOnPages();
});


