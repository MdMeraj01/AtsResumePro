// Resume Builder Pro - Login/Signup Script
// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Resume Builder Pro - Login Page Initialized');
    
    // 🟢 NEW: Check if user is locked out (Brute Force Protection)
    const failedAttempts = parseInt(localStorage.getItem('failed_login_attempts') || '0');
    if (failedAttempts >= 3) {
        if(typeof lockFormAndForceReset === 'function') {
            lockFormAndForceReset();
        }
    }
    
    // Check URL params for tab
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'signup') {
        switchTab('signup');
    }
    
    // Initialize animations
    initAnimations();
    
    // Set up password strength indicator
    setupPasswordStrength();
    
    // Load saved credentials if any
    loadSavedCredentials();
    
    // Initialize floating labels
    initFloatingLabels();
});

function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginBtn = document.getElementById('tab-login');
    const signupBtn = document.getElementById('tab-signup');
    const switchText = document.getElementById('switch-text');
    
    loginForm.classList.add('fade-out');
    signupForm.classList.add('fade-out');
    
    setTimeout(() => {
        if (tab === 'login') {
            loginForm.classList.remove('fade-out');
            loginForm.classList.add('active-form', 'fade-in');
            signupForm.classList.remove('active-form', 'fade-in');
            
            loginBtn.classList.add('active');
            signupBtn.classList.remove('active');
            
            switchText.innerHTML = `Don't have an account? <a href="#" onclick="switchTab('signup')">Sign Up</a>`;
            history.pushState(null, null, '?tab=login');

            // Reset Signup Form If Switched
            signupStep = 1;
            const otpGroup = document.getElementById('signup-otp-group');
            if(otpGroup) otpGroup.style.display = 'none';
            const emailField = document.getElementById('signup-email');
            if(emailField) { emailField.readOnly = false; emailField.style.opacity = '1'; }
        } else {
            signupForm.classList.remove('fade-out');
            signupForm.classList.add('active-form', 'fade-in');
            loginForm.classList.remove('active-form', 'fade-in');
            
            signupBtn.classList.add('active');
            loginBtn.classList.remove('active');
            
            switchText.innerHTML = `Already have an account? <a href="#" onclick="switchTab('login')">Log In</a>`;
            history.pushState(null, null, '?tab=signup');
        }
        setTimeout(() => {
            loginForm.classList.remove('fade-in');
            signupForm.classList.remove('fade-in');
        }, 500);
    }, 300);
}
// Toggle Password Visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggleBtn = input.parentElement.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

// Password Strength Indicator
function setupPasswordStrength() {
    const passwordInput = document.getElementById('signup-password');
    if(!passwordInput) return;
    
    passwordInput.addEventListener('input', function(e) {
        const val = e.target.value;
        const bar = document.querySelector('.strength-bar');
        const txt = document.querySelector('.strength-text');
        let strength = 0;
        if(val.length > 5) strength += 25;
        if(val.length > 8) strength += 25;
        if(/[A-Z]/.test(val)) strength += 25;
        if(/[0-9]/.test(val)) strength += 25;
        
        bar.style.width = strength + '%';
        if(strength < 50) { bar.style.background = '#ef4444'; txt.innerText = 'Weak'; }
        else if(strength < 75) { bar.style.background = '#f59e0b'; txt.innerText = 'Medium'; }
        else { bar.style.background = '#10b981'; txt.innerText = 'Strong'; }
    });
}
function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    let strength = 0;
    let color = '#ef4444'; // Default red
    let text = 'Very Weak';
    
    // Check password criteria
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    
    // Update strength meter and text
    strengthBar.style.width = strength + '%';
    
    if (strength >= 75) {
        color = '#10b981'; // Green
        text = 'Strong';
    } else if (strength >= 50) {
        color = '#f59e0b'; // Yellow
        text = 'Good';
    } else if (strength >= 25) {
        color = '#f97316'; // Orange
        text = 'Weak';
    }
    
    strengthBar.style.background = color;
    strengthText.textContent = text;
    strengthText.style.color = color;
}


