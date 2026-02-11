// template-section.js - FULLY FIXED

let TEMPLATES = [];

// 2. Fetch from DB on Load
// template-section.js (Updated renderTemplatesGrid)

// 2. Fetch from DB on Load
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        
        // Data format match karo
        TEMPLATES = data.templates; // Ab direct array nahi, object ke andar array hai
        const userPlan = data.user_plan;

        console.log(`✅ Loaded ${TEMPLATES.length} templates. User Plan: ${userPlan}`);
        
        // Init functions...
        initThemeToggle();
        initMobileMenu();
        initCategoryFilters();
        initAnimations();
        initModals();
        initSearch();
        
        renderTemplatesGrid(TEMPLATES);

    } catch (error) {
        console.error("Failed to load templates:", error);
    }
});

// ✅ UPDATED RENDER FUNCTION (With 'No Results' Fix)
function renderTemplatesGrid(templates) {
    const grid = document.getElementById('templatesGrid');
    if (!grid) return;
    
    // 👇 1. "No Results" HTML (Ye code pehle delete ho gaya tha, ab wapas daal diya)
    const noResultsHTML = `
    <div id="noResults" class="hidden col-span-full text-center py-20">
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-800 mb-6 relative">
            <i class="fas fa-search text-4xl text-gray-600"></i>
            <div class="absolute top-0 right-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce">?</div>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Templates Found</h3>
        <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">Try searching for "Modern", "Creative" or "ATS".</p>
        <button onclick="resetFilters()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold">
            Clear Filters
        </button>
    </div>
    `;

    // 2. Templates Cards Generate Karo
    const cardsHTML = templates.map((t, index) => {
        let buttonHTML = '';
        let badgeHTML = '';

        // Badge Logic
        if (t.is_premium) {
            if (t.user_has_access) {
                badgeHTML = `<div class="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10"><i class="fas fa-check"></i> Owned</div>`;
            } else {
                badgeHTML = `<div class="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10"><i class="fas fa-crown"></i> ₹${t.price}</div>`;
            }
        } else {
            badgeHTML = `<div class="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">Free</div>`;
        }

        // Button Logic
        if (t.user_has_access) {
            buttonHTML = `
                <a href="/builder?template=${t.name}" 
                   class="px-6 py-3 rounded-full font-bold shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
                    <i class="fas fa-pen-fancy"></i> <span>Use Template</span>
                </a>`;
        } else {
            buttonHTML = `
                <button onclick="buyTemplate('${t.name}', ${t.price})" 
                        class="px-6 py-3 rounded-full font-bold shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                    <i class="fas fa-lock"></i> <span>Unlock ₹${t.price}</span>
                </button>`;
        }

        return `
        <div class="template-card rounded-2xl overflow-hidden group reveal-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-300 hover:shadow-2xl" data-category="${t.category}" style="animation-delay: ${index * 50}ms">
            <div class="relative h-64 overflow-hidden bg-gray-100 dark:bg-gray-800">
                ${badgeHTML}
                <img src="/static/images/template-previews/${t.image_file}" 
                     alt="${t.display_name}" 
                     class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                     onerror="this.src='https://via.placeholder.com/300x400?text=Resume'">
                <div class="absolute inset-0 bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4 backdrop-blur-sm z-20">
                    <button onclick="previewTemplate('${t.name}')" 
                            class="preview-template w-12 h-12 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded-full flex items-center justify-center backdrop-blur-md transition-all transform hover:scale-110"
                            title="Preview Template" data-template="${t.name}">
                        <i class="fas fa-eye text-xl"></i>
                    </button>
                    ${buttonHTML}
                </div>
            </div>
            <div class="p-5 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 z-30">
                <h3 class="font-bold text-lg text-gray-900 dark:text-white">${t.display_name}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">${t.description}</p>
            </div>
        </div>
    `}).join('');

    // 👇 3. DONO KO JOD KAR PAGE PAR DIKHAO
    grid.innerHTML = noResultsHTML + cardsHTML;
}

