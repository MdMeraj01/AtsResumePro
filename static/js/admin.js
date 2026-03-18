// ==========================================
// 👑 ADMIN DASHBOARD LOGIC (admin.js) - CLEANED & OPTIMIZED
// ==========================================

// Global Variables
const chartRegistry = {
    dashboardLine: null,
    dashboardDoughnut: null,
    analyticsUser: null,
    analyticsDownload: null
};

let allGalleryImages = [];

// ==========================================
// 🌓 DARK MODE TOGGLE
// ==========================================
(function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const html = document.documentElement;
    const currentTheme = localStorage.getItem('theme') || 'light';
    html.classList.toggle('dark', currentTheme === 'dark');

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            html.classList.toggle('dark');
            localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
        });
    }
})();

// ==========================================
// 📱 SIDEBAR TOGGLE
// ==========================================
(function initSidebar() {
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
})();

// ==========================================
// 🧭 NAVIGATION & TAB SWITCHING
// ==========================================
function switchTab(targetHref) {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    // Reset all nav items
    navItems.forEach(nav => {
        nav.classList.remove('active', 'bg-blue-50', 'dark:bg-gray-800', 'text-blue-600', 'dark:text-blue-400');
        nav.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
    });

    // Hide all sections
    contentSections.forEach(section => section.classList.add('hidden'));

    // Activate current nav
    const activeNav = document.querySelector(`.nav-item[href="${targetHref}"]`);
    if (activeNav) {
        activeNav.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
        activeNav.classList.add('active', 'bg-blue-50', 'dark:bg-gray-800', 'text-blue-600', 'dark:text-blue-400');
    }

    // Show current section
    const targetId = targetHref.substring(1) + '-section';
    const targetSection = document.getElementById(targetId);
    if (targetSection) targetSection.classList.remove('hidden');

    // Save state
    localStorage.setItem('activeAdminTab', targetHref);

    // Load section-specific data
    if (targetHref === '#dashboard') {
        setTimeout(initDashboardCharts, 100);
    } else if (targetHref === '#analytics') {
        setTimeout(renderAnalyticsCharts, 100);
    } else if (targetHref === '#gallery') {
        loadGalleryImages();
    } else if (targetHref === '#settings') {
        loadSettings();
    }
}

// Navigation click handlers
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetHref = item.getAttribute('href');
        switchTab(targetHref);

        // Close sidebar on mobile
        if (window.innerWidth < 1024) {
            document.getElementById('sidebar')?.classList.add('-translate-x-full');
            document.getElementById('sidebarOverlay')?.classList.add('hidden');
        }
    });
});

// Load last active tab on page load
document.addEventListener('DOMContentLoaded', () => {
    const lastTab = localStorage.getItem('activeAdminTab') || '#dashboard';
    switchTab(lastTab);
});

// ==========================================
// 👤 PROFILE DROPDOWN
// ==========================================
(function initProfileDropdown() {
    const profileBtn = document.getElementById('profileDropdown');
    const profileMenu = document.getElementById('profileMenu');

    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.classList.add('hidden');
            }
        });
    }
})();

// ==========================================
// 📊 DASHBOARD CHARTS
// ==========================================
async function initDashboardCharts() {
    const ctxGrowth = document.getElementById('userGrowthChart');
    const ctxUsage = document.getElementById('templateUsageChart');

    if (!ctxGrowth || !ctxUsage) return;

    try {
        const res = await fetch('/api/admin/analytics');
        const data = await res.json();
        
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#cbd5e1' : '#4b5563';

        // User Growth Chart
        if (chartRegistry.dashboardLine) chartRegistry.dashboardLine.destroy();
        
        chartRegistry.dashboardLine = new Chart(ctxGrowth, {
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
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: true, ticks: { color: textColor } },
                    x: { ticks: { color: textColor } }
                }
            }
        });

        // Template Usage Chart
        if (chartRegistry.dashboardDoughnut) chartRegistry.dashboardDoughnut.destroy();

        const generateColors = (count) => {
            const colors = [];
            for(let i=0; i<count; i++) {
                const hue = Math.floor((i * 360) / count);
                colors.push(`hsl(${hue}, 70%, 50%)`);
            }
            return colors;
        };

        chartRegistry.dashboardDoughnut = new Chart(ctxUsage, {
            type: 'doughnut',
            data: {
                labels: data.template_usage.labels,
                datasets: [{
                    data: data.template_usage.data,
                    backgroundColor: generateColors(data.template_usage.data.length),
                    borderWidth: 1,
                    borderColor: isDark ? '#1e293b' : '#ffffff',
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        position: 'right', 
                        labels: { 
                            color: textColor,
                            boxWidth: 12,
                            font: { size: 11 }
                        } 
                    } 
                },
                cutout: '60%'
            }
        });

    } catch (error) {
        console.error("Dashboard Chart Error:", error);
    }
}

