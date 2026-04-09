const API_URL = '/api/users';

// DOM Elements
const userForm = document.getElementById('user-form');
const usersGrid = document.getElementById('users-grid');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const userIdInput = document.getElementById('user-id-input');
const userCountSpan = document.getElementById('user-count');
const notification = document.getElementById('notification');

const searchBtn = document.getElementById('search-btn');
const searchType = document.getElementById('searchType');
const searchValue = document.getElementById('searchValue');
const searchAgeContainer = document.getElementById('searchAgeContainer');
const searchAge = document.getElementById('searchAge');
const explainCheck = document.getElementById('explain-check');
const statsBox = document.getElementById('stats-box');
const statsContent = document.getElementById('stats-content');
const usersLoader = document.getElementById('users-loader');

// Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// Theme & View Elements
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const viewGridBtn = document.getElementById('view-grid');
const viewListBtn = document.getElementById('view-list');

// --- PHASE 2 EFFECTS IGNITION ---

// 1. Interactive Particle Network Background
if(window.particlesJS) {
    particlesJS("particles-js", {
        particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: ["#8b5cf6", "#ec4899", "#10b981"] },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#8b5cf6", opacity: 0.4, width: 1 },
            move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out", bounce: false }
        },
        interactivity: {
            detect_on: "window",
            events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true },
            modes: { grab: { distance: 140, line_linked: { opacity: 1 } }, push: { particles_nb: 4 } }
        },
        retina_detect: true
    });
}

// 2. Magical Mouse Glow Trailer
const trailer = document.getElementById('mouse-trailer');
let mouseX = 0, mouseY = 0, trailerX = 0, trailerY = 0;
window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
function animateTrailer() {
    trailerX += (mouseX - trailerX) * 0.15; // smooth interpolation
    trailerY += (mouseY - trailerY) * 0.15;
    trailer.style.left = `${trailerX}px`;
    trailer.style.top = `${trailerY}px`;
    requestAnimationFrame(animateTrailer);
}
animateTrailer();

// 3. Grid / List View Toggle
viewGridBtn.addEventListener('click', () => {
    usersGrid.classList.remove('list-view');
    viewGridBtn.classList.add('active');
    viewListBtn.classList.remove('active');
});
viewListBtn.addEventListener('click', () => {
    usersGrid.classList.add('list-view');
    viewListBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
});

// 4. Hacker Typewriter Effect
async function typeWriter(element, text, speed = 10) {
    element.innerHTML = '';
    for (let i = 0; i < text.length; i++) {
        // preserve HTML tags if typing raw text with breaks
        element.innerHTML += text.charAt(i) === '\n' ? '<br>' : text.charAt(i);
        await new Promise(r => setTimeout(r, speed));
    }
}

// --- BASIC LOGIC ---

if(localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
}
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    if(document.body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        localStorage.setItem('theme', 'dark');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
});

openModalBtn.addEventListener('click', () => { resetForm(); modalOverlay.classList.remove('hidden'); });
closeModalBtn.addEventListener('click', () => modalOverlay.classList.add('hidden'));
cancelBtn.addEventListener('click', () => modalOverlay.classList.add('hidden'));

document.addEventListener('DOMContentLoaded', fetchUsers);

searchType.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'all') {
        searchValue.disabled = true;
        searchAgeContainer.style.display = 'none';
    } else if (val === 'email-age') {
        searchValue.disabled = false;
        searchValue.placeholder = "Email address...";
        searchAgeContainer.style.display = 'block';
    } else {
        searchValue.disabled = false;
        searchValue.placeholder = val === 'hobbies' ? 'e.g. gaming' : 'Enter keyword...';
        searchAgeContainer.style.display = 'none';
    }
});

function showNotify(msg, type = 'success') {
    notification.textContent = msg;
    notification.className = `show ${type}`;
    setTimeout(() => { notification.className = ''; }, 3000);
}

