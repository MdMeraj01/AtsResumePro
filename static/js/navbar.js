// static/js/navbar.js

console.log("Navbar JS Loaded"); // Check karne ke liye

function toggleMobileMenu() {
    console.log("Menu Button Clicked"); // Debugging
    const menu = document.getElementById('mobileMenu');
    const body = document.body;
    
    if (!menu) {
        console.error("Mobile menu element not found!");
        return;
    }

    if (menu.classList.contains('translate-x-full')) {
        // Menu Open Karo
        menu.classList.remove('translate-x-full');
        body.style.overflow = 'hidden'; // Scroll band karo
    } else {
        // Menu Close Karo
        menu.classList.add('translate-x-full');
        body.style.overflow = 'auto'; // Scroll chalu karo
    }
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('light-mode');
    
    const isLight = body.classList.contains('light-mode');
    
    // Save to Local Storage
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    // Update Icons
    updateThemeIcons(isLight);
}

function updateThemeIcons(isLight) {
    const desktopIcon = document.getElementById('themeIcon');
    const mobileIcon = document.getElementById('mobileThemeIcon');
    const bottomIcon = document.querySelector('#bottomThemeToggle i'); // For Builder page bottom nav

    if (isLight) {
        if(desktopIcon) desktopIcon.classList.replace('fa-sun', 'fa-moon');
        if(mobileIcon) mobileIcon.classList.replace('fa-sun', 'fa-moon');
        if(bottomIcon) bottomIcon.classList.replace('fa-sun', 'fa-moon');
    } else {
        if(desktopIcon) desktopIcon.classList.replace('fa-moon', 'fa-sun');
        if(mobileIcon) mobileIcon.classList.replace('fa-moon', 'fa-sun');
        if(bottomIcon) bottomIcon.classList.replace('fa-moon', 'fa-sun');
    }
}

// Page Load hone par Theme Check karo
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        updateThemeIcons(true);
    }
});