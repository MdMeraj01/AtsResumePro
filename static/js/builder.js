// builder.js

// ---------- CONFIGURATION ----------
const BACKEND_API_URL = '';
const STORAGE_KEY = 'ats_resume_v3';
const STEPS = ['personal', 'education', 'experience', 'projects', 'skills', 'certifications', 'finish'];
let currentStepIndex = 0;
// Function to stop lag (Wait 300ms before updating)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 ATS Resume Builder Initialized');
    
    // 1. Mobile Styles Inject
    if (typeof injectMobileStyles === 'function') {
        injectMobileStyles();
    }

    // 2. Initialize components
    initThemeToggle();
    initMobileMenu();
    initEventListeners();
    initLiveValidation();
    loadFromLocalStorage();
    updateUI();
    
    // 3. Drag & Drop
    ['educationList', 'experienceList', 'projectsList', 'certificationsList'].forEach(id => {
        if (typeof initDragAndDrop === 'function') initDragAndDrop(id);
    });
    
    // 4. Auto-save & Animations
    initAutoSave();
    setTimeout(() => {
        document.querySelectorAll('.fade-in-up').forEach((el, index) => {
            el.style.animationDelay = `${index * 100}ms`;
        });
    }, 100);

    // ============================================================
    // 5. CRITICAL FIX: URL DETECTION LOGIC
    // ============================================================
    
    // Step A: URL se template ka naam nikalo (e.g., 'modern')
    const urlParams = new URLSearchParams(window.location.search);
    const urlTemplate = urlParams.get('template');

    
    const targetTemplate = urlTemplate || 'default';
    document.body.setAttribute('data-template', targetTemplate);

    console.log(`URL says: ${urlTemplate} | Loading: ${targetTemplate}`);

    // Step C: Dropdown (Select Box) ko sahi value par set karo
    const selector = document.getElementById('templateSelector');
    if (selector) {
        selector.value = targetTemplate;
    }

    // Step D: Template Load karo (HTML + CSS)
    if (typeof loadTemplate === 'function') {
        loadTemplate(targetTemplate);
    }

    // Close Button Fix
    const closeBtn = document.getElementById('closePdfPreviewBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closePDFPreview();
        });
    }

    // Mobile Close Button (Agar koi aur button bhi ho)
    const mobileClosePreview = document.getElementById('mobileClosePreviewBtn');
    if (mobileClosePreview) {
        mobileClosePreview.addEventListener('click', function() {
            closePDFPreview();
        });
    }
});



 

// ---------- THEME MANAGEMENT ----------
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    function updateIcons(isLight) {
        const iconClass = isLight ? 'fas fa-moon' : 'fas fa-sun';
        if (themeToggle) themeToggle.innerHTML = `<i class="${iconClass}"></i>`;
        if (mobileThemeToggle) mobileThemeToggle.innerHTML = `<i class="${iconClass}"></i>`;
    }

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isInitialLight = savedTheme === 'light' || (!savedTheme && !prefersDark);

    if (isInitialLight) {
        document.body.classList.add('light-mode');
        updateIcons(true);
    } else {
        updateIcons(false);
    }
    
    function toggleTheme() {
        const isCurrentlyLight = document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', isCurrentlyLight ? 'light' : 'dark');
        updateIcons(isCurrentlyLight);
        if (typeof updatePreview === 'function') updatePreview();
    }
    
    themeToggle?.addEventListener('click', toggleTheme);
    mobileThemeToggle?.addEventListener('click', toggleTheme);
}

// ---------- MOBILE MENU ----------
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    function toggle(open) {
        mobileMenu?.classList.toggle('translate-x-full', !open);
        document.body.classList.toggle('menu-open', open);
    }
    
    mobileMenuBtn?.addEventListener('click', () => toggle(true));
    mobileCloseBtn?.addEventListener('click', () => toggle(false));
    mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggle(false)));
}

// ---------- STEP NAVIGATION ----------
function updateUI() {
    const currentStep = STEPS[currentStepIndex];
    
    // Update step buttons
    document.querySelectorAll('.step-btn').forEach(btn => {
        btn.classList.remove('active', 'btn-primary-glow');
        btn.classList.add('glass-panel', 'text-gray-300');
        
        if (btn.dataset.step === currentStep) {
            btn.classList.remove('glass-panel', 'text-gray-300');
            btn.classList.add('active', 'btn-primary-glow');
        }
    });
    
    // Hide all form steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.add('hidden');
    });
    
    // Show current step
    const currentStepElement = document.getElementById(currentStep + 'Step');
    if (currentStepElement) {
        currentStepElement.classList.remove('hidden');
    }
    
    // Update progress bar
    updateProgressBar(currentStep);
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevStepBtn');
    const nextBtn = document.getElementById('nextStepBtn');
    
    if (prevBtn) {
        if (currentStepIndex === 0) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }
    }
    
    if (nextBtn) {
        if (currentStepIndex === STEPS.length - 1) {
            nextBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Finish';
        } else {
            nextBtn.innerHTML = 'Next Step <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>';
        }
    }
    
    // Update guidance text
    updateGuidanceText(currentStep);
}

function nextStep() {
    if (currentStepIndex < STEPS.length - 1) {
        currentStepIndex++;
        updateUI();
        saveToLocalStorage();
    } else if (currentStepIndex === STEPS.length - 1) {
        // Finish step - show completion
        showToast('🎉 Resume completed! Ready to download.');
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        updateUI();
    }
}

function updateProgressBar(step) {
    const steps = ['personal', 'education', 'experience', 'projects', 'skills', 'certifications', 'finish'];
    const currentIndex = steps.indexOf(step);
    const progressPercent = ((currentIndex + 1) / steps.length) * 100;
    
    const progressBarFill = document.getElementById('progressBarFill');
    if (progressBarFill) {
        progressBarFill.style.width = `${progressPercent}%`;
    }
    
    // Update step indicators
    document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
        if (index <= currentIndex) {
            stepEl.classList.remove('glass-panel', 'text-gray-400');
            stepEl.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-cyan-600', 'text-white');
        } else {
            stepEl.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-cyan-600', 'text-white');
            stepEl.classList.add('glass-panel', 'text-gray-400');
        }
    });
}

function updateGuidanceText(step) {
    const guidanceTexts = {
        personal: 'Fill in your basic contact details and professional summary. This helps employers get to know you.',
        education: 'Add your educational background, including degrees, institutions, and academic achievements.',
        experience: 'List your work experience with detailed descriptions of responsibilities and achievements.',
        projects: 'Showcase your projects with technologies used, your role, and outcomes achieved.',
        skills: 'Highlight your technical and soft skills relevant to the job you\'re targeting.',
        certifications: 'Add any certifications, awards, or achievements that demonstrate your expertise.',
        finish: 'Review your resume, get ATS score, and download it in multiple formats.'
    };
    
    const guidanceElement = document.querySelector('#sectionGuidance p');
    const titleElement = document.querySelector('#sectionGuidance h4');
    
    if (guidanceElement && titleElement) {
        guidanceElement.textContent = guidanceTexts[step] || '';
        titleElement.textContent = step.charAt(0).toUpperCase() + step.slice(1);
    }
}

