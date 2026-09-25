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

    // Toggle states
    const isDarkNow = html.classList.toggle('dark');
    body.classList.toggle('light-mode', !isDarkNow);

    // Save Preference
    const currentTheme = isDarkNow ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);

    // Sync all icons across desktop, mobile and bottom nav
    updateThemeIcons(!isDarkNow);
}

function updateThemeIcons(isLight) {
    const removeClass = isLight ? 'fa-sun' : 'fa-moon';
    const addClass    = isLight ? 'fa-moon' : 'fa-sun';

    const allIcons = document.querySelectorAll(
        '#themeIcon, #mobileThemeIcon, #bottomThemeToggle i, .theme-icon, .theme-toggle-btn i'
    );
    allIcons.forEach(icon => {
        icon.classList.remove(removeClass);
        icon.classList.add(addClass);
    });
}

/* ============================================
   DESKTOP: Builder & Tools Dropdown (Click)
   ============================================ */
function toggleDesktopDropdown(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn = e.currentTarget;
    const dropdown = btn.parentElement.querySelector('.ats-dropdown-menu');
    const allDropdowns = document.querySelectorAll('.ats-dropdown-menu');

    // Close other dropdowns
    allDropdowns.forEach(d => {
        if (d !== dropdown) {
            d.classList.add('hidden');
            d.parentElement.classList.remove('dropdown-open');
        }
    });

    // Toggle current
    const isOpening = dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden');
    btn.parentElement.classList.toggle('dropdown-open', isOpening);
}

/* ============================================
   MOBILE: Builder & Tools Accordion
   ============================================ */
function toggleMobileToolsAccordion(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn = e.currentTarget;
    const accordion = btn.nextElementSibling;
    const chevron = btn.querySelector('.mobile-accordion-chevron');

    if (!accordion) return;

    const isOpening = accordion.classList.contains('hidden');
    accordion.classList.toggle('hidden');
    btn.classList.toggle('accordion-open', isOpening);

    if (chevron) {
        chevron.style.transform = isOpening ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

/* ============================================
   ACTIVE PAGE HIGHLIGHT
   ============================================ */
function setActiveNavLink() {
    let currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    currentPath = currentPath.split('?')[0].split('#')[0];

    const allNavLinks = document.querySelectorAll('[data-nav]');

    allNavLinks.forEach(link => {
        const navPath = link.getAttribute('data-nav').replace(/\/$/, '') || '/';

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

    // If a dropdown child is active, also mark parent button
    const activeChild = document.querySelector('.ats-dropdown-menu [data-nav].active');
    if (activeChild) {
        const parentWrap = activeChild.closest('.dropdown-parent');
        if (parentWrap) {
            parentWrap.querySelector('.ats-link-item')?.classList.add('active');
        }
    }
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

    // Active link
    setActiveNavLink();

    // Theme toggle
     // Theme toggle fallback listener
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('#darkModeToggle, #themeToggle, #mobileThemeToggle, #bottomThemeToggle, .theme-toggle-btn');
        if (toggleBtn) {
            // Agar button me inline onclick nahi hai to hi trigger karein
            if (!toggleBtn.getAttribute('onclick')) {
                toggleTheme();
            }
        }
    });

    // Close desktop dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-parent')) {
            document.querySelectorAll('.ats-dropdown-menu').forEach(d => {
                d.classList.add('hidden');
                d.parentElement.classList.remove('dropdown-open');
            });
        }
    });

    // Auto-close mobile menu on link click
    document.querySelectorAll('#mobileMenu a').forEach(link => {
        link.addEventListener('click', () => {
            // Don't auto-close if it's the accordion toggle
            if (link.classList.contains('mobile-accordion-toggle')) return;

            const menu = document.getElementById('mobileMenu');
            if (menu && !menu.classList.contains('translate-x-full')) {
                setTimeout(() => toggleMobileMenu(), 200);
            }
        });
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const menu = document.getElementById('mobileMenu');
            if (menu && !menu.classList.contains('translate-x-full')) {
                toggleMobileMenu();
            }
            document.querySelectorAll('.ats-dropdown-menu').forEach(d => {
                d.classList.add('hidden');
                d.parentElement.classList.remove('dropdown-open');
            });
        }
    });
});

window.addEventListener('pageshow', setActiveNavLink);
window.toggleTheme = toggleTheme;
window.updateThemeIcons = updateThemeIcons;