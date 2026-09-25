// File: static/js/activity_tracker.js

// static/js/activity_tracker.js - CLEAN VERSION
document.addEventListener('DOMContentLoaded', () => {
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