// ---------- DYNAMIC ENTRIES ----------
function addEducationEntry() {
    const container = document.getElementById('educationList');
    if (!container) return;
    
    const id = 'edu-' + Date.now();
    // draggable="true" add kiya gaya hai drag and drop support ke liye
    const html = `
        <div class="entry-card glass-panel p-5 rounded-xl mb-4 relative group cursor-grab active:cursor-grabbing" 
             draggable="true" 
             data-id="${id}">
            
            <div class="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
                <i class="fas fa-grip-vertical text-lg"></i>
            </div>

            <button onclick="removeEntry('${id}')" class="absolute top-3 right-3 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100 z-10">
                <i class="fas fa-trash text-sm"></i>
            </button>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">School/University</label>
                    <input type="text" class="edu-school form-input w-full" placeholder="Harvard University" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Degree</label>
                    <input type="text" class="edu-degree form-input w-full" placeholder="B.Sc. Computer Science" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Field of Study</label>
                    <input type="text" class="edu-field form-input w-full" placeholder="Computer Science" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Graduation Year</label>
                    <input type="text" class="edu-year form-input w-full" placeholder="2022" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-300 mb-2">Achievements/Coursework</label>
                    <textarea class="edu-desc form-input w-full" rows="2" placeholder="Relevant coursework, honors, or achievements..." oninput="saveToLocalStorage(); updatePreview();"></textarea>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    
    // Nayi entry add hone ke baad Drag & Drop listeners ko refresh karna zaroori hai
    initDragAndDrop('educationList'); 
    
    saveToLocalStorage();
    updatePreview();
    calculateBasicAtsScore();
    showToast('Education entry added');
}

function addExperienceEntry() {
    const container = document.getElementById('experienceList');
    if (!container) return;
    
    const id = 'exp-' + Date.now();
    const html = `
        <div class="entry-card glass-panel p-5 rounded-xl mb-4 relative group" data-id="${id}">
            <button onclick="removeEntry('${id}')" class="absolute top-3 right-3 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100">
                <i class="fas fa-trash text-sm"></i>
            </button>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Company</label>
                    <input type="text" class="exp-company form-input w-full" placeholder="Google" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                    <input type="text" class="exp-position form-input w-full" placeholder="Senior Software Engineer" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                    <input type="text" class="exp-start form-input w-full" placeholder="Jan 2020" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                    <input type="text" class="exp-end form-input w-full" placeholder="Present" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-300 mb-2">Responsibilities & Achievements</label>
                    <textarea class="exp-desc form-input w-full" rows="3" placeholder="Describe your role, responsibilities, and key achievements..." oninput="saveToLocalStorage(); updatePreview();"></textarea>
                  <button type="button" class="mt-2 px-4 py-1.5 text-sm rounded-lg glass-panel text-blue-400 hover:bg-white/5 auth-lock" onclick="generateAIDescription(this, 'experience')">
                    <i class="fas fa-robot mr-1"></i> Generate with AI
                  </button>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    saveToLocalStorage();
    updatePreview();
    calculateBasicAtsScore();
    showToast('Experience entry added');
}

function addProjectEntry() {
    const container = document.getElementById('projectsList');
    if (!container) return;
    
    const id = 'proj-' + Date.now();
    const html = `
        <div class="entry-card glass-panel p-5 rounded-xl mb-4 relative group" data-id="${id}">
            <button onclick="removeEntry('${id}')" class="absolute top-3 right-3 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100">
                <i class="fas fa-trash text-sm"></i>
            </button>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                    <input type="text" class="proj-name form-input w-full" placeholder="E-commerce Platform" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Technologies Used</label>
                    <input type="text" class="proj-tech form-input w-full" placeholder="React, Node.js, MongoDB" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-300 mb-2">Project Description</label>
                    <textarea class="proj-desc form-input w-full" rows="3" placeholder="Describe the project, your role, and the outcomes..." oninput="saveToLocalStorage(); updatePreview();"></textarea>
                   <button type="button" class="mt-2 px-4 py-1.5 text-sm rounded-lg glass-panel text-blue-400 hover:bg-white/5 auth-lock" onclick="generateAIDescription(this, 'project')">
                    <i class="fas fa-robot mr-1"></i> Generate with AI
                  </button>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    saveToLocalStorage();
    updatePreview();
    calculateBasicAtsScore();
    showToast('Project entry added');
}

function addCertificationEntry() {
    const container = document.getElementById('certificationsList');
    if (!container) return;
    
    const id = 'cert-' + Date.now();
    const html = `
        <div class="entry-card glass-panel p-5 rounded-xl mb-4 relative group" data-id="${id}">
            <button onclick="removeEntry('${id}')" class="absolute top-3 right-3 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100">
                <i class="fas fa-trash text-sm"></i>
            </button>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Certification Name</label>
                    <input type="text" class="cert-name form-input w-full" placeholder="AWS Certified Solutions Architect" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Issuing Organization</label>
                    <input type="text" class="cert-org form-input w-full" placeholder="Amazon Web Services" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Issue Date</label>
                    <input type="text" class="cert-date form-input w-full" placeholder="2023" oninput="saveToLocalStorage(); updatePreview();">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Credential ID (Optional)</label>
                    <input type="text" class="cert-id form-input w-full" placeholder="ABC123XYZ" oninput="saveToLocalStorage(); updatePreview();">
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    saveToLocalStorage();
    updatePreview();
    calculateBasicAtsScore();
    showToast('Certification entry added');
}

function removeEntry(id) {
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
        element.remove();
        saveToLocalStorage();
        updatePreview();
        calculateBasicAtsScore();
        showToast('Entry removed');
    }
}

