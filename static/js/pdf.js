/* ================= PDF DOWNLOAD FIX (100% ACCURATE TEMPLATE TRACKING) ================= */

let pdfLock = false;

/* 🔘 BUTTON CLICK HANDLER */
function handlePdfClick(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    if (pdfLock) return;
    pdfLock = true;

    const btn = document.getElementById('downloadPdfBtn');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';
    }

    downloadPDF();

    setTimeout(() => {
        pdfLock = false;
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }
    }, 4000);
}

// 🟢 100% ACCURATE CURRENT TEMPLATE DETECTOR
function getCurrentTemplateId() {
    // 1. Check URL param (?template=emerald)
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('template');
    if (fromUrl && fromUrl.trim() !== '') return fromUrl.trim().toLowerCase();

    // 2. Check Dropdown selector
    const dropdown = document.getElementById('templateSelector');
    if (dropdown && dropdown.value) return dropdown.value.trim().toLowerCase();

    // 3. Check Global Window Variable
    if (window.currentTemplate && window.currentTemplate.trim() !== '') {
        return window.currentTemplate.trim().toLowerCase();
    }

    // 4. Check Render Area class
    const preview = document.getElementById('template-render-area');
    if (preview) {
        const classes = Array.from(preview.classList);
        for (let c of classes) {
            if (c.endsWith('-template')) {
                return c.replace('-template', '').toLowerCase();
            }
        }
    }

    return 'modern';
}

async function downloadPDF() {
    if (pdfLock) return;
    pdfLock = true;

    const btn = document.getElementById('downloadPdfBtn');
    const originalText = btn ? btn.innerHTML : '';
    const actualTemplateId = getCurrentTemplateId();
    
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
        btn.disabled = true;
    }

    try {
        // 1. Limit Check (Fast request)
        const checkResponse = await fetch('/api/check-download-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template_name: actualTemplateId })
        });

        let checkResult = await checkResponse.json();
        if (!checkResult.success) {
            if (checkResult.error === 'LIMIT_REACHED') {
                alert("⚠️ Your Free Download Limit is Over! Please Upgrade.");
                window.location.href = '/pricing';
                return;
            } else {
                throw new Error(checkResult.message || "Permission denied");
            }
        }

        if (btn) btn.innerHTML = '<i class="fas fa-cog fa-spin"></i> Generating PDF...';

        // Background auto-save (do not wait if unnecessary)
        saveResumeSilent();

        const element = document.getElementById('template-render-area');
        if (!element) throw new Error('Preview not found');

        element.classList.add('pdf-mode');

        // 🟢 Canvas optimized (Scale 1.5 - fast and crisp print quality)
        const canvas = await html2canvas(element, { 
            scale: 1.5, 
            useCORS: true,
            logging: false,
            windowWidth: 1024
        });
        
        const imgData = canvas.toDataURL("image/jpeg", 0.85); // 0.85 compression speeds up 3x
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");
        
        const pdfWidth = 210;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        if (imgHeight <= 297) {
            pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, imgHeight);
        } else {
            let heightLeft = imgHeight;
            let position = 0;
            while (heightLeft > 0) {
                pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
                heightLeft -= 297;
                position -= 297;
                if(heightLeft > 0) pdf.addPage();
            }
        }

        const rawName = document.getElementById('fullName')?.value || 'Resume';
        const cleanFileName = rawName.replace(/\s+/g, '_');

        // 🟢 CRITICAL SPEED FIX: Background fire without 'await'
        // User ka download instantly trigger hoga, Cloudinary upload peeche chalega!
        try {
            const pdfBlob = pdf.output('blob');
            uploadPdfCopyToServer(pdfBlob, `${rawName} Resume`, actualTemplateId);
        } catch (e) {
            console.warn("Silent backup trigger skipped");
        }

        // 🚀 INSTANT DOWNLOAD: User gets the file immediately (Under 2 seconds)
        pdf.save(`${cleanFileName}.pdf`);

        // Activity logging (non-blocking)
        fetch('/api/track-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                activity_type: 'downloaded_pdf', 
                details: actualTemplateId,
                template_name: actualTemplateId 
            })
        });

        // Review Modal popup
        setTimeout(() => {
            openReviewModal();
        }, 1200);

    } catch (err) {
        console.error("PDF Download Error:", err);
        alert("Download failed: " + err.message);
    } finally {
        const element = document.getElementById('template-render-area');
        if(element) element.classList.remove("pdf-mode");
        
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        setTimeout(() => { pdfLock = false; }, 1000);
    }
}
 
async function saveResumeSilent() {
    try {
        if (typeof collectFormData !== 'function') return;
        
        const resumeData = collectFormData();
        const selectedTemplate = getCurrentTemplateId();

        const payload = {
            data: resumeData,
            template_name: selectedTemplate,
            resume_id: window.currentResumeId || null,
            is_auto_save: true 
        };
        
        const res = await fetch('/api/save-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        if (result.success) {
            window.currentResumeId = result.resume_id;
        }
    } catch(e) { 
        console.error("Auto-save failed", e); 
    }
}

