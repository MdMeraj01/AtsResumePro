/* ================= PDF DOWNLOAD FIX (SINGLE CLICK) ================= */

let pdfLock = false;
let isPdfGenerating = false;

/* 🔘 BUTTON CLICK HANDLER */
function handlePdfClick(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // 🔒 Extra safety (mobile double tap)
    if (pdfLock) return;
    pdfLock = true;

    const btn = document.getElementById('downloadPdfBtn');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';
    }

    downloadPDF();

    // 🔓 fallback unlock (agar kisi reason se finally miss ho jaye)
    setTimeout(() => {
        pdfLock = false;
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }
    }, 4000);
}


// 👇 1. Is helper function ko downloadPDF ke upar kahin bhi paste kar do
function getActiveTemplateName() {
    // OPTION A: Agar tumhare paas Template Dropdown/Select hai
    const dropdown = document.getElementById('templateSelector'); // ID check karna apne HTML me
    if (dropdown && dropdown.value) return dropdown.options[dropdown.selectedIndex].text;

    // OPTION B: Agar Active Class use hoti hai (Example logic)
    // Check karo ki preview area par koi khaas class lagi hai kya
    const preview = document.getElementById('template-render-area');
    if (preview) {
        if (preview.classList.contains('modern-template')) return 'Modern Professional';
        if (preview.classList.contains('creative-template')) return 'Creative Designer';
        if (preview.classList.contains('simple-template')) return 'Minimalist';
    }

    // OPTION C: Fallback (Agar kuch na mile)
    // HTML body par data attribute check karo (Jo humne pehle baat ki thi)
    return document.body.getAttribute('data-template') || 'Unknown Template';
}

async function downloadPDF() {
    if (pdfLock) return;
    pdfLock = true;

    const btn = document.getElementById('downloadPdfBtn');
    const originalText = btn ? btn.innerHTML : '';
    
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking Limit...';
        btn.disabled = true;
    }

    try {
        // 🛑 STEP 1: Ask Server for Permission (Limit Check)
        const checkResponse = await fetch('/api/check-download-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const checkResult = await checkResponse.json();

        // Agar Limit Khatam hai, to RUK JAO
        if (!checkResult.success) {
            if (checkResult.error === 'LIMIT_REACHED') {
                alert("⚠️ Your Free Download Limit is Over! Please Upgrade.");
                window.location.href = '/pricing'; // Pricing page par bhej do
                return; // Code yahi khatam
            } else {
                throw new Error(checkResult.message || "Permission denied");
            }
        }

        // ✅ STEP 2: Agar Server ne "Haan" bola, to PDF banao
        if (btn) btn.innerHTML = '<i class="fas fa-cog fa-spin"></i> Generating PDF...';

        // ... Purana Save Logic ...
        await saveResumeSilent();

        const element = document.getElementById('template-render-area');
        if (!element) throw new Error('Preview not found');

        element.classList.add('pdf-mode');
        await new Promise(r => setTimeout(r, 500)); // Render wait

        // ... HTML2Canvas & jsPDF Logic ...
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
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

        // Tracking (Optional: Server ne already minus kar diya hai, bas log ke liye)
        const templateName = window.currentTemplate || 'modern';
        await fetch('/api/track-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activity_type: 'downloaded_pdf', details: templateName })
        });

    } catch (err) {
        console.error(err);
        alert("Download failed: " + err.message);
    } finally {
        // Cleanup
        const element = document.getElementById('template-render-area');
        if(element) element.classList.remove("pdf-mode");
        
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        setTimeout(() => { pdfLock = false; }, 2000);
    }
}

async function saveResumeSilent() {
    try {
        if (typeof collectFormData !== 'function') return;
        
        const resumeData = collectFormData();
        
        // 👇 FIX: Dropdown se sahi Template Name uthao
        const templateDropdown = document.getElementById('templateSelector');
        const selectedTemplate = templateDropdown ? templateDropdown.value : 'modern';

        const payload = {
            data: resumeData,
            template_name: selectedTemplate, // 👈 Ab ye sahi naam bhejega (Classic, Creative etc.)
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
            console.log("Auto-saved (Silent) as:", selectedTemplate);
        }
    } catch(e) { console.error("Auto-save failed", e); }
}

/* 🌍 GLOBAL */
window.handlePdfClick = handlePdfClick;
window.downloadPDF = downloadPDF;



// static/js/pdf.js - WORD EXPORT WITH TEMPLATE SUPPORT

