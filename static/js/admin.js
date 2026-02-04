// ==========================================
// 👑 ADMIN DASHBOARD LOGIC (admin.js)
// ==========================================

// 1. Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const html = document.documentElement;

// Check for saved theme preference or default to 'light'
const currentTheme = localStorage.getItem('theme') || 'light';
html.classList.toggle('dark', currentTheme === 'dark');

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        const isDark = html.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Agar charts loaded hain to theme change par update karo (Optional reload)
        // location.reload(); 
    });
}

// 2. Sidebar Toggle
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('hidden');
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    });
}

// ==========================================
// 🧭 NAVIGATION (Remember Active Tab)
// ==========================================
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');

// Global variable to store chart instances (taaki purane destroy kar sakein)
let analyticsCharts = {
    userChart: null,
    downloadChart: null
};

 // ==========================================
// 1. NAVIGATION & TAB SWITCHING (FIXED COLORS)
// ==========================================
function switchTab(targetHref) {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    // --- STEP A: Sabko Inactive (Gray) banao ---
    navItems.forEach(nav => {
        // 1. Remove Active Styles (Blue Color & BG)
        nav.classList.remove(
            'active', 
            'bg-blue-50', 'dark:bg-gray-800', 
            'text-blue-600', 'dark:text-blue-400'
        );
        
        // 2. Add Inactive Styles (Gray Color & Hover Effect)
        nav.classList.add(
            'text-gray-600', 'dark:text-gray-400', 
            'hover:bg-gray-100', 'dark:hover:bg-gray-800', 
            'hover:text-gray-900', 'dark:hover:text-white'
        );
    });

    // --- STEP B: Sare Sections Hide karo ---
    contentSections.forEach(section => section.classList.add('hidden'));

    // --- STEP C: Target Link ko Active (Blue) banao ---
    const activeNav = document.querySelector(`.nav-item[href="${targetHref}"]`);
    if (activeNav) {
        // 1. Remove Inactive Styles
        activeNav.classList.remove(
            'text-gray-600', 'dark:text-gray-400', 
            'hover:bg-gray-100', 'dark:hover:bg-gray-800', 
            'hover:text-gray-900', 'dark:hover:text-white'
        );

        // 2. Add Active Styles
        activeNav.classList.add(
            'active', 
            'bg-blue-50', 'dark:bg-gray-800', 
            'text-blue-600', 'dark:text-blue-400'
        );
    }

    if (targetHref === '#gallery') {
        loadGalleryImages();
    }

    if (targetHref === '#settings') {
        loadSettings();
    }

    // --- STEP D: Target Section Show karo ---
    const targetId = targetHref.substring(1) + '-section';
    const targetSection = document.getElementById(targetId);
    if (targetSection) targetSection.classList.remove('hidden');

    // --- STEP E: Logic Save & Charts ---
    localStorage.setItem('activeAdminTab', targetHref);

    // Agar Analytics hai to Chart Reload karo
    if (targetHref === '#analytics') {
        setTimeout(() => {
            if(typeof renderAnalyticsCharts === 'function') renderAnalyticsCharts();
        }, 100); 
    } 
    else if (targetHref === '#dashboard') {
        if(typeof initDashboardCharts === 'function') initDashboardCharts();
    }
}

// 2. CHART RENDERING FUNCTION (New Function)
async function renderAnalyticsCharts() {
    const ctxUser = document.getElementById('analyticsUserChart');
    const ctxDownload = document.getElementById('analyticsDownloadChart');

    if (!ctxUser || !ctxDownload) return;

    try {
        const response = await fetch('/api/admin/analytics');
        const data = await response.json();
        
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#e5e7eb' : '#374151';

        // --- Chart 1: Daily User Growth (Bar Chart) ---
        if (analyticsCharts.userChart) analyticsCharts.userChart.destroy(); // Purana hatao
        
        analyticsCharts.userChart = new Chart(ctxUser, {
            type: 'bar',
            data: {
                labels: data.user_growth.labels,
                datasets: [{
                    label: 'Active Users',
                    data: data.user_growth.data,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: textColor } },
                    x: { ticks: { color: textColor } }
                },
                plugins: { legend: { labels: { color: textColor } } }
            }
        });

        // --- Chart 2: Resume Downloads Trend (Line Chart) ---
        if (analyticsCharts.downloadChart) analyticsCharts.downloadChart.destroy(); // Purana hatao

        analyticsCharts.downloadChart = new Chart(ctxDownload, {
            type: 'line',
            data: {
                labels: data.downloads_trend.labels || [], 
                datasets: [{
                    label: 'Downloads',
                    data: data.downloads_trend.data || [],
                    borderColor: '#10b981', // Green Color
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: textColor } },
                    x: { ticks: { color: textColor } }
                },
                plugins: { legend: { labels: { color: textColor } } }
            }
        });

    } catch (error) {
        console.error("Analytics Chart Error:", error);
    }
}
// 2. Click Event Listener
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetHref = item.getAttribute('href');
        switchTab(targetHref);

        // Mobile Sidebar Close Logic
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (window.innerWidth < 1024 && sidebar) {
            sidebar.classList.add('-translate-x-full');
            if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
        }
    });
});

