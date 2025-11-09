/**
 * Supabase Main JavaScript for AllWebList.org Directory
 * Handles website listing, search, filtering, and pagination
 */

let allWebsites = [];
let filteredWebsites = [];
let currentPage = 1;
const itemsPerPage = 12;

// Category colors for badges
const categoryColors = {
    'Business': 'bg-blue-100 text-blue-800',
    'Technology': 'bg-purple-100 text-purple-800',
    'Education': 'bg-green-100 text-green-800',
    'Entertainment': 'bg-pink-100 text-pink-800',
    'Health': 'bg-red-100 text-red-800',
    'Sports': 'bg-orange-100 text-orange-800',
    'News': 'bg-gray-100 text-gray-800',
    'Travel': 'bg-cyan-100 text-cyan-800',
    'Food': 'bg-yellow-100 text-yellow-800',
    'Fashion': 'bg-pink-100 text-pink-800',
    'Finance': 'bg-green-100 text-green-800',
    'Real Estate': 'bg-indigo-100 text-indigo-800',
    'Automotive': 'bg-gray-100 text-gray-800',
    'Shopping': 'bg-purple-100 text-purple-800',
    'Social Media': 'bg-blue-100 text-blue-800',
    'Art & Design': 'bg-pink-100 text-pink-800',
    'Music': 'bg-purple-100 text-purple-800',
    'Gaming': 'bg-red-100 text-red-800',
    'Science': 'bg-teal-100 text-teal-800',
    'Other': 'bg-gray-100 text-gray-800'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadWebsites();
    setupEventListeners();
    createCategoryBadges();
});

/**
 * Load all published websites from Supabase
 */
async function loadWebsites() {
    try {
        showLoading(true);
        
        // Fetch all published websites from Supabase
        const { data, error } = await window.supabaseClient
            .from('websites')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        allWebsites = data || [];
        filteredWebsites = [...allWebsites];
        
        // Update total count
        document.getElementById('totalWebsites').textContent = allWebsites.length;
        
        showLoading(false);
        applyFilters();
        
    } catch (error) {
        console.error('Error loading websites:', error);
        showLoading(false);
        showEmptyState(true);
    }
}

/**
 * Display websites with pagination
 */
function displayWebsites() {
    const container = document.getElementById('websitesContainer');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const websitesToShow = filteredWebsites.slice(startIndex, endIndex);
    
    // Update result count
    document.getElementById('resultCount').textContent = filteredWebsites.length;
    
    // Check if empty
    if (filteredWebsites.length === 0) {
        showEmptyState(true);
        return;
    }
    
    showEmptyState(false);
    
    // Generate HTML for website cards
    container.innerHTML = websitesToShow.map(site => createWebsiteCard(site)).join('');
    
    // Update pagination
    updatePagination();
}

/**
 * Create HTML for a website card
 */
function createWebsiteCard(site) {
    const categoryColor = categoryColors[site.category] || 'bg-gray-100 text-gray-800';
    const tags = site.tags && Array.isArray(site.tags) ? site.tags : [];
    const submittedDate = new Date(site.submitted_at || site.created_at).toLocaleDateString();
    
    return `
        <div class="bg-white rounded-lg shadow-md p-6 card-hover">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-800 mb-2 line-clamp-2">${escapeHtml(site.title)}</h3>
                    <a href="${escapeHtml(site.url)}" target="_blank" rel="nofollow noopener" 
                        class="text-purple-600 hover:text-purple-800 text-sm break-all">
                        <i class="fas fa-external-link-alt mr-1"></i>${escapeHtml(site.url)}
                    </a>
                </div>
            </div>
            
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">${escapeHtml(site.description)}</p>
            
            <div class="flex flex-wrap gap-2 mb-4">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${categoryColor}">
                    ${escapeHtml(site.category)}
                </span>
                ${tags.slice(0, 3).map(tag => `
                    <span class="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        ${escapeHtml(tag)}
                    </span>
                `).join('')}
            </div>
            
            <div class="flex justify-between items-center text-xs text-gray-500 pt-4 border-t">
                <span>
                    <i class="fas fa-calendar mr-1"></i>Added ${submittedDate}
                </span>
                <span>
                    <i class="fas fa-user mr-1"></i>${site.submitted_by === 'admin' ? 'Admin' : 'User'}
                </span>
            </div>
        </div>
    `;
}

/**
 * Apply search and category filters
 */
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    filteredWebsites = allWebsites.filter(site => {
        // Search filter
        const matchesSearch = !searchTerm || 
            site.title.toLowerCase().includes(searchTerm) ||
            site.description.toLowerCase().includes(searchTerm) ||
            site.url.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = !categoryFilter || site.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    currentPage = 1;
    displayWebsites();
}

/**
 * Update pagination controls
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredWebsites.length / itemsPerPage);
    const container = document.getElementById('paginationContainer');
    
    if (totalPages <= 1) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button onclick="changePage(${currentPage - 1})" 
            ${currentPage === 1 ? 'disabled' : ''}
            class="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button onclick="changePage(${i})" 
                    class="px-4 py-2 border rounded-lg hover:bg-gray-50 ${i === currentPage ? 'bg-purple-600 text-white' : ''}">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span class="px-2">...</span>`;
        }
    }
    
    // Next button
    paginationHTML += `
        <button onclick="changePage(${currentPage + 1})" 
            ${currentPage === totalPages ? 'disabled' : ''}
            class="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    container.innerHTML = paginationHTML;
}

/**
 * Change page
 */
function changePage(page) {
    const totalPages = Math.ceil(filteredWebsites.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayWebsites();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Create category filter badges
 */
function createCategoryBadges() {
    const container = document.getElementById('categoryBadges');
    const categories = Object.keys(categoryColors);
    
    container.innerHTML = categories.map(category => {
        const colorClass = categoryColors[category];
        return `
            <button onclick="filterByCategory('${category}')" 
                class="px-4 py-2 rounded-full text-sm font-semibold ${colorClass} category-badge">
                ${category}
            </button>
        `;
    }).join('');
}

/**
 * Filter by category from badge click
 */
function filterByCategory(category) {
    document.getElementById('categoryFilter').value = category;
    applyFilters();
    window.scrollTo({ top: 300, behavior: 'smooth' });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
    
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    
    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        applyFilters();
    });
}

/**
 * Show/hide loading spinner
 */
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const container = document.getElementById('websitesContainer');
    
    if (show) {
        spinner.classList.remove('hidden');
        container.innerHTML = '';
    } else {
        spinner.classList.add('hidden');
    }
}

/**
 * Show/hide empty state
 */
function showEmptyState(show) {
    const emptyState = document.getElementById('emptyState');
    const container = document.getElementById('websitesContainer');
    const pagination = document.getElementById('paginationContainer');
    
    if (show) {
        emptyState.classList.remove('hidden');
        container.innerHTML = '';
        pagination.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Debounce function
 */
function debounce(func, wait) {
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
