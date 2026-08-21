// ==========================================
// 🚀 ATS PRO - UNIFIED HOME SCRIPT (100% ERROR FREE)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ATS Pro Scripts Initialized');

    // ------------------------------------------
    // 1. PRELOADER LOGIC
    // ------------------------------------------
    const preloader = document.getElementById('preloader');
    function hidePreloader() {
        if (!preloader || preloader.style.display === 'none') return;
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
            document.body.classList.add('loaded');
        }, 500);
    }
    window.addEventListener('load', () => setTimeout(hidePreloader, 600));
    setTimeout(hidePreloader, 2500);

    // ------------------------------------------
    // 2. MOBILE DRAWER MENU
    // ------------------------------------------
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    function toggleMenu() {
        if (!mobileMenu) return;
        const isHidden = mobileMenu.classList.contains('translate-x-full');
        if (isHidden) {
            mobileMenu.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden';
        } else {
            mobileMenu.classList.add('translate-x-full');
            document.body.style.overflow = '';
        }
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMenu);
    if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', toggleMenu);
    
    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
    }

    // ------------------------------------------
    // 3. THEME TOGGLE & STATE MANAGER
    // ------------------------------------------
    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
    const bottomThemeBtn = document.getElementById('bottomThemeToggle');

    function updateThemeIcons(isLight) {
        themeToggleBtns.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;
            if (isLight) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            } else {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        });

        if (bottomThemeBtn) {
            const bIcon = bottomThemeBtn.querySelector('i');
            if (bIcon) {
                if (isLight) {
                    bIcon.className = 'fas fa-moon mb-1 text-blue-500';
                } else {
                    bIcon.className = 'fas fa-sun mb-1 text-yellow-400';
                }
            }
        }
    }

    function applyTheme(isLight) {
        if (isLight) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
        updateThemeIcons(isLight);
    }

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialIsLight = (savedTheme === 'light' || (!savedTheme && !prefersDark));
    applyTheme(initialIsLight);

    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const isCurrentlyLight = document.body.classList.contains('light-mode');
            applyTheme(!isCurrentlyLight);

            const icon = btn.querySelector('i');
            if (icon) {
                icon.style.transform = 'rotate(360deg)';
                setTimeout(() => { icon.style.transform = 'rotate(0)'; }, 500);
            }
        });
    });

    if (bottomThemeBtn) {
        bottomThemeBtn.addEventListener('click', () => {
            const isCurrentlyLight = document.body.classList.contains('light-mode');
            applyTheme(!isCurrentlyLight);
        });
    }

    // ------------------------------------------
    // 4. NAVBAR SMART SCROLL
    // ------------------------------------------
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    if (navbar) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            const isLight = document.body.classList.contains('light-mode');
            
            if (currentScroll > 50) {
                navbar.style.background = isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(15, 23, 42, 0.98)';
                navbar.style.boxShadow = '0 10px 40px rgba(0,0,0,0.1)';
            } else {
                navbar.style.background = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)';
                navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
            }

            if (currentScroll > lastScroll && currentScroll > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            lastScroll = currentScroll;
        });
    }

    // ------------------------------------------
    // 5. COMPARISON SLIDER (Before / After ATS)
    // ------------------------------------------
    const container = document.getElementById('comparisonSlider');
    const beforeImage = document.getElementById('beforeImage');
    const handle = document.getElementById('sliderHandle');
    
    if (container && beforeImage && handle) {
        let isDragging = false;

        const updateSlider = (x) => {
            const rect = container.getBoundingClientRect();
            let position = ((x - rect.left) / rect.width) * 100;
            position = Math.max(0, Math.min(100, position));
            
            beforeImage.style.width = `${position}%`;
            handle.style.left = `${position}%`;
        };

        container.addEventListener('mousedown', () => isDragging = true);
        window.addEventListener('mouseup', () => isDragging = false);
        container.addEventListener('mousemove', (e) => { if (isDragging) updateSlider(e.clientX); });

        container.addEventListener('touchstart', () => isDragging = true);
        window.addEventListener('touchend', () => isDragging = false);
        container.addEventListener('touchmove', (e) => { if (isDragging) updateSlider(e.touches[0].clientX); });
        container.addEventListener('click', (e) => updateSlider(e.clientX));
    }

    // ------------------------------------------
    // 6. SCROLL REVEAL OBSERVER
    // ------------------------------------------
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up, .glass-panel').forEach((el, index) => {
        if (el.closest('#comparisonSlider') && el.tagName === 'IMG') return;
        el.classList.add('reveal-on-scroll');
        if (el.classList.contains('glass-panel')) {
            el.style.transitionDelay = `${(index % 3) * 0.1}s`;
        }
        revealObserver.observe(el);
    });

    // ------------------------------------------
    // 7. STATS COUNTER ANIMATION (Single, Safe)
    // ------------------------------------------
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statBox = entry.target;
                const valueElement = statBox.querySelector('.text-2xl');
                
                if (valueElement && !statBox.classList.contains('counted')) {
                    const originalText = valueElement.innerText.trim();
                    const match = originalText.match(/(\d+)/);
                    
                    if (match) {
                        const targetValue = parseInt(match[0]);
                        const prefix = originalText.split(targetValue)[0] || '';
                        const suffix = originalText.split(targetValue)[1] || '';
                        
                        let current = 0;
                        const duration = 1500;
                        const stepTime = Math.max(15, Math.floor(duration / targetValue));
                        
                        const timer = setInterval(() => {
                            current += Math.ceil(targetValue / 30);
                            if (current >= targetValue) {
                                valueElement.innerText = originalText;
                                clearInterval(timer);
                            } else {
                                valueElement.innerText = prefix + current + suffix;
                            }
                        }, stepTime);
                    }
                    statBox.classList.add('counted');
                }
                statsObserver.unobserve(statBox);
            }
        });
    }, { threshold: 0.4 });

    document.querySelectorAll('.glass-panel.text-center').forEach(box => statsObserver.observe(box));

    // ------------------------------------------
    // 8. 3D HERO CARD TILT
    // ------------------------------------------
    const card = document.querySelector('.hero-float .glass-panel');
    const heroContainer = document.querySelector('.hero-float');

    if (card && heroContainer) {
        card.style.transition = 'transform 0.1s ease-out';
        heroContainer.addEventListener('mousemove', (e) => {
            const rect = heroContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xRotation = -((y - rect.height / 2) / 20);
            const yRotation = (x - rect.width / 2) / 20;
            card.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale(1.03)`;
        });
        heroContainer.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.5s ease-out';
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    }

    // ------------------------------------------
    // 9. SMOOTH MOUSE PARALLAX BLOBS
    // ------------------------------------------
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;

        document.querySelectorAll('.animate-blob').forEach((blob, index) => {
            const speed = (index + 1) * 0.8;
            blob.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
    });

    // ------------------------------------------
    // 10. SCROLL PROGRESS BAR & SCROLL-TOP BUTTON
    // ------------------------------------------
    const scrollBtn = document.getElementById('scrollTopBtn');
    const progressBar = document.getElementById('scrollProgress');

    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        
        if (progressBar) {
            progressBar.style.width = (winScroll / height) * 100 + "%";
        }
        if (scrollBtn) {
            if (winScroll > 400) {
                scrollBtn.classList.add('visible');
                scrollBtn.classList.remove('opacity-0', 'translate-y-10');
            } else {
                scrollBtn.classList.remove('visible');
                scrollBtn.classList.add('opacity-0', 'translate-y-10');
            }
        }
    });

    // ------------------------------------------
    // 11. MOBILE BOTTOM ACTIVE TAB
    // ------------------------------------------
    const currentPath = window.location.pathname;
    document.querySelectorAll('.bottom-nav-item').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
            link.classList.remove('text-gray-400');
        }
    });

    // ------------------------------------------
    // 12. COOKIE BANNER
    // ------------------------------------------
    if (!localStorage.getItem('cookiesAccepted')) {
        setTimeout(() => {
            const banner = document.getElementById('cookieBanner');
            if (banner) banner.classList.remove('translate-y-full');
        }, 2000);
    }
});

// ==========================================
// 🌐 GLOBAL WINDOW FUNCTIONS
// ==========================================
window.scrollToTop = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.toggleChat = function() {
    const box = document.getElementById('chatBox');
    if (!box) return;
    box.classList.toggle('hidden');
    box.classList.toggle('scale-90');
    box.classList.toggle('opacity-0');
};

window.toggleFaq = function(btn) {
    const content = btn.nextElementSibling;
    const icon = btn.querySelector('i');
    
    document.querySelectorAll('.glass-panel button').forEach(otherBtn => {
        if (otherBtn !== btn && otherBtn.parentElement.querySelector('.hidden') === null) {
            const otherContent = otherBtn.nextElementSibling;
            const otherIcon = otherBtn.querySelector('i');
            if (otherContent) otherContent.classList.add('hidden');
            if (otherIcon) {
                otherIcon.classList.remove('fa-minus', 'rotate-180');
                otherIcon.classList.add('fa-plus');
            }
            otherBtn.classList.remove('text-blue-400');
        }
    });
    
    content.classList.toggle('hidden');
    if (content.classList.contains('hidden')) {
        icon.classList.remove('fa-minus', 'rotate-180');
        icon.classList.add('fa-plus');
        btn.classList.remove('text-blue-400');
    } else {
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-minus', 'rotate-180');
        btn.classList.add('text-blue-400');
    }
};

window.acceptCookies = function() {
    localStorage.setItem('cookiesAccepted', 'true');
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.classList.add('translate-y-full');
};

window.showToast = function(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast-notification glass-panel';
    const icon = type === 'success' ? '<i class="fas fa-check-circle text-green-400"></i>' : '<i class="fas fa-info-circle text-blue-400"></i>';
    toast.innerHTML = `${icon} <span class="font-medium">${message}</span>`;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};