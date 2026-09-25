// static/js/builder_import.js
// SaaS PDF Resume Import Engine (Global Scope Protected)

let selectedResumeFile = null;
let parsedResumeResult = null;

// 🟢 PERMANENT DISMISS FUNCTION
function dismissChoiceModalPermanently() {
    const modal = document.getElementById('startChoiceModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    localStorage.setItem('has_seen_start_choice', 'true');
    sessionStorage.setItem('has_seen_start_choice', 'true');
}

// 🟢 OPEN IMPORT FLOW
function openImportFlow() {
    dismissChoiceModalPermanently();
    const modal = document.getElementById('importAuditModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    resetImportViews();
}

// 🟢 CLOSE IMPORT AUDIT MODAL
function closeImportAuditModal() {
    const modal = document.getElementById('importAuditModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    resetImportViews();
}

// 🟢 RESET VIEWS STATE
function resetImportViews() {
    selectedResumeFile = null;
    parsedResumeResult = null;

    document.getElementById('importDropzoneView')?.classList.remove('hidden');
    document.getElementById('importLoaderView')?.classList.add('hidden');
    document.getElementById('importSuccessView')?.classList.add('hidden');
    document.getElementById('importErrorView')?.classList.add('hidden');
    document.getElementById('importReportView')?.classList.add('hidden');

    document.getElementById('resumeDropArea')?.classList.remove('hidden');
    document.getElementById('selectedPdfCard')?.classList.add('hidden');

    const fileInput = document.getElementById('resumeImportFileInput');
    if (fileInput) fileInput.value = '';

    const btn = document.getElementById('startScanBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-bolt"></i><span>Analyze & Scan Resume</span>';
    }

    const modalPanel = document.querySelector('.import-modal-panel');
    if (modalPanel) modalPanel.classList.remove('import-shake');
}

// 🟢 PDF FILE SELECT HANDLER
function handlePdfFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (file) setPdfFile(file);
}

function setPdfFile(file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        showImportError('Only PDF documents are supported. Please select a valid PDF file.');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showImportError('File size exceeds 10MB limit. Please upload a smaller PDF.');
        return;
    }

    selectedResumeFile = file;

    document.getElementById('resumeDropArea')?.classList.add('hidden');
    const card = document.getElementById('selectedPdfCard');
    if (card) {
        card.classList.remove('hidden');
        document.getElementById('cardPdfName').textContent = file.name;
        document.getElementById('cardPdfSize').textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    }

    const scanBtn = document.getElementById('startScanBtn');
    if (scanBtn) scanBtn.disabled = false;
}

function removeSelectedPdf(e) {
    if (e) e.stopPropagation();
    selectedResumeFile = null;

    const fileInput = document.getElementById('resumeImportFileInput');
    if (fileInput) fileInput.value = '';

    document.getElementById('selectedPdfCard')?.classList.add('hidden');
    document.getElementById('resumeDropArea')?.classList.remove('hidden');

    const scanBtn = document.getElementById('startScanBtn');
    if (scanBtn) scanBtn.disabled = true;
}

// Drag & Drop
document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('resumeDropArea');
    if (dropArea) {
        ['dragenter', 'dragover'].forEach(name => {
            dropArea.addEventListener(name, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropArea.classList.add('drag-active');
            }, false);
        });

        ['dragleave', 'drop'].forEach(name => {
            dropArea.addEventListener(name, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropArea.classList.remove('drag-active');
            }, false);
        });

        dropArea.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) setPdfFile(file);
        });
    }

    // Auto-Open Choice Modal only if not dismissed
    const urlParams = new URLSearchParams(window.location.search);
    const hasSeenChoice = localStorage.getItem('has_seen_start_choice') || sessionStorage.getItem('has_seen_start_choice');
    const choiceModal = document.getElementById('startChoiceModal');

    if (choiceModal) {
        if (!hasSeenChoice && !urlParams.get('id') && !urlParams.get('template')) {
            choiceModal.classList.remove('hidden');
        } else {
            choiceModal.classList.add('hidden');
            choiceModal.style.display = 'none';
        }
    }
});