// 4. Buy Function (Global)
window.buyTemplate = async function(templateName, price) {
    if(!confirm(`Do you want to unlock '${templateName}' for ₹${price}?`)) return;

    // Show Loader
    showLoader(); // (Make sure showLoader is defined)

    try {
        const res = await fetch('/api/buy-single-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template_name: templateName, price: price })
        });
        
        const data = await res.json();
        
        if (data.success) {
            alert("Success! Template Unlocked. 🎉");
            location.reload(); // Page reload karo taaki button update ho jaye
        } else {
            alert("Error: " + data.message);
        }
    } catch(e) {
        alert("Something went wrong");
    } finally {
        hideLoader();
    }
};
// ---------- 2. INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Template Page Loaded');
    
    initThemeToggle(); // ✅ यह लाइन फंक्शन को कॉल करेगी
    initMobileMenu();
    initCategoryFilters();
    initAnimations();
    initModals();
    initSearch();
    
    // UI Enhancements
    if(typeof colorizeBadges === 'function') colorizeBadges();
    if(typeof addColorSwatches === 'function') addColorSwatches();
    if(typeof addHeartButton === 'function') addHeartButton();
});

// 👇 इस फंक्शन को document.addEventListener के बाहर (नीचे) रखें 👇

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle'); // Header wala button
    const mobileThemeBtn = document.getElementById('bottomThemeToggle'); // Footer wala button
    
    // 1. Check Saved Theme
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    // 2. Apply Theme
    if (currentTheme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
    updateIcons(currentTheme === 'light');

    // 3. Toggle Logic
    function toggleAppTheme() {
        const isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        updateIcons(isLight);
    }

    // 4. Update Icons (Both Desktop & Mobile)
    function updateIcons(isLight) {
        // Desktop
        if(themeToggle) {
            themeToggle.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        }
        // Mobile
        if(mobileThemeBtn) {
            const icon = mobileThemeBtn.querySelector('i');
            if(icon) {
                // Remove old classes first to avoid conflict
                icon.className = isLight ? 'fas fa-moon text-lg mb-1' : 'fas fa-sun text-lg mb-1';
                icon.style.color = isLight ? '#3b82f6' : '#fbbf24'; // Blue vs Yellow
            }
        }
    }

    // 5. Event Listeners
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAppTheme();
        });
    }

    if (mobileThemeBtn) {
        mobileThemeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAppTheme();
        });
    }
}

// Mobile Menu
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (!mobileMenuBtn || !mobileMenu) return;

    function toggleMenu(show) {
        if (show) {
            mobileMenu.classList.remove('translate-x-full');
            document.body.classList.add('menu-open');
        } else {
            mobileMenu.classList.add('translate-x-full');
            document.body.classList.remove('menu-open');
        }
    }

    mobileMenuBtn.addEventListener('click', () => toggleMenu(true));
    if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', () => toggleMenu(false));
    
    // Close on link click
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });
}

// Category Filters
function initCategoryFilters() {
    const buttons = document.querySelectorAll('.category-btn');
    
    // Har button par click event lagayenge
    buttons.forEach(btn => {
        // Purane listeners hatane ke liye clone node trick (Optional but safe)
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });

    // Ab naye buttons ko select karke listener lagayenge
    const refreshedButtons = document.querySelectorAll('.category-btn');

    refreshedButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const category = btn.getAttribute('data-category');
            
            // --- 1. VISUAL UPDATE (Buttons ka color change) ---
            refreshedButtons.forEach(b => {
                // Sabko 'Inactive' banao
                b.classList.remove('active', 'bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white');
                b.classList.add('glass-panel', 'text-gray-300');
            });

            // Sirf clicked button ko 'Active' banao
            btn.classList.remove('glass-panel', 'text-gray-300');
            btn.classList.add('active', 'bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white');

            // --- 2. FILTERING LOGIC (Cards ko hide/show karna) ---
            // Note: Hum cards ko CLICK ke waqt select kar rahe hain taaki naye cards bhi milein
            const cards = document.querySelectorAll('.template-card'); 

            cards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                // Animation reset karo taaki effect dikhe
                card.classList.remove('reveal-card');
                void card.offsetWidth; // Force Reflow (Magic trick for animation)
                card.classList.add('reveal-card');

                if (category === 'all' || cardCategory === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Check karo agar koi result nahi mila
            const visibleCards = document.querySelectorAll('.template-card[style="display: block;"]');
            const noResults = document.getElementById('noResults');
            if (noResults) {
                 if (visibleCards.length === 0 && cards.length > 0) {
                     noResults.classList.remove('hidden');
                 } else {
                     noResults.classList.add('hidden');
                 }
            }
        });
    });
}

// Animations
// --- ANIMATIONS (Scroll Reveal Logic) ---