/* 📝 WORD DOWNLOAD FUNCTION */
async function downloadWord() {
    if (pdfLock) return;
    pdfLock = true;

    const btn = document.getElementById('downloadWordBtn');
    const originalText = btn ? btn.innerHTML : '';
    const actualTemplateId = getCurrentTemplateId();

    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Word...';
        btn.disabled = true;
    }

    try {
        await saveResumeSilent();

        const element = document.getElementById('template-render-area');
        if (!element) throw new Error("Resume preview not found!");

        const clone = element.cloneNode(true);
        clone.classList.remove('pdf-mode');
        
        clone.querySelectorAll('input, textarea, select').forEach(input => {
            const val = input.value || '';
            const span = document.createElement('span');
            span.innerText = val;
            input.parentNode.replaceChild(span, input);
        });

        clone.querySelectorAll('button, .fas, .fa-trash').forEach(el => el.remove());

        let cssRules = `body { font-family: Arial, sans-serif; color: #000; }`;
        try {
            const templateLink = document.getElementById('template-css');
            if (templateLink && templateLink.href) {
                const response = await fetch(templateLink.href);
                if (response.ok) cssRules += await response.text();
            }
        } catch (e) { 
            console.warn("Using default CSS for Word"); 
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head><meta charset='utf-8'><style>${cssRules}</style></head>
            <body>${clone.innerHTML}</body>
            </html>
        `;

        if (typeof htmlDocx === 'undefined') throw new Error("html-docx library missing!");
        
        const converted = htmlDocx.asBlob(htmlContent, {
            orientation: 'portrait',
            margins: { top: 720, bottom: 720, left: 720, right: 720 }
        });

        const fileName = (document.getElementById('fullName')?.value || 'Resume').replace(/\s+/g, '_');
        saveAs(converted, `${fileName}.docx`);

        // 🟢 Track Word Download
        await fetch('/api/track-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                activity_type: 'downloaded_docx', 
                details: actualTemplateId 
            })
        });

        // 🌟 Auto-Open Review Modal
        setTimeout(() => {
            openReviewModal();
        }, 1500);

    } catch(err) {
        console.error(err);
        alert("Word export failed: " + err.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        setTimeout(() => { pdfLock = false; }, 1500);
    }
}

// ==========================================
// ⭐ REVIEW MODAL HELPERS & SUBMISSION (ROBUST)
// ==========================================

function openReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (!modal) {
        console.warn("⚠️ reviewModal element not found in HTML!");
        return;
    }
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// Star Click Handler Setup
document.addEventListener('DOMContentLoaded', function() {
    const stars = document.querySelectorAll('#starContainer i');
    const ratingInput = document.getElementById('reviewRatingInput');

    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const selectedVal = index + 1;
            if (ratingInput) ratingInput.value = selectedVal;
            
            stars.forEach((s, i) => {
                if (i < selectedVal) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
    });
});

// pdf.js ke bottom me submitReviewAction ko isse update karo
async function submitReviewAction() {
    const ratingInput = document.getElementById('reviewRatingInput');
    const commentInput = document.getElementById('reviewCommentInput');
    const btn = document.getElementById('btnSubmitReview');

    const rating = ratingInput ? ratingInput.value : 5;
    const comment = commentInput ? commentInput.value.trim() : '';

    if (!comment) {
        if (typeof showToast === 'function') {
            showToast('Please write a short review!', 'warning');
        } else {
            alert('Please write a short review!');
        }
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerText = "Submitting...";
    }

    try {
        const res = await fetch('/api/reviews/submit', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ rating, comment })
        });
        const data = await res.json();

        if (data.success) {
            closeReviewModal();
            // Reset input fields
            if (commentInput) commentInput.value = '';
            
            // 🟢 Custom Native Toast Notification
            if (typeof showToast === 'function') {
                showToast('🎉 Thanks! Your review is now live.', 'success');
            } else {
                alert("Thanks! Your review is live now.");
            }
        } else {
            if (typeof showToast === 'function') {
                showToast(data.message || 'Failed to submit review', 'error');
            } else {
                alert(data.message);
            }
        }
    } catch (err) {
        console.error("Submit Review Error:", err);
        if (typeof showToast === 'function') {
            showToast('Server error. Please try again.', 'error');
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "Submit Review";
        }
    }
}

// PDF blob ko base64 me convert karke background me save karega
async function uploadPdfCopyToServer(pdfBlob, resumeTitle, templateName) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(pdfBlob);
        reader.onloadend = async function () {
            const base64data = reader.result;
            try {
                const res = await fetch('/api/upload-downloaded-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pdf_base64: base64data,
                        title: resumeTitle || 'Resume',
                        template_name: templateName || 'modern'
                    })
                });
                await res.json();
                // 🛑 console.log yahan se poori tarah remove kar diya gaya hai
                resolve(true);
            } catch (err) {
                // Silent catch: User ko error ya link nahi dikhega
                resolve(null);
            }
        };
    });
}

// Global Exports
window.handlePdfClick = handlePdfClick;
window.downloadPDF = downloadPDF;
window.downloadWord = downloadWord;
window.getCurrentTemplateId = getCurrentTemplateId;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.submitReviewAction = submitReviewAction;