// 3. Page Load: Restore Last Active Tab
document.addEventListener('DOMContentLoaded', () => {
    // Agar memory me saved hai to wahi kholo, nahi to Default '#dashboard'
    const lastTab = localStorage.getItem('activeAdminTab') || '#dashboard';
    switchTab(lastTab);
    
    // Charts Init (Agar dashboard hai to)
    if(lastTab === '#dashboard') initCharts();
});

// 4. Template View Toggle (Grid vs List)
const gridViewBtn = document.getElementById('gridView');
const listViewBtn = document.getElementById('listView');

if (gridViewBtn && listViewBtn) {
    gridViewBtn.addEventListener('click', () => {
        gridViewBtn.classList.add('bg-blue-100', 'dark:bg-blue-900', 'text-blue-600', 'dark:text-blue-400');
        gridViewBtn.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400');
        listViewBtn.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'text-blue-600', 'dark:text-blue-400');
        listViewBtn.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400');
    });
    
    listViewBtn.addEventListener('click', () => {
        listViewBtn.classList.add('bg-blue-100', 'dark:bg-blue-900', 'text-blue-600', 'dark:text-blue-400');
        listViewBtn.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400');
        gridViewBtn.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'text-blue-600', 'dark:text-blue-400');
        gridViewBtn.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400');
    });
}

// ==========================================
// 📊 CHARTS INITIALIZATION (LIVE DATA)
// ==========================================
// ==========================================
// 📊 CHARTS & ANALYTICS LOGIC (Fixed)
// ==========================================

// Global variables to store chart instances
let userGrowthChartInstance = null;
let templateUsageChartInstance = null;