function initAnimations() {
    // Observer Options
    const observerOptions = {
        root: null, // Use the viewport
        threshold: 0.1, // 10% card dikhte hi animation start
        rootMargin: "0px 0px -50px 0px" // Thoda sa offset taaki smooth lage
    };

    // Create Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add class to trigger CSS transition
                entry.target.classList.add('in-view');
                
                // Ek baar animate ho gaya to dubara observe mat karo (Performance)
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    // Sare cards ko observe karo
    const cards = document.querySelectorAll('.template-card');
    cards.forEach(card => {
        observer.observe(card);
    });

    // Header elements ke liye simple fade-in
    const fadeElements = document.querySelectorAll('.fade-in-up');
    fadeElements.forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Search
// --- SEARCH & FILTER LOGIC ---

function initSearch() {
    // 1. Fake Loading Effect (Skeleton hide, Grid show)
    setTimeout(() => {
        const skeleton = document.getElementById('skeletonLoader');
        const grid = document.getElementById('templatesGrid');
        
        if(skeleton) skeleton.classList.add('hidden'); // Hide Skeleton
        if(grid) {
            grid.classList.remove('hidden'); // Show Real Cards
            initAnimations(); // Trigger scroll animations now
        }
    }, 1500); // 1.5 seconds loading time

    // 2. Search Logic
    const searchInput = document.getElementById('templateSearch');
    if(searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.template-card');
            let visibleCount = 0; // Counter add kiya
            
            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const category = card.getAttribute('data-category');
                
                if(title.includes(term) || category.includes(term)) {
                    card.style.display = 'block';
                    // Re-trigger animation for found items
                    card.classList.add('in-view');
                    visibleCount++; // Increment count
                } else {
                    card.style.display = 'none';
                }
            });

            // Loop khatam hone ke baad check karo
            checkEmptyState(visibleCount);
        });
    }
}

// --- HELPER FUNCTIONS (Defined OUTSIDE initSearch) ---

function checkEmptyState(visibleCount) {
    const noResults = document.getElementById('noResults');
    
    if (visibleCount === 0) {
        if(noResults) noResults.classList.remove('hidden');
    } else {
        if(noResults) noResults.classList.add('hidden');
    }
}

// Ye function HTML button call karega, isliye ise global scope mein rakha hai
window.resetFilters = function() {
    const searchInput = document.getElementById('templateSearch');
    if(searchInput) {
        searchInput.value = ''; // Clear input
        
        // Trigger empty search to show all cards
        searchInput.dispatchEvent(new Event('keyup'));
    }
    
    // Reset category buttons
    const allBtn = document.querySelector('[data-category="all"]');
    if(allBtn) allBtn.click();
}

// ---------- 4. PREVIEW MODAL LOGIC ----------
function initModals() {
    // Event delegation for preview buttons
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.preview-template');
        if (btn) {
            const templateName = btn.getAttribute('data-template');
            previewTemplate(templateName);
        }
    });

    // Close buttons
    const closeBtn = document.getElementById('closePreviewBtn');
    const modal = document.getElementById('templatePreviewModal');
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function closeModal() {
    document.getElementById('templatePreviewModal').classList.add('hidden');
}

