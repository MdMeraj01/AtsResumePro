// pricing.js

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Pricing Page Initialized');
    
    initThemeToggle();
    initMobileMenu();
    initBillingToggle();
    initPlanSelection();
    initAuthButtons();
    initAnimations();
    initFAQToggle();
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

    function openMenu() {
        mobileMenu.classList.remove('translate-x-full');
        document.body.classList.add('menu-open'); // Ye class piche ka content hide karegi
    }

    function closeMenu() {
        mobileMenu.classList.add('translate-x-full');
        document.body.classList.remove('menu-open');
    }

    mobileMenuBtn.addEventListener('click', openMenu);
    mobileCloseBtn?.addEventListener('click', closeMenu);
}

// ---------- BILLING TOGGLE ----------
function initBillingToggle() {
    const monthlyBtn = document.getElementById('monthlyBtn');
    const yearlyBtn = document.getElementById('yearlyBtn');
    
    if (!monthlyBtn || !yearlyBtn) return;
    
    // Set initial state
    updatePrices('monthly');
    
    monthlyBtn.addEventListener('click', function() {
        monthlyBtn.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white');
        monthlyBtn.classList.remove('text-gray-400');
        yearlyBtn.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white');
        yearlyBtn.classList.add('text-gray-400');
        updatePrices('monthly');
        showToast('Switched to monthly billing');
    });
    
    yearlyBtn.addEventListener('click', function() {
        yearlyBtn.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white');
        yearlyBtn.classList.remove('text-gray-400');
        monthlyBtn.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white');
        monthlyBtn.classList.add('text-gray-400');
        updatePrices('yearly');
        showToast('Switched to yearly billing (Save 40%)');
    });
}

function updatePrices(period) {
    // Update price displays
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const yearlyPrices = document.querySelectorAll('.yearly-price');
    const monthlyTexts = document.querySelectorAll('.monthly-text');
    const yearlyTexts = document.querySelectorAll('.yearly-text');
    
    if (period === 'monthly') {
        monthlyPrices.forEach(el => el.classList.remove('hidden'));
        yearlyPrices.forEach(el => el.classList.add('hidden'));
        monthlyTexts.forEach(el => el.classList.remove('hidden'));
        yearlyTexts.forEach(el => el.classList.add('hidden'));
    } else {
        monthlyPrices.forEach(el => el.classList.add('hidden'));
        yearlyPrices.forEach(el => el.classList.remove('hidden'));
        monthlyTexts.forEach(el => el.classList.add('hidden'));
        yearlyTexts.forEach(el => el.classList.remove('hidden'));
    }
}

// ---------- PLAN SELECTION ----------
function initPlanSelection() {
    const planButtons = document.querySelectorAll('[data-plan]');
    
    planButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const plan = this.getAttribute('data-plan');
            selectPlan(plan);
        });
    });
}

// pricing.js - Updated selectPlan Function

function selectPlan(plan) {
    showLoader();
    
    // Simulate API call
    setTimeout(() => {
        // 👇 FIX: Keys ko HTML ke data-plan attribute se match kiya hai
        const plans = {
            'basic': {
                name: 'Basic Plan',
                price: '₹199',
                period: 'monthly'
            },
            'standard': {  // Pehle 'professional' tha, ab 'standard' kar diya
                name: 'Standard Plan',
                price: '₹499',
                period: 'monthly'
            },
            'premium': {   // Pehle 'enterprise' tha, ab 'premium' kar diya
                name: 'Premium Plan',
                price: '₹999',
                period: 'monthly'
            }
        };
        
        const selectedPlan = plans[plan];
        
        if (selectedPlan) {
            hideLoader();
            showToast(`Selected ${selectedPlan.name}`, 'success');
            
            // Redirect to checkout (Real Logic)
            // Hum cycle ko filhal 'monthly' maan rahe hain, aap ise dynamic bhi kar sakte hain
            const currentCycle = document.getElementById('monthlyBtn')?.classList.contains('text-white') ? 'monthly' : 'yearly';
            
            window.location.href = `/checkout?plan=${plan}&cycle=${currentCycle}`;
        } else {
            // Agar plan na mile to Loader band karo aur Error dikhao
            hideLoader();
            console.error("Plan not found:", plan);
            showToast("Error: Plan not found!", "error");
        }
    }, 500); // Thoda fast kar diya (1 sec -> 0.5 sec)
}