async function handleLogin(e) {
    e.preventDefault();
    
    // 🟢 NEW: Pehle check karo ki lock to nahi hai
    let attempts = parseInt(localStorage.getItem('failed_login_attempts') || '0');
    if (attempts >= 3) {
        lockFormAndForceReset();
        return; // 
    }

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('.submit-btn');
    const loader = submitBtn.querySelector('.btn-loader');
    const btnText = submitBtn.querySelector('span');

    submitBtn.disabled = true;
    btnText.style.opacity = '0.5';
    loader.style.display = 'block';

    try {
        const response = await fetch('/api/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // 🟢 NEW: Login Success ho gaya to attempts reset kar do
            localStorage.removeItem('failed_login_attempts');
            
            showToast('Success!', 'Login successful. Redirecting...', 'success');
            setTimeout(() => { window.location.href = data.redirect_url || '/'; }, 1000);
        } else {
            // 🟢 NEW: Galat Password par attempts badhao
            if (data.message === 'Incorrect password') {
                attempts++;
                localStorage.setItem('failed_login_attempts', attempts);
                
                if (attempts >= 3) {
                    lockFormAndForceReset(); // 3 baar me form lock
                } else {
                    showToast('Login Failed', `Wrong password! You have ${3 - attempts} attempt(s) left.`, 'error');
                }
                resetButtonState(submitBtn, btnText, loader);
            } 
            else if (data.error_type === 'not_found') {
                showToast('Account Not Found', data.message, 'info');
                setTimeout(() => {
                    switchTab('signup');
                    document.getElementById('signup-email').value = email; 
                    resetButtonState(submitBtn, btnText, loader);
                }, 1500);
            } else {
                showToast('Login Failed', data.message || 'Invalid credentials', 'error');
                resetButtonState(submitBtn, btnText, loader);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('System Error', 'Server not responding', 'error');
        resetButtonState(submitBtn, btnText, loader);
    }
}

// OTP Step Tracker
let signupStep = 1; // 1 = Send OTP, 2 = Verify & Register

async function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const terms = document.getElementById('terms').checked;
    const otpInput = document.getElementById('signup-otp'); // Naya OTP box

    const submitBtn = e.target.querySelector('.submit-btn');
    const loader = submitBtn.querySelector('.btn-loader');
    const btnText = submitBtn.querySelector('span');

    if (!terms) {
        showToast('Error', 'Please accept Terms & Conditions', 'error');
        return;
    }

    // Button Loading State
    submitBtn.disabled = true;
    btnText.style.opacity = '0.5';
    loader.style.display = 'block';

    // 🟢 STEP 1: EMAIL PAR OTP BHEJO
    if (signupStep === 1) {
        btnText.innerText = 'Sending OTP...';
        
        try {
            const response = await fetch('/api/user/send-signup-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showToast('OTP Sent!', 'Please check your email for the code.', 'success');
                
                // OTP Box dikhao aur Email lock kar do
                document.getElementById('signup-otp-group').style.display = 'block';
                document.getElementById('signup-email').readOnly = true;
                document.getElementById('signup-email').style.opacity = '0.7';
                otpInput.required = true;
                
                // Button Update karo
                btnText.innerText = 'Verify & Create Account';
                signupStep = 2; // Ab step 2 par chale gaye
                resetButtonState(submitBtn, btnText, loader);
            } else {
                showToast('Error', data.message || 'Failed to send OTP', 'error');
                btnText.innerText = 'Create Account';
                resetButtonState(submitBtn, btnText, loader);
            }
        } catch (error) {
            console.error(error);
            showToast('System Error', 'Server not responding', 'error');
            btnText.innerText = 'Create Account';
            resetButtonState(submitBtn, btnText, loader);
        }
    } 
    // 🟢 STEP 2: OTP VERIFY KARKE ACCOUNT BANAO
    else if (signupStep === 2) {
        const otp = otpInput.value;
        btnText.innerText = 'Verifying OTP...';

        if (!otp || otp.length !== 6) {
            showToast('Error', 'Please enter a valid 6-digit OTP', 'error');
            btnText.innerText = 'Verify & Create Account';
            resetButtonState(submitBtn, btnText, loader);
            return;
        }

        try {
            const response = await fetch('/api/user/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: name,
                    email: email,
                    password: password,
                    otp: otp // Backend ko OTP bhejo check karne ke liye
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showToast('Account Created!', 'Registration successful. Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = data.redirect_url || '/';
                }, 1000);
            } else {
                showToast('Signup Failed', data.message || 'Invalid OTP', 'error');
                btnText.innerText = 'Verify & Create Account';
                resetButtonState(submitBtn, btnText, loader);
            }
        } catch (error) {
            console.error(error);
            showToast('System Error', 'Server not responding', 'error');
            btnText.innerText = 'Verify & Create Account';
            resetButtonState(submitBtn, btnText, loader);
        }
    }
}

// Social Login Handler
function handleSocialLogin(provider) {
    showToast(`Signing in with ${provider}`, 'Redirecting to authentication...', 'info');
    
    // Add provider-specific styling
    const buttons = document.querySelectorAll('.social-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    const currentBtn = document.querySelector(`.${provider}-btn`);
    currentBtn.classList.add('loading');
    
    // Simulate social login process
    setTimeout(() => {
        buttons.forEach(btn => btn.disabled = false);
        currentBtn.classList.remove('loading');
        showToast('Authentication Successful', `Logged in with ${provider}`, 'success');
    }, 1500);
}

// Demo Account Filler
function fillDemoAccount(email, password) {
    const isLoginTab = document.getElementById('login-form').classList.contains('active-form');
    
    if (isLoginTab) {
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = password;
        document.getElementById('remember-me').checked = true;
        
        // Add animation
        const inputs = document.querySelectorAll('#login-form .form-input');
        inputs.forEach(input => {
            input.style.animation = 'pulse 0.5s ease';
            setTimeout(() => {
                input.style.animation = '';
            }, 500);
        });
        
        showToast('Demo Credentials Loaded', 'Click Sign In to continue', 'info');
    } else {
        showToast('Switch to Login', 'Please switch to login tab for demo accounts', 'info');
        switchTab('login');
        setTimeout(() => {
            fillDemoAccount(email, password);
        }, 500);
    }
}

// Toast Notification System
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}


function removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
}

// Utility Functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

async function simulateAPICall(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
}

function resetButtonState(button, text, loader) {
    button.disabled = false;
    text.style.opacity = '1';
    loader.style.display = 'none';
}


function loadSavedCredentials() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('login-email').value = rememberedEmail;
        document.getElementById('remember-me').checked = true;
    }
}

function initAnimations() {
    // Basic CSS injection for fade effects
    const style = document.createElement('style');
    style.textContent = `
        .fade-out { opacity: 0; transform: translateY(-10px); pointer-events: none; }
        .fade-in { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .active-form { display: block !important; transition: all 0.4s ease; }
        .form { display: none; }
    `;
    document.head.appendChild(style);
}

function initFloatingLabels() {
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Check initial state
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });
}

function updateProgressSteps(step) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((s, index) => {
        if (index < step) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
}

// Error handling for missing elements
function safeElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id "${id}" not found`);
    }
    return element;
}

// Add CSS for floating labels if not already present
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login Page Loaded');
    
    // Check URL params for tab switching
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'signup') {
        switchTab('signup');
    }
    
    // Setup Helpers
    initAnimations();
    setupPasswordStrength();
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl + L to focus login email
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        const loginEmail = document.getElementById('login-email');
        if (loginEmail) {
            loginEmail.focus();
            showToast('Keyboard Shortcut', 'Focus moved to email field', 'info');
        }
    }
    
    // Esc to clear forms
    if (e.key === 'Escape') {
        const activeForm = document.querySelector('.form.active-form');
        if (activeForm) {
            const inputs = activeForm.querySelectorAll('input');
            inputs.forEach(input => {
                if (input.type !== 'checkbox' && input.type !== 'submit') {
                    input.value = '';
                }
            });
            showToast('Form Cleared', 'All fields have been cleared', 'info');
        }
    }
    
    // Tab switching with keyboard
    if (e.altKey && e.key === '1') {
        e.preventDefault();
        switchTab('login');
    }
    
    if (e.altKey && e.key === '2') {
        e.preventDefault();
        switchTab('signup');
    }
});

// Add CSS for keyboard shortcuts hint
const shortcutStyle = document.createElement('style');
shortcutStyle.textContent = `
    .keyboard-hint {
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 10px;
        font-size: 11px;
        color: #94a3b8;
        backdrop-filter: blur(10px);
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s;
    }
    .keyboard-hint.show {
        opacity: 1;
    }
    .keyboard-hint kbd {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        margin: 0 2px;
    }
`;
document.head.appendChild(shortcutStyle);

// Add keyboard hint element
const keyboardHint = document.createElement('div');
keyboardHint.className = 'keyboard-hint';
keyboardHint.innerHTML = `
    <div><kbd>Alt</kbd> + <kbd>1</kbd> Login</div>
    <div><kbd>Alt</kbd> + <kbd>2</kbd> Signup</div>
    <div><kbd>Ctrl</kbd> + <kbd>L</kbd> Focus Email</div>
    <div><kbd>Esc</kbd> Clear Form</div>
`;
document.body.appendChild(keyboardHint);

// Show keyboard hint on Ctrl + /
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        keyboardHint.classList.toggle('show');
    }
});

// Hide keyboard hint when clicking away
document.addEventListener('click', function(e) {
    if (!keyboardHint.contains(e.target)) {
        keyboardHint.classList.remove('show');
    }
});

// 🟢 NEW FUNCTION: Form lock karne ka logic (Brute Force Protection)
function lockFormAndForceReset() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    // Form ko dhundhla (blur) kar do aur clicks disable kar do
    if(loginForm) {
        loginForm.style.opacity = '0.4';
        loginForm.style.pointerEvents = 'none';
    }
    if(signupForm) {
        signupForm.style.opacity = '0.4';
        signupForm.style.pointerEvents = 'none';
    }

    showToast('Security Alert 🚨', 'Too many failed attempts! Form locked. Please reset your password.', 'error');
    
    // 1 second baad auto-open Forgot Password Modal
    setTimeout(() => {
        if(typeof openForgotModal === 'function') {
            openForgotModal();
        }
    }, 1500);
}