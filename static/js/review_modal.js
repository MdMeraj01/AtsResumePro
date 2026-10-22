// Review popup (stars + submit). Loaded by templates/partials/review_modal.html on every page for logged-in users.
// Opened by: the footer "Write a Review" button, and automatically after a resume download (pdf.js).

function openReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (!modal) return;
    resetReviewForm();
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.dataset.opener = document.activeElement && document.activeElement.id ? document.activeElement.id : '';
    const box = document.getElementById('reviewCommentInput');
    if (box) setTimeout(() => box.focus(), 50);
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.style.display = 'none';
}

// Esc closes the popup, and so does a click on the dark area around it
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('reviewModal');
    if (e.key === 'Escape' && modal && modal.style.display === 'flex') closeReviewModal();
});
document.addEventListener('click', (e) => {
    const modal = document.getElementById('reviewModal');
    if (modal && e.target === modal) closeReviewModal();
});

window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;

// ==========================================
// ⭐ REVIEW MODAL: stars + submit  (was missing: button called an undefined function)
// ==========================================
let reviewSubmitting = false;

function paintReviewStars(upTo) {
    document.querySelectorAll('#starContainer [data-val]').forEach(star => {
        const on = parseInt(star.dataset.val, 10) <= upTo;
        star.style.color = on ? '#fbbf24' : '#475569';
    });
}

function setReviewRating(value) {
    const input = document.getElementById('reviewRatingInput');
    if (input) input.value = String(value);
    paintReviewStars(value);
}

function showReviewStatus(text, isError) {
    let box = document.getElementById('reviewStatus');
    if (!box) {
        const textarea = document.getElementById('reviewCommentInput');
        if (!textarea) return;
        box = document.createElement('p');
        box.id = 'reviewStatus';
        box.className = 'text-xs text-center mt-3';
        textarea.insertAdjacentElement('afterend', box);
    }
    box.textContent = text || '';
    box.style.color = isError ? '#f87171' : '#4ade80';
}

function resetReviewForm() {
    reviewSubmitting = false;
    setReviewRating(5);
    const comment = document.getElementById('reviewCommentInput');
    if (comment) { comment.value = ''; comment.maxLength = 1000; }
    showReviewStatus('', false);
    const btn = document.getElementById('btnSubmitReview');
    if (btn) { btn.disabled = false; btn.textContent = 'Submit Review'; }
}

async function submitReviewAction() {
    if (reviewSubmitting) return;

    const ratingEl = document.getElementById('reviewRatingInput');
    const commentEl = document.getElementById('reviewCommentInput');
    const btn = document.getElementById('btnSubmitReview');

    const rating = parseInt(ratingEl && ratingEl.value, 10) || 5;
    const comment = ((commentEl && commentEl.value) || '').trim();

    if (!comment) {
        showReviewStatus('Please write a short feedback first.', true);
        if (commentEl) commentEl.focus();
        return;
    }

    reviewSubmitting = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }
    showReviewStatus('', false);

    try {
        const res = await fetch('/api/reviews/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ rating, comment })
        });
        let data = {};
        try { data = await res.json(); } catch (_) { /* non-JSON error page */ }

        if (res.ok && data.success) {
            showReviewStatus(data.message || 'Thank you for your review!', false);
            if (btn) btn.textContent = 'Submitted ✓';
            setTimeout(() => { closeReviewModal(); resetReviewForm(); }, 1800);
            return;   // stays locked until the modal closes (no double submit)
        }
        if (res.status === 401) {
            showReviewStatus('Please login again to submit your review.', true);
        } else {
            showReviewStatus(data.message || 'Could not submit review. Please try again.', true);
        }
    } catch (err) {
        console.error('Review submit failed:', err);
        showReviewStatus('Network error. Please check your connection and try again.', true);
    }

    reviewSubmitting = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Submit Review'; }
}

function initReviewStars() {
    const box = document.getElementById('starContainer');
    if (!box || box.dataset.bound === '1') return;
    box.dataset.bound = '1';
    const current = () => parseInt((document.getElementById('reviewRatingInput') || {}).value, 10) || 5;
    box.addEventListener('click', (e) => {
        const star = e.target.closest('[data-val]');
        if (star) setReviewRating(parseInt(star.dataset.val, 10));
    });
    box.addEventListener('mouseover', (e) => {
        const star = e.target.closest('[data-val]');
        if (star) paintReviewStars(parseInt(star.dataset.val, 10));
    });
    box.addEventListener('mouseleave', () => paintReviewStars(current()));
    paintReviewStars(current());
}

window.submitReviewAction = submitReviewAction;
window.setReviewRating = setReviewRating;
window.resetReviewForm = resetReviewForm;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initReviewStars);
else initReviewStars();