function simulateCheckout(plan) {
    // This would be replaced with actual payment gateway integration
    console.log('Redirecting to checkout for:', plan);
    
    // Show checkout modal
    showCheckoutModal(plan);
}

function showCheckoutModal(plan) {
    // Create modal HTML
    const modalHTML = `
        <div id="checkoutModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="glass-panel rounded-2xl p-8 max-w-md w-full border border-gray-700">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-white">Complete Your Purchase</h3>
                    <button onclick="closeCheckoutModal()" class="text-gray-400 hover:text-white transition-colors">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="mb-6 p-4 bg-gray-800/50 rounded-xl">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-gray-300">Plan:</span>
                        <span class="font-semibold text-white">${plan.name}</span>
                    </div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-gray-300">Billing:</span>
                        <span class="font-semibold text-white">${plan.period}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">Amount:</span>
                        <span class="text-2xl font-bold text-white">${plan.price}</span>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <div class="flex gap-3">
                        <button onclick="processPayment('upi')" class="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold hover:scale-105 transition-transform">
                            <i class="fab fa-google-pay mr-2"></i>UPI
                        </button>
                        <button onclick="processPayment('card')" class="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold hover:scale-105 transition-transform">
                            <i class="fas fa-credit-card mr-2"></i>Card
                        </button>
                    </div>
                    
                    <button onclick="processPayment('netbanking')" class="w-full py-3 rounded-xl glass-panel text-white font-semibold hover:bg-white/10">
                        <i class="fas fa-university mr-2"></i>Net Banking
                    </button>
                    
                    <div class="text-center text-sm text-gray-400 mt-4">
                        <i class="fas fa-lock mr-1"></i> Secure payment • 256-bit SSL encryption
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.remove();
    }
}

function processPayment(method) {
    showLoader();
    
    // Simulate payment processing
    setTimeout(() => {
        hideLoader();
        closeCheckoutModal();
        showToast('Payment successful! Welcome to ATS Resume Builder Pro', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 2000);
    }, 2000);
}

// ---------- FAQ TOGGLE ----------
function initFAQToggle() {
    const faqCards = document.querySelectorAll('.glass-panel.rounded-2xl.p-6');
    
    faqCards.forEach(card => {
        // Add cursor pointer
        card.style.cursor = 'pointer';
        
        // Find icon
        const icon = card.querySelector('i.fa-question-circle');
        if(icon) icon.style.transition = 'transform 0.3s ease';

        card.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // Toggle answer visibility
            const answer = this.querySelector('p');
            if (answer) {
                if (this.classList.contains('active')) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    answer.style.opacity = '1';
                    answer.style.marginTop = '1rem';
                    if(icon) icon.style.transform = 'rotate(180deg)'; // Rotate Icon
                } else {
                    answer.style.maxHeight = '0';
                    answer.style.opacity = '0';
                    answer.style.marginTop = '0';
                    if(icon) icon.style.transform = 'rotate(0deg)'; // Reset Icon
                }
            }
        });
    });
}

// ---------- AUTHENTICATION BUTTONS ----------
function initAuthButtons() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileSignupBtn = document.getElementById('mobileSignupBtn');
    
    const authHandler = (type) => {
        showToast(`${type} feature coming soon!`, 'info');
    };
    
    if (loginBtn) loginBtn.addEventListener('click', () => authHandler('Login'));
    if (signupBtn) signupBtn.addEventListener('click', () => authHandler('Signup'));
    if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', () => authHandler('Login'));
    if (mobileSignupBtn) mobileSignupBtn.addEventListener('click', () => authHandler('Signup'));
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

// ---------- KEYBOARD SHORTCUTS ----------
document.addEventListener('keydown', function(e) {
    // Escape to close modals
    if (e.key === 'Escape') {
        closeCheckoutModal();
    }
    
    // Number keys to select plans (1, 2, 3)
    if (e.key >= '1' && e.key <= '3' && !e.ctrlKey && !e.altKey) {
        const plans = ['basic', 'professional', 'enterprise'];
        const index = parseInt(e.key) - 1;
        if (plans[index]) {
            selectPlan(plans[index]);
        }
    }
});

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