// ---------- PREVIEW GENERATION ----------
function updatePreview() {
    console.log("Updating Preview (Final Layout)...");

    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const setTxt = (id, val) => { const el = document.getElementById(`preview-${id}`); if (el) el.innerText = val; };
    
    // Strong Toggle Function: Hides element completely if val is empty
    const toggle = (id, show) => { 
        const el = document.getElementById(id); 
        if (el) {
            el.style.display = show ? 'block' : 'none';
        }
    };

    // 1. PERSONAL INFO
    const name = getVal('fullName');
    const title = getVal('jobTitle');
    const phone = getVal('phone');
    const email = getVal('email');
    const address = getVal('location') || getVal('address');
    const profile = getVal('summary') || getVal('profileSummary');

    setTxt('name', name);
    setTxt('title', title);
    setTxt('phone', phone);
    setTxt('email', email);
    setTxt('address', address);
    setTxt('profile', profile);

    // Hide wrappers if empty
    toggle('wrap-phone', phone);
    toggle('wrap-email', email);
    toggle('wrap-address', address);
    
    // Hide separators logic (Optional: Advanced CSS handles gap, but this is cleaner)
    const separators = document.querySelectorAll('.separator');
    separators.forEach(sep => sep.style.display = (phone && email) ? 'inline' : 'none'); 

    toggle('section-summary', profile);

   // 2. SKILLS (Universal Pills Logic)
    const renderPills = (elementId, value) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        if (!value) {
            el.innerHTML = '';
            return;
        }

        const items = value.split(',').map(item => item.trim()).filter(i => i);
        
        // CSS Style Inject for Pills (Elegant & Bold Themes)
        el.innerHTML = items.map(item => 
            `<span style="
                background: #ecf0f1; 
                color: #2c3e50; 
                padding: 6px 15px; 
                border-radius: 20px; 
                font-weight: 600; 
                font-size: 11px; 
                display: inline-block; 
                margin-bottom: 5px;
                border: 1px solid #dee2e6;">
                ${item}
            </span>`
        ).join(' ');
    };

    // ---------------------------------------------------------
    // 2. SKILLS LOGIC (Universal Handler)
    // ---------------------------------------------------------
    
    const renderUniversalSkills = (elementId, value) => {
        const el = document.getElementById(elementId);
        const previewArea = document.getElementById('resume-preview-area');
        
        if (!el) return;
        if (!value) { el.innerHTML = ''; return; }

        const items = value.split(',').map(item => item.trim()).filter(i => i);
        
        // Default Class
        let itemClass = 'pill-badge'; 
        let wrapperClass = '';

        // Check Theme
        if (previewArea) {
            if (previewArea.classList.contains('professional-theme')) {
                itemClass = 'skill-box'; // Square Box
            } else if (previewArea.classList.contains('luxury-theme')) {
                itemClass = 'gold-skill-item'; // Gold Text with Bullet
                wrapperClass = 'gold-skill-container'; // Flex container
            }
        }

        // Apply HTML
        el.className = wrapperClass || 'pill-container';
        el.innerHTML = items.map(item => 
            `<span class="${itemClass}">${item}</span>`
        ).join('');
    };

    // Apply Logic
    renderUniversalSkills('preview-skills', getVal('technicalSkills') || getVal('skills'));
    renderUniversalSkills('preview-soft-skills', getVal('softSkills'));
    renderUniversalSkills('preview-tools-skills', getVal('tools'));
    renderUniversalSkills('preview-languages', getVal('languages'));
    renderUniversalSkills('preview-hobbies', getVal('hobbies'));

    // Apply pills to Skills, Tools, and Languages
    renderPills('preview-skills', getVal('technicalSkills') || getVal('skills'));
    renderPills('preview-tools-skills', getVal('tools'));
    renderPills('preview-languages', getVal('languages'));
    
    // Toggles
    toggle('wrap-tech-skills', getVal('technicalSkills') || getVal('skills'));
    toggle('wrap-tools-skills', getVal('tools'));
    toggle('section-languages', getVal('languages'));



    // 3. LANGUAGES & HOBBIES (Fix: Only show if NOT empty)
    const langs = getVal('languages');
    const hobbies = getVal('hobbies');

    const setList = (id, val) => {
        const el = document.getElementById(`preview-${id}`);
        if (el) el.innerHTML = val ? val.split(',').map(s => `<li>${s.trim()}</li>`).join('') : '';
    };

    setList('languages', langs);
    setList('hobbies', hobbies);

    // Ye line magic karegi: Agar 'langs' khali hai to section gayab
    toggle('section-languages', langs && langs.length > 0);
    toggle('section-hobbies', hobbies && hobbies.length > 0);

    // 4. DYNAMIC SECTIONS
    const renderSection = (listId, previewId, sectionId, templateFn) => {
        const container = document.getElementById(listId);
        const previewEl = document.getElementById(`preview-${previewId}`);
        if (!container || !previewEl) return;

        const items = container.querySelectorAll('.entry-card');
        let html = '';
        let hasContent = false;

        items.forEach(item => {
            const data = {};
            item.querySelectorAll('input, textarea').forEach(input => {
                let key = input.className.split(' ').find(c => c.includes('-'));
                if(key && key.includes('-')) key = key.split('-')[1];
                data[key] = input.value.trim();
            });

            // Validation: Show only if valid data exists
            const isEdu = sectionId === 'section-education';
            const isValid = isEdu ? (data.school || data.degree) : (data.position || data.company || data.name);

            if (isValid) {
                hasContent = true;
                html += templateFn(data);
            }
        });

        previewEl.innerHTML = html;
        toggle(sectionId, hasContent);
    };

    renderSection('experienceList', 'experience', 'section-experience', (data) => `
        <div class="template-experience-item">
            <h3>${data.position} <span>${data.start ? data.start + (data.end ? ' - ' + data.end : '') : ''}</span></h3>
            <div class="sub-text">${data.company}</div>
            ${data.desc ? `<ul>${data.desc.split('\n').map(line => `<li>${line}</li>`).join('')}</ul>` : ''}
        </div>
    `);

    renderSection('educationList', 'education', 'section-education', (data) => `
        <div class="template-education-item">
            <h3>${data.degree} <span>${data.year}</span></h3>
            <div class="sub-text">${data.school}${data.field ? ', ' + data.field : ''}</div>
            ${data.desc ? `<ul>${data.desc.split('\n').map(line => `<li>${line}</li>`).join('')}</ul>` : ''}
        </div>
    `);

    renderSection('projectsList', 'projects', 'section-projects', (data) => `
        <div class="template-project-item">
            <h3>${data.name}</h3>
            ${data.tech ? `<div class="sub-text">${data.tech}</div>` : ''}
            ${data.desc ? `<ul>${data.desc.split('\n').map(line => `<li>${line}</li>`).join('')}</ul>` : ''}
        </div>
    `);

    renderSection('certificationsList', 'certifications', 'section-certifications', (data) => `
        <div class="certification-item" style="margin-bottom: 15px;">
            <h3>${data.name} <span>${data.date}</span></h3>
            <div class="sub-text">${data.org} ${data.id ? `| ID: ${data.id}` : ''}</div>
        </div>
    `);
}


