document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ATS Pro Scripts Initialized');

    // ==========================================
    // 0. PRELOADER LOGIC (FIXED & SAFE)
    // ==========================================
    function hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader || preloader.style.display === 'none') return;

        // Fade out effect
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
            document.body.classList.add('loaded'); // Triggers other animations
        }, 500);
    }

    // Normal Load
    window.addEventListener('load', () => {
        setTimeout(hidePreloader, 800); // Thoda smooth delay
    });

    // Safety Fallback (Agar load event atak jaye to 3 sec baad force open)
    setTimeout(hidePreloader, 3000);

    // ==========================================
    // 1. Mobile Menu Toggle
    // ==========================================
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    function toggleMenu() {
        if (!mobileMenu) return;
        const isHidden = mobileMenu.classList.contains('translate-x-full');
        if (isHidden) {
            mobileMenu.classList.remove('translate-x-full');
            mobileMenu.classList.add('backdrop-blur-xl');
            document.body.style.overflow = 'hidden';
        } else {
            mobileMenu.classList.add('translate-x-full');
            mobileMenu.classList.remove('backdrop-blur-xl');
            document.body.style.overflow = '';
        }
    }

    if(mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMenu);
    if(mobileCloseBtn) mobileCloseBtn.addEventListener('click', toggleMenu);
    
    // Close menu when clicking links inside it
    if(mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
    }

    // ==========================================
    // 2. Auth Buttons (Login/Signup Fix)
    // ==========================================
    const authButtons = [
        'loginBtn', 'signupBtn', 'mobileLoginBtn', 'mobileSignupBtn'
    ];

    authButtons.forEach(id => {
        const btn = document.getElementById(id);
        if(btn) {
            btn.addEventListener('click', (e) => {
                // Agar button <a> tag nahi hai, tabhi toast dikhao
                if(btn.tagName !== 'A') {
                    e.preventDefault();
                    showToast('Authentication feature coming soon!', 'info');
                }
            });
        }
    });

    // ==========================================
    // 3. Premium Navbar Scroll Effect
    // ==========================================
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    if (navbar) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            const isLight = document.body.classList.contains('light-mode');
            
            // Background blur effect
            if (currentScroll > 50) {
                navbar.style.background = isLight 
                    ? 'rgba(255, 255, 255, 0.98)' 
                    : 'rgba(15, 23, 42, 0.98)';
                navbar.style.boxShadow = '0 10px 40px rgba(0,0,0,0.1)';
                navbar.style.backdropFilter = 'blur(30px) saturate(200%)';
            } else {
                navbar.style.background = isLight
                    ? 'rgba(255, 255, 255, 0.95)'
                    : 'rgba(15, 23, 42, 0.95)';
                navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
            }

            // Smart Hide (Navbar upar jane par chup jaye)
            if (currentScroll > lastScroll && currentScroll > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScroll = currentScroll;
        });
    }

    // ==========================================
    // 4. Theme Toggle Logic
    // ==========================================
    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
    
    function updateThemeIcons(isLight) {
        themeToggleBtns.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;
            
            if (isLight) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                if(btn.id === 'mobileThemeToggle') {
                    icon.classList.remove('text-orange-400');
                    icon.classList.add('text-blue-400');
                }
            } else {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                if(btn.id === 'mobileThemeToggle') {
                    icon.classList.remove('text-blue-400');
                    icon.classList.add('text-orange-400');
                }
            }
        });
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
        document.body.classList.add('light-mode');
        updateThemeIcons(true);
    } else {
        updateThemeIcons(false);
    }

    // Toggle Event
    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const isLight = document.body.classList.contains('light-mode');
            document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
            
            if (isLight) {
                document.body.classList.remove('light-mode');
                localStorage.setItem('theme', 'dark');
                updateThemeIcons(false);
            } else {
                document.body.classList.add('light-mode');
                localStorage.setItem('theme', 'light');
                updateThemeIcons(true);
            }

            // Icon Rotation Animation
            const icon = btn.querySelector('i');
            if(icon) {
                icon.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    icon.style.transform = 'rotate(0)';
                    document.body.style.transition = '';
                }, 500);
            }
        });
    });

    // ==========================================
    // 5. Comparison Slider Logic
    // ==========================================
    const container = document.getElementById('comparisonSlider');
    const beforeImage = document.getElementById('beforeImage');
    const handle = document.getElementById('sliderHandle');
    
    if(container && beforeImage && handle) {
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
        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            updateSlider(e.clientX);
        });

        // Touch support
        container.addEventListener('touchstart', () => isDragging = true);
        window.addEventListener('touchend', () => isDragging = false);
        container.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            updateSlider(e.touches[0].clientX);
        });
        
        container.addEventListener('click', (e) => updateSlider(e.clientX));
    }

    // ==========================================
    // 6. Scroll Reveal Animation
    // ==========================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll(`
        .glass-panel,          
        section h2,           
        .btn-primary-glow,    
        section img,          
        .comparison-container,
        .fade-in-up 
    `);
    
    elementsToAnimate.forEach((el, index) => {
        // Slider Images protection
        if (el.closest('#comparisonSlider') && el.tagName === 'IMG') return;

        el.classList.add('reveal-on-scroll');
        
        // Stagger Effect
        if(el.classList.contains('glass-panel')) {
            const delay = (index % 3) * 0.1;
            el.style.transitionDelay = `${delay}s`;
        }
        
        revealObserver.observe(el);
    });

    // ==========================================
    // 7. Smooth Scrolling
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                if (mobileMenu && !mobileMenu.classList.contains('translate-x-full')) {
                    toggleMenu();
                }
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================
    // 8. Chat Box & FAQ Logic (Moved from HTML)
    // ==========================================
    
    // Chat Box Toggle
    window.toggleChat = function() {
        const box = document.getElementById('chatBox');
        if (!box) return;
        
        if (box.classList.contains('hidden')) {
            box.classList.remove('hidden');
            setTimeout(() => {
                box.classList.remove('scale-90', 'opacity-0');
            }, 10);
        } else {
            box.classList.add('scale-90', 'opacity-0');
            setTimeout(() => {
                box.classList.add('hidden');
            }, 300);
        }
    };

    // FAQ Toggle
    window.toggleFaq = function(btn) {
        const content = btn.nextElementSibling;
        const icon = btn.querySelector('i');
        
        // Close other open FAQs
        document.querySelectorAll('.glass-panel button').forEach(otherBtn => {
            if (otherBtn !== btn && otherBtn.parentElement.querySelector('.hidden') === null) {
                // This means 'otherBtn' section is OPEN, so close it
                const otherContent = otherBtn.nextElementSibling;
                const otherIcon = otherBtn.querySelector('i');
                if (otherContent) {
                    otherContent.classList.add('hidden');
                    otherIcon.classList.remove('fa-minus', 'rotate-180');
                    otherIcon.classList.add('fa-plus');
                    otherBtn.classList.remove('text-blue-400');
                }
            }
        });
        
        // Toggle current FAQ
        content.classList.toggle('hidden');
        if(content.classList.contains('hidden')){
            icon.classList.remove('fa-minus', 'rotate-180');
            icon.classList.add('fa-plus');
            btn.classList.remove('text-blue-400');
        } else {
            icon.classList.remove('fa-plus');
            icon.classList.add('fa-minus', 'rotate-180');
            btn.classList.add('text-blue-400');
        }
    };

    // ==========================================
    // 9. Cookie Banner
    // ==========================================
    if (!localStorage.getItem('cookiesAccepted')) {
        setTimeout(() => {
            const banner = document.getElementById('cookieBanner');
            if(banner) banner.classList.remove('translate-y-full');
        }, 2000);
    }

    window.acceptCookies = function() {
        localStorage.setItem('cookiesAccepted', 'true');
        const banner = document.getElementById('cookieBanner');
        if(banner) banner.classList.add('translate-y-full');
    };
});

// ==========================================
// 10. Utils & Global Effects
// ==========================================

// Scroll Progress Bar
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    const progressBar = document.getElementById('scrollProgress');
    if(progressBar) {
        progressBar.style.width = scrolled + "%";
    }
});

// Toast Notification
function showToast(message, type = 'success') {
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
}

// 3D Tilt Effect
document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.hero-float .glass-panel');
    const container = document.querySelector('.hero-float');

    if (card && container) {
        card.style.transition = 'transform 0.1s ease-out';
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xRotation = -((y - rect.height/2) / 20);
            const yRotation = (x - rect.width/2) / 20;
            card.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale(1.05)`;
        });
        container.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.5s ease-out';
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    }
});