async function exportResumeDOCX() {
    const element = document.getElementById('template-render-area');
    if (!element) {
        alert('Resume preview not found!');
        return;
    }

    const btn = document.getElementById('downloadWordBtn');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
        btn.disabled = true;
    }
     
    const checkResponse = await fetch('/api/check-download-limit', { method: 'POST' });
    const checkResult = await checkResponse.json();

    if (!checkResult.success) {
        alert("⚠️ Limit Reached! Please Upgrade.");
        window.location.href = '/pricing';
        return;
    }
    
    try {
        // 1. CLONE CONTENT
        const clone = element.cloneNode(true);
        
        // Remove PDF/Mobile specific classes
        clone.classList.remove('pdf-mode');
        clone.style.margin = '0';
        clone.style.transform = 'none';

        // 2. INPUTS TO TEXT (Word me input box ganda lagta hai)
        const inputs = clone.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            const val = input.value || input.getAttribute('placeholder') || '';
            const span = document.createElement('span');
            span.innerText = val;
            span.style.fontWeight = window.getComputedStyle(input).fontWeight;
            input.parentNode.replaceChild(span, input);
        });

        // 3. REMOVE ICONS & BUTTONS
        clone.querySelectorAll('button, .fas, .fa-trash, .drag-handle').forEach(el => el.remove());

        // 4. LAYOUT FIX FOR MODERN TEMPLATES (FLEX -> TABLE)
        // Word Flexbox nahi samajhta, isliye hum Sidebar wale layout ko Table banayenge
        const sidebar = clone.querySelector('.template-left') || clone.querySelector('.sidebar');
        const mainContent = clone.querySelector('.template-right') || clone.querySelector('.main-content');

        if (sidebar && mainContent) {
            // Create a Table Structure
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            
            const tr = document.createElement('tr');
            
            // Left Cell (Sidebar)
            const tdLeft = document.createElement('td');
            tdLeft.style.width = '30%';
            tdLeft.style.verticalAlign = 'top';
            tdLeft.style.backgroundColor = '#f4f4f4'; // Light bg for sidebar
            tdLeft.style.padding = '15px';
            tdLeft.innerHTML = sidebar.innerHTML;
            
            // Right Cell (Main)
            const tdRight = document.createElement('td');
            tdRight.style.width = '70%';
            tdRight.style.verticalAlign = 'top';
            tdRight.style.padding = '20px';
            tdRight.innerHTML = mainContent.innerHTML;

            tr.appendChild(tdLeft);
            tr.appendChild(tdRight);
            table.appendChild(tr);

            // Replace clone content with new table
            clone.innerHTML = '';
            clone.appendChild(table);
        }

        // 5. FETCH ACTIVE CSS (Colors & Fonts ke liye)
        let cssRules = `
            body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; }
            h1 { font-size: 24px; color: #2c3e50; margin-bottom: 10px; }
            h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; }
            p, li { font-size: 12px; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; }
        `;

        // Koshish karo active template ka CSS fetch karne ki
        try {
            const templateLink = document.getElementById('template-css');
            if (templateLink && templateLink.href) {
                const response = await fetch(templateLink.href);
                if (response.ok) {
                    const extraCss = await response.text();
                    cssRules += extraCss;
                }
            }
        } catch (e) {
            console.warn("Could not fetch external CSS for Word, using default.");
        }

        // 6. GENERATE HTML FOR WORD
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>${cssRules}</style>
            </head>
            <body>
                ${clone.innerHTML}
            </body>
            </html>
        `;

        // 7. CONVERT TO BLOB
        // Ensure html-docx.js loaded
        if (typeof htmlDocx === 'undefined') {
            throw new Error("html-docx library missing. Add script tag in builder.html");
        }

        const converted = htmlDocx.asBlob(htmlContent, {
            orientation: 'portrait',
            margins: { top: 720, bottom: 720, left: 720, right: 720 } // Twips (1440 = 1 inch)
        });

        // 8. DOWNLOAD
        const fileName = (document.getElementById('fullName')?.value || 'Resume').replace(/\s+/g, '_');
        saveAs(converted, `${fileName}_Resume.docx`);

        if (typeof showToast === 'function') showToast('Word Document Downloaded!', 'success');

    } catch (err) {
        console.error("Word Export Error:", err);
        alert("Word download failed: " + err.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

// Global Export
window.exportResumeDOCX = exportResumeDOCX;

window.downloadPDF = downloadPDF;


/* 📝 WORD DOWNLOAD FUNCTION (Advanced) */
async function downloadWord() {
    if (pdfLock) return;
    pdfLock = true;

    const btn = document.getElementById('downloadWordBtn');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Word...';
        btn.disabled = true;
    }

    try {
        // 1. Save First
        await saveResumeSilent();

        const element = document.getElementById('template-render-area');
        if (!element) throw new Error("Resume preview not found!");

        // 2. Clone & Clean for Word
        const clone = element.cloneNode(true);
        clone.classList.remove('pdf-mode');
        
        // Inputs to Text (Word me input box ganda lagta hai)
        clone.querySelectorAll('input, textarea, select').forEach(input => {
            const val = input.value || '';
            const span = document.createElement('span');
            span.innerText = val;
            input.parentNode.replaceChild(span, input);
        });

        // Remove Buttons/Icons
        clone.querySelectorAll('button, .fas, .fa-trash').forEach(el => el.remove());

        // 3. Fetch Styles
        let cssRules = `body { font-family: Arial, sans-serif; color: #000; }`;
        try {
            const templateLink = document.getElementById('template-css'); // Ensure your template CSS link has this ID
            if (templateLink && templateLink.href) {
                const response = await fetch(templateLink.href);
                if (response.ok) cssRules += await response.text();
            }
        } catch (e) { console.warn("Using default CSS for Word"); }

        // 4. Create HTML Structure
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head><meta charset='utf-8'><style>${cssRules}</style></head>
            <body>${clone.innerHTML}</body>
            </html>
        `;

        // 5. Convert & Save
        if (typeof htmlDocx === 'undefined') throw new Error("html-docx library missing!");
        
        const converted = htmlDocx.asBlob(htmlContent, {
            orientation: 'portrait',
            margins: { top: 720, bottom: 720, left: 720, right: 720 }
        });

        const fileName = (document.getElementById('fullName')?.value || 'Resume').replace(/\s+/g, '_');
        saveAs(converted, `${fileName}.docx`);

        // 6. ✅ TRACKING API CALL (Only Once)
        const templateName = window.currentTemplate || 'modern';
        await fetch('/api/track-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activity_type: 'downloaded_docx', details: templateName })
        });
        console.log("Word Download Tracked");

    } catch(err) {
        console.error(err);
        alert("Word export failed: " + err.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        setTimeout(() => { pdfLock = false; }, 2000);
    }
}

// Global Exports
 
window.downloadWord = downloadWord;