async function initCharts() {
    try {
        const res = await fetch('/api/admin/analytics');
        const data = await res.json();

        // 1. User Growth Chart
        const ctx1 = document.getElementById('userGrowthChart');
        if (ctx1) {
            // 👇 FIX: Agar purana chart hai to destroy karo
            if (userGrowthChartInstance) {
                userGrowthChartInstance.destroy();
            }

            userGrowthChartInstance = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: data.user_growth.labels,
                    datasets: [{
                        label: 'New Users',
                        data: data.user_growth.data,
                        borderColor: '#4F46E5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        // 2. Template Usage Chart
        const ctx2 = document.getElementById('templateUsageChart');
        if (ctx2) {
            // 👇 FIX: Agar purana chart hai to destroy karo
            if (templateUsageChartInstance) {
                templateUsageChartInstance.destroy();
            }

            templateUsageChartInstance = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: data.template_usage.labels,
                    datasets: [{
                        data: data.template_usage.data,
                        backgroundColor: [
                            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { position: 'right' } 
                    }
                }
            });
        }

    } catch (error) {
        console.error("Error loading charts:", error);
    }
}

// Ensure initCharts runs when Dashboard tab is active
// Isko apne switchTab logic ke andar call karna (agar zarurat ho)
// document.addEventListener('DOMContentLoaded', initCharts);

// Load Charts when page is ready
document.addEventListener('DOMContentLoaded', initCharts);

// ==========================================
// 👥 USER MANAGEMENT LOGIC
// ==========================================

// --- 1. Add User ---
function openAddUserModal() {
    document.getElementById('addUserModal').classList.remove('hidden');
}

async function handleAddUser(e) {
    e.preventDefault();
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPass').value;

    const res = await fetch('/api/admin/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if(data.success) {
        alert('User Created Successfully! ✅');
        location.reload();
    } else {
        alert('Error: ' + data.message);
    }
}

// --- 2. Delete User ---
async function deleteUser(userId) {
    if(!confirm("⚠️ Are you sure you want to DELETE this user? This cannot be undone.")) return;

    const res = await fetch(`/api/admin/delete-user/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    
    if(data.success) {
        location.reload();
    } else {
        alert("Failed to delete user.");
    }
}

// --- 3. Reset Password ---
function openResetModal(userId, userName) {
    document.getElementById('resetUserId').value = userId;
    document.getElementById('resetUserName').innerText = userName;
    document.getElementById('newResetPass').value = ''; // Clear old input
    document.getElementById('resetPassModal').classList.remove('hidden');
}

async function confirmResetPass() {
    const userId = document.getElementById('resetUserId').value;
    const newPass = document.getElementById('newResetPass').value;

    if(!newPass) { alert("Please enter a password"); return; }

    const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, new_password: newPass })
    });

    const data = await res.json();
    if(data.success) {
        alert("Password Updated! 🔒");
        document.getElementById('resetPassModal').classList.add('hidden');
    } else {
        alert("Error updating password.");
    }
}

// ==========================================
// ⚡ LIVE ACTIONS (Edit & Suspend)
// ==========================================

// --- 1. Edit User ---
function openEditUserModal(id, name, email, plan) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editUserName').value = name;
    document.getElementById('editUserEmail').value = email;
    document.getElementById('editUserPlan').value = plan;
    
    document.getElementById('editUserModal').classList.remove('hidden');
}

async function handleEditUser(e) {
    e.preventDefault();
    const id = document.getElementById('editUserId').value;
    const name = document.getElementById('editUserName').value;
    const email = document.getElementById('editUserEmail').value;
    const plan = document.getElementById('editUserPlan').value;

    const res = await fetch('/api/admin/edit-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id, name, email, plan })
    });

    const data = await res.json();
    if(data.success) {
        alert('User Updated Successfully! ✏️');
        location.reload();
    } else {
        alert('Update Failed: ' + data.message);
    }
}

// --- 2. Suspend/Activate User ---
// --- User Toggle ---
async function toggleUserStatus(userId) {
    if(!confirm("Change user status?")) return;
    // URL Change kiya: /api/admin/toggle-user-status/
    const res = await fetch(`/api/admin/toggle-user-status/${userId}`, { method: 'POST' });
    if(res.ok) location.reload();
}

// ==========================================
// 🔍 SEARCH FUNCTION (Real-time Filter)
// ==========================================
function searchUsers() {
    // 1. Get input value
    const input = document.getElementById('userSearch');
    const filter = input.value.toLowerCase();
    
    // 2. Get table rows
    const table = document.getElementById('usersTable');
    const rows = table.getElementsByTagName('tr');
    let hasResults = false;

    // 3. Loop through rows and hide/show based on match
    for (let i = 1; i < rows.length; i++) { // Skip header row (i=0)
        const nameCol = rows[i].querySelector('.user-name');
        const emailCol = rows[i].querySelector('.user-email');
        
        if (nameCol || emailCol) {
            const nameText = nameCol.textContent || nameCol.innerText;
            const emailText = emailCol.textContent || emailCol.innerText;

            if (nameText.toLowerCase().indexOf(filter) > -1 || emailText.toLowerCase().indexOf(filter) > -1) {
                rows[i].style.display = ""; // Show
                hasResults = true;
            } else {
                rows[i].style.display = "none"; // Hide
            }
        }
    }

    // 4. Show "No Results" message if empty
    const noMsg = document.getElementById('noUsersFound');
    if (noMsg) {
        noMsg.style.display = hasResults ? "none" : "block";
    }
}

// ==========================================
// 👥 USER ACTIONS (Edit, Add, Delete, Suspend)
// ==========================================

// --- ADD USER ---
function openAddUserModal() {
    document.getElementById('addUserModal').classList.remove('hidden');
}

async function handleAddUser(e) {
    e.preventDefault();
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPass').value;

    const res = await fetch('/api/admin/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if(data.success) {
        alert('User Created Successfully! ✅');
        location.reload();
    } else {
        alert('Error: ' + data.message);
    }
}

// --- EDIT USER ---
function openEditUserModal(id, name, email, plan) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editUserName').value = name;
    document.getElementById('editUserEmail').value = email;
    document.getElementById('editUserPlan').value = plan;
    document.getElementById('editUserModal').classList.remove('hidden');
}

async function handleEditUser(e) {
    e.preventDefault();
    const id = document.getElementById('editUserId').value;
    const name = document.getElementById('editUserName').value;
    const email = document.getElementById('editUserEmail').value;
    const plan = document.getElementById('editUserPlan').value;

    const res = await fetch('/api/admin/edit-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id, name, email, plan })
    });

    if((await res.json()).success) location.reload();
    else alert('Update Failed');
}



// --- DELETE USER ---
async function deleteUser(userId) {
    if(!confirm("⚠️ Delete this user permanently?")) return;
    const res = await fetch(`/api/admin/delete-user/${userId}`, { method: 'DELETE' });
    if((await res.json()).success) location.reload();
    else alert("Failed to delete");
}

// --- RESET PASSWORD ---
function openResetModal(userId, userName) {
    document.getElementById('resetUserId').value = userId;
    document.getElementById('resetUserName').innerText = userName;
    document.getElementById('newResetPass').value = '';
    document.getElementById('resetPassModal').classList.remove('hidden');
}

async function confirmResetPass() {
    const userId = document.getElementById('resetUserId').value;
    const newPass = document.getElementById('newResetPass').value;
    if(!newPass) return alert("Enter password");

    const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, new_password: newPass })
    });

    if((await res.json()).success) {
        alert("Password Reset Successful! 🔒");
        document.getElementById('resetPassModal').classList.add('hidden');
    } else {
        alert("Error resetting password");
    }
}

// ==========================================
// 🎨 TEMPLATE MANAGEMENT LOGIC
// ==========================================

// --- ADD TEMPLATE ---
function openAddTemplateModal() {
    document.getElementById('addTemplateModal').classList.remove('hidden');
}

// --- ADD TEMPLATE (With File Upload & Code) ---
async function handleAddTemplate(e) {
    e.preventDefault();
    
    const btn = document.getElementById('submitBtn');
    const originalText = btn.innerText;
    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        // Create FormData object for file upload
        const formData = new FormData();
        
        formData.append('name', document.getElementById('newTempId').value);
        formData.append('display_name', document.getElementById('newTempName').value);
        formData.append('category', document.getElementById('newTempCat').value);
        formData.append('description', document.getElementById('newTempDesc').value);
        formData.append('position', document.getElementById('newTempPosition').value);
        formData.append('badge', document.getElementById('newTempBadge').value);
        formData.append('is_premium', document.getElementById('newTempPremium').checked);
        
        // Code Content
        formData.append('html_content', document.getElementById('newTempHtml').value);
        formData.append('css_content', document.getElementById('newTempCss').value);
        
        // File Upload
        const fileInput = document.getElementById('newTempImageFile');
        if(fileInput.files.length > 0) {
            formData.append('image_file', fileInput.files[0]);
        }

        const res = await fetch('/api/admin/add-template', {
            method: 'POST',
            body: formData // No headers needed, browser sets multipart/form-data automatically
        });

        const data = await res.json();

        if (data.success) {
            alert("✅ Template Published Successfully!\nHTML & CSS files created.");
            location.reload();
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error(error);
        alert("Something went wrong!");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// --- EDIT TEMPLATE ---
function openEditTemplateModal(id, name, cat, isPremium, badge) {
    document.getElementById('editTempDbId').value = id;
    document.getElementById('editTempName').value = name;
    document.getElementById('editTempBadge').value = badge === 'None' ? '' : badge;
    
    // Checkbox Fix
    const premiumBox = document.getElementById('editTempPremium');
    premiumBox.checked = (isPremium === 'True' || isPremium === true || isPremium === '1');

    document.getElementById('editTemplateModal').classList.remove('hidden');
}

async function handleEditTemplate(e) {
    e.preventDefault();
    const data = {
        id: document.getElementById('editTempDbId').value,
        display_name: document.getElementById('editTempName').value,
        category: 'modern', // Keeping category simple for now, or fetch from UI
        description: 'Updated via Admin',
        is_premium: document.getElementById('editTempPremium').checked,
        badge: document.getElementById('editTempBadge').value
    };

    const res = await fetch('/api/admin/update-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if ((await res.json()).success) location.reload();
    else alert("Update Failed");
}

// --- DELETE TEMPLATE ---
async function deleteTemplate(id) {
    if(!confirm("⚠️ Delete this template permanently?")) return;
    
    const res = await fetch(`/api/admin/delete-template/${id}`, { method: 'DELETE' });
    
    if ((await res.json()).success) location.reload();
    else alert("Delete Failed");
}


// ==========================================
// 📊 ANALYTICS CHARTS RENDERER
// ==========================================


async function renderAnalyticsCharts() {
    const ctxUser = document.getElementById('analyticsUserChart');
    const ctxDownload = document.getElementById('analyticsDownloadChart');

    if (!ctxUser || !ctxDownload) return;

    try {
        const response = await fetch('/api/admin/analytics');
        const data = await response.json();
        
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#e5e7eb' : '#374151';

        // --- Chart 1: Daily User Growth ---
        if (analyticsCharts.user) analyticsCharts.user.destroy();
        analyticsCharts.user = new Chart(ctxUser, {
            type: 'bar',
            data: {
                labels: data.user_growth.labels,
                datasets: [{
                    label: 'Active Users',
                    data: data.user_growth.data,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 5
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // --- Chart 2: Downloads Trend ---
        if (analyticsCharts.download) analyticsCharts.download.destroy();
        analyticsCharts.download = new Chart(ctxDownload, {
            type: 'line',
            data: {
                labels: data.downloads_trend.labels || [],
                datasets: [{
                    label: 'Downloads',
                    data: data.downloads_trend.data || [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

    } catch (error) {
        console.error("Analytics Chart Error:", error);
    }
}

// ==========================================
// 👤 PROFILE DROPDOWN LOGIC (Fix)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. IDs Identify karo (Tumhare HTML mein shayad 'profileDropdown' hai)
    const profileBtn = document.getElementById('profileDropdown') || document.getElementById('profileBtn');
    
    // HTML mein dropdown menu dhoondo (Iska ID check karna)
    // Agar HTML mein menu nahi hai, to ye JS create karega (Fallback)
    let profileMenu = document.getElementById('profileMenu');

    if (profileBtn) {
        // Agar Menu HTML mein nahi hai, to error se bachne ke liye check
        if (!profileMenu) {
            // Find sibling div (Jo button ke niche hidden div hai)
            profileMenu = profileBtn.nextElementSibling; 
        }

        if (profileMenu) {
            // 2. Click Event
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Click bubble hone se roko
                profileMenu.classList.toggle('hidden');
            });

            // 3. Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
                    profileMenu.classList.add('hidden');
                }
            });
            
            console.log("✅ Profile Dropdown Initialized");
        } else {
            console.error("❌ Profile Menu DIV nahi mila! HTML check karo.");
        }
    }
});

// ==========================================
// 📝 BLOG MANAGEMENT LOGIC (Add to admin.js)
// ==========================================

// Open Modal
function openAddBlogModal() {
    document.getElementById('addBlogModal').classList.remove('hidden');
    document.getElementById('addBlogForm').reset();
}

// Handle Add Blog Form Submit
async function handleAddBlog(e) {
    e.preventDefault();
    
    const form = document.getElementById('addBlogForm');
    const formData = new FormData(form);
    const btn = form.querySelector('button[type="submit"]');
    
    // Loading State
    const originalText = btn.innerText;
    btn.innerText = "Publishing...";
    btn.disabled = true;

    try {
        const response = await fetch('/api/admin/add-blog', {
            method: 'POST',
            body: formData // FormData automatically handles file uploads
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Blog Published Successfully!');
            location.reload(); // Refresh to show new post
        } else {
            alert('❌ Error: ' + result.message);
        }
    } catch (error) {
        console.error('Blog Error:', error);
        alert('Something went wrong!');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Handle Delete Blog
async function deleteBlog(id) {
    if (!confirm("⚠️ Are you sure you want to delete this post?")) return;

    try {
        const response = await fetch(`/api/admin/delete-blog/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            location.reload();
        } else {
            alert("Failed to delete post");
        }
    } catch (error) {
        console.error(error);
        alert("Error deleting post");
    }
}

// ==========================================
// 🖼️ GALLERY MANAGER LOGIC
// ==========================================

let allGalleryImages = []; // Store data locally for filtering

// 1. Load Images
async function loadGalleryImages() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i><p class="mt-2 text-gray-500">Scanning storage...</p></div>';

    try {
        const response = await fetch('/api/admin/gallery-scan');
        allGalleryImages = await response.json();
        renderGallery(allGalleryImages);
    } catch (error) {
        console.error("Gallery Error:", error);
        grid.innerHTML = '<p class="col-span-full text-center text-red-500">Failed to load gallery.</p>';
    }
}

