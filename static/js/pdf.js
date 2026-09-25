/* ================= PDF DOWNLOAD ENGINE (WITH 0 TO 100% PROGRESS LOADER) ================= */

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
    const dropdown = document.getElementById('templateSelector');
    if (dropdown && dropdown.value && dropdown.value.trim() !== '') {
        return dropdown.value.trim().toLowerCase();
    }

    const preview = document.getElementById('template-render-area');
    if (preview) {
        if (preview.dataset.template && preview.dataset.template.trim() !== '') {
            return preview.dataset.template.trim().toLowerCase();
        }
        const classes = Array.from(preview.classList);
        for (let c of classes) {
            if (c.endsWith('-template')) {
                return c.replace('-template', '').toLowerCase();
            }
        }
    }

    if (window.currentTemplate && typeof window.currentTemplate === 'string' && window.currentTemplate.trim() !== '') {
        return window.currentTemplate.trim().toLowerCase();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('template');
    if (fromUrl && fromUrl.trim() !== '') {
        return fromUrl.trim().toLowerCase();
    }

    return 'modern';
}

// ==========================================
// 🚀 DYNAMIC 0 TO 100% LOADER SYSTEM
// ==========================================
let progressTimer = null;

function showDownloadLoader() {
    let loader = document.getElementById('ats-pdf-loader-modal');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'ats-pdf-loader-modal';
        loader.style.position = 'fixed';
        loader.style.inset = '0';
        loader.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
        loader.style.backdropFilter = 'blur(6px)';
        loader.style.display = 'flex';
        loader.style.alignItems = 'center';
        loader.style.justifyContent = 'center';
        loader.style.zIndex = '99999';
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.25s ease';

        loader.innerHTML = `
            <div style="background: #ffffff; width: 90%; max-width: 420px; border-radius: 20px; padding: 32px 28px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); border: 1px solid #e2e8f0;">
                <div style="width: 60px; height: 60px; margin: 0 auto 16px; background: #eef2ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px;">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 19px; font-weight: 700;">Preparing Your Resume PDF</h3>
                <p id="ats-loader-status-text" style="margin: 0 0 20px 0; color: #64748b; font-size: 13px;">Compiling layout and ATS vector elements...</p>
                
                <div style="background: #f1f5f9; height: 10px; border-radius: 999px; overflow: hidden; width: 100%; margin-bottom: 12px; position: relative;">
                    <div id="ats-loader-bar" style="background: linear-gradient(90deg, #4f46e5, #06b6d4); height: 100%; width: 5%; border-radius: 999px; transition: width 0.2s ease;"></div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #475569; font-weight: 600;">
                    <span>Formatting Assets</span>
                    <span id="ats-loader-percent" style="color: #4f46e5; font-size: 14px;">5%</span>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    }

    setTimeout(() => { loader.style.opacity = '1'; }, 10);

    let currentVal = 5;
    const bar = document.getElementById('ats-loader-bar');
    const label = document.getElementById('ats-loader-percent');
    const statusText = document.getElementById('ats-loader-status-text');

    clearInterval(progressTimer);
    progressTimer = setInterval(() => {
        if (currentVal < 88) {
            currentVal += Math.floor(Math.random() * 7) + 3;
            if (currentVal > 88) currentVal = 88;

            if (bar) bar.style.width = currentVal + '%';
            if (label) label.innerText = currentVal + '%';

            if (currentVal > 40 && currentVal < 70) {
                if (statusText) statusText.innerText = "Converting high-compatibility ATS text...";
            } else if (currentVal >= 70) {
                if (statusText) statusText.innerText = "Rendering final layout & styling...";
            }
        }
    }, 220);
}

function completeDownloadLoader() {
    clearInterval(progressTimer);
    const bar = document.getElementById('ats-loader-bar');
    const label = document.getElementById('ats-loader-percent');
    const statusText = document.getElementById('ats-loader-status-text');

    if (bar) bar.style.width = '100%';
    if (label) label.innerText = '100%';
    if (statusText) statusText.innerText = "Download completed successfully! 🎉";

    setTimeout(() => {
        const loader = document.getElementById('ats-pdf-loader-modal');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.remove(); }, 250);
        }
    }, 700);
}

function closeDownloadLoader() {
    clearInterval(progressTimer);
    const loader = document.getElementById('ats-pdf-loader-modal');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { loader.remove(); }, 250);
    }
}

// ==========================================
// 📥 MAIN DOWNLOAD FUNCTION
// ==========================================
// ==========================================
// 📥 MAIN DOWNLOAD FUNCTION (INSTANT LOADER)
// ==========================================
async function downloadPDF() {
    if (pdfLock) return;
    pdfLock = true;

    const btn = document.getElementById('downloadPdfBtn');
    const originalText = btn ? btn.innerHTML : '';
    const actualTemplateId = getCurrentTemplateId();

    // 🟢 1. INSTANT ZERO-DELAY LOADER (Click hote hi 0ms par screen par aayega)
    showDownloadLoader();

    try {
        // 2. Download Limit Check (Ab ye loader ke peeche background me chalega)
        const checkResponse = await fetch('/api/check-download-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template_name: actualTemplateId })
        });

        let checkResult = await checkResponse.json();
        if (!checkResult.success) {
            closeDownloadLoader(); // Agar limit over ho to loader band karo
            if (checkResult.error === 'LIMIT_REACHED') {
                alert("⚠️ Your Free Download Limit is Over! Please Upgrade.");
                window.location.href = '/pricing';
                return;
            } else {
                throw new Error(checkResult.message || "Permission denied");
            }
        }

        // 3. Silent Auto-Save (Non-blocking)
        saveResumeSilent();

        const renderArea = document.getElementById('template-render-area');
        if (!renderArea) throw new Error("Resume render area not found!");

        // Inputs ko visual text me convert karo
        const clone = renderArea.cloneNode(true);
        clone.querySelectorAll('input, textarea').forEach(input => {
            const span = document.createElement('span');
            span.innerText = input.value || '';
            input.parentNode.replaceChild(span, input);
        });
        clone.querySelectorAll('.no-print, button, .action-btn, .delete-btn').forEach(el => el.remove());

        // CSS gather karo
        let stylesHtml = '';
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            stylesHtml += `<link rel="stylesheet" href="${link.href}">\n`;
        });
        document.querySelectorAll('style').forEach(style => {
            stylesHtml += style.outerHTML + '\n';
        });

        const rawName = document.getElementById('fullName')?.value || 
                        document.querySelector('[data-field="fullName"]')?.innerText || 
                        'Resume';
        const cleanFileName = rawName.trim().replace(/\s+/g, '_');

        const fullHtmlDocument = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <base href="${window.location.origin}/">
    <title>${cleanFileName}</title>
    ${stylesHtml}
    <style>
        @page {
            size: A4 portrait;
            margin: 0 !important;
        }
        *, *::before, *::after {
            box-sizing: border-box !important;
        }
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        #template-render-area {
            width: 100% !important;
            min-height: 100vh !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
    </style>
</head>
<body>
    ${clone.outerHTML}
</body>
</html>`;

        // 4. Backend PDF Generation Call
        const response = await fetch('/api/export/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template_name: actualTemplateId,
                full_html: fullHtmlDocument,
                candidate_name: cleanFileName
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || "Failed to generate pure text PDF");
        }

        // 🟢 Loader 100% Done
        completeDownloadLoader();

        // 5. Instant File Download Trigger
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${cleanFileName}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);

        // 6. Background Cloudinary Backup (Peeche chalega bina user ko roke)
        setTimeout(() => {
            uploadPdfCopyToServer(blob, `${rawName} Resume`, actualTemplateId);
        }, 150);

        // 7. Review Modal
        setTimeout(() => {
            openReviewModal();
        }, 1400);

    } catch (err) {
        closeDownloadLoader();
        console.error("PDF Download Error:", err);
        alert("Download failed: " + err.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        setTimeout(() => { pdfLock = false; }, 1200);
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
                resolve(true);
            } catch (err) {
                resolve(null);
            }
        };
    });
}

