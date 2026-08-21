// ==========================================
// 🚀 ATS RESUME PRO - TEMPLATES LOGIC (100% FIXED)
// ==========================================

let TEMPLATES = [];
let selectedTemplateForBuy = "";

// 1. Single Unified Initialization & Fetch
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Template Page Initializing...');

    // Base UI Setup
    initThemeToggle();
    initMobileMenu();
    initCategoryFilters();
    initModals();
    initSearch();
    initBottomNav();

    try {
        const res = await fetch('/api/templates');
        const data = await res.json();

        TEMPLATES = data.templates || [];
        const userPlan = data.user_plan || 'Free';
        console.log(`✅ Loaded ${TEMPLATES.length} templates. User Plan: ${userPlan}`);

        // Render Templates Grid
        renderTemplatesGrid(TEMPLATES);

        // Hide Skeleton & Show Grid with Force Visible Style
        const skeleton = document.getElementById('skeletonLoader');
        const grid = document.getElementById('templatesGrid');

        if (skeleton) skeleton.classList.add('hidden');
        if (grid) {
            grid.classList.remove('hidden');
            grid.style.display = 'grid';
        }

        // Enhancements
        if (typeof colorizeBadges === 'function') colorizeBadges();
        if (typeof addColorSwatches === 'function') addColorSwatches();
        if (typeof addHeartButton === 'function') addHeartButton();
        initAnimations();

    } catch (error) {
        console.error("Failed to load templates:", error);
        const skeleton = document.getElementById('skeletonLoader');
        if (skeleton) skeleton.classList.add('hidden');
    }
});

// 2. Render Function (Explicit inline opacity & flex display)
function renderTemplatesGrid(templates) {
    const grid = document.getElementById('templatesGrid');
    if (!grid) return;

    grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full";

    const noResultsHTML = `
    <div id="noResults" class="hidden col-span-full text-center py-20">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-800/60 mb-4 border border-gray-700">
            <i class="fas fa-search text-3xl text-gray-500"></i>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">No Templates Found</h3>
        <p class="text-gray-400 text-sm mb-6">Try searching for "Modern", "Executive", or "ATS".</p>
        <button onclick="resetFilters()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold text-sm">
            Clear Filters
        </button>
    </div>
    `;

    const cardsHTML = templates.map((t, index) => {
        let buttonHTML = '';
        let badgeHTML = '';

        if (t.is_premium) {
            if (t.user_has_access) {
                badgeHTML = `<div class="absolute top-3 right-3 bg-green-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg z-10"><i class="fas fa-check"></i> Owned</div>`;
            } else {
                badgeHTML = `<div class="absolute top-3 right-3 bg-amber-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg z-10"><i class="fas fa-crown"></i> ₹${t.price}</div>`;
            }
        } else {
            badgeHTML = `<div class="absolute top-3 right-3 bg-blue-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg z-10">Free</div>`;
        }

        if (t.user_has_access) {
            buttonHTML = `
                <a href="/builder?template=${t.name}" 
                   class="px-5 py-2.5 rounded-full font-bold shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 text-sm">
                    <i class="fas fa-pen-fancy"></i> <span>Use Template</span>
                </a>`;
        } else {
            buttonHTML = `
                <button onclick="window.buySingleTemplate('${t.name}', ${t.price}, this)" 
                        class="px-5 py-2.5 rounded-full font-bold shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm">
                    <i class="fas fa-lock"></i> <span>Unlock ₹${t.price}</span>
                </button>`;
        }

        const imageSrc = (t.image_file && t.image_file.startsWith('http')) 
            ? t.image_file 
            : `/static/images/template-previews/${t.image_file || 'default.png'}`;

        return `
        <div class="template-card relative rounded-2xl overflow-hidden group bg-slate-900/80 border border-slate-800 flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-blue-500/50 w-full" data-category="${t.category}" style="display: flex !important; opacity: 1 !important; visibility: visible !important;">
            <div class="relative h-72 overflow-hidden bg-slate-950/60">
                ${badgeHTML}
                <img src="${imageSrc}" 
                     alt="${t.display_name}" 
                     class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                     onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'400\\' viewBox=\\'0 0 300 400\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%231e293b\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%2394a3b8\\' font-family=\\'sans-serif\\' font-size=\\'18\\'>${t.display_name}</text></svg>'">
                <div class="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-sm z-20">
                    <button onclick="previewTemplate('${t.name}')" 
                            class="preview-template w-11 h-11 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded-full flex items-center justify-center backdrop-blur-md transition-all transform hover:scale-110"
                            title="Preview Template" data-template="${t.name}">
                        <i class="fas fa-eye text-lg"></i>
                    </button>
                    ${buttonHTML}
                </div>
            </div>
            <div class="p-4 border-t border-slate-800 bg-slate-900/90 z-30">
                <h3 class="font-bold text-base text-white truncate">${t.display_name}</h3>
                <p class="text-xs text-gray-400 mt-1 line-clamp-2">${t.description || 'Professional ATS optimized resume template.'}</p>
            </div>
        </div>
        `;
    }).join('');

    grid.innerHTML = noResultsHTML + cardsHTML;
}

