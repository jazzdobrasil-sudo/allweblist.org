/**
 * Website Submission Form Handler
 * Handles form validation, content filtering, and instant publishing
 */

document.addEventListener('DOMContentLoaded', () => {
    setupFormHandlers();
});

/**
 * Setup form event handlers
 */
function setupFormHandlers() {
    const form = document.getElementById('submissionForm');
    const descriptionField = document.getElementById('description');
    const charCount = document.getElementById('charCount');
    
    // Character counter
    descriptionField.addEventListener('input', () => {
        charCount.textContent = descriptionField.value.length;
    });
    
    // Form submission
    form.addEventListener('submit', handleSubmit);
}

/**
 * Handle form submission
 */
async function handleSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const title = document.getElementById('title').value.trim();
    const url = document.getElementById('url').value.trim();
    const description = document.getElementById('description').value.trim();
    const category = document.getElementById('category').value;
    const tagsInput = document.getElementById('tags').value.trim();
    const agreement = document.getElementById('agreement').checked;
    
    // Hide previous messages
    hideMessages();
    
    // Basic validation
    if (!title || !url || !description || !category || !agreement) {
        showError('Please fill in all required fields and accept the terms.');
        return;
    }
    
    // Validate URL format
    if (!ContentFilter.isValidUrl(url)) {
        showError('Please enter a valid URL starting with http:// or https://');
        return;
    }
    
    // Sanitize inputs
    const sanitizedTitle = ContentFilter.sanitizeInput(title);
    const sanitizedDescription = ContentFilter.sanitizeInput(description);
    
    // Check text quality
    const titleQuality = ContentFilter.checkTextQuality(sanitizedTitle);
    if (!titleQuality.isValid) {
        showError(`Title validation failed: ${titleQuality.reason}`);
        return;
    }
    
    const descriptionQuality = ContentFilter.checkTextQuality(sanitizedDescription);
    if (!descriptionQuality.isValid) {
        showError(`Description validation failed: ${descriptionQuality.reason}`);
        return;
    }
    
    // Content filtering - check for prohibited content
    const filterResult = ContentFilter.checkContent(sanitizedTitle, url, sanitizedDescription);
    
    if (filterResult.isBlocked) {
        showError(`Your submission has been blocked. ${filterResult.reason}\n\nWe do not allow adult content, gambling sites, or illegal material.`);
        return;
    }
    
    // Parse tags
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // Prepare submission data
    const submissionData = {
        title: sanitizedTitle,
        url: url,
        description: sanitizedDescription,
        category: category,
        tags: tags,
        status: 'published', // Instant publishing
        submittedBy: 'user',
        submittedAt: new Date().toISOString(),
        flagged: false,
        flagReason: ''
    };
    
    // Disable submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
    
    try {
        // Submit to database
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
        
        const result = await response.json();
        
        // Show success message
        showSuccess();
        
        // Reset form
        document.getElementById('submissionForm').reset();
        document.getElementById('charCount').textContent = '0';
        
    } catch (error) {
        console.error('Submission error:', error);
        showError('An error occurred while submitting your website. Please try again.');
        
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Submit Website';
    }
}

/**
 * Show success message
 */
function showSuccess() {
    const successMsg = document.getElementById('successMessage');
    successMsg.classList.remove('hidden');
    successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Show error message
 */
function showError(message) {
    const errorMsg = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorMsg.classList.remove('hidden');
    errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Hide all messages
 */
function hideMessages() {
    document.getElementById('successMessage').classList.add('hidden');
    document.getElementById('errorMessage').classList.add('hidden');
}
