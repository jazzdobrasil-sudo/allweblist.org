/**
 * Admin Panel JavaScript
 * Handles authentication, website management, and CRUD operations
 */

// Admin credentials (in production, use proper authentication)
const ADMIN_USERNAME = 'Victor';
const ADMIN_PASSWORD = 'Asean1234$';

let allWebsitesAdmin = [];
let filteredWebsitesAdmin = [];
let currentPageAdmin = 1;
const itemsPerPageAdmin = 20;
let deleteTargetId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupAdminEventListeners();
});

/**
 * Check if user is authenticated
 */
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    
    if (isAuthenticated) {
        showAdminPanel();
        loadAdminWebsites();
    } else {
        showLoginScreen();
    }
}

/**
 * Show login screen
 */
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('adminPanel').classList.remove('active');
    document.getElementById('logoutBtn').classList.add('hidden');
}

/**
 * Show admin panel
 */
function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').classList.add('active');
    document.getElementById('logoutBtn').classList.remove('hidden');
}

/**
 * Setup event listeners
 */
function setupAdminEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Refresh list
    document.getElementById('refreshList').addEventListener('click', loadAdminWebsites);
    
    // Show add form
    document.getElementById('showAddForm').addEventListener('click', () => {
        document.getElementById('addWebsiteForm').classList.toggle('hidden');
        document.getElementById('csvImportTool').classList.add('hidden');
    });
    
    // Show CSV import tool
    document.getElementById('showCsvImport').addEventListener('click', () => {
        document.getElementById('csvImportTool').classList.toggle('hidden');
        document.getElementById('addWebsiteForm').classList.add('hidden');
    });
    
    // Cancel add
    document.getElementById('cancelAdd').addEventListener('click', () => {
        document.getElementById('addWebsiteForm').classList.add('hidden');
        document.getElementById('adminSubmissionForm').reset();
    });
    
    // Cancel CSV import
    document.getElementById('cancelImport').addEventListener('click', () => {
        document.getElementById('csvImportTool').classList.add('hidden');
        document.getElementById('csvFileInput').value = '';
        document.getElementById('csvPreview').classList.add('hidden');
        document.getElementById('importProgress').classList.add('hidden');
        document.getElementById('importSuccess').classList.add('hidden');
        document.getElementById('errorList').classList.add('hidden');
    });
    
    // Admin submission form
    document.getElementById('adminSubmissionForm').addEventListener('submit', handleAdminSubmit);
    
    // Filters
    document.getElementById('adminSearch').addEventListener('input', debounceAdmin(applyAdminFilters, 300));
    document.getElementById('adminCategoryFilter').addEventListener('change', applyAdminFilters);
    document.getElementById('adminStatusFilter').addEventListener('change', applyAdminFilters);
    
    // Delete modal
    document.getElementById('cancelDelete').addEventListener('click', hideDeleteModal);
    document.getElementById('confirmDelete').addEventListener('click', confirmDelete);
}

/**
 * Handle login
 */
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminAuthenticated', 'true');
        document.getElementById('loginError').classList.add('hidden');
        showAdminPanel();
        loadAdminWebsites();
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    sessionStorage.removeItem('adminAuthenticated');
    showLoginScreen();
    allWebsitesAdmin = [];
    filteredWebsitesAdmin = [];
}

/**
 * Load all websites for admin
 */
async function loadAdminWebsites() {
    try {
        showTableLoading(true);
        
        const response = await fetch('tables/websites?limit=1000&sort=-created_at');
        const data = await response.json();
        
        allWebsitesAdmin = data.data;
        filteredWebsitesAdmin = [...allWebsitesAdmin];
        
        // Update stats
        updateAdminStats();
        
        showTableLoading(false);
        applyAdminFilters();
        
    } catch (error) {
        console.error('Error loading websites:', error);
        showTableLoading(false);
        showTableEmpty(true);
    }
}

