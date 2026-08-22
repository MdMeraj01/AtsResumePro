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
    const actualTemplateId = getCurrentTemplateId(); // 👈 Exact template ID
    
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking Limit...';
        btn.disabled = true;
    }

    try {
        // 🛑 STEP 1: Limit Check & Auto-Deduct
        const checkResponse = await fetch('/api/check-download-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const checkResult = await checkResponse.json();

        if (!checkResult.success) {
            if (checkResult.error === 'LIMIT_REACHED') {
                alert("⚠️ Your Free Download Limit is Over! Please Upgrade.");
                window.location.href = '/pricing';
                return;
            } else {
                throw new Error(checkResult.message || "Permission denied");
            }
        }

        // ✅ STEP 2: Generate PDF
        if (btn) btn.innerHTML = '<i class="fas fa-cog fa-spin"></i> Generating PDF...';

        await saveResumeSilent();

        const element = document.getElementById('template-render-area');
        if (!element) throw new Error('Preview not found');

        element.classList.add('pdf-mode');
        await new Promise(r => setTimeout(r, 400));

        const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true,
            logging: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 1200,
            windowHeight: element.scrollHeight
        });
        
        const imgData = canvas.toDataURL("image/jpeg", 0.9);
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

        const fileName = (document.getElementById('fullName')?.value || 'Resume').replace(/\s+/g, '_');
        pdf.save(`${fileName}.pdf`);

        // 🟢 STEP 3: Log Activity with EXACT TEMPLATE ID
        await fetch('/api/track-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                activity_type: 'downloaded_pdf', 
                details: actualTemplateId // 👈 Emerald, Executive, etc.
            })
        });

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
        setTimeout(() => { pdfLock = false; }, 1500);
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

// Global Exports
window.handlePdfClick = handlePdfClick;
window.downloadPDF = downloadPDF;
window.downloadWord = downloadWord;
window.getCurrentTemplateId = getCurrentTemplateId;