function generateResumeHTML(data, template, isLightMode) {
    // Default color scheme based on mode
    const colors = isLightMode ? {
        primary: '#1e40af',
        secondary: '#374151',
        light: '#6b7280',
        background: '#ffffff',
        text: '#111827',
        border: '#e5e7eb'
    } : {
        primary: '#60a5fa',
        secondary: '#cbd5e1',
        light: '#94a3b8',
        background: '#0f172a',
        text: '#f8fafc',
        border: '#334155'
    };
    
    // Template-specific styling
    const templates = {
        modern: {
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            spacing: '1.5rem',
            accentColor: colors.primary
        },
        classic: {
            fontFamily: "'Times New Roman', Times, serif",
            spacing: '1.2rem',
            accentColor: colors.text
        },
        minimal: {
            fontFamily: "'Inter', 'Arial', sans-serif",
            spacing: '1rem',
            accentColor: colors.primary
        },
        professional: {
            fontFamily: "'Calibri', 'Arial', sans-serif",
            spacing: '1.3rem',
            accentColor: '#2c5282'
        }
    };
    
    const style = templates[template] || templates.modern;
    
    // Helper function to check if section has content
    const hasContent = (section) => {
        if (Array.isArray(section)) return section.length > 0;
        if (typeof section === 'object') return Object.values(section).some(val => val && val.trim());
        return section && section.trim();
    };
    
    return `
        <div class="resume-template ${template}" style="
            font-family: ${style.fontFamily};
            color: ${colors.text};
            background: ${colors.background};
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.5;
            border: 1px solid ${colors.border};
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        ">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: ${style.spacing};">
                <h1 style="
                    color: ${style.accentColor};
                    font-size: 2.2rem;
                    margin: 0 0 0.5rem 0;
                    font-weight: 700;
                ">
                    ${data.personal.fullName || 'Your Name'}
                </h1>
                <div style="
                    color: ${colors.primary};
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin-bottom: 0.75rem;
                ">
                    ${data.personal.jobTitle || 'Professional Title'}
                </div>
                <div style="
                    color: ${colors.light};
                    font-size: 0.9rem;
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                ">
                    ${data.personal.email ? `<span>📧 ${data.personal.email}</span>` : ''}
                    ${data.personal.phone ? `<span>📱 ${data.personal.phone}</span>` : ''}
                    ${data.personal.location ? `<span>📍 ${data.personal.location}</span>` : ''}
                    ${data.personal.linkedin ? `<span>💼 ${data.personal.linkedin}</span>` : ''}
                </div>
            </div>
            
            <!-- Professional Summary -->
            ${hasContent(data.personal.summary) ? `
                <div style="margin-bottom: ${style.spacing};">
                    <h2 style="
                        color: ${style.accentColor};
                        font-size: 1.2rem;
                        border-bottom: 2px solid ${style.accentColor};
                        padding-bottom: 0.3rem;
                        margin-bottom: 0.8rem;
                        font-weight: 600;
                    ">
                        PROFESSIONAL SUMMARY
                    </h2>
                    <p style="margin: 0; font-size: 1rem;">
                        ${data.personal.summary}
                    </p>
                </div>
            ` : ''}
            
            <!-- Work Experience -->
            ${hasContent(data.experience) ? `
                <div style="margin-bottom: ${style.spacing};">
                    <h2 style="
                        color: ${style.accentColor};
                        font-size: 1.2rem;
                        border-bottom: 2px solid ${style.accentColor};
                        padding-bottom: 0.3rem;
                        margin-bottom: 0.8rem;
                        font-weight: 600;
                    ">
                        WORK EXPERIENCE
                    </h2>
                    ${data.experience.map(exp => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
                                <strong style="font-size: 1.1rem;">${exp.position || 'Position'}</strong>
                                <span style="color: ${colors.light}; font-size: 0.9rem;">
                                    ${exp.start || ''} ${exp.end ? ' - ' + exp.end : ''}
                                </span>
                            </div>
                            <div style="
                                color: ${colors.primary};
                                font-weight: 600;
                                margin-bottom: 0.5rem;
                                font-size: 1rem;
                            ">
                                ${exp.company || 'Company'}
                            </div>
                            <p style="margin: 0; font-size: 0.95rem;">
                                ${exp.desc || 'Responsibilities and achievements...'}
                            </p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Education -->
            ${hasContent(data.education) ? `
                <div style="margin-bottom: ${style.spacing};">
                    <h2 style="
                        color: ${style.accentColor};
                        font-size: 1.2rem;
                        border-bottom: 2px solid ${style.accentColor};
                        padding-bottom: 0.3rem;
                        margin-bottom: 0.8rem;
                        font-weight: 600;
                    ">
                        EDUCATION
                    </h2>
                    ${data.education.map(edu => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
                                <strong style="font-size: 1.1rem;">${edu.school || 'University'}</strong>
                                <span style="color: ${colors.light}; font-size: 0.9rem;">
                                    ${edu.year || 'Year'}
                                </span>
                            </div>
                            <div style="margin-bottom: 0.3rem; font-size: 1rem;">
                                ${edu.degree || 'Degree'} ${edu.field ? 'in ' + edu.field : ''}
                            </div>
                            ${edu.desc ? `<div style="font-size: 0.95rem; color: ${colors.light};">${edu.desc}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Skills -->
            ${hasContent(data.skills) ? `
                <div style="margin-bottom: ${style.spacing};">
                    <h2 style="
                        color: ${style.accentColor};
                        font-size: 1.2rem;
                        border-bottom: 2px solid ${style.accentColor};
                        padding-bottom: 0.3rem;
                        margin-bottom: 0.8rem;
                        font-weight: 600;
                    ">
                        SKILLS
                    </h2>
                    <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
                        ${data.skills.technical ? `
                            <div>
                                <strong style="display: block; margin-bottom: 0.3rem;">Technical:</strong>
                                <div style="font-size: 0.95rem;">${data.skills.technical}</div>
                            </div>
                        ` : ''}
                        ${data.skills.soft ? `
                            <div>
                                <strong style="display: block; margin-bottom: 0.3rem;">Soft Skills:</strong>
                                <div style="font-size: 0.95rem;">${data.skills.soft}</div>
                            </div>
                        ` : ''}
                        ${data.skills.tools ? `
                            <div>
                                <strong style="display: block; margin-bottom: 0.3rem;">Tools:</strong>
                                <div style="font-size: 0.95rem;">${data.skills.tools}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            <!-- Certifications -->
            ${hasContent(data.certifications) ? `
                <div style="margin-bottom: ${style.spacing};">
                    <h2 style="
                        color: ${style.accentColor};
                        font-size: 1.2rem;
                        border-bottom: 2px solid ${style.accentColor};
                        padding-bottom: 0.3rem;
                        margin-bottom: 0.8rem;
                        font-weight: 600;
                    ">
                        CERTIFICATIONS
                    </h2>
                    ${data.certifications.map(cert => `
                        <div style="margin-bottom: 0.8rem;">
                            <div style="font-weight: 600; margin-bottom: 0.2rem;">
                                ${cert.name || 'Certification Name'}
                            </div>
                            <div style="color: ${colors.light}; font-size: 0.9rem;">
                                ${cert.org || 'Issuing Organization'} • ${cert.date || 'Date'}
                                ${cert.id ? ` • ID: ${cert.id}` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Projects -->
            ${hasContent(data.projects) ? `
                <div>
                    <h2 style="
                        color: ${style.accentColor};
                        font-size: 1.2rem;
                        border-bottom: 2px solid ${style.accentColor};
                        padding-bottom: 0.3rem;
                        margin-bottom: 0.8rem;
                        font-weight: 600;
                    ">
                        PROJECTS
                    </h2>
                    ${data.projects.map(proj => `
                        <div style="margin-bottom: 1rem;">
                            <div style="font-weight: 600; margin-bottom: 0.3rem;">
                                ${proj.name || 'Project Name'}
                            </div>
                            ${proj.tech ? `
                                <div style="color: ${colors.primary}; font-size: 0.9rem; margin-bottom: 0.3rem;">
                                    Technologies: ${proj.tech}
                                </div>
                            ` : ''}
                            <div style="font-size: 0.95rem;">
                                ${proj.desc || 'Project description...'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// ---------- DATA MANAGEMENT ----------
function gatherResumeData() {
    return {
        personal: {
            fullName: getValue('fullName'),
            jobTitle: getValue('jobTitle'),
            email: getValue('email'),
            phone: getValue('phone'),
            location: getValue('location'),
            summary: getValue('summary'),
            linkedin: getValue('linkedin'),
            github: getValue('github'),
            portfolio: getValue('portfolio')
        },
        education: Array.from(document.querySelectorAll('#educationList .entry-card')).map(card => ({
            school: card.querySelector('.edu-school')?.value || '',
            degree: card.querySelector('.edu-degree')?.value || '',
            field: card.querySelector('.edu-field')?.value || '',
            year: card.querySelector('.edu-year')?.value || '',
            desc: card.querySelector('.edu-desc')?.value || ''
        })),
        experience: Array.from(document.querySelectorAll('#experienceList .entry-card')).map(card => ({
            company: card.querySelector('.exp-company')?.value || '',
            position: card.querySelector('.exp-position')?.value || '',
            start: card.querySelector('.exp-start')?.value || '',
            end: card.querySelector('.exp-end')?.value || '',
            desc: card.querySelector('.exp-desc')?.value || ''
        })),
        projects: Array.from(document.querySelectorAll('#projectsList .entry-card')).map(card => ({
            name: card.querySelector('.proj-name')?.value || '',
            tech: card.querySelector('.proj-tech')?.value || '',
            desc: card.querySelector('.proj-desc')?.value || ''
        })),
        skills: {
            technical: getValue('technicalSkills'),
            soft: getValue('softSkills'),
            tools: getValue('tools')
        },
        certifications: Array.from(document.querySelectorAll('#certificationsList .entry-card')).map(card => ({
            name: card.querySelector('.cert-name')?.value || '',
            org: card.querySelector('.cert-org')?.value || '',
            date: card.querySelector('.cert-date')?.value || '',
            id: card.querySelector('.cert-id')?.value || ''
        }))
    };
}

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
}

function saveToLocalStorage() {
    const data = gatherResumeData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Update ATS score
    calculateBasicAtsScore();
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    
    try {
        const data = JSON.parse(saved);
        
        // Restore personal info
        if (data.personal) {
            setValue('fullName', data.personal.fullName);
            setValue('jobTitle', data.personal.jobTitle);
            setValue('email', data.personal.email);
            setValue('phone', data.personal.phone);
            setValue('location', data.personal.location);
            setValue('summary', data.personal.summary);
            setValue('linkedin', data.personal.linkedin);
            setValue('github', data.personal.github);
            setValue('portfolio', data.personal.portfolio);
        }
        
        // Restore skills
        if (data.skills) {
            setValue('technicalSkills', data.skills.technical);
            setValue('softSkills', data.skills.soft);
            setValue('tools', data.skills.tools);
        }

        
        // Note: Dynamic entries (education, experience, etc.) need to be recreated
        // when their respective steps are loaded
        
    } catch (e) {
        console.error('Error loading saved data:', e);
    }
}


    // 1. Updated Load Function to handle Dynamic Entries
function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    
    try {
        const data = JSON.parse(saved);
        importResumeData(data); // Reusing the import logic
    } catch (e) {
        console.error('Error loading saved data:', e);
    }
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined) {
        element.value = value;
    }
}

// ---------- ATS SCORE CALCULATION ----------
function calculateBasicAtsScore() {
    const data = gatherResumeData();
    let score = 20; // Base score
    
    // Personal info (max 30 points)
    if (data.personal.fullName?.trim()) score += 5;
    if (data.personal.jobTitle?.trim()) score += 5;
    if (data.personal.email?.trim()) score += 5;
    if (data.personal.phone?.trim()) score += 5;
    if (data.personal.summary?.trim()) score += 10;
    
    // Education (max 20 points)
    score += Math.min(20, data.education.length * 5);
    
    // Experience (max 25 points)
    score += Math.min(25, data.experience.length * 5);
    
    // Skills (max 15 points)
    if (data.skills.technical?.trim()) score += 5;
    if (data.skills.soft?.trim()) score += 5;
    if (data.skills.tools?.trim()) score += 5;
    
    // Projects & Certifications (max 10 points)
    score += Math.min(5, data.projects.length * 2);
    score += Math.min(5, data.certifications.length * 2);
    
    // Cap at 100
    score = Math.min(100, score);
    
    // Update UI
    const scoreElement = document.getElementById('basicAtsScorePreview');
    const barElement = document.getElementById('basicAtsScoreBarPreview');
    
    if (scoreElement) {
        scoreElement.textContent = score;
    }
    
    if (barElement) {
        barElement.style.width = `${score}%`;
        
        // Update color based on score
        if (score >= 80) {
            barElement.style.background = 'linear-gradient(to right, #10b981, #34d399)';
        } else if (score >= 60) {
            barElement.style.background = 'linear-gradient(to right, #f59e0b, #fbbf24)';
        } else {
            barElement.style.background = 'linear-gradient(to right, #ef4444, #f87171)';
        }
    }
    
    return score;
}

// ---------- AI INTEGRATION ----------
async function generateAISummary() {
    const fullName = getValue('fullName');
    const jobTitle = getValue('jobTitle');
    const skeleton = document.getElementById('summarySkeleton');
    const textarea = document.getElementById('summary');

    if (!fullName || !jobTitle) {
        showToast('Please enter your name and job title first', 'error');
        return;
    }

    // Show Skeleton & Hide Text
    skeleton.style.display = 'flex';
    textarea.style.color = 'transparent';

    try {
        const response = await fetch(`${BACKEND_API_URL}/api/ai/summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullName,
                job_title: jobTitle,
                technical_skills: getValue('technicalSkills')
            })
        });
        
        const data = await response.json();
        if (data.summary) {
            setValue('summary', data.summary);
        }
    } catch (error) {
        console.error('AI Error:', error);
        showToast('Failed to generate AI summary', 'error');
    } finally {
        // Hide Skeleton & Show Text
        skeleton.style.display = 'none';
        textarea.style.color = '';
        saveToLocalStorage();
        updatePreview();
    }
}

async function generateAIDescription(button, type) {
    const entry = button.closest('.entry-card');
    if (!entry) return;
    
    showLoader();
    
    try {
        let content = {};
        let prompt = '';
        
        if (type === 'experience') {
            content = {
                position: entry.querySelector('.exp-position')?.value || '',
                company: entry.querySelector('.exp-company')?.value || ''
            };
            prompt = `Generate a professional work experience description for a ${content.position} at ${content.company}`;
        } else if (type === 'project') {
            content = {
                name: entry.querySelector('.proj-name')?.value || ''
            };
            prompt = `Generate a professional project description for "${content.name}"`;
        }
        
        const response = await fetch(`${BACKEND_API_URL}/api/ai/description`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                section_type: type,
                content: content
            })
        });
        
        const data = await response.json();
        
        if (data.description) {
            const textarea = type === 'experience' 
                ? entry.querySelector('.exp-desc')
                : entry.querySelector('.proj-desc');
            
            if (textarea) {
                textarea.value = data.description;
                saveToLocalStorage();
                updatePreview();
                showToast('AI description generated!');
            }
        }
    } catch (error) {
        console.error('AI Description Error:', error);
        showToast('Using fallback description', 'error');
    } finally {
        hideLoader();
    }
}

async function analyzeKeywords() {
    const jobDescription = document.getElementById('jobDescription')?.value;
    
    if (!jobDescription?.trim()) {
        showToast('Please paste a job description first', 'error');
        return;
    }
    
    showLoader();
    
    try {
        const resumeData = gatherResumeData();
        
        const response = await fetch(`${BACKEND_API_URL}/api/ai/analyze-keywords`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                job_description: jobDescription,
                resume_data: resumeData
            })
        });
        
        const data = await response.json();
        
        // Display results
        displayKeywordResults(data);
        showToast('Keyword analysis complete!');
        
    } catch (error) {
        console.error('Keyword Analysis Error:', error);
        showToast('Failed to analyze keywords', 'error');
        
        // Show demo results
        displayDemoKeywordResults();
    } finally {
        hideLoader();
    }
}

function displayKeywordResults(data) {
    const matchingContainer = document.getElementById('matchingKeywords');
    const missingContainer = document.getElementById('missingKeywords');
    const resultsContainer = document.getElementById('keywordResults');
    
    if (!matchingContainer || !missingContainer || !resultsContainer) return;

    // Clear and Show
    matchingContainer.innerHTML = '';
    missingContainer.innerHTML = '';
    resultsContainer.classList.remove('hidden');

    // Display Matching
    const matches = data.matching_keywords || [];
    document.getElementById('matchCount').textContent = matches.length;
    matches.forEach(kw => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag matching';
        tag.innerHTML = `<i class="fas fa-check"></i> ${kw}`;
        matchingContainer.appendChild(tag);
    });

    // Display Missing
    const missing = data.missing_keywords || [];
    document.getElementById('missCount').textContent = missing.length;
    missing.forEach(kw => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag missing';
        tag.innerHTML = `<i class="fas fa-plus"></i> ${kw}`;
        missingContainer.appendChild(tag);
    });

    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function displayDemoKeywordResults() {
    const resultsContainer = document.getElementById('keywordResults');
    const matchingContainer = document.getElementById('matchingKeywords');
    const missingContainer = document.getElementById('missingKeywords');
    
    if (!resultsContainer || !matchingContainer || !missingContainer) return;
    
    // Demo data
    const matchingKeywords = ['JavaScript', 'React', 'Node.js', 'HTML5', 'CSS3'];
    const missingKeywords = ['TypeScript', 'AWS', 'Docker', 'MongoDB', 'GraphQL'];
    
    // Clear previous results
    matchingContainer.innerHTML = '';
    missingContainer.innerHTML = '';
    
    // Display matching keywords
    matchingKeywords.forEach(keyword => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.textContent = keyword;
        matchingContainer.appendChild(tag);
    });
    
    // Display missing keywords
    missingKeywords.forEach(keyword => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag missing';
        tag.textContent = keyword;
        missingContainer.appendChild(tag);
    });
    
    // Show results container
    resultsContainer.classList.remove('hidden');
}


function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            // Clear existing dynamic entries first
            clearDynamicEntries();
            
            // Import data
            importResumeData(data);
            showToast('Resume imported successfully!');
        } catch (error) {
            console.error('JSON Import Error:', error);
            showToast('Invalid JSON file', 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

function importResumeData(data) {
    if (!data) return;

    // Clear existing dynamic entries first
    clearDynamicEntries();

    // Restore personal info
    if (data.personal) {
        Object.keys(data.personal).forEach(key => {
            setValue(key, data.personal[key]);
        });
    }
    
    // Restore skills
    if (data.skills) {
        setValue('technicalSkills', data.skills.technical);
        setValue('softSkills', data.skills.soft);
        setValue('tools', data.skills.tools);
    }

    // IMPORTANT: Recreate Dynamic Entries
    if (data.education) data.education.forEach(edu => {
        addEducationEntry();
        const lastEntry = document.querySelector('#educationList .entry-card:last-child');
        if(lastEntry) {
            lastEntry.querySelector('.edu-school').value = edu.school || '';
            lastEntry.querySelector('.edu-degree').value = edu.degree || '';
            lastEntry.querySelector('.edu-field').value = edu.field || '';
            lastEntry.querySelector('.edu-year').value = edu.year || '';
            lastEntry.querySelector('.edu-desc').value = edu.desc || '';
        }
    });

    if (data.experience) data.experience.forEach(exp => {
        addExperienceEntry();
        const lastEntry = document.querySelector('#experienceList .entry-card:last-child');
        if(lastEntry) {
            lastEntry.querySelector('.exp-company').value = exp.company || '';
            lastEntry.querySelector('.exp-position').value = exp.position || '';
            lastEntry.querySelector('.exp-start').value = exp.start || '';
            lastEntry.querySelector('.exp-end').value = exp.end || '';
            lastEntry.querySelector('.exp-desc').value = exp.desc || '';
        }
    });


    // Projects loading logic
if (data.projects) data.projects.forEach(proj => {
    addProjectEntry();
    const lastEntry = document.querySelector('#projectsList .entry-card:last-child');
    if(lastEntry) {
        lastEntry.querySelector('.proj-name').value = proj.name || '';
        lastEntry.querySelector('.proj-tech').value = proj.tech || '';
        lastEntry.querySelector('.proj-desc').value = proj.desc || '';
    }
});

// Certifications loading logic
if (data.certifications) data.certifications.forEach(cert => {
    addCertificationEntry();
    const lastEntry = document.querySelector('#certificationsList .entry-card:last-child');
    if(lastEntry) {
        lastEntry.querySelector('.cert-name').value = cert.name || '';
        lastEntry.querySelector('.cert-org').value = cert.org || '';
        lastEntry.querySelector('.cert-date').value = cert.date || '';
        lastEntry.querySelector('.cert-id').value = cert.id || '';
    }
});

    // Projects aur Certifications ke liye bhi same pattern follow karein...
    
    updatePreview();
    calculateBasicAtsScore();
}

function clearDynamicEntries() {
    // Clear all dynamic entry containers
    ['educationList', 'experienceList', 'projectsList', 'certificationsList'].forEach(id => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = '';
    });
}

// ---------- MODAL FUNCTIONS ----------
function openPDFPreview() {
    const modal = document.getElementById('pdfPreviewModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Update PDF preview content
        const pdfPreview = document.getElementById('pdfPreview');
        if (pdfPreview) {
            const data = gatherResumeData();
            pdfPreview.innerHTML = generateResumeHTML(data, 
                document.getElementById('templateSelector')?.value || 'modern', 
                false // PDF is always light mode
            );
        }
    }
}

function closePDFPreview() {
    const modal = document.getElementById('pdfPreviewModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function openAIScoreModal() {
    const modal = document.getElementById('aiScoreModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Calculate and display score
        const score = calculateBasicAtsScore();
        const scoreElement = document.getElementById('aiAtsScore');
        const barElement = document.getElementById('aiAtsScoreBar');
        
        if (scoreElement) scoreElement.textContent = score;
        if (barElement) barElement.style.width = `${score}%`;
    }
}

function closeAIScoreModal() {
    const modal = document.getElementById('aiScoreModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// ---------- UTILITY FUNCTIONS ----------
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    
    // --- FIX START: Changed 'bottom-6' to 'bottom-24 md:bottom-6' ---
    let baseClasses = 'fixed bottom-24 md:bottom-6 right-6 text-white px-6 py-4 rounded-xl shadow-xl transform translate-x-full transition-transform duration-500 z-[110]';
    // --- FIX END ---

    // Add type-specific colors
    if (type === 'success') {
        toast.className = `${baseClasses} bg-gradient-to-r from-green-500 to-emerald-600`;
    } else if (type === 'error') {
        toast.className = `${baseClasses} bg-gradient-to-r from-red-500 to-pink-600`;
    } else if (type === 'info') {
        toast.className = `${baseClasses} bg-gradient-to-r from-blue-500 to-cyan-600`;
    } else if (type === 'warning') {
        toast.className = `${baseClasses} bg-gradient-to-r from-yellow-500 to-orange-600`;
    }
    
    // Show toast
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
    }, 3000);
}

function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.classList.remove('hidden');
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.classList.add('hidden');
}

function initAutoSave() {
    // Auto-save on input
    document.querySelectorAll('input, textarea, select').forEach(element => {
        element.addEventListener('input', () => {
            saveToLocalStorage();
            updatePreview();
        });
    });
    
    // Auto-save on change (for select elements)
    document.querySelectorAll('select').forEach(element => {
        element.addEventListener('change', () => {
            saveToLocalStorage();
            updatePreview();
        });
    });
}

// ---------- EVENT LISTENERS INITIALIZATION ----------
function initEventListeners() {
    console.log("Initializing Event Listeners...");
    
    // Debounce setup for typing
    const debouncedUpdate = (typeof debounce === 'function') 
        ? debounce(updatePreview, 300) 
        : updatePreview;

    // 1. Navigation (Next/Prev)
    document.getElementById('nextStepBtn')?.addEventListener('click', window.nextStep);
    document.getElementById('prevStepBtn')?.addEventListener('click', window.prevStep);

    // 2. Sidebar Steps
    document.querySelectorAll('.step-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const step = btn.dataset.step;
            // Global STEPS array use kar rahe hain
            const index = (typeof STEPS !== 'undefined') ? STEPS.indexOf(step) : -1;
            if (index !== -1) {
                currentStepIndex = index;
                updateUI();
            }
        });
    });

    // 3. Form Inputs (Real-time Preview)
    const form = document.getElementById('resumeForm');
    if (form) {
        form.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                debouncedUpdate();
            }
        });
    }

    // 4. Add Entry Buttons
    const bindAddBtn = (id, func) => {
        const btn = document.getElementById(id);
        if(btn) btn.addEventListener('click', func);
    }
    bindAddBtn('addEducationBtn', () => typeof addEducationEntry === 'function' && addEducationEntry());
    bindAddBtn('addExperienceBtn', () => typeof addExperienceEntry === 'function' && addExperienceEntry());
    bindAddBtn('addProjectBtn', () => typeof addProjectEntry === 'function' && addProjectEntry());
    bindAddBtn('addCertificationBtn', () => typeof addCertificationEntry === 'function' && addCertificationEntry());

    // 5. DOWNLOAD BUTTONS (ULTIMATE FIX - Anti Double Click)
    const setupDownloadButton = (id, actionFunction) => {
        const oldBtn = document.getElementById(id);
        if (oldBtn) {
            // Clone karke purane listeners hataye
            const newBtn = oldBtn.cloneNode(true);
            
            // HTML onclick attribute remove kiya
            newBtn.removeAttribute('onclick');
            
            oldBtn.parentNode.replaceChild(newBtn, oldBtn);

            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Button Disable Logic
                newBtn.disabled = true;
                const originalHtml = newBtn.innerHTML;
                newBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

                // Action Call
                if (typeof actionFunction === 'function') {
                    actionFunction();
                } else {
                    alert("Download function missing!");
                }

                // Re-enable after 3 seconds
                setTimeout(() => {
                    newBtn.disabled = false;
                    newBtn.innerHTML = originalHtml;
                }, 3000);
            });
        }
    };

    setupDownloadButton('downloadPdfBtn', window.exportResumePDF);
    setupDownloadButton('downloadWordBtn', window.exportResumeDOCX);
    setupDownloadButton('downloadPdfFinalBtn', window.exportResumePDF);
    setupDownloadButton('downloadDocxFinalBtn', window.exportResumeDOCX);

    // 6. Photo Upload
    const photoInput = document.getElementById('profilePhoto') || document.getElementById('profilePhotoInput');
    if (photoInput && typeof handlePhotoUpload === 'function') {
        photoInput.addEventListener('change', handlePhotoUpload);
    }

    // 7. TEMPLATE SELECTOR (CRITICAL FIX)
    // Change hone par loadTemplate call hoga, sirf updatePreview nahi
    const templateSelector = document.getElementById('templateSelector');
    if (templateSelector) {
        templateSelector.addEventListener('change', (e) => {
            const newTemplate = e.target.value;
            console.log("Template Changed to:", newTemplate);
            document.body.setAttribute('data-template', newTemplate);
            if (typeof loadTemplate === 'function') {
                loadTemplate(newTemplate);
            }
        });
    }

    // ==========================================
    // 8. AI BUTTONS FIX (Yeh Naya Code Hai)
    // ==========================================
    
    // 1. Summary Generator Button
    const summaryBtn = document.getElementById('generateSummaryBtn');
    if (summaryBtn) {
        summaryBtn.addEventListener('click', function() {
            console.log("Generating Summary...");
            if (typeof generateAISummary === 'function') {
                generateAISummary();
            } else {
                alert("Error: AI function not loaded.");
            }
        });
    }

    // 2. Keyword Analysis Button
    const analyzeBtn = document.getElementById('analyzeKeywordsBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
            if (typeof analyzeKeywords === 'function') {
                analyzeKeywords();
            }
        });
    }

    // 3. ATS Score Button (Keyword Section)
    const atsBtn = document.getElementById('aiAtsAnalysisBtn');
    if (atsBtn) {
        atsBtn.addEventListener('click', function() {
            if (typeof openAIScoreModal === 'function') {
                openAIScoreModal();
            }
        });
    }

    // 4. ATS Score Button (Finish Step)
    const runAiAnalysisBtn = document.getElementById('runAiAnalysisBtn');
    if (runAiAnalysisBtn) {
        runAiAnalysisBtn.addEventListener('click', function() {
            if (typeof openAIScoreModal === 'function') {
                openAIScoreModal();
            }
        });
    }
}


// Function to validate inputs in real-time
function initLiveValidation() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.type === 'email') {
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (re.test(this.value)) {
                    this.classList.add('valid');
                    this.classList.remove('invalid');
                } else if (this.value !== "") {
                    this.classList.add('invalid');
                    this.classList.remove('valid');
                }
            } else if (this.value.trim().length > 2) {
                // General text validation (min 3 chars)
                this.classList.add('valid');
            } else {
                this.classList.remove('valid', 'invalid');
            }
        });
    });
}


// Function to initialize drag and drop for a specific container (FIXED VERSION)
function initDragAndDrop(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('dragstart', e => {
        // FIX 1: Use closest() taaki agar card ke andar kisi text/icon ko drag karein to bhi main card select ho
        const card = e.target.closest('.entry-card');
        if (card) {
            card.classList.add('dragging');
        }
    });

    container.addEventListener('dragend', e => {
        const card = e.target.closest('.entry-card');
        if (card) {
            card.classList.remove('dragging');
            // Reorder hone ke baad data save aur preview update karein
            saveToLocalStorage();
            updatePreview();
        }
        // Safety cleanup: Ensure class is removed from everything
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    });

    container.addEventListener('dragover', e => {
        e.preventDefault();
        
        // FIX 2: Safety Check - Pehle check karo ki dragging element exist karta hai ya nahi
        const draggable = document.querySelector('.dragging');
        if (!draggable) return; // Agar null hai to yahi ruk jao (Crash se bachayega)

        const afterElement = getDragAfterElement(container, e.clientY);
        
        if (afterElement == null) {
            container.appendChild(draggable);
        } else {
            container.insertBefore(draggable, afterElement);
        }
    });
}

// Helper function to find the element position
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.entry-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ---------- GLOBAL EXPORTS ----------
// Make functions available globally
window.nextStep = nextStep;
window.prevStep = prevStep;
window.addEducationEntry = addEducationEntry;
window.addExperienceEntry = addExperienceEntry;
window.addProjectEntry = addProjectEntry;
window.addCertificationEntry = addCertificationEntry;
window.removeEntry = removeEntry;
window.generateAIDescription = generateAIDescription;
window.analyzeKeywords = analyzeKeywords;
window.exportJSON = exportJSON;
window.importJSON = importJSON;
window.openPDFPreview = openPDFPreview;
window.closePDFPreview = closePDFPreview;
window.openAIScoreModal = openAIScoreModal;
window.closeAIScoreModal = closeAIScoreModal;
/* builder.js के सबसे नीचे (Bottom) यह पेस्ट करें */



// ==========================================
// MOBILE BOTTOM NAV LOGIC (Universal)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Highlight Active Tab based on URL
    const currentPath = window.location.pathname;
    const bottomLinks = document.querySelectorAll('.bottom-nav-item');
    
    bottomLinks.forEach(link => {
        // Check if link's href matches current path
        // (link.getAttribute('href') checks the relative path like '/builder')
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
            link.classList.remove('text-gray-400');
        }
    });

    // 2. Bottom Bar Theme Toggle Logic
    const bottomThemeBtn = document.getElementById('bottomThemeToggle');
    
    if(bottomThemeBtn) {
        // Sync icon with current theme
        const updateBottomIcon = () => {
            const isLight = document.body.classList.contains('light-mode');
            const icon = bottomThemeBtn.querySelector('i');
            const text = bottomThemeBtn.querySelector('span');
            
            if(isLight) {
                icon.className = 'fas fa-moon mb-1'; // Show Moon in Light Mode
                icon.style.color = '#3b82f6'; // Blue moon
            } else {
                icon.className = 'fas fa-sun mb-1'; // Show Sun in Dark Mode
                icon.style.color = '#fbbf24'; // Yellow sun
            }
        };

        // Initial check
        updateBottomIcon();

        // Click Handler (Uses your existing toggleTheme function if available, else manual)
        bottomThemeBtn.addEventListener('click', () => {
            // Try clicking the main desktop toggle to keep logic synced
            const mainToggle = document.getElementById('themeToggle');
            if(mainToggle) {
                mainToggle.click();
            } else {
                // Fallback manual toggle
                document.body.classList.toggle('light-mode');
                const isLight = document.body.classList.contains('light-mode');
                localStorage.setItem('theme', isLight ? 'light' : 'dark');
            }
            // Update icon after toggle
            setTimeout(updateBottomIcon, 50); 
        });
        
        // Listen for global theme changes (if main toggle is clicked elsewhere)
        const observer = new MutationObserver(updateBottomIcon);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
});

// builder.js -> End mein check karo

// builder.js -> loadTemplate (Cache Buster Fix)

async function loadTemplate(templateId) {
    const previewArea = document.getElementById('template-render-area');
    
    // Loading Effect
    previewArea.style.opacity = '0.5';

    try {
        console.log(`🔄 Loading Template: ${templateId}`);

        // 1. HTML Load Karo
        const response = await fetch(`/resume_templates/${templateId}.html`);
        if (!response.ok) throw new Error(`HTML file not found: ${templateId}.html`);
        
        const html = await response.text();
        previewArea.innerHTML = html;

        // 2. CSS SWAP KARO (FORCE RELOAD)
        // Purana CSS hatao
        const oldLink = document.getElementById('template-css');
        if (oldLink) oldLink.remove();

        // Naya CSS lagao
        const link = document.createElement('link');
        link.id = 'template-css';
        link.rel = 'stylesheet';
        // ?v=Date.now() lagane se browser cache use nahi karega
        link.href = `/static/css/templates/${templateId}.css?v=${Date.now()}`; 
        
        // Error Check
        link.onerror = () => {
            console.error(`❌ CSS nahi mila: /static/css/templates/${templateId}.css`);
            alert(`Error: ${templateId}.css file missing hai!`);
        };
        
        link.onload = () => console.log(`✅ CSS Loaded: ${templateId}.css`);

        document.head.appendChild(link);

        // 3. Data Wapas Bharao
        setTimeout(() => {
            if (typeof updatePreview === 'function') updatePreview();
            previewArea.style.opacity = '1';
        }, 100);

    } catch (error) {
        console.error("Template Error:", error);
        previewArea.innerHTML = `<div class="text-red-500 p-10">
            <h3>Error Loading Template</h3>
            <p>Make sure <b>${templateId}.html</b> exists in templates folder.</p>
        </div>`;
        previewArea.style.opacity = '1';
    }
}

function setupEventListeners() {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', updatePreview);
    });
}

// Helper to add more experience (DOM only)
function addExperienceField() {
    const container = document.getElementById('experienceFields');
    const newField = container.firstElementChild.cloneNode(true);
    // Clear values
    newField.querySelectorAll('input, textarea').forEach(i => i.value = '');
    container.appendChild(newField);
    
    // Re-attach listeners
    setupEventListeners();
}

// ========== PHOTO UPLOAD HANDLER ==========
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // File reader banate hain image ko padhne ke liye
    const reader = new FileReader();

    reader.onload = function(e) {
        const imageDataUrl = e.target.result; // Base64 image data

        // 1. Form ke andar wale chote preview ko update karo
        const formPreview = document.getElementById('photoPreview');
        if (formPreview) {
            formPreview.src = imageDataUrl;
        }

        // 2. Template (Right Side) wale main image ko update karo
        const templateImage = document.getElementById('preview-image');
        if (templateImage) {
            templateImage.src = imageDataUrl;
            // Optional: Agar koi placeholder class hai to hata sakte hain
            // templateImage.classList.remove('hidden'); 
        }
    };

    // Image ko Data URL ki tarah padho
    reader.readAsDataURL(file);
}

// ========== PHOTO UPLOAD LOGIC (Fixed for your ID) ==========

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        const imageDataUrl = e.target.result;

        // 1. Update Form Preview (Left Side)
        // Aapka ID: profilePhotoPreview
        const formImg = document.getElementById('profilePhotoPreview');
        if (formImg) {
            formImg.src = imageDataUrl;
        }

        // 2. Update Template Preview (Right Side)
        // Template ka ID humesha 'preview-image' hona chahiye
        const templateImg = document.getElementById('preview-image');
        if (templateImg) {
            templateImg.src = imageDataUrl;
            
            // Agar template image hidden thi to show karo
            templateImg.style.display = 'block'; 
            templateImg.parentElement.style.display = 'block'; // Container bhi show karo
        }
    };

    reader.readAsDataURL(file);
}

// ========== ADD THIS FUNCTION TO builder.js (End of file) ==========

function exportJSON() {
    // Data gather karo (jo function already builder.js me hai)
    const data = gatherResumeData(); 
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.personal.fullName || 'resume'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Toast notification agar function available hai
    if (typeof showToast === 'function') {
        showToast('Resume exported as JSON');
    } else {
        alert('Resume exported as JSON');
    }
}

// Mobile Menu Toggle Fix (Agar mobile menu nahi khul raha)
document.addEventListener('click', function(e) {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenuBtn.contains(e.target)) {
        mobileMenu.classList.toggle('hidden');
    }
});

// --- FIX: Make functions global for inline HTML handlers ---
window.updatePreview = updatePreview;
window.saveToLocalStorage = saveToLocalStorage;
window.handlePhotoUpload = handlePhotoUpload; // Photo upload fix

// builder.js - Connector
 window.exportResumePDF = function() {
    // Check karo ki main download function ready hai ya nahi
    if (typeof window.downloadPDF === 'function') {
        
        // 1. PDF Download Start Karo
        window.downloadPDF();

        // ===============================================
        // 🟢 TRACKING CODE (Database Update)
        // ===============================================
        
        // A. Sahi Template Name Nikalo
        // Priority: 1. Body Attribute -> 2. Dropdown Value -> 3. Default 'modern'
        let templateName = document.body.getAttribute('data-template');
        
        if (!templateName) {
            const selector = document.getElementById('templateSelector');
            if (selector) templateName = selector.value;
        }
        
        templateName = templateName || 'modern'; // Fallback
        
        console.log("📡 Sending Tracking for:", templateName);

        // B. API Call to Update Database
        fetch('/api/track-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                activity_type: 'downloaded_pdf',
                details: templateName 
            })
        }).then(res => {
            if(res.ok) console.log("✅ Count Updated Successfully!");
            else console.error("❌ Count Update Failed");
        }).catch(err => console.error("Tracking Error:", err));

    } else {
        alert("Wait... pdf.js is loading.");
    }
};

// Ensure PDF download works on all buttons
document.querySelectorAll('[id^="downloadPdf"]').forEach(btn => {
    btn.onclick = (e) => {
        e.preventDefault();
        window.exportResumePDF();
    };
});

async function generateWithAI() {
    const btn = document.getElementById('generateCoverLetterBtn');
    
    // ... (Loading state code) ...
    btn.innerText = "Checking Credits...";

    try {
        const response = await fetch('/api/ai/write-cover-letter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_role: "Developer", company: "Google" }) // Data example
        });

        const data = await response.json();

        if (data.error === 'NO_CREDITS') {
            // 🛑 Credits Khatam! Upgrade Modal Dikhao
            showUpgradeModal();
            return; 
        }

        if (data.success) {
            // Success! Text area mein content dalo
            document.getElementById('coverLetterOutput').value = data.content;
            
            // Credits Update karo UI par (Agar Dashboard par count dikha rahe ho)
            updateCreditDisplay(data.credits_left);
            
            alert(`Generated! Credits Left: ${data.credits_left}`);
        }

    } catch (error) {
        console.error(error);
        alert("Something went wrong!");
    } finally {
        btn.innerText = "Generate with AI"; // Reset Button
    }
}

// UI Function: Credits Update karne ke liye
function updateCreditDisplay(count) {
    const creditBadges = document.querySelectorAll('.ai-credit-count');
    creditBadges.forEach(el => el.innerText = count);
}

// ==========================================
// 💾 SAVE RESUME FUNCTION (Corrected)
// ==========================================
async function saveResume() {
    const saveBtn = document.getElementById('saveBtn') || document.querySelector('.save-btn');
    const originalText = saveBtn ? saveBtn.innerHTML : 'Save';
    
    // 1. Loading State दिखाएं
    if(saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;
    }

    try {
        // 2. Form से डेटा निकालें (ensure करें collectFormData() function मौजूद है)
        const resumeData = collectFormData(); 
        
        // 3. Payload तैयार करें
        const payload = {
            data: resumeData,
            template_name: window.currentTemplate || 'modern',
            resume_id: window.currentResumeId || null // अगर पुराना है तो अपडेट करे
        };

        console.log("Saving Data...", payload);

        // 4. API Call (महत्वपूर्ण: /api/save-resume को कॉल करें)
        const res = await fetch('/api/save-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (result.success) {
            // Success! ID सेव करें ताकि अगली बार नया न बने
            window.currentResumeId = result.resume_id;
            alert("✅ Resume Saved Successfully!");
        } else {
            alert("❌ Save Failed: " + result.message);
        }

    } catch (error) {
        console.error("Save Error:", error);
        alert("System Error: Could not save resume.");
    } finally {
        // बटन वापस ठीक करें
        if(saveBtn) {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }
}

// ==========================================
// 🛠️ DATA COLLECTION LOGIC (इसे saveResume के ऊपर पेस्ट करें)
// ==========================================

function collectFormData() {
    return {
        personal: {
            // Full Name ko First aur Last name me todna
            firstName: document.getElementById('fullName')?.value.split(' ')[0] || '',
            lastName: document.getElementById('fullName')?.value.split(' ').slice(1).join(' ') || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            city: document.getElementById('location')?.value || '',
            jobTitle: document.getElementById('jobTitle')?.value || '',
            summary: document.getElementById('summary')?.value || '',
            links: {
                linkedin: document.getElementById('linkedin')?.value || '',
                github: document.getElementById('github')?.value || '',
                portfolio: document.getElementById('portfolio')?.value || ''
            }
        },
        // Skills Section (Comma separated values ko array banana)
        skills: {
            technical: document.getElementById('technicalSkills')?.value.split(',').map(s => s.trim()).filter(s => s) || [],
            soft: document.getElementById('softSkills')?.value.split(',').map(s => s.trim()).filter(s => s) || [],
            languages: document.getElementById('languages')?.value.split(',').map(s => s.trim()).filter(s => s) || [],
            hobbies: document.getElementById('hobbies')?.value.split(',').map(s => s.trim()).filter(s => s) || []
        },
        // Dynamic Lists (Education, Experience etc ke liye helper function use karenge)
        education: getDynamicData('educationList'),
        experience: getDynamicData('experienceList'),
        projects: getDynamicData('projectsList'),
        certifications: getDynamicData('certificationsList')
    };
}

// Helper Function: Dynamic Lists se data nikalne ke liye
function getDynamicData(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const items = [];
    // Har item card ke input fields ko scan karo
    container.querySelectorAll('.item-card, .education-item, .experience-item, .project-item').forEach(card => {
        const inputs = card.querySelectorAll('input, textarea, select');
        const itemObj = {};
        
        inputs.forEach(input => {
            if(input.name) {
                itemObj[input.name] = input.value;
            }
        });
        
        // Agar object khali nahi hai to list me add karo
        if(Object.keys(itemObj).length > 0) {
            items.push(itemObj);
        }
    });
    
    return items;
}