// ==========================================
// 📊 ANALYTICS CHARTS
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

        // User Growth Chart (Bar)
        if (chartRegistry.analyticsUser) chartRegistry.analyticsUser.destroy();
        
        chartRegistry.analyticsUser = new Chart(ctxUser, {
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

        // Downloads Trend Chart (Line)
        if (chartRegistry.analyticsDownload) chartRegistry.analyticsDownload.destroy();

        chartRegistry.analyticsDownload = new Chart(ctxDownload, {
            type: 'line',
            data: {
                labels: data.downloads_trend.labels || [],
                datasets: [{
                    label: 'Downloads',
                    data: data.downloads_trend.data || [],
                    borderColor: '#10b981',
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

// ==========================================
// 👥 USER MANAGEMENT
// ==========================================

// Search Users
function searchUsers() {
    const input = document.getElementById('userSearch');
    const filter = input.value.toLowerCase();
    const table = document.getElementById('usersTable');
    const rows = table.getElementsByTagName('tr');
    let hasResults = false;

    for (let i = 1; i < rows.length; i++) {
        const nameCol = rows[i].querySelector('.user-name');
        const emailCol = rows[i].querySelector('.user-email');
        
        if (nameCol || emailCol) {
            const nameText = nameCol?.textContent || nameCol?.innerText || '';
            const emailText = emailCol?.textContent || emailCol?.innerText || '';

            if (nameText.toLowerCase().indexOf(filter) > -1 || emailText.toLowerCase().indexOf(filter) > -1) {
                rows[i].style.display = "";
                hasResults = true;
            } else {
                rows[i].style.display = "none";
            }
        }
    }

    const noMsg = document.getElementById('noUsersFound');
    if (noMsg) {
        noMsg.style.display = hasResults ? "none" : "block";
    }
}

// Add User Modal
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
        alert('✅ User Created Successfully!');
        location.reload();
    } else {
        alert('❌ Error: ' + data.message);
    }
}

// Edit User
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
        alert('✅ User Updated Successfully!');
        location.reload();
    } else {
        alert('❌ Update Failed: ' + data.message);
    }
}

// Delete User
async function deleteUser(userId) {
    if(!confirm("⚠️ Are you sure you want to DELETE this user permanently?")) return;

    const res = await fetch(`/api/admin/delete-user/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    
    if(data.success) {
        location.reload();
    } else {
        alert("❌ Failed to delete user.");
    }
}

// Reset Password
function openResetModal(userId, userName) {
    document.getElementById('resetUserId').value = userId;
    document.getElementById('resetUserName').innerText = userName;
    document.getElementById('newResetPass').value = '';
    document.getElementById('resetPassModal').classList.remove('hidden');
}

async function confirmResetPass() {
    const userId = document.getElementById('resetUserId').value;
    const newPass = document.getElementById('newResetPass').value;

    if(!newPass) { 
        alert("Please enter a password"); 
        return; 
    }

    const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, new_password: newPass })
    });

    const data = await res.json();
    if(data.success) {
        alert("✅ Password Updated!");
        document.getElementById('resetPassModal').classList.add('hidden');
    } else {
        alert("❌ Error updating password.");
    }
}

// Toggle User Status
async function toggleUserStatus(userId) {
    if(!confirm("Change user status?")) return;
    const res = await fetch(`/api/admin/toggle-user-status/${userId}`, { method: 'POST' });
    if(res.ok) location.reload();
}

// ==========================================
// 👤 USER DETAIL VIEW
// ==========================================
async function openUserDetail(userId) {
    document.getElementById('users-section').classList.add('hidden');
    document.getElementById('user-detail-view').classList.remove('hidden');

    try {
        const res = await fetch(`/api/admin/user-details/${userId}`);
        const data = await res.json();

        if(data.success) {
            const user = data.user;

            // Basic Info
            document.getElementById('detailUserName').innerText = user.full_name || 'No Name';
            document.getElementById('detailUserEmail').innerText = user.email || 'No Email';
            document.getElementById('detailResumeCount').innerText = user.resume_count || 0;
            document.getElementById('detailPlanBadge').innerText = user.plan_type || 'Free';
            document.getElementById('detailCreditsBadge').innerText = user.ai_credits || 0;
            document.getElementById('detailJoinedAt').innerText = new Date(user.joined_at).toDateString();
            document.getElementById('detailLastActive').innerText = new Date(user.last_active).toDateString();

            // Manage Form
            document.getElementById('manageUserId').value = user.id;
            document.getElementById('managePlan').value = user.plan_type;
            document.getElementById('manageCredits').value = user.ai_credits;

            // Status Badge
            const statusBadge = document.getElementById('detailUserStatus');
            statusBadge.innerText = user.status;
            statusBadge.className = user.status === 'Active' 
                ? "px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600"
                : "px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600";

            // User Documents
            const docContainer = document.getElementById('detailUserDocs');
            docContainer.innerHTML = '';

            if (user.saved_docs && user.saved_docs.length > 0) {
                user.saved_docs.forEach(doc => {
                    const date = new Date(doc.updated_at).toLocaleDateString();
                    docContainer.innerHTML += `
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
                });
            } else {
                docContainer.innerHTML = '<p class="text-sm text-gray-500 text-center py-4 border border-dashed rounded-lg">No saved documents found.</p>';
            }

            // 🟢 NEW: Populate Purchased Premium Templates
            const purchaseContainer = document.getElementById('detailUserPurchases');
            if (purchaseContainer) {
                purchaseContainer.innerHTML = '';

                if (user.purchases && user.purchases.length > 0) {
                    user.purchases.forEach(p => {
                        const isLifetime = p.access_type === 'lifetime';
                        const badgeClass = isLifetime ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-orange-100 text-orange-600 border-orange-200';
                        const badgeIcon = isLifetime ? 'fa-infinity' : 'fa-file-export';
                        const date = p.purchase_date ? new Date(p.purchase_date).toLocaleDateString() : 'Recently';

                        purchaseContainer.innerHTML += `
                            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group mt-2">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                                        <i class="fas fa-crown"></i>
                                    </div>
                                    <div>
                                        <div class="text-sm font-bold text-gray-900 dark:text-white capitalize">${p.template_name}</div>
                                        <div class="text-[10px] text-gray-500 font-mono">Date: ${date}</div>
                                    </div>
                                </div>
                                <span class="px-2.5 py-1 text-[10px] font-bold rounded-md border uppercase tracking-wide ${badgeClass}">
                                    <i class="fas ${badgeIcon} mr-1"></i> ${p.access_type || 'Single'}
                                </span>
                            </div>
                        `;
                    });
                } else {
                    purchaseContainer.innerHTML = `
                        <div class="text-center py-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 mt-2">
                            <i class="fas fa-box-open text-2xl text-gray-300 dark:text-gray-600 mb-2"></i>
                            <p class="text-sm text-gray-500 font-medium">No premium templates purchased yet.</p>
                        </div>`;
                }
            }

        } else {
            alert("❌ Error: " + data.message);
            closeUserDetailView();
        }
    } catch(error) {
        console.error("Error fetching user details:", error);
        alert("Failed to load user details.");
    }
}

