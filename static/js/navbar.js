// static/js/navbar.js

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;

    if (menu.classList.contains('translate-x-full')) {
        menu.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden';
    } else {
        menu.classList.add('translate-x-full');
        document.body.style.overflow = '';
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const body = document.body;
    const isDark = html.classList.toggle('dark');
    body.classList.toggle('light-mode', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcons(!isDark);
}

function updateThemeIcons(isLight) {
    const removeClass = isLight ? 'fa-sun' : 'fa-moon';
    const addClass    = isLight ? 'fa-moon' : 'fa-sun';

    const allIcons = document.querySelectorAll(
        '#themeIcon, #mobileThemeIcon, #bottomThemeToggle i, .theme-icon'
    );
    allIcons.forEach(icon => {
        icon.classList.remove(removeClass);
        icon.classList.add(addClass);
    });
}

/* ============================================
   ACTIVE PAGE HIGHLIGHT
   ============================================ */
function setActiveNavLink() {
    // Current path (trailing slash hata ke normalize karo)
    let currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    // Agar query string ya hash ho toh ignore
    currentPath = currentPath.split('?')[0].split('#')[0];

    const allNavLinks = document.querySelectorAll('[data-nav]');

    allNavLinks.forEach(link => {
        const navPath = link.getAttribute('data-nav').replace(/\/$/, '') || '/';

        // Exact match OR sub-route match (jaise /builder/xyz bhi /builder ko match kare)
        const isActive = navPath === '/' 
            ? currentPath === '/' 
            : currentPath === navPath || currentPath.startsWith(navPath + '/');

        if (isActive) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

/* ============================================
   INIT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Theme init
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const isLight = savedTheme === 'light';

    document.documentElement.classList.toggle('dark', !isLight);
    document.body.classList.toggle('light-mode', isLight);
    updateThemeIcons(isLight);

    // Active link init
    setActiveNavLink();

    // Theme toggle global click
    document.addEventListener('click', (e) => {
        if (e.target.closest('#darkModeToggle, #themeToggle, #bottomThemeToggle, .theme-toggle-btn')) {
            toggleTheme();
        }
    });

    // Auto-close mobile menu on link click
    document.querySelectorAll('#mobileMenu a').forEach(link => {
        link.addEventListener('click', () => {
            const menu = document.getElementById('mobileMenu');
            if (menu && !menu.classList.contains('translate-x-full')) {
                setTimeout(() => toggleMobileMenu(), 200);
            }
        });
    });

    // Escape key closes drawer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const menu = document.getElementById('mobileMenu');
            if (menu && !menu.classList.contains('translate-x-full')) {
                toggleMobileMenu();
            }
        }
    });
});

// SPA / Turbo / bfcache support (agar aage use kare)
window.addEventListener('pageshow', setActiveNavLink);