/**
 * Update admin statistics
 */
function updateAdminStats() {
    const total = allWebsitesAdmin.length;
    const published = allWebsitesAdmin.filter(s => s.status === 'published').length;
    const flagged = allWebsitesAdmin.filter(s => s.flagged === true).length;
    
    document.getElementById('totalWebsitesAdmin').textContent = total;
    document.getElementById('publishedCount').textContent = published;
    document.getElementById('flaggedCount').textContent = flagged;
}

/**
 * Display websites in table
 */
function displayAdminWebsites() {
    const tbody = document.getElementById('websitesTableBody');
    const startIndex = (currentPageAdmin - 1) * itemsPerPageAdmin;
    const endIndex = startIndex + itemsPerPageAdmin;
    const websitesToShow = filteredWebsitesAdmin.slice(startIndex, endIndex);
    
    if (filteredWebsitesAdmin.length === 0) {
        showTableEmpty(true);
        return;
    }
    
    showTableEmpty(false);
    
    tbody.innerHTML = websitesToShow.map(site => createTableRow(site)).join('');
    
    // Update pagination
    updateAdminPagination();
}

/**
 * Create table row HTML
 */
function createTableRow(site) {
    const submittedDate = new Date(site.submittedAt || site.created_at).toLocaleDateString();
    const statusBadge = site.status === 'published' 
        ? '<span class="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">Published</span>'
        : '<span class="px-3 py-1 rounded-full text-xs bg-red-100 text-red-800">Rejected</span>';
    
    const flaggedBadge = site.flagged 
        ? '<span class="px-2 py-1 rounded text-xs bg-red-100 text-red-800 ml-2"><i class="fas fa-flag mr-1"></i>Flagged</span>'
        : '';
    
    return `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <div class="font-semibold text-gray-800 mb-1">${escapeHtml(site.title)}</div>
                <a href="${escapeHtml(site.url)}" target="_blank" rel="noopener" 
                    class="text-sm text-purple-600 hover:text-purple-800 break-all">
                    ${escapeHtml(site.url)}
                </a>
                <div class="text-xs text-gray-500 mt-1">${escapeHtml(site.description.substring(0, 100))}...</div>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    ${escapeHtml(site.category)}
                </span>
            </td>
            <td class="px-6 py-4">
                ${statusBadge}
                ${flaggedBadge}
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
                ${submittedDate}<br>
                <span class="text-xs">by ${site.submittedBy || 'user'}</span>
            </td>
            <td class="px-6 py-4">
                <button onclick="deleteWebsite('${site.id}')" 
                    class="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition">
                    <i class="fas fa-trash mr-1"></i>Delete
                </button>
            </td>
        </tr>
    `;
}

/**
 * Apply admin filters
 */