// 3. Search & Filter
function initSearch() {
    const searchInput = document.getElementById('templateSearch');
    if (!searchInput) return;

    searchInput.addEventListener('keyup', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.template-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const category = card.getAttribute('data-category')?.toLowerCase() || '';

            if (title.includes(term) || category.includes(term)) {
                card.classList.remove('hidden');
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.classList.add('hidden');
                card.style.display = 'none';
            }
        });

        const noResults = document.getElementById('noResults');
        if (noResults) {
            if (visibleCount === 0) noResults.classList.remove('hidden');
            else noResults.classList.add('hidden');
        }
    });
}

function initCategoryFilters() {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const category = btn.getAttribute('data-category')?.toLowerCase().trim();

            buttons.forEach(b => {
                b.classList.remove('active', 'bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white');
                b.classList.add('glass-panel', 'text-gray-300');
            });

            btn.classList.remove('glass-panel', 'text-gray-300');
            btn.classList.add('active', 'bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white');

            const cards = document.querySelectorAll('.template-card');
            let visibleCount = 0;

            cards.forEach(card => {
                const cardCategory = card.getAttribute('data-category')?.toLowerCase().trim();
                if (category === 'all' || cardCategory === category) {
                    card.classList.remove('hidden');
                    card.style.display = 'flex';
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                    card.style.display = 'none';
                }
            });

            const noResults = document.getElementById('noResults');
            if (noResults) {
                if (visibleCount === 0) noResults.classList.remove('hidden');
                else noResults.classList.add('hidden');
            }
        });
    });
}

window.resetFilters = function() {
    const searchInput = document.getElementById('templateSearch');
    if (searchInput) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('keyup'));
    }
    const allBtn = document.querySelector('[data-category="all"]');
    if (allBtn) allBtn.click();
};

// 4. Razorpay Purchase Logic
window.buySingleTemplate = function(templateName, price, buttonElement) {
    selectedTemplateForBuy = templateName;
    const basePrice = parseFloat(price);
    const lifetimePrice = basePrice * 3;
    const fakeStrikePrice = lifetimePrice * 2;

    const nameEl = document.getElementById('pricingTemplateName');
    if (nameEl) nameEl.innerText = "Selected Template: " + templateName.toUpperCase();

    if (document.getElementById('singlePriceDisplay')) document.getElementById('singlePriceDisplay').innerText = "₹" + basePrice;
    if (document.getElementById('lifetimePriceDisplay')) document.getElementById('lifetimePriceDisplay').innerText = "₹" + lifetimePrice;
    if (document.getElementById('lifetimeStrikePrice')) document.getElementById('lifetimeStrikePrice').innerText = "₹" + fakeStrikePrice;

    document.getElementById('pricingModal')?.classList.remove('hidden');
};