// 🟢 UPLOAD & SCAN
async function uploadAndScanResume() {
    if (!selectedResumeFile) return;

    const scanBtn = document.getElementById('startScanBtn');
    if (scanBtn) {
        scanBtn.disabled = true;
        scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Analyzing Resume...</span>';
    }

    document.getElementById('importDropzoneView')?.classList.add('hidden');
    document.getElementById('importLoaderView')?.classList.remove('hidden');

    const percentBadge = document.getElementById('loaderPercentBadge');
    const progressBar = document.getElementById('importScanProgressBar');
    const heading = document.getElementById('loaderStatusHeading');

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
        if (currentProgress < 90) {
            currentProgress += Math.floor(Math.random() * 6) + 4;
            if (currentProgress > 90) currentProgress = 90;
            if (percentBadge) percentBadge.textContent = `${currentProgress}%`;
            if (progressBar) progressBar.style.width = `${currentProgress}%`;

            if (currentProgress > 30 && currentProgress <= 65) {
                if (heading) heading.textContent = "Extracting career timelines & skills...";
            } else if (currentProgress > 65) {
                if (heading) heading.textContent = "Checking ATS layout & formatting...";
            }
        }
    }, 220);

    const formData = new FormData();
    formData.append('resume_file', selectedResumeFile);

    try {
        const response = await fetch('/api/import-and-audit-resume', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        clearInterval(progressInterval);

        if (response.ok && result.success && result.data) {
            if (percentBadge) percentBadge.textContent = '100%';
            if (progressBar) progressBar.style.width = '100%';

            parsedResumeResult = result.data;

            setTimeout(() => {
                showSuccessState();
            }, 350);
        } else {
            showImportError(result.message || 'Unable to extract content from this PDF.');
        }
    } catch (err) {
        clearInterval(progressInterval);
        console.error('Import error:', err);
        showImportError('Network error while analyzing PDF. Please check connection.');
    }
}

function showSuccessState() {
    document.getElementById('importLoaderView')?.classList.add('hidden');
    document.getElementById('importSuccessView')?.classList.remove('hidden');
}

function continueToBuilderSuccess() {
    if (parsedResumeResult && parsedResumeResult.mistakes && parsedResumeResult.mistakes.length > 0) {
        document.getElementById('importSuccessView')?.classList.add('hidden');
        showAuditReport(parsedResumeResult);
    } else {
        applyParsedData('improved');
    }
}

function showImportError(message) {
    document.getElementById('importDropzoneView')?.classList.add('hidden');
    document.getElementById('importLoaderView')?.classList.add('hidden');
    document.getElementById('importSuccessView')?.classList.add('hidden');
    
    const errView = document.getElementById('importErrorView');
    if (errView) errView.classList.remove('hidden');

    const errText = document.getElementById('importErrorMessageText');
    if (errText && message) errText.textContent = message;

    const modalPanel = document.querySelector('.import-modal-panel');
    if (modalPanel) {
        modalPanel.classList.remove('import-shake');
        void modalPanel.offsetWidth;
        modalPanel.classList.add('import-shake');
    }
}

