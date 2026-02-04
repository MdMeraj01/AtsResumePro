// File: static/js/activity_tracker.js

// static/js/activity_tracker.js - CLEAN VERSION
document.addEventListener('DOMContentLoaded', () => {
    // ✅ ONLY Cover Letter Tracking Here
    const btnCover = document.getElementById('generateCoverLetterBtn');
    if(btnCover) {
        btnCover.addEventListener('click', () => {
            fetch('/api/track-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activity_type: 'cover_letter_created', details: 'AI Generated' })
            });
        });
    }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    
    // ⚠️ IMPORTANT FIX:
    // Resume Save और Download की ट्रैकिंग यहाँ से हटा दी गई है 
    // क्योंकि वो पहले से ही 'pdf.js' और Backend में हो रही है।
    // इससे "Double Counting" बंद हो जाएगी।

    // ✅ SIRF Cover Letter की ट्रैकिंग यहाँ रखें (क्योंकि इसका ऑटोमैटिक लॉग नहीं है)
    const btnCover = document.getElementById('generateCoverLetterBtn');
    if(btnCover) {
        btnCover.addEventListener('click', () => trackUserActivity('cover_letter_created', 'AI Generated'));
    }
});