window.initiateTemplateCheckout = async function(planType) {
    document.getElementById('pricingModal')?.classList.add('hidden');
    showLoader();

    try {
        const res = await fetch('/api/create-template-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template_name: selectedTemplateForBuy,
                plan_type: planType
            })
        });

        const orderData = await res.json();
        if (!orderData.success) {
            hideLoader();
            alert("Error: " + (orderData.error || orderData.message));
            return;
        }

        const options = {
            "key": orderData.key_id,
            "amount": orderData.amount,
            "currency": orderData.currency,
            "name": "ATS Resume Pro",
            "description": planType === 'lifetime' ? "Lifetime Access" : "Single Export",
            "image": "/static/images/favicon.png",
            "order_id": orderData.order_id,
            "handler": async function (response) {
                showLoader();
                const verifyRes = await fetch('/api/verify-template-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        template_name: selectedTemplateForBuy,
                        plan_type: planType
                    })
                });

                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                    alert("🎉 Payment Successful! Template is now unlocked.");
                    location.reload();
                } else {
                    hideLoader();
                    alert("❌ Verification Failed: " + verifyData.message);
                }
            },
            "theme": { "color": "#4f46e5" }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response){
            hideLoader();
            alert("Payment Failed! Reason: " + response.error.description);
        });

        hideLoader();
        rzp.open();

    } catch (error) {
        hideLoader();
        console.error(error);
        alert('Error: ' + error.message);
    }
};

// 5. Preview Modal
function initModals() {
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.preview-template');
        if (btn) {
            const templateName = btn.getAttribute('data-template');
            previewTemplate(templateName);
        }
    });

    const closeBtn = document.getElementById('closePreviewBtn');
    const modal = document.getElementById('templatePreviewModal');

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function closeModal() {
    document.getElementById('templatePreviewModal')?.classList.add('hidden');
}