// Word Export aur Modal Functions
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
            const span = document.createElement('span');
            span.innerText = input.value || '';
            input.parentNode.replaceChild(span, input);
        });
        clone.querySelectorAll('button, .fas, .fa-trash').forEach(el => el.remove());

        let cssRules = `body { font-family: Arial, sans-serif; color: #000; }`;
        const templateLink = document.getElementById('template-css');
        if (templateLink && templateLink.href) {
            try {
                const response = await fetch(templateLink.href);
                if (response.ok) cssRules += await response.text();
            } catch (e) {}
        }

        const htmlContent = `<!DOCTYPE html><html><head><meta charset='utf-8'><style>${cssRules}</style></head><body>${clone.innerHTML}</body></html>`;
        if (typeof htmlDocx === 'undefined') throw new Error("html-docx library missing!");

        const converted = htmlDocx.asBlob(htmlContent, {
            orientation: 'portrait',
            margins: { top: 720, bottom: 720, left: 720, right: 720 }
        });

        const fileName = (document.getElementById('fullName')?.value || 'Resume').replace(/\s+/g, '_');
        saveAs(converted, `${fileName}.docx`);

        setTimeout(() => { openReviewModal(); }, 1500);
    } catch(err) {
        alert("Word export failed: " + err.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        setTimeout(() => { pdfLock = false; }, 1500);
    }
}

function openReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

window.handlePdfClick = handlePdfClick;
window.downloadPDF = downloadPDF;
window.downloadWord = downloadWord;
window.getCurrentTemplateId = getCurrentTemplateId;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;