function showAuditReport(auditData) {
    document.getElementById('importReportView')?.classList.remove('hidden');

    const score = parseInt(auditData.ats_score) || 45;
    const scoreDisplay = document.getElementById('reportScoreDisplay');
    const scoreBadge = document.getElementById('reportScoreBadge');
    const verdictBadge = document.getElementById('reportFriendlyBadge');
    const verdictDot = document.getElementById('reportVerdictDot');
    const gradeText = document.getElementById('reportGradeText');
    const gaugeContainer = document.getElementById('reportGaugeContainer');
    const headerBadge = document.getElementById('reportHeaderBadge');
    
    if (scoreDisplay) scoreDisplay.textContent = score;
    if (scoreBadge) scoreBadge.textContent = `${score}%`;

    if (gaugeContainer) {
        gaugeContainer.className = "report-radial-pill flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-0 px-5 sm:px-0 py-3 sm:py-0 w-full sm:w-28 sm:h-28 rounded-2xl border shadow-inner text-center shrink-0 ";
        
        if (score >= 75) {
            gaugeContainer.classList.add('score-theme-green');
            if (gradeText) gradeText.textContent = 'Grade A (Top)';
            if (verdictBadge) {
                verdictBadge.textContent = 'High Recruiter Match Rate';
                verdictBadge.className = 'text-xs sm:text-sm font-bold text-emerald-400';
            }
            if (verdictDot) verdictDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping';
            if (headerBadge) headerBadge.className = 'inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold mb-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
        } else if (score >= 55) {
            gaugeContainer.classList.add('score-theme-amber');
            if (gradeText) gradeText.textContent = 'Grade C (Average)';
            if (verdictBadge) {
                verdictBadge.textContent = 'Needs Keyword Optimization';
                verdictBadge.className = 'text-xs sm:text-sm font-bold text-amber-400';
            }
            if (verdictDot) verdictDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping';
            if (headerBadge) headerBadge.className = 'inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold mb-2 bg-amber-500/10 border border-amber-500/20 text-amber-400';
        } else {
            gaugeContainer.classList.add('score-theme-red');
            if (gradeText) gradeText.textContent = 'Grade F (Critical)';
            if (verdictBadge) {
                verdictBadge.textContent = 'High ATS Rejection Risk';
                verdictBadge.className = 'text-xs sm:text-sm font-bold text-rose-400';
            }
            if (verdictDot) verdictDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping';
            if (headerBadge) headerBadge.className = 'inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold mb-2 bg-rose-500/10 border border-rose-500/20 text-rose-400';
        }
    }

    const mistakes = auditData.mistakes || [];
    const countEl = document.getElementById('reportIssueCount');
    if (countEl) countEl.textContent = `${mistakes.length} detected`;

    const mistakesList = document.getElementById('reportMistakesList');
    if (mistakesList) {
        mistakesList.innerHTML = mistakes.map(m => {
            let categoryTag = "FORMATTING GAP";
            let tagColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
            let icon = "fa-circle-exclamation text-amber-400";

            const textLower = m.toLowerCase();
            if (textLower.includes('date') || textLower.includes('future') || textLower.includes('year')) {
                categoryTag = "TIMELINE ERROR";
                tagColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                icon = "fa-calendar-xmark text-rose-400";
            } else if (textLower.includes('typo') || textLower.includes('spelling') || textLower.includes('grammar')) {
                categoryTag = "TYPO DETECTED";
                tagColor = "text-orange-400 bg-orange-500/10 border-orange-500/20";
                icon = "fa-spell-check text-orange-400";
            } else if (textLower.includes('education') || textLower.includes('placeholder')) {
                categoryTag = "CONTENT QUALITY";
                tagColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                icon = "fa-file-lines text-blue-400";
            }

            return `
                <div class="report-issue-card p-3.5 rounded-xl flex items-start gap-3">
                    <div class="mt-0.5 shrink-0">
                        <i class="fas ${icon} text-sm"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${tagColor}">
                                ${categoryTag}
                            </span>
                        </div>
                        <p class="text-xs leading-relaxed">
                            ${m}
                        </p>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function applyParsedData(mode) {
    if (!parsedResumeResult) return;

    const payload = mode === 'improved' 
        ? (parsedResumeResult.improved_data || parsedResumeResult.raw_data)
        : parsedResumeResult.raw_data;

    if (typeof importResumeData === 'function') {
        importResumeData(payload);
    }

    setTimeout(() => {
        if (typeof updatePreview === 'function') updatePreview();
        if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
    }, 150);

    closeImportAuditModal();

    if (typeof showToast === 'function') {
        showToast(mode === 'improved' ? '✨ Resume imported & enhanced with AI!' : '📁 PDF resume imported into builder.');
    }
}

// 🟢 GLOBAL WINDOW BINDINGS (Inline Handlers ke liye zaroori)
window.dismissChoiceModalPermanently = dismissChoiceModalPermanently;
window.closeStartChoiceModal = dismissChoiceModalPermanently;
window.openImportFlow = openImportFlow;
window.closeImportAuditModal = closeImportAuditModal;
window.resetImportViews = resetImportViews;
window.handlePdfFileSelect = handlePdfFileSelect;
window.removeSelectedPdf = removeSelectedPdf;
window.uploadAndScanResume = uploadAndScanResume;
window.continueToBuilderSuccess = continueToBuilderSuccess;
window.applyParsedData = applyParsedData;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('importAuditModal');
        if (modal && !modal.classList.contains('hidden')) {
            closeImportAuditModal();
        }
    }
});