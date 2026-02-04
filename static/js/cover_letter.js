// cover_letter.js

// ---------- CONFIGURATION ----------
const BACKEND_API_URL = '';

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', function() {
    console.log('✉️ Cover Letter Builder Initialized');
    
    // Initialize all components
    initThemeToggle();
    initMobileMenu();
    initEventListeners();
    initAnimations();
    
    // Initial preview update
    updatePreview();
});

// ---------- THEME MANAGEMENT ----------
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    if (!themeToggle) return;
    
    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
        document.body.classList.add('light-mode');
        updateThemeIcons(true);
    } else {
        updateThemeIcons(false);
    }
    
    // Theme toggle function
    function toggleTheme() {
        const isLight = document.body.classList.contains('light-mode');
        
        document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
        
        if (isLight) {
            // Switch to dark mode
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
            updateThemeIcons(false);
        } else {
            // Switch to light mode
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
            updateThemeIcons(true);
        }
        
        setTimeout(() => {
            document.body.style.transition = '';
        }, 500);
    }
    
    function updateThemeIcons(isLight) {
        const themeIcon = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        if (themeToggle) themeToggle.innerHTML = themeIcon;
        if (mobileThemeToggle) mobileThemeToggle.innerHTML = themeIcon;
    }
    
    // Add event listeners
    themeToggle.addEventListener('click', toggleTheme);
    if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);
}

// ---------- MOBILE MENU ----------
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (!mobileMenuBtn || !mobileMenu) return;
    
    function toggleMobileMenu() {
        const isHidden = mobileMenu.classList.contains('translate-x-full');
        if (isHidden) {
            mobileMenu.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden';
        } else {
            mobileMenu.classList.add('translate-x-full');
            document.body.style.overflow = '';
        }
    }
    
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', toggleMobileMenu);
    
    // Close menu when clicking links
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', toggleMobileMenu);
    });
}

// ---------- EVENT LISTENERS ----------
function initEventListeners() {
    // AI Generate Button
    const aiBtn = document.getElementById('ai-btn');
    if (aiBtn) aiBtn.addEventListener('click', generateWithAI);
    
    // Download PDF Button
    const downloadBtn = document.querySelector('button[onclick="downloadPDF()"]');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadPDF);
    }
    
    // Copy to Clipboard Button
    const copyBtn = document.querySelector('button[onclick="copyToClipboard()"]');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }
    
    // Authentication buttons
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileSignupBtn = document.getElementById('mobileSignupBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', () => showToast('Login feature coming soon!', 'info'));
    if (signupBtn) signupBtn.addEventListener('click', () => showToast('Signup feature coming soon!', 'info'));
    if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', () => showToast('Login feature coming soon!', 'info'));
    if (mobileSignupBtn) mobileSignupBtn.addEventListener('click', () => showToast('Signup feature coming soon!', 'info'));
}

// ---------- ANIMATIONS ----------
function initAnimations() {
    // Add fade-in-up animation to elements
    const fadeElements = document.querySelectorAll('.fade-in-up');
    fadeElements.forEach((el, index) => {
        el.style.animationDelay = `${index * 100}ms`;
        setTimeout(() => {
            el.style.opacity = '1';
        }, 100);
    });
}

function updatePreview() {
    const setText = (inputId, previewId) => {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        if (input && preview) {
            preview.innerText = input.value || '';
        }
    };

    setText('inp-name', 'prev-name');
    setText('inp-title', 'prev-title');
    setText('inp-email', 'prev-email');
    setText('inp-phone', 'prev-phone');
    setText('inp-address', 'prev-address');
    setText('inp-subject', 'prev-subject');

    setText('inp-body-1', 'prev-body-1');
    setText('inp-body-2', 'prev-body-2');
    setText('inp-body-3', 'prev-body-3');
}


