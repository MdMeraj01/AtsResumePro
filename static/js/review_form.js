let footerReviewSubmitting = false;

function openReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (!modal) return;
    resetReviewForm();
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('reviewCommentInput')?.focus();
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

function setReviewRating(value) {
    const rating = Math.min(5, Math.max(1, Number(value) || 5));
    const input = document.getElementById('reviewRatingInput');
    if (input) input.value = String(rating);
    document.querySelectorAll('#starContainer [data-val]').forEach(star => {
        const active = Number(star.dataset.val) <= rating;
        star.style.color = active ? '#fbbf24' : '#475569';
        star.setAttribute('aria-pressed', String(Number(star.dataset.val) === rating));
    });
}

function showReviewStatus(message, isError) {
    const textarea = document.getElementById('reviewCommentInput');
    if (!textarea) return;
    let status = document.getElementById('reviewStatus');
    if (!status) {
        status = document.createElement('p');
        status.id = 'reviewStatus';
        textarea.insertAdjacentElement('afterend', status);
    }
    status.textContent = message || '';
    status.style.color = isError ? '#f87171' : '#4ade80';
}

function resetReviewForm() {
    footerReviewSubmitting = false;
    setReviewRating(5);
    const comment = document.getElementById('reviewCommentInput');
    if (comment) comment.value = '';
    showReviewStatus('', false);
    const button = document.getElementById('btnSubmitReview');
    if (button) {
        button.disabled = false;
        button.textContent = 'Submit Review';
    }
}

async function submitReviewAction() {
    if (footerReviewSubmitting) return;
    const commentInput = document.getElementById('reviewCommentInput');
    const submitButton = document.getElementById('btnSubmitReview');
    const comment = (commentInput?.value || '').trim();
    const rating = Number(document.getElementById('reviewRatingInput')?.value) || 5;

    if (!comment) {
        showReviewStatus('Please write a short review first.', true);
        commentInput?.focus();
        return;
    }

    footerReviewSubmitting = true;
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
    }
    showReviewStatus('', false);

    try {
        const response = await fetch('/api/reviews/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ rating, comment })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
            showReviewStatus(response.status === 401 ? 'Please log in to submit your review.' : (data.message || 'Could not submit review. Please try again.'), true);
            footerReviewSubmitting = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Review';
            }
            return;
        }

        showReviewStatus(data.message || 'Thank you for your review!', false);
        if (submitButton) submitButton.textContent = 'Submitted';
        window.setTimeout(() => {
            closeReviewModal();
            resetReviewForm();
        }, 1800);
    } catch (error) {
        showReviewStatus('Network error. Please check your connection and try again.', true);
        footerReviewSubmitting = false;
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Review';
        }
    }
}

window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.setReviewRating = setReviewRating;
window.resetReviewForm = resetReviewForm;
window.submitReviewAction = submitReviewAction;

document.addEventListener('DOMContentLoaded', () => {
    const stars = document.getElementById('starContainer');
    if (stars && stars.dataset.bound !== '1') {
        stars.dataset.bound = '1';
        stars.addEventListener('click', event => {
            const star = event.target.closest('[data-val]');
            if (star) setReviewRating(star.dataset.val);
        });
    }
    setReviewRating(5);
    document.getElementById('reviewModal')?.addEventListener('click', event => {
        if (event.target.id === 'reviewModal') closeReviewModal();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeReviewModal();
    });
});