// 2. Render Images
function renderGallery(images) {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '';

    if (images.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Folder is empty!</div>';
        return;
    }

    images.forEach(img => {
        // Status Colors
        const isUsed = img.status === 'used';
        const statusColor = isUsed ? 'bg-green-500' : 'bg-red-500';
        const statusText = isUsed ? 'In Use' : 'Garbage';
        const borderClass = isUsed ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900 ring-2 ring-red-500/20';

        const html = `
            <div class="relative group bg-white dark:bg-gray-800 rounded-xl border ${borderClass} overflow-hidden shadow-sm transition-all hover:shadow-md">
                <div class="absolute top-2 left-2 px-2 py-1 text-[10px] font-bold text-white rounded-md ${statusColor} shadow-sm z-10">
                    ${statusText}
                </div>

                <div class="h-32 bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
                    <img src="${img.url}" class="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy">
                </div>

                <div class="p-3">
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate font-mono" title="${img.name}">${img.name}</p>
                    <p class="text-[10px] text-gray-400 mt-1">${img.size} KB</p>
                    
                    ${!isUsed ? `
                        <button onclick="deleteImage('${img.name}')" class="mt-2 w-full py-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white text-xs font-bold rounded border border-red-100 transition-colors">
                            <i class="fas fa-trash mr-1"></i> Delete
                        </button>
                    ` : `
                        <div class="mt-2 w-full py-1 text-center text-[10px] text-green-600 bg-green-50 rounded border border-green-100">
                            <i class="fas fa-check-circle mr-1"></i> Safe
                        </div>
                    `}
                </div>
            </div>
        `;
        grid.innerHTML += html;
    });
}

