/**
 * CSV Import Tool for AllWebList.org
 * Handles CSV parsing, validation, and bulk website imports
 */

let csvData = [];
let validRows = [];
let invalidRows = [];
let duplicateUrls = new Set();

/**
 * Initialize CSV import functionality
 */
function initCsvImport() {
    // File input handler
    document.getElementById('csvFileInput').addEventListener('change', handleFileSelect);
    
    // Download template button
    document.getElementById('downloadTemplate').addEventListener('click', downloadCsvTemplate);
    
    // Import button
    document.getElementById('startImport').addEventListener('click', startBulkImport);
}

/**
 * Generate and download CSV template
 */
function downloadCsvTemplate() {
    const template = `title,url,description,category,tags
"Example Website Title","https://example.com","A comprehensive description of the example website that showcases what it offers.","Technology","web,development,tools"
"Sample Business Site","https://sample-business.com","Professional business services and solutions for enterprises.","Business","consulting,services"
"Educational Portal","https://edu-portal.org","Free educational resources and learning materials for students.","Education","learning,courses,free"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'allweblist_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Handle CSV file selection
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB. Please use smaller batches.');
        return;
    }
    
    // Read file
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        parseAndValidateCsv(text);
    };
    reader.onerror = function() {
        alert('Error reading file. Please try again.');
    };
    reader.readAsText(file);
}

/**
 * Parse CSV text and validate data
 */
function parseAndValidateCsv(csvText) {
    try {
        // Parse CSV
        const rows = parseCsv(csvText);
        
        if (rows.length === 0) {
            alert('CSV file is empty');
            return;
        }
        
        // NEW CODE:
// Validate headers - trim and lowercase for comparison
const headers = rows[0].map(h => h.trim().toLowerCase());
const requiredHeaders = ['title', 'url', 'description', 'category'];
const missingHeaders = requiredHeaders.filter(h => !headers.includes(h.toLowerCase()));

console.log('CSV Headers detected:', headers);
console.log('Required headers:', requiredHeaders);

if (missingHeaders.length > 0) {
    alert(`Missing required columns: ${missingHeaders.join(', ')}\n\nDetected headers: ${headers.join(', ')}`);
    return;
}

        
        // Get header indices
        const titleIdx = headers.indexOf('title');
        const urlIdx = headers.indexOf('url');
        const descIdx = headers.indexOf('description');
        const categoryIdx = headers.indexOf('category');
        const tagsIdx = headers.indexOf('tags');
        
        // Process data rows
        csvData = [];
        validRows = [];
        invalidRows = [];
        duplicateUrls = new Set();
        const seenUrls = new Set();
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            
            // Skip empty rows
            if (row.every(cell => !cell || cell.trim() === '')) {
                continue;
            }
            
            const website = {
                rowNumber: i + 1,
                title: row[titleIdx] ? row[titleIdx].trim() : '',
                url: row[urlIdx] ? row[urlIdx].trim() : '',
                description: row[descIdx] ? row[descIdx].trim() : '',
                category: row[categoryIdx] ? row[categoryIdx].trim() : '',
                tags: tagsIdx >= 0 && row[tagsIdx] ? row[tagsIdx].split(',').map(t => t.trim()).filter(t => t) : [],
                errors: []
            };
            
            // Validate each field
            validateWebsiteData(website);
            
            // Check for duplicate URLs
            if (seenUrls.has(website.url.toLowerCase())) {
                website.errors.push('Duplicate URL in CSV');
                duplicateUrls.add(website.url);
            } else {
                seenUrls.add(website.url.toLowerCase());
            }
            
            csvData.push(website);
            
            if (website.errors.length === 0) {
                validRows.push(website);
            } else {
                invalidRows.push(website);
            }
        }
        
        // Display preview
        displayCsvPreview();
        
    } catch (error) {
        console.error('CSV parsing error:', error);
        alert('Error parsing CSV file. Please check the format and try again.');
    }
}

/**
 * Simple CSV parser (handles quoted fields)
 */
function parseCsv(text) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            currentRow.push(currentField);
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            // End of row
            if (char === '\r' && nextChar === '\n') {
                i++; // Skip \r\n
            }
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            }
        } else {
            currentField += char;
        }
    }
    
    // Add last field and row
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }
    
    return rows;
}

/**
 * Validate website data
 */
function validateWebsiteData(website) {
    // Title validation
    if (!website.title || website.title.length < 3) {
        website.errors.push('Title too short (min 3 characters)');
    } else if (website.title.length > 100) {
        website.errors.push('Title too long (max 100 characters)');
    }
    
    // URL validation
    if (!website.url) {
        website.errors.push('URL is required');
    } else if (!ContentFilter.isValidUrl(website.url)) {
        website.errors.push('Invalid URL format');
    }
    
    // Description validation
    if (!website.description || website.description.length < 10) {
        website.errors.push('Description too short (min 10 characters)');
    } else if (website.description.length > 500) {
        website.errors.push('Description too long (max 500 characters)');
    }
    
    // Category validation
    const validCategories = [
        'Business', 'Technology', 'Education', 'Entertainment', 'Health',
        'Sports', 'News', 'Travel', 'Food', 'Fashion', 'Finance',
        'Real Estate', 'Automotive', 'Shopping', 'Social Media',
        'Art & Design', 'Music', 'Gaming', 'Science', 'Other'
    ];
    
    if (!website.category || !validCategories.includes(website.category)) {
        website.errors.push('Invalid category');
    }
    
    // Content filtering
    if (website.errors.length === 0) {
        const filterResult = ContentFilter.checkContent(
            website.title,
            website.url,
            website.description
        );
        
        if (filterResult.isBlocked) {
            website.errors.push(`Content filter: ${filterResult.reason}`);
            website.flagged = true;
        }
    }
}

/**
 * Display CSV preview
 */
function displayCsvPreview() {
    const previewSection = document.getElementById('csvPreview');
    const previewBody = document.getElementById('csvPreviewBody');
    const errorList = document.getElementById('errorList');
    const errorListItems = document.getElementById('errorListItems');
    
    // Show preview section
    previewSection.classList.remove('hidden');
    
    // Display first 5 rows
    const previewRows = csvData.slice(0, 5);
    previewBody.innerHTML = previewRows.map(website => {
        const statusClass = website.errors.length > 0 ? 'text-red-600' : 'text-green-600';
        const statusIcon = website.errors.length > 0 ? 'fa-times-circle' : 'fa-check-circle';
        const statusText = website.errors.length > 0 ? 'Invalid' : 'Valid';
        
        return `
            <tr class="border-t">
                <td class="px-4 py-2">${escapeHtml(website.title.substring(0, 40))}...</td>
                <td class="px-4 py-2 text-xs break-all">${escapeHtml(website.url.substring(0, 40))}...</td>
                <td class="px-4 py-2">${escapeHtml(website.category)}</td>
                <td class="px-4 py-2">
                    <span class="${statusClass}">
                        <i class="fas ${statusIcon} mr-1"></i>${statusText}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update statistics
    document.getElementById('totalRows').textContent = csvData.length;
    document.getElementById('validRows').textContent = validRows.length;
    document.getElementById('invalidRows').textContent = invalidRows.length;
    document.getElementById('duplicateRows').textContent = duplicateUrls.size;
    
    // Show errors if any
    if (invalidRows.length > 0) {
        errorList.classList.remove('hidden');
        const errorMessages = invalidRows.slice(0, 20).map(website => {
            return `<li>Row ${website.rowNumber}: ${website.errors.join(', ')}</li>`;
        });
        
        if (invalidRows.length > 20) {
            errorMessages.push(`<li><strong>...and ${invalidRows.length - 20} more errors</strong></li>`);
        }
        
        errorListItems.innerHTML = errorMessages.join('');
    } else {
        errorList.classList.add('hidden');
    }
    
    // Enable import button if there are valid rows
    const startBtn = document.getElementById('startImport');
    if (validRows.length > 0) {
        startBtn.disabled = false;
    } else {
        startBtn.disabled = true;
    }
}