// ---------- AI COVER LETTER GENERATOR ----------
// ---------- AI COVER LETTER GENERATOR (FIXED ID) ----------
async function generateWithAI() {
    // 1. Button Selection (Updated to match your HTML ID)
    const btn = document.getElementById('generateCoverLetterBtn');
    
    // 2. Data Collect Karo
    // Input IDs check kar lena, agar HTML mein alag hain to adjust karein
    const jobRole = document.getElementById('inp-job-title')?.value || document.getElementById('ai-job-role')?.value;
    const company = document.getElementById('inp-company')?.value || document.getElementById('ai-company')?.value;
    const skills = document.getElementById('ai-skills')?.value || '';
    
    // Validation
    if (!jobRole || !company) {
        showToast('Please enter Job Role and Company Name first!', 'error');
        return;
    }
    
    // 3. Button Animation
    let originalText = '';
    if (btn) {
        originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Generating...';
        btn.disabled = true;
    }
    
    showLoader(); 
    
    try {
        console.log("🔥 Calling AI API...");
        
        // 4. API Call
        const response = await fetch('/api/ai/write-cover-letter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                job_role: jobRole,
                company: company,
                skills: skills
            })
        });
        
        const data = await response.json();
        console.log("🔥 API Response:", data);

        // 5. Credits Check
        if (data.error === 'NO_CREDITS') {
            hideLoader();
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
            
            if (typeof showUpgradeModal === 'function') {
                showUpgradeModal();
            } else {
                alert("Out of AI Credits! Please Upgrade.");
            }
            return;
        }

        // 6. Success Handling
        if (data.success) {
            let letterContent = data.content;
            
            // Clean Formatting
            if (letterContent.includes('```')) {
                letterContent = letterContent.replace(/```json/g, '').replace(/```/g, '').trim();
            }

            // Fill Data
            try {
                const parsed = JSON.parse(letterContent);
                // IDs match karna HTML se
                if(document.getElementById('inp-subject')) document.getElementById('inp-subject').value = parsed.subject || `Application for ${jobRole}`;
                if(document.getElementById('inp-body-1')) document.getElementById('inp-body-1').value = parsed.opening || '';
                if(document.getElementById('inp-body-2')) document.getElementById('inp-body-2').value = parsed.body || '';
                if(document.getElementById('inp-body-3')) document.getElementById('inp-body-3').value = parsed.closing || '';
            } catch (e) {
                if(document.getElementById('inp-body-2')) document.getElementById('inp-body-2').value = letterContent;
            }

            if (typeof updatePreview === 'function') updatePreview();
            
            // 7. Update Credit Badge
            if (data.credits_left !== undefined) {
                const badges = document.querySelectorAll('.ai-credit-count');
                badges.forEach(b => b.innerText = data.credits_left);
            }

            showToast(`Generated! Credits left: ${data.credits_left}`, 'success');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
        
    } catch (error) {
        console.error('AI Error:', error);
        showToast('Failed to generate. Try again.', 'error');
    } finally {
        hideLoader();
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

function generateFallbackLetter(jobRole, company, skills) {
    const skillList = skills ? skills.split(',').slice(0, 3).join(', ') : 'relevant skills';
    
    return {
        subject: `Application for ${jobRole} Position - ${document.getElementById('inp-name')?.value || 'Candidate'}`,
        opening: `I am writing to express my enthusiastic interest in the ${jobRole} position at ${company}. With my background in ${skillList}, I am confident that I possess the skills and experience necessary to make a significant contribution to your team.`,
        body: `In my previous roles, I have consistently demonstrated my ability to ${skills ? skills.split(',')[0] : 'deliver results'}. I have been following ${company}'s progress in the industry and have been particularly impressed by your commitment to innovation and excellence. I am excited about the opportunity to bring my unique perspective and skills to your organization.`,
        closing: `Thank you for considering my application. I have attached my resume for your review and would welcome the opportunity to discuss how my experience aligns with the goals of ${company}. I am available for an interview at your earliest convenience.`
    };
}

// ---------- PDF DOWNLOAD ----------
 


// ---------- COPY TO CLIPBOARD ----------
async function copyToClipboard() {
    try {
        // Get all text from preview
        const preview = document.getElementById('cover-letter-preview');
        const text = preview.innerText;
        
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!');
    } catch (error) {
        console.error('Copy failed:', error);
        showToast('Failed to copy', 'error');
    }
}

// ---------- UTILITY FUNCTIONS ----------
function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    
    // Reset classes
    toast.className = 'fixed bottom-6 right-6 text-white px-6 py-4 rounded-xl shadow-xl transform translate-x-full transition-transform duration-500 z-50';
    
    // Add type-specific classes
    if (type === 'success') {
        toast.classList.add('bg-gradient-to-r', 'from-green-500', 'to-emerald-600');
    } else if (type === 'error') {
        toast.classList.add('bg-gradient-to-r', 'from-red-500', 'to-pink-600');
    } else if (type === 'info') {
        toast.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-cyan-600');
    } else if (type === 'warning') {
        toast.classList.add('bg-gradient-to-r', 'from-yellow-500', 'to-orange-600');
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

// ---------- KEYBOARD SHORTCUTS ----------
document.addEventListener('keydown', function(e) {
    // Ctrl+G to generate with AI
    if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        generateWithAI();
    }
    
    // Ctrl+S to save/download
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        downloadPDF();
    }
    
    // Escape to close modals (if any)
    if (e.key === 'Escape') {
        hideLoader();
    }
});

// ---------- AUTO-SAVE FUNCTIONALITY ----------
let autoSaveTimer;
const AUTO_SAVE_DELAY = 5000; // 5 seconds

function startAutoSave() {
    // Clear existing timer
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    
    // Set new timer
    autoSaveTimer = setTimeout(() => {
        saveToLocalStorage();
    }, AUTO_SAVE_DELAY);
}

function saveToLocalStorage() {
    const formData = {
        name: document.getElementById('inp-name')?.value || '',
        title: document.getElementById('inp-title')?.value || '',
        email: document.getElementById('inp-email')?.value || '',
        phone: document.getElementById('inp-phone')?.value || '',
        address: document.getElementById('inp-address')?.value || '',
        manager: document.getElementById('inp-manager')?.value || '',
        company: document.getElementById('inp-company')?.value || '',
        companyAddress: document.getElementById('inp-comp-address')?.value || '',
        date: document.getElementById('inp-date')?.value || '',
        subject: document.getElementById('inp-subject')?.value || '',
        body1: document.getElementById('inp-body-1')?.value || '',
        body2: document.getElementById('inp-body-2')?.value || '',
        body3: document.getElementById('inp-body-3')?.value || ''
    };
    
    try {
        localStorage.setItem('cover_letter_data', JSON.stringify(formData));
        console.log('Auto-saved to localStorage');
    } catch (error) {
        console.error('Auto-save failed:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('cover_letter_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Update form fields
            Object.keys(data).forEach(key => {
                const element = document.getElementById(`inp-${key}`);
                if (element && data[key]) {
                    element.value = data[key];
                }
            });
            
            // Update preview
            updatePreview();
            showToast('Draft restored from auto-save', 'info');
        }
    } catch (error) {
        console.error('Load from localStorage failed:', error);
    }
}

// Initialize auto-save listeners
document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', () => {
        updatePreview();
        startAutoSave();
    });
});

// Load saved data on page load
window.addEventListener('load', loadFromLocalStorage);