// 3. Filter Logic
function filterGallery(type) {
    if (type === 'all') {
        renderGallery(allGalleryImages);
    } else {
        const filtered = allGalleryImages.filter(img => img.status === type);
        renderGallery(filtered);
    }
}

// 4. Delete Logic
async function deleteImage(filename) {
    if(!confirm("⚠️ Delete this unused image permanently? This cannot be undone.")) return;

    try {
        const res = await fetch('/api/admin/delete-image', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ filename: filename })
        });
        
        const data = await res.json();
        
        if (data.success) {
            // Remove from array and re-render without reloading page
            allGalleryImages = allGalleryImages.filter(img => img.name !== filename);
            // Re-apply current filter if needed, or just render all
            renderGallery(allGalleryImages);
        } else {
            alert("Error: " + data.error);
        }
    } catch (e) {
        console.error(e);
        alert("Failed to delete image.");
    }
}
 // ==========================================
// ⚙️ SETTINGS MANAGER LOGIC
// ==========================================

// 1. Load Settings from DB
async function loadSettings() {
    try {
        const res = await fetch('/api/admin/settings');
        const settings = await res.json();
        
        // Populate Inputs
        document.getElementById('site_title').value = settings.site_title || '';
        document.getElementById('gemini_api_key').value = settings.gemini_api_key || '';
        document.getElementById('ai_model').value = settings.ai_model || 'gemini-1.5-flash';
        document.getElementById('free_resume_limit').value = settings.free_resume_limit || 1;
        
        // Handle Toggles (Checkboxes)
        document.getElementById('enable_signups').checked = (settings.enable_signups === 'true');
        document.getElementById('maintenance_mode').checked = (settings.maintenance_mode === 'true');

        // ... purane code ke baad ...
        document.getElementById('stripe_public_key').value = settings.stripe_public_key || '';
        document.getElementById('stripe_secret_key').value = settings.stripe_secret_key || '';
        document.getElementById('google_client_id').value = settings.google_client_id || '';
        document.getElementById('linkedin_client_id').value = settings.linkedin_client_id || '';
        document.getElementById('google_analytics_id').value = settings.google_analytics_id || '';

    } catch (error) {
        console.error("Error loading settings:", error);        
    }
}