// ✅ FIXED PREVIEW FUNCTION
function previewTemplate(templateName) {
    // 1. Template Dhundo
    const template = TEMPLATES.find(t => t.name === templateName);
    
    if (!template) {
        showToast('Template details not found', 'error');
        return;
    }
    
    showLoader();
    
    const modal = document.getElementById('templatePreviewModal');
    const modalTitle = document.getElementById('previewModalTitle');
    const contentDiv = document.getElementById('templatePreviewContent');
    
    // Base URL for images
    const baseUrl = '/static/images/template-previews/';
    
    if (modal && contentDiv) {
        // 👇 Yahan 'display_name' use karna hai (Pehle 'display' tha jo galat tha)
        modalTitle.textContent = template.display_name;
        
        // Badge Logic for Modal
        let badgeHtml = '';
        if (template.is_premium) {
            badgeHtml = `<span class="inline-block mt-3 px-4 py-1 text-sm font-bold rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"><i class="fas fa-crown"></i> Premium ₹${template.price}</span>`;
        } else {
            badgeHtml = `<span class="inline-block mt-3 px-4 py-1 text-sm font-bold rounded-full bg-blue-500 text-white shadow-lg">Free Template</span>`;
        }

        // Dynamic HTML Injection
        contentDiv.innerHTML = `
            <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl animate-fade-in">
                <div class="text-center mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">${template.display_name}</h2>
                    <p class="text-gray-600 dark:text-gray-400 text-lg">${template.description}</p>
                    ${badgeHtml}
                </div>
                
                <div class="border-4 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800 p-2 max-w-2xl mx-auto">
                    <img src="${baseUrl}${template.image_file}" 
                         alt="${template.display_name}" 
                         class="w-full h-auto object-cover rounded-lg"
                         onerror="this.src='https://via.placeholder.com/400x600?text=Preview+Image';">
                </div>
                
                <div class="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                    <button onclick="useTemplate('${template.name}', ${template.is_premium})" 
                   class="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:scale-105 transition-transform duration-200 font-bold text-lg flex items-center justify-center shadow-xl">
                     <i class="fas fa-magic mr-2"></i> ${template.is_premium ? 'Unlock Template' : 'Use This Template'}
                    </button>
    
                    <button onclick="document.getElementById('templatePreviewModal').classList.add('hidden')" 
                            class="px-8 py-4 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200 font-bold">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }
    
    hideLoader();
}

// ---------- 5. UI ENHANCEMENTS (Missing Functions Added) ----------

// Fix 1: Add Badges Colors
function colorizeBadges() {
    document.querySelectorAll('.badge').forEach(badge => {
        const text = badge.textContent.trim().toLowerCase();
        badge.className = 'badge absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg z-10';
        
        if (text.includes('popular')) {
            badge.classList.add('bg-gradient-to-r', 'from-red-500', 'to-pink-600');
            badge.innerHTML = '<i class="fas fa-fire mr-1"></i> Popular';
        } else if (text.includes('creative')) {
            badge.classList.add('bg-gradient-to-r', 'from-purple-500', 'to-pink-500');
            badge.innerHTML = '<i class="fas fa-paint-brush mr-1"></i> Creative';
        } else if (text.includes('ats')) {
            badge.classList.add('bg-gradient-to-r', 'from-green-500', 'to-emerald-600');
            badge.innerHTML = '<i class="fas fa-check-circle mr-1"></i> ATS Friendly';
        } else {
            badge.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600');
        }
    });
}

// Fix 2: Add Color Swatches
function addColorSwatches() {
    document.querySelectorAll('.template-card .p-5').forEach(cardBody => {
        if(cardBody.querySelector('.color-swatches')) return;

        const swatchesDiv = document.createElement('div');
        swatchesDiv.className = 'color-swatches flex space-x-2 mb-4 mt-2 h-6 items-center';
        
        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-slate-800'];
        let dotsHTML = '';
        colors.forEach((color, index) => {
            const activeClass = index === 0 ? 'ring-2 ring-offset-2 ring-gray-300 dark:ring-gray-600 scale-110' : '';
            dotsHTML += `<div class="w-3 h-3 rounded-full ${color} cursor-pointer hover:scale-125 transition-transform ${activeClass}"></div>`;
        });
        
        swatchesDiv.innerHTML = dotsHTML;
        const description = cardBody.querySelector('p');
        if (description) description.parentNode.insertBefore(swatchesDiv, description.nextSibling);
    });
}

// Fix 3: Add Heart Button (THIS WAS MISSING)
// Fix 3: Add Heart Button (FIXED SELECTOR)
function addHeartButton() {
    // Purana: '.template-image-container' (Jo HTML mein nahi tha)
    // Naya: '.template-card .relative' (Jo image wale div par hai)
    document.querySelectorAll('.template-card .relative').forEach(container => {
        // Agar pehle se button hai to skip karo
        if(container.querySelector('.heart-btn')) return;

        const heartBtn = document.createElement('button');
        // CSS classes same rakhi hain
        heartBtn.className = 'heart-btn absolute top-3 left-3 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-white hover:text-red-500 transition-all duration-300 z-20 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0';
        heartBtn.innerHTML = '<i class="far fa-heart"></i>';
        
        heartBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Link click hone se roko
            e.stopPropagation(); // Card click hone se roko
            
            const icon = this.querySelector('i');
            if(this.classList.contains('active')) {
                this.classList.remove('active', 'bg-white', 'text-red-500');
                this.classList.add('bg-black/20', 'text-white/80');
                icon.className = 'far fa-heart';
            } else {
                this.classList.add('active', 'bg-white', 'text-red-500');
                this.classList.remove('bg-black/20', 'text-white/80');
                icon.className = 'fas fa-heart';
                this.style.transform = 'scale(1.2)';
                setTimeout(() => this.style.transform = 'scale(1)', 200);
            }
        });
        
        container.appendChild(heartBtn);
    });
}
// Utils
function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.classList.remove('hidden');
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.classList.add('hidden');
}

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