function closeUserDetailView() {
    document.getElementById('user-detail-view').classList.add('hidden');
    document.getElementById('users-section').classList.remove('hidden');
}

function adjustCredits(amount) {
    const input = document.getElementById('manageCredits');
    let val = parseInt(input.value) || 0;
    val += amount;
    if(val < 0) val = 0;
    input.value = val;
}

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

// ==========================================
// 🎨 TEMPLATE MANAGEMENT
// ==========================================
function openAddTemplateModal() {
    document.getElementById('addTemplateModal').classList.remove('hidden');
}

async function handleAddTemplate(e) {
    e.preventDefault();
    
    const btn = document.getElementById('submitBtn');
    const originalText = btn.innerText;
    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        const formData = new FormData();
        
        formData.append('name', document.getElementById('newTempId').value);
        formData.append('display_name', document.getElementById('newTempName').value);
        formData.append('category', document.getElementById('newTempCat').value);
        formData.append('description', document.getElementById('newTempDesc').value);
        formData.append('position', document.getElementById('newTempPosition').value);
        formData.append('badge', document.getElementById('newTempBadge').value);
        formData.append('is_premium', document.getElementById('newTempPremium').checked);
        formData.append('html_content', document.getElementById('newTempHtml').value);
        formData.append('css_content', document.getElementById('newTempCss').value);
        
        const fileInput = document.getElementById('newTempImageFile');
        if(fileInput.files.length > 0) {
            formData.append('image_file', fileInput.files[0]);
        }

        const res = await fetch('/api/admin/add-template', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            alert("✅ Template Published Successfully!");
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

function openEditTemplateModal(id, name, cat, isPremium, badge) {
    document.getElementById('editTempDbId').value = id;
    document.getElementById('editTempName').value = name;
    document.getElementById('editTempBadge').value = badge === 'None' ? '' : badge;
    document.getElementById('editTempPremium').checked = (isPremium === 'True' || isPremium === true || isPremium === '1');
    document.getElementById('editTemplateModal').classList.remove('hidden');
}

async function handleEditTemplate(e) {
    e.preventDefault();
    const data = {
        id: document.getElementById('editTempDbId').value,
        display_name: document.getElementById('editTempName').value,
        category: 'modern',
        description: 'Updated via Admin',
        is_premium: document.getElementById('editTempPremium').checked,
        badge: document.getElementById('editTempBadge').value
    };

    const res = await fetch('/api/admin/update-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    if (result.success) {
        location.reload();
    } else {
        alert("Update Failed");
    }
}

async function deleteTemplate(id) {
    if(!confirm("⚠️ Delete this template permanently?")) return;
    
    const res = await fetch(`/api/admin/delete-template/${id}`, { method: 'DELETE' });
    const result = await res.json();
    
    if (result.success) {
        location.reload();
    } else {
        alert("Delete Failed");
    }
}

// ==========================================
// 📝 BLOG MANAGEMENT
// ==========================================
function openAddBlogModal() {
    document.getElementById('addBlogModal').classList.remove('hidden');
    document.getElementById('addBlogForm').reset();
}

async function handleAddBlog(e) {
    e.preventDefault();
    
    const form = document.getElementById('addBlogForm');
    const formData = new FormData(form);
    const btn = form.querySelector('button[type="submit"]');
    
    const originalText = btn.innerText;
    btn.innerText = "Publishing...";
    btn.disabled = true;

    try {
        const response = await fetch('/api/admin/add-blog', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Blog Published Successfully!');
            location.reload();
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
// 🖼️ GALLERY MANAGER
// ==========================================
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

function renderGallery(images) {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '';

    if (images.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Folder is empty!</div>';
        return;
    }

    images.forEach(img => {
        const isUsed = img.status === 'used';
        const statusColor = isUsed ? 'bg-green-500' : 'bg-red-500';
        const statusText = isUsed ? 'In Use' : 'Garbage';
        const borderClass = isUsed ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900 ring-2 ring-red-500/20';

        grid.innerHTML += `
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
    });
}

function filterGallery(type) {
    if (type === 'all') {
        renderGallery(allGalleryImages);
    } else {
        const filtered = allGalleryImages.filter(img => img.status === type);
        renderGallery(filtered);
    }
}

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
            allGalleryImages = allGalleryImages.filter(img => img.name !== filename);
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
// ⚙️ SETTINGS MANAGER
// ==========================================
async function loadSettings() {
    try {
        const res = await fetch('/api/admin/settings');
        const settings = await res.json();
        
        document.getElementById('site_title').value = settings.site_title || '';
        document.getElementById('gemini_api_key').value = settings.gemini_api_key || '';
        document.getElementById('ai_model').value = settings.ai_model || 'gemini-1.5-flash';
        document.getElementById('free_resume_limit').value = settings.free_resume_limit || 1;
        document.getElementById('enable_signups').checked = (settings.enable_signups === 'true');
        document.getElementById('maintenance_mode').checked = (settings.maintenance_mode === 'true');
        document.getElementById('stripe_public_key').value = settings.stripe_public_key || '';
        document.getElementById('stripe_secret_key').value = settings.stripe_secret_key || '';
        document.getElementById('google_client_id').value = settings.google_client_id || '';
        document.getElementById('linkedin_client_id').value = settings.linkedin_client_id || '';
        document.getElementById('google_analytics_id').value = settings.google_analytics_id || '';

    } catch (error) {
        console.error("Error loading settings:", error);        
    }
}

async function saveSettings() {
    const btn = document.querySelector('#settings-section button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
    btn.disabled = true;

    const data = {
        site_title: document.getElementById('site_title').value,
        gemini_api_key: document.getElementById('gemini_api_key').value,
        ai_model: document.getElementById('ai_model').value,
        free_resume_limit: document.getElementById('free_resume_limit').value,
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
// 🔐 SECURITY & ADMIN MANAGEMENT
// ==========================================

// Change Password
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

// Add Admin
function openAddAdminModal() {
    document.getElementById('addAdminModal').classList.remove('hidden');
}

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

// Toggle Admin Status
async function toggleAdminStatus(id) {
    if(!confirm("Change admin status?")) return;
    const res = await fetch(`/api/admin/toggle-admin-status/${id}`, { method: 'POST' });
    if(res.ok) location.reload();
}

// Delete Admin
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