// 2. Save Settings to DB
async function saveSettings() {
    const btn = document.querySelector('#settings-section button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
    btn.disabled = true;

    // Collect Data
    const data = {
        site_title: document.getElementById('site_title').value,
        gemini_api_key: document.getElementById('gemini_api_key').value,
        ai_model: document.getElementById('ai_model').value,
        free_resume_limit: document.getElementById('free_resume_limit').value,
        // Convert checkbox boolean to string 'true'/'false'
        enable_signups: document.getElementById('enable_signups').checked ? 'true' : 'false',
        maintenance_mode: document.getElementById('maintenance_mode').checked ? 'true' : 'false',
        stripe_public_key: document.getElementById('stripe_public_key').value,
        stripe_secret_key: document.getElementById('stripe_secret_key').value,
        google_client_id: document.getElementById('google_client_id').value,
        linkedin_client_id: document.getElementById('linkedin_client_id').value,
        google_analytics_id: document.getElementById('google_analytics_id').value
    };

    try {
        const res = await fetch('/api/admin/update-settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        if(result.success) {
            alert("✅ Settings Updated Successfully!");
        } else {
            alert("❌ Error: " + result.error);
        }
    } catch (error) {
        console.error(error);
        alert("Failed to save settings.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// 🔐 SECURITY LOGIC
// ==========================================

// 1. Change Password
async function changePassword() {
    const newPass = document.getElementById('new_admin_password').value;
    
    if(!newPass || newPass.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }
    
    if(!confirm("Are you sure you want to change your password?")) return;

    try {
        const res = await fetch('/api/admin/change-password', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ new_password: newPass })
        });
        
        const data = await res.json();
        if(data.success) {
            alert("✅ Password Updated! Please login again with new password.");
            location.reload();
        } else {
            alert("❌ Error: " + data.error);
        }
    } catch(e) {
        alert("Failed to update password.");
    }
}

// 2. Add Admin Modal
function openAddAdminModal() {
    document.getElementById('addAdminModal').classList.remove('hidden');
}

// 3. Handle Add Admin
async function handleAddAdmin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const res = await fetch('/api/admin/add-admin', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if(await res.json().then(d => d.success)) {
            alert("✅ New Admin Added!");
            location.reload();
        } else {
            alert("❌ Failed to add admin.");
        }
    } catch(e) {
        console.error(e);
    }
}