function renderSkeletons() {
    let skeletons = '';
    for(let i=0; i<6; i++) {
        skeletons += `
        <div class="user-card" style="pointer-events:none;">
            <div class="card-header">
                <div class="skeleton skel-avatar"></div>
                <div class="card-title-group">
                    <div class="skeleton skel-title"></div>
                    <div class="skeleton skel-sub"></div>
                </div>
            </div>
            <div class="skeleton skel-line"></div>
            <div class="skeleton skel-line" style="width: 70%;"></div>
            <div class="skeleton skel-line" style="width: 50%; height: 30px; margin-top: 1.5rem;"></div>
        </div>`;
    }
    usersGrid.innerHTML = skeletons;
}

// Fetch Users
async function fetchUsers() {
    renderSkeletons();
    statsBox.classList.add('hidden');
    statsContent.innerHTML = '';
    
    let url = API_URL;
    const sType = searchType.value;
    
    if (sType !== 'all') {
        let params = new URLSearchParams();
        if (sType === 'email-age') {
            if(searchValue.value) params.append('email', searchValue.value);
            if(searchAge.value) params.append('age', searchAge.value);
        } else {
            if(searchValue.value) params.append(sType, searchValue.value);
        }
        
        if (explainCheck.checked) {
            params.append('explain', 'true');
        }
        url = `${API_URL}/search?${params.toString()}`;
    }

  try {
        const res = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
        const data = await res.json();

        if (!res.ok || data.error) {
            throw new Error(data.error || 'Database connection could not be established.');
        }

        if (explainCheck.checked && sType !== 'all') {
            statsBox.classList.remove('hidden');
            const es = data.executionStats;
            const wp = data.queryPlanner.winningPlan;
            let indexName = wp.inputStage ? wp.inputStage.indexName : (wp.stage === 'COLLSCAN' ? 'NONE (Collection Scan)' : 'Unknown');
            
            const rawText = `> INITIALIZING QUERY PLANNER...\n> Stage: ${wp.stage}\n> Index Used: ${indexName}\n\n[EXECUTION STATS]\nTotal Keys Examined: ${es.totalKeysExamined}\nTotal Docs Examined: ${es.totalDocsExamined}\nExecution Time: ${es.executionTimeMillis} ms\nExecution Success: true`;
            
            userCountSpan.textContent = "Stats Window Active";
            usersGrid.innerHTML = '';
            
            // Execute Hacker Typewriter Effect
            typeWriter(statsContent, rawText, 15);
        } else {
            renderUsers(data);
        }
    } catch (err) {
        showNotify(err.message, 'error');
        usersGrid.innerHTML = `<p style="color:var(--danger); width:100%; text-align:center;">${err.message}</p>`;
    }
}

searchBtn.addEventListener('click', fetchUsers);

