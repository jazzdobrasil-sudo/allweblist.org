/**
 * Content Filter System
 * Detects prohibited content (adult, gambling, illegal) without external APIs
 * Uses keyword matching and pattern detection
 */

const ContentFilter = {
    // Prohibited keywords for adult content
    adultKeywords: [
        'porn', 'xxx', 'sex', 'adult', 'escort', 'nude', 'naked', 'erotic',
        'webcam', 'camgirl', 'milf', 'nsfw', 'hentai', 'fetish', 'hookup',
        'dating', 'singles', 'meet women', 'meet men', 'chat live', 'live cam',
        'strip', 'stripper', 'massage', 'sensual', 'intimate'
    ],

    // Prohibited keywords for gambling
    gamblingKeywords: [
        'casino', 'poker', 'blackjack', 'roulette', 'slots', 'betting',
        'bet', 'gamble', 'gambling', 'jackpot', 'lottery', 'lotto',
        'bingo', 'wagering', 'bookmaker', 'sportsbook', 'odds',
        'horse racing', 'greyhound', 'sports betting', 'online casino',
        'live dealer', 'slot machine', 'vegas', 'monte carlo'
    ],

    // Prohibited keywords for illegal content
    illegalKeywords: [
        'drugs', 'cocaine', 'heroin', 'meth', 'weed sale', 'marijuana sale',
        'hack', 'cracked', 'pirated', 'torrent', 'illegal download',
        'counterfeit', 'fake id', 'weapons', 'guns for sale',
        'steroids', 'pharmacy online', 'pills online'
    ],

    // Suspicious URL patterns
    suspiciousPatterns: [
        /xxx/i,
        /adult/i,
        /porn/i,
        /casino/i,
        /bet365/i,
        /poker/i,
        /slots/i,
        /18\+/i,
        /age\-verification/i
    ],

    /**
     * Check if content contains prohibited material
     * @param {string} title - Website title
     * @param {string} url - Website URL
     * @param {string} description - Website description
     * @returns {Object} - {isBlocked: boolean, reason: string}
     */
    checkContent(title, url, description) {
        const combinedText = `${title} ${url} ${description}`.toLowerCase();
        
        // Check adult content
        for (const keyword of this.adultKeywords) {
            if (combinedText.includes(keyword.toLowerCase())) {
                return {
                    isBlocked: true,
                    reason: `Adult content detected: Contains prohibited keyword "${keyword}"`
                };
            }
        }

        // Check gambling content
        for (const keyword of this.gamblingKeywords) {
            if (combinedText.includes(keyword.toLowerCase())) {
                return {
                    isBlocked: true,
                    reason: `Gambling content detected: Contains prohibited keyword "${keyword}"`
                };
            }
        }

        // Check illegal content
        for (const keyword of this.illegalKeywords) {
            if (combinedText.includes(keyword.toLowerCase())) {
                return {
                    isBlocked: true,
                    reason: `Illegal content detected: Contains prohibited keyword "${keyword}"`
                };
            }
        }

        // Check URL patterns
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(url)) {
                return {
                    isBlocked: true,
                    reason: `Suspicious URL pattern detected: URL contains prohibited pattern`
                };
            }
        }

        // Additional domain checks
        const urlLower = url.toLowerCase();
        if (urlLower.includes('.xxx') || urlLower.includes('.adult') || 
            urlLower.includes('.sex') || urlLower.includes('.porn')) {
            return {
                isBlocked: true,
                reason: 'Prohibited domain extension detected'
            };
        }

        // Check for excessive special characters (common in spam/adult sites)
        const specialCharCount = (url.match(/[\$\@\!\#\%\^\&\*]/g) || []).length;
        if (specialCharCount > 3) {
            return {
                isBlocked: true,
                reason: 'Suspicious URL format detected'
            };
        }

        return {
            isBlocked: false,
            reason: null
        };
    },

    /**
     * Validate URL format
     * @param {string} url - Website URL
     * @returns {boolean}
     */
    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch (e) {
            return false;
        }
    },

    /**
     * Sanitize text input
     * @param {string} text - Input text
     * @returns {string} - Sanitized text
     */
    sanitizeInput(text) {
        if (!text) return '';
        
        // Remove HTML tags
        const div = document.createElement('div');
        div.textContent = text;
        let sanitized = div.innerHTML;
        
        // Remove excessive whitespace
        sanitized = sanitized.replace(/\s+/g, ' ').trim();
        
        return sanitized;
    },

    /**
     * Check if text is appropriate (no excessive caps, spam patterns)
     * @param {string} text - Input text
     * @returns {Object} - {isValid: boolean, reason: string}
     */
    checkTextQuality(text) {
        if (!text || text.trim().length < 10) {
            return {
                isValid: false,
                reason: 'Text is too short (minimum 10 characters)'
            };
        }

        // Check for excessive capitals
        const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
        if (upperCaseRatio > 0.7 && text.length > 20) {
            return {
                isValid: false,
                reason: 'Excessive use of capital letters detected'
            };
        }

        // Check for excessive punctuation
        const punctuationCount = (text.match(/[!?]{3,}/g) || []).length;
        if (punctuationCount > 0) {
            return {
                isValid: false,
                reason: 'Excessive punctuation detected'
            };
        }

        // Check for spam patterns
        const spamPatterns = [
            /click here now/i,
            /limited time offer/i,
            /act now/i,
            /free money/i,
            /make money fast/i,
            /work from home/i,
            /earn \$\d+/i
        ];

        for (const pattern of spamPatterns) {
            if (pattern.test(text)) {
                return {
                    isValid: false,
                    reason: 'Spam-like content detected'
                };
            }
        }

        return {
            isValid: true,
            reason: null
        };
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentFilter;
}