function applyAdminFilters() {
    const searchTerm = document.getElementById('adminSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('adminCategoryFilter').value;
    const statusFilter = document.getElementById('adminStatusFilter').value;
    
    filteredWebsitesAdmin = allWebsitesAdmin.filter(site => {
        const matchesSearch = !searchTerm || 
            site.title.toLowerCase().includes(searchTerm) ||
            site.description.toLowerCase().includes(searchTerm) ||
            site.url.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !categoryFilter || site.category === categoryFilter;
        
        let matchesStatus = true;
        if (statusFilter === 'published') {
            matchesStatus = site.status === 'published';
        } else if (statusFilter === 'flagged') {
            matchesStatus = site.flagged === true;
        }
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    currentPageAdmin = 1;
    displayAdminWebsites();
}

/**
 * Handle admin website submission
 */
async function handleAdminSubmit(event) {
    event.preventDefault();
    
    const title = document.getElementById('adminTitle').value.trim();
    const url = document.getElementById('adminUrl').value.trim();
    const description = document.getElementById('adminDescription').value.trim();
    const category = document.getElementById('adminCategory').value;
    const tagsInput = document.getElementById('adminTags').value.trim();
    
    if (!title || !url || !description || !category) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Validate URL
    if (!ContentFilter.isValidUrl(url)) {
        alert('Please enter a valid URL');
        return;
    }
    
    // Parse tags
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // Check content (admins can override, but still check)
    const filterResult = ContentFilter.checkContent(title, url, description);
    
    const submissionData = {
        title: ContentFilter.sanitizeInput(title),
        url: url,
        description: ContentFilter.sanitizeInput(description),
        category: category,
        tags: tags,
        status: 'published',
        submittedBy: 'admin',
        submittedAt: new Date().toISOString(),
        flagged: filterResult.isBlocked,
        flagReason: filterResult.isBlocked ? filterResult.reason : ''
    };
    
    try {
        const response = await fetch('tables/websites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        });
        
        if (!response.ok) {
            throw new Error('Submission failed');
        }
        
        alert('Website added successfully!');
        document.getElementById('addWebsiteForm').classList.add('hidden');
        document.getElementById('adminSubmissionForm').reset();
        loadAdminWebsites();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add website. Please try again.');
    }
}

/**
 * Delete website
 */
function deleteWebsite(id) {
    deleteTargetId = id;
    showDeleteModal();
}

/**
 * Confirm delete
 */
async function confirmDelete() {
    if (!deleteTargetId) return;
    
    try {
        const response = await fetch(`tables/websites/${deleteTargetId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Delete failed');
        }
        
        hideDeleteModal();
        loadAdminWebsites();
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete website. Please try again.');
    }
}

/**
 * Show/hide delete modal
 */
function showDeleteModal() {
    document.getElementById('deleteModal').classList.remove('hidden');
}

function hideDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
    deleteTargetId = null;
}

/**
 * Update pagination
 */
function updateAdminPagination() {
    const totalPages = Math.ceil(filteredWebsitesAdmin.length / itemsPerPageAdmin);
    const container = document.getElementById('adminPagination');
    
    if (totalPages <= 1) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    
    let html = '';
    
    html += `
        <button onclick="changeAdminPage(${currentPageAdmin - 1})" 
            ${currentPageAdmin === 1 ? 'disabled' : ''}
            class="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPageAdmin - 2 && i <= currentPageAdmin + 2)) {
            html += `
                <button onclick="changeAdminPage(${i})" 
                    class="px-4 py-2 border rounded-lg ${i === currentPageAdmin ? 'bg-purple-600 text-white' : 'hover:bg-gray-50'}">
                    ${i}
                </button>
            `;
        } else if (i === currentPageAdmin - 3 || i === currentPageAdmin + 3) {
            html += `<span class="px-2">...</span>`;
        }
    }
    
    html += `
        <button onclick="changeAdminPage(${currentPageAdmin + 1})" 
            ${currentPageAdmin === totalPages ? 'disabled' : ''}
            class="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    container.innerHTML = html;
}

/**
 * Change admin page
 */
function changeAdminPage(page) {
    const totalPages = Math.ceil(filteredWebsitesAdmin.length / itemsPerPageAdmin);
    if (page < 1 || page > totalPages) return;
    
    currentPageAdmin = page;
    displayAdminWebsites();
}

/**
 * Show/hide table loading
 */
function showTableLoading(show) {
    const loading = document.getElementById('tableLoading');
    const tbody = document.getElementById('websitesTableBody');
    
    if (show) {
        loading.classList.remove('hidden');
        tbody.innerHTML = '';
    } else {
        loading.classList.add('hidden');
    }
}

/**
 * Show/hide table empty state
 */
function showTableEmpty(show) {
    const empty = document.getElementById('tableEmpty');
    const tbody = document.getElementById('websitesTableBody');
    
    if (show) {
        empty.classList.remove('hidden');
        tbody.innerHTML = '';
    } else {
        empty.classList.add('hidden');
    }
}

/**
 * Utility functions
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounceAdmin(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