function previewTemplate(templateName) {
    const template = TEMPLATES.find(t => t.name === templateName);
    if (!template) {
        alert('Template details not found');
        return;
    }

    showLoader();
    const modal = document.getElementById('templatePreviewModal');
    const modalTitle = document.getElementById('previewModalTitle');
    const contentDiv = document.getElementById('templatePreviewContent');

    if (modal && contentDiv) {
        modalTitle.textContent = template.display_name;
        const previewImgSrc = (template.image_file && template.image_file.startsWith('http'))
            ? template.image_file
            : `/static/images/template-previews/${template.image_file || 'default.png'}`;

        contentDiv.innerHTML = `
            <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl animate-fade-in">
                <div class="text-center mb-6">
                    <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">${template.display_name}</h2>
                    <p class="text-gray-600 dark:text-gray-400 text-sm">${template.description || ''}</p>
                </div>
                <div class="border border-gray-700 rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800 max-w-xl mx-auto">
                    <img src="${previewImgSrc}" 
                         alt="${template.display_name}" 
                         class="w-full h-auto object-cover rounded-lg"
                         onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'500\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%231e293b\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%2394a3b8\\'>Preview</text></svg>'">
                </div>
                <div class="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <button onclick="useTemplate('${template.name}', ${template.is_premium})" 
                            class="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:scale-105 transition-transform font-bold text-base shadow-xl">
                        <i class="fas fa-magic mr-2"></i> ${template.is_premium ? 'Unlock / Use' : 'Use This Template'}
                    </button>
                    <button onclick="closeModal()" 
                            class="px-8 py-3.5 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 font-bold text-base">
                        Close
                    </button>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    }
    hideLoader();
}

// 6. Navigation & Theme
// ==========================================
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeBtn = document.getElementById('bottomThemeToggle');
    const html = document.documentElement;
    const body = document.body;

    function applyTheme(isLight) {
        if (isLight) {
            html.classList.remove('dark');
            html.classList.add('light');
            body.classList.add('light-mode');
        } else {
            html.classList.add('dark');
            html.classList.remove('light');
            body.classList.remove('light-mode');
        }

        // Desktop Button Icon Update
        if (themeToggle) {
            themeToggle.innerHTML = isLight 
                ? '<i class="fas fa-moon text-blue-600 text-lg"></i>' 
                : '<i class="fas fa-sun text-yellow-400 text-lg"></i>';
        }

        // Mobile Bottom Bar Icon Update
        if (mobileThemeBtn) {
            const icon = mobileThemeBtn.querySelector('i');
            if (icon) {
                icon.className = isLight ? 'fas fa-moon text-lg mb-1' : 'fas fa-sun text-lg mb-1';
                icon.style.color = isLight ? '#2563eb' : '#fbbf24';
            }
        }
    }

    // Startup check
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme === 'light');

    // Global Click Handler for desktop and mobile buttons
    function handleToggle(e) {
        e.preventDefault();
        e.stopPropagation();
        const currentlyLight = body.classList.contains('light-mode');
        const nextState = !currentlyLight;
        localStorage.setItem('theme', nextState ? 'light' : 'dark');
        applyTheme(nextState);
    }

    if (themeToggle) themeToggle.onclick = handleToggle;
    if (mobileThemeBtn) mobileThemeBtn.onclick = handleToggle;
}

// ==========================================
// 📱 1. MOBILE SIDE-DRAWER MENU (HAMBURGER)
// ==========================================
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (!mobileMenuBtn || !mobileMenu) return;

    function openMenu(e) {
        if (e) e.preventDefault();
        mobileMenu.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden'; // Stop background scrolling
    }

    function closeMenu(e) {
        if (e) e.preventDefault();
        mobileMenu.classList.add('translate-x-full');
        document.body.style.overflow = '';
    }

    mobileMenuBtn.onclick = openMenu;
    if (mobileCloseBtn) mobileCloseBtn.onclick = closeMenu;

    // Link click karne par auto-close
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

// ==========================================
// 📱 2. MOBILE BOTTOM NAVIGATION (ACTIVE TAB)
// ==========================================
function initBottomNav() {
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    const bottomLinks = document.querySelectorAll('.bottom-nav-item');

    bottomLinks.forEach(link => {
        const linkHref = (link.getAttribute('href') || '').replace(/\/$/, '') || '/';
        
        if (linkHref === currentPath) {
            link.classList.add('active', 'text-blue-400');
            link.classList.remove('text-gray-400');
        } else if (!link.id || link.id !== 'bottomThemeToggle') {
            link.classList.remove('active', 'text-blue-400');
            link.classList.add('text-gray-400');
        }
    });
}
// ==========================================
// 🌓 100% WORKING GLOBAL THEME CONTROLLER
// ==========================================

function applyGlobalTheme(isLight) {
    const html = document.documentElement;
    const body = document.body;

    if (isLight) {
        html.classList.remove('dark');
        html.classList.add('light-mode', 'light');
        body.classList.add('light-mode');
        body.style.backgroundColor = "#f8fafc";
        body.style.color = "#0f172a";
    } else {
        html.classList.add('dark');
        html.classList.remove('light-mode', 'light');
        body.classList.remove('light-mode');
        body.style.backgroundColor = "#0f172a";
        body.style.color = "#ffffff";
    }

    // Update Desktop Nav Button Icon
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = isLight 
            ? '<i class="fas fa-moon text-blue-600 text-lg"></i>' 
            : '<i class="fas fa-sun text-yellow-400 text-lg"></i>';
    }

    // Update Mobile Bottom Nav Button Icon
    const mobileThemeBtn = document.getElementById('bottomThemeToggle');
    if (mobileThemeBtn) {
        const icon = mobileThemeBtn.querySelector('i');
        if (icon) {
            icon.className = isLight ? 'fas fa-moon text-lg mb-1' : 'fas fa-sun text-lg mb-1';
            icon.style.color = isLight ? '#2563eb' : '#fbbf24';
        }
    }
}

// Global Click Interceptor (Catches desktop & mobile buttons instantly)
document.addEventListener('click', function(e) {
    const toggleBtn = e.target.closest('#themeToggle, #bottomThemeToggle');
    if (toggleBtn) {
        e.preventDefault();
        e.stopPropagation();

        const isCurrentlyLight = document.documentElement.classList.contains('light-mode') || document.body.classList.contains('light-mode');
        const nextThemeIsLight = !isCurrentlyLight;

        localStorage.setItem('theme', nextThemeIsLight ? 'light' : 'dark');
        applyGlobalTheme(nextThemeIsLight);
    }
});

// Load on Startup
(function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyGlobalTheme(savedTheme === 'light');
})();

function initAnimations() {
    document.querySelectorAll('.template-card').forEach(card => {
        card.style.opacity = '1';
        card.style.visibility = 'visible';
    });
}

function showLoader() { document.getElementById('globalLoader')?.classList.remove('hidden'); }
function hideLoader() { document.getElementById('globalLoader')?.classList.add('hidden'); }