// ========== NUMBER COUNTER ANIMATION ==========
const statsSection = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4'); // Stats grid
const stats = document.querySelectorAll('.glass-panel .text-2xl.font-bold'); // The numbers

let counted = false;

if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !counted) {
            stats.forEach(stat => {
                const target = parseInt(stat.innerText.replace(/\D/g, '')); // Extract number
                const suffix = stat.innerText.replace(/[0-9]/g, ''); // Extract %, + etc.
                let current = 0;
                const increment = Math.ceil(target / 50); // Speed
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        stat.innerText = target + suffix;
                        clearInterval(timer);
                    } else {
                        stat.innerText = current + suffix;
                    }
                }, 30);
            });
            counted = true;
        }
    });
    observer.observe(statsSection);
}

// ========== PARALLAX BACKGROUND ==========
document.addEventListener('mousemove', (e) => {
    const blobs = document.querySelectorAll('.animate-blob');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    blobs.forEach((blob, index) => {
        const speed = (index + 1) * 20; // Different speeds
        blob.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
});

// ==========================================
// 10/10 FINAL INTERACTION SCRIPTS
// ==========================================

// 1. SCROLL TO TOP LOGIC
const scrollBtn = document.getElementById('scrollTopBtn');

window.addEventListener('scroll', () => {
    // Show button after 500px scroll
    if (window.scrollY > 500) {
        scrollBtn?.classList.add('visible');
    } else {
        scrollBtn?.classList.remove('visible');
    }
});

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 2. ANIMATED NUMBER COUNTERS (0 -> 98%)
// ========== FIXED STATS COUNTER (NaN FIX) ==========
const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statBox = entry.target;
            const valueElement = statBox.querySelector('.text-2xl'); 
            
            if (valueElement && !statBox.classList.contains('counted')) {
                const originalText = valueElement.innerText.trim();
                
                // Sirf tab animate karo agar text mein NUMBER ho
                const match = originalText.match(/(\d+)/);
                
                if (match) {
                    const targetValue = parseInt(match[0]); // Number nikalo (e.g. 98)
                    const prefix = originalText.split(targetValue)[0] || ''; 
                    const suffix = originalText.split(targetValue)[1] || ''; 
                    
                    let current = 0;
                    const duration = 2000;
                    const stepTime = Math.abs(Math.floor(duration / targetValue));
                    
                    const timer = setInterval(() => {
                        current += 1;
                        valueElement.innerText = prefix + current + suffix;
                        if (current >= targetValue) {
                            clearInterval(timer);
                            valueElement.innerText = originalText; 
                        }
                    }, stepTime);
                } else {
                    // Agar number nahi hai (Jaise "AI" ya "Free"), to kuch mat karo.
                    // NaN error yahi ruk jayega.
                    valueElement.innerText = originalText;
                }
                
                statBox.classList.add('counted'); 
            }
            observer.unobserve(statBox);
        }
    });
}, { threshold: 0.5 });

// Start observing
document.querySelectorAll('.glass-panel.text-center').forEach(box => {
    statsObserver.observe(box);
});

// 3. PARALLAX MOUSE EFFECT (Background Blobs move)
document.addEventListener('mousemove', (e) => {
    const blobs = document.querySelectorAll('.animate-blob');
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;

    blobs.forEach((blob, index) => {
        const speed = (index + 1) * 20; // Har blob alag speed se hilega
        const xOffset = x * speed;
        const yOffset = y * speed;
        
        // Transform maintain karte hue translate add karo
        blob.style.transform = `translate(${xOffset}px, ${yOffset}px) scale(1)`;
    });
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