/**
 * Start bulk import
 */
async function startBulkImport() {
    if (validRows.length === 0) {
        alert('No valid rows to import');
        return;
    }
    
    if (!confirm(`Import ${validRows.length} websites?\n\nThis may take a few minutes for large datasets.`)) {
        return;
    }
    
    // Disable buttons
    document.getElementById('startImport').disabled = true;
    document.getElementById('cancelImport').disabled = true;
    document.getElementById('csvFileInput').disabled = true;
    
    // Show progress
    const progressSection = document.getElementById('importProgress');
    progressSection.classList.remove('hidden');
    
    const progressBar = document.getElementById('progressBar');
    const importedCountSpan = document.getElementById('importedCount');
    const totalImportCountSpan = document.getElementById('totalImportCount');
    
    totalImportCountSpan.textContent = validRows.length;
    
    let successCount = 0;
    let failCount = 0;
    
    // Import in batches to avoid overwhelming the API
    const batchSize = 10;
    const totalBatches = Math.ceil(validRows.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, validRows.length);
        const batch = validRows.slice(start, end);
        
        // Import batch concurrently
        const promises = batch.map(website => importSingleWebsite(website));
        const results = await Promise.allSettled(promises);
        
        // Count successes and failures
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                successCount++;
            } else {
                failCount++;
            }
        });
        
        // Update progress
        const progress = Math.round(((batchIndex + 1) / totalBatches) * 100);
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${progress}%`;
        importedCountSpan.textContent = successCount + failCount;
        
        // Small delay between batches to avoid rate limiting
        if (batchIndex < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    // Show success message
    const successSection = document.getElementById('importSuccess');
    successSection.classList.remove('hidden');
    document.getElementById('successCount').textContent = successCount;
    
    if (failCount > 0) {
        alert(`Import completed with ${failCount} failures. Check browser console for details.`);
    }
    
    // Re-enable buttons
    document.getElementById('cancelImport').disabled = false;
    document.getElementById('csvFileInput').disabled = false;
    
    // Refresh the main list
    if (typeof loadAdminWebsites === 'function') {
        setTimeout(() => loadAdminWebsites(), 1000);
    }
}

/**
 * Import single website
 */
async function importSingleWebsite(website) {
    const submissionData = {
        title: ContentFilter.sanitizeInput(website.title),
        url: website.url,
        description: ContentFilter.sanitizeInput(website.description),
        category: website.category,
        tags: website.tags,
        status: 'published',
        submittedBy: 'admin',
        submittedAt: new Date().toISOString(),
        flagged: website.flagged || false,
        flagReason: website.flagged ? 'CSV Import - Content filter triggered' : ''
    };
    
    const response = await fetch('tables/websites', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to import: ${website.title}`);
    }
    
    return await response.json();
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCsvImport);
} else {
    initCsvImport();
}