// Render Users & Effects
function renderUsers(users) {
    userCountSpan.textContent = `(${users.length})`;
    if (users.length === 0) {
        usersGrid.innerHTML = `<p style="color: var(--text-secondary); width: 100%; text-align: center;">No database records found.</p>`;
        return;
    }

    let delay = 0;
    usersGrid.innerHTML = users.map(user => {
        const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${user.email.toLowerCase()}`;
        
        // 5. SVG Ring Math (Age mapping logic out of 100)
        // Circumference of r=16 is 100.5
        const dashArray = (user.age / 100) * 100.5;
        const progressRing = `
            <svg class="age-ring">
              <circle class="bg" cx="20" cy="20" r="16" />
              <circle class="progress" id="ring-${user._id}" cx="20" cy="20" r="16" stroke-dasharray="0 100.5" />
              <text class="age-text" x="50%" y="54%" dominant-baseline="middle" text-anchor="middle">${user.age}</text>
            </svg>
        `;

        delay += 50; // Stagger animation
        
        return `
        <div class="user-card" id="card-${user._id}" style="animation: dropIn 0.4s ease forwards ${delay}ms; opacity: 0;">
            <div class="glare"></div>
            
            <div class="card-header">
                <img src="${avatarUrl}" alt="Avatar" class="avatar">
                <div class="card-title-group">
                    <div class="user-name">${user.name}</div>
                    <div class="user-id">ID: ${user.userId || user._id.substring(0, 8)}...</div>
                </div>
            </div>
            
            <div class="user-info-body">
                <div class="user-detail" style="align-items:center;">
                    <span class="user-detail-label">Age:</span> ${progressRing}
                </div>
                <div class="user-detail"><span class="user-detail-label">Email:</span> ${user.email}</div>
                <div style="margin-top: 1rem;">
                    ${user.hobbies ? user.hobbies.map(h => `<span class="tag"><i class="fas fa-tag"></i> ${h}</span>`).join('') : ''}
                </div>
                ${user.bio ? `<div class="user-bio">"${user.bio}"</div>` : ''}
                
                <div class="user-actions">
                    <button class="btn-secondary" style="padding: 0.5rem; font-size: 0.85rem;" onclick='editUser(${JSON.stringify(user)})'><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-danger" style="padding: 0.5rem; font-size: 0.85rem;" onclick="deleteUser('${user._id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `}).join('');

    // Trigger Ring Animations slightly after render
    setTimeout(() => {
        users.forEach(user => {
            const ring = document.getElementById(`ring-${user._id}`);
            if(ring) {
                const dash = (user.age / 100) * 100.5;
                ring.style.strokeDasharray = `${dash} 100.5`;
            }
        });
    }, 100);

    // Apply Pure JS Holographic 3D Tilt Effect
    document.querySelectorAll('.user-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if(usersGrid.classList.contains('list-view')) return; // disable 3D in list view
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const tiltX = (y - centerY) / centerY * -15; 
            const tiltY = (x - centerX) / centerX * 15;
            
            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
            
            const glare = card.querySelector('.glare');
            if(glare) {
                glare.style.opacity = '1';
                glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.25), transparent 60%)`;
            }
        });
        
        card.addEventListener('mouseleave', () => {
             card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
             const glare = card.querySelector('.glare');
             if(glare) glare.style.opacity = '0';
        });
    });
}

// Create or Update DB Record
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const generateId = () => 'u' + Math.random().toString(36).substr(2, 6);
    const isEdit = userIdInput.value !== '';
    
    const userData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        age: parseInt(document.getElementById('age').value),
        hobbies: document.getElementById('hobbies').value.split(',').map(h => h.trim()).filter(h => h),
        bio: document.getElementById('bio').value,
    };
    if (!isEdit) userData.userId = generateId();

    try {
        const url = isEdit ? `${API_URL}/${userIdInput.value}` : API_URL;
        const res = await fetch(url + '?t=' + Date.now(), {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await res.json();
        if(!res.ok) throw new Error(data.error || 'Server Error');

        showNotify(isEdit ? 'User updated seamlessly!' : 'User injected to DB!');
        modalOverlay.classList.add('hidden');
        resetForm();
        fetchUsers();
    } catch (err) {
        showNotify(err.message, 'error');
    }
});

// Edit
window.editUser = (user) => {
    userIdInput.value = user._id;
    document.getElementById('name').value = user.name;
    document.getElementById('email').value = user.email;
    document.getElementById('age').value = user.age;
    document.getElementById('hobbies').value = user.hobbies ? user.hobbies.join(', ') : '';
    document.getElementById('bio').value = user.bio || '';
    
    formTitle.textContent = 'Edit Profile';
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    modalOverlay.classList.remove('hidden');
};

// Delete
window.deleteUser = async (id) => {
    try {
        const res = await fetch(`${API_URL}/${id}?t=`+Date.now(), { method: 'DELETE' });
        if(!res.ok) {
           const errData = await res.json().catch(() => ({}));
           throw new Error(errData.error || 'Delete failed');
        }
        showNotify('User vaporized successfully!');
        fetchUsers();
    } catch (err) {
        console.error(err);
        showNotify(err.message, 'error');
    }
};

function resetForm() {
    userForm.reset();
    userIdInput.value = '';
    formTitle.textContent = 'Add New User';
    submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Inject Profile';
}

// Global Animation helper
const style = document.createElement('style');
style.innerHTML = `@keyframes dropIn { to { transform: translateY(0); opacity: 1; } from { transform: translateY(-20px); opacity: 0; } }`;
document.head.appendChild(style);