// ==========================================
    // 🛡️ SECURITY & ADMIN JS LOGIC
    // ==========================================

    // 1. Change Password (For Logged In Admin)
    async function changePassword() {
        const newPass = document.getElementById('new_admin_password').value;
        const btn = document.getElementById('changePassBtn');
        
        if(!newPass || newPass.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }
        
        if(!confirm("Are you sure you want to change your password?")) return;

        const originalText = btn.innerText;
        btn.innerText = "Updating...";
        btn.disabled = true;

        try {
            const res = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ new_password: newPass })
            });
            
            const data = await res.json();
            if(data.success) {
                alert("✅ Password Updated! Please login again.");
                location.reload();
            } else {
                alert("❌ Error: " + data.message);
            }
        } catch(e) {
            alert("Failed to update password.");
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }

    // 2. Add New Admin
    async function handleAddAdmin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/admin/add-admin', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            
            if(result.success) {
                alert("✅ New Admin Added Successfully!");
                location.reload();
            } else {
                alert("❌ Error: " + result.message);
            }
        } catch(e) {
            console.error(e);
            alert("Failed to add admin");
        }
    }
// ==========================================
// 🛡️ ADMIN ACTIONS (JS)
// ==========================================

async function toggleAdminStatus(id) {
    if(!confirm("Change admin status?")) return;
    // URL Change kiya: /api/admin/toggle-admin-status/
    const res = await fetch(`/api/admin/toggle-admin-status/${id}`, { method: 'POST' });
    if(res.ok) location.reload();
}
async function deleteAdmin(id) {
    if(!confirm("⚠️ WARNING: Permanently delete this Admin?")) return;

    try {
        const res = await fetch(`/api/admin/delete-admin/${id}`, { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await res.json();

        if (data.success) {
            alert("✅ Admin Deleted!");
            location.reload();
        } else {
            alert("❌ Error: " + data.message);
        }
    } catch (e) {
        console.error(e);
        alert("Failed to delete admin.");
    }
}

    // 4. Delete Admin
    async function deleteAdmin(id) {
        if(!confirm("⚠️ WARNING: Are you sure you want to DELETE this admin permanently? This cannot be undone.")) return;

        try {
            const res = await fetch(`/api/admin/delete-admin/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                alert("✅ Admin deleted successfully.");
                location.reload();
            } else {
                alert("❌ Error: " + data.message);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to delete admin");
        }
    }

    // ==========================================
// 👤 USER DETAIL VIEW LOGIC
// ==========================================

// 1. Open User Detail View
// ==========================================
// 👤 USER DETAIL VIEW LOGIC (FIXED)
// ==========================================

async function openUserDetail(userId) {
    // 1. UI Switch (Show Detail View, Hide List)
    const usersSection = document.getElementById('users-section');
    const detailSection = document.getElementById('user-detail-view');
    
    if(usersSection) usersSection.classList.add('hidden');
    if(detailSection) detailSection.classList.remove('hidden');

    try {
        // 2. Fetch Data from API
        const res = await fetch(`/api/admin/user-details/${userId}`);
        const data = await res.json();

        if(data.success) {
            // 👇 VARIABLE 'user' YAHAN DEFINE HUA HAI
            const user = data.user;

            // --- A. BASIC INFO POPULATE KARO ---
            document.getElementById('detailUserName').innerText = user.full_name || 'No Name';
            document.getElementById('detailUserEmail').innerText = user.email || 'No Email';
            document.getElementById('detailResumeCount').innerText = user.resume_count || 0;
            
            // Plan Badge
            const planBadge = document.getElementById('detailPlanBadge');
            if(planBadge) planBadge.innerText = user.plan_type || 'Free';

            // Credits Badge
            const creditsBadge = document.getElementById('detailCreditsBadge');
            if(creditsBadge) creditsBadge.innerText = user.ai_credits || 0;
            
            // Dates
            document.getElementById('detailJoinedAt').innerText = new Date(user.joined_at).toDateString();
            document.getElementById('detailLastActive').innerText = new Date(user.last_active).toDateString();

            // --- B. MANAGE FORM POPULATE KARO ---
            document.getElementById('manageUserId').value = user.id;
            document.getElementById('managePlan').value = user.plan_type;
            document.getElementById('manageCredits').value = user.ai_credits;

            // --- C. STATUS BADGE STYLE ---
            const statusBadge = document.getElementById('detailUserStatus');
            if(statusBadge) {
                statusBadge.innerText = user.status;
                if(user.status === 'Active') {
                    statusBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600";
                } else {
                    statusBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600";
                }
            }

            // --- D. USER DOCUMENTS LIST (YEH CODE 'user' KE ANDAR HI HONA CHAHIYE) ---
            const docContainer = document.getElementById('detailUserDocs');
            if(docContainer) {
                docContainer.innerHTML = ''; // Purana list saaf karo
                
                // Check karo agar docs hain
                if (user.saved_docs && user.saved_docs.length > 0) {
                    user.saved_docs.forEach(doc => {
                        const date = new Date(doc.updated_at).toLocaleDateString();
                        const html = `
                            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                        <i class="fas fa-file-alt"></i>
                                    </div>
                                    <div>
                                        <div class="text-sm font-bold text-gray-900 dark:text-white">${doc.title || 'Untitled'}</div>
                                        <div class="text-xs text-gray-500">${doc.template_name} • ${date}</div>
                                    </div>
                                </div>
                                <a href="/builder?id=${doc.id}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm font-medium">
                                    Open <i class="fas fa-external-link-alt ml-1"></i>
                                </a>
                            </div>
                        `;
                        docContainer.innerHTML += html;
                    });
                } else {
                    docContainer.innerHTML = '<p class="text-sm text-gray-500 text-center py-4 border border-dashed rounded-lg">No saved documents found.</p>';
                }
            }

        } else {
            alert("❌ Error: " + data.message);
            closeUserDetailView(); // Error aaye to wapas bhej do
        }
    } catch(error) {
        console.error("Error fetching user details:", error);
        alert("Failed to load user details. Check console.");
    }
}

// 2. Close View (Back to List)
function closeUserDetailView() {
    document.getElementById('user-detail-view').classList.add('hidden');
    document.getElementById('users-section').classList.remove('hidden');
}

// 3. Helper: Adjust Credits (+/- Buttons)
function adjustCredits(amount) {
    const input = document.getElementById('manageCredits');
    let val = parseInt(input.value) || 0;
    val += amount;
    if(val < 0) val = 0; // Negative credits not allowed
    input.value = val;
}

// 4. Save Changes (Plan & Credits)
async function saveUserResources(e) {
    e.preventDefault();
    
    const userId = document.getElementById('manageUserId').value;
    const plan = document.getElementById('managePlan').value;
    const credits = document.getElementById('manageCredits').value;

    if(!confirm(`Update User?\nPlan: ${plan}\nCredits: ${credits}`)) return;

    try {
        const res = await fetch('/api/admin/update-user-resources', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                user_id: userId,
                plan_type: plan,
                ai_credits: credits
            })
        });

        const data = await res.json();
        if(data.success) {
            alert("✅ User Resources Updated!");
            
            // UI Update karo instantly (Refresh ki zaroorat nahi)
            document.getElementById('detailPlanBadge').innerText = plan;
            document.getElementById('detailCreditsBadge').innerText = credits;
        } else {
            alert("❌ Error: " + data.message);
        }
    } catch(error) {
        console.error(error);
        alert("Update failed.");
    }
}